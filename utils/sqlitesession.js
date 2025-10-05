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
      const [engine = "node", db, tableName = "sessions"] = args;
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

      this.engine = engine;
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
      try {
        let query, result;
        let statement = `SELECT sess FROM ${this.tableName} WHERE sid =$sid`;
        switch (this.engine) {
          case "node":
            query = this.db.prepare(statement);
            break;
          case "bun":
            query = this.db.query(statement);
            break;
        }
        result = query.get({ $sid: sessionId });
        if (result) {
          return JSON.parse(result.sess);
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error getting session:", error);
        return null;
      }
    }
    createSession(sessionId, initialData) {
      try {
        let sess = { ...this.dummyepxress, ...initialData };
        let query;

        let statement = `INSERT INTO ${this.tableName} (sid, sess, expire) VALUES ($id, $data,$expire)`;
        sess.cookie.expires = initialData["_expire"];
        switch (this.engine) {
          case "node":
            query = this.db.prepare(statement);
            break;
          case "bun":
            query = this.db.query(statement);
            break;
        }
        query.run({
          $id: sessionId,
          $data: JSON.stringify(initialData),
          $expire: initialData["_expire"] || "",
        });
      } catch (error) {
        console.error("Error setting session:", error);
      }
    }
    deleteSession(sessionId) {
      try {
        let query, result;
        let statement = `DELETE FROM ${this.tableName} WHERE sid = $sid`;
        switch (this.engine) {
          case "node":
            query = this.db.prepare(statement);
            break;
          case "bun":
            query = this.db.query(statement);
            break;
        }
        query.run({ $sid: sessionId });
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
    persistSessionData(sessionId, sessionData) {
      try {
        let sess = { ...this.dummyepxress, ...sessionData };
        let query, result;
        let statement = `UPDATE ${this.tableName} SET sess = $data, expire = $expire WHERE sid = $sid`;
        sess.cookie.expires = sessionData["_expire"];
        switch (this.engine) {
          case "node":
            query = this.db.prepare(statement);
            break;
          case "bun":
            query = this.db.query(statement);
            break;
        }
        query.run({
          $sid: sessionId,
          $data: JSON.stringify(sessionData),
          $expire: sessionData["_expire"] || "",
        });
      } catch (error) {
        console.error("Error destroying session table:", error);
      }
    }
  },
};
