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
 * @module src_honoassist
 */

module.exports = (...args) => {
  const beautify = require("js-beautify/js");
  const { minify } = require("html-minifier-terser");
  const jsdom = require("jsdom");
  const { htmlTags, mimes } = require("./hono/htmldata.json");

  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { datatype, errhandler, io } = library.utils;
  const { dir_module } = io;
  const { fs, logerr: logerror, path } = sys;
  const { existsSync, readFileSync } = fs;
  const { join, basename } = path;

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
      let [name, route, fpath] = args;
      let bname, fname, filePath, mimes, cssContent, options;

      route = route.slice(0, -1);
      bname = basename(name);
      fname = name.substring(name.lastIndexOf(route)).replace(route, "");
      filePath = join(fpath, fname);
      mimes = getContentType(filePath);
      cssContent = Buffer.from("");

      if (!mimes) mimes = "text/plain";
      if (fs.existsSync(filePath)) {
        if (library.mode != "Production") cssContent = readFileSync(filePath);
        else
          cssContent = Buffer.from(
            await minify(readFileSync(filePath).toString(), {
              collapseWhitespace: true,
            })
          );
      }

      options = {
        headers: {
          "Content-Type": mimes,
          "Content-Length": Buffer.byteLength(cssContent).toString(),
        },
      };
      return [cssContent, options];
    };

    const registration = (...args) => {
      const [params, obj] = args;
      const [route, fpath] = params;
      const { serveStatic, register } = obj;
      register(
        route,
        serveStatic({
          root: fpath,
          getContent: async (fname, c) => {
            return c.body(...(await getExistFile(fname, route, fpath)));
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
              },
            };
            return c.body(cssContent, options);
          },
        })
      );
    };

    // // Convert module object to string
    const moduleToString = (module) => {
      const exports = [];
      const lib = [];

      // Handle named exports
      // `export default () => { ${moduleToString(temp)} };

      let master = [];
      for (const [key, value] of Object.entries(module)) {
        lib.push(key);
        let [d, n] = valueToString(value);
        if (n) master.push(`export const ${key} =() => { ${n} }`);
        else exports.push(`const ${key} = ${d}`);
        // else exports.push(`const ${key} = ${valueToString(value)}`);
      }

      // return `try { let lib = {}; ${exports.join("\n")}; lib={${lib.join(
      //   ","
      // )}};return lib;} catch (error) {return error;}`;
      let data = `export default () => { try { let lib = {}; ${exports.join(
        "\n"
      )}; lib={${lib.join(",")}};return lib;} catch (error) {return error;}}`;
      master.push(data);
      return master.join(" ");
    };

    // Convert value to string representation
    const valueToString = (value) => {
      let info = typeof value;
      if (typeof value === "function") {
        return [value.toString()];
      } else if (typeof value === "object" && value !== null) {
        let ismodule = false;
        let obfunc = [],
          objson = {};
        let temp;

        // let temp = stringifyWithAccessors(value, 2);
        for (let key in value) {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (typeof value[key] === "function") {
            ismodule = true;
            obfunc.push(`const ${key} = ${value[key].toString()}`);
          } else if (typeof value[key] === "object") {
            objson[key] = value[key];
          }
        }
        if (ismodule) {
          return [null, temp];
        } else return [JSON.stringify(value, null, 2)];
      } else if (typeof value === "string") {
        return [JSON.stringify(value)];
      } else {
        return [String(value)];
      }
    };

    // 自定义序列化函数，支持getter/setter
    const stringifyWithAccessors = (() => {
      const replacer = (key, val) => {
        // 处理Symbol类型
        if (typeof val === "symbol") {
          return val.toString();
        }

        // 处理Set类型
        if (val instanceof Set) {
          return Array.from(val);
        }

        // 处理Map类型
        if (val instanceof Map) {
          return Array.from(val.entries());
        }

        // 处理函数类型
        if (typeof val === "function") {
          return val.toString();
        }

        // 处理getter/setter属性
        if (val && typeof val === "object") {
          const descriptors = Object.getOwnPropertyDescriptors(val);
          const result = {};

          for (const [prop, descriptor] of Object.entries(descriptors)) {
            if (descriptor.get) {
              result[`get ${prop}`] = descriptor.get.toString();
            }
            if (descriptor.set) {
              result[`set ${prop}`] = descriptor.set.toString();
            }
            if (descriptor.value !== undefined) {
              result[prop] = descriptor.value;
            }
          }
          return result;
        }

        return val;
      };

      return (obj, spaces = 2) => JSON.stringify(obj, replacer, spaces);
    })();

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
              registration([route, fpath], obj);
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
        let buff = {};
        const maker = (...args) => {
          const [name, obj] = args;
          return `const ${name} = ${obj}`;
        };
        const decode_descriptor = (...args) => {
          const [name, obj] = args;
          let rtn = "";
          const { get, set, value } = obj;
          if (get) rtn += `const ${name} = ${get}`;
          if (set) rtn += `const ${name} = ${set}`;
          if (value) {
            if (typeof value == "function") rtn += `const ${name} = ${value}`;
            else rtn += JSON.stringify(value);
          }
          return rtn;
        };
        const export_proc = (...args) => {
          const [params, obj] = args;
          let output = "";
          if (params == "default")
            output = `export default ()=>{try{${Object.values(obj).join(
              "\n"
            )}; return {${Object.keys(obj).join(
              ","
            )}};} catch (error) {return error;}}`;
          else
            output = `const ${params} = (module.exports = ()=>{try{${Object.values(
              obj
            ).join("\n")}; return {${Object.keys(obj).join(
              ","
            )}};} catch (error) {return error;}})()`;
          return output;
        };

        const investigation = (...args) => {
          const [obj] = args;
          let buff = {};
          for (let [key, val] of Object.entries(obj)) {
            let dtype = typeof val;
            if (dtype == "object") {
              let descriptor = Object.getOwnPropertyDescriptor(val, key);
              if (!descriptor) {
                buff[key] = investigation(val);
              } else buff[key] = JSON.stringify(val);
            } else if (dtype == "function") {
              buff[key] = maker(key, val);
            }
          }
          return buff;
        };

        let { excluded } = obj;
        for (let [key, val] of Object.entries(obj)) {
          if (!excluded.includes(key)) {
            let dtype = typeof val;
            if (dtype == "object") {
              let data = investigation(val);
              if (!data) {
              } else {
                buff[key] = export_proc(key, data);
              }
            } else if (dtype == "function") {
              buff[key] = maker(key, val);
            }
          }
        }

        if (Object.keys(buff).length > 0) {
          objmodule[params] = `export default ()=>{try{${Object.values(
            buff
          ).join("\n")}; return {${Object.keys(buff).join(
            ","
          )}};} catch (error) {return error;}}`;
        }

        // if (pubval.excluded) {
        //   let temp = pubval;
        //   pubval.excluded.map((value) => {
        //     let { [value]: noused, ...other } = temp;
        //     temp = other;
        //   });
        //   let statement = moduleToString(temp);
        //   objmodule[pubkey] = statement;
        // }
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
      esm2strMaker(name, share[name]);
      for (let [pubkey, pubval] of Object.entries(share[name])) {
        if (pubval.excluded) {
          let temp = pubval;
          pubval.excluded.map((value) => {
            let { [value]: noused, ...other } = temp;
            temp = other;
          });

          // let statement = `export default () => { ${moduleToString(temp)} };`;
          let statement = moduleToString(temp);
          objmodule[pubkey] = statement;
          // objmodule[pubkey] = await minify(statement, {
          //   collapseWhitespace: true,
          // });
        }
      }

      regutils(["/library/*"], otherobj);
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

    lib = {
      atomic,
      assets,
      identify_htmltag,
      mimes,
      str_inject,
      utilities,
    };
  } catch (error) {
    lib = errhandler(error);
  } finally {
    return lib;
  }
};
