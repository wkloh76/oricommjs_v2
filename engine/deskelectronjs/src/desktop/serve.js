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
/**
 * The submodule of desktop
 * @module src_serve
 */
module.exports = (...args) => {
  const url = require("url");
  const event = require("events");
  const {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    net,
    protocol,
    screen,
  } = require("electron");

  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { utils } = library;
  const { intercomm } = utils;
  const { logerr: logerror, path } = sys;
  const { join } = path;

  try {
    const filepath = "deskelectron";
    protocol.registerSchemesAsPrivileged([
      {
        scheme: filepath,
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
        },
      },
    ]);
    // // 谨慎使用GPU加速（根据应用类型）
    app.disableHardwareAcceleration();
    return {
      serve: async (...args) => {
        const [params] = args;
        const { assist, fetch, ongoing, port, window } = params;
        const { completeRelativeUrl } = assist;
        let { primary } = params;
        try {
          let winlist = [];
          let reglist = {};
          let ready = false;

          const register = (...args) => {
            let [config, fn] = args;
            ipcMain[config.event](config.channel, fn);
            reglist[config.channel] = fn;
          };

          /**
           * Establish new browser window
           * @alias module:desktop.establish
           * @param {...Object} args - 1 parameters
           * @param {Array} args[0] - winopt modules - new window configuration data
           * @returns
           */
          const establish = async (...args) => {
            const [winopt] = args;

            try {
              const resource = async (...args) => {
                let [request] = args;
                try {
                  let options = {
                    body: {},
                    query: {},
                    method: request.method,
                    originalUrl: completeRelativeUrl(
                      new URL(request.url).pathname
                    ),
                    isresource: true,
                  };

                  let results = await onfetch(
                    options,
                    { win: winlist[0], assist },
                    "static-serve"
                  );
                  if (results.length > 0) {
                    let permit = false;
                    let render = {};
                    for (let result of results) {
                      let { content, options } = result;
                      if (content && options) {
                        render = { content, options };
                        permit = true;
                      }
                      if (permit) break;
                    }
                    if (permit) {
                      return new Response(render.content, {
                        ...render.options,
                        status: 200,
                      });
                    }
                  }
                } catch (error) {
                  console.log(error);
                }
              };

              const createWindow = () => {
                let monwidth = winopt.width;
                let monheight = winopt.width;
                let { width, height } = screen.getPrimaryDisplay().workAreaSize;
                if (width > winopt.width) monwidth = width;
                if (height > winopt.height) monheight = height;

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
                    preload: join(assist.Path, "data", "./init.js"),
                  },
                });

                // 禁用拼写检查
                win.webContents.session.setSpellCheckerEnabled(false);
                win.webContents.session.webRequest.onBeforeSendHeaders(
                  (details, callback) => {
                    callback({
                      requestHeaders: {
                        Origin: "*",
                        ...details.requestHeaders,
                      },
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
                      baseURLForDataURL: `${filepath}://resource/`,
                    });
                    break;
                  default:
                    win.loadFile(join(assist.Path, "data", "./main.html"));
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
                  let idx = winlist.indexOf(win.id - 1);
                  if (idx > -1) winlist.splice(idx, 1);
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
              };

              // main.js
              app.commandLine.appendSwitch(
                "js-flags",
                "--max-semi-space-size=64"
              );

              app.removeAllListeners("ready");
              app.removeAllListeners("window-all-closed");
              app.removeAllListeners("activate");

              app.whenReady().then(() => {
                // // 在 ready 事件中处理协议的具体实现
                // protocol.handle("app", (request) => {
                //   // 处理 app:// 协议的请求
                //   const filePath = request.url.slice("app://".length);
                //   return net.fetch(path.join(__dirname, filePath));
                // });

                // createWindow();

                protocol.handle(filepath, resource);
                createWindow();
              });

              // // Monitor process memory leakage
              // let windowCount = 0;
              // setInterval(() => {
              //   const { heapUsed, heapTotal } = process.memoryUsage();
              //   console.log(
              //     `[主进程] 窗口数: ${windowCount} | 堆内存: ${Math.round(
              //       heapUsed / 1024 / 1024
              //     )}MB / ${Math.round(heapTotal / 1024 / 1024)}MB`
              //   );
              // }, 5000);

              // await app.whenReady();
              app.on("window-all-closed", () => {
                console.log("Electron client quitting!");
                if (process.platform !== "darwin") {
                  app.quit();
                }
              });
            } catch (error) {
              return error;
            }
          };

          const onfetch = async (...args) => {
            const [params, obj, channel] = args;
            return await fetch(params, obj, channel);
          };

          const onfetchapi = async (...args) => {
            const [event, params] = args;
            const { channel, ...param } = params;

            let [_sess, ans] = await fetch(
              param,
              { win: winlist[0], assist },
              `${filepath}://resource/`
            );
            if (ans) {
              if (channel == "deskfetch") {
                result = null;
                event.reply(`resfetchapi`, ans);
                return;
              } else return [null, ans];
            }
          };

          register({ event: "on", channel: "deskfetch" }, onfetchapi);
          register({ event: "handle", channel: "deskfetchsync" }, onfetchapi);

          intercomm.register("deskredirect", "always", async (...args) => {
            const [url, status] = args;
            let cmd = "init";
            if (ready) cmd = `${filepath}://resource/`;
            let originalUrl = completeRelativeUrl(url);
            await fetch(
              {
                method: "GET",
                body: {},
                originalUrl,
                query: Object.fromEntries(
                  new URL(originalUrl).searchParams.entries()
                ),
                headers: {
                  Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                  "Sec-Fetch-Mode": "navigate",
                  "X-Requested-With": null,
                },
              },
              { win: winlist[0], assist },
              cmd
            );
          });

          intercomm.register("deskinit", "once", async (...args) => {
            const [render, data] = args;
            try {
              window.render = render;
              window.html = data;
              let result = establish(window);
              if (result instanceof Promise) {
                result = await result;
                if (result instanceof ReferenceError) throw result;
              }
              ready = true;
              return;
            } catch (error) {
              return error;
            }
          });
          intercomm.register("desktopcast", "always", async (...args) => {
            let [param, tabindex = 0] = args;
            if (winlist.length > 0)
              winlist[tabindex].webContents.send("broadcast", param);
          });

          if (primary == "") {
            let durlarr = Object.keys(ongoing).sort();
            for (let key of durlarr) {
              if (primary !== "") break;
              if (ongoing[key].defaulturl != "") {
                primary = ongoing[key].defaulturl;
                break;
              }
            }
          }
          let originalUrl = completeRelativeUrl(primary);

          await fetch(
            {
              method: "GET",
              body: {},
              originalUrl,
              query: Object.fromEntries(
                new URL(originalUrl).searchParams.entries()
              ),
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "Sec-Fetch-Mode": "navigate",
                "X-Requested-With": null,
              },
            },
            { assist },
            "init"
          );
        } catch (error) {
          logerror.error(error);
        }
      },
      serveStatic: (...args) => {
        const [options] = args;
        return options.getContent;
      },
    };
  } catch (error) {
    logerror.error(error);
  }
};
