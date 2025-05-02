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
 * Submodule handles the http server, which uses hono to manage http requests and responses
 * @module src_webserver
 */

const { serve } = require("bun");
const { Database: sqlite3 } = require("bun:sqlite");
const { swaggerUI } = require("@hono/swagger-ui");
const { OpenAPIHono, createRoute, z } = require("@hono/zod-openapi");
const { Hono } = require("hono");

const { bodyLimit } = require("hono/body-limit");
const { getConnInfo } = require("hono/bun");
const { cors } = require("hono/cors");
const { compress } = require("hono/compress");
const { secureHeaders } = require("hono/secure-headers");
const { serveStatic } = require("hono/serve-static");
// const { serveStatic } = require("./serverStatic/index.js");
const { sessionMiddleware } = require("hono-sessions");
const { BunSqliteStore } = require("hono-sessions/bun-sqlite-store");
const pino = require("pino");
const { rotate } = require("pino-rotate");
const mimes = require("./data/mimes.json");

module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { datatype, dir_module, str_replacelast } = library.utils;
    const { dayjs, fs, path } = sys;
    const { existsSync, readFileSync } = fs;
    const { join } = path;

    try {
      const cnttype = {
        "application/json": "json",
      };
      let lib = {};
      // let app = new OpenAPIHono();
      let app = new Hono();
      let sessionval;

      /**
       * Web server establish and session log
       * @alias module:webserver.establish
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @returns {Object} - Return null | error object
       */
      const establish = (...args) => {
        let [setting] = args;
        try {
          let { logpath, general } = setting;
          let { savestore, store, verbose, ...setsession } =
            setting[setting.args.engine].session;

          //set up our express application
          app.use(cors());
          app.use(secureHeaders());

          // Compress all route
          // app.use(compress());
          if (savestore) {
            let dbfile;
            if (store.path == "") dbfile = join(logpath, "./sessions.db3");
            else dbfile = join(store.path, "./sessions.db3");
            store.client = new sqlite3(dbfile);
            console.log("Session db run silently!");
            setsession.store = new BunSqliteStore(store.client);
          }

          // Setup server log
          // 创建 Pino 日志记录器并配置轮转
          const logger = pino({
            level: "info",
            transport: {
              target: "pino-rotate",
              options: {
                file: join(logpath, curdir, "success.log"), // 主日志文件路径
                size: cosetting.log.success.maxLogSize, // 每个日志文件最大10MB
                rotate: cosetting.log.success.numBackups, // 保留5个轮转文件
                interval: "1d", // 每天检查轮转
                compress: true, // 压缩旧日志
                mkdir: true,
              },
            },
            // 添加时间戳
            timestamp: () =>
              `,"time":"${dayjs().format("YYYY-MM-DD HH:mm:ss")}"`,
            // 自定义日志格式
            formatters: {
              level: (label) => {
                return { level: label };
              },
            },
          });

          sessionval = setsession;

          // 添加 Pino HTTP 中间件
          app.use("*", async (...args) => {
            const [cnt, next] = args;
            const { req, res } = cnt;
            const start = Date.now();
            await next();
            let ms = Date.now() - start;

            let parsebody = {};
            let ctype = req.header("Content-Type");
            if (ctype) parsebody = await req[cnttype[ctype]]();

            logger.info(
              {
                method: req.method,
                url: req.path,
                userAgent: req.header("User-Agent"),
                status: res.status,
                responseTime: `${ms}ms`,
                ip: getConnInfo(cnt).remote.address,
                query: JSON.stringify(req.query()),
                body: JSON.stringify(parsebody),
                params: JSON.stringify(req.param()),
              },
              "request completed"
            );
          });

          const webservice = () => {
            let output;
            try {
              serve({ fetch: app.fetch, port: general.portlistener });
              return;
            } catch (error) {
              output = error;
            } finally {
              return output;
            }
          };
          //   app.on("error", onError);

          let rtn = webservice();
          if (rtn)
            throw {
              errno: -4,
              message: `address already in use :::${general.portlistener}`,
              stack: `The port number ${general.portlistener} occupied by other service!`,
            };

          return;
        } catch (error) {
          return error;
        }
      };

      // Helper function to determine the content type
      const getContentType = (path) => {
        return mimes[path.split(".").pop()];
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
      const load_atomic = (...args) => {
        let [share, excludefile, obj] = args;
        let atomic = dir_module(share, excludefile);
        for (let atomic_items of atomic) {
          let units = dir_module(join(share, atomic_items), excludefile);
          for (let unit of units) {
            let sharepath = join(share, atomic_items, unit, "src", "browser");
            if (existsSync(sharepath)) {
              let key = `/atomic/${atomic_items}/${unit}`;
              obj.app.use(
                `${key}/*`,
                serveStatic({
                  root: `${sharepath}`,
                  getContent: (path, c) => {
                    let filePath = str_replacelast(path, key, "");
                    // Check if the file exists
                    if (fs.existsSync(filePath)) {
                      // Get the mimes type
                      const mimes = getContentType(filePath);

                      // Serve the file with the correct content-length header
                      if (!mimes) return readFileSync(filePath, "utf-8");
                      else {
                        const cssContent = readFileSync(filePath);
                        const options = {
                          headers: {
                            "Content-Type": mimes,
                            "Content-Length":
                              Buffer.byteLength(cssContent).toString(),
                          },
                        };
                        if (mimes == "font/woff" || mimes == "font/woff2") {
                          c.res = new Response(cssContent, options);
                        } else {
                          return c.body(cssContent, options);
                        }
                      }
                    } else {
                      // File not found
                      c.res = new Response("File not found", { status: 404 });
                    }
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
      const load_pubshare = (...args) => {
        let [share, enginetype, obj] = args;
        for (let [pubkey, pubval] of Object.entries(share)) {
          if (pubkey.indexOf(`${enginetype}_`) > -1) {
            for (let [key, val] of Object.entries(pubval)) {
              if (datatype(val) == "object")
                obj.app.use(key, obj.reaction[val.fn]);
              else {
                obj.app.use(
                  `${key}/*`,
                  serveStatic({
                    root: `${val}`,
                    getContent: (path, c) => {
                      let filePath = `/${path.replace(`${key}`, "")}`;
                      // Check if the file exists
                      if (fs.existsSync(filePath)) {
                        // Get the mimes type
                        const mimes = getContentType(filePath);

                        // Serve the file with the correct content-length header
                        if (!mimes) return readFileSync(filePath, "utf-8");
                        else {
                          const cssContent = readFileSync(filePath);
                          const options = {
                            headers: {
                              "Content-Type": mimes,
                              "Content-Length":
                                Buffer.byteLength(cssContent).toString(),
                            },
                          };
                          if (mimes == "font/woff" || mimes == "font/woff2") {
                            c.res = new Response(cssContent, options);
                          } else {
                            return c.body(cssContent, options);
                          }
                        }
                      } else {
                        // File not found
                        c.res = new Response("File not found", { status: 404 });
                      }
                    },
                  })
                );
              }
            }
          }
        }
      };

      /**
       * Loading atomic, public static files share and establish web server service
       * @alias module:webserver.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - reaction is an module for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = async (...args) => {
        let [setting, reaction] = args;
        try {
          let rtnestablish = establish(setting);
          if (rtnestablish) throw rtnestablish;
          await Promise.all([
            load_atomic(setting.share.atomic, setting.genernalexcludefile, {
              app,
            }),
            load_pubshare(setting.share.public, setting.general.engine.type, {
              reaction,
              app,
            }),
          ]);

          // Session in the middleware
          app.use("*", sessionMiddleware(sessionval));
          app.use(
            bodyLimit({
              maxSize: setting.webbunjs.parser.maxSize,
              onError: (cnt) => {
                return cnt.text("overflow :(", 413);
              },
            }),
            reaction["onrequest"]
          );

          return;
        } catch (error) {
          return error;
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
