/**
 * Copyright (c) 2026   Loh Wah Kiang
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
 * A module which handle gitea api integration
 * @module utils_giteapi
 */
module.exports = (...args) => {
  const [params, obj] = args;
  const [library] = obj;
  const { concatobj, datatype, errhandler, handler, objpick, smfetch } =
    library.utils;
  let lib = {};
  try {
    const combine_header = (...args) => {
      const [auth, content] = args;
      let { headers } = auth;
      let rtn = {};
      if (datatype(headers) != "object") return rtn;
      if (datatype(content) == "string") {
        rtn = headers;
        content.split(",").forEach((element) => {
          let arr = element.split(":");
          rtn[arr[0]] = arr[1];
        });
      }
      return rtn;
    };

    lib.auth_user = async (...args) => {
      const [param] = args;
      let output = handler.dataformat;
      try {
        let auth =
          "Basic " +
          Buffer.from(param.userid + ":" + param.userpwd).toString("base64");
        let options = {
          async: false,
          method: "GET",
          url: `${param.webapi}/api/v1/user`,
          option: {
            headers: {
              Authorization: auth,
            },
          },
          timeout: 30000,
        };
        let rtn = await smfetch.request(options);
        if (!rtn.code) {
          output.data = {
            headers: {
              Authorization: auth,
            },
          };
        } else output = rtn;
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib.list_org_repos = async (...args) => {
      const [param] = args;
      let output = handler.dataformat;

      try {
        let page = 1,
          fload = true;
        while (fload) {
          let options = {
            async: false,
            method: "GET",
            url: `${param.webapi}/api/v1/orgs${param.category}/repos?page=${page}`,
            option: { headers: combine_header(param.auth, param.headers) },
            timeout: 30000,
          };
          let rtn = await smfetch.request(options);
          if (rtn && rtn.code == 0) {
            if (rtn.data.data && rtn.data.code == 0) {
              output.msg = rtn.data.msg;
              output.data = rtn.data.data;
            } else {
              if (page == 1) output = [];
              if (rtn.data.length > 0) {
                output = concatobj(output, rtn.data);
                page += 1;
              } else fload = false;
            }
          }
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib.list_releases_repos = async (...args) => {
      const [param] = args;
      let output = handler.dataformat;
      try {
        let api = "";
        if (param.api == "gitea") api = "/api/v1/repos";
        if (!param.optional) param.optional = "";
        else param.optional = `${param.optional}`;
        let options = {
          async: false,
          method: "GET",
          url: `${param.webapi}${api}${param.category}/${param.repos}/releases${param.optional}`,
          option: { headers: combine_header(param.auth, param.headers) },
          timeout: 30000,
        };
        let rtn = await smfetch.request(options);
        if (rtn && rtn.code == 0) {
          if (rtn.data.data && rtn.data.code == 0) {
            output.msg = rtn.data.msg;
            output.data = rtn.data.data;
          } else output = rtn.data;
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib.list_branches_repos = async (...args) => {
      const [param] = args;
      let output = handler.dataformat;
      try {
        let api = "";
        if (param.api == "gitea") api = "/api/v1/repos";
        if (!param.optional) param.optional = "";
        else param.optional = `${param.optional}`;
        let options = {
          async: false,
          method: "GET",
          url: `${param.webapi}${api}${param.category}/${param.repos}/branches`,
          option: { headers: combine_header(param.auth, param.headers) },
          timeout: 30000,
        };
        let rtn = await smfetch.request(options);
        if (rtn && rtn.code == 0) {
          if (rtn.data.data && rtn.data.code == 0) {
            output.msg = rtn.data.msg;
            output.data = rtn.data.data;
          } else output = rtn.data;
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib.download_repos = async (...args) => {
      const [param] = args;
      let output = handler.dataformat;
      try {
        let options = {
          url: `${param.tagurl}`,
          location: `${param.location}`,
          tagname: `${param.tagname}.tar.gz`,
          option: { headers: param.auth },
          timeout: 30000,
        };
        let rtn = await smfetch.download(options);
        if (rtn && rtn.code == 0) {
          if (rtn.data.data && rtn.data.code == 0) {
            output.msg = rtn.data.msg;
            output.data = rtn.data.data;
          } else output = rtn.data;
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    lib.get_repos_rawfile = async (...args) => {
      let [param, repositories, cond] = args;
      let output = handler.dataformat;
      try {
        const sanbox = async () => {
          let output;
          try {
            let api = "";
            if (param.api == "gitea") api = "/api/v1/repos";
            if (!param.optional) param.optional = "";
            else param.optional = `${param.optional}`;
            let options = {
              async: false,
              method: "GET",
              url: `${param.webapi}${api}${param.category}/${param.repos}/raw/${param.file}`,
              option: { headers: combine_header(param.auth, param.headers) },
              timeout: 30000,
              data: `ref=${param.tagname}`,
            };

            let rtn = await smfetch.request(options);
            if (rtn && rtn.code == 0) {
              if (!rtn.data.code) output = rtn.data;
            }
          } catch (error) {
          } finally {
            return output;
          }
        };
        let data = await sanbox();
        repositories[cond.repokey][param.tagname] = {};
        if (data)
          repositories[cond.repokey][param.tagname] = objpick(
            data,
            cond.picker,
          );
      } catch (error) {
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
