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
 * A module which handle all transaction wih sqlite3 database
 * @module src_sqlite3
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { datatype, errhandler, handler, powershell } = library.utils;
    const { dayjs, logger, fs, path, pino } = sys;

    let sqlite3,
      prm = [];
    if (cosetting.args.engine == "webbunjs") {
      const { Database } = require("bun:sqlite");
      sqlite3 = Database;
      prm.push({ strict: true });
    } else {
      const { DatabaseSync } = require("node:sqlite");
      sqlite3 = DatabaseSync;
    }

    try {
      let conn = {};
      let lib = {};
      let sqlmanager;
      let registered = {};

      class clsSQLiteDB {
        constructor(connection, dbname, log) {
          if (!connection)
            throw {
              message: "Connection arguments undefined!",
              stack:
                " Arguments undefined cause clsSQLiteDB rejection the instance class request !.",
            };
          else {
            this._conn = connection;
            this._dbname = dbname;
            this._log = log;

            return {
              dboption: this.dboption,
              rules: this.rules,
              ischema: this.ischema,
              query: this.query,
              import: this.import,
            };
          }
        }

        #rules = {
          transaction: false,
          queryone: false,
        };

        #dboption = {
          rowsAsArray: false,
        };

        /**
         * Proeduce the sql statement to database with transaction
         * @alias module:sqlite3.clsSQLiteDB.trans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        trans = (...args) => {
          let [statements, opt] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let query = this._conn.prepare(statement.sql);
              let beginTransaction;
              switch (statement.type) {
                case "INSERT":
                  if (statement.value) {
                    beginTransaction = this._conn.transaction((data) => {
                      let result = { changes: 0, lastInsertRowid: 0 };
                      for (const value of statement.value) {
                        let rtn = query.run(value);
                        result.changes += rtn.changes;
                        result.lastInsertRowid = rtn.lastInsertRowid;
                      }
                      return result;
                    });
                    output.data.push(beginTransaction(statement.value));
                  } else {
                    beginTransaction = this._conn.transaction(() => {
                      return query.run();
                    });
                    output.data.push(beginTransaction());
                  }
                  break;
                case "UPDATE":
                  beginTransaction = this._conn.transaction(() => {
                    return query.run();
                  });
                  output.data.push(beginTransaction());
                  break;
                case "DELETE":
                  beginTransaction = this._conn.transaction(() => {
                    return query.run();
                  });
                  output.data.push(beginTransaction());
                  break;
                case "SELECT":
                  beginTransaction = this._conn.transaction(() => {
                    return query.all();
                  });
                  output.data.push(beginTransaction());
                  break;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Proeduce the sql statement to database without transaction
         * @alias module:sqlite3.clsSQLiteDB.notrans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        notrans = (...args) => {
          let [statements, opt] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let query = this._conn.prepare(statement.sql);
              this._log.info(statement.sql);
              switch (statement.type) {
                case "INSERT":
                  output.data.push(query.run());
                  break;
                case "UPDATE":
                  output.data.push(query.run());
                  break;
                case "DELETE":
                  output.data.push(query.run());
                  break;
                case "SELECT":
                  output.data.push(query.all());
                  break;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Set a limit 1 into the sql statement and return a row of data(Only for SELECT enquiry)
         * @alias module:sqlite3.clsSQLiteDB.prepare_queryone
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is an array of value in sql statement format.
         */
        prepare_queryone = (...args) => {
          let [sql] = args;
          let output = [];
          for (let prepare of sql) {
            let tempsql = prepare.sql.toUpperCase();
            let limit = tempsql.indexOf("LIMIT");
            if (tempsql.indexOf("SELECT") > -1 && limit == -1) {
              let lastIndexOf = prepare.sql.lastIndexOf(";");
              if (lastIndexOf > -1)
                prepare.sql =
                  prepare.sql.substring(0, lastIndexOf) + " LIMIT 1;";
              else prepare.sql = prepare.sql + " LIMIT 1;";
            }
            output.push(prepare);
          }
          return output;
        };

        /**
         * Getter the dboption default value
         * @type {Object}
         * @memberof module:sqlite3.clsSQLiteDB.property.dboption
         * @instance
         */
        get dboption() {
          return structuredClone(this.#dboption);
        }

        /**
         * Getter the rules default value
         * @type {Object}
         * @memberof module:sqlite3.clsSQLiteDB.property.rules
         * @instance
         */
        get rules() {
          return structuredClone(this.#rules);
        }

        /**
         * Check SQLite3 database is exist
         * @alias module:sqlite3.clsSQLiteDB.isschema
         * @param {...Object} args - 1 parameters
         * @returns {Boolean} - Return true/false
         */
        ischema = (...args) => {
          let [dbname] = args;
          let output = false;
          try {
            let query = this._conn
              .prepare(
                "SELECT COUNT(name) AS counter FROM sqlite_master WHERE type='table';"
              )
              .get();
            if (query.counter > 0) output = true;
          } catch (error) {
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * SQLite3 database executionn sql statement
         * @alias module:sqlite3.clsSQLiteDB.query
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is array value which and each content in sql statement format
         * @param {Object} args[1] - cond is an object value refer to rules setting
         * @param {Object} args[2] - opt is an object value of mariadb module query method options and refer to dboption setting
         * @returns {Object} - Return database result in  object type
         */
        query = (...args) => {
          let [sql, cond, opt] = args;
          let output = handler.dataformat;
          try {
            if (!cond) cond = this.rules;
            if (!opt) opt = this.dboption;
            let result;
            if (datatype(sql) != "array") {
              throw {
                code: 10005,
                msg: "The sql parameter is not the array data type! Reject query request.",
              };
            }
            for (let suspect of sql) {
              if (datatype(suspect.sql) !== "string")
                throw {
                  code: 10006,
                  msg: "The sql statement is not the string type! Reject query request.",
                };
            }
            if (cond.queryone) sql = this.prepare_queryone(sql);
            if (cond.transaction) {
              result = this.trans(sql, opt);
            } else {
              result = this.notrans(sql, opt);
            }

            if (result.code == 0) output.data = [...result.data];
            else throw result;
          } catch (error) {
            output = errhandler(error);
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * Imposrt SQLite3 database base on sql file format
         * @alias module:sqlite3.clsSQLiteDB.import
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - file is the sql file location
         * @returns {Object} - Return object value which content both connection and schema status
         */
        import = (...args) => {
          let [file] = args;
          let output = handler.dataformat;
          try {
            if (fs.existsSync(file)) {
              let sql = fs.readFileSync(file, "utf8");
              this._conn.exec(sql);
            } else {
              output.code = 10001;
              output.msg = "Cannot found the file for impoort!";
            }
          } catch (error) {
            output.code = 10002;
            output.msg = "SQLite3 import failure:SQL file format wrong!";
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };
      }

      /**
       * Establish SQLite3 database connection or create database if no exist
       * @alias module:sqlite3.connect
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - log is logger which will save sql prepare statement into log file
       * @param {String} args[1] - db is db engine
       * @param {String} args[2] - dbname is db onnection name base on coresetting.ongoing
       * @returns {Object} - Return object value which content process status
       */
      const connect = (...args) => {
        let [dbname, compname, log] = args;
        let output = handler.dataformat;
        try {
          if (registered[compname][dbname]) {
            let db = registered[compname][dbname];
            let rtn;
            let logpath = db.path;
            if (db.path == "")
              logpath = path.join(
                cosetting.logpath,
                db.engine,
                `${dbname}.db3`
              );
            else logpath = path.join(db.path, db.engine, `${dbname}.db3`);
            let prm = [];
            if (db.type == "file") {
              if (prm.length == 0) prm = [logpath];
              else prm = [logpath, ...prm];
            } else {
              if (prm.length == 0) prm = [":memory:"];
              else prm = [":memory:", ...prm];
            }

            rtn = new sqlite3(...prm);
            if (!rtn)
              throw {
                message: "newschema execution failure!",
                stack: " newschema execution failure! libsql return undefind.",
              };

            output.data = new clsSQLiteDB(rtn, dbname, log);

            if (!conn[dbname]) conn[dbname] = output.data;
          }
          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * Datalogger which will allow to keep every sql query statement into the log file
       * @alias module:sqlite3.setuplog
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - log is an object value in log file setting parameters
       * @param {Object} args[1] - db is an object value for database parameters
       * @param {String} args[2] - dbname is database connection name
       * @returns {Object} - Return logger module in object type
       */
      const setuplog = async (...args) => {
        const [log, db, dbname] = args;
        const { engine, path: logdir } = db;
        try {
          let output = handler.dataformat;
          let logpath = logdir;
          if (logdir == "") logpath = path.join(cosetting.logpath, engine);
          else logpath = path.join(logdir, engine, "log", dbname);
          await powershell.shell(`mkdir -p ${logpath}`);

          let tmplog = { ...log };
          tmplog.symlink = db.symlink;

          // 创建 Pino 日志记录器并配置轮转
          output.data = pino({
            level: "info",
            transport: {
              target: "pino-roll",
              options: {
                file: path.join(logpath, `${dbname}.log`),
                ...tmplog,
              },
            },
            // 添加时间戳
            timestamp: () =>
              `,"time":"${dayjs().format("YYYY-MM-DD HH:mm:ss")}"`,
            // 自定义日志格式
            formatters: {
              level: (label) => {
                return { level: label };
              },
            },
          });

          return output;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * Register database pre-connection to the engine by on coresetting.toml defination
       * @alias module:sqlite3.register
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - db is an object type of mariadb database connection setting
       * @param {String} args[1] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[2] - compname is the components project naming
       * @returns {Object} - Return object value which content process status
       */
      lib["register"] = async (...args) => {
        const [db, dbname, compname] = args;
        const { setting, ...config } = db;
        let output = handler.dataformat;
        try {
          if (!registered[compname]) {
            registered[compname] = {};
          }

          if (!registered[compname][dbname]) {
            let { setting: noused, ...dbsetting } =
              setting.db[config.dbgroup][dbname];
            registered[compname][dbname] = dbsetting;
          }

          if (registered[compname][dbname]) {
            let log = await setuplog(setting.log, config, dbname);
            let rtn = connect(dbname, compname, log.data);
            if (rtn.code == 0) registered[compname][dbname] = rtn.data;
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Establish databas connection base on registered setting
       * @alias module:sqlite3.connector
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[1] - compname is the components project naming
       * @returns {Object} - Return value in object type which embed db connection module
       */
      lib["connector"] = (...args) => {
        let [dbname, compname] = args;
        let output = handler.dataformat;
        try {
          let dbarr = Object.keys(registered[compname]);
          if (!dbarr.includes(dbname)) {
            if (registered[compname][dbname]) {
              if (!output.data) output.data = {};
              let rtn = connect(key, compname);
              if (rtn.code == 0) output.data[key] = rtn.data;
            } else
              throw {
                code: 10004,
                msg: "Unmatching database connection name compare with coresetting.ongoiong setting!",
              };
          } else {
            if (!output.data) output.data = {};
            if (conn[dbname]) output.data[dbname] = conn[dbname];
            else {
              let rtn = connect(dbname, compname);
              if (rtn.code == 0) output.data[dbname] = rtn.data;
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Destroy the deactive connection Id in the module cache
       * @alias module:sqlite3.terminator
       * @param {...Object} args - 1 parameter
       *  @param {Integer} args[0] - threadId database connection Id.
       * @returns {Null} - Return null
       */
      lib["terminator"] = (...args) => {
        let [dbname] = args;
        if (conn[dbname]) delete conn[dbname];
        return;
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
