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
 * The submodule of desktop
 * @module src_electronjs
 */
module.exports = (...args) => {
  const event = require("events");
  const { net } = require("electron");

  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { concatobj, intercomm, sanbox } = library.utils;

  try {
    return {
      Hono: class {
        constructor() {
          this._useobj = {};
          this._usearr = [];
          this._myemitter = new event.EventEmitter();
          this._winlist = [];
          this._reglist = {};

          return {
            fetch: this.fetch,
            use: this.use,
          };
        }

        inspector = async (...args) => {
          let [fn, params] = args;
          let [, response] = params;
          let output;
          try {
            response.inspector = async (...args) => {
              let [fn, params] = args;
              let rtn;
              try {
                let result = await sanbox(fn, params);
                if (result.code) throw result;
                output = result;
              } catch (error) {
                rtn = response;
                if (error.msg) rtn.err.error = error.msg;
                else if (error.stack) rtn.err.error = error.stack;
                else if (error.message) rtn.err.error = error.message;
              } finally {
                return rtn;
              }
            };

            let result = await sanbox(fn, params);
            if (result && result.code) throw result;
            output = result;
          } catch (error) {
            output = response;
            if (error.msg) output.err.error = error.msg;
            else if (error.stack) output.err.error = error.stack;
            else if (error.message) output.err.error = error.message;
          } finally {
            return output;
          }
        };

        fetch = async (...args) => {
          const [params, obj, channel] = args;
          let _cachesess,
            _queue,
            _procnum,
            _proc = [],
            _url = new URL(params.originalUrl),
            _headers = params.headers ?? {},
            _staticserve = {},
            _result = [];

          let done = false;

          let cnt = {
            body: function (...args) {
              const [content, options] = args;
              return { content, options };
            },
            req: { raw: { headers: {} } },
            res: {
              locals: {},
              setHeader: function (...args) {
                return;
              },
              status: function (...args) {
                return this;
              },
              redirect: async function (...args) {
                const [req, res] = args;
                const { htmlstr } = req;
                intercomm.fire("deskredirect", ["data", htmlstr]);
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
              headers: {
                set: function (...args) {
                  const [params] = args;

                  return;
                },
              },
            },
            env: {
              incoming: {
                socket: {
                  remoteAddress: "::1",
                  remotePort:
                    Math.floor(Math.random() * (65536 - 10000 + 1)) + 10000,
                  remoteFamily: "IPv6",
                },
              },
            },
          };

          cnt.req.path = _url.pathname;
          cnt.req.method = params.method;
          cnt.req.query = () => {
            return params.query ?? {};
          };
          cnt.req.param = () => {
            return params.query ?? {};
          };
          cnt.req.json = () => {
            return params.body;
          };
          cnt.req.header = (...args) => {
            const [_header] = args;
            if (params.headers) return params.headers[_header];
            return;
          };
          cnt.req.text = () => {
            return;
          };
          cnt.req.raw.headers.get = (...args) => {
            const [params] = args;
            let output = null;
            if (_headers[params]) output = _headers[params];
            return output;
          };
          cnt.get = (...args) => {
            const [params] = args;
            let output = {};
            switch (params) {
              case "session":
                output.cache = _cachesess;
                break;
            }
            return output;
          };
          cnt.header = (...args) => {
            const [name, value, options] = args;
            return;
          };
          cnt.html = (...args) => {
            const [html, arg, headers] = args;
            switch (channel) {
              case "init":
                intercomm.fire("deskinit", ["data", html]);
                break;
            }
            return;
          };

          const next = async () => {
            let rtn = {};
            for (let i = _procnum + 1; i < _proc.length; i++) {
              let result;
              if (
                i + 1 == _proc.length &&
                Object.keys(_staticserve).length > 0
              ) {
                result = await this.inspector(_proc[i], _staticserve.value);
              } else result = await this.inspector(_proc[i], [cnt, next]);
              if (result) {
                if (result._session) _cachesess = result._session;
                rtn = result;
              }
            }
            done = true;
            return rtn;
          };

          _queue = Object.assign({}, this._useobj);
          for (let [key] of Object.entries(_queue)) {
            if (key != "*" && key != cnt.req.path) delete _queue[key];
            if (Object.keys(_staticserve).length == 0 && key.length > 1) {
              let fpath = key.replaceAll("*", "");
              let idx = cnt.req.path.indexOf(fpath);
              if (idx > -1)
                _staticserve = {
                  name: key,
                  value: [cnt.req.path, cnt, { net }],
                };
            }
          }
          if (Object.keys(_queue).length > 0) {
            for (let [key, val] of Object.entries(_queue)) {
              if (key == "*") {
                if (_proc.length == 0) _proc = val;
                else _proc = concatobj(val, val, _proc);
              } else {
                if (_proc.length == 0) _proc = val;
                else _proc = concatobj(_proc, _proc, val);
              }
            }
          }
          this._usearr.map((val) => {
            if (_proc.length == 0) _proc = val;
            else _proc = concatobj(_proc, _proc, val);
          });

          if (Object.keys(_staticserve).length > 0) {
            _proc.splice(-1, 1);
            _proc = concatobj(_proc, _proc, this._useobj[_staticserve.name]);
          }
          let result;
          for (let i = 0; i < _proc.length; i++) {
            _procnum = i;
            result = await this.inspector(_proc[i], [cnt, next]);
            if (result) {
              if (result._session) _cachesess = result._session;
              _result.push(result);
            }
            if (done) break;
          }
          return _result;
        };

        use = (...args) => {
          let obj,
            arr = [];
          for (let [key, val] of Object.entries(args)) {
            if (key == 0) {
              let dtype = typeof val;
              if (dtype == "string") {
                obj = val;
                this._useobj[obj] = [];
              } else if (dtype == "function") arr.push(val);
            } else {
              if (obj) this._useobj[obj].push(val);
              else arr.push(val);
            }
          }
          if (!obj) this._usearr.push(arr);
        };
      },
    };
  } catch (error) {}
};
