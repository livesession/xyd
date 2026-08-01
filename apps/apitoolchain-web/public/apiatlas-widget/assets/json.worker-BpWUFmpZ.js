const Ml = function() {
  return 0;
};
Object.assign(/* @__PURE__ */ Object.create(null), {
  NONE: 0,
  DIRHANDLE: 1,
  DNSCHANNEL: 2,
  ELDHISTOGRAM: 3,
  FILEHANDLE: 4,
  FILEHANDLECLOSEREQ: 5,
  BLOBREADER: 6,
  FSEVENTWRAP: 7,
  FSREQCALLBACK: 8,
  FSREQPROMISE: 9,
  GETADDRINFOREQWRAP: 10,
  GETNAMEINFOREQWRAP: 11,
  HEAPSNAPSHOT: 12,
  HTTP2SESSION: 13,
  HTTP2STREAM: 14,
  HTTP2PING: 15,
  HTTP2SETTINGS: 16,
  HTTPINCOMINGMESSAGE: 17,
  HTTPCLIENTREQUEST: 18,
  JSSTREAM: 19,
  JSUDPWRAP: 20,
  MESSAGEPORT: 21,
  PIPECONNECTWRAP: 22,
  PIPESERVERWRAP: 23,
  PIPEWRAP: 24,
  PROCESSWRAP: 25,
  PROMISE: 26,
  QUERYWRAP: 27,
  QUIC_ENDPOINT: 28,
  QUIC_LOGSTREAM: 29,
  QUIC_PACKET: 30,
  QUIC_SESSION: 31,
  QUIC_STREAM: 32,
  QUIC_UDP: 33,
  SHUTDOWNWRAP: 34,
  SIGNALWRAP: 35,
  STATWATCHER: 36,
  STREAMPIPE: 37,
  TCPCONNECTWRAP: 38,
  TCPSERVERWRAP: 39,
  TCPWRAP: 40,
  TTYWRAP: 41,
  UDPSENDWRAP: 42,
  UDPWRAP: 43,
  SIGINTWATCHDOG: 44,
  WORKER: 45,
  WORKERHEAPSNAPSHOT: 46,
  WRITEWRAP: 47,
  ZLIB: 48,
  CHECKPRIMEREQUEST: 49,
  PBKDF2REQUEST: 50,
  KEYPAIRGENREQUEST: 51,
  KEYGENREQUEST: 52,
  KEYEXPORTREQUEST: 53,
  CIPHERREQUEST: 54,
  DERIVEBITSREQUEST: 55,
  HASHREQUEST: 56,
  RANDOMBYTESREQUEST: 57,
  RANDOMPRIMEREQUEST: 58,
  SCRYPTREQUEST: 59,
  SIGNREQUEST: 60,
  TLSWRAP: 61,
  VERIFYREQUEST: 62
});
let Tl = 100;
class Cl {
  __unenv__ = !0;
  type;
  _asyncId;
  _triggerAsyncId;
  constructor(e, n = Ml()) {
    this.type = e, this._asyncId = -1 * Tl++, this._triggerAsyncId = typeof n == "number" ? n : n?.triggerAsyncId;
  }
  static bind(e, n, r) {
    return new xa(n ?? "anonymous").bind(e);
  }
  bind(e, n) {
    const r = (...i) => this.runInAsyncScope(e, n, ...i);
    return r.asyncResource = this, r;
  }
  runInAsyncScope(e, n, ...r) {
    return e.apply(n, r);
  }
  emitDestroy() {
    return this;
  }
  asyncId() {
    return this._asyncId;
  }
  triggerAsyncId() {
    return this._triggerAsyncId;
  }
}
const xa = globalThis.AsyncResource || Cl;
let Dt = 10;
const Il = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
}).prototype), _a = (t, e) => t, Bt = Error, Pl = Error, _t = Error, Wn = Error, Fl = Error, $r = /* @__PURE__ */ Symbol.for("nodejs.rejection"), Oe = /* @__PURE__ */ Symbol.for("kCapture"), xr = /* @__PURE__ */ Symbol.for("events.errorMonitor"), At = /* @__PURE__ */ Symbol.for("shapeMode"), Hn = /* @__PURE__ */ Symbol.for("events.maxEventTargetListeners"), Dl = /* @__PURE__ */ Symbol.for("kEnhanceStackBeforeInspector"), Bl = /* @__PURE__ */ Symbol.for("nodejs.watermarkData"), _r = /* @__PURE__ */ Symbol.for("kEventEmitter"), dt = /* @__PURE__ */ Symbol.for("kAsyncResource"), Vl = /* @__PURE__ */ Symbol.for("kFirstEventParam"), qr = /* @__PURE__ */ Symbol.for("kResistStopPropagation"), is = /* @__PURE__ */ Symbol.for("events.maxEventTargetListenersWarned");
class je {
  _events = void 0;
  _eventsCount = 0;
  _maxListeners = Dt;
  [Oe] = !1;
  [At] = !1;
  static captureRejectionSymbol = $r;
  static errorMonitor = xr;
  static kMaxEventTargetListeners = Hn;
  static kMaxEventTargetListenersWarned = is;
  static usingDomains = !1;
  static get on() {
    return $l;
  }
  static get once() {
    return ql;
  }
  static get getEventListeners() {
    return jl;
  }
  static get getMaxListeners() {
    return Wl;
  }
  static get addAbortListener() {
    return La;
  }
  static get EventEmitterAsyncResource() {
    return Ol;
  }
  static get EventEmitter() {
    return je;
  }
  static setMaxListeners(e = Dt, ...n) {
    if (n.length === 0)
      Dt = e;
    else
      for (const r of n)
        if (Aa(r))
          r[Hn] = e, r[is] = !1;
        else if (typeof r.setMaxListeners == "function")
          r.setMaxListeners(e);
        else
          throw new _t(
            "eventTargets",
            ["EventEmitter", "EventTarget"],
            // @ts-expect-error
            r
          );
  }
  static listenerCount(e, n) {
    if (typeof e.listenerCount == "function")
      return e.listenerCount(n);
    je.prototype.listenerCount.call(e, n);
  }
  static init() {
    throw new Error("EventEmitter.init() is not implemented.");
  }
  static get captureRejections() {
    return this[Oe];
  }
  static set captureRejections(e) {
    this[Oe] = e;
  }
  static get defaultMaxListeners() {
    return Dt;
  }
  static set defaultMaxListeners(e) {
    Dt = e;
  }
  constructor(e) {
    this._events === void 0 || this._events === Object.getPrototypeOf(this)._events ? (this._events = { __proto__: null }, this._eventsCount = 0, this[At] = !1) : this[At] = !0, this._maxListeners = this._maxListeners || void 0, e?.captureRejections ? this[Oe] = !!e.captureRejections : this[Oe] = je.prototype[Oe];
  }
  /**
  * Increases the max listeners of the event emitter.
  * @param {number} n
  * @returns {EventEmitter}
  */
  setMaxListeners(e) {
    return this._maxListeners = e, this;
  }
  /**
  * Returns the current max listener value for the event emitter.
  * @returns {number}
  */
  getMaxListeners() {
    return qi(this);
  }
  /**
  * Synchronously calls each of the listeners registered
  * for the event.
  * @param {...any} [args]
  * @returns {boolean}
  */
  emit(e, ...n) {
    let r = e === "error";
    const i = this._events;
    if (i !== void 0)
      r && i[xr] !== void 0 && this.emit(xr, ...n), r = r && i.error === void 0;
    else if (!r) return !1;
    if (r) {
      let o;
      if (n.length > 0 && (o = n[0]), o instanceof Error) {
        try {
          const u = {};
          Error.captureStackTrace?.(u, je.prototype.emit), Object.defineProperty(o, Dl, {
            __proto__: null,
            value: Function.prototype.bind(zl, this, o, u),
            configurable: !0
          });
        } catch {
        }
        throw o;
      }
      let l;
      try {
        l = _a(o);
      } catch {
        l = o;
      }
      const a = new Pl(l);
      throw a.context = o, a;
    }
    const s = i[e];
    if (s === void 0) return !1;
    if (typeof s == "function") {
      const o = s.apply(this, n);
      o != null && as(this, o, e, n);
    } else {
      const o = s.length, l = ji(s);
      for (let a = 0; a < o; ++a) {
        const u = l[a].apply(this, n);
        u != null && as(this, u, e, n);
      }
    }
    return !0;
  }
  /**
  * Adds a listener to the event emitter.
  * @returns {EventEmitter}
  */
  addListener(e, n) {
    return ls(this, e, n, !1), this;
  }
  on(e, n) {
    return this.addListener(e, n);
  }
  /**
  * Adds the `listener` function to the beginning of
  * the listeners array.
  */
  prependListener(e, n) {
    return ls(this, e, n, !0), this;
  }
  /**
  * Adds a one-time `listener` function to the event emitter.
  */
  once(e, n) {
    return this.on(e, us(this, e, n)), this;
  }
  /**
  * Adds a one-time `listener` function to the beginning of
  * the listeners array.
  */
  prependOnceListener(e, n) {
    return this.prependListener(e, us(this, e, n)), this;
  }
  /**
  * Removes the specified `listener` from the listeners array.
  * @param {string | symbol} type
  * @param {Function} listener
  * @returns {EventEmitter}
  */
  removeListener(e, n) {
    const r = this._events;
    if (r === void 0) return this;
    const i = r[e];
    if (i === void 0) return this;
    if (i === n || i.listener === n)
      this._eventsCount -= 1, this[At] ? r[e] = void 0 : this._eventsCount === 0 ? this._events = { __proto__: null } : (delete r[e], r.removeListener && this.emit("removeListener", e, i.listener || n));
    else if (typeof i != "function") {
      let s = -1;
      for (let o = i.length - 1; o >= 0; o--)
        if (i[o] === n || i[o].listener === n) {
          s = o;
          break;
        }
      if (s < 0) return this;
      s === 0 ? i.shift() : Xl(i, s), i.length === 1 && (r[e] = i[0]), r.removeListener !== void 0 && this.emit("removeListener", e, n);
    }
    return this;
  }
  off(e, n) {
    return this.removeListener(e, n);
  }
  /**
  * Removes all listeners from the event emitter. (Only
  * removes listeners for a specific event name if specified
  * as `type`).
  */
  removeAllListeners(e) {
    const n = this._events;
    if (n === void 0) return this;
    if (n.removeListener === void 0)
      return arguments.length === 0 ? (this._events = { __proto__: null }, this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = { __proto__: null } : delete n[e]), this[At] = !1, this;
    if (arguments.length === 0) {
      for (const i of Reflect.ownKeys(n))
        i !== "removeListener" && this.removeAllListeners(i);
      return this.removeAllListeners("removeListener"), this._events = { __proto__: null }, this._eventsCount = 0, this[At] = !1, this;
    }
    const r = n[e];
    if (typeof r == "function")
      this.removeListener(e, r);
    else if (r !== void 0)
      for (let i = r.length - 1; i >= 0; i--)
        this.removeListener(e, r[i]);
    return this;
  }
  /**
  * Returns a copy of the array of listeners for the event name
  * specified as `type`.
  * @param {string | symbol} type
  * @returns {Function[]}
  */
  listeners(e) {
    return cs(this, e, !0);
  }
  /**
  * Returns a copy of the array of listeners and wrappers for
  * the event name specified as `type`.
  * @returns {Function[]}
  */
  rawListeners(e) {
    return cs(this, e, !1);
  }
  /**
  * Returns an array listing the events for which
  * the emitter has registered listeners.
  * @returns {any[]}
  */
  eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  }
  /**
  * Returns the number of listeners listening to event name
  */
  listenerCount(e, n) {
    const r = this._events;
    if (r !== void 0) {
      const i = r[e];
      if (typeof i == "function")
        return n != null ? n === i || n === i.listener ? 1 : 0 : 1;
      if (i !== void 0) {
        if (n != null) {
          let s = 0;
          for (let o = 0, l = i.length; o < l; o++)
            (i[o] === n || i[o].listener === n) && s++;
          return s;
        }
        return i.length;
      }
    }
    return 0;
  }
}
class Ol extends je {
  /**
  * @param {{
  *   name?: string,
  *   triggerAsyncId?: number,
  *   requireManualDestroy?: boolean,
  * }} [options]
  */
  constructor(e) {
    let n;
    typeof e == "string" ? (n = e, e = void 0) : n = e?.name || new.target.name, super(e), this[dt] = new Ul(this, n, e);
  }
  /**
  * @param {symbol,string} event
  * @param  {...any} args
  * @returns {boolean}
  */
  emit(e, ...n) {
    if (this[dt] === void 0) throw new Bt("EventEmitterAsyncResource");
    const { asyncResource: r } = this;
    return Array.prototype.unshift(n, super.emit, this, e), Reflect.apply(r.runInAsyncScope, r, n);
  }
  /**
  * @returns {void}
  */
  emitDestroy() {
    if (this[dt] === void 0) throw new Bt("EventEmitterAsyncResource");
    this.asyncResource.emitDestroy();
  }
  /**
  * @type {number}
  */
  get asyncId() {
    if (this[dt] === void 0) throw new Bt("EventEmitterAsyncResource");
    return this.asyncResource.asyncId();
  }
  /**
  * @type {number}
  */
  get triggerAsyncId() {
    if (this[dt] === void 0) throw new Bt("EventEmitterAsyncResource");
    return this.asyncResource.triggerAsyncId();
  }
  /**
  * @type {EventEmitterReferencingAsyncResource}
  */
  get asyncResource() {
    if (this[dt] === void 0) throw new Bt("EventEmitterAsyncResource");
    return this[dt];
  }
}
class Ul extends xa {
  /**
  * @param {EventEmitter} ee
  * @param {string} [type]
  * @param {{
  *   triggerAsyncId?: number,
  *   requireManualDestroy?: boolean,
  * }} [options]
  */
  constructor(e, n, r) {
    super(n, r), this[_r] = e;
  }
  /**
  * @type {EventEmitter}
  */
  get eventEmitter() {
    if (this[_r] === void 0) throw new Bt("EventEmitterReferencingAsyncResource");
    return this[_r];
  }
}
const $l = function(e, n, r = {}) {
  const i = r.signal;
  if (i?.aborted)
    throw new Wn(void 0, { cause: i?.reason });
  const s = r.highWaterMark ?? r.highWatermark ?? Number.MAX_SAFE_INTEGER, o = r.lowWaterMark ?? r.lowWatermark ?? 1, l = new os(), a = new os();
  let u = !1, h = null, c = !1, m = 0;
  const d = Object.setPrototypeOf({
    next() {
      if (m) {
        const x = l.shift();
        return m--, u && m < o && (e.resume?.(), u = !1), Promise.resolve(Nr(x, !1));
      }
      if (h) {
        const x = Promise.reject(h);
        return h = null, x;
      }
      return c ? b() : new Promise(function(x, A) {
        a.push({
          resolve: x,
          reject: A
        });
      });
    },
    return() {
      return b();
    },
    throw(x) {
      if (!x || !(x instanceof Error))
        throw new _t(
          "EventEmitter.AsyncIterator",
          "Error",
          // @ts-expect-error
          x
        );
      w(x);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    [Bl]: {
      get size() {
        return m;
      },
      get low() {
        return o;
      },
      get high() {
        return s;
      },
      get isPaused() {
        return u;
      }
    }
  }, Il), { addEventListener: g, removeAll: p } = Ql();
  g(e, n, r[Vl] ? v : function(...x) {
    return v(x);
  }), n !== "error" && typeof e.on == "function" && g(e, "error", w);
  const y = r?.close;
  if (y?.length)
    for (const x of y)
      g(e, x, b);
  const _ = i ? La(i, L) : null;
  return d;
  function L() {
    w(new Wn(void 0, { cause: i?.reason }));
  }
  function v(x) {
    a.isEmpty() ? (m++, !u && m > s && (u = !0, e.pause?.()), l.push(x)) : a.shift().resolve(Nr(x, !1));
  }
  function w(x) {
    a.isEmpty() ? h = x : a.shift().reject(x), b();
  }
  function b() {
    _?.[Symbol.dispose](), p(), c = !0;
    const x = Nr(void 0, !0);
    for (; !a.isEmpty(); )
      a.shift().resolve(x);
    return Promise.resolve(x);
  }
}, ql = async function(e, n, r = {}) {
  const i = r?.signal;
  if (i?.aborted)
    throw new Wn(void 0, { cause: i?.reason });
  return new Promise((s, o) => {
    const l = (c) => {
      typeof e.removeListener == "function" && e.removeListener(n, a), i != null && fn(i, "abort", h), o(c);
    }, a = (...c) => {
      typeof e.removeListener == "function" && e.removeListener("error", l), i != null && fn(i, "abort", h), s(c);
    }, u = {
      __proto__: null,
      once: !0,
      [qr]: !0
    };
    jr(e, n, a, u), n !== "error" && typeof e.once == "function" && e.once("error", l);
    function h() {
      fn(e, n, a), fn(e, "error", l), o(new Wn(void 0, { cause: i?.reason }));
    }
    i != null && jr(i, "abort", h, {
      __proto__: null,
      once: !0,
      [qr]: !0
    });
  });
}, La = function(e, n) {
  if (e === void 0)
    throw new _t("signal", "AbortSignal", e);
  let r;
  return e.aborted ? queueMicrotask(() => n()) : (e.addEventListener("abort", n, {
    __proto__: null,
    once: !0,
    [qr]: !0
  }), r = () => {
    e.removeEventListener("abort", n);
  }), {
    __proto__: null,
    [Symbol.dispose]() {
      r?.();
    }
  };
}, jl = function(e, n) {
  if (typeof e.listeners == "function")
    return e.listeners(n);
  if (Aa(e)) {
    const r = e[kEvents].get(n), i = [];
    let s = r?.next;
    for (; s?.listener !== void 0; ) {
      const o = s.listener?.deref ? s.listener.deref() : s.listener;
      i.push(o), s = s.next;
    }
    return i;
  }
  throw new _t(
    "emitter",
    ["EventEmitter", "EventTarget"],
    // @ts-expect-error
    e
  );
}, Wl = function(e) {
  if (typeof e?.getMaxListeners == "function")
    return qi(e);
  if (e?.[Hn])
    return e[Hn];
  throw new _t(
    "emitter",
    ["EventEmitter", "EventTarget"],
    // @ts-expect-error
    e
  );
}, Na = 2048, Lr = Na - 1;
class ss {
  bottom;
  top;
  list;
  next;
  constructor() {
    this.bottom = 0, this.top = 0, this.list = new Array(Na), this.next = null;
  }
  isEmpty() {
    return this.top === this.bottom;
  }
  isFull() {
    return (this.top + 1 & Lr) === this.bottom;
  }
  push(e) {
    this.list[this.top] = e, this.top = this.top + 1 & Lr;
  }
  shift() {
    const e = this.list[this.bottom];
    return e === void 0 ? null : (this.list[this.bottom] = void 0, this.bottom = this.bottom + 1 & Lr, e);
  }
}
class os {
  head;
  tail;
  constructor() {
    this.head = this.tail = new ss();
  }
  isEmpty() {
    return this.head.isEmpty();
  }
  push(e) {
    this.head.isFull() && (this.head = this.head.next = new ss()), this.head.push(e);
  }
  shift() {
    const e = this.tail, n = e.shift();
    return e.isEmpty() && e.next !== null && (this.tail = e.next, e.next = null), n;
  }
}
function Aa(t) {
  return typeof t?.addEventListener == "function";
}
function as(t, e, n, r) {
  if (t[Oe])
    try {
      const i = e.then;
      typeof i == "function" && i.call(e, void 0, function(s) {
        ve.nextTick(Hl, t, s, n, r);
      });
    } catch (i) {
      t.emit("error", i);
    }
}
function Hl(t, e, n, r) {
  if (typeof t[$r] == "function")
    t[$r](e, n, ...r);
  else {
    const i = t[Oe];
    try {
      t[Oe] = !1, t.emit("error", e);
    } finally {
      t[Oe] = i;
    }
  }
}
function qi(t) {
  return t._maxListeners === void 0 ? Dt : t._maxListeners;
}
function zl(t, e) {
  let n = "";
  try {
    const { name: s } = this.constructor;
    s !== "EventEmitter" && (n = ` on ${s} instance`);
  } catch {
  }
  const r = `
Emitted 'error' event${n} at:
`, i = (e.stack || "").split(`
`).slice(1);
  return t.stack + r + i.join(`
`);
}
function ls(t, e, n, r) {
  let i, s, o;
  if (s = t._events, s === void 0 ? (s = t._events = { __proto__: null }, t._eventsCount = 0) : (s.newListener !== void 0 && (t.emit("newListener", e, n.listener ?? n), s = t._events), o = s[e]), o === void 0)
    s[e] = n, ++t._eventsCount;
  else if (typeof o == "function" ? o = s[e] = r ? [n, o] : [o, n] : r ? o.unshift(n) : o.push(n), i = qi(t), i > 0 && o.length > i && !o.warned) {
    o.warned = !0;
    const l = new Fl(`Possible EventEmitter memory leak detected. ${o.length} ${String(e)} listeners added to ${_a(t)}. MaxListeners is ${i}. Use emitter.setMaxListeners() to increase limit`, {
      name: "MaxListenersExceededWarning",
      emitter: t,
      type: e,
      count: o.length
    });
    ve.emitWarning(l);
  }
  return t;
}
function Gl() {
  if (!this.fired)
    return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function us(t, e, n) {
  const r = {
    fired: !1,
    wrapFn: void 0,
    target: t,
    type: e,
    listener: n
  }, i = Gl.bind(r);
  return i.listener = n, r.wrapFn = i, i;
}
function cs(t, e, n) {
  const r = t._events;
  if (r === void 0) return [];
  const i = r[e];
  return i === void 0 ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? Jl(i) : ji(i);
}
function ji(t) {
  switch (t.length) {
    case 2:
      return [t[0], t[1]];
    case 3:
      return [
        t[0],
        t[1],
        t[2]
      ];
    case 4:
      return [
        t[0],
        t[1],
        t[2],
        t[3]
      ];
    case 5:
      return [
        t[0],
        t[1],
        t[2],
        t[3],
        t[4]
      ];
    case 6:
      return [
        t[0],
        t[1],
        t[2],
        t[3],
        t[4],
        t[5]
      ];
  }
  return Array.prototype.slice(t);
}
function Jl(t) {
  const e = ji(t);
  for (let n = 0; n < e.length; ++n) {
    const r = e[n].listener;
    typeof r == "function" && (e[n] = r);
  }
  return e;
}
function Nr(t, e) {
  return {
    value: t,
    done: e
  };
}
function fn(t, e, n, r) {
  if (typeof t.removeListener == "function")
    t.removeListener(e, n);
  else if (typeof t.removeEventListener == "function")
    t.removeEventListener(e, n, r);
  else
    throw new _t("emitter", "EventEmitter", t);
}
function jr(t, e, n, r) {
  if (typeof t.on == "function")
    r?.once ? t.once(e, n) : t.on(e, n);
  else if (typeof t.addEventListener == "function")
    t.addEventListener(e, n, r);
  else
    throw new _t("emitter", "EventEmitter", t);
}
function Ql() {
  const t = [];
  return {
    addEventListener(e, n, r, i) {
      jr(e, n, r, i), Array.prototype.push(t, [
        e,
        n,
        r,
        i
      ]);
    },
    removeAll() {
      for (; t.length > 0; )
        Reflect.apply(fn, void 0, t.pop());
    }
  };
}
function Xl(t, e) {
  for (; e + 1 < t.length; e++) t[e] = t[e + 1];
  t.pop();
}
// @__NO_SIDE_EFFECTS__
function Yl(...t) {
  return function(...e) {
    for (const n of t)
      n(...e);
  };
}
// @__NO_SIDE_EFFECTS__
function J(t) {
  return new Error(`[unenv] ${t} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function St(t) {
  return Object.assign(() => {
    throw /* @__PURE__ */ J(t);
  }, { __unenv__: !0 });
}
class Wi extends je {
  __unenv__ = !0;
  readableEncoding = null;
  readableEnded = !0;
  readableFlowing = !1;
  readableHighWaterMark = 0;
  readableLength = 0;
  readableObjectMode = !1;
  readableAborted = !1;
  readableDidRead = !1;
  closed = !1;
  errored = null;
  readable = !1;
  destroyed = !1;
  static from(e, n) {
    return new Wi(n);
  }
  constructor(e) {
    super();
  }
  _read(e) {
  }
  read(e) {
  }
  setEncoding(e) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  isPaused() {
    return !0;
  }
  unpipe(e) {
    return this;
  }
  unshift(e, n) {
  }
  wrap(e) {
    return this;
  }
  push(e, n) {
    return !1;
  }
  _destroy(e, n) {
    this.removeAllListeners();
  }
  destroy(e) {
    return this.destroyed = !0, this._destroy(e), this;
  }
  pipe(e, n) {
    return {};
  }
  compose(e, n) {
    throw new Error("[unenv] Method not implemented.");
  }
  [Symbol.asyncDispose]() {
    return this.destroy(), Promise.resolve();
  }
  async *[Symbol.asyncIterator]() {
    throw /* @__PURE__ */ J("Readable.asyncIterator");
  }
  iterator(e) {
    throw /* @__PURE__ */ J("Readable.iterator");
  }
  map(e, n) {
    throw /* @__PURE__ */ J("Readable.map");
  }
  filter(e, n) {
    throw /* @__PURE__ */ J("Readable.filter");
  }
  forEach(e, n) {
    throw /* @__PURE__ */ J("Readable.forEach");
  }
  reduce(e, n, r) {
    throw /* @__PURE__ */ J("Readable.reduce");
  }
  find(e, n) {
    throw /* @__PURE__ */ J("Readable.find");
  }
  findIndex(e, n) {
    throw /* @__PURE__ */ J("Readable.findIndex");
  }
  some(e, n) {
    throw /* @__PURE__ */ J("Readable.some");
  }
  toArray(e) {
    throw /* @__PURE__ */ J("Readable.toArray");
  }
  every(e, n) {
    throw /* @__PURE__ */ J("Readable.every");
  }
  flatMap(e, n) {
    throw /* @__PURE__ */ J("Readable.flatMap");
  }
  drop(e, n) {
    throw /* @__PURE__ */ J("Readable.drop");
  }
  take(e, n) {
    throw /* @__PURE__ */ J("Readable.take");
  }
  asIndexedPairs(e) {
    throw /* @__PURE__ */ J("Readable.asIndexedPairs");
  }
}
const Sa = globalThis.Readable || Wi, Ue = [], ke = [], Zl = typeof Uint8Array > "u" ? Array : Uint8Array, Ar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let t = 0, e = Ar.length; t < e; ++t)
  Ue[t] = Ar[t], ke[Ar.charCodeAt(t)] = t;
ke[45] = 62;
ke[95] = 63;
function Kl(t) {
  const e = t.length;
  if (e % 4 > 0)
    throw new Error("Invalid string. Length must be a multiple of 4");
  let n = t.indexOf("=");
  n === -1 && (n = e);
  const r = n === e ? 0 : 4 - n % 4;
  return [n, r];
}
function eu(t, e, n) {
  return (e + n) * 3 / 4 - n;
}
function tu(t) {
  let e;
  const n = Kl(t), r = n[0], i = n[1], s = new Zl(eu(t, r, i));
  let o = 0;
  const l = i > 0 ? r - 4 : r;
  let a;
  for (a = 0; a < l; a += 4)
    e = ke[t.charCodeAt(a)] << 18 | ke[t.charCodeAt(a + 1)] << 12 | ke[t.charCodeAt(a + 2)] << 6 | ke[t.charCodeAt(a + 3)], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255;
  return i === 2 && (e = ke[t.charCodeAt(a)] << 2 | ke[t.charCodeAt(a + 1)] >> 4, s[o++] = e & 255), i === 1 && (e = ke[t.charCodeAt(a)] << 10 | ke[t.charCodeAt(a + 1)] << 4 | ke[t.charCodeAt(a + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s;
}
function nu(t) {
  return Ue[t >> 18 & 63] + Ue[t >> 12 & 63] + Ue[t >> 6 & 63] + Ue[t & 63];
}
function ru(t, e, n) {
  let r;
  const i = [];
  for (let s = e; s < n; s += 3)
    r = (t[s] << 16 & 16711680) + (t[s + 1] << 8 & 65280) + (t[s + 2] & 255), i.push(nu(r));
  return i.join("");
}
function fs(t) {
  let e;
  const n = t.length, r = n % 3, i = [], s = 16383;
  for (let o = 0, l = n - r; o < l; o += s)
    i.push(ru(t, o, o + s > l ? l : o + s));
  return r === 1 ? (e = t[n - 1], i.push(Ue[e >> 2] + Ue[e << 4 & 63] + "==")) : r === 2 && (e = (t[n - 2] << 8) + t[n - 1], i.push(Ue[e >> 10] + Ue[e >> 4 & 63] + Ue[e << 2 & 63] + "=")), i.join("");
}
function yr(t, e, n, r, i) {
  let s, o;
  const l = i * 8 - r - 1, a = (1 << l) - 1, u = a >> 1;
  let h = -7, c = n ? i - 1 : 0;
  const m = n ? -1 : 1;
  let d = t[e + c];
  for (c += m, s = d & (1 << -h) - 1, d >>= -h, h += l; h > 0; )
    s = s * 256 + t[e + c], c += m, h -= 8;
  for (o = s & (1 << -h) - 1, s >>= -h, h += r; h > 0; )
    o = o * 256 + t[e + c], c += m, h -= 8;
  if (s === 0)
    s = 1 - u;
  else {
    if (s === a)
      return o ? Number.NaN : (d ? -1 : 1) * Number.POSITIVE_INFINITY;
    o = o + Math.pow(2, r), s = s - u;
  }
  return (d ? -1 : 1) * o * Math.pow(2, s - r);
}
function Ea(t, e, n, r, i, s) {
  let o, l, a, u = s * 8 - i - 1;
  const h = (1 << u) - 1, c = h >> 1, m = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  let d = r ? 0 : s - 1;
  const g = r ? 1 : -1, p = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), Number.isNaN(e) || e === Number.POSITIVE_INFINITY ? (l = Number.isNaN(e) ? 1 : 0, o = h) : (o = Math.floor(Math.log2(e)), e * (a = Math.pow(2, -o)) < 1 && (o--, a *= 2), e += o + c >= 1 ? m / a : m * Math.pow(2, 1 - c), e * a >= 2 && (o++, a /= 2), o + c >= h ? (l = 0, o = h) : o + c >= 1 ? (l = (e * a - 1) * Math.pow(2, i), o = o + c) : (l = e * Math.pow(2, c - 1) * Math.pow(2, i), o = 0)); i >= 8; )
    t[n + d] = l & 255, d += g, l /= 256, i -= 8;
  for (o = o << i | l, u += i; u > 0; )
    t[n + d] = o & 255, d += g, o /= 256, u -= 8;
  t[n + d - g] |= p * 128;
}
const hs = typeof Symbol == "function" && typeof Symbol.for == "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : null, iu = 50, Wr = 2147483647;
M.TYPED_ARRAY_SUPPORT = su();
!M.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This environment lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
function su() {
  try {
    const t = new Uint8Array(1), e = { foo: function() {
      return 42;
    } };
    return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(t, e), t.foo() === 42;
  } catch {
    return !1;
  }
}
Object.defineProperty(M.prototype, "parent", {
  enumerable: !0,
  get: function() {
    if (M.isBuffer(this))
      return this.buffer;
  }
});
Object.defineProperty(M.prototype, "offset", {
  enumerable: !0,
  get: function() {
    if (M.isBuffer(this))
      return this.byteOffset;
  }
});
function Qe(t) {
  if (t > Wr)
    throw new RangeError('The value "' + t + '" is invalid for option "size"');
  const e = new Uint8Array(t);
  return Object.setPrototypeOf(e, M.prototype), e;
}
function M(t, e, n) {
  if (typeof t == "number") {
    if (typeof e == "string")
      throw new TypeError('The "string" argument must be of type string. Received type number');
    return Hi(t);
  }
  return ka(t, e, n);
}
M.poolSize = 8192;
function ka(t, e, n) {
  if (typeof t == "string")
    return au(t, e);
  if (ArrayBuffer.isView(t))
    return lu(t);
  if (t == null)
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
  if (We(t, ArrayBuffer) || t && We(t.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (We(t, SharedArrayBuffer) || t && We(t.buffer, SharedArrayBuffer)))
    return zr(t, e, n);
  if (typeof t == "number")
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  const r = t.valueOf && t.valueOf();
  if (r != null && r !== t)
    return M.from(r, e, n);
  const i = uu(t);
  if (i)
    return i;
  if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof t[Symbol.toPrimitive] == "function")
    return M.from(t[Symbol.toPrimitive]("string"), e, n);
  throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
}
M.from = function(t, e, n) {
  return ka(t, e, n);
};
Object.setPrototypeOf(M.prototype, Uint8Array.prototype);
Object.setPrototypeOf(M, Uint8Array);
function Ra(t) {
  if (typeof t != "number")
    throw new TypeError('"size" argument must be of type number');
  if (t < 0)
    throw new RangeError('The value "' + t + '" is invalid for option "size"');
}
function ou(t, e, n) {
  return Ra(t), t <= 0 ? Qe(t) : e !== void 0 ? typeof n == "string" ? Qe(t).fill(e, n) : Qe(t).fill(e) : Qe(t);
}
M.alloc = function(t, e, n) {
  return ou(t, e, n);
};
function Hi(t) {
  return Ra(t), Qe(t < 0 ? 0 : zi(t) | 0);
}
M.allocUnsafe = function(t) {
  return Hi(t);
};
M.allocUnsafeSlow = function(t) {
  return Hi(t);
};
function au(t, e) {
  if ((typeof e != "string" || e === "") && (e = "utf8"), !M.isEncoding(e))
    throw new TypeError("Unknown encoding: " + e);
  const n = Ma(t, e) | 0;
  let r = Qe(n);
  const i = r.write(t, e);
  return i !== n && (r = r.slice(0, i)), r;
}
function Hr(t) {
  const e = t.length < 0 ? 0 : zi(t.length) | 0, n = Qe(e);
  for (let r = 0; r < e; r += 1)
    n[r] = t[r] & 255;
  return n;
}
function lu(t) {
  if (We(t, Uint8Array)) {
    const e = new Uint8Array(t);
    return zr(e.buffer, e.byteOffset, e.byteLength);
  }
  return Hr(t);
}
function zr(t, e, n) {
  if (e < 0 || t.byteLength < e)
    throw new RangeError('"offset" is outside of buffer bounds');
  if (t.byteLength < e + (n || 0))
    throw new RangeError('"length" is outside of buffer bounds');
  let r;
  return e === void 0 && n === void 0 ? r = new Uint8Array(t) : n === void 0 ? r = new Uint8Array(t, e) : r = new Uint8Array(t, e, n), Object.setPrototypeOf(r, M.prototype), r;
}
function uu(t) {
  if (M.isBuffer(t)) {
    const e = zi(t.length) | 0, n = Qe(e);
    return n.length === 0 || t.copy(n, 0, 0, e), n;
  }
  if (t.length !== void 0)
    return typeof t.length != "number" || Ji(t.length) ? Qe(0) : Hr(t);
  if (t.type === "Buffer" && Array.isArray(t.data))
    return Hr(t.data);
}
function zi(t) {
  if (t >= Wr)
    throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + Wr.toString(16) + " bytes");
  return t | 0;
}
M.isBuffer = function(e) {
  return e != null && e._isBuffer === !0 && e !== M.prototype;
};
M.compare = function(e, n) {
  if (We(e, Uint8Array) && (e = M.from(e, e.offset, e.byteLength)), We(n, Uint8Array) && (n = M.from(n, n.offset, n.byteLength)), !M.isBuffer(e) || !M.isBuffer(n))
    throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  if (e === n)
    return 0;
  let r = e.length, i = n.length;
  for (let s = 0, o = Math.min(r, i); s < o; ++s)
    if (e[s] !== n[s]) {
      r = e[s], i = n[s];
      break;
    }
  return r < i ? -1 : i < r ? 1 : 0;
};
M.isEncoding = function(e) {
  switch (String(e).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return !0;
    default:
      return !1;
  }
};
M.concat = function(e, n) {
  if (!Array.isArray(e))
    throw new TypeError('"list" argument must be an Array of Buffers');
  if (e.length === 0)
    return M.alloc(0);
  let r;
  if (n === void 0)
    for (n = 0, r = 0; r < e.length; ++r)
      n += e[r].length;
  const i = M.allocUnsafe(n);
  let s = 0;
  for (r = 0; r < e.length; ++r) {
    let o = e[r];
    if (We(o, Uint8Array))
      s + o.length > i.length ? (M.isBuffer(o) || (o = M.from(o.buffer, o.byteOffset, o.byteLength)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s);
    else if (M.isBuffer(o))
      o.copy(i, s);
    else
      throw new TypeError('"list" argument must be an Array of Buffers');
    s += o.length;
  }
  return i;
};
function Ma(t, e) {
  if (M.isBuffer(t))
    return t.length;
  if (ArrayBuffer.isView(t) || We(t, ArrayBuffer))
    return t.byteLength;
  if (typeof t != "string")
    throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof t);
  const n = t.length, r = arguments.length > 2 && arguments[2] === !0;
  if (!r && n === 0)
    return 0;
  let i = !1;
  for (; ; )
    switch (e) {
      case "ascii":
      case "latin1":
      case "binary":
        return n;
      case "utf8":
      case "utf-8":
        return Gr(t).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return n * 2;
      case "hex":
        return n >>> 1;
      case "base64":
        return Oa(t).length;
      default:
        if (i)
          return r ? -1 : Gr(t).length;
        e = ("" + e).toLowerCase(), i = !0;
    }
}
M.byteLength = Ma;
function cu(t, e, n) {
  let r = !1;
  if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((n === void 0 || n > this.length) && (n = this.length), n <= 0) || (n >>>= 0, e >>>= 0, n <= e))
    return "";
  for (t || (t = "utf8"); ; )
    switch (t) {
      case "hex":
        return wu(this, e, n);
      case "utf8":
      case "utf-8":
        return Ca(this, e, n);
      case "ascii":
        return yu(this, e, n);
      case "latin1":
      case "binary":
        return vu(this, e, n);
      case "base64":
        return pu(this, e, n);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return xu(this, e, n);
      default:
        if (r)
          throw new TypeError("Unknown encoding: " + t);
        t = (t + "").toLowerCase(), r = !0;
    }
}
M.prototype._isBuffer = !0;
function yt(t, e, n) {
  const r = t[e];
  t[e] = t[n], t[n] = r;
}
M.prototype.swap16 = function() {
  const e = this.length;
  if (e % 2 !== 0)
    throw new RangeError("Buffer size must be a multiple of 16-bits");
  for (let n = 0; n < e; n += 2)
    yt(this, n, n + 1);
  return this;
};
M.prototype.swap32 = function() {
  const e = this.length;
  if (e % 4 !== 0)
    throw new RangeError("Buffer size must be a multiple of 32-bits");
  for (let n = 0; n < e; n += 4)
    yt(this, n, n + 3), yt(this, n + 1, n + 2);
  return this;
};
M.prototype.swap64 = function() {
  const e = this.length;
  if (e % 8 !== 0)
    throw new RangeError("Buffer size must be a multiple of 64-bits");
  for (let n = 0; n < e; n += 8)
    yt(this, n, n + 7), yt(this, n + 1, n + 6), yt(this, n + 2, n + 5), yt(this, n + 3, n + 4);
  return this;
};
M.prototype.toString = function() {
  const e = this.length;
  return e === 0 ? "" : arguments.length === 0 ? Ca(this, 0, e) : Reflect.apply(cu, this, arguments);
};
M.prototype.toLocaleString = M.prototype.toString;
M.prototype.equals = function(e) {
  if (!M.isBuffer(e))
    throw new TypeError("Argument must be a Buffer");
  return this === e ? !0 : M.compare(this, e) === 0;
};
M.prototype.inspect = function() {
  let e = "";
  const n = iu;
  return e = this.toString("hex", 0, n).replace(/(.{2})/g, "$1 ").trim(), this.length > n && (e += " ... "), "<Buffer " + e + ">";
};
hs && (M.prototype[hs] = M.prototype.inspect);
M.prototype.compare = function(e, n, r, i, s) {
  if (We(e, Uint8Array) && (e = M.from(e, e.offset, e.byteLength)), !M.isBuffer(e))
    throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e);
  if (n === void 0 && (n = 0), r === void 0 && (r = e ? e.length : 0), i === void 0 && (i = 0), s === void 0 && (s = this.length), n < 0 || r > e.length || i < 0 || s > this.length)
    throw new RangeError("out of range index");
  if (i >= s && n >= r)
    return 0;
  if (i >= s)
    return -1;
  if (n >= r)
    return 1;
  if (n >>>= 0, r >>>= 0, i >>>= 0, s >>>= 0, this === e)
    return 0;
  let o = s - i, l = r - n;
  const a = Math.min(o, l), u = this.slice(i, s), h = e.slice(n, r);
  for (let c = 0; c < a; ++c)
    if (u[c] !== h[c]) {
      o = u[c], l = h[c];
      break;
    }
  return o < l ? -1 : l < o ? 1 : 0;
};
function Ta(t, e, n, r, i) {
  if (t.length === 0)
    return -1;
  if (typeof n == "string" ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), n = +n, Ji(n) && (n = i ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) {
    if (i)
      return -1;
    n = t.length - 1;
  } else if (n < 0)
    if (i)
      n = 0;
    else
      return -1;
  if (typeof e == "string" && (e = M.from(e, r)), M.isBuffer(e))
    return e.length === 0 ? -1 : ms(t, e, n, r, i);
  if (typeof e == "number")
    return e = e & 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : ms(t, [e], n, r, i);
  throw new TypeError("val must be string, number or Buffer");
}
function ms(t, e, n, r, i) {
  let s = 1, o = t.length, l = e.length;
  if (r !== void 0 && (r = String(r).toLowerCase(), r === "ucs2" || r === "ucs-2" || r === "utf16le" || r === "utf-16le")) {
    if (t.length < 2 || e.length < 2)
      return -1;
    s = 2, o /= 2, l /= 2, n /= 2;
  }
  function a(h, c) {
    return s === 1 ? h[c] : h.readUInt16BE(c * s);
  }
  let u;
  if (i) {
    let h = -1;
    for (u = n; u < o; u++)
      if (a(t, u) === a(e, h === -1 ? 0 : u - h)) {
        if (h === -1 && (h = u), u - h + 1 === l)
          return h * s;
      } else
        h !== -1 && (u -= u - h), h = -1;
  } else
    for (n + l > o && (n = o - l), u = n; u >= 0; u--) {
      let h = !0;
      for (let c = 0; c < l; c++)
        if (a(t, u + c) !== a(e, c)) {
          h = !1;
          break;
        }
      if (h)
        return u;
    }
  return -1;
}
M.prototype.includes = function(e, n, r) {
  return this.indexOf(e, n, r) !== -1;
};
M.prototype.indexOf = function(e, n, r) {
  return Ta(this, e, n, r, !0);
};
M.prototype.lastIndexOf = function(e, n, r) {
  return Ta(this, e, n, r, !1);
};
function fu(t, e, n, r) {
  n = Number(n) || 0;
  const i = t.length - n;
  r ? (r = Number(r), r > i && (r = i)) : r = i;
  const s = e.length;
  r > s / 2 && (r = s / 2);
  let o;
  for (o = 0; o < r; ++o) {
    const l = Number.parseInt(e.slice(o * 2, o * 2 + 2), 16);
    if (Ji(l))
      return o;
    t[n + o] = l;
  }
  return o;
}
function hu(t, e, n, r) {
  return vr(Gr(e, t.length - n), t, n, r);
}
function mu(t, e, n, r) {
  return vr(Au(e), t, n, r);
}
function du(t, e, n, r) {
  return vr(Oa(e), t, n, r);
}
function gu(t, e, n, r) {
  return vr(Su(e, t.length - n), t, n, r);
}
M.prototype.write = function(e, n, r, i) {
  if (n === void 0)
    i = "utf8", r = this.length, n = 0;
  else if (r === void 0 && typeof n == "string")
    i = n, r = this.length, n = 0;
  else if (Number.isFinite(n))
    n = n >>> 0, Number.isFinite(r) ? (r = r >>> 0, i === void 0 && (i = "utf8")) : (i = r, r = void 0);
  else
    throw new TypeError("Buffer.write(string, encoding, offset[, length]) is no longer supported");
  const s = this.length - n;
  if ((r === void 0 || r > s) && (r = s), e.length > 0 && (r < 0 || n < 0) || n > this.length)
    throw new RangeError("Attempt to write outside buffer bounds");
  i || (i = "utf8");
  let o = !1;
  for (; ; )
    switch (i) {
      case "hex":
        return fu(this, e, n, r);
      case "utf8":
      case "utf-8":
        return hu(this, e, n, r);
      case "ascii":
      case "latin1":
      case "binary":
        return mu(this, e, n, r);
      case "base64":
        return du(this, e, n, r);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return gu(this, e, n, r);
      default:
        if (o)
          throw new TypeError("Unknown encoding: " + i);
        i = ("" + i).toLowerCase(), o = !0;
    }
};
M.prototype.toJSON = function() {
  return {
    type: "Buffer",
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function pu(t, e, n) {
  return e === 0 && n === t.length ? fs(t) : fs(t.slice(e, n));
}
function Ca(t, e, n) {
  n = Math.min(t.length, n);
  const r = [];
  let i = e;
  for (; i < n; ) {
    const s = t[i];
    let o = null, l = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
    if (i + l <= n) {
      let a, u, h, c;
      switch (l) {
        case 1:
          s < 128 && (o = s);
          break;
        case 2:
          a = t[i + 1], (a & 192) === 128 && (c = (s & 31) << 6 | a & 63, c > 127 && (o = c));
          break;
        case 3:
          a = t[i + 1], u = t[i + 2], (a & 192) === 128 && (u & 192) === 128 && (c = (s & 15) << 12 | (a & 63) << 6 | u & 63, c > 2047 && (c < 55296 || c > 57343) && (o = c));
          break;
        case 4:
          a = t[i + 1], u = t[i + 2], h = t[i + 3], (a & 192) === 128 && (u & 192) === 128 && (h & 192) === 128 && (c = (s & 15) << 18 | (a & 63) << 12 | (u & 63) << 6 | h & 63, c > 65535 && c < 1114112 && (o = c));
      }
    }
    o === null ? (o = 65533, l = 1) : o > 65535 && (o -= 65536, r.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), r.push(o), i += l;
  }
  return bu(r);
}
const ds = 4096;
function bu(t) {
  const e = t.length;
  if (e <= ds)
    return String.fromCharCode.apply(String, t);
  let n = "", r = 0;
  for (; r < e; )
    n += String.fromCharCode.apply(String, t.slice(r, r += ds));
  return n;
}
function yu(t, e, n) {
  let r = "";
  n = Math.min(t.length, n);
  for (let i = e; i < n; ++i)
    r += String.fromCharCode(t[i] & 127);
  return r;
}
function vu(t, e, n) {
  let r = "";
  n = Math.min(t.length, n);
  for (let i = e; i < n; ++i)
    r += String.fromCharCode(t[i]);
  return r;
}
function wu(t, e, n) {
  const r = t.length;
  (!e || e < 0) && (e = 0), (!n || n < 0 || n > r) && (n = r);
  let i = "";
  for (let s = e; s < n; ++s)
    i += Eu[t[s]];
  return i;
}
function xu(t, e, n) {
  const r = t.slice(e, n);
  let i = "";
  for (let s = 0; s < r.length - 1; s += 2)
    i += String.fromCharCode(r[s] + r[s + 1] * 256);
  return i;
}
M.prototype.slice = function(e, n) {
  const r = this.length;
  e = Math.trunc(e), n = n === void 0 ? r : Math.trunc(n), e < 0 ? (e += r, e < 0 && (e = 0)) : e > r && (e = r), n < 0 ? (n += r, n < 0 && (n = 0)) : n > r && (n = r), n < e && (n = e);
  const i = this.subarray(e, n);
  return Object.setPrototypeOf(i, M.prototype), i;
};
function fe(t, e, n) {
  if (t % 1 !== 0 || t < 0)
    throw new RangeError("offset is not uint");
  if (t + e > n)
    throw new RangeError("Trying to access beyond buffer length");
}
M.prototype.readUintLE = M.prototype.readUIntLE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || fe(e, n, this.length);
  let i = this[e], s = 1, o = 0;
  for (; ++o < n && (s *= 256); )
    i += this[e + o] * s;
  return i;
};
M.prototype.readUintBE = M.prototype.readUIntBE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || fe(e, n, this.length);
  let i = this[e + --n], s = 1;
  for (; n > 0 && (s *= 256); )
    i += this[e + --n] * s;
  return i;
};
M.prototype.readUint8 = M.prototype.readUInt8 = function(e, n) {
  return e = e >>> 0, n || fe(e, 1, this.length), this[e];
};
M.prototype.readUint16LE = M.prototype.readUInt16LE = function(e, n) {
  return e = e >>> 0, n || fe(e, 2, this.length), this[e] | this[e + 1] << 8;
};
M.prototype.readUint16BE = M.prototype.readUInt16BE = function(e, n) {
  return e = e >>> 0, n || fe(e, 2, this.length), this[e] << 8 | this[e + 1];
};
M.prototype.readUint32LE = M.prototype.readUInt32LE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
};
M.prototype.readUint32BE = M.prototype.readUInt32BE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
};
M.prototype.readBigUInt64LE = mt(function(e) {
  e = e >>> 0, tn(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && kn(e, this.length - 8);
  const i = n + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + r * 2 ** 24;
  return BigInt(i) + (BigInt(s) << BigInt(32));
});
M.prototype.readBigUInt64BE = mt(function(e) {
  e = e >>> 0, tn(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && kn(e, this.length - 8);
  const i = n * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + r;
  return (BigInt(i) << BigInt(32)) + BigInt(s);
});
M.prototype.readIntLE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || fe(e, n, this.length);
  let i = this[e], s = 1, o = 0;
  for (; ++o < n && (s *= 256); )
    i += this[e + o] * s;
  return s *= 128, i >= s && (i -= Math.pow(2, 8 * n)), i;
};
M.prototype.readIntBE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || fe(e, n, this.length);
  let i = n, s = 1, o = this[e + --i];
  for (; i > 0 && (s *= 256); )
    o += this[e + --i] * s;
  return s *= 128, o >= s && (o -= Math.pow(2, 8 * n)), o;
};
M.prototype.readInt8 = function(e, n) {
  return e = e >>> 0, n || fe(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
};
M.prototype.readInt16LE = function(e, n) {
  e = e >>> 0, n || fe(e, 2, this.length);
  const r = this[e] | this[e + 1] << 8;
  return r & 32768 ? r | 4294901760 : r;
};
M.prototype.readInt16BE = function(e, n) {
  e = e >>> 0, n || fe(e, 2, this.length);
  const r = this[e + 1] | this[e] << 8;
  return r & 32768 ? r | 4294901760 : r;
};
M.prototype.readInt32LE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
};
M.prototype.readInt32BE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
};
M.prototype.readBigInt64LE = mt(function(e) {
  e = e >>> 0, tn(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && kn(e, this.length - 8);
  const i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (r << 24);
  return (BigInt(i) << BigInt(32)) + BigInt(n + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
});
M.prototype.readBigInt64BE = mt(function(e) {
  e = e >>> 0, tn(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && kn(e, this.length - 8);
  const i = (n << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e];
  return (BigInt(i) << BigInt(32)) + BigInt(this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + r);
});
M.prototype.readFloatLE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), yr(this, e, !0, 23, 4);
};
M.prototype.readFloatBE = function(e, n) {
  return e = e >>> 0, n || fe(e, 4, this.length), yr(this, e, !1, 23, 4);
};
M.prototype.readDoubleLE = function(e, n) {
  return e = e >>> 0, n || fe(e, 8, this.length), yr(this, e, !0, 52, 8);
};
M.prototype.readDoubleBE = function(e, n) {
  return e = e >>> 0, n || fe(e, 8, this.length), yr(this, e, !1, 52, 8);
};
function we(t, e, n, r, i, s) {
  if (!M.isBuffer(t))
    throw new TypeError('"buffer" argument must be a Buffer instance');
  if (e > i || e < s)
    throw new RangeError('"value" argument is out of bounds');
  if (n + r > t.length)
    throw new RangeError("Index out of range");
}
M.prototype.writeUintLE = M.prototype.writeUIntLE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, r = r >>> 0, !i) {
    const l = Math.pow(2, 8 * r) - 1;
    we(this, e, n, r, l, 0);
  }
  let s = 1, o = 0;
  for (this[n] = e & 255; ++o < r && (s *= 256); )
    this[n + o] = e / s & 255;
  return n + r;
};
M.prototype.writeUintBE = M.prototype.writeUIntBE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, r = r >>> 0, !i) {
    const l = Math.pow(2, 8 * r) - 1;
    we(this, e, n, r, l, 0);
  }
  let s = r - 1, o = 1;
  for (this[n + s] = e & 255; --s >= 0 && (o *= 256); )
    this[n + s] = e / o & 255;
  return n + r;
};
M.prototype.writeUint8 = M.prototype.writeUInt8 = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 1, 255, 0), this[n] = e & 255, n + 1;
};
M.prototype.writeUint16LE = M.prototype.writeUInt16LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 2, 65535, 0), this[n] = e & 255, this[n + 1] = e >>> 8, n + 2;
};
M.prototype.writeUint16BE = M.prototype.writeUInt16BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 2, 65535, 0), this[n] = e >>> 8, this[n + 1] = e & 255, n + 2;
};
M.prototype.writeUint32LE = M.prototype.writeUInt32LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 4, 4294967295, 0), this[n + 3] = e >>> 24, this[n + 2] = e >>> 16, this[n + 1] = e >>> 8, this[n] = e & 255, n + 4;
};
M.prototype.writeUint32BE = M.prototype.writeUInt32BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 4, 4294967295, 0), this[n] = e >>> 24, this[n + 1] = e >>> 16, this[n + 2] = e >>> 8, this[n + 3] = e & 255, n + 4;
};
function Ia(t, e, n, r, i) {
  Va(e, r, i, t, n, 7);
  let s = Number(e & BigInt(4294967295));
  t[n++] = s, s = s >> 8, t[n++] = s, s = s >> 8, t[n++] = s, s = s >> 8, t[n++] = s;
  let o = Number(e >> BigInt(32) & BigInt(4294967295));
  return t[n++] = o, o = o >> 8, t[n++] = o, o = o >> 8, t[n++] = o, o = o >> 8, t[n++] = o, n;
}
function Pa(t, e, n, r, i) {
  Va(e, r, i, t, n, 7);
  let s = Number(e & BigInt(4294967295));
  t[n + 7] = s, s = s >> 8, t[n + 6] = s, s = s >> 8, t[n + 5] = s, s = s >> 8, t[n + 4] = s;
  let o = Number(e >> BigInt(32) & BigInt(4294967295));
  return t[n + 3] = o, o = o >> 8, t[n + 2] = o, o = o >> 8, t[n + 1] = o, o = o >> 8, t[n] = o, n + 8;
}
M.prototype.writeBigUInt64LE = mt(function(e, n = 0) {
  return Ia(this, e, n, BigInt(0), BigInt("0xffffffffffffffff"));
});
M.prototype.writeBigUInt64BE = mt(function(e, n = 0) {
  return Pa(this, e, n, BigInt(0), BigInt("0xffffffffffffffff"));
});
M.prototype.writeIntLE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, !i) {
    const a = Math.pow(2, 8 * r - 1);
    we(this, e, n, r, a - 1, -a);
  }
  let s = 0, o = 1, l = 0;
  for (this[n] = e & 255; ++s < r && (o *= 256); )
    e < 0 && l === 0 && this[n + s - 1] !== 0 && (l = 1), this[n + s] = Math.trunc(e / o) - l & 255;
  return n + r;
};
M.prototype.writeIntBE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, !i) {
    const a = Math.pow(2, 8 * r - 1);
    we(this, e, n, r, a - 1, -a);
  }
  let s = r - 1, o = 1, l = 0;
  for (this[n + s] = e & 255; --s >= 0 && (o *= 256); )
    e < 0 && l === 0 && this[n + s + 1] !== 0 && (l = 1), this[n + s] = Math.trunc(e / o) - l & 255;
  return n + r;
};
M.prototype.writeInt8 = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[n] = e & 255, n + 1;
};
M.prototype.writeInt16LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 2, 32767, -32768), this[n] = e & 255, this[n + 1] = e >>> 8, n + 2;
};
M.prototype.writeInt16BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 2, 32767, -32768), this[n] = e >>> 8, this[n + 1] = e & 255, n + 2;
};
M.prototype.writeInt32LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 4, 2147483647, -2147483648), this[n] = e & 255, this[n + 1] = e >>> 8, this[n + 2] = e >>> 16, this[n + 3] = e >>> 24, n + 4;
};
M.prototype.writeInt32BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || we(this, e, n, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), this[n] = e >>> 24, this[n + 1] = e >>> 16, this[n + 2] = e >>> 8, this[n + 3] = e & 255, n + 4;
};
M.prototype.writeBigInt64LE = mt(function(e, n = 0) {
  return Ia(this, e, n, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
M.prototype.writeBigInt64BE = mt(function(e, n = 0) {
  return Pa(this, e, n, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
function Fa(t, e, n, r, i, s) {
  if (n + r > t.length)
    throw new RangeError("Index out of range");
  if (n < 0)
    throw new RangeError("Index out of range");
}
function Da(t, e, n, r, i) {
  return e = +e, n = n >>> 0, i || Fa(t, e, n, 4), Ea(t, e, n, r, 23, 4), n + 4;
}
M.prototype.writeFloatLE = function(e, n, r) {
  return Da(this, e, n, !0, r);
};
M.prototype.writeFloatBE = function(e, n, r) {
  return Da(this, e, n, !1, r);
};
function Ba(t, e, n, r, i) {
  return e = +e, n = n >>> 0, i || Fa(t, e, n, 8), Ea(t, e, n, r, 52, 8), n + 8;
}
M.prototype.writeDoubleLE = function(e, n, r) {
  return Ba(this, e, n, !0, r);
};
M.prototype.writeDoubleBE = function(e, n, r) {
  return Ba(this, e, n, !1, r);
};
M.prototype.copy = function(e, n, r, i) {
  if (!M.isBuffer(e))
    throw new TypeError("argument should be a Buffer");
  if (r || (r = 0), !i && i !== 0 && (i = this.length), n >= e.length && (n = e.length), n || (n = 0), i > 0 && i < r && (i = r), i === r || e.length === 0 || this.length === 0)
    return 0;
  if (n < 0)
    throw new RangeError("targetStart out of bounds");
  if (r < 0 || r >= this.length)
    throw new RangeError("Index out of range");
  if (i < 0)
    throw new RangeError("sourceEnd out of bounds");
  i > this.length && (i = this.length), e.length - n < i - r && (i = e.length - n + r);
  const s = i - r;
  return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(n, r, i) : Uint8Array.prototype.set.call(e, this.subarray(r, i), n), s;
};
M.prototype.fill = function(e, n, r, i) {
  if (typeof e == "string") {
    if (typeof n == "string" ? (i = n, n = 0, r = this.length) : typeof r == "string" && (i = r, r = this.length), i !== void 0 && typeof i != "string")
      throw new TypeError("encoding must be a string");
    if (typeof i == "string" && !M.isEncoding(i))
      throw new TypeError("Unknown encoding: " + i);
    if (e.length === 1) {
      const o = e.charCodeAt(0);
      (i === "utf8" && o < 128 || i === "latin1") && (e = o);
    }
  } else typeof e == "number" ? e = e & 255 : typeof e == "boolean" && (e = Number(e));
  if (n < 0 || this.length < n || this.length < r)
    throw new RangeError("Out of range index");
  if (r <= n)
    return this;
  n = n >>> 0, r = r === void 0 ? this.length : r >>> 0, e || (e = 0);
  let s;
  if (typeof e == "number")
    for (s = n; s < r; ++s)
      this[s] = e;
  else {
    const o = M.isBuffer(e) ? e : M.from(e, i), l = o.length;
    if (l === 0)
      throw new TypeError('The value "' + e + '" is invalid for argument "value"');
    for (s = 0; s < r - n; ++s)
      this[s + n] = o[s % l];
  }
  return this;
};
const Ht = {};
function Gi(t, e, n) {
  Ht[t] = class extends n {
    constructor() {
      super(), Object.defineProperty(this, "message", {
        value: Reflect.apply(e, this, arguments),
        writable: !0,
        configurable: !0
      }), this.name = `${this.name} [${t}]`, this.stack, delete this.name;
    }
    get code() {
      return t;
    }
    set code(i) {
      Object.defineProperty(this, "code", {
        configurable: !0,
        enumerable: !0,
        value: i,
        writable: !0
      });
    }
    toString() {
      return `${this.name} [${t}]: ${this.message}`;
    }
  };
}
Gi("ERR_BUFFER_OUT_OF_BOUNDS", function(t) {
  return t ? `${t} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
}, RangeError);
Gi("ERR_INVALID_ARG_TYPE", function(t, e) {
  return `The "${t}" argument must be of type number. Received type ${typeof e}`;
}, TypeError);
Gi("ERR_OUT_OF_RANGE", function(t, e, n) {
  let r = `The value of "${t}" is out of range.`, i = n;
  return Number.isInteger(n) && Math.abs(n) > 2 ** 32 ? i = gs(String(n)) : typeof n == "bigint" && (i = String(n), (n > BigInt(2) ** BigInt(32) || n < -(BigInt(2) ** BigInt(32))) && (i = gs(i)), i += "n"), r += ` It must be ${e}. Received ${i}`, r;
}, RangeError);
function gs(t) {
  let e = "", n = t.length;
  const r = t[0] === "-" ? 1 : 0;
  for (; n >= r + 4; n -= 3)
    e = `_${t.slice(n - 3, n)}${e}`;
  return `${t.slice(0, n)}${e}`;
}
function _u(t, e, n) {
  tn(e, "offset"), (t[e] === void 0 || t[e + n] === void 0) && kn(e, t.length - (n + 1));
}
function Va(t, e, n, r, i, s) {
  if (t > n || t < e) {
    const o = typeof e == "bigint" ? "n" : "";
    let l;
    throw l = e === 0 || e === BigInt(0) ? `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}`, new Ht.ERR_OUT_OF_RANGE("value", l, t);
  }
  _u(r, i, s);
}
function tn(t, e) {
  if (typeof t != "number")
    throw new Ht.ERR_INVALID_ARG_TYPE(e, "number", t);
}
function kn(t, e, n) {
  throw Math.floor(t) !== t ? (tn(t, n), new Ht.ERR_OUT_OF_RANGE("offset", "an integer", t)) : e < 0 ? new Ht.ERR_BUFFER_OUT_OF_BOUNDS() : new Ht.ERR_OUT_OF_RANGE("offset", `>= 0 and <= ${e}`, t);
}
const Lu = /[^\w+/-]/g;
function Nu(t) {
  if (t = t.split("=")[0], t = t.trim().replace(Lu, ""), t.length < 2)
    return "";
  for (; t.length % 4 !== 0; )
    t = t + "=";
  return t;
}
function Gr(t, e) {
  e = e || Number.POSITIVE_INFINITY;
  let n;
  const r = t.length;
  let i = null;
  const s = [];
  for (let o = 0; o < r; ++o) {
    if (n = t.charCodeAt(o), n > 55295 && n < 57344) {
      if (!i) {
        if (n > 56319) {
          (e -= 3) > -1 && s.push(239, 191, 189);
          continue;
        } else if (o + 1 === r) {
          (e -= 3) > -1 && s.push(239, 191, 189);
          continue;
        }
        i = n;
        continue;
      }
      if (n < 56320) {
        (e -= 3) > -1 && s.push(239, 191, 189), i = n;
        continue;
      }
      n = (i - 55296 << 10 | n - 56320) + 65536;
    } else i && (e -= 3) > -1 && s.push(239, 191, 189);
    if (i = null, n < 128) {
      if ((e -= 1) < 0)
        break;
      s.push(n);
    } else if (n < 2048) {
      if ((e -= 2) < 0)
        break;
      s.push(n >> 6 | 192, n & 63 | 128);
    } else if (n < 65536) {
      if ((e -= 3) < 0)
        break;
      s.push(n >> 12 | 224, n >> 6 & 63 | 128, n & 63 | 128);
    } else if (n < 1114112) {
      if ((e -= 4) < 0)
        break;
      s.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, n & 63 | 128);
    } else
      throw new Error("Invalid code point");
  }
  return s;
}
function Au(t) {
  const e = [];
  for (let n = 0; n < t.length; ++n)
    e.push(t.charCodeAt(n) & 255);
  return e;
}
function Su(t, e) {
  let n, r, i;
  const s = [];
  for (let o = 0; o < t.length && !((e -= 2) < 0); ++o)
    n = t.charCodeAt(o), r = n >> 8, i = n % 256, s.push(i, r);
  return s;
}
function Oa(t) {
  return tu(Nu(t));
}
function vr(t, e, n, r) {
  let i;
  for (i = 0; i < r && !(i + n >= e.length || i >= t.length); ++i)
    e[i + n] = t[i];
  return i;
}
function We(t, e) {
  return t instanceof e || t != null && t.constructor != null && t.constructor.name != null && t.constructor.name === e.name;
}
function Ji(t) {
  return t !== t;
}
const Eu = (function() {
  const t = "0123456789abcdef", e = Array.from({ length: 256 });
  for (let n = 0; n < 16; ++n) {
    const r = n * 16;
    for (let i = 0; i < 16; ++i)
      e[r + i] = t[n] + t[i];
  }
  return e;
})();
function mt(t) {
  return typeof BigInt > "u" ? ku : t;
}
function ku() {
  throw new Error("BigInt not supported");
}
const Sr = globalThis.Buffer || M;
globalThis.btoa.bind(globalThis);
globalThis.atob.bind(globalThis);
class Ru extends je {
  __unenv__ = !0;
  writable = !0;
  writableEnded = !1;
  writableFinished = !1;
  writableHighWaterMark = 0;
  writableLength = 0;
  writableObjectMode = !1;
  writableCorked = 0;
  closed = !1;
  errored = null;
  writableNeedDrain = !1;
  destroyed = !1;
  _data;
  _encoding = "utf-8";
  constructor(e) {
    super();
  }
  pipe(e, n) {
    return {};
  }
  _write(e, n, r) {
    if (this.writableEnded) {
      r && r();
      return;
    }
    if (this._data === void 0)
      this._data = e;
    else {
      const i = typeof this._data == "string" ? Sr.from(this._data, this._encoding || n || "utf8") : this._data, s = typeof e == "string" ? Sr.from(e, n || this._encoding || "utf8") : e;
      this._data = Sr.concat([i, s]);
    }
    this._encoding = n, r && r();
  }
  _writev(e, n) {
  }
  _destroy(e, n) {
  }
  _final(e) {
  }
  write(e, n, r) {
    const i = typeof n == "string" ? this._encoding : "utf-8", s = typeof n == "function" ? n : typeof r == "function" ? r : void 0;
    return this._write(e, i, s), !0;
  }
  setDefaultEncoding(e) {
    return this;
  }
  end(e, n, r) {
    const i = typeof e == "function" ? e : typeof n == "function" ? n : typeof r == "function" ? r : void 0;
    if (this.writableEnded)
      return i && i(), this;
    const s = e === i ? void 0 : e;
    if (s) {
      const o = n === i ? void 0 : n;
      this.write(s, o, i);
    }
    return this.writableEnded = !0, this.writableFinished = !0, this.emit("close"), this.emit("finish"), this;
  }
  cork() {
  }
  uncork() {
  }
  destroy(e) {
    return this.destroyed = !0, delete this._data, this.removeAllListeners(), this;
  }
  compose(e, n) {
    throw new Error("[h3] Method not implemented.");
  }
}
const Ua = globalThis.Writable || Ru, Er = class {
  allowHalfOpen = !0;
  _destroy;
  constructor(t = new Sa(), e = new Ua()) {
    Object.assign(this, t), Object.assign(this, e), this._destroy = /* @__PURE__ */ Yl(t._destroy, e._destroy);
  }
};
function Mu() {
  return Object.assign(Er.prototype, Sa.prototype), Object.assign(Er.prototype, Ua.prototype), Er;
}
const Tu = /* @__PURE__ */ Mu(), Cu = globalThis.Duplex || Tu;
class $a extends Cu {
  __unenv__ = !0;
  bufferSize = 0;
  bytesRead = 0;
  bytesWritten = 0;
  connecting = !1;
  destroyed = !1;
  pending = !1;
  localAddress = "";
  localPort = 0;
  remoteAddress = "";
  remoteFamily = "";
  remotePort = 0;
  autoSelectFamilyAttemptedAddresses = [];
  readyState = "readOnly";
  constructor(e) {
    super();
  }
  write(e, n, r) {
    return !1;
  }
  connect(e, n, r) {
    return this;
  }
  end(e, n, r) {
    return this;
  }
  setEncoding(e) {
    return this;
  }
  pause() {
    return this;
  }
  resume() {
    return this;
  }
  setTimeout(e, n) {
    return this;
  }
  setNoDelay(e) {
    return this;
  }
  setKeepAlive(e, n) {
    return this;
  }
  address() {
    return {};
  }
  unref() {
    return this;
  }
  ref() {
    return this;
  }
  destroySoon() {
    this.destroy();
  }
  resetAndDestroy() {
    const e = new Error("ERR_SOCKET_CLOSED");
    return e.code = "ERR_SOCKET_CLOSED", this.destroy(e), this;
  }
}
class Iu extends $a {
  fd;
  constructor(e) {
    super(), this.fd = e;
  }
  isRaw = !1;
  setRawMode(e) {
    return this.isRaw = e, this;
  }
  isTTY = !1;
}
class ps extends $a {
  fd;
  constructor(e) {
    super(), this.fd = e;
  }
  clearLine(e, n) {
    return n && n(), !1;
  }
  clearScreenDown(e) {
    return e && e(), !1;
  }
  cursorTo(e, n, r) {
    return r && typeof r == "function" && r(), !1;
  }
  moveCursor(e, n, r) {
    return r && r(), !1;
  }
  getColorDepth(e) {
    return 1;
  }
  hasColors(e, n) {
    return !1;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = !1;
}
class Qi extends je {
  env;
  hrtime;
  nextTick;
  constructor(e) {
    super(), this.env = e.env, this.hrtime = e.hrtime, this.nextTick = e.nextTick;
    for (const n of [...Object.getOwnPropertyNames(Qi.prototype), ...Object.getOwnPropertyNames(je.prototype)]) {
      const r = this[n];
      typeof r == "function" && (this[n] = r.bind(this));
    }
  }
  emitWarning(e, n, r) {
    console.warn(`${r ? `[${r}] ` : ""}${n ? `${n}: ` : ""}${e}`);
  }
  emit(...e) {
    return super.emit(...e);
  }
  listeners(e) {
    return super.listeners(e);
  }
  #t;
  #n;
  #r;
  get stdin() {
    return this.#t ??= new Iu(0);
  }
  get stdout() {
    return this.#n ??= new ps(1);
  }
  get stderr() {
    return this.#r ??= new ps(2);
  }
  #e = "/";
  chdir(e) {
    this.#e = e;
  }
  cwd() {
    return this.#e;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return !1;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return !1;
  }
  get traceDeprecation() {
    return !1;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return !1;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw /* @__PURE__ */ J("process.umask");
  }
  getBuiltinModule() {
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ J("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ J("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ J("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ J("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ J("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ J("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ J("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ J("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ J("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ J("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ J("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ J("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ J("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ J("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ J("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ J("process.binding");
  }
  permission = { has: /* @__PURE__ */ St("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: !1,
    reportOnFatalError: !1,
    reportOnSignal: !1,
    reportOnUncaughtException: !1,
    getReport: /* @__PURE__ */ St("process.report.getReport"),
    writeReport: /* @__PURE__ */ St("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ St("process.finalization.register"),
    unregister: /* @__PURE__ */ St("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ St("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
}
const Dn = /* @__PURE__ */ Object.create(null), Pu = globalThis.process, Et = (t) => globalThis.__env__ || Pu?.env || (t ? Dn : globalThis), Fu = /* @__PURE__ */ new Proxy(Dn, {
  get(t, e) {
    return Et()[e] ?? Dn[e];
  },
  has(t, e) {
    const n = Et();
    return e in n || e in Dn;
  },
  set(t, e, n) {
    const r = Et(!0);
    return r[e] = n, !0;
  },
  deleteProperty(t, e) {
    const n = Et(!0);
    return delete n[e], !0;
  },
  ownKeys() {
    const t = Et();
    return Object.keys(t);
  },
  getOwnPropertyDescriptor(t, e) {
    const n = Et();
    if (e in n)
      return {
        value: n[e],
        writable: !0,
        enumerable: !0,
        configurable: !0
      };
  }
}), Du = /* @__PURE__ */ Object.assign(function(e) {
  const n = Date.now(), r = Math.trunc(n / 1e3), i = n % 1e3 * 1e6;
  if (e) {
    let s = r - e[0], o = i - e[0];
    return o < 0 && (s = s - 1, o = 1e9 + o), [s, o];
  }
  return [r, i];
}, { bigint: function() {
  return BigInt(Date.now() * 1e6);
} }), Bu = globalThis.queueMicrotask ? (t, ...e) => {
  globalThis.queueMicrotask(t.bind(void 0, ...e));
} : /* @__PURE__ */ Vu();
function Vu() {
  let t = [], e = !1, n, r = -1;
  function i() {
    !e || !n || (e = !1, n.length > 0 ? t = [...n, ...t] : r = -1, t.length > 0 && s());
  }
  function s() {
    if (e)
      return;
    const l = setTimeout(i);
    e = !0;
    let a = t.length;
    for (; a; ) {
      for (n = t, t = []; ++r < a; )
        n && n[r]();
      r = -1, a = t.length;
    }
    n = void 0, e = !1, clearTimeout(l);
  }
  return (l, ...a) => {
    t.push(l.bind(void 0, ...a)), t.length === 1 && !e && setTimeout(s);
  };
}
const ve = new Qi({
  env: Fu,
  hrtime: Du,
  nextTick: Bu
}), { abort: Dh, addListener: Bh, allowedNodeEnvironmentFlags: Vh, hasUncaughtExceptionCaptureCallback: Oh, setUncaughtExceptionCaptureCallback: Uh, loadEnvFile: $h, sourceMapsEnabled: qh, arch: jh, argv: Wh, argv0: Hh, chdir: zh, config: Gh, connected: Jh, constrainedMemory: Qh, availableMemory: Xh, cpuUsage: Yh, cwd: Zh, debugPort: Kh, dlopen: e2, disconnect: t2, emit: n2, emitWarning: r2, env: i2, eventNames: s2, execArgv: o2, execPath: a2, exit: l2, finalization: u2, features: c2, getBuiltinModule: f2, getActiveResourcesInfo: h2, getMaxListeners: m2, hrtime: d2, kill: g2, listeners: p2, listenerCount: b2, memoryUsage: y2, nextTick: v2, on: w2, off: x2, once: _2, pid: L2, platform: N2, ppid: A2, prependListener: S2, prependOnceListener: E2, rawListeners: k2, release: R2, removeAllListeners: M2, removeListener: T2, report: C2, resourceUsage: I2, setMaxListeners: P2, setSourceMapsEnabled: F2, stderr: D2, stdin: B2, stdout: V2, title: O2, umask: U2, uptime: $2, version: q2, versions: j2, domain: W2, initgroups: H2, moduleLoadList: z2, reallyExit: G2, openStdin: J2, assert: Q2, binding: X2, send: Y2, exitCode: Z2, channel: K2, getegid: em, geteuid: tm, getgid: nm, getgroups: rm, getuid: im, setegid: sm, seteuid: om, setgid: am, setgroups: lm, setuid: um, permission: cm, mainModule: fm, ref: hm, unref: mm, _events: dm, _eventsCount: gm, _exiting: pm, _maxListeners: bm, _debugEnd: ym, _debugProcess: vm, _fatalException: wm, _getActiveHandles: xm, _getActiveRequests: _m, _kill: Lm, _preload_modules: Nm, _rawDebug: Am, _startProfilerIdleNotifier: Sm, _stopProfilerIdleNotifier: Em, _tickCallback: km, _disconnect: Rm, _handleQueue: Mm, _pendingMessage: Tm, _channel: Cm, _send: Im, _linkedBinding: Pm } = ve;
class Ou {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? Qt.isErrorNoTelemetry(e) ? new Qt(e.message + `

` + e.stack) : new Error(e.message + `

` + e.stack) : e;
      }, 0);
    };
  }
  emit(e) {
    this.listeners.forEach((n) => {
      n(e);
    });
  }
  onUnexpectedError(e) {
    this.unexpectedErrorHandler(e), this.emit(e);
  }
  // For external errors, we don't want the listeners to be called
  onUnexpectedExternalError(e) {
    this.unexpectedErrorHandler(e);
  }
}
const Uu = new Ou();
function mn(t) {
  $u(t) || Uu.onUnexpectedError(t);
}
function bs(t) {
  if (t instanceof Error) {
    const { name: e, message: n } = t, r = t.stacktrace || t.stack;
    return {
      $isError: !0,
      name: e,
      message: n,
      stack: r,
      noTelemetry: Qt.isErrorNoTelemetry(t)
    };
  }
  return t;
}
const Jr = "Canceled";
function $u(t) {
  return t instanceof qu ? !0 : t instanceof Error && t.name === Jr && t.message === Jr;
}
class qu extends Error {
  constructor() {
    super(Jr), this.name = this.message;
  }
}
class Qt extends Error {
  constructor(e) {
    super(e), this.name = "CodeExpectedError";
  }
  static fromError(e) {
    if (e instanceof Qt)
      return e;
    const n = new Qt();
    return n.message = e.message, n.stack = e.stack, n;
  }
  static isErrorNoTelemetry(e) {
    return e.name === "CodeExpectedError";
  }
}
class Se extends Error {
  constructor(e) {
    super(e || "An unexpected bug occurred."), Object.setPrototypeOf(this, Se.prototype);
  }
}
function ju(t, e) {
  const n = this;
  let r = !1, i;
  return function() {
    return r || (r = !0, i = t.apply(n, arguments)), i;
  };
}
var zn;
(function(t) {
  function e(w) {
    return w && typeof w == "object" && typeof w[Symbol.iterator] == "function";
  }
  t.is = e;
  const n = Object.freeze([]);
  function r() {
    return n;
  }
  t.empty = r;
  function* i(w) {
    yield w;
  }
  t.single = i;
  function s(w) {
    return e(w) ? w : i(w);
  }
  t.wrap = s;
  function o(w) {
    return w || n;
  }
  t.from = o;
  function* l(w) {
    for (let b = w.length - 1; b >= 0; b--)
      yield w[b];
  }
  t.reverse = l;
  function a(w) {
    return !w || w[Symbol.iterator]().next().done === !0;
  }
  t.isEmpty = a;
  function u(w) {
    return w[Symbol.iterator]().next().value;
  }
  t.first = u;
  function h(w, b) {
    let x = 0;
    for (const A of w)
      if (b(A, x++))
        return !0;
    return !1;
  }
  t.some = h;
  function c(w, b) {
    for (const x of w)
      if (b(x))
        return x;
  }
  t.find = c;
  function* m(w, b) {
    for (const x of w)
      b(x) && (yield x);
  }
  t.filter = m;
  function* d(w, b) {
    let x = 0;
    for (const A of w)
      yield b(A, x++);
  }
  t.map = d;
  function* g(w, b) {
    let x = 0;
    for (const A of w)
      yield* b(A, x++);
  }
  t.flatMap = g;
  function* p(...w) {
    for (const b of w)
      yield* b;
  }
  t.concat = p;
  function y(w, b, x) {
    let A = x;
    for (const T of w)
      A = b(A, T);
    return A;
  }
  t.reduce = y;
  function* _(w, b, x = w.length) {
    for (b < 0 && (b += w.length), x < 0 ? x += w.length : x > w.length && (x = w.length); b < x; b++)
      yield w[b];
  }
  t.slice = _;
  function L(w, b = Number.POSITIVE_INFINITY) {
    const x = [];
    if (b === 0)
      return [x, w];
    const A = w[Symbol.iterator]();
    for (let T = 0; T < b; T++) {
      const D = A.next();
      if (D.done)
        return [x, t.empty()];
      x.push(D.value);
    }
    return [x, { [Symbol.iterator]() {
      return A;
    } }];
  }
  t.consume = L;
  async function v(w) {
    const b = [];
    for await (const x of w)
      b.push(x);
    return Promise.resolve(b);
  }
  t.asyncToArray = v;
})(zn || (zn = {}));
function qa(t) {
  if (zn.is(t)) {
    const e = [];
    for (const n of t)
      if (n)
        try {
          n.dispose();
        } catch (r) {
          e.push(r);
        }
    if (e.length === 1)
      throw e[0];
    if (e.length > 1)
      throw new AggregateError(e, "Encountered errors while disposing of store");
    return Array.isArray(t) ? [] : t;
  } else if (t)
    return t.dispose(), t;
}
function Wu(...t) {
  return Gn(() => qa(t));
}
function Gn(t) {
  return {
    dispose: ju(() => {
      t();
    })
  };
}
const fr = class fr {
  constructor() {
    this._toDispose = /* @__PURE__ */ new Set(), this._isDisposed = !1;
  }
  /**
   * Dispose of all registered disposables and mark this object as disposed.
   *
   * Any future disposables added to this object will be disposed of on `add`.
   */
  dispose() {
    this._isDisposed || (this._isDisposed = !0, this.clear());
  }
  /**
   * @return `true` if this object has been disposed of.
   */
  get isDisposed() {
    return this._isDisposed;
  }
  /**
   * Dispose of all registered disposables but do not mark this object as disposed.
   */
  clear() {
    if (this._toDispose.size !== 0)
      try {
        qa(this._toDispose);
      } finally {
        this._toDispose.clear();
      }
  }
  /**
   * Add a new {@link IDisposable disposable} to the collection.
   */
  add(e) {
    if (!e)
      return e;
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return this._isDisposed ? fr.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(e), e;
  }
  /**
   * Deletes the value from the store, but does not dispose it.
   */
  deleteAndLeak(e) {
    e && this._toDispose.has(e) && this._toDispose.delete(e);
  }
};
fr.DISABLE_DISPOSED_WARNING = !1;
let wn = fr;
const rs = class rs {
  constructor() {
    this._store = new wn(), this._store;
  }
  dispose() {
    this._store.dispose();
  }
  /**
   * Adds `o` to the collection of disposables managed by this object.
   */
  _register(e) {
    if (e === this)
      throw new Error("Cannot register a disposable on itself!");
    return this._store.add(e);
  }
};
rs.None = Object.freeze({ dispose() {
} });
let Xt = rs;
const Ut = class Ut {
  constructor(e) {
    this.element = e, this.next = Ut.Undefined, this.prev = Ut.Undefined;
  }
};
Ut.Undefined = new Ut(void 0);
let Z = Ut;
class Hu {
  constructor() {
    this._first = Z.Undefined, this._last = Z.Undefined, this._size = 0;
  }
  get size() {
    return this._size;
  }
  isEmpty() {
    return this._first === Z.Undefined;
  }
  clear() {
    let e = this._first;
    for (; e !== Z.Undefined; ) {
      const n = e.next;
      e.prev = Z.Undefined, e.next = Z.Undefined, e = n;
    }
    this._first = Z.Undefined, this._last = Z.Undefined, this._size = 0;
  }
  unshift(e) {
    return this._insert(e, !1);
  }
  push(e) {
    return this._insert(e, !0);
  }
  _insert(e, n) {
    const r = new Z(e);
    if (this._first === Z.Undefined)
      this._first = r, this._last = r;
    else if (n) {
      const s = this._last;
      this._last = r, r.prev = s, s.next = r;
    } else {
      const s = this._first;
      this._first = r, r.next = s, s.prev = r;
    }
    this._size += 1;
    let i = !1;
    return () => {
      i || (i = !0, this._remove(r));
    };
  }
  shift() {
    if (this._first !== Z.Undefined) {
      const e = this._first.element;
      return this._remove(this._first), e;
    }
  }
  pop() {
    if (this._last !== Z.Undefined) {
      const e = this._last.element;
      return this._remove(this._last), e;
    }
  }
  _remove(e) {
    if (e.prev !== Z.Undefined && e.next !== Z.Undefined) {
      const n = e.prev;
      n.next = e.next, e.next.prev = n;
    } else e.prev === Z.Undefined && e.next === Z.Undefined ? (this._first = Z.Undefined, this._last = Z.Undefined) : e.next === Z.Undefined ? (this._last = this._last.prev, this._last.next = Z.Undefined) : e.prev === Z.Undefined && (this._first = this._first.next, this._first.prev = Z.Undefined);
    this._size -= 1;
  }
  *[Symbol.iterator]() {
    let e = this._first;
    for (; e !== Z.Undefined; )
      yield e.element, e = e.next;
  }
}
const zu = globalThis.performance && typeof globalThis.performance.now == "function";
class wr {
  static create(e) {
    return new wr(e);
  }
  constructor(e) {
    this._now = zu && e === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
  }
  stop() {
    this._stopTime = this._now();
  }
  reset() {
    this._startTime = this._now(), this._stopTime = -1;
  }
  elapsed() {
    return this._stopTime !== -1 ? this._stopTime - this._startTime : this._now() - this._startTime;
  }
}
var Jn;
(function(t) {
  t.None = () => Xt.None;
  function e(E, k) {
    return m(E, () => {
    }, 0, void 0, !0, void 0, k);
  }
  t.defer = e;
  function n(E) {
    return (k, F = null, I) => {
      let P = !1, V;
      return V = E((U) => {
        if (!P)
          return V ? V.dispose() : P = !0, k.call(F, U);
      }, null, I), P && V.dispose(), V;
    };
  }
  t.once = n;
  function r(E, k) {
    return t.once(t.filter(E, k));
  }
  t.onceIf = r;
  function i(E, k, F) {
    return h((I, P = null, V) => E((U) => I.call(P, k(U)), null, V), F);
  }
  t.map = i;
  function s(E, k, F) {
    return h((I, P = null, V) => E((U) => {
      k(U), I.call(P, U);
    }, null, V), F);
  }
  t.forEach = s;
  function o(E, k, F) {
    return h((I, P = null, V) => E((U) => k(U) && I.call(P, U), null, V), F);
  }
  t.filter = o;
  function l(E) {
    return E;
  }
  t.signal = l;
  function a(...E) {
    return (k, F = null, I) => {
      const P = Wu(...E.map((V) => V((U) => k.call(F, U))));
      return c(P, I);
    };
  }
  t.any = a;
  function u(E, k, F, I) {
    let P = F;
    return i(E, (V) => (P = k(P, V), P), I);
  }
  t.reduce = u;
  function h(E, k) {
    let F;
    const I = {
      onWillAddFirstListener() {
        F = E(P.fire, P);
      },
      onDidRemoveLastListener() {
        F?.dispose();
      }
    }, P = new Re(I);
    return k?.add(P), P.event;
  }
  function c(E, k) {
    return k instanceof Array ? k.push(E) : k && k.add(E), E;
  }
  function m(E, k, F = 100, I = !1, P = !1, V, U) {
    let W, re, Nt, Rn = 0, rn;
    const El = {
      leakWarningThreshold: V,
      onWillAddFirstListener() {
        W = E((kl) => {
          Rn++, re = k(re, kl), I && !Nt && (Mn.fire(re), re = void 0), rn = () => {
            const Rl = re;
            re = void 0, Nt = void 0, (!I || Rn > 1) && Mn.fire(Rl), Rn = 0;
          }, typeof F == "number" ? (clearTimeout(Nt), Nt = setTimeout(rn, F)) : Nt === void 0 && (Nt = 0, queueMicrotask(rn));
        });
      },
      onWillRemoveListener() {
        P && Rn > 0 && rn?.();
      },
      onDidRemoveLastListener() {
        rn = void 0, W.dispose();
      }
    }, Mn = new Re(El);
    return U?.add(Mn), Mn.event;
  }
  t.debounce = m;
  function d(E, k = 0, F) {
    return t.debounce(E, (I, P) => I ? (I.push(P), I) : [P], k, void 0, !0, void 0, F);
  }
  t.accumulate = d;
  function g(E, k = (I, P) => I === P, F) {
    let I = !0, P;
    return o(E, (V) => {
      const U = I || !k(V, P);
      return I = !1, P = V, U;
    }, F);
  }
  t.latch = g;
  function p(E, k, F) {
    return [
      t.filter(E, k, F),
      t.filter(E, (I) => !k(I), F)
    ];
  }
  t.split = p;
  function y(E, k = !1, F = [], I) {
    let P = F.slice(), V = E((re) => {
      P ? P.push(re) : W.fire(re);
    });
    I && I.add(V);
    const U = () => {
      P?.forEach((re) => W.fire(re)), P = null;
    }, W = new Re({
      onWillAddFirstListener() {
        V || (V = E((re) => W.fire(re)), I && I.add(V));
      },
      onDidAddFirstListener() {
        P && (k ? setTimeout(U) : U());
      },
      onDidRemoveLastListener() {
        V && V.dispose(), V = null;
      }
    });
    return I && I.add(W), W.event;
  }
  t.buffer = y;
  function _(E, k) {
    return (I, P, V) => {
      const U = k(new v());
      return E(function(W) {
        const re = U.evaluate(W);
        re !== L && I.call(P, re);
      }, void 0, V);
    };
  }
  t.chain = _;
  const L = /* @__PURE__ */ Symbol("HaltChainable");
  class v {
    constructor() {
      this.steps = [];
    }
    map(k) {
      return this.steps.push(k), this;
    }
    forEach(k) {
      return this.steps.push((F) => (k(F), F)), this;
    }
    filter(k) {
      return this.steps.push((F) => k(F) ? F : L), this;
    }
    reduce(k, F) {
      let I = F;
      return this.steps.push((P) => (I = k(I, P), I)), this;
    }
    latch(k = (F, I) => F === I) {
      let F = !0, I;
      return this.steps.push((P) => {
        const V = F || !k(P, I);
        return F = !1, I = P, V ? P : L;
      }), this;
    }
    evaluate(k) {
      for (const F of this.steps)
        if (k = F(k), k === L)
          break;
      return k;
    }
  }
  function w(E, k, F = (I) => I) {
    const I = (...W) => U.fire(F(...W)), P = () => E.on(k, I), V = () => E.removeListener(k, I), U = new Re({ onWillAddFirstListener: P, onDidRemoveLastListener: V });
    return U.event;
  }
  t.fromNodeEventEmitter = w;
  function b(E, k, F = (I) => I) {
    const I = (...W) => U.fire(F(...W)), P = () => E.addEventListener(k, I), V = () => E.removeEventListener(k, I), U = new Re({ onWillAddFirstListener: P, onDidRemoveLastListener: V });
    return U.event;
  }
  t.fromDOMEventEmitter = b;
  function x(E) {
    return new Promise((k) => n(E)(k));
  }
  t.toPromise = x;
  function A(E) {
    const k = new Re();
    return E.then((F) => {
      k.fire(F);
    }, () => {
      k.fire(void 0);
    }).finally(() => {
      k.dispose();
    }), k.event;
  }
  t.fromPromise = A;
  function T(E, k) {
    return E((F) => k.fire(F));
  }
  t.forward = T;
  function D(E, k, F) {
    return k(F), E((I) => k(I));
  }
  t.runAndSubscribe = D;
  class O {
    constructor(k, F) {
      this._observable = k, this._counter = 0, this._hasChanged = !1;
      const I = {
        onWillAddFirstListener: () => {
          k.addObserver(this), this._observable.reportChanges();
        },
        onDidRemoveLastListener: () => {
          k.removeObserver(this);
        }
      };
      this.emitter = new Re(I), F && F.add(this.emitter);
    }
    beginUpdate(k) {
      this._counter++;
    }
    handlePossibleChange(k) {
    }
    handleChange(k, F) {
      this._hasChanged = !0;
    }
    endUpdate(k) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
    }
  }
  function C(E, k) {
    return new O(E, k).emitter.event;
  }
  t.fromObservable = C;
  function N(E) {
    return (k, F, I) => {
      let P = 0, V = !1;
      const U = {
        beginUpdate() {
          P++;
        },
        endUpdate() {
          P--, P === 0 && (E.reportChanges(), V && (V = !1, k.call(F)));
        },
        handlePossibleChange() {
        },
        handleChange() {
          V = !0;
        }
      };
      E.addObserver(U), E.reportChanges();
      const W = {
        dispose() {
          E.removeObserver(U);
        }
      };
      return I instanceof wn ? I.add(W) : Array.isArray(I) && I.push(W), W;
    };
  }
  t.fromObservableLight = N;
})(Jn || (Jn = {}));
const $t = class $t {
  constructor(e) {
    this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${e}_${$t._idPool++}`, $t.all.add(this);
  }
  start(e) {
    this._stopWatch = new wr(), this.listenerCount = e;
  }
  stop() {
    if (this._stopWatch) {
      const e = this._stopWatch.elapsed();
      this.durations.push(e), this.elapsedOverall += e, this.invocationCount += 1, this._stopWatch = void 0;
    }
  }
};
$t.all = /* @__PURE__ */ new Set(), $t._idPool = 0;
let Qr = $t, Gu = -1;
const hr = class hr {
  constructor(e, n, r = (hr._idPool++).toString(16).padStart(3, "0")) {
    this._errorHandler = e, this.threshold = n, this.name = r, this._warnCountdown = 0;
  }
  dispose() {
    this._stacks?.clear();
  }
  check(e, n) {
    const r = this.threshold;
    if (r <= 0 || n < r)
      return;
    this._stacks || (this._stacks = /* @__PURE__ */ new Map());
    const i = this._stacks.get(e.value) || 0;
    if (this._stacks.set(e.value, i + 1), this._warnCountdown -= 1, this._warnCountdown <= 0) {
      this._warnCountdown = r * 0.5;
      const [s, o] = this.getMostFrequentStack(), l = `[${this.name}] potential listener LEAK detected, having ${n} listeners already. MOST frequent listener (${o}):`;
      console.warn(l), console.warn(s);
      const a = new Ju(l, s);
      this._errorHandler(a);
    }
    return () => {
      const s = this._stacks.get(e.value) || 0;
      this._stacks.set(e.value, s - 1);
    };
  }
  getMostFrequentStack() {
    if (!this._stacks)
      return;
    let e, n = 0;
    for (const [r, i] of this._stacks)
      (!e || n < i) && (e = [r, i], n = i);
    return e;
  }
};
hr._idPool = 1;
let Xr = hr;
class Xi {
  static create() {
    const e = new Error();
    return new Xi(e.stack ?? "");
  }
  constructor(e) {
    this.value = e;
  }
  print() {
    console.warn(this.value.split(`
`).slice(2).join(`
`));
  }
}
class Ju extends Error {
  constructor(e, n) {
    super(e), this.name = "ListenerLeakError", this.stack = n;
  }
}
class Qu extends Error {
  constructor(e, n) {
    super(e), this.name = "ListenerRefusalError", this.stack = n;
  }
}
class kr {
  constructor(e) {
    this.value = e;
  }
}
const Xu = 2;
class Re {
  constructor(e) {
    this._size = 0, this._options = e, this._leakageMon = this._options?.leakWarningThreshold ? new Xr(e?.onListenerError ?? mn, this._options?.leakWarningThreshold ?? Gu) : void 0, this._perfMon = this._options?._profName ? new Qr(this._options._profName) : void 0, this._deliveryQueue = this._options?.deliveryQueue;
  }
  dispose() {
    this._disposed || (this._disposed = !0, this._deliveryQueue?.current === this && this._deliveryQueue.reset(), this._listeners && (this._listeners = void 0, this._size = 0), this._options?.onDidRemoveLastListener?.(), this._leakageMon?.dispose());
  }
  /**
   * For the public to allow to subscribe
   * to events from this Emitter
   */
  get event() {
    return this._event ??= (e, n, r) => {
      if (this._leakageMon && this._size > this._leakageMon.threshold ** 2) {
        const l = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
        console.warn(l);
        const a = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], u = new Qu(`${l}. HINT: Stack shows most frequent listener (${a[1]}-times)`, a[0]);
        return (this._options?.onListenerError || mn)(u), Xt.None;
      }
      if (this._disposed)
        return Xt.None;
      n && (e = e.bind(n));
      const i = new kr(e);
      let s;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (i.stack = Xi.create(), s = this._leakageMon.check(i.stack, this._size + 1)), this._listeners ? this._listeners instanceof kr ? (this._deliveryQueue ??= new Yu(), this._listeners = [this._listeners, i]) : this._listeners.push(i) : (this._options?.onWillAddFirstListener?.(this), this._listeners = i, this._options?.onDidAddFirstListener?.(this)), this._size++;
      const o = Gn(() => {
        s?.(), this._removeListener(i);
      });
      return r instanceof wn ? r.add(o) : Array.isArray(r) && r.push(o), o;
    }, this._event;
  }
  _removeListener(e) {
    if (this._options?.onWillRemoveListener?.(this), !this._listeners)
      return;
    if (this._size === 1) {
      this._listeners = void 0, this._options?.onDidRemoveLastListener?.(this), this._size = 0;
      return;
    }
    const n = this._listeners, r = n.indexOf(e);
    if (r === -1)
      throw console.log("disposed?", this._disposed), console.log("size?", this._size), console.log("arr?", JSON.stringify(this._listeners)), new Error("Attempted to dispose unknown listener");
    this._size--, n[r] = void 0;
    const i = this._deliveryQueue.current === this;
    if (this._size * Xu <= n.length) {
      let s = 0;
      for (let o = 0; o < n.length; o++)
        n[o] ? n[s++] = n[o] : i && (this._deliveryQueue.end--, s < this._deliveryQueue.i && this._deliveryQueue.i--);
      n.length = s;
    }
  }
  _deliver(e, n) {
    if (!e)
      return;
    const r = this._options?.onListenerError || mn;
    if (!r) {
      e.value(n);
      return;
    }
    try {
      e.value(n);
    } catch (i) {
      r(i);
    }
  }
  /** Delivers items in the queue. Assumes the queue is ready to go. */
  _deliverQueue(e) {
    const n = e.current._listeners;
    for (; e.i < e.end; )
      this._deliver(n[e.i++], e.value);
    e.reset();
  }
  /**
   * To be kept private to fire an event to
   * subscribers
   */
  fire(e) {
    if (this._deliveryQueue?.current && (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()), this._perfMon?.start(this._size), this._listeners) if (this._listeners instanceof kr)
      this._deliver(this._listeners, e);
    else {
      const n = this._deliveryQueue;
      n.enqueue(this, e, this._listeners.length), this._deliverQueue(n);
    }
    this._perfMon?.stop();
  }
  hasListeners() {
    return this._size > 0;
  }
}
class Yu {
  constructor() {
    this.i = -1, this.end = 0;
  }
  enqueue(e, n, r) {
    this.i = 0, this.end = r, this.current = e, this.value = n;
  }
  reset() {
    this.i = this.end, this.current = void 0, this.value = void 0;
  }
}
function Zu() {
  return globalThis._VSCODE_NLS_MESSAGES;
}
function ja() {
  return globalThis._VSCODE_NLS_LANGUAGE;
}
const Ku = ja() === "pseudo" || typeof document < "u" && document.location && document.location.hash.indexOf("pseudo=true") >= 0;
function ys(t, e) {
  let n;
  return e.length === 0 ? n = t : n = t.replace(/\{(\d+)\}/g, (r, i) => {
    const s = i[0], o = e[s];
    let l = r;
    return typeof o == "string" ? l = o : (typeof o == "number" || typeof o == "boolean" || o === void 0 || o === null) && (l = String(o)), l;
  }), Ku && (n = "［" + n.replace(/[aouei]/g, "$&$&") + "］"), n;
}
function Y(t, e, ...n) {
  return ys(typeof t == "number" ? ec(t, e) : e, n);
}
function ec(t, e) {
  const n = Zu()?.[t];
  if (typeof n != "string") {
    if (typeof e == "string")
      return e;
    throw new Error(`!!! NLS MISSING: ${t} !!!`);
  }
  return n;
}
const Vt = "en";
let Yr = !1, Zr = !1, Rr = !1, Wa = !1, Yi = !1, Tn, Mr = Vt, vs = Vt, tc, Je;
const Ye = globalThis;
let Ne;
typeof Ye.vscode < "u" && typeof Ye.vscode.process < "u" ? Ne = Ye.vscode.process : typeof ve < "u" && typeof ve?.versions?.node == "string" && (Ne = ve);
const nc = typeof Ne?.versions?.electron == "string", rc = nc && Ne?.type === "renderer";
if (typeof Ne == "object") {
  Yr = Ne.platform === "win32", Zr = Ne.platform === "darwin", Rr = Ne.platform === "linux", Rr && Ne.env.SNAP && Ne.env.SNAP_REVISION, Ne.env.CI || Ne.env.BUILD_ARTIFACTSTAGINGDIRECTORY, Tn = Vt, Mr = Vt;
  const t = Ne.env.VSCODE_NLS_CONFIG;
  if (t)
    try {
      const e = JSON.parse(t);
      Tn = e.userLocale, vs = e.osLocale, Mr = e.resolvedLanguage || Vt, tc = e.languagePack?.translationsConfigFile;
    } catch {
    }
  Wa = !0;
} else typeof navigator == "object" && !rc ? (Je = navigator.userAgent, Yr = Je.indexOf("Windows") >= 0, Zr = Je.indexOf("Macintosh") >= 0, (Je.indexOf("Macintosh") >= 0 || Je.indexOf("iPad") >= 0 || Je.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints > 0, Rr = Je.indexOf("Linux") >= 0, Je?.indexOf("Mobi") >= 0, Yi = !0, Mr = ja() || Vt, Tn = navigator.language.toLowerCase(), vs = Tn) : console.error("Unable to resolve platform.");
const xn = Yr, ic = Zr, sc = Wa, oc = Yi, ac = Yi && typeof Ye.importScripts == "function", lc = ac ? Ye.origin : void 0, ze = Je, uc = typeof Ye.postMessage == "function" && !Ye.importScripts;
(() => {
  if (uc) {
    const t = [];
    Ye.addEventListener("message", (n) => {
      if (n.data && n.data.vscodeScheduleAsyncWork)
        for (let r = 0, i = t.length; r < i; r++) {
          const s = t[r];
          if (s.id === n.data.vscodeScheduleAsyncWork) {
            t.splice(r, 1), s.callback();
            return;
          }
        }
    });
    let e = 0;
    return (n) => {
      const r = ++e;
      t.push({
        id: r,
        callback: n
      }), Ye.postMessage({ vscodeScheduleAsyncWork: r }, "*");
    };
  }
  return (t) => setTimeout(t);
})();
const cc = !!(ze && ze.indexOf("Chrome") >= 0);
ze && ze.indexOf("Firefox") >= 0;
!cc && ze && ze.indexOf("Safari") >= 0;
ze && ze.indexOf("Edg/") >= 0;
ze && ze.indexOf("Android") >= 0;
function fc(t) {
  return t;
}
class hc {
  constructor(e, n) {
    this.lastCache = void 0, this.lastArgKey = void 0, typeof e == "function" ? (this._fn = e, this._computeKey = fc) : (this._fn = n, this._computeKey = e.getCacheKey);
  }
  get(e) {
    const n = this._computeKey(e);
    return this.lastArgKey !== n && (this.lastArgKey = n, this.lastCache = this._fn(e)), this.lastCache;
  }
}
class ws {
  constructor(e) {
    this.executor = e, this._didRun = !1;
  }
  /**
   * Get the wrapped value.
   *
   * This will force evaluation of the lazy value if it has not been resolved yet. Lazy values are only
   * resolved once. `getValue` will re-throw exceptions that are hit while resolving the value
   */
  get value() {
    if (!this._didRun)
      try {
        this._value = this.executor();
      } catch (e) {
        this._error = e;
      } finally {
        this._didRun = !0;
      }
    if (this._error)
      throw this._error;
    return this._value;
  }
  /**
   * Get the wrapped value without forcing evaluation.
   */
  get rawValue() {
    return this._value;
  }
}
function mc(t) {
  return t.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, "\\$&");
}
function dc(t) {
  return t.split(/\r\n|\r|\n/);
}
function gc(t) {
  for (let e = 0, n = t.length; e < n; e++) {
    const r = t.charCodeAt(e);
    if (r !== 32 && r !== 9)
      return e;
  }
  return -1;
}
function pc(t, e = t.length - 1) {
  for (let n = e; n >= 0; n--) {
    const r = t.charCodeAt(n);
    if (r !== 32 && r !== 9)
      return n;
  }
  return -1;
}
function Ha(t) {
  return t >= 65 && t <= 90;
}
function Qn(t) {
  return 55296 <= t && t <= 56319;
}
function Kr(t) {
  return 56320 <= t && t <= 57343;
}
function za(t, e) {
  return (t - 55296 << 10) + (e - 56320) + 65536;
}
function bc(t, e, n) {
  const r = t.charCodeAt(n);
  if (Qn(r) && n + 1 < e) {
    const i = t.charCodeAt(n + 1);
    if (Kr(i))
      return za(r, i);
  }
  return r;
}
const yc = /^[\t\n\r\x20-\x7E]*$/;
function vc(t) {
  return yc.test(t);
}
const pt = class pt {
  static getInstance() {
    return pt._INSTANCE || (pt._INSTANCE = new pt()), pt._INSTANCE;
  }
  constructor() {
    this._data = wc();
  }
  getGraphemeBreakType(e) {
    if (e < 32)
      return e === 10 ? 3 : e === 13 ? 2 : 4;
    if (e < 127)
      return 0;
    const n = this._data, r = n.length / 3;
    let i = 1;
    for (; i <= r; )
      if (e < n[3 * i])
        i = 2 * i;
      else if (e > n[3 * i + 1])
        i = 2 * i + 1;
      else
        return n[3 * i + 2];
    return 0;
  }
};
pt._INSTANCE = null;
let xs = pt;
function wc() {
  return JSON.parse("[0,0,0,51229,51255,12,44061,44087,12,127462,127487,6,7083,7085,5,47645,47671,12,54813,54839,12,128678,128678,14,3270,3270,5,9919,9923,14,45853,45879,12,49437,49463,12,53021,53047,12,71216,71218,7,128398,128399,14,129360,129374,14,2519,2519,5,4448,4519,9,9742,9742,14,12336,12336,14,44957,44983,12,46749,46775,12,48541,48567,12,50333,50359,12,52125,52151,12,53917,53943,12,69888,69890,5,73018,73018,5,127990,127990,14,128558,128559,14,128759,128760,14,129653,129655,14,2027,2035,5,2891,2892,7,3761,3761,5,6683,6683,5,8293,8293,4,9825,9826,14,9999,9999,14,43452,43453,5,44509,44535,12,45405,45431,12,46301,46327,12,47197,47223,12,48093,48119,12,48989,49015,12,49885,49911,12,50781,50807,12,51677,51703,12,52573,52599,12,53469,53495,12,54365,54391,12,65279,65279,4,70471,70472,7,72145,72147,7,119173,119179,5,127799,127818,14,128240,128244,14,128512,128512,14,128652,128652,14,128721,128722,14,129292,129292,14,129445,129450,14,129734,129743,14,1476,1477,5,2366,2368,7,2750,2752,7,3076,3076,5,3415,3415,5,4141,4144,5,6109,6109,5,6964,6964,5,7394,7400,5,9197,9198,14,9770,9770,14,9877,9877,14,9968,9969,14,10084,10084,14,43052,43052,5,43713,43713,5,44285,44311,12,44733,44759,12,45181,45207,12,45629,45655,12,46077,46103,12,46525,46551,12,46973,46999,12,47421,47447,12,47869,47895,12,48317,48343,12,48765,48791,12,49213,49239,12,49661,49687,12,50109,50135,12,50557,50583,12,51005,51031,12,51453,51479,12,51901,51927,12,52349,52375,12,52797,52823,12,53245,53271,12,53693,53719,12,54141,54167,12,54589,54615,12,55037,55063,12,69506,69509,5,70191,70193,5,70841,70841,7,71463,71467,5,72330,72342,5,94031,94031,5,123628,123631,5,127763,127765,14,127941,127941,14,128043,128062,14,128302,128317,14,128465,128467,14,128539,128539,14,128640,128640,14,128662,128662,14,128703,128703,14,128745,128745,14,129004,129007,14,129329,129330,14,129402,129402,14,129483,129483,14,129686,129704,14,130048,131069,14,173,173,4,1757,1757,1,2200,2207,5,2434,2435,7,2631,2632,5,2817,2817,5,3008,3008,5,3201,3201,5,3387,3388,5,3542,3542,5,3902,3903,7,4190,4192,5,6002,6003,5,6439,6440,5,6765,6770,7,7019,7027,5,7154,7155,7,8205,8205,13,8505,8505,14,9654,9654,14,9757,9757,14,9792,9792,14,9852,9853,14,9890,9894,14,9937,9937,14,9981,9981,14,10035,10036,14,11035,11036,14,42654,42655,5,43346,43347,7,43587,43587,5,44006,44007,7,44173,44199,12,44397,44423,12,44621,44647,12,44845,44871,12,45069,45095,12,45293,45319,12,45517,45543,12,45741,45767,12,45965,45991,12,46189,46215,12,46413,46439,12,46637,46663,12,46861,46887,12,47085,47111,12,47309,47335,12,47533,47559,12,47757,47783,12,47981,48007,12,48205,48231,12,48429,48455,12,48653,48679,12,48877,48903,12,49101,49127,12,49325,49351,12,49549,49575,12,49773,49799,12,49997,50023,12,50221,50247,12,50445,50471,12,50669,50695,12,50893,50919,12,51117,51143,12,51341,51367,12,51565,51591,12,51789,51815,12,52013,52039,12,52237,52263,12,52461,52487,12,52685,52711,12,52909,52935,12,53133,53159,12,53357,53383,12,53581,53607,12,53805,53831,12,54029,54055,12,54253,54279,12,54477,54503,12,54701,54727,12,54925,54951,12,55149,55175,12,68101,68102,5,69762,69762,7,70067,70069,7,70371,70378,5,70720,70721,7,71087,71087,5,71341,71341,5,71995,71996,5,72249,72249,7,72850,72871,5,73109,73109,5,118576,118598,5,121505,121519,5,127245,127247,14,127568,127569,14,127777,127777,14,127872,127891,14,127956,127967,14,128015,128016,14,128110,128172,14,128259,128259,14,128367,128368,14,128424,128424,14,128488,128488,14,128530,128532,14,128550,128551,14,128566,128566,14,128647,128647,14,128656,128656,14,128667,128673,14,128691,128693,14,128715,128715,14,128728,128732,14,128752,128752,14,128765,128767,14,129096,129103,14,129311,129311,14,129344,129349,14,129394,129394,14,129413,129425,14,129466,129471,14,129511,129535,14,129664,129666,14,129719,129722,14,129760,129767,14,917536,917631,5,13,13,2,1160,1161,5,1564,1564,4,1807,1807,1,2085,2087,5,2307,2307,7,2382,2383,7,2497,2500,5,2563,2563,7,2677,2677,5,2763,2764,7,2879,2879,5,2914,2915,5,3021,3021,5,3142,3144,5,3263,3263,5,3285,3286,5,3398,3400,7,3530,3530,5,3633,3633,5,3864,3865,5,3974,3975,5,4155,4156,7,4229,4230,5,5909,5909,7,6078,6085,7,6277,6278,5,6451,6456,7,6744,6750,5,6846,6846,5,6972,6972,5,7074,7077,5,7146,7148,7,7222,7223,5,7416,7417,5,8234,8238,4,8417,8417,5,9000,9000,14,9203,9203,14,9730,9731,14,9748,9749,14,9762,9763,14,9776,9783,14,9800,9811,14,9831,9831,14,9872,9873,14,9882,9882,14,9900,9903,14,9929,9933,14,9941,9960,14,9974,9974,14,9989,9989,14,10006,10006,14,10062,10062,14,10160,10160,14,11647,11647,5,12953,12953,14,43019,43019,5,43232,43249,5,43443,43443,5,43567,43568,7,43696,43696,5,43765,43765,7,44013,44013,5,44117,44143,12,44229,44255,12,44341,44367,12,44453,44479,12,44565,44591,12,44677,44703,12,44789,44815,12,44901,44927,12,45013,45039,12,45125,45151,12,45237,45263,12,45349,45375,12,45461,45487,12,45573,45599,12,45685,45711,12,45797,45823,12,45909,45935,12,46021,46047,12,46133,46159,12,46245,46271,12,46357,46383,12,46469,46495,12,46581,46607,12,46693,46719,12,46805,46831,12,46917,46943,12,47029,47055,12,47141,47167,12,47253,47279,12,47365,47391,12,47477,47503,12,47589,47615,12,47701,47727,12,47813,47839,12,47925,47951,12,48037,48063,12,48149,48175,12,48261,48287,12,48373,48399,12,48485,48511,12,48597,48623,12,48709,48735,12,48821,48847,12,48933,48959,12,49045,49071,12,49157,49183,12,49269,49295,12,49381,49407,12,49493,49519,12,49605,49631,12,49717,49743,12,49829,49855,12,49941,49967,12,50053,50079,12,50165,50191,12,50277,50303,12,50389,50415,12,50501,50527,12,50613,50639,12,50725,50751,12,50837,50863,12,50949,50975,12,51061,51087,12,51173,51199,12,51285,51311,12,51397,51423,12,51509,51535,12,51621,51647,12,51733,51759,12,51845,51871,12,51957,51983,12,52069,52095,12,52181,52207,12,52293,52319,12,52405,52431,12,52517,52543,12,52629,52655,12,52741,52767,12,52853,52879,12,52965,52991,12,53077,53103,12,53189,53215,12,53301,53327,12,53413,53439,12,53525,53551,12,53637,53663,12,53749,53775,12,53861,53887,12,53973,53999,12,54085,54111,12,54197,54223,12,54309,54335,12,54421,54447,12,54533,54559,12,54645,54671,12,54757,54783,12,54869,54895,12,54981,55007,12,55093,55119,12,55243,55291,10,66045,66045,5,68325,68326,5,69688,69702,5,69817,69818,5,69957,69958,7,70089,70092,5,70198,70199,5,70462,70462,5,70502,70508,5,70750,70750,5,70846,70846,7,71100,71101,5,71230,71230,7,71351,71351,5,71737,71738,5,72000,72000,7,72160,72160,5,72273,72278,5,72752,72758,5,72882,72883,5,73031,73031,5,73461,73462,7,94192,94193,7,119149,119149,7,121403,121452,5,122915,122916,5,126980,126980,14,127358,127359,14,127535,127535,14,127759,127759,14,127771,127771,14,127792,127793,14,127825,127867,14,127897,127899,14,127945,127945,14,127985,127986,14,128000,128007,14,128021,128021,14,128066,128100,14,128184,128235,14,128249,128252,14,128266,128276,14,128335,128335,14,128379,128390,14,128407,128419,14,128444,128444,14,128481,128481,14,128499,128499,14,128526,128526,14,128536,128536,14,128543,128543,14,128556,128556,14,128564,128564,14,128577,128580,14,128643,128645,14,128649,128649,14,128654,128654,14,128660,128660,14,128664,128664,14,128675,128675,14,128686,128689,14,128695,128696,14,128705,128709,14,128717,128719,14,128725,128725,14,128736,128741,14,128747,128748,14,128755,128755,14,128762,128762,14,128981,128991,14,129009,129023,14,129160,129167,14,129296,129304,14,129320,129327,14,129340,129342,14,129356,129356,14,129388,129392,14,129399,129400,14,129404,129407,14,129432,129442,14,129454,129455,14,129473,129474,14,129485,129487,14,129648,129651,14,129659,129660,14,129671,129679,14,129709,129711,14,129728,129730,14,129751,129753,14,129776,129782,14,917505,917505,4,917760,917999,5,10,10,3,127,159,4,768,879,5,1471,1471,5,1536,1541,1,1648,1648,5,1767,1768,5,1840,1866,5,2070,2073,5,2137,2139,5,2274,2274,1,2363,2363,7,2377,2380,7,2402,2403,5,2494,2494,5,2507,2508,7,2558,2558,5,2622,2624,7,2641,2641,5,2691,2691,7,2759,2760,5,2786,2787,5,2876,2876,5,2881,2884,5,2901,2902,5,3006,3006,5,3014,3016,7,3072,3072,5,3134,3136,5,3157,3158,5,3260,3260,5,3266,3266,5,3274,3275,7,3328,3329,5,3391,3392,7,3405,3405,5,3457,3457,5,3536,3537,7,3551,3551,5,3636,3642,5,3764,3772,5,3895,3895,5,3967,3967,7,3993,4028,5,4146,4151,5,4182,4183,7,4226,4226,5,4253,4253,5,4957,4959,5,5940,5940,7,6070,6070,7,6087,6088,7,6158,6158,4,6432,6434,5,6448,6449,7,6679,6680,5,6742,6742,5,6754,6754,5,6783,6783,5,6912,6915,5,6966,6970,5,6978,6978,5,7042,7042,7,7080,7081,5,7143,7143,7,7150,7150,7,7212,7219,5,7380,7392,5,7412,7412,5,8203,8203,4,8232,8232,4,8265,8265,14,8400,8412,5,8421,8432,5,8617,8618,14,9167,9167,14,9200,9200,14,9410,9410,14,9723,9726,14,9733,9733,14,9745,9745,14,9752,9752,14,9760,9760,14,9766,9766,14,9774,9774,14,9786,9786,14,9794,9794,14,9823,9823,14,9828,9828,14,9833,9850,14,9855,9855,14,9875,9875,14,9880,9880,14,9885,9887,14,9896,9897,14,9906,9916,14,9926,9927,14,9935,9935,14,9939,9939,14,9962,9962,14,9972,9972,14,9978,9978,14,9986,9986,14,9997,9997,14,10002,10002,14,10017,10017,14,10055,10055,14,10071,10071,14,10133,10135,14,10548,10549,14,11093,11093,14,12330,12333,5,12441,12442,5,42608,42610,5,43010,43010,5,43045,43046,5,43188,43203,7,43302,43309,5,43392,43394,5,43446,43449,5,43493,43493,5,43571,43572,7,43597,43597,7,43703,43704,5,43756,43757,5,44003,44004,7,44009,44010,7,44033,44059,12,44089,44115,12,44145,44171,12,44201,44227,12,44257,44283,12,44313,44339,12,44369,44395,12,44425,44451,12,44481,44507,12,44537,44563,12,44593,44619,12,44649,44675,12,44705,44731,12,44761,44787,12,44817,44843,12,44873,44899,12,44929,44955,12,44985,45011,12,45041,45067,12,45097,45123,12,45153,45179,12,45209,45235,12,45265,45291,12,45321,45347,12,45377,45403,12,45433,45459,12,45489,45515,12,45545,45571,12,45601,45627,12,45657,45683,12,45713,45739,12,45769,45795,12,45825,45851,12,45881,45907,12,45937,45963,12,45993,46019,12,46049,46075,12,46105,46131,12,46161,46187,12,46217,46243,12,46273,46299,12,46329,46355,12,46385,46411,12,46441,46467,12,46497,46523,12,46553,46579,12,46609,46635,12,46665,46691,12,46721,46747,12,46777,46803,12,46833,46859,12,46889,46915,12,46945,46971,12,47001,47027,12,47057,47083,12,47113,47139,12,47169,47195,12,47225,47251,12,47281,47307,12,47337,47363,12,47393,47419,12,47449,47475,12,47505,47531,12,47561,47587,12,47617,47643,12,47673,47699,12,47729,47755,12,47785,47811,12,47841,47867,12,47897,47923,12,47953,47979,12,48009,48035,12,48065,48091,12,48121,48147,12,48177,48203,12,48233,48259,12,48289,48315,12,48345,48371,12,48401,48427,12,48457,48483,12,48513,48539,12,48569,48595,12,48625,48651,12,48681,48707,12,48737,48763,12,48793,48819,12,48849,48875,12,48905,48931,12,48961,48987,12,49017,49043,12,49073,49099,12,49129,49155,12,49185,49211,12,49241,49267,12,49297,49323,12,49353,49379,12,49409,49435,12,49465,49491,12,49521,49547,12,49577,49603,12,49633,49659,12,49689,49715,12,49745,49771,12,49801,49827,12,49857,49883,12,49913,49939,12,49969,49995,12,50025,50051,12,50081,50107,12,50137,50163,12,50193,50219,12,50249,50275,12,50305,50331,12,50361,50387,12,50417,50443,12,50473,50499,12,50529,50555,12,50585,50611,12,50641,50667,12,50697,50723,12,50753,50779,12,50809,50835,12,50865,50891,12,50921,50947,12,50977,51003,12,51033,51059,12,51089,51115,12,51145,51171,12,51201,51227,12,51257,51283,12,51313,51339,12,51369,51395,12,51425,51451,12,51481,51507,12,51537,51563,12,51593,51619,12,51649,51675,12,51705,51731,12,51761,51787,12,51817,51843,12,51873,51899,12,51929,51955,12,51985,52011,12,52041,52067,12,52097,52123,12,52153,52179,12,52209,52235,12,52265,52291,12,52321,52347,12,52377,52403,12,52433,52459,12,52489,52515,12,52545,52571,12,52601,52627,12,52657,52683,12,52713,52739,12,52769,52795,12,52825,52851,12,52881,52907,12,52937,52963,12,52993,53019,12,53049,53075,12,53105,53131,12,53161,53187,12,53217,53243,12,53273,53299,12,53329,53355,12,53385,53411,12,53441,53467,12,53497,53523,12,53553,53579,12,53609,53635,12,53665,53691,12,53721,53747,12,53777,53803,12,53833,53859,12,53889,53915,12,53945,53971,12,54001,54027,12,54057,54083,12,54113,54139,12,54169,54195,12,54225,54251,12,54281,54307,12,54337,54363,12,54393,54419,12,54449,54475,12,54505,54531,12,54561,54587,12,54617,54643,12,54673,54699,12,54729,54755,12,54785,54811,12,54841,54867,12,54897,54923,12,54953,54979,12,55009,55035,12,55065,55091,12,55121,55147,12,55177,55203,12,65024,65039,5,65520,65528,4,66422,66426,5,68152,68154,5,69291,69292,5,69633,69633,5,69747,69748,5,69811,69814,5,69826,69826,5,69932,69932,7,70016,70017,5,70079,70080,7,70095,70095,5,70196,70196,5,70367,70367,5,70402,70403,7,70464,70464,5,70487,70487,5,70709,70711,7,70725,70725,7,70833,70834,7,70843,70844,7,70849,70849,7,71090,71093,5,71103,71104,5,71227,71228,7,71339,71339,5,71344,71349,5,71458,71461,5,71727,71735,5,71985,71989,7,71998,71998,5,72002,72002,7,72154,72155,5,72193,72202,5,72251,72254,5,72281,72283,5,72344,72345,5,72766,72766,7,72874,72880,5,72885,72886,5,73023,73029,5,73104,73105,5,73111,73111,5,92912,92916,5,94095,94098,5,113824,113827,4,119142,119142,7,119155,119162,4,119362,119364,5,121476,121476,5,122888,122904,5,123184,123190,5,125252,125258,5,127183,127183,14,127340,127343,14,127377,127386,14,127491,127503,14,127548,127551,14,127744,127756,14,127761,127761,14,127769,127769,14,127773,127774,14,127780,127788,14,127796,127797,14,127820,127823,14,127869,127869,14,127894,127895,14,127902,127903,14,127943,127943,14,127947,127950,14,127972,127972,14,127988,127988,14,127992,127994,14,128009,128011,14,128019,128019,14,128023,128041,14,128064,128064,14,128102,128107,14,128174,128181,14,128238,128238,14,128246,128247,14,128254,128254,14,128264,128264,14,128278,128299,14,128329,128330,14,128348,128359,14,128371,128377,14,128392,128393,14,128401,128404,14,128421,128421,14,128433,128434,14,128450,128452,14,128476,128478,14,128483,128483,14,128495,128495,14,128506,128506,14,128519,128520,14,128528,128528,14,128534,128534,14,128538,128538,14,128540,128542,14,128544,128549,14,128552,128555,14,128557,128557,14,128560,128563,14,128565,128565,14,128567,128576,14,128581,128591,14,128641,128642,14,128646,128646,14,128648,128648,14,128650,128651,14,128653,128653,14,128655,128655,14,128657,128659,14,128661,128661,14,128663,128663,14,128665,128666,14,128674,128674,14,128676,128677,14,128679,128685,14,128690,128690,14,128694,128694,14,128697,128702,14,128704,128704,14,128710,128714,14,128716,128716,14,128720,128720,14,128723,128724,14,128726,128727,14,128733,128735,14,128742,128744,14,128746,128746,14,128749,128751,14,128753,128754,14,128756,128758,14,128761,128761,14,128763,128764,14,128884,128895,14,128992,129003,14,129008,129008,14,129036,129039,14,129114,129119,14,129198,129279,14,129293,129295,14,129305,129310,14,129312,129319,14,129328,129328,14,129331,129338,14,129343,129343,14,129351,129355,14,129357,129359,14,129375,129387,14,129393,129393,14,129395,129398,14,129401,129401,14,129403,129403,14,129408,129412,14,129426,129431,14,129443,129444,14,129451,129453,14,129456,129465,14,129472,129472,14,129475,129482,14,129484,129484,14,129488,129510,14,129536,129647,14,129652,129652,14,129656,129658,14,129661,129663,14,129667,129670,14,129680,129685,14,129705,129708,14,129712,129718,14,129723,129727,14,129731,129733,14,129744,129750,14,129754,129759,14,129768,129775,14,129783,129791,14,917504,917504,4,917506,917535,4,917632,917759,4,918000,921599,4,0,9,4,11,12,4,14,31,4,169,169,14,174,174,14,1155,1159,5,1425,1469,5,1473,1474,5,1479,1479,5,1552,1562,5,1611,1631,5,1750,1756,5,1759,1764,5,1770,1773,5,1809,1809,5,1958,1968,5,2045,2045,5,2075,2083,5,2089,2093,5,2192,2193,1,2250,2273,5,2275,2306,5,2362,2362,5,2364,2364,5,2369,2376,5,2381,2381,5,2385,2391,5,2433,2433,5,2492,2492,5,2495,2496,7,2503,2504,7,2509,2509,5,2530,2531,5,2561,2562,5,2620,2620,5,2625,2626,5,2635,2637,5,2672,2673,5,2689,2690,5,2748,2748,5,2753,2757,5,2761,2761,7,2765,2765,5,2810,2815,5,2818,2819,7,2878,2878,5,2880,2880,7,2887,2888,7,2893,2893,5,2903,2903,5,2946,2946,5,3007,3007,7,3009,3010,7,3018,3020,7,3031,3031,5,3073,3075,7,3132,3132,5,3137,3140,7,3146,3149,5,3170,3171,5,3202,3203,7,3262,3262,7,3264,3265,7,3267,3268,7,3271,3272,7,3276,3277,5,3298,3299,5,3330,3331,7,3390,3390,5,3393,3396,5,3402,3404,7,3406,3406,1,3426,3427,5,3458,3459,7,3535,3535,5,3538,3540,5,3544,3550,7,3570,3571,7,3635,3635,7,3655,3662,5,3763,3763,7,3784,3789,5,3893,3893,5,3897,3897,5,3953,3966,5,3968,3972,5,3981,3991,5,4038,4038,5,4145,4145,7,4153,4154,5,4157,4158,5,4184,4185,5,4209,4212,5,4228,4228,7,4237,4237,5,4352,4447,8,4520,4607,10,5906,5908,5,5938,5939,5,5970,5971,5,6068,6069,5,6071,6077,5,6086,6086,5,6089,6099,5,6155,6157,5,6159,6159,5,6313,6313,5,6435,6438,7,6441,6443,7,6450,6450,5,6457,6459,5,6681,6682,7,6741,6741,7,6743,6743,7,6752,6752,5,6757,6764,5,6771,6780,5,6832,6845,5,6847,6862,5,6916,6916,7,6965,6965,5,6971,6971,7,6973,6977,7,6979,6980,7,7040,7041,5,7073,7073,7,7078,7079,7,7082,7082,7,7142,7142,5,7144,7145,5,7149,7149,5,7151,7153,5,7204,7211,7,7220,7221,7,7376,7378,5,7393,7393,7,7405,7405,5,7415,7415,7,7616,7679,5,8204,8204,5,8206,8207,4,8233,8233,4,8252,8252,14,8288,8292,4,8294,8303,4,8413,8416,5,8418,8420,5,8482,8482,14,8596,8601,14,8986,8987,14,9096,9096,14,9193,9196,14,9199,9199,14,9201,9202,14,9208,9210,14,9642,9643,14,9664,9664,14,9728,9729,14,9732,9732,14,9735,9741,14,9743,9744,14,9746,9746,14,9750,9751,14,9753,9756,14,9758,9759,14,9761,9761,14,9764,9765,14,9767,9769,14,9771,9773,14,9775,9775,14,9784,9785,14,9787,9791,14,9793,9793,14,9795,9799,14,9812,9822,14,9824,9824,14,9827,9827,14,9829,9830,14,9832,9832,14,9851,9851,14,9854,9854,14,9856,9861,14,9874,9874,14,9876,9876,14,9878,9879,14,9881,9881,14,9883,9884,14,9888,9889,14,9895,9895,14,9898,9899,14,9904,9905,14,9917,9918,14,9924,9925,14,9928,9928,14,9934,9934,14,9936,9936,14,9938,9938,14,9940,9940,14,9961,9961,14,9963,9967,14,9970,9971,14,9973,9973,14,9975,9977,14,9979,9980,14,9982,9985,14,9987,9988,14,9992,9996,14,9998,9998,14,10000,10001,14,10004,10004,14,10013,10013,14,10024,10024,14,10052,10052,14,10060,10060,14,10067,10069,14,10083,10083,14,10085,10087,14,10145,10145,14,10175,10175,14,11013,11015,14,11088,11088,14,11503,11505,5,11744,11775,5,12334,12335,5,12349,12349,14,12951,12951,14,42607,42607,5,42612,42621,5,42736,42737,5,43014,43014,5,43043,43044,7,43047,43047,7,43136,43137,7,43204,43205,5,43263,43263,5,43335,43345,5,43360,43388,8,43395,43395,7,43444,43445,7,43450,43451,7,43454,43456,7,43561,43566,5,43569,43570,5,43573,43574,5,43596,43596,5,43644,43644,5,43698,43700,5,43710,43711,5,43755,43755,7,43758,43759,7,43766,43766,5,44005,44005,5,44008,44008,5,44012,44012,7,44032,44032,11,44060,44060,11,44088,44088,11,44116,44116,11,44144,44144,11,44172,44172,11,44200,44200,11,44228,44228,11,44256,44256,11,44284,44284,11,44312,44312,11,44340,44340,11,44368,44368,11,44396,44396,11,44424,44424,11,44452,44452,11,44480,44480,11,44508,44508,11,44536,44536,11,44564,44564,11,44592,44592,11,44620,44620,11,44648,44648,11,44676,44676,11,44704,44704,11,44732,44732,11,44760,44760,11,44788,44788,11,44816,44816,11,44844,44844,11,44872,44872,11,44900,44900,11,44928,44928,11,44956,44956,11,44984,44984,11,45012,45012,11,45040,45040,11,45068,45068,11,45096,45096,11,45124,45124,11,45152,45152,11,45180,45180,11,45208,45208,11,45236,45236,11,45264,45264,11,45292,45292,11,45320,45320,11,45348,45348,11,45376,45376,11,45404,45404,11,45432,45432,11,45460,45460,11,45488,45488,11,45516,45516,11,45544,45544,11,45572,45572,11,45600,45600,11,45628,45628,11,45656,45656,11,45684,45684,11,45712,45712,11,45740,45740,11,45768,45768,11,45796,45796,11,45824,45824,11,45852,45852,11,45880,45880,11,45908,45908,11,45936,45936,11,45964,45964,11,45992,45992,11,46020,46020,11,46048,46048,11,46076,46076,11,46104,46104,11,46132,46132,11,46160,46160,11,46188,46188,11,46216,46216,11,46244,46244,11,46272,46272,11,46300,46300,11,46328,46328,11,46356,46356,11,46384,46384,11,46412,46412,11,46440,46440,11,46468,46468,11,46496,46496,11,46524,46524,11,46552,46552,11,46580,46580,11,46608,46608,11,46636,46636,11,46664,46664,11,46692,46692,11,46720,46720,11,46748,46748,11,46776,46776,11,46804,46804,11,46832,46832,11,46860,46860,11,46888,46888,11,46916,46916,11,46944,46944,11,46972,46972,11,47000,47000,11,47028,47028,11,47056,47056,11,47084,47084,11,47112,47112,11,47140,47140,11,47168,47168,11,47196,47196,11,47224,47224,11,47252,47252,11,47280,47280,11,47308,47308,11,47336,47336,11,47364,47364,11,47392,47392,11,47420,47420,11,47448,47448,11,47476,47476,11,47504,47504,11,47532,47532,11,47560,47560,11,47588,47588,11,47616,47616,11,47644,47644,11,47672,47672,11,47700,47700,11,47728,47728,11,47756,47756,11,47784,47784,11,47812,47812,11,47840,47840,11,47868,47868,11,47896,47896,11,47924,47924,11,47952,47952,11,47980,47980,11,48008,48008,11,48036,48036,11,48064,48064,11,48092,48092,11,48120,48120,11,48148,48148,11,48176,48176,11,48204,48204,11,48232,48232,11,48260,48260,11,48288,48288,11,48316,48316,11,48344,48344,11,48372,48372,11,48400,48400,11,48428,48428,11,48456,48456,11,48484,48484,11,48512,48512,11,48540,48540,11,48568,48568,11,48596,48596,11,48624,48624,11,48652,48652,11,48680,48680,11,48708,48708,11,48736,48736,11,48764,48764,11,48792,48792,11,48820,48820,11,48848,48848,11,48876,48876,11,48904,48904,11,48932,48932,11,48960,48960,11,48988,48988,11,49016,49016,11,49044,49044,11,49072,49072,11,49100,49100,11,49128,49128,11,49156,49156,11,49184,49184,11,49212,49212,11,49240,49240,11,49268,49268,11,49296,49296,11,49324,49324,11,49352,49352,11,49380,49380,11,49408,49408,11,49436,49436,11,49464,49464,11,49492,49492,11,49520,49520,11,49548,49548,11,49576,49576,11,49604,49604,11,49632,49632,11,49660,49660,11,49688,49688,11,49716,49716,11,49744,49744,11,49772,49772,11,49800,49800,11,49828,49828,11,49856,49856,11,49884,49884,11,49912,49912,11,49940,49940,11,49968,49968,11,49996,49996,11,50024,50024,11,50052,50052,11,50080,50080,11,50108,50108,11,50136,50136,11,50164,50164,11,50192,50192,11,50220,50220,11,50248,50248,11,50276,50276,11,50304,50304,11,50332,50332,11,50360,50360,11,50388,50388,11,50416,50416,11,50444,50444,11,50472,50472,11,50500,50500,11,50528,50528,11,50556,50556,11,50584,50584,11,50612,50612,11,50640,50640,11,50668,50668,11,50696,50696,11,50724,50724,11,50752,50752,11,50780,50780,11,50808,50808,11,50836,50836,11,50864,50864,11,50892,50892,11,50920,50920,11,50948,50948,11,50976,50976,11,51004,51004,11,51032,51032,11,51060,51060,11,51088,51088,11,51116,51116,11,51144,51144,11,51172,51172,11,51200,51200,11,51228,51228,11,51256,51256,11,51284,51284,11,51312,51312,11,51340,51340,11,51368,51368,11,51396,51396,11,51424,51424,11,51452,51452,11,51480,51480,11,51508,51508,11,51536,51536,11,51564,51564,11,51592,51592,11,51620,51620,11,51648,51648,11,51676,51676,11,51704,51704,11,51732,51732,11,51760,51760,11,51788,51788,11,51816,51816,11,51844,51844,11,51872,51872,11,51900,51900,11,51928,51928,11,51956,51956,11,51984,51984,11,52012,52012,11,52040,52040,11,52068,52068,11,52096,52096,11,52124,52124,11,52152,52152,11,52180,52180,11,52208,52208,11,52236,52236,11,52264,52264,11,52292,52292,11,52320,52320,11,52348,52348,11,52376,52376,11,52404,52404,11,52432,52432,11,52460,52460,11,52488,52488,11,52516,52516,11,52544,52544,11,52572,52572,11,52600,52600,11,52628,52628,11,52656,52656,11,52684,52684,11,52712,52712,11,52740,52740,11,52768,52768,11,52796,52796,11,52824,52824,11,52852,52852,11,52880,52880,11,52908,52908,11,52936,52936,11,52964,52964,11,52992,52992,11,53020,53020,11,53048,53048,11,53076,53076,11,53104,53104,11,53132,53132,11,53160,53160,11,53188,53188,11,53216,53216,11,53244,53244,11,53272,53272,11,53300,53300,11,53328,53328,11,53356,53356,11,53384,53384,11,53412,53412,11,53440,53440,11,53468,53468,11,53496,53496,11,53524,53524,11,53552,53552,11,53580,53580,11,53608,53608,11,53636,53636,11,53664,53664,11,53692,53692,11,53720,53720,11,53748,53748,11,53776,53776,11,53804,53804,11,53832,53832,11,53860,53860,11,53888,53888,11,53916,53916,11,53944,53944,11,53972,53972,11,54000,54000,11,54028,54028,11,54056,54056,11,54084,54084,11,54112,54112,11,54140,54140,11,54168,54168,11,54196,54196,11,54224,54224,11,54252,54252,11,54280,54280,11,54308,54308,11,54336,54336,11,54364,54364,11,54392,54392,11,54420,54420,11,54448,54448,11,54476,54476,11,54504,54504,11,54532,54532,11,54560,54560,11,54588,54588,11,54616,54616,11,54644,54644,11,54672,54672,11,54700,54700,11,54728,54728,11,54756,54756,11,54784,54784,11,54812,54812,11,54840,54840,11,54868,54868,11,54896,54896,11,54924,54924,11,54952,54952,11,54980,54980,11,55008,55008,11,55036,55036,11,55064,55064,11,55092,55092,11,55120,55120,11,55148,55148,11,55176,55176,11,55216,55238,9,64286,64286,5,65056,65071,5,65438,65439,5,65529,65531,4,66272,66272,5,68097,68099,5,68108,68111,5,68159,68159,5,68900,68903,5,69446,69456,5,69632,69632,7,69634,69634,7,69744,69744,5,69759,69761,5,69808,69810,7,69815,69816,7,69821,69821,1,69837,69837,1,69927,69931,5,69933,69940,5,70003,70003,5,70018,70018,7,70070,70078,5,70082,70083,1,70094,70094,7,70188,70190,7,70194,70195,7,70197,70197,7,70206,70206,5,70368,70370,7,70400,70401,5,70459,70460,5,70463,70463,7,70465,70468,7,70475,70477,7,70498,70499,7,70512,70516,5,70712,70719,5,70722,70724,5,70726,70726,5,70832,70832,5,70835,70840,5,70842,70842,5,70845,70845,5,70847,70848,5,70850,70851,5,71088,71089,7,71096,71099,7,71102,71102,7,71132,71133,5,71219,71226,5,71229,71229,5,71231,71232,5,71340,71340,7,71342,71343,7,71350,71350,7,71453,71455,5,71462,71462,7,71724,71726,7,71736,71736,7,71984,71984,5,71991,71992,7,71997,71997,7,71999,71999,1,72001,72001,1,72003,72003,5,72148,72151,5,72156,72159,7,72164,72164,7,72243,72248,5,72250,72250,1,72263,72263,5,72279,72280,7,72324,72329,1,72343,72343,7,72751,72751,7,72760,72765,5,72767,72767,5,72873,72873,7,72881,72881,7,72884,72884,7,73009,73014,5,73020,73021,5,73030,73030,1,73098,73102,7,73107,73108,7,73110,73110,7,73459,73460,5,78896,78904,4,92976,92982,5,94033,94087,7,94180,94180,5,113821,113822,5,118528,118573,5,119141,119141,5,119143,119145,5,119150,119154,5,119163,119170,5,119210,119213,5,121344,121398,5,121461,121461,5,121499,121503,5,122880,122886,5,122907,122913,5,122918,122922,5,123566,123566,5,125136,125142,5,126976,126979,14,126981,127182,14,127184,127231,14,127279,127279,14,127344,127345,14,127374,127374,14,127405,127461,14,127489,127490,14,127514,127514,14,127538,127546,14,127561,127567,14,127570,127743,14,127757,127758,14,127760,127760,14,127762,127762,14,127766,127768,14,127770,127770,14,127772,127772,14,127775,127776,14,127778,127779,14,127789,127791,14,127794,127795,14,127798,127798,14,127819,127819,14,127824,127824,14,127868,127868,14,127870,127871,14,127892,127893,14,127896,127896,14,127900,127901,14,127904,127940,14,127942,127942,14,127944,127944,14,127946,127946,14,127951,127955,14,127968,127971,14,127973,127984,14,127987,127987,14,127989,127989,14,127991,127991,14,127995,127999,5,128008,128008,14,128012,128014,14,128017,128018,14,128020,128020,14,128022,128022,14,128042,128042,14,128063,128063,14,128065,128065,14,128101,128101,14,128108,128109,14,128173,128173,14,128182,128183,14,128236,128237,14,128239,128239,14,128245,128245,14,128248,128248,14,128253,128253,14,128255,128258,14,128260,128263,14,128265,128265,14,128277,128277,14,128300,128301,14,128326,128328,14,128331,128334,14,128336,128347,14,128360,128366,14,128369,128370,14,128378,128378,14,128391,128391,14,128394,128397,14,128400,128400,14,128405,128406,14,128420,128420,14,128422,128423,14,128425,128432,14,128435,128443,14,128445,128449,14,128453,128464,14,128468,128475,14,128479,128480,14,128482,128482,14,128484,128487,14,128489,128494,14,128496,128498,14,128500,128505,14,128507,128511,14,128513,128518,14,128521,128525,14,128527,128527,14,128529,128529,14,128533,128533,14,128535,128535,14,128537,128537,14]");
}
const Ve = class Ve {
  static getInstance(e) {
    return Ve.cache.get(Array.from(e));
  }
  static getLocales() {
    return Ve._locales.value;
  }
  constructor(e) {
    this.confusableDictionary = e;
  }
  isAmbiguous(e) {
    return this.confusableDictionary.has(e);
  }
  /**
   * Returns the non basic ASCII code point that the given code point can be confused,
   * or undefined if such code point does note exist.
   */
  getPrimaryConfusable(e) {
    return this.confusableDictionary.get(e);
  }
  getConfusableCodePoints() {
    return new Set(this.confusableDictionary.keys());
  }
};
Ve.ambiguousCharacterData = new ws(() => JSON.parse('{"_common":[8232,32,8233,32,5760,32,8192,32,8193,32,8194,32,8195,32,8196,32,8197,32,8198,32,8200,32,8201,32,8202,32,8287,32,8199,32,8239,32,2042,95,65101,95,65102,95,65103,95,8208,45,8209,45,8210,45,65112,45,1748,45,8259,45,727,45,8722,45,10134,45,11450,45,1549,44,1643,44,8218,44,184,44,42233,44,894,59,2307,58,2691,58,1417,58,1795,58,1796,58,5868,58,65072,58,6147,58,6153,58,8282,58,1475,58,760,58,42889,58,8758,58,720,58,42237,58,451,33,11601,33,660,63,577,63,2429,63,5038,63,42731,63,119149,46,8228,46,1793,46,1794,46,42510,46,68176,46,1632,46,1776,46,42232,46,1373,96,65287,96,8219,96,8242,96,1370,96,1523,96,8175,96,65344,96,900,96,8189,96,8125,96,8127,96,8190,96,697,96,884,96,712,96,714,96,715,96,756,96,699,96,701,96,700,96,702,96,42892,96,1497,96,2036,96,2037,96,5194,96,5836,96,94033,96,94034,96,65339,91,10088,40,10098,40,12308,40,64830,40,65341,93,10089,41,10099,41,12309,41,64831,41,10100,123,119060,123,10101,125,65342,94,8270,42,1645,42,8727,42,66335,42,5941,47,8257,47,8725,47,8260,47,9585,47,10187,47,10744,47,119354,47,12755,47,12339,47,11462,47,20031,47,12035,47,65340,92,65128,92,8726,92,10189,92,10741,92,10745,92,119311,92,119355,92,12756,92,20022,92,12034,92,42872,38,708,94,710,94,5869,43,10133,43,66203,43,8249,60,10094,60,706,60,119350,60,5176,60,5810,60,5120,61,11840,61,12448,61,42239,61,8250,62,10095,62,707,62,119351,62,5171,62,94015,62,8275,126,732,126,8128,126,8764,126,65372,124,65293,45,120784,50,120794,50,120804,50,120814,50,120824,50,130034,50,42842,50,423,50,1000,50,42564,50,5311,50,42735,50,119302,51,120785,51,120795,51,120805,51,120815,51,120825,51,130035,51,42923,51,540,51,439,51,42858,51,11468,51,1248,51,94011,51,71882,51,120786,52,120796,52,120806,52,120816,52,120826,52,130036,52,5070,52,71855,52,120787,53,120797,53,120807,53,120817,53,120827,53,130037,53,444,53,71867,53,120788,54,120798,54,120808,54,120818,54,120828,54,130038,54,11474,54,5102,54,71893,54,119314,55,120789,55,120799,55,120809,55,120819,55,120829,55,130039,55,66770,55,71878,55,2819,56,2538,56,2666,56,125131,56,120790,56,120800,56,120810,56,120820,56,120830,56,130040,56,547,56,546,56,66330,56,2663,57,2920,57,2541,57,3437,57,120791,57,120801,57,120811,57,120821,57,120831,57,130041,57,42862,57,11466,57,71884,57,71852,57,71894,57,9082,97,65345,97,119834,97,119886,97,119938,97,119990,97,120042,97,120094,97,120146,97,120198,97,120250,97,120302,97,120354,97,120406,97,120458,97,593,97,945,97,120514,97,120572,97,120630,97,120688,97,120746,97,65313,65,119808,65,119860,65,119912,65,119964,65,120016,65,120068,65,120120,65,120172,65,120224,65,120276,65,120328,65,120380,65,120432,65,913,65,120488,65,120546,65,120604,65,120662,65,120720,65,5034,65,5573,65,42222,65,94016,65,66208,65,119835,98,119887,98,119939,98,119991,98,120043,98,120095,98,120147,98,120199,98,120251,98,120303,98,120355,98,120407,98,120459,98,388,98,5071,98,5234,98,5551,98,65314,66,8492,66,119809,66,119861,66,119913,66,120017,66,120069,66,120121,66,120173,66,120225,66,120277,66,120329,66,120381,66,120433,66,42932,66,914,66,120489,66,120547,66,120605,66,120663,66,120721,66,5108,66,5623,66,42192,66,66178,66,66209,66,66305,66,65347,99,8573,99,119836,99,119888,99,119940,99,119992,99,120044,99,120096,99,120148,99,120200,99,120252,99,120304,99,120356,99,120408,99,120460,99,7428,99,1010,99,11429,99,43951,99,66621,99,128844,67,71922,67,71913,67,65315,67,8557,67,8450,67,8493,67,119810,67,119862,67,119914,67,119966,67,120018,67,120174,67,120226,67,120278,67,120330,67,120382,67,120434,67,1017,67,11428,67,5087,67,42202,67,66210,67,66306,67,66581,67,66844,67,8574,100,8518,100,119837,100,119889,100,119941,100,119993,100,120045,100,120097,100,120149,100,120201,100,120253,100,120305,100,120357,100,120409,100,120461,100,1281,100,5095,100,5231,100,42194,100,8558,68,8517,68,119811,68,119863,68,119915,68,119967,68,120019,68,120071,68,120123,68,120175,68,120227,68,120279,68,120331,68,120383,68,120435,68,5024,68,5598,68,5610,68,42195,68,8494,101,65349,101,8495,101,8519,101,119838,101,119890,101,119942,101,120046,101,120098,101,120150,101,120202,101,120254,101,120306,101,120358,101,120410,101,120462,101,43826,101,1213,101,8959,69,65317,69,8496,69,119812,69,119864,69,119916,69,120020,69,120072,69,120124,69,120176,69,120228,69,120280,69,120332,69,120384,69,120436,69,917,69,120492,69,120550,69,120608,69,120666,69,120724,69,11577,69,5036,69,42224,69,71846,69,71854,69,66182,69,119839,102,119891,102,119943,102,119995,102,120047,102,120099,102,120151,102,120203,102,120255,102,120307,102,120359,102,120411,102,120463,102,43829,102,42905,102,383,102,7837,102,1412,102,119315,70,8497,70,119813,70,119865,70,119917,70,120021,70,120073,70,120125,70,120177,70,120229,70,120281,70,120333,70,120385,70,120437,70,42904,70,988,70,120778,70,5556,70,42205,70,71874,70,71842,70,66183,70,66213,70,66853,70,65351,103,8458,103,119840,103,119892,103,119944,103,120048,103,120100,103,120152,103,120204,103,120256,103,120308,103,120360,103,120412,103,120464,103,609,103,7555,103,397,103,1409,103,119814,71,119866,71,119918,71,119970,71,120022,71,120074,71,120126,71,120178,71,120230,71,120282,71,120334,71,120386,71,120438,71,1292,71,5056,71,5107,71,42198,71,65352,104,8462,104,119841,104,119945,104,119997,104,120049,104,120101,104,120153,104,120205,104,120257,104,120309,104,120361,104,120413,104,120465,104,1211,104,1392,104,5058,104,65320,72,8459,72,8460,72,8461,72,119815,72,119867,72,119919,72,120023,72,120179,72,120231,72,120283,72,120335,72,120387,72,120439,72,919,72,120494,72,120552,72,120610,72,120668,72,120726,72,11406,72,5051,72,5500,72,42215,72,66255,72,731,105,9075,105,65353,105,8560,105,8505,105,8520,105,119842,105,119894,105,119946,105,119998,105,120050,105,120102,105,120154,105,120206,105,120258,105,120310,105,120362,105,120414,105,120466,105,120484,105,618,105,617,105,953,105,8126,105,890,105,120522,105,120580,105,120638,105,120696,105,120754,105,1110,105,42567,105,1231,105,43893,105,5029,105,71875,105,65354,106,8521,106,119843,106,119895,106,119947,106,119999,106,120051,106,120103,106,120155,106,120207,106,120259,106,120311,106,120363,106,120415,106,120467,106,1011,106,1112,106,65322,74,119817,74,119869,74,119921,74,119973,74,120025,74,120077,74,120129,74,120181,74,120233,74,120285,74,120337,74,120389,74,120441,74,42930,74,895,74,1032,74,5035,74,5261,74,42201,74,119844,107,119896,107,119948,107,120000,107,120052,107,120104,107,120156,107,120208,107,120260,107,120312,107,120364,107,120416,107,120468,107,8490,75,65323,75,119818,75,119870,75,119922,75,119974,75,120026,75,120078,75,120130,75,120182,75,120234,75,120286,75,120338,75,120390,75,120442,75,922,75,120497,75,120555,75,120613,75,120671,75,120729,75,11412,75,5094,75,5845,75,42199,75,66840,75,1472,108,8739,73,9213,73,65512,73,1633,108,1777,73,66336,108,125127,108,120783,73,120793,73,120803,73,120813,73,120823,73,130033,73,65321,73,8544,73,8464,73,8465,73,119816,73,119868,73,119920,73,120024,73,120128,73,120180,73,120232,73,120284,73,120336,73,120388,73,120440,73,65356,108,8572,73,8467,108,119845,108,119897,108,119949,108,120001,108,120053,108,120105,73,120157,73,120209,73,120261,73,120313,73,120365,73,120417,73,120469,73,448,73,120496,73,120554,73,120612,73,120670,73,120728,73,11410,73,1030,73,1216,73,1493,108,1503,108,1575,108,126464,108,126592,108,65166,108,65165,108,1994,108,11599,73,5825,73,42226,73,93992,73,66186,124,66313,124,119338,76,8556,76,8466,76,119819,76,119871,76,119923,76,120027,76,120079,76,120131,76,120183,76,120235,76,120287,76,120339,76,120391,76,120443,76,11472,76,5086,76,5290,76,42209,76,93974,76,71843,76,71858,76,66587,76,66854,76,65325,77,8559,77,8499,77,119820,77,119872,77,119924,77,120028,77,120080,77,120132,77,120184,77,120236,77,120288,77,120340,77,120392,77,120444,77,924,77,120499,77,120557,77,120615,77,120673,77,120731,77,1018,77,11416,77,5047,77,5616,77,5846,77,42207,77,66224,77,66321,77,119847,110,119899,110,119951,110,120003,110,120055,110,120107,110,120159,110,120211,110,120263,110,120315,110,120367,110,120419,110,120471,110,1400,110,1404,110,65326,78,8469,78,119821,78,119873,78,119925,78,119977,78,120029,78,120081,78,120185,78,120237,78,120289,78,120341,78,120393,78,120445,78,925,78,120500,78,120558,78,120616,78,120674,78,120732,78,11418,78,42208,78,66835,78,3074,111,3202,111,3330,111,3458,111,2406,111,2662,111,2790,111,3046,111,3174,111,3302,111,3430,111,3664,111,3792,111,4160,111,1637,111,1781,111,65359,111,8500,111,119848,111,119900,111,119952,111,120056,111,120108,111,120160,111,120212,111,120264,111,120316,111,120368,111,120420,111,120472,111,7439,111,7441,111,43837,111,959,111,120528,111,120586,111,120644,111,120702,111,120760,111,963,111,120532,111,120590,111,120648,111,120706,111,120764,111,11423,111,4351,111,1413,111,1505,111,1607,111,126500,111,126564,111,126596,111,65259,111,65260,111,65258,111,65257,111,1726,111,64428,111,64429,111,64427,111,64426,111,1729,111,64424,111,64425,111,64423,111,64422,111,1749,111,3360,111,4125,111,66794,111,71880,111,71895,111,66604,111,1984,79,2534,79,2918,79,12295,79,70864,79,71904,79,120782,79,120792,79,120802,79,120812,79,120822,79,130032,79,65327,79,119822,79,119874,79,119926,79,119978,79,120030,79,120082,79,120134,79,120186,79,120238,79,120290,79,120342,79,120394,79,120446,79,927,79,120502,79,120560,79,120618,79,120676,79,120734,79,11422,79,1365,79,11604,79,4816,79,2848,79,66754,79,42227,79,71861,79,66194,79,66219,79,66564,79,66838,79,9076,112,65360,112,119849,112,119901,112,119953,112,120005,112,120057,112,120109,112,120161,112,120213,112,120265,112,120317,112,120369,112,120421,112,120473,112,961,112,120530,112,120544,112,120588,112,120602,112,120646,112,120660,112,120704,112,120718,112,120762,112,120776,112,11427,112,65328,80,8473,80,119823,80,119875,80,119927,80,119979,80,120031,80,120083,80,120187,80,120239,80,120291,80,120343,80,120395,80,120447,80,929,80,120504,80,120562,80,120620,80,120678,80,120736,80,11426,80,5090,80,5229,80,42193,80,66197,80,119850,113,119902,113,119954,113,120006,113,120058,113,120110,113,120162,113,120214,113,120266,113,120318,113,120370,113,120422,113,120474,113,1307,113,1379,113,1382,113,8474,81,119824,81,119876,81,119928,81,119980,81,120032,81,120084,81,120188,81,120240,81,120292,81,120344,81,120396,81,120448,81,11605,81,119851,114,119903,114,119955,114,120007,114,120059,114,120111,114,120163,114,120215,114,120267,114,120319,114,120371,114,120423,114,120475,114,43847,114,43848,114,7462,114,11397,114,43905,114,119318,82,8475,82,8476,82,8477,82,119825,82,119877,82,119929,82,120033,82,120189,82,120241,82,120293,82,120345,82,120397,82,120449,82,422,82,5025,82,5074,82,66740,82,5511,82,42211,82,94005,82,65363,115,119852,115,119904,115,119956,115,120008,115,120060,115,120112,115,120164,115,120216,115,120268,115,120320,115,120372,115,120424,115,120476,115,42801,115,445,115,1109,115,43946,115,71873,115,66632,115,65331,83,119826,83,119878,83,119930,83,119982,83,120034,83,120086,83,120138,83,120190,83,120242,83,120294,83,120346,83,120398,83,120450,83,1029,83,1359,83,5077,83,5082,83,42210,83,94010,83,66198,83,66592,83,119853,116,119905,116,119957,116,120009,116,120061,116,120113,116,120165,116,120217,116,120269,116,120321,116,120373,116,120425,116,120477,116,8868,84,10201,84,128872,84,65332,84,119827,84,119879,84,119931,84,119983,84,120035,84,120087,84,120139,84,120191,84,120243,84,120295,84,120347,84,120399,84,120451,84,932,84,120507,84,120565,84,120623,84,120681,84,120739,84,11430,84,5026,84,42196,84,93962,84,71868,84,66199,84,66225,84,66325,84,119854,117,119906,117,119958,117,120010,117,120062,117,120114,117,120166,117,120218,117,120270,117,120322,117,120374,117,120426,117,120478,117,42911,117,7452,117,43854,117,43858,117,651,117,965,117,120534,117,120592,117,120650,117,120708,117,120766,117,1405,117,66806,117,71896,117,8746,85,8899,85,119828,85,119880,85,119932,85,119984,85,120036,85,120088,85,120140,85,120192,85,120244,85,120296,85,120348,85,120400,85,120452,85,1357,85,4608,85,66766,85,5196,85,42228,85,94018,85,71864,85,8744,118,8897,118,65366,118,8564,118,119855,118,119907,118,119959,118,120011,118,120063,118,120115,118,120167,118,120219,118,120271,118,120323,118,120375,118,120427,118,120479,118,7456,118,957,118,120526,118,120584,118,120642,118,120700,118,120758,118,1141,118,1496,118,71430,118,43945,118,71872,118,119309,86,1639,86,1783,86,8548,86,119829,86,119881,86,119933,86,119985,86,120037,86,120089,86,120141,86,120193,86,120245,86,120297,86,120349,86,120401,86,120453,86,1140,86,11576,86,5081,86,5167,86,42719,86,42214,86,93960,86,71840,86,66845,86,623,119,119856,119,119908,119,119960,119,120012,119,120064,119,120116,119,120168,119,120220,119,120272,119,120324,119,120376,119,120428,119,120480,119,7457,119,1121,119,1309,119,1377,119,71434,119,71438,119,71439,119,43907,119,71919,87,71910,87,119830,87,119882,87,119934,87,119986,87,120038,87,120090,87,120142,87,120194,87,120246,87,120298,87,120350,87,120402,87,120454,87,1308,87,5043,87,5076,87,42218,87,5742,120,10539,120,10540,120,10799,120,65368,120,8569,120,119857,120,119909,120,119961,120,120013,120,120065,120,120117,120,120169,120,120221,120,120273,120,120325,120,120377,120,120429,120,120481,120,5441,120,5501,120,5741,88,9587,88,66338,88,71916,88,65336,88,8553,88,119831,88,119883,88,119935,88,119987,88,120039,88,120091,88,120143,88,120195,88,120247,88,120299,88,120351,88,120403,88,120455,88,42931,88,935,88,120510,88,120568,88,120626,88,120684,88,120742,88,11436,88,11613,88,5815,88,42219,88,66192,88,66228,88,66327,88,66855,88,611,121,7564,121,65369,121,119858,121,119910,121,119962,121,120014,121,120066,121,120118,121,120170,121,120222,121,120274,121,120326,121,120378,121,120430,121,120482,121,655,121,7935,121,43866,121,947,121,8509,121,120516,121,120574,121,120632,121,120690,121,120748,121,1199,121,4327,121,71900,121,65337,89,119832,89,119884,89,119936,89,119988,89,120040,89,120092,89,120144,89,120196,89,120248,89,120300,89,120352,89,120404,89,120456,89,933,89,978,89,120508,89,120566,89,120624,89,120682,89,120740,89,11432,89,1198,89,5033,89,5053,89,42220,89,94019,89,71844,89,66226,89,119859,122,119911,122,119963,122,120015,122,120067,122,120119,122,120171,122,120223,122,120275,122,120327,122,120379,122,120431,122,120483,122,7458,122,43923,122,71876,122,66293,90,71909,90,65338,90,8484,90,8488,90,119833,90,119885,90,119937,90,119989,90,120041,90,120197,90,120249,90,120301,90,120353,90,120405,90,120457,90,918,90,120493,90,120551,90,120609,90,120667,90,120725,90,5059,90,42204,90,71849,90,65282,34,65284,36,65285,37,65286,38,65290,42,65291,43,65294,46,65295,47,65296,48,65297,49,65298,50,65299,51,65300,52,65301,53,65302,54,65303,55,65304,56,65305,57,65308,60,65309,61,65310,62,65312,64,65316,68,65318,70,65319,71,65324,76,65329,81,65330,82,65333,85,65334,86,65335,87,65343,95,65346,98,65348,100,65350,102,65355,107,65357,109,65358,110,65361,113,65362,114,65364,116,65365,117,65367,119,65370,122,65371,123,65373,125,119846,109],"_default":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"cs":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"de":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"es":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"fr":[65374,126,65306,58,65281,33,8216,96,8245,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"it":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ja":[8211,45,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65292,44,65307,59],"ko":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pl":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pt-BR":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"qps-ploc":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ru":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,305,105,921,73,1009,112,215,120,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"tr":[160,32,8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"zh-hans":[65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65288,40,65289,41],"zh-hant":[8211,45,65374,126,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65307,59]}')), Ve.cache = new hc({ getCacheKey: JSON.stringify }, (e) => {
  function n(h) {
    const c = /* @__PURE__ */ new Map();
    for (let m = 0; m < h.length; m += 2)
      c.set(h[m], h[m + 1]);
    return c;
  }
  function r(h, c) {
    const m = new Map(h);
    for (const [d, g] of c)
      m.set(d, g);
    return m;
  }
  function i(h, c) {
    if (!h)
      return c;
    const m = /* @__PURE__ */ new Map();
    for (const [d, g] of h)
      c.has(d) && m.set(d, g);
    return m;
  }
  const s = Ve.ambiguousCharacterData.value;
  let o = e.filter((h) => !h.startsWith("_") && h in s);
  o.length === 0 && (o = ["_default"]);
  let l;
  for (const h of o) {
    const c = n(s[h]);
    l = i(l, c);
  }
  const a = n(s._common), u = r(a, l);
  return new Ve(u);
}), Ve._locales = new ws(() => Object.keys(Ve.ambiguousCharacterData.value).filter((e) => !e.startsWith("_")));
let _n = Ve;
const qt = class qt {
  static getRawData() {
    return JSON.parse("[9,10,11,12,13,32,127,160,173,847,1564,4447,4448,6068,6069,6155,6156,6157,6158,7355,7356,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8203,8204,8205,8206,8207,8234,8235,8236,8237,8238,8239,8287,8288,8289,8290,8291,8292,8293,8294,8295,8296,8297,8298,8299,8300,8301,8302,8303,10240,12288,12644,65024,65025,65026,65027,65028,65029,65030,65031,65032,65033,65034,65035,65036,65037,65038,65039,65279,65440,65520,65521,65522,65523,65524,65525,65526,65527,65528,65532,78844,119155,119156,119157,119158,119159,119160,119161,119162,917504,917505,917506,917507,917508,917509,917510,917511,917512,917513,917514,917515,917516,917517,917518,917519,917520,917521,917522,917523,917524,917525,917526,917527,917528,917529,917530,917531,917532,917533,917534,917535,917536,917537,917538,917539,917540,917541,917542,917543,917544,917545,917546,917547,917548,917549,917550,917551,917552,917553,917554,917555,917556,917557,917558,917559,917560,917561,917562,917563,917564,917565,917566,917567,917568,917569,917570,917571,917572,917573,917574,917575,917576,917577,917578,917579,917580,917581,917582,917583,917584,917585,917586,917587,917588,917589,917590,917591,917592,917593,917594,917595,917596,917597,917598,917599,917600,917601,917602,917603,917604,917605,917606,917607,917608,917609,917610,917611,917612,917613,917614,917615,917616,917617,917618,917619,917620,917621,917622,917623,917624,917625,917626,917627,917628,917629,917630,917631,917760,917761,917762,917763,917764,917765,917766,917767,917768,917769,917770,917771,917772,917773,917774,917775,917776,917777,917778,917779,917780,917781,917782,917783,917784,917785,917786,917787,917788,917789,917790,917791,917792,917793,917794,917795,917796,917797,917798,917799,917800,917801,917802,917803,917804,917805,917806,917807,917808,917809,917810,917811,917812,917813,917814,917815,917816,917817,917818,917819,917820,917821,917822,917823,917824,917825,917826,917827,917828,917829,917830,917831,917832,917833,917834,917835,917836,917837,917838,917839,917840,917841,917842,917843,917844,917845,917846,917847,917848,917849,917850,917851,917852,917853,917854,917855,917856,917857,917858,917859,917860,917861,917862,917863,917864,917865,917866,917867,917868,917869,917870,917871,917872,917873,917874,917875,917876,917877,917878,917879,917880,917881,917882,917883,917884,917885,917886,917887,917888,917889,917890,917891,917892,917893,917894,917895,917896,917897,917898,917899,917900,917901,917902,917903,917904,917905,917906,917907,917908,917909,917910,917911,917912,917913,917914,917915,917916,917917,917918,917919,917920,917921,917922,917923,917924,917925,917926,917927,917928,917929,917930,917931,917932,917933,917934,917935,917936,917937,917938,917939,917940,917941,917942,917943,917944,917945,917946,917947,917948,917949,917950,917951,917952,917953,917954,917955,917956,917957,917958,917959,917960,917961,917962,917963,917964,917965,917966,917967,917968,917969,917970,917971,917972,917973,917974,917975,917976,917977,917978,917979,917980,917981,917982,917983,917984,917985,917986,917987,917988,917989,917990,917991,917992,917993,917994,917995,917996,917997,917998,917999]");
  }
  static getData() {
    return this._data || (this._data = new Set(qt.getRawData())), this._data;
  }
  static isInvisibleCharacter(e) {
    return qt.getData().has(e);
  }
  static get codePoints() {
    return qt.getData();
  }
};
qt._data = void 0;
let dn = qt;
var _s = {};
let zt;
const Tr = globalThis.vscode;
if (typeof Tr < "u" && typeof Tr.process < "u") {
  const t = Tr.process;
  zt = {
    get platform() {
      return t.platform;
    },
    get arch() {
      return t.arch;
    },
    get env() {
      return t.env;
    },
    cwd() {
      return t.cwd();
    }
  };
} else typeof ve < "u" && typeof ve?.versions?.node == "string" ? zt = {
  get platform() {
    return ve.platform;
  },
  get arch() {
    return ve.arch;
  },
  get env() {
    return _s;
  },
  cwd() {
    return _s.VSCODE_CWD || ve.cwd();
  }
} : zt = {
  // Supported
  get platform() {
    return xn ? "win32" : ic ? "darwin" : "linux";
  },
  get arch() {
  },
  // Unsupported
  get env() {
    return {};
  },
  cwd() {
    return "/";
  }
};
const Xn = zt.cwd, xc = zt.env, _c = zt.platform, Lc = 65, Nc = 97, Ac = 90, Sc = 122, ft = 46, ce = 47, ye = 92, nt = 58, Ec = 63;
class Ga extends Error {
  constructor(e, n, r) {
    let i;
    typeof n == "string" && n.indexOf("not ") === 0 ? (i = "must not be", n = n.replace(/^not /, "")) : i = "must be";
    const s = e.indexOf(".") !== -1 ? "property" : "argument";
    let o = `The "${e}" ${s} ${i} of type ${n}`;
    o += `. Received type ${typeof r}`, super(o), this.code = "ERR_INVALID_ARG_TYPE";
  }
}
function kc(t, e) {
  if (t === null || typeof t != "object")
    throw new Ga(e, "Object", t);
}
function te(t, e) {
  if (typeof t != "string")
    throw new Ga(e, "string", t);
}
const tt = _c === "win32";
function q(t) {
  return t === ce || t === ye;
}
function ei(t) {
  return t === ce;
}
function rt(t) {
  return t >= Lc && t <= Ac || t >= Nc && t <= Sc;
}
function Yn(t, e, n, r) {
  let i = "", s = 0, o = -1, l = 0, a = 0;
  for (let u = 0; u <= t.length; ++u) {
    if (u < t.length)
      a = t.charCodeAt(u);
    else {
      if (r(a))
        break;
      a = ce;
    }
    if (r(a)) {
      if (!(o === u - 1 || l === 1)) if (l === 2) {
        if (i.length < 2 || s !== 2 || i.charCodeAt(i.length - 1) !== ft || i.charCodeAt(i.length - 2) !== ft) {
          if (i.length > 2) {
            const h = i.lastIndexOf(n);
            h === -1 ? (i = "", s = 0) : (i = i.slice(0, h), s = i.length - 1 - i.lastIndexOf(n)), o = u, l = 0;
            continue;
          } else if (i.length !== 0) {
            i = "", s = 0, o = u, l = 0;
            continue;
          }
        }
        e && (i += i.length > 0 ? `${n}..` : "..", s = 2);
      } else
        i.length > 0 ? i += `${n}${t.slice(o + 1, u)}` : i = t.slice(o + 1, u), s = u - o - 1;
      o = u, l = 0;
    } else a === ft && l !== -1 ? ++l : l = -1;
  }
  return i;
}
function Rc(t) {
  return t ? `${t[0] === "." ? "" : "."}${t}` : "";
}
function Ja(t, e) {
  kc(e, "pathObject");
  const n = e.dir || e.root, r = e.base || `${e.name || ""}${Rc(e.ext)}`;
  return n ? n === e.root ? `${n}${r}` : `${n}${t}${r}` : r;
}
const de = {
  // path.resolve([from ...], to)
  resolve(...t) {
    let e = "", n = "", r = !1;
    for (let i = t.length - 1; i >= -1; i--) {
      let s;
      if (i >= 0) {
        if (s = t[i], te(s, `paths[${i}]`), s.length === 0)
          continue;
      } else e.length === 0 ? s = Xn() : (s = xc[`=${e}`] || Xn(), (s === void 0 || s.slice(0, 2).toLowerCase() !== e.toLowerCase() && s.charCodeAt(2) === ye) && (s = `${e}\\`));
      const o = s.length;
      let l = 0, a = "", u = !1;
      const h = s.charCodeAt(0);
      if (o === 1)
        q(h) && (l = 1, u = !0);
      else if (q(h))
        if (u = !0, q(s.charCodeAt(1))) {
          let c = 2, m = c;
          for (; c < o && !q(s.charCodeAt(c)); )
            c++;
          if (c < o && c !== m) {
            const d = s.slice(m, c);
            for (m = c; c < o && q(s.charCodeAt(c)); )
              c++;
            if (c < o && c !== m) {
              for (m = c; c < o && !q(s.charCodeAt(c)); )
                c++;
              (c === o || c !== m) && (a = `\\\\${d}\\${s.slice(m, c)}`, l = c);
            }
          }
        } else
          l = 1;
      else rt(h) && s.charCodeAt(1) === nt && (a = s.slice(0, 2), l = 2, o > 2 && q(s.charCodeAt(2)) && (u = !0, l = 3));
      if (a.length > 0)
        if (e.length > 0) {
          if (a.toLowerCase() !== e.toLowerCase())
            continue;
        } else
          e = a;
      if (r) {
        if (e.length > 0)
          break;
      } else if (n = `${s.slice(l)}\\${n}`, r = u, u && e.length > 0)
        break;
    }
    return n = Yn(n, !r, "\\", q), r ? `${e}\\${n}` : `${e}${n}` || ".";
  },
  normalize(t) {
    te(t, "path");
    const e = t.length;
    if (e === 0)
      return ".";
    let n = 0, r, i = !1;
    const s = t.charCodeAt(0);
    if (e === 1)
      return ei(s) ? "\\" : t;
    if (q(s))
      if (i = !0, q(t.charCodeAt(1))) {
        let l = 2, a = l;
        for (; l < e && !q(t.charCodeAt(l)); )
          l++;
        if (l < e && l !== a) {
          const u = t.slice(a, l);
          for (a = l; l < e && q(t.charCodeAt(l)); )
            l++;
          if (l < e && l !== a) {
            for (a = l; l < e && !q(t.charCodeAt(l)); )
              l++;
            if (l === e)
              return `\\\\${u}\\${t.slice(a)}\\`;
            l !== a && (r = `\\\\${u}\\${t.slice(a, l)}`, n = l);
          }
        }
      } else
        n = 1;
    else rt(s) && t.charCodeAt(1) === nt && (r = t.slice(0, 2), n = 2, e > 2 && q(t.charCodeAt(2)) && (i = !0, n = 3));
    let o = n < e ? Yn(t.slice(n), !i, "\\", q) : "";
    return o.length === 0 && !i && (o = "."), o.length > 0 && q(t.charCodeAt(e - 1)) && (o += "\\"), r === void 0 ? i ? `\\${o}` : o : i ? `${r}\\${o}` : `${r}${o}`;
  },
  isAbsolute(t) {
    te(t, "path");
    const e = t.length;
    if (e === 0)
      return !1;
    const n = t.charCodeAt(0);
    return q(n) || // Possible device root
    e > 2 && rt(n) && t.charCodeAt(1) === nt && q(t.charCodeAt(2));
  },
  join(...t) {
    if (t.length === 0)
      return ".";
    let e, n;
    for (let s = 0; s < t.length; ++s) {
      const o = t[s];
      te(o, "path"), o.length > 0 && (e === void 0 ? e = n = o : e += `\\${o}`);
    }
    if (e === void 0)
      return ".";
    let r = !0, i = 0;
    if (typeof n == "string" && q(n.charCodeAt(0))) {
      ++i;
      const s = n.length;
      s > 1 && q(n.charCodeAt(1)) && (++i, s > 2 && (q(n.charCodeAt(2)) ? ++i : r = !1));
    }
    if (r) {
      for (; i < e.length && q(e.charCodeAt(i)); )
        i++;
      i >= 2 && (e = `\\${e.slice(i)}`);
    }
    return de.normalize(e);
  },
  // It will solve the relative path from `from` to `to`, for instance:
  //  from = 'C:\\orandea\\test\\aaa'
  //  to = 'C:\\orandea\\impl\\bbb'
  // The output of the function should be: '..\\..\\impl\\bbb'
  relative(t, e) {
    if (te(t, "from"), te(e, "to"), t === e)
      return "";
    const n = de.resolve(t), r = de.resolve(e);
    if (n === r || (t = n.toLowerCase(), e = r.toLowerCase(), t === e))
      return "";
    let i = 0;
    for (; i < t.length && t.charCodeAt(i) === ye; )
      i++;
    let s = t.length;
    for (; s - 1 > i && t.charCodeAt(s - 1) === ye; )
      s--;
    const o = s - i;
    let l = 0;
    for (; l < e.length && e.charCodeAt(l) === ye; )
      l++;
    let a = e.length;
    for (; a - 1 > l && e.charCodeAt(a - 1) === ye; )
      a--;
    const u = a - l, h = o < u ? o : u;
    let c = -1, m = 0;
    for (; m < h; m++) {
      const g = t.charCodeAt(i + m);
      if (g !== e.charCodeAt(l + m))
        break;
      g === ye && (c = m);
    }
    if (m !== h) {
      if (c === -1)
        return r;
    } else {
      if (u > h) {
        if (e.charCodeAt(l + m) === ye)
          return r.slice(l + m + 1);
        if (m === 2)
          return r.slice(l + m);
      }
      o > h && (t.charCodeAt(i + m) === ye ? c = m : m === 2 && (c = 3)), c === -1 && (c = 0);
    }
    let d = "";
    for (m = i + c + 1; m <= s; ++m)
      (m === s || t.charCodeAt(m) === ye) && (d += d.length === 0 ? ".." : "\\..");
    return l += c, d.length > 0 ? `${d}${r.slice(l, a)}` : (r.charCodeAt(l) === ye && ++l, r.slice(l, a));
  },
  toNamespacedPath(t) {
    if (typeof t != "string" || t.length === 0)
      return t;
    const e = de.resolve(t);
    if (e.length <= 2)
      return t;
    if (e.charCodeAt(0) === ye) {
      if (e.charCodeAt(1) === ye) {
        const n = e.charCodeAt(2);
        if (n !== Ec && n !== ft)
          return `\\\\?\\UNC\\${e.slice(2)}`;
      }
    } else if (rt(e.charCodeAt(0)) && e.charCodeAt(1) === nt && e.charCodeAt(2) === ye)
      return `\\\\?\\${e}`;
    return t;
  },
  dirname(t) {
    te(t, "path");
    const e = t.length;
    if (e === 0)
      return ".";
    let n = -1, r = 0;
    const i = t.charCodeAt(0);
    if (e === 1)
      return q(i) ? t : ".";
    if (q(i)) {
      if (n = r = 1, q(t.charCodeAt(1))) {
        let l = 2, a = l;
        for (; l < e && !q(t.charCodeAt(l)); )
          l++;
        if (l < e && l !== a) {
          for (a = l; l < e && q(t.charCodeAt(l)); )
            l++;
          if (l < e && l !== a) {
            for (a = l; l < e && !q(t.charCodeAt(l)); )
              l++;
            if (l === e)
              return t;
            l !== a && (n = r = l + 1);
          }
        }
      }
    } else rt(i) && t.charCodeAt(1) === nt && (n = e > 2 && q(t.charCodeAt(2)) ? 3 : 2, r = n);
    let s = -1, o = !0;
    for (let l = e - 1; l >= r; --l)
      if (q(t.charCodeAt(l))) {
        if (!o) {
          s = l;
          break;
        }
      } else
        o = !1;
    if (s === -1) {
      if (n === -1)
        return ".";
      s = n;
    }
    return t.slice(0, s);
  },
  basename(t, e) {
    e !== void 0 && te(e, "suffix"), te(t, "path");
    let n = 0, r = -1, i = !0, s;
    if (t.length >= 2 && rt(t.charCodeAt(0)) && t.charCodeAt(1) === nt && (n = 2), e !== void 0 && e.length > 0 && e.length <= t.length) {
      if (e === t)
        return "";
      let o = e.length - 1, l = -1;
      for (s = t.length - 1; s >= n; --s) {
        const a = t.charCodeAt(s);
        if (q(a)) {
          if (!i) {
            n = s + 1;
            break;
          }
        } else
          l === -1 && (i = !1, l = s + 1), o >= 0 && (a === e.charCodeAt(o) ? --o === -1 && (r = s) : (o = -1, r = l));
      }
      return n === r ? r = l : r === -1 && (r = t.length), t.slice(n, r);
    }
    for (s = t.length - 1; s >= n; --s)
      if (q(t.charCodeAt(s))) {
        if (!i) {
          n = s + 1;
          break;
        }
      } else r === -1 && (i = !1, r = s + 1);
    return r === -1 ? "" : t.slice(n, r);
  },
  extname(t) {
    te(t, "path");
    let e = 0, n = -1, r = 0, i = -1, s = !0, o = 0;
    t.length >= 2 && t.charCodeAt(1) === nt && rt(t.charCodeAt(0)) && (e = r = 2);
    for (let l = t.length - 1; l >= e; --l) {
      const a = t.charCodeAt(l);
      if (q(a)) {
        if (!s) {
          r = l + 1;
          break;
        }
        continue;
      }
      i === -1 && (s = !1, i = l + 1), a === ft ? n === -1 ? n = l : o !== 1 && (o = 1) : n !== -1 && (o = -1);
    }
    return n === -1 || i === -1 || // We saw a non-dot character immediately before the dot
    o === 0 || // The (right-most) trimmed path component is exactly '..'
    o === 1 && n === i - 1 && n === r + 1 ? "" : t.slice(n, i);
  },
  format: Ja.bind(null, "\\"),
  parse(t) {
    te(t, "path");
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (t.length === 0)
      return e;
    const n = t.length;
    let r = 0, i = t.charCodeAt(0);
    if (n === 1)
      return q(i) ? (e.root = e.dir = t, e) : (e.base = e.name = t, e);
    if (q(i)) {
      if (r = 1, q(t.charCodeAt(1))) {
        let c = 2, m = c;
        for (; c < n && !q(t.charCodeAt(c)); )
          c++;
        if (c < n && c !== m) {
          for (m = c; c < n && q(t.charCodeAt(c)); )
            c++;
          if (c < n && c !== m) {
            for (m = c; c < n && !q(t.charCodeAt(c)); )
              c++;
            c === n ? r = c : c !== m && (r = c + 1);
          }
        }
      }
    } else if (rt(i) && t.charCodeAt(1) === nt) {
      if (n <= 2)
        return e.root = e.dir = t, e;
      if (r = 2, q(t.charCodeAt(2))) {
        if (n === 3)
          return e.root = e.dir = t, e;
        r = 3;
      }
    }
    r > 0 && (e.root = t.slice(0, r));
    let s = -1, o = r, l = -1, a = !0, u = t.length - 1, h = 0;
    for (; u >= r; --u) {
      if (i = t.charCodeAt(u), q(i)) {
        if (!a) {
          o = u + 1;
          break;
        }
        continue;
      }
      l === -1 && (a = !1, l = u + 1), i === ft ? s === -1 ? s = u : h !== 1 && (h = 1) : s !== -1 && (h = -1);
    }
    return l !== -1 && (s === -1 || // We saw a non-dot character immediately before the dot
    h === 0 || // The (right-most) trimmed path component is exactly '..'
    h === 1 && s === l - 1 && s === o + 1 ? e.base = e.name = t.slice(o, l) : (e.name = t.slice(o, s), e.base = t.slice(o, l), e.ext = t.slice(s, l))), o > 0 && o !== r ? e.dir = t.slice(0, o - 1) : e.dir = e.root, e;
  },
  sep: "\\",
  delimiter: ";",
  win32: null,
  posix: null
}, Mc = (() => {
  if (tt) {
    const t = /\\/g;
    return () => {
      const e = Xn().replace(t, "/");
      return e.slice(e.indexOf("/"));
    };
  }
  return () => Xn();
})(), ge = {
  // path.resolve([from ...], to)
  resolve(...t) {
    let e = "", n = !1;
    for (let r = t.length - 1; r >= -1 && !n; r--) {
      const i = r >= 0 ? t[r] : Mc();
      te(i, `paths[${r}]`), i.length !== 0 && (e = `${i}/${e}`, n = i.charCodeAt(0) === ce);
    }
    return e = Yn(e, !n, "/", ei), n ? `/${e}` : e.length > 0 ? e : ".";
  },
  normalize(t) {
    if (te(t, "path"), t.length === 0)
      return ".";
    const e = t.charCodeAt(0) === ce, n = t.charCodeAt(t.length - 1) === ce;
    return t = Yn(t, !e, "/", ei), t.length === 0 ? e ? "/" : n ? "./" : "." : (n && (t += "/"), e ? `/${t}` : t);
  },
  isAbsolute(t) {
    return te(t, "path"), t.length > 0 && t.charCodeAt(0) === ce;
  },
  join(...t) {
    if (t.length === 0)
      return ".";
    let e;
    for (let n = 0; n < t.length; ++n) {
      const r = t[n];
      te(r, "path"), r.length > 0 && (e === void 0 ? e = r : e += `/${r}`);
    }
    return e === void 0 ? "." : ge.normalize(e);
  },
  relative(t, e) {
    if (te(t, "from"), te(e, "to"), t === e || (t = ge.resolve(t), e = ge.resolve(e), t === e))
      return "";
    const n = 1, r = t.length, i = r - n, s = 1, o = e.length - s, l = i < o ? i : o;
    let a = -1, u = 0;
    for (; u < l; u++) {
      const c = t.charCodeAt(n + u);
      if (c !== e.charCodeAt(s + u))
        break;
      c === ce && (a = u);
    }
    if (u === l)
      if (o > l) {
        if (e.charCodeAt(s + u) === ce)
          return e.slice(s + u + 1);
        if (u === 0)
          return e.slice(s + u);
      } else i > l && (t.charCodeAt(n + u) === ce ? a = u : u === 0 && (a = 0));
    let h = "";
    for (u = n + a + 1; u <= r; ++u)
      (u === r || t.charCodeAt(u) === ce) && (h += h.length === 0 ? ".." : "/..");
    return `${h}${e.slice(s + a)}`;
  },
  toNamespacedPath(t) {
    return t;
  },
  dirname(t) {
    if (te(t, "path"), t.length === 0)
      return ".";
    const e = t.charCodeAt(0) === ce;
    let n = -1, r = !0;
    for (let i = t.length - 1; i >= 1; --i)
      if (t.charCodeAt(i) === ce) {
        if (!r) {
          n = i;
          break;
        }
      } else
        r = !1;
    return n === -1 ? e ? "/" : "." : e && n === 1 ? "//" : t.slice(0, n);
  },
  basename(t, e) {
    e !== void 0 && te(e, "ext"), te(t, "path");
    let n = 0, r = -1, i = !0, s;
    if (e !== void 0 && e.length > 0 && e.length <= t.length) {
      if (e === t)
        return "";
      let o = e.length - 1, l = -1;
      for (s = t.length - 1; s >= 0; --s) {
        const a = t.charCodeAt(s);
        if (a === ce) {
          if (!i) {
            n = s + 1;
            break;
          }
        } else
          l === -1 && (i = !1, l = s + 1), o >= 0 && (a === e.charCodeAt(o) ? --o === -1 && (r = s) : (o = -1, r = l));
      }
      return n === r ? r = l : r === -1 && (r = t.length), t.slice(n, r);
    }
    for (s = t.length - 1; s >= 0; --s)
      if (t.charCodeAt(s) === ce) {
        if (!i) {
          n = s + 1;
          break;
        }
      } else r === -1 && (i = !1, r = s + 1);
    return r === -1 ? "" : t.slice(n, r);
  },
  extname(t) {
    te(t, "path");
    let e = -1, n = 0, r = -1, i = !0, s = 0;
    for (let o = t.length - 1; o >= 0; --o) {
      const l = t.charCodeAt(o);
      if (l === ce) {
        if (!i) {
          n = o + 1;
          break;
        }
        continue;
      }
      r === -1 && (i = !1, r = o + 1), l === ft ? e === -1 ? e = o : s !== 1 && (s = 1) : e !== -1 && (s = -1);
    }
    return e === -1 || r === -1 || // We saw a non-dot character immediately before the dot
    s === 0 || // The (right-most) trimmed path component is exactly '..'
    s === 1 && e === r - 1 && e === n + 1 ? "" : t.slice(e, r);
  },
  format: Ja.bind(null, "/"),
  parse(t) {
    te(t, "path");
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (t.length === 0)
      return e;
    const n = t.charCodeAt(0) === ce;
    let r;
    n ? (e.root = "/", r = 1) : r = 0;
    let i = -1, s = 0, o = -1, l = !0, a = t.length - 1, u = 0;
    for (; a >= r; --a) {
      const h = t.charCodeAt(a);
      if (h === ce) {
        if (!l) {
          s = a + 1;
          break;
        }
        continue;
      }
      o === -1 && (l = !1, o = a + 1), h === ft ? i === -1 ? i = a : u !== 1 && (u = 1) : i !== -1 && (u = -1);
    }
    if (o !== -1) {
      const h = s === 0 && n ? 1 : s;
      i === -1 || // We saw a non-dot character immediately before the dot
      u === 0 || // The (right-most) trimmed path component is exactly '..'
      u === 1 && i === o - 1 && i === s + 1 ? e.base = e.name = t.slice(h, o) : (e.name = t.slice(h, i), e.base = t.slice(h, o), e.ext = t.slice(i, o));
    }
    return s > 0 ? e.dir = t.slice(0, s - 1) : n && (e.dir = "/"), e;
  },
  sep: "/",
  delimiter: ":",
  win32: null,
  posix: null
};
ge.win32 = de.win32 = de;
ge.posix = de.posix = ge;
tt ? de.normalize : ge.normalize;
const Tc = tt ? de.join : ge.join;
tt ? de.resolve : ge.resolve;
tt ? de.relative : ge.relative;
tt ? de.dirname : ge.dirname;
tt ? de.basename : ge.basename;
tt ? de.extname : ge.extname;
tt ? de.sep : ge.sep;
const Cc = /^\w[\w\d+.-]*$/, Ic = /^\//, Pc = /^\/\//;
function Fc(t, e) {
  if (!t.scheme && e)
    throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${t.authority}", path: "${t.path}", query: "${t.query}", fragment: "${t.fragment}"}`);
  if (t.scheme && !Cc.test(t.scheme))
    throw new Error("[UriError]: Scheme contains illegal characters.");
  if (t.path) {
    if (t.authority) {
      if (!Ic.test(t.path))
        throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
    } else if (Pc.test(t.path))
      throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
  }
}
function Dc(t, e) {
  return !t && !e ? "file" : t;
}
function Bc(t, e) {
  switch (t) {
    case "https":
    case "http":
    case "file":
      e ? e[0] !== Ie && (e = Ie + e) : e = Ie;
      break;
  }
  return e;
}
const X = "", Ie = "/", Vc = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
let $e = class Bn {
  static isUri(e) {
    return e instanceof Bn ? !0 : e ? typeof e.authority == "string" && typeof e.fragment == "string" && typeof e.path == "string" && typeof e.query == "string" && typeof e.scheme == "string" && typeof e.fsPath == "string" && typeof e.with == "function" && typeof e.toString == "function" : !1;
  }
  /**
   * @internal
   */
  constructor(e, n, r, i, s, o = !1) {
    typeof e == "object" ? (this.scheme = e.scheme || X, this.authority = e.authority || X, this.path = e.path || X, this.query = e.query || X, this.fragment = e.fragment || X) : (this.scheme = Dc(e, o), this.authority = n || X, this.path = Bc(this.scheme, r || X), this.query = i || X, this.fragment = s || X, Fc(this, o));
  }
  // ---- filesystem path -----------------------
  /**
   * Returns a string representing the corresponding file system path of this URI.
   * Will handle UNC paths, normalizes windows drive letters to lower-case, and uses the
   * platform specific path separator.
   *
   * * Will *not* validate the path for invalid characters and semantics.
   * * Will *not* look at the scheme of this URI.
   * * The result shall *not* be used for display purposes but for accessing a file on disk.
   *
   *
   * The *difference* to `URI#path` is the use of the platform specific separator and the handling
   * of UNC paths. See the below sample of a file-uri with an authority (UNC path).
   *
   * ```ts
      const u = URI.parse('file://server/c$/folder/file.txt')
      u.authority === 'server'
      u.path === '/shares/c$/file.txt'
      u.fsPath === '\\server\c$\folder\file.txt'
  ```
   *
   * Using `URI#path` to read a file (using fs-apis) would not be enough because parts of the path,
   * namely the server name, would be missing. Therefore `URI#fsPath` exists - it's sugar to ease working
   * with URIs that represent files on disk (`file` scheme).
   */
  get fsPath() {
    return ti(this, !1);
  }
  // ---- modify to new -------------------------
  with(e) {
    if (!e)
      return this;
    let { scheme: n, authority: r, path: i, query: s, fragment: o } = e;
    return n === void 0 ? n = this.scheme : n === null && (n = X), r === void 0 ? r = this.authority : r === null && (r = X), i === void 0 ? i = this.path : i === null && (i = X), s === void 0 ? s = this.query : s === null && (s = X), o === void 0 ? o = this.fragment : o === null && (o = X), n === this.scheme && r === this.authority && i === this.path && s === this.query && o === this.fragment ? this : new kt(n, r, i, s, o);
  }
  // ---- parse & validate ------------------------
  /**
   * Creates a new URI from a string, e.g. `http://www.example.com/some/path`,
   * `file:///usr/home`, or `scheme:with/path`.
   *
   * @param value A string which represents an URI (see `URI#toString`).
   */
  static parse(e, n = !1) {
    const r = Vc.exec(e);
    return r ? new kt(r[2] || X, Cn(r[4] || X), Cn(r[5] || X), Cn(r[7] || X), Cn(r[9] || X), n) : new kt(X, X, X, X, X);
  }
  /**
   * Creates a new URI from a file system path, e.g. `c:\my\files`,
   * `/usr/home`, or `\\server\share\some\path`.
   *
   * The *difference* between `URI#parse` and `URI#file` is that the latter treats the argument
   * as path, not as stringified-uri. E.g. `URI.file(path)` is **not the same as**
   * `URI.parse('file://' + path)` because the path might contain characters that are
   * interpreted (# and ?). See the following sample:
   * ```ts
  const good = URI.file('/coding/c#/project1');
  good.scheme === 'file';
  good.path === '/coding/c#/project1';
  good.fragment === '';
  const bad = URI.parse('file://' + '/coding/c#/project1');
  bad.scheme === 'file';
  bad.path === '/coding/c'; // path is now broken
  bad.fragment === '/project1';
  ```
   *
   * @param path A file system path (see `URI#fsPath`)
   */
  static file(e) {
    let n = X;
    if (xn && (e = e.replace(/\\/g, Ie)), e[0] === Ie && e[1] === Ie) {
      const r = e.indexOf(Ie, 2);
      r === -1 ? (n = e.substring(2), e = Ie) : (n = e.substring(2, r), e = e.substring(r) || Ie);
    }
    return new kt("file", n, e, X, X);
  }
  /**
   * Creates new URI from uri components.
   *
   * Unless `strict` is `true` the scheme is defaults to be `file`. This function performs
   * validation and should be used for untrusted uri components retrieved from storage,
   * user input, command arguments etc
   */
  static from(e, n) {
    return new kt(e.scheme, e.authority, e.path, e.query, e.fragment, n);
  }
  /**
   * Join a URI path with path fragments and normalizes the resulting path.
   *
   * @param uri The input URI.
   * @param pathFragment The path fragment to add to the URI path.
   * @returns The resulting URI.
   */
  static joinPath(e, ...n) {
    if (!e.path)
      throw new Error("[UriError]: cannot call joinPath on URI without path");
    let r;
    return xn && e.scheme === "file" ? r = Bn.file(de.join(ti(e, !0), ...n)).path : r = ge.join(e.path, ...n), e.with({ path: r });
  }
  // ---- printing/externalize ---------------------------
  /**
   * Creates a string representation for this URI. It's guaranteed that calling
   * `URI.parse` with the result of this function creates an URI which is equal
   * to this URI.
   *
   * * The result shall *not* be used for display purposes but for externalization or transport.
   * * The result will be encoded using the percentage encoding and encoding happens mostly
   * ignore the scheme-specific encoding rules.
   *
   * @param skipEncoding Do not encode the result, default is `false`
   */
  toString(e = !1) {
    return ni(this, e);
  }
  toJSON() {
    return this;
  }
  static revive(e) {
    if (e) {
      if (e instanceof Bn)
        return e;
      {
        const n = new kt(e);
        return n._formatted = e.external ?? null, n._fsPath = e._sep === Qa ? e.fsPath ?? null : null, n;
      }
    } else return e;
  }
};
const Qa = xn ? 1 : void 0;
class kt extends $e {
  constructor() {
    super(...arguments), this._formatted = null, this._fsPath = null;
  }
  get fsPath() {
    return this._fsPath || (this._fsPath = ti(this, !1)), this._fsPath;
  }
  toString(e = !1) {
    return e ? ni(this, !0) : (this._formatted || (this._formatted = ni(this, !1)), this._formatted);
  }
  toJSON() {
    const e = {
      $mid: 1
      /* MarshalledId.Uri */
    };
    return this._fsPath && (e.fsPath = this._fsPath, e._sep = Qa), this._formatted && (e.external = this._formatted), this.path && (e.path = this.path), this.scheme && (e.scheme = this.scheme), this.authority && (e.authority = this.authority), this.query && (e.query = this.query), this.fragment && (e.fragment = this.fragment), e;
  }
}
const Xa = {
  58: "%3A",
  // gen-delims
  47: "%2F",
  63: "%3F",
  35: "%23",
  91: "%5B",
  93: "%5D",
  64: "%40",
  33: "%21",
  // sub-delims
  36: "%24",
  38: "%26",
  39: "%27",
  40: "%28",
  41: "%29",
  42: "%2A",
  43: "%2B",
  44: "%2C",
  59: "%3B",
  61: "%3D",
  32: "%20"
};
function Ls(t, e, n) {
  let r, i = -1;
  for (let s = 0; s < t.length; s++) {
    const o = t.charCodeAt(s);
    if (o >= 97 && o <= 122 || o >= 65 && o <= 90 || o >= 48 && o <= 57 || o === 45 || o === 46 || o === 95 || o === 126 || e && o === 47 || n && o === 91 || n && o === 93 || n && o === 58)
      i !== -1 && (r += encodeURIComponent(t.substring(i, s)), i = -1), r !== void 0 && (r += t.charAt(s));
    else {
      r === void 0 && (r = t.substr(0, s));
      const l = Xa[o];
      l !== void 0 ? (i !== -1 && (r += encodeURIComponent(t.substring(i, s)), i = -1), r += l) : i === -1 && (i = s);
    }
  }
  return i !== -1 && (r += encodeURIComponent(t.substring(i))), r !== void 0 ? r : t;
}
function Oc(t) {
  let e;
  for (let n = 0; n < t.length; n++) {
    const r = t.charCodeAt(n);
    r === 35 || r === 63 ? (e === void 0 && (e = t.substr(0, n)), e += Xa[r]) : e !== void 0 && (e += t[n]);
  }
  return e !== void 0 ? e : t;
}
function ti(t, e) {
  let n;
  return t.authority && t.path.length > 1 && t.scheme === "file" ? n = `//${t.authority}${t.path}` : t.path.charCodeAt(0) === 47 && (t.path.charCodeAt(1) >= 65 && t.path.charCodeAt(1) <= 90 || t.path.charCodeAt(1) >= 97 && t.path.charCodeAt(1) <= 122) && t.path.charCodeAt(2) === 58 ? e ? n = t.path.substr(1) : n = t.path[1].toLowerCase() + t.path.substr(2) : n = t.path, xn && (n = n.replace(/\//g, "\\")), n;
}
function ni(t, e) {
  const n = e ? Oc : Ls;
  let r = "", { scheme: i, authority: s, path: o, query: l, fragment: a } = t;
  if (i && (r += i, r += ":"), (s || i === "file") && (r += Ie, r += Ie), s) {
    let u = s.indexOf("@");
    if (u !== -1) {
      const h = s.substr(0, u);
      s = s.substr(u + 1), u = h.lastIndexOf(":"), u === -1 ? r += n(h, !1, !1) : (r += n(h.substr(0, u), !1, !1), r += ":", r += n(h.substr(u + 1), !1, !0)), r += "@";
    }
    s = s.toLowerCase(), u = s.lastIndexOf(":"), u === -1 ? r += n(s, !1, !0) : (r += n(s.substr(0, u), !1, !0), r += s.substr(u));
  }
  if (o) {
    if (o.length >= 3 && o.charCodeAt(0) === 47 && o.charCodeAt(2) === 58) {
      const u = o.charCodeAt(1);
      u >= 65 && u <= 90 && (o = `/${String.fromCharCode(u + 32)}:${o.substr(3)}`);
    } else if (o.length >= 2 && o.charCodeAt(1) === 58) {
      const u = o.charCodeAt(0);
      u >= 65 && u <= 90 && (o = `${String.fromCharCode(u + 32)}:${o.substr(2)}`);
    }
    r += n(o, !0, !1);
  }
  return l && (r += "?", r += n(l, !1, !1)), a && (r += "#", r += e ? a : Ls(a, !1, !1)), r;
}
function Ya(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t.length > 3 ? t.substr(0, 3) + Ya(t.substr(3)) : t;
  }
}
const Ns = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
function Cn(t) {
  return t.match(Ns) ? t.replace(Ns, (e) => Ya(e)) : t;
}
var ct;
(function(t) {
  t.inMemory = "inmemory", t.vscode = "vscode", t.internal = "private", t.walkThrough = "walkThrough", t.walkThroughSnippet = "walkThroughSnippet", t.http = "http", t.https = "https", t.file = "file", t.mailto = "mailto", t.untitled = "untitled", t.data = "data", t.command = "command", t.vscodeRemote = "vscode-remote", t.vscodeRemoteResource = "vscode-remote-resource", t.vscodeManagedRemoteResource = "vscode-managed-remote-resource", t.vscodeUserData = "vscode-userdata", t.vscodeCustomEditor = "vscode-custom-editor", t.vscodeNotebookCell = "vscode-notebook-cell", t.vscodeNotebookCellMetadata = "vscode-notebook-cell-metadata", t.vscodeNotebookCellMetadataDiff = "vscode-notebook-cell-metadata-diff", t.vscodeNotebookCellOutput = "vscode-notebook-cell-output", t.vscodeNotebookCellOutputDiff = "vscode-notebook-cell-output-diff", t.vscodeNotebookMetadata = "vscode-notebook-metadata", t.vscodeInteractiveInput = "vscode-interactive-input", t.vscodeSettings = "vscode-settings", t.vscodeWorkspaceTrust = "vscode-workspace-trust", t.vscodeTerminal = "vscode-terminal", t.vscodeChatCodeBlock = "vscode-chat-code-block", t.vscodeChatCodeCompareBlock = "vscode-chat-code-compare-block", t.vscodeChatSesssion = "vscode-chat-editor", t.webviewPanel = "webview-panel", t.vscodeWebview = "vscode-webview", t.extension = "extension", t.vscodeFileResource = "vscode-file", t.tmp = "tmp", t.vsls = "vsls", t.vscodeSourceControl = "vscode-scm", t.commentsInput = "comment", t.codeSetting = "code-setting", t.outputChannel = "output";
})(ct || (ct = {}));
const Uc = "tkn";
class $c {
  constructor() {
    this._hosts = /* @__PURE__ */ Object.create(null), this._ports = /* @__PURE__ */ Object.create(null), this._connectionTokens = /* @__PURE__ */ Object.create(null), this._preferredWebSchema = "http", this._delegate = null, this._serverRootPath = "/";
  }
  setPreferredWebSchema(e) {
    this._preferredWebSchema = e;
  }
  get _remoteResourcesPath() {
    return ge.join(this._serverRootPath, ct.vscodeRemoteResource);
  }
  rewrite(e) {
    if (this._delegate)
      try {
        return this._delegate(e);
      } catch (l) {
        return mn(l), e;
      }
    const n = e.authority;
    let r = this._hosts[n];
    r && r.indexOf(":") !== -1 && r.indexOf("[") === -1 && (r = `[${r}]`);
    const i = this._ports[n], s = this._connectionTokens[n];
    let o = `path=${encodeURIComponent(e.path)}`;
    return typeof s == "string" && (o += `&${Uc}=${encodeURIComponent(s)}`), $e.from({
      scheme: oc ? this._preferredWebSchema : ct.vscodeRemoteResource,
      authority: `${r}:${i}`,
      path: this._remoteResourcesPath,
      query: o
    });
  }
}
const qc = new $c(), jc = "vscode-app", bn = class bn {
  /**
   * Returns a URI to use in contexts where the browser is responsible
   * for loading (e.g. fetch()) or when used within the DOM.
   *
   * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
   */
  asBrowserUri(e) {
    const n = this.toUri(e);
    return this.uriToBrowserUri(n);
  }
  /**
   * Returns a URI to use in contexts where the browser is responsible
   * for loading (e.g. fetch()) or when used within the DOM.
   *
   * **Note:** use `dom.ts#asCSSUrl` whenever the URL is to be used in CSS context.
   */
  uriToBrowserUri(e) {
    return e.scheme === ct.vscodeRemote ? qc.rewrite(e) : (
      // ...only ever for `file` resources
      e.scheme === ct.file && // ...and we run in native environments
      (sc || // ...or web worker extensions on desktop
      lc === `${ct.vscodeFileResource}://${bn.FALLBACK_AUTHORITY}`) ? e.with({
        scheme: ct.vscodeFileResource,
        // We need to provide an authority here so that it can serve
        // as origin for network and loading matters in chromium.
        // If the URI is not coming with an authority already, we
        // add our own
        authority: e.authority || bn.FALLBACK_AUTHORITY,
        query: null,
        fragment: null
      }) : e
    );
  }
  toUri(e, n) {
    if ($e.isUri(e))
      return e;
    if (globalThis._VSCODE_FILE_ROOT) {
      const r = globalThis._VSCODE_FILE_ROOT;
      if (/^\w[\w\d+.-]*:\/\//.test(r))
        return $e.joinPath($e.parse(r, !0), e);
      const i = Tc(r, e);
      return $e.file(i);
    }
    return $e.parse(n.toUrl(e));
  }
};
bn.FALLBACK_AUTHORITY = jc;
let ri = bn;
const Za = new ri();
var As;
(function(t) {
  const e = /* @__PURE__ */ new Map([
    ["1", { "Cross-Origin-Opener-Policy": "same-origin" }],
    ["2", { "Cross-Origin-Embedder-Policy": "require-corp" }],
    ["3", { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" }]
  ]);
  t.CoopAndCoep = Object.freeze(e.get("3"));
  const n = "vscode-coi";
  function r(s) {
    let o;
    typeof s == "string" ? o = new URL(s).searchParams : s instanceof URL ? o = s.searchParams : $e.isUri(s) && (o = new URL(s.toString(!0)).searchParams);
    const l = o?.get(n);
    if (l)
      return e.get(l);
  }
  t.getHeadersFromQuery = r;
  function i(s, o, l) {
    if (!globalThis.crossOriginIsolated)
      return;
    const a = o && l ? "3" : l ? "2" : "1";
    s instanceof URLSearchParams ? s.set(n, a) : s[n] = a;
  }
  t.addSearchParam = i;
})(As || (As = {}));
const Cr = "default", Wc = "$initialize";
class Hc {
  constructor(e, n, r, i, s) {
    this.vsWorker = e, this.req = n, this.channel = r, this.method = i, this.args = s, this.type = 0;
  }
}
class Ss {
  constructor(e, n, r, i) {
    this.vsWorker = e, this.seq = n, this.res = r, this.err = i, this.type = 1;
  }
}
class zc {
  constructor(e, n, r, i, s) {
    this.vsWorker = e, this.req = n, this.channel = r, this.eventName = i, this.arg = s, this.type = 2;
  }
}
class Gc {
  constructor(e, n, r) {
    this.vsWorker = e, this.req = n, this.event = r, this.type = 3;
  }
}
class Jc {
  constructor(e, n) {
    this.vsWorker = e, this.req = n, this.type = 4;
  }
}
class Qc {
  constructor(e) {
    this._workerId = -1, this._handler = e, this._lastSentReq = 0, this._pendingReplies = /* @__PURE__ */ Object.create(null), this._pendingEmitters = /* @__PURE__ */ new Map(), this._pendingEvents = /* @__PURE__ */ new Map();
  }
  setWorkerId(e) {
    this._workerId = e;
  }
  sendMessage(e, n, r) {
    const i = String(++this._lastSentReq);
    return new Promise((s, o) => {
      this._pendingReplies[i] = {
        resolve: s,
        reject: o
      }, this._send(new Hc(this._workerId, i, e, n, r));
    });
  }
  listen(e, n, r) {
    let i = null;
    const s = new Re({
      onWillAddFirstListener: () => {
        i = String(++this._lastSentReq), this._pendingEmitters.set(i, s), this._send(new zc(this._workerId, i, e, n, r));
      },
      onDidRemoveLastListener: () => {
        this._pendingEmitters.delete(i), this._send(new Jc(this._workerId, i)), i = null;
      }
    });
    return s.event;
  }
  handleMessage(e) {
    !e || !e.vsWorker || this._workerId !== -1 && e.vsWorker !== this._workerId || this._handleMessage(e);
  }
  createProxyToRemoteChannel(e, n) {
    const r = {
      get: (i, s) => (typeof s == "string" && !i[s] && (el(s) ? i[s] = (o) => this.listen(e, s, o) : Ka(s) ? i[s] = this.listen(e, s, void 0) : s.charCodeAt(0) === 36 && (i[s] = async (...o) => (await n?.(), this.sendMessage(e, s, o)))), i[s])
    };
    return new Proxy(/* @__PURE__ */ Object.create(null), r);
  }
  _handleMessage(e) {
    switch (e.type) {
      case 1:
        return this._handleReplyMessage(e);
      case 0:
        return this._handleRequestMessage(e);
      case 2:
        return this._handleSubscribeEventMessage(e);
      case 3:
        return this._handleEventMessage(e);
      case 4:
        return this._handleUnsubscribeEventMessage(e);
    }
  }
  _handleReplyMessage(e) {
    if (!this._pendingReplies[e.seq]) {
      console.warn("Got reply to unknown seq");
      return;
    }
    const n = this._pendingReplies[e.seq];
    if (delete this._pendingReplies[e.seq], e.err) {
      let r = e.err;
      e.err.$isError && (r = new Error(), r.name = e.err.name, r.message = e.err.message, r.stack = e.err.stack), n.reject(r);
      return;
    }
    n.resolve(e.res);
  }
  _handleRequestMessage(e) {
    const n = e.req;
    this._handler.handleMessage(e.channel, e.method, e.args).then((i) => {
      this._send(new Ss(this._workerId, n, i, void 0));
    }, (i) => {
      i.detail instanceof Error && (i.detail = bs(i.detail)), this._send(new Ss(this._workerId, n, void 0, bs(i)));
    });
  }
  _handleSubscribeEventMessage(e) {
    const n = e.req, r = this._handler.handleEvent(e.channel, e.eventName, e.arg)((i) => {
      this._send(new Gc(this._workerId, n, i));
    });
    this._pendingEvents.set(n, r);
  }
  _handleEventMessage(e) {
    if (!this._pendingEmitters.has(e.req)) {
      console.warn("Got event for unknown req");
      return;
    }
    this._pendingEmitters.get(e.req).fire(e.event);
  }
  _handleUnsubscribeEventMessage(e) {
    if (!this._pendingEvents.has(e.req)) {
      console.warn("Got unsubscribe for unknown req");
      return;
    }
    this._pendingEvents.get(e.req).dispose(), this._pendingEvents.delete(e.req);
  }
  _send(e) {
    const n = [];
    if (e.type === 0)
      for (let r = 0; r < e.args.length; r++)
        e.args[r] instanceof ArrayBuffer && n.push(e.args[r]);
    else e.type === 1 && e.res instanceof ArrayBuffer && n.push(e.res);
    this._handler.sendMessage(e, n);
  }
}
function Ka(t) {
  return t[0] === "o" && t[1] === "n" && Ha(t.charCodeAt(2));
}
function el(t) {
  return /^onDynamic/.test(t) && Ha(t.charCodeAt(9));
}
class Xc {
  constructor(e, n) {
    this._localChannels = /* @__PURE__ */ new Map(), this._remoteChannels = /* @__PURE__ */ new Map(), this._requestHandlerFactory = n, this._requestHandler = null, this._protocol = new Qc({
      sendMessage: (r, i) => {
        e(r, i);
      },
      handleMessage: (r, i, s) => this._handleMessage(r, i, s),
      handleEvent: (r, i, s) => this._handleEvent(r, i, s)
    });
  }
  onmessage(e) {
    this._protocol.handleMessage(e);
  }
  _handleMessage(e, n, r) {
    if (e === Cr && n === Wc)
      return this.initialize(r[0], r[1], r[2]);
    const i = e === Cr ? this._requestHandler : this._localChannels.get(e);
    if (!i)
      return Promise.reject(new Error(`Missing channel ${e} on worker thread`));
    if (typeof i[n] != "function")
      return Promise.reject(new Error(`Missing method ${n} on worker thread channel ${e}`));
    try {
      return Promise.resolve(i[n].apply(i, r));
    } catch (s) {
      return Promise.reject(s);
    }
  }
  _handleEvent(e, n, r) {
    const i = e === Cr ? this._requestHandler : this._localChannels.get(e);
    if (!i)
      throw new Error(`Missing channel ${e} on worker thread`);
    if (el(n)) {
      const s = i[n].call(i, r);
      if (typeof s != "function")
        throw new Error(`Missing dynamic event ${n} on request handler.`);
      return s;
    }
    if (Ka(n)) {
      const s = i[n];
      if (typeof s != "function")
        throw new Error(`Missing event ${n} on request handler.`);
      return s;
    }
    throw new Error(`Malformed event name ${n}`);
  }
  getChannel(e) {
    if (!this._remoteChannels.has(e)) {
      const n = this._protocol.createProxyToRemoteChannel(e);
      this._remoteChannels.set(e, n);
    }
    return this._remoteChannels.get(e);
  }
  async initialize(e, n, r) {
    if (this._protocol.setWorkerId(e), this._requestHandlerFactory) {
      this._requestHandler = this._requestHandlerFactory(this);
      return;
    }
    return n && (typeof n.baseUrl < "u" && delete n.baseUrl, typeof n.paths < "u" && typeof n.paths.vs < "u" && delete n.paths.vs, typeof n.trustedTypesPolicy < "u" && delete n.trustedTypesPolicy, n.catchError = !0, globalThis.require.config(n)), import(`${Za.asBrowserUri(`${r}.js`).toString(!0)}`).then((s) => {
      if (this._requestHandler = s.create(this), !this._requestHandler)
        throw new Error("No RequestHandler!");
    });
  }
}
class ot {
  /**
   * Constructs a new DiffChange with the given sequence information
   * and content.
   */
  constructor(e, n, r, i) {
    this.originalStart = e, this.originalLength = n, this.modifiedStart = r, this.modifiedLength = i;
  }
  /**
   * The end point (exclusive) of the change in the original sequence.
   */
  getOriginalEnd() {
    return this.originalStart + this.originalLength;
  }
  /**
   * The end point (exclusive) of the change in the modified sequence.
   */
  getModifiedEnd() {
    return this.modifiedStart + this.modifiedLength;
  }
}
function Es(t, e) {
  return (e << 5) - e + t | 0;
}
function Yc(t, e) {
  e = Es(149417, e);
  for (let n = 0, r = t.length; n < r; n++)
    e = Es(t.charCodeAt(n), e);
  return e;
}
function Ir(t, e, n = 32) {
  const r = n - e, i = ~((1 << r) - 1);
  return (t << e | (i & t) >>> r) >>> 0;
}
function ks(t, e = 0, n = t.byteLength, r = 0) {
  for (let i = 0; i < n; i++)
    t[e + i] = r;
}
function Zc(t, e, n = "0") {
  for (; t.length < e; )
    t = n + t;
  return t;
}
function sn(t, e = 32) {
  return t instanceof ArrayBuffer ? Array.from(new Uint8Array(t)).map((n) => n.toString(16).padStart(2, "0")).join("") : Zc((t >>> 0).toString(16), e / 4);
}
const mr = class mr {
  // 80 * 4 = 320
  constructor() {
    this._h0 = 1732584193, this._h1 = 4023233417, this._h2 = 2562383102, this._h3 = 271733878, this._h4 = 3285377520, this._buff = new Uint8Array(
      67
      /* to fit any utf-8 */
    ), this._buffDV = new DataView(this._buff.buffer), this._buffLen = 0, this._totalLen = 0, this._leftoverHighSurrogate = 0, this._finished = !1;
  }
  update(e) {
    const n = e.length;
    if (n === 0)
      return;
    const r = this._buff;
    let i = this._buffLen, s = this._leftoverHighSurrogate, o, l;
    for (s !== 0 ? (o = s, l = -1, s = 0) : (o = e.charCodeAt(0), l = 0); ; ) {
      let a = o;
      if (Qn(o))
        if (l + 1 < n) {
          const u = e.charCodeAt(l + 1);
          Kr(u) ? (l++, a = za(o, u)) : a = 65533;
        } else {
          s = o;
          break;
        }
      else Kr(o) && (a = 65533);
      if (i = this._push(r, i, a), l++, l < n)
        o = e.charCodeAt(l);
      else
        break;
    }
    this._buffLen = i, this._leftoverHighSurrogate = s;
  }
  _push(e, n, r) {
    return r < 128 ? e[n++] = r : r < 2048 ? (e[n++] = 192 | (r & 1984) >>> 6, e[n++] = 128 | (r & 63) >>> 0) : r < 65536 ? (e[n++] = 224 | (r & 61440) >>> 12, e[n++] = 128 | (r & 4032) >>> 6, e[n++] = 128 | (r & 63) >>> 0) : (e[n++] = 240 | (r & 1835008) >>> 18, e[n++] = 128 | (r & 258048) >>> 12, e[n++] = 128 | (r & 4032) >>> 6, e[n++] = 128 | (r & 63) >>> 0), n >= 64 && (this._step(), n -= 64, this._totalLen += 64, e[0] = e[64], e[1] = e[65], e[2] = e[66]), n;
  }
  digest() {
    return this._finished || (this._finished = !0, this._leftoverHighSurrogate && (this._leftoverHighSurrogate = 0, this._buffLen = this._push(
      this._buff,
      this._buffLen,
      65533
      /* SHA1Constant.UNICODE_REPLACEMENT */
    )), this._totalLen += this._buffLen, this._wrapUp()), sn(this._h0) + sn(this._h1) + sn(this._h2) + sn(this._h3) + sn(this._h4);
  }
  _wrapUp() {
    this._buff[this._buffLen++] = 128, ks(this._buff, this._buffLen), this._buffLen > 56 && (this._step(), ks(this._buff));
    const e = 8 * this._totalLen;
    this._buffDV.setUint32(56, Math.floor(e / 4294967296), !1), this._buffDV.setUint32(60, e % 4294967296, !1), this._step();
  }
  _step() {
    const e = mr._bigBlock32, n = this._buffDV;
    for (let c = 0; c < 64; c += 4)
      e.setUint32(c, n.getUint32(c, !1), !1);
    for (let c = 64; c < 320; c += 4)
      e.setUint32(c, Ir(e.getUint32(c - 12, !1) ^ e.getUint32(c - 32, !1) ^ e.getUint32(c - 56, !1) ^ e.getUint32(c - 64, !1), 1), !1);
    let r = this._h0, i = this._h1, s = this._h2, o = this._h3, l = this._h4, a, u, h;
    for (let c = 0; c < 80; c++)
      c < 20 ? (a = i & s | ~i & o, u = 1518500249) : c < 40 ? (a = i ^ s ^ o, u = 1859775393) : c < 60 ? (a = i & s | i & o | s & o, u = 2400959708) : (a = i ^ s ^ o, u = 3395469782), h = Ir(r, 5) + a + l + u + e.getUint32(c * 4, !1) & 4294967295, l = o, o = s, s = Ir(i, 30), i = r, r = h;
    this._h0 = this._h0 + r & 4294967295, this._h1 = this._h1 + i & 4294967295, this._h2 = this._h2 + s & 4294967295, this._h3 = this._h3 + o & 4294967295, this._h4 = this._h4 + l & 4294967295;
  }
};
mr._bigBlock32 = new DataView(new ArrayBuffer(320));
let Rs = mr;
class Ms {
  constructor(e) {
    this.source = e;
  }
  getElements() {
    const e = this.source, n = new Int32Array(e.length);
    for (let r = 0, i = e.length; r < i; r++)
      n[r] = e.charCodeAt(r);
    return n;
  }
}
function Kc(t, e, n) {
  return new ut(new Ms(t), new Ms(e)).ComputeDiff(n).changes;
}
class Rt {
  static Assert(e, n) {
    if (!e)
      throw new Error(n);
  }
}
class Mt {
  /**
   * Copies a range of elements from an Array starting at the specified source index and pastes
   * them to another Array starting at the specified destination index. The length and the indexes
   * are specified as 64-bit integers.
   * sourceArray:
   *		The Array that contains the data to copy.
   * sourceIndex:
   *		A 64-bit integer that represents the index in the sourceArray at which copying begins.
   * destinationArray:
   *		The Array that receives the data.
   * destinationIndex:
   *		A 64-bit integer that represents the index in the destinationArray at which storing begins.
   * length:
   *		A 64-bit integer that represents the number of elements to copy.
   */
  static Copy(e, n, r, i, s) {
    for (let o = 0; o < s; o++)
      r[i + o] = e[n + o];
  }
  static Copy2(e, n, r, i, s) {
    for (let o = 0; o < s; o++)
      r[i + o] = e[n + o];
  }
}
class Ts {
  /**
   * Constructs a new DiffChangeHelper for the given DiffSequences.
   */
  constructor() {
    this.m_changes = [], this.m_originalStart = 1073741824, this.m_modifiedStart = 1073741824, this.m_originalCount = 0, this.m_modifiedCount = 0;
  }
  /**
   * Marks the beginning of the next change in the set of differences.
   */
  MarkNextChange() {
    (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.m_changes.push(new ot(this.m_originalStart, this.m_originalCount, this.m_modifiedStart, this.m_modifiedCount)), this.m_originalCount = 0, this.m_modifiedCount = 0, this.m_originalStart = 1073741824, this.m_modifiedStart = 1073741824;
  }
  /**
   * Adds the original element at the given position to the elements
   * affected by the current change. The modified index gives context
   * to the change position with respect to the original sequence.
   * @param originalIndex The index of the original element to add.
   * @param modifiedIndex The index of the modified element that provides corresponding position in the modified sequence.
   */
  AddOriginalElement(e, n) {
    this.m_originalStart = Math.min(this.m_originalStart, e), this.m_modifiedStart = Math.min(this.m_modifiedStart, n), this.m_originalCount++;
  }
  /**
   * Adds the modified element at the given position to the elements
   * affected by the current change. The original index gives context
   * to the change position with respect to the modified sequence.
   * @param originalIndex The index of the original element that provides corresponding position in the original sequence.
   * @param modifiedIndex The index of the modified element to add.
   */
  AddModifiedElement(e, n) {
    this.m_originalStart = Math.min(this.m_originalStart, e), this.m_modifiedStart = Math.min(this.m_modifiedStart, n), this.m_modifiedCount++;
  }
  /**
   * Retrieves all of the changes marked by the class.
   */
  getChanges() {
    return (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.MarkNextChange(), this.m_changes;
  }
  /**
   * Retrieves all of the changes marked by the class in the reverse order
   */
  getReverseChanges() {
    return (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.MarkNextChange(), this.m_changes.reverse(), this.m_changes;
  }
}
class ut {
  /**
   * Constructs the DiffFinder
   */
  constructor(e, n, r = null) {
    this.ContinueProcessingPredicate = r, this._originalSequence = e, this._modifiedSequence = n;
    const [i, s, o] = ut._getElements(e), [l, a, u] = ut._getElements(n);
    this._hasStrings = o && u, this._originalStringElements = i, this._originalElementsOrHash = s, this._modifiedStringElements = l, this._modifiedElementsOrHash = a, this.m_forwardHistory = [], this.m_reverseHistory = [];
  }
  static _isStringArray(e) {
    return e.length > 0 && typeof e[0] == "string";
  }
  static _getElements(e) {
    const n = e.getElements();
    if (ut._isStringArray(n)) {
      const r = new Int32Array(n.length);
      for (let i = 0, s = n.length; i < s; i++)
        r[i] = Yc(n[i], 0);
      return [n, r, !0];
    }
    return n instanceof Int32Array ? [[], n, !1] : [[], new Int32Array(n), !1];
  }
  ElementsAreEqual(e, n) {
    return this._originalElementsOrHash[e] !== this._modifiedElementsOrHash[n] ? !1 : this._hasStrings ? this._originalStringElements[e] === this._modifiedStringElements[n] : !0;
  }
  ElementsAreStrictEqual(e, n) {
    if (!this.ElementsAreEqual(e, n))
      return !1;
    const r = ut._getStrictElement(this._originalSequence, e), i = ut._getStrictElement(this._modifiedSequence, n);
    return r === i;
  }
  static _getStrictElement(e, n) {
    return typeof e.getStrictElement == "function" ? e.getStrictElement(n) : null;
  }
  OriginalElementsAreEqual(e, n) {
    return this._originalElementsOrHash[e] !== this._originalElementsOrHash[n] ? !1 : this._hasStrings ? this._originalStringElements[e] === this._originalStringElements[n] : !0;
  }
  ModifiedElementsAreEqual(e, n) {
    return this._modifiedElementsOrHash[e] !== this._modifiedElementsOrHash[n] ? !1 : this._hasStrings ? this._modifiedStringElements[e] === this._modifiedStringElements[n] : !0;
  }
  ComputeDiff(e) {
    return this._ComputeDiff(0, this._originalElementsOrHash.length - 1, 0, this._modifiedElementsOrHash.length - 1, e);
  }
  /**
   * Computes the differences between the original and modified input
   * sequences on the bounded range.
   * @returns An array of the differences between the two input sequences.
   */
  _ComputeDiff(e, n, r, i, s) {
    const o = [!1];
    let l = this.ComputeDiffRecursive(e, n, r, i, o);
    return s && (l = this.PrettifyChanges(l)), {
      quitEarly: o[0],
      changes: l
    };
  }
  /**
   * Private helper method which computes the differences on the bounded range
   * recursively.
   * @returns An array of the differences between the two input sequences.
   */
  ComputeDiffRecursive(e, n, r, i, s) {
    for (s[0] = !1; e <= n && r <= i && this.ElementsAreEqual(e, r); )
      e++, r++;
    for (; n >= e && i >= r && this.ElementsAreEqual(n, i); )
      n--, i--;
    if (e > n || r > i) {
      let c;
      return r <= i ? (Rt.Assert(e === n + 1, "originalStart should only be one more than originalEnd"), c = [
        new ot(e, 0, r, i - r + 1)
      ]) : e <= n ? (Rt.Assert(r === i + 1, "modifiedStart should only be one more than modifiedEnd"), c = [
        new ot(e, n - e + 1, r, 0)
      ]) : (Rt.Assert(e === n + 1, "originalStart should only be one more than originalEnd"), Rt.Assert(r === i + 1, "modifiedStart should only be one more than modifiedEnd"), c = []), c;
    }
    const o = [0], l = [0], a = this.ComputeRecursionPoint(e, n, r, i, o, l, s), u = o[0], h = l[0];
    if (a !== null)
      return a;
    if (!s[0]) {
      const c = this.ComputeDiffRecursive(e, u, r, h, s);
      let m = [];
      return s[0] ? m = [
        new ot(u + 1, n - (u + 1) + 1, h + 1, i - (h + 1) + 1)
      ] : m = this.ComputeDiffRecursive(u + 1, n, h + 1, i, s), this.ConcatenateChanges(c, m);
    }
    return [
      new ot(e, n - e + 1, r, i - r + 1)
    ];
  }
  WALKTRACE(e, n, r, i, s, o, l, a, u, h, c, m, d, g, p, y, _, L) {
    let v = null, w = null, b = new Ts(), x = n, A = r, T = d[0] - y[0] - i, D = -1073741824, O = this.m_forwardHistory.length - 1;
    do {
      const C = T + e;
      C === x || C < A && u[C - 1] < u[C + 1] ? (c = u[C + 1], g = c - T - i, c < D && b.MarkNextChange(), D = c, b.AddModifiedElement(c + 1, g), T = C + 1 - e) : (c = u[C - 1] + 1, g = c - T - i, c < D && b.MarkNextChange(), D = c - 1, b.AddOriginalElement(c, g + 1), T = C - 1 - e), O >= 0 && (u = this.m_forwardHistory[O], e = u[0], x = 1, A = u.length - 1);
    } while (--O >= -1);
    if (v = b.getReverseChanges(), L[0]) {
      let C = d[0] + 1, N = y[0] + 1;
      if (v !== null && v.length > 0) {
        const E = v[v.length - 1];
        C = Math.max(C, E.getOriginalEnd()), N = Math.max(N, E.getModifiedEnd());
      }
      w = [
        new ot(C, m - C + 1, N, p - N + 1)
      ];
    } else {
      b = new Ts(), x = o, A = l, T = d[0] - y[0] - a, D = 1073741824, O = _ ? this.m_reverseHistory.length - 1 : this.m_reverseHistory.length - 2;
      do {
        const C = T + s;
        C === x || C < A && h[C - 1] >= h[C + 1] ? (c = h[C + 1] - 1, g = c - T - a, c > D && b.MarkNextChange(), D = c + 1, b.AddOriginalElement(c + 1, g + 1), T = C + 1 - s) : (c = h[C - 1], g = c - T - a, c > D && b.MarkNextChange(), D = c, b.AddModifiedElement(c + 1, g + 1), T = C - 1 - s), O >= 0 && (h = this.m_reverseHistory[O], s = h[0], x = 1, A = h.length - 1);
      } while (--O >= -1);
      w = b.getChanges();
    }
    return this.ConcatenateChanges(v, w);
  }
  /**
   * Given the range to compute the diff on, this method finds the point:
   * (midOriginal, midModified)
   * that exists in the middle of the LCS of the two sequences and
   * is the point at which the LCS problem may be broken down recursively.
   * This method will try to keep the LCS trace in memory. If the LCS recursion
   * point is calculated and the full trace is available in memory, then this method
   * will return the change list.
   * @param originalStart The start bound of the original sequence range
   * @param originalEnd The end bound of the original sequence range
   * @param modifiedStart The start bound of the modified sequence range
   * @param modifiedEnd The end bound of the modified sequence range
   * @param midOriginal The middle point of the original sequence range
   * @param midModified The middle point of the modified sequence range
   * @returns The diff changes, if available, otherwise null
   */
  ComputeRecursionPoint(e, n, r, i, s, o, l) {
    let a = 0, u = 0, h = 0, c = 0, m = 0, d = 0;
    e--, r--, s[0] = 0, o[0] = 0, this.m_forwardHistory = [], this.m_reverseHistory = [];
    const g = n - e + (i - r), p = g + 1, y = new Int32Array(p), _ = new Int32Array(p), L = i - r, v = n - e, w = e - r, b = n - i, A = (v - L) % 2 === 0;
    y[L] = e, _[v] = n, l[0] = !1;
    for (let T = 1; T <= g / 2 + 1; T++) {
      let D = 0, O = 0;
      h = this.ClipDiagonalBound(L - T, T, L, p), c = this.ClipDiagonalBound(L + T, T, L, p);
      for (let N = h; N <= c; N += 2) {
        N === h || N < c && y[N - 1] < y[N + 1] ? a = y[N + 1] : a = y[N - 1] + 1, u = a - (N - L) - w;
        const E = a;
        for (; a < n && u < i && this.ElementsAreEqual(a + 1, u + 1); )
          a++, u++;
        if (y[N] = a, a + u > D + O && (D = a, O = u), !A && Math.abs(N - v) <= T - 1 && a >= _[N])
          return s[0] = a, o[0] = u, E <= _[N] && T <= 1448 ? this.WALKTRACE(L, h, c, w, v, m, d, b, y, _, a, n, s, u, i, o, A, l) : null;
      }
      const C = (D - e + (O - r) - T) / 2;
      if (this.ContinueProcessingPredicate !== null && !this.ContinueProcessingPredicate(D, C))
        return l[0] = !0, s[0] = D, o[0] = O, C > 0 && T <= 1448 ? this.WALKTRACE(L, h, c, w, v, m, d, b, y, _, a, n, s, u, i, o, A, l) : (e++, r++, [
          new ot(e, n - e + 1, r, i - r + 1)
        ]);
      m = this.ClipDiagonalBound(v - T, T, v, p), d = this.ClipDiagonalBound(v + T, T, v, p);
      for (let N = m; N <= d; N += 2) {
        N === m || N < d && _[N - 1] >= _[N + 1] ? a = _[N + 1] - 1 : a = _[N - 1], u = a - (N - v) - b;
        const E = a;
        for (; a > e && u > r && this.ElementsAreEqual(a, u); )
          a--, u--;
        if (_[N] = a, A && Math.abs(N - L) <= T && a <= y[N])
          return s[0] = a, o[0] = u, E >= y[N] && T <= 1448 ? this.WALKTRACE(L, h, c, w, v, m, d, b, y, _, a, n, s, u, i, o, A, l) : null;
      }
      if (T <= 1447) {
        let N = new Int32Array(c - h + 2);
        N[0] = L - h + 1, Mt.Copy2(y, h, N, 1, c - h + 1), this.m_forwardHistory.push(N), N = new Int32Array(d - m + 2), N[0] = v - m + 1, Mt.Copy2(_, m, N, 1, d - m + 1), this.m_reverseHistory.push(N);
      }
    }
    return this.WALKTRACE(L, h, c, w, v, m, d, b, y, _, a, n, s, u, i, o, A, l);
  }
  /**
   * Shifts the given changes to provide a more intuitive diff.
   * While the first element in a diff matches the first element after the diff,
   * we shift the diff down.
   *
   * @param changes The list of changes to shift
   * @returns The shifted changes
   */
  PrettifyChanges(e) {
    for (let n = 0; n < e.length; n++) {
      const r = e[n], i = n < e.length - 1 ? e[n + 1].originalStart : this._originalElementsOrHash.length, s = n < e.length - 1 ? e[n + 1].modifiedStart : this._modifiedElementsOrHash.length, o = r.originalLength > 0, l = r.modifiedLength > 0;
      for (; r.originalStart + r.originalLength < i && r.modifiedStart + r.modifiedLength < s && (!o || this.OriginalElementsAreEqual(r.originalStart, r.originalStart + r.originalLength)) && (!l || this.ModifiedElementsAreEqual(r.modifiedStart, r.modifiedStart + r.modifiedLength)); ) {
        const u = this.ElementsAreStrictEqual(r.originalStart, r.modifiedStart);
        if (this.ElementsAreStrictEqual(r.originalStart + r.originalLength, r.modifiedStart + r.modifiedLength) && !u)
          break;
        r.originalStart++, r.modifiedStart++;
      }
      const a = [null];
      if (n < e.length - 1 && this.ChangesOverlap(e[n], e[n + 1], a)) {
        e[n] = a[0], e.splice(n + 1, 1), n--;
        continue;
      }
    }
    for (let n = e.length - 1; n >= 0; n--) {
      const r = e[n];
      let i = 0, s = 0;
      if (n > 0) {
        const c = e[n - 1];
        i = c.originalStart + c.originalLength, s = c.modifiedStart + c.modifiedLength;
      }
      const o = r.originalLength > 0, l = r.modifiedLength > 0;
      let a = 0, u = this._boundaryScore(r.originalStart, r.originalLength, r.modifiedStart, r.modifiedLength);
      for (let c = 1; ; c++) {
        const m = r.originalStart - c, d = r.modifiedStart - c;
        if (m < i || d < s || o && !this.OriginalElementsAreEqual(m, m + r.originalLength) || l && !this.ModifiedElementsAreEqual(d, d + r.modifiedLength))
          break;
        const p = (m === i && d === s ? 5 : 0) + this._boundaryScore(m, r.originalLength, d, r.modifiedLength);
        p > u && (u = p, a = c);
      }
      r.originalStart -= a, r.modifiedStart -= a;
      const h = [null];
      if (n > 0 && this.ChangesOverlap(e[n - 1], e[n], h)) {
        e[n - 1] = h[0], e.splice(n, 1), n++;
        continue;
      }
    }
    if (this._hasStrings)
      for (let n = 1, r = e.length; n < r; n++) {
        const i = e[n - 1], s = e[n], o = s.originalStart - i.originalStart - i.originalLength, l = i.originalStart, a = s.originalStart + s.originalLength, u = a - l, h = i.modifiedStart, c = s.modifiedStart + s.modifiedLength, m = c - h;
        if (o < 5 && u < 20 && m < 20) {
          const d = this._findBetterContiguousSequence(l, u, h, m, o);
          if (d) {
            const [g, p] = d;
            (g !== i.originalStart + i.originalLength || p !== i.modifiedStart + i.modifiedLength) && (i.originalLength = g - i.originalStart, i.modifiedLength = p - i.modifiedStart, s.originalStart = g + o, s.modifiedStart = p + o, s.originalLength = a - s.originalStart, s.modifiedLength = c - s.modifiedStart);
          }
        }
      }
    return e;
  }
  _findBetterContiguousSequence(e, n, r, i, s) {
    if (n < s || i < s)
      return null;
    const o = e + n - s + 1, l = r + i - s + 1;
    let a = 0, u = 0, h = 0;
    for (let c = e; c < o; c++)
      for (let m = r; m < l; m++) {
        const d = this._contiguousSequenceScore(c, m, s);
        d > 0 && d > a && (a = d, u = c, h = m);
      }
    return a > 0 ? [u, h] : null;
  }
  _contiguousSequenceScore(e, n, r) {
    let i = 0;
    for (let s = 0; s < r; s++) {
      if (!this.ElementsAreEqual(e + s, n + s))
        return 0;
      i += this._originalStringElements[e + s].length;
    }
    return i;
  }
  _OriginalIsBoundary(e) {
    return e <= 0 || e >= this._originalElementsOrHash.length - 1 ? !0 : this._hasStrings && /^\s*$/.test(this._originalStringElements[e]);
  }
  _OriginalRegionIsBoundary(e, n) {
    if (this._OriginalIsBoundary(e) || this._OriginalIsBoundary(e - 1))
      return !0;
    if (n > 0) {
      const r = e + n;
      if (this._OriginalIsBoundary(r - 1) || this._OriginalIsBoundary(r))
        return !0;
    }
    return !1;
  }
  _ModifiedIsBoundary(e) {
    return e <= 0 || e >= this._modifiedElementsOrHash.length - 1 ? !0 : this._hasStrings && /^\s*$/.test(this._modifiedStringElements[e]);
  }
  _ModifiedRegionIsBoundary(e, n) {
    if (this._ModifiedIsBoundary(e) || this._ModifiedIsBoundary(e - 1))
      return !0;
    if (n > 0) {
      const r = e + n;
      if (this._ModifiedIsBoundary(r - 1) || this._ModifiedIsBoundary(r))
        return !0;
    }
    return !1;
  }
  _boundaryScore(e, n, r, i) {
    const s = this._OriginalRegionIsBoundary(e, n) ? 1 : 0, o = this._ModifiedRegionIsBoundary(r, i) ? 1 : 0;
    return s + o;
  }
  /**
   * Concatenates the two input DiffChange lists and returns the resulting
   * list.
   * @param The left changes
   * @param The right changes
   * @returns The concatenated list
   */
  ConcatenateChanges(e, n) {
    const r = [];
    if (e.length === 0 || n.length === 0)
      return n.length > 0 ? n : e;
    if (this.ChangesOverlap(e[e.length - 1], n[0], r)) {
      const i = new Array(e.length + n.length - 1);
      return Mt.Copy(e, 0, i, 0, e.length - 1), i[e.length - 1] = r[0], Mt.Copy(n, 1, i, e.length, n.length - 1), i;
    } else {
      const i = new Array(e.length + n.length);
      return Mt.Copy(e, 0, i, 0, e.length), Mt.Copy(n, 0, i, e.length, n.length), i;
    }
  }
  /**
   * Returns true if the two changes overlap and can be merged into a single
   * change
   * @param left The left change
   * @param right The right change
   * @param mergedChange The merged change if the two overlap, null otherwise
   * @returns True if the two changes overlap
   */
  ChangesOverlap(e, n, r) {
    if (Rt.Assert(e.originalStart <= n.originalStart, "Left change is not less than or equal to right change"), Rt.Assert(e.modifiedStart <= n.modifiedStart, "Left change is not less than or equal to right change"), e.originalStart + e.originalLength >= n.originalStart || e.modifiedStart + e.modifiedLength >= n.modifiedStart) {
      const i = e.originalStart;
      let s = e.originalLength;
      const o = e.modifiedStart;
      let l = e.modifiedLength;
      return e.originalStart + e.originalLength >= n.originalStart && (s = n.originalStart + n.originalLength - e.originalStart), e.modifiedStart + e.modifiedLength >= n.modifiedStart && (l = n.modifiedStart + n.modifiedLength - e.modifiedStart), r[0] = new ot(i, s, o, l), !0;
    } else
      return r[0] = null, !1;
  }
  /**
   * Helper method used to clip a diagonal index to the range of valid
   * diagonals. This also decides whether or not the diagonal index,
   * if it exceeds the boundary, should be clipped to the boundary or clipped
   * one inside the boundary depending on the Even/Odd status of the boundary
   * and numDifferences.
   * @param diagonal The index of the diagonal to clip.
   * @param numDifferences The current number of differences being iterated upon.
   * @param diagonalBaseIndex The base reference diagonal.
   * @param numDiagonals The total number of diagonals.
   * @returns The clipped diagonal index.
   */
  ClipDiagonalBound(e, n, r, i) {
    if (e >= 0 && e < i)
      return e;
    const s = r, o = i - r - 1, l = n % 2 === 0;
    if (e < 0) {
      const a = s % 2 === 0;
      return l === a ? 0 : 1;
    } else {
      const a = o % 2 === 0;
      return l === a ? i - 1 : i - 2;
    }
  }
}
let ne = class gt {
  constructor(e, n) {
    this.lineNumber = e, this.column = n;
  }
  /**
   * Create a new position from this position.
   *
   * @param newLineNumber new line number
   * @param newColumn new column
   */
  with(e = this.lineNumber, n = this.column) {
    return e === this.lineNumber && n === this.column ? this : new gt(e, n);
  }
  /**
   * Derive a new position from this position.
   *
   * @param deltaLineNumber line number delta
   * @param deltaColumn column delta
   */
  delta(e = 0, n = 0) {
    return this.with(this.lineNumber + e, this.column + n);
  }
  /**
   * Test if this position equals other position
   */
  equals(e) {
    return gt.equals(this, e);
  }
  /**
   * Test if position `a` equals position `b`
   */
  static equals(e, n) {
    return !e && !n ? !0 : !!e && !!n && e.lineNumber === n.lineNumber && e.column === n.column;
  }
  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be false.
   */
  isBefore(e) {
    return gt.isBefore(this, e);
  }
  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be false.
   */
  static isBefore(e, n) {
    return e.lineNumber < n.lineNumber ? !0 : n.lineNumber < e.lineNumber ? !1 : e.column < n.column;
  }
  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be true.
   */
  isBeforeOrEqual(e) {
    return gt.isBeforeOrEqual(this, e);
  }
  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be true.
   */
  static isBeforeOrEqual(e, n) {
    return e.lineNumber < n.lineNumber ? !0 : n.lineNumber < e.lineNumber ? !1 : e.column <= n.column;
  }
  /**
   * A function that compares positions, useful for sorting
   */
  static compare(e, n) {
    const r = e.lineNumber | 0, i = n.lineNumber | 0;
    if (r === i) {
      const s = e.column | 0, o = n.column | 0;
      return s - o;
    }
    return r - i;
  }
  /**
   * Clone this position.
   */
  clone() {
    return new gt(this.lineNumber, this.column);
  }
  /**
   * Convert to a human-readable representation.
   */
  toString() {
    return "(" + this.lineNumber + "," + this.column + ")";
  }
  // ---
  /**
   * Create a `Position` from an `IPosition`.
   */
  static lift(e) {
    return new gt(e.lineNumber, e.column);
  }
  /**
   * Test if `obj` is an `IPosition`.
   */
  static isIPosition(e) {
    return e && typeof e.lineNumber == "number" && typeof e.column == "number";
  }
  toJSON() {
    return {
      lineNumber: this.lineNumber,
      column: this.column
    };
  }
}, G = class se {
  constructor(e, n, r, i) {
    e > r || e === r && n > i ? (this.startLineNumber = r, this.startColumn = i, this.endLineNumber = e, this.endColumn = n) : (this.startLineNumber = e, this.startColumn = n, this.endLineNumber = r, this.endColumn = i);
  }
  /**
   * Test if this range is empty.
   */
  isEmpty() {
    return se.isEmpty(this);
  }
  /**
   * Test if `range` is empty.
   */
  static isEmpty(e) {
    return e.startLineNumber === e.endLineNumber && e.startColumn === e.endColumn;
  }
  /**
   * Test if position is in this range. If the position is at the edges, will return true.
   */
  containsPosition(e) {
    return se.containsPosition(this, e);
  }
  /**
   * Test if `position` is in `range`. If the position is at the edges, will return true.
   */
  static containsPosition(e, n) {
    return !(n.lineNumber < e.startLineNumber || n.lineNumber > e.endLineNumber || n.lineNumber === e.startLineNumber && n.column < e.startColumn || n.lineNumber === e.endLineNumber && n.column > e.endColumn);
  }
  /**
   * Test if `position` is in `range`. If the position is at the edges, will return false.
   * @internal
   */
  static strictContainsPosition(e, n) {
    return !(n.lineNumber < e.startLineNumber || n.lineNumber > e.endLineNumber || n.lineNumber === e.startLineNumber && n.column <= e.startColumn || n.lineNumber === e.endLineNumber && n.column >= e.endColumn);
  }
  /**
   * Test if range is in this range. If the range is equal to this range, will return true.
   */
  containsRange(e) {
    return se.containsRange(this, e);
  }
  /**
   * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
   */
  static containsRange(e, n) {
    return !(n.startLineNumber < e.startLineNumber || n.endLineNumber < e.startLineNumber || n.startLineNumber > e.endLineNumber || n.endLineNumber > e.endLineNumber || n.startLineNumber === e.startLineNumber && n.startColumn < e.startColumn || n.endLineNumber === e.endLineNumber && n.endColumn > e.endColumn);
  }
  /**
   * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
   */
  strictContainsRange(e) {
    return se.strictContainsRange(this, e);
  }
  /**
   * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
   */
  static strictContainsRange(e, n) {
    return !(n.startLineNumber < e.startLineNumber || n.endLineNumber < e.startLineNumber || n.startLineNumber > e.endLineNumber || n.endLineNumber > e.endLineNumber || n.startLineNumber === e.startLineNumber && n.startColumn <= e.startColumn || n.endLineNumber === e.endLineNumber && n.endColumn >= e.endColumn);
  }
  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  plusRange(e) {
    return se.plusRange(this, e);
  }
  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  static plusRange(e, n) {
    let r, i, s, o;
    return n.startLineNumber < e.startLineNumber ? (r = n.startLineNumber, i = n.startColumn) : n.startLineNumber === e.startLineNumber ? (r = n.startLineNumber, i = Math.min(n.startColumn, e.startColumn)) : (r = e.startLineNumber, i = e.startColumn), n.endLineNumber > e.endLineNumber ? (s = n.endLineNumber, o = n.endColumn) : n.endLineNumber === e.endLineNumber ? (s = n.endLineNumber, o = Math.max(n.endColumn, e.endColumn)) : (s = e.endLineNumber, o = e.endColumn), new se(r, i, s, o);
  }
  /**
   * A intersection of the two ranges.
   */
  intersectRanges(e) {
    return se.intersectRanges(this, e);
  }
  /**
   * A intersection of the two ranges.
   */
  static intersectRanges(e, n) {
    let r = e.startLineNumber, i = e.startColumn, s = e.endLineNumber, o = e.endColumn;
    const l = n.startLineNumber, a = n.startColumn, u = n.endLineNumber, h = n.endColumn;
    return r < l ? (r = l, i = a) : r === l && (i = Math.max(i, a)), s > u ? (s = u, o = h) : s === u && (o = Math.min(o, h)), r > s || r === s && i > o ? null : new se(r, i, s, o);
  }
  /**
   * Test if this range equals other.
   */
  equalsRange(e) {
    return se.equalsRange(this, e);
  }
  /**
   * Test if range `a` equals `b`.
   */
  static equalsRange(e, n) {
    return !e && !n ? !0 : !!e && !!n && e.startLineNumber === n.startLineNumber && e.startColumn === n.startColumn && e.endLineNumber === n.endLineNumber && e.endColumn === n.endColumn;
  }
  /**
   * Return the end position (which will be after or equal to the start position)
   */
  getEndPosition() {
    return se.getEndPosition(this);
  }
  /**
   * Return the end position (which will be after or equal to the start position)
   */
  static getEndPosition(e) {
    return new ne(e.endLineNumber, e.endColumn);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  getStartPosition() {
    return se.getStartPosition(this);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  static getStartPosition(e) {
    return new ne(e.startLineNumber, e.startColumn);
  }
  /**
   * Transform to a user presentable string representation.
   */
  toString() {
    return "[" + this.startLineNumber + "," + this.startColumn + " -> " + this.endLineNumber + "," + this.endColumn + "]";
  }
  /**
   * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
   */
  setEndPosition(e, n) {
    return new se(this.startLineNumber, this.startColumn, e, n);
  }
  /**
   * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
   */
  setStartPosition(e, n) {
    return new se(e, n, this.endLineNumber, this.endColumn);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  collapseToStart() {
    return se.collapseToStart(this);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  static collapseToStart(e) {
    return new se(e.startLineNumber, e.startColumn, e.startLineNumber, e.startColumn);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  collapseToEnd() {
    return se.collapseToEnd(this);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  static collapseToEnd(e) {
    return new se(e.endLineNumber, e.endColumn, e.endLineNumber, e.endColumn);
  }
  /**
   * Moves the range by the given amount of lines.
   */
  delta(e) {
    return new se(this.startLineNumber + e, this.startColumn, this.endLineNumber + e, this.endColumn);
  }
  // ---
  static fromPositions(e, n = e) {
    return new se(e.lineNumber, e.column, n.lineNumber, n.column);
  }
  static lift(e) {
    return e ? new se(e.startLineNumber, e.startColumn, e.endLineNumber, e.endColumn) : null;
  }
  /**
   * Test if `obj` is an `IRange`.
   */
  static isIRange(e) {
    return e && typeof e.startLineNumber == "number" && typeof e.startColumn == "number" && typeof e.endLineNumber == "number" && typeof e.endColumn == "number";
  }
  /**
   * Test if the two ranges are touching in any way.
   */
  static areIntersectingOrTouching(e, n) {
    return !(e.endLineNumber < n.startLineNumber || e.endLineNumber === n.startLineNumber && e.endColumn < n.startColumn || n.endLineNumber < e.startLineNumber || n.endLineNumber === e.startLineNumber && n.endColumn < e.startColumn);
  }
  /**
   * Test if the two ranges are intersecting. If the ranges are touching it returns true.
   */
  static areIntersecting(e, n) {
    return !(e.endLineNumber < n.startLineNumber || e.endLineNumber === n.startLineNumber && e.endColumn <= n.startColumn || n.endLineNumber < e.startLineNumber || n.endLineNumber === e.startLineNumber && n.endColumn <= e.startColumn);
  }
  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the startPosition and then on the endPosition
   */
  static compareRangesUsingStarts(e, n) {
    if (e && n) {
      const s = e.startLineNumber | 0, o = n.startLineNumber | 0;
      if (s === o) {
        const l = e.startColumn | 0, a = n.startColumn | 0;
        if (l === a) {
          const u = e.endLineNumber | 0, h = n.endLineNumber | 0;
          if (u === h) {
            const c = e.endColumn | 0, m = n.endColumn | 0;
            return c - m;
          }
          return u - h;
        }
        return l - a;
      }
      return s - o;
    }
    return (e ? 1 : 0) - (n ? 1 : 0);
  }
  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the endPosition and then on the startPosition
   */
  static compareRangesUsingEnds(e, n) {
    return e.endLineNumber === n.endLineNumber ? e.endColumn === n.endColumn ? e.startLineNumber === n.startLineNumber ? e.startColumn - n.startColumn : e.startLineNumber - n.startLineNumber : e.endColumn - n.endColumn : e.endLineNumber - n.endLineNumber;
  }
  /**
   * Test if the range spans multiple lines.
   */
  static spansMultipleLines(e) {
    return e.endLineNumber > e.startLineNumber;
  }
  toJSON() {
    return this;
  }
};
function Cs(t) {
  return t < 0 ? 0 : t > 255 ? 255 : t | 0;
}
function Tt(t) {
  return t < 0 ? 0 : t > 4294967295 ? 4294967295 : t | 0;
}
class Zi {
  constructor(e) {
    const n = Cs(e);
    this._defaultValue = n, this._asciiMap = Zi._createAsciiMap(n), this._map = /* @__PURE__ */ new Map();
  }
  static _createAsciiMap(e) {
    const n = new Uint8Array(256);
    return n.fill(e), n;
  }
  set(e, n) {
    const r = Cs(n);
    e >= 0 && e < 256 ? this._asciiMap[e] = r : this._map.set(e, r);
  }
  get(e) {
    return e >= 0 && e < 256 ? this._asciiMap[e] : this._map.get(e) || this._defaultValue;
  }
  clear() {
    this._asciiMap.fill(this._defaultValue), this._map.clear();
  }
}
class e0 {
  constructor(e, n, r) {
    const i = new Uint8Array(e * n);
    for (let s = 0, o = e * n; s < o; s++)
      i[s] = r;
    this._data = i, this.rows = e, this.cols = n;
  }
  get(e, n) {
    return this._data[e * this.cols + n];
  }
  set(e, n, r) {
    this._data[e * this.cols + n] = r;
  }
}
class t0 {
  constructor(e) {
    let n = 0, r = 0;
    for (let s = 0, o = e.length; s < o; s++) {
      const [l, a, u] = e[s];
      a > n && (n = a), l > r && (r = l), u > r && (r = u);
    }
    n++, r++;
    const i = new e0(
      r,
      n,
      0
      /* State.Invalid */
    );
    for (let s = 0, o = e.length; s < o; s++) {
      const [l, a, u] = e[s];
      i.set(l, a, u);
    }
    this._states = i, this._maxCharCode = n;
  }
  nextState(e, n) {
    return n < 0 || n >= this._maxCharCode ? 0 : this._states.get(e, n);
  }
}
let Pr = null;
function n0() {
  return Pr === null && (Pr = new t0([
    [
      1,
      104,
      2
      /* State.H */
    ],
    [
      1,
      72,
      2
      /* State.H */
    ],
    [
      1,
      102,
      6
      /* State.F */
    ],
    [
      1,
      70,
      6
      /* State.F */
    ],
    [
      2,
      116,
      3
      /* State.HT */
    ],
    [
      2,
      84,
      3
      /* State.HT */
    ],
    [
      3,
      116,
      4
      /* State.HTT */
    ],
    [
      3,
      84,
      4
      /* State.HTT */
    ],
    [
      4,
      112,
      5
      /* State.HTTP */
    ],
    [
      4,
      80,
      5
      /* State.HTTP */
    ],
    [
      5,
      115,
      9
      /* State.BeforeColon */
    ],
    [
      5,
      83,
      9
      /* State.BeforeColon */
    ],
    [
      5,
      58,
      10
      /* State.AfterColon */
    ],
    [
      6,
      105,
      7
      /* State.FI */
    ],
    [
      6,
      73,
      7
      /* State.FI */
    ],
    [
      7,
      108,
      8
      /* State.FIL */
    ],
    [
      7,
      76,
      8
      /* State.FIL */
    ],
    [
      8,
      101,
      9
      /* State.BeforeColon */
    ],
    [
      8,
      69,
      9
      /* State.BeforeColon */
    ],
    [
      9,
      58,
      10
      /* State.AfterColon */
    ],
    [
      10,
      47,
      11
      /* State.AlmostThere */
    ],
    [
      11,
      47,
      12
      /* State.End */
    ]
  ])), Pr;
}
let on = null;
function r0() {
  if (on === null) {
    on = new Zi(
      0
      /* CharacterClass.None */
    );
    const t = ` 	<>'"、。｡､，．：；‘〈「『〔（［｛｢｣｝］）〕』」〉’｀～…`;
    for (let n = 0; n < t.length; n++)
      on.set(
        t.charCodeAt(n),
        1
        /* CharacterClass.ForceTermination */
      );
    const e = ".,;:";
    for (let n = 0; n < e.length; n++)
      on.set(
        e.charCodeAt(n),
        2
        /* CharacterClass.CannotEndIn */
      );
  }
  return on;
}
class Zn {
  static _createLink(e, n, r, i, s) {
    let o = s - 1;
    do {
      const l = n.charCodeAt(o);
      if (e.get(l) !== 2)
        break;
      o--;
    } while (o > i);
    if (i > 0) {
      const l = n.charCodeAt(i - 1), a = n.charCodeAt(o);
      (l === 40 && a === 41 || l === 91 && a === 93 || l === 123 && a === 125) && o--;
    }
    return {
      range: {
        startLineNumber: r,
        startColumn: i + 1,
        endLineNumber: r,
        endColumn: o + 2
      },
      url: n.substring(i, o + 1)
    };
  }
  static computeLinks(e, n = n0()) {
    const r = r0(), i = [];
    for (let s = 1, o = e.getLineCount(); s <= o; s++) {
      const l = e.getLineContent(s), a = l.length;
      let u = 0, h = 0, c = 0, m = 1, d = !1, g = !1, p = !1, y = !1;
      for (; u < a; ) {
        let _ = !1;
        const L = l.charCodeAt(u);
        if (m === 13) {
          let v;
          switch (L) {
            case 40:
              d = !0, v = 0;
              break;
            case 41:
              v = d ? 0 : 1;
              break;
            case 91:
              p = !0, g = !0, v = 0;
              break;
            case 93:
              p = !1, v = g ? 0 : 1;
              break;
            case 123:
              y = !0, v = 0;
              break;
            case 125:
              v = y ? 0 : 1;
              break;
            // The following three rules make it that ' or " or ` are allowed inside links
            // only if the link is wrapped by some other quote character
            case 39:
            case 34:
            case 96:
              c === L ? v = 1 : c === 39 || c === 34 || c === 96 ? v = 0 : v = 1;
              break;
            case 42:
              v = c === 42 ? 1 : 0;
              break;
            case 124:
              v = c === 124 ? 1 : 0;
              break;
            case 32:
              v = p ? 0 : 1;
              break;
            default:
              v = r.get(L);
          }
          v === 1 && (i.push(Zn._createLink(r, l, s, h, u)), _ = !0);
        } else if (m === 12) {
          let v;
          L === 91 ? (g = !0, v = 0) : v = r.get(L), v === 1 ? _ = !0 : m = 13;
        } else
          m = n.nextState(m, L), m === 0 && (_ = !0);
        _ && (m = 1, d = !1, g = !1, y = !1, h = u + 1, c = L), u++;
      }
      m === 13 && i.push(Zn._createLink(r, l, s, h, a));
    }
    return i;
  }
}
function i0(t) {
  return !t || typeof t.getLineCount != "function" || typeof t.getLineContent != "function" ? [] : Zn.computeLinks(t);
}
const dr = class dr {
  constructor() {
    this._defaultValueSet = [
      ["true", "false"],
      ["True", "False"],
      ["Private", "Public", "Friend", "ReadOnly", "Partial", "Protected", "WriteOnly"],
      ["public", "protected", "private"]
    ];
  }
  navigateValueSet(e, n, r, i, s) {
    if (e && n) {
      const o = this.doNavigateValueSet(n, s);
      if (o)
        return {
          range: e,
          value: o
        };
    }
    if (r && i) {
      const o = this.doNavigateValueSet(i, s);
      if (o)
        return {
          range: r,
          value: o
        };
    }
    return null;
  }
  doNavigateValueSet(e, n) {
    const r = this.numberReplace(e, n);
    return r !== null ? r : this.textReplace(e, n);
  }
  numberReplace(e, n) {
    const r = Math.pow(10, e.length - (e.lastIndexOf(".") + 1));
    let i = Number(e);
    const s = parseFloat(e);
    return !isNaN(i) && !isNaN(s) && i === s ? i === 0 && !n ? null : (i = Math.floor(i * r), i += n ? r : -r, String(i / r)) : null;
  }
  textReplace(e, n) {
    return this.valueSetsReplace(this._defaultValueSet, e, n);
  }
  valueSetsReplace(e, n, r) {
    let i = null;
    for (let s = 0, o = e.length; i === null && s < o; s++)
      i = this.valueSetReplace(e[s], n, r);
    return i;
  }
  valueSetReplace(e, n, r) {
    let i = e.indexOf(n);
    return i >= 0 ? (i += r ? 1 : -1, i < 0 ? i = e.length - 1 : i %= e.length, e[i]) : null;
  }
};
dr.INSTANCE = new dr();
let ii = dr;
const tl = Object.freeze(function(t, e) {
  const n = setTimeout(t.bind(e), 0);
  return { dispose() {
    clearTimeout(n);
  } };
});
var Kn;
(function(t) {
  function e(n) {
    return n === t.None || n === t.Cancelled || n instanceof Vn ? !0 : !n || typeof n != "object" ? !1 : typeof n.isCancellationRequested == "boolean" && typeof n.onCancellationRequested == "function";
  }
  t.isCancellationToken = e, t.None = Object.freeze({
    isCancellationRequested: !1,
    onCancellationRequested: Jn.None
  }), t.Cancelled = Object.freeze({
    isCancellationRequested: !0,
    onCancellationRequested: tl
  });
})(Kn || (Kn = {}));
class Vn {
  constructor() {
    this._isCancelled = !1, this._emitter = null;
  }
  cancel() {
    this._isCancelled || (this._isCancelled = !0, this._emitter && (this._emitter.fire(void 0), this.dispose()));
  }
  get isCancellationRequested() {
    return this._isCancelled;
  }
  get onCancellationRequested() {
    return this._isCancelled ? tl : (this._emitter || (this._emitter = new Re()), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
}
class s0 {
  constructor(e) {
    this._token = void 0, this._parentListener = void 0, this._parentListener = e && e.onCancellationRequested(this.cancel, this);
  }
  get token() {
    return this._token || (this._token = new Vn()), this._token;
  }
  cancel() {
    this._token ? this._token instanceof Vn && this._token.cancel() : this._token = Kn.Cancelled;
  }
  dispose(e = !1) {
    e && this.cancel(), this._parentListener?.dispose(), this._token ? this._token instanceof Vn && this._token.dispose() : this._token = Kn.None;
  }
}
class Ki {
  constructor() {
    this._keyCodeToStr = [], this._strToKeyCode = /* @__PURE__ */ Object.create(null);
  }
  define(e, n) {
    this._keyCodeToStr[e] = n, this._strToKeyCode[n.toLowerCase()] = e;
  }
  keyCodeToStr(e) {
    return this._keyCodeToStr[e];
  }
  strToKeyCode(e) {
    return this._strToKeyCode[e.toLowerCase()] || 0;
  }
}
const On = new Ki(), si = new Ki(), oi = new Ki(), o0 = new Array(230), a0 = /* @__PURE__ */ Object.create(null), l0 = /* @__PURE__ */ Object.create(null);
(function() {
  const e = [
    // immutable, scanCode, scanCodeStr, keyCode, keyCodeStr, eventKeyCode, vkey, usUserSettingsLabel, generalUserSettingsLabel
    [1, 0, "None", 0, "unknown", 0, "VK_UNKNOWN", "", ""],
    [1, 1, "Hyper", 0, "", 0, "", "", ""],
    [1, 2, "Super", 0, "", 0, "", "", ""],
    [1, 3, "Fn", 0, "", 0, "", "", ""],
    [1, 4, "FnLock", 0, "", 0, "", "", ""],
    [1, 5, "Suspend", 0, "", 0, "", "", ""],
    [1, 6, "Resume", 0, "", 0, "", "", ""],
    [1, 7, "Turbo", 0, "", 0, "", "", ""],
    [1, 8, "Sleep", 0, "", 0, "VK_SLEEP", "", ""],
    [1, 9, "WakeUp", 0, "", 0, "", "", ""],
    [0, 10, "KeyA", 31, "A", 65, "VK_A", "", ""],
    [0, 11, "KeyB", 32, "B", 66, "VK_B", "", ""],
    [0, 12, "KeyC", 33, "C", 67, "VK_C", "", ""],
    [0, 13, "KeyD", 34, "D", 68, "VK_D", "", ""],
    [0, 14, "KeyE", 35, "E", 69, "VK_E", "", ""],
    [0, 15, "KeyF", 36, "F", 70, "VK_F", "", ""],
    [0, 16, "KeyG", 37, "G", 71, "VK_G", "", ""],
    [0, 17, "KeyH", 38, "H", 72, "VK_H", "", ""],
    [0, 18, "KeyI", 39, "I", 73, "VK_I", "", ""],
    [0, 19, "KeyJ", 40, "J", 74, "VK_J", "", ""],
    [0, 20, "KeyK", 41, "K", 75, "VK_K", "", ""],
    [0, 21, "KeyL", 42, "L", 76, "VK_L", "", ""],
    [0, 22, "KeyM", 43, "M", 77, "VK_M", "", ""],
    [0, 23, "KeyN", 44, "N", 78, "VK_N", "", ""],
    [0, 24, "KeyO", 45, "O", 79, "VK_O", "", ""],
    [0, 25, "KeyP", 46, "P", 80, "VK_P", "", ""],
    [0, 26, "KeyQ", 47, "Q", 81, "VK_Q", "", ""],
    [0, 27, "KeyR", 48, "R", 82, "VK_R", "", ""],
    [0, 28, "KeyS", 49, "S", 83, "VK_S", "", ""],
    [0, 29, "KeyT", 50, "T", 84, "VK_T", "", ""],
    [0, 30, "KeyU", 51, "U", 85, "VK_U", "", ""],
    [0, 31, "KeyV", 52, "V", 86, "VK_V", "", ""],
    [0, 32, "KeyW", 53, "W", 87, "VK_W", "", ""],
    [0, 33, "KeyX", 54, "X", 88, "VK_X", "", ""],
    [0, 34, "KeyY", 55, "Y", 89, "VK_Y", "", ""],
    [0, 35, "KeyZ", 56, "Z", 90, "VK_Z", "", ""],
    [0, 36, "Digit1", 22, "1", 49, "VK_1", "", ""],
    [0, 37, "Digit2", 23, "2", 50, "VK_2", "", ""],
    [0, 38, "Digit3", 24, "3", 51, "VK_3", "", ""],
    [0, 39, "Digit4", 25, "4", 52, "VK_4", "", ""],
    [0, 40, "Digit5", 26, "5", 53, "VK_5", "", ""],
    [0, 41, "Digit6", 27, "6", 54, "VK_6", "", ""],
    [0, 42, "Digit7", 28, "7", 55, "VK_7", "", ""],
    [0, 43, "Digit8", 29, "8", 56, "VK_8", "", ""],
    [0, 44, "Digit9", 30, "9", 57, "VK_9", "", ""],
    [0, 45, "Digit0", 21, "0", 48, "VK_0", "", ""],
    [1, 46, "Enter", 3, "Enter", 13, "VK_RETURN", "", ""],
    [1, 47, "Escape", 9, "Escape", 27, "VK_ESCAPE", "", ""],
    [1, 48, "Backspace", 1, "Backspace", 8, "VK_BACK", "", ""],
    [1, 49, "Tab", 2, "Tab", 9, "VK_TAB", "", ""],
    [1, 50, "Space", 10, "Space", 32, "VK_SPACE", "", ""],
    [0, 51, "Minus", 88, "-", 189, "VK_OEM_MINUS", "-", "OEM_MINUS"],
    [0, 52, "Equal", 86, "=", 187, "VK_OEM_PLUS", "=", "OEM_PLUS"],
    [0, 53, "BracketLeft", 92, "[", 219, "VK_OEM_4", "[", "OEM_4"],
    [0, 54, "BracketRight", 94, "]", 221, "VK_OEM_6", "]", "OEM_6"],
    [0, 55, "Backslash", 93, "\\", 220, "VK_OEM_5", "\\", "OEM_5"],
    [0, 56, "IntlHash", 0, "", 0, "", "", ""],
    // has been dropped from the w3c spec
    [0, 57, "Semicolon", 85, ";", 186, "VK_OEM_1", ";", "OEM_1"],
    [0, 58, "Quote", 95, "'", 222, "VK_OEM_7", "'", "OEM_7"],
    [0, 59, "Backquote", 91, "`", 192, "VK_OEM_3", "`", "OEM_3"],
    [0, 60, "Comma", 87, ",", 188, "VK_OEM_COMMA", ",", "OEM_COMMA"],
    [0, 61, "Period", 89, ".", 190, "VK_OEM_PERIOD", ".", "OEM_PERIOD"],
    [0, 62, "Slash", 90, "/", 191, "VK_OEM_2", "/", "OEM_2"],
    [1, 63, "CapsLock", 8, "CapsLock", 20, "VK_CAPITAL", "", ""],
    [1, 64, "F1", 59, "F1", 112, "VK_F1", "", ""],
    [1, 65, "F2", 60, "F2", 113, "VK_F2", "", ""],
    [1, 66, "F3", 61, "F3", 114, "VK_F3", "", ""],
    [1, 67, "F4", 62, "F4", 115, "VK_F4", "", ""],
    [1, 68, "F5", 63, "F5", 116, "VK_F5", "", ""],
    [1, 69, "F6", 64, "F6", 117, "VK_F6", "", ""],
    [1, 70, "F7", 65, "F7", 118, "VK_F7", "", ""],
    [1, 71, "F8", 66, "F8", 119, "VK_F8", "", ""],
    [1, 72, "F9", 67, "F9", 120, "VK_F9", "", ""],
    [1, 73, "F10", 68, "F10", 121, "VK_F10", "", ""],
    [1, 74, "F11", 69, "F11", 122, "VK_F11", "", ""],
    [1, 75, "F12", 70, "F12", 123, "VK_F12", "", ""],
    [1, 76, "PrintScreen", 0, "", 0, "", "", ""],
    [1, 77, "ScrollLock", 84, "ScrollLock", 145, "VK_SCROLL", "", ""],
    [1, 78, "Pause", 7, "PauseBreak", 19, "VK_PAUSE", "", ""],
    [1, 79, "Insert", 19, "Insert", 45, "VK_INSERT", "", ""],
    [1, 80, "Home", 14, "Home", 36, "VK_HOME", "", ""],
    [1, 81, "PageUp", 11, "PageUp", 33, "VK_PRIOR", "", ""],
    [1, 82, "Delete", 20, "Delete", 46, "VK_DELETE", "", ""],
    [1, 83, "End", 13, "End", 35, "VK_END", "", ""],
    [1, 84, "PageDown", 12, "PageDown", 34, "VK_NEXT", "", ""],
    [1, 85, "ArrowRight", 17, "RightArrow", 39, "VK_RIGHT", "Right", ""],
    [1, 86, "ArrowLeft", 15, "LeftArrow", 37, "VK_LEFT", "Left", ""],
    [1, 87, "ArrowDown", 18, "DownArrow", 40, "VK_DOWN", "Down", ""],
    [1, 88, "ArrowUp", 16, "UpArrow", 38, "VK_UP", "Up", ""],
    [1, 89, "NumLock", 83, "NumLock", 144, "VK_NUMLOCK", "", ""],
    [1, 90, "NumpadDivide", 113, "NumPad_Divide", 111, "VK_DIVIDE", "", ""],
    [1, 91, "NumpadMultiply", 108, "NumPad_Multiply", 106, "VK_MULTIPLY", "", ""],
    [1, 92, "NumpadSubtract", 111, "NumPad_Subtract", 109, "VK_SUBTRACT", "", ""],
    [1, 93, "NumpadAdd", 109, "NumPad_Add", 107, "VK_ADD", "", ""],
    [1, 94, "NumpadEnter", 3, "", 0, "", "", ""],
    [1, 95, "Numpad1", 99, "NumPad1", 97, "VK_NUMPAD1", "", ""],
    [1, 96, "Numpad2", 100, "NumPad2", 98, "VK_NUMPAD2", "", ""],
    [1, 97, "Numpad3", 101, "NumPad3", 99, "VK_NUMPAD3", "", ""],
    [1, 98, "Numpad4", 102, "NumPad4", 100, "VK_NUMPAD4", "", ""],
    [1, 99, "Numpad5", 103, "NumPad5", 101, "VK_NUMPAD5", "", ""],
    [1, 100, "Numpad6", 104, "NumPad6", 102, "VK_NUMPAD6", "", ""],
    [1, 101, "Numpad7", 105, "NumPad7", 103, "VK_NUMPAD7", "", ""],
    [1, 102, "Numpad8", 106, "NumPad8", 104, "VK_NUMPAD8", "", ""],
    [1, 103, "Numpad9", 107, "NumPad9", 105, "VK_NUMPAD9", "", ""],
    [1, 104, "Numpad0", 98, "NumPad0", 96, "VK_NUMPAD0", "", ""],
    [1, 105, "NumpadDecimal", 112, "NumPad_Decimal", 110, "VK_DECIMAL", "", ""],
    [0, 106, "IntlBackslash", 97, "OEM_102", 226, "VK_OEM_102", "", ""],
    [1, 107, "ContextMenu", 58, "ContextMenu", 93, "", "", ""],
    [1, 108, "Power", 0, "", 0, "", "", ""],
    [1, 109, "NumpadEqual", 0, "", 0, "", "", ""],
    [1, 110, "F13", 71, "F13", 124, "VK_F13", "", ""],
    [1, 111, "F14", 72, "F14", 125, "VK_F14", "", ""],
    [1, 112, "F15", 73, "F15", 126, "VK_F15", "", ""],
    [1, 113, "F16", 74, "F16", 127, "VK_F16", "", ""],
    [1, 114, "F17", 75, "F17", 128, "VK_F17", "", ""],
    [1, 115, "F18", 76, "F18", 129, "VK_F18", "", ""],
    [1, 116, "F19", 77, "F19", 130, "VK_F19", "", ""],
    [1, 117, "F20", 78, "F20", 131, "VK_F20", "", ""],
    [1, 118, "F21", 79, "F21", 132, "VK_F21", "", ""],
    [1, 119, "F22", 80, "F22", 133, "VK_F22", "", ""],
    [1, 120, "F23", 81, "F23", 134, "VK_F23", "", ""],
    [1, 121, "F24", 82, "F24", 135, "VK_F24", "", ""],
    [1, 122, "Open", 0, "", 0, "", "", ""],
    [1, 123, "Help", 0, "", 0, "", "", ""],
    [1, 124, "Select", 0, "", 0, "", "", ""],
    [1, 125, "Again", 0, "", 0, "", "", ""],
    [1, 126, "Undo", 0, "", 0, "", "", ""],
    [1, 127, "Cut", 0, "", 0, "", "", ""],
    [1, 128, "Copy", 0, "", 0, "", "", ""],
    [1, 129, "Paste", 0, "", 0, "", "", ""],
    [1, 130, "Find", 0, "", 0, "", "", ""],
    [1, 131, "AudioVolumeMute", 117, "AudioVolumeMute", 173, "VK_VOLUME_MUTE", "", ""],
    [1, 132, "AudioVolumeUp", 118, "AudioVolumeUp", 175, "VK_VOLUME_UP", "", ""],
    [1, 133, "AudioVolumeDown", 119, "AudioVolumeDown", 174, "VK_VOLUME_DOWN", "", ""],
    [1, 134, "NumpadComma", 110, "NumPad_Separator", 108, "VK_SEPARATOR", "", ""],
    [0, 135, "IntlRo", 115, "ABNT_C1", 193, "VK_ABNT_C1", "", ""],
    [1, 136, "KanaMode", 0, "", 0, "", "", ""],
    [0, 137, "IntlYen", 0, "", 0, "", "", ""],
    [1, 138, "Convert", 0, "", 0, "", "", ""],
    [1, 139, "NonConvert", 0, "", 0, "", "", ""],
    [1, 140, "Lang1", 0, "", 0, "", "", ""],
    [1, 141, "Lang2", 0, "", 0, "", "", ""],
    [1, 142, "Lang3", 0, "", 0, "", "", ""],
    [1, 143, "Lang4", 0, "", 0, "", "", ""],
    [1, 144, "Lang5", 0, "", 0, "", "", ""],
    [1, 145, "Abort", 0, "", 0, "", "", ""],
    [1, 146, "Props", 0, "", 0, "", "", ""],
    [1, 147, "NumpadParenLeft", 0, "", 0, "", "", ""],
    [1, 148, "NumpadParenRight", 0, "", 0, "", "", ""],
    [1, 149, "NumpadBackspace", 0, "", 0, "", "", ""],
    [1, 150, "NumpadMemoryStore", 0, "", 0, "", "", ""],
    [1, 151, "NumpadMemoryRecall", 0, "", 0, "", "", ""],
    [1, 152, "NumpadMemoryClear", 0, "", 0, "", "", ""],
    [1, 153, "NumpadMemoryAdd", 0, "", 0, "", "", ""],
    [1, 154, "NumpadMemorySubtract", 0, "", 0, "", "", ""],
    [1, 155, "NumpadClear", 131, "Clear", 12, "VK_CLEAR", "", ""],
    [1, 156, "NumpadClearEntry", 0, "", 0, "", "", ""],
    [1, 0, "", 5, "Ctrl", 17, "VK_CONTROL", "", ""],
    [1, 0, "", 4, "Shift", 16, "VK_SHIFT", "", ""],
    [1, 0, "", 6, "Alt", 18, "VK_MENU", "", ""],
    [1, 0, "", 57, "Meta", 91, "VK_COMMAND", "", ""],
    [1, 157, "ControlLeft", 5, "", 0, "VK_LCONTROL", "", ""],
    [1, 158, "ShiftLeft", 4, "", 0, "VK_LSHIFT", "", ""],
    [1, 159, "AltLeft", 6, "", 0, "VK_LMENU", "", ""],
    [1, 160, "MetaLeft", 57, "", 0, "VK_LWIN", "", ""],
    [1, 161, "ControlRight", 5, "", 0, "VK_RCONTROL", "", ""],
    [1, 162, "ShiftRight", 4, "", 0, "VK_RSHIFT", "", ""],
    [1, 163, "AltRight", 6, "", 0, "VK_RMENU", "", ""],
    [1, 164, "MetaRight", 57, "", 0, "VK_RWIN", "", ""],
    [1, 165, "BrightnessUp", 0, "", 0, "", "", ""],
    [1, 166, "BrightnessDown", 0, "", 0, "", "", ""],
    [1, 167, "MediaPlay", 0, "", 0, "", "", ""],
    [1, 168, "MediaRecord", 0, "", 0, "", "", ""],
    [1, 169, "MediaFastForward", 0, "", 0, "", "", ""],
    [1, 170, "MediaRewind", 0, "", 0, "", "", ""],
    [1, 171, "MediaTrackNext", 124, "MediaTrackNext", 176, "VK_MEDIA_NEXT_TRACK", "", ""],
    [1, 172, "MediaTrackPrevious", 125, "MediaTrackPrevious", 177, "VK_MEDIA_PREV_TRACK", "", ""],
    [1, 173, "MediaStop", 126, "MediaStop", 178, "VK_MEDIA_STOP", "", ""],
    [1, 174, "Eject", 0, "", 0, "", "", ""],
    [1, 175, "MediaPlayPause", 127, "MediaPlayPause", 179, "VK_MEDIA_PLAY_PAUSE", "", ""],
    [1, 176, "MediaSelect", 128, "LaunchMediaPlayer", 181, "VK_MEDIA_LAUNCH_MEDIA_SELECT", "", ""],
    [1, 177, "LaunchMail", 129, "LaunchMail", 180, "VK_MEDIA_LAUNCH_MAIL", "", ""],
    [1, 178, "LaunchApp2", 130, "LaunchApp2", 183, "VK_MEDIA_LAUNCH_APP2", "", ""],
    [1, 179, "LaunchApp1", 0, "", 0, "VK_MEDIA_LAUNCH_APP1", "", ""],
    [1, 180, "SelectTask", 0, "", 0, "", "", ""],
    [1, 181, "LaunchScreenSaver", 0, "", 0, "", "", ""],
    [1, 182, "BrowserSearch", 120, "BrowserSearch", 170, "VK_BROWSER_SEARCH", "", ""],
    [1, 183, "BrowserHome", 121, "BrowserHome", 172, "VK_BROWSER_HOME", "", ""],
    [1, 184, "BrowserBack", 122, "BrowserBack", 166, "VK_BROWSER_BACK", "", ""],
    [1, 185, "BrowserForward", 123, "BrowserForward", 167, "VK_BROWSER_FORWARD", "", ""],
    [1, 186, "BrowserStop", 0, "", 0, "VK_BROWSER_STOP", "", ""],
    [1, 187, "BrowserRefresh", 0, "", 0, "VK_BROWSER_REFRESH", "", ""],
    [1, 188, "BrowserFavorites", 0, "", 0, "VK_BROWSER_FAVORITES", "", ""],
    [1, 189, "ZoomToggle", 0, "", 0, "", "", ""],
    [1, 190, "MailReply", 0, "", 0, "", "", ""],
    [1, 191, "MailForward", 0, "", 0, "", "", ""],
    [1, 192, "MailSend", 0, "", 0, "", "", ""],
    // See https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
    // If an Input Method Editor is processing key input and the event is keydown, return 229.
    [1, 0, "", 114, "KeyInComposition", 229, "", "", ""],
    [1, 0, "", 116, "ABNT_C2", 194, "VK_ABNT_C2", "", ""],
    [1, 0, "", 96, "OEM_8", 223, "VK_OEM_8", "", ""],
    [1, 0, "", 0, "", 0, "VK_KANA", "", ""],
    [1, 0, "", 0, "", 0, "VK_HANGUL", "", ""],
    [1, 0, "", 0, "", 0, "VK_JUNJA", "", ""],
    [1, 0, "", 0, "", 0, "VK_FINAL", "", ""],
    [1, 0, "", 0, "", 0, "VK_HANJA", "", ""],
    [1, 0, "", 0, "", 0, "VK_KANJI", "", ""],
    [1, 0, "", 0, "", 0, "VK_CONVERT", "", ""],
    [1, 0, "", 0, "", 0, "VK_NONCONVERT", "", ""],
    [1, 0, "", 0, "", 0, "VK_ACCEPT", "", ""],
    [1, 0, "", 0, "", 0, "VK_MODECHANGE", "", ""],
    [1, 0, "", 0, "", 0, "VK_SELECT", "", ""],
    [1, 0, "", 0, "", 0, "VK_PRINT", "", ""],
    [1, 0, "", 0, "", 0, "VK_EXECUTE", "", ""],
    [1, 0, "", 0, "", 0, "VK_SNAPSHOT", "", ""],
    [1, 0, "", 0, "", 0, "VK_HELP", "", ""],
    [1, 0, "", 0, "", 0, "VK_APPS", "", ""],
    [1, 0, "", 0, "", 0, "VK_PROCESSKEY", "", ""],
    [1, 0, "", 0, "", 0, "VK_PACKET", "", ""],
    [1, 0, "", 0, "", 0, "VK_DBE_SBCSCHAR", "", ""],
    [1, 0, "", 0, "", 0, "VK_DBE_DBCSCHAR", "", ""],
    [1, 0, "", 0, "", 0, "VK_ATTN", "", ""],
    [1, 0, "", 0, "", 0, "VK_CRSEL", "", ""],
    [1, 0, "", 0, "", 0, "VK_EXSEL", "", ""],
    [1, 0, "", 0, "", 0, "VK_EREOF", "", ""],
    [1, 0, "", 0, "", 0, "VK_PLAY", "", ""],
    [1, 0, "", 0, "", 0, "VK_ZOOM", "", ""],
    [1, 0, "", 0, "", 0, "VK_NONAME", "", ""],
    [1, 0, "", 0, "", 0, "VK_PA1", "", ""],
    [1, 0, "", 0, "", 0, "VK_OEM_CLEAR", "", ""]
  ], n = [], r = [];
  for (const i of e) {
    const [s, o, l, a, u, h, c, m, d] = i;
    if (r[o] || (r[o] = !0, a0[l] = o, l0[l.toLowerCase()] = o), !n[a]) {
      if (n[a] = !0, !u)
        throw new Error(`String representation missing for key code ${a} around scan code ${l}`);
      On.define(a, u), si.define(a, m || u), oi.define(a, d || m || u);
    }
    h && (o0[h] = a);
  }
})();
var Is;
(function(t) {
  function e(l) {
    return On.keyCodeToStr(l);
  }
  t.toString = e;
  function n(l) {
    return On.strToKeyCode(l);
  }
  t.fromString = n;
  function r(l) {
    return si.keyCodeToStr(l);
  }
  t.toUserSettingsUS = r;
  function i(l) {
    return oi.keyCodeToStr(l);
  }
  t.toUserSettingsGeneral = i;
  function s(l) {
    return si.strToKeyCode(l) || oi.strToKeyCode(l);
  }
  t.fromUserSettings = s;
  function o(l) {
    if (l >= 98 && l <= 113)
      return null;
    switch (l) {
      case 16:
        return "Up";
      case 18:
        return "Down";
      case 15:
        return "Left";
      case 17:
        return "Right";
    }
    return On.keyCodeToStr(l);
  }
  t.toElectronAccelerator = o;
})(Is || (Is = {}));
function u0(t, e) {
  const n = (e & 65535) << 16 >>> 0;
  return (t | n) >>> 0;
}
class _e extends G {
  constructor(e, n, r, i) {
    super(e, n, r, i), this.selectionStartLineNumber = e, this.selectionStartColumn = n, this.positionLineNumber = r, this.positionColumn = i;
  }
  /**
   * Transform to a human-readable representation.
   */
  toString() {
    return "[" + this.selectionStartLineNumber + "," + this.selectionStartColumn + " -> " + this.positionLineNumber + "," + this.positionColumn + "]";
  }
  /**
   * Test if equals other selection.
   */
  equalsSelection(e) {
    return _e.selectionsEqual(this, e);
  }
  /**
   * Test if the two selections are equal.
   */
  static selectionsEqual(e, n) {
    return e.selectionStartLineNumber === n.selectionStartLineNumber && e.selectionStartColumn === n.selectionStartColumn && e.positionLineNumber === n.positionLineNumber && e.positionColumn === n.positionColumn;
  }
  /**
   * Get directions (LTR or RTL).
   */
  getDirection() {
    return this.selectionStartLineNumber === this.startLineNumber && this.selectionStartColumn === this.startColumn ? 0 : 1;
  }
  /**
   * Create a new selection with a different `positionLineNumber` and `positionColumn`.
   */
  setEndPosition(e, n) {
    return this.getDirection() === 0 ? new _e(this.startLineNumber, this.startColumn, e, n) : new _e(e, n, this.startLineNumber, this.startColumn);
  }
  /**
   * Get the position at `positionLineNumber` and `positionColumn`.
   */
  getPosition() {
    return new ne(this.positionLineNumber, this.positionColumn);
  }
  /**
   * Get the position at the start of the selection.
  */
  getSelectionStart() {
    return new ne(this.selectionStartLineNumber, this.selectionStartColumn);
  }
  /**
   * Create a new selection with a different `selectionStartLineNumber` and `selectionStartColumn`.
   */
  setStartPosition(e, n) {
    return this.getDirection() === 0 ? new _e(e, n, this.endLineNumber, this.endColumn) : new _e(this.endLineNumber, this.endColumn, e, n);
  }
  // ----
  /**
   * Create a `Selection` from one or two positions
   */
  static fromPositions(e, n = e) {
    return new _e(e.lineNumber, e.column, n.lineNumber, n.column);
  }
  /**
   * Creates a `Selection` from a range, given a direction.
   */
  static fromRange(e, n) {
    return n === 0 ? new _e(e.startLineNumber, e.startColumn, e.endLineNumber, e.endColumn) : new _e(e.endLineNumber, e.endColumn, e.startLineNumber, e.startColumn);
  }
  /**
   * Create a `Selection` from an `ISelection`.
   */
  static liftSelection(e) {
    return new _e(e.selectionStartLineNumber, e.selectionStartColumn, e.positionLineNumber, e.positionColumn);
  }
  /**
   * `a` equals `b`.
   */
  static selectionsArrEqual(e, n) {
    if (e && !n || !e && n)
      return !1;
    if (!e && !n)
      return !0;
    if (e.length !== n.length)
      return !1;
    for (let r = 0, i = e.length; r < i; r++)
      if (!this.selectionsEqual(e[r], n[r]))
        return !1;
    return !0;
  }
  /**
   * Test if `obj` is an `ISelection`.
   */
  static isISelection(e) {
    return e && typeof e.selectionStartLineNumber == "number" && typeof e.selectionStartColumn == "number" && typeof e.positionLineNumber == "number" && typeof e.positionColumn == "number";
  }
  /**
   * Create with a direction.
   */
  static createWithDirection(e, n, r, i, s) {
    return s === 0 ? new _e(e, n, r, i) : new _e(r, i, e, n);
  }
}
function c0(t) {
  return typeof t == "string";
}
const Ps = /* @__PURE__ */ Object.create(null);
function f(t, e) {
  if (c0(e)) {
    const n = Ps[e];
    if (n === void 0)
      throw new Error(`${t} references an unknown codicon: ${e}`);
    e = n;
  }
  return Ps[t] = e, { id: t };
}
const f0 = {
  add: f("add", 6e4),
  plus: f("plus", 6e4),
  gistNew: f("gist-new", 6e4),
  repoCreate: f("repo-create", 6e4),
  lightbulb: f("lightbulb", 60001),
  lightBulb: f("light-bulb", 60001),
  repo: f("repo", 60002),
  repoDelete: f("repo-delete", 60002),
  gistFork: f("gist-fork", 60003),
  repoForked: f("repo-forked", 60003),
  gitPullRequest: f("git-pull-request", 60004),
  gitPullRequestAbandoned: f("git-pull-request-abandoned", 60004),
  recordKeys: f("record-keys", 60005),
  keyboard: f("keyboard", 60005),
  tag: f("tag", 60006),
  gitPullRequestLabel: f("git-pull-request-label", 60006),
  tagAdd: f("tag-add", 60006),
  tagRemove: f("tag-remove", 60006),
  person: f("person", 60007),
  personFollow: f("person-follow", 60007),
  personOutline: f("person-outline", 60007),
  personFilled: f("person-filled", 60007),
  gitBranch: f("git-branch", 60008),
  gitBranchCreate: f("git-branch-create", 60008),
  gitBranchDelete: f("git-branch-delete", 60008),
  sourceControl: f("source-control", 60008),
  mirror: f("mirror", 60009),
  mirrorPublic: f("mirror-public", 60009),
  star: f("star", 60010),
  starAdd: f("star-add", 60010),
  starDelete: f("star-delete", 60010),
  starEmpty: f("star-empty", 60010),
  comment: f("comment", 60011),
  commentAdd: f("comment-add", 60011),
  alert: f("alert", 60012),
  warning: f("warning", 60012),
  search: f("search", 60013),
  searchSave: f("search-save", 60013),
  logOut: f("log-out", 60014),
  signOut: f("sign-out", 60014),
  logIn: f("log-in", 60015),
  signIn: f("sign-in", 60015),
  eye: f("eye", 60016),
  eyeUnwatch: f("eye-unwatch", 60016),
  eyeWatch: f("eye-watch", 60016),
  circleFilled: f("circle-filled", 60017),
  primitiveDot: f("primitive-dot", 60017),
  closeDirty: f("close-dirty", 60017),
  debugBreakpoint: f("debug-breakpoint", 60017),
  debugBreakpointDisabled: f("debug-breakpoint-disabled", 60017),
  debugHint: f("debug-hint", 60017),
  terminalDecorationSuccess: f("terminal-decoration-success", 60017),
  primitiveSquare: f("primitive-square", 60018),
  edit: f("edit", 60019),
  pencil: f("pencil", 60019),
  info: f("info", 60020),
  issueOpened: f("issue-opened", 60020),
  gistPrivate: f("gist-private", 60021),
  gitForkPrivate: f("git-fork-private", 60021),
  lock: f("lock", 60021),
  mirrorPrivate: f("mirror-private", 60021),
  close: f("close", 60022),
  removeClose: f("remove-close", 60022),
  x: f("x", 60022),
  repoSync: f("repo-sync", 60023),
  sync: f("sync", 60023),
  clone: f("clone", 60024),
  desktopDownload: f("desktop-download", 60024),
  beaker: f("beaker", 60025),
  microscope: f("microscope", 60025),
  vm: f("vm", 60026),
  deviceDesktop: f("device-desktop", 60026),
  file: f("file", 60027),
  fileText: f("file-text", 60027),
  more: f("more", 60028),
  ellipsis: f("ellipsis", 60028),
  kebabHorizontal: f("kebab-horizontal", 60028),
  mailReply: f("mail-reply", 60029),
  reply: f("reply", 60029),
  organization: f("organization", 60030),
  organizationFilled: f("organization-filled", 60030),
  organizationOutline: f("organization-outline", 60030),
  newFile: f("new-file", 60031),
  fileAdd: f("file-add", 60031),
  newFolder: f("new-folder", 60032),
  fileDirectoryCreate: f("file-directory-create", 60032),
  trash: f("trash", 60033),
  trashcan: f("trashcan", 60033),
  history: f("history", 60034),
  clock: f("clock", 60034),
  folder: f("folder", 60035),
  fileDirectory: f("file-directory", 60035),
  symbolFolder: f("symbol-folder", 60035),
  logoGithub: f("logo-github", 60036),
  markGithub: f("mark-github", 60036),
  github: f("github", 60036),
  terminal: f("terminal", 60037),
  console: f("console", 60037),
  repl: f("repl", 60037),
  zap: f("zap", 60038),
  symbolEvent: f("symbol-event", 60038),
  error: f("error", 60039),
  stop: f("stop", 60039),
  variable: f("variable", 60040),
  symbolVariable: f("symbol-variable", 60040),
  array: f("array", 60042),
  symbolArray: f("symbol-array", 60042),
  symbolModule: f("symbol-module", 60043),
  symbolPackage: f("symbol-package", 60043),
  symbolNamespace: f("symbol-namespace", 60043),
  symbolObject: f("symbol-object", 60043),
  symbolMethod: f("symbol-method", 60044),
  symbolFunction: f("symbol-function", 60044),
  symbolConstructor: f("symbol-constructor", 60044),
  symbolBoolean: f("symbol-boolean", 60047),
  symbolNull: f("symbol-null", 60047),
  symbolNumeric: f("symbol-numeric", 60048),
  symbolNumber: f("symbol-number", 60048),
  symbolStructure: f("symbol-structure", 60049),
  symbolStruct: f("symbol-struct", 60049),
  symbolParameter: f("symbol-parameter", 60050),
  symbolTypeParameter: f("symbol-type-parameter", 60050),
  symbolKey: f("symbol-key", 60051),
  symbolText: f("symbol-text", 60051),
  symbolReference: f("symbol-reference", 60052),
  goToFile: f("go-to-file", 60052),
  symbolEnum: f("symbol-enum", 60053),
  symbolValue: f("symbol-value", 60053),
  symbolRuler: f("symbol-ruler", 60054),
  symbolUnit: f("symbol-unit", 60054),
  activateBreakpoints: f("activate-breakpoints", 60055),
  archive: f("archive", 60056),
  arrowBoth: f("arrow-both", 60057),
  arrowDown: f("arrow-down", 60058),
  arrowLeft: f("arrow-left", 60059),
  arrowRight: f("arrow-right", 60060),
  arrowSmallDown: f("arrow-small-down", 60061),
  arrowSmallLeft: f("arrow-small-left", 60062),
  arrowSmallRight: f("arrow-small-right", 60063),
  arrowSmallUp: f("arrow-small-up", 60064),
  arrowUp: f("arrow-up", 60065),
  bell: f("bell", 60066),
  bold: f("bold", 60067),
  book: f("book", 60068),
  bookmark: f("bookmark", 60069),
  debugBreakpointConditionalUnverified: f("debug-breakpoint-conditional-unverified", 60070),
  debugBreakpointConditional: f("debug-breakpoint-conditional", 60071),
  debugBreakpointConditionalDisabled: f("debug-breakpoint-conditional-disabled", 60071),
  debugBreakpointDataUnverified: f("debug-breakpoint-data-unverified", 60072),
  debugBreakpointData: f("debug-breakpoint-data", 60073),
  debugBreakpointDataDisabled: f("debug-breakpoint-data-disabled", 60073),
  debugBreakpointLogUnverified: f("debug-breakpoint-log-unverified", 60074),
  debugBreakpointLog: f("debug-breakpoint-log", 60075),
  debugBreakpointLogDisabled: f("debug-breakpoint-log-disabled", 60075),
  briefcase: f("briefcase", 60076),
  broadcast: f("broadcast", 60077),
  browser: f("browser", 60078),
  bug: f("bug", 60079),
  calendar: f("calendar", 60080),
  caseSensitive: f("case-sensitive", 60081),
  check: f("check", 60082),
  checklist: f("checklist", 60083),
  chevronDown: f("chevron-down", 60084),
  chevronLeft: f("chevron-left", 60085),
  chevronRight: f("chevron-right", 60086),
  chevronUp: f("chevron-up", 60087),
  chromeClose: f("chrome-close", 60088),
  chromeMaximize: f("chrome-maximize", 60089),
  chromeMinimize: f("chrome-minimize", 60090),
  chromeRestore: f("chrome-restore", 60091),
  circleOutline: f("circle-outline", 60092),
  circle: f("circle", 60092),
  debugBreakpointUnverified: f("debug-breakpoint-unverified", 60092),
  terminalDecorationIncomplete: f("terminal-decoration-incomplete", 60092),
  circleSlash: f("circle-slash", 60093),
  circuitBoard: f("circuit-board", 60094),
  clearAll: f("clear-all", 60095),
  clippy: f("clippy", 60096),
  closeAll: f("close-all", 60097),
  cloudDownload: f("cloud-download", 60098),
  cloudUpload: f("cloud-upload", 60099),
  code: f("code", 60100),
  collapseAll: f("collapse-all", 60101),
  colorMode: f("color-mode", 60102),
  commentDiscussion: f("comment-discussion", 60103),
  creditCard: f("credit-card", 60105),
  dash: f("dash", 60108),
  dashboard: f("dashboard", 60109),
  database: f("database", 60110),
  debugContinue: f("debug-continue", 60111),
  debugDisconnect: f("debug-disconnect", 60112),
  debugPause: f("debug-pause", 60113),
  debugRestart: f("debug-restart", 60114),
  debugStart: f("debug-start", 60115),
  debugStepInto: f("debug-step-into", 60116),
  debugStepOut: f("debug-step-out", 60117),
  debugStepOver: f("debug-step-over", 60118),
  debugStop: f("debug-stop", 60119),
  debug: f("debug", 60120),
  deviceCameraVideo: f("device-camera-video", 60121),
  deviceCamera: f("device-camera", 60122),
  deviceMobile: f("device-mobile", 60123),
  diffAdded: f("diff-added", 60124),
  diffIgnored: f("diff-ignored", 60125),
  diffModified: f("diff-modified", 60126),
  diffRemoved: f("diff-removed", 60127),
  diffRenamed: f("diff-renamed", 60128),
  diff: f("diff", 60129),
  diffSidebyside: f("diff-sidebyside", 60129),
  discard: f("discard", 60130),
  editorLayout: f("editor-layout", 60131),
  emptyWindow: f("empty-window", 60132),
  exclude: f("exclude", 60133),
  extensions: f("extensions", 60134),
  eyeClosed: f("eye-closed", 60135),
  fileBinary: f("file-binary", 60136),
  fileCode: f("file-code", 60137),
  fileMedia: f("file-media", 60138),
  filePdf: f("file-pdf", 60139),
  fileSubmodule: f("file-submodule", 60140),
  fileSymlinkDirectory: f("file-symlink-directory", 60141),
  fileSymlinkFile: f("file-symlink-file", 60142),
  fileZip: f("file-zip", 60143),
  files: f("files", 60144),
  filter: f("filter", 60145),
  flame: f("flame", 60146),
  foldDown: f("fold-down", 60147),
  foldUp: f("fold-up", 60148),
  fold: f("fold", 60149),
  folderActive: f("folder-active", 60150),
  folderOpened: f("folder-opened", 60151),
  gear: f("gear", 60152),
  gift: f("gift", 60153),
  gistSecret: f("gist-secret", 60154),
  gist: f("gist", 60155),
  gitCommit: f("git-commit", 60156),
  gitCompare: f("git-compare", 60157),
  compareChanges: f("compare-changes", 60157),
  gitMerge: f("git-merge", 60158),
  githubAction: f("github-action", 60159),
  githubAlt: f("github-alt", 60160),
  globe: f("globe", 60161),
  grabber: f("grabber", 60162),
  graph: f("graph", 60163),
  gripper: f("gripper", 60164),
  heart: f("heart", 60165),
  home: f("home", 60166),
  horizontalRule: f("horizontal-rule", 60167),
  hubot: f("hubot", 60168),
  inbox: f("inbox", 60169),
  issueReopened: f("issue-reopened", 60171),
  issues: f("issues", 60172),
  italic: f("italic", 60173),
  jersey: f("jersey", 60174),
  json: f("json", 60175),
  kebabVertical: f("kebab-vertical", 60176),
  key: f("key", 60177),
  law: f("law", 60178),
  lightbulbAutofix: f("lightbulb-autofix", 60179),
  linkExternal: f("link-external", 60180),
  link: f("link", 60181),
  listOrdered: f("list-ordered", 60182),
  listUnordered: f("list-unordered", 60183),
  liveShare: f("live-share", 60184),
  loading: f("loading", 60185),
  location: f("location", 60186),
  mailRead: f("mail-read", 60187),
  mail: f("mail", 60188),
  markdown: f("markdown", 60189),
  megaphone: f("megaphone", 60190),
  mention: f("mention", 60191),
  milestone: f("milestone", 60192),
  gitPullRequestMilestone: f("git-pull-request-milestone", 60192),
  mortarBoard: f("mortar-board", 60193),
  move: f("move", 60194),
  multipleWindows: f("multiple-windows", 60195),
  mute: f("mute", 60196),
  noNewline: f("no-newline", 60197),
  note: f("note", 60198),
  octoface: f("octoface", 60199),
  openPreview: f("open-preview", 60200),
  package: f("package", 60201),
  paintcan: f("paintcan", 60202),
  pin: f("pin", 60203),
  play: f("play", 60204),
  run: f("run", 60204),
  plug: f("plug", 60205),
  preserveCase: f("preserve-case", 60206),
  preview: f("preview", 60207),
  project: f("project", 60208),
  pulse: f("pulse", 60209),
  question: f("question", 60210),
  quote: f("quote", 60211),
  radioTower: f("radio-tower", 60212),
  reactions: f("reactions", 60213),
  references: f("references", 60214),
  refresh: f("refresh", 60215),
  regex: f("regex", 60216),
  remoteExplorer: f("remote-explorer", 60217),
  remote: f("remote", 60218),
  remove: f("remove", 60219),
  replaceAll: f("replace-all", 60220),
  replace: f("replace", 60221),
  repoClone: f("repo-clone", 60222),
  repoForcePush: f("repo-force-push", 60223),
  repoPull: f("repo-pull", 60224),
  repoPush: f("repo-push", 60225),
  report: f("report", 60226),
  requestChanges: f("request-changes", 60227),
  rocket: f("rocket", 60228),
  rootFolderOpened: f("root-folder-opened", 60229),
  rootFolder: f("root-folder", 60230),
  rss: f("rss", 60231),
  ruby: f("ruby", 60232),
  saveAll: f("save-all", 60233),
  saveAs: f("save-as", 60234),
  save: f("save", 60235),
  screenFull: f("screen-full", 60236),
  screenNormal: f("screen-normal", 60237),
  searchStop: f("search-stop", 60238),
  server: f("server", 60240),
  settingsGear: f("settings-gear", 60241),
  settings: f("settings", 60242),
  shield: f("shield", 60243),
  smiley: f("smiley", 60244),
  sortPrecedence: f("sort-precedence", 60245),
  splitHorizontal: f("split-horizontal", 60246),
  splitVertical: f("split-vertical", 60247),
  squirrel: f("squirrel", 60248),
  starFull: f("star-full", 60249),
  starHalf: f("star-half", 60250),
  symbolClass: f("symbol-class", 60251),
  symbolColor: f("symbol-color", 60252),
  symbolConstant: f("symbol-constant", 60253),
  symbolEnumMember: f("symbol-enum-member", 60254),
  symbolField: f("symbol-field", 60255),
  symbolFile: f("symbol-file", 60256),
  symbolInterface: f("symbol-interface", 60257),
  symbolKeyword: f("symbol-keyword", 60258),
  symbolMisc: f("symbol-misc", 60259),
  symbolOperator: f("symbol-operator", 60260),
  symbolProperty: f("symbol-property", 60261),
  wrench: f("wrench", 60261),
  wrenchSubaction: f("wrench-subaction", 60261),
  symbolSnippet: f("symbol-snippet", 60262),
  tasklist: f("tasklist", 60263),
  telescope: f("telescope", 60264),
  textSize: f("text-size", 60265),
  threeBars: f("three-bars", 60266),
  thumbsdown: f("thumbsdown", 60267),
  thumbsup: f("thumbsup", 60268),
  tools: f("tools", 60269),
  triangleDown: f("triangle-down", 60270),
  triangleLeft: f("triangle-left", 60271),
  triangleRight: f("triangle-right", 60272),
  triangleUp: f("triangle-up", 60273),
  twitter: f("twitter", 60274),
  unfold: f("unfold", 60275),
  unlock: f("unlock", 60276),
  unmute: f("unmute", 60277),
  unverified: f("unverified", 60278),
  verified: f("verified", 60279),
  versions: f("versions", 60280),
  vmActive: f("vm-active", 60281),
  vmOutline: f("vm-outline", 60282),
  vmRunning: f("vm-running", 60283),
  watch: f("watch", 60284),
  whitespace: f("whitespace", 60285),
  wholeWord: f("whole-word", 60286),
  window: f("window", 60287),
  wordWrap: f("word-wrap", 60288),
  zoomIn: f("zoom-in", 60289),
  zoomOut: f("zoom-out", 60290),
  listFilter: f("list-filter", 60291),
  listFlat: f("list-flat", 60292),
  listSelection: f("list-selection", 60293),
  selection: f("selection", 60293),
  listTree: f("list-tree", 60294),
  debugBreakpointFunctionUnverified: f("debug-breakpoint-function-unverified", 60295),
  debugBreakpointFunction: f("debug-breakpoint-function", 60296),
  debugBreakpointFunctionDisabled: f("debug-breakpoint-function-disabled", 60296),
  debugStackframeActive: f("debug-stackframe-active", 60297),
  circleSmallFilled: f("circle-small-filled", 60298),
  debugStackframeDot: f("debug-stackframe-dot", 60298),
  terminalDecorationMark: f("terminal-decoration-mark", 60298),
  debugStackframe: f("debug-stackframe", 60299),
  debugStackframeFocused: f("debug-stackframe-focused", 60299),
  debugBreakpointUnsupported: f("debug-breakpoint-unsupported", 60300),
  symbolString: f("symbol-string", 60301),
  debugReverseContinue: f("debug-reverse-continue", 60302),
  debugStepBack: f("debug-step-back", 60303),
  debugRestartFrame: f("debug-restart-frame", 60304),
  debugAlt: f("debug-alt", 60305),
  callIncoming: f("call-incoming", 60306),
  callOutgoing: f("call-outgoing", 60307),
  menu: f("menu", 60308),
  expandAll: f("expand-all", 60309),
  feedback: f("feedback", 60310),
  gitPullRequestReviewer: f("git-pull-request-reviewer", 60310),
  groupByRefType: f("group-by-ref-type", 60311),
  ungroupByRefType: f("ungroup-by-ref-type", 60312),
  account: f("account", 60313),
  gitPullRequestAssignee: f("git-pull-request-assignee", 60313),
  bellDot: f("bell-dot", 60314),
  debugConsole: f("debug-console", 60315),
  library: f("library", 60316),
  output: f("output", 60317),
  runAll: f("run-all", 60318),
  syncIgnored: f("sync-ignored", 60319),
  pinned: f("pinned", 60320),
  githubInverted: f("github-inverted", 60321),
  serverProcess: f("server-process", 60322),
  serverEnvironment: f("server-environment", 60323),
  pass: f("pass", 60324),
  issueClosed: f("issue-closed", 60324),
  stopCircle: f("stop-circle", 60325),
  playCircle: f("play-circle", 60326),
  record: f("record", 60327),
  debugAltSmall: f("debug-alt-small", 60328),
  vmConnect: f("vm-connect", 60329),
  cloud: f("cloud", 60330),
  merge: f("merge", 60331),
  export: f("export", 60332),
  graphLeft: f("graph-left", 60333),
  magnet: f("magnet", 60334),
  notebook: f("notebook", 60335),
  redo: f("redo", 60336),
  checkAll: f("check-all", 60337),
  pinnedDirty: f("pinned-dirty", 60338),
  passFilled: f("pass-filled", 60339),
  circleLargeFilled: f("circle-large-filled", 60340),
  circleLarge: f("circle-large", 60341),
  circleLargeOutline: f("circle-large-outline", 60341),
  combine: f("combine", 60342),
  gather: f("gather", 60342),
  table: f("table", 60343),
  variableGroup: f("variable-group", 60344),
  typeHierarchy: f("type-hierarchy", 60345),
  typeHierarchySub: f("type-hierarchy-sub", 60346),
  typeHierarchySuper: f("type-hierarchy-super", 60347),
  gitPullRequestCreate: f("git-pull-request-create", 60348),
  runAbove: f("run-above", 60349),
  runBelow: f("run-below", 60350),
  notebookTemplate: f("notebook-template", 60351),
  debugRerun: f("debug-rerun", 60352),
  workspaceTrusted: f("workspace-trusted", 60353),
  workspaceUntrusted: f("workspace-untrusted", 60354),
  workspaceUnknown: f("workspace-unknown", 60355),
  terminalCmd: f("terminal-cmd", 60356),
  terminalDebian: f("terminal-debian", 60357),
  terminalLinux: f("terminal-linux", 60358),
  terminalPowershell: f("terminal-powershell", 60359),
  terminalTmux: f("terminal-tmux", 60360),
  terminalUbuntu: f("terminal-ubuntu", 60361),
  terminalBash: f("terminal-bash", 60362),
  arrowSwap: f("arrow-swap", 60363),
  copy: f("copy", 60364),
  personAdd: f("person-add", 60365),
  filterFilled: f("filter-filled", 60366),
  wand: f("wand", 60367),
  debugLineByLine: f("debug-line-by-line", 60368),
  inspect: f("inspect", 60369),
  layers: f("layers", 60370),
  layersDot: f("layers-dot", 60371),
  layersActive: f("layers-active", 60372),
  compass: f("compass", 60373),
  compassDot: f("compass-dot", 60374),
  compassActive: f("compass-active", 60375),
  azure: f("azure", 60376),
  issueDraft: f("issue-draft", 60377),
  gitPullRequestClosed: f("git-pull-request-closed", 60378),
  gitPullRequestDraft: f("git-pull-request-draft", 60379),
  debugAll: f("debug-all", 60380),
  debugCoverage: f("debug-coverage", 60381),
  runErrors: f("run-errors", 60382),
  folderLibrary: f("folder-library", 60383),
  debugContinueSmall: f("debug-continue-small", 60384),
  beakerStop: f("beaker-stop", 60385),
  graphLine: f("graph-line", 60386),
  graphScatter: f("graph-scatter", 60387),
  pieChart: f("pie-chart", 60388),
  bracket: f("bracket", 60175),
  bracketDot: f("bracket-dot", 60389),
  bracketError: f("bracket-error", 60390),
  lockSmall: f("lock-small", 60391),
  azureDevops: f("azure-devops", 60392),
  verifiedFilled: f("verified-filled", 60393),
  newline: f("newline", 60394),
  layout: f("layout", 60395),
  layoutActivitybarLeft: f("layout-activitybar-left", 60396),
  layoutActivitybarRight: f("layout-activitybar-right", 60397),
  layoutPanelLeft: f("layout-panel-left", 60398),
  layoutPanelCenter: f("layout-panel-center", 60399),
  layoutPanelJustify: f("layout-panel-justify", 60400),
  layoutPanelRight: f("layout-panel-right", 60401),
  layoutPanel: f("layout-panel", 60402),
  layoutSidebarLeft: f("layout-sidebar-left", 60403),
  layoutSidebarRight: f("layout-sidebar-right", 60404),
  layoutStatusbar: f("layout-statusbar", 60405),
  layoutMenubar: f("layout-menubar", 60406),
  layoutCentered: f("layout-centered", 60407),
  target: f("target", 60408),
  indent: f("indent", 60409),
  recordSmall: f("record-small", 60410),
  errorSmall: f("error-small", 60411),
  terminalDecorationError: f("terminal-decoration-error", 60411),
  arrowCircleDown: f("arrow-circle-down", 60412),
  arrowCircleLeft: f("arrow-circle-left", 60413),
  arrowCircleRight: f("arrow-circle-right", 60414),
  arrowCircleUp: f("arrow-circle-up", 60415),
  layoutSidebarRightOff: f("layout-sidebar-right-off", 60416),
  layoutPanelOff: f("layout-panel-off", 60417),
  layoutSidebarLeftOff: f("layout-sidebar-left-off", 60418),
  blank: f("blank", 60419),
  heartFilled: f("heart-filled", 60420),
  map: f("map", 60421),
  mapHorizontal: f("map-horizontal", 60421),
  foldHorizontal: f("fold-horizontal", 60421),
  mapFilled: f("map-filled", 60422),
  mapHorizontalFilled: f("map-horizontal-filled", 60422),
  foldHorizontalFilled: f("fold-horizontal-filled", 60422),
  circleSmall: f("circle-small", 60423),
  bellSlash: f("bell-slash", 60424),
  bellSlashDot: f("bell-slash-dot", 60425),
  commentUnresolved: f("comment-unresolved", 60426),
  gitPullRequestGoToChanges: f("git-pull-request-go-to-changes", 60427),
  gitPullRequestNewChanges: f("git-pull-request-new-changes", 60428),
  searchFuzzy: f("search-fuzzy", 60429),
  commentDraft: f("comment-draft", 60430),
  send: f("send", 60431),
  sparkle: f("sparkle", 60432),
  insert: f("insert", 60433),
  mic: f("mic", 60434),
  thumbsdownFilled: f("thumbsdown-filled", 60435),
  thumbsupFilled: f("thumbsup-filled", 60436),
  coffee: f("coffee", 60437),
  snake: f("snake", 60438),
  game: f("game", 60439),
  vr: f("vr", 60440),
  chip: f("chip", 60441),
  piano: f("piano", 60442),
  music: f("music", 60443),
  micFilled: f("mic-filled", 60444),
  repoFetch: f("repo-fetch", 60445),
  copilot: f("copilot", 60446),
  lightbulbSparkle: f("lightbulb-sparkle", 60447),
  robot: f("robot", 60448),
  sparkleFilled: f("sparkle-filled", 60449),
  diffSingle: f("diff-single", 60450),
  diffMultiple: f("diff-multiple", 60451),
  surroundWith: f("surround-with", 60452),
  share: f("share", 60453),
  gitStash: f("git-stash", 60454),
  gitStashApply: f("git-stash-apply", 60455),
  gitStashPop: f("git-stash-pop", 60456),
  vscode: f("vscode", 60457),
  vscodeInsiders: f("vscode-insiders", 60458),
  codeOss: f("code-oss", 60459),
  runCoverage: f("run-coverage", 60460),
  runAllCoverage: f("run-all-coverage", 60461),
  coverage: f("coverage", 60462),
  githubProject: f("github-project", 60463),
  mapVertical: f("map-vertical", 60464),
  foldVertical: f("fold-vertical", 60464),
  mapVerticalFilled: f("map-vertical-filled", 60465),
  foldVerticalFilled: f("fold-vertical-filled", 60465),
  goToSearch: f("go-to-search", 60466),
  percentage: f("percentage", 60467),
  sortPercentage: f("sort-percentage", 60467),
  attach: f("attach", 60468)
}, h0 = {
  dialogError: f("dialog-error", "error"),
  dialogWarning: f("dialog-warning", "warning"),
  dialogInfo: f("dialog-info", "info"),
  dialogClose: f("dialog-close", "close"),
  treeItemExpanded: f("tree-item-expanded", "chevron-down"),
  // collapsed is done with rotation
  treeFilterOnTypeOn: f("tree-filter-on-type-on", "list-filter"),
  treeFilterOnTypeOff: f("tree-filter-on-type-off", "list-selection"),
  treeFilterClear: f("tree-filter-clear", "close"),
  treeItemLoading: f("tree-item-loading", "loading"),
  menuSelection: f("menu-selection", "check"),
  menuSubmenu: f("menu-submenu", "chevron-right"),
  menuBarMore: f("menubar-more", "more"),
  scrollbarButtonLeft: f("scrollbar-button-left", "triangle-left"),
  scrollbarButtonRight: f("scrollbar-button-right", "triangle-right"),
  scrollbarButtonUp: f("scrollbar-button-up", "triangle-up"),
  scrollbarButtonDown: f("scrollbar-button-down", "triangle-down"),
  toolBarMore: f("toolbar-more", "more"),
  quickInputBack: f("quick-input-back", "arrow-left"),
  dropDownButton: f("drop-down-button", 60084),
  symbolCustomColor: f("symbol-customcolor", 60252),
  exportIcon: f("export", 60332),
  workspaceUnspecified: f("workspace-unspecified", 60355),
  newLine: f("newline", 60394),
  thumbsDownFilled: f("thumbsdown-filled", 60435),
  thumbsUpFilled: f("thumbsup-filled", 60436),
  gitFetch: f("git-fetch", 60445),
  lightbulbSparkleAutofix: f("lightbulb-sparkle-autofix", 60447),
  debugBreakpointPending: f("debug-breakpoint-pending", 60377)
}, B = {
  ...f0,
  ...h0
};
class nl {
  constructor() {
    this._tokenizationSupports = /* @__PURE__ */ new Map(), this._factories = /* @__PURE__ */ new Map(), this._onDidChange = new Re(), this.onDidChange = this._onDidChange.event, this._colorMap = null;
  }
  handleChange(e) {
    this._onDidChange.fire({
      changedLanguages: e,
      changedColorMap: !1
    });
  }
  register(e, n) {
    return this._tokenizationSupports.set(e, n), this.handleChange([e]), Gn(() => {
      this._tokenizationSupports.get(e) === n && (this._tokenizationSupports.delete(e), this.handleChange([e]));
    });
  }
  get(e) {
    return this._tokenizationSupports.get(e) || null;
  }
  registerFactory(e, n) {
    this._factories.get(e)?.dispose();
    const r = new m0(this, e, n);
    return this._factories.set(e, r), Gn(() => {
      const i = this._factories.get(e);
      !i || i !== r || (this._factories.delete(e), i.dispose());
    });
  }
  async getOrCreate(e) {
    const n = this.get(e);
    if (n)
      return n;
    const r = this._factories.get(e);
    return !r || r.isResolved ? null : (await r.resolve(), this.get(e));
  }
  isResolved(e) {
    if (this.get(e))
      return !0;
    const r = this._factories.get(e);
    return !!(!r || r.isResolved);
  }
  setColorMap(e) {
    this._colorMap = e, this._onDidChange.fire({
      changedLanguages: Array.from(this._tokenizationSupports.keys()),
      changedColorMap: !0
    });
  }
  getColorMap() {
    return this._colorMap;
  }
  getDefaultBackground() {
    return this._colorMap && this._colorMap.length > 2 ? this._colorMap[
      2
      /* ColorId.DefaultBackground */
    ] : null;
  }
}
class m0 extends Xt {
  get isResolved() {
    return this._isResolved;
  }
  constructor(e, n, r) {
    super(), this._registry = e, this._languageId = n, this._factory = r, this._isDisposed = !1, this._resolvePromise = null, this._isResolved = !1;
  }
  dispose() {
    this._isDisposed = !0, super.dispose();
  }
  async resolve() {
    return this._resolvePromise || (this._resolvePromise = this._create()), this._resolvePromise;
  }
  async _create() {
    const e = await this._factory.tokenizationSupport;
    this._isResolved = !0, e && !this._isDisposed && this._register(this._registry.register(this._languageId, e));
  }
}
class d0 {
  constructor(e, n, r) {
    this.offset = e, this.type = n, this.language = r, this._tokenBrand = void 0;
  }
  toString() {
    return "(" + this.offset + ", " + this.type + ")";
  }
}
var Fs;
(function(t) {
  t[t.Increase = 0] = "Increase", t[t.Decrease = 1] = "Decrease";
})(Fs || (Fs = {}));
var Ds;
(function(t) {
  const e = /* @__PURE__ */ new Map();
  e.set(0, B.symbolMethod), e.set(1, B.symbolFunction), e.set(2, B.symbolConstructor), e.set(3, B.symbolField), e.set(4, B.symbolVariable), e.set(5, B.symbolClass), e.set(6, B.symbolStruct), e.set(7, B.symbolInterface), e.set(8, B.symbolModule), e.set(9, B.symbolProperty), e.set(10, B.symbolEvent), e.set(11, B.symbolOperator), e.set(12, B.symbolUnit), e.set(13, B.symbolValue), e.set(15, B.symbolEnum), e.set(14, B.symbolConstant), e.set(15, B.symbolEnum), e.set(16, B.symbolEnumMember), e.set(17, B.symbolKeyword), e.set(27, B.symbolSnippet), e.set(18, B.symbolText), e.set(19, B.symbolColor), e.set(20, B.symbolFile), e.set(21, B.symbolReference), e.set(22, B.symbolCustomColor), e.set(23, B.symbolFolder), e.set(24, B.symbolTypeParameter), e.set(25, B.account), e.set(26, B.issues);
  function n(s) {
    let o = e.get(s);
    return o || (console.info("No codicon found for CompletionItemKind " + s), o = B.symbolProperty), o;
  }
  t.toIcon = n;
  const r = /* @__PURE__ */ new Map();
  r.set(
    "method",
    0
    /* CompletionItemKind.Method */
  ), r.set(
    "function",
    1
    /* CompletionItemKind.Function */
  ), r.set(
    "constructor",
    2
    /* CompletionItemKind.Constructor */
  ), r.set(
    "field",
    3
    /* CompletionItemKind.Field */
  ), r.set(
    "variable",
    4
    /* CompletionItemKind.Variable */
  ), r.set(
    "class",
    5
    /* CompletionItemKind.Class */
  ), r.set(
    "struct",
    6
    /* CompletionItemKind.Struct */
  ), r.set(
    "interface",
    7
    /* CompletionItemKind.Interface */
  ), r.set(
    "module",
    8
    /* CompletionItemKind.Module */
  ), r.set(
    "property",
    9
    /* CompletionItemKind.Property */
  ), r.set(
    "event",
    10
    /* CompletionItemKind.Event */
  ), r.set(
    "operator",
    11
    /* CompletionItemKind.Operator */
  ), r.set(
    "unit",
    12
    /* CompletionItemKind.Unit */
  ), r.set(
    "value",
    13
    /* CompletionItemKind.Value */
  ), r.set(
    "constant",
    14
    /* CompletionItemKind.Constant */
  ), r.set(
    "enum",
    15
    /* CompletionItemKind.Enum */
  ), r.set(
    "enum-member",
    16
    /* CompletionItemKind.EnumMember */
  ), r.set(
    "enumMember",
    16
    /* CompletionItemKind.EnumMember */
  ), r.set(
    "keyword",
    17
    /* CompletionItemKind.Keyword */
  ), r.set(
    "snippet",
    27
    /* CompletionItemKind.Snippet */
  ), r.set(
    "text",
    18
    /* CompletionItemKind.Text */
  ), r.set(
    "color",
    19
    /* CompletionItemKind.Color */
  ), r.set(
    "file",
    20
    /* CompletionItemKind.File */
  ), r.set(
    "reference",
    21
    /* CompletionItemKind.Reference */
  ), r.set(
    "customcolor",
    22
    /* CompletionItemKind.Customcolor */
  ), r.set(
    "folder",
    23
    /* CompletionItemKind.Folder */
  ), r.set(
    "type-parameter",
    24
    /* CompletionItemKind.TypeParameter */
  ), r.set(
    "typeParameter",
    24
    /* CompletionItemKind.TypeParameter */
  ), r.set(
    "account",
    25
    /* CompletionItemKind.User */
  ), r.set(
    "issue",
    26
    /* CompletionItemKind.Issue */
  );
  function i(s, o) {
    let l = r.get(s);
    return typeof l > "u" && !o && (l = 9), l;
  }
  t.fromString = i;
})(Ds || (Ds = {}));
var Bs;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.Explicit = 1] = "Explicit";
})(Bs || (Bs = {}));
var Vs;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.PasteAs = 1] = "PasteAs";
})(Vs || (Vs = {}));
var Os;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.TriggerCharacter = 2] = "TriggerCharacter", t[t.ContentChange = 3] = "ContentChange";
})(Os || (Os = {}));
var Us;
(function(t) {
  t[t.Text = 0] = "Text", t[t.Read = 1] = "Read", t[t.Write = 2] = "Write";
})(Us || (Us = {}));
Y("Array", "array"), Y("Boolean", "boolean"), Y("Class", "class"), Y("Constant", "constant"), Y("Constructor", "constructor"), Y("Enum", "enumeration"), Y("EnumMember", "enumeration member"), Y("Event", "event"), Y("Field", "field"), Y("File", "file"), Y("Function", "function"), Y("Interface", "interface"), Y("Key", "key"), Y("Method", "method"), Y("Module", "module"), Y("Namespace", "namespace"), Y("Null", "null"), Y("Number", "number"), Y("Object", "object"), Y("Operator", "operator"), Y("Package", "package"), Y("Property", "property"), Y("String", "string"), Y("Struct", "struct"), Y("TypeParameter", "type parameter"), Y("Variable", "variable");
var $s;
(function(t) {
  const e = /* @__PURE__ */ new Map();
  e.set(0, B.symbolFile), e.set(1, B.symbolModule), e.set(2, B.symbolNamespace), e.set(3, B.symbolPackage), e.set(4, B.symbolClass), e.set(5, B.symbolMethod), e.set(6, B.symbolProperty), e.set(7, B.symbolField), e.set(8, B.symbolConstructor), e.set(9, B.symbolEnum), e.set(10, B.symbolInterface), e.set(11, B.symbolFunction), e.set(12, B.symbolVariable), e.set(13, B.symbolConstant), e.set(14, B.symbolString), e.set(15, B.symbolNumber), e.set(16, B.symbolBoolean), e.set(17, B.symbolArray), e.set(18, B.symbolObject), e.set(19, B.symbolKey), e.set(20, B.symbolNull), e.set(21, B.symbolEnumMember), e.set(22, B.symbolStruct), e.set(23, B.symbolEvent), e.set(24, B.symbolOperator), e.set(25, B.symbolTypeParameter);
  function n(r) {
    let i = e.get(r);
    return i || (console.info("No codicon found for SymbolKind " + r), i = B.symbolProperty), i;
  }
  t.toIcon = n;
})($s || ($s = {}));
var be;
let Fm = (be = class {
  /**
   * Returns a {@link FoldingRangeKind} for the given value.
   *
   * @param value of the kind.
   */
  static fromValue(e) {
    switch (e) {
      case "comment":
        return be.Comment;
      case "imports":
        return be.Imports;
      case "region":
        return be.Region;
    }
    return new be(e);
  }
  /**
   * Creates a new {@link FoldingRangeKind}.
   *
   * @param value of the kind.
   */
  constructor(e) {
    this.value = e;
  }
}, be.Comment = new be("comment"), be.Imports = new be("imports"), be.Region = new be("region"), be);
var qs;
(function(t) {
  t[t.AIGenerated = 1] = "AIGenerated";
})(qs || (qs = {}));
var js;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(js || (js = {}));
var Ws;
(function(t) {
  function e(n) {
    return !n || typeof n != "object" ? !1 : typeof n.id == "string" && typeof n.title == "string";
  }
  t.is = e;
})(Ws || (Ws = {}));
var Hs;
(function(t) {
  t[t.Type = 1] = "Type", t[t.Parameter = 2] = "Parameter";
})(Hs || (Hs = {}));
new nl();
new nl();
var zs;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(zs || (zs = {}));
var Gs;
(function(t) {
  t[t.Unknown = 0] = "Unknown", t[t.Disabled = 1] = "Disabled", t[t.Enabled = 2] = "Enabled";
})(Gs || (Gs = {}));
var Js;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.Auto = 2] = "Auto";
})(Js || (Js = {}));
var Qs;
(function(t) {
  t[t.None = 0] = "None", t[t.KeepWhitespace = 1] = "KeepWhitespace", t[t.InsertAsSnippet = 4] = "InsertAsSnippet";
})(Qs || (Qs = {}));
var Xs;
(function(t) {
  t[t.Method = 0] = "Method", t[t.Function = 1] = "Function", t[t.Constructor = 2] = "Constructor", t[t.Field = 3] = "Field", t[t.Variable = 4] = "Variable", t[t.Class = 5] = "Class", t[t.Struct = 6] = "Struct", t[t.Interface = 7] = "Interface", t[t.Module = 8] = "Module", t[t.Property = 9] = "Property", t[t.Event = 10] = "Event", t[t.Operator = 11] = "Operator", t[t.Unit = 12] = "Unit", t[t.Value = 13] = "Value", t[t.Constant = 14] = "Constant", t[t.Enum = 15] = "Enum", t[t.EnumMember = 16] = "EnumMember", t[t.Keyword = 17] = "Keyword", t[t.Text = 18] = "Text", t[t.Color = 19] = "Color", t[t.File = 20] = "File", t[t.Reference = 21] = "Reference", t[t.Customcolor = 22] = "Customcolor", t[t.Folder = 23] = "Folder", t[t.TypeParameter = 24] = "TypeParameter", t[t.User = 25] = "User", t[t.Issue = 26] = "Issue", t[t.Snippet = 27] = "Snippet";
})(Xs || (Xs = {}));
var Ys;
(function(t) {
  t[t.Deprecated = 1] = "Deprecated";
})(Ys || (Ys = {}));
var Zs;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.TriggerCharacter = 1] = "TriggerCharacter", t[t.TriggerForIncompleteCompletions = 2] = "TriggerForIncompleteCompletions";
})(Zs || (Zs = {}));
var Ks;
(function(t) {
  t[t.EXACT = 0] = "EXACT", t[t.ABOVE = 1] = "ABOVE", t[t.BELOW = 2] = "BELOW";
})(Ks || (Ks = {}));
var eo;
(function(t) {
  t[t.NotSet = 0] = "NotSet", t[t.ContentFlush = 1] = "ContentFlush", t[t.RecoverFromMarkers = 2] = "RecoverFromMarkers", t[t.Explicit = 3] = "Explicit", t[t.Paste = 4] = "Paste", t[t.Undo = 5] = "Undo", t[t.Redo = 6] = "Redo";
})(eo || (eo = {}));
var to;
(function(t) {
  t[t.LF = 1] = "LF", t[t.CRLF = 2] = "CRLF";
})(to || (to = {}));
var no;
(function(t) {
  t[t.Text = 0] = "Text", t[t.Read = 1] = "Read", t[t.Write = 2] = "Write";
})(no || (no = {}));
var ro;
(function(t) {
  t[t.None = 0] = "None", t[t.Keep = 1] = "Keep", t[t.Brackets = 2] = "Brackets", t[t.Advanced = 3] = "Advanced", t[t.Full = 4] = "Full";
})(ro || (ro = {}));
var io;
(function(t) {
  t[t.acceptSuggestionOnCommitCharacter = 0] = "acceptSuggestionOnCommitCharacter", t[t.acceptSuggestionOnEnter = 1] = "acceptSuggestionOnEnter", t[t.accessibilitySupport = 2] = "accessibilitySupport", t[t.accessibilityPageSize = 3] = "accessibilityPageSize", t[t.ariaLabel = 4] = "ariaLabel", t[t.ariaRequired = 5] = "ariaRequired", t[t.autoClosingBrackets = 6] = "autoClosingBrackets", t[t.autoClosingComments = 7] = "autoClosingComments", t[t.screenReaderAnnounceInlineSuggestion = 8] = "screenReaderAnnounceInlineSuggestion", t[t.autoClosingDelete = 9] = "autoClosingDelete", t[t.autoClosingOvertype = 10] = "autoClosingOvertype", t[t.autoClosingQuotes = 11] = "autoClosingQuotes", t[t.autoIndent = 12] = "autoIndent", t[t.automaticLayout = 13] = "automaticLayout", t[t.autoSurround = 14] = "autoSurround", t[t.bracketPairColorization = 15] = "bracketPairColorization", t[t.guides = 16] = "guides", t[t.codeLens = 17] = "codeLens", t[t.codeLensFontFamily = 18] = "codeLensFontFamily", t[t.codeLensFontSize = 19] = "codeLensFontSize", t[t.colorDecorators = 20] = "colorDecorators", t[t.colorDecoratorsLimit = 21] = "colorDecoratorsLimit", t[t.columnSelection = 22] = "columnSelection", t[t.comments = 23] = "comments", t[t.contextmenu = 24] = "contextmenu", t[t.copyWithSyntaxHighlighting = 25] = "copyWithSyntaxHighlighting", t[t.cursorBlinking = 26] = "cursorBlinking", t[t.cursorSmoothCaretAnimation = 27] = "cursorSmoothCaretAnimation", t[t.cursorStyle = 28] = "cursorStyle", t[t.cursorSurroundingLines = 29] = "cursorSurroundingLines", t[t.cursorSurroundingLinesStyle = 30] = "cursorSurroundingLinesStyle", t[t.cursorWidth = 31] = "cursorWidth", t[t.disableLayerHinting = 32] = "disableLayerHinting", t[t.disableMonospaceOptimizations = 33] = "disableMonospaceOptimizations", t[t.domReadOnly = 34] = "domReadOnly", t[t.dragAndDrop = 35] = "dragAndDrop", t[t.dropIntoEditor = 36] = "dropIntoEditor", t[t.emptySelectionClipboard = 37] = "emptySelectionClipboard", t[t.experimentalWhitespaceRendering = 38] = "experimentalWhitespaceRendering", t[t.extraEditorClassName = 39] = "extraEditorClassName", t[t.fastScrollSensitivity = 40] = "fastScrollSensitivity", t[t.find = 41] = "find", t[t.fixedOverflowWidgets = 42] = "fixedOverflowWidgets", t[t.folding = 43] = "folding", t[t.foldingStrategy = 44] = "foldingStrategy", t[t.foldingHighlight = 45] = "foldingHighlight", t[t.foldingImportsByDefault = 46] = "foldingImportsByDefault", t[t.foldingMaximumRegions = 47] = "foldingMaximumRegions", t[t.unfoldOnClickAfterEndOfLine = 48] = "unfoldOnClickAfterEndOfLine", t[t.fontFamily = 49] = "fontFamily", t[t.fontInfo = 50] = "fontInfo", t[t.fontLigatures = 51] = "fontLigatures", t[t.fontSize = 52] = "fontSize", t[t.fontWeight = 53] = "fontWeight", t[t.fontVariations = 54] = "fontVariations", t[t.formatOnPaste = 55] = "formatOnPaste", t[t.formatOnType = 56] = "formatOnType", t[t.glyphMargin = 57] = "glyphMargin", t[t.gotoLocation = 58] = "gotoLocation", t[t.hideCursorInOverviewRuler = 59] = "hideCursorInOverviewRuler", t[t.hover = 60] = "hover", t[t.inDiffEditor = 61] = "inDiffEditor", t[t.inlineSuggest = 62] = "inlineSuggest", t[t.inlineEdit = 63] = "inlineEdit", t[t.letterSpacing = 64] = "letterSpacing", t[t.lightbulb = 65] = "lightbulb", t[t.lineDecorationsWidth = 66] = "lineDecorationsWidth", t[t.lineHeight = 67] = "lineHeight", t[t.lineNumbers = 68] = "lineNumbers", t[t.lineNumbersMinChars = 69] = "lineNumbersMinChars", t[t.linkedEditing = 70] = "linkedEditing", t[t.links = 71] = "links", t[t.matchBrackets = 72] = "matchBrackets", t[t.minimap = 73] = "minimap", t[t.mouseStyle = 74] = "mouseStyle", t[t.mouseWheelScrollSensitivity = 75] = "mouseWheelScrollSensitivity", t[t.mouseWheelZoom = 76] = "mouseWheelZoom", t[t.multiCursorMergeOverlapping = 77] = "multiCursorMergeOverlapping", t[t.multiCursorModifier = 78] = "multiCursorModifier", t[t.multiCursorPaste = 79] = "multiCursorPaste", t[t.multiCursorLimit = 80] = "multiCursorLimit", t[t.occurrencesHighlight = 81] = "occurrencesHighlight", t[t.overviewRulerBorder = 82] = "overviewRulerBorder", t[t.overviewRulerLanes = 83] = "overviewRulerLanes", t[t.padding = 84] = "padding", t[t.pasteAs = 85] = "pasteAs", t[t.parameterHints = 86] = "parameterHints", t[t.peekWidgetDefaultFocus = 87] = "peekWidgetDefaultFocus", t[t.placeholder = 88] = "placeholder", t[t.definitionLinkOpensInPeek = 89] = "definitionLinkOpensInPeek", t[t.quickSuggestions = 90] = "quickSuggestions", t[t.quickSuggestionsDelay = 91] = "quickSuggestionsDelay", t[t.readOnly = 92] = "readOnly", t[t.readOnlyMessage = 93] = "readOnlyMessage", t[t.renameOnType = 94] = "renameOnType", t[t.renderControlCharacters = 95] = "renderControlCharacters", t[t.renderFinalNewline = 96] = "renderFinalNewline", t[t.renderLineHighlight = 97] = "renderLineHighlight", t[t.renderLineHighlightOnlyWhenFocus = 98] = "renderLineHighlightOnlyWhenFocus", t[t.renderValidationDecorations = 99] = "renderValidationDecorations", t[t.renderWhitespace = 100] = "renderWhitespace", t[t.revealHorizontalRightPadding = 101] = "revealHorizontalRightPadding", t[t.roundedSelection = 102] = "roundedSelection", t[t.rulers = 103] = "rulers", t[t.scrollbar = 104] = "scrollbar", t[t.scrollBeyondLastColumn = 105] = "scrollBeyondLastColumn", t[t.scrollBeyondLastLine = 106] = "scrollBeyondLastLine", t[t.scrollPredominantAxis = 107] = "scrollPredominantAxis", t[t.selectionClipboard = 108] = "selectionClipboard", t[t.selectionHighlight = 109] = "selectionHighlight", t[t.selectOnLineNumbers = 110] = "selectOnLineNumbers", t[t.showFoldingControls = 111] = "showFoldingControls", t[t.showUnused = 112] = "showUnused", t[t.snippetSuggestions = 113] = "snippetSuggestions", t[t.smartSelect = 114] = "smartSelect", t[t.smoothScrolling = 115] = "smoothScrolling", t[t.stickyScroll = 116] = "stickyScroll", t[t.stickyTabStops = 117] = "stickyTabStops", t[t.stopRenderingLineAfter = 118] = "stopRenderingLineAfter", t[t.suggest = 119] = "suggest", t[t.suggestFontSize = 120] = "suggestFontSize", t[t.suggestLineHeight = 121] = "suggestLineHeight", t[t.suggestOnTriggerCharacters = 122] = "suggestOnTriggerCharacters", t[t.suggestSelection = 123] = "suggestSelection", t[t.tabCompletion = 124] = "tabCompletion", t[t.tabIndex = 125] = "tabIndex", t[t.unicodeHighlighting = 126] = "unicodeHighlighting", t[t.unusualLineTerminators = 127] = "unusualLineTerminators", t[t.useShadowDOM = 128] = "useShadowDOM", t[t.useTabStops = 129] = "useTabStops", t[t.wordBreak = 130] = "wordBreak", t[t.wordSegmenterLocales = 131] = "wordSegmenterLocales", t[t.wordSeparators = 132] = "wordSeparators", t[t.wordWrap = 133] = "wordWrap", t[t.wordWrapBreakAfterCharacters = 134] = "wordWrapBreakAfterCharacters", t[t.wordWrapBreakBeforeCharacters = 135] = "wordWrapBreakBeforeCharacters", t[t.wordWrapColumn = 136] = "wordWrapColumn", t[t.wordWrapOverride1 = 137] = "wordWrapOverride1", t[t.wordWrapOverride2 = 138] = "wordWrapOverride2", t[t.wrappingIndent = 139] = "wrappingIndent", t[t.wrappingStrategy = 140] = "wrappingStrategy", t[t.showDeprecated = 141] = "showDeprecated", t[t.inlayHints = 142] = "inlayHints", t[t.editorClassName = 143] = "editorClassName", t[t.pixelRatio = 144] = "pixelRatio", t[t.tabFocusMode = 145] = "tabFocusMode", t[t.layoutInfo = 146] = "layoutInfo", t[t.wrappingInfo = 147] = "wrappingInfo", t[t.defaultColorDecorators = 148] = "defaultColorDecorators", t[t.colorDecoratorsActivatedOn = 149] = "colorDecoratorsActivatedOn", t[t.inlineCompletionsAccessibilityVerbose = 150] = "inlineCompletionsAccessibilityVerbose";
})(io || (io = {}));
var so;
(function(t) {
  t[t.TextDefined = 0] = "TextDefined", t[t.LF = 1] = "LF", t[t.CRLF = 2] = "CRLF";
})(so || (so = {}));
var oo;
(function(t) {
  t[t.LF = 0] = "LF", t[t.CRLF = 1] = "CRLF";
})(oo || (oo = {}));
var ao;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 3] = "Right";
})(ao || (ao = {}));
var lo;
(function(t) {
  t[t.Increase = 0] = "Increase", t[t.Decrease = 1] = "Decrease";
})(lo || (lo = {}));
var uo;
(function(t) {
  t[t.None = 0] = "None", t[t.Indent = 1] = "Indent", t[t.IndentOutdent = 2] = "IndentOutdent", t[t.Outdent = 3] = "Outdent";
})(uo || (uo = {}));
var co;
(function(t) {
  t[t.Both = 0] = "Both", t[t.Right = 1] = "Right", t[t.Left = 2] = "Left", t[t.None = 3] = "None";
})(co || (co = {}));
var fo;
(function(t) {
  t[t.Type = 1] = "Type", t[t.Parameter = 2] = "Parameter";
})(fo || (fo = {}));
var ho;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.Explicit = 1] = "Explicit";
})(ho || (ho = {}));
var mo;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(mo || (mo = {}));
var ai;
(function(t) {
  t[t.DependsOnKbLayout = -1] = "DependsOnKbLayout", t[t.Unknown = 0] = "Unknown", t[t.Backspace = 1] = "Backspace", t[t.Tab = 2] = "Tab", t[t.Enter = 3] = "Enter", t[t.Shift = 4] = "Shift", t[t.Ctrl = 5] = "Ctrl", t[t.Alt = 6] = "Alt", t[t.PauseBreak = 7] = "PauseBreak", t[t.CapsLock = 8] = "CapsLock", t[t.Escape = 9] = "Escape", t[t.Space = 10] = "Space", t[t.PageUp = 11] = "PageUp", t[t.PageDown = 12] = "PageDown", t[t.End = 13] = "End", t[t.Home = 14] = "Home", t[t.LeftArrow = 15] = "LeftArrow", t[t.UpArrow = 16] = "UpArrow", t[t.RightArrow = 17] = "RightArrow", t[t.DownArrow = 18] = "DownArrow", t[t.Insert = 19] = "Insert", t[t.Delete = 20] = "Delete", t[t.Digit0 = 21] = "Digit0", t[t.Digit1 = 22] = "Digit1", t[t.Digit2 = 23] = "Digit2", t[t.Digit3 = 24] = "Digit3", t[t.Digit4 = 25] = "Digit4", t[t.Digit5 = 26] = "Digit5", t[t.Digit6 = 27] = "Digit6", t[t.Digit7 = 28] = "Digit7", t[t.Digit8 = 29] = "Digit8", t[t.Digit9 = 30] = "Digit9", t[t.KeyA = 31] = "KeyA", t[t.KeyB = 32] = "KeyB", t[t.KeyC = 33] = "KeyC", t[t.KeyD = 34] = "KeyD", t[t.KeyE = 35] = "KeyE", t[t.KeyF = 36] = "KeyF", t[t.KeyG = 37] = "KeyG", t[t.KeyH = 38] = "KeyH", t[t.KeyI = 39] = "KeyI", t[t.KeyJ = 40] = "KeyJ", t[t.KeyK = 41] = "KeyK", t[t.KeyL = 42] = "KeyL", t[t.KeyM = 43] = "KeyM", t[t.KeyN = 44] = "KeyN", t[t.KeyO = 45] = "KeyO", t[t.KeyP = 46] = "KeyP", t[t.KeyQ = 47] = "KeyQ", t[t.KeyR = 48] = "KeyR", t[t.KeyS = 49] = "KeyS", t[t.KeyT = 50] = "KeyT", t[t.KeyU = 51] = "KeyU", t[t.KeyV = 52] = "KeyV", t[t.KeyW = 53] = "KeyW", t[t.KeyX = 54] = "KeyX", t[t.KeyY = 55] = "KeyY", t[t.KeyZ = 56] = "KeyZ", t[t.Meta = 57] = "Meta", t[t.ContextMenu = 58] = "ContextMenu", t[t.F1 = 59] = "F1", t[t.F2 = 60] = "F2", t[t.F3 = 61] = "F3", t[t.F4 = 62] = "F4", t[t.F5 = 63] = "F5", t[t.F6 = 64] = "F6", t[t.F7 = 65] = "F7", t[t.F8 = 66] = "F8", t[t.F9 = 67] = "F9", t[t.F10 = 68] = "F10", t[t.F11 = 69] = "F11", t[t.F12 = 70] = "F12", t[t.F13 = 71] = "F13", t[t.F14 = 72] = "F14", t[t.F15 = 73] = "F15", t[t.F16 = 74] = "F16", t[t.F17 = 75] = "F17", t[t.F18 = 76] = "F18", t[t.F19 = 77] = "F19", t[t.F20 = 78] = "F20", t[t.F21 = 79] = "F21", t[t.F22 = 80] = "F22", t[t.F23 = 81] = "F23", t[t.F24 = 82] = "F24", t[t.NumLock = 83] = "NumLock", t[t.ScrollLock = 84] = "ScrollLock", t[t.Semicolon = 85] = "Semicolon", t[t.Equal = 86] = "Equal", t[t.Comma = 87] = "Comma", t[t.Minus = 88] = "Minus", t[t.Period = 89] = "Period", t[t.Slash = 90] = "Slash", t[t.Backquote = 91] = "Backquote", t[t.BracketLeft = 92] = "BracketLeft", t[t.Backslash = 93] = "Backslash", t[t.BracketRight = 94] = "BracketRight", t[t.Quote = 95] = "Quote", t[t.OEM_8 = 96] = "OEM_8", t[t.IntlBackslash = 97] = "IntlBackslash", t[t.Numpad0 = 98] = "Numpad0", t[t.Numpad1 = 99] = "Numpad1", t[t.Numpad2 = 100] = "Numpad2", t[t.Numpad3 = 101] = "Numpad3", t[t.Numpad4 = 102] = "Numpad4", t[t.Numpad5 = 103] = "Numpad5", t[t.Numpad6 = 104] = "Numpad6", t[t.Numpad7 = 105] = "Numpad7", t[t.Numpad8 = 106] = "Numpad8", t[t.Numpad9 = 107] = "Numpad9", t[t.NumpadMultiply = 108] = "NumpadMultiply", t[t.NumpadAdd = 109] = "NumpadAdd", t[t.NUMPAD_SEPARATOR = 110] = "NUMPAD_SEPARATOR", t[t.NumpadSubtract = 111] = "NumpadSubtract", t[t.NumpadDecimal = 112] = "NumpadDecimal", t[t.NumpadDivide = 113] = "NumpadDivide", t[t.KEY_IN_COMPOSITION = 114] = "KEY_IN_COMPOSITION", t[t.ABNT_C1 = 115] = "ABNT_C1", t[t.ABNT_C2 = 116] = "ABNT_C2", t[t.AudioVolumeMute = 117] = "AudioVolumeMute", t[t.AudioVolumeUp = 118] = "AudioVolumeUp", t[t.AudioVolumeDown = 119] = "AudioVolumeDown", t[t.BrowserSearch = 120] = "BrowserSearch", t[t.BrowserHome = 121] = "BrowserHome", t[t.BrowserBack = 122] = "BrowserBack", t[t.BrowserForward = 123] = "BrowserForward", t[t.MediaTrackNext = 124] = "MediaTrackNext", t[t.MediaTrackPrevious = 125] = "MediaTrackPrevious", t[t.MediaStop = 126] = "MediaStop", t[t.MediaPlayPause = 127] = "MediaPlayPause", t[t.LaunchMediaPlayer = 128] = "LaunchMediaPlayer", t[t.LaunchMail = 129] = "LaunchMail", t[t.LaunchApp2 = 130] = "LaunchApp2", t[t.Clear = 131] = "Clear", t[t.MAX_VALUE = 132] = "MAX_VALUE";
})(ai || (ai = {}));
var li;
(function(t) {
  t[t.Hint = 1] = "Hint", t[t.Info = 2] = "Info", t[t.Warning = 4] = "Warning", t[t.Error = 8] = "Error";
})(li || (li = {}));
var ui;
(function(t) {
  t[t.Unnecessary = 1] = "Unnecessary", t[t.Deprecated = 2] = "Deprecated";
})(ui || (ui = {}));
var go;
(function(t) {
  t[t.Inline = 1] = "Inline", t[t.Gutter = 2] = "Gutter";
})(go || (go = {}));
var po;
(function(t) {
  t[t.Normal = 1] = "Normal", t[t.Underlined = 2] = "Underlined";
})(po || (po = {}));
var bo;
(function(t) {
  t[t.UNKNOWN = 0] = "UNKNOWN", t[t.TEXTAREA = 1] = "TEXTAREA", t[t.GUTTER_GLYPH_MARGIN = 2] = "GUTTER_GLYPH_MARGIN", t[t.GUTTER_LINE_NUMBERS = 3] = "GUTTER_LINE_NUMBERS", t[t.GUTTER_LINE_DECORATIONS = 4] = "GUTTER_LINE_DECORATIONS", t[t.GUTTER_VIEW_ZONE = 5] = "GUTTER_VIEW_ZONE", t[t.CONTENT_TEXT = 6] = "CONTENT_TEXT", t[t.CONTENT_EMPTY = 7] = "CONTENT_EMPTY", t[t.CONTENT_VIEW_ZONE = 8] = "CONTENT_VIEW_ZONE", t[t.CONTENT_WIDGET = 9] = "CONTENT_WIDGET", t[t.OVERVIEW_RULER = 10] = "OVERVIEW_RULER", t[t.SCROLLBAR = 11] = "SCROLLBAR", t[t.OVERLAY_WIDGET = 12] = "OVERLAY_WIDGET", t[t.OUTSIDE_EDITOR = 13] = "OUTSIDE_EDITOR";
})(bo || (bo = {}));
var yo;
(function(t) {
  t[t.AIGenerated = 1] = "AIGenerated";
})(yo || (yo = {}));
var vo;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(vo || (vo = {}));
var wo;
(function(t) {
  t[t.TOP_RIGHT_CORNER = 0] = "TOP_RIGHT_CORNER", t[t.BOTTOM_RIGHT_CORNER = 1] = "BOTTOM_RIGHT_CORNER", t[t.TOP_CENTER = 2] = "TOP_CENTER";
})(wo || (wo = {}));
var xo;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 4] = "Right", t[t.Full = 7] = "Full";
})(xo || (xo = {}));
var _o;
(function(t) {
  t[t.Word = 0] = "Word", t[t.Line = 1] = "Line", t[t.Suggest = 2] = "Suggest";
})(_o || (_o = {}));
var Lo;
(function(t) {
  t[t.Left = 0] = "Left", t[t.Right = 1] = "Right", t[t.None = 2] = "None", t[t.LeftOfInjectedText = 3] = "LeftOfInjectedText", t[t.RightOfInjectedText = 4] = "RightOfInjectedText";
})(Lo || (Lo = {}));
var No;
(function(t) {
  t[t.Off = 0] = "Off", t[t.On = 1] = "On", t[t.Relative = 2] = "Relative", t[t.Interval = 3] = "Interval", t[t.Custom = 4] = "Custom";
})(No || (No = {}));
var Ao;
(function(t) {
  t[t.None = 0] = "None", t[t.Text = 1] = "Text", t[t.Blocks = 2] = "Blocks";
})(Ao || (Ao = {}));
var So;
(function(t) {
  t[t.Smooth = 0] = "Smooth", t[t.Immediate = 1] = "Immediate";
})(So || (So = {}));
var Eo;
(function(t) {
  t[t.Auto = 1] = "Auto", t[t.Hidden = 2] = "Hidden", t[t.Visible = 3] = "Visible";
})(Eo || (Eo = {}));
var ci;
(function(t) {
  t[t.LTR = 0] = "LTR", t[t.RTL = 1] = "RTL";
})(ci || (ci = {}));
var ko;
(function(t) {
  t.Off = "off", t.OnCode = "onCode", t.On = "on";
})(ko || (ko = {}));
var Ro;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.TriggerCharacter = 2] = "TriggerCharacter", t[t.ContentChange = 3] = "ContentChange";
})(Ro || (Ro = {}));
var Mo;
(function(t) {
  t[t.File = 0] = "File", t[t.Module = 1] = "Module", t[t.Namespace = 2] = "Namespace", t[t.Package = 3] = "Package", t[t.Class = 4] = "Class", t[t.Method = 5] = "Method", t[t.Property = 6] = "Property", t[t.Field = 7] = "Field", t[t.Constructor = 8] = "Constructor", t[t.Enum = 9] = "Enum", t[t.Interface = 10] = "Interface", t[t.Function = 11] = "Function", t[t.Variable = 12] = "Variable", t[t.Constant = 13] = "Constant", t[t.String = 14] = "String", t[t.Number = 15] = "Number", t[t.Boolean = 16] = "Boolean", t[t.Array = 17] = "Array", t[t.Object = 18] = "Object", t[t.Key = 19] = "Key", t[t.Null = 20] = "Null", t[t.EnumMember = 21] = "EnumMember", t[t.Struct = 22] = "Struct", t[t.Event = 23] = "Event", t[t.Operator = 24] = "Operator", t[t.TypeParameter = 25] = "TypeParameter";
})(Mo || (Mo = {}));
var To;
(function(t) {
  t[t.Deprecated = 1] = "Deprecated";
})(To || (To = {}));
var Co;
(function(t) {
  t[t.Hidden = 0] = "Hidden", t[t.Blink = 1] = "Blink", t[t.Smooth = 2] = "Smooth", t[t.Phase = 3] = "Phase", t[t.Expand = 4] = "Expand", t[t.Solid = 5] = "Solid";
})(Co || (Co = {}));
var Io;
(function(t) {
  t[t.Line = 1] = "Line", t[t.Block = 2] = "Block", t[t.Underline = 3] = "Underline", t[t.LineThin = 4] = "LineThin", t[t.BlockOutline = 5] = "BlockOutline", t[t.UnderlineThin = 6] = "UnderlineThin";
})(Io || (Io = {}));
var Po;
(function(t) {
  t[t.AlwaysGrowsWhenTypingAtEdges = 0] = "AlwaysGrowsWhenTypingAtEdges", t[t.NeverGrowsWhenTypingAtEdges = 1] = "NeverGrowsWhenTypingAtEdges", t[t.GrowsOnlyWhenTypingBefore = 2] = "GrowsOnlyWhenTypingBefore", t[t.GrowsOnlyWhenTypingAfter = 3] = "GrowsOnlyWhenTypingAfter";
})(Po || (Po = {}));
var Fo;
(function(t) {
  t[t.None = 0] = "None", t[t.Same = 1] = "Same", t[t.Indent = 2] = "Indent", t[t.DeepIndent = 3] = "DeepIndent";
})(Fo || (Fo = {}));
const jt = class jt {
  static chord(e, n) {
    return u0(e, n);
  }
};
jt.CtrlCmd = 2048, jt.Shift = 1024, jt.Alt = 512, jt.WinCtrl = 256;
let fi = jt;
function g0() {
  return {
    editor: void 0,
    // undefined override expected here
    languages: void 0,
    // undefined override expected here
    CancellationTokenSource: s0,
    Emitter: Re,
    KeyCode: ai,
    KeyMod: fi,
    Position: ne,
    Range: G,
    Selection: _e,
    SelectionDirection: ci,
    MarkerSeverity: li,
    MarkerTag: ui,
    Uri: $e,
    Token: d0
  };
}
const yn = class yn {
  static getChannel(e) {
    return e.getChannel(yn.CHANNEL_NAME);
  }
  static setChannel(e, n) {
    e.setChannel(yn.CHANNEL_NAME, n);
  }
};
yn.CHANNEL_NAME = "editorWorkerHost";
let hi = yn;
var Do;
class p0 {
  constructor() {
    this[Do] = "LinkedMap", this._map = /* @__PURE__ */ new Map(), this._head = void 0, this._tail = void 0, this._size = 0, this._state = 0;
  }
  clear() {
    this._map.clear(), this._head = void 0, this._tail = void 0, this._size = 0, this._state++;
  }
  isEmpty() {
    return !this._head && !this._tail;
  }
  get size() {
    return this._size;
  }
  get first() {
    return this._head?.value;
  }
  get last() {
    return this._tail?.value;
  }
  has(e) {
    return this._map.has(e);
  }
  get(e, n = 0) {
    const r = this._map.get(e);
    if (r)
      return n !== 0 && this.touch(r, n), r.value;
  }
  set(e, n, r = 0) {
    let i = this._map.get(e);
    if (i)
      i.value = n, r !== 0 && this.touch(i, r);
    else {
      switch (i = { key: e, value: n, next: void 0, previous: void 0 }, r) {
        case 0:
          this.addItemLast(i);
          break;
        case 1:
          this.addItemFirst(i);
          break;
        case 2:
          this.addItemLast(i);
          break;
        default:
          this.addItemLast(i);
          break;
      }
      this._map.set(e, i), this._size++;
    }
    return this;
  }
  delete(e) {
    return !!this.remove(e);
  }
  remove(e) {
    const n = this._map.get(e);
    if (n)
      return this._map.delete(e), this.removeItem(n), this._size--, n.value;
  }
  shift() {
    if (!this._head && !this._tail)
      return;
    if (!this._head || !this._tail)
      throw new Error("Invalid list");
    const e = this._head;
    return this._map.delete(e.key), this.removeItem(e), this._size--, e.value;
  }
  forEach(e, n) {
    const r = this._state;
    let i = this._head;
    for (; i; ) {
      if (n ? e.bind(n)(i.value, i.key, this) : e(i.value, i.key, this), this._state !== r)
        throw new Error("LinkedMap got modified during iteration.");
      i = i.next;
    }
  }
  keys() {
    const e = this, n = this._state;
    let r = this._head;
    const i = {
      [Symbol.iterator]() {
        return i;
      },
      next() {
        if (e._state !== n)
          throw new Error("LinkedMap got modified during iteration.");
        if (r) {
          const s = { value: r.key, done: !1 };
          return r = r.next, s;
        } else
          return { value: void 0, done: !0 };
      }
    };
    return i;
  }
  values() {
    const e = this, n = this._state;
    let r = this._head;
    const i = {
      [Symbol.iterator]() {
        return i;
      },
      next() {
        if (e._state !== n)
          throw new Error("LinkedMap got modified during iteration.");
        if (r) {
          const s = { value: r.value, done: !1 };
          return r = r.next, s;
        } else
          return { value: void 0, done: !0 };
      }
    };
    return i;
  }
  entries() {
    const e = this, n = this._state;
    let r = this._head;
    const i = {
      [Symbol.iterator]() {
        return i;
      },
      next() {
        if (e._state !== n)
          throw new Error("LinkedMap got modified during iteration.");
        if (r) {
          const s = { value: [r.key, r.value], done: !1 };
          return r = r.next, s;
        } else
          return { value: void 0, done: !0 };
      }
    };
    return i;
  }
  [(Do = Symbol.toStringTag, Symbol.iterator)]() {
    return this.entries();
  }
  trimOld(e) {
    if (e >= this.size)
      return;
    if (e === 0) {
      this.clear();
      return;
    }
    let n = this._head, r = this.size;
    for (; n && r > e; )
      this._map.delete(n.key), n = n.next, r--;
    this._head = n, this._size = r, n && (n.previous = void 0), this._state++;
  }
  trimNew(e) {
    if (e >= this.size)
      return;
    if (e === 0) {
      this.clear();
      return;
    }
    let n = this._tail, r = this.size;
    for (; n && r > e; )
      this._map.delete(n.key), n = n.previous, r--;
    this._tail = n, this._size = r, n && (n.next = void 0), this._state++;
  }
  addItemFirst(e) {
    if (!this._head && !this._tail)
      this._tail = e;
    else if (this._head)
      e.next = this._head, this._head.previous = e;
    else
      throw new Error("Invalid list");
    this._head = e, this._state++;
  }
  addItemLast(e) {
    if (!this._head && !this._tail)
      this._head = e;
    else if (this._tail)
      e.previous = this._tail, this._tail.next = e;
    else
      throw new Error("Invalid list");
    this._tail = e, this._state++;
  }
  removeItem(e) {
    if (e === this._head && e === this._tail)
      this._head = void 0, this._tail = void 0;
    else if (e === this._head) {
      if (!e.next)
        throw new Error("Invalid list");
      e.next.previous = void 0, this._head = e.next;
    } else if (e === this._tail) {
      if (!e.previous)
        throw new Error("Invalid list");
      e.previous.next = void 0, this._tail = e.previous;
    } else {
      const n = e.next, r = e.previous;
      if (!n || !r)
        throw new Error("Invalid list");
      n.previous = r, r.next = n;
    }
    e.next = void 0, e.previous = void 0, this._state++;
  }
  touch(e, n) {
    if (!this._head || !this._tail)
      throw new Error("Invalid list");
    if (!(n !== 1 && n !== 2)) {
      if (n === 1) {
        if (e === this._head)
          return;
        const r = e.next, i = e.previous;
        e === this._tail ? (i.next = void 0, this._tail = i) : (r.previous = i, i.next = r), e.previous = void 0, e.next = this._head, this._head.previous = e, this._head = e, this._state++;
      } else if (n === 2) {
        if (e === this._tail)
          return;
        const r = e.next, i = e.previous;
        e === this._head ? (r.previous = void 0, this._head = r) : (r.previous = i, i.next = r), e.next = void 0, e.previous = this._tail, this._tail.next = e, this._tail = e, this._state++;
      }
    }
  }
  toJSON() {
    const e = [];
    return this.forEach((n, r) => {
      e.push([r, n]);
    }), e;
  }
  fromJSON(e) {
    this.clear();
    for (const [n, r] of e)
      this.set(n, r);
  }
}
class b0 extends p0 {
  constructor(e, n = 1) {
    super(), this._limit = e, this._ratio = Math.min(Math.max(0, n), 1);
  }
  get limit() {
    return this._limit;
  }
  set limit(e) {
    this._limit = e, this.checkTrim();
  }
  get(e, n = 2) {
    return super.get(e, n);
  }
  peek(e) {
    return super.get(
      e,
      0
      /* Touch.None */
    );
  }
  set(e, n) {
    return super.set(
      e,
      n,
      2
      /* Touch.AsNew */
    ), this;
  }
  checkTrim() {
    this.size > this._limit && this.trim(Math.round(this._limit * this._ratio));
  }
}
class y0 extends b0 {
  constructor(e, n = 1) {
    super(e, n);
  }
  trim(e) {
    this.trimOld(e);
  }
  set(e, n) {
    return super.set(e, n), this.checkTrim(), this;
  }
}
class v0 {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  add(e, n) {
    let r = this.map.get(e);
    r || (r = /* @__PURE__ */ new Set(), this.map.set(e, r)), r.add(n);
  }
  delete(e, n) {
    const r = this.map.get(e);
    r && (r.delete(n), r.size === 0 && this.map.delete(e));
  }
  forEach(e, n) {
    const r = this.map.get(e);
    r && r.forEach(n);
  }
  get(e) {
    const n = this.map.get(e);
    return n || /* @__PURE__ */ new Set();
  }
}
new y0(10);
function w0(t) {
  let e = [];
  for (; Object.prototype !== t; )
    e = e.concat(Object.getOwnPropertyNames(t)), t = Object.getPrototypeOf(t);
  return e;
}
function Bo(t) {
  const e = [];
  for (const n of w0(t))
    typeof t[n] == "function" && e.push(n);
  return e;
}
function x0(t, e) {
  const n = (i) => function() {
    const s = Array.prototype.slice.call(arguments, 0);
    return e(i, s);
  }, r = {};
  for (const i of t)
    r[i] = n(i);
  return r;
}
var Vo;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 4] = "Right", t[t.Full = 7] = "Full";
})(Vo || (Vo = {}));
var Oo;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 3] = "Right";
})(Oo || (Oo = {}));
var Uo;
(function(t) {
  t[t.Both = 0] = "Both", t[t.Right = 1] = "Right", t[t.Left = 2] = "Left", t[t.None = 3] = "None";
})(Uo || (Uo = {}));
function _0(t, e, n, r, i) {
  if (r === 0)
    return !0;
  const s = e.charCodeAt(r - 1);
  if (t.get(s) !== 0 || s === 13 || s === 10)
    return !0;
  if (i > 0) {
    const o = e.charCodeAt(r);
    if (t.get(o) !== 0)
      return !0;
  }
  return !1;
}
function L0(t, e, n, r, i) {
  if (r + i === n)
    return !0;
  const s = e.charCodeAt(r + i);
  if (t.get(s) !== 0 || s === 13 || s === 10)
    return !0;
  if (i > 0) {
    const o = e.charCodeAt(r + i - 1);
    if (t.get(o) !== 0)
      return !0;
  }
  return !1;
}
function N0(t, e, n, r, i) {
  return _0(t, e, n, r, i) && L0(t, e, n, r, i);
}
class A0 {
  constructor(e, n) {
    this._wordSeparators = e, this._searchRegex = n, this._prevMatchStartIndex = -1, this._prevMatchLength = 0;
  }
  reset(e) {
    this._searchRegex.lastIndex = e, this._prevMatchStartIndex = -1, this._prevMatchLength = 0;
  }
  next(e) {
    const n = e.length;
    let r;
    do {
      if (this._prevMatchStartIndex + this._prevMatchLength === n || (r = this._searchRegex.exec(e), !r))
        return null;
      const i = r.index, s = r[0].length;
      if (i === this._prevMatchStartIndex && s === this._prevMatchLength) {
        if (s === 0) {
          bc(e, n, this._searchRegex.lastIndex) > 65535 ? this._searchRegex.lastIndex += 2 : this._searchRegex.lastIndex += 1;
          continue;
        }
        return null;
      }
      if (this._prevMatchStartIndex = i, this._prevMatchLength = s, !this._wordSeparators || N0(this._wordSeparators, e, n, i, s))
        return r;
    } while (r);
    return null;
  }
}
function S0(t, e = "Unreachable") {
  throw new Error(e);
}
function er(t) {
  if (!t()) {
    debugger;
    t(), mn(new Se("Assertion Failed"));
  }
}
function rl(t, e) {
  let n = 0;
  for (; n < t.length - 1; ) {
    const r = t[n], i = t[n + 1];
    if (!e(r, i))
      return !1;
    n++;
  }
  return !0;
}
const E0 = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
function k0(t = "") {
  let e = "(-?\\d*\\.\\d\\w*)|([^";
  for (const n of E0)
    t.indexOf(n) >= 0 || (e += "\\" + n);
  return e += "\\s]+)", new RegExp(e, "g");
}
const il = k0();
function sl(t) {
  let e = il;
  if (t && t instanceof RegExp)
    if (t.global)
      e = t;
    else {
      let n = "g";
      t.ignoreCase && (n += "i"), t.multiline && (n += "m"), t.unicode && (n += "u"), e = new RegExp(t.source, n);
    }
  return e.lastIndex = 0, e;
}
const ol = new Hu();
ol.unshift({
  maxLen: 1e3,
  windowSize: 15,
  timeBudget: 150
});
function es(t, e, n, r, i) {
  if (e = sl(e), i || (i = zn.first(ol)), n.length > i.maxLen) {
    let u = t - i.maxLen / 2;
    return u < 0 ? u = 0 : r += u, n = n.substring(u, t + i.maxLen / 2), es(t, e, n, r, i);
  }
  const s = Date.now(), o = t - 1 - r;
  let l = -1, a = null;
  for (let u = 1; !(Date.now() - s >= i.timeBudget); u++) {
    const h = o - i.windowSize * u;
    e.lastIndex = Math.max(0, h);
    const c = R0(e, n, o, l);
    if (!c && a || (a = c, h <= 0))
      break;
    l = h;
  }
  if (a) {
    const u = {
      word: a[0],
      startColumn: r + 1 + a.index,
      endColumn: r + 1 + a.index + a[0].length
    };
    return e.lastIndex = 0, u;
  }
  return null;
}
function R0(t, e, n, r) {
  let i;
  for (; i = t.exec(e); ) {
    const s = i.index || 0;
    if (s <= n && t.lastIndex >= n)
      return i;
    if (r > 0 && s > r)
      return null;
  }
  return null;
}
class M0 {
  static computeUnicodeHighlights(e, n, r) {
    const i = r ? r.startLineNumber : 1, s = r ? r.endLineNumber : e.getLineCount(), o = new $o(n), l = o.getCandidateCodePoints();
    let a;
    l === "allNonBasicAscii" ? a = new RegExp("[^\\t\\n\\r\\x20-\\x7E]", "g") : a = new RegExp(`${T0(Array.from(l))}`, "g");
    const u = new A0(null, a), h = [];
    let c = !1, m, d = 0, g = 0, p = 0;
    e: for (let y = i, _ = s; y <= _; y++) {
      const L = e.getLineContent(y), v = L.length;
      u.reset(0);
      do
        if (m = u.next(L), m) {
          let w = m.index, b = m.index + m[0].length;
          if (w > 0) {
            const D = L.charCodeAt(w - 1);
            Qn(D) && w--;
          }
          if (b + 1 < v) {
            const D = L.charCodeAt(b - 1);
            Qn(D) && b++;
          }
          const x = L.substring(w, b);
          let A = es(w + 1, il, L, 0);
          A && A.endColumn <= w + 1 && (A = null);
          const T = o.shouldHighlightNonBasicASCII(x, A ? A.word : null);
          if (T !== 0) {
            if (T === 3 ? d++ : T === 2 ? g++ : T === 1 ? p++ : S0(), h.length >= 1e3) {
              c = !0;
              break e;
            }
            h.push(new G(y, w + 1, y, b + 1));
          }
        }
      while (m);
    }
    return {
      ranges: h,
      hasMore: c,
      ambiguousCharacterCount: d,
      invisibleCharacterCount: g,
      nonBasicAsciiCharacterCount: p
    };
  }
  static computeUnicodeHighlightReason(e, n) {
    const r = new $o(n);
    switch (r.shouldHighlightNonBasicASCII(e, null)) {
      case 0:
        return null;
      case 2:
        return {
          kind: 1
          /* UnicodeHighlighterReasonKind.Invisible */
        };
      case 3: {
        const s = e.codePointAt(0), o = r.ambiguousCharacters.getPrimaryConfusable(s), l = _n.getLocales().filter((a) => !_n.getInstance(/* @__PURE__ */ new Set([...n.allowedLocales, a])).isAmbiguous(s));
        return { kind: 0, confusableWith: String.fromCodePoint(o), notAmbiguousInLocales: l };
      }
      case 1:
        return {
          kind: 2
          /* UnicodeHighlighterReasonKind.NonBasicAscii */
        };
    }
  }
}
function T0(t, e) {
  return `[${mc(t.map((r) => String.fromCodePoint(r)).join(""))}]`;
}
class $o {
  constructor(e) {
    this.options = e, this.allowedCodePoints = new Set(e.allowedCodePoints), this.ambiguousCharacters = _n.getInstance(new Set(e.allowedLocales));
  }
  getCandidateCodePoints() {
    if (this.options.nonBasicASCII)
      return "allNonBasicAscii";
    const e = /* @__PURE__ */ new Set();
    if (this.options.invisibleCharacters)
      for (const n of dn.codePoints)
        qo(String.fromCodePoint(n)) || e.add(n);
    if (this.options.ambiguousCharacters)
      for (const n of this.ambiguousCharacters.getConfusableCodePoints())
        e.add(n);
    for (const n of this.allowedCodePoints)
      e.delete(n);
    return e;
  }
  shouldHighlightNonBasicASCII(e, n) {
    const r = e.codePointAt(0);
    if (this.allowedCodePoints.has(r))
      return 0;
    if (this.options.nonBasicASCII)
      return 1;
    let i = !1, s = !1;
    if (n)
      for (const o of n) {
        const l = o.codePointAt(0), a = vc(o);
        i = i || a, !a && !this.ambiguousCharacters.isAmbiguous(l) && !dn.isInvisibleCharacter(l) && (s = !0);
      }
    return (
      /* Don't allow mixing weird looking characters with ASCII */
      !i && /* Is there an obviously weird looking character? */
      s ? 0 : this.options.invisibleCharacters && !qo(e) && dn.isInvisibleCharacter(r) ? 2 : this.options.ambiguousCharacters && this.ambiguousCharacters.isAmbiguous(r) ? 3 : 0
    );
  }
}
function qo(t) {
  return t === " " || t === `
` || t === "	";
}
class Un {
  constructor(e, n, r) {
    this.changes = e, this.moves = n, this.hitTimeout = r;
  }
}
class C0 {
  constructor(e, n) {
    this.lineRangeMapping = e, this.changes = n;
  }
}
class H {
  static addRange(e, n) {
    let r = 0;
    for (; r < n.length && n[r].endExclusive < e.start; )
      r++;
    let i = r;
    for (; i < n.length && n[i].start <= e.endExclusive; )
      i++;
    if (r === i)
      n.splice(r, 0, e);
    else {
      const s = Math.min(e.start, n[r].start), o = Math.max(e.endExclusive, n[i - 1].endExclusive);
      n.splice(r, i - r, new H(s, o));
    }
  }
  static tryCreate(e, n) {
    if (!(e > n))
      return new H(e, n);
  }
  static ofLength(e) {
    return new H(0, e);
  }
  static ofStartAndLength(e, n) {
    return new H(e, e + n);
  }
  constructor(e, n) {
    if (this.start = e, this.endExclusive = n, e > n)
      throw new Se(`Invalid range: ${this.toString()}`);
  }
  get isEmpty() {
    return this.start === this.endExclusive;
  }
  delta(e) {
    return new H(this.start + e, this.endExclusive + e);
  }
  deltaStart(e) {
    return new H(this.start + e, this.endExclusive);
  }
  deltaEnd(e) {
    return new H(this.start, this.endExclusive + e);
  }
  get length() {
    return this.endExclusive - this.start;
  }
  toString() {
    return `[${this.start}, ${this.endExclusive})`;
  }
  contains(e) {
    return this.start <= e && e < this.endExclusive;
  }
  /**
   * for all numbers n: range1.contains(n) or range2.contains(n) => range1.join(range2).contains(n)
   * The joined range is the smallest range that contains both ranges.
   */
  join(e) {
    return new H(Math.min(this.start, e.start), Math.max(this.endExclusive, e.endExclusive));
  }
  /**
   * for all numbers n: range1.contains(n) and range2.contains(n) <=> range1.intersect(range2).contains(n)
   *
   * The resulting range is empty if the ranges do not intersect, but touch.
   * If the ranges don't even touch, the result is undefined.
   */
  intersect(e) {
    const n = Math.max(this.start, e.start), r = Math.min(this.endExclusive, e.endExclusive);
    if (n <= r)
      return new H(n, r);
  }
  intersects(e) {
    const n = Math.max(this.start, e.start), r = Math.min(this.endExclusive, e.endExclusive);
    return n < r;
  }
  isBefore(e) {
    return this.endExclusive <= e.start;
  }
  isAfter(e) {
    return this.start >= e.endExclusive;
  }
  slice(e) {
    return e.slice(this.start, this.endExclusive);
  }
  substring(e) {
    return e.substring(this.start, this.endExclusive);
  }
  /**
   * Returns the given value if it is contained in this instance, otherwise the closest value that is contained.
   * The range must not be empty.
   */
  clip(e) {
    if (this.isEmpty)
      throw new Se(`Invalid clipping range: ${this.toString()}`);
    return Math.max(this.start, Math.min(this.endExclusive - 1, e));
  }
  /**
   * Returns `r := value + k * length` such that `r` is contained in this range.
   * The range must not be empty.
   *
   * E.g. `[5, 10).clipCyclic(10) === 5`, `[5, 10).clipCyclic(11) === 6` and `[5, 10).clipCyclic(4) === 9`.
   */
  clipCyclic(e) {
    if (this.isEmpty)
      throw new Se(`Invalid clipping range: ${this.toString()}`);
    return e < this.start ? this.endExclusive - (this.start - e) % this.length : e >= this.endExclusive ? this.start + (e - this.start) % this.length : e;
  }
  forEach(e) {
    for (let n = this.start; n < this.endExclusive; n++)
      e(n);
  }
}
function Yt(t, e) {
  const n = Ln(t, e);
  return n === -1 ? void 0 : t[n];
}
function Ln(t, e, n = 0, r = t.length) {
  let i = n, s = r;
  for (; i < s; ) {
    const o = Math.floor((i + s) / 2);
    e(t[o]) ? i = o + 1 : s = o;
  }
  return i - 1;
}
function I0(t, e) {
  const n = mi(t, e);
  return n === t.length ? void 0 : t[n];
}
function mi(t, e, n = 0, r = t.length) {
  let i = n, s = r;
  for (; i < s; ) {
    const o = Math.floor((i + s) / 2);
    e(t[o]) ? s = o : i = o + 1;
  }
  return i;
}
const gr = class gr {
  constructor(e) {
    this._array = e, this._findLastMonotonousLastIdx = 0;
  }
  /**
   * The predicate must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
   * For subsequent calls, current predicate must be weaker than (or equal to) the previous predicate, i.e. more entries must be `true`.
   */
  findLastMonotonous(e) {
    if (gr.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (const r of this._array)
          if (this._prevFindLastPredicate(r) && !e(r))
            throw new Error("MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.");
      }
      this._prevFindLastPredicate = e;
    }
    const n = Ln(this._array, e, this._findLastMonotonousLastIdx);
    return this._findLastMonotonousLastIdx = n + 1, n === -1 ? void 0 : this._array[n];
  }
};
gr.assertInvariants = !1;
let tr = gr;
class $ {
  static fromRangeInclusive(e) {
    return new $(e.startLineNumber, e.endLineNumber + 1);
  }
  /**
   * @param lineRanges An array of sorted line ranges.
   */
  static joinMany(e) {
    if (e.length === 0)
      return [];
    let n = new qe(e[0].slice());
    for (let r = 1; r < e.length; r++)
      n = n.getUnion(new qe(e[r].slice()));
    return n.ranges;
  }
  static join(e) {
    if (e.length === 0)
      throw new Se("lineRanges cannot be empty");
    let n = e[0].startLineNumber, r = e[0].endLineNumberExclusive;
    for (let i = 1; i < e.length; i++)
      n = Math.min(n, e[i].startLineNumber), r = Math.max(r, e[i].endLineNumberExclusive);
    return new $(n, r);
  }
  static ofLength(e, n) {
    return new $(e, e + n);
  }
  /**
   * @internal
   */
  static deserialize(e) {
    return new $(e[0], e[1]);
  }
  constructor(e, n) {
    if (e > n)
      throw new Se(`startLineNumber ${e} cannot be after endLineNumberExclusive ${n}`);
    this.startLineNumber = e, this.endLineNumberExclusive = n;
  }
  /**
   * Indicates if this line range contains the given line number.
   */
  contains(e) {
    return this.startLineNumber <= e && e < this.endLineNumberExclusive;
  }
  /**
   * Indicates if this line range is empty.
   */
  get isEmpty() {
    return this.startLineNumber === this.endLineNumberExclusive;
  }
  /**
   * Moves this line range by the given offset of line numbers.
   */
  delta(e) {
    return new $(this.startLineNumber + e, this.endLineNumberExclusive + e);
  }
  deltaLength(e) {
    return new $(this.startLineNumber, this.endLineNumberExclusive + e);
  }
  /**
   * The number of lines this line range spans.
   */
  get length() {
    return this.endLineNumberExclusive - this.startLineNumber;
  }
  /**
   * Creates a line range that combines this and the given line range.
   */
  join(e) {
    return new $(Math.min(this.startLineNumber, e.startLineNumber), Math.max(this.endLineNumberExclusive, e.endLineNumberExclusive));
  }
  toString() {
    return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
  }
  /**
   * The resulting range is empty if the ranges do not intersect, but touch.
   * If the ranges don't even touch, the result is undefined.
   */
  intersect(e) {
    const n = Math.max(this.startLineNumber, e.startLineNumber), r = Math.min(this.endLineNumberExclusive, e.endLineNumberExclusive);
    if (n <= r)
      return new $(n, r);
  }
  intersectsStrict(e) {
    return this.startLineNumber < e.endLineNumberExclusive && e.startLineNumber < this.endLineNumberExclusive;
  }
  overlapOrTouch(e) {
    return this.startLineNumber <= e.endLineNumberExclusive && e.startLineNumber <= this.endLineNumberExclusive;
  }
  equals(e) {
    return this.startLineNumber === e.startLineNumber && this.endLineNumberExclusive === e.endLineNumberExclusive;
  }
  toInclusiveRange() {
    return this.isEmpty ? null : new G(this.startLineNumber, 1, this.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER);
  }
  /**
   * @deprecated Using this function is discouraged because it might lead to bugs: The end position is not guaranteed to be a valid position!
  */
  toExclusiveRange() {
    return new G(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
  }
  mapToLineArray(e) {
    const n = [];
    for (let r = this.startLineNumber; r < this.endLineNumberExclusive; r++)
      n.push(e(r));
    return n;
  }
  forEach(e) {
    for (let n = this.startLineNumber; n < this.endLineNumberExclusive; n++)
      e(n);
  }
  /**
   * @internal
   */
  serialize() {
    return [this.startLineNumber, this.endLineNumberExclusive];
  }
  includes(e) {
    return this.startLineNumber <= e && e < this.endLineNumberExclusive;
  }
  /**
   * Converts this 1-based line range to a 0-based offset range (subtracts 1!).
   * @internal
   */
  toOffsetRange() {
    return new H(this.startLineNumber - 1, this.endLineNumberExclusive - 1);
  }
}
class qe {
  constructor(e = []) {
    this._normalizedRanges = e;
  }
  get ranges() {
    return this._normalizedRanges;
  }
  addRange(e) {
    if (e.length === 0)
      return;
    const n = mi(this._normalizedRanges, (i) => i.endLineNumberExclusive >= e.startLineNumber), r = Ln(this._normalizedRanges, (i) => i.startLineNumber <= e.endLineNumberExclusive) + 1;
    if (n === r)
      this._normalizedRanges.splice(n, 0, e);
    else if (n === r - 1) {
      const i = this._normalizedRanges[n];
      this._normalizedRanges[n] = i.join(e);
    } else {
      const i = this._normalizedRanges[n].join(this._normalizedRanges[r - 1]).join(e);
      this._normalizedRanges.splice(n, r - n, i);
    }
  }
  contains(e) {
    const n = Yt(this._normalizedRanges, (r) => r.startLineNumber <= e);
    return !!n && n.endLineNumberExclusive > e;
  }
  intersects(e) {
    const n = Yt(this._normalizedRanges, (r) => r.startLineNumber < e.endLineNumberExclusive);
    return !!n && n.endLineNumberExclusive > e.startLineNumber;
  }
  getUnion(e) {
    if (this._normalizedRanges.length === 0)
      return e;
    if (e._normalizedRanges.length === 0)
      return this;
    const n = [];
    let r = 0, i = 0, s = null;
    for (; r < this._normalizedRanges.length || i < e._normalizedRanges.length; ) {
      let o = null;
      if (r < this._normalizedRanges.length && i < e._normalizedRanges.length) {
        const l = this._normalizedRanges[r], a = e._normalizedRanges[i];
        l.startLineNumber < a.startLineNumber ? (o = l, r++) : (o = a, i++);
      } else r < this._normalizedRanges.length ? (o = this._normalizedRanges[r], r++) : (o = e._normalizedRanges[i], i++);
      s === null ? s = o : s.endLineNumberExclusive >= o.startLineNumber ? s = new $(s.startLineNumber, Math.max(s.endLineNumberExclusive, o.endLineNumberExclusive)) : (n.push(s), s = o);
    }
    return s !== null && n.push(s), new qe(n);
  }
  /**
   * Subtracts all ranges in this set from `range` and returns the result.
   */
  subtractFrom(e) {
    const n = mi(this._normalizedRanges, (o) => o.endLineNumberExclusive >= e.startLineNumber), r = Ln(this._normalizedRanges, (o) => o.startLineNumber <= e.endLineNumberExclusive) + 1;
    if (n === r)
      return new qe([e]);
    const i = [];
    let s = e.startLineNumber;
    for (let o = n; o < r; o++) {
      const l = this._normalizedRanges[o];
      l.startLineNumber > s && i.push(new $(s, l.startLineNumber)), s = l.endLineNumberExclusive;
    }
    return s < e.endLineNumberExclusive && i.push(new $(s, e.endLineNumberExclusive)), new qe(i);
  }
  toString() {
    return this._normalizedRanges.map((e) => e.toString()).join(", ");
  }
  getIntersection(e) {
    const n = [];
    let r = 0, i = 0;
    for (; r < this._normalizedRanges.length && i < e._normalizedRanges.length; ) {
      const s = this._normalizedRanges[r], o = e._normalizedRanges[i], l = s.intersect(o);
      l && !l.isEmpty && n.push(l), s.endLineNumberExclusive < o.endLineNumberExclusive ? r++ : i++;
    }
    return new qe(n);
  }
  getWithDelta(e) {
    return new qe(this._normalizedRanges.map((n) => n.delta(e)));
  }
}
const lt = class lt {
  static betweenPositions(e, n) {
    return e.lineNumber === n.lineNumber ? new lt(0, n.column - e.column) : new lt(n.lineNumber - e.lineNumber, n.column - 1);
  }
  static ofRange(e) {
    return lt.betweenPositions(e.getStartPosition(), e.getEndPosition());
  }
  static ofText(e) {
    let n = 0, r = 0;
    for (const i of e)
      i === `
` ? (n++, r = 0) : r++;
    return new lt(n, r);
  }
  constructor(e, n) {
    this.lineCount = e, this.columnCount = n;
  }
  isGreaterThanOrEqualTo(e) {
    return this.lineCount !== e.lineCount ? this.lineCount > e.lineCount : this.columnCount >= e.columnCount;
  }
  createRange(e) {
    return this.lineCount === 0 ? new G(e.lineNumber, e.column, e.lineNumber, e.column + this.columnCount) : new G(e.lineNumber, e.column, e.lineNumber + this.lineCount, this.columnCount + 1);
  }
  addToPosition(e) {
    return this.lineCount === 0 ? new ne(e.lineNumber, e.column + this.columnCount) : new ne(e.lineNumber + this.lineCount, this.columnCount + 1);
  }
  toString() {
    return `${this.lineCount},${this.columnCount}`;
  }
};
lt.zero = new lt(0, 0);
let jo = lt;
class P0 {
  constructor(e, n) {
    this.range = e, this.text = n;
  }
  toSingleEditOperation() {
    return {
      range: this.range,
      text: this.text
    };
  }
}
class Te {
  static inverse(e, n, r) {
    const i = [];
    let s = 1, o = 1;
    for (const a of e) {
      const u = new Te(new $(s, a.original.startLineNumber), new $(o, a.modified.startLineNumber));
      u.modified.isEmpty || i.push(u), s = a.original.endLineNumberExclusive, o = a.modified.endLineNumberExclusive;
    }
    const l = new Te(new $(s, n + 1), new $(o, r + 1));
    return l.modified.isEmpty || i.push(l), i;
  }
  static clip(e, n, r) {
    const i = [];
    for (const s of e) {
      const o = s.original.intersect(n), l = s.modified.intersect(r);
      o && !o.isEmpty && l && !l.isEmpty && i.push(new Te(o, l));
    }
    return i;
  }
  constructor(e, n) {
    this.original = e, this.modified = n;
  }
  toString() {
    return `{${this.original.toString()}->${this.modified.toString()}}`;
  }
  flip() {
    return new Te(this.modified, this.original);
  }
  join(e) {
    return new Te(this.original.join(e.original), this.modified.join(e.modified));
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping() {
    const e = this.original.toInclusiveRange(), n = this.modified.toInclusiveRange();
    if (e && n)
      return new Pe(e, n);
    if (this.original.startLineNumber === 1 || this.modified.startLineNumber === 1) {
      if (!(this.modified.startLineNumber === 1 && this.original.startLineNumber === 1))
        throw new Se("not a valid diff");
      return new Pe(new G(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1), new G(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1));
    } else
      return new Pe(new G(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), new G(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER));
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping2(e, n) {
    if (Wo(this.original.endLineNumberExclusive, e) && Wo(this.modified.endLineNumberExclusive, n))
      return new Pe(new G(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1), new G(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1));
    if (!this.original.isEmpty && !this.modified.isEmpty)
      return new Pe(G.fromPositions(new ne(this.original.startLineNumber, 1), Ct(new ne(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), e)), G.fromPositions(new ne(this.modified.startLineNumber, 1), Ct(new ne(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), n)));
    if (this.original.startLineNumber > 1 && this.modified.startLineNumber > 1)
      return new Pe(G.fromPositions(Ct(new ne(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER), e), Ct(new ne(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), e)), G.fromPositions(Ct(new ne(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER), n), Ct(new ne(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), n)));
    throw new Se();
  }
}
function Ct(t, e) {
  if (t.lineNumber < 1)
    return new ne(1, 1);
  if (t.lineNumber > e.length)
    return new ne(e.length, e[e.length - 1].length + 1);
  const n = e[t.lineNumber - 1];
  return t.column > n.length + 1 ? new ne(t.lineNumber, n.length + 1) : t;
}
function Wo(t, e) {
  return t >= 1 && t <= e.length;
}
class Ze extends Te {
  static fromRangeMappings(e) {
    const n = $.join(e.map((i) => $.fromRangeInclusive(i.originalRange))), r = $.join(e.map((i) => $.fromRangeInclusive(i.modifiedRange)));
    return new Ze(n, r, e);
  }
  constructor(e, n, r) {
    super(e, n), this.innerChanges = r;
  }
  flip() {
    return new Ze(this.modified, this.original, this.innerChanges?.map((e) => e.flip()));
  }
  withInnerChangesFromLineRanges() {
    return new Ze(this.original, this.modified, [this.toRangeMapping()]);
  }
}
class Pe {
  static assertSorted(e) {
    for (let n = 1; n < e.length; n++) {
      const r = e[n - 1], i = e[n];
      if (!(r.originalRange.getEndPosition().isBeforeOrEqual(i.originalRange.getStartPosition()) && r.modifiedRange.getEndPosition().isBeforeOrEqual(i.modifiedRange.getStartPosition())))
        throw new Se("Range mappings must be sorted");
    }
  }
  constructor(e, n) {
    this.originalRange = e, this.modifiedRange = n;
  }
  toString() {
    return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`;
  }
  flip() {
    return new Pe(this.modifiedRange, this.originalRange);
  }
  /**
   * Creates a single text edit that describes the change from the original to the modified text.
  */
  toTextEdit(e) {
    const n = e.getValueOfRange(this.modifiedRange);
    return new P0(this.originalRange, n);
  }
}
const F0 = 3;
class D0 {
  computeDiff(e, n, r) {
    const s = new O0(e, n, {
      maxComputationTime: r.maxComputationTimeMs,
      shouldIgnoreTrimWhitespace: r.ignoreTrimWhitespace,
      shouldComputeCharChanges: !0,
      shouldMakePrettyDiff: !0,
      shouldPostProcessCharChanges: !0
    }).computeDiff(), o = [];
    let l = null;
    for (const a of s.changes) {
      let u;
      a.originalEndLineNumber === 0 ? u = new $(a.originalStartLineNumber + 1, a.originalStartLineNumber + 1) : u = new $(a.originalStartLineNumber, a.originalEndLineNumber + 1);
      let h;
      a.modifiedEndLineNumber === 0 ? h = new $(a.modifiedStartLineNumber + 1, a.modifiedStartLineNumber + 1) : h = new $(a.modifiedStartLineNumber, a.modifiedEndLineNumber + 1);
      let c = new Ze(u, h, a.charChanges?.map((m) => new Pe(new G(m.originalStartLineNumber, m.originalStartColumn, m.originalEndLineNumber, m.originalEndColumn), new G(m.modifiedStartLineNumber, m.modifiedStartColumn, m.modifiedEndLineNumber, m.modifiedEndColumn))));
      l && (l.modified.endLineNumberExclusive === c.modified.startLineNumber || l.original.endLineNumberExclusive === c.original.startLineNumber) && (c = new Ze(l.original.join(c.original), l.modified.join(c.modified), l.innerChanges && c.innerChanges ? l.innerChanges.concat(c.innerChanges) : void 0), o.pop()), o.push(c), l = c;
    }
    return er(() => rl(o, (a, u) => u.original.startLineNumber - a.original.endLineNumberExclusive === u.modified.startLineNumber - a.modified.endLineNumberExclusive && // There has to be an unchanged line in between (otherwise both diffs should have been joined)
    a.original.endLineNumberExclusive < u.original.startLineNumber && a.modified.endLineNumberExclusive < u.modified.startLineNumber)), new Un(o, [], s.quitEarly);
  }
}
function al(t, e, n, r) {
  return new ut(t, e, n).ComputeDiff(r);
}
let Ho = class {
  constructor(e) {
    const n = [], r = [];
    for (let i = 0, s = e.length; i < s; i++)
      n[i] = di(e[i], 1), r[i] = gi(e[i], 1);
    this.lines = e, this._startColumns = n, this._endColumns = r;
  }
  getElements() {
    const e = [];
    for (let n = 0, r = this.lines.length; n < r; n++)
      e[n] = this.lines[n].substring(this._startColumns[n] - 1, this._endColumns[n] - 1);
    return e;
  }
  getStrictElement(e) {
    return this.lines[e];
  }
  getStartLineNumber(e) {
    return e + 1;
  }
  getEndLineNumber(e) {
    return e + 1;
  }
  createCharSequence(e, n, r) {
    const i = [], s = [], o = [];
    let l = 0;
    for (let a = n; a <= r; a++) {
      const u = this.lines[a], h = e ? this._startColumns[a] : 1, c = e ? this._endColumns[a] : u.length + 1;
      for (let m = h; m < c; m++)
        i[l] = u.charCodeAt(m - 1), s[l] = a + 1, o[l] = m, l++;
      !e && a < r && (i[l] = 10, s[l] = a + 1, o[l] = u.length + 1, l++);
    }
    return new B0(i, s, o);
  }
};
class B0 {
  constructor(e, n, r) {
    this._charCodes = e, this._lineNumbers = n, this._columns = r;
  }
  toString() {
    return "[" + this._charCodes.map((e, n) => (e === 10 ? "\\n" : String.fromCharCode(e)) + `-(${this._lineNumbers[n]},${this._columns[n]})`).join(", ") + "]";
  }
  _assertIndex(e, n) {
    if (e < 0 || e >= n.length)
      throw new Error("Illegal index");
  }
  getElements() {
    return this._charCodes;
  }
  getStartLineNumber(e) {
    return e > 0 && e === this._lineNumbers.length ? this.getEndLineNumber(e - 1) : (this._assertIndex(e, this._lineNumbers), this._lineNumbers[e]);
  }
  getEndLineNumber(e) {
    return e === -1 ? this.getStartLineNumber(e + 1) : (this._assertIndex(e, this._lineNumbers), this._charCodes[e] === 10 ? this._lineNumbers[e] + 1 : this._lineNumbers[e]);
  }
  getStartColumn(e) {
    return e > 0 && e === this._columns.length ? this.getEndColumn(e - 1) : (this._assertIndex(e, this._columns), this._columns[e]);
  }
  getEndColumn(e) {
    return e === -1 ? this.getStartColumn(e + 1) : (this._assertIndex(e, this._columns), this._charCodes[e] === 10 ? 1 : this._columns[e] + 1);
  }
}
class Gt {
  constructor(e, n, r, i, s, o, l, a) {
    this.originalStartLineNumber = e, this.originalStartColumn = n, this.originalEndLineNumber = r, this.originalEndColumn = i, this.modifiedStartLineNumber = s, this.modifiedStartColumn = o, this.modifiedEndLineNumber = l, this.modifiedEndColumn = a;
  }
  static createFromDiffChange(e, n, r) {
    const i = n.getStartLineNumber(e.originalStart), s = n.getStartColumn(e.originalStart), o = n.getEndLineNumber(e.originalStart + e.originalLength - 1), l = n.getEndColumn(e.originalStart + e.originalLength - 1), a = r.getStartLineNumber(e.modifiedStart), u = r.getStartColumn(e.modifiedStart), h = r.getEndLineNumber(e.modifiedStart + e.modifiedLength - 1), c = r.getEndColumn(e.modifiedStart + e.modifiedLength - 1);
    return new Gt(i, s, o, l, a, u, h, c);
  }
}
function V0(t) {
  if (t.length <= 1)
    return t;
  const e = [t[0]];
  let n = e[0];
  for (let r = 1, i = t.length; r < i; r++) {
    const s = t[r], o = s.originalStart - (n.originalStart + n.originalLength), l = s.modifiedStart - (n.modifiedStart + n.modifiedLength);
    Math.min(o, l) < F0 ? (n.originalLength = s.originalStart + s.originalLength - n.originalStart, n.modifiedLength = s.modifiedStart + s.modifiedLength - n.modifiedStart) : (e.push(s), n = s);
  }
  return e;
}
class gn {
  constructor(e, n, r, i, s) {
    this.originalStartLineNumber = e, this.originalEndLineNumber = n, this.modifiedStartLineNumber = r, this.modifiedEndLineNumber = i, this.charChanges = s;
  }
  static createFromDiffResult(e, n, r, i, s, o, l) {
    let a, u, h, c, m;
    if (n.originalLength === 0 ? (a = r.getStartLineNumber(n.originalStart) - 1, u = 0) : (a = r.getStartLineNumber(n.originalStart), u = r.getEndLineNumber(n.originalStart + n.originalLength - 1)), n.modifiedLength === 0 ? (h = i.getStartLineNumber(n.modifiedStart) - 1, c = 0) : (h = i.getStartLineNumber(n.modifiedStart), c = i.getEndLineNumber(n.modifiedStart + n.modifiedLength - 1)), o && n.originalLength > 0 && n.originalLength < 20 && n.modifiedLength > 0 && n.modifiedLength < 20 && s()) {
      const d = r.createCharSequence(e, n.originalStart, n.originalStart + n.originalLength - 1), g = i.createCharSequence(e, n.modifiedStart, n.modifiedStart + n.modifiedLength - 1);
      if (d.getElements().length > 0 && g.getElements().length > 0) {
        let p = al(d, g, s, !0).changes;
        l && (p = V0(p)), m = [];
        for (let y = 0, _ = p.length; y < _; y++)
          m.push(Gt.createFromDiffChange(p[y], d, g));
      }
    }
    return new gn(a, u, h, c, m);
  }
}
class O0 {
  constructor(e, n, r) {
    this.shouldComputeCharChanges = r.shouldComputeCharChanges, this.shouldPostProcessCharChanges = r.shouldPostProcessCharChanges, this.shouldIgnoreTrimWhitespace = r.shouldIgnoreTrimWhitespace, this.shouldMakePrettyDiff = r.shouldMakePrettyDiff, this.originalLines = e, this.modifiedLines = n, this.original = new Ho(e), this.modified = new Ho(n), this.continueLineDiff = zo(r.maxComputationTime), this.continueCharDiff = zo(r.maxComputationTime === 0 ? 0 : Math.min(r.maxComputationTime, 5e3));
  }
  computeDiff() {
    if (this.original.lines.length === 1 && this.original.lines[0].length === 0)
      return this.modified.lines.length === 1 && this.modified.lines[0].length === 0 ? {
        quitEarly: !1,
        changes: []
      } : {
        quitEarly: !1,
        changes: [{
          originalStartLineNumber: 1,
          originalEndLineNumber: 1,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: this.modified.lines.length,
          charChanges: void 0
        }]
      };
    if (this.modified.lines.length === 1 && this.modified.lines[0].length === 0)
      return {
        quitEarly: !1,
        changes: [{
          originalStartLineNumber: 1,
          originalEndLineNumber: this.original.lines.length,
          modifiedStartLineNumber: 1,
          modifiedEndLineNumber: 1,
          charChanges: void 0
        }]
      };
    const e = al(this.original, this.modified, this.continueLineDiff, this.shouldMakePrettyDiff), n = e.changes, r = e.quitEarly;
    if (this.shouldIgnoreTrimWhitespace) {
      const l = [];
      for (let a = 0, u = n.length; a < u; a++)
        l.push(gn.createFromDiffResult(this.shouldIgnoreTrimWhitespace, n[a], this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges));
      return {
        quitEarly: r,
        changes: l
      };
    }
    const i = [];
    let s = 0, o = 0;
    for (let l = -1, a = n.length; l < a; l++) {
      const u = l + 1 < a ? n[l + 1] : null, h = u ? u.originalStart : this.originalLines.length, c = u ? u.modifiedStart : this.modifiedLines.length;
      for (; s < h && o < c; ) {
        const m = this.originalLines[s], d = this.modifiedLines[o];
        if (m !== d) {
          {
            let g = di(m, 1), p = di(d, 1);
            for (; g > 1 && p > 1; ) {
              const y = m.charCodeAt(g - 2), _ = d.charCodeAt(p - 2);
              if (y !== _)
                break;
              g--, p--;
            }
            (g > 1 || p > 1) && this._pushTrimWhitespaceCharChange(i, s + 1, 1, g, o + 1, 1, p);
          }
          {
            let g = gi(m, 1), p = gi(d, 1);
            const y = m.length + 1, _ = d.length + 1;
            for (; g < y && p < _; ) {
              const L = m.charCodeAt(g - 1), v = m.charCodeAt(p - 1);
              if (L !== v)
                break;
              g++, p++;
            }
            (g < y || p < _) && this._pushTrimWhitespaceCharChange(i, s + 1, g, y, o + 1, p, _);
          }
        }
        s++, o++;
      }
      u && (i.push(gn.createFromDiffResult(this.shouldIgnoreTrimWhitespace, u, this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges)), s += u.originalLength, o += u.modifiedLength);
    }
    return {
      quitEarly: r,
      changes: i
    };
  }
  _pushTrimWhitespaceCharChange(e, n, r, i, s, o, l) {
    if (this._mergeTrimWhitespaceCharChange(e, n, r, i, s, o, l))
      return;
    let a;
    this.shouldComputeCharChanges && (a = [new Gt(n, r, n, i, s, o, s, l)]), e.push(new gn(n, n, s, s, a));
  }
  _mergeTrimWhitespaceCharChange(e, n, r, i, s, o, l) {
    const a = e.length;
    if (a === 0)
      return !1;
    const u = e[a - 1];
    return u.originalEndLineNumber === 0 || u.modifiedEndLineNumber === 0 ? !1 : u.originalEndLineNumber === n && u.modifiedEndLineNumber === s ? (this.shouldComputeCharChanges && u.charChanges && u.charChanges.push(new Gt(n, r, n, i, s, o, s, l)), !0) : u.originalEndLineNumber + 1 === n && u.modifiedEndLineNumber + 1 === s ? (u.originalEndLineNumber = n, u.modifiedEndLineNumber = s, this.shouldComputeCharChanges && u.charChanges && u.charChanges.push(new Gt(n, r, n, i, s, o, s, l)), !0) : !1;
  }
}
function di(t, e) {
  const n = gc(t);
  return n === -1 ? e : n + 1;
}
function gi(t, e) {
  const n = pc(t);
  return n === -1 ? e : n + 2;
}
function zo(t) {
  if (t === 0)
    return () => !0;
  const e = Date.now();
  return () => Date.now() - e < t;
}
function U0(t, e, n = (r, i) => r === i) {
  if (t === e)
    return !0;
  if (!t || !e || t.length !== e.length)
    return !1;
  for (let r = 0, i = t.length; r < i; r++)
    if (!n(t[r], e[r]))
      return !1;
  return !0;
}
function* $0(t, e) {
  let n, r;
  for (const i of t)
    r !== void 0 && e(r, i) ? n.push(i) : (n && (yield n), n = [i]), r = i;
  n && (yield n);
}
function q0(t, e) {
  for (let n = 0; n <= t.length; n++)
    e(n === 0 ? void 0 : t[n - 1], n === t.length ? void 0 : t[n]);
}
function j0(t, e) {
  for (let n = 0; n < t.length; n++)
    e(n === 0 ? void 0 : t[n - 1], t[n], n + 1 === t.length ? void 0 : t[n + 1]);
}
function W0(t, e) {
  for (const n of e)
    t.push(n);
}
var pi;
(function(t) {
  function e(s) {
    return s < 0;
  }
  t.isLessThan = e;
  function n(s) {
    return s <= 0;
  }
  t.isLessThanOrEqual = n;
  function r(s) {
    return s > 0;
  }
  t.isGreaterThan = r;
  function i(s) {
    return s === 0;
  }
  t.isNeitherLessOrGreaterThan = i, t.greaterThan = 1, t.lessThan = -1, t.neitherLessOrGreaterThan = 0;
})(pi || (pi = {}));
function $n(t, e) {
  return (n, r) => e(t(n), t(r));
}
const qn = (t, e) => t - e;
function H0(t) {
  return (e, n) => -t(e, n);
}
const Wt = class Wt {
  constructor(e) {
    this.iterate = e;
  }
  toArray() {
    const e = [];
    return this.iterate((n) => (e.push(n), !0)), e;
  }
  filter(e) {
    return new Wt((n) => this.iterate((r) => e(r) ? n(r) : !0));
  }
  map(e) {
    return new Wt((n) => this.iterate((r) => n(e(r))));
  }
  findLast(e) {
    let n;
    return this.iterate((r) => (e(r) && (n = r), !0)), n;
  }
  findLastMaxBy(e) {
    let n, r = !0;
    return this.iterate((i) => ((r || pi.isGreaterThan(e(i, n))) && (r = !1, n = i), !0)), n;
  }
};
Wt.empty = new Wt((e) => {
});
let Go = Wt;
class Ke {
  static trivial(e, n) {
    return new Ke([new K(H.ofLength(e.length), H.ofLength(n.length))], !1);
  }
  static trivialTimedOut(e, n) {
    return new Ke([new K(H.ofLength(e.length), H.ofLength(n.length))], !0);
  }
  constructor(e, n) {
    this.diffs = e, this.hitTimeout = n;
  }
}
class K {
  static invert(e, n) {
    const r = [];
    return q0(e, (i, s) => {
      r.push(K.fromOffsetPairs(i ? i.getEndExclusives() : Xe.zero, s ? s.getStarts() : new Xe(n, (i ? i.seq2Range.endExclusive - i.seq1Range.endExclusive : 0) + n)));
    }), r;
  }
  static fromOffsetPairs(e, n) {
    return new K(new H(e.offset1, n.offset1), new H(e.offset2, n.offset2));
  }
  static assertSorted(e) {
    let n;
    for (const r of e) {
      if (n && !(n.seq1Range.endExclusive <= r.seq1Range.start && n.seq2Range.endExclusive <= r.seq2Range.start))
        throw new Se("Sequence diffs must be sorted");
      n = r;
    }
  }
  constructor(e, n) {
    this.seq1Range = e, this.seq2Range = n;
  }
  swap() {
    return new K(this.seq2Range, this.seq1Range);
  }
  toString() {
    return `${this.seq1Range} <-> ${this.seq2Range}`;
  }
  join(e) {
    return new K(this.seq1Range.join(e.seq1Range), this.seq2Range.join(e.seq2Range));
  }
  delta(e) {
    return e === 0 ? this : new K(this.seq1Range.delta(e), this.seq2Range.delta(e));
  }
  deltaStart(e) {
    return e === 0 ? this : new K(this.seq1Range.deltaStart(e), this.seq2Range.deltaStart(e));
  }
  deltaEnd(e) {
    return e === 0 ? this : new K(this.seq1Range.deltaEnd(e), this.seq2Range.deltaEnd(e));
  }
  intersect(e) {
    const n = this.seq1Range.intersect(e.seq1Range), r = this.seq2Range.intersect(e.seq2Range);
    if (!(!n || !r))
      return new K(n, r);
  }
  getStarts() {
    return new Xe(this.seq1Range.start, this.seq2Range.start);
  }
  getEndExclusives() {
    return new Xe(this.seq1Range.endExclusive, this.seq2Range.endExclusive);
  }
}
const bt = class bt {
  constructor(e, n) {
    this.offset1 = e, this.offset2 = n;
  }
  toString() {
    return `${this.offset1} <-> ${this.offset2}`;
  }
  delta(e) {
    return e === 0 ? this : new bt(this.offset1 + e, this.offset2 + e);
  }
  equals(e) {
    return this.offset1 === e.offset1 && this.offset2 === e.offset2;
  }
};
bt.zero = new bt(0, 0), bt.max = new bt(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
let Xe = bt;
const pr = class pr {
  isValid() {
    return !0;
  }
};
pr.instance = new pr();
let Nn = pr;
class z0 {
  constructor(e) {
    if (this.timeout = e, this.startTime = Date.now(), this.valid = !0, e <= 0)
      throw new Se("timeout must be positive");
  }
  // Recommendation: Set a log-point `{this.disable()}` in the body
  isValid() {
    if (!(Date.now() - this.startTime < this.timeout) && this.valid) {
      this.valid = !1;
      debugger;
    }
    return this.valid;
  }
}
class Fr {
  constructor(e, n) {
    this.width = e, this.height = n, this.array = [], this.array = new Array(e * n);
  }
  get(e, n) {
    return this.array[e + n * this.width];
  }
  set(e, n, r) {
    this.array[e + n * this.width] = r;
  }
}
function bi(t) {
  return t === 32 || t === 9;
}
const vn = class vn {
  static getKey(e) {
    let n = this.chrKeys.get(e);
    return n === void 0 && (n = this.chrKeys.size, this.chrKeys.set(e, n)), n;
  }
  constructor(e, n, r) {
    this.range = e, this.lines = n, this.source = r, this.histogram = [];
    let i = 0;
    for (let s = e.startLineNumber - 1; s < e.endLineNumberExclusive - 1; s++) {
      const o = n[s];
      for (let a = 0; a < o.length; a++) {
        i++;
        const u = o[a], h = vn.getKey(u);
        this.histogram[h] = (this.histogram[h] || 0) + 1;
      }
      i++;
      const l = vn.getKey(`
`);
      this.histogram[l] = (this.histogram[l] || 0) + 1;
    }
    this.totalCount = i;
  }
  computeSimilarity(e) {
    let n = 0;
    const r = Math.max(this.histogram.length, e.histogram.length);
    for (let i = 0; i < r; i++)
      n += Math.abs((this.histogram[i] ?? 0) - (e.histogram[i] ?? 0));
    return 1 - n / (this.totalCount + e.totalCount);
  }
};
vn.chrKeys = /* @__PURE__ */ new Map();
let nr = vn;
class G0 {
  compute(e, n, r = Nn.instance, i) {
    if (e.length === 0 || n.length === 0)
      return Ke.trivial(e, n);
    const s = new Fr(e.length, n.length), o = new Fr(e.length, n.length), l = new Fr(e.length, n.length);
    for (let g = 0; g < e.length; g++)
      for (let p = 0; p < n.length; p++) {
        if (!r.isValid())
          return Ke.trivialTimedOut(e, n);
        const y = g === 0 ? 0 : s.get(g - 1, p), _ = p === 0 ? 0 : s.get(g, p - 1);
        let L;
        e.getElement(g) === n.getElement(p) ? (g === 0 || p === 0 ? L = 0 : L = s.get(g - 1, p - 1), g > 0 && p > 0 && o.get(g - 1, p - 1) === 3 && (L += l.get(g - 1, p - 1)), L += i ? i(g, p) : 1) : L = -1;
        const v = Math.max(y, _, L);
        if (v === L) {
          const w = g > 0 && p > 0 ? l.get(g - 1, p - 1) : 0;
          l.set(g, p, w + 1), o.set(g, p, 3);
        } else v === y ? (l.set(g, p, 0), o.set(g, p, 1)) : v === _ && (l.set(g, p, 0), o.set(g, p, 2));
        s.set(g, p, v);
      }
    const a = [];
    let u = e.length, h = n.length;
    function c(g, p) {
      (g + 1 !== u || p + 1 !== h) && a.push(new K(new H(g + 1, u), new H(p + 1, h))), u = g, h = p;
    }
    let m = e.length - 1, d = n.length - 1;
    for (; m >= 0 && d >= 0; )
      o.get(m, d) === 3 ? (c(m, d), m--, d--) : o.get(m, d) === 1 ? m-- : d--;
    return c(-1, -1), a.reverse(), new Ke(a, !1);
  }
}
class ll {
  compute(e, n, r = Nn.instance) {
    if (e.length === 0 || n.length === 0)
      return Ke.trivial(e, n);
    const i = e, s = n;
    function o(p, y) {
      for (; p < i.length && y < s.length && i.getElement(p) === s.getElement(y); )
        p++, y++;
      return p;
    }
    let l = 0;
    const a = new J0();
    a.set(0, o(0, 0));
    const u = new Q0();
    u.set(0, a.get(0) === 0 ? null : new Jo(null, 0, 0, a.get(0)));
    let h = 0;
    e: for (; ; ) {
      if (l++, !r.isValid())
        return Ke.trivialTimedOut(i, s);
      const p = -Math.min(l, s.length + l % 2), y = Math.min(l, i.length + l % 2);
      for (h = p; h <= y; h += 2) {
        const _ = h === y ? -1 : a.get(h + 1), L = h === p ? -1 : a.get(h - 1) + 1, v = Math.min(Math.max(_, L), i.length), w = v - h;
        if (v > i.length || w > s.length)
          continue;
        const b = o(v, w);
        a.set(h, b);
        const x = v === _ ? u.get(h + 1) : u.get(h - 1);
        if (u.set(h, b !== v ? new Jo(x, v, w, b - v) : x), a.get(h) === i.length && a.get(h) - h === s.length)
          break e;
      }
    }
    let c = u.get(h);
    const m = [];
    let d = i.length, g = s.length;
    for (; ; ) {
      const p = c ? c.x + c.length : 0, y = c ? c.y + c.length : 0;
      if ((p !== d || y !== g) && m.push(new K(new H(p, d), new H(y, g))), !c)
        break;
      d = c.x, g = c.y, c = c.prev;
    }
    return m.reverse(), new Ke(m, !1);
  }
}
class Jo {
  constructor(e, n, r, i) {
    this.prev = e, this.x = n, this.y = r, this.length = i;
  }
}
class J0 {
  constructor() {
    this.positiveArr = new Int32Array(10), this.negativeArr = new Int32Array(10);
  }
  get(e) {
    return e < 0 ? (e = -e - 1, this.negativeArr[e]) : this.positiveArr[e];
  }
  set(e, n) {
    if (e < 0) {
      if (e = -e - 1, e >= this.negativeArr.length) {
        const r = this.negativeArr;
        this.negativeArr = new Int32Array(r.length * 2), this.negativeArr.set(r);
      }
      this.negativeArr[e] = n;
    } else {
      if (e >= this.positiveArr.length) {
        const r = this.positiveArr;
        this.positiveArr = new Int32Array(r.length * 2), this.positiveArr.set(r);
      }
      this.positiveArr[e] = n;
    }
  }
}
class Q0 {
  constructor() {
    this.positiveArr = [], this.negativeArr = [];
  }
  get(e) {
    return e < 0 ? (e = -e - 1, this.negativeArr[e]) : this.positiveArr[e];
  }
  set(e, n) {
    e < 0 ? (e = -e - 1, this.negativeArr[e] = n) : this.positiveArr[e] = n;
  }
}
class rr {
  constructor(e, n, r) {
    this.lines = e, this.range = n, this.considerWhitespaceChanges = r, this.elements = [], this.firstElementOffsetByLineIdx = [], this.lineStartOffsets = [], this.trimmedWsLengthsByLineIdx = [], this.firstElementOffsetByLineIdx.push(0);
    for (let i = this.range.startLineNumber; i <= this.range.endLineNumber; i++) {
      let s = e[i - 1], o = 0;
      i === this.range.startLineNumber && this.range.startColumn > 1 && (o = this.range.startColumn - 1, s = s.substring(o)), this.lineStartOffsets.push(o);
      let l = 0;
      if (!r) {
        const u = s.trimStart();
        l = s.length - u.length, s = u.trimEnd();
      }
      this.trimmedWsLengthsByLineIdx.push(l);
      const a = i === this.range.endLineNumber ? Math.min(this.range.endColumn - 1 - o - l, s.length) : s.length;
      for (let u = 0; u < a; u++)
        this.elements.push(s.charCodeAt(u));
      i < this.range.endLineNumber && (this.elements.push(10), this.firstElementOffsetByLineIdx.push(this.elements.length));
    }
  }
  toString() {
    return `Slice: "${this.text}"`;
  }
  get text() {
    return this.getText(new H(0, this.length));
  }
  getText(e) {
    return this.elements.slice(e.start, e.endExclusive).map((n) => String.fromCharCode(n)).join("");
  }
  getElement(e) {
    return this.elements[e];
  }
  get length() {
    return this.elements.length;
  }
  getBoundaryScore(e) {
    const n = Xo(e > 0 ? this.elements[e - 1] : -1), r = Xo(e < this.elements.length ? this.elements[e] : -1);
    if (n === 7 && r === 8)
      return 0;
    if (n === 8)
      return 150;
    let i = 0;
    return n !== r && (i += 10, n === 0 && r === 1 && (i += 1)), i += Qo(n), i += Qo(r), i;
  }
  translateOffset(e, n = "right") {
    const r = Ln(this.firstElementOffsetByLineIdx, (s) => s <= e), i = e - this.firstElementOffsetByLineIdx[r];
    return new ne(this.range.startLineNumber + r, 1 + this.lineStartOffsets[r] + i + (i === 0 && n === "left" ? 0 : this.trimmedWsLengthsByLineIdx[r]));
  }
  translateRange(e) {
    const n = this.translateOffset(e.start, "right"), r = this.translateOffset(e.endExclusive, "left");
    return r.isBefore(n) ? G.fromPositions(r, r) : G.fromPositions(n, r);
  }
  /**
   * Finds the word that contains the character at the given offset
   */
  findWordContaining(e) {
    if (e < 0 || e >= this.elements.length || !Dr(this.elements[e]))
      return;
    let n = e;
    for (; n > 0 && Dr(this.elements[n - 1]); )
      n--;
    let r = e;
    for (; r < this.elements.length && Dr(this.elements[r]); )
      r++;
    return new H(n, r);
  }
  countLinesIn(e) {
    return this.translateOffset(e.endExclusive).lineNumber - this.translateOffset(e.start).lineNumber;
  }
  isStronglyEqual(e, n) {
    return this.elements[e] === this.elements[n];
  }
  extendToFullLines(e) {
    const n = Yt(this.firstElementOffsetByLineIdx, (i) => i <= e.start) ?? 0, r = I0(this.firstElementOffsetByLineIdx, (i) => e.endExclusive <= i) ?? this.elements.length;
    return new H(n, r);
  }
}
function Dr(t) {
  return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t >= 48 && t <= 57;
}
const X0 = {
  0: 0,
  1: 0,
  2: 0,
  3: 10,
  4: 2,
  5: 30,
  6: 3,
  7: 10,
  8: 10
};
function Qo(t) {
  return X0[t];
}
function Xo(t) {
  return t === 10 ? 8 : t === 13 ? 7 : bi(t) ? 6 : t >= 97 && t <= 122 ? 0 : t >= 65 && t <= 90 ? 1 : t >= 48 && t <= 57 ? 2 : t === -1 ? 3 : t === 44 || t === 59 ? 5 : 4;
}
function Y0(t, e, n, r, i, s) {
  let { moves: o, excludedChanges: l } = K0(t, e, n, s);
  if (!s.isValid())
    return [];
  const a = t.filter((h) => !l.has(h)), u = ef(a, r, i, e, n, s);
  return W0(o, u), o = tf(o), o = o.filter((h) => {
    const c = h.original.toOffsetRange().slice(e).map((d) => d.trim());
    return c.join(`
`).length >= 15 && Z0(c, (d) => d.length >= 2) >= 2;
  }), o = nf(t, o), o;
}
function Z0(t, e) {
  let n = 0;
  for (const r of t)
    e(r) && n++;
  return n;
}
function K0(t, e, n, r) {
  const i = [], s = t.filter((a) => a.modified.isEmpty && a.original.length >= 3).map((a) => new nr(a.original, e, a)), o = new Set(t.filter((a) => a.original.isEmpty && a.modified.length >= 3).map((a) => new nr(a.modified, n, a))), l = /* @__PURE__ */ new Set();
  for (const a of s) {
    let u = -1, h;
    for (const c of o) {
      const m = a.computeSimilarity(c);
      m > u && (u = m, h = c);
    }
    if (u > 0.9 && h && (o.delete(h), i.push(new Te(a.range, h.range)), l.add(a.source), l.add(h.source)), !r.isValid())
      return { moves: i, excludedChanges: l };
  }
  return { moves: i, excludedChanges: l };
}
function ef(t, e, n, r, i, s) {
  const o = [], l = new v0();
  for (const m of t)
    for (let d = m.original.startLineNumber; d < m.original.endLineNumberExclusive - 2; d++) {
      const g = `${e[d - 1]}:${e[d + 1 - 1]}:${e[d + 2 - 1]}`;
      l.add(g, { range: new $(d, d + 3) });
    }
  const a = [];
  t.sort($n((m) => m.modified.startLineNumber, qn));
  for (const m of t) {
    let d = [];
    for (let g = m.modified.startLineNumber; g < m.modified.endLineNumberExclusive - 2; g++) {
      const p = `${n[g - 1]}:${n[g + 1 - 1]}:${n[g + 2 - 1]}`, y = new $(g, g + 3), _ = [];
      l.forEach(p, ({ range: L }) => {
        for (const w of d)
          if (w.originalLineRange.endLineNumberExclusive + 1 === L.endLineNumberExclusive && w.modifiedLineRange.endLineNumberExclusive + 1 === y.endLineNumberExclusive) {
            w.originalLineRange = new $(w.originalLineRange.startLineNumber, L.endLineNumberExclusive), w.modifiedLineRange = new $(w.modifiedLineRange.startLineNumber, y.endLineNumberExclusive), _.push(w);
            return;
          }
        const v = {
          modifiedLineRange: y,
          originalLineRange: L
        };
        a.push(v), _.push(v);
      }), d = _;
    }
    if (!s.isValid())
      return [];
  }
  a.sort(H0($n((m) => m.modifiedLineRange.length, qn)));
  const u = new qe(), h = new qe();
  for (const m of a) {
    const d = m.modifiedLineRange.startLineNumber - m.originalLineRange.startLineNumber, g = u.subtractFrom(m.modifiedLineRange), p = h.subtractFrom(m.originalLineRange).getWithDelta(d), y = g.getIntersection(p);
    for (const _ of y.ranges) {
      if (_.length < 3)
        continue;
      const L = _, v = _.delta(-d);
      o.push(new Te(v, L)), u.addRange(L), h.addRange(v);
    }
  }
  o.sort($n((m) => m.original.startLineNumber, qn));
  const c = new tr(t);
  for (let m = 0; m < o.length; m++) {
    const d = o[m], g = c.findLastMonotonous((x) => x.original.startLineNumber <= d.original.startLineNumber), p = Yt(t, (x) => x.modified.startLineNumber <= d.modified.startLineNumber), y = Math.max(d.original.startLineNumber - g.original.startLineNumber, d.modified.startLineNumber - p.modified.startLineNumber), _ = c.findLastMonotonous((x) => x.original.startLineNumber < d.original.endLineNumberExclusive), L = Yt(t, (x) => x.modified.startLineNumber < d.modified.endLineNumberExclusive), v = Math.max(_.original.endLineNumberExclusive - d.original.endLineNumberExclusive, L.modified.endLineNumberExclusive - d.modified.endLineNumberExclusive);
    let w;
    for (w = 0; w < y; w++) {
      const x = d.original.startLineNumber - w - 1, A = d.modified.startLineNumber - w - 1;
      if (x > r.length || A > i.length || u.contains(A) || h.contains(x) || !Yo(r[x - 1], i[A - 1], s))
        break;
    }
    w > 0 && (h.addRange(new $(d.original.startLineNumber - w, d.original.startLineNumber)), u.addRange(new $(d.modified.startLineNumber - w, d.modified.startLineNumber)));
    let b;
    for (b = 0; b < v; b++) {
      const x = d.original.endLineNumberExclusive + b, A = d.modified.endLineNumberExclusive + b;
      if (x > r.length || A > i.length || u.contains(A) || h.contains(x) || !Yo(r[x - 1], i[A - 1], s))
        break;
    }
    b > 0 && (h.addRange(new $(d.original.endLineNumberExclusive, d.original.endLineNumberExclusive + b)), u.addRange(new $(d.modified.endLineNumberExclusive, d.modified.endLineNumberExclusive + b))), (w > 0 || b > 0) && (o[m] = new Te(new $(d.original.startLineNumber - w, d.original.endLineNumberExclusive + b), new $(d.modified.startLineNumber - w, d.modified.endLineNumberExclusive + b)));
  }
  return o;
}
function Yo(t, e, n) {
  if (t.trim() === e.trim())
    return !0;
  if (t.length > 300 && e.length > 300)
    return !1;
  const i = new ll().compute(new rr([t], new G(1, 1, 1, t.length), !1), new rr([e], new G(1, 1, 1, e.length), !1), n);
  let s = 0;
  const o = K.invert(i.diffs, t.length);
  for (const h of o)
    h.seq1Range.forEach((c) => {
      bi(t.charCodeAt(c)) || s++;
    });
  function l(h) {
    let c = 0;
    for (let m = 0; m < t.length; m++)
      bi(h.charCodeAt(m)) || c++;
    return c;
  }
  const a = l(t.length > e.length ? t : e);
  return s / a > 0.6 && a > 10;
}
function tf(t) {
  if (t.length === 0)
    return t;
  t.sort($n((n) => n.original.startLineNumber, qn));
  const e = [t[0]];
  for (let n = 1; n < t.length; n++) {
    const r = e[e.length - 1], i = t[n], s = i.original.startLineNumber - r.original.endLineNumberExclusive, o = i.modified.startLineNumber - r.modified.endLineNumberExclusive;
    if (s >= 0 && o >= 0 && s + o <= 2) {
      e[e.length - 1] = r.join(i);
      continue;
    }
    e.push(i);
  }
  return e;
}
function nf(t, e) {
  const n = new tr(t);
  return e = e.filter((r) => {
    const i = n.findLastMonotonous((l) => l.original.startLineNumber < r.original.endLineNumberExclusive) || new Te(new $(1, 1), new $(1, 1)), s = Yt(t, (l) => l.modified.startLineNumber < r.modified.endLineNumberExclusive);
    return i !== s;
  }), e;
}
function Zo(t, e, n) {
  let r = n;
  return r = Ko(t, e, r), r = Ko(t, e, r), r = rf(t, e, r), r;
}
function Ko(t, e, n) {
  if (n.length === 0)
    return n;
  const r = [];
  r.push(n[0]);
  for (let s = 1; s < n.length; s++) {
    const o = r[r.length - 1];
    let l = n[s];
    if (l.seq1Range.isEmpty || l.seq2Range.isEmpty) {
      const a = l.seq1Range.start - o.seq1Range.endExclusive;
      let u;
      for (u = 1; u <= a && !(t.getElement(l.seq1Range.start - u) !== t.getElement(l.seq1Range.endExclusive - u) || e.getElement(l.seq2Range.start - u) !== e.getElement(l.seq2Range.endExclusive - u)); u++)
        ;
      if (u--, u === a) {
        r[r.length - 1] = new K(new H(o.seq1Range.start, l.seq1Range.endExclusive - a), new H(o.seq2Range.start, l.seq2Range.endExclusive - a));
        continue;
      }
      l = l.delta(-u);
    }
    r.push(l);
  }
  const i = [];
  for (let s = 0; s < r.length - 1; s++) {
    const o = r[s + 1];
    let l = r[s];
    if (l.seq1Range.isEmpty || l.seq2Range.isEmpty) {
      const a = o.seq1Range.start - l.seq1Range.endExclusive;
      let u;
      for (u = 0; u < a && !(!t.isStronglyEqual(l.seq1Range.start + u, l.seq1Range.endExclusive + u) || !e.isStronglyEqual(l.seq2Range.start + u, l.seq2Range.endExclusive + u)); u++)
        ;
      if (u === a) {
        r[s + 1] = new K(new H(l.seq1Range.start + a, o.seq1Range.endExclusive), new H(l.seq2Range.start + a, o.seq2Range.endExclusive));
        continue;
      }
      u > 0 && (l = l.delta(u));
    }
    i.push(l);
  }
  return r.length > 0 && i.push(r[r.length - 1]), i;
}
function rf(t, e, n) {
  if (!t.getBoundaryScore || !e.getBoundaryScore)
    return n;
  for (let r = 0; r < n.length; r++) {
    const i = r > 0 ? n[r - 1] : void 0, s = n[r], o = r + 1 < n.length ? n[r + 1] : void 0, l = new H(i ? i.seq1Range.endExclusive + 1 : 0, o ? o.seq1Range.start - 1 : t.length), a = new H(i ? i.seq2Range.endExclusive + 1 : 0, o ? o.seq2Range.start - 1 : e.length);
    s.seq1Range.isEmpty ? n[r] = e1(s, t, e, l, a) : s.seq2Range.isEmpty && (n[r] = e1(s.swap(), e, t, a, l).swap());
  }
  return n;
}
function e1(t, e, n, r, i) {
  let o = 1;
  for (; t.seq1Range.start - o >= r.start && t.seq2Range.start - o >= i.start && n.isStronglyEqual(t.seq2Range.start - o, t.seq2Range.endExclusive - o) && o < 100; )
    o++;
  o--;
  let l = 0;
  for (; t.seq1Range.start + l < r.endExclusive && t.seq2Range.endExclusive + l < i.endExclusive && n.isStronglyEqual(t.seq2Range.start + l, t.seq2Range.endExclusive + l) && l < 100; )
    l++;
  if (o === 0 && l === 0)
    return t;
  let a = 0, u = -1;
  for (let h = -o; h <= l; h++) {
    const c = t.seq2Range.start + h, m = t.seq2Range.endExclusive + h, d = t.seq1Range.start + h, g = e.getBoundaryScore(d) + n.getBoundaryScore(c) + n.getBoundaryScore(m);
    g > u && (u = g, a = h);
  }
  return t.delta(a);
}
function sf(t, e, n) {
  const r = [];
  for (const i of n) {
    const s = r[r.length - 1];
    if (!s) {
      r.push(i);
      continue;
    }
    i.seq1Range.start - s.seq1Range.endExclusive <= 2 || i.seq2Range.start - s.seq2Range.endExclusive <= 2 ? r[r.length - 1] = new K(s.seq1Range.join(i.seq1Range), s.seq2Range.join(i.seq2Range)) : r.push(i);
  }
  return r;
}
function of(t, e, n) {
  const r = K.invert(n, t.length), i = [];
  let s = new Xe(0, 0);
  function o(a, u) {
    if (a.offset1 < s.offset1 || a.offset2 < s.offset2)
      return;
    const h = t.findWordContaining(a.offset1), c = e.findWordContaining(a.offset2);
    if (!h || !c)
      return;
    let m = new K(h, c);
    const d = m.intersect(u);
    let g = d.seq1Range.length, p = d.seq2Range.length;
    for (; r.length > 0; ) {
      const y = r[0];
      if (!(y.seq1Range.intersects(m.seq1Range) || y.seq2Range.intersects(m.seq2Range)))
        break;
      const L = t.findWordContaining(y.seq1Range.start), v = e.findWordContaining(y.seq2Range.start), w = new K(L, v), b = w.intersect(y);
      if (g += b.seq1Range.length, p += b.seq2Range.length, m = m.join(w), m.seq1Range.endExclusive >= y.seq1Range.endExclusive)
        r.shift();
      else
        break;
    }
    g + p < (m.seq1Range.length + m.seq2Range.length) * 2 / 3 && i.push(m), s = m.getEndExclusives();
  }
  for (; r.length > 0; ) {
    const a = r.shift();
    a.seq1Range.isEmpty || (o(a.getStarts(), a), o(a.getEndExclusives().delta(-1), a));
  }
  return af(n, i);
}
function af(t, e) {
  const n = [];
  for (; t.length > 0 || e.length > 0; ) {
    const r = t[0], i = e[0];
    let s;
    r && (!i || r.seq1Range.start < i.seq1Range.start) ? s = t.shift() : s = e.shift(), n.length > 0 && n[n.length - 1].seq1Range.endExclusive >= s.seq1Range.start ? n[n.length - 1] = n[n.length - 1].join(s) : n.push(s);
  }
  return n;
}
function lf(t, e, n) {
  let r = n;
  if (r.length === 0)
    return r;
  let i = 0, s;
  do {
    s = !1;
    const l = [
      r[0]
    ];
    for (let a = 1; a < r.length; a++) {
      let c = function(d, g) {
        const p = new H(h.seq1Range.endExclusive, u.seq1Range.start);
        return t.getText(p).replace(/\s/g, "").length <= 4 && (d.seq1Range.length + d.seq2Range.length > 5 || g.seq1Range.length + g.seq2Range.length > 5);
      };
      var o = c;
      const u = r[a], h = l[l.length - 1];
      c(h, u) ? (s = !0, l[l.length - 1] = l[l.length - 1].join(u)) : l.push(u);
    }
    r = l;
  } while (i++ < 10 && s);
  return r;
}
function uf(t, e, n) {
  let r = n;
  if (r.length === 0)
    return r;
  let i = 0, s;
  do {
    s = !1;
    const a = [
      r[0]
    ];
    for (let u = 1; u < r.length; u++) {
      let m = function(g, p) {
        const y = new H(c.seq1Range.endExclusive, h.seq1Range.start);
        if (t.countLinesIn(y) > 5 || y.length > 500)
          return !1;
        const L = t.getText(y).trim();
        if (L.length > 20 || L.split(/\r\n|\r|\n/).length > 1)
          return !1;
        const v = t.countLinesIn(g.seq1Range), w = g.seq1Range.length, b = e.countLinesIn(g.seq2Range), x = g.seq2Range.length, A = t.countLinesIn(p.seq1Range), T = p.seq1Range.length, D = e.countLinesIn(p.seq2Range), O = p.seq2Range.length, C = 130;
        function N(E) {
          return Math.min(E, C);
        }
        return Math.pow(Math.pow(N(v * 40 + w), 1.5) + Math.pow(N(b * 40 + x), 1.5), 1.5) + Math.pow(Math.pow(N(A * 40 + T), 1.5) + Math.pow(N(D * 40 + O), 1.5), 1.5) > (C ** 1.5) ** 1.5 * 1.3;
      };
      var l = m;
      const h = r[u], c = a[a.length - 1];
      m(c, h) ? (s = !0, a[a.length - 1] = a[a.length - 1].join(h)) : a.push(h);
    }
    r = a;
  } while (i++ < 10 && s);
  const o = [];
  return j0(r, (a, u, h) => {
    let c = u;
    function m(L) {
      return L.length > 0 && L.trim().length <= 3 && u.seq1Range.length + u.seq2Range.length > 100;
    }
    const d = t.extendToFullLines(u.seq1Range), g = t.getText(new H(d.start, u.seq1Range.start));
    m(g) && (c = c.deltaStart(-g.length));
    const p = t.getText(new H(u.seq1Range.endExclusive, d.endExclusive));
    m(p) && (c = c.deltaEnd(p.length));
    const y = K.fromOffsetPairs(a ? a.getEndExclusives() : Xe.zero, h ? h.getStarts() : Xe.max), _ = c.intersect(y);
    o.length > 0 && _.getStarts().equals(o[o.length - 1].getEndExclusives()) ? o[o.length - 1] = o[o.length - 1].join(_) : o.push(_);
  }), o;
}
class t1 {
  constructor(e, n) {
    this.trimmedHash = e, this.lines = n;
  }
  getElement(e) {
    return this.trimmedHash[e];
  }
  get length() {
    return this.trimmedHash.length;
  }
  getBoundaryScore(e) {
    const n = e === 0 ? 0 : n1(this.lines[e - 1]), r = e === this.lines.length ? 0 : n1(this.lines[e]);
    return 1e3 - (n + r);
  }
  getText(e) {
    return this.lines.slice(e.start, e.endExclusive).join(`
`);
  }
  isStronglyEqual(e, n) {
    return this.lines[e] === this.lines[n];
  }
}
function n1(t) {
  let e = 0;
  for (; e < t.length && (t.charCodeAt(e) === 32 || t.charCodeAt(e) === 9); )
    e++;
  return e;
}
class cf {
  constructor() {
    this.dynamicProgrammingDiffing = new G0(), this.myersDiffingAlgorithm = new ll();
  }
  computeDiff(e, n, r) {
    if (e.length <= 1 && U0(e, n, (b, x) => b === x))
      return new Un([], [], !1);
    if (e.length === 1 && e[0].length === 0 || n.length === 1 && n[0].length === 0)
      return new Un([
        new Ze(new $(1, e.length + 1), new $(1, n.length + 1), [
          new Pe(new G(1, 1, e.length, e[e.length - 1].length + 1), new G(1, 1, n.length, n[n.length - 1].length + 1))
        ])
      ], [], !1);
    const i = r.maxComputationTimeMs === 0 ? Nn.instance : new z0(r.maxComputationTimeMs), s = !r.ignoreTrimWhitespace, o = /* @__PURE__ */ new Map();
    function l(b) {
      let x = o.get(b);
      return x === void 0 && (x = o.size, o.set(b, x)), x;
    }
    const a = e.map((b) => l(b.trim())), u = n.map((b) => l(b.trim())), h = new t1(a, e), c = new t1(u, n), m = h.length + c.length < 1700 ? this.dynamicProgrammingDiffing.compute(h, c, i, (b, x) => e[b] === n[x] ? n[x].length === 0 ? 0.1 : 1 + Math.log(1 + n[x].length) : 0.99) : this.myersDiffingAlgorithm.compute(h, c, i);
    let d = m.diffs, g = m.hitTimeout;
    d = Zo(h, c, d), d = lf(h, c, d);
    const p = [], y = (b) => {
      if (s)
        for (let x = 0; x < b; x++) {
          const A = _ + x, T = L + x;
          if (e[A] !== n[T]) {
            const D = this.refineDiff(e, n, new K(new H(A, A + 1), new H(T, T + 1)), i, s);
            for (const O of D.mappings)
              p.push(O);
            D.hitTimeout && (g = !0);
          }
        }
    };
    let _ = 0, L = 0;
    for (const b of d) {
      er(() => b.seq1Range.start - _ === b.seq2Range.start - L);
      const x = b.seq1Range.start - _;
      y(x), _ = b.seq1Range.endExclusive, L = b.seq2Range.endExclusive;
      const A = this.refineDiff(e, n, b, i, s);
      A.hitTimeout && (g = !0);
      for (const T of A.mappings)
        p.push(T);
    }
    y(e.length - _);
    const v = r1(p, e, n);
    let w = [];
    return r.computeMoves && (w = this.computeMoves(v, e, n, a, u, i, s)), er(() => {
      function b(A, T) {
        if (A.lineNumber < 1 || A.lineNumber > T.length)
          return !1;
        const D = T[A.lineNumber - 1];
        return !(A.column < 1 || A.column > D.length + 1);
      }
      function x(A, T) {
        return !(A.startLineNumber < 1 || A.startLineNumber > T.length + 1 || A.endLineNumberExclusive < 1 || A.endLineNumberExclusive > T.length + 1);
      }
      for (const A of v) {
        if (!A.innerChanges)
          return !1;
        for (const T of A.innerChanges)
          if (!(b(T.modifiedRange.getStartPosition(), n) && b(T.modifiedRange.getEndPosition(), n) && b(T.originalRange.getStartPosition(), e) && b(T.originalRange.getEndPosition(), e)))
            return !1;
        if (!x(A.modified, n) || !x(A.original, e))
          return !1;
      }
      return !0;
    }), new Un(v, w, g);
  }
  computeMoves(e, n, r, i, s, o, l) {
    return Y0(e, n, r, i, s, o).map((h) => {
      const c = this.refineDiff(n, r, new K(h.original.toOffsetRange(), h.modified.toOffsetRange()), o, l), m = r1(c.mappings, n, r, !0);
      return new C0(h, m);
    });
  }
  refineDiff(e, n, r, i, s) {
    const l = hf(r).toRangeMapping2(e, n), a = new rr(e, l.originalRange, s), u = new rr(n, l.modifiedRange, s), h = a.length + u.length < 500 ? this.dynamicProgrammingDiffing.compute(a, u, i) : this.myersDiffingAlgorithm.compute(a, u, i);
    let c = h.diffs;
    return c = Zo(a, u, c), c = of(a, u, c), c = sf(a, u, c), c = uf(a, u, c), {
      mappings: c.map((d) => new Pe(a.translateRange(d.seq1Range), u.translateRange(d.seq2Range))),
      hitTimeout: h.hitTimeout
    };
  }
}
function r1(t, e, n, r = !1) {
  const i = [];
  for (const s of $0(t.map((o) => ff(o, e, n)), (o, l) => o.original.overlapOrTouch(l.original) || o.modified.overlapOrTouch(l.modified))) {
    const o = s[0], l = s[s.length - 1];
    i.push(new Ze(o.original.join(l.original), o.modified.join(l.modified), s.map((a) => a.innerChanges[0])));
  }
  return er(() => !r && i.length > 0 && (i[0].modified.startLineNumber !== i[0].original.startLineNumber || n.length - i[i.length - 1].modified.endLineNumberExclusive !== e.length - i[i.length - 1].original.endLineNumberExclusive) ? !1 : rl(i, (s, o) => o.original.startLineNumber - s.original.endLineNumberExclusive === o.modified.startLineNumber - s.modified.endLineNumberExclusive && // There has to be an unchanged line in between (otherwise both diffs should have been joined)
  s.original.endLineNumberExclusive < o.original.startLineNumber && s.modified.endLineNumberExclusive < o.modified.startLineNumber)), i;
}
function ff(t, e, n) {
  let r = 0, i = 0;
  t.modifiedRange.endColumn === 1 && t.originalRange.endColumn === 1 && t.originalRange.startLineNumber + r <= t.originalRange.endLineNumber && t.modifiedRange.startLineNumber + r <= t.modifiedRange.endLineNumber && (i = -1), t.modifiedRange.startColumn - 1 >= n[t.modifiedRange.startLineNumber - 1].length && t.originalRange.startColumn - 1 >= e[t.originalRange.startLineNumber - 1].length && t.originalRange.startLineNumber <= t.originalRange.endLineNumber + i && t.modifiedRange.startLineNumber <= t.modifiedRange.endLineNumber + i && (r = 1);
  const s = new $(t.originalRange.startLineNumber + r, t.originalRange.endLineNumber + 1 + i), o = new $(t.modifiedRange.startLineNumber + r, t.modifiedRange.endLineNumber + 1 + i);
  return new Ze(s, o, [t]);
}
function hf(t) {
  return new Te(new $(t.seq1Range.start + 1, t.seq1Range.endExclusive + 1), new $(t.seq2Range.start + 1, t.seq2Range.endExclusive + 1));
}
const i1 = {
  getLegacy: () => new D0(),
  getDefault: () => new cf()
};
function ht(t, e) {
  const n = Math.pow(10, e);
  return Math.round(t * n) / n;
}
class le {
  constructor(e, n, r, i = 1) {
    this._rgbaBrand = void 0, this.r = Math.min(255, Math.max(0, e)) | 0, this.g = Math.min(255, Math.max(0, n)) | 0, this.b = Math.min(255, Math.max(0, r)) | 0, this.a = ht(Math.max(Math.min(1, i), 0), 3);
  }
  static equals(e, n) {
    return e.r === n.r && e.g === n.g && e.b === n.b && e.a === n.a;
  }
}
class Me {
  constructor(e, n, r, i) {
    this._hslaBrand = void 0, this.h = Math.max(Math.min(360, e), 0) | 0, this.s = ht(Math.max(Math.min(1, n), 0), 3), this.l = ht(Math.max(Math.min(1, r), 0), 3), this.a = ht(Math.max(Math.min(1, i), 0), 3);
  }
  static equals(e, n) {
    return e.h === n.h && e.s === n.s && e.l === n.l && e.a === n.a;
  }
  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h in the set [0, 360], s, and l in the set [0, 1].
   */
  static fromRGBA(e) {
    const n = e.r / 255, r = e.g / 255, i = e.b / 255, s = e.a, o = Math.max(n, r, i), l = Math.min(n, r, i);
    let a = 0, u = 0;
    const h = (l + o) / 2, c = o - l;
    if (c > 0) {
      switch (u = Math.min(h <= 0.5 ? c / (2 * h) : c / (2 - 2 * h), 1), o) {
        case n:
          a = (r - i) / c + (r < i ? 6 : 0);
          break;
        case r:
          a = (i - n) / c + 2;
          break;
        case i:
          a = (n - r) / c + 4;
          break;
      }
      a *= 60, a = Math.round(a);
    }
    return new Me(a, u, h, s);
  }
  static _hue2rgb(e, n, r) {
    return r < 0 && (r += 1), r > 1 && (r -= 1), r < 1 / 6 ? e + (n - e) * 6 * r : r < 1 / 2 ? n : r < 2 / 3 ? e + (n - e) * (2 / 3 - r) * 6 : e;
  }
  /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h in the set [0, 360] s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   */
  static toRGBA(e) {
    const n = e.h / 360, { s: r, l: i, a: s } = e;
    let o, l, a;
    if (r === 0)
      o = l = a = i;
    else {
      const u = i < 0.5 ? i * (1 + r) : i + r - i * r, h = 2 * i - u;
      o = Me._hue2rgb(h, u, n + 1 / 3), l = Me._hue2rgb(h, u, n), a = Me._hue2rgb(h, u, n - 1 / 3);
    }
    return new le(Math.round(o * 255), Math.round(l * 255), Math.round(a * 255), s);
  }
}
class Ot {
  constructor(e, n, r, i) {
    this._hsvaBrand = void 0, this.h = Math.max(Math.min(360, e), 0) | 0, this.s = ht(Math.max(Math.min(1, n), 0), 3), this.v = ht(Math.max(Math.min(1, r), 0), 3), this.a = ht(Math.max(Math.min(1, i), 0), 3);
  }
  static equals(e, n) {
    return e.h === n.h && e.s === n.s && e.v === n.v && e.a === n.a;
  }
  // from http://www.rapidtables.com/convert/color/rgb-to-hsv.htm
  static fromRGBA(e) {
    const n = e.r / 255, r = e.g / 255, i = e.b / 255, s = Math.max(n, r, i), o = Math.min(n, r, i), l = s - o, a = s === 0 ? 0 : l / s;
    let u;
    return l === 0 ? u = 0 : s === n ? u = ((r - i) / l % 6 + 6) % 6 : s === r ? u = (i - n) / l + 2 : u = (n - r) / l + 4, new Ot(Math.round(u * 60), a, s, e.a);
  }
  // from http://www.rapidtables.com/convert/color/hsv-to-rgb.htm
  static toRGBA(e) {
    const { h: n, s: r, v: i, a: s } = e, o = i * r, l = o * (1 - Math.abs(n / 60 % 2 - 1)), a = i - o;
    let [u, h, c] = [0, 0, 0];
    return n < 60 ? (u = o, h = l) : n < 120 ? (u = l, h = o) : n < 180 ? (h = o, c = l) : n < 240 ? (h = l, c = o) : n < 300 ? (u = l, c = o) : n <= 360 && (u = o, c = l), u = Math.round((u + a) * 255), h = Math.round((h + a) * 255), c = Math.round((c + a) * 255), new le(u, h, c, s);
  }
}
var Q;
let ir = (Q = class {
  static fromHex(e) {
    return Q.Format.CSS.parseHex(e) || Q.red;
  }
  static equals(e, n) {
    return !e && !n ? !0 : !e || !n ? !1 : e.equals(n);
  }
  get hsla() {
    return this._hsla ? this._hsla : Me.fromRGBA(this.rgba);
  }
  get hsva() {
    return this._hsva ? this._hsva : Ot.fromRGBA(this.rgba);
  }
  constructor(e) {
    if (e)
      if (e instanceof le)
        this.rgba = e;
      else if (e instanceof Me)
        this._hsla = e, this.rgba = Me.toRGBA(e);
      else if (e instanceof Ot)
        this._hsva = e, this.rgba = Ot.toRGBA(e);
      else
        throw new Error("Invalid color ctor argument");
    else throw new Error("Color needs a value");
  }
  equals(e) {
    return !!e && le.equals(this.rgba, e.rgba) && Me.equals(this.hsla, e.hsla) && Ot.equals(this.hsva, e.hsva);
  }
  /**
   * http://www.w3.org/TR/WCAG20/#relativeluminancedef
   * Returns the number in the set [0, 1]. O => Darkest Black. 1 => Lightest white.
   */
  getRelativeLuminance() {
    const e = Q._relativeLuminanceForComponent(this.rgba.r), n = Q._relativeLuminanceForComponent(this.rgba.g), r = Q._relativeLuminanceForComponent(this.rgba.b), i = 0.2126 * e + 0.7152 * n + 0.0722 * r;
    return ht(i, 4);
  }
  static _relativeLuminanceForComponent(e) {
    const n = e / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  }
  /**
   *	http://24ways.org/2010/calculating-color-contrast
   *  Return 'true' if lighter color otherwise 'false'
   */
  isLighter() {
    return (this.rgba.r * 299 + this.rgba.g * 587 + this.rgba.b * 114) / 1e3 >= 128;
  }
  isLighterThan(e) {
    const n = this.getRelativeLuminance(), r = e.getRelativeLuminance();
    return n > r;
  }
  isDarkerThan(e) {
    const n = this.getRelativeLuminance(), r = e.getRelativeLuminance();
    return n < r;
  }
  lighten(e) {
    return new Q(new Me(this.hsla.h, this.hsla.s, this.hsla.l + this.hsla.l * e, this.hsla.a));
  }
  darken(e) {
    return new Q(new Me(this.hsla.h, this.hsla.s, this.hsla.l - this.hsla.l * e, this.hsla.a));
  }
  transparent(e) {
    const { r: n, g: r, b: i, a: s } = this.rgba;
    return new Q(new le(n, r, i, s * e));
  }
  isTransparent() {
    return this.rgba.a === 0;
  }
  isOpaque() {
    return this.rgba.a === 1;
  }
  opposite() {
    return new Q(new le(255 - this.rgba.r, 255 - this.rgba.g, 255 - this.rgba.b, this.rgba.a));
  }
  makeOpaque(e) {
    if (this.isOpaque() || e.rgba.a !== 1)
      return this;
    const { r: n, g: r, b: i, a: s } = this.rgba;
    return new Q(new le(e.rgba.r - s * (e.rgba.r - n), e.rgba.g - s * (e.rgba.g - r), e.rgba.b - s * (e.rgba.b - i), 1));
  }
  toString() {
    return this._toString || (this._toString = Q.Format.CSS.format(this)), this._toString;
  }
  static getLighterColor(e, n, r) {
    if (e.isLighterThan(n))
      return e;
    r = r || 0.5;
    const i = e.getRelativeLuminance(), s = n.getRelativeLuminance();
    return r = r * (s - i) / s, e.lighten(r);
  }
  static getDarkerColor(e, n, r) {
    if (e.isDarkerThan(n))
      return e;
    r = r || 0.5;
    const i = e.getRelativeLuminance(), s = n.getRelativeLuminance();
    return r = r * (i - s) / i, e.darken(r);
  }
}, Q.white = new Q(new le(255, 255, 255, 1)), Q.black = new Q(new le(0, 0, 0, 1)), Q.red = new Q(new le(255, 0, 0, 1)), Q.blue = new Q(new le(0, 0, 255, 1)), Q.green = new Q(new le(0, 255, 0, 1)), Q.cyan = new Q(new le(0, 255, 255, 1)), Q.lightgrey = new Q(new le(211, 211, 211, 1)), Q.transparent = new Q(new le(0, 0, 0, 0)), Q);
(function(t) {
  (function(e) {
    (function(n) {
      function r(d) {
        return d.rgba.a === 1 ? `rgb(${d.rgba.r}, ${d.rgba.g}, ${d.rgba.b})` : t.Format.CSS.formatRGBA(d);
      }
      n.formatRGB = r;
      function i(d) {
        return `rgba(${d.rgba.r}, ${d.rgba.g}, ${d.rgba.b}, ${+d.rgba.a.toFixed(2)})`;
      }
      n.formatRGBA = i;
      function s(d) {
        return d.hsla.a === 1 ? `hsl(${d.hsla.h}, ${(d.hsla.s * 100).toFixed(2)}%, ${(d.hsla.l * 100).toFixed(2)}%)` : t.Format.CSS.formatHSLA(d);
      }
      n.formatHSL = s;
      function o(d) {
        return `hsla(${d.hsla.h}, ${(d.hsla.s * 100).toFixed(2)}%, ${(d.hsla.l * 100).toFixed(2)}%, ${d.hsla.a.toFixed(2)})`;
      }
      n.formatHSLA = o;
      function l(d) {
        const g = d.toString(16);
        return g.length !== 2 ? "0" + g : g;
      }
      function a(d) {
        return `#${l(d.rgba.r)}${l(d.rgba.g)}${l(d.rgba.b)}`;
      }
      n.formatHex = a;
      function u(d, g = !1) {
        return g && d.rgba.a === 1 ? t.Format.CSS.formatHex(d) : `#${l(d.rgba.r)}${l(d.rgba.g)}${l(d.rgba.b)}${l(Math.round(d.rgba.a * 255))}`;
      }
      n.formatHexA = u;
      function h(d) {
        return d.isOpaque() ? t.Format.CSS.formatHex(d) : t.Format.CSS.formatRGBA(d);
      }
      n.format = h;
      function c(d) {
        const g = d.length;
        if (g === 0 || d.charCodeAt(0) !== 35)
          return null;
        if (g === 7) {
          const p = 16 * m(d.charCodeAt(1)) + m(d.charCodeAt(2)), y = 16 * m(d.charCodeAt(3)) + m(d.charCodeAt(4)), _ = 16 * m(d.charCodeAt(5)) + m(d.charCodeAt(6));
          return new t(new le(p, y, _, 1));
        }
        if (g === 9) {
          const p = 16 * m(d.charCodeAt(1)) + m(d.charCodeAt(2)), y = 16 * m(d.charCodeAt(3)) + m(d.charCodeAt(4)), _ = 16 * m(d.charCodeAt(5)) + m(d.charCodeAt(6)), L = 16 * m(d.charCodeAt(7)) + m(d.charCodeAt(8));
          return new t(new le(p, y, _, L / 255));
        }
        if (g === 4) {
          const p = m(d.charCodeAt(1)), y = m(d.charCodeAt(2)), _ = m(d.charCodeAt(3));
          return new t(new le(16 * p + p, 16 * y + y, 16 * _ + _));
        }
        if (g === 5) {
          const p = m(d.charCodeAt(1)), y = m(d.charCodeAt(2)), _ = m(d.charCodeAt(3)), L = m(d.charCodeAt(4));
          return new t(new le(16 * p + p, 16 * y + y, 16 * _ + _, (16 * L + L) / 255));
        }
        return null;
      }
      n.parseHex = c;
      function m(d) {
        switch (d) {
          case 48:
            return 0;
          case 49:
            return 1;
          case 50:
            return 2;
          case 51:
            return 3;
          case 52:
            return 4;
          case 53:
            return 5;
          case 54:
            return 6;
          case 55:
            return 7;
          case 56:
            return 8;
          case 57:
            return 9;
          case 97:
            return 10;
          case 65:
            return 10;
          case 98:
            return 11;
          case 66:
            return 11;
          case 99:
            return 12;
          case 67:
            return 12;
          case 100:
            return 13;
          case 68:
            return 13;
          case 101:
            return 14;
          case 69:
            return 14;
          case 102:
            return 15;
          case 70:
            return 15;
        }
        return 0;
      }
    })(e.CSS || (e.CSS = {}));
  })(t.Format || (t.Format = {}));
})(ir || (ir = {}));
function ul(t) {
  const e = [];
  for (const n of t) {
    const r = Number(n);
    (r || r === 0 && n.replace(/\s/g, "") !== "") && e.push(r);
  }
  return e;
}
function ts(t, e, n, r) {
  return {
    red: t / 255,
    blue: n / 255,
    green: e / 255,
    alpha: r
  };
}
function an(t, e) {
  const n = e.index, r = e[0].length;
  if (!n)
    return;
  const i = t.positionAt(n);
  return {
    startLineNumber: i.lineNumber,
    startColumn: i.column,
    endLineNumber: i.lineNumber,
    endColumn: i.column + r
  };
}
function mf(t, e) {
  if (!t)
    return;
  const n = ir.Format.CSS.parseHex(e);
  if (n)
    return {
      range: t,
      color: ts(n.rgba.r, n.rgba.g, n.rgba.b, n.rgba.a)
    };
}
function s1(t, e, n) {
  if (!t || e.length !== 1)
    return;
  const i = e[0].values(), s = ul(i);
  return {
    range: t,
    color: ts(s[0], s[1], s[2], n ? s[3] : 1)
  };
}
function o1(t, e, n) {
  if (!t || e.length !== 1)
    return;
  const i = e[0].values(), s = ul(i), o = new ir(new Me(s[0], s[1] / 100, s[2] / 100, n ? s[3] : 1));
  return {
    range: t,
    color: ts(o.rgba.r, o.rgba.g, o.rgba.b, o.rgba.a)
  };
}
function ln(t, e) {
  return typeof t == "string" ? [...t.matchAll(e)] : t.findMatches(e);
}
function df(t) {
  const e = [], r = ln(t, /\b(rgb|rgba|hsl|hsla)(\([0-9\s,.\%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm);
  if (r.length > 0)
    for (const i of r) {
      const s = i.filter((u) => u !== void 0), o = s[1], l = s[2];
      if (!l)
        continue;
      let a;
      if (o === "rgb") {
        const u = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*\)$/gm;
        a = s1(an(t, i), ln(l, u), !1);
      } else if (o === "rgba") {
        const u = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
        a = s1(an(t, i), ln(l, u), !0);
      } else if (o === "hsl") {
        const u = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*\)$/gm;
        a = o1(an(t, i), ln(l, u), !1);
      } else if (o === "hsla") {
        const u = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
        a = o1(an(t, i), ln(l, u), !0);
      } else o === "#" && (a = mf(an(t, i), o + l));
      a && e.push(a);
    }
  return e;
}
function gf(t) {
  return !t || typeof t.getValue != "function" || typeof t.positionAt != "function" ? [] : df(t);
}
const a1 = new RegExp("\\bMARK:\\s*(.*)$", "d"), pf = /^-+|-+$/g;
function bf(t, e) {
  let n = [];
  if (e.findRegionSectionHeaders && e.foldingRules?.markers) {
    const r = yf(t, e);
    n = n.concat(r);
  }
  if (e.findMarkSectionHeaders) {
    const r = vf(t);
    n = n.concat(r);
  }
  return n;
}
function yf(t, e) {
  const n = [], r = t.getLineCount();
  for (let i = 1; i <= r; i++) {
    const s = t.getLineContent(i), o = s.match(e.foldingRules.markers.start);
    if (o) {
      const l = { startLineNumber: i, startColumn: o[0].length + 1, endLineNumber: i, endColumn: s.length + 1 };
      if (l.endColumn > l.startColumn) {
        const a = {
          range: l,
          ...cl(s.substring(o[0].length)),
          shouldBeInComments: !1
        };
        (a.text || a.hasSeparatorLine) && n.push(a);
      }
    }
  }
  return n;
}
function vf(t) {
  const e = [], n = t.getLineCount();
  for (let r = 1; r <= n; r++) {
    const i = t.getLineContent(r);
    wf(i, r, e);
  }
  return e;
}
function wf(t, e, n) {
  a1.lastIndex = 0;
  const r = a1.exec(t);
  if (r) {
    const i = r.indices[1][0] + 1, s = r.indices[1][1] + 1, o = { startLineNumber: e, startColumn: i, endLineNumber: e, endColumn: s };
    if (o.endColumn > o.startColumn) {
      const l = {
        range: o,
        ...cl(r[1]),
        shouldBeInComments: !0
      };
      (l.text || l.hasSeparatorLine) && n.push(l);
    }
  }
}
function cl(t) {
  t = t.trim();
  const e = t.startsWith("-");
  return t = t.replace(pf, ""), { text: t, hasSeparatorLine: e };
}
var l1;
(function(t) {
  async function e(r) {
    let i;
    const s = await Promise.all(r.map((o) => o.then((l) => l, (l) => {
      i || (i = l);
    })));
    if (typeof i < "u")
      throw i;
    return s;
  }
  t.settled = e;
  function n(r) {
    return new Promise(async (i, s) => {
      try {
        await r(i, s);
      } catch (o) {
        s(o);
      }
    });
  }
  t.withAsyncBody = n;
})(l1 || (l1 = {}));
const pe = class pe {
  static fromArray(e) {
    return new pe((n) => {
      n.emitMany(e);
    });
  }
  static fromPromise(e) {
    return new pe(async (n) => {
      n.emitMany(await e);
    });
  }
  static fromPromises(e) {
    return new pe(async (n) => {
      await Promise.all(e.map(async (r) => n.emitOne(await r)));
    });
  }
  static merge(e) {
    return new pe(async (n) => {
      await Promise.all(e.map(async (r) => {
        for await (const i of r)
          n.emitOne(i);
      }));
    });
  }
  constructor(e, n) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = n, this._onStateChanged = new Re(), queueMicrotask(async () => {
      const r = {
        emitOne: (i) => this.emitOne(i),
        emitMany: (i) => this.emitMany(i),
        reject: (i) => this.reject(i)
      };
      try {
        await Promise.resolve(e(r)), this.resolve();
      } catch (i) {
        this.reject(i);
      } finally {
        r.emitOne = void 0, r.emitMany = void 0, r.reject = void 0;
      }
    });
  }
  [Symbol.asyncIterator]() {
    let e = 0;
    return {
      next: async () => {
        do {
          if (this._state === 2)
            throw this._error;
          if (e < this._results.length)
            return { done: !1, value: this._results[e++] };
          if (this._state === 1)
            return { done: !0, value: void 0 };
          await Jn.toPromise(this._onStateChanged.event);
        } while (!0);
      },
      return: async () => (this._onReturn?.(), { done: !0, value: void 0 })
    };
  }
  static map(e, n) {
    return new pe(async (r) => {
      for await (const i of e)
        r.emitOne(n(i));
    });
  }
  map(e) {
    return pe.map(this, e);
  }
  static filter(e, n) {
    return new pe(async (r) => {
      for await (const i of e)
        n(i) && r.emitOne(i);
    });
  }
  filter(e) {
    return pe.filter(this, e);
  }
  static coalesce(e) {
    return pe.filter(e, (n) => !!n);
  }
  coalesce() {
    return pe.coalesce(this);
  }
  static async toPromise(e) {
    const n = [];
    for await (const r of e)
      n.push(r);
    return n;
  }
  toPromise() {
    return pe.toPromise(this);
  }
  /**
   * The value will be appended at the end.
   *
   * **NOTE** If `resolve()` or `reject()` have already been called, this method has no effect.
   */
  emitOne(e) {
    this._state === 0 && (this._results.push(e), this._onStateChanged.fire());
  }
  /**
   * The values will be appended at the end.
   *
   * **NOTE** If `resolve()` or `reject()` have already been called, this method has no effect.
   */
  emitMany(e) {
    this._state === 0 && (this._results = this._results.concat(e), this._onStateChanged.fire());
  }
  /**
   * Calling `resolve()` will mark the result array as complete.
   *
   * **NOTE** `resolve()` must be called, otherwise all consumers of this iterable will hang indefinitely, similar to a non-resolved promise.
   * **NOTE** If `resolve()` or `reject()` have already been called, this method has no effect.
   */
  resolve() {
    this._state === 0 && (this._state = 1, this._onStateChanged.fire());
  }
  /**
   * Writing an error will permanently invalidate this iterable.
   * The current users will receive an error thrown, as will all future users.
   *
   * **NOTE** If `resolve()` or `reject()` have already been called, this method has no effect.
   */
  reject(e) {
    this._state === 0 && (this._state = 2, this._error = e, this._onStateChanged.fire());
  }
};
pe.EMPTY = pe.fromArray([]);
let u1 = pe;
class xf {
  constructor(e) {
    this.values = e, this.prefixSum = new Uint32Array(e.length), this.prefixSumValidIndex = new Int32Array(1), this.prefixSumValidIndex[0] = -1;
  }
  insertValues(e, n) {
    e = Tt(e);
    const r = this.values, i = this.prefixSum, s = n.length;
    return s === 0 ? !1 : (this.values = new Uint32Array(r.length + s), this.values.set(r.subarray(0, e), 0), this.values.set(r.subarray(e), e + s), this.values.set(n, e), e - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = e - 1), this.prefixSum = new Uint32Array(this.values.length), this.prefixSumValidIndex[0] >= 0 && this.prefixSum.set(i.subarray(0, this.prefixSumValidIndex[0] + 1)), !0);
  }
  setValue(e, n) {
    return e = Tt(e), n = Tt(n), this.values[e] === n ? !1 : (this.values[e] = n, e - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = e - 1), !0);
  }
  removeValues(e, n) {
    e = Tt(e), n = Tt(n);
    const r = this.values, i = this.prefixSum;
    if (e >= r.length)
      return !1;
    const s = r.length - e;
    return n >= s && (n = s), n === 0 ? !1 : (this.values = new Uint32Array(r.length - n), this.values.set(r.subarray(0, e), 0), this.values.set(r.subarray(e + n), e), this.prefixSum = new Uint32Array(this.values.length), e - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = e - 1), this.prefixSumValidIndex[0] >= 0 && this.prefixSum.set(i.subarray(0, this.prefixSumValidIndex[0] + 1)), !0);
  }
  getTotalSum() {
    return this.values.length === 0 ? 0 : this._getPrefixSum(this.values.length - 1);
  }
  /**
   * Returns the sum of the first `index + 1` many items.
   * @returns `SUM(0 <= j <= index, values[j])`.
   */
  getPrefixSum(e) {
    return e < 0 ? 0 : (e = Tt(e), this._getPrefixSum(e));
  }
  _getPrefixSum(e) {
    if (e <= this.prefixSumValidIndex[0])
      return this.prefixSum[e];
    let n = this.prefixSumValidIndex[0] + 1;
    n === 0 && (this.prefixSum[0] = this.values[0], n++), e >= this.values.length && (e = this.values.length - 1);
    for (let r = n; r <= e; r++)
      this.prefixSum[r] = this.prefixSum[r - 1] + this.values[r];
    return this.prefixSumValidIndex[0] = Math.max(this.prefixSumValidIndex[0], e), this.prefixSum[e];
  }
  getIndexOf(e) {
    e = Math.floor(e), this.getTotalSum();
    let n = 0, r = this.values.length - 1, i = 0, s = 0, o = 0;
    for (; n <= r; )
      if (i = n + (r - n) / 2 | 0, s = this.prefixSum[i], o = s - this.values[i], e < o)
        r = i - 1;
      else if (e >= s)
        n = i + 1;
      else
        break;
    return new _f(i, e - o);
  }
}
class _f {
  constructor(e, n) {
    this.index = e, this.remainder = n, this._prefixSumIndexOfResultBrand = void 0, this.index = e, this.remainder = n;
  }
}
class Lf {
  constructor(e, n, r, i) {
    this._uri = e, this._lines = n, this._eol = r, this._versionId = i, this._lineStarts = null, this._cachedTextValue = null;
  }
  dispose() {
    this._lines.length = 0;
  }
  get version() {
    return this._versionId;
  }
  getText() {
    return this._cachedTextValue === null && (this._cachedTextValue = this._lines.join(this._eol)), this._cachedTextValue;
  }
  onEvents(e) {
    e.eol && e.eol !== this._eol && (this._eol = e.eol, this._lineStarts = null);
    const n = e.changes;
    for (const r of n)
      this._acceptDeleteRange(r.range), this._acceptInsertText(new ne(r.range.startLineNumber, r.range.startColumn), r.text);
    this._versionId = e.versionId, this._cachedTextValue = null;
  }
  _ensureLineStarts() {
    if (!this._lineStarts) {
      const e = this._eol.length, n = this._lines.length, r = new Uint32Array(n);
      for (let i = 0; i < n; i++)
        r[i] = this._lines[i].length + e;
      this._lineStarts = new xf(r);
    }
  }
  /**
   * All changes to a line's text go through this method
   */
  _setLineText(e, n) {
    this._lines[e] = n, this._lineStarts && this._lineStarts.setValue(e, this._lines[e].length + this._eol.length);
  }
  _acceptDeleteRange(e) {
    if (e.startLineNumber === e.endLineNumber) {
      if (e.startColumn === e.endColumn)
        return;
      this._setLineText(e.startLineNumber - 1, this._lines[e.startLineNumber - 1].substring(0, e.startColumn - 1) + this._lines[e.startLineNumber - 1].substring(e.endColumn - 1));
      return;
    }
    this._setLineText(e.startLineNumber - 1, this._lines[e.startLineNumber - 1].substring(0, e.startColumn - 1) + this._lines[e.endLineNumber - 1].substring(e.endColumn - 1)), this._lines.splice(e.startLineNumber, e.endLineNumber - e.startLineNumber), this._lineStarts && this._lineStarts.removeValues(e.startLineNumber, e.endLineNumber - e.startLineNumber);
  }
  _acceptInsertText(e, n) {
    if (n.length === 0)
      return;
    const r = dc(n);
    if (r.length === 1) {
      this._setLineText(e.lineNumber - 1, this._lines[e.lineNumber - 1].substring(0, e.column - 1) + r[0] + this._lines[e.lineNumber - 1].substring(e.column - 1));
      return;
    }
    r[r.length - 1] += this._lines[e.lineNumber - 1].substring(e.column - 1), this._setLineText(e.lineNumber - 1, this._lines[e.lineNumber - 1].substring(0, e.column - 1) + r[0]);
    const i = new Uint32Array(r.length - 1);
    for (let s = 1; s < r.length; s++)
      this._lines.splice(e.lineNumber + s - 1, 0, r[s]), i[s - 1] = r[s].length + this._eol.length;
    this._lineStarts && this._lineStarts.insertValues(e.lineNumber, i);
  }
}
class Nf {
  constructor() {
    this._models = /* @__PURE__ */ Object.create(null);
  }
  getModel(e) {
    return this._models[e];
  }
  getModels() {
    const e = [];
    return Object.keys(this._models).forEach((n) => e.push(this._models[n])), e;
  }
  $acceptNewModel(e) {
    this._models[e.url] = new Af($e.parse(e.url), e.lines, e.EOL, e.versionId);
  }
  $acceptModelChanged(e, n) {
    if (!this._models[e])
      return;
    this._models[e].onEvents(n);
  }
  $acceptRemovedModel(e) {
    this._models[e] && delete this._models[e];
  }
}
class Af extends Lf {
  get uri() {
    return this._uri;
  }
  get eol() {
    return this._eol;
  }
  getValue() {
    return this.getText();
  }
  findMatches(e) {
    const n = [];
    for (let r = 0; r < this._lines.length; r++) {
      const i = this._lines[r], s = this.offsetAt(new ne(r + 1, 1)), o = i.matchAll(e);
      for (const l of o)
        (l.index || l.index === 0) && (l.index = l.index + s), n.push(l);
    }
    return n;
  }
  getLinesContent() {
    return this._lines.slice(0);
  }
  getLineCount() {
    return this._lines.length;
  }
  getLineContent(e) {
    return this._lines[e - 1];
  }
  getWordAtPosition(e, n) {
    const r = es(e.column, sl(n), this._lines[e.lineNumber - 1], 0);
    return r ? new G(e.lineNumber, r.startColumn, e.lineNumber, r.endColumn) : null;
  }
  words(e) {
    const n = this._lines, r = this._wordenize.bind(this);
    let i = 0, s = "", o = 0, l = [];
    return {
      *[Symbol.iterator]() {
        for (; ; )
          if (o < l.length) {
            const a = s.substring(l[o].start, l[o].end);
            o += 1, yield a;
          } else if (i < n.length)
            s = n[i], l = r(s, e), o = 0, i += 1;
          else
            break;
      }
    };
  }
  getLineWords(e, n) {
    const r = this._lines[e - 1], i = this._wordenize(r, n), s = [];
    for (const o of i)
      s.push({
        word: r.substring(o.start, o.end),
        startColumn: o.start + 1,
        endColumn: o.end + 1
      });
    return s;
  }
  _wordenize(e, n) {
    const r = [];
    let i;
    for (n.lastIndex = 0; (i = n.exec(e)) && i[0].length !== 0; )
      r.push({ start: i.index, end: i.index + i[0].length });
    return r;
  }
  getValueInRange(e) {
    if (e = this._validateRange(e), e.startLineNumber === e.endLineNumber)
      return this._lines[e.startLineNumber - 1].substring(e.startColumn - 1, e.endColumn - 1);
    const n = this._eol, r = e.startLineNumber - 1, i = e.endLineNumber - 1, s = [];
    s.push(this._lines[r].substring(e.startColumn - 1));
    for (let o = r + 1; o < i; o++)
      s.push(this._lines[o]);
    return s.push(this._lines[i].substring(0, e.endColumn - 1)), s.join(n);
  }
  offsetAt(e) {
    return e = this._validatePosition(e), this._ensureLineStarts(), this._lineStarts.getPrefixSum(e.lineNumber - 2) + (e.column - 1);
  }
  positionAt(e) {
    e = Math.floor(e), e = Math.max(0, e), this._ensureLineStarts();
    const n = this._lineStarts.getIndexOf(e), r = this._lines[n.index].length;
    return {
      lineNumber: 1 + n.index,
      column: 1 + Math.min(n.remainder, r)
    };
  }
  _validateRange(e) {
    const n = this._validatePosition({ lineNumber: e.startLineNumber, column: e.startColumn }), r = this._validatePosition({ lineNumber: e.endLineNumber, column: e.endColumn });
    return n.lineNumber !== e.startLineNumber || n.column !== e.startColumn || r.lineNumber !== e.endLineNumber || r.column !== e.endColumn ? {
      startLineNumber: n.lineNumber,
      startColumn: n.column,
      endLineNumber: r.lineNumber,
      endColumn: r.column
    } : e;
  }
  _validatePosition(e) {
    if (!ne.isIPosition(e))
      throw new Error("bad position");
    let { lineNumber: n, column: r } = e, i = !1;
    if (n < 1)
      n = 1, r = 1, i = !0;
    else if (n > this._lines.length)
      n = this._lines.length, r = this._lines[n - 1].length + 1, i = !0;
    else {
      const s = this._lines[n - 1].length + 1;
      r < 1 ? (r = 1, i = !0) : r > s && (r = s, i = !0);
    }
    return i ? { lineNumber: n, column: r } : e;
  }
}
const br = class br {
  constructor() {
    this._workerTextModelSyncServer = new Nf();
  }
  dispose() {
  }
  _getModel(e) {
    return this._workerTextModelSyncServer.getModel(e);
  }
  _getModels() {
    return this._workerTextModelSyncServer.getModels();
  }
  $acceptNewModel(e) {
    this._workerTextModelSyncServer.$acceptNewModel(e);
  }
  $acceptModelChanged(e, n) {
    this._workerTextModelSyncServer.$acceptModelChanged(e, n);
  }
  $acceptRemovedModel(e) {
    this._workerTextModelSyncServer.$acceptRemovedModel(e);
  }
  async $computeUnicodeHighlights(e, n, r) {
    const i = this._getModel(e);
    return i ? M0.computeUnicodeHighlights(i, n, r) : { ranges: [], hasMore: !1, ambiguousCharacterCount: 0, invisibleCharacterCount: 0, nonBasicAsciiCharacterCount: 0 };
  }
  async $findSectionHeaders(e, n) {
    const r = this._getModel(e);
    return r ? bf(r, n) : [];
  }
  // ---- BEGIN diff --------------------------------------------------------------------------
  async $computeDiff(e, n, r, i) {
    const s = this._getModel(e), o = this._getModel(n);
    return !s || !o ? null : jn.computeDiff(s, o, r, i);
  }
  static computeDiff(e, n, r, i) {
    const s = i === "advanced" ? i1.getDefault() : i1.getLegacy(), o = e.getLinesContent(), l = n.getLinesContent(), a = s.computeDiff(o, l, r), u = a.changes.length > 0 ? !1 : this._modelsAreIdentical(e, n);
    function h(c) {
      return c.map((m) => [m.original.startLineNumber, m.original.endLineNumberExclusive, m.modified.startLineNumber, m.modified.endLineNumberExclusive, m.innerChanges?.map((d) => [
        d.originalRange.startLineNumber,
        d.originalRange.startColumn,
        d.originalRange.endLineNumber,
        d.originalRange.endColumn,
        d.modifiedRange.startLineNumber,
        d.modifiedRange.startColumn,
        d.modifiedRange.endLineNumber,
        d.modifiedRange.endColumn
      ])]);
    }
    return {
      identical: u,
      quitEarly: a.hitTimeout,
      changes: h(a.changes),
      moves: a.moves.map((c) => [
        c.lineRangeMapping.original.startLineNumber,
        c.lineRangeMapping.original.endLineNumberExclusive,
        c.lineRangeMapping.modified.startLineNumber,
        c.lineRangeMapping.modified.endLineNumberExclusive,
        h(c.changes)
      ])
    };
  }
  static _modelsAreIdentical(e, n) {
    const r = e.getLineCount(), i = n.getLineCount();
    if (r !== i)
      return !1;
    for (let s = 1; s <= r; s++) {
      const o = e.getLineContent(s), l = n.getLineContent(s);
      if (o !== l)
        return !1;
    }
    return !0;
  }
  async $computeMoreMinimalEdits(e, n, r) {
    const i = this._getModel(e);
    if (!i)
      return n;
    const s = [];
    let o;
    n = n.slice(0).sort((a, u) => {
      if (a.range && u.range)
        return G.compareRangesUsingStarts(a.range, u.range);
      const h = a.range ? 0 : 1, c = u.range ? 0 : 1;
      return h - c;
    });
    let l = 0;
    for (let a = 1; a < n.length; a++)
      G.getEndPosition(n[l].range).equals(G.getStartPosition(n[a].range)) ? (n[l].range = G.fromPositions(G.getStartPosition(n[l].range), G.getEndPosition(n[a].range)), n[l].text += n[a].text) : (l++, n[l] = n[a]);
    n.length = l + 1;
    for (let { range: a, text: u, eol: h } of n) {
      if (typeof h == "number" && (o = h), G.isEmpty(a) && !u)
        continue;
      const c = i.getValueInRange(a);
      if (u = u.replace(/\r\n|\n|\r/g, i.eol), c === u)
        continue;
      if (Math.max(u.length, c.length) > jn._diffLimit) {
        s.push({ range: a, text: u });
        continue;
      }
      const m = Kc(c, u, r), d = i.offsetAt(G.lift(a).getStartPosition());
      for (const g of m) {
        const p = i.positionAt(d + g.originalStart), y = i.positionAt(d + g.originalStart + g.originalLength), _ = {
          text: u.substr(g.modifiedStart, g.modifiedLength),
          range: { startLineNumber: p.lineNumber, startColumn: p.column, endLineNumber: y.lineNumber, endColumn: y.column }
        };
        i.getValueInRange(_.range) !== _.text && s.push(_);
      }
    }
    return typeof o == "number" && s.push({ eol: o, text: "", range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 } }), s;
  }
  // ---- END minimal edits ---------------------------------------------------------------
  async $computeLinks(e) {
    const n = this._getModel(e);
    return n ? i0(n) : null;
  }
  // --- BEGIN default document colors -----------------------------------------------------------
  async $computeDefaultDocumentColors(e) {
    const n = this._getModel(e);
    return n ? gf(n) : null;
  }
  async $textualSuggest(e, n, r, i) {
    const s = new wr(), o = new RegExp(r, i), l = /* @__PURE__ */ new Set();
    e: for (const a of e) {
      const u = this._getModel(a);
      if (u) {
        for (const h of u.words(o))
          if (!(h === n || !isNaN(Number(h))) && (l.add(h), l.size > jn._suggestionsLimit))
            break e;
      }
    }
    return { words: Array.from(l), duration: s.elapsed() };
  }
  // ---- END suggest --------------------------------------------------------------------------
  //#region -- word ranges --
  async $computeWordRanges(e, n, r, i) {
    const s = this._getModel(e);
    if (!s)
      return /* @__PURE__ */ Object.create(null);
    const o = new RegExp(r, i), l = /* @__PURE__ */ Object.create(null);
    for (let a = n.startLineNumber; a < n.endLineNumber; a++) {
      const u = s.getLineWords(a, o);
      for (const h of u) {
        if (!isNaN(Number(h.word)))
          continue;
        let c = l[h.word];
        c || (c = [], l[h.word] = c), c.push({
          startLineNumber: a,
          startColumn: h.startColumn,
          endLineNumber: a,
          endColumn: h.endColumn
        });
      }
    }
    return l;
  }
  //#endregion
  async $navigateValueSet(e, n, r, i, s) {
    const o = this._getModel(e);
    if (!o)
      return null;
    const l = new RegExp(i, s);
    n.startColumn === n.endColumn && (n = {
      startLineNumber: n.startLineNumber,
      startColumn: n.startColumn,
      endLineNumber: n.endLineNumber,
      endColumn: n.endColumn + 1
    });
    const a = o.getValueInRange(n), u = o.getWordAtPosition({ lineNumber: n.startLineNumber, column: n.startColumn }, l);
    if (!u)
      return null;
    const h = o.getValueInRange(u);
    return ii.INSTANCE.navigateValueSet(n, a, u, h, r);
  }
};
br._diffLimit = 1e5, br._suggestionsLimit = 1e4;
let yi = br;
class jn extends yi {
  constructor(e, n) {
    super(), this._host = e, this._foreignModuleFactory = n, this._foreignModule = null;
  }
  async $ping() {
    return "pong";
  }
  // ---- BEGIN foreign module support --------------------------------------------------------------------------
  $loadForeignModule(e, n, r) {
    const o = {
      host: x0(r, (l, a) => this._host.$fhr(l, a)),
      getMirrorModels: () => this._getModels()
    };
    return this._foreignModuleFactory ? (this._foreignModule = this._foreignModuleFactory(o, n), Promise.resolve(Bo(this._foreignModule))) : new Promise((l, a) => {
      const u = (h) => {
        this._foreignModule = h.create(o, n), l(Bo(this._foreignModule));
      };
      import(`${Za.asBrowserUri(`${e}.js`).toString(!0)}`).then(u).catch(a);
    });
  }
  // foreign method request
  $fmr(e, n) {
    if (!this._foreignModule || typeof this._foreignModule[e] != "function")
      return Promise.reject(new Error("Missing requestHandler or method: " + e));
    try {
      return Promise.resolve(this._foreignModule[e].apply(this._foreignModule, n));
    } catch (r) {
      return Promise.reject(r);
    }
  }
}
typeof importScripts == "function" && (globalThis.monaco = g0());
let vi = !1;
function fl(t) {
  if (vi)
    return;
  vi = !0;
  const e = new Xc((n) => {
    globalThis.postMessage(n);
  }, (n) => new jn(hi.getChannel(n), t));
  globalThis.onmessage = (n) => {
    e.onmessage(n.data);
  };
}
globalThis.onmessage = (t) => {
  vi || fl(null);
};
function ns(t, e = !1) {
  const n = t.length;
  let r = 0, i = "", s = 0, o = 16, l = 0, a = 0, u = 0, h = 0, c = 0;
  function m(v, w) {
    let b = 0, x = 0;
    for (; b < v; ) {
      let A = t.charCodeAt(r);
      if (A >= 48 && A <= 57)
        x = x * 16 + A - 48;
      else if (A >= 65 && A <= 70)
        x = x * 16 + A - 65 + 10;
      else if (A >= 97 && A <= 102)
        x = x * 16 + A - 97 + 10;
      else
        break;
      r++, b++;
    }
    return b < v && (x = -1), x;
  }
  function d(v) {
    r = v, i = "", s = 0, o = 16, c = 0;
  }
  function g() {
    let v = r;
    if (t.charCodeAt(r) === 48)
      r++;
    else
      for (r++; r < t.length && It(t.charCodeAt(r)); )
        r++;
    if (r < t.length && t.charCodeAt(r) === 46)
      if (r++, r < t.length && It(t.charCodeAt(r)))
        for (r++; r < t.length && It(t.charCodeAt(r)); )
          r++;
      else
        return c = 3, t.substring(v, r);
    let w = r;
    if (r < t.length && (t.charCodeAt(r) === 69 || t.charCodeAt(r) === 101))
      if (r++, (r < t.length && t.charCodeAt(r) === 43 || t.charCodeAt(r) === 45) && r++, r < t.length && It(t.charCodeAt(r))) {
        for (r++; r < t.length && It(t.charCodeAt(r)); )
          r++;
        w = r;
      } else
        c = 3;
    return t.substring(v, w);
  }
  function p() {
    let v = "", w = r;
    for (; ; ) {
      if (r >= n) {
        v += t.substring(w, r), c = 2;
        break;
      }
      const b = t.charCodeAt(r);
      if (b === 34) {
        v += t.substring(w, r), r++;
        break;
      }
      if (b === 92) {
        if (v += t.substring(w, r), r++, r >= n) {
          c = 2;
          break;
        }
        switch (t.charCodeAt(r++)) {
          case 34:
            v += '"';
            break;
          case 92:
            v += "\\";
            break;
          case 47:
            v += "/";
            break;
          case 98:
            v += "\b";
            break;
          case 102:
            v += "\f";
            break;
          case 110:
            v += `
`;
            break;
          case 114:
            v += "\r";
            break;
          case 116:
            v += "	";
            break;
          case 117:
            const A = m(4);
            A >= 0 ? v += String.fromCharCode(A) : c = 4;
            break;
          default:
            c = 5;
        }
        w = r;
        continue;
      }
      if (b >= 0 && b <= 31)
        if (un(b)) {
          v += t.substring(w, r), c = 2;
          break;
        } else
          c = 6;
      r++;
    }
    return v;
  }
  function y() {
    if (i = "", c = 0, s = r, a = l, h = u, r >= n)
      return s = n, o = 17;
    let v = t.charCodeAt(r);
    if (Br(v)) {
      do
        r++, i += String.fromCharCode(v), v = t.charCodeAt(r);
      while (Br(v));
      return o = 15;
    }
    if (un(v))
      return r++, i += String.fromCharCode(v), v === 13 && t.charCodeAt(r) === 10 && (r++, i += `
`), l++, u = r, o = 14;
    switch (v) {
      case 123:
        return r++, o = 1;
      case 125:
        return r++, o = 2;
      case 91:
        return r++, o = 3;
      case 93:
        return r++, o = 4;
      case 58:
        return r++, o = 6;
      case 44:
        return r++, o = 5;
      case 34:
        return r++, i = p(), o = 10;
      case 47:
        const w = r - 1;
        if (t.charCodeAt(r + 1) === 47) {
          for (r += 2; r < n && !un(t.charCodeAt(r)); )
            r++;
          return i = t.substring(w, r), o = 12;
        }
        if (t.charCodeAt(r + 1) === 42) {
          r += 2;
          const b = n - 1;
          let x = !1;
          for (; r < b; ) {
            const A = t.charCodeAt(r);
            if (A === 42 && t.charCodeAt(r + 1) === 47) {
              r += 2, x = !0;
              break;
            }
            r++, un(A) && (A === 13 && t.charCodeAt(r) === 10 && r++, l++, u = r);
          }
          return x || (r++, c = 1), i = t.substring(w, r), o = 13;
        }
        return i += String.fromCharCode(v), r++, o = 16;
      case 45:
        if (i += String.fromCharCode(v), r++, r === n || !It(t.charCodeAt(r)))
          return o = 16;
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        return i += g(), o = 11;
      default:
        for (; r < n && _(v); )
          r++, v = t.charCodeAt(r);
        if (s !== r) {
          switch (i = t.substring(s, r), i) {
            case "true":
              return o = 8;
            case "false":
              return o = 9;
            case "null":
              return o = 7;
          }
          return o = 16;
        }
        return i += String.fromCharCode(v), r++, o = 16;
    }
  }
  function _(v) {
    if (Br(v) || un(v))
      return !1;
    switch (v) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return !1;
    }
    return !0;
  }
  function L() {
    let v;
    do
      v = y();
    while (v >= 12 && v <= 15);
    return v;
  }
  return {
    setPosition: d,
    getPosition: () => r,
    scan: e ? L : y,
    getToken: () => o,
    getTokenValue: () => i,
    getTokenOffset: () => s,
    getTokenLength: () => r - s,
    getTokenStartLine: () => a,
    getTokenStartCharacter: () => s - h,
    getTokenError: () => c
  };
}
function Br(t) {
  return t === 32 || t === 9;
}
function un(t) {
  return t === 10 || t === 13;
}
function It(t) {
  return t >= 48 && t <= 57;
}
var c1;
(function(t) {
  t[t.lineFeed = 10] = "lineFeed", t[t.carriageReturn = 13] = "carriageReturn", t[t.space = 32] = "space", t[t._0 = 48] = "_0", t[t._1 = 49] = "_1", t[t._2 = 50] = "_2", t[t._3 = 51] = "_3", t[t._4 = 52] = "_4", t[t._5 = 53] = "_5", t[t._6 = 54] = "_6", t[t._7 = 55] = "_7", t[t._8 = 56] = "_8", t[t._9 = 57] = "_9", t[t.a = 97] = "a", t[t.b = 98] = "b", t[t.c = 99] = "c", t[t.d = 100] = "d", t[t.e = 101] = "e", t[t.f = 102] = "f", t[t.g = 103] = "g", t[t.h = 104] = "h", t[t.i = 105] = "i", t[t.j = 106] = "j", t[t.k = 107] = "k", t[t.l = 108] = "l", t[t.m = 109] = "m", t[t.n = 110] = "n", t[t.o = 111] = "o", t[t.p = 112] = "p", t[t.q = 113] = "q", t[t.r = 114] = "r", t[t.s = 115] = "s", t[t.t = 116] = "t", t[t.u = 117] = "u", t[t.v = 118] = "v", t[t.w = 119] = "w", t[t.x = 120] = "x", t[t.y = 121] = "y", t[t.z = 122] = "z", t[t.A = 65] = "A", t[t.B = 66] = "B", t[t.C = 67] = "C", t[t.D = 68] = "D", t[t.E = 69] = "E", t[t.F = 70] = "F", t[t.G = 71] = "G", t[t.H = 72] = "H", t[t.I = 73] = "I", t[t.J = 74] = "J", t[t.K = 75] = "K", t[t.L = 76] = "L", t[t.M = 77] = "M", t[t.N = 78] = "N", t[t.O = 79] = "O", t[t.P = 80] = "P", t[t.Q = 81] = "Q", t[t.R = 82] = "R", t[t.S = 83] = "S", t[t.T = 84] = "T", t[t.U = 85] = "U", t[t.V = 86] = "V", t[t.W = 87] = "W", t[t.X = 88] = "X", t[t.Y = 89] = "Y", t[t.Z = 90] = "Z", t[t.asterisk = 42] = "asterisk", t[t.backslash = 92] = "backslash", t[t.closeBrace = 125] = "closeBrace", t[t.closeBracket = 93] = "closeBracket", t[t.colon = 58] = "colon", t[t.comma = 44] = "comma", t[t.dot = 46] = "dot", t[t.doubleQuote = 34] = "doubleQuote", t[t.minus = 45] = "minus", t[t.openBrace = 123] = "openBrace", t[t.openBracket = 91] = "openBracket", t[t.plus = 43] = "plus", t[t.slash = 47] = "slash", t[t.formFeed = 12] = "formFeed", t[t.tab = 9] = "tab";
})(c1 || (c1 = {}));
var Ee = new Array(20).fill(0).map((t, e) => " ".repeat(e)), Pt = 200, f1 = {
  " ": {
    "\n": new Array(Pt).fill(0).map((t, e) => `
` + " ".repeat(e)),
    "\r": new Array(Pt).fill(0).map((t, e) => "\r" + " ".repeat(e)),
    "\r\n": new Array(Pt).fill(0).map((t, e) => `\r
` + " ".repeat(e))
  },
  "	": {
    "\n": new Array(Pt).fill(0).map((t, e) => `
` + "	".repeat(e)),
    "\r": new Array(Pt).fill(0).map((t, e) => "\r" + "	".repeat(e)),
    "\r\n": new Array(Pt).fill(0).map((t, e) => `\r
` + "	".repeat(e))
  }
}, Sf = [`
`, "\r", `\r
`];
function Ef(t, e, n) {
  let r, i, s, o, l;
  if (e) {
    for (o = e.offset, l = o + e.length, s = o; s > 0 && !h1(t, s - 1); )
      s--;
    let b = l;
    for (; b < t.length && !h1(t, b); )
      b++;
    i = t.substring(s, b), r = kf(i, n);
  } else
    i = t, r = 0, s = 0, o = 0, l = t.length;
  const a = Rf(n, t), u = Sf.includes(a);
  let h = 0, c = 0, m;
  n.insertSpaces ? m = Ee[n.tabSize || 4] ?? Ft(Ee[1], n.tabSize || 4) : m = "	";
  const d = m === "	" ? "	" : " ";
  let g = ns(i, !1), p = !1;
  function y() {
    if (h > 1)
      return Ft(a, h) + Ft(m, r + c);
    const b = m.length * (r + c);
    return !u || b > f1[d][a].length ? a + Ft(m, r + c) : b <= 0 ? a : f1[d][a][b];
  }
  function _() {
    let b = g.scan();
    for (h = 0; b === 15 || b === 14; )
      b === 14 && n.keepLines ? h += 1 : b === 14 && (h = 1), b = g.scan();
    return p = b === 16 || g.getTokenError() !== 0, b;
  }
  const L = [];
  function v(b, x, A) {
    !p && (!e || x < l && A > o) && t.substring(x, A) !== b && L.push({ offset: x, length: A - x, content: b });
  }
  let w = _();
  if (n.keepLines && h > 0 && v(Ft(a, h), 0, 0), w !== 17) {
    let b = g.getTokenOffset() + s, x = m.length * r < 20 && n.insertSpaces ? Ee[m.length * r] : Ft(m, r);
    v(x, s, b);
  }
  for (; w !== 17; ) {
    let b = g.getTokenOffset() + g.getTokenLength() + s, x = _(), A = "", T = !1;
    for (; h === 0 && (x === 12 || x === 13); ) {
      let O = g.getTokenOffset() + s;
      v(Ee[1], b, O), b = g.getTokenOffset() + g.getTokenLength() + s, T = x === 12, A = T ? y() : "", x = _();
    }
    if (x === 2)
      w !== 1 && c--, n.keepLines && h > 0 || !n.keepLines && w !== 1 ? A = y() : n.keepLines && (A = Ee[1]);
    else if (x === 4)
      w !== 3 && c--, n.keepLines && h > 0 || !n.keepLines && w !== 3 ? A = y() : n.keepLines && (A = Ee[1]);
    else {
      switch (w) {
        case 3:
        case 1:
          c++, n.keepLines && h > 0 || !n.keepLines ? A = y() : A = Ee[1];
          break;
        case 5:
          n.keepLines && h > 0 || !n.keepLines ? A = y() : A = Ee[1];
          break;
        case 12:
          A = y();
          break;
        case 13:
          h > 0 ? A = y() : T || (A = Ee[1]);
          break;
        case 6:
          n.keepLines && h > 0 ? A = y() : T || (A = Ee[1]);
          break;
        case 10:
          n.keepLines && h > 0 ? A = y() : x === 6 && !T && (A = "");
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          n.keepLines && h > 0 ? A = y() : (x === 12 || x === 13) && !T ? A = Ee[1] : x !== 5 && x !== 17 && (p = !0);
          break;
        case 16:
          p = !0;
          break;
      }
      h > 0 && (x === 12 || x === 13) && (A = y());
    }
    x === 17 && (n.keepLines && h > 0 ? A = y() : A = n.insertFinalNewline ? a : "");
    const D = g.getTokenOffset() + s;
    v(A, b, D), w = x;
  }
  return L;
}
function Ft(t, e) {
  let n = "";
  for (let r = 0; r < e; r++)
    n += t;
  return n;
}
function kf(t, e) {
  let n = 0, r = 0;
  const i = e.tabSize || 4;
  for (; n < t.length; ) {
    let s = t.charAt(n);
    if (s === Ee[1])
      r++;
    else if (s === "	")
      r += i;
    else
      break;
    n++;
  }
  return Math.floor(r / i);
}
function Rf(t, e) {
  for (let n = 0; n < e.length; n++) {
    const r = e.charAt(n);
    if (r === "\r")
      return n + 1 < e.length && e.charAt(n + 1) === `
` ? `\r
` : "\r";
    if (r === `
`)
      return `
`;
  }
  return t && t.eol || `
`;
}
function h1(t, e) {
  return `\r
`.indexOf(t.charAt(e)) !== -1;
}
var sr;
(function(t) {
  t.DEFAULT = {
    allowTrailingComma: !1
  };
})(sr || (sr = {}));
function Mf(t, e = [], n = sr.DEFAULT) {
  let r = null, i = [];
  const s = [];
  function o(a) {
    Array.isArray(i) ? i.push(a) : r !== null && (i[r] = a);
  }
  return Cf(t, {
    onObjectBegin: () => {
      const a = {};
      o(a), s.push(i), i = a, r = null;
    },
    onObjectProperty: (a) => {
      r = a;
    },
    onObjectEnd: () => {
      i = s.pop();
    },
    onArrayBegin: () => {
      const a = [];
      o(a), s.push(i), i = a, r = null;
    },
    onArrayEnd: () => {
      i = s.pop();
    },
    onLiteralValue: o,
    onError: (a, u, h) => {
      e.push({ error: a, offset: u, length: h });
    }
  }, n), i[0];
}
function hl(t) {
  if (!t.parent || !t.parent.children)
    return [];
  const e = hl(t.parent);
  if (t.parent.type === "property") {
    const n = t.parent.children[0].value;
    e.push(n);
  } else if (t.parent.type === "array") {
    const n = t.parent.children.indexOf(t);
    n !== -1 && e.push(n);
  }
  return e;
}
function wi(t) {
  switch (t.type) {
    case "array":
      return t.children.map(wi);
    case "object":
      const e = /* @__PURE__ */ Object.create(null);
      for (let n of t.children) {
        const r = n.children[1];
        r && (e[n.children[0].value] = wi(r));
      }
      return e;
    case "null":
    case "string":
    case "number":
    case "boolean":
      return t.value;
    default:
      return;
  }
}
function Tf(t, e, n = !1) {
  return e >= t.offset && e < t.offset + t.length || n && e === t.offset + t.length;
}
function ml(t, e, n = !1) {
  if (Tf(t, e, n)) {
    const r = t.children;
    if (Array.isArray(r))
      for (let i = 0; i < r.length && r[i].offset <= e; i++) {
        const s = ml(r[i], e, n);
        if (s)
          return s;
      }
    return t;
  }
}
function Cf(t, e, n = sr.DEFAULT) {
  const r = ns(t, !1), i = [];
  function s(N) {
    return N ? () => N(r.getTokenOffset(), r.getTokenLength(), r.getTokenStartLine(), r.getTokenStartCharacter()) : () => !0;
  }
  function o(N) {
    return N ? () => N(r.getTokenOffset(), r.getTokenLength(), r.getTokenStartLine(), r.getTokenStartCharacter(), () => i.slice()) : () => !0;
  }
  function l(N) {
    return N ? (E) => N(E, r.getTokenOffset(), r.getTokenLength(), r.getTokenStartLine(), r.getTokenStartCharacter()) : () => !0;
  }
  function a(N) {
    return N ? (E) => N(E, r.getTokenOffset(), r.getTokenLength(), r.getTokenStartLine(), r.getTokenStartCharacter(), () => i.slice()) : () => !0;
  }
  const u = o(e.onObjectBegin), h = a(e.onObjectProperty), c = s(e.onObjectEnd), m = o(e.onArrayBegin), d = s(e.onArrayEnd), g = a(e.onLiteralValue), p = l(e.onSeparator), y = s(e.onComment), _ = l(e.onError), L = n && n.disallowComments, v = n && n.allowTrailingComma;
  function w() {
    for (; ; ) {
      const N = r.scan();
      switch (r.getTokenError()) {
        case 4:
          b(
            14
            /* ParseErrorCode.InvalidUnicode */
          );
          break;
        case 5:
          b(
            15
            /* ParseErrorCode.InvalidEscapeCharacter */
          );
          break;
        case 3:
          b(
            13
            /* ParseErrorCode.UnexpectedEndOfNumber */
          );
          break;
        case 1:
          L || b(
            11
            /* ParseErrorCode.UnexpectedEndOfComment */
          );
          break;
        case 2:
          b(
            12
            /* ParseErrorCode.UnexpectedEndOfString */
          );
          break;
        case 6:
          b(
            16
            /* ParseErrorCode.InvalidCharacter */
          );
          break;
      }
      switch (N) {
        case 12:
        case 13:
          L ? b(
            10
            /* ParseErrorCode.InvalidCommentToken */
          ) : y();
          break;
        case 16:
          b(
            1
            /* ParseErrorCode.InvalidSymbol */
          );
          break;
        case 15:
        case 14:
          break;
        default:
          return N;
      }
    }
  }
  function b(N, E = [], k = []) {
    if (_(N), E.length + k.length > 0) {
      let F = r.getToken();
      for (; F !== 17; ) {
        if (E.indexOf(F) !== -1) {
          w();
          break;
        } else if (k.indexOf(F) !== -1)
          break;
        F = w();
      }
    }
  }
  function x(N) {
    const E = r.getTokenValue();
    return N ? g(E) : (h(E), i.push(E)), w(), !0;
  }
  function A() {
    switch (r.getToken()) {
      case 11:
        const N = r.getTokenValue();
        let E = Number(N);
        isNaN(E) && (b(
          2
          /* ParseErrorCode.InvalidNumberFormat */
        ), E = 0), g(E);
        break;
      case 7:
        g(null);
        break;
      case 8:
        g(!0);
        break;
      case 9:
        g(!1);
        break;
      default:
        return !1;
    }
    return w(), !0;
  }
  function T() {
    return r.getToken() !== 10 ? (b(3, [], [
      2,
      5
      /* SyntaxKind.CommaToken */
    ]), !1) : (x(!1), r.getToken() === 6 ? (p(":"), w(), C() || b(4, [], [
      2,
      5
      /* SyntaxKind.CommaToken */
    ])) : b(5, [], [
      2,
      5
      /* SyntaxKind.CommaToken */
    ]), i.pop(), !0);
  }
  function D() {
    u(), w();
    let N = !1;
    for (; r.getToken() !== 2 && r.getToken() !== 17; ) {
      if (r.getToken() === 5) {
        if (N || b(4, [], []), p(","), w(), r.getToken() === 2 && v)
          break;
      } else N && b(6, [], []);
      T() || b(4, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]), N = !0;
    }
    return c(), r.getToken() !== 2 ? b(7, [
      2
      /* SyntaxKind.CloseBraceToken */
    ], []) : w(), !0;
  }
  function O() {
    m(), w();
    let N = !0, E = !1;
    for (; r.getToken() !== 4 && r.getToken() !== 17; ) {
      if (r.getToken() === 5) {
        if (E || b(4, [], []), p(","), w(), r.getToken() === 4 && v)
          break;
      } else E && b(6, [], []);
      N ? (i.push(0), N = !1) : i[i.length - 1]++, C() || b(4, [], [
        4,
        5
        /* SyntaxKind.CommaToken */
      ]), E = !0;
    }
    return d(), N || i.pop(), r.getToken() !== 4 ? b(8, [
      4
      /* SyntaxKind.CloseBracketToken */
    ], []) : w(), !0;
  }
  function C() {
    switch (r.getToken()) {
      case 3:
        return O();
      case 1:
        return D();
      case 10:
        return x(!0);
      default:
        return A();
    }
  }
  return w(), r.getToken() === 17 ? n.allowEmptyContent ? !0 : (b(4, [], []), !1) : C() ? (r.getToken() !== 17 && b(9, [], []), !0) : (b(4, [], []), !1);
}
var vt = ns, m1;
(function(t) {
  t[t.None = 0] = "None", t[t.UnexpectedEndOfComment = 1] = "UnexpectedEndOfComment", t[t.UnexpectedEndOfString = 2] = "UnexpectedEndOfString", t[t.UnexpectedEndOfNumber = 3] = "UnexpectedEndOfNumber", t[t.InvalidUnicode = 4] = "InvalidUnicode", t[t.InvalidEscapeCharacter = 5] = "InvalidEscapeCharacter", t[t.InvalidCharacter = 6] = "InvalidCharacter";
})(m1 || (m1 = {}));
var d1;
(function(t) {
  t[t.OpenBraceToken = 1] = "OpenBraceToken", t[t.CloseBraceToken = 2] = "CloseBraceToken", t[t.OpenBracketToken = 3] = "OpenBracketToken", t[t.CloseBracketToken = 4] = "CloseBracketToken", t[t.CommaToken = 5] = "CommaToken", t[t.ColonToken = 6] = "ColonToken", t[t.NullKeyword = 7] = "NullKeyword", t[t.TrueKeyword = 8] = "TrueKeyword", t[t.FalseKeyword = 9] = "FalseKeyword", t[t.StringLiteral = 10] = "StringLiteral", t[t.NumericLiteral = 11] = "NumericLiteral", t[t.LineCommentTrivia = 12] = "LineCommentTrivia", t[t.BlockCommentTrivia = 13] = "BlockCommentTrivia", t[t.LineBreakTrivia = 14] = "LineBreakTrivia", t[t.Trivia = 15] = "Trivia", t[t.Unknown = 16] = "Unknown", t[t.EOF = 17] = "EOF";
})(d1 || (d1 = {}));
var If = Mf, Pf = ml, Ff = hl, Df = wi, g1;
(function(t) {
  t[t.InvalidSymbol = 1] = "InvalidSymbol", t[t.InvalidNumberFormat = 2] = "InvalidNumberFormat", t[t.PropertyNameExpected = 3] = "PropertyNameExpected", t[t.ValueExpected = 4] = "ValueExpected", t[t.ColonExpected = 5] = "ColonExpected", t[t.CommaExpected = 6] = "CommaExpected", t[t.CloseBraceExpected = 7] = "CloseBraceExpected", t[t.CloseBracketExpected = 8] = "CloseBracketExpected", t[t.EndOfFileExpected = 9] = "EndOfFileExpected", t[t.InvalidCommentToken = 10] = "InvalidCommentToken", t[t.UnexpectedEndOfComment = 11] = "UnexpectedEndOfComment", t[t.UnexpectedEndOfString = 12] = "UnexpectedEndOfString", t[t.UnexpectedEndOfNumber = 13] = "UnexpectedEndOfNumber", t[t.InvalidUnicode = 14] = "InvalidUnicode", t[t.InvalidEscapeCharacter = 15] = "InvalidEscapeCharacter", t[t.InvalidCharacter = 16] = "InvalidCharacter";
})(g1 || (g1 = {}));
function Bf(t, e, n) {
  return Ef(t, e, n);
}
function Jt(t, e) {
  if (t === e)
    return !0;
  if (t == null || e === null || e === void 0 || typeof t != typeof e || typeof t != "object" || Array.isArray(t) !== Array.isArray(e))
    return !1;
  let n, r;
  if (Array.isArray(t)) {
    if (t.length !== e.length)
      return !1;
    for (n = 0; n < t.length; n++)
      if (!Jt(t[n], e[n]))
        return !1;
  } else {
    const i = [];
    for (r in t)
      i.push(r);
    i.sort();
    const s = [];
    for (r in e)
      s.push(r);
    if (s.sort(), !Jt(i, s))
      return !1;
    for (n = 0; n < i.length; n++)
      if (!Jt(t[i[n]], e[i[n]]))
        return !1;
  }
  return !0;
}
function he(t) {
  return typeof t == "number";
}
function Ce(t) {
  return typeof t < "u";
}
function He(t) {
  return typeof t == "boolean";
}
function dl(t) {
  return typeof t == "string";
}
function at(t) {
  return typeof t == "object" && t !== null && !Array.isArray(t);
}
function Vf(t, e) {
  if (t.length < e.length)
    return !1;
  for (let n = 0; n < e.length; n++)
    if (t[n] !== e[n])
      return !1;
  return !0;
}
function An(t, e) {
  const n = t.length - e.length;
  return n > 0 ? t.lastIndexOf(e) === n : n === 0 ? t === e : !1;
}
function or(t) {
  let e = "";
  Vf(t, "(?i)") && (t = t.substring(4), e = "i");
  try {
    return new RegExp(t, e + "u");
  } catch {
    try {
      return new RegExp(t, e);
    } catch {
      return;
    }
  }
}
function p1(t) {
  let e = 0;
  for (let n = 0; n < t.length; n++) {
    e++;
    const r = t.charCodeAt(n);
    55296 <= r && r <= 56319 && n++;
  }
  return e;
}
var b1;
(function(t) {
  function e(n) {
    return typeof n == "string";
  }
  t.is = e;
})(b1 || (b1 = {}));
var xi;
(function(t) {
  function e(n) {
    return typeof n == "string";
  }
  t.is = e;
})(xi || (xi = {}));
var y1;
(function(t) {
  t.MIN_VALUE = -2147483648, t.MAX_VALUE = 2147483647;
  function e(n) {
    return typeof n == "number" && t.MIN_VALUE <= n && n <= t.MAX_VALUE;
  }
  t.is = e;
})(y1 || (y1 = {}));
var ar;
(function(t) {
  t.MIN_VALUE = 0, t.MAX_VALUE = 2147483647;
  function e(n) {
    return typeof n == "number" && t.MIN_VALUE <= n && n <= t.MAX_VALUE;
  }
  t.is = e;
})(ar || (ar = {}));
var ee;
(function(t) {
  function e(r, i) {
    return r === Number.MAX_VALUE && (r = ar.MAX_VALUE), i === Number.MAX_VALUE && (i = ar.MAX_VALUE), { line: r, character: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.objectLiteral(i) && S.uinteger(i.line) && S.uinteger(i.character);
  }
  t.is = n;
})(ee || (ee = {}));
var j;
(function(t) {
  function e(r, i, s, o) {
    if (S.uinteger(r) && S.uinteger(i) && S.uinteger(s) && S.uinteger(o))
      return { start: ee.create(r, i), end: ee.create(s, o) };
    if (ee.is(r) && ee.is(i))
      return { start: r, end: i };
    throw new Error(`Range#create called with invalid arguments[${r}, ${i}, ${s}, ${o}]`);
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.objectLiteral(i) && ee.is(i.start) && ee.is(i.end);
  }
  t.is = n;
})(j || (j = {}));
var Zt;
(function(t) {
  function e(r, i) {
    return { uri: r, range: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.objectLiteral(i) && j.is(i.range) && (S.string(i.uri) || S.undefined(i.uri));
  }
  t.is = n;
})(Zt || (Zt = {}));
var v1;
(function(t) {
  function e(r, i, s, o) {
    return { targetUri: r, targetRange: i, targetSelectionRange: s, originSelectionRange: o };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.objectLiteral(i) && j.is(i.targetRange) && S.string(i.targetUri) && j.is(i.targetSelectionRange) && (j.is(i.originSelectionRange) || S.undefined(i.originSelectionRange));
  }
  t.is = n;
})(v1 || (v1 = {}));
var _i;
(function(t) {
  function e(r, i, s, o) {
    return {
      red: r,
      green: i,
      blue: s,
      alpha: o
    };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && S.numberRange(i.red, 0, 1) && S.numberRange(i.green, 0, 1) && S.numberRange(i.blue, 0, 1) && S.numberRange(i.alpha, 0, 1);
  }
  t.is = n;
})(_i || (_i = {}));
var w1;
(function(t) {
  function e(r, i) {
    return {
      range: r,
      color: i
    };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && j.is(i.range) && _i.is(i.color);
  }
  t.is = n;
})(w1 || (w1 = {}));
var x1;
(function(t) {
  function e(r, i, s) {
    return {
      label: r,
      textEdit: i,
      additionalTextEdits: s
    };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && S.string(i.label) && (S.undefined(i.textEdit) || Ge.is(i)) && (S.undefined(i.additionalTextEdits) || S.typedArray(i.additionalTextEdits, Ge.is));
  }
  t.is = n;
})(x1 || (x1 = {}));
var pn;
(function(t) {
  t.Comment = "comment", t.Imports = "imports", t.Region = "region";
})(pn || (pn = {}));
var _1;
(function(t) {
  function e(r, i, s, o, l, a) {
    const u = {
      startLine: r,
      endLine: i
    };
    return S.defined(s) && (u.startCharacter = s), S.defined(o) && (u.endCharacter = o), S.defined(l) && (u.kind = l), S.defined(a) && (u.collapsedText = a), u;
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && S.uinteger(i.startLine) && S.uinteger(i.startLine) && (S.undefined(i.startCharacter) || S.uinteger(i.startCharacter)) && (S.undefined(i.endCharacter) || S.uinteger(i.endCharacter)) && (S.undefined(i.kind) || S.string(i.kind));
  }
  t.is = n;
})(_1 || (_1 = {}));
var Li;
(function(t) {
  function e(r, i) {
    return {
      location: r,
      message: i
    };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && Zt.is(i.location) && S.string(i.message);
  }
  t.is = n;
})(Li || (Li = {}));
var Ae;
(function(t) {
  t.Error = 1, t.Warning = 2, t.Information = 3, t.Hint = 4;
})(Ae || (Ae = {}));
var L1;
(function(t) {
  t.Unnecessary = 1, t.Deprecated = 2;
})(L1 || (L1 = {}));
var N1;
(function(t) {
  function e(n) {
    const r = n;
    return S.objectLiteral(r) && S.string(r.href);
  }
  t.is = e;
})(N1 || (N1 = {}));
var et;
(function(t) {
  function e(r, i, s, o, l, a) {
    let u = { range: r, message: i };
    return S.defined(s) && (u.severity = s), S.defined(o) && (u.code = o), S.defined(l) && (u.source = l), S.defined(a) && (u.relatedInformation = a), u;
  }
  t.create = e;
  function n(r) {
    var i;
    let s = r;
    return S.defined(s) && j.is(s.range) && S.string(s.message) && (S.number(s.severity) || S.undefined(s.severity)) && (S.integer(s.code) || S.string(s.code) || S.undefined(s.code)) && (S.undefined(s.codeDescription) || S.string((i = s.codeDescription) === null || i === void 0 ? void 0 : i.href)) && (S.string(s.source) || S.undefined(s.source)) && (S.undefined(s.relatedInformation) || S.typedArray(s.relatedInformation, Li.is));
  }
  t.is = n;
})(et || (et = {}));
var Kt;
(function(t) {
  function e(r, i, ...s) {
    let o = { title: r, command: i };
    return S.defined(s) && s.length > 0 && (o.arguments = s), o;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.string(i.title) && S.string(i.command);
  }
  t.is = n;
})(Kt || (Kt = {}));
var Ge;
(function(t) {
  function e(s, o) {
    return { range: s, newText: o };
  }
  t.replace = e;
  function n(s, o) {
    return { range: { start: s, end: s }, newText: o };
  }
  t.insert = n;
  function r(s) {
    return { range: s, newText: "" };
  }
  t.del = r;
  function i(s) {
    const o = s;
    return S.objectLiteral(o) && S.string(o.newText) && j.is(o.range);
  }
  t.is = i;
})(Ge || (Ge = {}));
var Ni;
(function(t) {
  function e(r, i, s) {
    const o = { label: r };
    return i !== void 0 && (o.needsConfirmation = i), s !== void 0 && (o.description = s), o;
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && S.string(i.label) && (S.boolean(i.needsConfirmation) || i.needsConfirmation === void 0) && (S.string(i.description) || i.description === void 0);
  }
  t.is = n;
})(Ni || (Ni = {}));
var en;
(function(t) {
  function e(n) {
    const r = n;
    return S.string(r);
  }
  t.is = e;
})(en || (en = {}));
var A1;
(function(t) {
  function e(s, o, l) {
    return { range: s, newText: o, annotationId: l };
  }
  t.replace = e;
  function n(s, o, l) {
    return { range: { start: s, end: s }, newText: o, annotationId: l };
  }
  t.insert = n;
  function r(s, o) {
    return { range: s, newText: "", annotationId: o };
  }
  t.del = r;
  function i(s) {
    const o = s;
    return Ge.is(o) && (Ni.is(o.annotationId) || en.is(o.annotationId));
  }
  t.is = i;
})(A1 || (A1 = {}));
var Ai;
(function(t) {
  function e(r, i) {
    return { textDocument: r, edits: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && Mi.is(i.textDocument) && Array.isArray(i.edits);
  }
  t.is = n;
})(Ai || (Ai = {}));
var Si;
(function(t) {
  function e(r, i, s) {
    let o = {
      kind: "create",
      uri: r
    };
    return i !== void 0 && (i.overwrite !== void 0 || i.ignoreIfExists !== void 0) && (o.options = i), s !== void 0 && (o.annotationId = s), o;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return i && i.kind === "create" && S.string(i.uri) && (i.options === void 0 || (i.options.overwrite === void 0 || S.boolean(i.options.overwrite)) && (i.options.ignoreIfExists === void 0 || S.boolean(i.options.ignoreIfExists))) && (i.annotationId === void 0 || en.is(i.annotationId));
  }
  t.is = n;
})(Si || (Si = {}));
var Ei;
(function(t) {
  function e(r, i, s, o) {
    let l = {
      kind: "rename",
      oldUri: r,
      newUri: i
    };
    return s !== void 0 && (s.overwrite !== void 0 || s.ignoreIfExists !== void 0) && (l.options = s), o !== void 0 && (l.annotationId = o), l;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return i && i.kind === "rename" && S.string(i.oldUri) && S.string(i.newUri) && (i.options === void 0 || (i.options.overwrite === void 0 || S.boolean(i.options.overwrite)) && (i.options.ignoreIfExists === void 0 || S.boolean(i.options.ignoreIfExists))) && (i.annotationId === void 0 || en.is(i.annotationId));
  }
  t.is = n;
})(Ei || (Ei = {}));
var ki;
(function(t) {
  function e(r, i, s) {
    let o = {
      kind: "delete",
      uri: r
    };
    return i !== void 0 && (i.recursive !== void 0 || i.ignoreIfNotExists !== void 0) && (o.options = i), s !== void 0 && (o.annotationId = s), o;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return i && i.kind === "delete" && S.string(i.uri) && (i.options === void 0 || (i.options.recursive === void 0 || S.boolean(i.options.recursive)) && (i.options.ignoreIfNotExists === void 0 || S.boolean(i.options.ignoreIfNotExists))) && (i.annotationId === void 0 || en.is(i.annotationId));
  }
  t.is = n;
})(ki || (ki = {}));
var Ri;
(function(t) {
  function e(n) {
    let r = n;
    return r && (r.changes !== void 0 || r.documentChanges !== void 0) && (r.documentChanges === void 0 || r.documentChanges.every((i) => S.string(i.kind) ? Si.is(i) || Ei.is(i) || ki.is(i) : Ai.is(i)));
  }
  t.is = e;
})(Ri || (Ri = {}));
var S1;
(function(t) {
  function e(r) {
    return { uri: r };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.string(i.uri);
  }
  t.is = n;
})(S1 || (S1 = {}));
var E1;
(function(t) {
  function e(r, i) {
    return { uri: r, version: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.string(i.uri) && S.integer(i.version);
  }
  t.is = n;
})(E1 || (E1 = {}));
var Mi;
(function(t) {
  function e(r, i) {
    return { uri: r, version: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.string(i.uri) && (i.version === null || S.integer(i.version));
  }
  t.is = n;
})(Mi || (Mi = {}));
var k1;
(function(t) {
  function e(r, i, s, o) {
    return { uri: r, languageId: i, version: s, text: o };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.string(i.uri) && S.string(i.languageId) && S.integer(i.version) && S.string(i.text);
  }
  t.is = n;
})(k1 || (k1 = {}));
var xt;
(function(t) {
  t.PlainText = "plaintext", t.Markdown = "markdown";
  function e(n) {
    const r = n;
    return r === t.PlainText || r === t.Markdown;
  }
  t.is = e;
})(xt || (xt = {}));
var Sn;
(function(t) {
  function e(n) {
    const r = n;
    return S.objectLiteral(n) && xt.is(r.kind) && S.string(r.value);
  }
  t.is = e;
})(Sn || (Sn = {}));
var Le;
(function(t) {
  t.Text = 1, t.Method = 2, t.Function = 3, t.Constructor = 4, t.Field = 5, t.Variable = 6, t.Class = 7, t.Interface = 8, t.Module = 9, t.Property = 10, t.Unit = 11, t.Value = 12, t.Enum = 13, t.Keyword = 14, t.Snippet = 15, t.Color = 16, t.File = 17, t.Reference = 18, t.Folder = 19, t.EnumMember = 20, t.Constant = 21, t.Struct = 22, t.Event = 23, t.Operator = 24, t.TypeParameter = 25;
})(Le || (Le = {}));
var oe;
(function(t) {
  t.PlainText = 1, t.Snippet = 2;
})(oe || (oe = {}));
var R1;
(function(t) {
  t.Deprecated = 1;
})(R1 || (R1 = {}));
var M1;
(function(t) {
  function e(r, i, s) {
    return { newText: r, insert: i, replace: s };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return i && S.string(i.newText) && j.is(i.insert) && j.is(i.replace);
  }
  t.is = n;
})(M1 || (M1 = {}));
var T1;
(function(t) {
  t.asIs = 1, t.adjustIndentation = 2;
})(T1 || (T1 = {}));
var C1;
(function(t) {
  function e(n) {
    const r = n;
    return r && (S.string(r.detail) || r.detail === void 0) && (S.string(r.description) || r.description === void 0);
  }
  t.is = e;
})(C1 || (C1 = {}));
var Ti;
(function(t) {
  function e(n) {
    return { label: n };
  }
  t.create = e;
})(Ti || (Ti = {}));
var I1;
(function(t) {
  function e(n, r) {
    return { items: n || [], isIncomplete: !!r };
  }
  t.create = e;
})(I1 || (I1 = {}));
var lr;
(function(t) {
  function e(r) {
    return r.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
  }
  t.fromPlainText = e;
  function n(r) {
    const i = r;
    return S.string(i) || S.objectLiteral(i) && S.string(i.language) && S.string(i.value);
  }
  t.is = n;
})(lr || (lr = {}));
var P1;
(function(t) {
  function e(n) {
    let r = n;
    return !!r && S.objectLiteral(r) && (Sn.is(r.contents) || lr.is(r.contents) || S.typedArray(r.contents, lr.is)) && (n.range === void 0 || j.is(n.range));
  }
  t.is = e;
})(P1 || (P1 = {}));
var F1;
(function(t) {
  function e(n, r) {
    return r ? { label: n, documentation: r } : { label: n };
  }
  t.create = e;
})(F1 || (F1 = {}));
var D1;
(function(t) {
  function e(n, r, ...i) {
    let s = { label: n };
    return S.defined(r) && (s.documentation = r), S.defined(i) ? s.parameters = i : s.parameters = [], s;
  }
  t.create = e;
})(D1 || (D1 = {}));
var B1;
(function(t) {
  t.Text = 1, t.Read = 2, t.Write = 3;
})(B1 || (B1 = {}));
var V1;
(function(t) {
  function e(n, r) {
    let i = { range: n };
    return S.number(r) && (i.kind = r), i;
  }
  t.create = e;
})(V1 || (V1 = {}));
var Be;
(function(t) {
  t.File = 1, t.Module = 2, t.Namespace = 3, t.Package = 4, t.Class = 5, t.Method = 6, t.Property = 7, t.Field = 8, t.Constructor = 9, t.Enum = 10, t.Interface = 11, t.Function = 12, t.Variable = 13, t.Constant = 14, t.String = 15, t.Number = 16, t.Boolean = 17, t.Array = 18, t.Object = 19, t.Key = 20, t.Null = 21, t.EnumMember = 22, t.Struct = 23, t.Event = 24, t.Operator = 25, t.TypeParameter = 26;
})(Be || (Be = {}));
var O1;
(function(t) {
  t.Deprecated = 1;
})(O1 || (O1 = {}));
var U1;
(function(t) {
  function e(n, r, i, s, o) {
    let l = {
      name: n,
      kind: r,
      location: { uri: s, range: i }
    };
    return o && (l.containerName = o), l;
  }
  t.create = e;
})(U1 || (U1 = {}));
var $1;
(function(t) {
  function e(n, r, i, s) {
    return s !== void 0 ? { name: n, kind: r, location: { uri: i, range: s } } : { name: n, kind: r, location: { uri: i } };
  }
  t.create = e;
})($1 || ($1 = {}));
var q1;
(function(t) {
  function e(r, i, s, o, l, a) {
    let u = {
      name: r,
      detail: i,
      kind: s,
      range: o,
      selectionRange: l
    };
    return a !== void 0 && (u.children = a), u;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return i && S.string(i.name) && S.number(i.kind) && j.is(i.range) && j.is(i.selectionRange) && (i.detail === void 0 || S.string(i.detail)) && (i.deprecated === void 0 || S.boolean(i.deprecated)) && (i.children === void 0 || Array.isArray(i.children)) && (i.tags === void 0 || Array.isArray(i.tags));
  }
  t.is = n;
})(q1 || (q1 = {}));
var j1;
(function(t) {
  t.Empty = "", t.QuickFix = "quickfix", t.Refactor = "refactor", t.RefactorExtract = "refactor.extract", t.RefactorInline = "refactor.inline", t.RefactorRewrite = "refactor.rewrite", t.Source = "source", t.SourceOrganizeImports = "source.organizeImports", t.SourceFixAll = "source.fixAll";
})(j1 || (j1 = {}));
var ur;
(function(t) {
  t.Invoked = 1, t.Automatic = 2;
})(ur || (ur = {}));
var W1;
(function(t) {
  function e(r, i, s) {
    let o = { diagnostics: r };
    return i != null && (o.only = i), s != null && (o.triggerKind = s), o;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.typedArray(i.diagnostics, et.is) && (i.only === void 0 || S.typedArray(i.only, S.string)) && (i.triggerKind === void 0 || i.triggerKind === ur.Invoked || i.triggerKind === ur.Automatic);
  }
  t.is = n;
})(W1 || (W1 = {}));
var H1;
(function(t) {
  function e(r, i, s) {
    let o = { title: r }, l = !0;
    return typeof i == "string" ? (l = !1, o.kind = i) : Kt.is(i) ? o.command = i : o.edit = i, l && s !== void 0 && (o.kind = s), o;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return i && S.string(i.title) && (i.diagnostics === void 0 || S.typedArray(i.diagnostics, et.is)) && (i.kind === void 0 || S.string(i.kind)) && (i.edit !== void 0 || i.command !== void 0) && (i.command === void 0 || Kt.is(i.command)) && (i.isPreferred === void 0 || S.boolean(i.isPreferred)) && (i.edit === void 0 || Ri.is(i.edit));
  }
  t.is = n;
})(H1 || (H1 = {}));
var z1;
(function(t) {
  function e(r, i) {
    let s = { range: r };
    return S.defined(i) && (s.data = i), s;
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && j.is(i.range) && (S.undefined(i.command) || Kt.is(i.command));
  }
  t.is = n;
})(z1 || (z1 = {}));
var G1;
(function(t) {
  function e(r, i) {
    return { tabSize: r, insertSpaces: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && S.uinteger(i.tabSize) && S.boolean(i.insertSpaces);
  }
  t.is = n;
})(G1 || (G1 = {}));
var J1;
(function(t) {
  function e(r, i, s) {
    return { range: r, target: i, data: s };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.defined(i) && j.is(i.range) && (S.undefined(i.target) || S.string(i.target));
  }
  t.is = n;
})(J1 || (J1 = {}));
var cr;
(function(t) {
  function e(r, i) {
    return { range: r, parent: i };
  }
  t.create = e;
  function n(r) {
    let i = r;
    return S.objectLiteral(i) && j.is(i.range) && (i.parent === void 0 || t.is(i.parent));
  }
  t.is = n;
})(cr || (cr = {}));
var Q1;
(function(t) {
  t.namespace = "namespace", t.type = "type", t.class = "class", t.enum = "enum", t.interface = "interface", t.struct = "struct", t.typeParameter = "typeParameter", t.parameter = "parameter", t.variable = "variable", t.property = "property", t.enumMember = "enumMember", t.event = "event", t.function = "function", t.method = "method", t.macro = "macro", t.keyword = "keyword", t.modifier = "modifier", t.comment = "comment", t.string = "string", t.number = "number", t.regexp = "regexp", t.operator = "operator", t.decorator = "decorator";
})(Q1 || (Q1 = {}));
var X1;
(function(t) {
  t.declaration = "declaration", t.definition = "definition", t.readonly = "readonly", t.static = "static", t.deprecated = "deprecated", t.abstract = "abstract", t.async = "async", t.modification = "modification", t.documentation = "documentation", t.defaultLibrary = "defaultLibrary";
})(X1 || (X1 = {}));
var Y1;
(function(t) {
  function e(n) {
    const r = n;
    return S.objectLiteral(r) && (r.resultId === void 0 || typeof r.resultId == "string") && Array.isArray(r.data) && (r.data.length === 0 || typeof r.data[0] == "number");
  }
  t.is = e;
})(Y1 || (Y1 = {}));
var Z1;
(function(t) {
  function e(r, i) {
    return { range: r, text: i };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return i != null && j.is(i.range) && S.string(i.text);
  }
  t.is = n;
})(Z1 || (Z1 = {}));
var K1;
(function(t) {
  function e(r, i, s) {
    return { range: r, variableName: i, caseSensitiveLookup: s };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return i != null && j.is(i.range) && S.boolean(i.caseSensitiveLookup) && (S.string(i.variableName) || i.variableName === void 0);
  }
  t.is = n;
})(K1 || (K1 = {}));
var ea;
(function(t) {
  function e(r, i) {
    return { range: r, expression: i };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return i != null && j.is(i.range) && (S.string(i.expression) || i.expression === void 0);
  }
  t.is = n;
})(ea || (ea = {}));
var ta;
(function(t) {
  function e(r, i) {
    return { frameId: r, stoppedLocation: i };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.defined(i) && j.is(r.stoppedLocation);
  }
  t.is = n;
})(ta || (ta = {}));
var Ci;
(function(t) {
  t.Type = 1, t.Parameter = 2;
  function e(n) {
    return n === 1 || n === 2;
  }
  t.is = e;
})(Ci || (Ci = {}));
var Ii;
(function(t) {
  function e(r) {
    return { value: r };
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && (i.tooltip === void 0 || S.string(i.tooltip) || Sn.is(i.tooltip)) && (i.location === void 0 || Zt.is(i.location)) && (i.command === void 0 || Kt.is(i.command));
  }
  t.is = n;
})(Ii || (Ii = {}));
var na;
(function(t) {
  function e(r, i, s) {
    const o = { position: r, label: i };
    return s !== void 0 && (o.kind = s), o;
  }
  t.create = e;
  function n(r) {
    const i = r;
    return S.objectLiteral(i) && ee.is(i.position) && (S.string(i.label) || S.typedArray(i.label, Ii.is)) && (i.kind === void 0 || Ci.is(i.kind)) && i.textEdits === void 0 || S.typedArray(i.textEdits, Ge.is) && (i.tooltip === void 0 || S.string(i.tooltip) || Sn.is(i.tooltip)) && (i.paddingLeft === void 0 || S.boolean(i.paddingLeft)) && (i.paddingRight === void 0 || S.boolean(i.paddingRight));
  }
  t.is = n;
})(na || (na = {}));
var ra;
(function(t) {
  function e(n) {
    return { kind: "snippet", value: n };
  }
  t.createSnippet = e;
})(ra || (ra = {}));
var ia;
(function(t) {
  function e(n, r, i, s) {
    return { insertText: n, filterText: r, range: i, command: s };
  }
  t.create = e;
})(ia || (ia = {}));
var sa;
(function(t) {
  function e(n) {
    return { items: n };
  }
  t.create = e;
})(sa || (sa = {}));
var oa;
(function(t) {
  t.Invoked = 0, t.Automatic = 1;
})(oa || (oa = {}));
var aa;
(function(t) {
  function e(n, r) {
    return { range: n, text: r };
  }
  t.create = e;
})(aa || (aa = {}));
var la;
(function(t) {
  function e(n, r) {
    return { triggerKind: n, selectedCompletionInfo: r };
  }
  t.create = e;
})(la || (la = {}));
var ua;
(function(t) {
  function e(n) {
    const r = n;
    return S.objectLiteral(r) && xi.is(r.uri) && S.string(r.name);
  }
  t.is = e;
})(ua || (ua = {}));
var ca;
(function(t) {
  function e(s, o, l, a) {
    return new Of(s, o, l, a);
  }
  t.create = e;
  function n(s) {
    let o = s;
    return !!(S.defined(o) && S.string(o.uri) && (S.undefined(o.languageId) || S.string(o.languageId)) && S.uinteger(o.lineCount) && S.func(o.getText) && S.func(o.positionAt) && S.func(o.offsetAt));
  }
  t.is = n;
  function r(s, o) {
    let l = s.getText(), a = i(o, (h, c) => {
      let m = h.range.start.line - c.range.start.line;
      return m === 0 ? h.range.start.character - c.range.start.character : m;
    }), u = l.length;
    for (let h = a.length - 1; h >= 0; h--) {
      let c = a[h], m = s.offsetAt(c.range.start), d = s.offsetAt(c.range.end);
      if (d <= u)
        l = l.substring(0, m) + c.newText + l.substring(d, l.length);
      else
        throw new Error("Overlapping edit");
      u = m;
    }
    return l;
  }
  t.applyEdits = r;
  function i(s, o) {
    if (s.length <= 1)
      return s;
    const l = s.length / 2 | 0, a = s.slice(0, l), u = s.slice(l);
    i(a, o), i(u, o);
    let h = 0, c = 0, m = 0;
    for (; h < a.length && c < u.length; )
      o(a[h], u[c]) <= 0 ? s[m++] = a[h++] : s[m++] = u[c++];
    for (; h < a.length; )
      s[m++] = a[h++];
    for (; c < u.length; )
      s[m++] = u[c++];
    return s;
  }
})(ca || (ca = {}));
var Of = class {
  constructor(t, e, n, r) {
    this._uri = t, this._languageId = e, this._version = n, this._content = r, this._lineOffsets = void 0;
  }
  get uri() {
    return this._uri;
  }
  get languageId() {
    return this._languageId;
  }
  get version() {
    return this._version;
  }
  getText(t) {
    if (t) {
      let e = this.offsetAt(t.start), n = this.offsetAt(t.end);
      return this._content.substring(e, n);
    }
    return this._content;
  }
  update(t, e) {
    this._content = t.text, this._version = e, this._lineOffsets = void 0;
  }
  getLineOffsets() {
    if (this._lineOffsets === void 0) {
      let t = [], e = this._content, n = !0;
      for (let r = 0; r < e.length; r++) {
        n && (t.push(r), n = !1);
        let i = e.charAt(r);
        n = i === "\r" || i === `
`, i === "\r" && r + 1 < e.length && e.charAt(r + 1) === `
` && r++;
      }
      n && e.length > 0 && t.push(e.length), this._lineOffsets = t;
    }
    return this._lineOffsets;
  }
  positionAt(t) {
    t = Math.max(Math.min(t, this._content.length), 0);
    let e = this.getLineOffsets(), n = 0, r = e.length;
    if (r === 0)
      return ee.create(0, t);
    for (; n < r; ) {
      let s = Math.floor((n + r) / 2);
      e[s] > t ? r = s : n = s + 1;
    }
    let i = n - 1;
    return ee.create(i, t - e[i]);
  }
  offsetAt(t) {
    let e = this.getLineOffsets();
    if (t.line >= e.length)
      return this._content.length;
    if (t.line < 0)
      return 0;
    let n = e[t.line], r = t.line + 1 < e.length ? e[t.line + 1] : this._content.length;
    return Math.max(Math.min(n + t.character, r), n);
  }
  get lineCount() {
    return this.getLineOffsets().length;
  }
}, S;
(function(t) {
  const e = Object.prototype.toString;
  function n(d) {
    return typeof d < "u";
  }
  t.defined = n;
  function r(d) {
    return typeof d > "u";
  }
  t.undefined = r;
  function i(d) {
    return d === !0 || d === !1;
  }
  t.boolean = i;
  function s(d) {
    return e.call(d) === "[object String]";
  }
  t.string = s;
  function o(d) {
    return e.call(d) === "[object Number]";
  }
  t.number = o;
  function l(d, g, p) {
    return e.call(d) === "[object Number]" && g <= d && d <= p;
  }
  t.numberRange = l;
  function a(d) {
    return e.call(d) === "[object Number]" && -2147483648 <= d && d <= 2147483647;
  }
  t.integer = a;
  function u(d) {
    return e.call(d) === "[object Number]" && 0 <= d && d <= 2147483647;
  }
  t.uinteger = u;
  function h(d) {
    return e.call(d) === "[object Function]";
  }
  t.func = h;
  function c(d) {
    return d !== null && typeof d == "object";
  }
  t.objectLiteral = c;
  function m(d, g) {
    return Array.isArray(d) && d.every(g);
  }
  t.typedArray = m;
})(S || (S = {}));
var fa = class Pi {
  constructor(e, n, r, i) {
    this._uri = e, this._languageId = n, this._version = r, this._content = i, this._lineOffsets = void 0;
  }
  get uri() {
    return this._uri;
  }
  get languageId() {
    return this._languageId;
  }
  get version() {
    return this._version;
  }
  getText(e) {
    if (e) {
      const n = this.offsetAt(e.start), r = this.offsetAt(e.end);
      return this._content.substring(n, r);
    }
    return this._content;
  }
  update(e, n) {
    for (let r of e)
      if (Pi.isIncremental(r)) {
        const i = gl(r.range), s = this.offsetAt(i.start), o = this.offsetAt(i.end);
        this._content = this._content.substring(0, s) + r.text + this._content.substring(o, this._content.length);
        const l = Math.max(i.start.line, 0), a = Math.max(i.end.line, 0);
        let u = this._lineOffsets;
        const h = ha(r.text, !1, s);
        if (a - l === h.length)
          for (let m = 0, d = h.length; m < d; m++)
            u[m + l + 1] = h[m];
        else
          h.length < 1e4 ? u.splice(l + 1, a - l, ...h) : this._lineOffsets = u = u.slice(0, l + 1).concat(h, u.slice(a + 1));
        const c = r.text.length - (o - s);
        if (c !== 0)
          for (let m = l + 1 + h.length, d = u.length; m < d; m++)
            u[m] = u[m] + c;
      } else if (Pi.isFull(r))
        this._content = r.text, this._lineOffsets = void 0;
      else
        throw new Error("Unknown change event received");
    this._version = n;
  }
  getLineOffsets() {
    return this._lineOffsets === void 0 && (this._lineOffsets = ha(this._content, !0)), this._lineOffsets;
  }
  positionAt(e) {
    e = Math.max(Math.min(e, this._content.length), 0);
    let n = this.getLineOffsets(), r = 0, i = n.length;
    if (i === 0)
      return { line: 0, character: e };
    for (; r < i; ) {
      let o = Math.floor((r + i) / 2);
      n[o] > e ? i = o : r = o + 1;
    }
    let s = r - 1;
    return { line: s, character: e - n[s] };
  }
  offsetAt(e) {
    let n = this.getLineOffsets();
    if (e.line >= n.length)
      return this._content.length;
    if (e.line < 0)
      return 0;
    let r = n[e.line], i = e.line + 1 < n.length ? n[e.line + 1] : this._content.length;
    return Math.max(Math.min(r + e.character, i), r);
  }
  get lineCount() {
    return this.getLineOffsets().length;
  }
  static isIncremental(e) {
    let n = e;
    return n != null && typeof n.text == "string" && n.range !== void 0 && (n.rangeLength === void 0 || typeof n.rangeLength == "number");
  }
  static isFull(e) {
    let n = e;
    return n != null && typeof n.text == "string" && n.range === void 0 && n.rangeLength === void 0;
  }
}, De;
(function(t) {
  function e(i, s, o, l) {
    return new fa(i, s, o, l);
  }
  t.create = e;
  function n(i, s, o) {
    if (i instanceof fa)
      return i.update(s, o), i;
    throw new Error("TextDocument.update: document must be created by TextDocument.create");
  }
  t.update = n;
  function r(i, s) {
    let o = i.getText(), l = Fi(s.map(Uf), (h, c) => {
      let m = h.range.start.line - c.range.start.line;
      return m === 0 ? h.range.start.character - c.range.start.character : m;
    }), a = 0;
    const u = [];
    for (const h of l) {
      let c = i.offsetAt(h.range.start);
      if (c < a)
        throw new Error("Overlapping edit");
      c > a && u.push(o.substring(a, c)), h.newText.length && u.push(h.newText), a = i.offsetAt(h.range.end);
    }
    return u.push(o.substr(a)), u.join("");
  }
  t.applyEdits = r;
})(De || (De = {}));
function Fi(t, e) {
  if (t.length <= 1)
    return t;
  const n = t.length / 2 | 0, r = t.slice(0, n), i = t.slice(n);
  Fi(r, e), Fi(i, e);
  let s = 0, o = 0, l = 0;
  for (; s < r.length && o < i.length; )
    e(r[s], i[o]) <= 0 ? t[l++] = r[s++] : t[l++] = i[o++];
  for (; s < r.length; )
    t[l++] = r[s++];
  for (; o < i.length; )
    t[l++] = i[o++];
  return t;
}
function ha(t, e, n = 0) {
  const r = e ? [n] : [];
  for (let i = 0; i < t.length; i++) {
    let s = t.charCodeAt(i);
    (s === 13 || s === 10) && (s === 13 && i + 1 < t.length && t.charCodeAt(i + 1) === 10 && i++, r.push(n + i + 1));
  }
  return r;
}
function gl(t) {
  const e = t.start, n = t.end;
  return e.line > n.line || e.line === n.line && e.character > n.character ? { start: n, end: e } : t;
}
function Uf(t) {
  const e = gl(t.range);
  return e !== t.range ? { newText: t.newText, range: e } : t;
}
var z;
(function(t) {
  t[t.Undefined = 0] = "Undefined", t[t.EnumValueMismatch = 1] = "EnumValueMismatch", t[t.Deprecated = 2] = "Deprecated", t[t.UnexpectedEndOfComment = 257] = "UnexpectedEndOfComment", t[t.UnexpectedEndOfString = 258] = "UnexpectedEndOfString", t[t.UnexpectedEndOfNumber = 259] = "UnexpectedEndOfNumber", t[t.InvalidUnicode = 260] = "InvalidUnicode", t[t.InvalidEscapeCharacter = 261] = "InvalidEscapeCharacter", t[t.InvalidCharacter = 262] = "InvalidCharacter", t[t.PropertyExpected = 513] = "PropertyExpected", t[t.CommaExpected = 514] = "CommaExpected", t[t.ColonExpected = 515] = "ColonExpected", t[t.ValueExpected = 516] = "ValueExpected", t[t.CommaOrCloseBacketExpected = 517] = "CommaOrCloseBacketExpected", t[t.CommaOrCloseBraceExpected = 518] = "CommaOrCloseBraceExpected", t[t.TrailingComma = 519] = "TrailingComma", t[t.DuplicateKey = 520] = "DuplicateKey", t[t.CommentNotPermitted = 521] = "CommentNotPermitted", t[t.PropertyKeysMustBeDoublequoted = 528] = "PropertyKeysMustBeDoublequoted", t[t.SchemaResolveError = 768] = "SchemaResolveError", t[t.SchemaUnsupportedFeature = 769] = "SchemaUnsupportedFeature";
})(z || (z = {}));
var Fe;
(function(t) {
  t[t.v3 = 3] = "v3", t[t.v4 = 4] = "v4", t[t.v6 = 6] = "v6", t[t.v7 = 7] = "v7", t[t.v2019_09 = 19] = "v2019_09", t[t.v2020_12 = 20] = "v2020_12";
})(Fe || (Fe = {}));
var Di;
(function(t) {
  t.LATEST = {
    textDocument: {
      completion: {
        completionItem: {
          documentationFormat: [xt.Markdown, xt.PlainText],
          commitCharactersSupport: !0,
          labelDetailsSupport: !0
        }
      }
    }
  };
})(Di || (Di = {}));
function R(...t) {
  const e = t[0];
  let n, r, i;
  if (typeof e == "string")
    n = e, r = e, t.splice(0, 1), i = !t || typeof t[0] != "object" ? t : t[0];
  else if (e instanceof Array) {
    const s = t.slice(1);
    if (e.length !== s.length + 1)
      throw new Error("expected a string as the first argument to l10n.t");
    let o = e[0];
    for (let l = 1; l < e.length; l++)
      o += `{${l - 1}}` + e[l];
    return R(o, ...s);
  } else
    r = e.message, n = r, e.comment && e.comment.length > 0 && (n += `/${Array.isArray(e.comment) ? e.comment.join("") : e.comment}`), i = e.args ?? {};
  return qf(r, i);
}
var $f = /{([^}]+)}/g;
function qf(t, e) {
  return Object.keys(e).length === 0 ? t : t.replace($f, (n, r) => e[r] ?? n);
}
var jf = {
  "color-hex": { errorMessage: R("Invalid color format. Use #RGB, #RGBA, #RRGGBB or #RRGGBBAA."), pattern: /^#([0-9A-Fa-f]{3,4}|([0-9A-Fa-f]{2}){3,4})$/ },
  "date-time": { errorMessage: R("String is not a RFC3339 date-time."), pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i },
  date: { errorMessage: R("String is not a RFC3339 date."), pattern: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/i },
  time: { errorMessage: R("String is not a RFC3339 time."), pattern: /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/i },
  email: { errorMessage: R("String is not an e-mail address."), pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}))$/ },
  hostname: { errorMessage: R("String is not a hostname."), pattern: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i },
  ipv4: { errorMessage: R("String is not an IPv4 address."), pattern: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/ },
  ipv6: { errorMessage: R("String is not an IPv6 address."), pattern: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i }
}, Lt = class {
  constructor(t, e, n = 0) {
    this.offset = e, this.length = n, this.parent = t;
  }
  get children() {
    return [];
  }
  toString() {
    return "type: " + this.type + " (" + this.offset + "/" + this.length + ")" + (this.parent ? " parent: {" + this.parent.toString() + "}" : "");
  }
}, Wf = class extends Lt {
  constructor(t, e) {
    super(t, e), this.type = "null", this.value = null;
  }
}, ma = class extends Lt {
  constructor(t, e, n) {
    super(t, n), this.type = "boolean", this.value = e;
  }
}, Hf = class extends Lt {
  constructor(t, e) {
    super(t, e), this.type = "array", this.items = [];
  }
  get children() {
    return this.items;
  }
}, zf = class extends Lt {
  constructor(t, e) {
    super(t, e), this.type = "number", this.isInteger = !0, this.value = Number.NaN;
  }
}, Vr = class extends Lt {
  constructor(t, e, n) {
    super(t, e, n), this.type = "string", this.value = "";
  }
}, Gf = class extends Lt {
  constructor(t, e, n) {
    super(t, e), this.type = "property", this.colonOffset = -1, this.keyNode = n;
  }
  get children() {
    return this.valueNode ? [this.keyNode, this.valueNode] : [this.keyNode];
  }
}, Jf = class extends Lt {
  constructor(t, e) {
    super(t, e), this.type = "object", this.properties = [];
  }
  get children() {
    return this.properties;
  }
};
function xe(t) {
  return He(t) ? t ? {} : { not: {} } : t;
}
var da;
(function(t) {
  t[t.Key = 0] = "Key", t[t.Enum = 1] = "Enum";
})(da || (da = {}));
var Qf = {
  "http://json-schema.org/draft-03/schema#": Fe.v3,
  "http://json-schema.org/draft-04/schema#": Fe.v4,
  "http://json-schema.org/draft-06/schema#": Fe.v6,
  "http://json-schema.org/draft-07/schema#": Fe.v7,
  "https://json-schema.org/draft/2019-09/schema": Fe.v2019_09,
  "https://json-schema.org/draft/2020-12/schema": Fe.v2020_12
}, ga = class {
  constructor(t) {
    this.schemaDraft = t;
  }
}, Xf = class pl {
  constructor(e = -1, n) {
    this.focusOffset = e, this.exclude = n, this.schemas = [];
  }
  add(e) {
    this.schemas.push(e);
  }
  merge(e) {
    Array.prototype.push.apply(this.schemas, e.schemas);
  }
  include(e) {
    return (this.focusOffset === -1 || bl(e, this.focusOffset)) && e !== this.exclude;
  }
  newSub() {
    return new pl(-1, this.exclude);
  }
}, En = class {
  constructor() {
  }
  get schemas() {
    return [];
  }
  add(t) {
  }
  merge(t) {
  }
  include(t) {
    return !0;
  }
  newSub() {
    return this;
  }
};
En.instance = new En();
var me = class {
  constructor() {
    this.problems = [], this.propertiesMatches = 0, this.processedProperties = /* @__PURE__ */ new Set(), this.propertiesValueMatches = 0, this.primaryValueMatches = 0, this.enumValueMatch = !1, this.enumValues = void 0;
  }
  hasProblems() {
    return !!this.problems.length;
  }
  merge(t) {
    this.problems = this.problems.concat(t.problems), this.propertiesMatches += t.propertiesMatches, this.propertiesValueMatches += t.propertiesValueMatches, this.mergeProcessedProperties(t);
  }
  mergeEnumValues(t) {
    if (!this.enumValueMatch && !t.enumValueMatch && this.enumValues && t.enumValues) {
      this.enumValues = this.enumValues.concat(t.enumValues);
      for (const e of this.problems)
        e.code === z.EnumValueMismatch && (e.message = R("Value is not accepted. Valid values: {0}.", this.enumValues.map((n) => JSON.stringify(n)).join(", ")));
    }
  }
  mergePropertyMatch(t) {
    this.problems = this.problems.concat(t.problems), this.propertiesMatches++, (t.enumValueMatch || !t.hasProblems() && t.propertiesMatches) && this.propertiesValueMatches++, t.enumValueMatch && t.enumValues && t.enumValues.length === 1 && this.primaryValueMatches++;
  }
  mergeProcessedProperties(t) {
    t.processedProperties.forEach((e) => this.processedProperties.add(e));
  }
  compare(t) {
    const e = this.hasProblems();
    return e !== t.hasProblems() ? e ? -1 : 1 : this.enumValueMatch !== t.enumValueMatch ? t.enumValueMatch ? -1 : 1 : this.primaryValueMatches !== t.primaryValueMatches ? this.primaryValueMatches - t.primaryValueMatches : this.propertiesValueMatches !== t.propertiesValueMatches ? this.propertiesValueMatches - t.propertiesValueMatches : this.propertiesMatches - t.propertiesMatches;
  }
};
function Yf(t, e = []) {
  return new yl(t, e, []);
}
function wt(t) {
  return Df(t);
}
function Bi(t) {
  return Ff(t);
}
function bl(t, e, n = !1) {
  return e >= t.offset && e < t.offset + t.length || n && e === t.offset + t.length;
}
var yl = class {
  constructor(t, e = [], n = []) {
    this.root = t, this.syntaxErrors = e, this.comments = n;
  }
  getNodeFromOffset(t, e = !1) {
    if (this.root)
      return Pf(this.root, t, e);
  }
  visit(t) {
    if (this.root) {
      const e = (n) => {
        let r = t(n);
        const i = n.children;
        if (Array.isArray(i))
          for (let s = 0; s < i.length && r; s++)
            r = e(i[s]);
        return r;
      };
      e(this.root);
    }
  }
  validate(t, e, n = Ae.Warning, r) {
    if (this.root && e) {
      const i = new me();
      return ue(this.root, e, i, En.instance, new ga(r ?? pa(e))), i.problems.map((s) => {
        const o = j.create(t.positionAt(s.location.offset), t.positionAt(s.location.offset + s.location.length));
        return et.create(o, s.message, s.severity ?? n, s.code);
      });
    }
  }
  getMatchingSchemas(t, e = -1, n) {
    if (this.root && t) {
      const r = new Xf(e, n), i = pa(t), s = new ga(i);
      return ue(this.root, t, new me(), r, s), r.schemas;
    }
    return [];
  }
};
function pa(t, e = Fe.v2020_12) {
  let n = t.$schema;
  return n ? Qf[n] ?? e : e;
}
function ue(t, e, n, r, i) {
  if (!t || !r.include(t))
    return;
  if (t.type === "property")
    return ue(t.valueNode, e, n, r, i);
  const s = t;
  switch (o(), s.type) {
    case "object":
      h(s);
      break;
    case "array":
      u(s);
      break;
    case "string":
      a(s);
      break;
    case "number":
      l(s);
      break;
  }
  r.add({ node: s, schema: e });
  function o() {
    function c(L) {
      return s.type === L || L === "integer" && s.type === "number" && s.isInteger;
    }
    if (Array.isArray(e.type) ? e.type.some(c) || n.problems.push({
      location: { offset: s.offset, length: s.length },
      message: e.errorMessage || R("Incorrect type. Expected one of {0}.", e.type.join(", "))
    }) : e.type && (c(e.type) || n.problems.push({
      location: { offset: s.offset, length: s.length },
      message: e.errorMessage || R('Incorrect type. Expected "{0}".', e.type)
    })), Array.isArray(e.allOf))
      for (const L of e.allOf) {
        const v = new me(), w = r.newSub();
        ue(s, xe(L), v, w, i), n.merge(v), r.merge(w);
      }
    const m = xe(e.not);
    if (m) {
      const L = new me(), v = r.newSub();
      ue(s, m, L, v, i), L.hasProblems() || n.problems.push({
        location: { offset: s.offset, length: s.length },
        message: e.errorMessage || R("Matches a schema that is not allowed.")
      });
      for (const w of v.schemas)
        w.inverted = !w.inverted, r.add(w);
    }
    const d = (L, v) => {
      const w = [];
      let b;
      for (const x of L) {
        const A = xe(x), T = new me(), D = r.newSub();
        if (ue(s, A, T, D, i), T.hasProblems() || w.push(A), !b)
          b = { schema: A, validationResult: T, matchingSchemas: D };
        else if (!v && !T.hasProblems() && !b.validationResult.hasProblems())
          b.matchingSchemas.merge(D), b.validationResult.propertiesMatches += T.propertiesMatches, b.validationResult.propertiesValueMatches += T.propertiesValueMatches, b.validationResult.mergeProcessedProperties(T);
        else {
          const O = T.compare(b.validationResult);
          O > 0 ? b = { schema: A, validationResult: T, matchingSchemas: D } : O === 0 && (b.matchingSchemas.merge(D), b.validationResult.mergeEnumValues(T));
        }
      }
      return w.length > 1 && v && n.problems.push({
        location: { offset: s.offset, length: 1 },
        message: R("Matches multiple schemas when only one must validate.")
      }), b && (n.merge(b.validationResult), r.merge(b.matchingSchemas)), w.length;
    };
    Array.isArray(e.anyOf) && d(e.anyOf, !1), Array.isArray(e.oneOf) && d(e.oneOf, !0);
    const g = (L) => {
      const v = new me(), w = r.newSub();
      ue(s, xe(L), v, w, i), n.merge(v), r.merge(w);
    }, p = (L, v, w) => {
      const b = xe(L), x = new me(), A = r.newSub();
      ue(s, b, x, A, i), r.merge(A), n.mergeProcessedProperties(x), x.hasProblems() ? w && g(w) : v && g(v);
    }, y = xe(e.if);
    if (y && p(y, xe(e.then), xe(e.else)), Array.isArray(e.enum)) {
      const L = wt(s);
      let v = !1;
      for (const w of e.enum)
        if (Jt(L, w)) {
          v = !0;
          break;
        }
      n.enumValues = e.enum, n.enumValueMatch = v, v || n.problems.push({
        location: { offset: s.offset, length: s.length },
        code: z.EnumValueMismatch,
        message: e.errorMessage || R("Value is not accepted. Valid values: {0}.", e.enum.map((w) => JSON.stringify(w)).join(", "))
      });
    }
    if (Ce(e.const)) {
      const L = wt(s);
      Jt(L, e.const) ? n.enumValueMatch = !0 : (n.problems.push({
        location: { offset: s.offset, length: s.length },
        code: z.EnumValueMismatch,
        message: e.errorMessage || R("Value must be {0}.", JSON.stringify(e.const))
      }), n.enumValueMatch = !1), n.enumValues = [e.const];
    }
    let _ = e.deprecationMessage;
    if (_ || e.deprecated) {
      _ = _ || R("Value is deprecated");
      let L = s.parent?.type === "property" ? s.parent : s;
      n.problems.push({
        location: { offset: L.offset, length: L.length },
        severity: Ae.Warning,
        message: _,
        code: z.Deprecated
      });
    }
  }
  function l(c) {
    const m = c.value;
    function d(w) {
      const b = /^(-?\d+)(?:\.(\d+))?(?:e([-+]\d+))?$/.exec(w.toString());
      return b && {
        value: Number(b[1] + (b[2] || "")),
        multiplier: (b[2]?.length || 0) - (parseInt(b[3]) || 0)
      };
    }
    if (he(e.multipleOf)) {
      let w = -1;
      if (Number.isInteger(e.multipleOf))
        w = m % e.multipleOf;
      else {
        let b = d(e.multipleOf), x = d(m);
        if (b && x) {
          const A = 10 ** Math.abs(x.multiplier - b.multiplier);
          x.multiplier < b.multiplier ? x.value *= A : b.value *= A, w = x.value % b.value;
        }
      }
      w !== 0 && n.problems.push({
        location: { offset: c.offset, length: c.length },
        message: R("Value is not divisible by {0}.", e.multipleOf)
      });
    }
    function g(w, b) {
      if (he(b))
        return b;
      if (He(b) && b)
        return w;
    }
    function p(w, b) {
      if (!He(b) || !b)
        return w;
    }
    const y = g(e.minimum, e.exclusiveMinimum);
    he(y) && m <= y && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Value is below the exclusive minimum of {0}.", y)
    });
    const _ = g(e.maximum, e.exclusiveMaximum);
    he(_) && m >= _ && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Value is above the exclusive maximum of {0}.", _)
    });
    const L = p(e.minimum, e.exclusiveMinimum);
    he(L) && m < L && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Value is below the minimum of {0}.", L)
    });
    const v = p(e.maximum, e.exclusiveMaximum);
    he(v) && m > v && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Value is above the maximum of {0}.", v)
    });
  }
  function a(c) {
    if (he(e.minLength) && p1(c.value) < e.minLength && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("String is shorter than the minimum length of {0}.", e.minLength)
    }), he(e.maxLength) && p1(c.value) > e.maxLength && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("String is longer than the maximum length of {0}.", e.maxLength)
    }), dl(e.pattern) && (or(e.pattern)?.test(c.value) || n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: e.patternErrorMessage || e.errorMessage || R('String does not match the pattern of "{0}".', e.pattern)
    })), e.format)
      switch (e.format) {
        case "uri":
        case "uri-reference":
          {
            let d;
            if (!c.value)
              d = R("URI expected.");
            else {
              const g = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(c.value);
              g ? !g[2] && e.format === "uri" && (d = R("URI with a scheme is expected.")) : d = R("URI is expected.");
            }
            d && n.problems.push({
              location: { offset: c.offset, length: c.length },
              message: e.patternErrorMessage || e.errorMessage || R("String is not a URI: {0}", d)
            });
          }
          break;
        case "color-hex":
        case "date-time":
        case "date":
        case "time":
        case "email":
        case "hostname":
        case "ipv4":
        case "ipv6":
          const m = jf[e.format];
          (!c.value || !m.pattern.exec(c.value)) && n.problems.push({
            location: { offset: c.offset, length: c.length },
            message: e.patternErrorMessage || e.errorMessage || m.errorMessage
          });
      }
  }
  function u(c) {
    let m, d;
    i.schemaDraft >= Fe.v2020_12 ? (m = e.prefixItems, d = Array.isArray(e.items) ? void 0 : e.items) : (m = Array.isArray(e.items) ? e.items : void 0, d = Array.isArray(e.items) ? e.additionalItems : e.items);
    let g = 0;
    if (m !== void 0) {
      const _ = Math.min(m.length, c.items.length);
      for (; g < _; g++) {
        const L = m[g], v = xe(L), w = new me(), b = c.items[g];
        b && (ue(b, v, w, r, i), n.mergePropertyMatch(w)), n.processedProperties.add(String(g));
      }
    }
    if (d !== void 0 && g < c.items.length)
      if (typeof d == "boolean")
        for (d === !1 && n.problems.push({
          location: { offset: c.offset, length: c.length },
          message: R("Array has too many items according to schema. Expected {0} or fewer.", g)
        }); g < c.items.length; g++)
          n.processedProperties.add(String(g)), n.propertiesValueMatches++;
      else
        for (; g < c.items.length; g++) {
          const _ = new me();
          ue(c.items[g], d, _, r, i), n.mergePropertyMatch(_), n.processedProperties.add(String(g));
        }
    const p = xe(e.contains);
    if (p) {
      let _ = 0;
      for (let L = 0; L < c.items.length; L++) {
        const v = c.items[L], w = new me();
        ue(v, p, w, En.instance, i), w.hasProblems() || (_++, i.schemaDraft >= Fe.v2020_12 && n.processedProperties.add(String(L)));
      }
      _ === 0 && !he(e.minContains) && n.problems.push({
        location: { offset: c.offset, length: c.length },
        message: e.errorMessage || R("Array does not contain required item.")
      }), he(e.minContains) && _ < e.minContains && n.problems.push({
        location: { offset: c.offset, length: c.length },
        message: e.errorMessage || R("Array has too few items that match the contains contraint. Expected {0} or more.", e.minContains)
      }), he(e.maxContains) && _ > e.maxContains && n.problems.push({
        location: { offset: c.offset, length: c.length },
        message: e.errorMessage || R("Array has too many items that match the contains contraint. Expected {0} or less.", e.maxContains)
      });
    }
    const y = e.unevaluatedItems;
    if (y !== void 0)
      for (let _ = 0; _ < c.items.length; _++) {
        if (!n.processedProperties.has(String(_)))
          if (y === !1)
            n.problems.push({
              location: { offset: c.offset, length: c.length },
              message: R("Item does not match any validation rule from the array.")
            });
          else {
            const L = new me();
            ue(c.items[_], e.unevaluatedItems, L, r, i), n.mergePropertyMatch(L);
          }
        n.processedProperties.add(String(_)), n.propertiesValueMatches++;
      }
    if (he(e.minItems) && c.items.length < e.minItems && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Array has too few items. Expected {0} or more.", e.minItems)
    }), he(e.maxItems) && c.items.length > e.maxItems && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Array has too many items. Expected {0} or fewer.", e.maxItems)
    }), e.uniqueItems === !0) {
      let _ = function() {
        for (let v = 0; v < L.length - 1; v++) {
          const w = L[v];
          for (let b = v + 1; b < L.length; b++)
            if (Jt(w, L[b]))
              return !0;
        }
        return !1;
      };
      const L = wt(c);
      _() && n.problems.push({
        location: { offset: c.offset, length: c.length },
        message: R("Array has duplicate items.")
      });
    }
  }
  function h(c) {
    const m = /* @__PURE__ */ Object.create(null), d = /* @__PURE__ */ new Set();
    for (const v of c.properties) {
      const w = v.keyNode.value;
      m[w] = v.valueNode, d.add(w);
    }
    if (Array.isArray(e.required)) {
      for (const v of e.required)
        if (!m[v]) {
          const w = c.parent && c.parent.type === "property" && c.parent.keyNode, b = w ? { offset: w.offset, length: w.length } : { offset: c.offset, length: 1 };
          n.problems.push({
            location: b,
            message: R('Missing property "{0}".', v)
          });
        }
    }
    const g = (v) => {
      d.delete(v), n.processedProperties.add(v);
    };
    if (e.properties)
      for (const v of Object.keys(e.properties)) {
        g(v);
        const w = e.properties[v], b = m[v];
        if (b)
          if (He(w))
            if (w)
              n.propertiesMatches++, n.propertiesValueMatches++;
            else {
              const x = b.parent;
              n.problems.push({
                location: { offset: x.keyNode.offset, length: x.keyNode.length },
                message: e.errorMessage || R("Property {0} is not allowed.", v)
              });
            }
          else {
            const x = new me();
            ue(b, w, x, r, i), n.mergePropertyMatch(x);
          }
      }
    if (e.patternProperties)
      for (const v of Object.keys(e.patternProperties)) {
        const w = or(v);
        if (w) {
          const b = [];
          for (const x of d)
            if (w.test(x)) {
              b.push(x);
              const A = m[x];
              if (A) {
                const T = e.patternProperties[v];
                if (He(T))
                  if (T)
                    n.propertiesMatches++, n.propertiesValueMatches++;
                  else {
                    const D = A.parent;
                    n.problems.push({
                      location: { offset: D.keyNode.offset, length: D.keyNode.length },
                      message: e.errorMessage || R("Property {0} is not allowed.", x)
                    });
                  }
                else {
                  const D = new me();
                  ue(A, T, D, r, i), n.mergePropertyMatch(D);
                }
              }
            }
          b.forEach(g);
        }
      }
    const p = e.additionalProperties;
    if (p !== void 0)
      for (const v of d) {
        g(v);
        const w = m[v];
        if (w) {
          if (p === !1) {
            const b = w.parent;
            n.problems.push({
              location: { offset: b.keyNode.offset, length: b.keyNode.length },
              message: e.errorMessage || R("Property {0} is not allowed.", v)
            });
          } else if (p !== !0) {
            const b = new me();
            ue(w, p, b, r, i), n.mergePropertyMatch(b);
          }
        }
      }
    const y = e.unevaluatedProperties;
    if (y !== void 0) {
      const v = [];
      for (const w of d)
        if (!n.processedProperties.has(w)) {
          v.push(w);
          const b = m[w];
          if (b) {
            if (y === !1) {
              const x = b.parent;
              n.problems.push({
                location: { offset: x.keyNode.offset, length: x.keyNode.length },
                message: e.errorMessage || R("Property {0} is not allowed.", w)
              });
            } else if (y !== !0) {
              const x = new me();
              ue(b, y, x, r, i), n.mergePropertyMatch(x);
            }
          }
        }
      v.forEach(g);
    }
    if (he(e.maxProperties) && c.properties.length > e.maxProperties && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Object has more properties than limit of {0}.", e.maxProperties)
    }), he(e.minProperties) && c.properties.length < e.minProperties && n.problems.push({
      location: { offset: c.offset, length: c.length },
      message: R("Object has fewer properties than the required number of {0}", e.minProperties)
    }), e.dependentRequired)
      for (const v in e.dependentRequired) {
        const w = m[v], b = e.dependentRequired[v];
        w && Array.isArray(b) && L(v, b);
      }
    if (e.dependentSchemas)
      for (const v in e.dependentSchemas) {
        const w = m[v], b = e.dependentSchemas[v];
        w && at(b) && L(v, b);
      }
    if (e.dependencies)
      for (const v in e.dependencies)
        m[v] && L(v, e.dependencies[v]);
    const _ = xe(e.propertyNames);
    if (_)
      for (const v of c.properties) {
        const w = v.keyNode;
        w && ue(w, _, n, En.instance, i);
      }
    function L(v, w) {
      if (Array.isArray(w))
        for (const b of w)
          m[b] ? n.propertiesValueMatches++ : n.problems.push({
            location: { offset: c.offset, length: c.length },
            message: R("Object is missing property {0} required by property {1}.", b, v)
          });
      else {
        const b = xe(w);
        if (b) {
          const x = new me();
          ue(c, b, x, r, i), n.mergePropertyMatch(x);
        }
      }
    }
  }
}
function Zf(t, e) {
  const n = [];
  let r = -1;
  const i = t.getText(), s = vt(i, !1), o = e && e.collectComments ? [] : void 0;
  function l() {
    for (; ; ) {
      const x = s.scan();
      switch (h(), x) {
        case 12:
        case 13:
          Array.isArray(o) && o.push(j.create(t.positionAt(s.getTokenOffset()), t.positionAt(s.getTokenOffset() + s.getTokenLength())));
          break;
        case 15:
        case 14:
          break;
        default:
          return x;
      }
    }
  }
  function a(x, A, T, D, O = Ae.Error) {
    if (n.length === 0 || T !== r) {
      const C = j.create(t.positionAt(T), t.positionAt(D));
      n.push(et.create(C, x, O, A, t.languageId)), r = T;
    }
  }
  function u(x, A, T = void 0, D = [], O = []) {
    let C = s.getTokenOffset(), N = s.getTokenOffset() + s.getTokenLength();
    if (C === N && C > 0) {
      for (C--; C > 0 && /\s/.test(i.charAt(C)); )
        C--;
      N = C + 1;
    }
    if (a(x, A, C, N), T && c(T, !1), D.length + O.length > 0) {
      let E = s.getToken();
      for (; E !== 17; ) {
        if (D.indexOf(E) !== -1) {
          l();
          break;
        } else if (O.indexOf(E) !== -1)
          break;
        E = l();
      }
    }
    return T;
  }
  function h() {
    switch (s.getTokenError()) {
      case 4:
        return u(R("Invalid unicode sequence in string."), z.InvalidUnicode), !0;
      case 5:
        return u(R("Invalid escape character in string."), z.InvalidEscapeCharacter), !0;
      case 3:
        return u(R("Unexpected end of number."), z.UnexpectedEndOfNumber), !0;
      case 1:
        return u(R("Unexpected end of comment."), z.UnexpectedEndOfComment), !0;
      case 2:
        return u(R("Unexpected end of string."), z.UnexpectedEndOfString), !0;
      case 6:
        return u(R("Invalid characters in string. Control characters must be escaped."), z.InvalidCharacter), !0;
    }
    return !1;
  }
  function c(x, A) {
    return x.length = s.getTokenOffset() + s.getTokenLength() - x.offset, A && l(), x;
  }
  function m(x) {
    if (s.getToken() !== 3)
      return;
    const A = new Hf(x, s.getTokenOffset());
    l();
    let T = !1;
    for (; s.getToken() !== 4 && s.getToken() !== 17; ) {
      if (s.getToken() === 5) {
        T || u(R("Value expected"), z.ValueExpected);
        const O = s.getTokenOffset();
        if (l(), s.getToken() === 4) {
          T && a(R("Trailing comma"), z.TrailingComma, O, O + 1);
          continue;
        }
      } else T && u(R("Expected comma"), z.CommaExpected);
      const D = v(A);
      D ? A.items.push(D) : u(R("Value expected"), z.ValueExpected, void 0, [], [
        4,
        5
        /* Json.SyntaxKind.CommaToken */
      ]), T = !0;
    }
    return s.getToken() !== 4 ? u(R("Expected comma or closing bracket"), z.CommaOrCloseBacketExpected, A) : c(A, !0);
  }
  const d = new Vr(void 0, 0, 0);
  function g(x, A) {
    const T = new Gf(x, s.getTokenOffset(), d);
    let D = y(T);
    if (!D)
      if (s.getToken() === 16) {
        u(R("Property keys must be doublequoted"), z.PropertyKeysMustBeDoublequoted);
        const C = new Vr(T, s.getTokenOffset(), s.getTokenLength());
        C.value = s.getTokenValue(), D = C, l();
      } else
        return;
    if (T.keyNode = D, D.value !== "//") {
      const C = A[D.value];
      C ? (a(R("Duplicate object key"), z.DuplicateKey, T.keyNode.offset, T.keyNode.offset + T.keyNode.length, Ae.Warning), at(C) && a(R("Duplicate object key"), z.DuplicateKey, C.keyNode.offset, C.keyNode.offset + C.keyNode.length, Ae.Warning), A[D.value] = !0) : A[D.value] = T;
    }
    if (s.getToken() === 6)
      T.colonOffset = s.getTokenOffset(), l();
    else if (u(R("Colon expected"), z.ColonExpected), s.getToken() === 10 && t.positionAt(D.offset + D.length).line < t.positionAt(s.getTokenOffset()).line)
      return T.length = D.length, T;
    const O = v(T);
    return O ? (T.valueNode = O, T.length = O.offset + O.length - T.offset, T) : u(R("Value expected"), z.ValueExpected, T, [], [
      2,
      5
      /* Json.SyntaxKind.CommaToken */
    ]);
  }
  function p(x) {
    if (s.getToken() !== 1)
      return;
    const A = new Jf(x, s.getTokenOffset()), T = /* @__PURE__ */ Object.create(null);
    l();
    let D = !1;
    for (; s.getToken() !== 2 && s.getToken() !== 17; ) {
      if (s.getToken() === 5) {
        D || u(R("Property expected"), z.PropertyExpected);
        const C = s.getTokenOffset();
        if (l(), s.getToken() === 2) {
          D && a(R("Trailing comma"), z.TrailingComma, C, C + 1);
          continue;
        }
      } else D && u(R("Expected comma"), z.CommaExpected);
      const O = g(A, T);
      O ? A.properties.push(O) : u(R("Property expected"), z.PropertyExpected, void 0, [], [
        2,
        5
        /* Json.SyntaxKind.CommaToken */
      ]), D = !0;
    }
    return s.getToken() !== 2 ? u(R("Expected comma or closing brace"), z.CommaOrCloseBraceExpected, A) : c(A, !0);
  }
  function y(x) {
    if (s.getToken() !== 10)
      return;
    const A = new Vr(x, s.getTokenOffset());
    return A.value = s.getTokenValue(), c(A, !0);
  }
  function _(x) {
    if (s.getToken() !== 11)
      return;
    const A = new zf(x, s.getTokenOffset());
    if (s.getTokenError() === 0) {
      const T = s.getTokenValue();
      try {
        const D = JSON.parse(T);
        if (!he(D))
          return u(R("Invalid number format."), z.Undefined, A);
        A.value = D;
      } catch {
        return u(R("Invalid number format."), z.Undefined, A);
      }
      A.isInteger = T.indexOf(".") === -1;
    }
    return c(A, !0);
  }
  function L(x) {
    switch (s.getToken()) {
      case 7:
        return c(new Wf(x, s.getTokenOffset()), !0);
      case 8:
        return c(new ma(x, !0, s.getTokenOffset()), !0);
      case 9:
        return c(new ma(x, !1, s.getTokenOffset()), !0);
      default:
        return;
    }
  }
  function v(x) {
    return m(x) || p(x) || y(x) || _(x) || L(x);
  }
  let w;
  return l() !== 17 && (w = v(w), w ? s.getToken() !== 17 && u(R("End of file expected."), z.Undefined) : u(R("Expected a JSON object, array or literal."), z.Undefined)), new yl(w, n, o);
}
function Vi(t, e, n) {
  if (t !== null && typeof t == "object") {
    const r = e + "	";
    if (Array.isArray(t)) {
      if (t.length === 0)
        return "[]";
      let i = `[
`;
      for (let s = 0; s < t.length; s++)
        i += r + Vi(t[s], r, n), s < t.length - 1 && (i += ","), i += `
`;
      return i += e + "]", i;
    } else {
      const i = Object.keys(t);
      if (i.length === 0)
        return "{}";
      let s = `{
`;
      for (let o = 0; o < i.length; o++) {
        const l = i[o];
        s += r + JSON.stringify(l) + ": " + Vi(t[l], r, n), o < i.length - 1 && (s += ","), s += `
`;
      }
      return s += e + "}", s;
    }
  }
  return n(t);
}
var Kf = class {
  constructor(t, e = [], n = Promise, r = {}) {
    this.schemaService = t, this.contributions = e, this.promiseConstructor = n, this.clientCapabilities = r;
  }
  doResolve(t) {
    for (let e = this.contributions.length - 1; e >= 0; e--) {
      const n = this.contributions[e].resolveCompletion;
      if (n) {
        const r = n(t);
        if (r)
          return r;
      }
    }
    return this.promiseConstructor.resolve(t);
  }
  doComplete(t, e, n) {
    const r = {
      items: [],
      isIncomplete: !1
    }, i = t.getText(), s = t.offsetAt(e);
    let o = n.getNodeFromOffset(s, !0);
    if (this.isInComment(t, o ? o.offset : 0, s))
      return Promise.resolve(r);
    if (o && s === o.offset + o.length && s > 0) {
      const c = i[s - 1];
      (o.type === "object" && c === "}" || o.type === "array" && c === "]") && (o = o.parent);
    }
    const l = this.getCurrentWord(t, s);
    let a;
    if (o && (o.type === "string" || o.type === "number" || o.type === "boolean" || o.type === "null"))
      a = j.create(t.positionAt(o.offset), t.positionAt(o.offset + o.length));
    else {
      let c = s - l.length;
      c > 0 && i[c - 1] === '"' && c--, a = j.create(t.positionAt(c), e);
    }
    const u = /* @__PURE__ */ new Map(), h = {
      add: (c) => {
        let m = c.label;
        const d = u.get(m);
        if (d)
          d.documentation || (d.documentation = c.documentation), d.detail || (d.detail = c.detail), d.labelDetails || (d.labelDetails = c.labelDetails);
        else {
          if (m = m.replace(/[\n]/g, "↵"), m.length > 60) {
            const g = m.substr(0, 57).trim() + "...";
            u.has(g) || (m = g);
          }
          c.textEdit = Ge.replace(a, c.insertText), c.label = m, u.set(m, c), r.items.push(c);
        }
      },
      setAsIncomplete: () => {
        r.isIncomplete = !0;
      },
      error: (c) => {
        console.error(c);
      },
      getNumberOfProposals: () => r.items.length
    };
    return this.schemaService.getSchemaForResource(t.uri, n).then((c) => {
      const m = [];
      let d = !0, g = "", p;
      if (o && o.type === "string") {
        const _ = o.parent;
        _ && _.type === "property" && _.keyNode === o && (d = !_.valueNode, p = _, g = i.substr(o.offset + 1, o.length - 2), _ && (o = _.parent));
      }
      if (o && o.type === "object") {
        if (o.offset === s)
          return r;
        o.properties.forEach((w) => {
          (!p || p !== w) && u.set(w.keyNode.value, Ti.create("__"));
        });
        let L = "";
        d && (L = this.evaluateSeparatorAfter(t, t.offsetAt(a.end))), c ? this.getPropertyCompletions(c, n, o, d, L, h) : this.getSchemaLessPropertyCompletions(n, o, g, h);
        const v = Bi(o);
        this.contributions.forEach((w) => {
          const b = w.collectPropertyCompletions(t.uri, v, l, d, L === "", h);
          b && m.push(b);
        }), !c && l.length > 0 && i.charAt(s - l.length - 1) !== '"' && (h.add({
          kind: Le.Property,
          label: this.getLabelForValue(l),
          insertText: this.getInsertTextForProperty(l, void 0, !1, L),
          insertTextFormat: oe.Snippet,
          documentation: ""
        }), h.setAsIncomplete());
      }
      const y = {};
      return c ? this.getValueCompletions(c, n, o, s, t, h, y) : this.getSchemaLessValueCompletions(n, o, s, t, h), this.contributions.length > 0 && this.getContributedValueCompletions(n, o, s, t, h, m), this.promiseConstructor.all(m).then(() => {
        if (h.getNumberOfProposals() === 0) {
          let _ = s;
          o && (o.type === "string" || o.type === "number" || o.type === "boolean" || o.type === "null") && (_ = o.offset + o.length);
          const L = this.evaluateSeparatorAfter(t, _);
          this.addFillerValueCompletions(y, L, h);
        }
        return r;
      });
    });
  }
  getPropertyCompletions(t, e, n, r, i, s) {
    e.getMatchingSchemas(t.schema, n.offset).forEach((l) => {
      if (l.node === n && !l.inverted) {
        const a = l.schema.properties;
        a && Object.keys(a).forEach((h) => {
          const c = a[h];
          if (typeof c == "object" && !c.deprecationMessage && !c.doNotSuggest) {
            const m = {
              kind: Le.Property,
              label: h,
              insertText: this.getInsertTextForProperty(h, c, r, i),
              insertTextFormat: oe.Snippet,
              filterText: this.getFilterTextForValue(h),
              documentation: this.fromMarkup(c.markdownDescription) || c.description || ""
            };
            c.suggestSortText !== void 0 && (m.sortText = c.suggestSortText), m.insertText && An(m.insertText, `$1${i}`) && (m.command = {
              title: "Suggest",
              command: "editor.action.triggerSuggest"
            }), s.add(m);
          }
        });
        const u = l.schema.propertyNames;
        if (typeof u == "object" && !u.deprecationMessage && !u.doNotSuggest) {
          const h = (c, m = void 0) => {
            const d = {
              kind: Le.Property,
              label: c,
              insertText: this.getInsertTextForProperty(c, void 0, r, i),
              insertTextFormat: oe.Snippet,
              filterText: this.getFilterTextForValue(c),
              documentation: m || this.fromMarkup(u.markdownDescription) || u.description || ""
            };
            u.suggestSortText !== void 0 && (d.sortText = u.suggestSortText), d.insertText && An(d.insertText, `$1${i}`) && (d.command = {
              title: "Suggest",
              command: "editor.action.triggerSuggest"
            }), s.add(d);
          };
          if (u.enum)
            for (let c = 0; c < u.enum.length; c++) {
              let m;
              u.markdownEnumDescriptions && c < u.markdownEnumDescriptions.length ? m = this.fromMarkup(u.markdownEnumDescriptions[c]) : u.enumDescriptions && c < u.enumDescriptions.length && (m = u.enumDescriptions[c]), h(u.enum[c], m);
            }
          u.const && h(u.const);
        }
      }
    });
  }
  getSchemaLessPropertyCompletions(t, e, n, r) {
    const i = (s) => {
      s.properties.forEach((o) => {
        const l = o.keyNode.value;
        r.add({
          kind: Le.Property,
          label: l,
          insertText: this.getInsertTextForValue(l, ""),
          insertTextFormat: oe.Snippet,
          filterText: this.getFilterTextForValue(l),
          documentation: ""
        });
      });
    };
    if (e.parent)
      if (e.parent.type === "property") {
        const s = e.parent.keyNode.value;
        t.visit((o) => (o.type === "property" && o !== e.parent && o.keyNode.value === s && o.valueNode && o.valueNode.type === "object" && i(o.valueNode), !0));
      } else e.parent.type === "array" && e.parent.items.forEach((s) => {
        s.type === "object" && s !== e && i(s);
      });
    else e.type === "object" && r.add({
      kind: Le.Property,
      label: "$schema",
      insertText: this.getInsertTextForProperty("$schema", void 0, !0, ""),
      insertTextFormat: oe.Snippet,
      documentation: "",
      filterText: this.getFilterTextForValue("$schema")
    });
  }
  getSchemaLessValueCompletions(t, e, n, r, i) {
    let s = n;
    if (e && (e.type === "string" || e.type === "number" || e.type === "boolean" || e.type === "null") && (s = e.offset + e.length, e = e.parent), !e) {
      i.add({
        kind: this.getSuggestionKind("object"),
        label: "Empty object",
        insertText: this.getInsertTextForValue({}, ""),
        insertTextFormat: oe.Snippet,
        documentation: ""
      }), i.add({
        kind: this.getSuggestionKind("array"),
        label: "Empty array",
        insertText: this.getInsertTextForValue([], ""),
        insertTextFormat: oe.Snippet,
        documentation: ""
      });
      return;
    }
    const o = this.evaluateSeparatorAfter(r, s), l = (a) => {
      a.parent && !bl(a.parent, n, !0) && i.add({
        kind: this.getSuggestionKind(a.type),
        label: this.getLabelTextForMatchingNode(a, r),
        insertText: this.getInsertTextForMatchingNode(a, r, o),
        insertTextFormat: oe.Snippet,
        documentation: ""
      }), a.type === "boolean" && this.addBooleanValueCompletion(!a.value, o, i);
    };
    if (e.type === "property" && n > (e.colonOffset || 0)) {
      const a = e.valueNode;
      if (a && (n > a.offset + a.length || a.type === "object" || a.type === "array"))
        return;
      const u = e.keyNode.value;
      t.visit((h) => (h.type === "property" && h.keyNode.value === u && h.valueNode && l(h.valueNode), !0)), u === "$schema" && e.parent && !e.parent.parent && this.addDollarSchemaCompletions(o, i);
    }
    if (e.type === "array")
      if (e.parent && e.parent.type === "property") {
        const a = e.parent.keyNode.value;
        t.visit((u) => (u.type === "property" && u.keyNode.value === a && u.valueNode && u.valueNode.type === "array" && u.valueNode.items.forEach(l), !0));
      } else
        e.items.forEach(l);
  }
  getValueCompletions(t, e, n, r, i, s, o) {
    let l = r, a, u;
    if (n && (n.type === "string" || n.type === "number" || n.type === "boolean" || n.type === "null") && (l = n.offset + n.length, u = n, n = n.parent), !n) {
      this.addSchemaValueCompletions(t.schema, "", s, o);
      return;
    }
    if (n.type === "property" && r > (n.colonOffset || 0)) {
      const h = n.valueNode;
      if (h && r > h.offset + h.length)
        return;
      a = n.keyNode.value, n = n.parent;
    }
    if (n && (a !== void 0 || n.type === "array")) {
      const h = this.evaluateSeparatorAfter(i, l), c = e.getMatchingSchemas(t.schema, n.offset, u);
      for (const m of c)
        if (m.node === n && !m.inverted && m.schema) {
          if (n.type === "array" && m.schema.items) {
            let d = s;
            if (m.schema.uniqueItems) {
              const g = /* @__PURE__ */ new Set();
              n.children.forEach((p) => {
                p.type !== "array" && p.type !== "object" && g.add(this.getLabelForValue(wt(p)));
              }), d = {
                ...s,
                add(p) {
                  g.has(p.label) || s.add(p);
                }
              };
            }
            if (Array.isArray(m.schema.items)) {
              const g = this.findItemAtOffset(n, i, r);
              g < m.schema.items.length && this.addSchemaValueCompletions(m.schema.items[g], h, d, o);
            } else
              this.addSchemaValueCompletions(m.schema.items, h, d, o);
          }
          if (a !== void 0) {
            let d = !1;
            if (m.schema.properties) {
              const g = m.schema.properties[a];
              g && (d = !0, this.addSchemaValueCompletions(g, h, s, o));
            }
            if (m.schema.patternProperties && !d) {
              for (const g of Object.keys(m.schema.patternProperties))
                if (or(g)?.test(a)) {
                  d = !0;
                  const y = m.schema.patternProperties[g];
                  this.addSchemaValueCompletions(y, h, s, o);
                }
            }
            if (m.schema.additionalProperties && !d) {
              const g = m.schema.additionalProperties;
              this.addSchemaValueCompletions(g, h, s, o);
            }
          }
        }
      a === "$schema" && !n.parent && this.addDollarSchemaCompletions(h, s), o.boolean && (this.addBooleanValueCompletion(!0, h, s), this.addBooleanValueCompletion(!1, h, s)), o.null && this.addNullValueCompletion(h, s);
    }
  }
  getContributedValueCompletions(t, e, n, r, i, s) {
    if (!e)
      this.contributions.forEach((o) => {
        const l = o.collectDefaultCompletions(r.uri, i);
        l && s.push(l);
      });
    else if ((e.type === "string" || e.type === "number" || e.type === "boolean" || e.type === "null") && (e = e.parent), e && e.type === "property" && n > (e.colonOffset || 0)) {
      const o = e.keyNode.value, l = e.valueNode;
      if ((!l || n <= l.offset + l.length) && e.parent) {
        const a = Bi(e.parent);
        this.contributions.forEach((u) => {
          const h = u.collectValueCompletions(r.uri, a, o, i);
          h && s.push(h);
        });
      }
    }
  }
  addSchemaValueCompletions(t, e, n, r) {
    typeof t == "object" && (this.addEnumValueCompletions(t, e, n), this.addDefaultValueCompletions(t, e, n), this.collectTypes(t, r), Array.isArray(t.allOf) && t.allOf.forEach((i) => this.addSchemaValueCompletions(i, e, n, r)), Array.isArray(t.anyOf) && t.anyOf.forEach((i) => this.addSchemaValueCompletions(i, e, n, r)), Array.isArray(t.oneOf) && t.oneOf.forEach((i) => this.addSchemaValueCompletions(i, e, n, r)));
  }
  addDefaultValueCompletions(t, e, n, r = 0) {
    let i = !1;
    if (Ce(t.default)) {
      let s = t.type, o = t.default;
      for (let a = r; a > 0; a--)
        o = [o], s = "array";
      const l = {
        kind: this.getSuggestionKind(s),
        label: this.getLabelForValue(o),
        insertText: this.getInsertTextForValue(o, e),
        insertTextFormat: oe.Snippet
      };
      this.doesSupportsLabelDetails() ? l.labelDetails = { description: R("Default value") } : l.detail = R("Default value"), n.add(l), i = !0;
    }
    Array.isArray(t.examples) && t.examples.forEach((s) => {
      let o = t.type, l = s;
      for (let a = r; a > 0; a--)
        l = [l], o = "array";
      n.add({
        kind: this.getSuggestionKind(o),
        label: this.getLabelForValue(l),
        insertText: this.getInsertTextForValue(l, e),
        insertTextFormat: oe.Snippet
      }), i = !0;
    }), Array.isArray(t.defaultSnippets) && t.defaultSnippets.forEach((s) => {
      let o = t.type, l = s.body, a = s.label, u, h;
      if (Ce(l)) {
        t.type;
        for (let c = r; c > 0; c--)
          l = [l];
        u = this.getInsertTextForSnippetValue(l, e), h = this.getFilterTextForSnippetValue(l), a = a || this.getLabelForSnippetValue(l);
      } else if (typeof s.bodyText == "string") {
        let c = "", m = "", d = "";
        for (let g = r; g > 0; g--)
          c = c + d + `[
`, m = m + `
` + d + "]", d += "	", o = "array";
        u = c + d + s.bodyText.split(`
`).join(`
` + d) + m + e, a = a || u, h = u.replace(/[\n]/g, "");
      } else
        return;
      n.add({
        kind: this.getSuggestionKind(o),
        label: a,
        documentation: this.fromMarkup(s.markdownDescription) || s.description,
        insertText: u,
        insertTextFormat: oe.Snippet,
        filterText: h
      }), i = !0;
    }), !i && typeof t.items == "object" && !Array.isArray(t.items) && r < 5 && this.addDefaultValueCompletions(t.items, e, n, r + 1);
  }
  addEnumValueCompletions(t, e, n) {
    if (Ce(t.const) && n.add({
      kind: this.getSuggestionKind(t.type),
      label: this.getLabelForValue(t.const),
      insertText: this.getInsertTextForValue(t.const, e),
      insertTextFormat: oe.Snippet,
      documentation: this.fromMarkup(t.markdownDescription) || t.description
    }), Array.isArray(t.enum))
      for (let r = 0, i = t.enum.length; r < i; r++) {
        const s = t.enum[r];
        let o = this.fromMarkup(t.markdownDescription) || t.description;
        t.markdownEnumDescriptions && r < t.markdownEnumDescriptions.length && this.doesSupportMarkdown() ? o = this.fromMarkup(t.markdownEnumDescriptions[r]) : t.enumDescriptions && r < t.enumDescriptions.length && (o = t.enumDescriptions[r]), n.add({
          kind: this.getSuggestionKind(t.type),
          label: this.getLabelForValue(s),
          insertText: this.getInsertTextForValue(s, e),
          insertTextFormat: oe.Snippet,
          documentation: o
        });
      }
  }
  collectTypes(t, e) {
    if (Array.isArray(t.enum) || Ce(t.const))
      return;
    const n = t.type;
    Array.isArray(n) ? n.forEach((r) => e[r] = !0) : n && (e[n] = !0);
  }
  addFillerValueCompletions(t, e, n) {
    t.object && n.add({
      kind: this.getSuggestionKind("object"),
      label: "{}",
      insertText: this.getInsertTextForGuessedValue({}, e),
      insertTextFormat: oe.Snippet,
      detail: R("New object"),
      documentation: ""
    }), t.array && n.add({
      kind: this.getSuggestionKind("array"),
      label: "[]",
      insertText: this.getInsertTextForGuessedValue([], e),
      insertTextFormat: oe.Snippet,
      detail: R("New array"),
      documentation: ""
    });
  }
  addBooleanValueCompletion(t, e, n) {
    n.add({
      kind: this.getSuggestionKind("boolean"),
      label: t ? "true" : "false",
      insertText: this.getInsertTextForValue(t, e),
      insertTextFormat: oe.Snippet,
      documentation: ""
    });
  }
  addNullValueCompletion(t, e) {
    e.add({
      kind: this.getSuggestionKind("null"),
      label: "null",
      insertText: "null" + t,
      insertTextFormat: oe.Snippet,
      documentation: ""
    });
  }
  addDollarSchemaCompletions(t, e) {
    this.schemaService.getRegisteredSchemaIds((r) => r === "http" || r === "https").forEach((r) => {
      r.startsWith("http://json-schema.org/draft-") && (r = r + "#"), e.add({
        kind: Le.Module,
        label: this.getLabelForValue(r),
        filterText: this.getFilterTextForValue(r),
        insertText: this.getInsertTextForValue(r, t),
        insertTextFormat: oe.Snippet,
        documentation: ""
      });
    });
  }
  getLabelForValue(t) {
    return JSON.stringify(t);
  }
  getValueFromLabel(t) {
    return JSON.parse(t);
  }
  getFilterTextForValue(t) {
    return JSON.stringify(t);
  }
  getFilterTextForSnippetValue(t) {
    return JSON.stringify(t).replace(/\$\{\d+:([^}]+)\}|\$\d+/g, "$1");
  }
  getLabelForSnippetValue(t) {
    return JSON.stringify(t).replace(/\$\{\d+:([^}]+)\}|\$\d+/g, "$1");
  }
  getInsertTextForPlainText(t) {
    return t.replace(/[\\\$\}]/g, "\\$&");
  }
  getInsertTextForValue(t, e) {
    const n = JSON.stringify(t, null, "	");
    return n === "{}" ? "{$1}" + e : n === "[]" ? "[$1]" + e : this.getInsertTextForPlainText(n + e);
  }
  getInsertTextForSnippetValue(t, e) {
    return Vi(t, "", (r) => typeof r == "string" && r[0] === "^" ? r.substr(1) : JSON.stringify(r)) + e;
  }
  getInsertTextForGuessedValue(t, e) {
    switch (typeof t) {
      case "object":
        return t === null ? "${1:null}" + e : this.getInsertTextForValue(t, e);
      case "string":
        let n = JSON.stringify(t);
        return n = n.substr(1, n.length - 2), n = this.getInsertTextForPlainText(n), '"${1:' + n + '}"' + e;
      case "number":
      case "boolean":
        return "${1:" + JSON.stringify(t) + "}" + e;
    }
    return this.getInsertTextForValue(t, e);
  }
  getSuggestionKind(t) {
    if (Array.isArray(t)) {
      const e = t;
      t = e.length > 0 ? e[0] : void 0;
    }
    if (!t)
      return Le.Value;
    switch (t) {
      case "string":
        return Le.Value;
      case "object":
        return Le.Module;
      case "property":
        return Le.Property;
      default:
        return Le.Value;
    }
  }
  getLabelTextForMatchingNode(t, e) {
    switch (t.type) {
      case "array":
        return "[]";
      case "object":
        return "{}";
      default:
        return e.getText().substr(t.offset, t.length);
    }
  }
  getInsertTextForMatchingNode(t, e, n) {
    switch (t.type) {
      case "array":
        return this.getInsertTextForValue([], n);
      case "object":
        return this.getInsertTextForValue({}, n);
      default:
        const r = e.getText().substr(t.offset, t.length) + n;
        return this.getInsertTextForPlainText(r);
    }
  }
  getInsertTextForProperty(t, e, n, r) {
    const i = this.getInsertTextForValue(t, "");
    if (!n)
      return i;
    const s = i + ": ";
    let o, l = 0;
    if (e) {
      if (Array.isArray(e.defaultSnippets)) {
        if (e.defaultSnippets.length === 1) {
          const a = e.defaultSnippets[0].body;
          Ce(a) && (o = this.getInsertTextForSnippetValue(a, ""));
        }
        l += e.defaultSnippets.length;
      }
      if (e.enum && (!o && e.enum.length === 1 && (o = this.getInsertTextForGuessedValue(e.enum[0], "")), l += e.enum.length), Ce(e.const) && (o || (o = this.getInsertTextForGuessedValue(e.const, "")), l++), Ce(e.default) && (o || (o = this.getInsertTextForGuessedValue(e.default, "")), l++), Array.isArray(e.examples) && e.examples.length && (o || (o = this.getInsertTextForGuessedValue(e.examples[0], "")), l += e.examples.length), l === 0) {
        let a = Array.isArray(e.type) ? e.type[0] : e.type;
        switch (a || (e.properties ? a = "object" : e.items && (a = "array")), a) {
          case "boolean":
            o = "$1";
            break;
          case "string":
            o = '"$1"';
            break;
          case "object":
            o = "{$1}";
            break;
          case "array":
            o = "[$1]";
            break;
          case "number":
          case "integer":
            o = "${1:0}";
            break;
          case "null":
            o = "${1:null}";
            break;
          default:
            return i;
        }
      }
    }
    return (!o || l > 1) && (o = "$1"), s + o + r;
  }
  getCurrentWord(t, e) {
    let n = e - 1;
    const r = t.getText();
    for (; n >= 0 && ` 	
\r\v":{[,]}`.indexOf(r.charAt(n)) === -1; )
      n--;
    return r.substring(n + 1, e);
  }
  evaluateSeparatorAfter(t, e) {
    const n = vt(t.getText(), !0);
    switch (n.setPosition(e), n.scan()) {
      case 5:
      case 2:
      case 4:
      case 17:
        return "";
      default:
        return ",";
    }
  }
  findItemAtOffset(t, e, n) {
    const r = vt(e.getText(), !0), i = t.items;
    for (let s = i.length - 1; s >= 0; s--) {
      const o = i[s];
      if (n > o.offset + o.length)
        return r.setPosition(o.offset + o.length), r.scan() === 5 && n >= r.getTokenOffset() + r.getTokenLength() ? s + 1 : s;
      if (n >= o.offset)
        return s;
    }
    return 0;
  }
  isInComment(t, e, n) {
    const r = vt(t.getText(), !1);
    r.setPosition(e);
    let i = r.scan();
    for (; i !== 17 && r.getTokenOffset() + r.getTokenLength() < n; )
      i = r.scan();
    return (i === 12 || i === 13) && r.getTokenOffset() <= n;
  }
  fromMarkup(t) {
    if (t && this.doesSupportMarkdown())
      return {
        kind: xt.Markdown,
        value: t
      };
  }
  doesSupportMarkdown() {
    if (!Ce(this.supportsMarkdown)) {
      const t = this.clientCapabilities.textDocument?.completion?.completionItem?.documentationFormat;
      this.supportsMarkdown = Array.isArray(t) && t.indexOf(xt.Markdown) !== -1;
    }
    return this.supportsMarkdown;
  }
  doesSupportsCommitCharacters() {
    return Ce(this.supportsCommitCharacters) || (this.labelDetailsSupport = this.clientCapabilities.textDocument?.completion?.completionItem?.commitCharactersSupport), this.supportsCommitCharacters;
  }
  doesSupportsLabelDetails() {
    return Ce(this.labelDetailsSupport) || (this.labelDetailsSupport = this.clientCapabilities.textDocument?.completion?.completionItem?.labelDetailsSupport), this.labelDetailsSupport;
  }
}, eh = class {
  constructor(t, e = [], n) {
    this.schemaService = t, this.contributions = e, this.promise = n || Promise;
  }
  doHover(t, e, n) {
    const r = t.offsetAt(e);
    let i = n.getNodeFromOffset(r);
    if (!i || (i.type === "object" || i.type === "array") && r > i.offset + 1 && r < i.offset + i.length - 1)
      return this.promise.resolve(null);
    const s = i;
    if (i.type === "string") {
      const u = i.parent;
      if (u && u.type === "property" && u.keyNode === i && (i = u.valueNode, !i))
        return this.promise.resolve(null);
    }
    const o = j.create(t.positionAt(s.offset), t.positionAt(s.offset + s.length)), l = (u) => ({
      contents: u,
      range: o
    }), a = Bi(i);
    for (let u = this.contributions.length - 1; u >= 0; u--) {
      const c = this.contributions[u].getInfoContribution(t.uri, a);
      if (c)
        return c.then((m) => l(m));
    }
    return this.schemaService.getSchemaForResource(t.uri, n).then((u) => {
      if (u && i) {
        const h = n.getMatchingSchemas(u.schema, i.offset);
        let c, m, d, g;
        h.every((y) => {
          if (y.node === i && !y.inverted && y.schema && (c = c || y.schema.title, m = m || y.schema.markdownDescription || Or(y.schema.description), y.schema.enum)) {
            const _ = y.schema.enum.indexOf(wt(i));
            y.schema.markdownEnumDescriptions ? d = y.schema.markdownEnumDescriptions[_] : y.schema.enumDescriptions && (d = Or(y.schema.enumDescriptions[_])), d && (g = y.schema.enum[_], typeof g != "string" && (g = JSON.stringify(g)));
          }
          return !0;
        });
        let p = "";
        return c && (p = Or(c)), m && (p.length > 0 && (p += `

`), p += m), d && (p.length > 0 && (p += `

`), p += `\`${th(g)}\`: ${d}`), l([p]);
      }
      return null;
    });
  }
};
function Or(t) {
  if (t)
    return t.replace(/([^\n\r])(\r?\n)([^\n\r])/gm, `$1

$3`).replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
}
function th(t) {
  return t.indexOf("`") !== -1 ? "`` " + t + " ``" : t;
}
var nh = class {
  constructor(t, e) {
    this.jsonSchemaService = t, this.promise = e, this.validationEnabled = !0;
  }
  configure(t) {
    t && (this.validationEnabled = t.validate !== !1, this.commentSeverity = t.allowComments ? void 0 : Ae.Error);
  }
  doValidation(t, e, n, r) {
    if (!this.validationEnabled)
      return this.promise.resolve([]);
    const i = [], s = {}, o = (a) => {
      const u = a.range.start.line + " " + a.range.start.character + " " + a.message;
      s[u] || (s[u] = !0, i.push(a));
    }, l = (a) => {
      let u = n?.trailingCommas ? In(n.trailingCommas) : Ae.Error, h = n?.comments ? In(n.comments) : this.commentSeverity, c = n?.schemaValidation ? In(n.schemaValidation) : Ae.Warning, m = n?.schemaRequest ? In(n.schemaRequest) : Ae.Warning;
      if (a) {
        const d = (g, p) => {
          if (e.root && m) {
            const y = e.root, _ = y.type === "object" ? y.properties[0] : void 0;
            if (_ && _.keyNode.value === "$schema") {
              const L = _.valueNode || _, v = j.create(t.positionAt(L.offset), t.positionAt(L.offset + L.length));
              o(et.create(v, g, m, p));
            } else {
              const L = j.create(t.positionAt(y.offset), t.positionAt(y.offset + 1));
              o(et.create(L, g, m, p));
            }
          }
        };
        if (a.errors.length)
          d(a.errors[0], z.SchemaResolveError);
        else if (c) {
          for (const p of a.warnings)
            d(p, z.SchemaUnsupportedFeature);
          const g = e.validate(t, a.schema, c, n?.schemaDraft);
          g && g.forEach(o);
        }
        vl(a.schema) && (h = void 0), wl(a.schema) && (u = void 0);
      }
      for (const d of e.syntaxErrors) {
        if (d.code === z.TrailingComma) {
          if (typeof u != "number")
            continue;
          d.severity = u;
        }
        o(d);
      }
      if (typeof h == "number") {
        const d = R("Comments are not permitted in JSON.");
        e.comments.forEach((g) => {
          o(et.create(g, d, h, z.CommentNotPermitted));
        });
      }
      return i;
    };
    if (r) {
      const a = r.id || "schemaservice://untitled/" + rh++;
      return this.jsonSchemaService.registerExternalSchema({ uri: a, schema: r }).getResolvedSchema().then((h) => l(h));
    }
    return this.jsonSchemaService.getSchemaForResource(t.uri, e).then((a) => l(a));
  }
  getLanguageStatus(t, e) {
    return { schemas: this.jsonSchemaService.getSchemaURIsForResource(t.uri, e) };
  }
}, rh = 0;
function vl(t) {
  if (t && typeof t == "object") {
    if (He(t.allowComments))
      return t.allowComments;
    if (t.allOf)
      for (const e of t.allOf) {
        const n = vl(e);
        if (He(n))
          return n;
      }
  }
}
function wl(t) {
  if (t && typeof t == "object") {
    if (He(t.allowTrailingCommas))
      return t.allowTrailingCommas;
    const e = t;
    if (He(e.allowsTrailingCommas))
      return e.allowsTrailingCommas;
    if (t.allOf)
      for (const n of t.allOf) {
        const r = wl(n);
        if (He(r))
          return r;
      }
  }
}
function In(t) {
  switch (t) {
    case "error":
      return Ae.Error;
    case "warning":
      return Ae.Warning;
    case "ignore":
      return;
  }
}
var ba = 48, ih = 57, sh = 65, Pn = 97, oh = 102;
function ie(t) {
  return t < ba ? 0 : t <= ih ? t - ba : (t < Pn && (t += Pn - sh), t >= Pn && t <= oh ? t - Pn + 10 : 0);
}
function ah(t) {
  if (t[0] === "#")
    switch (t.length) {
      case 4:
        return {
          red: ie(t.charCodeAt(1)) * 17 / 255,
          green: ie(t.charCodeAt(2)) * 17 / 255,
          blue: ie(t.charCodeAt(3)) * 17 / 255,
          alpha: 1
        };
      case 5:
        return {
          red: ie(t.charCodeAt(1)) * 17 / 255,
          green: ie(t.charCodeAt(2)) * 17 / 255,
          blue: ie(t.charCodeAt(3)) * 17 / 255,
          alpha: ie(t.charCodeAt(4)) * 17 / 255
        };
      case 7:
        return {
          red: (ie(t.charCodeAt(1)) * 16 + ie(t.charCodeAt(2))) / 255,
          green: (ie(t.charCodeAt(3)) * 16 + ie(t.charCodeAt(4))) / 255,
          blue: (ie(t.charCodeAt(5)) * 16 + ie(t.charCodeAt(6))) / 255,
          alpha: 1
        };
      case 9:
        return {
          red: (ie(t.charCodeAt(1)) * 16 + ie(t.charCodeAt(2))) / 255,
          green: (ie(t.charCodeAt(3)) * 16 + ie(t.charCodeAt(4))) / 255,
          blue: (ie(t.charCodeAt(5)) * 16 + ie(t.charCodeAt(6))) / 255,
          alpha: (ie(t.charCodeAt(7)) * 16 + ie(t.charCodeAt(8))) / 255
        };
    }
}
var lh = class {
  constructor(t) {
    this.schemaService = t;
  }
  findDocumentSymbols(t, e, n = { resultLimit: Number.MAX_VALUE }) {
    const r = e.root;
    if (!r)
      return [];
    let i = n.resultLimit || Number.MAX_VALUE;
    const s = t.uri;
    if ((s === "vscode://defaultsettings/keybindings.json" || An(s.toLowerCase(), "/user/keybindings.json")) && r.type === "array") {
      const c = [];
      for (const m of r.items)
        if (m.type === "object") {
          for (const d of m.properties)
            if (d.keyNode.value === "key" && d.valueNode) {
              const g = Zt.create(t.uri, it(t, m));
              if (c.push({ name: ya(d.valueNode), kind: Be.Function, location: g }), i--, i <= 0)
                return n && n.onResultLimitExceeded && n.onResultLimitExceeded(s), c;
            }
        }
      return c;
    }
    const o = [
      { node: r, containerName: "" }
    ];
    let l = 0, a = !1;
    const u = [], h = (c, m) => {
      c.type === "array" ? c.items.forEach((d) => {
        d && o.push({ node: d, containerName: m });
      }) : c.type === "object" && c.properties.forEach((d) => {
        const g = d.valueNode;
        if (g)
          if (i > 0) {
            i--;
            const p = Zt.create(t.uri, it(t, d)), y = m ? m + "." + d.keyNode.value : d.keyNode.value;
            u.push({ name: this.getKeyLabel(d), kind: this.getSymbolKind(g.type), location: p, containerName: m }), o.push({ node: g, containerName: y });
          } else
            a = !0;
      });
    };
    for (; l < o.length; ) {
      const c = o[l++];
      h(c.node, c.containerName);
    }
    return a && n && n.onResultLimitExceeded && n.onResultLimitExceeded(s), u;
  }
  findDocumentSymbols2(t, e, n = { resultLimit: Number.MAX_VALUE }) {
    const r = e.root;
    if (!r)
      return [];
    let i = n.resultLimit || Number.MAX_VALUE;
    const s = t.uri;
    if ((s === "vscode://defaultsettings/keybindings.json" || An(s.toLowerCase(), "/user/keybindings.json")) && r.type === "array") {
      const c = [];
      for (const m of r.items)
        if (m.type === "object") {
          for (const d of m.properties)
            if (d.keyNode.value === "key" && d.valueNode) {
              const g = it(t, m), p = it(t, d.keyNode);
              if (c.push({ name: ya(d.valueNode), kind: Be.Function, range: g, selectionRange: p }), i--, i <= 0)
                return n && n.onResultLimitExceeded && n.onResultLimitExceeded(s), c;
            }
        }
      return c;
    }
    const o = [], l = [
      { node: r, result: o }
    ];
    let a = 0, u = !1;
    const h = (c, m) => {
      c.type === "array" ? c.items.forEach((d, g) => {
        if (d)
          if (i > 0) {
            i--;
            const p = it(t, d), y = p, L = { name: String(g), kind: this.getSymbolKind(d.type), range: p, selectionRange: y, children: [] };
            m.push(L), l.push({ result: L.children, node: d });
          } else
            u = !0;
      }) : c.type === "object" && c.properties.forEach((d) => {
        const g = d.valueNode;
        if (g)
          if (i > 0) {
            i--;
            const p = it(t, d), y = it(t, d.keyNode), _ = [], L = { name: this.getKeyLabel(d), kind: this.getSymbolKind(g.type), range: p, selectionRange: y, children: _, detail: this.getDetail(g) };
            m.push(L), l.push({ result: _, node: g });
          } else
            u = !0;
      });
    };
    for (; a < l.length; ) {
      const c = l[a++];
      h(c.node, c.result);
    }
    return u && n && n.onResultLimitExceeded && n.onResultLimitExceeded(s), o;
  }
  getSymbolKind(t) {
    switch (t) {
      case "object":
        return Be.Module;
      case "string":
        return Be.String;
      case "number":
        return Be.Number;
      case "array":
        return Be.Array;
      case "boolean":
        return Be.Boolean;
      default:
        return Be.Variable;
    }
  }
  getKeyLabel(t) {
    let e = t.keyNode.value;
    return e && (e = e.replace(/[\n]/g, "↵")), e && e.trim() ? e : `"${e}"`;
  }
  getDetail(t) {
    if (t) {
      if (t.type === "boolean" || t.type === "number" || t.type === "null" || t.type === "string")
        return String(t.value);
      if (t.type === "array")
        return t.children.length ? void 0 : "[]";
      if (t.type === "object")
        return t.children.length ? void 0 : "{}";
    }
  }
  findDocumentColors(t, e, n) {
    return this.schemaService.getSchemaForResource(t.uri, e).then((r) => {
      const i = [];
      if (r) {
        let s = n && typeof n.resultLimit == "number" ? n.resultLimit : Number.MAX_VALUE;
        const o = e.getMatchingSchemas(r.schema), l = {};
        for (const a of o)
          if (!a.inverted && a.schema && (a.schema.format === "color" || a.schema.format === "color-hex") && a.node && a.node.type === "string") {
            const u = String(a.node.offset);
            if (!l[u]) {
              const h = ah(wt(a.node));
              if (h) {
                const c = it(t, a.node);
                i.push({ color: h, range: c });
              }
              if (l[u] = !0, s--, s <= 0)
                return n && n.onResultLimitExceeded && n.onResultLimitExceeded(t.uri), i;
            }
          }
      }
      return i;
    });
  }
  getColorPresentations(t, e, n, r) {
    const i = [], s = Math.round(n.red * 255), o = Math.round(n.green * 255), l = Math.round(n.blue * 255);
    function a(h) {
      const c = h.toString(16);
      return c.length !== 2 ? "0" + c : c;
    }
    let u;
    return n.alpha === 1 ? u = `#${a(s)}${a(o)}${a(l)}` : u = `#${a(s)}${a(o)}${a(l)}${a(Math.round(n.alpha * 255))}`, i.push({ label: u, textEdit: Ge.replace(r, JSON.stringify(u)) }), i;
  }
};
function it(t, e) {
  return j.create(t.positionAt(e.offset), t.positionAt(e.offset + e.length));
}
function ya(t) {
  return wt(t) || R("<empty>");
}
var Oi = {
  schemaAssociations: [],
  schemas: {
    // bundle the schema-schema to include (localized) descriptions
    "http://json-schema.org/draft-04/schema#": {
      $schema: "http://json-schema.org/draft-04/schema#",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: {
            $ref: "#"
          }
        },
        positiveInteger: {
          type: "integer",
          minimum: 0
        },
        positiveIntegerDefault0: {
          allOf: [
            {
              $ref: "#/definitions/positiveInteger"
            },
            {
              default: 0
            }
          ]
        },
        simpleTypes: {
          type: "string",
          enum: [
            "array",
            "boolean",
            "integer",
            "null",
            "number",
            "object",
            "string"
          ]
        },
        stringArray: {
          type: "array",
          items: {
            type: "string"
          },
          minItems: 1,
          uniqueItems: !0
        }
      },
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uri"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: {},
        multipleOf: {
          type: "number",
          minimum: 0,
          exclusiveMinimum: !0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "boolean",
          default: !1
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "boolean",
          default: !1
        },
        maxLength: {
          allOf: [
            {
              $ref: "#/definitions/positiveInteger"
            }
          ]
        },
        minLength: {
          allOf: [
            {
              $ref: "#/definitions/positiveIntegerDefault0"
            }
          ]
        },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: {
          anyOf: [
            {
              type: "boolean"
            },
            {
              $ref: "#"
            }
          ],
          default: {}
        },
        items: {
          anyOf: [
            {
              $ref: "#"
            },
            {
              $ref: "#/definitions/schemaArray"
            }
          ],
          default: {}
        },
        maxItems: {
          allOf: [
            {
              $ref: "#/definitions/positiveInteger"
            }
          ]
        },
        minItems: {
          allOf: [
            {
              $ref: "#/definitions/positiveIntegerDefault0"
            }
          ]
        },
        uniqueItems: {
          type: "boolean",
          default: !1
        },
        maxProperties: {
          allOf: [
            {
              $ref: "#/definitions/positiveInteger"
            }
          ]
        },
        minProperties: {
          allOf: [
            {
              $ref: "#/definitions/positiveIntegerDefault0"
            }
          ]
        },
        required: {
          allOf: [
            {
              $ref: "#/definitions/stringArray"
            }
          ]
        },
        additionalProperties: {
          anyOf: [
            {
              type: "boolean"
            },
            {
              $ref: "#"
            }
          ],
          default: {}
        },
        definitions: {
          type: "object",
          additionalProperties: {
            $ref: "#"
          },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: {
            $ref: "#"
          },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: {
            $ref: "#"
          },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [
              {
                $ref: "#"
              },
              {
                $ref: "#/definitions/stringArray"
              }
            ]
          }
        },
        enum: {
          type: "array",
          minItems: 1,
          uniqueItems: !0
        },
        type: {
          anyOf: [
            {
              $ref: "#/definitions/simpleTypes"
            },
            {
              type: "array",
              items: {
                $ref: "#/definitions/simpleTypes"
              },
              minItems: 1,
              uniqueItems: !0
            }
          ]
        },
        format: {
          anyOf: [
            {
              type: "string",
              enum: [
                "date-time",
                "uri",
                "email",
                "hostname",
                "ipv4",
                "ipv6",
                "regex"
              ]
            },
            {
              type: "string"
            }
          ]
        },
        allOf: {
          allOf: [
            {
              $ref: "#/definitions/schemaArray"
            }
          ]
        },
        anyOf: {
          allOf: [
            {
              $ref: "#/definitions/schemaArray"
            }
          ]
        },
        oneOf: {
          allOf: [
            {
              $ref: "#/definitions/schemaArray"
            }
          ]
        },
        not: {
          allOf: [
            {
              $ref: "#"
            }
          ]
        }
      },
      dependencies: {
        exclusiveMaximum: [
          "maximum"
        ],
        exclusiveMinimum: [
          "minimum"
        ]
      },
      default: {}
    },
    "http://json-schema.org/draft-07/schema#": {
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [
            { $ref: "#/definitions/nonNegativeInteger" },
            { default: 0 }
          ]
        },
        simpleTypes: {
          enum: [
            "array",
            "boolean",
            "integer",
            "null",
            "number",
            "object",
            "string"
          ]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: !0,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: !0,
        readOnly: {
          type: "boolean",
          default: !1
        },
        examples: {
          type: "array",
          items: !0
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/definitions/nonNegativeInteger" },
        minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: { $ref: "#" },
        items: {
          anyOf: [
            { $ref: "#" },
            { $ref: "#/definitions/schemaArray" }
          ],
          default: !0
        },
        maxItems: { $ref: "#/definitions/nonNegativeInteger" },
        minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: !1
        },
        contains: { $ref: "#" },
        maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
        minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: { $ref: "#" },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [
              { $ref: "#" },
              { $ref: "#/definitions/stringArray" }
            ]
          }
        },
        propertyNames: { $ref: "#" },
        const: !0,
        enum: {
          type: "array",
          items: !0,
          minItems: 1,
          uniqueItems: !0
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: !0
            }
          ]
        },
        format: { type: "string" },
        contentMediaType: { type: "string" },
        contentEncoding: { type: "string" },
        if: { $ref: "#" },
        then: { $ref: "#" },
        else: { $ref: "#" },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      default: !0
    }
  }
}, uh = {
  id: R("A unique identifier for the schema."),
  $schema: R("The schema to verify this document against."),
  title: R("A descriptive title of the element."),
  description: R("A long description of the element. Used in hover menus and suggestions."),
  default: R("A default value. Used by suggestions."),
  multipleOf: R("A number that should cleanly divide the current value (i.e. have no remainder)."),
  maximum: R("The maximum numerical value, inclusive by default."),
  exclusiveMaximum: R("Makes the maximum property exclusive."),
  minimum: R("The minimum numerical value, inclusive by default."),
  exclusiveMinimum: R("Makes the minimum property exclusive."),
  maxLength: R("The maximum length of a string."),
  minLength: R("The minimum length of a string."),
  pattern: R("A regular expression to match the string against. It is not implicitly anchored."),
  additionalItems: R("For arrays, only when items is set as an array. If it is a schema, then this schema validates items after the ones specified by the items array. If it is false, then additional items will cause validation to fail."),
  items: R("For arrays. Can either be a schema to validate every element against or an array of schemas to validate each item against in order (the first schema will validate the first element, the second schema will validate the second element, and so on."),
  maxItems: R("The maximum number of items that can be inside an array. Inclusive."),
  minItems: R("The minimum number of items that can be inside an array. Inclusive."),
  uniqueItems: R("If all of the items in the array must be unique. Defaults to false."),
  maxProperties: R("The maximum number of properties an object can have. Inclusive."),
  minProperties: R("The minimum number of properties an object can have. Inclusive."),
  required: R("An array of strings that lists the names of all properties required on this object."),
  additionalProperties: R("Either a schema or a boolean. If a schema, then used to validate all properties not matched by 'properties' or 'patternProperties'. If false, then any properties not matched by either will cause this schema to fail."),
  definitions: R("Not used for validation. Place subschemas here that you wish to reference inline with $ref."),
  properties: R("A map of property names to schemas for each property."),
  patternProperties: R("A map of regular expressions on property names to schemas for matching properties."),
  dependencies: R("A map of property names to either an array of property names or a schema. An array of property names means the property named in the key depends on the properties in the array being present in the object in order to be valid. If the value is a schema, then the schema is only applied to the object if the property in the key exists on the object."),
  enum: R("The set of literal values that are valid."),
  type: R("Either a string of one of the basic schema types (number, integer, null, array, object, boolean, string) or an array of strings specifying a subset of those types."),
  format: R("Describes the format expected for the value."),
  allOf: R("An array of schemas, all of which must match."),
  anyOf: R("An array of schemas, where at least one must match."),
  oneOf: R("An array of schemas, exactly one of which must match."),
  not: R("A schema which must not match."),
  $id: R("A unique identifier for the schema."),
  $ref: R("Reference a definition hosted on any location."),
  $comment: R("Comments from schema authors to readers or maintainers of the schema."),
  readOnly: R("Indicates that the value of the instance is managed exclusively by the owning authority."),
  examples: R("Sample JSON values associated with a particular schema, for the purpose of illustrating usage."),
  contains: R('An array instance is valid against "contains" if at least one of its elements is valid against the given schema.'),
  propertyNames: R("If the instance is an object, this keyword validates if every property name in the instance validates against the provided schema."),
  const: R("An instance validates successfully against this keyword if its value is equal to the value of the keyword."),
  contentMediaType: R("Describes the media type of a string property."),
  contentEncoding: R("Describes the content encoding of a string property."),
  if: R('The validation outcome of the "if" subschema controls which of the "then" or "else" keywords are evaluated.'),
  then: R('The "if" subschema is used for validation when the "if" subschema succeeds.'),
  else: R('The "else" subschema is used for validation when the "if" subschema fails.')
};
for (const t in Oi.schemas) {
  const e = Oi.schemas[t];
  for (const n in e.properties) {
    let r = e.properties[n];
    typeof r == "boolean" && (r = e.properties[n] = {});
    const i = uh[n];
    i && (r.description = i);
  }
}
var xl;
(() => {
  var t = { 470: (i) => {
    function s(a) {
      if (typeof a != "string")
        throw new TypeError("Path must be a string. Received " + JSON.stringify(a));
    }
    function o(a, u) {
      for (var h, c = "", m = 0, d = -1, g = 0, p = 0; p <= a.length; ++p) {
        if (p < a.length)
          h = a.charCodeAt(p);
        else {
          if (h === 47)
            break;
          h = 47;
        }
        if (h === 47) {
          if (!(d === p - 1 || g === 1))
            if (d !== p - 1 && g === 2) {
              if (c.length < 2 || m !== 2 || c.charCodeAt(c.length - 1) !== 46 || c.charCodeAt(c.length - 2) !== 46) {
                if (c.length > 2) {
                  var y = c.lastIndexOf("/");
                  if (y !== c.length - 1) {
                    y === -1 ? (c = "", m = 0) : m = (c = c.slice(0, y)).length - 1 - c.lastIndexOf("/"), d = p, g = 0;
                    continue;
                  }
                } else if (c.length === 2 || c.length === 1) {
                  c = "", m = 0, d = p, g = 0;
                  continue;
                }
              }
              u && (c.length > 0 ? c += "/.." : c = "..", m = 2);
            } else
              c.length > 0 ? c += "/" + a.slice(d + 1, p) : c = a.slice(d + 1, p), m = p - d - 1;
          d = p, g = 0;
        } else
          h === 46 && g !== -1 ? ++g : g = -1;
      }
      return c;
    }
    var l = { resolve: function() {
      for (var a, u = "", h = !1, c = arguments.length - 1; c >= -1 && !h; c--) {
        var m;
        c >= 0 ? m = arguments[c] : (a === void 0 && (a = ve.cwd()), m = a), s(m), m.length !== 0 && (u = m + "/" + u, h = m.charCodeAt(0) === 47);
      }
      return u = o(u, !h), h ? u.length > 0 ? "/" + u : "/" : u.length > 0 ? u : ".";
    }, normalize: function(a) {
      if (s(a), a.length === 0)
        return ".";
      var u = a.charCodeAt(0) === 47, h = a.charCodeAt(a.length - 1) === 47;
      return (a = o(a, !u)).length !== 0 || u || (a = "."), a.length > 0 && h && (a += "/"), u ? "/" + a : a;
    }, isAbsolute: function(a) {
      return s(a), a.length > 0 && a.charCodeAt(0) === 47;
    }, join: function() {
      if (arguments.length === 0)
        return ".";
      for (var a, u = 0; u < arguments.length; ++u) {
        var h = arguments[u];
        s(h), h.length > 0 && (a === void 0 ? a = h : a += "/" + h);
      }
      return a === void 0 ? "." : l.normalize(a);
    }, relative: function(a, u) {
      if (s(a), s(u), a === u || (a = l.resolve(a)) === (u = l.resolve(u)))
        return "";
      for (var h = 1; h < a.length && a.charCodeAt(h) === 47; ++h)
        ;
      for (var c = a.length, m = c - h, d = 1; d < u.length && u.charCodeAt(d) === 47; ++d)
        ;
      for (var g = u.length - d, p = m < g ? m : g, y = -1, _ = 0; _ <= p; ++_) {
        if (_ === p) {
          if (g > p) {
            if (u.charCodeAt(d + _) === 47)
              return u.slice(d + _ + 1);
            if (_ === 0)
              return u.slice(d + _);
          } else
            m > p && (a.charCodeAt(h + _) === 47 ? y = _ : _ === 0 && (y = 0));
          break;
        }
        var L = a.charCodeAt(h + _);
        if (L !== u.charCodeAt(d + _))
          break;
        L === 47 && (y = _);
      }
      var v = "";
      for (_ = h + y + 1; _ <= c; ++_)
        _ !== c && a.charCodeAt(_) !== 47 || (v.length === 0 ? v += ".." : v += "/..");
      return v.length > 0 ? v + u.slice(d + y) : (d += y, u.charCodeAt(d) === 47 && ++d, u.slice(d));
    }, _makeLong: function(a) {
      return a;
    }, dirname: function(a) {
      if (s(a), a.length === 0)
        return ".";
      for (var u = a.charCodeAt(0), h = u === 47, c = -1, m = !0, d = a.length - 1; d >= 1; --d)
        if ((u = a.charCodeAt(d)) === 47) {
          if (!m) {
            c = d;
            break;
          }
        } else
          m = !1;
      return c === -1 ? h ? "/" : "." : h && c === 1 ? "//" : a.slice(0, c);
    }, basename: function(a, u) {
      if (u !== void 0 && typeof u != "string")
        throw new TypeError('"ext" argument must be a string');
      s(a);
      var h, c = 0, m = -1, d = !0;
      if (u !== void 0 && u.length > 0 && u.length <= a.length) {
        if (u.length === a.length && u === a)
          return "";
        var g = u.length - 1, p = -1;
        for (h = a.length - 1; h >= 0; --h) {
          var y = a.charCodeAt(h);
          if (y === 47) {
            if (!d) {
              c = h + 1;
              break;
            }
          } else
            p === -1 && (d = !1, p = h + 1), g >= 0 && (y === u.charCodeAt(g) ? --g == -1 && (m = h) : (g = -1, m = p));
        }
        return c === m ? m = p : m === -1 && (m = a.length), a.slice(c, m);
      }
      for (h = a.length - 1; h >= 0; --h)
        if (a.charCodeAt(h) === 47) {
          if (!d) {
            c = h + 1;
            break;
          }
        } else
          m === -1 && (d = !1, m = h + 1);
      return m === -1 ? "" : a.slice(c, m);
    }, extname: function(a) {
      s(a);
      for (var u = -1, h = 0, c = -1, m = !0, d = 0, g = a.length - 1; g >= 0; --g) {
        var p = a.charCodeAt(g);
        if (p !== 47)
          c === -1 && (m = !1, c = g + 1), p === 46 ? u === -1 ? u = g : d !== 1 && (d = 1) : u !== -1 && (d = -1);
        else if (!m) {
          h = g + 1;
          break;
        }
      }
      return u === -1 || c === -1 || d === 0 || d === 1 && u === c - 1 && u === h + 1 ? "" : a.slice(u, c);
    }, format: function(a) {
      if (a === null || typeof a != "object")
        throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof a);
      return (function(u, h) {
        var c = h.dir || h.root, m = h.base || (h.name || "") + (h.ext || "");
        return c ? c === h.root ? c + m : c + "/" + m : m;
      })(0, a);
    }, parse: function(a) {
      s(a);
      var u = { root: "", dir: "", base: "", ext: "", name: "" };
      if (a.length === 0)
        return u;
      var h, c = a.charCodeAt(0), m = c === 47;
      m ? (u.root = "/", h = 1) : h = 0;
      for (var d = -1, g = 0, p = -1, y = !0, _ = a.length - 1, L = 0; _ >= h; --_)
        if ((c = a.charCodeAt(_)) !== 47)
          p === -1 && (y = !1, p = _ + 1), c === 46 ? d === -1 ? d = _ : L !== 1 && (L = 1) : d !== -1 && (L = -1);
        else if (!y) {
          g = _ + 1;
          break;
        }
      return d === -1 || p === -1 || L === 0 || L === 1 && d === p - 1 && d === g + 1 ? p !== -1 && (u.base = u.name = g === 0 && m ? a.slice(1, p) : a.slice(g, p)) : (g === 0 && m ? (u.name = a.slice(1, d), u.base = a.slice(1, p)) : (u.name = a.slice(g, d), u.base = a.slice(g, p)), u.ext = a.slice(d, p)), g > 0 ? u.dir = a.slice(0, g - 1) : m && (u.dir = "/"), u;
    }, sep: "/", delimiter: ":", win32: null, posix: null };
    l.posix = l, i.exports = l;
  } }, e = {};
  function n(i) {
    var s = e[i];
    if (s !== void 0)
      return s.exports;
    var o = e[i] = { exports: {} };
    return t[i](o, o.exports, n), o.exports;
  }
  n.d = (i, s) => {
    for (var o in s)
      n.o(s, o) && !n.o(i, o) && Object.defineProperty(i, o, { enumerable: !0, get: s[o] });
  }, n.o = (i, s) => Object.prototype.hasOwnProperty.call(i, s), n.r = (i) => {
    typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(i, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(i, "__esModule", { value: !0 });
  };
  var r = {};
  (() => {
    let i;
    n.r(r), n.d(r, { URI: () => m, Utils: () => O }), typeof ve == "object" ? i = ve.platform === "win32" : typeof navigator == "object" && (i = navigator.userAgent.indexOf("Windows") >= 0);
    const s = /^\w[\w\d+.-]*$/, o = /^\//, l = /^\/\//;
    function a(C, N) {
      if (!C.scheme && N)
        throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${C.authority}", path: "${C.path}", query: "${C.query}", fragment: "${C.fragment}"}`);
      if (C.scheme && !s.test(C.scheme))
        throw new Error("[UriError]: Scheme contains illegal characters.");
      if (C.path) {
        if (C.authority) {
          if (!o.test(C.path))
            throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
        } else if (l.test(C.path))
          throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
      }
    }
    const u = "", h = "/", c = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
    class m {
      static isUri(N) {
        return N instanceof m || !!N && typeof N.authority == "string" && typeof N.fragment == "string" && typeof N.path == "string" && typeof N.query == "string" && typeof N.scheme == "string" && typeof N.fsPath == "string" && typeof N.with == "function" && typeof N.toString == "function";
      }
      scheme;
      authority;
      path;
      query;
      fragment;
      constructor(N, E, k, F, I, P = !1) {
        typeof N == "object" ? (this.scheme = N.scheme || u, this.authority = N.authority || u, this.path = N.path || u, this.query = N.query || u, this.fragment = N.fragment || u) : (this.scheme = /* @__PURE__ */ (function(V, U) {
          return V || U ? V : "file";
        })(N, P), this.authority = E || u, this.path = (function(V, U) {
          switch (V) {
            case "https":
            case "http":
            case "file":
              U ? U[0] !== h && (U = h + U) : U = h;
          }
          return U;
        })(this.scheme, k || u), this.query = F || u, this.fragment = I || u, a(this, P));
      }
      get fsPath() {
        return L(this);
      }
      with(N) {
        if (!N)
          return this;
        let { scheme: E, authority: k, path: F, query: I, fragment: P } = N;
        return E === void 0 ? E = this.scheme : E === null && (E = u), k === void 0 ? k = this.authority : k === null && (k = u), F === void 0 ? F = this.path : F === null && (F = u), I === void 0 ? I = this.query : I === null && (I = u), P === void 0 ? P = this.fragment : P === null && (P = u), E === this.scheme && k === this.authority && F === this.path && I === this.query && P === this.fragment ? this : new g(E, k, F, I, P);
      }
      static parse(N, E = !1) {
        const k = c.exec(N);
        return k ? new g(k[2] || u, x(k[4] || u), x(k[5] || u), x(k[7] || u), x(k[9] || u), E) : new g(u, u, u, u, u);
      }
      static file(N) {
        let E = u;
        if (i && (N = N.replace(/\\/g, h)), N[0] === h && N[1] === h) {
          const k = N.indexOf(h, 2);
          k === -1 ? (E = N.substring(2), N = h) : (E = N.substring(2, k), N = N.substring(k) || h);
        }
        return new g("file", E, N, u, u);
      }
      static from(N) {
        const E = new g(N.scheme, N.authority, N.path, N.query, N.fragment);
        return a(E, !0), E;
      }
      toString(N = !1) {
        return v(this, N);
      }
      toJSON() {
        return this;
      }
      static revive(N) {
        if (N) {
          if (N instanceof m)
            return N;
          {
            const E = new g(N);
            return E._formatted = N.external, E._fsPath = N._sep === d ? N.fsPath : null, E;
          }
        }
        return N;
      }
    }
    const d = i ? 1 : void 0;
    class g extends m {
      _formatted = null;
      _fsPath = null;
      get fsPath() {
        return this._fsPath || (this._fsPath = L(this)), this._fsPath;
      }
      toString(N = !1) {
        return N ? v(this, !0) : (this._formatted || (this._formatted = v(this, !1)), this._formatted);
      }
      toJSON() {
        const N = { $mid: 1 };
        return this._fsPath && (N.fsPath = this._fsPath, N._sep = d), this._formatted && (N.external = this._formatted), this.path && (N.path = this.path), this.scheme && (N.scheme = this.scheme), this.authority && (N.authority = this.authority), this.query && (N.query = this.query), this.fragment && (N.fragment = this.fragment), N;
      }
    }
    const p = { 58: "%3A", 47: "%2F", 63: "%3F", 35: "%23", 91: "%5B", 93: "%5D", 64: "%40", 33: "%21", 36: "%24", 38: "%26", 39: "%27", 40: "%28", 41: "%29", 42: "%2A", 43: "%2B", 44: "%2C", 59: "%3B", 61: "%3D", 32: "%20" };
    function y(C, N, E) {
      let k, F = -1;
      for (let I = 0; I < C.length; I++) {
        const P = C.charCodeAt(I);
        if (P >= 97 && P <= 122 || P >= 65 && P <= 90 || P >= 48 && P <= 57 || P === 45 || P === 46 || P === 95 || P === 126 || N && P === 47 || E && P === 91 || E && P === 93 || E && P === 58)
          F !== -1 && (k += encodeURIComponent(C.substring(F, I)), F = -1), k !== void 0 && (k += C.charAt(I));
        else {
          k === void 0 && (k = C.substr(0, I));
          const V = p[P];
          V !== void 0 ? (F !== -1 && (k += encodeURIComponent(C.substring(F, I)), F = -1), k += V) : F === -1 && (F = I);
        }
      }
      return F !== -1 && (k += encodeURIComponent(C.substring(F))), k !== void 0 ? k : C;
    }
    function _(C) {
      let N;
      for (let E = 0; E < C.length; E++) {
        const k = C.charCodeAt(E);
        k === 35 || k === 63 ? (N === void 0 && (N = C.substr(0, E)), N += p[k]) : N !== void 0 && (N += C[E]);
      }
      return N !== void 0 ? N : C;
    }
    function L(C, N) {
      let E;
      return E = C.authority && C.path.length > 1 && C.scheme === "file" ? `//${C.authority}${C.path}` : C.path.charCodeAt(0) === 47 && (C.path.charCodeAt(1) >= 65 && C.path.charCodeAt(1) <= 90 || C.path.charCodeAt(1) >= 97 && C.path.charCodeAt(1) <= 122) && C.path.charCodeAt(2) === 58 ? C.path[1].toLowerCase() + C.path.substr(2) : C.path, i && (E = E.replace(/\//g, "\\")), E;
    }
    function v(C, N) {
      const E = N ? _ : y;
      let k = "", { scheme: F, authority: I, path: P, query: V, fragment: U } = C;
      if (F && (k += F, k += ":"), (I || F === "file") && (k += h, k += h), I) {
        let W = I.indexOf("@");
        if (W !== -1) {
          const re = I.substr(0, W);
          I = I.substr(W + 1), W = re.lastIndexOf(":"), W === -1 ? k += E(re, !1, !1) : (k += E(re.substr(0, W), !1, !1), k += ":", k += E(re.substr(W + 1), !1, !0)), k += "@";
        }
        I = I.toLowerCase(), W = I.lastIndexOf(":"), W === -1 ? k += E(I, !1, !0) : (k += E(I.substr(0, W), !1, !0), k += I.substr(W));
      }
      if (P) {
        if (P.length >= 3 && P.charCodeAt(0) === 47 && P.charCodeAt(2) === 58) {
          const W = P.charCodeAt(1);
          W >= 65 && W <= 90 && (P = `/${String.fromCharCode(W + 32)}:${P.substr(3)}`);
        } else if (P.length >= 2 && P.charCodeAt(1) === 58) {
          const W = P.charCodeAt(0);
          W >= 65 && W <= 90 && (P = `${String.fromCharCode(W + 32)}:${P.substr(2)}`);
        }
        k += E(P, !0, !1);
      }
      return V && (k += "?", k += E(V, !1, !1)), U && (k += "#", k += N ? U : y(U, !1, !1)), k;
    }
    function w(C) {
      try {
        return decodeURIComponent(C);
      } catch {
        return C.length > 3 ? C.substr(0, 3) + w(C.substr(3)) : C;
      }
    }
    const b = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
    function x(C) {
      return C.match(b) ? C.replace(b, (N) => w(N)) : C;
    }
    var A = n(470);
    const T = A.posix || A, D = "/";
    var O;
    (function(C) {
      C.joinPath = function(N, ...E) {
        return N.with({ path: T.join(N.path, ...E) });
      }, C.resolvePath = function(N, ...E) {
        let k = N.path, F = !1;
        k[0] !== D && (k = D + k, F = !0);
        let I = T.resolve(k, ...E);
        return F && I[0] === D && !N.authority && (I = I.substring(1)), N.with({ path: I });
      }, C.dirname = function(N) {
        if (N.path.length === 0 || N.path === D)
          return N;
        let E = T.dirname(N.path);
        return E.length === 1 && E.charCodeAt(0) === 46 && (E = ""), N.with({ path: E });
      }, C.basename = function(N) {
        return T.basename(N.path);
      }, C.extname = function(N) {
        return T.extname(N.path);
      };
    })(O || (O = {}));
  })(), xl = r;
})();
var { URI: nn, Utils: Bm } = xl;
function ch(t, e) {
  if (typeof t != "string")
    throw new TypeError("Expected a string");
  const n = String(t);
  let r = "";
  const i = !!e, s = !!e;
  let o = !1;
  const l = e && typeof e.flags == "string" ? e.flags : "";
  let a;
  for (let u = 0, h = n.length; u < h; u++)
    switch (a = n[u], a) {
      case "/":
      case "$":
      case "^":
      case "+":
      case ".":
      case "(":
      case ")":
      case "=":
      case "!":
      case "|":
        r += "\\" + a;
        break;
      case "?":
        if (i) {
          r += ".";
          break;
        }
      case "[":
      case "]":
        if (i) {
          r += a;
          break;
        }
      case "{":
        if (i) {
          o = !0, r += "(";
          break;
        }
      case "}":
        if (i) {
          o = !1, r += ")";
          break;
        }
      case ",":
        if (o) {
          r += "|";
          break;
        }
        r += "\\" + a;
        break;
      case "*":
        const c = n[u - 1];
        let m = 1;
        for (; n[u + 1] === "*"; )
          m++, u++;
        const d = n[u + 1];
        s ? m > 1 && (c === "/" || c === void 0 || c === "{" || c === ",") && (d === "/" || d === void 0 || d === "," || d === "}") ? (d === "/" ? u++ : c === "/" && r.endsWith("\\/") && (r = r.substr(0, r.length - 2)), r += "((?:[^/]*(?:/|$))*)") : r += "([^/]*)" : r += ".*";
        break;
      default:
        r += a;
    }
  return (!l || !~l.indexOf("g")) && (r = "^" + r + "$"), new RegExp(r, l);
}
var fh = "!", hh = "/", mh = class {
  constructor(t, e, n) {
    this.folderUri = e, this.uris = n, this.globWrappers = [];
    try {
      for (let r of t) {
        const i = r[0] !== fh;
        i || (r = r.substring(1)), r.length > 0 && (r[0] === hh && (r = r.substring(1)), this.globWrappers.push({
          regexp: ch("**/" + r, { extended: !0, globstar: !0 }),
          include: i
        }));
      }
      e && (e = _l(e), e.endsWith("/") || (e = e + "/"), this.folderUri = e);
    } catch {
      this.globWrappers.length = 0, this.uris = [];
    }
  }
  matchesPattern(t) {
    if (this.folderUri && !t.startsWith(this.folderUri))
      return !1;
    let e = !1;
    for (const { regexp: n, include: r } of this.globWrappers)
      n.test(t) && (e = r);
    return e;
  }
  getURIs() {
    return this.uris;
  }
}, dh = class {
  constructor(t, e, n) {
    this.service = t, this.uri = e, this.dependencies = /* @__PURE__ */ new Set(), this.anchors = void 0, n && (this.unresolvedSchema = this.service.promise.resolve(new hn(n)));
  }
  getUnresolvedSchema() {
    return this.unresolvedSchema || (this.unresolvedSchema = this.service.loadSchema(this.uri)), this.unresolvedSchema;
  }
  getResolvedSchema() {
    return this.resolvedSchema || (this.resolvedSchema = this.getUnresolvedSchema().then((t) => this.service.resolveSchemaContent(t, this))), this.resolvedSchema;
  }
  clearSchema() {
    const t = !!this.unresolvedSchema;
    return this.resolvedSchema = void 0, this.unresolvedSchema = void 0, this.dependencies.clear(), this.anchors = void 0, t;
  }
}, hn = class {
  constructor(t, e = []) {
    this.schema = t, this.errors = e;
  }
}, va = class {
  constructor(t, e = [], n = [], r) {
    this.schema = t, this.errors = e, this.warnings = n, this.schemaDraft = r;
  }
  getSection(t) {
    const e = this.getSectionRecursive(t, this.schema);
    if (e)
      return xe(e);
  }
  getSectionRecursive(t, e) {
    if (!e || typeof e == "boolean" || t.length === 0)
      return e;
    const n = t.shift();
    if (e.properties && typeof e.properties[n])
      return this.getSectionRecursive(t, e.properties[n]);
    if (e.patternProperties) {
      for (const r of Object.keys(e.patternProperties))
        if (or(r)?.test(n))
          return this.getSectionRecursive(t, e.patternProperties[r]);
    } else {
      if (typeof e.additionalProperties == "object")
        return this.getSectionRecursive(t, e.additionalProperties);
      if (n.match("[0-9]+")) {
        if (Array.isArray(e.items)) {
          const r = parseInt(n, 10);
          if (!isNaN(r) && e.items[r])
            return this.getSectionRecursive(t, e.items[r]);
        } else if (e.items)
          return this.getSectionRecursive(t, e.items);
      }
    }
  }
}, gh = class {
  constructor(t, e, n) {
    this.contextService = e, this.requestService = t, this.promiseConstructor = n || Promise, this.callOnDispose = [], this.contributionSchemas = {}, this.contributionAssociations = [], this.schemasById = {}, this.filePatternAssociations = [], this.registeredSchemasIds = {};
  }
  getRegisteredSchemaIds(t) {
    return Object.keys(this.registeredSchemasIds).filter((e) => {
      const n = nn.parse(e).scheme;
      return n !== "schemaservice" && (!t || t(n));
    });
  }
  get promise() {
    return this.promiseConstructor;
  }
  dispose() {
    for (; this.callOnDispose.length > 0; )
      this.callOnDispose.pop()();
  }
  onResourceChange(t) {
    this.cachedSchemaForResource = void 0;
    let e = !1;
    t = st(t);
    const n = [t], r = Object.keys(this.schemasById).map((i) => this.schemasById[i]);
    for (; n.length; ) {
      const i = n.pop();
      for (let s = 0; s < r.length; s++) {
        const o = r[s];
        o && (o.uri === i || o.dependencies.has(i)) && (o.uri !== i && n.push(o.uri), o.clearSchema() && (e = !0), r[s] = void 0);
      }
    }
    return e;
  }
  setSchemaContributions(t) {
    if (t.schemas) {
      const e = t.schemas;
      for (const n in e) {
        const r = st(n);
        this.contributionSchemas[r] = this.addSchemaHandle(r, e[n]);
      }
    }
    if (Array.isArray(t.schemaAssociations)) {
      const e = t.schemaAssociations;
      for (let n of e) {
        const r = n.uris.map(st), i = this.addFilePatternAssociation(n.pattern, n.folderUri, r);
        this.contributionAssociations.push(i);
      }
    }
  }
  addSchemaHandle(t, e) {
    const n = new dh(this, t, e);
    return this.schemasById[t] = n, n;
  }
  getOrAddSchemaHandle(t, e) {
    return this.schemasById[t] || this.addSchemaHandle(t, e);
  }
  addFilePatternAssociation(t, e, n) {
    const r = new mh(t, e, n);
    return this.filePatternAssociations.push(r), r;
  }
  registerExternalSchema(t) {
    const e = st(t.uri);
    return this.registeredSchemasIds[e] = !0, this.cachedSchemaForResource = void 0, t.fileMatch && t.fileMatch.length && this.addFilePatternAssociation(t.fileMatch, t.folderUri, [e]), t.schema ? this.addSchemaHandle(e, t.schema) : this.getOrAddSchemaHandle(e);
  }
  clearExternalSchemas() {
    this.schemasById = {}, this.filePatternAssociations = [], this.registeredSchemasIds = {}, this.cachedSchemaForResource = void 0;
    for (const t in this.contributionSchemas)
      this.schemasById[t] = this.contributionSchemas[t], this.registeredSchemasIds[t] = !0;
    for (const t of this.contributionAssociations)
      this.filePatternAssociations.push(t);
  }
  getResolvedSchema(t) {
    const e = st(t), n = this.schemasById[e];
    return n ? n.getResolvedSchema() : this.promise.resolve(void 0);
  }
  loadSchema(t) {
    if (!this.requestService) {
      const e = R("Unable to load schema from '{0}'. No schema request service available", cn(t));
      return this.promise.resolve(new hn({}, [e]));
    }
    return t.startsWith("http://json-schema.org/") && (t = "https" + t.substring(4)), this.requestService(t).then((e) => {
      if (!e) {
        const s = R("Unable to load schema from '{0}': No content.", cn(t));
        return new hn({}, [s]);
      }
      const n = [];
      e.charCodeAt(0) === 65279 && (n.push(R("Problem reading content from '{0}': UTF-8 with BOM detected, only UTF 8 is allowed.", cn(t))), e = e.trimStart());
      let r = {};
      const i = [];
      return r = If(e, i), i.length && n.push(R("Unable to parse content from '{0}': Parse error at offset {1}.", cn(t), i[0].offset)), new hn(r, n);
    }, (e) => {
      let n = e.toString();
      const r = e.toString().split("Error: ");
      return r.length > 1 && (n = r[1]), An(n, ".") && (n = n.substr(0, n.length - 1)), new hn({}, [R("Unable to load schema from '{0}': {1}.", cn(t), n)]);
    });
  }
  resolveSchemaContent(t, e) {
    const n = t.errors.slice(0), r = t.schema;
    let i = r.$schema ? st(r.$schema) : void 0;
    if (i === "http://json-schema.org/draft-03/schema")
      return this.promise.resolve(new va({}, [R("Draft-03 schemas are not supported.")], [], i));
    let s = /* @__PURE__ */ new Set();
    const o = this.contextService, l = (g, p) => {
      p = decodeURIComponent(p);
      let y = g;
      return p[0] === "/" && (p = p.substring(1)), p.split("/").some((_) => (_ = _.replace(/~1/g, "/").replace(/~0/g, "~"), y = y[_], !y)), y;
    }, a = (g, p, y) => (p.anchors || (p.anchors = d(g)), p.anchors.get(y)), u = (g, p) => {
      for (const y in p)
        p.hasOwnProperty(y) && y !== "id" && y !== "$id" && (g[y] = p[y]);
    }, h = (g, p, y, _) => {
      let L;
      _ === void 0 || _.length === 0 ? L = p : _.charAt(0) === "/" ? L = l(p, _) : L = a(p, y, _), L ? u(g, L) : n.push(R("$ref '{0}' in '{1}' can not be resolved.", _ || "", y.uri));
    }, c = (g, p, y, _) => {
      o && !/^[A-Za-z][A-Za-z0-9+\-.+]*:\/\/.*/.test(p) && (p = o.resolveRelativePath(p, _.uri)), p = st(p);
      const L = this.getOrAddSchemaHandle(p);
      return L.getUnresolvedSchema().then((v) => {
        if (_.dependencies.add(p), v.errors.length) {
          const w = y ? p + "#" + y : p;
          n.push(R("Problems loading reference '{0}': {1}", w, v.errors[0]));
        }
        return h(g, v.schema, L, y), m(g, v.schema, L);
      });
    }, m = (g, p, y) => {
      const _ = [];
      return this.traverseNodes(g, (L) => {
        const v = /* @__PURE__ */ new Set();
        for (; L.$ref; ) {
          const w = L.$ref, b = w.split("#", 2);
          if (delete L.$ref, b[0].length > 0) {
            _.push(c(L, b[0], b[1], y));
            return;
          } else if (!v.has(w)) {
            const x = b[1];
            h(L, p, y, x), v.add(w);
          }
        }
        L.$recursiveRef && s.add("$recursiveRef"), L.$dynamicRef && s.add("$dynamicRef");
      }), this.promise.all(_);
    }, d = (g) => {
      const p = /* @__PURE__ */ new Map();
      return this.traverseNodes(g, (y) => {
        const _ = y.$id || y.id, L = dl(_) && _.charAt(0) === "#" ? _.substring(1) : y.$anchor;
        L && (p.has(L) ? n.push(R("Duplicate anchor declaration: '{0}'", L)) : p.set(L, y)), y.$recursiveAnchor && s.add("$recursiveAnchor"), y.$dynamicAnchor && s.add("$dynamicAnchor");
      }), p;
    };
    return m(r, r, e).then((g) => {
      let p = [];
      return s.size && p.push(R("The schema uses meta-schema features ({0}) that are not yet supported by the validator.", Array.from(s.keys()).join(", "))), new va(r, n, p, i);
    });
  }
  traverseNodes(t, e) {
    if (!t || typeof t != "object")
      return Promise.resolve(null);
    const n = /* @__PURE__ */ new Set(), r = (...u) => {
      for (const h of u)
        at(h) && l.push(h);
    }, i = (...u) => {
      for (const h of u)
        if (at(h))
          for (const c in h) {
            const d = h[c];
            at(d) && l.push(d);
          }
    }, s = (...u) => {
      for (const h of u)
        if (Array.isArray(h))
          for (const c of h)
            at(c) && l.push(c);
    }, o = (u) => {
      if (Array.isArray(u))
        for (const h of u)
          at(h) && l.push(h);
      else at(u) && l.push(u);
    }, l = [t];
    let a = l.pop();
    for (; a; )
      n.has(a) || (n.add(a), e(a), r(a.additionalItems, a.additionalProperties, a.not, a.contains, a.propertyNames, a.if, a.then, a.else, a.unevaluatedItems, a.unevaluatedProperties), i(a.definitions, a.$defs, a.properties, a.patternProperties, a.dependencies, a.dependentSchemas), s(a.anyOf, a.allOf, a.oneOf, a.prefixItems), o(a.items)), a = l.pop();
  }
  getSchemaFromProperty(t, e) {
    if (e.root?.type === "object") {
      for (const n of e.root.properties)
        if (n.keyNode.value === "$schema" && n.valueNode?.type === "string") {
          let r = n.valueNode.value;
          return this.contextService && !/^\w[\w\d+.-]*:/.test(r) && (r = this.contextService.resolveRelativePath(r, t)), r;
        }
    }
  }
  getAssociatedSchemas(t) {
    const e = /* @__PURE__ */ Object.create(null), n = [], r = _l(t);
    for (const i of this.filePatternAssociations)
      if (i.matchesPattern(r))
        for (const s of i.getURIs())
          e[s] || (n.push(s), e[s] = !0);
    return n;
  }
  getSchemaURIsForResource(t, e) {
    let n = e && this.getSchemaFromProperty(t, e);
    return n ? [n] : this.getAssociatedSchemas(t);
  }
  getSchemaForResource(t, e) {
    if (e) {
      let i = this.getSchemaFromProperty(t, e);
      if (i) {
        const s = st(i);
        return this.getOrAddSchemaHandle(s).getResolvedSchema();
      }
    }
    if (this.cachedSchemaForResource && this.cachedSchemaForResource.resource === t)
      return this.cachedSchemaForResource.resolvedSchema;
    const n = this.getAssociatedSchemas(t), r = n.length > 0 ? this.createCombinedSchema(t, n).getResolvedSchema() : this.promise.resolve(void 0);
    return this.cachedSchemaForResource = { resource: t, resolvedSchema: r }, r;
  }
  createCombinedSchema(t, e) {
    if (e.length === 1)
      return this.getOrAddSchemaHandle(e[0]);
    {
      const n = "schemaservice://combinedSchema/" + encodeURIComponent(t), r = {
        allOf: e.map((i) => ({ $ref: i }))
      };
      return this.addSchemaHandle(n, r);
    }
  }
  getMatchingSchemas(t, e, n) {
    if (n) {
      const r = n.id || "schemaservice://untitled/matchingSchemas/" + ph++;
      return this.addSchemaHandle(r, n).getResolvedSchema().then((s) => e.getMatchingSchemas(s.schema).filter((o) => !o.inverted));
    }
    return this.getSchemaForResource(t.uri, e).then((r) => r ? e.getMatchingSchemas(r.schema).filter((i) => !i.inverted) : []);
  }
}, ph = 0;
function st(t) {
  try {
    return nn.parse(t).toString(!0);
  } catch {
    return t;
  }
}
function _l(t) {
  try {
    return nn.parse(t).with({ fragment: null, query: null }).toString(!0);
  } catch {
    return t;
  }
}
function cn(t) {
  try {
    const e = nn.parse(t);
    if (e.scheme === "file")
      return e.fsPath;
  } catch {
  }
  return t;
}
function bh(t, e) {
  const n = [], r = [], i = [];
  let s = -1;
  const o = vt(t.getText(), !1);
  let l = o.scan();
  function a(g) {
    n.push(g), r.push(i.length);
  }
  for (; l !== 17; ) {
    switch (l) {
      case 1:
      case 3: {
        const g = t.positionAt(o.getTokenOffset()).line, p = { startLine: g, endLine: g, kind: l === 1 ? "object" : "array" };
        i.push(p);
        break;
      }
      case 2:
      case 4: {
        const g = l === 2 ? "object" : "array";
        if (i.length > 0 && i[i.length - 1].kind === g) {
          const p = i.pop(), y = t.positionAt(o.getTokenOffset()).line;
          p && y > p.startLine + 1 && s !== p.startLine && (p.endLine = y - 1, a(p), s = p.startLine);
        }
        break;
      }
      case 13: {
        const g = t.positionAt(o.getTokenOffset()).line, p = t.positionAt(o.getTokenOffset() + o.getTokenLength()).line;
        o.getTokenError() === 1 && g + 1 < t.lineCount ? o.setPosition(t.offsetAt(ee.create(g + 1, 0))) : g < p && (a({ startLine: g, endLine: p, kind: pn.Comment }), s = g);
        break;
      }
      case 12: {
        const p = t.getText().substr(o.getTokenOffset(), o.getTokenLength()).match(/^\/\/\s*#(region\b)|(endregion\b)/);
        if (p) {
          const y = t.positionAt(o.getTokenOffset()).line;
          if (p[1]) {
            const _ = { startLine: y, endLine: y, kind: pn.Region };
            i.push(_);
          } else {
            let _ = i.length - 1;
            for (; _ >= 0 && i[_].kind !== pn.Region; )
              _--;
            if (_ >= 0) {
              const L = i[_];
              i.length = _, y > L.startLine && s !== L.startLine && (L.endLine = y, a(L), s = L.startLine);
            }
          }
        }
        break;
      }
    }
    l = o.scan();
  }
  const u = e && e.rangeLimit;
  if (typeof u != "number" || n.length <= u)
    return n;
  e && e.onRangeLimitExceeded && e.onRangeLimitExceeded(t.uri);
  const h = [];
  for (let g of r)
    g < 30 && (h[g] = (h[g] || 0) + 1);
  let c = 0, m = 0;
  for (let g = 0; g < h.length; g++) {
    const p = h[g];
    if (p) {
      if (p + c > u) {
        m = g;
        break;
      }
      c += p;
    }
  }
  const d = [];
  for (let g = 0; g < n.length; g++) {
    const p = r[g];
    typeof p == "number" && (p < m || p === m && c++ < u) && d.push(n[g]);
  }
  return d;
}
function yh(t, e, n) {
  function r(l) {
    let a = t.offsetAt(l), u = n.getNodeFromOffset(a, !0);
    const h = [];
    for (; u; ) {
      switch (u.type) {
        case "string":
        case "object":
        case "array":
          const m = u.offset + 1, d = u.offset + u.length - 1;
          m < d && a >= m && a <= d && h.push(i(m, d)), h.push(i(u.offset, u.offset + u.length));
          break;
        case "number":
        case "boolean":
        case "null":
        case "property":
          h.push(i(u.offset, u.offset + u.length));
          break;
      }
      if (u.type === "property" || u.parent && u.parent.type === "array") {
        const m = o(
          u.offset + u.length,
          5
          /* SyntaxKind.CommaToken */
        );
        m !== -1 && h.push(i(u.offset, m));
      }
      u = u.parent;
    }
    let c;
    for (let m = h.length - 1; m >= 0; m--)
      c = cr.create(h[m], c);
    return c || (c = cr.create(j.create(l, l))), c;
  }
  function i(l, a) {
    return j.create(t.positionAt(l), t.positionAt(a));
  }
  const s = vt(t.getText(), !0);
  function o(l, a) {
    return s.setPosition(l), s.scan() === a ? s.getTokenOffset() + s.getTokenLength() : -1;
  }
  return e.map(r);
}
function Ui(t, e, n) {
  let r;
  if (n) {
    const s = t.offsetAt(n.start), o = t.offsetAt(n.end) - s;
    r = { offset: s, length: o };
  }
  const i = {
    tabSize: e ? e.tabSize : 4,
    insertSpaces: e?.insertSpaces === !0,
    insertFinalNewline: e?.insertFinalNewline === !0,
    eol: `
`,
    keepLines: e?.keepLines === !0
  };
  return Bf(t.getText(), r, i).map((s) => Ge.replace(j.create(t.positionAt(s.offset), t.positionAt(s.offset + s.length)), s.content));
}
var ae;
(function(t) {
  t[t.Object = 0] = "Object", t[t.Array = 1] = "Array";
})(ae || (ae = {}));
var Fn = class {
  constructor(t, e) {
    this.propertyName = t ?? "", this.beginningLineNumber = e, this.childrenProperties = [], this.lastProperty = !1, this.noKeyName = !1;
  }
  addChildProperty(t) {
    if (t.parent = this, this.childrenProperties.length > 0) {
      let e = 0;
      t.noKeyName ? e = this.childrenProperties.length : e = wh(this.childrenProperties, t, vh), e < 0 && (e = e * -1 - 1), this.childrenProperties.splice(e, 0, t);
    } else
      this.childrenProperties.push(t);
    return t;
  }
};
function vh(t, e) {
  const n = t.propertyName.toLowerCase(), r = e.propertyName.toLowerCase();
  return n < r ? -1 : n > r ? 1 : 0;
}
function wh(t, e, n) {
  const r = e.propertyName.toLowerCase(), i = t[0].propertyName.toLowerCase(), s = t[t.length - 1].propertyName.toLowerCase();
  if (r < i)
    return 0;
  if (r > s)
    return t.length;
  let o = 0, l = t.length - 1;
  for (; o <= l; ) {
    let a = l + o >> 1, u = n(e, t[a]);
    if (u > 0)
      o = a + 1;
    else if (u < 0)
      l = a - 1;
    else
      return a;
  }
  return -o - 1;
}
function xh(t, e) {
  const n = {
    ...e,
    keepLines: !1
    // keepLines must be false so that the properties are on separate lines for the sorting
  }, r = De.applyEdits(t, Ui(t, n, void 0)), i = De.create("test://test.json", "json", 0, r), s = _h(i), o = Lh(i, s), l = Ui(o, n, void 0), a = De.applyEdits(o, l);
  return [Ge.replace(j.create(ee.create(0, 0), t.positionAt(t.getText().length)), a)];
}
function _h(t) {
  const e = t.getText(), n = vt(e, !1);
  let r = new Fn(), i = r, s = r, o = r, l, a = 0, u = 0, h, c, m = -1, d = -1, g = 0, p = 0, y = [], _ = !1, L = !1;
  for (; (l = n.scan()) !== 17; ) {
    if (_ === !0 && l !== 14 && l !== 15 && l !== 12 && l !== 13 && s.endLineNumber === void 0) {
      let v = n.getTokenStartLine();
      c === 2 || c === 4 ? o.endLineNumber = v - 1 : s.endLineNumber = v - 1, g = v, _ = !1;
    }
    if (L === !0 && l !== 14 && l !== 15 && l !== 12 && l !== 13 && (g = n.getTokenStartLine(), L = !1), n.getTokenStartLine() !== a) {
      for (let v = a; v < n.getTokenStartLine(); v++) {
        const w = t.getText(j.create(ee.create(v, 0), ee.create(v + 1, 0))).length;
        u = u + w;
      }
      a = n.getTokenStartLine();
    }
    switch (l) {
      case 10: {
        if (h === void 0 || h === 1 || h === 5 && y[y.length - 1] === ae.Object) {
          const v = new Fn(n.getTokenValue(), g);
          o = s, s = i.addChildProperty(v);
        }
        break;
      }
      case 3: {
        if (r.beginningLineNumber === void 0 && (r.beginningLineNumber = n.getTokenStartLine()), y[y.length - 1] === ae.Object)
          i = s;
        else if (y[y.length - 1] === ae.Array) {
          const v = new Fn(n.getTokenValue(), g);
          v.noKeyName = !0, o = s, s = i.addChildProperty(v), i = s;
        }
        y.push(ae.Array), s.type = ae.Array, g = n.getTokenStartLine(), g++;
        break;
      }
      case 1: {
        if (r.beginningLineNumber === void 0)
          r.beginningLineNumber = n.getTokenStartLine();
        else if (y[y.length - 1] === ae.Array) {
          const v = new Fn(n.getTokenValue(), g);
          v.noKeyName = !0, o = s, s = i.addChildProperty(v);
        }
        s.type = ae.Object, y.push(ae.Object), i = s, g = n.getTokenStartLine(), g++;
        break;
      }
      case 4: {
        p = n.getTokenStartLine(), y.pop(), s.endLineNumber === void 0 && (h === 2 || h === 4) && (s.endLineNumber = p - 1, s.lastProperty = !0, s.lineWhereToAddComma = m, s.indexWhereToAddComa = d, o = s, s = s ? s.parent : void 0, i = s), r.endLineNumber = p, g = p + 1;
        break;
      }
      case 2: {
        p = n.getTokenStartLine(), y.pop(), h !== 1 && (s.endLineNumber === void 0 && (s.endLineNumber = p - 1, s.lastProperty = !0, s.lineWhereToAddComma = m, s.indexWhereToAddComa = d), o = s, s = s ? s.parent : void 0, i = s), r.endLineNumber = n.getTokenStartLine(), g = p + 1;
        break;
      }
      case 5: {
        p = n.getTokenStartLine(), s.endLineNumber === void 0 && (y[y.length - 1] === ae.Object || y[y.length - 1] === ae.Array && (h === 2 || h === 4)) && (s.endLineNumber = p, s.commaIndex = n.getTokenOffset() - u, s.commaLine = p), (h === 2 || h === 4) && (o = s, s = s ? s.parent : void 0, i = s), g = p + 1;
        break;
      }
      case 13: {
        h === 5 && m === n.getTokenStartLine() && (y[y.length - 1] === ae.Array && (c === 2 || c === 4) || y[y.length - 1] === ae.Object) && (y[y.length - 1] === ae.Array && (c === 2 || c === 4) || y[y.length - 1] === ae.Object) && (s.endLineNumber = void 0, _ = !0), (h === 1 || h === 3) && m === n.getTokenStartLine() && (L = !0);
        break;
      }
    }
    l !== 14 && l !== 13 && l !== 12 && l !== 15 && (c = h, h = l, m = n.getTokenStartLine(), d = n.getTokenOffset() + n.getTokenLength() - u);
  }
  return r;
}
function Lh(t, e) {
  if (e.childrenProperties.length === 0)
    return t;
  const n = De.create("test://test.json", "json", 0, t.getText()), r = [];
  for (wa(r, e, e.beginningLineNumber); r.length > 0; ) {
    const i = r.shift(), s = i.propertyTreeArray;
    let o = i.beginningLineNumber;
    for (let l = 0; l < s.length; l++) {
      const a = s[l], u = j.create(ee.create(a.beginningLineNumber, 0), ee.create(a.endLineNumber + 1, 0)), h = t.getText(u), c = De.create("test://test.json", "json", 0, h);
      if (a.lastProperty === !0 && l !== s.length - 1) {
        const g = a.lineWhereToAddComma - a.beginningLineNumber, p = a.indexWhereToAddComa, y = {
          range: j.create(ee.create(g, p), ee.create(g, p)),
          text: ","
        };
        De.update(c, [y], 1);
      } else if (a.lastProperty === !1 && l === s.length - 1) {
        const g = a.commaIndex, y = a.commaLine - a.beginningLineNumber, _ = {
          range: j.create(ee.create(y, g), ee.create(y, g + 1)),
          text: ""
        };
        De.update(c, [_], 1);
      }
      const m = a.endLineNumber - a.beginningLineNumber + 1, d = {
        range: j.create(ee.create(o, 0), ee.create(o + m, 0)),
        text: c.getText()
      };
      De.update(n, [d], 1), wa(r, a, o), o = o + m;
    }
  }
  return n;
}
function wa(t, e, n) {
  if (e.childrenProperties.length !== 0)
    if (e.type === ae.Object) {
      let r = 1 / 0;
      for (const s of e.childrenProperties)
        s.beginningLineNumber < r && (r = s.beginningLineNumber);
      const i = r - e.beginningLineNumber;
      n = n + i, t.push(new Nl(n, e.childrenProperties));
    } else e.type === ae.Array && Ll(t, e, n);
}
function Ll(t, e, n) {
  for (const r of e.childrenProperties) {
    if (r.type === ae.Object) {
      let i = 1 / 0;
      for (const o of r.childrenProperties)
        o.beginningLineNumber < i && (i = o.beginningLineNumber);
      const s = i - r.beginningLineNumber;
      t.push(new Nl(n + r.beginningLineNumber - e.beginningLineNumber + s, r.childrenProperties));
    }
    r.type === ae.Array && Ll(t, r, n + r.beginningLineNumber - e.beginningLineNumber);
  }
}
var Nl = class {
  constructor(t, e) {
    this.beginningLineNumber = t, this.propertyTreeArray = e;
  }
};
function Nh(t, e) {
  const n = [];
  return e.visit((r) => {
    if (r.type === "property" && r.keyNode.value === "$ref" && r.valueNode?.type === "string") {
      const i = r.valueNode.value, s = Sh(e, i);
      if (s) {
        const o = t.positionAt(s.offset);
        n.push({
          target: `${t.uri}#${o.line + 1},${o.character + 1}`,
          range: Ah(t, r.valueNode)
        });
      }
    }
    return !0;
  }), Promise.resolve(n);
}
function Ah(t, e) {
  return j.create(t.positionAt(e.offset + 1), t.positionAt(e.offset + e.length - 1));
}
function Sh(t, e) {
  const n = Eh(e);
  return n ? $i(n, t.root) : null;
}
function $i(t, e) {
  if (!e)
    return null;
  if (t.length === 0)
    return e;
  const n = t.shift();
  if (e && e.type === "object") {
    const r = e.properties.find((i) => i.keyNode.value === n);
    return r ? $i(t, r.valueNode) : null;
  } else if (e && e.type === "array" && n.match(/^(0|[1-9][0-9]*)$/)) {
    const r = Number.parseInt(n), i = e.items[r];
    return i ? $i(t, i) : null;
  }
  return null;
}
function Eh(t) {
  return t === "#" ? [] : t[0] !== "#" || t[1] !== "/" ? null : t.substring(2).split(/\//).map(kh);
}
function kh(t) {
  return t.replace(/~1/g, "/").replace(/~0/g, "~");
}
function Rh(t) {
  const e = t.promiseConstructor || Promise, n = new gh(t.schemaRequestService, t.workspaceContext, e);
  n.setSchemaContributions(Oi);
  const r = new Kf(n, t.contributions, e, t.clientCapabilities), i = new eh(n, t.contributions, e), s = new lh(n), o = new nh(n, e);
  return {
    configure: (l) => {
      n.clearExternalSchemas(), l.schemas?.forEach(n.registerExternalSchema.bind(n)), o.configure(l);
    },
    resetSchema: (l) => n.onResourceChange(l),
    doValidation: o.doValidation.bind(o),
    getLanguageStatus: o.getLanguageStatus.bind(o),
    parseJSONDocument: (l) => Zf(l, { collectComments: !0 }),
    newJSONDocument: (l, a) => Yf(l, a),
    getMatchingSchemas: n.getMatchingSchemas.bind(n),
    doResolve: r.doResolve.bind(r),
    doComplete: r.doComplete.bind(r),
    findDocumentSymbols: s.findDocumentSymbols.bind(s),
    findDocumentSymbols2: s.findDocumentSymbols2.bind(s),
    findDocumentColors: s.findDocumentColors.bind(s),
    getColorPresentations: s.getColorPresentations.bind(s),
    doHover: i.doHover.bind(i),
    getFoldingRanges: bh,
    getSelectionRanges: yh,
    findDefinition: () => Promise.resolve([]),
    findLinks: Nh,
    format: (l, a, u) => Ui(l, u, a),
    sort: (l, a) => xh(l, a)
  };
}
var Al;
typeof fetch < "u" && (Al = function(t) {
  return fetch(t).then((e) => e.text());
});
var Mh = class {
  constructor(t, e) {
    this._ctx = t, this._languageSettings = e.languageSettings, this._languageId = e.languageId, this._languageService = Rh({
      workspaceContext: {
        resolveRelativePath: (n, r) => {
          const i = r.substr(0, r.lastIndexOf("/") + 1);
          return Ih(i, n);
        }
      },
      schemaRequestService: e.enableSchemaRequest ? Al : void 0,
      clientCapabilities: Di.LATEST
    }), this._languageService.configure(this._languageSettings);
  }
  async doValidation(t) {
    let e = this._getTextDocument(t);
    if (e) {
      let n = this._languageService.parseJSONDocument(e);
      return this._languageService.doValidation(e, n, this._languageSettings);
    }
    return Promise.resolve([]);
  }
  async doComplete(t, e) {
    let n = this._getTextDocument(t);
    if (!n)
      return null;
    let r = this._languageService.parseJSONDocument(n);
    return this._languageService.doComplete(n, e, r);
  }
  async doResolve(t) {
    return this._languageService.doResolve(t);
  }
  async doHover(t, e) {
    let n = this._getTextDocument(t);
    if (!n)
      return null;
    let r = this._languageService.parseJSONDocument(n);
    return this._languageService.doHover(n, e, r);
  }
  async format(t, e, n) {
    let r = this._getTextDocument(t);
    if (!r)
      return [];
    let i = this._languageService.format(r, e, n);
    return Promise.resolve(i);
  }
  async resetSchema(t) {
    return Promise.resolve(this._languageService.resetSchema(t));
  }
  async findDocumentSymbols(t) {
    let e = this._getTextDocument(t);
    if (!e)
      return [];
    let n = this._languageService.parseJSONDocument(e), r = this._languageService.findDocumentSymbols2(e, n);
    return Promise.resolve(r);
  }
  async findDocumentColors(t) {
    let e = this._getTextDocument(t);
    if (!e)
      return [];
    let n = this._languageService.parseJSONDocument(e), r = this._languageService.findDocumentColors(e, n);
    return Promise.resolve(r);
  }
  async getColorPresentations(t, e, n) {
    let r = this._getTextDocument(t);
    if (!r)
      return [];
    let i = this._languageService.parseJSONDocument(r), s = this._languageService.getColorPresentations(
      r,
      i,
      e,
      n
    );
    return Promise.resolve(s);
  }
  async getFoldingRanges(t, e) {
    let n = this._getTextDocument(t);
    if (!n)
      return [];
    let r = this._languageService.getFoldingRanges(n, e);
    return Promise.resolve(r);
  }
  async getSelectionRanges(t, e) {
    let n = this._getTextDocument(t);
    if (!n)
      return [];
    let r = this._languageService.parseJSONDocument(n), i = this._languageService.getSelectionRanges(n, e, r);
    return Promise.resolve(i);
  }
  async parseJSONDocument(t) {
    let e = this._getTextDocument(t);
    if (!e)
      return null;
    let n = this._languageService.parseJSONDocument(e);
    return Promise.resolve(n);
  }
  async getMatchingSchemas(t) {
    let e = this._getTextDocument(t);
    if (!e)
      return [];
    let n = this._languageService.parseJSONDocument(e);
    return Promise.resolve(this._languageService.getMatchingSchemas(e, n));
  }
  _getTextDocument(t) {
    let e = this._ctx.getMirrorModels();
    for (let n of e)
      if (n.uri.toString() === t)
        return De.create(
          t,
          this._languageId,
          n.version,
          n.getValue()
        );
    return null;
  }
}, Th = 47, Ur = 46;
function Ch(t) {
  return t.charCodeAt(0) === Th;
}
function Ih(t, e) {
  if (Ch(e)) {
    const n = nn.parse(t), r = e.split("/");
    return n.with({ path: Sl(r) }).toString();
  }
  return Ph(t, e);
}
function Sl(t) {
  const e = [];
  for (const r of t)
    r.length === 0 || r.length === 1 && r.charCodeAt(0) === Ur || (r.length === 2 && r.charCodeAt(0) === Ur && r.charCodeAt(1) === Ur ? e.pop() : e.push(r));
  t.length > 1 && t[t.length - 1].length === 0 && e.push("");
  let n = e.join("/");
  return t[0].length === 0 && (n = "/" + n), n;
}
function Ph(t, ...e) {
  const n = nn.parse(t), r = n.path.split("/");
  for (let i of e)
    r.push(...i.split("/"));
  return n.with({ path: Sl(r) }).toString();
}
self.onmessage = () => {
  fl((t, e) => new Mh(t, e));
};
