/**
 * Copyright (c) 2026   Loh Wah Kiang
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
 * The submodule of utils act as backend and frontend http/https request agent
 * @module utils_smfetch
 */
module.exports = (...args) => {
  const [params, obj] = args;
  const [library] = obj;
  const backend = true;
  let lib = {};
  try {
    /**
     * FIre fetch api request in async method
     * @alias module:fetchapi.request
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - param for call api server base on fecth api format
     */
    const request = async (...args) => {
      const { errhandler, sanbox } = library.utils;
      const [params] = args;
      const { async = true } = params;
      try {
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
        const urlidentify = async (...args) => {
          const [param] = args;
          let output = { ...param, requester: "" };
          let broken = await sanbox(
            (url) => {
              try {
                new URL(url);
                return true;
              } catch (error) {
                return false;
              }
            },
            [param.url]
          );
          // Mean call from frontend
          if (typeof backend == "undefined") {
            if (!broken) {
              if (window?.electron) {
                output.requester = "deskfetch";
                let electron = await sanbox(completeRelativeUrl, [param.url]);
                if (electron) output.url = electron;
              } else {
                output.requester = "webfetch";
                output.url = `${window.location.origin}${param.url}`;
              }
            } else {
              if (window?.electron) output.requester = "deskfetch";
              else output.requester = "webfetch";
            }
          } else {
            output.requester = "webfetch";
            if (!broken) output.url = `${window.location.origin}${param.url}`;
          }
          return output;
        };

        const options = (...args) => {
          let [options] = args;
          let { url, cache, credentials, reqdata, origin, ...output } = options;

          switch (output.method) {
            case "GET":
              let myUrl = new URL(url);
              if (reqdata !== undefined) {
                if (typeof reqdata == "object")
                  myUrl.search = new URLSearchParams(
                    JSON.parse(JSON.stringify(reqdata))
                  ).toString();
                else if (typeof reqdata == "string") myUrl.search = reqdata;
              }
              output["query"] = {};
              for (const [key, value] of myUrl.searchParams.entries()) {
                output["query"][key] = value;
              }
              url = myUrl.href;
              break;

            default:
              if (typeof reqdata == "object") {
                if (reqdata instanceof FormData) output["body"] = reqdata;
                else {
                  output["headers"] = {
                    ...output["headers"],
                    ...{
                      "Content-Type": "application/json",
                    },
                  };
                  output["body"] = JSON.stringify(reqdata);
                }
              } else if (typeof reqdata == "string") {
                output["headers"] = {
                  ...output["headers"],
                  ...{
                    "Content-Type": "text/plain;charset=UTF-8",
                  },
                };
                output["body"] = reqdata;
              }
              break;
          }
          output["url"] = url;
          if (credentials) output["credentials"] = "same-origin";
          else output["credentials"] = "include";
          if (origin) output["mode"] = "cors";
          else output["mode"] = "same-origin";
          if (cache) output["cache"] = "default";
          else output["cache"] = "no-cache";
          return output;
        };

        const httpfetch = async (...args) => {
          const [params] = args;
          const { requester, ...param } = params;
          try {
            let data = {};
            let {
              async = true,
              url,
              method,
              data: reqdata,
              success: achieve,
              error: fault,
              ajax = true,
              option = {},
              download = false,
            } = param;

            let {
              origin = false,
              cache = false,
              credentials = true,
              redirect = false,
              headers = {},
              ...opt
            } = option;

            data = options({
              ...opt,
              ...{ headers: headers },
              origin,
              cache,
              credentials,
              url,
              method,
              reqdata,
            });

            if (data.headers)
              data.headers = {
                ...data.headers,
                "X-Requested-With": "XMLHttpRequest",
              };
            else data.headers = { "X-Requested-With": "XMLHttpRequest" };
            let { url: furl, ...fdata } = data;
            if (requester == "deskfetch") {
              if (param?.success !== undefined) data.success = param.success;
              if (param?.error !== undefined) data.error = param.error;
              if (param?.async !== undefined) async = param.async;
              if (param?.reroute !== undefined) data.reroute = param.reroute;
            }
            if (async) {
              if (requester == "webfetch") {
                fetch(furl, fdata)
                  .then(async (response) => {
                    if (response.ok) {
                      if (param.reroute && response.url != "")
                        window.location = response.url;
                      else if (achieve) {
                        let result = {};
                        if (response.redirected && response.url != "")
                          window.location = response.url;
                        else if (download) result.data = await response.blob();
                        else result.data = await response.json();
                        success({
                          status: response.status,
                          statusText: response.statusText,
                          data: result,
                        });
                      }
                    } else {
                      if (fault) {
                        fault({
                          status: response.status,
                          statusText: response.statusText,
                        });
                      }
                    }
                  })
                  .catch((error) => {
                    return errhandler(error);
                  });
              } else if (requester == "deskfetch")
                await window.fetchapi.request(furl, fdata);
              return;
            } else {
              let response;
              if (requester == "webfetch") response = await fetch(furl, fdata);
              else if (requester == "deskfetch")
                response = await window.fetchapi.request(furl, fdata);

              let result = {
                code: 0,
                data: null,
                msg: "",
                status: response.status,
                statusText: response.statusText,
              };
              if (response.ok) {
                if (param.reroute && response.url != "") {
                  window.location = response.url;
                } else if (response.redirected && response.url != "") {
                  window.location = response.url;
                } else if (download) {
                  result.data = await response.blob();
                } else {
                  let resp = await response.json();
                  result = { ...result, ...resp };
                }
              } else {
                if (response.status == 301 && requester == "webfetch") {
                  let resp = await response.json();
                  window.location = resp.redirect;
                }
              }
              return result;
            }
          } catch (error) {
            return errhandler(error);
          }
        };

        let param = await urlidentify(params);
        return await httpfetch(param);
      } catch (error) {
        return errhandler(error);
      }
    };
    lib = { request };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
