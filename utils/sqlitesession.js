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
      this.db = db;
      this.tableName = tableName;
      this.initTable();
    }

    async initTable() {
      try {
        await this.db.execute(
          `CREATE TABLE IF NOT EXISTS ${this.tableName} (id TEXT PRIMARY KEY, data TEXT)`
        );
      } catch (error) {
        console.error("Error initializing session table:", error);
      }
    }

    async getSessionById(sessionId) {
      try {
        const result = await this.db.execute({
          sql: `SELECT data FROM ${this.tableName} WHERE id = ?`,
          args: [sessionId],
        });

        if (result.rows.length === 0) return null;
        return JSON.parse(result.rows[0].data);
      } catch (error) {
        console.error("Error getting session:", error);
        return null;
      }
    }
    async createSession(sessionId, initialData) {
      try {
        await this.db.execute({
          sql: `INSERT INTO ${this.tableName} (id, data) VALUES (?, ?)`,
          args: [sessionId, JSON.stringify(initialData)],
        });
      } catch (error) {
        console.error("Error setting session:", error);
      }
    }
    async deleteSession(sessionId) {
      try {
        await this.db.execute({
          sql: `DELETE FROM ${this.tableName} WHERE id =?`,
          args: [sessionId],
        });
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
    async persistSessionData(sessionId, sessionData) {
      try {
        await this.db.execute({
          sql: `UPDATE ${this.tableName} SET data = ? WHERE id = ?`,
          args: [JSON.stringify(sessionData), sessionId],
        });
      } catch (error) {
        console.error("Error destroying session table:", error);
      }
    }
  },
};
