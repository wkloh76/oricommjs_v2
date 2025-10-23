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

    // Convert module object to string
    const moduleToString = (module) => {
      const exports = [];
      const lib = [];

      // Handle named exports
      for (const [key, value] of Object.entries(module)) {
        lib.push(key);
        exports.push(`const ${key} = ${value.toString()}`);
      }

      return `try { let lib = {}; ${exports.join("\n")}; lib={${lib.join(
        ","
      )}};return lib;} catch (error) {return error;}`;
    };

    const load_utilsshare = (...args) => {
      let [share, enginetype, obj] = args;
      let key = "/library/*";
      obj.app.use(
        `${key}`,
        serveStatic({
          // root: `${val}`,
          getContent: (urlpath, c) => {
            let filePath = `${urlpath.replace(`${key}`, "")}`;
            let {
              handler,
              powershell,
              intercomm,
              sqlitesession,
              html,
              io,
              ...utils
            } = library.utils;

            let result = jsbeautify(
              `export default () => { ${moduleToString(utils)} };`,
              {
                indent_size: 2, // Indent with 2 spaces
                space_in_empty_paren: true, // Add space in empty parentheses
                // Many other options are available for customization
              }
            );

            // Get the mimes type
            const mimes = getContentType(filePath);

            // Serve the file with the correct content-length header
            if (mimes) {
              const cssContent = Buffer.from(result, "utf8");
              const options = {
                headers: {
                  "Content-Type": mimes,
                  "Content-Length": Buffer.byteLength(cssContent).toString(),
                },
              };
              return c.body(cssContent, options);
            }
          },
        })
      );
    };

    lib = { atomic, assets, identify_htmltag, mimes, str_inject };
  } catch (error) {
    lib = errhandler(error);
  } finally {
    return lib;
  }
};
