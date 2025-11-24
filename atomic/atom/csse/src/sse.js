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
 * A module which handle server side event
 * @module src_sse
 */
module.exports = async (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;

    try {
      let _SSEClient = {};

      const SSEStream = (...args) => {
        const [params] = args;
        const { id, domain, ...otherprm } = params;
        const stream = new ReadableStream({
          start(controller) {
            if (!_SSEClient[domain])
              _SSEClient[domain] = {
                controller,
                queue: [{ [id]: { ...otherprm } }],
              };
            else _SSEClient[domain].queue.push({ [id]: { ...otherprm } });

            // Send initial connection message
            const data = `data: ${JSON.stringify({
              type: "connected",
              message: "SSE connection established successfully",
              clientId: id,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(data);

            // 使用更兼容的方式处理连接关闭
            const cleanup = () => {
              delete _SSEClient[id];
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

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
          },
        });
      };

      const message = async (...args) => {
        const [params] = args;
        const { cmd, id, message } = params;
        if (_SSEClient[id]) {
          const data = `data: ${JSON.stringify(message)}`;
          _SSEClient[id].controller.enqueue(data);
          if (cmd == "destroy") emitter.emit("destroy", id);
        }
      };

      const destroy = (...args) => {
        const [params] = args;
        const { id } = params;
        if (_SSEClient[id]) {
          _SSEClient[id].controller.destroy();
          delete _SSEClient[id];
        }
      };
      const validate = (...args) => {
        const [params] = args;
        if (_SSEClient[params]) return true;
        return false;
      };

      emitter.on("destroy", destroy);
      resolve({
        get count() {
          return Object.keys(_SSEClient).length;
        },
        destroy,
        message,
        SSEStream,
        validate,
      });
    } catch (error) {
      reject(error);
    }
  });
};
