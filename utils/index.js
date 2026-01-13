/**
 * Copyright (c) 2024   Loh Wah Kiang
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
 * THe main module of utils
 * @module utils_index
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    let [params, obj] = args;
    let [library] = obj;

    try {
      library.utils = { jptr: (await import(`./jspointer.js`)).default };
      library.utils = { ...library.utils, ...require("./utils")(params, obj) };
      library.utils["handler"] = require("./handler")(params, obj);
      library.utils["smfetch"] = require("./smfetch")(params, obj);

      library.utils["CSE"] = await require("./cse")(params, obj);
      library.utils["SSE"] = await require("./sse")(params, obj);
      library.utils["giteapi"] = require("./giteapi")(params, obj);
      library.utils["intercomm"] = require("./intercomm")(params, obj);
      library.utils["io"] = require("./io")(params, obj);
      library.utils["powershell"] = require("./powershell")(params, obj);
      library.utils["sqlitesession"] = require("./sqlitesession");
      library.utils["startupinit"] = require("./startupinit")(params, obj);
      library.utils["excluded"] = [
        "CSE",
        "giteapi",
        "intercomm",
        "io",
        "powershell",
        "sqlitesession",
        "SSE",
        "startupinit",
        "excluded",
      ];

      resolve(library.utils);
    } catch (error) {
      reject(error);
    }
  });
};
