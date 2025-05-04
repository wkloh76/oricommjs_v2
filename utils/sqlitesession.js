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
 * The submodule of utils
 * @module utils_powershell
 */
"use strict";
/**
 * Submodule handles http/https session storage
 * in sqlite format work with @libsql/client module
 * @module utils_sqlitesession
 */
module.exports = {
  SqliteStore: class {
    constructor(db, tableName = "sessions") {
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
        await this.db.execute(
          `CREATE TABLE IF NOT EXISTS ${this.tableName} (sid TEXT PRIMARY KEY,sess JSON, expire TEXT)`
        ); // "options" JSON NOT NULL,
      } catch (error) {
        console.error("Error initializing session table:", error);
      }
    }

    async getSessionById(sessionId) {
      try {
        const result = await this.db.execute({
          sql: `SELECT sess FROM ${this.tableName} WHERE sid = ?`,
          args: [sessionId],
        });

        if (result.rows.length === 0) return null;
        return JSON.parse(result.rows[0].sess);
      } catch (error) {
        console.error("Error getting session:", error);
        return null;
      }
    }
    async createSession(sessionId, initialData) {
      try {
        let sess = { ...this.dummyepxress, ...initialData };
        sess.cookie.expires = initialData["_expire"];
        await this.db.execute({
          sql: `INSERT INTO ${this.tableName} (sid, sess, expire) VALUES (?, ?, ?)`,
          args: [sessionId, JSON.stringify(sess), initialData["_expire"] || ""],
        });
      } catch (error) {
        console.error("Error setting session:", error);
      }
    }
    async deleteSession(sessionId) {
      try {
        await this.db.execute({
          sql: `DELETE FROM ${this.tableName} WHERE sid =?`,
          args: [sessionId],
        });
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
    async persistSessionData(sessionId, sessionData) {
      try {
        let sess = { ...this.dummyepxress, ...sessionData };
        sess.cookie.expires = sessionData["_expire"];
        await this.db.execute({
          sql: `UPDATE ${this.tableName} SET sess = ?, expire = ? WHERE sid = ?`,
          args: [JSON.stringify(sess), sessionData["_expire"] || "", sessionId],
        });
      } catch (error) {
        console.error("Error destroying session table:", error);
      }
    }
  },
};
