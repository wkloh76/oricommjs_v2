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
const { serve } = require("@hono/node-server");
const { DatabaseSync: sqlite3 } = require("node:sqlite");
const { swaggerUI } = require("@hono/swagger-ui");
const { OpenAPIHono, createRoute, z } = require("@hono/zod-openapi");
const { Hono } = require("hono");

const { bodyLimit } = require("hono/body-limit");
const { getConnInfo } = require("@hono/node-server/conninfo");
const { cors } = require("hono/cors");
const { secureHeaders } = require("hono/secure-headers");
const { serveStatic } = require("hono/serve-static");
const { sessionMiddleware } = require("hono-sessions");
const util = require("util");

/**
 * Submodule handles the http server, which uses hono to manage http requests and responses
 * @module src_webserver
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { sqlitesession, sanbox } = library.utils;
    const { SqliteStore } = sqlitesession;
    const { dayjs, fs, path, pino } = sys;
    const { join } = path;

    try {
      const cnttype = {
        "application/json": "json",
      };
      let lib = {};
      // let app = new OpenAPIHono();
      let app = new Hono();

      /**
       * Web server establish and session log
       * @alias module:webserver.establish
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @returns {Object} - Return null | error object
       */
      const establish = async (...args) => {
        const [setting, compmgr] = args;
        const { general, genernalexcludefile, logpath, share, webnodehonojs } =
          setting;
        const { savestore, store, verbose, ...setsession } =
          setting[setting.args.engine].session;
        const { assets, atomic, reaction, utilities } = compmgr.assist;

        try {
          // Setup server log
          // 创建 Pino 日志记录器并配置轮转
          let logger = pino({
            level: "info",
            transport: {
              target: "pino-roll",
              options: {
                file: join(logpath, curdir, "success.log"),
                ...cosetting.log.success,
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

          let dbfile;
          let mkdir = util.promisify(fs.mkdir);
          await mkdir(join(logpath, curdir), { recursive: true });
          if (savestore) {
            if (store.path == "") {
              dbfile = join(logpath, "./sessions.db3");
            } else {
              await mkdir(store.path, { recursive: true });
              dbfile = join(store.path, "./sessions.db3");
            }
            console.log("Session db run in file!");
          } else {
            dbfile = ":memory:";
            console.log("Session db run silently!");
          }
          store.client = new sqlite3(dbfile);
          setsession.store = new SqliteStore(store.client);

          atomic([share.atomic, genernalexcludefile], {
            register: app.use,
            serveStatic,
          });

          assets([share.public, general.engine.type], {
            register: app.use,
            serveStatic,
          });

          await utilities(["utils"], {
            register: app.use,
            serveStatic,
            library,
          });

          //set up our express application
          app.use(cors());
          app.use(secureHeaders());
          // Session in the middleware
          app.use("*", sessionMiddleware(setsession));

          app.use(
            bodyLimit({
              maxSize: webnodehonojs.parser.maxSize,
              onError: (cnt) => {
                return cnt.text("overflow :(", 413);
              },
            }),
            // 添加 Pino HTTP 中间件
            async (...args) => {
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
                  ip:
                    req.header("x-forwarded-for") ||
                    getConnInfo(cnt).remote.address,
                  query: JSON.stringify(req.query()),
                  body: JSON.stringify(parsebody),
                  params: JSON.stringify(req.param()),
                },
                "request completed"
              );
            },
            reaction["onrequest"]
          );

          return;
        } catch (error) {
          return error;
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
        const [[setting], compmgr] = args;
        const { general } = setting;

        try {
          let rtnestablish = await establish(setting, compmgr);
          if (rtnestablish) throw rtnestablish;

          let rtn = await sanbox(serve, [
            { fetch: app.fetch, port: general.portlistener },
          ]);

          if (!rtn._connectionKey)
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

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
