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
 * The submodule of auto update execute program
 * @module src__desktop_session
 */
module.exports = (...args) => {
  const crypto = require("crypto");
  const { session } = require("electron");

  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const { dayjs, logerr: logerror } = sys;

  try {
    class sessionMiddleware {
      constructor(...args) {
        const [params, sess] = args;
        const {
          // autoExtendExpiration = true,
          // cookieOptions,
          // encryptionKey,
          // expireAfterSeconds,
          // sessionCookieName = "session",
          store,
        } = params;
        this._db = store;
        this._sess = sess;
        this._sessconf = params;
        this._id;
        this._sessid = {};
        this._initialData = {
          _accessed: null,
          _data: {},
          _delete: false,
          _expire: null,
        };
        this._timeout;
        this._timer = 60000;
        this.init();

        return {
          Session: this.checkSession,
          Expired: this.checkExpire,
          Clear: this.clearSession,
        };
      }

      async autoexpired(...args) {
        const [obj, tm] = args;
        await obj();
        clearTimeout(tm);
        tm = setTimeout(await this.autoexpired(obj, tm), tm);
        return;
      }

      async init() {
        this._id = crypto.randomUUID();
        let sid = this._db.getSessionById(this._id);
        if (sid == null) {
          this._db.createSession(this._id, this._initialData);
          let cookiedata = this.initcookie(this._id);
          await this.createSession(cookiedata);
        }
        this._timeout = setTimeout(
          await this.autoexpired(this.checkExpire, this._timeout),
          this._timer
        );
        return;
      }

      checkSession = async (...args) => {
        let [req] = args;
        try {
          let name = this._sessconf.cookieOptions.name;
          let curdt = dayjs().valueOf();
          let cookiedata = this.initcookie(this._id);
          let sess = await this.getSession({ name });
          let dbsess = this._db.getSessionById(this._id);
          let svalue = this._initialData;
          let dbvalue = this._initialData;
          let timestamp = this._sessconf.expireAfterSeconds * 1000 + curdt;
          let _accessed = dayjs(curdt).toISOString();
          let _expire = dayjs(timestamp).toISOString();
          let value = JSON.parse(cookiedata.value);
          let _data = {};

          if (sess) svalue = JSON.parse(sess.value);
          if (dbsess) dbvalue = dbsess;
          if (req.session) {
            if (
              JSON.stringify(value._data) != JSON.stringify(req.session._data)
            ) {
              _data = { ...value._data, ...req.session._data };
            } else _data = dbvalue._data;
          } else {
            if (Object.keys(dbvalue._data) > Object.keys(svalue._data))
              _data = { ...dbvalue._data, ...svalue._data };
            if (Object.keys(svalue._data) > Object.keys(dbvalue._data))
              _data = { ...svalue._data, ...dbvalue._data };
            else _data = dbvalue._data;
          }

          value = {
            ...value,
            _accessed,
            _expire,
            _data,
          };

          req.session = value;
          cookiedata.value = JSON.stringify(value);
          await this.createSession(cookiedata);
          this._db.persistSessionData(this._id, value);
          if (!req._checkSession) req._checkSession = this.checkSession;
          return { _session: value };
        } catch (error) {
          logerror.error(error);
        }
      };

      checkExpire = async () => {
        let output = false;
        let name = this._sessconf.cookieOptions.name;
        let cookiedata = this.initcookie(this._id);
        let sess = await this.getSession({ name });
        if (sess) {
          let sessdata = JSON.parse(sess.value);
          let expire = dayjs(sessdata._expire).valueOf();
          let curdt = dayjs().valueOf();
          if (curdt > expire) {
            await this.createSession(cookiedata);
            this._db.persistSessionData(this._id, JSON.parse(cookiedata.value));
            output = true;
          }
        }
        return output;
      };

      clearSession = async () => {
        let cookiedata = this.initcookie(this._id);
        await this.createSession(cookiedata);
        let value = JSON.parse(cookiedata.value);
        this._db.persistSessionData(this._id, value);
      };

      initcookie = (sessionId) => {
        let { domain, sameSite, ...cookiedata } = this._sessconf.cookieOptions;
        cookiedata.id = sessionId;
        cookiedata.secure = this._sessconf.encryptionKey;
        cookiedata.url = `http://${domain}`;
        cookiedata.value = JSON.stringify(this._initialData);
        return cookiedata;
      };

      createSession = async (value) => {
        await this._sess.cookies.set(value);
        return;
      };

      getSession = async (value) => {
        let [data] = await this._sess.cookies.get(value);
        return data;
      };
    }
    return {
      sessionMiddleware: (...args) => {
        const [params] = args;
        const persist = session.fromPartition("persist:my-session");
        let kickoff = new sessionMiddleware(params, persist);

        const middleware = async (...args) => {
          const [cnt, next] = args;
          const { req, res } = cnt;
          return await kickoff.Session(req);
        };

        return middleware;
      },
    };
  } catch (error) {
    console.log(error);
  }
};
