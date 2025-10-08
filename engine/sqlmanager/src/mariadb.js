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
 * A module which handle all transaction wih mariadb/mysql database
 * @module src_mariadb
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { datatype, errhandler, handler, powershell } = library.utils;
    const { dayjs, fs, path, pino } = sys;
    const mariadb = require("mariadb");

    try {
      let conn = {};
      let lib = {};
      let sqlmanager;
      let dblog = {};
      let registered = {};
      let conncount = 0;

      class clsMariaDB {
        constructor(...args) {
          const [connection, obj, log] = args;
          if (!connection)
            throw {
              message: "Connection arguments undefined!",
              stack:
                " Arguments undefined cause clsMariaDB rejection the instance class request !.",
            };
          else {
            this._conn = connection;
            this._pool = obj.pool;
            this._terminator = obj.terminator;
            this._dbinfo = obj.dbinfo;
            this._log = log;
            this._conname = obj.conname;
            this._threadId = 0;

            return (async () => {
              if (this._pool) {
                let dbcon = await this._conn.getConnection();
                this._threadId = dbcon.threadId;
                dbcon.release();
              } else this._threadId = this._conn.threadId;
              return {
                dboption: this.dboption,
                rules: this.rules,
                threadId: this._threadId,
                ischema: this.ischema,
                query: this.query,
                import: this.import,
                disconnect: this.disconnect,
              };
            })();
          }
        }

        #rules = {
          transaction: false,
          queryone: false,
          debug: false,
        };

        #dboption = {
          timeout: 30000,
          namedPlaceholders: false,
          rowsAsArray: false,
          metaAsArray: true,
          nestTables: false,
          dateStrings: true,
          bigIntAsNumber: true,
          decimalAsNumber: false,
        };

        conhandler = async (...args) => {
          const [query] = args;
          let output;
          if (this._pool) {
            let dbcon = await this._conn.getConnection();
            this._threadId = dbcon.threadId;
            output = await dbcon.query(query);
            dbcon.release();
          } else output = await this._conn.query(query);
          return output;
        };

        /**
         * Proeduce the sql statement to database with transaction
         * @alias module:mariadb.clsMariaDB.trans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        trans = async (...args) => {
          let [statements, opt, cond] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let sqlstatement;
              if (statement.sql instanceof Function) {
                let data = output.data[output.data.length - 1];
                sqlstatement = await statement.sql(data);
              } else sqlstatement = statement.sql;
              let query = { sql: sqlstatement, ...opt };
              this._log.info(sqlstatement);
              let result, rows;
              switch (statement.type) {
                case "INSERT":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
                case "UPDATE":
                  let strict_cond = query.sql.toUpperCase().indexOf("WHERE");
                  if (strict_cond == -1) {
                    result = [
                      {
                        code: 10007,
                        msg: "Without where codition may cause entire database data overwrite!",
                      },
                    ];
                    output.code = 10007;
                  } else {
                    rows = await this.conhandler(query);
                    // rows = await this._conn.query(query);
                    result = rows[0];
                  }
                  break;
                case "DELETE":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
                case "SELECT":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
              }
              if (result) {
                if (datatype(result) == "object") {
                  let fmt = { changes: 0, lastInsertRowid: 0 };
                  if (result.affectedRows) fmt.changes = result.affectedRows;
                  if (result.insertId)
                    fmt.lastInsertRowid = Number(result.insertId);
                  output.data.push(fmt);
                } else output.data.push(result);
              }
            }
            if (cond.debug) await this._conn.rollback();
            else await this._conn.commit();
          } catch (error) {
            await this._conn.rollback();
            output = errhandler(error);
          } finally {
            return output;
          }
        };

        /**
         * Proeduce the sql statement to database without transaction
         * @alias module:mariadb.clsMariaDB.notrans
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - statement is string data in sql statement format.
         */
        notrans = async (...args) => {
          let [statements, opt] = args;
          let output = handler.dataformat;
          try {
            output.data = [];
            for (let statement of statements) {
              let query = { sql: statement.sql, ...opt };
              this._log.info(statement.sql);
              let result, rows;
              switch (statement.type) {
                case "INSERT":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
                case "UPDATE":
                  let strict_cond = query.sql.toUpperCase().indexOf("WHERE");
                  if (strict_cond == -1) {
                    result = [
                      {
                        code: 10007,
                        msg: "Without where codition may cause entire database data overwrite!",
                      },
                    ];
                    output.code = 10007;
                  } else {
                    rows = await this.conhandler(query);
                    // rows = await this._conn.query(query);
                    result = rows[0];
                  }
                  break;
                case "DELETE":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
                case "SELECT":
                  rows = await this.conhandler(query);
                  // rows = await this._conn.query(query);
                  result = rows[0];
                  break;
              }
              if (result) {
                if (datatype(result) == "object") {
                  let fmt = { changes: 0, lastInsertRowid: 0 };
                  if (result.affectedRows) fmt.changes = result.affectedRows;
                  if (result.insertId)
                    fmt.lastInsertRowid = Number(result.insertId);
                  output.data.push(fmt);
                } else output.data.push(result);
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
         * @alias module:mariadb.clsMariaDB.prepare_queryone
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
         * @memberof module:mariadb.clsMariaDB.property.dboption
         * @instance
         */
        get dboption() {
          return structuredClone(this.#dboption);
        }

        /**
         * Getter the rules default value
         * @type {Object}
         * @memberof module:mariadb.clsMariaDB.property.rules
         * @instance
         */
        get rules() {
          return structuredClone(this.#rules);
        }

        /**
         * Disconnect connection
         * @alias module:mariadb.clsMariaDB.disconnect
         * @param {...Object} args - 1 parameter
         * @returns {Null} - Return null
         */
        disconnect = async (...args) => {
          if (!this._pool) {
            await this._conn.end();
            await this._conn.destroy();
            this._log.info(
              ` Connection id ${this._conn.threadId} below ${this._conname} is disconneted!`
            );
            this._terminator(this._conname);
          }
          return;
        };

        /**
         * Check SQLite3 database is exist
         * @alias module:mariadb.clsMariaDB.ischema
         * @param {...Object} args - 1 parameters
         * @returns {Boolean} - Return true/false
         */
        ischema = async (...args) => {
          let [dbname] = args;
          let output = false;
          try {
            let statement = {
              sql: `SELECT COUNT(table_name) AS counter FROM information_schema.tables WHERE table_schema='${dbname}' 
              AND table_type = 'BASE TABLE' AND table_schema not in ('information_schema','mysql','performance_schema','sys');`,
              ...this.dboption,
            };
            let [rows] = await this._conn.query(statement);
            if (rows[0].counter > 0) output = true;
          } catch (error) {
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * Mariadb general query enquiry work with db options setting and some of rules condition
         * @alias module:mariadb.clsMariaDB.query
         * @param {...Object} args - 1 parameters
         * @param {Object} args[0] - sql is array value which and each content in sql statement format
         * @param {Object} args[1] - cond is an object value refer to rules setting
         * @param {Object} args[2] - opt is an object value of mariadb module query method options and refer to dboption setting
         * @returns {Object} - Return database result in  object type
         */
        query = async (...args) => {
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
              let isfn = suspect.sql instanceof Function;
              if (datatype(suspect.sql) !== "string" && !isfn)
                throw {
                  code: 10006,
                  msg: "The sql statement is not the string type! Reject query request.",
                };
            }
            if (cond.queryone) sql = this.prepare_queryone(sql);
            if (cond.transaction) await this._conn.beginTransaction();
            if (cond.transaction) {
              result = await this.trans(sql, opt, cond);
            } else {
              result = await this.notrans(sql, opt);
            }
            if (result.code == 0) output.data = [...result.data];
            else throw result;
          } catch (error) {
            let { code, data } = error;
            if (code && data) output = error;
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };

        /**
         * Imposrt SQLite3 database base on sql file format
         * @alias module:mariadb.clsMariaDB.import
         * @param {...Object} args - 1 parameters
         * @param {String} args[0] - file is the sql file location
         * @returns {Object} - Return object value which content both connection and schema status
         */
        import = async (...args) => {
          let [file] = args;
          let output = handler.dataformat;
          try {
            if (fs.existsSync(file)) {
              let { host, port, user, password } = this._dbinfo;
              await mariadb.importFile({
                host,
                port,
                user,
                password,
                database: "mysql",
                file,
              });
            } else {
              output.code = 10001;
              output.msg = "Cannot found the file for impoort!";
            }
          } catch (error) {
            output.code = 10002;
            output.msg = "MariaDB import failure:SQL file format wrong!";
            sqlmanager.errlog(error);
          } finally {
            return output;
          }
        };
      }

      /**
       * Register database pre-connection to the engine by on coresetting.toml defination
       * @alias module:mariadb.connect
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - db is an object type of mariadb database connection setting
       * @param {String} args[1] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[2] - compname is the components project naming
       * @returns {Object} - Return object value which content process status
       */
      const connect = async (...args) => {
        let [dbname, compname, log] = args;
        let output = handler.dataformat;
        try {
          if (registered[compname][dbname]) {
            if (!conn[`${compname}_${dbname}`]) {
              let rtn;
              let { pool, symlink, ...conopt } = registered[compname][dbname];
              if (pool) rtn = await mariadb.createPool(conopt);
              else rtn = await mariadb.createConnection(conopt);
              if (!rtn)
                throw {
                  message: "Mariadb database connenction establish failure!",
                  stack:
                    " newschema execution failure!mariadb return undefind.",
                };

              conncount += 1;
              output.data = await new clsMariaDB(
                rtn,
                {
                  pool,
                  conname: `${compname}_${dbname}`,
                  dbinfo: registered[compname][dbname],
                  terminator: lib["terminator"],
                },
                log
              );
              conn[`${compname}_${dbname}`] = output.data;
            } else output.data = conn[`${compname}_${dbname}`];
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Datalogger which will allow to keep every sql query statement into the log file
       * @alias module:mariadb.setuplog
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
       * @alias module:mariadb.register
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
            dblog = log.data;
            let rtn = await connect(dbname, compname, dblog);
            if (!rtn.code == 0) {
              delete registered[compname][dbname];
              throw rtn;
            } else await rtn.data.disconnect();
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Establish databas connection base on registered setting
       * @alias module:mariadb.connector
       * @param {...Object} args - 1 parameters
       * @param {String} args[0] - dbname is db onnection name base on coresetting.ongoing
       * @param {String} args[1] - compname is the components project naming
       * @returns {Object} - Return value in object type which embed db connection module
       */
      lib["connector"] = (...args) => {
        return new Promise(async (resolve) => {
          let [dbname, compname] = args;
          let output = handler.dataformat;
          try {
            let dbarr = Object.keys(registered[compname]);
            if (!dbarr.includes(dbname)) {
              if (registered[compname][dbname]) {
                if (!output.data) output.data = {};
                let rtn = await connect(key, compname, dblog);
                if (rtn.code == 0) output.data[key] = rtn.data;
              } else
                throw {
                  code: 10004,
                  msg: "Unmatching database connection name compare with coresetting.ongoiong setting!",
                };
            } else {
              let rtn = await connect(dbname, compname, dblog);
              if (rtn.code == 0) {
                output.data = {};
                output.data[dbname] = rtn.data;
              }
            }
          } catch (error) {
            output = errhandler(error);
          } finally {
            resolve(output);
          }
        });
      };

      /**
       * Destroy the deactive connection Id in the module cache
       * @alias module:mariadb.terminator
       * @param {...Object} args - 1 parameter
       *  @param {Integer} args[0] - threadId database connection Id.
       * @returns {Null} - Return null
       */
      lib["terminator"] = async (...args) => {
        let [threadId] = args;
        if (conn[threadId]) {
          delete conn[threadId];
          conncount -= 1;
        }
        return;
      };

      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
