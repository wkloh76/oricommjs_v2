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
 * The submodule of utils which manage theproject startup initail process such as database connection
 * @module utils_startupinit
 */
module.exports = (...args) => {
  const [params, obj] = args;
  let lib = {};
  try {
    lib["sqlite3"] = async (...args) => {
      const [[setting, compname, restore = false], pathname, dbengine] = args;
      const [library, sys] = obj;
      const { errhandler, handler } = library.utils;
      const { join } = sys.path;
      let output = handler.dataformat;
      try {
        let err;
        let connection = {};
        for (let [kconconf, conconf] of Object.entries(setting.db)) {
          for (let [key, dbconf] of Object.entries(conconf)) {
            dbconf["engine"] = "sqlite3";
            dbconf["setting"] = setting;
            dbconf["dbgroup"] = kconconf;
            let register = await dbengine.register(dbconf, key, compname);
            if (register.code !== 0)
              err += `Unable establish ${key}.db3 database connection to ${dbconf["engine"]} server!`;
            else {
              let conn = await dbengine.connector(key, compname);
              if (conn.code != 0) err += conn.message;
              else {
                connection = { ...connection, ...conn.data };
                if (restore) {
                  if (!(await conn.data[key].ischema()))
                    conn.data[key].import(join(pathname, "data", `${key}.sql`));
                }
              }
            }
          }
        }
        if (err)
          throw {
            message: "Failure to create all database log files!",
            stack: err,
          };
        output.data = connection;
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib["mariadb"] = async (...args) => {
      const [[setting, compname, restore = false], pathname, dbengine] = args;
      const [library, sys] = obj;
      const { errhandler, handler } = library.utils;
      const { join } = sys.path;
      let output = handler.dataformat;
      try {
        let err;
        let connection = {};
        for (let [kconconf, conconf] of Object.entries(setting.db)) {
          for (let [key, dbconf] of Object.entries(conconf)) {
            dbconf["engine"] = "mariadb";
            dbconf["setting"] = setting;
            dbconf["dbgroup"] = kconconf;
            let register = await dbengine.register(dbconf, key, compname);
            if (register.code !== 0)
              err += `Unable establish ${key} database connection to ${dbconf["engine"]} server!`;
            else {
              let conn = await dbengine.connector(key, compname);
              if (conn.code != 0) err += conn.message;
              else {
                connection = { ...connection, ...conn.data };
                if (restore) {
                  if (!(await conn.data[key].ischema(key))) {
                    await conn.data[key].import(
                      join(pathname, "data", `${key}.sql`)
                    );
                    if (!(await conn.data[key].ischema(key)))
                      err += "Import database failure!";
                  }
                }
                connection[key].disconnect();
              }
            }
          }
        }
        if (err)
          throw {
            message: "Failure to create all database log files!",
            stack: err,
          };
        output.data = connection;
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
