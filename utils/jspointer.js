"use strict";
/**
 * ES Module type
 * The detail refer tohttps://cdn.jsdelivr.net/npm/@sagold/json-pointer@7.1.2/dist/jsonPointer.js
 * @module jspointer
 */
module.exports = (() => {
  "use strict";
  var t = {
      d: (e, n) => {
        for (var o in n)
          t.o(n, o) &&
            !t.o(e, o) &&
            Object.defineProperty(e, o, { enumerable: !0, get: n[o] });
      },
      o: (t, e) => Object.prototype.hasOwnProperty.call(t, e),
      r: (t) => {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(t, "__esModule", { value: !0 });
      },
    },
    e = {};
  function isRoot(t) {
    return "#" === t || "" === t || (Array.isArray(t) && 0 === t.length) || !1;
  }
  t.r(e);
  t.d(e, {
    default: () => _,
    get: () => s,
    isRoot: () => n,
    join: () => P,
    remove: () => m,
    removeUndefinedItems: () => v,
    set: () => g,
    split: () => f,
    splitLast: () => O,
  });

  function split(t) {
    const i = /(^#?\/?)/g;
    function l(t) {
      const o = /~1/g,
        r = /~0/g;
      return t.replace(o, "/").replace(r, "~");
    }
    function u(t) {
      return l(decodeURIComponent(t));
    }
    if (null == t || "string" != typeof t || isRoot(t))
      return Array.isArray(t) ? t.slice() : [];
    const e = t.indexOf("#") >= 0 ? u : l,
      o = (t = t.replace(i, "")).split("/");
    for (let t = 0, n = o.length; t < n; t += 1) o[t] = e(o[t]);
    return o;
  }
  function get(t, e, o = void 0) {
    function c(t, e) {
      const n = e.shift();
      if (void 0 !== t) return void 0 !== n ? c(t[n], e) : t;
    }
    if (null == e || null == t) return o;
    if (isRoot(e)) return t;

    const r = c(t, split(e));
    return void 0 === r ? o : r;
  }

  function set(t, e, n) {
    const p = /^\[.*\]$/,
      d = /^[[{](.+)[\]}]$/;
    function a(t, e) {
      return (
        "__proto__" === t ||
        ("constructor" == t && e.length > 0 && "prototype" == e[0])
      );
    }
    function y(t, e, n) {
      var o, r;
      const i =
        null !==
          (r = null === (o = e.match(d)) || void 0 === o ? void 0 : o.pop()) &&
        void 0 !== r
          ? r
          : e;
      "[]" === e && Array.isArray(t) ? t.push(n) : a(i, t) || (t[i] = n);
    }
    function h(t, e, n) {
      function a(t, e) {
        return (
          "__proto__" === t ||
          ("constructor" == t && e.length > 0 && "prototype" == e[0])
        );
      }
      function y(t, e, n) {
        var o, r;
        const i =
          null !==
            (r =
              null === (o = e.match(d)) || void 0 === o ? void 0 : o.pop()) &&
          void 0 !== r
            ? r
            : e;
        "[]" === e && Array.isArray(t) ? t.push(n) : a(i, t) || (t[i] = n);
      }
      var o, r;
      const i =
        null !==
          (r = null === (o = e.match(d)) || void 0 === o ? void 0 : o.pop()) &&
        void 0 !== r
          ? r
          : e;
      if (null != t[i]) return t[i];
      const l = n ? [] : {};
      return y(t, e, l), l;
    }

    if (null == e) return t;
    const o = split(e);
    if (0 === o.length) return t;
    null == t && (t = p.test(o[0]) ? [] : {});
    let r,
      i,
      l = t;
    for (; o.length > 1; )
      (r = o.shift()),
        (i = p.test(o[0]) || `${parseInt(o[0])}` === o[0]),
        a(r, o) || (l = h(l, r, i));
    return (r = o.pop()), y(l, r, n), t;
  }

  function removeUndefinedItems(t) {
    let e = 0,
      n = 0;
    for (; e + n < t.length; )
      void 0 === t[e + n] && (n += 1), (t[e] = t[e + n]), (e += 1);
    return (t.length = t.length - n), t;
  }
  function remove(t, e, n) {
    const o = split(e),
      r = o.pop(),
      i = get(t, o);
    return i && delete i[r], Array.isArray(i) && !0 !== n && v(i), t;
  }

  function join(t, ...e) {
    const n = [];
    const j = /~/g,
      b = /\//g;
    function A(t, e) {
      if (0 === t.length) return e ? "#" : "";
      for (let n = 0, o = t.length; n < o; n += 1)
        (t[n] = t[n].replace(j, "~0").replace(b, "~1")),
          e && (t[n] = encodeURIComponent(t[n]));
      return (e ? "#/" : "/") + t.join("/");
    }
    if (Array.isArray(t)) return A(t, !0 === arguments[1]);
    const o = arguments[arguments.length - 1],
      r = "boolean" == typeof o ? o : t && "#" === t[0];
    for (let t = 0, e = arguments.length; t < e; t += 1)
      n.push.apply(n, split(arguments[t]));
    const i = [];
    for (let t = 0, e = n.length; t < e; t += 1)
      if (".." === n[t]) {
        if (0 === i.length) return r ? "#" : "";
        i.pop();
      } else i.push(n[t]);
    return A(i, r);
  }
  function splitLast(t) {
    const e = split(t);
    if (0 === e.length)
      return "string" == typeof t && "#" === t[0] ? ["#", e[0]] : ["", void 0];
    if (1 === e.length) return "#" === t[0] ? ["#", e[0]] : ["", e[0]];
    const n = e.pop();
    return [join(e, "#" === t[0]), n];
  }
  const _ = {
    get,
    set,
    remove,
    join,
    split,
    splitLast,
    isRoot,
    removeUndefinedItems,
  };
  return e;
})();
