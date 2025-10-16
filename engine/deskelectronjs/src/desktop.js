/**
 * Copyright (c) 2024   Loh Wah Kiang
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
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  screen,
  session,
} = require("electron");
const { minify } = require("html-minifier-terser");
const url = require("url");
const crypto = require("crypto");
const util = require("util");
const { json } = require("stream/consumers");
/**
 * The submodule of init_electron
 * @module src_desktop
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const {
      arr_diffidx,
      datatype,
      dir_module,
      errhandler,
      handler,
      intercomm,
      sqlitesession,
    } = library.utils;
    const { SqliteStore } = sqlitesession;
    const { dayjs, fs, path, pino } = sys;
    const { existsSync } = fs;
    const { join } = path;

    try {
      let lib = {};
      let winlist = [];
      let reglist = {};
      let logger, reaction, ses, sess_handler;
      let registry = { el: "deskelectron", winshare: {} };

      ipcMain.handle("validate-session", async () => {
        const data = await sess_handler.Expired();
        // if (!cookie || cookie.expirationDate * 1000 <= Date.now()) {
        //   await session.defaultSession.clearStorageData();
        //   winlist[0].webContents.send("session-expired");
        //   return false;
        // }
        return data;
      });

      const register = (...args) => {
        let [config, fn] = args;
        ipcMain[config.event](config.channel, fn);
        reglist[config.channel] = fn;
      };

      const unregister = (...args) => {
        try {
          let [url] = args;
          ipcMain.removeListener(url, reglist[url]);
        } catch (error) {
          return error;
        }
      };

      const unregisters = (...args) => {
        try {
          for (const [key, value] of Object.entries(reglist)) {
            ipcMain.removeAllListeners(key);
          }
        } catch (error) {
          return error;
        }
      };

      class sessionMiddleware {
        constructor(...args) {
          const [store, sess, sessconf] = args;
          this._db = store;
          this._sess = sess;
          this._sessconf = sessconf;
          this._id;
          this._sessid = {};
          this._initialData = {
            _accessed: null,
            _data: {},
            _delete: false,
            _expire: null,
          };
          this.init();

          return {
            Session: this.checkSession,
            Expired: this.checkExpire,
            Clear: this.clearSession,
          };
        }

        async init() {
          this._id = crypto.randomUUID();
          let sid = this._db.getSessionById(this._id);
          if (sid == null) {
            this._db.createSession(this._id, this._initialData);
            let cookiedata = this.initcookie(this._id);
            await this.createSession(cookiedata);
          }
        }

        checkSession = async (...args) => {
          let [req] = args;
          try {
            let name = this._sessconf.cookieOptions.name;
            let curdt = dayjs().valueOf();
            let cookiedata = this.initcookie(this._id);
            let sess = await this.getSession({ name });
            let dbsess = this._db.getSessionById(this._id);
            let svalue = this._initialData;
            let dbvalue = this._initialData;
            let timestamp = this._sessconf.expireAfterSeconds * 1000 + curdt;
            let _accessed = dayjs(curdt).toISOString();
            let _expire = dayjs(timestamp).toISOString();
            let value = JSON.parse(cookiedata.value);
            let _data = {};

            if (sess) svalue = JSON.parse(sess.value);
            if (dbsess) dbvalue = dbsess;
            if (req.session) {
              if (
                JSON.stringify(value._data) != JSON.stringify(req.session._data)
              ) {
                _data = { ...value._data, ...req.session._data };
              } else _data = dbvalue._data;
            } else {
              if (Object.keys(dbvalue._data) > Object.keys(svalue._data))
                _data = { ...dbvalue._data, ...svalue._data };
              if (Object.keys(svalue._data) > Object.keys(dbvalue._data))
                _data = { ...svalue._data, ...dbvalue._data };
              else _data = dbvalue._data;
            }

            value = {
              ...value,
              _accessed,
              _expire,
              _data,
            };

            req.session = value;

            cookiedata.value = JSON.stringify(value);
            await this.createSession(cookiedata);
            this._db.persistSessionData(this._id, value);
            req["session"] = value;
          } catch (error) {
            console.log(error);
          }
        };

        checkExpire = async () => {
          let output = false;
          let name = this._sessconf.cookieOptions.name;
          let cookiedata = this.initcookie(this._id);
          let sess = await this.getSession({ name });
          let dbsess = this._db.getSessionById(this._id);
          if (sess) {
            let sessdata = JSON.parse(sess.value);
            let expire = dayjs(sessdata._expire).valueOf();
            let curdt = dayjs().valueOf();
            if (curdt > expire) {
              await this.createSession(cookiedata);
              this._db.persistSessionData(
                this._id,
                JSON.parse(cookiedata.value)
              );
              output = true;
            }
          }
          return output;
        };

        clearSession = async () => {
          let cookiedata = this.initcookie(this._id);
          await this.createSession(cookiedata);
          let value = JSON.parse(cookiedata.value);
          this._db.persistSessionData(this._id, value);
        };

        initcookie = (sessionId) => {
          let { domain, sameSite, ...cookiedata } =
            this._sessconf.cookieOptions;
          cookiedata.id = sessionId;
          cookiedata.secure = this._sessconf.encryptionKey;
          cookiedata.url = `http://${domain}`;
          cookiedata.value = JSON.stringify(this._initialData);
          return cookiedata;
        };

        createSession = async (value) => {
          await this._sess.cookies.set(value);
          return;
        };

        getSession = async (value) => {
          let [data] = await this._sess.cookies.get(value);
          return data;
        };
      }

      const reqlog = (...args) => {
        const [request, response] = args;
        logger.info(
          {
            method: request.method,
            url: request.originalUrl,
            userAgent: `Chrome/${process.versions.chrome} electron/${process.versions.electron}`,
            status: response.status,
            responseTime: `${Date.now() - request.reqtime}ms`,
            ip: "::ffff:127.0.0.1",
            query: JSON.stringify(request.query),
            body: JSON.stringify(request.body),
            params: JSON.stringify(request.param),
          },
          "request completed"
        );
      };

      const onfetch = (...args) => {
        return new Promise(async (resolve) => {
          let [event, request] = args;
          await sess_handler.Session(request);
          request = { ...request, reqlog, reqtime: Date.now() };

          try {
            let ans;
            let response = {
              locals: {},
              setHeader: function (...args) {
                return;
              },
              status: function (...args) {
                return this;
              },
              redirect: async function (...args) {
                const [req, res] = args;
                const { htmlstr, session: sess } = req;

                let session = {};
                if (Object.keys(sess).length != 0) session = { ...sess };
                let result = await reaction["onredirect"](
                  {
                    originalUrl: htmlstr,
                    params: {},
                    session,
                  },
                  response
                );
                if (result instanceof Promise) {
                  result = await result;
                  if (result instanceof ReferenceError) throw result;
                }

                if (!(await sess_handler.Expired()))
                  await sess_handler.Session(req);
                reroute(sess, result.data);
                reqlog(req, res);
                return;
              },
              json: async function (data) {
                ans = {
                  baseUrl: request.baseUrl,
                  render: {
                    status: 200,
                    statusText: "OK",
                    options: { json: data },
                  },
                };
                return;
              },
              send: async function (...args) {
                const [req, res] = args;
                const { reqlog, htmlstr, session: sess } = req;
                reqlog(req, res);
                intercomm.fire("deskinit", ["data", htmlstr]);
                req;
                await sess_handler.Session(req);
                return;
              },
              rendererr: async function (...args) {
                const [req] = args;
                const { htmlstr, session: sess } = req;
                reroute(sess, htmlstr);
                await sess_handler.Session(req);
                return;
              },
              end: function (...args) {
                return;
              },
            };

            switch (request.channel) {
              case "deskfetch":
              case "deskfetchsync":
                if (!request.param) request.params = {};
                break;
            }

            let result = reaction["onrequest"](request, response);
            if (result instanceof Promise) {
              result = await result;
              if (result instanceof ReferenceError) throw result;
            }

            if (ans) {
              if (request.channel == "deskfetch") {
                result = null;
                event.reply(`resfetchapi`, ans);
                resolve();
              } else resolve([null, ans]);
            }
          } catch (error) {
            resolve(error);
          }
        });
      };
      /**
       * Initialize
       * @alias module:window.init
       * @param {...Object} args - 0 parameters
       * @returns
       */
      const init = async (...args) => {
        try {
          app.removeAllListeners("ready");
          app.removeAllListeners("window-all-closed");
          app.removeAllListeners("activate");
          await app.whenReady();
          app.on("window-all-closed", () => {
            console.log("Electron client quitting!");
            if (process.platform !== "darwin") {
              app.quit();
            }
          });

          protocol.registerSchemesAsPrivileged([
            {
              scheme: `${registry.el}`,
              privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
              },
            },
          ]);

          return;
        } catch (error) {
          return error;
        }
      };

      const reroute = (sess, data) => {
        let output = handler.dataformat;
        try {
          if (winlist.length == 0) new Error("Cannot find current window!!");
          let htmlstring = `data:text/html;charset=UTF-8,${encodeURIComponent(
            data
          )}`;
          winlist[0].webContents.loadURL(htmlstring, {
            baseURLForDataURL: `${registry.el}://resource/`,
          });
          cache = sess;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
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
            if (existsSync(sharepath))
              obj[unit] = {
                checkpoint: `${atomic_items}/${unit}`,
                filepath: sharepath,
              };
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
              obj[key] = val;
            }
          }
        }
      };

      /**
       * Establish new browser window
       * @alias module:desktop.establish
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] - winopt modules - new window configuration data
       * @returns
       */
      const establish = async (...args) => {
        const [setting] = args;
        const { window: winopt } = setting[setting.args.engine];

        try {
          let monwidth = "";
          let monheight = "";
          let { width, height } = screen.getPrimaryDisplay().workAreaSize;
          if (width > winopt.width) monwidth = width;
          if (height > winopt.height) monheight = height;

          const resource = async (...args) => {
            let [request] = args;
            try {
              let { host, pathname } = new URL(request.url);
              if (pathname !== "/") {
                let joinstr = "";
                let apicontent = "";
                let fp = "";
                let filePath = request.url.slice(`${registry.el}://`.length);
                filePath = filePath.slice(host.length);

                for (let [key, val] of Object.entries(registry.winshare)) {
                  if (pathname.indexOf(key) > -1) {
                    if (datatype(val) == "object") {
                      fp = val.filepath;
                      if (val.content) {
                        apicontent = val.content;
                        joinstr = filePath.replace(`/${val.checkpoint}/`, "");
                      } else {
                        let startpos = pathname.indexOf(val.checkpoint);
                        joinstr = pathname.substring(
                          startpos + val.checkpoint.length
                        );
                      }
                    } else {
                      fp = val;
                      joinstr = filePath.slice(key.length);
                    }
                    break;
                  }
                }

                let api = url.pathToFileURL(join(fp, joinstr)).toString();
                if (existsSync(join(fp, joinstr))) {
                  if (apicontent !== "") {
                    let less = await net.fetch(api);
                    apicontent += await less.text();
                    apicontent = await minify(apicontent, {
                      collapseWhitespace: true,
                    });
                    return new Response(apicontent);
                  } else return await net.fetch(api);
                }
              } else {
                // console.log("other origin---", request.url);
                // return;
              }
            } catch (error) {
              console.log(error);
            }
          };

          protocol.handle(`${registry.el}`, resource);

          const win = new BrowserWindow({
            title: winopt.APP_NAME,
            autoHideMenuBar: winopt.autoHideMenuBar,
            width: monwidth,
            height: monheight,
            frame: winopt.frame,
            fullscreen: winopt.fullscreen,
            useContentSize: winopt.useContentSize,
            resizable: winopt.resizable,
            show: winopt.show,
            webPreferences: {
              nodeIntegration: winopt.nodeIntegration,
              contextIsolation: winopt.contextIsolation,
              enableRemoteModule: winopt.enableRemoteModule,
              nodeIntegrationInWorker: true,
              webSecurity: winopt.webSecurity,
              preload: join(pathname, "browser", "./init.js"),
            },
          });

          win.webContents.session.webRequest.onBeforeSendHeaders(
            (details, callback) => {
              callback({
                requestHeaders: { Origin: "*", ...details.requestHeaders },
              });
            }
          );

          win.webContents.session.webRequest.onHeadersReceived(
            (details, callback) => {
              callback({
                responseHeaders: {
                  "access-control-allow-origin": ["*"],
                  ...details.responseHeaders,
                },
              });
            }
          );

          switch (winopt.render) {
            case "url":
              win.loadURL(winopt.html);
              break;
            case "file":
              win.loadFile(winopt.html);
              break;
            case "data":
              let htmlstring = `data:text/html;charset=UTF-8,${encodeURIComponent(
                winopt.html
              )}`;
              win.loadURL(htmlstring, {
                baseURLForDataURL: `${registry.el}://resource/`,
              });
              break;
            default:
              win.loadFile(join(pathname, "browser", "./main.html"));
          }

          win.on("close", async (e) => {
            e.preventDefault(); // Prevent default no matter what.

            const { response } = await dialog.showMessageBox(win, {
              type: "question",
              buttons: ["Yes", "No"],
              title: "Confirm",
              message: "Are you sure you want to quit?",
            });

            response === 0 && win.destroy();
          });

          win.on("closed", () => {
            dismantle(win.id - 1);
          });

          win.on("error", (error) => {
            ipcRenderer.send("browser", {
              code: 0,
              msg: "",
              data: {
                event: "error",
                err: error,
              },
            });
          });

          win.once("ready-to-show", () => {
            win.show();
            if (winopt.openDevTools) win.webContents.openDevTools();

            function UpsertKeyValue(obj, keyToChange, value) {
              const keyToChangeLower = keyToChange.toLowerCase();
              for (const key of Object.keys(obj)) {
                if (key.toLowerCase() === keyToChangeLower) {
                  // Reassign old key
                  obj[key] = value;
                  // Done
                  return;
                }
              }
              // Insert at end instead
              obj[keyToChange] = value;
            }
          });

          win.webContents.on("did-finish-load", () => {
            win.webContents.send("browser", {
              code: 0,
              msg: "",
              data: {
                event: "did-finish-load",
                id: win.id,
                name: winopt.name,
              },
            });
          });
          winlist.push(win);
        } catch (error) {
          return error;
        }
      };

      /**
       * Dismantle selected window
       * @alias module:desktop.dismantle
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] - win integer - the window id
       * @returns
       */
      const dismantle = (...args) => {
        let [win] = args;
        let idx = winlist.indexOf(win);
        if (idx > -1) winlist.splice(idx, 1);
      };

      /**
       * Configure log module for webexpress and normal log
       * @alias module:desktop.start
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - setting is coresetting object value
       * @param {Object} args[1] - onrequest is a function for responding when http client request
       * @returns {Object} - Return null | error object
       */
      lib["start"] = (...args) => {
        return new Promise(async (resolve) => {
          let [setting, obj] = args;
          let { logpath } = setting;
          let { savestore, store } = setting[setting.args.engine].session;
          let { deskelectronjs } = setting;
          let { reaction: reactionjs, autoupdate } = obj;
          reaction = reactionjs;

          try {
            let ongoing;
            if (setting.args.project && setting.args.project != "")
              ongoing = setting.ongoing[setting.args.project];
            else {
              let ongoing_names = Object.keys(setting.ongoing);
              ongoing_names.map((value, idx) => {
                if (value.indexOf(`${setting.general.engine.type}_`) == -1)
                  ongoing_names.splice(idx, 1);
              });
              if (ongoing_names.length > 0) {
                let [dname] = ongoing_names;
                ongoing = structuredClone(setting.ongoing[dname]);
              }
            }

            let dbfile;
            if (savestore) {
              let mkdir = util.promisify(fs.mkdir);
              if (store.path == "") {
                await mkdir(join(logpath, curdir), { recursive: true });
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
            let dbcon = new sqlite3(dbfile);
            let sess_store = new SqliteStore(dbcon);
            ses = session.fromPartition("persist:my-session");
            sess_handler = new sessionMiddleware(
              sess_store,
              ses,
              setting[setting.args.engine].session
            );

            // Setup server log
            // 创建 Pino 日志记录器并配置轮转
            logger = pino({
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

            await Promise.all([
              load_atomic(
                setting.share.atomic,
                setting.genernalexcludefile,
                registry.winshare
              ),
              load_pubshare(
                setting.share.public,
                setting.general.engine.type,
                registry.winshare
              ),
            ]);

            register({ event: "on", channel: "deskfetch" }, onfetch);
            register({ event: "handle", channel: "deskfetchsync" }, onfetch);

            intercomm.register("deskinit", "once", async (render, data) => {
              try {
                deskelectronjs.window.render = render;
                deskelectronjs.window.html = data;
                let result = establish(setting);
                if (result instanceof Promise) {
                  result = await result;
                  if (result instanceof ReferenceError) throw result;
                }
                await init();
                resolve();
              } catch (error) {
                resolve(error);
              }
            });

            intercomm.register("desktopcast", "always", async (...args) => {
              let [param, tabindex = 0] = args;
              if (winlist.length > 0)
                winlist[tabindex].webContents.send("broadcast", param);
            });

            await autoupdate.init(setting);
            // ses = session.fromPartition("persist:my-session");
            await onfetch(null, {
              method: "GET",
              originalUrl: ongoing.defaulturl,
              channel: "init",
              body: {},
              query: {},
              params: {},
            });
          } catch (error) {
            resolve(error);
          }
        });
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
