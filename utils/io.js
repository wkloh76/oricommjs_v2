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
const { Module } = require("module");
const vm = require("vm");
const crypto = require("crypto");
const util = require("util");

/**
 * The submodule of utils
 * @module utils_io
 */
module.exports = (...args) => {
  const [params, obj] = args;
  const [library, sys, cosetting] = obj;
  const { fs, path, jptr } = sys;
  const multer = require("multer");
  let lib = {};
  try {
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

    // Function to encrypt a password
    // const secretKey = crypto.randomBytes(32); // 32 bytes for aes-256
    // const iv = crypto.randomBytes(16); // 16 bytes for AES block size
    const encryptor = (...args) => {
      const [password, obj] = args;
      const { algorithm, secretKey, iv } = obj;
      const cipher = crypto.createCipheriv(
        algorithm,
        Buffer.from(secretKey, "hex"),
        Buffer.from(iv, "hex")
      );
      let encrypted = cipher.update(password, "utf8", "hex");
      encrypted += cipher.final("hex");
      return {
        iv: iv,
        encryptedData: encrypted,
      };
    };

    // Function to decrypt an encrypted password
    const decryptor = (...args) => {
      const [encryptedObject, obj] = args;
      const { algorithm, secretKey, iv } = obj;
      const decipherIv = Buffer.from(encryptedObject.iv, "hex");
      const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(secretKey, "hex"),
        decipherIv
      );
      let decrypted = decipher.update(
        encryptedObject.encryptedData,
        "hex",
        "utf8"
      );
      decrypted += decipher.final("utf8");
      return decrypted;
    };

    lib = {
      diskstore,
      dir_module,
      import_cjs,
      import_mjs,
      fmloader,
      vmloader,
      encryptor,
      decryptor,
    };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
