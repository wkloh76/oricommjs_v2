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
        const { id, domain } = params;
        const stream = new ReadableStream({
          start(controller) {
            let timestamp = new Date().toISOString();
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
        const { cmd, domain, id, message } = params;
        if (_SSEClient[domain]) {
          const data = `data: ${JSON.stringify(params)}`;
          _SSEClient[domain].controller.enqueue(data);
          if (cmd == "destroy") emitter.emit("destroy", [domain, id]);
        }
      };

      const destroy = (...args) => {
        const [domain, id] = args;
        if (_SSEClient[domain]) {
          if (_SSEClient[domain].queue.include(id))
            _SSEClient[domain].queue = _SSEClient[domain].queue.filter(
              (queue) => queue !== id
            );

          if (_SSEClient[domain].queue.length == 0) {
            _SSEClient[domain].controller.destroy();
            delete _SSEClient[domain];
          }
        }
      };
     

      emitter.on("destroy", destroy);
      resolve({
        get count() {
          return Object.keys(_SSEClient).length;
        },
        message,
        SSEStream,
       
      });
    } catch (error) {
      reject(error);
    }
  });
};
