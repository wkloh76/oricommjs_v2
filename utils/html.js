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
 * @module utils_html
 */
module.exports = (...args) => {
  const [params, obj] = args;
  const htmldata = require("./data/htmldata.json");
  const { htmlTags, mimes } = htmldata;
  const basic = /\s?<!doctype html>|(<html\b[^>]*>|<body\b[^>]*>|<x-[^>]+>)+/i;
  const full = new RegExp(
    htmlTags.map((tag) => `<${tag}\\b[^>]*>`).join("|"),
    "i"
  );

  let lib = {};
  try {
    /**
     * Replace specific character from text base on object key name
     * Keyword <-{name}>
     * @alias module:utils_html.str_inject
     * @param {...Object} args - 2 parameters
     * @param {String} args[0] - text is a statement in string value
     * @param {Object} args[1] - params a sets of values for change
     * @returns {String} - Return unchange or changed text
     */
    const str_inject = (...args) => {
      let [text, params] = args;
      let output = text;
      for (let [key, val] of Object.entries(params)) {
        let pattern = [`<-{${key}}>`, `{{${key}}}`];
        for (let name of pattern) {
          while (output.indexOf(name) > -1) {
            let idx = output.indexOf(name);
            output =
              output.substring(0, idx) +
              val +
              output.substring(idx + name.length);
          }
        }
      }
      return output;
    };

    /**
     * The main objective is indentify the string in html tag format
     * https://github.com/sindresorhus/is-html
     * @alias module:utils_html.identify_htmltag
     * @param {...Object} args - 1 parameters
     * @param {String} args[0] - params is a string for checking valid in html tag format
     * @returns {Object} - Return valid stting | null
     */
    const identify_htmltag = (...args) => {
      const [params] = args;
      let output = params;
      try {
        let html = params.trim().slice(0, 1000);
        let result = basic.test(html) || full.test(html);
        if (!result) output = null;
      } catch (error) {
        output = null;
      } finally {
        return output;
      }
    };

    lib = { identify_htmltag, mimes, str_inject };
  } catch (error) {
    lib = error;
  } finally {
    return lib;
  }
};
