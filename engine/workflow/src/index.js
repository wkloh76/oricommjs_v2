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
 * The core of workflow engine module
 * @module src_wfengine
 */

module.exports = (...args) => {
  const [params, obj] = args;
  const [pathname, curdir] = params;
  const [library, sys, cosetting] = obj;
  const backend = true;

  try {
    const load = async (...args) => {
      const [param] = args;
      let lib = {};
      for (let [name, value] of Object.entries(param.load)) {
        if (name.substring(0, 4) == "html") {
          let folder = name.substring(4);
          lib[name] = {};
          for (let [parent, child] of Object.entries(value)) {
            for (let item of child) {
              let fnpath = `${param.path}${parent}/${folder}/${item}`;
              let fn = fnpath.split("/").pop().replace(".js", "");
              fn = fn.replace(".", "-");
              let { default: df } = await import(fnpath);
              if (df) {
                let { register, ...other } = df;
                if (lib[name][fn])
                  lib[name][fn] = {
                    ...lib[name][fn],
                    ...other,
                  };
                else lib[name][fn] = other;
              }
            }
          }
        }
      }
      return lib;
    };

    const helper = async (...args) => {
      const [params, obj] = args;
      const [event, showdata = true] = params;
      const { htmlengine, objfuncs } = obj;
      const { arr2str, arr_selected } = library.utils;

      let attrs = event.currentTarget.attributes;
      let clsname = arr2str(event.currentTarget.className.split(" "), ".", " ");
      let tagName = event.currentTarget.tagName;
      let id = `#${event.currentTarget.id}`;
      let func = attrs["func"].nodeValue;
      let qslist = [];

      if (tagName) qslist.push(tagName);
      if (id) qslist.push(id);
      if (clsname) qslist.push(clsname);

      for (let [, valobjevent] of Object.entries(
        injectionjs.webengine.trigger
      )) {
        let evtkeys = Object.keys(valobjevent);
        let { data } = arr_selected(qslist, evtkeys);
        if (data && data.length == 1) {
          let { attr } = valobjevent[data[0]];
          if (attr) {
            if (attr.required) {
              let { func: fn, required } = attr;
              func = { taskname: fn, required: required };
            }
          }
        }
      }
      if (func)
        return await taskrun([event, func, showdata], {
          htmlengine,
          objfuncs,
        });
    };

    const register = (...args) => {
      const [htmlengine, trigger] = args;
      const { htmlcollection, htmlevent, htmllogicflow, htmlrender } =
        htmlengine;
      const { mergeDeep } = library.utils;
      let funcs = {};
      for (let func of [htmllogicflow, htmlrender, htmlcollection])
        funcs = mergeDeep(funcs, { ...func });

      regevents(convtrigger(trigger), htmlevent);
      return funcs;
    };

    const convtrigger = (...args) => {
      const [trigger] = args;
      const { getNestedObject, handler, jptr } = library.utils;
      const html_objevents = handler.winevents;
      let objevents = handler.winevents;
      for (let [name, value] of Object.entries(trigger)) {
        let fn = getNestedObject(html_objevents, name);
        if (fn) {
          let location = name.replaceAll(".", "/");
          jptr.set(objevents, location, value);
        }
      }
      return objevents;
    };

    const taskrun = async (...args) => {
      const [params, obj] = args;
      const [event, task, showdata = true] = params;
      const { htmlengine, objfuncs } = obj;
      const {
        datatype,
        errhandler,
        getNestedObject,
        handler,
        pick_arrayofobj,
        pick_arrayobj2list,
        serialize,
      } = library.utils;
      let output = handler.dataformat;

      try {
        let { htmlworkflow } = htmlengine;
        let objkeys = Object.keys(htmlworkflow);
        let fn, func, required;
        let task_type = datatype(task);
        if (task_type == "string") func = task;
        else if (task_type == "object") {
          let { taskname, required: req } = task;
          func = taskname;
          if (req) required = req;
        }

        const parallel = async (...args) => {
          const [input, share] = args;
          let process = [];
          for (let objserialize of input) {
            objserialize.func = objfuncs;
            objserialize.share = share;
            let rtn = await new serialize(objserialize, [library], showdata);
            process.push(rtn);
            if (rtn.code != 0) break;
          }
          return process;
        };
        for (let item of objkeys) {
          let getfn = getNestedObject(htmlworkflow, `${item}.${func}`);
          if (getfn) {
            fn = getfn;
            break;
          }
        }
        if (fn) {
          let rtnprocess = [];
          let inputs = fn(event, func);
          if (inputs) {
            let share = { shared: { htmlengine, convtrigger } };
            if (required) share.shared = { ...share.shared, required };
            if (datatype(inputs) == "object") inputs = [inputs];
            let allexec = [];
            for (let input of inputs) {
              if (datatype(input) == "object") {
                input.func = objfuncs;
                input.share = share;
                allexec.push(new serialize(input, [library], showdata));
              } else if (datatype(input) == "array")
                allexec.push(parallel(input, share));
            }
            rtnprocess = await Promise.all(allexec);

            let code = "";
            for (let chkrtnproc of rtnprocess) {
              if (datatype(chkrtnproc) == "array") {
                let pickarrobj = pick_arrayofobj(chkrtnproc, ["code"]);
                let chkcode = pick_arrayobj2list(pickarrobj, [
                  "code",
                ]).code.join("");
                let validcode = "0".padStart(chkrtnproc.length, "0");
                if (chkcode != validcode) code += `[${chkcode}],`;
              } else {
                if (chkrtnproc["code"] != 0)
                  code += `[${chkrtnproc["code"].toString()}],`;
              }
            }

            if (code != "") {
              output.code = -1;
              output.msg = code;
            }
            output.data = rtnprocess;
          } else {
            output.code = -1;
            output.msg = `Error: Incomplete workflow in ${func} process`;
          }
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const regevents = (...args) => {
      const [param, objfuncs] = args;
      const { utils } = library;
      const { datatype, errhandler, getNestedObject, handler } = utils;
      let output = handler.dataformat;
      try {
        for (let [, valobjevent] of Object.entries(param)) {
          for (let [key, value] of Object.entries(valobjevent)) {
            for (let [evt, fn] of Object.entries(value)) {
              let qs = document.querySelectorAll(evt);
              if (qs) {
                for (let nodevalue of qs) {
                  if (typeof fn === "function")
                    nodevalue.addEventListener(key, fn);
                  else if (datatype(fn) === "string") {
                    let func = getNestedObject(objfuncs, fn);
                    if (func) nodevalue.addEventListener(key, func);
                  } else if (datatype(fn) === "object") {
                    if (fn.attr) {
                      for (let [attrkey, attrval] of Object.entries(fn.attr))
                        nodevalue.setAttribute(attrkey, attrval);
                    }
                    let func = getNestedObject(objfuncs, fn.evt);
                    if (func) nodevalue.addEventListener(key, func);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        output = errhandler(error);
      } finally {
        return output;
      }
    };

    const loadlib = async (...args) => {
      const [param] = args;
      const { jptr } = library.utils;
      try {
        let libraries = {};
        for (let item of param) {
          let fn = item.split("/").pop().replace(".js", "");
          let [, atomic] = item.split("/");
          if (atomic == "atomic") {
            if (!libraries[atomic]) libraries[atomic] = {};
          }
          fn = fn.replace(".", "-");
          let { default: df, ...otherlib } = await import(item);
          if (Object.keys(otherlib).length > 0) {
            if (atomic !== "atomic") glib[fn] = { ...df, ...otherlib };
            else
              jptr.set(libraries, item.replace(".js", ""), {
                ...df,
                ...otherlib,
              });
          } else {
            if (atomic !== "atomic") glib[fn] = df;
            else jptr.set(libraries, item.replace(".js", ""), { ...df });
          }
        }
        return libraries;
      } catch (error) {
        console.log(error);
      }
    };

    class queuetask {
      constructor(...args) {
        const [params, obj] = args;
        const [event] = params;
        const { engine, utils } = library;
        const { datatype, objreplace, handler, jptr } = utils;

        return (async () => {
          let output;
          try {
            let htmlworkflow = {};
            let taskrole;
            if (typeof backend === "undefined") {
              const { webengine, wfexchange } = obj;
              const { htmlcollection, htmlevent, htmlrender, htmllogicflow } =
                webengine.load;
              const { api, trigger, workflow } = wfexchange;
              if (webengine) {
                htmlengine = await this.load({
                  htmlcollection,
                  htmlevent,
                  htmlrender,
                  htmllogicflow,
                  _path: webengine.path,
                });
                let objfuncs = this.register(
                  htmlengine,
                  Object.values(trigger)
                );
                // if (webengine.startup)
                //   await taskrun([null, webengine.startup, false], {
                //     htmlengine,
                //     objfuncs,
                //   });
              }
              if (event == null)
                output = await this.taskrun([null, params, false], obj);
              else output = await this.helper(params, obj);
            } else {
              const { wfengine, objfuncs, ...objother } = obj;
              let { parameters, tasks, ...wf } = wfengine[params];
              htmlworkflow = objreplace(wf, parameters);
              taskrole = tasks;
              output = await this.taskrun1(
                [null, taskrole, true],
                {
                  htmlengine: { htmlworkflow },
                  objfuncs,
                  ...objother,
                },
                backend
              );
            }
          } catch (error) {
            output = library.utils.errhandler(error);
          } finally {
            return output;
          }
        })();
      }
      test = {
        t0: function (arg) {
          this.source = arg;
          let yy = utils.datatype(arg);
          if ((yy = "object")) this.proceed = true;
          return this;
        },
        t1: function (arg) {
          if (this.proceed) return objreplace(this.source, arg);
          else return this.source;
        },
      };

      load = async (...args) => {
        const [params] = args;
        const { _path, ...load } = params;
        const { mergeDeep, jptr } = library.utils;
        let lib = {};
        for (let [name, value] of Object.entries(load)) {
          if (name.substring(0, 4) == "html") {
            let folder = name.substring(4);
            for (let [parent, child] of Object.entries(value)) {
              for (let item of child) {
                let fnpath = `${_path}${parent}/${folder}/${item}`;
                let libname = `${folder}/${parent}/${folder}/${item}`;
                let fn = fnpath.split("/").pop().replace(".js", "");
                fn = fn.replace(".", "-");
                let { default: df } = await import(fnpath);
                if (df) {
                  let chkexists = jptr.get(lib, libname);
                  let { register, ...other } = df;
                  if (chkexists)
                    jptr.set(lib, libname, mergeDeep(chkexists, other));
                  else jptr.set(lib, libname, other);
                }
              }
            }
          }
        }
        return lib;
      };
      register = (...args) => {
        const [htmlengine, [trigger]] = args;
        const { collection, event, logicflow, render } = htmlengine;
        const { mergeDeep } = library.utils;
        let funcs = {};
        for (let func of [logicflow, render, collection])
          funcs = mergeDeep(funcs, { ...func });
        let conv = this.convtrigger(trigger);
        this.regevents(conv, event);
        return funcs;
      };
      convtrigger = (...args) => {
        const [trigger] = args;
        const { handler, jptr } = library.utils;
        const html_objevents = handler.winevents;
        let objevents = handler.winevents;
        for (let [name, value] of Object.entries(trigger)) {
          let fn = jptr.get(html_objevents, name);
          if (fn) jptr.set(objevents, name, value);
        }
        return objevents;
      };
      regevents = (...args) => {
        const [param, objfuncs] = args;
        const { utils } = library;
        const { datatype, errhandler, getNestedObject, handler, jptr } = utils;
        let output = handler.dataformat;
        try {
          for (let [, valobjevent] of Object.entries(param)) {
            for (let [key, value] of Object.entries(valobjevent)) {
              for (let [evt, fn] of Object.entries(value)) {
                let qs = document.querySelectorAll(evt);
                if (qs) {
                  for (let nodevalue of qs) {
                    if (typeof fn === "function")
                      nodevalue.addEventListener(key, fn);
                    else if (datatype(fn) === "string") {
                      let func = getNestedObject(objfuncs, fn);
                      if (func) nodevalue.addEventListener(key, func);
                    } else if (datatype(fn) === "object") {
                      if (fn.attr) {
                        for (let [attrkey, attrval] of Object.entries(fn.attr))
                          nodevalue.setAttribute(attrkey, attrval);
                      }
                      let func = jptr.get(objfuncs, fn.evt);
                      if (func)
                        nodevalue.addEventListener(key, async(event) => {
                          await func(event);
                          await this.helper(event)
                        });
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      helper = async (...args) => {
        const [params, obj] = args;
        const [event, showdata = true] = params;
        const { htmlengine, objfuncs } = obj;
        const { arr2str, arr_selected } = library.utils;

        let attrs = event.currentTarget.attributes;
        let clsname = arr2str(
          event.currentTarget.className.split(" "),
          ".",
          " "
        );
        let tagName = event.currentTarget.tagName;
        let id = `#${event.currentTarget.id}`;
        let func = attrs["func"].nodeValue;
        let qslist = [];

        if (tagName) qslist.push(tagName);
        if (id) qslist.push(id);
        if (clsname) qslist.push(clsname);

        for (let [, valobjevent] of Object.entries(
          injectionjs.webengine.trigger
        )) {
          let evtkeys = Object.keys(valobjevent);
          let { data } = arr_selected(qslist, evtkeys);
          if (data && data.length == 1) {
            let { attr } = valobjevent[data[0]];
            if (attr) {
              if (attr.required) {
                let { func: fn, required } = attr;
                func = { taskname: fn, required: required };
              }
            }
          }
        }
        if (func)
          return await taskrun([event, func, showdata], {
            htmlengine,
            objfuncs,
          });
      };
      taskrun = async (...args) => {
        const [params, obj] = args;
        const [event, task, showdata = true] = params;
        const { htmlengine, objfuncs } = obj;
        const {
          datatype,
          errhandler,
          getNestedObject,
          handler,
          pick_arrayofobj,
          pick_arrayobj2list,
          serialize,
        } = library.utils;
        let output = handler.dataformat;

        try {
          let { htmlworkflow } = htmlengine;
          let objkeys = Object.keys(htmlworkflow);
          let fn, func, required;
          let task_type = datatype(task);
          if (task_type == "string") func = task;
          else if (task_type == "object") {
            let { taskname, required: req } = task;
            func = taskname;
            if (req) required = req;
          }

          const parallel = async (...args) => {
            const [input, share] = args;
            let process = [];
            for (let objserialize of input) {
              objserialize.func = objfuncs;
              objserialize.share = share;
              let rtn = await new serialize(objserialize, [library], showdata);
              process.push(rtn);
              if (rtn.code != 0) break;
            }
            return process;
          };
          for (let item of objkeys) {
            let getfn = getNestedObject(htmlworkflow, `${item}.${func}`);
            if (getfn) {
              fn = getfn;
              break;
            }
          }
          if (fn) {
            let rtnprocess = [];
            let inputs = fn(event, func);
            if (inputs) {
              let share = { shared: { htmlengine, convtrigger } };
              if (required) share.shared = { ...share.shared, required };
              if (datatype(inputs) == "object") inputs = [inputs];
              let allexec = [];
              for (let input of inputs) {
                if (datatype(input) == "object") {
                  input.func = objfuncs;
                  input.share = share;
                  allexec.push(new serialize(input, [library], showdata));
                } else if (datatype(input) == "array")
                  allexec.push(parallel(input, share));
              }
              rtnprocess = await Promise.all(allexec);

              let code = "";
              for (let chkrtnproc of rtnprocess) {
                if (datatype(chkrtnproc) == "array") {
                  let pickarrobj = pick_arrayofobj(chkrtnproc, ["code"]);
                  let chkcode = pick_arrayobj2list(pickarrobj, [
                    "code",
                  ]).code.join("");
                  let validcode = "0".padStart(chkrtnproc.length, "0");
                  if (chkcode != validcode) code += `[${chkcode}],`;
                } else {
                  if (chkrtnproc["code"] != 0)
                    code += `[${chkrtnproc["code"].toString()}],`;
                }
              }

              if (code != "") {
                output.code = -1;
                output.msg = code;
              }
              output.data = rtnprocess;
            } else {
              output.code = -1;
              output.msg = `Error: Incomplete workflow in ${func} process`;
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      taskrun1 = async (...args) => {
        const [params, obj, backend = false] = args;
        const [event, tasks, showdata = true] = params;
        const { htmlengine, objfuncs, ...other } = obj;
        const {
          datatype,
          errhandler,
          handler,
          jptr,
          pick_arrayofobj,
          pick_arrayobj2list,
          mergeDeep,
          serialize1,
        } = library.utils;
        let output = handler.dataformat;

        try {
          const parallel = async (...args) => {
            const [input, share] = args;
            let process = [];
            let cross = share;
            for (let objserialize of input) {
              objserialize.func = objfuncs;
              objserialize.share = cross;
              objserialize.trigger = other;
              let rtn = await new serialize1(objserialize, [library], showdata);
              process.push(rtn);
              if (rtn.code != 0) break;
              let name =
                objserialize.workflow[objserialize.workflow.length - 1].name;
              cross = mergeDeep(cross, {
                [objserialize.wfname]: rtn.data[name],
              });
            }
            return process;
          };

          let { htmlworkflow } = htmlengine;
          let fn = [],
            rtnprocess = [];
          let required;

          for (let task of tasks) {
            for (let executable of task) {
              let step = "";
              for (let run of executable.split(",")) {
                step = run;
                let getfn = jptr.get(htmlworkflow, `${step}`);
                if (getfn) {
                  fn.push({ ...getfn, wfname: step });
                }
              }

              if (fn.length > 0) {
                let inputs = fn[0];
                if (fn.length > 1) inputs = fn;
                let share = { shared: {} };
                if (!backend) {
                  share.shared = { htmlengine, convtrigger };
                  if (required)
                    share.shared = mergeDeep(share.shared, { required });
                }
                let allexec = [];
                if (datatype(inputs) == "object") {
                  inputs.func = objfuncs;
                  inputs.share = share;
                  inputs.trigger = other;
                  allexec.push(new serialize1(inputs, [library], showdata));
                } else if (datatype(inputs) == "array")
                  allexec.push(parallel(inputs, share));

                rtnprocess = await Promise.all(allexec);

                let code = "";
                for (let chkrtnproc of rtnprocess) {
                  if (datatype(chkrtnproc) == "array") {
                    let pickarrobj = pick_arrayofobj(chkrtnproc, ["code"]);
                    let chkcode = pick_arrayobj2list(pickarrobj, [
                      "code",
                    ]).code.join("");
                    let validcode = "0".padStart(chkrtnproc.length, "0");
                    if (chkcode != validcode) code += `[${chkcode}],`;
                  } else {
                    if (chkrtnproc["code"] != 0)
                      code += `[${chkrtnproc["code"].toString()}],`;
                  }
                }

                if (code != "") {
                  output.code = -1;
                  output.msg = code;
                }
                let result = rtnprocess[rtnprocess.length - 1];
                let dtype = datatype(result);
                if (dtype == "array") {
                  output.data = result[result.length - 1].data[step]["detail"];
                } else if (dtype == "object") {
                  let name = inputs.workflow[inputs.workflow.length - 1].name;
                  output.data = result.data[name]["detail"];
                }
              } else {
                output.code = -1;
                output.msg = `Error: Incomplete workflow in ${step} process`;
              }
            }
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };
    }

    return {
      convtrigger,
      helper,
      load,
      loadlib,
      regevents,
      register,
      taskrun,
      queuetask,
      excluded: ["excluded"],
    };
  } catch (error) {
    return library.utils.errhandler(error);
  }
};
