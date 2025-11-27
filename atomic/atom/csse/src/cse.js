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
 * A module which handle client side event listen
 * @module src_cse
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const { EventSource } = await import("eventsource");

    const [params, obj] = args;
    const [pathname, curdir] = params;
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

      resolve({
        get count() {
          return Object.keys(_CSEClient).length;
        },
        CSEStream,
      });
    } catch (error) {
      reject(error);
    }
  });
};
