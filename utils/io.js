/**
 * Copyright (c) 2025   Loh Wah Kiang
 *
 * oricommjs_v2 is licensed under Mulan PSL v2.
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
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const Busboy = require("busboy");

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
                  optional,
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
                  optional,
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

    const errhandler = (...args) => {
      let [error] = args;
      if (error.errno)
        return {
          code: error.errno,
          errno: error.errno,
          msg: error.msg ?? error.message,
          message: error.message,
          stack: error.stack,
          data: error,
        };
      else
        return {
          code: -1,
          errno: -1,
          msg: error.msg ?? error.message,
          message: error.message,
          stack: error.stack,
          data: error,
        };
    };

    const formdata_sbuffer = (...args) => {
      return new Promise((resolve, reject) => {
        const [params, obj] = args;
        const { ctype, payload, rawreq } = params;

        // Convert standard Web API ReadableStream to a traditional Node Readable stream
        const nodeReadable = Readable.fromWeb(rawreq);
        const busboy = Busboy({
          headers: { "content-type": ctype },
        });

        let output = {
          code: 0,
          msg: "",
          data: null,
        };

        // This array will hold our streaming buffer fragments
        const fileChunks = [];
        let fileResult = null;

        busboy.on("file", (fieldname, fileStream, fileInfo) => {
          const { encoding, filename: originalname, mimeType } = fileInfo;
          // 2. Capture each incoming 64KB binary slice
          fileStream.on("data", (chunk) => {
            // 'chunk' is a raw Node.js Buffer segment
            fileChunks.push(chunk);
          });

          // 3. Triggered when this specific file finishes flowing over the network
          fileStream.on("end", () => {
            // Assemble all array pieces into one complete continuous memory buffer
            const finalBuffer = Buffer.concat(fileChunks);

            fileResult = {
              type: "buffer",
              originalname,
              mimeType,
              encoding,
              buffer: finalBuffer,
              sizeInBytes: finalBuffer.length, // This gives you the exact file size
            };
          });
        });
        // Handle text fields to keep backpressure clear
        busboy.on("field", (fieldname, val) => {});

        busboy.on("error", (error) => resolve(errhandler(error)));

        // 4. Safely resolve your Hono route promise once Busboy clears the network pipe
        busboy.on("finish", () => {
          if (!fileResult) {
            resolve(
              errhandler(
                new Error("No file was found in the FormData payload"),
              ),
            );
          }
          output.data = fileResult;
          resolve(output);
        });

        nodeReadable.pipe(busboy);
      });
    };

    const formdata_sdisk = (...args) => {
      return new Promise((resolve, reject) => {
        const [params, obj] = args;
        const { ctype, payload, rawreq } = params;
        const { location, timestamp } = obj;
        const { createWriteStream } = fs;

        // Convert standard Web API ReadableStream to a traditional Node Readable stream
        const nodeReadable = Readable.fromWeb(rawreq);
        const busboy = Busboy({
          headers: { "content-type": ctype },
        });

        let output = {
          code: 0,
          msg: "",
          data: null,
        };

        busboy.on("file", (fieldname, fileStream, fileInfo) => {
          const { encoding, filename: originalname, mimeType } = fileInfo;
          const extension = path.extname(originalname) || ".bin";
          let fname = path.parse(originalname).name;
          if (timestamp) fname += "_" + sys.dayjs().valueOf();
          const destination = path.join(location, `${fname}${extension}`);
          const diskWritable = createWriteStream(destination);
          fileStream.pipe(diskWritable);
          diskWritable.on("finish", () => {
            output.data = {
              destination,
              encoding,
              mimeType,
              originalname,
              payload,
              size: diskWritable.bytesWritten,
            };
            resolve(output);
          });
          diskWritable.on("error", (error) => resolve(errhandler(error)));
        });
        // Handle text fields to keep backpressure clear
        busboy.on("field", (fieldname, val) => {});
        busboy.on("error", (error) => resolve(errhandler(error)));
        nodeReadable.pipe(busboy);
      });
    };

    const rawbinary_sdisk = (...args) => {
      return new Promise((resolve, reject) => {
        const [params, obj] = args;
        const { ctype, filename, payload, rawreq, size } = params;
        const { location, timestamp } = obj;
        const { createWriteStream } = fs;

        // Convert standard Web API ReadableStream to a traditional Node Readable stream
        const nodeReadable = Readable.fromWeb(rawreq);

        const extension = path.extname(filename) || ".bin";
        let fname = path.parse(filename).name;
        if (timestamp) fname += "_" + sys.dayjs().valueOf();
        const destination = path.join(location, `${fname}${extension}`);
        const diskWritable = createWriteStream(destination);
        nodeReadable.pipe(diskWritable);
        diskWritable.on("finish", () =>
          resolve({
            destination,
            mimeType: ctype,
            originalname: filename,
            payload,
            size: diskWritable.bytesWritten,
          }),
        );
        diskWritable.on("error", (error) => resolve(errhandler(error)));
      });
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
      const { formdatastream, rawbinstream } = request;
      const { save = false, timestamp = false } = options;
      const { disk, location, stream } = setting;
      let output = {
        code: 0,
        msg: "",
        data: null,
      };

      try {
        let result = {};
        if (formdatastream) {
          if (Number(formdatastream.size) / 10240 > disk || save) {
            result = await formdata_sdisk(formdatastream, {
              location,
              timestamp,
            });
          } else {
            result = await formdata_sbuffer(formdatastream, {
              location,
              timestamp,
            });
          }
        } else if (rawbinstream) {
          result = await rawbinary_sdisk(rawbinstream, {
            location,
            timestamp,
          });
        } else
          throw {
            message: "Upload process failure!",
            stack:
              "Error stack: Upload process failure from utils/utils.js webstorage function",
          };

        if (result.code == 0) output.data = result.data;
        else output = result;
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
        Buffer.from(iv, "hex"),
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
        decipherIv,
      );
      let decrypted = decipher.update(
        encryptedObject.encryptedData,
        "hex",
        "utf8",
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
