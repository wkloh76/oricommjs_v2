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
 * app
 * @module app
 */
(async () => {
  const { default: chalk } = await import("chalk");
  const { default: inquirer } = await import("inquirer");

  try {
    let argv = [];
    let homedir;
    process.argv.map((value) => {
      if (value.match("=")) {
        let arg = value.split("=");
        let args_key = arg[0].replace(/[\(,\),\.,\/,\-,\_, ,]/g, "");
        if (args_key == "homedir") homedir = arg[1];
      }
    });
    if (!homedir) homedir = require("os").homedir();
    global.sysmodule = {
      dayjs: require("dayjs"),
      events: require("events"),
      fs: require("fs"),
      ini: require("ini"),
      path: require("path"),
      toml: require("@ltd/j-toml"),
      yaml: require("yaml"),
      pino: require("pino"),
    };

    global.kernel = {
      dir: process.cwd(),
      mode: "",
      utils: {},
      engine: {},
      atomic: {},
      components: { done: [] },
    };
    global.coresetting = {
      args: {},
      splitter: "/",
      platform: process.platform,
      homedir: homedir,
      share: { public: {}, atomic: {} },
    };

    sysmodule.events.EventEmitter.defaultMaxListeners = 50;
    global.emitter = new sysmodule.events.EventEmitter();

    /**
     * initialize pre process setting
     * @alias module:app.initialize
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - sys is an object value from global variable sysmodule
     * @param {Object} args[2] - core is an object value from global variable kernel
     * @returns {Object} - Return value in object type
     */
    const initialize = (...args) => {
      return new Promise(async (resolve, reject) => {
        let [cosetting, sys, core] = args;
        let { fs, path, toml } = sys;
        let { platform, splitter } = cosetting;
        let { utils, dir, mode } = core;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };
        try {
          if (platform == "win32") splitter = "\\";
          process.argv.map((value) => {
            if (value.match("=")) {
              let arg = value.split("=");
              let args_key = arg[0].replace(/[\(,\),\.,\/,\-,\_, ,]/g, "");
              cosetting.args[args_key] = arg[1];
            } else argv.push(value);
          });

          if (!argv.includes("app.js")) {
            let tempcur = argv[0]
              .replace(".", "")
              .split(splitter)
              .slice(0, -1)
              .join(splitter);

            for (let item of argv) {
              if (item.split(splitter).includes("app.js")) tempcur = "";
            }
            if (tempcur != "") dir = tempcur;
          }
          if (fs.existsSync(`${dir}${splitter}resources${splitter}app.asar`))
            dir += `${splitter}resources${splitter}app.asar${splitter}`;
          else if (fs.existsSync(`${dir}${splitter}resources${splitter}app`))
            dir += `${splitter}resources${splitter}app${splitter}`;
          if (cosetting.args["mode"]) mode = cosetting.args["mode"];
          else {
            mode = "production";
            cosetting.args["mode"] = mode;
          }

          let tomlpath = path.join(dir, `.${splitter}coresetting.toml`);

          if (fs.existsSync(tomlpath)) {
            let psetting = toml.parse(fs.readFileSync(tomlpath), {
              bigint: false,
            });
            let { debug, production, ...setting } = psetting;
            if (cosetting.args["sudopwd"])
              setting.general.sudopwd = cosetting.args["sudopwd"];
            cosetting = { ...cosetting, ...setting };
            cosetting["nodepath"] = path.join(dir, "node_modules");

            cosetting[mode] = { ...psetting[mode] };
            cosetting["ongoing"] = { ...psetting[mode] };
          }

          cosetting.packagejson = JSON.parse(
            fs.readFileSync(path.join(dir, "package.json"), "utf8"),
          );

          cosetting.logpath = path.join(
            cosetting.homedir,
            `.${cosetting.packagejson.name}`,
          );

          let exlude_engine = [];
          if (!cosetting.args.engine) cosetting.args.engine = "webnodehonojs";
          for (let [item, value] of Object.entries(cosetting.general.engine)) {
            if (item == cosetting.args.engine) {
              cosetting.general.engine = { name: item, type: value };
            } else exlude_engine.push(item);
          }

          utils = {
            ...(await require(path.join(dir, "utils"))(
              [path.join(dir, "utils"), "utils"],
              [kernel, sysmodule, cosetting],
            )),
          };

          cosetting["engine"] = [
            path.join(dir, "engine"),
            utils.io.dir_module(path.join(dir, "engine"), exlude_engine),
            "engine",
          ];
          cosetting["atomic"] = {};
          for (let val of cosetting.general.atomic) {
            let atomicpath = path.join(dir, "atomic", val);
            if (fs.existsSync(atomicpath)) {
              cosetting["atomic"][val] = [
                path.join(dir, "atomic", val),
                utils.io.dir_module(atomicpath, []),
                val,
              ];
            }
          }
          cosetting["components"] = [
            path.join(dir, "components"),
            utils.io.dir_module(path.join(dir, "components"), []),
            "components",
          ];
          output.data = {
            coresetting: cosetting,
            kernel: { dir: dir, mode: mode, utils: utils },
          };
        } catch (error) {
          if (error.errno) {
            output.code = error.errno;
            output.errno = error.errno;
            output.message = error.message;
            output.stack = error.stack;
            output.data = error;
          } else {
            output.code = -1;
            output.msg = error.message;
            output.message = error.message;
            output.stack = error.stack;
            output.data = error;
          }
        } finally {
          resolve(output);
        }
      });
    };

    /**
     * Create log directory
     * @alias module:app.mkdirlog
     * @param {...Object} args - 2 parameters
     * @param {String} args[0] - logpath is Log file path
     * * @param {Object} args[1] - fs is an object value from global variable sysmodule.fs
     * @returns {Object} - - Return value in object type
     */
    const mkdirlog = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [logpath, fs] = args;
        let output = {
          code: 0,
          msg: "",
          data: null,
        };
        try {
          fs.access(logpath, (notexist) => {
            // To check if given directory exists or not
            if (notexist) {
              // If current directory does not exist then create it
              fs.mkdir(logpath, { recursive: true }, async (err) => {
                if (err) {
                  output.code = -2;
                  output.msg = err.message;
                } else {
                  const util = require("util");
                  const mkdir = util.promisify(fs.mkdir);
                  await mkdir(`${logpath}/error`, { recursive: true });
                  output.msg = "New Directory created successfully !!";
                }
                resolve(output);
              });
            } else {
              output.msg = "Given Directory already exists !!";
              resolve(output);
            }
          });
        } catch (error) {
          if (error.errno)
            resolve({
              code: error.errno,
              errno: error.errno,
              message: error.message,
              stack: error.stack,
              data: error,
            });
          else
            resolve({
              code: -1,
              errno: -1,
              message: error.message,
              stack: error.stack,
              data: error,
            });
        }
      });
    };

    /**
     * Configure log module for webexpress and normal log
     * @alias module:app.configlog
     * @param {...Object} args - 1 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - path is a module from node_modules
     * @returns {Object} - - Return value in object type
     */
    const configlog = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [cosetting, path] = args;
        const { logpath } = cosetting;
        const { dayjs, fs, pino } = sysmodule;
        let output = {
          code: 0,
          msg: "app.js configlog done!",
          data: null,
        };
        try {
          let stream = fs.createWriteStream(
            path.join(logpath, "error", "error.log"),
            { flags: "a" },
          );
          // 配置 Pino 日志
          let logerror = pino(
            {
              level: "error",
              timestamp: () =>
                `,"time":"${dayjs().format("YYYY-MM-DD HH:mm:ss")}"`,
              formatters: {
                level: (label) => {
                  return { level: label };
                },
              },
            },
            stream,
          );

          output.data = { logerr: logerror };
        } catch (error) {
          if (error.errno)
            output = {
              code: error.errno,
              errno: error.errno,
              message: error.message,
              stack: error.stack,
              data: error,
            };
          else
            output = {
              code: -1,
              errno: -1,
              message: error.message,
              stack: error.stack,
              data: error,
            };
        } finally {
          resolve(output);
        }
      });
    };

    let startupfunc = {
      load: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [library, sys, cosetting] = obj;
          const { errhandler, handler, io } = library.utils;
          const { import_cjs } = io;
          let output = handler.dataformat;
          try {
            output.data = await import_cjs(params, { errhandler }, obj);
            if (output.code != 0) throw output;
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      load_comp: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [pathname, arr_modname, curdir] = params;
          const [library, sys, cosetting] = obj;
          const { engine, utils } = library;
          const { cengine } = engine.compmgr;
          const { errhandler, handler } = utils;
          const { fs, path } = sys;
          const { join } = path;
          let output = handler.dataformat;
          try {
            let modules = {};
            let arr_process = [],
              arr_name = [];
            for (let val of arr_modname) {
              let modpath = join(pathname, val);
              if (fs.readdirSync(modpath).length > 0) {
                let module = new cengine([modpath, val, curdir], obj);
                arr_name.push(val);
                arr_process.push(module);
              }
            }
            let arrrtn = await Promise.all(arr_process);
            for (let [idx, val] of Object.entries(arrrtn)) {
              if (val != null) modules[arr_name[idx]] = val;
            }

            output.data = modules;
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      nested_load: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [atomic, general] = params;
          const [library] = obj;
          const { errhandler, handler, io } = library.utils;
          const { import_cjs } = io;
          let output = handler.dataformat;
          let rtn = {};
          try {
            for (let val of general) {
              if (atomic[val]) {
                rtn[val] = await import_cjs(atomic[val], { errhandler }, obj);
                library["atomic"][val] = rtn[val];
              }
            }
            output.data = rtn;
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      mergedata: (...args) => {
        return new Promise(async (resolve, reject) => {
          let [cosetting, tmp] = args;
          let output = { code: 0, msg: "", data: null };
          try {
            output.data = { ...cosetting };
            for (let [, v] of Object.entries(tmp)) {
              output.data = { ...output.data, ...v };
            }
            cosetting = output.data;
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      call_message: (...args) => {
        const [params, obj] = args;
        const [library, sys] = obj;
        console.log(
          `Import ${params} done (${sys.dayjs().format("DD-MM-YYYY HH:mm:ss")})`,
        );
        return library.utils.handler.dataformat;
      },
      work: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [library] = obj;
          const { components, engine, utils } = library;
          const { errhandler, handler } = utils;

          let output = handler.dataformat;

          try {
            let { startup, start } = components;
            if (startup) {
              for (let module of startup) {
                if (module) {
                  let rtn = await module(params.ongoing);
                  if (rtn) throw rtn;
                }
              }
            }
            if (start) {
              let rtn = await start(params, engine.compmgr);
              if (rtn) throw rtn;
            }
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      routejson: (...args) => {
        return new Promise(async (resolve, reject) => {
          const [params, obj] = args;
          const [library, sys] = obj;
          const { dir, utils } = library;
          const { datatype, errhandler, handler, sanbox } = utils;
          const { fs, path } = sys;
          const { existsSync, readFileSync, writeFileSync } = fs;
          const { join } = path;
          let output = handler.dataformat;

          try {
            let routefilename = join(dir, "components", "route.json");
            let routefile;

            if (params.routejson) {
              if (existsSync(routefilename))
                routefile = JSON.parse(readFileSync(routefilename, "utf8"));

              if (
                !routefile ||
                JSON.stringify(params.routejson) !== JSON.stringify(routefile)
              )
                routefile = JSON.stringify(params.routejson, null, 2);
            }
            if (datatype(routefile) == "string")
              await sanbox(writeFileSync, [routefilename, routefile]);
            resolve(output);
          } catch (error) {
            reject(errhandler(error));
          }
        });
      },
      failure: (...args) => {
        const [error, errmsg, obj] = args;
        const [library] = obj;
        const { errhandler, handler } = library.utils;
        let output = handler.dataformat;
        try {
          output.data = error;
        } catch (error) {
          output = errhandler(error);
        } finally {
          return output;
        }
      },
    };

    /**
     * Start loading main project
     * @param {...Object} args - 3 parameters
     * @param {Object} args[0] - cosetting is an object value from global variable coresetting
     * @param {Object} args[1] - sys is an object value from global variable sysmodule
     * @param {Object} args[2] - core is an object value from global variable kernel
     * @returns {Object} - Return value
     */
    const startup = (...args) => {
      return new Promise(async (resolve, reject) => {
        const [, obj] = args;
        let [library, sys, cosetting] = obj;
        const { errhandler, handler, serialize } = library.utils;

        let output = handler.dataformat;
        let input = handler.fmtseries;

        try {
          input.trigger = {};
          input.func = startupfunc;
          input.err = [
            {
              func: "failure",
              name: "load_failureengine",
              param: [["{{$lib}}"]],
            },
          ];

          input.share = {
            lib: library,
            setting: cosetting,
            message: {
              engine: "engine",
              atomic: "atomic",
              components: "components",
            },
            core: { obj },
          };

          input.workflow = [
            {
              name: "load_engine",
              func: "load,call_message",
              param: [
                ["{{$setting/engine}}", "{{$core/obj}}"],
                ["{{$message/engine}}", "{{$core/obj}}"],
              ],
              save: [["lib/engine"]],
            },
            {
              name: "load_atomic",
              func: "nested_load,call_message",
              param: [
                [
                  ["{{$setting/atomic}}", "{{$setting/general/atomic}}"],
                  "{{$core/obj}}",
                ],
                ["{{$message/atomic}}", "{{$core/obj}}"],
              ],
            },
            {
              name: "load_components",
              func: "load_comp,mergedata",
              param: [
                ["{{$setting/components}}", "{{$core/obj}}"],
                ["{{$setting}}", "{{$load_components/detail}}"],
              ],
              save: [[], ["setting"]],
            },
            {
              name: "work",
              func: "work",
              param: [["{{$setting}}", "{{$core/obj}}"]],
            },
            {
              name: "routejson",
              func: "routejson",
              param: [["{{$lib/components}}", "{{$core/obj}}"]],
            },
            {
              name: "msg_components",
              func: "call_message",
              param: [["{{$message/components}}", "{{$core/obj}}"]],
            },
          ];

          let rtn = await new serialize(input, obj);
          if (rtn.code != 0) throw rtn;
          resolve(output);
        } catch (error) {
          resolve(errhandler(error));
        }
      });
    };

    let rtninit = await initialize(coresetting, sysmodule, kernel);
    if (rtninit.code != 0) throw rtninit;
    else {
      coresetting = { ...coresetting, ...rtninit.data.coresetting };
      kernel = { ...kernel, ...rtninit.data.kernel };
    }
    let rtnmklog = await mkdirlog(coresetting.logpath, sysmodule.fs);
    if (rtnmklog.code != 0) throw rtnmklog;
    let rtnconflog = await configlog(coresetting, sysmodule.path);
    if (rtnconflog.code != 0) throw rtnconflog;
    else sysmodule = { ...sysmodule, ...rtnconflog.data };

    let conftoml = sysmodule.path.join(coresetting.homedir, "conf.toml");
    if (!sysmodule.fs.existsSync(conftoml)) {
      let question = [
        {
          type: "password",
          message: chalk.whiteBright.bgBlue(
            "This is the first time setup!\nPlease provide your authorize password for some privileage setting:\n",
          ),
          name: "ans",
          mask: chalk.yellow.bgBlue("*"),
        },
      ];
      let sudopwd;
      if (coresetting.args["sudopwd"]) sudopwd = coresetting.args["sudopwd"];
      else {
        let { ans } = await inquirer.prompt(question);
        sudopwd = ans;
      }
      if (sudopwd && sudopwd !== "") {
        let encodepwd = kernel.utils.io.encryptor(sudopwd, coresetting.general);
        let tomlString = sysmodule.toml.stringify(
          { encryptpwd: encodepwd },
          { newline: "\n" },
        );
        sysmodule.fs.writeFileSync(conftoml, tomlString);
        process.exit(1);
      }
    }

    let rtn = await startup(null, [kernel, sysmodule, coresetting]);
    if (rtn.code != 0) throw rtn;
    console.log(
      `done app (${sysmodule.dayjs().format("DD-MM-YYYY HH:mm:ss")})`,
    );
  } catch (error) {
    console.log(error.stack);
    sysmodule.logerr.error(error.stack);
  }
})();
