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
 * @module utils_csse
 */
module.exports = (...args) => {
  const [params, obj] = args;
  let lib = {};
  try {
    const cse = async () => {
      const { EventSource } = await import("eventsource");
      const [library, sys, cosetting] = obj;
      const { utils } = library;
      const { errhandler, handler } = utils;

      try {
        let _CSEClient = {};
        let message;
        class ClientSE {
          constructor(...args) {
            const [params, onstatus] = args;
            const { param, csseurl } = params;
            const { id } = param;
            this.cseid = id;
            this.onstatus = onstatus;
            let searchurl = `?${new URLSearchParams(param).toString()}`;

            this.es = new EventSource(`${csseurl}${searchurl}`);
            this.proc();
            return;
          }

          proc() {
            this.es.onopen = () => {
              this.#status("Connect", "Success connect");
            };

            this.es.onmessage = async (event) => {
              const { cmd, ...data } = JSON.parse(event.data);
              this.#status("message", data);
              if (cmd == "destroy") {
                this.es.close();
                this.#status("message", cmd);
              }
            };

            this.es.onerror = (error) => {
              this.#status("error", JSON.stringify(error));
            };
          }

          #status = (channel, data) => {
            this.onstatus(this.cseid, channel, data);
          };
        }

        let CSEStatus = (...args) => {
          const [id, channel, data = ""] = args;
          if (channel == "destroy") delete _CSEClient[id];
          if (message) message(...args);
        };

        const CSEStream = (...args) => {
          const [params, onstatus] = args;
          const { csse } = params;
          const { csseid: id, domain, csseurl } = csse;
          const timestamp = new Date().toISOString();
          let output = handler.dataformat;
          if (!message) message = onstatus;
          try {
            if (!_CSEClient[domain]) {
              let sender = new ClientSE(
                {
                  param: { domain, id },
                  csseurl,
                },
                CSEStatus
              );
              _CSEClient[domain] = {
                sender,
                queue: [id],
                timestamp,
              };
            } else {
              _CSEClient[domain].queue.push(id);
              _CSEClient[domain].timestamp = timestamp;
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        return {
          get count() {
            return Object.keys(_CSEClient).length;
          },
          CSEStream,
        };
      } catch (error) {
        return error;
      }
    };

    const sse = async () => {
      try {
        let _SSEClient = {};
        let awake_flag = false;
        let awake_timeout,
          _timer = 5 * 1000;

        const SSEStream = (...args) => {
          const [params] = args;
          const { id, domain } = params;
          const timestamp = new Date().toISOString();

          const stream = new ReadableStream({
            start(controller) {
              if (!_SSEClient[domain])
                _SSEClient[domain] = {
                  controller,
                  queue: [id],
                  timestamp,
                };
              else {
                _SSEClient[domain].queue.push(id);
                _SSEClient[domain].timestamp = timestamp;
              }
              if (!awake_flag) awake_flag = true;
              clearTimeout(awake_timeout);
              awake_timeout = setTimeout(heartbeat, _timer);
              // Send initial connection message
              const data = `data: ${JSON.stringify({
                type: "connected",
                message: "SSE connection established successfully",
                domain,
                clientId: id,
                timestamp,
              })}\n\n`;
              controller.enqueue(data);

              // 使用更兼容的方式处理连接关闭
              const cleanup = () => {
                delete _SSEClient[domain];
              };

              // 监听流结束事件
              controller.enqueue = new Proxy(controller.enqueue, {
                apply(target, thisArg, args) {
                  try {
                    return Reflect.apply(target, thisArg, args);
                  } catch (error) {
                    cleanup();
                  }
                },
              });
            },
            cancel() {
              console.log("SSE stream cancelled");
            },
          });
          return [
            stream,
            {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control",
              },
            },
          ];
        };

        const heartbeat = async () => {
          clearTimeout(awake_timeout);
          if (Object.keys(_SSEClient).length > 0) {
            for (let [k, v] of Object.entries(_SSEClient)) {
              let { controller } = v;
              if (controller) {
                let msg = {
                  cmd: "heartbeat",
                  domain: k,
                  message: "Still alive...with a strong heartbeat",
                  timestamp: new Date().toISOString(),
                };
                const data = `data: ${JSON.stringify(msg)}\n\n`;
                controller.enqueue(data);
              }
            }
            awake_timeout = setTimeout(heartbeat, _timer);
          } else awake_flag = false;
        };

        const message = async (...args) => {
          const [params] = args;
          const { cmd, domain, id } = params;
          if (_SSEClient[domain]) {
            let { controller } = _SSEClient[domain];
            if (controller) {
              const data = `data: ${JSON.stringify(params)}\n\n`;
              controller.enqueue(data);
              if (cmd == "destroy") emitter.emit("destroy", domain, id);
            }
          }
        };

        const destroy = (...args) => {
          const [domain, id] = args;
          if (_SSEClient[domain]) {
            if (_SSEClient[domain].queue.includes(id))
              _SSEClient[domain].queue = _SSEClient[domain].queue.filter(
                (queue) => queue !== id
              );

            if (_SSEClient[domain].queue.length == 0) delete _SSEClient[domain];
          }
        };

        emitter.on("destroy", destroy);
        return {
          get count() {
            return Object.keys(_SSEClient).length;
          },
          message,
          SSEStream,
        };
      } catch (error) {
        return error;
      }
    };

    lib = { cse, sse };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
