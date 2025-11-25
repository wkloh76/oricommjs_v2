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
    const { errhandler, handler, sandbox } = utils;
    const { path } = sys;
    const { join } = path;

    try {
      let _CSEClient = {};
      class ClientSE {
        constructor(...args) {
          const [params] = args;
          const { param, cseurl } = params;
          const { id } = param;
          this.cseid = id;
          let searchurl = `?${new URLSearchParams(param).toString()}`;

          this.es = new EventSource(`${cseurl}${searchurl}`);
          return {
            onstatus: this.#status,
          };
        }

        proc() {
          this.es.onopen = () => {
            this.#status("Connect", "Success connect");
          };

          this.es.onmessage = async (event) => {
            const { func, ...data } = JSON.parse(event.data);
            if (func == "terminate") {
              this.es.close();
              this.#status("terminate");
            } else {
              let fn = this.obj[func];
              if (fn) await sandbox(fn, data);
              else this.#status("error", "Undefind function!");
            }
          };

          this.es.onerror = (error) => {
            this.#status("error", JSON.stringify(error));
          };
        }

        #status = (channel, data) => {
          return [this.cseid, channel, data];
        };
      }

      const CSEStatus = (...args) => {
        const [id, channel, data = ""] = args;
        if (channel == "terminate") delete _CSEClient[id];
        console.log(channel, ":", data);
      };

      const CSEStream = (...args) => {
        const [params] = args;
        const { csse } = params;
        const { csseid: id, domain, cseurl } = csse;
        let output = handler.dataformat;
        try {
          if (!_CSEClient[domain])
            _CSEClient[domain] = {
              sender: new ClientSE({
                param: { domain, id },
                cseurl,
              }),
              onstatus: CSEStatus,
              queue: [id],
              timestamp,
            };
          else {
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
        message: CSEStatus,
        CSEStream,
      });
    } catch (error) {
      reject(error);
    }
  });
};
