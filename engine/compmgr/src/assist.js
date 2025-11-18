/**
 * Copyright (c) 2025   Loh Wah Kiang
 *
 * openGauss is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *
 *          http://license.coscl.org.cn/MulanPSL2
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 * -------------------------------------------------------------------------
 */
"use strict";

/**
 * The asistant of src_index module which is handle relavent web design.
 * @module src_assist
 */

module.exports = async (...args) => {
  const beautify = require("js-beautify/js");
  const { minify } = require("html-minifier-terser");
  const less = require("less");
  const { htmlTags, mimes } = require("./data/htmldata.json");

  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { datatype, errhandler, io } = library.utils;
  const { dir_module } = io;
  const { fs, logerr: logerror, path } = sys;
  const { existsSync, readFileSync } = fs;
  const { basename, extname, join } = path;

  const basic = /\s?<!doctype html>|(<html\b[^>]*>|<body\b[^>]*>|<x-[^>]+>)+/i;
  const full = new RegExp(
    htmlTags.map((tag) => `<${tag}\\b[^>]*>`).join("|"),
    "i"
  );

  let lib = {};
  try {
    let objmodule = {};

    const getContentType = (path) => {
      return mimes[path.split(".").pop()];
    };

    const getExistFile = async (...args) => {
      let [[name, route, fpath], optional] = args;
      let bname, extension, fname, filePath, mimes, cssContent, options;
      let output = [],
        cmd = "body";

      route = route.slice(0, -1);
      bname = basename(name);
      extension = extname(name);
      fname = name.substring(name.lastIndexOf(route)).replace(route, "");
      filePath = join(fpath, fname);
      mimes = getContentType(filePath);
      cssContent = Buffer.from("");

      if (!mimes) mimes = "text/plain";
      if (fs.existsSync(filePath)) {
        if (mimes.indexOf("text") > -1) {
          cssContent = readFileSync(filePath).toString();
          if (extension == ".less") {
            let lessContent = await less.render(cssContent, {
              filename: filePath,
              modifyVars: JSON.parse(optional.content),
              // sourceMap: { sourceMapFileInline: true },
              // compress: true, // 生产环境压缩
              paths: [fpath], // 包含路径配置
              rewriteUrls: "all", // URL重写选项
            });
            cssContent = lessContent.css;
            cmd = "text";
          }
          if (library.mode == "Production")
            cssContent = await minify(cssContent, {
              collapseWhitespace: true,
            });

          options = {
            headers: {
              "Content-Type": mimes,
              "Content-Length": Buffer.byteLength(cssContent).toString(),
            },
          };
          if (cmd == "text")
            options = {
              headers: {
                "Content-Type": "text/css; charset=utf-8",
                "Cache-Control": "no-cache", // 开发时禁用缓存
              },
            };

          output.push(Buffer.from(cssContent));
          output.push(options);
          output.push(cmd);
        } else {
          cssContent = readFileSync(filePath);
          output.push(cssContent);
          output.push(
            (options = {
              headers: {
                "Content-Type": mimes,
                // "Cross-Origin-Resource-Policy": "cross-origin",
              },
            })
          );
          output.push(cmd);
        }
      }
      return output;
    };

    const registration = (...args) => {
      const [params, obj] = args;
      const [route, fpath, optional] = params;
      const { serveStatic, register } = obj;
      register(
        route,
        serveStatic({
          root: fpath,
          getContent: async (fname, c) => {
            let [content, options, cmd] = await getExistFile(
              [fname, route, fpath],
              optional
            );
            return c[cmd](content, options);
          },
        })
      );
    };

    const regutils = (...args) => {
      const [params, obj] = args;
      const [route] = params;
      const { serveStatic, register } = obj;
      register(
        route,
        serveStatic({
          getContent: async (fname, c) => {
            let pattern = route.slice(0, -1);
            let filePath = `${fname.replace(pattern, "")}`;
            let name = path.parse(filePath).name;
            let mimes = getContentType(filePath);
            let cssContent = Buffer.from("");
            let options = {};

            if (!mimes) mimes = "text/plain";
            if (library.mode != "Production")
              cssContent = Buffer.from(beautify(objmodule[name]));
            else
              cssContent = Buffer.from(
                await minify(objmodule[name], {
                  collapseWhitespace: true,
                })
              );

            options = {
              headers: {
                "Content-Type": mimes,
                "Content-Length": Buffer.byteLength(cssContent).toString(),
                "Cache-Control": "no-cache",
              },
            };
            return c.body(cssContent, options);
          },
        })
      );
    };

    /**
     * Loading atomic public share modules for frontend use
     * @alias module:webserver.load_atomic
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - share is an object
     * @param {Array} args[1] - excludefile content a list of data for ignore purpose
     * @param {Object} args[2] - obj is an object of module which content app module
     * @returns {Object} - Return null | error object
     */
    const atomic = (...args) => {
      const [params, obj] = args;
      const [share, excludefile] = params;

      let atomic = dir_module(share, excludefile);
      for (let atomic_items of atomic) {
        let units = dir_module(join(share, atomic_items), excludefile);
        for (let unit of units) {
          let fpath = join(share, atomic_items, unit, "src", "browser");
          let route = `/atomic/${atomic_items}/${unit}/*`;
          if (existsSync(fpath)) {
            registration([route, fpath], obj);
          }
        }
      }
    };

    /**
     * Allocate public static files share
     * @alias module:webserver.load_pubshare
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - share is an object
     * @param {String} args[1] - enginetype is value which content the engine type
     * @param {Object} args[2] - obj is an object of module which content reaction and app modules
     * @returns {Object} - Return null | error object
     */
    const assets = (...args) => {
      const [params, obj] = args;
      const [share, enginetype] = params;

      for (let [pubkey, pubval] of Object.entries(share)) {
        if (pubkey.indexOf(`${enginetype}_`) > -1) {
          for (let [key, val] of Object.entries(pubval)) {
            let route = `${key}/*`;
            let fpath = val.filepath;
            if (datatype(val) == "object") {
              registration([route, fpath, val], obj);
            } else {
              fpath = val;
              registration([route, fpath], obj);
            }
          }
        }
      }
    };

    const esm2strMaker = (...args) => {
      const [params, obj] = args;
      let output;
      try {
        let buff = [],
          df = {};
        const maker = (...args) => {
          const [name, obj] = args;
          return `const ${name} = ${obj}`;
        };
        const decode_descriptor = (...args) => {
          const [name, obj, callback] = args;
          let { ownfunc, ownproperty } = callback;
          const { get, set, value } = obj;
          if (get) ownproperty.push(`${get}`);
          if (set) ownproperty.push(`${set}`);
          if (value) {
            if (typeof value == "function")
              ownfunc.push(`const ${name} = ${value}`);
            else ownfunc.push(`const ${name} = ${JSON.stringify(value)}`);
          }
          return;
        };
        const export_proc = (...args) => {
          const [params, obj] = args;
          const [cond, name] = params;
          let output = "";
          if (cond == "default")
            output = `export default ()=>{try{${Object.values(obj).join(
              "\n"
            )}; return {${Object.keys(obj).join(
              ","
            )}};} catch (error) {return error;}}`;
          else if (cond == "descriptor") {
            let { ownfunc = [], ownproperty = [] } = obj.descriptor;
            let func = "",
              funckey = "",
              properties = "";
            if (ownfunc.length > 0) {
              let { descriptor, ...otherobj } = obj;
              func = Object.values(otherobj).join("\n");
              funckey = Object.keys(otherobj).join(",");
            }
            if (ownproperty.length > 0) {
              funckey = ownproperty.join(",") + "," + funckey;
            }
            output = `export const ${name}=()=>{try{${func}; return {${funckey}};} catch (error) {return error;}}`;
          } else if (cond == "export") {
            delete obj.descriptor;
            output = `export const ${name}=()=>{try{${Object.values(obj).join(
              "\n"
            )}; return {${Object.keys(obj).join(
              ","
            )}};} catch (error) {return error;}}`;
          }
          return output;
        };

        const investigation = (...args) => {
          const [obj] = args;
          let buff = { descriptor: { ownfunc: [], ownproperty: [] } };
          for (let [key, val] of Object.entries(obj)) {
            let dtype = typeof val;
            if (dtype == "object") {
              let descriptor = Object.getOwnPropertyDescriptor(obj, key);
              if (!descriptor) {
                buff[key] = JSON.stringify(val, null, 2);
              } else {
                decode_descriptor(key, descriptor, buff.descriptor);
              }
            } else if (dtype == "function") {
              buff[key] = maker(key, val);
            }
          }
          if (buff.descriptor.ownfunc.length == 0)
            delete buff.descriptor.ownfunc;
          if (buff.descriptor.ownproperty.length == 0)
            delete buff.descriptor.ownproperty;
          return buff;
        };

        let { excluded } = obj;
        for (let [key, val] of Object.entries(obj)) {
          if (!excluded.includes(key)) {
            let dtype = typeof val;
            if (dtype == "object") {
              let data = investigation(val);
              if (data) {
                let keyname = "export";
                if (Object.keys(data.descriptor).length > 0)
                  keyname = "descriptor";
                buff.push(export_proc([keyname, key], data));
              }
            } else if (dtype == "function") {
              df[key] = maker(key, val);
            }
          }
        }

        if (Object.keys(df).length > 0) {
          buff.push(export_proc(["default"], df));
        }
        output = buff.join("\n");
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const utilities = async (...args) => {
      const [params, obj] = args;
      const [name] = params;
      let { library: share, ...otherobj } = obj;
      objmodule[name] = esm2strMaker(name, share[name]);

      regutils(["/library/*"], obj);
    };

    /**
     * Replace specific character from text base on object key name
     * Keyword <-{name}>
     * @alias module:utils_html.str_inject
     * @param {...Object} args - 2 parameters
     * @param {String} args[0] - text is a statement in string value
     * @param {Object} args[1] - params a sets of values for change
     * @returns {String} - Return unchange or changed text
     */
    const str_inject = (...args) => {
      let [text, params] = args;
      let output = text;
      for (let [key, val] of Object.entries(params)) {
        let pattern = [`<-{${key}}>`, `{{${key}}}`];
        for (let name of pattern) {
          while (output.indexOf(name) > -1) {
            let idx = output.indexOf(name);
            output =
              output.substring(0, idx) +
              val +
              output.substring(idx + name.length);
          }
        }
      }
      return output;
    };

    /**
     * The main objective is indentify the string in html tag format
     * https://github.com/sindresorhus/is-html
     * @alias module:utils_html.identify_htmltag
     * @param {...Object} args - 1 parameters
     * @param {String} args[0] - params is a string for checking valid in html tag format
     * @returns {Object} - Return valid stting | null
     */
    const identify_htmltag = (...args) => {
      const [params] = args;
      let output = params;
      try {
        let html = params.trim().slice(0, 1000);
        let result = basic.test(html) || full.test(html);
        if (!result) output = null;
      } catch (error) {
        output = null;
      } finally {
        return output;
      }
    };

    // code from AI propose
    const completeRelativeUrl = (
      relativePath,
      domain = "localhost",
      protocol = "http"
    ) => {
      try {
        // If it's already complete, return it
        return new URL(relativePath).toString();
      } catch {
        // Complete it with default domain
        return new URL(relativePath, `${protocol}://${domain}`).toString();
      }
    };

    lib = {
      assets,
      atomic,
      completeRelativeUrl,
      getContentType,
      identify_htmltag,
      mimes,
      str_inject,
      utilities,
      Path: join(params[0], "src", "assist", cosetting.general.engine.type),
      reaction: await require("./assist/reaction")(
        [join(params[0], "src", "assist"), "web"],
        [
          {
            ...library,
            assist: { getContentType, identify_htmltag, mimes, str_inject },
          },
          sys,
          cosetting,
        ]
      ),
      // deskaction: await require("./assist/desktop/reaction")(
      //   [join(params[0], "src", "assist"), "desktop"],
      //   [
      //     {
      //       ...library,
      //       assist: { getContentType, identify_htmltag, mimes, str_inject },
      //     },
      //     sys,
      //     cosetting,
      //   ]
      // ),
    };
  } catch (error) {
    lib = errhandler(error);
  } finally {
    return lib;
  }
};
