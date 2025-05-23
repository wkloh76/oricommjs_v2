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
 * The asistant of main module which is handle the submodule in each sub folder.
 * @module src_index
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    try {
      let reaction = await require("./reaction")(params, obj);
      let desktop = await require("./desktop")(params, obj);
      let autoupdate = await require("./updater")(params, obj);

      let lib = {},
        defaulturl = "";

      lib["register"] = (...args) => {
        let [oncomponents, compname, engine] = args;
        if (compname.indexOf(`${engine.type}_`) > -1) {
          reaction["register"](oncomponents);
          let [comp] = Object.values(oncomponents);
          if (defaulturl == "" && comp.defaulturl != "")
            defaulturl = comp.defaulturl;
        }
      };

      lib["start"] = async (...args) => {
        let [setting] = args;
        try {
          let rtn = await desktop.start(setting, { reaction, autoupdate });
          if (rtn) throw rtn;
          return;
        } catch (error) {
          return error;
        }
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
