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
module.exports = async (...args) => {
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
                this.onstatus(this.cseid, cmd, data);
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
          if (channel == "destroy") {
            for (let [idx, val] of Object.entries(
              _CSEClient[data.domain].queue
            )) {
              if (val == id) {
                _CSEClient[data.domain].queue.splice(parseInt(idx), 1);
                if (_CSEClient[data.domain].queue.length == 0)
                  delete _CSEClient[data.domain];
                break;
              }
            }
          }
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

    lib = await cse();
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
