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
 * Submodule handles http/https session storage
 * in sqlite format work with @libsql/client module
 * @module utils_sqlitesession
 */
module.exports = {
  SqliteStore: class {
    constructor(...args) {
      const [db, tableName = "sessions"] = args;
      Object.defineProperty(this, "db", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0,
      });
      Object.defineProperty(this, "tableName", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: void 0,
      });
      this.dummyepxress = {
        cookie: {
          originalMaxAge: 1800000,
          expires: "",
          secure: false,
          httpOnly: true,
          path: "/",
        },
      };

      this.db = db;
      this.tableName = tableName;
      this.initTable();
    }

    async initTable() {
      try {
        await this.db.exec(
          `CREATE TABLE IF NOT EXISTS ${this.tableName} (sid TEXT PRIMARY KEY,sess JSON, expire TEXT)`
        ); // "options" JSON NOT NULL,
      } catch (error) {
        console.error("Error initializing session table:", error);
      }
    }

    getSessionById(sessionId) {
      let output = null;
      try {
        let statement = `SELECT sess FROM ${this.tableName} WHERE sid =$sid`;
        let query = this.db.prepare(statement);
        let result = query.get({ sid: sessionId });
        if (result) output = JSON.parse(result.sess);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        return output;
      }
    }
    createSession(sessionId, initialData) {
      let output;
      try {
        let sess = { ...this.dummyepxress, ...initialData };
        sess.cookie.expires = initialData["_expire"];
        let statement = `INSERT INTO ${this.tableName} (sid, sess, expire) VALUES ($sid, $data,$expire)`;
        let query = this.db.prepare(statement);
        query.run({
          sid: sessionId,
          data: JSON.stringify(initialData),
          expire: initialData["_expire"] || "",
        });
        console.log("asda");
      } catch (error) {
        console.log(error);
        console.error("Error setting session:", error);
      } finally {
        return output;
      }
    }
    deleteSession(sessionId) {
      let output;
      try {
        let statement = `DELETE FROM ${this.tableName} WHERE sid = $sid`;
        let query = this.db.prepare(statement);
        query.run({ sid: sessionId });
      } catch (error) {
        console.log(error);
        console.error("Error deleting session:", error);
      } finally {
        return output;
      }
    }
    persistSessionData(sessionId, sessionData) {
      let output;
      try {
        let sess = { ...this.dummyepxress, ...sessionData };
        sess.cookie.expires = sessionData["_expire"];
        let statement = `UPDATE ${this.tableName} SET sess = $data, expire = $expire WHERE sid = $sid`;
        let query = this.db.prepare(statement);
        query.run({
          sid: sessionId,
          data: JSON.stringify(sessionData),
          expire: sessionData["_expire"] || "",
        });
      } catch (error) {
        console.error("Error destroying session table:", error);
      } finally {
        return output;
      }
    }
  },
};
