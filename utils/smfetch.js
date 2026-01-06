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
  const [library, sys] = obj;
  const backend = true;
  let lib = {};
  try {
    /**
     * FIre fetch api request in async method
     * @alias module:smfetch.request
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - param for call api server base on fecth api format
     * @param {Object} args[0].data - Data in json format
     * @param {Object} args[0].headers - HTTP headers
     * @param {Object} args[0].method - RESTFUL API
     * @param {Number} args[0].timeout - Abort the wating responding time from web server.
     * @param {String} args[0].url - The URL for Web API or web server
     * @param {Boolean} args[0].download - Is a flag to just return format as bob. Default is false
     * @param {Boolean} args[0].text - Is a flag to just return format as text. Default is false
     * @returns {Object} - The result return with property (code, data, msg)
     */
    const request = async (...args) => {
      const { errhandler, sanbox } = library.utils;
      const [params] = args;
      try {
        const urlidentify = async (...args) => {
          const [param] = args;
          let output = { ...param, requester: "" };

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
              return new URL(
                relativePath,
                `${protocol}://${domain}`
              ).toString();
            }
          };

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
          let [params] = args;
          let { url, cache, credentials, reqdata, origin, timeout, ...output } =
            params;

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

          if (timeout) {
            const abortController = new AbortController();
            output["signal"] = abortController.signal;
            setTimeout(() => abortController.abort(), timeout);
          }
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
              text = false,
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
                        else if (text) result.data = await response.text();
                        else {
                          let resp = await response.json();
                          result = { ...result, ...resp };
                        }
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
                if (param.reroute && response.url != "")
                  window.location = response.url;
                else if (response.redirected && response.url != "")
                  window.location = response.url;
                else if (download) result.data = await response.blob();
                else if (text) result.data = await response.text();
                else {
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

    /**
     * Call HTTP/HTTPS DOWNLOAD
     * @alias module:smfetch.download
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - param for call api server base on fecth api format
     * @param {Object} args[0].headers - HTTP headers example basic auth
     * @param {Object} args[0].location - Local directory for save file
     * @param {Object} args[0].source - The origin file name from http server
     * @param {String} args[0].url - The URL for Web API or web server
     * @returns {Object} - The result return with property (code, data, msg)
     */
    const download = (...args) => {
      return new Promise(async (resolve, reject) => {
        const { fs, path } = sys;
        const { createWriteStream, existsSync, mkdirSync, unlinkSync } = fs;

        const stream = require("stream");
        const { promisify } = require("util");
        const pipeline = promisify(stream.pipeline);
        const [params] = args;

        const goterr = (error) => {
          let err = { code: -1, data: error.data, msg: error.message };
          switch (error.code) {
            case "ERR_ABORTED":
              err.code = -2;
              break;
            case "EHOSTUNREACH":
              err.code = -3;
              break;

            case "ETIMEDOUT":
              err.code = -4;
              break;
            case "ZEROSIZE":
              err.code = -5;
              break;
          }
          return err;
        };

        let furl;
        let options = {};
        let tagname = path.join(params.location, params.tagname);

        try {
          options["headers"] = {
            ...params.headers,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language":
              "en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3",
            "Cache-Control": "max-age=0",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
          };

          if (params?.["source"]) furl = `${params.url}/${params.source}`;
          else furl = params.url;

          const response = await fetch(furl, options);

          if (!response.ok) {
            throw new Error(`Unexpected response: ${response.statusText}`);
          }

          // Ensure the directory exists (optional)
          const dir = path.dirname(tagname);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }

          const fileWriterStream = createWriteStream(tagname);

          fileWriterStream
            .on("error", (error) => {
              let stats = fs.statSync(tagname);
              let fileSizeInBytes = stats.size;
              if (fileSizeInBytes == 0)
                resolve(
                  goterr({
                    code: "ZEROSIZE",
                    data: { file: tagname },
                    message: "Zero file size",
                  })
                );
              else resolve({ code: 0, data: null, msg: "" });
            })
            .on("finish", () => {
              let stats = fs.statSync(tagname);
              let fileSizeInBytes = stats.size;
              if (fileSizeInBytes > 0)
                resolve({
                  code: 0,
                  data: { file: tagname },
                  msg: "",
                });
            });

          pipeline(response.body, fileWriterStream);
        } catch (error) {
          if (existsSync(tagname)) {
            unlinkSync(tagname);
          }
          resolve(goterr(error));
        }
      });
    };

    /**
     * Call HTTP/HTTPS UPLOAD
     * @alias module:smfetch.upload
     * @param {Object} param - Data in object type.
     * @param {Object} param.data - Data in json format
     * @param {Object} param.headers - HTTP headers
     * @param {Number} param.timeout - Abort the wating responding time from web server.
     * @param {String} param.url - The URL for Web API or web server
     * @returns {Object} - The result return with property (code, data, msg)
     */
    // const upload = (...args) => {
    //   return new Promise(async (resolve) => {
    // const FormData = require("form-data");
    // const jsonToFormData = require("@ajoelp/json-to-formdata");
    //     const [param] = args;
    //     const { file, data, ...other } = param;
    //     let output = handler.dataformat;
    //     try {
    //       const abortController = new AbortController();
    //       if (!file) throw new Error("Undefined file path and file name");
    //       let formdata = new FormData();
    //       formdata.append("smfetch_upload", fs.createReadStream(file));

    //       if (data) jsonToFormData(data, {}, formdata);
    //       let options = gotoption(Object.assign({ method: "POST" }, other));

    //       if (options.headers) {
    //         for (let keyname of Object.keys(options.headers)) {
    //           let value = options.headers[keyname].toLowerCase();
    //           if (value == "multipart/form-data")
    //             delete options.headers[keyname];
    //         }
    //       }
    //       if (Object.keys(options.headers).length == 0) delete options.headers;

    //       options.body = formdata;

    //       if (options["timeout"]) {
    //         options["signal"] = abortController.signal;
    //         setTimeout(() => {
    //           abortController.abort();
    //         }, options["timeout"]);
    //       }

    //       let rtn = await got(options);
    //       output.data = rtn.body;
    //     } catch (error) {
    //       output = goterr(error);
    //     } finally {
    //       resolve(output);
    //     }
    //   });
    // };

    lib = { download, request };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
