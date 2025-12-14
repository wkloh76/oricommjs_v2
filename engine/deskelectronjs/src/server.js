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
const { DatabaseSync: sqlite3 } = require("node:sqlite");
const util = require("util");
/**
 * The asistant of main module which is handle the submodule in each sub folder.
 * @module src_server
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

    const { serve, serveStatic } = require("./desktop/serve")(params, obj);
    const { Hono } = require("./desktop/electronjs")(params, obj);
    const { sessionMiddleware } = require("./desktop/session")(params, obj);
    const getConnInfo = (c) => {
      const bindings = c.env.server ? c.env.server : c.env;
      const address = bindings.incoming.socket.remoteAddress;
      const port = bindings.incoming.socket.remotePort;
      const family = bindings.incoming.socket.remoteFamily;
      return {
        remote: {
          address,
          port,
          addressType:
            family === "IPv4" ? "IPv4" : family === "IPv6" ? "IPv6" : void 0,
        },
      };
    };

    try {
      const cnttype = {
        "application/json": "json",
      };
      let lib = {};
      // let app = new OpenAPIHono();
      let app = new Hono();

      /**
       * Server establish and session log
       * @alias module:server.establish
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @returns {Object} - Return null | error object
       */
      const establish = async (...args) => {
        const [setting, compmgr] = args;
        const { general, genernalexcludefile, logpath, share } = setting;
        const { savestore, store, verbose, ...setsession } =
          setting[setting.args.engine].session;
        const { assets, atomic, reaction, libraries } = compmgr.assist;

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

          await libraries(["utils", "engine/workflow"], {
            register: app.use,
            serveStatic,
            library,
          });

          //set up our express application
          // app.use(cors());
          // app.use(secureHeaders());
          // Session in the middleware
          app.use("*", sessionMiddleware(setsession));

          app.use(
            // 添加 Pino HTTP 中间件
            async (...args) => {
              const [cnt, next] = args;
              const { req, res } = cnt;
              const start = Date.now();
              let result = await next();
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

              return result;
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
       * @alias module:server.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - reaction is an module for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = async (...args) => {
        const [[setting], autoupdate, compmgr] = args;
        const { general, ongoing } = setting;
        const { port, primary } = general;

        try {
          let rtnestablish = await establish(setting, compmgr);
          if (rtnestablish) throw rtnestablish;
          await autoupdate.init(setting);
          let rtn = await sanbox(serve, [
            {
              assist: compmgr.assist,
              fetch: app.fetch,
              ongoing,
              port,
              primary,
              window: setting.deskelectronjs.window,
            },
          ]);

          if (rtn)
            throw {
              errno: -4,
              message: `address already in use :::${port}`,
              stack: `The port number ${port} occupied by other service!`,
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
