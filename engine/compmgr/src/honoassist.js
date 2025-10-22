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
  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { datatype, errhandler, handler, io, str_replacelast } = library.utils;
  const { mimes } = handler;
  const { dir_module } = io;
  const { fs, logerr: logerror, path } = sys;
  const { existsSync, readFileSync } = fs;
  const { join } = path;
  let lib = {};
  try {
    // Helper function to determine the content type
    const getContentType = (path) => {
      return mimes[path.split(".").pop()];
    };

    const getExistFile = (...args) => {
      const [name, route, fpath] = args;
      const pattern = `${fpath}${route}`.slice(0, -1);
      const fname = name.replace(pattern, "");
      let mimes = getContentType(fname);
      let cssContent = Buffer.from("");
      if (!mimes) mimes = "text/plain";

      let fdirectory = `${fpath}/`;
      if (fname.lastIndexOf("/") > -1) fdirectory = fpath;

      let filePath = `${fdirectory}${fname}`;
      // Check if the file exists
      if (fs.existsSync(filePath)) cssContent = readFileSync(filePath);

      let options = {
        headers: {
          "Content-Type": mimes,
          "Content-Length": Buffer.byteLength(cssContent).toString(),
        },
      };
      return [cssContent, options];
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
      const { serveStatic, register } = obj;

      let atomic = dir_module(share, excludefile);
      for (let atomic_items of atomic) {
        let units = dir_module(join(share, atomic_items), excludefile);
        for (let unit of units) {
          let fpath = join(share, atomic_items, unit, "src", "browser");
          if (existsSync(fpath)) {
            let route = `/atomic/${atomic_items}/${unit}/*`;
            register(
              route,
              serveStatic({
                root: fpath,
                getContent: (fname, c) => {
                  // let mimes = getContentType(fname);
                  // let name = getExistFile(fname, route, fpath);
                  // let cssContent = Buffer.from("");
                  // if (name) cssContent = readFileSync(filePath);
                  // if (!mimes) mimes = "text/plain";

                  // const options = {
                  //   headers: {
                  //     "Content-Type": mimes,
                  //     "Content-Length":
                  //       Buffer.byteLength(cssContent).toString(),
                  //   },
                  // };
                  return c.body(...getExistFile(fname, route, fpath));
                },
              })
            );
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
      const { serveStatic, register } = obj;

      for (let [pubkey, pubval] of Object.entries(share)) {
        if (pubkey.indexOf(`${enginetype}_`) > -1) {
          for (let [key, val] of Object.entries(pubval)) {
            let route = `${key}/*`;
            let fpath = val.filepath;
            if (datatype(val) == "object") {
              register(
                route,
                serveStatic({
                  root: fpath,
                  getContent: async (path, c) => {
                    console.log(path);
                    let pattern = `${fpath}${route}`.slice(0, -1);
                    let filePath = path.replace(pattern, fpath);

                    // let filePath = `${path.replace(`${key}`, "")}`;
                    // let filePath2 = `${path.replace(`${route}${key}`, "")}`;

                    // Check if the file exists
                    if (fs.existsSync(filePath)) {
                      // Get the mimes type
                      const mimes = getContentType(filePath);

                      // Serve the file with the correct content-length header
                      if (mimes) {
                        const cssContent = await minify(
                          val.content.concat(" ", readFileSync(filePath)),
                          {
                            collapseWhitespace: true,
                          }
                        );
                        const options = {
                          headers: {
                            "Content-Type": mimes,
                            "Content-Length":
                              Buffer.byteLength(cssContent).toString(),
                          },
                        };
                        return c.body(cssContent, options);
                      }
                    }
                  },
                })
              );
            } else {
              fpath = val;
              register(
                route,
                serveStatic({
                  root: fpath,
                  getContent: (fname, c) => {
                    // let mimes = getContentType(fname);
                    // let name = getExistFile(fname, route, fpath);
                    // let cssContent = Buffer.from("");
                    // if (name) cssContent = readFileSync(filePath);
                    // if (!mimes) mimes = "text/plain";

                    // const options = {
                    //   headers: {
                    //     "Content-Type": mimes,
                    //     "Content-Length":
                    //       Buffer.byteLength(cssContent).toString(),
                    //   },
                    // };
                    return c.body(...getExistFile(fname, route, fpath));
                  },
                  // getContent: (path, c) => {
                  //   console.log(path);
                  //   let pattern = `${fpath}${route}`.slice(0, -1);
                  //   let filePath = path.replace(pattern, fpath);
                  //   console.log(path.replace(pattern, ""));

                  //   // let filePath = `${path.replace(`${key}`, "")}`;
                  //   // Check if the file exists
                  //   if (fs.existsSync(filePath)) {
                  //     // Get the mimes type
                  //     const mimes = getContentType(filePath);

                  //     // Serve the file with the correct content-length header
                  //     if (mimes) {
                  //       const cssContent = readFileSync(filePath);
                  //       const options = {
                  //         headers: {
                  //           "Content-Type": mimes,
                  //           "Content-Length":
                  //             Buffer.byteLength(cssContent).toString(),
                  //         },
                  //       };
                  //       return c.body(cssContent, options);
                  //     }
                  //   }
                  // },
                })
              );
            }
          }
        }
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

    // lib.share = () => {};
    lib = { atomic, assets };
  } catch (error) {
    lib = errhandler(error);
  } finally {
    return lib;
  }
};
