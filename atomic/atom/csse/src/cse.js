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
          const [params, obj] = args;
          const { param, url } = params;
          const { id } = param;
          this.obj = obj;
          this.cseid = id;
          let searchurl = `?${new URLSearchParams(param).toString()}`;

          this.es = new EventSource(`${url}${searchurl}`);
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
        const { cseurl: url, ...param } = csse;
        let output = handler.dataformat;
        try {
          _CSEClient[param.id] = new ClientSE({ param, url }, obj);
          _CSEClient[param.id].onstatus = CSEStatus;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      const message = async (...args) => {
        const [params] = args;
        const { cmd, id, message } = params;
        if (_CSEClient[id]) {
          const data = `data: ${JSON.stringify(message)}`;
          _CSEClient[id].controller.enqueue(data);
          if (cmd == "destroy") emitter.emit("destroy", id);
        }
      };

      const destroy = (...args) => {
        const [params] = args;
        const { id } = params;
        if (_CSEClient[id]) {
          _CSEClient[id].controller.destroy();
          delete _CSEClient[id];
        }
      };
      const validate = (...args) => {
        const [params] = args;
        if (_CSEClient[params]) return true;
        return false;
      };

      resolve({
        get count() {
          return Object.keys(_CSEClient).length;
        },
        destroy,
        message,
        CSEStream,
        validate,
      });
    } catch (error) {
      reject(error);
    }
  });
};
