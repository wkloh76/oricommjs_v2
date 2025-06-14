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
const { Module } = require("module");
const vm = require("vm");

/**
 * The submodule utils module
 * @module utils_utils
 */
module.exports = (...args) => {
  return new Promise(async (resolve, reject) => {
    const [params, obj] = args;
    const [pathname, curdir] = params;
    const [library, sys, cosetting] = obj;
    const { fs, path, jptr } = sys;

    const util = require("util");
    const busboy = require("busboy");
    const multer = require("multer");
    try {
      /**
       * Get the data type
       * @alias module:utils.datatype
       * @param {string| number| boolean| Object| Array} value - Determine the data type of the parameter
       * @returns {string}
       */
      const datatype = (value) => {
        try {
          let output = typeof value;
          if (output == "string") {
            if (!isNaN(value)) output = "number";
          } else if (output == "object") {
            if (Array.isArray(value)) {
              output = "array";
            } else if (Object.keys(value).length > 0) {
              output = "object";
            }
          }
          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.dir_module
       * @param {...Array} args - 2 parameters
       * @param {String} args[0] - pathname the folder path
       * @param {Array} args[1] - excludefile values from coresetting.general.excludefile
       * @param {Object} obj - Object
       * @param {String} dotSeparatedKeys - Nested keyname
       * @returns {Object} - Return modules | undefined
       */
      const dir_module = (...args) => {
        const [pathname, excluded = []] = args;
        return fs.readdirSync(path.join(pathname)).filter((filename) => {
          if (path.extname(filename) == "" && !excluded.includes(filename)) {
            return filename;
          }
        });
      };

      /**
       * The main objective base on list dynamic import commonJS modules
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.import_cjs
       * @param {...Array} args - 2 parameters
       * @param {Array} args[0] - list 3 set of values with pathname, arr_modname, curdir
       * @param {Object} args[1] - obj a set of object with kernel.utils
       * @returns {Object} - Return modules | undefined
       */
      const import_cjs = (...args) => {
        return new Promise(async (resolve, reject) => {
          const [list, obj, optional] = args;
          const [pathname, arr_modname, curdir] = list;
          const { errhandler } = obj;
          const { join } = path;
          try {
            let modules = {};
            let arr_process = [],
              arr_name = [];
            for (let val of arr_modname) {
              let modpath = join(pathname, val);
              if (fs.readdirSync(modpath).length > 0) {
                if (fs.existsSync(join(modpath, "index.js"))) {
                  let module = require(join(modpath), "utf8")(
                    [modpath, val, curdir],
                    optional
                  );
                  arr_name.push(val);
                  arr_process.push(module);
                }
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn))
              modules[arr_name[idx]] = val;
            resolve(modules);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       * The main objective base on list dynamic import ES modules
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.import_mjs
       * @param {...Array} args - 2 parameters
       * @param {Array} args[0] - list 3 set of values with pathname, arr_modname, curdir
       * @param {Object} args[1] - obj a set of object with kernel.utils
       * @returns {Object} - Return modules | undefined
       */
      const import_mjs = async (...args) => {
        return new Promise(async (resolve, reject) => {
          const [list, obj, optional] = args;
          const [pathname, arr_modname, curdir] = list;
          const { errhandler } = obj;
          const { join } = path;
          try {
            let modules = {};
            let arr_process = [],
              arr_name = [];
            for (let val of arr_modname) {
              let modpath = join(pathname, val);
              if (fs.readdirSync(modpath).length > 0) {
                if (fs.existsSync(join(modpath, "index.js"))) {
                  let module = require(join(modpath), "utf8")(
                    [modpath, val, curdir],
                    optional
                  );
                  arr_name.push(val);
                  arr_process.push(module);
                }
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn)) {
              let { default: bare, ...value } = val;
              modules[arr_name[idx]] = { ...value, ...bare };
            }
            resolve(modules);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      };

      /**
       * The main objective is find the value base on nested keyname
       * The detail refer to https://github.com/flexdinesh/typy
       * @alias module:utils.getNestedObject
       * @param {Object} obj - Object
       * @param {String} dotSeparatedKeys - Nested keyname
       * @returns {Object} - Return modules | undefined
       */
      const getNestedObject = (obj, dotSeparatedKeys) => {
        if (
          dotSeparatedKeys !== undefined &&
          typeof dotSeparatedKeys !== "string"
        )
          return undefined;
        if (
          typeof obj !== "undefined" &&
          typeof dotSeparatedKeys === "string"
        ) {
          // split on ".", "[", "]", "'", """ and filter out empty elements
          const splitRegex = /[.\[\]'"]/g; // eslint-disable-line no-useless-escape
          const pathArr = dotSeparatedKeys
            .split(splitRegex)
            .filter((k) => k !== "");
          // eslint-disable-next-line no-param-reassign, no-confusing-arrow
          obj = pathArr.reduce(
            (o, key) => (o && o[key] !== "undefined" ? o[key] : undefined),
            obj
          );
        }
        return obj;
      };

      /**
       * Update object value by keyname
       * The detail refer to https://stackoverflow.com/questions/73071777/function-to-update-any-value-by-key-in-nested-object
       * @alias module:utils.updateObject
       *  @param {String} key - keyname
       * @param {Array|Object|String|Integer} newValue - Value support all data type
       * @param {Object} obj - Object
       * @returns {Object} - Return modules | undefined
       */
      const updateObject = (key, newValue, obj) => {
        let newObj = Object.assign({}, obj); // Make new object
        const updateKey = (key, newValue, obj) => {
          if (typeof obj !== "object") return; // Basecase
          if (obj[key]) obj[key] = newValue; // Look for and edit property
          else
            for (let prop in obj) {
              updateKey(key, newValue, obj[prop]); // Go deeper
            }
        };
        updateKey(key, newValue, newObj);
        return newObj;
      };

      /**
       * Rename object all keys base on schema
       * The detail refer to https://stackoverflow.com/questions/62135524/how-to-rename-the-object-key-in-nested-array-of-object-in-javascript-dynamically
       * @alias module:utils.renameObjectKeys
       * @param {Object} keysMaps - The new keys schema.
       * @param {Object} node  - Data source.
       * @returns {Object} - Return modules | undefined
       */
      const renameObjectKeys = (node, keysMaps) => {
        const renameKeys = (node, keysMaps) => {
          if (typeof node !== "object" && !Array.isArray(node)) return node;
          if (Array.isArray(node))
            return node.map((item) => renameKeys(item, keysMaps));

          return Object.entries(node).reduce((result, [key, value]) => {
            const newKey = keysMaps[key] || key;
            return {
              ...result,
              [newKey]: renameKeys(value, keysMaps),
            };
          }, {});
        };
        return renameKeys(node, keysMaps);
      };

      /**
       * Performs a deep merge of objects and returns new object. Does not modify
       * objects (immutable) and merges arrays via concatenation.
       * The detail refer to https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
       * @alias module:utils.mergeDeep
       * @param {...object} objects - Objects to merge
       * @returns {object} New object with merged key/values
       */
      const mergeDeep = (...objects) => {
        const isObject = (obj) => obj && typeof obj === "object";

        return objects.reduce((prev, obj) => {
          Object.keys(obj).forEach((key) => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
              prev[key] = pVal.concat(...oVal);
            } else if (isObject(pVal) && isObject(oVal)) {
              prev[key] = lib["mergeDeep"](pVal, oVal);
            } else {
              prev[key] = oVal;
            }
          });

          return prev;
        }, {});
      };

      /**
       * Return object where option is the key, value is the value for the key
       * @alias module:utils.insert2obj
       * @param {Array} option - Array of string for key.
       * @param {Array} value  - Array of value for the key that must be sequence as the option.
       * @returns {Object} - Object that has been assigned to the key and value.
       */
      const insert2obj = (option, value) => {
        let output = {};
        option.map((val, key) => {
          output[val] = value[key];
        });
        return output;
      };

      /**
       * Pick data from the array object as the defination from picker
       * @alias module:utils.pick_arrayofobj
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] -arrobj is an array of object data type
       * @param {Array} args[1] -picker is an array of string which base on keyname to pickup entire key and value
       * @param {Array} args[2] -rename is an array of string which base on position value renaming the output keyname
       * @returns {Array} - Return empty array if cannot get the key from the value
       */
      const pick_arrayofobj = (...args) => {
        let [arrobj, picker, rename] = args;
        let output = [];
        for (let [idx, obj] of Object.entries(arrobj)) {
          let data = {};

          picker.map((val) => {
            let dtype = datatype(val);

            if (dtype == "string") {
              let { [val]: reserve, ...rest } = obj;
              if (reserve !== undefined && reserve != null)
                data = { ...data, ...{ [val]: reserve } };
            } else if (dtype == "object") {
              let [keyname] = Object.keys(val);
              let { [keyname]: reserve, ...rest } = obj;

              if (rename) {
                let key = rename[idx];
                data = { ...data, ...{ [key]: reserve } };
              } else {
                data = { ...data, ...reserve };
              }

              if (output.length == 0) output.push({ [keyname]: data });
              else output[0][keyname] = { ...output[0][keyname], ...data };
            }
          });
          output.push(data);
        }
        return output;
      };

      /**
       * Pick data from the array object as the defination from picker and convert data to list of object
       * @alias module:array.pick_arrayobj2list
       * @param {...Object} args - 1 parameters
       * @param {Array} args[0] -arrobj is an array of object data type
       * @param {Array} args[1] -picker is an array of string which base on keyname to pickup entire key and value
       * @returns {Object} - Return empty object if cannot get the key from the value
       */
      const pick_arrayobj2list = (...args) => {
        let [arrobj, picker] = args;
        let output = {};
        for (let obj of arrobj) {
          picker.map((val) => {
            const { [val]: reserve, ...rest } = obj;
            if (reserve !== undefined && reserve != null) {
              if (!output[val]) output[val] = [];
              output[val].push(reserve);
            }
          });
        }
        return output;
      };

      /**
       * Convert string to object, the default return data is empyt object if compare value is empty string
       * @alias module:array.arr_objectjson
       * @param {Array} value - Array of object
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      const arr_objectjson = (...args) => {
        let [value] = args;

        const isValidJSON = (str) => {
          try {
            JSON.parse(str);
            return true;
          } catch (e) {
            return false;
          }
        };

        let output = value.map((obj) => {
          let rtnobj = {};
          if (obj != "string") {
            for (let [key, val] of Object.entries(obj)) {
              let typeval = typeof val;
              if (typeval != "string") rtnobj[key] = val;
              else {
                if (val == "") {
                  rtnobj[key] = {};
                } else if (isValidJSON(val)) rtnobj[key] = JSON.parse(val);
                else rtnobj[key] = val;
              }
            }
          }
          return rtnobj;
        });
        return output;
      };

      /**
       * Insert multi values to new object base on constant keys sequnce define by user
       * @alias module:array.arr_constkey_insertobj
       * @param {Array} option - Array of string
       * @param {Array} value - Multi dimesiion array of any datatype value
       * @returns {Array}
       */
      const arr_constkey_insertobj = (...args) => {
        let [option, values] = args;
        let output = {};
        option.map((val, key) => {
          output[val] = values[key];
        });
        return output;
      };

      /**
       * Insert element to the parent object by selected array of index.
       * @alias module:array.arr_objpick_insert
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Object} obj - Object of value for insert to parent.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      const arr_objpick_insert = (...args) => {
        let [src, target, obj] = args;
        let output = [];
        src.map((val, key) => {
          let { ...data } = val;
          if (target.includes(key)) data = { ...data, ...obj };
          output.push(data);
        });
        return output;
      };

      /**
       * Delete element from the parent object by selected array of index base on object key name.
       * @alias module:array.arr_objpick_delete
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Array} obj - Compare Keys of Object which is match to parent keys.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      const arr_objpick_delete = (...args) => {
        let [src, target, obj] = args;
        let output = [];
        src.map((val, key) => {
          let { ...data } = val;
          if (target.includes(key)) {
            obj.forEach((keys) => delete data[keys]);
          }
          output.push(data);
        });
        return output;
      };

      /**
       * Update element value from the parent object by selected array of index base on object key name.
       * @alias module:array.arr_objpick_update
       * @param {Array} src - Array of object from parent.
       * @param {Array} target - Array of value for selected index of source.
       * @param {Object} obj - Object of value for update to parent.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      const arr_objpick_update = (...args) => {
        let [src, target, obj] = args;
        let output = [];
        src.map((val, key) => {
          let { ...data } = val;
          if (target.includes(key))
            for (let [objkey, objval] of Object.entries(obj))
              data[objkey] = objval;
          output.push(data);
        });
        return output;
      };

      /**
       * The main objective is delete keys values pair by keys name
       * The detail refer to https://stackoverflow.com/questions/43011742/how-to-omit-specific-properties-from-an-object-in-javascript
       * @alias module:utils.omit
       * @param {Object} object - Source data
       * @param {String} keys - Add empty space between key and next key when need delete multiple keys
       * @returns {Object} - Return object
       */
      const omit = (...args) => {
        let [object, keys] = args;
        let rtn = object;
        keys.split(" ").map((val) => {
          const { [val]: omitted, ...rest } = rtn;
          rtn = rest;
        });
        return rtn;
      };

      /**
       * The main objective is pick keys and values pair by keys name
       * The detail refer to https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties
       * @alias module:utils.objpick
       * @param {Object} object - Source data
       * @param {String} keys - Add empty space between key and next key when need delete multiple keys
       * @returns {Object} - Return object
       */
      const objpick = (...args) => {
        let [object, keys] = args;
        let rtn = {};
        keys.split(" ").map((key) => (rtn[key] = object[key]));
        return rtn;
      };

      /**
       * Parse the string to Json in json.
       * @alias module:utils.string2json
       * @param {String} value - Only the string of content which meet to json format requirement able to parse json
       * @returns {Object| string } - Empty value string return empty object,
       *  the return data will same as param when the param data type not equal to string
       */
      const string2json = (value) => {
        try {
          let output = {};
          if (value != "") {
            let typeval = typeof value;
            if (typeval == "object") output = value;
            else {
              if (
                value.indexOf("{") > -1 &&
                value.indexOf("}") > -1 &&
                value.indexOf(":") > -1
              )
                output = Object.assign(output, JSON.parse(value));
              else output = value;
            }
          }
          return output;
        } catch (error) {
          return error;
        }
      };

      /**
       * Serialize execution of a set of functions
       * @alias module:utils.serialize
       * @param {...Object} args - 3 parameters
       * @param {Object} args[0] - params  is an object type which content functions and data in fmtseries format
       * @param {Object} args[1] - obj  is an array type which content entire system engine and setting
       * @param {Boolean} args[2] - verbose  is a boolean type which decide return entire cache result,default is true
       * @returns {Object} - Return final result
       */

      class serialize {
        constructor(...args) {
          const [params, obj, verbose = true] = args;
          return (async () => {
            return await this.serialize(params, obj, verbose);
          })();
        }
        serialize = async (...args) => {
          return new Promise(async (resolve) => {
            const [params, obj, verbose = true] = args;
            const [library, sys] = obj;
            const { datatype, errhandler, getNestedObject, handler, sanbox } =
              library.utils;
            const { jptr } = sys;

            try {
              const { err, func: funcs, workflow, share } = params;
              let output = handler.dataformat;
              let temp = {};
              let terminate = false;
              let errmsg;

              const getparams = (...args) => {
                let [value, cache_temp, cache_share] = args;
                let result;
                if (value.lastIndexOf(".") > -1) {
                  let location = value.replaceAll(".", "/");
                  let getpull_temp = jptr.get(cache_temp, location);
                  let getpull_share = jptr.get(cache_share, location);
                  if (getpull_temp) result = getpull_temp;
                  else if (getpull_share) result = getpull_share;
                }
                return result;
              };

              const proparams = (...args) => {
                const [param, obj] = args;
                const [pulling, parameter, idx] = param;
                const [localshare, pubshare] = obj;
                let funcparams = [];
                if (pulling[idx]) {
                  if (pulling[idx].length == 0) {
                    if (parameter[idx]) {
                      if (parameter[idx].length > 0)
                        funcparams = parameter[idx];
                    }
                  } else {
                    let cache_pull = [];
                    for (let value of pulling[idx]) {
                      let dtype = datatype(value);
                      switch (dtype) {
                        case "string":
                          let result = getparams(value, localshare, pubshare);
                          if (result) cache_pull.push(result);
                          break;
                        case "array":
                          let arr_result = [];
                          for (let subval of value) {
                            let result = getparams(
                              subval,
                              localshare,
                              pubshare
                            );
                            if (result) arr_result.push(result);
                          }
                          cache_pull.push(arr_result);
                          break;
                      }
                    }
                    if (!parameter[idx]) {
                      if (cache_pull.length > 0) funcparams = cache_pull;
                    } else {
                      if (cache_pull.length == 1) funcparams = cache_pull;
                      else if (cache_pull.length >= 1)
                        funcparams.push(cache_pull);
                      if (parameter[idx].length == 1)
                        funcparams = funcparams.concat(parameter[idx]);
                      else if (parameter[idx].length > 1)
                        funcparams.push(parameter[idx]);
                    }
                  }
                } else {
                  if (parameter[idx]) {
                    if (parameter[idx].length > 0)
                      funcparams = funcparams.concat(parameter[idx]);
                  }
                }

                return funcparams;
              };

              for (let [idx, compval] of Object.entries(workflow)) {
                errmsg = `Current onging step is:${parseInt(idx) + 1}/${
                  workflow.length
                }. `;
                let { error, func, name, param, pull, push } = {
                  ...handler.wfwseries,
                  ...compval,
                };

                for (let [kfunc, vfunc] of Object.entries(func.split(","))) {
                  let fn = getNestedObject(funcs, vfunc);
                  if (fn) {
                    let funcparams = proparams(
                      [pull, param, kfunc],
                      [temp, share]
                    );

                    let queuertn = await sanbox(fn, funcparams);
                    let { code, data, msg } = queuertn;
                    if (code == 0) {
                      jptr.set(temp, `${name}/detail`, data);
                      if (push[kfunc]) {
                        push[kfunc].map((value, id) => {
                          let dataval;
                          if (data == null) dataval = data;
                          else if (data[value]) dataval = data[value];
                          else dataval = data;
                          if (value.lastIndexOf(".") > -1) {
                            let location = value.replaceAll(".", "/");
                            let emptycheck = jptr.get(share, location);
                            if (!emptycheck) jptr.set(share, location, dataval);
                            else {
                              let dtype = datatype(emptycheck);
                              switch (dtype) {
                                case "object":
                                  jptr.set(
                                    share,
                                    location,
                                    mergeDeep(emptycheck, dataval)
                                  );
                                  break;
                                case "array":
                                  if (emptycheck.length == 0)
                                    jptr.set(share, location, dataval);
                                  else
                                    jptr.set(
                                      share,
                                      location,
                                      emptycheck.concat(dataval)
                                    );
                                  break;
                              }
                            }
                          } else jptr.set(temp, `${name}/${value}`, dataval);
                        });
                      }
                    } else {
                      if (error != "") {
                        let fnerr = getNestedObject(funcs, error);
                        let fnerrrtn = await sanbox(fnerr, [queuertn, errmsg]);
                        if (!fnerrrtn) {
                          if (queuertn.stack) queuertn.stack += errmsg;
                          else if (queuertn.message) queuertn.message += errmsg;
                          else if (queuertn.msg) queuertn.msg += errmsg;
                          if (verbose == true)
                            output = { ...queuertn, data: temp };
                          terminate = true;
                        }
                      } else if (err.length > 0) {
                        for (let [errkey, errfunc] of Object.entries(err)) {
                          let { func, name, param, pull, push } = {
                            ...handler.wfwseries,
                            ...errfunc,
                          };

                          let fn = getNestedObject(funcs, func);
                          if (fn) {
                            let funcparams = proparams(
                              [pull, param, errkey],
                              [temp, share]
                            );
                            let fnerrrtn = await sanbox(fn, [
                              queuertn,
                              errmsg,
                              funcparams,
                            ]);
                            if (!fnerrrtn) {
                              if (queuertn.stack) queuertn.stack += errmsg;
                              else if (queuertn.message)
                                queuertn.message += errmsg;
                              else if (queuertn.msg) queuertn.msg += errmsg;
                              if (verbose == true)
                                output = { ...queuertn, data: temp };
                              terminate = true;
                            }
                          }
                        }
                        terminate = true;
                      }
                      output.code = code;
                      output.msg = msg;
                    }
                  } else {
                    output.code = -3;
                    output.msg = `Process stop at (${name}).${errmsg}. `;
                    terminate = true;
                  }
                  if (terminate == true) break;
                }
                if (terminate == true) break;
              }

              if (output.code == 0 && verbose == true) output.data = temp;

              resolve(output);
            } catch (error) {
              resolve(errhandler(error));
            }
          });
        };
      }

      /**
       *  Produce all try catch error returning data format
       * @alias module:utils.errhandler
       * @param {...Object} args - 1 parameters
       * @param {Object} args[0] - error try catch errror value
       * @returns {Object} - Return value
       */
      const errhandler = (...args) => {
        let [error] = args;
        if (error.errno)
          return {
            code: error.errno,
            errno: error.errno,
            message: error.message,
            stack: error.stack,
            data: error,
          };
        else
          return {
            code: -1,
            errno: -1,
            message: error.message,
            stack: error.stack,
            data: error,
          };
      };

      /**
       * Compare 2 array values and return the same values
       * @alias module:utils.arr_selected
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - source the data to to compare
       * @param {Array} args[1] - compare base on the array list.
       * @returns {Array} - Nothing change if some value not meet to requirement
       */
      const arr_selected = (...args) => {
        const [source, compare] = args;
        let output = { code: 0, msg: "", data: null };
        try {
          output.data = source.filter(function (val) {
            return compare.indexOf(val) != -1;
          });
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Compare 2 array values and return values differently
       * The detail refer to https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
       * @alias module:utils.arr_diff
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - source the data to to compare
       * @param {Array} args[1] - compare base on the array list.
       * @returns {Array} - Return the different value in array type
       */
      const arr_diff = (...args) => {
        const [source, compare] = args;
        let output = { code: 0, msg: "", data: null };
        try {
          output.data = source
            .concat(compare)
            .filter((val) => !(source.includes(val) && compare.includes(val)));
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Compare 2 array values and return values differently with index and value
       * @alias module:utils.arr_diffidx
       * @param {...Object} args - 2 parameters
       * @param {Array} args[0] - source the data to to compare
       * @param {Array} args[1] - compare base on the array list.
       * @param {Array} args[2] - format is result data format,2 is object and 1 is array of object.
       * @returns {Array} - Return the different value in array type with index
       */
      const arr_diffidx = (...args) => {
        const [source, compare, format = 1] = args;
        let output = { code: 0, msg: "", data: null };
        try {
          if (format == 2)
            output.data = {
              source: { index: [], value: [] },
              compare: { index: [], value: [] },
            };
          else output.data = [];
          let diff = source
            .concat(compare)
            .filter((val) => !(source.includes(val) && compare.includes(val)));
          if (diff.length > 0) {
            diff.forEach((value) => {
              let result;
              let pos_source = source.findIndex((element) => element == value);
              let pos_compare = compare.findIndex(
                (element) => element == value
              );
              if (pos_source > -1) {
                if (format == 2) {
                  output.data.source.index.push(pos_source);
                  output.data.source.value.push(value);
                } else
                  result = { from: "source", index: pos_source, value: value };
              } else if (pos_compare > -1) {
                if (format == 2) {
                  output.data.compare.index.push(pos_compare);
                  output.data.compare.value.push(value);
                } else
                  result = {
                    from: "compare",
                    index: pos_compare,
                    value: value,
                  };
              }
              if (result && format != 2) output.data.push(result);
            });
          }
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * File upload from we browser and kepp in memory or disk
       * @alias module:utils.diskstore
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - request is an object which provide by http server receiving client request
       * @param {Object} args[1] - setting is an object value from the coresetting
       * @param {Object} args[2] -  options is an object which content saving flag and save file renaming attach with timestamp value
       * @param {Boolean} args[2][0] - save is a flag where is decide the upload file save to the disk.
       * @param {Boolean} args[2][1] - timestamp is a flag where is provide timestamp value behind file original name during file saving .
       * @returns {Object} - Return default value is no error
       */
      const diskstore = async (...args) => {
        const [
          request,
          setting,
          options = { save: undefined, timestamp: undefined },
        ] = args;
        const { save = false, timestamp = false } = options;
        const { disk, location, stream } = setting;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };

        try {
          if (!request.files) {
            let stack;
            let sizeContent = request.headers["content-length"];
            stack = multer.memoryStorage();

            if (Number(sizeContent) / 1024 > stream) {
            } else if (Number(sizeContent) / 1024 > disk || save) {
              stack = multer.diskStorage({
                destination: location,
                limits: { fileSize: disk },
                filename: function (req, file, cb) {
                  let fname = file.originalname;
                  if (timestamp) fname += "_" + sys.dayjs().valueOf();
                  cb(null, fname);
                },
              });
            }

            const proceed = util.promisify(multer({ storage: stack }).any());
            await proceed(request, {});
          } else {
            for (let file of request.files) {
              file.buffer = Buffer.from(file.buffer);
              await fs.writeFileSync(
                path.join(location, file.originalname),
                file.buffer
              );
            }
          }
          if (request.files) output.data = request.files;
          else
            throw {
              message: "Upload process failure!",
              stack:
                "Error stack: Upload process failure from utils/utils.js webstorage function",
            };
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * Merge or concat base object or array data type
       * @alias module:utils.concatobj
       * @param {...Object} args - 3 parameters
       * @param {Object|Array} args[0] - type is an object or array type which for referenc to check continue argument data type
       * @param {Object|Array} args[1] - param1 is an object or array type which ready for merge or concat.
       * @param {Boolean|Array} args[2] - param2 is an object or array type which ready for merge or concat.
       * @returns {Object} - Return as Object|Array|undefined
       */
      const concatobj = (...args) => {
        const [type, param1, param2] = args;
        let output;
        let data1, data2;
        try {
          let mergedata = (type, arg1, arg2) => {
            let output;
            switch (type) {
              case "array":
                output = arg1.concat(arg2);
                break;
              case "object":
                output = mergeDeep(arg1, arg2);
                break;
            }
            return output;
          };

          let reftype = datatype(type);
          let refdata1 = datatype(param1);
          let refdata2 = datatype(param2);

          data1 = param1;
          data2 = param2;
          if (refdata1 == "undefined") data1 = type;
          if (refdata2 == "undefined") data2 = type;

          output = mergedata(reftype, data1, data2);
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      /**
       * The main purpose is to prevent users from improperly using async/await and promise
       * methods to trigger unpredictable errors and cause the entire system to shut down.
       * When server receive the request from client, will proceed
       * @alias module:utils.sanbox
       * @param {...Object} args - 2 parameters
       * @param {Object} args[0] - fn is mehtod/fuction for execution
       * @param {Array} args[1] - params is in array type which contant with request and response variable
       * @returns {Object} - Either return object or return data from execution function
       */
      const sanbox = async (...args) => {
        let [fn, params] = args;
        try {
          let result = fn(...params);
          if (result instanceof Promise) {
            result = await result;
            if (result instanceof ReferenceError) throw result;
          } else if (result instanceof ReferenceError) throw result;
          return result;
        } catch (error) {
          return errhandler(error);
        }
      };

      /**
       * The main purpose is to replace last occur string and replace to new string
       * @alias module:utils.str_replacelast
       * @param {...Object} args - 3 parameters
       * @param {String} args[0] - Original string
       * @param {String} args[1] - Pattern of string to search last occur
       * @param {String} args[2] - New string replacement for search and replace
       * @returns {String} - Either return original string or replacement string
       */
      const str_replacelast = (...args) => {
        let [str, find, replace] = args;
        let index = str.lastIndexOf(find);
        if (index === -1) {
          return str;
        }
        return (
          str.substring(0, index) + replace + str.substring(index + find.length)
        );
      };

      const vmloader = (...args) => {
        const [buffer, filename = ""] = args;
        let output = handler.dataformat;
        try {
          const { name, base, ext, dir, root } = path.parse(filename);

          const mod = new Module(base);
          mod.filename = base;
          const context = vm.createContext({
            module: mod,
            exports: mod.exports,
            require: mod.require.bind(mod),
            __dirname: dir,
            __filename: base,
          });
          vm.runInContext(buffer.toString("utf8"), context, base);

          // 返回模块导出
          output.data = mod.exports;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      const fmloader = (...args) => {
        const [buffer, filename = "", debugdir = ".temp_debug"] = args;
        let output = handler.dataformat;
        try {
          const { name, base, ext, dir, root } = path.parse(filename);

          const tempDir = join(dir, debugdir);
          if (!existsSync(tempDir)) mkdirSync(tempDir);
          const OriginalCode = "" + buffer.toString();

          // 创建临时文件用于调试
          const tempFilename = path.join(tempDir, base);
          writeFileSync(tempFilename, OriginalCode);

          // 设置模块加载器
          const Module = require("module");
          const mod = new Module(tempFilename);

          // 在沙箱中执行代码
          const sandbox = {
            module: mod,
            require: Module.createRequire(tempFilename),
            __filename: tempFilename,
            __dirname: tempDir,
            exports: mod.exports,
          };

          vm.runInNewContext(OriginalCode, sandbox, {
            filename: tempFilename,
            displayErrors: true,
          });

          // 返回模块导出
          output.data = mod.exports;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      };

      let lib = {
        dir_module,
        import_cjs,
        import_mjs,
        getNestedObject,
        updateObject,
        renameObjectKeys,
        insert2obj,
        pick_arrayofobj,
        pick_arrayobj2list,
        arr_objectjson,
        arr_constkey_insertobj,
        arr_objpick_insert,
        arr_objpick_delete,
        arr_objpick_update,
        omit,
        objpick,
        string2json,
        serialize,
        arr_selected,
        arr_diff,
        arr_diffidx,
        diskstore,
        concatobj,
        errhandler,
        datatype,
        mergeDeep,
        sanbox,
        str_replacelast,
        vmloader,
        fmloader,
      };
      resolve(lib);
    } catch (error) {
      reject(error);
    }
  });
};
