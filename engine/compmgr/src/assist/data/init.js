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
 * The asistant of main module which is handle the submodule in each sub folder.
 * @module src_browser_init
 */
(() => {
  // Disable SCP warning
  process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true;
  const { contextBridge, ipcRenderer } = require("electron");

  let wait_callback = {};

  let decodeapi = (...args) => {
    let [event, param] = args;
    let { url: baseUrl, ok, status, statusText } = param;
    try {
      const json = new Function(param.response);
      let fn = wait_callback[baseUrl];
      if (status == 200) {
        if (fn?.success) {
          fn.success.apply(null, [status, statusText, json]);
        }
      } else {
        if (fn?.error) {
          status;
          fn.error.apply(null, [status, statusText, json]);
        }
      }
      delete wait_callback[baseUrl];
      return { url: baseUrl, ok, status, statusText, json };
    } catch (error) {
      console.log(error.message);
      return [-1, error.message, null];
    }
  };

  ipcRenderer.on("resfetchapi", decodeapi);
  ipcRenderer.on("broadcast", (...args) => {
    let [event, param] = args;
    const bc = new BroadcastChannel("intercom");
    bc.postMessage(param);
    bc.close();
  });

  contextBridge.exposeInMainWorld("electron", () => {
    return {
      chrome: process.versions.chrome,
      node: process.versions.node,
      electron: process.versions.electron,
    };
  });

  contextBridge.exposeInMainWorld("fetchapi", {
    request: async (...args) => {
      try {
        let [url, param] = args;
        let { async = false, reroute = false, success, error, ...req } = param;
        req.originalUrl = url;

        if (wait_callback?.[req.originalUrl] === undefined) {
          wait_callback[req.originalUrl] = { count: 0 };
          req.baseUrl = req.originalUrl;
        } else {
          let count = parseInt(wait_callback[req.originalUrl]["count"]) + 1;
          wait_callback[req.originalUrl]["count"] = count;

          req.baseUrl = `${req.originalUrl}-${
            wait_callback[req.originalUrl]["count"]
          }`;

          wait_callback[req.baseUrl] = {};
        }

        if (success) wait_callback[req.baseUrl]["success"] = success;
        if (error) wait_callback[req.baseUrl]["error"] = error;
        req["async"] = async;
        req["reroute"] = false;
        if (req["body"] && typeof req["body"] == "string")
          req["body"] = JSON.parse(req["body"]);
        if (reroute) req["reroute"] = reroute;
        if (async) {
          req["channel"] = "deskfetch";
          ipcRenderer.send("deskfetch", req);
        } else {
          req["channel"] = "deskfetchsync";
          return decodeapi.apply(
            null,
            await ipcRenderer.invoke("deskfetchsync", req)
          );
        }
      } catch (error) {
        console.log(error.message);
      }
    },
  });

  contextBridge.exposeInMainWorld("electron_session", {
    checkSession: () => ipcRenderer.invoke("validate-session"),
    onSessionExpired: (callback) => ipcRenderer.on("session-expired", callback),
  });

  window.addEventListener("DOMContentLoaded", async () => {});
})();
