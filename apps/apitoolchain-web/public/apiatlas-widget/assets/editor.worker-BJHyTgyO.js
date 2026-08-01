class Rs {
  constructor() {
    this.listeners = [], this.unexpectedErrorHandler = function(e) {
      setTimeout(() => {
        throw e.stack ? dt.isErrorNoTelemetry(e) ? new dt(e.message + `

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
const Cs = new Rs();
function Et(t) {
  Ms(t) || Cs.onUnexpectedError(t);
}
function Cr(t) {
  if (t instanceof Error) {
    const { name: e, message: n } = t, r = t.stacktrace || t.stack;
    return {
      $isError: !0,
      name: e,
      message: n,
      stack: r,
      noTelemetry: dt.isErrorNoTelemetry(t)
    };
  }
  return t;
}
const Bn = "Canceled";
function Ms(t) {
  return t instanceof ks ? !0 : t instanceof Error && t.name === Bn && t.message === Bn;
}
class ks extends Error {
  constructor() {
    super(Bn), this.name = this.message;
  }
}
class dt extends Error {
  constructor(e) {
    super(e), this.name = "CodeExpectedError";
  }
  static fromError(e) {
    if (e instanceof dt)
      return e;
    const n = new dt();
    return n.message = e.message, n.stack = e.stack, n;
  }
  static isErrorNoTelemetry(e) {
    return e.name === "CodeExpectedError";
  }
}
class ce extends Error {
  constructor(e) {
    super(e || "An unexpected bug occurred."), Object.setPrototypeOf(this, ce.prototype);
  }
}
function Is(t, e) {
  const n = this;
  let r = !1, i;
  return function() {
    return r || (r = !0, i = t.apply(n, arguments)), i;
  };
}
var Qt;
(function(t) {
  function e(_) {
    return _ && typeof _ == "object" && typeof _[Symbol.iterator] == "function";
  }
  t.is = e;
  const n = Object.freeze([]);
  function r() {
    return n;
  }
  t.empty = r;
  function* i(_) {
    yield _;
  }
  t.single = i;
  function s(_) {
    return e(_) ? _ : i(_);
  }
  t.wrap = s;
  function o(_) {
    return _ || n;
  }
  t.from = o;
  function* l(_) {
    for (let y = _.length - 1; y >= 0; y--)
      yield _[y];
  }
  t.reverse = l;
  function u(_) {
    return !_ || _[Symbol.iterator]().next().done === !0;
  }
  t.isEmpty = u;
  function c(_) {
    return _[Symbol.iterator]().next().value;
  }
  t.first = c;
  function f(_, y) {
    let w = 0;
    for (const A of _)
      if (y(A, w++))
        return !0;
    return !1;
  }
  t.some = f;
  function h(_, y) {
    for (const w of _)
      if (y(w))
        return w;
  }
  t.find = h;
  function* m(_, y) {
    for (const w of _)
      y(w) && (yield w);
  }
  t.filter = m;
  function* d(_, y) {
    let w = 0;
    for (const A of _)
      yield y(A, w++);
  }
  t.map = d;
  function* g(_, y) {
    let w = 0;
    for (const A of _)
      yield* y(A, w++);
  }
  t.flatMap = g;
  function* b(..._) {
    for (const y of _)
      yield* y;
  }
  t.concat = b;
  function x(_, y, w) {
    let A = w;
    for (const C of _)
      A = y(A, C);
    return A;
  }
  t.reduce = x;
  function* v(_, y, w = _.length) {
    for (y < 0 && (y += _.length), w < 0 ? w += _.length : w > _.length && (w = _.length); y < w; y++)
      yield _[y];
  }
  t.slice = v;
  function E(_, y = Number.POSITIVE_INFINITY) {
    const w = [];
    if (y === 0)
      return [w, _];
    const A = _[Symbol.iterator]();
    for (let C = 0; C < y; C++) {
      const V = A.next();
      if (V.done)
        return [w, t.empty()];
      w.push(V.value);
    }
    return [w, { [Symbol.iterator]() {
      return A;
    } }];
  }
  t.consume = E;
  async function N(_) {
    const y = [];
    for await (const w of _)
      y.push(w);
    return Promise.resolve(y);
  }
  t.asyncToArray = N;
})(Qt || (Qt = {}));
function B1(t) {
  if (Qt.is(t)) {
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
function Ts(...t) {
  return Yt(() => B1(t));
}
function Yt(t) {
  return {
    dispose: Is(() => {
      t();
    })
  };
}
const un = class un {
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
        B1(this._toDispose);
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
    return this._isDisposed ? un.DISABLE_DISPOSED_WARNING || console.warn(new Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!").stack) : this._toDispose.add(e), e;
  }
  /**
   * Deletes the value from the store, but does not dispose it.
   */
  deleteAndLeak(e) {
    e && this._toDispose.has(e) && this._toDispose.delete(e);
  }
};
un.DISABLE_DISPOSED_WARNING = !1;
let kt = un;
const Rr = class Rr {
  constructor() {
    this._store = new kt(), this._store;
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
Rr.None = Object.freeze({ dispose() {
} });
let gt = Rr;
const ot = class ot {
  constructor(e) {
    this.element = e, this.next = ot.Undefined, this.prev = ot.Undefined;
  }
};
ot.Undefined = new ot(void 0);
let G = ot;
class Ps {
  constructor() {
    this._first = G.Undefined, this._last = G.Undefined, this._size = 0;
  }
  get size() {
    return this._size;
  }
  isEmpty() {
    return this._first === G.Undefined;
  }
  clear() {
    let e = this._first;
    for (; e !== G.Undefined; ) {
      const n = e.next;
      e.prev = G.Undefined, e.next = G.Undefined, e = n;
    }
    this._first = G.Undefined, this._last = G.Undefined, this._size = 0;
  }
  unshift(e) {
    return this._insert(e, !1);
  }
  push(e) {
    return this._insert(e, !0);
  }
  _insert(e, n) {
    const r = new G(e);
    if (this._first === G.Undefined)
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
    if (this._first !== G.Undefined) {
      const e = this._first.element;
      return this._remove(this._first), e;
    }
  }
  pop() {
    if (this._last !== G.Undefined) {
      const e = this._last.element;
      return this._remove(this._last), e;
    }
  }
  _remove(e) {
    if (e.prev !== G.Undefined && e.next !== G.Undefined) {
      const n = e.prev;
      n.next = e.next, e.next.prev = n;
    } else e.prev === G.Undefined && e.next === G.Undefined ? (this._first = G.Undefined, this._last = G.Undefined) : e.next === G.Undefined ? (this._last = this._last.prev, this._last.next = G.Undefined) : e.prev === G.Undefined && (this._first = this._first.next, this._first.prev = G.Undefined);
    this._size -= 1;
  }
  *[Symbol.iterator]() {
    let e = this._first;
    for (; e !== G.Undefined; )
      yield e.element, e = e.next;
  }
}
const Bs = globalThis.performance && typeof globalThis.performance.now == "function";
class pn {
  static create(e) {
    return new pn(e);
  }
  constructor(e) {
    this._now = Bs && e === !1 ? Date.now : globalThis.performance.now.bind(globalThis.performance), this._startTime = this._now(), this._stopTime = -1;
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
var Xt;
(function(t) {
  t.None = () => gt.None;
  function e(S, L) {
    return m(S, () => {
    }, 0, void 0, !0, void 0, L);
  }
  t.defer = e;
  function n(S) {
    return (L, M = null, R) => {
      let T = !1, D;
      return D = S((W) => {
        if (!T)
          return D ? D.dispose() : T = !0, L.call(M, W);
      }, null, R), T && D.dispose(), D;
    };
  }
  t.once = n;
  function r(S, L) {
    return t.once(t.filter(S, L));
  }
  t.onceIf = r;
  function i(S, L, M) {
    return f((R, T = null, D) => S((W) => R.call(T, L(W)), null, D), M);
  }
  t.map = i;
  function s(S, L, M) {
    return f((R, T = null, D) => S((W) => {
      L(W), R.call(T, W);
    }, null, D), M);
  }
  t.forEach = s;
  function o(S, L, M) {
    return f((R, T = null, D) => S((W) => L(W) && R.call(T, W), null, D), M);
  }
  t.filter = o;
  function l(S) {
    return S;
  }
  t.signal = l;
  function u(...S) {
    return (L, M = null, R) => {
      const T = Ts(...S.map((D) => D((W) => L.call(M, W))));
      return h(T, R);
    };
  }
  t.any = u;
  function c(S, L, M, R) {
    let T = M;
    return i(S, (D) => (T = L(T, D), T), R);
  }
  t.reduce = c;
  function f(S, L) {
    let M;
    const R = {
      onWillAddFirstListener() {
        M = S(T.fire, T);
      },
      onDidRemoveLastListener() {
        M?.dispose();
      }
    }, T = new me(R);
    return L?.add(T), T.event;
  }
  function h(S, L) {
    return L instanceof Array ? L.push(S) : L && L.add(S), S;
  }
  function m(S, L, M = 100, R = !1, T = !1, D, W) {
    let Z, te, Ge, Dt = 0, _t;
    const Es = {
      leakWarningThreshold: D,
      onWillAddFirstListener() {
        Z = S((Ss) => {
          Dt++, te = L(te, Ss), R && !Ge && (Ut.fire(te), te = void 0), _t = () => {
            const As = te;
            te = void 0, Ge = void 0, (!R || Dt > 1) && Ut.fire(As), Dt = 0;
          }, typeof M == "number" ? (clearTimeout(Ge), Ge = setTimeout(_t, M)) : Ge === void 0 && (Ge = 0, queueMicrotask(_t));
        });
      },
      onWillRemoveListener() {
        T && Dt > 0 && _t?.();
      },
      onDidRemoveLastListener() {
        _t = void 0, Z.dispose();
      }
    }, Ut = new me(Es);
    return W?.add(Ut), Ut.event;
  }
  t.debounce = m;
  function d(S, L = 0, M) {
    return t.debounce(S, (R, T) => R ? (R.push(T), R) : [T], L, void 0, !0, void 0, M);
  }
  t.accumulate = d;
  function g(S, L = (R, T) => R === T, M) {
    let R = !0, T;
    return o(S, (D) => {
      const W = R || !L(D, T);
      return R = !1, T = D, W;
    }, M);
  }
  t.latch = g;
  function b(S, L, M) {
    return [
      t.filter(S, L, M),
      t.filter(S, (R) => !L(R), M)
    ];
  }
  t.split = b;
  function x(S, L = !1, M = [], R) {
    let T = M.slice(), D = S((te) => {
      T ? T.push(te) : Z.fire(te);
    });
    R && R.add(D);
    const W = () => {
      T?.forEach((te) => Z.fire(te)), T = null;
    }, Z = new me({
      onWillAddFirstListener() {
        D || (D = S((te) => Z.fire(te)), R && R.add(D));
      },
      onDidAddFirstListener() {
        T && (L ? setTimeout(W) : W());
      },
      onDidRemoveLastListener() {
        D && D.dispose(), D = null;
      }
    });
    return R && R.add(Z), Z.event;
  }
  t.buffer = x;
  function v(S, L) {
    return (R, T, D) => {
      const W = L(new N());
      return S(function(Z) {
        const te = W.evaluate(Z);
        te !== E && R.call(T, te);
      }, void 0, D);
    };
  }
  t.chain = v;
  const E = /* @__PURE__ */ Symbol("HaltChainable");
  class N {
    constructor() {
      this.steps = [];
    }
    map(L) {
      return this.steps.push(L), this;
    }
    forEach(L) {
      return this.steps.push((M) => (L(M), M)), this;
    }
    filter(L) {
      return this.steps.push((M) => L(M) ? M : E), this;
    }
    reduce(L, M) {
      let R = M;
      return this.steps.push((T) => (R = L(R, T), R)), this;
    }
    latch(L = (M, R) => M === R) {
      let M = !0, R;
      return this.steps.push((T) => {
        const D = M || !L(T, R);
        return M = !1, R = T, D ? T : E;
      }), this;
    }
    evaluate(L) {
      for (const M of this.steps)
        if (L = M(L), L === E)
          break;
      return L;
    }
  }
  function _(S, L, M = (R) => R) {
    const R = (...Z) => W.fire(M(...Z)), T = () => S.on(L, R), D = () => S.removeListener(L, R), W = new me({ onWillAddFirstListener: T, onDidRemoveLastListener: D });
    return W.event;
  }
  t.fromNodeEventEmitter = _;
  function y(S, L, M = (R) => R) {
    const R = (...Z) => W.fire(M(...Z)), T = () => S.addEventListener(L, R), D = () => S.removeEventListener(L, R), W = new me({ onWillAddFirstListener: T, onDidRemoveLastListener: D });
    return W.event;
  }
  t.fromDOMEventEmitter = y;
  function w(S) {
    return new Promise((L) => n(S)(L));
  }
  t.toPromise = w;
  function A(S) {
    const L = new me();
    return S.then((M) => {
      L.fire(M);
    }, () => {
      L.fire(void 0);
    }).finally(() => {
      L.dispose();
    }), L.event;
  }
  t.fromPromise = A;
  function C(S, L) {
    return S((M) => L.fire(M));
  }
  t.forward = C;
  function V(S, L, M) {
    return L(M), S((R) => L(R));
  }
  t.runAndSubscribe = V;
  class J {
    constructor(L, M) {
      this._observable = L, this._counter = 0, this._hasChanged = !1;
      const R = {
        onWillAddFirstListener: () => {
          L.addObserver(this), this._observable.reportChanges();
        },
        onDidRemoveLastListener: () => {
          L.removeObserver(this);
        }
      };
      this.emitter = new me(R), M && M.add(this.emitter);
    }
    beginUpdate(L) {
      this._counter++;
    }
    handlePossibleChange(L) {
    }
    handleChange(L, M) {
      this._hasChanged = !0;
    }
    endUpdate(L) {
      this._counter--, this._counter === 0 && (this._observable.reportChanges(), this._hasChanged && (this._hasChanged = !1, this.emitter.fire(this._observable.get())));
    }
  }
  function $(S, L) {
    return new J(S, L).emitter.event;
  }
  t.fromObservable = $;
  function P(S) {
    return (L, M, R) => {
      let T = 0, D = !1;
      const W = {
        beginUpdate() {
          T++;
        },
        endUpdate() {
          T--, T === 0 && (S.reportChanges(), D && (D = !1, L.call(M)));
        },
        handlePossibleChange() {
        },
        handleChange() {
          D = !0;
        }
      };
      S.addObserver(W), S.reportChanges();
      const Z = {
        dispose() {
          S.removeObserver(W);
        }
      };
      return R instanceof kt ? R.add(Z) : Array.isArray(R) && R.push(Z), Z;
    };
  }
  t.fromObservableLight = P;
})(Xt || (Xt = {}));
const at = class at {
  constructor(e) {
    this.listenerCount = 0, this.invocationCount = 0, this.elapsedOverall = 0, this.durations = [], this.name = `${e}_${at._idPool++}`, at.all.add(this);
  }
  start(e) {
    this._stopWatch = new pn(), this.listenerCount = e;
  }
  stop() {
    if (this._stopWatch) {
      const e = this._stopWatch.elapsed();
      this.durations.push(e), this.elapsedOverall += e, this.invocationCount += 1, this._stopWatch = void 0;
    }
  }
};
at.all = /* @__PURE__ */ new Set(), at._idPool = 0;
let Fn = at, Fs = -1;
const cn = class cn {
  constructor(e, n, r = (cn._idPool++).toString(16).padStart(3, "0")) {
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
      const u = new Ds(l, s);
      this._errorHandler(u);
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
cn._idPool = 1;
let Dn = cn;
class dr {
  static create() {
    const e = new Error();
    return new dr(e.stack ?? "");
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
class Ds extends Error {
  constructor(e, n) {
    super(e), this.name = "ListenerLeakError", this.stack = n;
  }
}
class Us extends Error {
  constructor(e, n) {
    super(e), this.name = "ListenerRefusalError", this.stack = n;
  }
}
class _n {
  constructor(e) {
    this.value = e;
  }
}
const Vs = 2;
class me {
  constructor(e) {
    this._size = 0, this._options = e, this._leakageMon = this._options?.leakWarningThreshold ? new Dn(e?.onListenerError ?? Et, this._options?.leakWarningThreshold ?? Fs) : void 0, this._perfMon = this._options?._profName ? new Fn(this._options._profName) : void 0, this._deliveryQueue = this._options?.deliveryQueue;
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
        const u = this._leakageMon.getMostFrequentStack() ?? ["UNKNOWN stack", -1], c = new Us(`${l}. HINT: Stack shows most frequent listener (${u[1]}-times)`, u[0]);
        return (this._options?.onListenerError || Et)(c), gt.None;
      }
      if (this._disposed)
        return gt.None;
      n && (e = e.bind(n));
      const i = new _n(e);
      let s;
      this._leakageMon && this._size >= Math.ceil(this._leakageMon.threshold * 0.2) && (i.stack = dr.create(), s = this._leakageMon.check(i.stack, this._size + 1)), this._listeners ? this._listeners instanceof _n ? (this._deliveryQueue ??= new qs(), this._listeners = [this._listeners, i]) : this._listeners.push(i) : (this._options?.onWillAddFirstListener?.(this), this._listeners = i, this._options?.onDidAddFirstListener?.(this)), this._size++;
      const o = Yt(() => {
        s?.(), this._removeListener(i);
      });
      return r instanceof kt ? r.add(o) : Array.isArray(r) && r.push(o), o;
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
    if (this._size * Vs <= n.length) {
      let s = 0;
      for (let o = 0; o < n.length; o++)
        n[o] ? n[s++] = n[o] : i && (this._deliveryQueue.end--, s < this._deliveryQueue.i && this._deliveryQueue.i--);
      n.length = s;
    }
  }
  _deliver(e, n) {
    if (!e)
      return;
    const r = this._options?.onListenerError || Et;
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
    if (this._deliveryQueue?.current && (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()), this._perfMon?.start(this._size), this._listeners) if (this._listeners instanceof _n)
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
class qs {
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
const $s = function() {
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
let Ws = 100;
class Hs {
  __unenv__ = !0;
  type;
  _asyncId;
  _triggerAsyncId;
  constructor(e, n = $s()) {
    this.type = e, this._asyncId = -1 * Ws++, this._triggerAsyncId = typeof n == "number" ? n : n?.triggerAsyncId;
  }
  static bind(e, n, r) {
    return new F1(n ?? "anonymous").bind(e);
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
const F1 = globalThis.AsyncResource || Hs;
let nt = 10;
const Os = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
}).prototype), D1 = (t, e) => t, rt = Error, zs = Error, je = Error, Jt = Error, js = Error, Un = /* @__PURE__ */ Symbol.for("nodejs.rejection"), we = /* @__PURE__ */ Symbol.for("kCapture"), wn = /* @__PURE__ */ Symbol.for("events.errorMonitor"), Qe = /* @__PURE__ */ Symbol.for("shapeMode"), Zt = /* @__PURE__ */ Symbol.for("events.maxEventTargetListeners"), Gs = /* @__PURE__ */ Symbol.for("kEnhanceStackBeforeInspector"), Qs = /* @__PURE__ */ Symbol.for("nodejs.watermarkData"), xn = /* @__PURE__ */ Symbol.for("kEventEmitter"), We = /* @__PURE__ */ Symbol.for("kAsyncResource"), Ys = /* @__PURE__ */ Symbol.for("kFirstEventParam"), Vn = /* @__PURE__ */ Symbol.for("kResistStopPropagation"), Mr = /* @__PURE__ */ Symbol.for("events.maxEventTargetListenersWarned");
class ve {
  _events = void 0;
  _eventsCount = 0;
  _maxListeners = nt;
  [we] = !1;
  [Qe] = !1;
  static captureRejectionSymbol = Un;
  static errorMonitor = wn;
  static kMaxEventTargetListeners = Zt;
  static kMaxEventTargetListenersWarned = Mr;
  static usingDomains = !1;
  static get on() {
    return Zs;
  }
  static get once() {
    return Ks;
  }
  static get getEventListeners() {
    return eo;
  }
  static get getMaxListeners() {
    return to;
  }
  static get addAbortListener() {
    return U1;
  }
  static get EventEmitterAsyncResource() {
    return Xs;
  }
  static get EventEmitter() {
    return ve;
  }
  static setMaxListeners(e = nt, ...n) {
    if (n.length === 0)
      nt = e;
    else
      for (const r of n)
        if (q1(r))
          r[Zt] = e, r[Mr] = !1;
        else if (typeof r.setMaxListeners == "function")
          r.setMaxListeners(e);
        else
          throw new je(
            "eventTargets",
            ["EventEmitter", "EventTarget"],
            // @ts-expect-error
            r
          );
  }
  static listenerCount(e, n) {
    if (typeof e.listenerCount == "function")
      return e.listenerCount(n);
    ve.prototype.listenerCount.call(e, n);
  }
  static init() {
    throw new Error("EventEmitter.init() is not implemented.");
  }
  static get captureRejections() {
    return this[we];
  }
  static set captureRejections(e) {
    this[we] = e;
  }
  static get defaultMaxListeners() {
    return nt;
  }
  static set defaultMaxListeners(e) {
    nt = e;
  }
  constructor(e) {
    this._events === void 0 || this._events === Object.getPrototypeOf(this)._events ? (this._events = { __proto__: null }, this._eventsCount = 0, this[Qe] = !1) : this[Qe] = !0, this._maxListeners = this._maxListeners || void 0, e?.captureRejections ? this[we] = !!e.captureRejections : this[we] = ve.prototype[we];
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
    return gr(this);
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
      r && i[wn] !== void 0 && this.emit(wn, ...n), r = r && i.error === void 0;
    else if (!r) return !1;
    if (r) {
      let o;
      if (n.length > 0 && (o = n[0]), o instanceof Error) {
        try {
          const c = {};
          Error.captureStackTrace?.(c, ve.prototype.emit), Object.defineProperty(o, Gs, {
            __proto__: null,
            value: Function.prototype.bind(ro, this, o, c),
            configurable: !0
          });
        } catch {
        }
        throw o;
      }
      let l;
      try {
        l = D1(o);
      } catch {
        l = o;
      }
      const u = new zs(l);
      throw u.context = o, u;
    }
    const s = i[e];
    if (s === void 0) return !1;
    if (typeof s == "function") {
      const o = s.apply(this, n);
      o != null && Tr(this, o, e, n);
    } else {
      const o = s.length, l = pr(s);
      for (let u = 0; u < o; ++u) {
        const c = l[u].apply(this, n);
        c != null && Tr(this, c, e, n);
      }
    }
    return !0;
  }
  /**
  * Adds a listener to the event emitter.
  * @returns {EventEmitter}
  */
  addListener(e, n) {
    return Pr(this, e, n, !1), this;
  }
  on(e, n) {
    return this.addListener(e, n);
  }
  /**
  * Adds the `listener` function to the beginning of
  * the listeners array.
  */
  prependListener(e, n) {
    return Pr(this, e, n, !0), this;
  }
  /**
  * Adds a one-time `listener` function to the event emitter.
  */
  once(e, n) {
    return this.on(e, Br(this, e, n)), this;
  }
  /**
  * Adds a one-time `listener` function to the beginning of
  * the listeners array.
  */
  prependOnceListener(e, n) {
    return this.prependListener(e, Br(this, e, n)), this;
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
      this._eventsCount -= 1, this[Qe] ? r[e] = void 0 : this._eventsCount === 0 ? this._events = { __proto__: null } : (delete r[e], r.removeListener && this.emit("removeListener", e, i.listener || n));
    else if (typeof i != "function") {
      let s = -1;
      for (let o = i.length - 1; o >= 0; o--)
        if (i[o] === n || i[o].listener === n) {
          s = o;
          break;
        }
      if (s < 0) return this;
      s === 0 ? i.shift() : ao(i, s), i.length === 1 && (r[e] = i[0]), r.removeListener !== void 0 && this.emit("removeListener", e, n);
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
      return arguments.length === 0 ? (this._events = { __proto__: null }, this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = { __proto__: null } : delete n[e]), this[Qe] = !1, this;
    if (arguments.length === 0) {
      for (const i of Reflect.ownKeys(n))
        i !== "removeListener" && this.removeAllListeners(i);
      return this.removeAllListeners("removeListener"), this._events = { __proto__: null }, this._eventsCount = 0, this[Qe] = !1, this;
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
    return Fr(this, e, !0);
  }
  /**
  * Returns a copy of the array of listeners and wrappers for
  * the event name specified as `type`.
  * @returns {Function[]}
  */
  rawListeners(e) {
    return Fr(this, e, !1);
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
class Xs extends ve {
  /**
  * @param {{
  *   name?: string,
  *   triggerAsyncId?: number,
  *   requireManualDestroy?: boolean,
  * }} [options]
  */
  constructor(e) {
    let n;
    typeof e == "string" ? (n = e, e = void 0) : n = e?.name || new.target.name, super(e), this[We] = new Js(this, n, e);
  }
  /**
  * @param {symbol,string} event
  * @param  {...any} args
  * @returns {boolean}
  */
  emit(e, ...n) {
    if (this[We] === void 0) throw new rt("EventEmitterAsyncResource");
    const { asyncResource: r } = this;
    return Array.prototype.unshift(n, super.emit, this, e), Reflect.apply(r.runInAsyncScope, r, n);
  }
  /**
  * @returns {void}
  */
  emitDestroy() {
    if (this[We] === void 0) throw new rt("EventEmitterAsyncResource");
    this.asyncResource.emitDestroy();
  }
  /**
  * @type {number}
  */
  get asyncId() {
    if (this[We] === void 0) throw new rt("EventEmitterAsyncResource");
    return this.asyncResource.asyncId();
  }
  /**
  * @type {number}
  */
  get triggerAsyncId() {
    if (this[We] === void 0) throw new rt("EventEmitterAsyncResource");
    return this.asyncResource.triggerAsyncId();
  }
  /**
  * @type {EventEmitterReferencingAsyncResource}
  */
  get asyncResource() {
    if (this[We] === void 0) throw new rt("EventEmitterAsyncResource");
    return this[We];
  }
}
class Js extends F1 {
  /**
  * @param {EventEmitter} ee
  * @param {string} [type]
  * @param {{
  *   triggerAsyncId?: number,
  *   requireManualDestroy?: boolean,
  * }} [options]
  */
  constructor(e, n, r) {
    super(n, r), this[xn] = e;
  }
  /**
  * @type {EventEmitter}
  */
  get eventEmitter() {
    if (this[xn] === void 0) throw new rt("EventEmitterReferencingAsyncResource");
    return this[xn];
  }
}
const Zs = function(e, n, r = {}) {
  const i = r.signal;
  if (i?.aborted)
    throw new Jt(void 0, { cause: i?.reason });
  const s = r.highWaterMark ?? r.highWatermark ?? Number.MAX_SAFE_INTEGER, o = r.lowWaterMark ?? r.lowWatermark ?? 1, l = new Ir(), u = new Ir();
  let c = !1, f = null, h = !1, m = 0;
  const d = Object.setPrototypeOf({
    next() {
      if (m) {
        const w = l.shift();
        return m--, c && m < o && (e.resume?.(), c = !1), Promise.resolve(vn(w, !1));
      }
      if (f) {
        const w = Promise.reject(f);
        return f = null, w;
      }
      return h ? y() : new Promise(function(w, A) {
        u.push({
          resolve: w,
          reject: A
        });
      });
    },
    return() {
      return y();
    },
    throw(w) {
      if (!w || !(w instanceof Error))
        throw new je(
          "EventEmitter.AsyncIterator",
          "Error",
          // @ts-expect-error
          w
        );
      _(w);
    },
    [Symbol.asyncIterator]() {
      return this;
    },
    [Qs]: {
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
        return c;
      }
    }
  }, Os), { addEventListener: g, removeAll: b } = oo();
  g(e, n, r[Ys] ? N : function(...w) {
    return N(w);
  }), n !== "error" && typeof e.on == "function" && g(e, "error", _);
  const x = r?.close;
  if (x?.length)
    for (const w of x)
      g(e, w, y);
  const v = i ? U1(i, E) : null;
  return d;
  function E() {
    _(new Jt(void 0, { cause: i?.reason }));
  }
  function N(w) {
    u.isEmpty() ? (m++, !c && m > s && (c = !0, e.pause?.()), l.push(w)) : u.shift().resolve(vn(w, !1));
  }
  function _(w) {
    u.isEmpty() ? f = w : u.shift().reject(w), y();
  }
  function y() {
    v?.[Symbol.dispose](), b(), h = !0;
    const w = vn(void 0, !0);
    for (; !u.isEmpty(); )
      u.shift().resolve(w);
    return Promise.resolve(w);
  }
}, Ks = async function(e, n, r = {}) {
  const i = r?.signal;
  if (i?.aborted)
    throw new Jt(void 0, { cause: i?.reason });
  return new Promise((s, o) => {
    const l = (h) => {
      typeof e.removeListener == "function" && e.removeListener(n, u), i != null && Nt(i, "abort", f), o(h);
    }, u = (...h) => {
      typeof e.removeListener == "function" && e.removeListener("error", l), i != null && Nt(i, "abort", f), s(h);
    }, c = {
      __proto__: null,
      once: !0,
      [Vn]: !0
    };
    qn(e, n, u, c), n !== "error" && typeof e.once == "function" && e.once("error", l);
    function f() {
      Nt(e, n, u), Nt(e, "error", l), o(new Jt(void 0, { cause: i?.reason }));
    }
    i != null && qn(i, "abort", f, {
      __proto__: null,
      once: !0,
      [Vn]: !0
    });
  });
}, U1 = function(e, n) {
  if (e === void 0)
    throw new je("signal", "AbortSignal", e);
  let r;
  return e.aborted ? queueMicrotask(() => n()) : (e.addEventListener("abort", n, {
    __proto__: null,
    once: !0,
    [Vn]: !0
  }), r = () => {
    e.removeEventListener("abort", n);
  }), {
    __proto__: null,
    [Symbol.dispose]() {
      r?.();
    }
  };
}, eo = function(e, n) {
  if (typeof e.listeners == "function")
    return e.listeners(n);
  if (q1(e)) {
    const r = e[kEvents].get(n), i = [];
    let s = r?.next;
    for (; s?.listener !== void 0; ) {
      const o = s.listener?.deref ? s.listener.deref() : s.listener;
      i.push(o), s = s.next;
    }
    return i;
  }
  throw new je(
    "emitter",
    ["EventEmitter", "EventTarget"],
    // @ts-expect-error
    e
  );
}, to = function(e) {
  if (typeof e?.getMaxListeners == "function")
    return gr(e);
  if (e?.[Zt])
    return e[Zt];
  throw new je(
    "emitter",
    ["EventEmitter", "EventTarget"],
    // @ts-expect-error
    e
  );
}, V1 = 2048, Ln = V1 - 1;
class kr {
  bottom;
  top;
  list;
  next;
  constructor() {
    this.bottom = 0, this.top = 0, this.list = new Array(V1), this.next = null;
  }
  isEmpty() {
    return this.top === this.bottom;
  }
  isFull() {
    return (this.top + 1 & Ln) === this.bottom;
  }
  push(e) {
    this.list[this.top] = e, this.top = this.top + 1 & Ln;
  }
  shift() {
    const e = this.list[this.bottom];
    return e === void 0 ? null : (this.list[this.bottom] = void 0, this.bottom = this.bottom + 1 & Ln, e);
  }
}
class Ir {
  head;
  tail;
  constructor() {
    this.head = this.tail = new kr();
  }
  isEmpty() {
    return this.head.isEmpty();
  }
  push(e) {
    this.head.isFull() && (this.head = this.head.next = new kr()), this.head.push(e);
  }
  shift() {
    const e = this.tail, n = e.shift();
    return e.isEmpty() && e.next !== null && (this.tail = e.next, e.next = null), n;
  }
}
function q1(t) {
  return typeof t?.addEventListener == "function";
}
function Tr(t, e, n, r) {
  if (t[we])
    try {
      const i = e.then;
      typeof i == "function" && i.call(e, void 0, function(s) {
        ye.nextTick(no, t, s, n, r);
      });
    } catch (i) {
      t.emit("error", i);
    }
}
function no(t, e, n, r) {
  if (typeof t[Un] == "function")
    t[Un](e, n, ...r);
  else {
    const i = t[we];
    try {
      t[we] = !1, t.emit("error", e);
    } finally {
      t[we] = i;
    }
  }
}
function gr(t) {
  return t._maxListeners === void 0 ? nt : t._maxListeners;
}
function ro(t, e) {
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
function Pr(t, e, n, r) {
  let i, s, o;
  if (s = t._events, s === void 0 ? (s = t._events = { __proto__: null }, t._eventsCount = 0) : (s.newListener !== void 0 && (t.emit("newListener", e, n.listener ?? n), s = t._events), o = s[e]), o === void 0)
    s[e] = n, ++t._eventsCount;
  else if (typeof o == "function" ? o = s[e] = r ? [n, o] : [o, n] : r ? o.unshift(n) : o.push(n), i = gr(t), i > 0 && o.length > i && !o.warned) {
    o.warned = !0;
    const l = new js(`Possible EventEmitter memory leak detected. ${o.length} ${String(e)} listeners added to ${D1(t)}. MaxListeners is ${i}. Use emitter.setMaxListeners() to increase limit`, {
      name: "MaxListenersExceededWarning",
      emitter: t,
      type: e,
      count: o.length
    });
    ye.emitWarning(l);
  }
  return t;
}
function io() {
  if (!this.fired)
    return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
}
function Br(t, e, n) {
  const r = {
    fired: !1,
    wrapFn: void 0,
    target: t,
    type: e,
    listener: n
  }, i = io.bind(r);
  return i.listener = n, r.wrapFn = i, i;
}
function Fr(t, e, n) {
  const r = t._events;
  if (r === void 0) return [];
  const i = r[e];
  return i === void 0 ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? so(i) : pr(i);
}
function pr(t) {
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
function so(t) {
  const e = pr(t);
  for (let n = 0; n < e.length; ++n) {
    const r = e[n].listener;
    typeof r == "function" && (e[n] = r);
  }
  return e;
}
function vn(t, e) {
  return {
    value: t,
    done: e
  };
}
function Nt(t, e, n, r) {
  if (typeof t.removeListener == "function")
    t.removeListener(e, n);
  else if (typeof t.removeEventListener == "function")
    t.removeEventListener(e, n, r);
  else
    throw new je("emitter", "EventEmitter", t);
}
function qn(t, e, n, r) {
  if (typeof t.on == "function")
    r?.once ? t.once(e, n) : t.on(e, n);
  else if (typeof t.addEventListener == "function")
    t.addEventListener(e, n, r);
  else
    throw new je("emitter", "EventEmitter", t);
}
function oo() {
  const t = [];
  return {
    addEventListener(e, n, r, i) {
      qn(e, n, r, i), Array.prototype.push(t, [
        e,
        n,
        r,
        i
      ]);
    },
    removeAll() {
      for (; t.length > 0; )
        Reflect.apply(Nt, void 0, t.pop());
    }
  };
}
function ao(t, e) {
  for (; e + 1 < t.length; e++) t[e] = t[e + 1];
  t.pop();
}
// @__NO_SIDE_EFFECTS__
function lo(...t) {
  return function(...e) {
    for (const n of t)
      n(...e);
  };
}
// @__NO_SIDE_EFFECTS__
function q(t) {
  return new Error(`[unenv] ${t} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function Ye(t) {
  return Object.assign(() => {
    throw /* @__PURE__ */ q(t);
  }, { __unenv__: !0 });
}
class br extends ve {
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
    return new br(n);
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
    throw /* @__PURE__ */ q("Readable.asyncIterator");
  }
  iterator(e) {
    throw /* @__PURE__ */ q("Readable.iterator");
  }
  map(e, n) {
    throw /* @__PURE__ */ q("Readable.map");
  }
  filter(e, n) {
    throw /* @__PURE__ */ q("Readable.filter");
  }
  forEach(e, n) {
    throw /* @__PURE__ */ q("Readable.forEach");
  }
  reduce(e, n, r) {
    throw /* @__PURE__ */ q("Readable.reduce");
  }
  find(e, n) {
    throw /* @__PURE__ */ q("Readable.find");
  }
  findIndex(e, n) {
    throw /* @__PURE__ */ q("Readable.findIndex");
  }
  some(e, n) {
    throw /* @__PURE__ */ q("Readable.some");
  }
  toArray(e) {
    throw /* @__PURE__ */ q("Readable.toArray");
  }
  every(e, n) {
    throw /* @__PURE__ */ q("Readable.every");
  }
  flatMap(e, n) {
    throw /* @__PURE__ */ q("Readable.flatMap");
  }
  drop(e, n) {
    throw /* @__PURE__ */ q("Readable.drop");
  }
  take(e, n) {
    throw /* @__PURE__ */ q("Readable.take");
  }
  asIndexedPairs(e) {
    throw /* @__PURE__ */ q("Readable.asIndexedPairs");
  }
}
const $1 = globalThis.Readable || br, xe = [], fe = [], uo = typeof Uint8Array > "u" ? Array : Uint8Array, Nn = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (let t = 0, e = Nn.length; t < e; ++t)
  xe[t] = Nn[t], fe[Nn.charCodeAt(t)] = t;
fe[45] = 62;
fe[95] = 63;
function co(t) {
  const e = t.length;
  if (e % 4 > 0)
    throw new Error("Invalid string. Length must be a multiple of 4");
  let n = t.indexOf("=");
  n === -1 && (n = e);
  const r = n === e ? 0 : 4 - n % 4;
  return [n, r];
}
function ho(t, e, n) {
  return (e + n) * 3 / 4 - n;
}
function fo(t) {
  let e;
  const n = co(t), r = n[0], i = n[1], s = new uo(ho(t, r, i));
  let o = 0;
  const l = i > 0 ? r - 4 : r;
  let u;
  for (u = 0; u < l; u += 4)
    e = fe[t.charCodeAt(u)] << 18 | fe[t.charCodeAt(u + 1)] << 12 | fe[t.charCodeAt(u + 2)] << 6 | fe[t.charCodeAt(u + 3)], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255;
  return i === 2 && (e = fe[t.charCodeAt(u)] << 2 | fe[t.charCodeAt(u + 1)] >> 4, s[o++] = e & 255), i === 1 && (e = fe[t.charCodeAt(u)] << 10 | fe[t.charCodeAt(u + 1)] << 4 | fe[t.charCodeAt(u + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s;
}
function mo(t) {
  return xe[t >> 18 & 63] + xe[t >> 12 & 63] + xe[t >> 6 & 63] + xe[t & 63];
}
function go(t, e, n) {
  let r;
  const i = [];
  for (let s = e; s < n; s += 3)
    r = (t[s] << 16 & 16711680) + (t[s + 1] << 8 & 65280) + (t[s + 2] & 255), i.push(mo(r));
  return i.join("");
}
function Dr(t) {
  let e;
  const n = t.length, r = n % 3, i = [], s = 16383;
  for (let o = 0, l = n - r; o < l; o += s)
    i.push(go(t, o, o + s > l ? l : o + s));
  return r === 1 ? (e = t[n - 1], i.push(xe[e >> 2] + xe[e << 4 & 63] + "==")) : r === 2 && (e = (t[n - 2] << 8) + t[n - 1], i.push(xe[e >> 10] + xe[e >> 4 & 63] + xe[e << 2 & 63] + "=")), i.join("");
}
function bn(t, e, n, r, i) {
  let s, o;
  const l = i * 8 - r - 1, u = (1 << l) - 1, c = u >> 1;
  let f = -7, h = n ? i - 1 : 0;
  const m = n ? -1 : 1;
  let d = t[e + h];
  for (h += m, s = d & (1 << -f) - 1, d >>= -f, f += l; f > 0; )
    s = s * 256 + t[e + h], h += m, f -= 8;
  for (o = s & (1 << -f) - 1, s >>= -f, f += r; f > 0; )
    o = o * 256 + t[e + h], h += m, f -= 8;
  if (s === 0)
    s = 1 - c;
  else {
    if (s === u)
      return o ? Number.NaN : (d ? -1 : 1) * Number.POSITIVE_INFINITY;
    o = o + Math.pow(2, r), s = s - c;
  }
  return (d ? -1 : 1) * o * Math.pow(2, s - r);
}
function W1(t, e, n, r, i, s) {
  let o, l, u, c = s * 8 - i - 1;
  const f = (1 << c) - 1, h = f >> 1, m = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  let d = r ? 0 : s - 1;
  const g = r ? 1 : -1, b = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
  for (e = Math.abs(e), Number.isNaN(e) || e === Number.POSITIVE_INFINITY ? (l = Number.isNaN(e) ? 1 : 0, o = f) : (o = Math.floor(Math.log2(e)), e * (u = Math.pow(2, -o)) < 1 && (o--, u *= 2), e += o + h >= 1 ? m / u : m * Math.pow(2, 1 - h), e * u >= 2 && (o++, u /= 2), o + h >= f ? (l = 0, o = f) : o + h >= 1 ? (l = (e * u - 1) * Math.pow(2, i), o = o + h) : (l = e * Math.pow(2, h - 1) * Math.pow(2, i), o = 0)); i >= 8; )
    t[n + d] = l & 255, d += g, l /= 256, i -= 8;
  for (o = o << i | l, c += i; c > 0; )
    t[n + d] = o & 255, d += g, o /= 256, c -= 8;
  t[n + d - g] |= b * 128;
}
const Ur = typeof Symbol == "function" && typeof Symbol.for == "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : null, po = 50, $n = 2147483647;
p.TYPED_ARRAY_SUPPORT = bo();
!p.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This environment lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
function bo() {
  try {
    const t = new Uint8Array(1), e = { foo: function() {
      return 42;
    } };
    return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(t, e), t.foo() === 42;
  } catch {
    return !1;
  }
}
Object.defineProperty(p.prototype, "parent", {
  enumerable: !0,
  get: function() {
    if (p.isBuffer(this))
      return this.buffer;
  }
});
Object.defineProperty(p.prototype, "offset", {
  enumerable: !0,
  get: function() {
    if (p.isBuffer(this))
      return this.byteOffset;
  }
});
function Ae(t) {
  if (t > $n)
    throw new RangeError('The value "' + t + '" is invalid for option "size"');
  const e = new Uint8Array(t);
  return Object.setPrototypeOf(e, p.prototype), e;
}
function p(t, e, n) {
  if (typeof t == "number") {
    if (typeof e == "string")
      throw new TypeError('The "string" argument must be of type string. Received type number');
    return yr(t);
  }
  return H1(t, e, n);
}
p.poolSize = 8192;
function H1(t, e, n) {
  if (typeof t == "string")
    return _o(t, e);
  if (ArrayBuffer.isView(t))
    return wo(t);
  if (t == null)
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
  if (Ne(t, ArrayBuffer) || t && Ne(t.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (Ne(t, SharedArrayBuffer) || t && Ne(t.buffer, SharedArrayBuffer)))
    return Hn(t, e, n);
  if (typeof t == "number")
    throw new TypeError('The "value" argument must not be of type number. Received type number');
  const r = t.valueOf && t.valueOf();
  if (r != null && r !== t)
    return p.from(r, e, n);
  const i = xo(t);
  if (i)
    return i;
  if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof t[Symbol.toPrimitive] == "function")
    return p.from(t[Symbol.toPrimitive]("string"), e, n);
  throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
}
p.from = function(t, e, n) {
  return H1(t, e, n);
};
Object.setPrototypeOf(p.prototype, Uint8Array.prototype);
Object.setPrototypeOf(p, Uint8Array);
function O1(t) {
  if (typeof t != "number")
    throw new TypeError('"size" argument must be of type number');
  if (t < 0)
    throw new RangeError('The value "' + t + '" is invalid for option "size"');
}
function yo(t, e, n) {
  return O1(t), t <= 0 ? Ae(t) : e !== void 0 ? typeof n == "string" ? Ae(t).fill(e, n) : Ae(t).fill(e) : Ae(t);
}
p.alloc = function(t, e, n) {
  return yo(t, e, n);
};
function yr(t) {
  return O1(t), Ae(t < 0 ? 0 : _r(t) | 0);
}
p.allocUnsafe = function(t) {
  return yr(t);
};
p.allocUnsafeSlow = function(t) {
  return yr(t);
};
function _o(t, e) {
  if ((typeof e != "string" || e === "") && (e = "utf8"), !p.isEncoding(e))
    throw new TypeError("Unknown encoding: " + e);
  const n = z1(t, e) | 0;
  let r = Ae(n);
  const i = r.write(t, e);
  return i !== n && (r = r.slice(0, i)), r;
}
function Wn(t) {
  const e = t.length < 0 ? 0 : _r(t.length) | 0, n = Ae(e);
  for (let r = 0; r < e; r += 1)
    n[r] = t[r] & 255;
  return n;
}
function wo(t) {
  if (Ne(t, Uint8Array)) {
    const e = new Uint8Array(t);
    return Hn(e.buffer, e.byteOffset, e.byteLength);
  }
  return Wn(t);
}
function Hn(t, e, n) {
  if (e < 0 || t.byteLength < e)
    throw new RangeError('"offset" is outside of buffer bounds');
  if (t.byteLength < e + (n || 0))
    throw new RangeError('"length" is outside of buffer bounds');
  let r;
  return e === void 0 && n === void 0 ? r = new Uint8Array(t) : n === void 0 ? r = new Uint8Array(t, e) : r = new Uint8Array(t, e, n), Object.setPrototypeOf(r, p.prototype), r;
}
function xo(t) {
  if (p.isBuffer(t)) {
    const e = _r(t.length) | 0, n = Ae(e);
    return n.length === 0 || t.copy(n, 0, 0, e), n;
  }
  if (t.length !== void 0)
    return typeof t.length != "number" || xr(t.length) ? Ae(0) : Wn(t);
  if (t.type === "Buffer" && Array.isArray(t.data))
    return Wn(t.data);
}
function _r(t) {
  if (t >= $n)
    throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + $n.toString(16) + " bytes");
  return t | 0;
}
p.isBuffer = function(e) {
  return e != null && e._isBuffer === !0 && e !== p.prototype;
};
p.compare = function(e, n) {
  if (Ne(e, Uint8Array) && (e = p.from(e, e.offset, e.byteLength)), Ne(n, Uint8Array) && (n = p.from(n, n.offset, n.byteLength)), !p.isBuffer(e) || !p.isBuffer(n))
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
p.isEncoding = function(e) {
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
p.concat = function(e, n) {
  if (!Array.isArray(e))
    throw new TypeError('"list" argument must be an Array of Buffers');
  if (e.length === 0)
    return p.alloc(0);
  let r;
  if (n === void 0)
    for (n = 0, r = 0; r < e.length; ++r)
      n += e[r].length;
  const i = p.allocUnsafe(n);
  let s = 0;
  for (r = 0; r < e.length; ++r) {
    let o = e[r];
    if (Ne(o, Uint8Array))
      s + o.length > i.length ? (p.isBuffer(o) || (o = p.from(o.buffer, o.byteOffset, o.byteLength)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s);
    else if (p.isBuffer(o))
      o.copy(i, s);
    else
      throw new TypeError('"list" argument must be an Array of Buffers');
    s += o.length;
  }
  return i;
};
function z1(t, e) {
  if (p.isBuffer(t))
    return t.length;
  if (ArrayBuffer.isView(t) || Ne(t, ArrayBuffer))
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
        return On(t).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return n * 2;
      case "hex":
        return n >>> 1;
      case "base64":
        return es(t).length;
      default:
        if (i)
          return r ? -1 : On(t).length;
        e = ("" + e).toLowerCase(), i = !0;
    }
}
p.byteLength = z1;
function Lo(t, e, n) {
  let r = !1;
  if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((n === void 0 || n > this.length) && (n = this.length), n <= 0) || (n >>>= 0, e >>>= 0, n <= e))
    return "";
  for (t || (t = "utf8"); ; )
    switch (t) {
      case "hex":
        return Io(this, e, n);
      case "utf8":
      case "utf-8":
        return G1(this, e, n);
      case "ascii":
        return Mo(this, e, n);
      case "latin1":
      case "binary":
        return ko(this, e, n);
      case "base64":
        return Ro(this, e, n);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return To(this, e, n);
      default:
        if (r)
          throw new TypeError("Unknown encoding: " + t);
        t = (t + "").toLowerCase(), r = !0;
    }
}
p.prototype._isBuffer = !0;
function ze(t, e, n) {
  const r = t[e];
  t[e] = t[n], t[n] = r;
}
p.prototype.swap16 = function() {
  const e = this.length;
  if (e % 2 !== 0)
    throw new RangeError("Buffer size must be a multiple of 16-bits");
  for (let n = 0; n < e; n += 2)
    ze(this, n, n + 1);
  return this;
};
p.prototype.swap32 = function() {
  const e = this.length;
  if (e % 4 !== 0)
    throw new RangeError("Buffer size must be a multiple of 32-bits");
  for (let n = 0; n < e; n += 4)
    ze(this, n, n + 3), ze(this, n + 1, n + 2);
  return this;
};
p.prototype.swap64 = function() {
  const e = this.length;
  if (e % 8 !== 0)
    throw new RangeError("Buffer size must be a multiple of 64-bits");
  for (let n = 0; n < e; n += 8)
    ze(this, n, n + 7), ze(this, n + 1, n + 6), ze(this, n + 2, n + 5), ze(this, n + 3, n + 4);
  return this;
};
p.prototype.toString = function() {
  const e = this.length;
  return e === 0 ? "" : arguments.length === 0 ? G1(this, 0, e) : Reflect.apply(Lo, this, arguments);
};
p.prototype.toLocaleString = p.prototype.toString;
p.prototype.equals = function(e) {
  if (!p.isBuffer(e))
    throw new TypeError("Argument must be a Buffer");
  return this === e ? !0 : p.compare(this, e) === 0;
};
p.prototype.inspect = function() {
  let e = "";
  const n = po;
  return e = this.toString("hex", 0, n).replace(/(.{2})/g, "$1 ").trim(), this.length > n && (e += " ... "), "<Buffer " + e + ">";
};
Ur && (p.prototype[Ur] = p.prototype.inspect);
p.prototype.compare = function(e, n, r, i, s) {
  if (Ne(e, Uint8Array) && (e = p.from(e, e.offset, e.byteLength)), !p.isBuffer(e))
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
  const u = Math.min(o, l), c = this.slice(i, s), f = e.slice(n, r);
  for (let h = 0; h < u; ++h)
    if (c[h] !== f[h]) {
      o = c[h], l = f[h];
      break;
    }
  return o < l ? -1 : l < o ? 1 : 0;
};
function j1(t, e, n, r, i) {
  if (t.length === 0)
    return -1;
  if (typeof n == "string" ? (r = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), n = +n, xr(n) && (n = i ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) {
    if (i)
      return -1;
    n = t.length - 1;
  } else if (n < 0)
    if (i)
      n = 0;
    else
      return -1;
  if (typeof e == "string" && (e = p.from(e, r)), p.isBuffer(e))
    return e.length === 0 ? -1 : Vr(t, e, n, r, i);
  if (typeof e == "number")
    return e = e & 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : Vr(t, [e], n, r, i);
  throw new TypeError("val must be string, number or Buffer");
}
function Vr(t, e, n, r, i) {
  let s = 1, o = t.length, l = e.length;
  if (r !== void 0 && (r = String(r).toLowerCase(), r === "ucs2" || r === "ucs-2" || r === "utf16le" || r === "utf-16le")) {
    if (t.length < 2 || e.length < 2)
      return -1;
    s = 2, o /= 2, l /= 2, n /= 2;
  }
  function u(f, h) {
    return s === 1 ? f[h] : f.readUInt16BE(h * s);
  }
  let c;
  if (i) {
    let f = -1;
    for (c = n; c < o; c++)
      if (u(t, c) === u(e, f === -1 ? 0 : c - f)) {
        if (f === -1 && (f = c), c - f + 1 === l)
          return f * s;
      } else
        f !== -1 && (c -= c - f), f = -1;
  } else
    for (n + l > o && (n = o - l), c = n; c >= 0; c--) {
      let f = !0;
      for (let h = 0; h < l; h++)
        if (u(t, c + h) !== u(e, h)) {
          f = !1;
          break;
        }
      if (f)
        return c;
    }
  return -1;
}
p.prototype.includes = function(e, n, r) {
  return this.indexOf(e, n, r) !== -1;
};
p.prototype.indexOf = function(e, n, r) {
  return j1(this, e, n, r, !0);
};
p.prototype.lastIndexOf = function(e, n, r) {
  return j1(this, e, n, r, !1);
};
function vo(t, e, n, r) {
  n = Number(n) || 0;
  const i = t.length - n;
  r ? (r = Number(r), r > i && (r = i)) : r = i;
  const s = e.length;
  r > s / 2 && (r = s / 2);
  let o;
  for (o = 0; o < r; ++o) {
    const l = Number.parseInt(e.slice(o * 2, o * 2 + 2), 16);
    if (xr(l))
      return o;
    t[n + o] = l;
  }
  return o;
}
function No(t, e, n, r) {
  return yn(On(e, t.length - n), t, n, r);
}
function Eo(t, e, n, r) {
  return yn(Do(e), t, n, r);
}
function So(t, e, n, r) {
  return yn(es(e), t, n, r);
}
function Ao(t, e, n, r) {
  return yn(Uo(e, t.length - n), t, n, r);
}
p.prototype.write = function(e, n, r, i) {
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
        return vo(this, e, n, r);
      case "utf8":
      case "utf-8":
        return No(this, e, n, r);
      case "ascii":
      case "latin1":
      case "binary":
        return Eo(this, e, n, r);
      case "base64":
        return So(this, e, n, r);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return Ao(this, e, n, r);
      default:
        if (o)
          throw new TypeError("Unknown encoding: " + i);
        i = ("" + i).toLowerCase(), o = !0;
    }
};
p.prototype.toJSON = function() {
  return {
    type: "Buffer",
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function Ro(t, e, n) {
  return e === 0 && n === t.length ? Dr(t) : Dr(t.slice(e, n));
}
function G1(t, e, n) {
  n = Math.min(t.length, n);
  const r = [];
  let i = e;
  for (; i < n; ) {
    const s = t[i];
    let o = null, l = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
    if (i + l <= n) {
      let u, c, f, h;
      switch (l) {
        case 1:
          s < 128 && (o = s);
          break;
        case 2:
          u = t[i + 1], (u & 192) === 128 && (h = (s & 31) << 6 | u & 63, h > 127 && (o = h));
          break;
        case 3:
          u = t[i + 1], c = t[i + 2], (u & 192) === 128 && (c & 192) === 128 && (h = (s & 15) << 12 | (u & 63) << 6 | c & 63, h > 2047 && (h < 55296 || h > 57343) && (o = h));
          break;
        case 4:
          u = t[i + 1], c = t[i + 2], f = t[i + 3], (u & 192) === 128 && (c & 192) === 128 && (f & 192) === 128 && (h = (s & 15) << 18 | (u & 63) << 12 | (c & 63) << 6 | f & 63, h > 65535 && h < 1114112 && (o = h));
      }
    }
    o === null ? (o = 65533, l = 1) : o > 65535 && (o -= 65536, r.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), r.push(o), i += l;
  }
  return Co(r);
}
const qr = 4096;
function Co(t) {
  const e = t.length;
  if (e <= qr)
    return String.fromCharCode.apply(String, t);
  let n = "", r = 0;
  for (; r < e; )
    n += String.fromCharCode.apply(String, t.slice(r, r += qr));
  return n;
}
function Mo(t, e, n) {
  let r = "";
  n = Math.min(t.length, n);
  for (let i = e; i < n; ++i)
    r += String.fromCharCode(t[i] & 127);
  return r;
}
function ko(t, e, n) {
  let r = "";
  n = Math.min(t.length, n);
  for (let i = e; i < n; ++i)
    r += String.fromCharCode(t[i]);
  return r;
}
function Io(t, e, n) {
  const r = t.length;
  (!e || e < 0) && (e = 0), (!n || n < 0 || n > r) && (n = r);
  let i = "";
  for (let s = e; s < n; ++s)
    i += Vo[t[s]];
  return i;
}
function To(t, e, n) {
  const r = t.slice(e, n);
  let i = "";
  for (let s = 0; s < r.length - 1; s += 2)
    i += String.fromCharCode(r[s] + r[s + 1] * 256);
  return i;
}
p.prototype.slice = function(e, n) {
  const r = this.length;
  e = Math.trunc(e), n = n === void 0 ? r : Math.trunc(n), e < 0 ? (e += r, e < 0 && (e = 0)) : e > r && (e = r), n < 0 ? (n += r, n < 0 && (n = 0)) : n > r && (n = r), n < e && (n = e);
  const i = this.subarray(e, n);
  return Object.setPrototypeOf(i, p.prototype), i;
};
function ee(t, e, n) {
  if (t % 1 !== 0 || t < 0)
    throw new RangeError("offset is not uint");
  if (t + e > n)
    throw new RangeError("Trying to access beyond buffer length");
}
p.prototype.readUintLE = p.prototype.readUIntLE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || ee(e, n, this.length);
  let i = this[e], s = 1, o = 0;
  for (; ++o < n && (s *= 256); )
    i += this[e + o] * s;
  return i;
};
p.prototype.readUintBE = p.prototype.readUIntBE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || ee(e, n, this.length);
  let i = this[e + --n], s = 1;
  for (; n > 0 && (s *= 256); )
    i += this[e + --n] * s;
  return i;
};
p.prototype.readUint8 = p.prototype.readUInt8 = function(e, n) {
  return e = e >>> 0, n || ee(e, 1, this.length), this[e];
};
p.prototype.readUint16LE = p.prototype.readUInt16LE = function(e, n) {
  return e = e >>> 0, n || ee(e, 2, this.length), this[e] | this[e + 1] << 8;
};
p.prototype.readUint16BE = p.prototype.readUInt16BE = function(e, n) {
  return e = e >>> 0, n || ee(e, 2, this.length), this[e] << 8 | this[e + 1];
};
p.prototype.readUint32LE = p.prototype.readUInt32LE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
};
p.prototype.readUint32BE = p.prototype.readUInt32BE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
};
p.prototype.readBigUInt64LE = $e(function(e) {
  e = e >>> 0, yt(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && Ft(e, this.length - 8);
  const i = n + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + r * 2 ** 24;
  return BigInt(i) + (BigInt(s) << BigInt(32));
});
p.prototype.readBigUInt64BE = $e(function(e) {
  e = e >>> 0, yt(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && Ft(e, this.length - 8);
  const i = n * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + r;
  return (BigInt(i) << BigInt(32)) + BigInt(s);
});
p.prototype.readIntLE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || ee(e, n, this.length);
  let i = this[e], s = 1, o = 0;
  for (; ++o < n && (s *= 256); )
    i += this[e + o] * s;
  return s *= 128, i >= s && (i -= Math.pow(2, 8 * n)), i;
};
p.prototype.readIntBE = function(e, n, r) {
  e = e >>> 0, n = n >>> 0, r || ee(e, n, this.length);
  let i = n, s = 1, o = this[e + --i];
  for (; i > 0 && (s *= 256); )
    o += this[e + --i] * s;
  return s *= 128, o >= s && (o -= Math.pow(2, 8 * n)), o;
};
p.prototype.readInt8 = function(e, n) {
  return e = e >>> 0, n || ee(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
};
p.prototype.readInt16LE = function(e, n) {
  e = e >>> 0, n || ee(e, 2, this.length);
  const r = this[e] | this[e + 1] << 8;
  return r & 32768 ? r | 4294901760 : r;
};
p.prototype.readInt16BE = function(e, n) {
  e = e >>> 0, n || ee(e, 2, this.length);
  const r = this[e + 1] | this[e] << 8;
  return r & 32768 ? r | 4294901760 : r;
};
p.prototype.readInt32LE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
};
p.prototype.readInt32BE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
};
p.prototype.readBigInt64LE = $e(function(e) {
  e = e >>> 0, yt(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && Ft(e, this.length - 8);
  const i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (r << 24);
  return (BigInt(i) << BigInt(32)) + BigInt(n + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
});
p.prototype.readBigInt64BE = $e(function(e) {
  e = e >>> 0, yt(e, "offset");
  const n = this[e], r = this[e + 7];
  (n === void 0 || r === void 0) && Ft(e, this.length - 8);
  const i = (n << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e];
  return (BigInt(i) << BigInt(32)) + BigInt(this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + r);
});
p.prototype.readFloatLE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), bn(this, e, !0, 23, 4);
};
p.prototype.readFloatBE = function(e, n) {
  return e = e >>> 0, n || ee(e, 4, this.length), bn(this, e, !1, 23, 4);
};
p.prototype.readDoubleLE = function(e, n) {
  return e = e >>> 0, n || ee(e, 8, this.length), bn(this, e, !0, 52, 8);
};
p.prototype.readDoubleBE = function(e, n) {
  return e = e >>> 0, n || ee(e, 8, this.length), bn(this, e, !1, 52, 8);
};
function ae(t, e, n, r, i, s) {
  if (!p.isBuffer(t))
    throw new TypeError('"buffer" argument must be a Buffer instance');
  if (e > i || e < s)
    throw new RangeError('"value" argument is out of bounds');
  if (n + r > t.length)
    throw new RangeError("Index out of range");
}
p.prototype.writeUintLE = p.prototype.writeUIntLE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, r = r >>> 0, !i) {
    const l = Math.pow(2, 8 * r) - 1;
    ae(this, e, n, r, l, 0);
  }
  let s = 1, o = 0;
  for (this[n] = e & 255; ++o < r && (s *= 256); )
    this[n + o] = e / s & 255;
  return n + r;
};
p.prototype.writeUintBE = p.prototype.writeUIntBE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, r = r >>> 0, !i) {
    const l = Math.pow(2, 8 * r) - 1;
    ae(this, e, n, r, l, 0);
  }
  let s = r - 1, o = 1;
  for (this[n + s] = e & 255; --s >= 0 && (o *= 256); )
    this[n + s] = e / o & 255;
  return n + r;
};
p.prototype.writeUint8 = p.prototype.writeUInt8 = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 1, 255, 0), this[n] = e & 255, n + 1;
};
p.prototype.writeUint16LE = p.prototype.writeUInt16LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 2, 65535, 0), this[n] = e & 255, this[n + 1] = e >>> 8, n + 2;
};
p.prototype.writeUint16BE = p.prototype.writeUInt16BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 2, 65535, 0), this[n] = e >>> 8, this[n + 1] = e & 255, n + 2;
};
p.prototype.writeUint32LE = p.prototype.writeUInt32LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 4, 4294967295, 0), this[n + 3] = e >>> 24, this[n + 2] = e >>> 16, this[n + 1] = e >>> 8, this[n] = e & 255, n + 4;
};
p.prototype.writeUint32BE = p.prototype.writeUInt32BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 4, 4294967295, 0), this[n] = e >>> 24, this[n + 1] = e >>> 16, this[n + 2] = e >>> 8, this[n + 3] = e & 255, n + 4;
};
function Q1(t, e, n, r, i) {
  K1(e, r, i, t, n, 7);
  let s = Number(e & BigInt(4294967295));
  t[n++] = s, s = s >> 8, t[n++] = s, s = s >> 8, t[n++] = s, s = s >> 8, t[n++] = s;
  let o = Number(e >> BigInt(32) & BigInt(4294967295));
  return t[n++] = o, o = o >> 8, t[n++] = o, o = o >> 8, t[n++] = o, o = o >> 8, t[n++] = o, n;
}
function Y1(t, e, n, r, i) {
  K1(e, r, i, t, n, 7);
  let s = Number(e & BigInt(4294967295));
  t[n + 7] = s, s = s >> 8, t[n + 6] = s, s = s >> 8, t[n + 5] = s, s = s >> 8, t[n + 4] = s;
  let o = Number(e >> BigInt(32) & BigInt(4294967295));
  return t[n + 3] = o, o = o >> 8, t[n + 2] = o, o = o >> 8, t[n + 1] = o, o = o >> 8, t[n] = o, n + 8;
}
p.prototype.writeBigUInt64LE = $e(function(e, n = 0) {
  return Q1(this, e, n, BigInt(0), BigInt("0xffffffffffffffff"));
});
p.prototype.writeBigUInt64BE = $e(function(e, n = 0) {
  return Y1(this, e, n, BigInt(0), BigInt("0xffffffffffffffff"));
});
p.prototype.writeIntLE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, !i) {
    const u = Math.pow(2, 8 * r - 1);
    ae(this, e, n, r, u - 1, -u);
  }
  let s = 0, o = 1, l = 0;
  for (this[n] = e & 255; ++s < r && (o *= 256); )
    e < 0 && l === 0 && this[n + s - 1] !== 0 && (l = 1), this[n + s] = Math.trunc(e / o) - l & 255;
  return n + r;
};
p.prototype.writeIntBE = function(e, n, r, i) {
  if (e = +e, n = n >>> 0, !i) {
    const u = Math.pow(2, 8 * r - 1);
    ae(this, e, n, r, u - 1, -u);
  }
  let s = r - 1, o = 1, l = 0;
  for (this[n + s] = e & 255; --s >= 0 && (o *= 256); )
    e < 0 && l === 0 && this[n + s + 1] !== 0 && (l = 1), this[n + s] = Math.trunc(e / o) - l & 255;
  return n + r;
};
p.prototype.writeInt8 = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[n] = e & 255, n + 1;
};
p.prototype.writeInt16LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 2, 32767, -32768), this[n] = e & 255, this[n + 1] = e >>> 8, n + 2;
};
p.prototype.writeInt16BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 2, 32767, -32768), this[n] = e >>> 8, this[n + 1] = e & 255, n + 2;
};
p.prototype.writeInt32LE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 4, 2147483647, -2147483648), this[n] = e & 255, this[n + 1] = e >>> 8, this[n + 2] = e >>> 16, this[n + 3] = e >>> 24, n + 4;
};
p.prototype.writeInt32BE = function(e, n, r) {
  return e = +e, n = n >>> 0, r || ae(this, e, n, 4, 2147483647, -2147483648), e < 0 && (e = 4294967295 + e + 1), this[n] = e >>> 24, this[n + 1] = e >>> 16, this[n + 2] = e >>> 8, this[n + 3] = e & 255, n + 4;
};
p.prototype.writeBigInt64LE = $e(function(e, n = 0) {
  return Q1(this, e, n, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
p.prototype.writeBigInt64BE = $e(function(e, n = 0) {
  return Y1(this, e, n, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
function X1(t, e, n, r, i, s) {
  if (n + r > t.length)
    throw new RangeError("Index out of range");
  if (n < 0)
    throw new RangeError("Index out of range");
}
function J1(t, e, n, r, i) {
  return e = +e, n = n >>> 0, i || X1(t, e, n, 4), W1(t, e, n, r, 23, 4), n + 4;
}
p.prototype.writeFloatLE = function(e, n, r) {
  return J1(this, e, n, !0, r);
};
p.prototype.writeFloatBE = function(e, n, r) {
  return J1(this, e, n, !1, r);
};
function Z1(t, e, n, r, i) {
  return e = +e, n = n >>> 0, i || X1(t, e, n, 8), W1(t, e, n, r, 52, 8), n + 8;
}
p.prototype.writeDoubleLE = function(e, n, r) {
  return Z1(this, e, n, !0, r);
};
p.prototype.writeDoubleBE = function(e, n, r) {
  return Z1(this, e, n, !1, r);
};
p.prototype.copy = function(e, n, r, i) {
  if (!p.isBuffer(e))
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
p.prototype.fill = function(e, n, r, i) {
  if (typeof e == "string") {
    if (typeof n == "string" ? (i = n, n = 0, r = this.length) : typeof r == "string" && (i = r, r = this.length), i !== void 0 && typeof i != "string")
      throw new TypeError("encoding must be a string");
    if (typeof i == "string" && !p.isEncoding(i))
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
    const o = p.isBuffer(e) ? e : p.from(e, i), l = o.length;
    if (l === 0)
      throw new TypeError('The value "' + e + '" is invalid for argument "value"');
    for (s = 0; s < r - n; ++s)
      this[s + n] = o[s % l];
  }
  return this;
};
const ht = {};
function wr(t, e, n) {
  ht[t] = class extends n {
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
wr("ERR_BUFFER_OUT_OF_BOUNDS", function(t) {
  return t ? `${t} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
}, RangeError);
wr("ERR_INVALID_ARG_TYPE", function(t, e) {
  return `The "${t}" argument must be of type number. Received type ${typeof e}`;
}, TypeError);
wr("ERR_OUT_OF_RANGE", function(t, e, n) {
  let r = `The value of "${t}" is out of range.`, i = n;
  return Number.isInteger(n) && Math.abs(n) > 2 ** 32 ? i = $r(String(n)) : typeof n == "bigint" && (i = String(n), (n > BigInt(2) ** BigInt(32) || n < -(BigInt(2) ** BigInt(32))) && (i = $r(i)), i += "n"), r += ` It must be ${e}. Received ${i}`, r;
}, RangeError);
function $r(t) {
  let e = "", n = t.length;
  const r = t[0] === "-" ? 1 : 0;
  for (; n >= r + 4; n -= 3)
    e = `_${t.slice(n - 3, n)}${e}`;
  return `${t.slice(0, n)}${e}`;
}
function Po(t, e, n) {
  yt(e, "offset"), (t[e] === void 0 || t[e + n] === void 0) && Ft(e, t.length - (n + 1));
}
function K1(t, e, n, r, i, s) {
  if (t > n || t < e) {
    const o = typeof e == "bigint" ? "n" : "";
    let l;
    throw l = e === 0 || e === BigInt(0) ? `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}`, new ht.ERR_OUT_OF_RANGE("value", l, t);
  }
  Po(r, i, s);
}
function yt(t, e) {
  if (typeof t != "number")
    throw new ht.ERR_INVALID_ARG_TYPE(e, "number", t);
}
function Ft(t, e, n) {
  throw Math.floor(t) !== t ? (yt(t, n), new ht.ERR_OUT_OF_RANGE("offset", "an integer", t)) : e < 0 ? new ht.ERR_BUFFER_OUT_OF_BOUNDS() : new ht.ERR_OUT_OF_RANGE("offset", `>= 0 and <= ${e}`, t);
}
const Bo = /[^\w+/-]/g;
function Fo(t) {
  if (t = t.split("=")[0], t = t.trim().replace(Bo, ""), t.length < 2)
    return "";
  for (; t.length % 4 !== 0; )
    t = t + "=";
  return t;
}
function On(t, e) {
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
function Do(t) {
  const e = [];
  for (let n = 0; n < t.length; ++n)
    e.push(t.charCodeAt(n) & 255);
  return e;
}
function Uo(t, e) {
  let n, r, i;
  const s = [];
  for (let o = 0; o < t.length && !((e -= 2) < 0); ++o)
    n = t.charCodeAt(o), r = n >> 8, i = n % 256, s.push(i, r);
  return s;
}
function es(t) {
  return fo(Fo(t));
}
function yn(t, e, n, r) {
  let i;
  for (i = 0; i < r && !(i + n >= e.length || i >= t.length); ++i)
    e[i + n] = t[i];
  return i;
}
function Ne(t, e) {
  return t instanceof e || t != null && t.constructor != null && t.constructor.name != null && t.constructor.name === e.name;
}
function xr(t) {
  return t !== t;
}
const Vo = (function() {
  const t = "0123456789abcdef", e = Array.from({ length: 256 });
  for (let n = 0; n < 16; ++n) {
    const r = n * 16;
    for (let i = 0; i < 16; ++i)
      e[r + i] = t[n] + t[i];
  }
  return e;
})();
function $e(t) {
  return typeof BigInt > "u" ? qo : t;
}
function qo() {
  throw new Error("BigInt not supported");
}
const En = globalThis.Buffer || p;
globalThis.btoa.bind(globalThis);
globalThis.atob.bind(globalThis);
class $o extends ve {
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
      const i = typeof this._data == "string" ? En.from(this._data, this._encoding || n || "utf8") : this._data, s = typeof e == "string" ? En.from(e, n || this._encoding || "utf8") : e;
      this._data = En.concat([i, s]);
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
const ts = globalThis.Writable || $o, Sn = class {
  allowHalfOpen = !0;
  _destroy;
  constructor(t = new $1(), e = new ts()) {
    Object.assign(this, t), Object.assign(this, e), this._destroy = /* @__PURE__ */ lo(t._destroy, e._destroy);
  }
};
function Wo() {
  return Object.assign(Sn.prototype, $1.prototype), Object.assign(Sn.prototype, ts.prototype), Sn;
}
const Ho = /* @__PURE__ */ Wo(), Oo = globalThis.Duplex || Ho;
class ns extends Oo {
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
class zo extends ns {
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
class Wr extends ns {
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
class Lr extends ve {
  env;
  hrtime;
  nextTick;
  constructor(e) {
    super(), this.env = e.env, this.hrtime = e.hrtime, this.nextTick = e.nextTick;
    for (const n of [...Object.getOwnPropertyNames(Lr.prototype), ...Object.getOwnPropertyNames(ve.prototype)]) {
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
    return this.#t ??= new zo(0);
  }
  get stdout() {
    return this.#n ??= new Wr(1);
  }
  get stderr() {
    return this.#r ??= new Wr(2);
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
    throw /* @__PURE__ */ q("process.umask");
  }
  getBuiltinModule() {
  }
  getActiveResourcesInfo() {
    throw /* @__PURE__ */ q("process.getActiveResourcesInfo");
  }
  exit() {
    throw /* @__PURE__ */ q("process.exit");
  }
  reallyExit() {
    throw /* @__PURE__ */ q("process.reallyExit");
  }
  kill() {
    throw /* @__PURE__ */ q("process.kill");
  }
  abort() {
    throw /* @__PURE__ */ q("process.abort");
  }
  dlopen() {
    throw /* @__PURE__ */ q("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw /* @__PURE__ */ q("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw /* @__PURE__ */ q("process.loadEnvFile");
  }
  disconnect() {
    throw /* @__PURE__ */ q("process.disconnect");
  }
  cpuUsage() {
    throw /* @__PURE__ */ q("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ q("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw /* @__PURE__ */ q("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw /* @__PURE__ */ q("process.initgroups");
  }
  openStdin() {
    throw /* @__PURE__ */ q("process.openStdin");
  }
  assert() {
    throw /* @__PURE__ */ q("process.assert");
  }
  binding() {
    throw /* @__PURE__ */ q("process.binding");
  }
  permission = { has: /* @__PURE__ */ Ye("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: !1,
    reportOnFatalError: !1,
    reportOnSignal: !1,
    reportOnUncaughtException: !1,
    getReport: /* @__PURE__ */ Ye("process.report.getReport"),
    writeReport: /* @__PURE__ */ Ye("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ Ye("process.finalization.register"),
    unregister: /* @__PURE__ */ Ye("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ Ye("process.finalization.registerBeforeExit")
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
const $t = /* @__PURE__ */ Object.create(null), jo = globalThis.process, Xe = (t) => globalThis.__env__ || jo?.env || (t ? $t : globalThis), Go = /* @__PURE__ */ new Proxy($t, {
  get(t, e) {
    return Xe()[e] ?? $t[e];
  },
  has(t, e) {
    const n = Xe();
    return e in n || e in $t;
  },
  set(t, e, n) {
    const r = Xe(!0);
    return r[e] = n, !0;
  },
  deleteProperty(t, e) {
    const n = Xe(!0);
    return delete n[e], !0;
  },
  ownKeys() {
    const t = Xe();
    return Object.keys(t);
  },
  getOwnPropertyDescriptor(t, e) {
    const n = Xe();
    if (e in n)
      return {
        value: n[e],
        writable: !0,
        enumerable: !0,
        configurable: !0
      };
  }
}), Qo = /* @__PURE__ */ Object.assign(function(e) {
  const n = Date.now(), r = Math.trunc(n / 1e3), i = n % 1e3 * 1e6;
  if (e) {
    let s = r - e[0], o = i - e[0];
    return o < 0 && (s = s - 1, o = 1e9 + o), [s, o];
  }
  return [r, i];
}, { bigint: function() {
  return BigInt(Date.now() * 1e6);
} }), Yo = globalThis.queueMicrotask ? (t, ...e) => {
  globalThis.queueMicrotask(t.bind(void 0, ...e));
} : /* @__PURE__ */ Xo();
function Xo() {
  let t = [], e = !1, n, r = -1;
  function i() {
    !e || !n || (e = !1, n.length > 0 ? t = [...n, ...t] : r = -1, t.length > 0 && s());
  }
  function s() {
    if (e)
      return;
    const l = setTimeout(i);
    e = !0;
    let u = t.length;
    for (; u; ) {
      for (n = t, t = []; ++r < u; )
        n && n[r]();
      r = -1, u = t.length;
    }
    n = void 0, e = !1, clearTimeout(l);
  }
  return (l, ...u) => {
    t.push(l.bind(void 0, ...u)), t.length === 1 && !e && setTimeout(s);
  };
}
const ye = new Lr({
  env: Go,
  hrtime: Qo,
  nextTick: Yo
}), { abort: S0, addListener: A0, allowedNodeEnvironmentFlags: R0, hasUncaughtExceptionCaptureCallback: C0, setUncaughtExceptionCaptureCallback: M0, loadEnvFile: k0, sourceMapsEnabled: I0, arch: T0, argv: P0, argv0: B0, chdir: F0, config: D0, connected: U0, constrainedMemory: V0, availableMemory: q0, cpuUsage: $0, cwd: W0, debugPort: H0, dlopen: O0, disconnect: z0, emit: j0, emitWarning: G0, env: Q0, eventNames: Y0, execArgv: X0, execPath: J0, exit: Z0, finalization: K0, features: eu, getBuiltinModule: tu, getActiveResourcesInfo: nu, getMaxListeners: ru, hrtime: iu, kill: su, listeners: ou, listenerCount: au, memoryUsage: lu, nextTick: uu, on: cu, off: hu, once: fu, pid: mu, platform: du, ppid: gu, prependListener: pu, prependOnceListener: bu, rawListeners: yu, release: _u, removeAllListeners: wu, removeListener: xu, report: Lu, resourceUsage: vu, setMaxListeners: Nu, setSourceMapsEnabled: Eu, stderr: Su, stdin: Au, stdout: Ru, title: Cu, umask: Mu, uptime: ku, version: Iu, versions: Tu, domain: Pu, initgroups: Bu, moduleLoadList: Fu, reallyExit: Du, openStdin: Uu, assert: Vu, binding: qu, send: $u, exitCode: Wu, channel: Hu, getegid: Ou, geteuid: zu, getgid: ju, getgroups: Gu, getuid: Qu, setegid: Yu, seteuid: Xu, setgid: Ju, setgroups: Zu, setuid: Ku, permission: e2, mainModule: t2, ref: n2, unref: r2, _events: i2, _eventsCount: s2, _exiting: o2, _maxListeners: a2, _debugEnd: l2, _debugProcess: u2, _fatalException: c2, _getActiveHandles: h2, _getActiveRequests: f2, _kill: m2, _preload_modules: d2, _rawDebug: g2, _startProfilerIdleNotifier: p2, _stopProfilerIdleNotifier: b2, _tickCallback: y2, _disconnect: _2, _handleQueue: w2, _pendingMessage: x2, _channel: L2, _send: v2, _linkedBinding: N2 } = ye;
function Jo() {
  return globalThis._VSCODE_NLS_MESSAGES;
}
function rs() {
  return globalThis._VSCODE_NLS_LANGUAGE;
}
const Zo = rs() === "pseudo" || typeof document < "u" && document.location && document.location.hash.indexOf("pseudo=true") >= 0;
function Hr(t, e) {
  let n;
  return e.length === 0 ? n = t : n = t.replace(/\{(\d+)\}/g, (r, i) => {
    const s = i[0], o = e[s];
    let l = r;
    return typeof o == "string" ? l = o : (typeof o == "number" || typeof o == "boolean" || o === void 0 || o === null) && (l = String(o)), l;
  }), Zo && (n = "［" + n.replace(/[aouei]/g, "$&$&") + "］"), n;
}
function j(t, e, ...n) {
  return Hr(typeof t == "number" ? Ko(t, e) : e, n);
}
function Ko(t, e) {
  const n = Jo()?.[t];
  if (typeof n != "string") {
    if (typeof e == "string")
      return e;
    throw new Error(`!!! NLS MISSING: ${t} !!!`);
  }
  return n;
}
const it = "en";
let zn = !1, jn = !1, An = !1, is = !1, vr = !1, Vt, Rn = it, Or = it, ea, Se;
const Ce = globalThis;
let ue;
typeof Ce.vscode < "u" && typeof Ce.vscode.process < "u" ? ue = Ce.vscode.process : typeof ye < "u" && typeof ye?.versions?.node == "string" && (ue = ye);
const ta = typeof ue?.versions?.electron == "string", na = ta && ue?.type === "renderer";
if (typeof ue == "object") {
  zn = ue.platform === "win32", jn = ue.platform === "darwin", An = ue.platform === "linux", An && ue.env.SNAP && ue.env.SNAP_REVISION, ue.env.CI || ue.env.BUILD_ARTIFACTSTAGINGDIRECTORY, Vt = it, Rn = it;
  const t = ue.env.VSCODE_NLS_CONFIG;
  if (t)
    try {
      const e = JSON.parse(t);
      Vt = e.userLocale, Or = e.osLocale, Rn = e.resolvedLanguage || it, ea = e.languagePack?.translationsConfigFile;
    } catch {
    }
  is = !0;
} else typeof navigator == "object" && !na ? (Se = navigator.userAgent, zn = Se.indexOf("Windows") >= 0, jn = Se.indexOf("Macintosh") >= 0, (Se.indexOf("Macintosh") >= 0 || Se.indexOf("iPad") >= 0 || Se.indexOf("iPhone") >= 0) && navigator.maxTouchPoints && navigator.maxTouchPoints > 0, An = Se.indexOf("Linux") >= 0, Se?.indexOf("Mobi") >= 0, vr = !0, Rn = rs() || it, Vt = navigator.language.toLowerCase(), Or = Vt) : console.error("Unable to resolve platform.");
const It = zn, ra = jn, ia = is, sa = vr, oa = vr && typeof Ce.importScripts == "function", aa = oa ? Ce.origin : void 0, Ee = Se, la = typeof Ce.postMessage == "function" && !Ce.importScripts;
(() => {
  if (la) {
    const t = [];
    Ce.addEventListener("message", (n) => {
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
      }), Ce.postMessage({ vscodeScheduleAsyncWork: r }, "*");
    };
  }
  return (t) => setTimeout(t);
})();
const ua = !!(Ee && Ee.indexOf("Chrome") >= 0);
Ee && Ee.indexOf("Firefox") >= 0;
!ua && Ee && Ee.indexOf("Safari") >= 0;
Ee && Ee.indexOf("Edg/") >= 0;
Ee && Ee.indexOf("Android") >= 0;
function ca(t) {
  return t;
}
class ha {
  constructor(e, n) {
    this.lastCache = void 0, this.lastArgKey = void 0, typeof e == "function" ? (this._fn = e, this._computeKey = ca) : (this._fn = n, this._computeKey = e.getCacheKey);
  }
  get(e) {
    const n = this._computeKey(e);
    return this.lastArgKey !== n && (this.lastArgKey = n, this.lastCache = this._fn(e)), this.lastCache;
  }
}
class zr {
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
function fa(t) {
  return t.replace(/[\\\{\}\*\+\?\|\^\$\.\[\]\(\)]/g, "\\$&");
}
function ma(t) {
  return t.split(/\r\n|\r|\n/);
}
function da(t) {
  for (let e = 0, n = t.length; e < n; e++) {
    const r = t.charCodeAt(e);
    if (r !== 32 && r !== 9)
      return e;
  }
  return -1;
}
function ga(t, e = t.length - 1) {
  for (let n = e; n >= 0; n--) {
    const r = t.charCodeAt(n);
    if (r !== 32 && r !== 9)
      return n;
  }
  return -1;
}
function ss(t) {
  return t >= 65 && t <= 90;
}
function Kt(t) {
  return 55296 <= t && t <= 56319;
}
function Gn(t) {
  return 56320 <= t && t <= 57343;
}
function os(t, e) {
  return (t - 55296 << 10) + (e - 56320) + 65536;
}
function pa(t, e, n) {
  const r = t.charCodeAt(n);
  if (Kt(r) && n + 1 < e) {
    const i = t.charCodeAt(n + 1);
    if (Gn(i))
      return os(r, i);
  }
  return r;
}
const ba = /^[\t\n\r\x20-\x7E]*$/;
function ya(t) {
  return ba.test(t);
}
const He = class He {
  static getInstance() {
    return He._INSTANCE || (He._INSTANCE = new He()), He._INSTANCE;
  }
  constructor() {
    this._data = _a();
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
He._INSTANCE = null;
let jr = He;
function _a() {
  return JSON.parse("[0,0,0,51229,51255,12,44061,44087,12,127462,127487,6,7083,7085,5,47645,47671,12,54813,54839,12,128678,128678,14,3270,3270,5,9919,9923,14,45853,45879,12,49437,49463,12,53021,53047,12,71216,71218,7,128398,128399,14,129360,129374,14,2519,2519,5,4448,4519,9,9742,9742,14,12336,12336,14,44957,44983,12,46749,46775,12,48541,48567,12,50333,50359,12,52125,52151,12,53917,53943,12,69888,69890,5,73018,73018,5,127990,127990,14,128558,128559,14,128759,128760,14,129653,129655,14,2027,2035,5,2891,2892,7,3761,3761,5,6683,6683,5,8293,8293,4,9825,9826,14,9999,9999,14,43452,43453,5,44509,44535,12,45405,45431,12,46301,46327,12,47197,47223,12,48093,48119,12,48989,49015,12,49885,49911,12,50781,50807,12,51677,51703,12,52573,52599,12,53469,53495,12,54365,54391,12,65279,65279,4,70471,70472,7,72145,72147,7,119173,119179,5,127799,127818,14,128240,128244,14,128512,128512,14,128652,128652,14,128721,128722,14,129292,129292,14,129445,129450,14,129734,129743,14,1476,1477,5,2366,2368,7,2750,2752,7,3076,3076,5,3415,3415,5,4141,4144,5,6109,6109,5,6964,6964,5,7394,7400,5,9197,9198,14,9770,9770,14,9877,9877,14,9968,9969,14,10084,10084,14,43052,43052,5,43713,43713,5,44285,44311,12,44733,44759,12,45181,45207,12,45629,45655,12,46077,46103,12,46525,46551,12,46973,46999,12,47421,47447,12,47869,47895,12,48317,48343,12,48765,48791,12,49213,49239,12,49661,49687,12,50109,50135,12,50557,50583,12,51005,51031,12,51453,51479,12,51901,51927,12,52349,52375,12,52797,52823,12,53245,53271,12,53693,53719,12,54141,54167,12,54589,54615,12,55037,55063,12,69506,69509,5,70191,70193,5,70841,70841,7,71463,71467,5,72330,72342,5,94031,94031,5,123628,123631,5,127763,127765,14,127941,127941,14,128043,128062,14,128302,128317,14,128465,128467,14,128539,128539,14,128640,128640,14,128662,128662,14,128703,128703,14,128745,128745,14,129004,129007,14,129329,129330,14,129402,129402,14,129483,129483,14,129686,129704,14,130048,131069,14,173,173,4,1757,1757,1,2200,2207,5,2434,2435,7,2631,2632,5,2817,2817,5,3008,3008,5,3201,3201,5,3387,3388,5,3542,3542,5,3902,3903,7,4190,4192,5,6002,6003,5,6439,6440,5,6765,6770,7,7019,7027,5,7154,7155,7,8205,8205,13,8505,8505,14,9654,9654,14,9757,9757,14,9792,9792,14,9852,9853,14,9890,9894,14,9937,9937,14,9981,9981,14,10035,10036,14,11035,11036,14,42654,42655,5,43346,43347,7,43587,43587,5,44006,44007,7,44173,44199,12,44397,44423,12,44621,44647,12,44845,44871,12,45069,45095,12,45293,45319,12,45517,45543,12,45741,45767,12,45965,45991,12,46189,46215,12,46413,46439,12,46637,46663,12,46861,46887,12,47085,47111,12,47309,47335,12,47533,47559,12,47757,47783,12,47981,48007,12,48205,48231,12,48429,48455,12,48653,48679,12,48877,48903,12,49101,49127,12,49325,49351,12,49549,49575,12,49773,49799,12,49997,50023,12,50221,50247,12,50445,50471,12,50669,50695,12,50893,50919,12,51117,51143,12,51341,51367,12,51565,51591,12,51789,51815,12,52013,52039,12,52237,52263,12,52461,52487,12,52685,52711,12,52909,52935,12,53133,53159,12,53357,53383,12,53581,53607,12,53805,53831,12,54029,54055,12,54253,54279,12,54477,54503,12,54701,54727,12,54925,54951,12,55149,55175,12,68101,68102,5,69762,69762,7,70067,70069,7,70371,70378,5,70720,70721,7,71087,71087,5,71341,71341,5,71995,71996,5,72249,72249,7,72850,72871,5,73109,73109,5,118576,118598,5,121505,121519,5,127245,127247,14,127568,127569,14,127777,127777,14,127872,127891,14,127956,127967,14,128015,128016,14,128110,128172,14,128259,128259,14,128367,128368,14,128424,128424,14,128488,128488,14,128530,128532,14,128550,128551,14,128566,128566,14,128647,128647,14,128656,128656,14,128667,128673,14,128691,128693,14,128715,128715,14,128728,128732,14,128752,128752,14,128765,128767,14,129096,129103,14,129311,129311,14,129344,129349,14,129394,129394,14,129413,129425,14,129466,129471,14,129511,129535,14,129664,129666,14,129719,129722,14,129760,129767,14,917536,917631,5,13,13,2,1160,1161,5,1564,1564,4,1807,1807,1,2085,2087,5,2307,2307,7,2382,2383,7,2497,2500,5,2563,2563,7,2677,2677,5,2763,2764,7,2879,2879,5,2914,2915,5,3021,3021,5,3142,3144,5,3263,3263,5,3285,3286,5,3398,3400,7,3530,3530,5,3633,3633,5,3864,3865,5,3974,3975,5,4155,4156,7,4229,4230,5,5909,5909,7,6078,6085,7,6277,6278,5,6451,6456,7,6744,6750,5,6846,6846,5,6972,6972,5,7074,7077,5,7146,7148,7,7222,7223,5,7416,7417,5,8234,8238,4,8417,8417,5,9000,9000,14,9203,9203,14,9730,9731,14,9748,9749,14,9762,9763,14,9776,9783,14,9800,9811,14,9831,9831,14,9872,9873,14,9882,9882,14,9900,9903,14,9929,9933,14,9941,9960,14,9974,9974,14,9989,9989,14,10006,10006,14,10062,10062,14,10160,10160,14,11647,11647,5,12953,12953,14,43019,43019,5,43232,43249,5,43443,43443,5,43567,43568,7,43696,43696,5,43765,43765,7,44013,44013,5,44117,44143,12,44229,44255,12,44341,44367,12,44453,44479,12,44565,44591,12,44677,44703,12,44789,44815,12,44901,44927,12,45013,45039,12,45125,45151,12,45237,45263,12,45349,45375,12,45461,45487,12,45573,45599,12,45685,45711,12,45797,45823,12,45909,45935,12,46021,46047,12,46133,46159,12,46245,46271,12,46357,46383,12,46469,46495,12,46581,46607,12,46693,46719,12,46805,46831,12,46917,46943,12,47029,47055,12,47141,47167,12,47253,47279,12,47365,47391,12,47477,47503,12,47589,47615,12,47701,47727,12,47813,47839,12,47925,47951,12,48037,48063,12,48149,48175,12,48261,48287,12,48373,48399,12,48485,48511,12,48597,48623,12,48709,48735,12,48821,48847,12,48933,48959,12,49045,49071,12,49157,49183,12,49269,49295,12,49381,49407,12,49493,49519,12,49605,49631,12,49717,49743,12,49829,49855,12,49941,49967,12,50053,50079,12,50165,50191,12,50277,50303,12,50389,50415,12,50501,50527,12,50613,50639,12,50725,50751,12,50837,50863,12,50949,50975,12,51061,51087,12,51173,51199,12,51285,51311,12,51397,51423,12,51509,51535,12,51621,51647,12,51733,51759,12,51845,51871,12,51957,51983,12,52069,52095,12,52181,52207,12,52293,52319,12,52405,52431,12,52517,52543,12,52629,52655,12,52741,52767,12,52853,52879,12,52965,52991,12,53077,53103,12,53189,53215,12,53301,53327,12,53413,53439,12,53525,53551,12,53637,53663,12,53749,53775,12,53861,53887,12,53973,53999,12,54085,54111,12,54197,54223,12,54309,54335,12,54421,54447,12,54533,54559,12,54645,54671,12,54757,54783,12,54869,54895,12,54981,55007,12,55093,55119,12,55243,55291,10,66045,66045,5,68325,68326,5,69688,69702,5,69817,69818,5,69957,69958,7,70089,70092,5,70198,70199,5,70462,70462,5,70502,70508,5,70750,70750,5,70846,70846,7,71100,71101,5,71230,71230,7,71351,71351,5,71737,71738,5,72000,72000,7,72160,72160,5,72273,72278,5,72752,72758,5,72882,72883,5,73031,73031,5,73461,73462,7,94192,94193,7,119149,119149,7,121403,121452,5,122915,122916,5,126980,126980,14,127358,127359,14,127535,127535,14,127759,127759,14,127771,127771,14,127792,127793,14,127825,127867,14,127897,127899,14,127945,127945,14,127985,127986,14,128000,128007,14,128021,128021,14,128066,128100,14,128184,128235,14,128249,128252,14,128266,128276,14,128335,128335,14,128379,128390,14,128407,128419,14,128444,128444,14,128481,128481,14,128499,128499,14,128526,128526,14,128536,128536,14,128543,128543,14,128556,128556,14,128564,128564,14,128577,128580,14,128643,128645,14,128649,128649,14,128654,128654,14,128660,128660,14,128664,128664,14,128675,128675,14,128686,128689,14,128695,128696,14,128705,128709,14,128717,128719,14,128725,128725,14,128736,128741,14,128747,128748,14,128755,128755,14,128762,128762,14,128981,128991,14,129009,129023,14,129160,129167,14,129296,129304,14,129320,129327,14,129340,129342,14,129356,129356,14,129388,129392,14,129399,129400,14,129404,129407,14,129432,129442,14,129454,129455,14,129473,129474,14,129485,129487,14,129648,129651,14,129659,129660,14,129671,129679,14,129709,129711,14,129728,129730,14,129751,129753,14,129776,129782,14,917505,917505,4,917760,917999,5,10,10,3,127,159,4,768,879,5,1471,1471,5,1536,1541,1,1648,1648,5,1767,1768,5,1840,1866,5,2070,2073,5,2137,2139,5,2274,2274,1,2363,2363,7,2377,2380,7,2402,2403,5,2494,2494,5,2507,2508,7,2558,2558,5,2622,2624,7,2641,2641,5,2691,2691,7,2759,2760,5,2786,2787,5,2876,2876,5,2881,2884,5,2901,2902,5,3006,3006,5,3014,3016,7,3072,3072,5,3134,3136,5,3157,3158,5,3260,3260,5,3266,3266,5,3274,3275,7,3328,3329,5,3391,3392,7,3405,3405,5,3457,3457,5,3536,3537,7,3551,3551,5,3636,3642,5,3764,3772,5,3895,3895,5,3967,3967,7,3993,4028,5,4146,4151,5,4182,4183,7,4226,4226,5,4253,4253,5,4957,4959,5,5940,5940,7,6070,6070,7,6087,6088,7,6158,6158,4,6432,6434,5,6448,6449,7,6679,6680,5,6742,6742,5,6754,6754,5,6783,6783,5,6912,6915,5,6966,6970,5,6978,6978,5,7042,7042,7,7080,7081,5,7143,7143,7,7150,7150,7,7212,7219,5,7380,7392,5,7412,7412,5,8203,8203,4,8232,8232,4,8265,8265,14,8400,8412,5,8421,8432,5,8617,8618,14,9167,9167,14,9200,9200,14,9410,9410,14,9723,9726,14,9733,9733,14,9745,9745,14,9752,9752,14,9760,9760,14,9766,9766,14,9774,9774,14,9786,9786,14,9794,9794,14,9823,9823,14,9828,9828,14,9833,9850,14,9855,9855,14,9875,9875,14,9880,9880,14,9885,9887,14,9896,9897,14,9906,9916,14,9926,9927,14,9935,9935,14,9939,9939,14,9962,9962,14,9972,9972,14,9978,9978,14,9986,9986,14,9997,9997,14,10002,10002,14,10017,10017,14,10055,10055,14,10071,10071,14,10133,10135,14,10548,10549,14,11093,11093,14,12330,12333,5,12441,12442,5,42608,42610,5,43010,43010,5,43045,43046,5,43188,43203,7,43302,43309,5,43392,43394,5,43446,43449,5,43493,43493,5,43571,43572,7,43597,43597,7,43703,43704,5,43756,43757,5,44003,44004,7,44009,44010,7,44033,44059,12,44089,44115,12,44145,44171,12,44201,44227,12,44257,44283,12,44313,44339,12,44369,44395,12,44425,44451,12,44481,44507,12,44537,44563,12,44593,44619,12,44649,44675,12,44705,44731,12,44761,44787,12,44817,44843,12,44873,44899,12,44929,44955,12,44985,45011,12,45041,45067,12,45097,45123,12,45153,45179,12,45209,45235,12,45265,45291,12,45321,45347,12,45377,45403,12,45433,45459,12,45489,45515,12,45545,45571,12,45601,45627,12,45657,45683,12,45713,45739,12,45769,45795,12,45825,45851,12,45881,45907,12,45937,45963,12,45993,46019,12,46049,46075,12,46105,46131,12,46161,46187,12,46217,46243,12,46273,46299,12,46329,46355,12,46385,46411,12,46441,46467,12,46497,46523,12,46553,46579,12,46609,46635,12,46665,46691,12,46721,46747,12,46777,46803,12,46833,46859,12,46889,46915,12,46945,46971,12,47001,47027,12,47057,47083,12,47113,47139,12,47169,47195,12,47225,47251,12,47281,47307,12,47337,47363,12,47393,47419,12,47449,47475,12,47505,47531,12,47561,47587,12,47617,47643,12,47673,47699,12,47729,47755,12,47785,47811,12,47841,47867,12,47897,47923,12,47953,47979,12,48009,48035,12,48065,48091,12,48121,48147,12,48177,48203,12,48233,48259,12,48289,48315,12,48345,48371,12,48401,48427,12,48457,48483,12,48513,48539,12,48569,48595,12,48625,48651,12,48681,48707,12,48737,48763,12,48793,48819,12,48849,48875,12,48905,48931,12,48961,48987,12,49017,49043,12,49073,49099,12,49129,49155,12,49185,49211,12,49241,49267,12,49297,49323,12,49353,49379,12,49409,49435,12,49465,49491,12,49521,49547,12,49577,49603,12,49633,49659,12,49689,49715,12,49745,49771,12,49801,49827,12,49857,49883,12,49913,49939,12,49969,49995,12,50025,50051,12,50081,50107,12,50137,50163,12,50193,50219,12,50249,50275,12,50305,50331,12,50361,50387,12,50417,50443,12,50473,50499,12,50529,50555,12,50585,50611,12,50641,50667,12,50697,50723,12,50753,50779,12,50809,50835,12,50865,50891,12,50921,50947,12,50977,51003,12,51033,51059,12,51089,51115,12,51145,51171,12,51201,51227,12,51257,51283,12,51313,51339,12,51369,51395,12,51425,51451,12,51481,51507,12,51537,51563,12,51593,51619,12,51649,51675,12,51705,51731,12,51761,51787,12,51817,51843,12,51873,51899,12,51929,51955,12,51985,52011,12,52041,52067,12,52097,52123,12,52153,52179,12,52209,52235,12,52265,52291,12,52321,52347,12,52377,52403,12,52433,52459,12,52489,52515,12,52545,52571,12,52601,52627,12,52657,52683,12,52713,52739,12,52769,52795,12,52825,52851,12,52881,52907,12,52937,52963,12,52993,53019,12,53049,53075,12,53105,53131,12,53161,53187,12,53217,53243,12,53273,53299,12,53329,53355,12,53385,53411,12,53441,53467,12,53497,53523,12,53553,53579,12,53609,53635,12,53665,53691,12,53721,53747,12,53777,53803,12,53833,53859,12,53889,53915,12,53945,53971,12,54001,54027,12,54057,54083,12,54113,54139,12,54169,54195,12,54225,54251,12,54281,54307,12,54337,54363,12,54393,54419,12,54449,54475,12,54505,54531,12,54561,54587,12,54617,54643,12,54673,54699,12,54729,54755,12,54785,54811,12,54841,54867,12,54897,54923,12,54953,54979,12,55009,55035,12,55065,55091,12,55121,55147,12,55177,55203,12,65024,65039,5,65520,65528,4,66422,66426,5,68152,68154,5,69291,69292,5,69633,69633,5,69747,69748,5,69811,69814,5,69826,69826,5,69932,69932,7,70016,70017,5,70079,70080,7,70095,70095,5,70196,70196,5,70367,70367,5,70402,70403,7,70464,70464,5,70487,70487,5,70709,70711,7,70725,70725,7,70833,70834,7,70843,70844,7,70849,70849,7,71090,71093,5,71103,71104,5,71227,71228,7,71339,71339,5,71344,71349,5,71458,71461,5,71727,71735,5,71985,71989,7,71998,71998,5,72002,72002,7,72154,72155,5,72193,72202,5,72251,72254,5,72281,72283,5,72344,72345,5,72766,72766,7,72874,72880,5,72885,72886,5,73023,73029,5,73104,73105,5,73111,73111,5,92912,92916,5,94095,94098,5,113824,113827,4,119142,119142,7,119155,119162,4,119362,119364,5,121476,121476,5,122888,122904,5,123184,123190,5,125252,125258,5,127183,127183,14,127340,127343,14,127377,127386,14,127491,127503,14,127548,127551,14,127744,127756,14,127761,127761,14,127769,127769,14,127773,127774,14,127780,127788,14,127796,127797,14,127820,127823,14,127869,127869,14,127894,127895,14,127902,127903,14,127943,127943,14,127947,127950,14,127972,127972,14,127988,127988,14,127992,127994,14,128009,128011,14,128019,128019,14,128023,128041,14,128064,128064,14,128102,128107,14,128174,128181,14,128238,128238,14,128246,128247,14,128254,128254,14,128264,128264,14,128278,128299,14,128329,128330,14,128348,128359,14,128371,128377,14,128392,128393,14,128401,128404,14,128421,128421,14,128433,128434,14,128450,128452,14,128476,128478,14,128483,128483,14,128495,128495,14,128506,128506,14,128519,128520,14,128528,128528,14,128534,128534,14,128538,128538,14,128540,128542,14,128544,128549,14,128552,128555,14,128557,128557,14,128560,128563,14,128565,128565,14,128567,128576,14,128581,128591,14,128641,128642,14,128646,128646,14,128648,128648,14,128650,128651,14,128653,128653,14,128655,128655,14,128657,128659,14,128661,128661,14,128663,128663,14,128665,128666,14,128674,128674,14,128676,128677,14,128679,128685,14,128690,128690,14,128694,128694,14,128697,128702,14,128704,128704,14,128710,128714,14,128716,128716,14,128720,128720,14,128723,128724,14,128726,128727,14,128733,128735,14,128742,128744,14,128746,128746,14,128749,128751,14,128753,128754,14,128756,128758,14,128761,128761,14,128763,128764,14,128884,128895,14,128992,129003,14,129008,129008,14,129036,129039,14,129114,129119,14,129198,129279,14,129293,129295,14,129305,129310,14,129312,129319,14,129328,129328,14,129331,129338,14,129343,129343,14,129351,129355,14,129357,129359,14,129375,129387,14,129393,129393,14,129395,129398,14,129401,129401,14,129403,129403,14,129408,129412,14,129426,129431,14,129443,129444,14,129451,129453,14,129456,129465,14,129472,129472,14,129475,129482,14,129484,129484,14,129488,129510,14,129536,129647,14,129652,129652,14,129656,129658,14,129661,129663,14,129667,129670,14,129680,129685,14,129705,129708,14,129712,129718,14,129723,129727,14,129731,129733,14,129744,129750,14,129754,129759,14,129768,129775,14,129783,129791,14,917504,917504,4,917506,917535,4,917632,917759,4,918000,921599,4,0,9,4,11,12,4,14,31,4,169,169,14,174,174,14,1155,1159,5,1425,1469,5,1473,1474,5,1479,1479,5,1552,1562,5,1611,1631,5,1750,1756,5,1759,1764,5,1770,1773,5,1809,1809,5,1958,1968,5,2045,2045,5,2075,2083,5,2089,2093,5,2192,2193,1,2250,2273,5,2275,2306,5,2362,2362,5,2364,2364,5,2369,2376,5,2381,2381,5,2385,2391,5,2433,2433,5,2492,2492,5,2495,2496,7,2503,2504,7,2509,2509,5,2530,2531,5,2561,2562,5,2620,2620,5,2625,2626,5,2635,2637,5,2672,2673,5,2689,2690,5,2748,2748,5,2753,2757,5,2761,2761,7,2765,2765,5,2810,2815,5,2818,2819,7,2878,2878,5,2880,2880,7,2887,2888,7,2893,2893,5,2903,2903,5,2946,2946,5,3007,3007,7,3009,3010,7,3018,3020,7,3031,3031,5,3073,3075,7,3132,3132,5,3137,3140,7,3146,3149,5,3170,3171,5,3202,3203,7,3262,3262,7,3264,3265,7,3267,3268,7,3271,3272,7,3276,3277,5,3298,3299,5,3330,3331,7,3390,3390,5,3393,3396,5,3402,3404,7,3406,3406,1,3426,3427,5,3458,3459,7,3535,3535,5,3538,3540,5,3544,3550,7,3570,3571,7,3635,3635,7,3655,3662,5,3763,3763,7,3784,3789,5,3893,3893,5,3897,3897,5,3953,3966,5,3968,3972,5,3981,3991,5,4038,4038,5,4145,4145,7,4153,4154,5,4157,4158,5,4184,4185,5,4209,4212,5,4228,4228,7,4237,4237,5,4352,4447,8,4520,4607,10,5906,5908,5,5938,5939,5,5970,5971,5,6068,6069,5,6071,6077,5,6086,6086,5,6089,6099,5,6155,6157,5,6159,6159,5,6313,6313,5,6435,6438,7,6441,6443,7,6450,6450,5,6457,6459,5,6681,6682,7,6741,6741,7,6743,6743,7,6752,6752,5,6757,6764,5,6771,6780,5,6832,6845,5,6847,6862,5,6916,6916,7,6965,6965,5,6971,6971,7,6973,6977,7,6979,6980,7,7040,7041,5,7073,7073,7,7078,7079,7,7082,7082,7,7142,7142,5,7144,7145,5,7149,7149,5,7151,7153,5,7204,7211,7,7220,7221,7,7376,7378,5,7393,7393,7,7405,7405,5,7415,7415,7,7616,7679,5,8204,8204,5,8206,8207,4,8233,8233,4,8252,8252,14,8288,8292,4,8294,8303,4,8413,8416,5,8418,8420,5,8482,8482,14,8596,8601,14,8986,8987,14,9096,9096,14,9193,9196,14,9199,9199,14,9201,9202,14,9208,9210,14,9642,9643,14,9664,9664,14,9728,9729,14,9732,9732,14,9735,9741,14,9743,9744,14,9746,9746,14,9750,9751,14,9753,9756,14,9758,9759,14,9761,9761,14,9764,9765,14,9767,9769,14,9771,9773,14,9775,9775,14,9784,9785,14,9787,9791,14,9793,9793,14,9795,9799,14,9812,9822,14,9824,9824,14,9827,9827,14,9829,9830,14,9832,9832,14,9851,9851,14,9854,9854,14,9856,9861,14,9874,9874,14,9876,9876,14,9878,9879,14,9881,9881,14,9883,9884,14,9888,9889,14,9895,9895,14,9898,9899,14,9904,9905,14,9917,9918,14,9924,9925,14,9928,9928,14,9934,9934,14,9936,9936,14,9938,9938,14,9940,9940,14,9961,9961,14,9963,9967,14,9970,9971,14,9973,9973,14,9975,9977,14,9979,9980,14,9982,9985,14,9987,9988,14,9992,9996,14,9998,9998,14,10000,10001,14,10004,10004,14,10013,10013,14,10024,10024,14,10052,10052,14,10060,10060,14,10067,10069,14,10083,10083,14,10085,10087,14,10145,10145,14,10175,10175,14,11013,11015,14,11088,11088,14,11503,11505,5,11744,11775,5,12334,12335,5,12349,12349,14,12951,12951,14,42607,42607,5,42612,42621,5,42736,42737,5,43014,43014,5,43043,43044,7,43047,43047,7,43136,43137,7,43204,43205,5,43263,43263,5,43335,43345,5,43360,43388,8,43395,43395,7,43444,43445,7,43450,43451,7,43454,43456,7,43561,43566,5,43569,43570,5,43573,43574,5,43596,43596,5,43644,43644,5,43698,43700,5,43710,43711,5,43755,43755,7,43758,43759,7,43766,43766,5,44005,44005,5,44008,44008,5,44012,44012,7,44032,44032,11,44060,44060,11,44088,44088,11,44116,44116,11,44144,44144,11,44172,44172,11,44200,44200,11,44228,44228,11,44256,44256,11,44284,44284,11,44312,44312,11,44340,44340,11,44368,44368,11,44396,44396,11,44424,44424,11,44452,44452,11,44480,44480,11,44508,44508,11,44536,44536,11,44564,44564,11,44592,44592,11,44620,44620,11,44648,44648,11,44676,44676,11,44704,44704,11,44732,44732,11,44760,44760,11,44788,44788,11,44816,44816,11,44844,44844,11,44872,44872,11,44900,44900,11,44928,44928,11,44956,44956,11,44984,44984,11,45012,45012,11,45040,45040,11,45068,45068,11,45096,45096,11,45124,45124,11,45152,45152,11,45180,45180,11,45208,45208,11,45236,45236,11,45264,45264,11,45292,45292,11,45320,45320,11,45348,45348,11,45376,45376,11,45404,45404,11,45432,45432,11,45460,45460,11,45488,45488,11,45516,45516,11,45544,45544,11,45572,45572,11,45600,45600,11,45628,45628,11,45656,45656,11,45684,45684,11,45712,45712,11,45740,45740,11,45768,45768,11,45796,45796,11,45824,45824,11,45852,45852,11,45880,45880,11,45908,45908,11,45936,45936,11,45964,45964,11,45992,45992,11,46020,46020,11,46048,46048,11,46076,46076,11,46104,46104,11,46132,46132,11,46160,46160,11,46188,46188,11,46216,46216,11,46244,46244,11,46272,46272,11,46300,46300,11,46328,46328,11,46356,46356,11,46384,46384,11,46412,46412,11,46440,46440,11,46468,46468,11,46496,46496,11,46524,46524,11,46552,46552,11,46580,46580,11,46608,46608,11,46636,46636,11,46664,46664,11,46692,46692,11,46720,46720,11,46748,46748,11,46776,46776,11,46804,46804,11,46832,46832,11,46860,46860,11,46888,46888,11,46916,46916,11,46944,46944,11,46972,46972,11,47000,47000,11,47028,47028,11,47056,47056,11,47084,47084,11,47112,47112,11,47140,47140,11,47168,47168,11,47196,47196,11,47224,47224,11,47252,47252,11,47280,47280,11,47308,47308,11,47336,47336,11,47364,47364,11,47392,47392,11,47420,47420,11,47448,47448,11,47476,47476,11,47504,47504,11,47532,47532,11,47560,47560,11,47588,47588,11,47616,47616,11,47644,47644,11,47672,47672,11,47700,47700,11,47728,47728,11,47756,47756,11,47784,47784,11,47812,47812,11,47840,47840,11,47868,47868,11,47896,47896,11,47924,47924,11,47952,47952,11,47980,47980,11,48008,48008,11,48036,48036,11,48064,48064,11,48092,48092,11,48120,48120,11,48148,48148,11,48176,48176,11,48204,48204,11,48232,48232,11,48260,48260,11,48288,48288,11,48316,48316,11,48344,48344,11,48372,48372,11,48400,48400,11,48428,48428,11,48456,48456,11,48484,48484,11,48512,48512,11,48540,48540,11,48568,48568,11,48596,48596,11,48624,48624,11,48652,48652,11,48680,48680,11,48708,48708,11,48736,48736,11,48764,48764,11,48792,48792,11,48820,48820,11,48848,48848,11,48876,48876,11,48904,48904,11,48932,48932,11,48960,48960,11,48988,48988,11,49016,49016,11,49044,49044,11,49072,49072,11,49100,49100,11,49128,49128,11,49156,49156,11,49184,49184,11,49212,49212,11,49240,49240,11,49268,49268,11,49296,49296,11,49324,49324,11,49352,49352,11,49380,49380,11,49408,49408,11,49436,49436,11,49464,49464,11,49492,49492,11,49520,49520,11,49548,49548,11,49576,49576,11,49604,49604,11,49632,49632,11,49660,49660,11,49688,49688,11,49716,49716,11,49744,49744,11,49772,49772,11,49800,49800,11,49828,49828,11,49856,49856,11,49884,49884,11,49912,49912,11,49940,49940,11,49968,49968,11,49996,49996,11,50024,50024,11,50052,50052,11,50080,50080,11,50108,50108,11,50136,50136,11,50164,50164,11,50192,50192,11,50220,50220,11,50248,50248,11,50276,50276,11,50304,50304,11,50332,50332,11,50360,50360,11,50388,50388,11,50416,50416,11,50444,50444,11,50472,50472,11,50500,50500,11,50528,50528,11,50556,50556,11,50584,50584,11,50612,50612,11,50640,50640,11,50668,50668,11,50696,50696,11,50724,50724,11,50752,50752,11,50780,50780,11,50808,50808,11,50836,50836,11,50864,50864,11,50892,50892,11,50920,50920,11,50948,50948,11,50976,50976,11,51004,51004,11,51032,51032,11,51060,51060,11,51088,51088,11,51116,51116,11,51144,51144,11,51172,51172,11,51200,51200,11,51228,51228,11,51256,51256,11,51284,51284,11,51312,51312,11,51340,51340,11,51368,51368,11,51396,51396,11,51424,51424,11,51452,51452,11,51480,51480,11,51508,51508,11,51536,51536,11,51564,51564,11,51592,51592,11,51620,51620,11,51648,51648,11,51676,51676,11,51704,51704,11,51732,51732,11,51760,51760,11,51788,51788,11,51816,51816,11,51844,51844,11,51872,51872,11,51900,51900,11,51928,51928,11,51956,51956,11,51984,51984,11,52012,52012,11,52040,52040,11,52068,52068,11,52096,52096,11,52124,52124,11,52152,52152,11,52180,52180,11,52208,52208,11,52236,52236,11,52264,52264,11,52292,52292,11,52320,52320,11,52348,52348,11,52376,52376,11,52404,52404,11,52432,52432,11,52460,52460,11,52488,52488,11,52516,52516,11,52544,52544,11,52572,52572,11,52600,52600,11,52628,52628,11,52656,52656,11,52684,52684,11,52712,52712,11,52740,52740,11,52768,52768,11,52796,52796,11,52824,52824,11,52852,52852,11,52880,52880,11,52908,52908,11,52936,52936,11,52964,52964,11,52992,52992,11,53020,53020,11,53048,53048,11,53076,53076,11,53104,53104,11,53132,53132,11,53160,53160,11,53188,53188,11,53216,53216,11,53244,53244,11,53272,53272,11,53300,53300,11,53328,53328,11,53356,53356,11,53384,53384,11,53412,53412,11,53440,53440,11,53468,53468,11,53496,53496,11,53524,53524,11,53552,53552,11,53580,53580,11,53608,53608,11,53636,53636,11,53664,53664,11,53692,53692,11,53720,53720,11,53748,53748,11,53776,53776,11,53804,53804,11,53832,53832,11,53860,53860,11,53888,53888,11,53916,53916,11,53944,53944,11,53972,53972,11,54000,54000,11,54028,54028,11,54056,54056,11,54084,54084,11,54112,54112,11,54140,54140,11,54168,54168,11,54196,54196,11,54224,54224,11,54252,54252,11,54280,54280,11,54308,54308,11,54336,54336,11,54364,54364,11,54392,54392,11,54420,54420,11,54448,54448,11,54476,54476,11,54504,54504,11,54532,54532,11,54560,54560,11,54588,54588,11,54616,54616,11,54644,54644,11,54672,54672,11,54700,54700,11,54728,54728,11,54756,54756,11,54784,54784,11,54812,54812,11,54840,54840,11,54868,54868,11,54896,54896,11,54924,54924,11,54952,54952,11,54980,54980,11,55008,55008,11,55036,55036,11,55064,55064,11,55092,55092,11,55120,55120,11,55148,55148,11,55176,55176,11,55216,55238,9,64286,64286,5,65056,65071,5,65438,65439,5,65529,65531,4,66272,66272,5,68097,68099,5,68108,68111,5,68159,68159,5,68900,68903,5,69446,69456,5,69632,69632,7,69634,69634,7,69744,69744,5,69759,69761,5,69808,69810,7,69815,69816,7,69821,69821,1,69837,69837,1,69927,69931,5,69933,69940,5,70003,70003,5,70018,70018,7,70070,70078,5,70082,70083,1,70094,70094,7,70188,70190,7,70194,70195,7,70197,70197,7,70206,70206,5,70368,70370,7,70400,70401,5,70459,70460,5,70463,70463,7,70465,70468,7,70475,70477,7,70498,70499,7,70512,70516,5,70712,70719,5,70722,70724,5,70726,70726,5,70832,70832,5,70835,70840,5,70842,70842,5,70845,70845,5,70847,70848,5,70850,70851,5,71088,71089,7,71096,71099,7,71102,71102,7,71132,71133,5,71219,71226,5,71229,71229,5,71231,71232,5,71340,71340,7,71342,71343,7,71350,71350,7,71453,71455,5,71462,71462,7,71724,71726,7,71736,71736,7,71984,71984,5,71991,71992,7,71997,71997,7,71999,71999,1,72001,72001,1,72003,72003,5,72148,72151,5,72156,72159,7,72164,72164,7,72243,72248,5,72250,72250,1,72263,72263,5,72279,72280,7,72324,72329,1,72343,72343,7,72751,72751,7,72760,72765,5,72767,72767,5,72873,72873,7,72881,72881,7,72884,72884,7,73009,73014,5,73020,73021,5,73030,73030,1,73098,73102,7,73107,73108,7,73110,73110,7,73459,73460,5,78896,78904,4,92976,92982,5,94033,94087,7,94180,94180,5,113821,113822,5,118528,118573,5,119141,119141,5,119143,119145,5,119150,119154,5,119163,119170,5,119210,119213,5,121344,121398,5,121461,121461,5,121499,121503,5,122880,122886,5,122907,122913,5,122918,122922,5,123566,123566,5,125136,125142,5,126976,126979,14,126981,127182,14,127184,127231,14,127279,127279,14,127344,127345,14,127374,127374,14,127405,127461,14,127489,127490,14,127514,127514,14,127538,127546,14,127561,127567,14,127570,127743,14,127757,127758,14,127760,127760,14,127762,127762,14,127766,127768,14,127770,127770,14,127772,127772,14,127775,127776,14,127778,127779,14,127789,127791,14,127794,127795,14,127798,127798,14,127819,127819,14,127824,127824,14,127868,127868,14,127870,127871,14,127892,127893,14,127896,127896,14,127900,127901,14,127904,127940,14,127942,127942,14,127944,127944,14,127946,127946,14,127951,127955,14,127968,127971,14,127973,127984,14,127987,127987,14,127989,127989,14,127991,127991,14,127995,127999,5,128008,128008,14,128012,128014,14,128017,128018,14,128020,128020,14,128022,128022,14,128042,128042,14,128063,128063,14,128065,128065,14,128101,128101,14,128108,128109,14,128173,128173,14,128182,128183,14,128236,128237,14,128239,128239,14,128245,128245,14,128248,128248,14,128253,128253,14,128255,128258,14,128260,128263,14,128265,128265,14,128277,128277,14,128300,128301,14,128326,128328,14,128331,128334,14,128336,128347,14,128360,128366,14,128369,128370,14,128378,128378,14,128391,128391,14,128394,128397,14,128400,128400,14,128405,128406,14,128420,128420,14,128422,128423,14,128425,128432,14,128435,128443,14,128445,128449,14,128453,128464,14,128468,128475,14,128479,128480,14,128482,128482,14,128484,128487,14,128489,128494,14,128496,128498,14,128500,128505,14,128507,128511,14,128513,128518,14,128521,128525,14,128527,128527,14,128529,128529,14,128533,128533,14,128535,128535,14,128537,128537,14]");
}
const _e = class _e {
  static getInstance(e) {
    return _e.cache.get(Array.from(e));
  }
  static getLocales() {
    return _e._locales.value;
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
_e.ambiguousCharacterData = new zr(() => JSON.parse('{"_common":[8232,32,8233,32,5760,32,8192,32,8193,32,8194,32,8195,32,8196,32,8197,32,8198,32,8200,32,8201,32,8202,32,8287,32,8199,32,8239,32,2042,95,65101,95,65102,95,65103,95,8208,45,8209,45,8210,45,65112,45,1748,45,8259,45,727,45,8722,45,10134,45,11450,45,1549,44,1643,44,8218,44,184,44,42233,44,894,59,2307,58,2691,58,1417,58,1795,58,1796,58,5868,58,65072,58,6147,58,6153,58,8282,58,1475,58,760,58,42889,58,8758,58,720,58,42237,58,451,33,11601,33,660,63,577,63,2429,63,5038,63,42731,63,119149,46,8228,46,1793,46,1794,46,42510,46,68176,46,1632,46,1776,46,42232,46,1373,96,65287,96,8219,96,8242,96,1370,96,1523,96,8175,96,65344,96,900,96,8189,96,8125,96,8127,96,8190,96,697,96,884,96,712,96,714,96,715,96,756,96,699,96,701,96,700,96,702,96,42892,96,1497,96,2036,96,2037,96,5194,96,5836,96,94033,96,94034,96,65339,91,10088,40,10098,40,12308,40,64830,40,65341,93,10089,41,10099,41,12309,41,64831,41,10100,123,119060,123,10101,125,65342,94,8270,42,1645,42,8727,42,66335,42,5941,47,8257,47,8725,47,8260,47,9585,47,10187,47,10744,47,119354,47,12755,47,12339,47,11462,47,20031,47,12035,47,65340,92,65128,92,8726,92,10189,92,10741,92,10745,92,119311,92,119355,92,12756,92,20022,92,12034,92,42872,38,708,94,710,94,5869,43,10133,43,66203,43,8249,60,10094,60,706,60,119350,60,5176,60,5810,60,5120,61,11840,61,12448,61,42239,61,8250,62,10095,62,707,62,119351,62,5171,62,94015,62,8275,126,732,126,8128,126,8764,126,65372,124,65293,45,120784,50,120794,50,120804,50,120814,50,120824,50,130034,50,42842,50,423,50,1000,50,42564,50,5311,50,42735,50,119302,51,120785,51,120795,51,120805,51,120815,51,120825,51,130035,51,42923,51,540,51,439,51,42858,51,11468,51,1248,51,94011,51,71882,51,120786,52,120796,52,120806,52,120816,52,120826,52,130036,52,5070,52,71855,52,120787,53,120797,53,120807,53,120817,53,120827,53,130037,53,444,53,71867,53,120788,54,120798,54,120808,54,120818,54,120828,54,130038,54,11474,54,5102,54,71893,54,119314,55,120789,55,120799,55,120809,55,120819,55,120829,55,130039,55,66770,55,71878,55,2819,56,2538,56,2666,56,125131,56,120790,56,120800,56,120810,56,120820,56,120830,56,130040,56,547,56,546,56,66330,56,2663,57,2920,57,2541,57,3437,57,120791,57,120801,57,120811,57,120821,57,120831,57,130041,57,42862,57,11466,57,71884,57,71852,57,71894,57,9082,97,65345,97,119834,97,119886,97,119938,97,119990,97,120042,97,120094,97,120146,97,120198,97,120250,97,120302,97,120354,97,120406,97,120458,97,593,97,945,97,120514,97,120572,97,120630,97,120688,97,120746,97,65313,65,119808,65,119860,65,119912,65,119964,65,120016,65,120068,65,120120,65,120172,65,120224,65,120276,65,120328,65,120380,65,120432,65,913,65,120488,65,120546,65,120604,65,120662,65,120720,65,5034,65,5573,65,42222,65,94016,65,66208,65,119835,98,119887,98,119939,98,119991,98,120043,98,120095,98,120147,98,120199,98,120251,98,120303,98,120355,98,120407,98,120459,98,388,98,5071,98,5234,98,5551,98,65314,66,8492,66,119809,66,119861,66,119913,66,120017,66,120069,66,120121,66,120173,66,120225,66,120277,66,120329,66,120381,66,120433,66,42932,66,914,66,120489,66,120547,66,120605,66,120663,66,120721,66,5108,66,5623,66,42192,66,66178,66,66209,66,66305,66,65347,99,8573,99,119836,99,119888,99,119940,99,119992,99,120044,99,120096,99,120148,99,120200,99,120252,99,120304,99,120356,99,120408,99,120460,99,7428,99,1010,99,11429,99,43951,99,66621,99,128844,67,71922,67,71913,67,65315,67,8557,67,8450,67,8493,67,119810,67,119862,67,119914,67,119966,67,120018,67,120174,67,120226,67,120278,67,120330,67,120382,67,120434,67,1017,67,11428,67,5087,67,42202,67,66210,67,66306,67,66581,67,66844,67,8574,100,8518,100,119837,100,119889,100,119941,100,119993,100,120045,100,120097,100,120149,100,120201,100,120253,100,120305,100,120357,100,120409,100,120461,100,1281,100,5095,100,5231,100,42194,100,8558,68,8517,68,119811,68,119863,68,119915,68,119967,68,120019,68,120071,68,120123,68,120175,68,120227,68,120279,68,120331,68,120383,68,120435,68,5024,68,5598,68,5610,68,42195,68,8494,101,65349,101,8495,101,8519,101,119838,101,119890,101,119942,101,120046,101,120098,101,120150,101,120202,101,120254,101,120306,101,120358,101,120410,101,120462,101,43826,101,1213,101,8959,69,65317,69,8496,69,119812,69,119864,69,119916,69,120020,69,120072,69,120124,69,120176,69,120228,69,120280,69,120332,69,120384,69,120436,69,917,69,120492,69,120550,69,120608,69,120666,69,120724,69,11577,69,5036,69,42224,69,71846,69,71854,69,66182,69,119839,102,119891,102,119943,102,119995,102,120047,102,120099,102,120151,102,120203,102,120255,102,120307,102,120359,102,120411,102,120463,102,43829,102,42905,102,383,102,7837,102,1412,102,119315,70,8497,70,119813,70,119865,70,119917,70,120021,70,120073,70,120125,70,120177,70,120229,70,120281,70,120333,70,120385,70,120437,70,42904,70,988,70,120778,70,5556,70,42205,70,71874,70,71842,70,66183,70,66213,70,66853,70,65351,103,8458,103,119840,103,119892,103,119944,103,120048,103,120100,103,120152,103,120204,103,120256,103,120308,103,120360,103,120412,103,120464,103,609,103,7555,103,397,103,1409,103,119814,71,119866,71,119918,71,119970,71,120022,71,120074,71,120126,71,120178,71,120230,71,120282,71,120334,71,120386,71,120438,71,1292,71,5056,71,5107,71,42198,71,65352,104,8462,104,119841,104,119945,104,119997,104,120049,104,120101,104,120153,104,120205,104,120257,104,120309,104,120361,104,120413,104,120465,104,1211,104,1392,104,5058,104,65320,72,8459,72,8460,72,8461,72,119815,72,119867,72,119919,72,120023,72,120179,72,120231,72,120283,72,120335,72,120387,72,120439,72,919,72,120494,72,120552,72,120610,72,120668,72,120726,72,11406,72,5051,72,5500,72,42215,72,66255,72,731,105,9075,105,65353,105,8560,105,8505,105,8520,105,119842,105,119894,105,119946,105,119998,105,120050,105,120102,105,120154,105,120206,105,120258,105,120310,105,120362,105,120414,105,120466,105,120484,105,618,105,617,105,953,105,8126,105,890,105,120522,105,120580,105,120638,105,120696,105,120754,105,1110,105,42567,105,1231,105,43893,105,5029,105,71875,105,65354,106,8521,106,119843,106,119895,106,119947,106,119999,106,120051,106,120103,106,120155,106,120207,106,120259,106,120311,106,120363,106,120415,106,120467,106,1011,106,1112,106,65322,74,119817,74,119869,74,119921,74,119973,74,120025,74,120077,74,120129,74,120181,74,120233,74,120285,74,120337,74,120389,74,120441,74,42930,74,895,74,1032,74,5035,74,5261,74,42201,74,119844,107,119896,107,119948,107,120000,107,120052,107,120104,107,120156,107,120208,107,120260,107,120312,107,120364,107,120416,107,120468,107,8490,75,65323,75,119818,75,119870,75,119922,75,119974,75,120026,75,120078,75,120130,75,120182,75,120234,75,120286,75,120338,75,120390,75,120442,75,922,75,120497,75,120555,75,120613,75,120671,75,120729,75,11412,75,5094,75,5845,75,42199,75,66840,75,1472,108,8739,73,9213,73,65512,73,1633,108,1777,73,66336,108,125127,108,120783,73,120793,73,120803,73,120813,73,120823,73,130033,73,65321,73,8544,73,8464,73,8465,73,119816,73,119868,73,119920,73,120024,73,120128,73,120180,73,120232,73,120284,73,120336,73,120388,73,120440,73,65356,108,8572,73,8467,108,119845,108,119897,108,119949,108,120001,108,120053,108,120105,73,120157,73,120209,73,120261,73,120313,73,120365,73,120417,73,120469,73,448,73,120496,73,120554,73,120612,73,120670,73,120728,73,11410,73,1030,73,1216,73,1493,108,1503,108,1575,108,126464,108,126592,108,65166,108,65165,108,1994,108,11599,73,5825,73,42226,73,93992,73,66186,124,66313,124,119338,76,8556,76,8466,76,119819,76,119871,76,119923,76,120027,76,120079,76,120131,76,120183,76,120235,76,120287,76,120339,76,120391,76,120443,76,11472,76,5086,76,5290,76,42209,76,93974,76,71843,76,71858,76,66587,76,66854,76,65325,77,8559,77,8499,77,119820,77,119872,77,119924,77,120028,77,120080,77,120132,77,120184,77,120236,77,120288,77,120340,77,120392,77,120444,77,924,77,120499,77,120557,77,120615,77,120673,77,120731,77,1018,77,11416,77,5047,77,5616,77,5846,77,42207,77,66224,77,66321,77,119847,110,119899,110,119951,110,120003,110,120055,110,120107,110,120159,110,120211,110,120263,110,120315,110,120367,110,120419,110,120471,110,1400,110,1404,110,65326,78,8469,78,119821,78,119873,78,119925,78,119977,78,120029,78,120081,78,120185,78,120237,78,120289,78,120341,78,120393,78,120445,78,925,78,120500,78,120558,78,120616,78,120674,78,120732,78,11418,78,42208,78,66835,78,3074,111,3202,111,3330,111,3458,111,2406,111,2662,111,2790,111,3046,111,3174,111,3302,111,3430,111,3664,111,3792,111,4160,111,1637,111,1781,111,65359,111,8500,111,119848,111,119900,111,119952,111,120056,111,120108,111,120160,111,120212,111,120264,111,120316,111,120368,111,120420,111,120472,111,7439,111,7441,111,43837,111,959,111,120528,111,120586,111,120644,111,120702,111,120760,111,963,111,120532,111,120590,111,120648,111,120706,111,120764,111,11423,111,4351,111,1413,111,1505,111,1607,111,126500,111,126564,111,126596,111,65259,111,65260,111,65258,111,65257,111,1726,111,64428,111,64429,111,64427,111,64426,111,1729,111,64424,111,64425,111,64423,111,64422,111,1749,111,3360,111,4125,111,66794,111,71880,111,71895,111,66604,111,1984,79,2534,79,2918,79,12295,79,70864,79,71904,79,120782,79,120792,79,120802,79,120812,79,120822,79,130032,79,65327,79,119822,79,119874,79,119926,79,119978,79,120030,79,120082,79,120134,79,120186,79,120238,79,120290,79,120342,79,120394,79,120446,79,927,79,120502,79,120560,79,120618,79,120676,79,120734,79,11422,79,1365,79,11604,79,4816,79,2848,79,66754,79,42227,79,71861,79,66194,79,66219,79,66564,79,66838,79,9076,112,65360,112,119849,112,119901,112,119953,112,120005,112,120057,112,120109,112,120161,112,120213,112,120265,112,120317,112,120369,112,120421,112,120473,112,961,112,120530,112,120544,112,120588,112,120602,112,120646,112,120660,112,120704,112,120718,112,120762,112,120776,112,11427,112,65328,80,8473,80,119823,80,119875,80,119927,80,119979,80,120031,80,120083,80,120187,80,120239,80,120291,80,120343,80,120395,80,120447,80,929,80,120504,80,120562,80,120620,80,120678,80,120736,80,11426,80,5090,80,5229,80,42193,80,66197,80,119850,113,119902,113,119954,113,120006,113,120058,113,120110,113,120162,113,120214,113,120266,113,120318,113,120370,113,120422,113,120474,113,1307,113,1379,113,1382,113,8474,81,119824,81,119876,81,119928,81,119980,81,120032,81,120084,81,120188,81,120240,81,120292,81,120344,81,120396,81,120448,81,11605,81,119851,114,119903,114,119955,114,120007,114,120059,114,120111,114,120163,114,120215,114,120267,114,120319,114,120371,114,120423,114,120475,114,43847,114,43848,114,7462,114,11397,114,43905,114,119318,82,8475,82,8476,82,8477,82,119825,82,119877,82,119929,82,120033,82,120189,82,120241,82,120293,82,120345,82,120397,82,120449,82,422,82,5025,82,5074,82,66740,82,5511,82,42211,82,94005,82,65363,115,119852,115,119904,115,119956,115,120008,115,120060,115,120112,115,120164,115,120216,115,120268,115,120320,115,120372,115,120424,115,120476,115,42801,115,445,115,1109,115,43946,115,71873,115,66632,115,65331,83,119826,83,119878,83,119930,83,119982,83,120034,83,120086,83,120138,83,120190,83,120242,83,120294,83,120346,83,120398,83,120450,83,1029,83,1359,83,5077,83,5082,83,42210,83,94010,83,66198,83,66592,83,119853,116,119905,116,119957,116,120009,116,120061,116,120113,116,120165,116,120217,116,120269,116,120321,116,120373,116,120425,116,120477,116,8868,84,10201,84,128872,84,65332,84,119827,84,119879,84,119931,84,119983,84,120035,84,120087,84,120139,84,120191,84,120243,84,120295,84,120347,84,120399,84,120451,84,932,84,120507,84,120565,84,120623,84,120681,84,120739,84,11430,84,5026,84,42196,84,93962,84,71868,84,66199,84,66225,84,66325,84,119854,117,119906,117,119958,117,120010,117,120062,117,120114,117,120166,117,120218,117,120270,117,120322,117,120374,117,120426,117,120478,117,42911,117,7452,117,43854,117,43858,117,651,117,965,117,120534,117,120592,117,120650,117,120708,117,120766,117,1405,117,66806,117,71896,117,8746,85,8899,85,119828,85,119880,85,119932,85,119984,85,120036,85,120088,85,120140,85,120192,85,120244,85,120296,85,120348,85,120400,85,120452,85,1357,85,4608,85,66766,85,5196,85,42228,85,94018,85,71864,85,8744,118,8897,118,65366,118,8564,118,119855,118,119907,118,119959,118,120011,118,120063,118,120115,118,120167,118,120219,118,120271,118,120323,118,120375,118,120427,118,120479,118,7456,118,957,118,120526,118,120584,118,120642,118,120700,118,120758,118,1141,118,1496,118,71430,118,43945,118,71872,118,119309,86,1639,86,1783,86,8548,86,119829,86,119881,86,119933,86,119985,86,120037,86,120089,86,120141,86,120193,86,120245,86,120297,86,120349,86,120401,86,120453,86,1140,86,11576,86,5081,86,5167,86,42719,86,42214,86,93960,86,71840,86,66845,86,623,119,119856,119,119908,119,119960,119,120012,119,120064,119,120116,119,120168,119,120220,119,120272,119,120324,119,120376,119,120428,119,120480,119,7457,119,1121,119,1309,119,1377,119,71434,119,71438,119,71439,119,43907,119,71919,87,71910,87,119830,87,119882,87,119934,87,119986,87,120038,87,120090,87,120142,87,120194,87,120246,87,120298,87,120350,87,120402,87,120454,87,1308,87,5043,87,5076,87,42218,87,5742,120,10539,120,10540,120,10799,120,65368,120,8569,120,119857,120,119909,120,119961,120,120013,120,120065,120,120117,120,120169,120,120221,120,120273,120,120325,120,120377,120,120429,120,120481,120,5441,120,5501,120,5741,88,9587,88,66338,88,71916,88,65336,88,8553,88,119831,88,119883,88,119935,88,119987,88,120039,88,120091,88,120143,88,120195,88,120247,88,120299,88,120351,88,120403,88,120455,88,42931,88,935,88,120510,88,120568,88,120626,88,120684,88,120742,88,11436,88,11613,88,5815,88,42219,88,66192,88,66228,88,66327,88,66855,88,611,121,7564,121,65369,121,119858,121,119910,121,119962,121,120014,121,120066,121,120118,121,120170,121,120222,121,120274,121,120326,121,120378,121,120430,121,120482,121,655,121,7935,121,43866,121,947,121,8509,121,120516,121,120574,121,120632,121,120690,121,120748,121,1199,121,4327,121,71900,121,65337,89,119832,89,119884,89,119936,89,119988,89,120040,89,120092,89,120144,89,120196,89,120248,89,120300,89,120352,89,120404,89,120456,89,933,89,978,89,120508,89,120566,89,120624,89,120682,89,120740,89,11432,89,1198,89,5033,89,5053,89,42220,89,94019,89,71844,89,66226,89,119859,122,119911,122,119963,122,120015,122,120067,122,120119,122,120171,122,120223,122,120275,122,120327,122,120379,122,120431,122,120483,122,7458,122,43923,122,71876,122,66293,90,71909,90,65338,90,8484,90,8488,90,119833,90,119885,90,119937,90,119989,90,120041,90,120197,90,120249,90,120301,90,120353,90,120405,90,120457,90,918,90,120493,90,120551,90,120609,90,120667,90,120725,90,5059,90,42204,90,71849,90,65282,34,65284,36,65285,37,65286,38,65290,42,65291,43,65294,46,65295,47,65296,48,65297,49,65298,50,65299,51,65300,52,65301,53,65302,54,65303,55,65304,56,65305,57,65308,60,65309,61,65310,62,65312,64,65316,68,65318,70,65319,71,65324,76,65329,81,65330,82,65333,85,65334,86,65335,87,65343,95,65346,98,65348,100,65350,102,65355,107,65357,109,65358,110,65361,113,65362,114,65364,116,65365,117,65367,119,65370,122,65371,123,65373,125,119846,109],"_default":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"cs":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"de":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"es":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"fr":[65374,126,65306,58,65281,33,8216,96,8245,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"it":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ja":[8211,45,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65292,44,65307,59],"ko":[8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pl":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"pt-BR":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"qps-ploc":[160,32,8211,45,65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"ru":[65374,126,65306,58,65281,33,8216,96,8217,96,8245,96,180,96,12494,47,305,105,921,73,1009,112,215,120,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"tr":[160,32,8211,45,65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65288,40,65289,41,65292,44,65307,59,65311,63],"zh-hans":[65374,126,65306,58,65281,33,8245,96,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65288,40,65289,41],"zh-hant":[8211,45,65374,126,180,96,12494,47,1047,51,1073,54,1072,97,1040,65,1068,98,1042,66,1089,99,1057,67,1077,101,1045,69,1053,72,305,105,1050,75,921,73,1052,77,1086,111,1054,79,1009,112,1088,112,1056,80,1075,114,1058,84,215,120,1093,120,1061,88,1091,121,1059,89,65283,35,65307,59]}')), _e.cache = new ha({ getCacheKey: JSON.stringify }, (e) => {
  function n(f) {
    const h = /* @__PURE__ */ new Map();
    for (let m = 0; m < f.length; m += 2)
      h.set(f[m], f[m + 1]);
    return h;
  }
  function r(f, h) {
    const m = new Map(f);
    for (const [d, g] of h)
      m.set(d, g);
    return m;
  }
  function i(f, h) {
    if (!f)
      return h;
    const m = /* @__PURE__ */ new Map();
    for (const [d, g] of f)
      h.has(d) && m.set(d, g);
    return m;
  }
  const s = _e.ambiguousCharacterData.value;
  let o = e.filter((f) => !f.startsWith("_") && f in s);
  o.length === 0 && (o = ["_default"]);
  let l;
  for (const f of o) {
    const h = n(s[f]);
    l = i(l, h);
  }
  const u = n(s._common), c = r(u, l);
  return new _e(c);
}), _e._locales = new zr(() => Object.keys(_e.ambiguousCharacterData.value).filter((e) => !e.startsWith("_")));
let Tt = _e;
const lt = class lt {
  static getRawData() {
    return JSON.parse("[9,10,11,12,13,32,127,160,173,847,1564,4447,4448,6068,6069,6155,6156,6157,6158,7355,7356,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8203,8204,8205,8206,8207,8234,8235,8236,8237,8238,8239,8287,8288,8289,8290,8291,8292,8293,8294,8295,8296,8297,8298,8299,8300,8301,8302,8303,10240,12288,12644,65024,65025,65026,65027,65028,65029,65030,65031,65032,65033,65034,65035,65036,65037,65038,65039,65279,65440,65520,65521,65522,65523,65524,65525,65526,65527,65528,65532,78844,119155,119156,119157,119158,119159,119160,119161,119162,917504,917505,917506,917507,917508,917509,917510,917511,917512,917513,917514,917515,917516,917517,917518,917519,917520,917521,917522,917523,917524,917525,917526,917527,917528,917529,917530,917531,917532,917533,917534,917535,917536,917537,917538,917539,917540,917541,917542,917543,917544,917545,917546,917547,917548,917549,917550,917551,917552,917553,917554,917555,917556,917557,917558,917559,917560,917561,917562,917563,917564,917565,917566,917567,917568,917569,917570,917571,917572,917573,917574,917575,917576,917577,917578,917579,917580,917581,917582,917583,917584,917585,917586,917587,917588,917589,917590,917591,917592,917593,917594,917595,917596,917597,917598,917599,917600,917601,917602,917603,917604,917605,917606,917607,917608,917609,917610,917611,917612,917613,917614,917615,917616,917617,917618,917619,917620,917621,917622,917623,917624,917625,917626,917627,917628,917629,917630,917631,917760,917761,917762,917763,917764,917765,917766,917767,917768,917769,917770,917771,917772,917773,917774,917775,917776,917777,917778,917779,917780,917781,917782,917783,917784,917785,917786,917787,917788,917789,917790,917791,917792,917793,917794,917795,917796,917797,917798,917799,917800,917801,917802,917803,917804,917805,917806,917807,917808,917809,917810,917811,917812,917813,917814,917815,917816,917817,917818,917819,917820,917821,917822,917823,917824,917825,917826,917827,917828,917829,917830,917831,917832,917833,917834,917835,917836,917837,917838,917839,917840,917841,917842,917843,917844,917845,917846,917847,917848,917849,917850,917851,917852,917853,917854,917855,917856,917857,917858,917859,917860,917861,917862,917863,917864,917865,917866,917867,917868,917869,917870,917871,917872,917873,917874,917875,917876,917877,917878,917879,917880,917881,917882,917883,917884,917885,917886,917887,917888,917889,917890,917891,917892,917893,917894,917895,917896,917897,917898,917899,917900,917901,917902,917903,917904,917905,917906,917907,917908,917909,917910,917911,917912,917913,917914,917915,917916,917917,917918,917919,917920,917921,917922,917923,917924,917925,917926,917927,917928,917929,917930,917931,917932,917933,917934,917935,917936,917937,917938,917939,917940,917941,917942,917943,917944,917945,917946,917947,917948,917949,917950,917951,917952,917953,917954,917955,917956,917957,917958,917959,917960,917961,917962,917963,917964,917965,917966,917967,917968,917969,917970,917971,917972,917973,917974,917975,917976,917977,917978,917979,917980,917981,917982,917983,917984,917985,917986,917987,917988,917989,917990,917991,917992,917993,917994,917995,917996,917997,917998,917999]");
  }
  static getData() {
    return this._data || (this._data = new Set(lt.getRawData())), this._data;
  }
  static isInvisibleCharacter(e) {
    return lt.getData().has(e);
  }
  static get codePoints() {
    return lt.getData();
  }
};
lt._data = void 0;
let St = lt;
var Gr = {};
let ft;
const Cn = globalThis.vscode;
if (typeof Cn < "u" && typeof Cn.process < "u") {
  const t = Cn.process;
  ft = {
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
} else typeof ye < "u" && typeof ye?.versions?.node == "string" ? ft = {
  get platform() {
    return ye.platform;
  },
  get arch() {
    return ye.arch;
  },
  get env() {
    return Gr;
  },
  cwd() {
    return Gr.VSCODE_CWD || ye.cwd();
  }
} : ft = {
  // Supported
  get platform() {
    return It ? "win32" : ra ? "darwin" : "linux";
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
const en = ft.cwd, wa = ft.env, xa = ft.platform, La = 65, va = 97, Na = 90, Ea = 122, Ve = 46, K = 47, se = 92, Te = 58, Sa = 63;
class as extends Error {
  constructor(e, n, r) {
    let i;
    typeof n == "string" && n.indexOf("not ") === 0 ? (i = "must not be", n = n.replace(/^not /, "")) : i = "must be";
    const s = e.indexOf(".") !== -1 ? "property" : "argument";
    let o = `The "${e}" ${s} ${i} of type ${n}`;
    o += `. Received type ${typeof r}`, super(o), this.code = "ERR_INVALID_ARG_TYPE";
  }
}
function Aa(t, e) {
  if (t === null || typeof t != "object")
    throw new as(e, "Object", t);
}
function Y(t, e) {
  if (typeof t != "string")
    throw new as(e, "string", t);
}
const Ie = xa === "win32";
function F(t) {
  return t === K || t === se;
}
function Qn(t) {
  return t === K;
}
function Pe(t) {
  return t >= La && t <= Na || t >= va && t <= Ea;
}
function tn(t, e, n, r) {
  let i = "", s = 0, o = -1, l = 0, u = 0;
  for (let c = 0; c <= t.length; ++c) {
    if (c < t.length)
      u = t.charCodeAt(c);
    else {
      if (r(u))
        break;
      u = K;
    }
    if (r(u)) {
      if (!(o === c - 1 || l === 1)) if (l === 2) {
        if (i.length < 2 || s !== 2 || i.charCodeAt(i.length - 1) !== Ve || i.charCodeAt(i.length - 2) !== Ve) {
          if (i.length > 2) {
            const f = i.lastIndexOf(n);
            f === -1 ? (i = "", s = 0) : (i = i.slice(0, f), s = i.length - 1 - i.lastIndexOf(n)), o = c, l = 0;
            continue;
          } else if (i.length !== 0) {
            i = "", s = 0, o = c, l = 0;
            continue;
          }
        }
        e && (i += i.length > 0 ? `${n}..` : "..", s = 2);
      } else
        i.length > 0 ? i += `${n}${t.slice(o + 1, c)}` : i = t.slice(o + 1, c), s = c - o - 1;
      o = c, l = 0;
    } else u === Ve && l !== -1 ? ++l : l = -1;
  }
  return i;
}
function Ra(t) {
  return t ? `${t[0] === "." ? "" : "."}${t}` : "";
}
function ls(t, e) {
  Aa(e, "pathObject");
  const n = e.dir || e.root, r = e.base || `${e.name || ""}${Ra(e.ext)}`;
  return n ? n === e.root ? `${n}${r}` : `${n}${t}${r}` : r;
}
const ne = {
  // path.resolve([from ...], to)
  resolve(...t) {
    let e = "", n = "", r = !1;
    for (let i = t.length - 1; i >= -1; i--) {
      let s;
      if (i >= 0) {
        if (s = t[i], Y(s, `paths[${i}]`), s.length === 0)
          continue;
      } else e.length === 0 ? s = en() : (s = wa[`=${e}`] || en(), (s === void 0 || s.slice(0, 2).toLowerCase() !== e.toLowerCase() && s.charCodeAt(2) === se) && (s = `${e}\\`));
      const o = s.length;
      let l = 0, u = "", c = !1;
      const f = s.charCodeAt(0);
      if (o === 1)
        F(f) && (l = 1, c = !0);
      else if (F(f))
        if (c = !0, F(s.charCodeAt(1))) {
          let h = 2, m = h;
          for (; h < o && !F(s.charCodeAt(h)); )
            h++;
          if (h < o && h !== m) {
            const d = s.slice(m, h);
            for (m = h; h < o && F(s.charCodeAt(h)); )
              h++;
            if (h < o && h !== m) {
              for (m = h; h < o && !F(s.charCodeAt(h)); )
                h++;
              (h === o || h !== m) && (u = `\\\\${d}\\${s.slice(m, h)}`, l = h);
            }
          }
        } else
          l = 1;
      else Pe(f) && s.charCodeAt(1) === Te && (u = s.slice(0, 2), l = 2, o > 2 && F(s.charCodeAt(2)) && (c = !0, l = 3));
      if (u.length > 0)
        if (e.length > 0) {
          if (u.toLowerCase() !== e.toLowerCase())
            continue;
        } else
          e = u;
      if (r) {
        if (e.length > 0)
          break;
      } else if (n = `${s.slice(l)}\\${n}`, r = c, c && e.length > 0)
        break;
    }
    return n = tn(n, !r, "\\", F), r ? `${e}\\${n}` : `${e}${n}` || ".";
  },
  normalize(t) {
    Y(t, "path");
    const e = t.length;
    if (e === 0)
      return ".";
    let n = 0, r, i = !1;
    const s = t.charCodeAt(0);
    if (e === 1)
      return Qn(s) ? "\\" : t;
    if (F(s))
      if (i = !0, F(t.charCodeAt(1))) {
        let l = 2, u = l;
        for (; l < e && !F(t.charCodeAt(l)); )
          l++;
        if (l < e && l !== u) {
          const c = t.slice(u, l);
          for (u = l; l < e && F(t.charCodeAt(l)); )
            l++;
          if (l < e && l !== u) {
            for (u = l; l < e && !F(t.charCodeAt(l)); )
              l++;
            if (l === e)
              return `\\\\${c}\\${t.slice(u)}\\`;
            l !== u && (r = `\\\\${c}\\${t.slice(u, l)}`, n = l);
          }
        }
      } else
        n = 1;
    else Pe(s) && t.charCodeAt(1) === Te && (r = t.slice(0, 2), n = 2, e > 2 && F(t.charCodeAt(2)) && (i = !0, n = 3));
    let o = n < e ? tn(t.slice(n), !i, "\\", F) : "";
    return o.length === 0 && !i && (o = "."), o.length > 0 && F(t.charCodeAt(e - 1)) && (o += "\\"), r === void 0 ? i ? `\\${o}` : o : i ? `${r}\\${o}` : `${r}${o}`;
  },
  isAbsolute(t) {
    Y(t, "path");
    const e = t.length;
    if (e === 0)
      return !1;
    const n = t.charCodeAt(0);
    return F(n) || // Possible device root
    e > 2 && Pe(n) && t.charCodeAt(1) === Te && F(t.charCodeAt(2));
  },
  join(...t) {
    if (t.length === 0)
      return ".";
    let e, n;
    for (let s = 0; s < t.length; ++s) {
      const o = t[s];
      Y(o, "path"), o.length > 0 && (e === void 0 ? e = n = o : e += `\\${o}`);
    }
    if (e === void 0)
      return ".";
    let r = !0, i = 0;
    if (typeof n == "string" && F(n.charCodeAt(0))) {
      ++i;
      const s = n.length;
      s > 1 && F(n.charCodeAt(1)) && (++i, s > 2 && (F(n.charCodeAt(2)) ? ++i : r = !1));
    }
    if (r) {
      for (; i < e.length && F(e.charCodeAt(i)); )
        i++;
      i >= 2 && (e = `\\${e.slice(i)}`);
    }
    return ne.normalize(e);
  },
  // It will solve the relative path from `from` to `to`, for instance:
  //  from = 'C:\\orandea\\test\\aaa'
  //  to = 'C:\\orandea\\impl\\bbb'
  // The output of the function should be: '..\\..\\impl\\bbb'
  relative(t, e) {
    if (Y(t, "from"), Y(e, "to"), t === e)
      return "";
    const n = ne.resolve(t), r = ne.resolve(e);
    if (n === r || (t = n.toLowerCase(), e = r.toLowerCase(), t === e))
      return "";
    let i = 0;
    for (; i < t.length && t.charCodeAt(i) === se; )
      i++;
    let s = t.length;
    for (; s - 1 > i && t.charCodeAt(s - 1) === se; )
      s--;
    const o = s - i;
    let l = 0;
    for (; l < e.length && e.charCodeAt(l) === se; )
      l++;
    let u = e.length;
    for (; u - 1 > l && e.charCodeAt(u - 1) === se; )
      u--;
    const c = u - l, f = o < c ? o : c;
    let h = -1, m = 0;
    for (; m < f; m++) {
      const g = t.charCodeAt(i + m);
      if (g !== e.charCodeAt(l + m))
        break;
      g === se && (h = m);
    }
    if (m !== f) {
      if (h === -1)
        return r;
    } else {
      if (c > f) {
        if (e.charCodeAt(l + m) === se)
          return r.slice(l + m + 1);
        if (m === 2)
          return r.slice(l + m);
      }
      o > f && (t.charCodeAt(i + m) === se ? h = m : m === 2 && (h = 3)), h === -1 && (h = 0);
    }
    let d = "";
    for (m = i + h + 1; m <= s; ++m)
      (m === s || t.charCodeAt(m) === se) && (d += d.length === 0 ? ".." : "\\..");
    return l += h, d.length > 0 ? `${d}${r.slice(l, u)}` : (r.charCodeAt(l) === se && ++l, r.slice(l, u));
  },
  toNamespacedPath(t) {
    if (typeof t != "string" || t.length === 0)
      return t;
    const e = ne.resolve(t);
    if (e.length <= 2)
      return t;
    if (e.charCodeAt(0) === se) {
      if (e.charCodeAt(1) === se) {
        const n = e.charCodeAt(2);
        if (n !== Sa && n !== Ve)
          return `\\\\?\\UNC\\${e.slice(2)}`;
      }
    } else if (Pe(e.charCodeAt(0)) && e.charCodeAt(1) === Te && e.charCodeAt(2) === se)
      return `\\\\?\\${e}`;
    return t;
  },
  dirname(t) {
    Y(t, "path");
    const e = t.length;
    if (e === 0)
      return ".";
    let n = -1, r = 0;
    const i = t.charCodeAt(0);
    if (e === 1)
      return F(i) ? t : ".";
    if (F(i)) {
      if (n = r = 1, F(t.charCodeAt(1))) {
        let l = 2, u = l;
        for (; l < e && !F(t.charCodeAt(l)); )
          l++;
        if (l < e && l !== u) {
          for (u = l; l < e && F(t.charCodeAt(l)); )
            l++;
          if (l < e && l !== u) {
            for (u = l; l < e && !F(t.charCodeAt(l)); )
              l++;
            if (l === e)
              return t;
            l !== u && (n = r = l + 1);
          }
        }
      }
    } else Pe(i) && t.charCodeAt(1) === Te && (n = e > 2 && F(t.charCodeAt(2)) ? 3 : 2, r = n);
    let s = -1, o = !0;
    for (let l = e - 1; l >= r; --l)
      if (F(t.charCodeAt(l))) {
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
    e !== void 0 && Y(e, "suffix"), Y(t, "path");
    let n = 0, r = -1, i = !0, s;
    if (t.length >= 2 && Pe(t.charCodeAt(0)) && t.charCodeAt(1) === Te && (n = 2), e !== void 0 && e.length > 0 && e.length <= t.length) {
      if (e === t)
        return "";
      let o = e.length - 1, l = -1;
      for (s = t.length - 1; s >= n; --s) {
        const u = t.charCodeAt(s);
        if (F(u)) {
          if (!i) {
            n = s + 1;
            break;
          }
        } else
          l === -1 && (i = !1, l = s + 1), o >= 0 && (u === e.charCodeAt(o) ? --o === -1 && (r = s) : (o = -1, r = l));
      }
      return n === r ? r = l : r === -1 && (r = t.length), t.slice(n, r);
    }
    for (s = t.length - 1; s >= n; --s)
      if (F(t.charCodeAt(s))) {
        if (!i) {
          n = s + 1;
          break;
        }
      } else r === -1 && (i = !1, r = s + 1);
    return r === -1 ? "" : t.slice(n, r);
  },
  extname(t) {
    Y(t, "path");
    let e = 0, n = -1, r = 0, i = -1, s = !0, o = 0;
    t.length >= 2 && t.charCodeAt(1) === Te && Pe(t.charCodeAt(0)) && (e = r = 2);
    for (let l = t.length - 1; l >= e; --l) {
      const u = t.charCodeAt(l);
      if (F(u)) {
        if (!s) {
          r = l + 1;
          break;
        }
        continue;
      }
      i === -1 && (s = !1, i = l + 1), u === Ve ? n === -1 ? n = l : o !== 1 && (o = 1) : n !== -1 && (o = -1);
    }
    return n === -1 || i === -1 || // We saw a non-dot character immediately before the dot
    o === 0 || // The (right-most) trimmed path component is exactly '..'
    o === 1 && n === i - 1 && n === r + 1 ? "" : t.slice(n, i);
  },
  format: ls.bind(null, "\\"),
  parse(t) {
    Y(t, "path");
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (t.length === 0)
      return e;
    const n = t.length;
    let r = 0, i = t.charCodeAt(0);
    if (n === 1)
      return F(i) ? (e.root = e.dir = t, e) : (e.base = e.name = t, e);
    if (F(i)) {
      if (r = 1, F(t.charCodeAt(1))) {
        let h = 2, m = h;
        for (; h < n && !F(t.charCodeAt(h)); )
          h++;
        if (h < n && h !== m) {
          for (m = h; h < n && F(t.charCodeAt(h)); )
            h++;
          if (h < n && h !== m) {
            for (m = h; h < n && !F(t.charCodeAt(h)); )
              h++;
            h === n ? r = h : h !== m && (r = h + 1);
          }
        }
      }
    } else if (Pe(i) && t.charCodeAt(1) === Te) {
      if (n <= 2)
        return e.root = e.dir = t, e;
      if (r = 2, F(t.charCodeAt(2))) {
        if (n === 3)
          return e.root = e.dir = t, e;
        r = 3;
      }
    }
    r > 0 && (e.root = t.slice(0, r));
    let s = -1, o = r, l = -1, u = !0, c = t.length - 1, f = 0;
    for (; c >= r; --c) {
      if (i = t.charCodeAt(c), F(i)) {
        if (!u) {
          o = c + 1;
          break;
        }
        continue;
      }
      l === -1 && (u = !1, l = c + 1), i === Ve ? s === -1 ? s = c : f !== 1 && (f = 1) : s !== -1 && (f = -1);
    }
    return l !== -1 && (s === -1 || // We saw a non-dot character immediately before the dot
    f === 0 || // The (right-most) trimmed path component is exactly '..'
    f === 1 && s === l - 1 && s === o + 1 ? e.base = e.name = t.slice(o, l) : (e.name = t.slice(o, s), e.base = t.slice(o, l), e.ext = t.slice(s, l))), o > 0 && o !== r ? e.dir = t.slice(0, o - 1) : e.dir = e.root, e;
  },
  sep: "\\",
  delimiter: ";",
  win32: null,
  posix: null
}, Ca = (() => {
  if (Ie) {
    const t = /\\/g;
    return () => {
      const e = en().replace(t, "/");
      return e.slice(e.indexOf("/"));
    };
  }
  return () => en();
})(), re = {
  // path.resolve([from ...], to)
  resolve(...t) {
    let e = "", n = !1;
    for (let r = t.length - 1; r >= -1 && !n; r--) {
      const i = r >= 0 ? t[r] : Ca();
      Y(i, `paths[${r}]`), i.length !== 0 && (e = `${i}/${e}`, n = i.charCodeAt(0) === K);
    }
    return e = tn(e, !n, "/", Qn), n ? `/${e}` : e.length > 0 ? e : ".";
  },
  normalize(t) {
    if (Y(t, "path"), t.length === 0)
      return ".";
    const e = t.charCodeAt(0) === K, n = t.charCodeAt(t.length - 1) === K;
    return t = tn(t, !e, "/", Qn), t.length === 0 ? e ? "/" : n ? "./" : "." : (n && (t += "/"), e ? `/${t}` : t);
  },
  isAbsolute(t) {
    return Y(t, "path"), t.length > 0 && t.charCodeAt(0) === K;
  },
  join(...t) {
    if (t.length === 0)
      return ".";
    let e;
    for (let n = 0; n < t.length; ++n) {
      const r = t[n];
      Y(r, "path"), r.length > 0 && (e === void 0 ? e = r : e += `/${r}`);
    }
    return e === void 0 ? "." : re.normalize(e);
  },
  relative(t, e) {
    if (Y(t, "from"), Y(e, "to"), t === e || (t = re.resolve(t), e = re.resolve(e), t === e))
      return "";
    const n = 1, r = t.length, i = r - n, s = 1, o = e.length - s, l = i < o ? i : o;
    let u = -1, c = 0;
    for (; c < l; c++) {
      const h = t.charCodeAt(n + c);
      if (h !== e.charCodeAt(s + c))
        break;
      h === K && (u = c);
    }
    if (c === l)
      if (o > l) {
        if (e.charCodeAt(s + c) === K)
          return e.slice(s + c + 1);
        if (c === 0)
          return e.slice(s + c);
      } else i > l && (t.charCodeAt(n + c) === K ? u = c : c === 0 && (u = 0));
    let f = "";
    for (c = n + u + 1; c <= r; ++c)
      (c === r || t.charCodeAt(c) === K) && (f += f.length === 0 ? ".." : "/..");
    return `${f}${e.slice(s + u)}`;
  },
  toNamespacedPath(t) {
    return t;
  },
  dirname(t) {
    if (Y(t, "path"), t.length === 0)
      return ".";
    const e = t.charCodeAt(0) === K;
    let n = -1, r = !0;
    for (let i = t.length - 1; i >= 1; --i)
      if (t.charCodeAt(i) === K) {
        if (!r) {
          n = i;
          break;
        }
      } else
        r = !1;
    return n === -1 ? e ? "/" : "." : e && n === 1 ? "//" : t.slice(0, n);
  },
  basename(t, e) {
    e !== void 0 && Y(e, "ext"), Y(t, "path");
    let n = 0, r = -1, i = !0, s;
    if (e !== void 0 && e.length > 0 && e.length <= t.length) {
      if (e === t)
        return "";
      let o = e.length - 1, l = -1;
      for (s = t.length - 1; s >= 0; --s) {
        const u = t.charCodeAt(s);
        if (u === K) {
          if (!i) {
            n = s + 1;
            break;
          }
        } else
          l === -1 && (i = !1, l = s + 1), o >= 0 && (u === e.charCodeAt(o) ? --o === -1 && (r = s) : (o = -1, r = l));
      }
      return n === r ? r = l : r === -1 && (r = t.length), t.slice(n, r);
    }
    for (s = t.length - 1; s >= 0; --s)
      if (t.charCodeAt(s) === K) {
        if (!i) {
          n = s + 1;
          break;
        }
      } else r === -1 && (i = !1, r = s + 1);
    return r === -1 ? "" : t.slice(n, r);
  },
  extname(t) {
    Y(t, "path");
    let e = -1, n = 0, r = -1, i = !0, s = 0;
    for (let o = t.length - 1; o >= 0; --o) {
      const l = t.charCodeAt(o);
      if (l === K) {
        if (!i) {
          n = o + 1;
          break;
        }
        continue;
      }
      r === -1 && (i = !1, r = o + 1), l === Ve ? e === -1 ? e = o : s !== 1 && (s = 1) : e !== -1 && (s = -1);
    }
    return e === -1 || r === -1 || // We saw a non-dot character immediately before the dot
    s === 0 || // The (right-most) trimmed path component is exactly '..'
    s === 1 && e === r - 1 && e === n + 1 ? "" : t.slice(e, r);
  },
  format: ls.bind(null, "/"),
  parse(t) {
    Y(t, "path");
    const e = { root: "", dir: "", base: "", ext: "", name: "" };
    if (t.length === 0)
      return e;
    const n = t.charCodeAt(0) === K;
    let r;
    n ? (e.root = "/", r = 1) : r = 0;
    let i = -1, s = 0, o = -1, l = !0, u = t.length - 1, c = 0;
    for (; u >= r; --u) {
      const f = t.charCodeAt(u);
      if (f === K) {
        if (!l) {
          s = u + 1;
          break;
        }
        continue;
      }
      o === -1 && (l = !1, o = u + 1), f === Ve ? i === -1 ? i = u : c !== 1 && (c = 1) : i !== -1 && (c = -1);
    }
    if (o !== -1) {
      const f = s === 0 && n ? 1 : s;
      i === -1 || // We saw a non-dot character immediately before the dot
      c === 0 || // The (right-most) trimmed path component is exactly '..'
      c === 1 && i === o - 1 && i === s + 1 ? e.base = e.name = t.slice(f, o) : (e.name = t.slice(f, i), e.base = t.slice(f, o), e.ext = t.slice(i, o));
    }
    return s > 0 ? e.dir = t.slice(0, s - 1) : n && (e.dir = "/"), e;
  },
  sep: "/",
  delimiter: ":",
  win32: null,
  posix: null
};
re.win32 = ne.win32 = ne;
re.posix = ne.posix = re;
Ie ? ne.normalize : re.normalize;
const Ma = Ie ? ne.join : re.join;
Ie ? ne.resolve : re.resolve;
Ie ? ne.relative : re.relative;
Ie ? ne.dirname : re.dirname;
Ie ? ne.basename : re.basename;
Ie ? ne.extname : re.extname;
Ie ? ne.sep : re.sep;
const ka = /^\w[\w\d+.-]*$/, Ia = /^\//, Ta = /^\/\//;
function Pa(t, e) {
  if (!t.scheme && e)
    throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${t.authority}", path: "${t.path}", query: "${t.query}", fragment: "${t.fragment}"}`);
  if (t.scheme && !ka.test(t.scheme))
    throw new Error("[UriError]: Scheme contains illegal characters.");
  if (t.path) {
    if (t.authority) {
      if (!Ia.test(t.path))
        throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
    } else if (Ta.test(t.path))
      throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
  }
}
function Ba(t, e) {
  return !t && !e ? "file" : t;
}
function Fa(t, e) {
  switch (t) {
    case "https":
    case "http":
    case "file":
      e ? e[0] !== pe && (e = pe + e) : e = pe;
      break;
  }
  return e;
}
const z = "", pe = "/", Da = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
class oe {
  static isUri(e) {
    return e instanceof oe ? !0 : e ? typeof e.authority == "string" && typeof e.fragment == "string" && typeof e.path == "string" && typeof e.query == "string" && typeof e.scheme == "string" && typeof e.fsPath == "string" && typeof e.with == "function" && typeof e.toString == "function" : !1;
  }
  /**
   * @internal
   */
  constructor(e, n, r, i, s, o = !1) {
    typeof e == "object" ? (this.scheme = e.scheme || z, this.authority = e.authority || z, this.path = e.path || z, this.query = e.query || z, this.fragment = e.fragment || z) : (this.scheme = Ba(e, o), this.authority = n || z, this.path = Fa(this.scheme, r || z), this.query = i || z, this.fragment = s || z, Pa(this, o));
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
    return Yn(this, !1);
  }
  // ---- modify to new -------------------------
  with(e) {
    if (!e)
      return this;
    let { scheme: n, authority: r, path: i, query: s, fragment: o } = e;
    return n === void 0 ? n = this.scheme : n === null && (n = z), r === void 0 ? r = this.authority : r === null && (r = z), i === void 0 ? i = this.path : i === null && (i = z), s === void 0 ? s = this.query : s === null && (s = z), o === void 0 ? o = this.fragment : o === null && (o = z), n === this.scheme && r === this.authority && i === this.path && s === this.query && o === this.fragment ? this : new Je(n, r, i, s, o);
  }
  // ---- parse & validate ------------------------
  /**
   * Creates a new URI from a string, e.g. `http://www.example.com/some/path`,
   * `file:///usr/home`, or `scheme:with/path`.
   *
   * @param value A string which represents an URI (see `URI#toString`).
   */
  static parse(e, n = !1) {
    const r = Da.exec(e);
    return r ? new Je(r[2] || z, qt(r[4] || z), qt(r[5] || z), qt(r[7] || z), qt(r[9] || z), n) : new Je(z, z, z, z, z);
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
    let n = z;
    if (It && (e = e.replace(/\\/g, pe)), e[0] === pe && e[1] === pe) {
      const r = e.indexOf(pe, 2);
      r === -1 ? (n = e.substring(2), e = pe) : (n = e.substring(2, r), e = e.substring(r) || pe);
    }
    return new Je("file", n, e, z, z);
  }
  /**
   * Creates new URI from uri components.
   *
   * Unless `strict` is `true` the scheme is defaults to be `file`. This function performs
   * validation and should be used for untrusted uri components retrieved from storage,
   * user input, command arguments etc
   */
  static from(e, n) {
    return new Je(e.scheme, e.authority, e.path, e.query, e.fragment, n);
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
    return It && e.scheme === "file" ? r = oe.file(ne.join(Yn(e, !0), ...n)).path : r = re.join(e.path, ...n), e.with({ path: r });
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
    return Xn(this, e);
  }
  toJSON() {
    return this;
  }
  static revive(e) {
    if (e) {
      if (e instanceof oe)
        return e;
      {
        const n = new Je(e);
        return n._formatted = e.external ?? null, n._fsPath = e._sep === us ? e.fsPath ?? null : null, n;
      }
    } else return e;
  }
}
const us = It ? 1 : void 0;
class Je extends oe {
  constructor() {
    super(...arguments), this._formatted = null, this._fsPath = null;
  }
  get fsPath() {
    return this._fsPath || (this._fsPath = Yn(this, !1)), this._fsPath;
  }
  toString(e = !1) {
    return e ? Xn(this, !0) : (this._formatted || (this._formatted = Xn(this, !1)), this._formatted);
  }
  toJSON() {
    const e = {
      $mid: 1
      /* MarshalledId.Uri */
    };
    return this._fsPath && (e.fsPath = this._fsPath, e._sep = us), this._formatted && (e.external = this._formatted), this.path && (e.path = this.path), this.scheme && (e.scheme = this.scheme), this.authority && (e.authority = this.authority), this.query && (e.query = this.query), this.fragment && (e.fragment = this.fragment), e;
  }
}
const cs = {
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
function Qr(t, e, n) {
  let r, i = -1;
  for (let s = 0; s < t.length; s++) {
    const o = t.charCodeAt(s);
    if (o >= 97 && o <= 122 || o >= 65 && o <= 90 || o >= 48 && o <= 57 || o === 45 || o === 46 || o === 95 || o === 126 || e && o === 47 || n && o === 91 || n && o === 93 || n && o === 58)
      i !== -1 && (r += encodeURIComponent(t.substring(i, s)), i = -1), r !== void 0 && (r += t.charAt(s));
    else {
      r === void 0 && (r = t.substr(0, s));
      const l = cs[o];
      l !== void 0 ? (i !== -1 && (r += encodeURIComponent(t.substring(i, s)), i = -1), r += l) : i === -1 && (i = s);
    }
  }
  return i !== -1 && (r += encodeURIComponent(t.substring(i))), r !== void 0 ? r : t;
}
function Ua(t) {
  let e;
  for (let n = 0; n < t.length; n++) {
    const r = t.charCodeAt(n);
    r === 35 || r === 63 ? (e === void 0 && (e = t.substr(0, n)), e += cs[r]) : e !== void 0 && (e += t[n]);
  }
  return e !== void 0 ? e : t;
}
function Yn(t, e) {
  let n;
  return t.authority && t.path.length > 1 && t.scheme === "file" ? n = `//${t.authority}${t.path}` : t.path.charCodeAt(0) === 47 && (t.path.charCodeAt(1) >= 65 && t.path.charCodeAt(1) <= 90 || t.path.charCodeAt(1) >= 97 && t.path.charCodeAt(1) <= 122) && t.path.charCodeAt(2) === 58 ? e ? n = t.path.substr(1) : n = t.path[1].toLowerCase() + t.path.substr(2) : n = t.path, It && (n = n.replace(/\//g, "\\")), n;
}
function Xn(t, e) {
  const n = e ? Ua : Qr;
  let r = "", { scheme: i, authority: s, path: o, query: l, fragment: u } = t;
  if (i && (r += i, r += ":"), (s || i === "file") && (r += pe, r += pe), s) {
    let c = s.indexOf("@");
    if (c !== -1) {
      const f = s.substr(0, c);
      s = s.substr(c + 1), c = f.lastIndexOf(":"), c === -1 ? r += n(f, !1, !1) : (r += n(f.substr(0, c), !1, !1), r += ":", r += n(f.substr(c + 1), !1, !0)), r += "@";
    }
    s = s.toLowerCase(), c = s.lastIndexOf(":"), c === -1 ? r += n(s, !1, !0) : (r += n(s.substr(0, c), !1, !0), r += s.substr(c));
  }
  if (o) {
    if (o.length >= 3 && o.charCodeAt(0) === 47 && o.charCodeAt(2) === 58) {
      const c = o.charCodeAt(1);
      c >= 65 && c <= 90 && (o = `/${String.fromCharCode(c + 32)}:${o.substr(3)}`);
    } else if (o.length >= 2 && o.charCodeAt(1) === 58) {
      const c = o.charCodeAt(0);
      c >= 65 && c <= 90 && (o = `${String.fromCharCode(c + 32)}:${o.substr(2)}`);
    }
    r += n(o, !0, !1);
  }
  return l && (r += "?", r += n(l, !1, !1)), u && (r += "#", r += e ? u : Qr(u, !1, !1)), r;
}
function hs(t) {
  try {
    return decodeURIComponent(t);
  } catch {
    return t.length > 3 ? t.substr(0, 3) + hs(t.substr(3)) : t;
  }
}
const Yr = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
function qt(t) {
  return t.match(Yr) ? t.replace(Yr, (e) => hs(e)) : t;
}
var Ue;
(function(t) {
  t.inMemory = "inmemory", t.vscode = "vscode", t.internal = "private", t.walkThrough = "walkThrough", t.walkThroughSnippet = "walkThroughSnippet", t.http = "http", t.https = "https", t.file = "file", t.mailto = "mailto", t.untitled = "untitled", t.data = "data", t.command = "command", t.vscodeRemote = "vscode-remote", t.vscodeRemoteResource = "vscode-remote-resource", t.vscodeManagedRemoteResource = "vscode-managed-remote-resource", t.vscodeUserData = "vscode-userdata", t.vscodeCustomEditor = "vscode-custom-editor", t.vscodeNotebookCell = "vscode-notebook-cell", t.vscodeNotebookCellMetadata = "vscode-notebook-cell-metadata", t.vscodeNotebookCellMetadataDiff = "vscode-notebook-cell-metadata-diff", t.vscodeNotebookCellOutput = "vscode-notebook-cell-output", t.vscodeNotebookCellOutputDiff = "vscode-notebook-cell-output-diff", t.vscodeNotebookMetadata = "vscode-notebook-metadata", t.vscodeInteractiveInput = "vscode-interactive-input", t.vscodeSettings = "vscode-settings", t.vscodeWorkspaceTrust = "vscode-workspace-trust", t.vscodeTerminal = "vscode-terminal", t.vscodeChatCodeBlock = "vscode-chat-code-block", t.vscodeChatCodeCompareBlock = "vscode-chat-code-compare-block", t.vscodeChatSesssion = "vscode-chat-editor", t.webviewPanel = "webview-panel", t.vscodeWebview = "vscode-webview", t.extension = "extension", t.vscodeFileResource = "vscode-file", t.tmp = "tmp", t.vsls = "vsls", t.vscodeSourceControl = "vscode-scm", t.commentsInput = "comment", t.codeSetting = "code-setting", t.outputChannel = "output";
})(Ue || (Ue = {}));
const Va = "tkn";
class qa {
  constructor() {
    this._hosts = /* @__PURE__ */ Object.create(null), this._ports = /* @__PURE__ */ Object.create(null), this._connectionTokens = /* @__PURE__ */ Object.create(null), this._preferredWebSchema = "http", this._delegate = null, this._serverRootPath = "/";
  }
  setPreferredWebSchema(e) {
    this._preferredWebSchema = e;
  }
  get _remoteResourcesPath() {
    return re.join(this._serverRootPath, Ue.vscodeRemoteResource);
  }
  rewrite(e) {
    if (this._delegate)
      try {
        return this._delegate(e);
      } catch (l) {
        return Et(l), e;
      }
    const n = e.authority;
    let r = this._hosts[n];
    r && r.indexOf(":") !== -1 && r.indexOf("[") === -1 && (r = `[${r}]`);
    const i = this._ports[n], s = this._connectionTokens[n];
    let o = `path=${encodeURIComponent(e.path)}`;
    return typeof s == "string" && (o += `&${Va}=${encodeURIComponent(s)}`), oe.from({
      scheme: sa ? this._preferredWebSchema : Ue.vscodeRemoteResource,
      authority: `${r}:${i}`,
      path: this._remoteResourcesPath,
      query: o
    });
  }
}
const $a = new qa(), Wa = "vscode-app", Rt = class Rt {
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
    return e.scheme === Ue.vscodeRemote ? $a.rewrite(e) : (
      // ...only ever for `file` resources
      e.scheme === Ue.file && // ...and we run in native environments
      (ia || // ...or web worker extensions on desktop
      aa === `${Ue.vscodeFileResource}://${Rt.FALLBACK_AUTHORITY}`) ? e.with({
        scheme: Ue.vscodeFileResource,
        // We need to provide an authority here so that it can serve
        // as origin for network and loading matters in chromium.
        // If the URI is not coming with an authority already, we
        // add our own
        authority: e.authority || Rt.FALLBACK_AUTHORITY,
        query: null,
        fragment: null
      }) : e
    );
  }
  toUri(e, n) {
    if (oe.isUri(e))
      return e;
    if (globalThis._VSCODE_FILE_ROOT) {
      const r = globalThis._VSCODE_FILE_ROOT;
      if (/^\w[\w\d+.-]*:\/\//.test(r))
        return oe.joinPath(oe.parse(r, !0), e);
      const i = Ma(r, e);
      return oe.file(i);
    }
    return oe.parse(n.toUrl(e));
  }
};
Rt.FALLBACK_AUTHORITY = Wa;
let Jn = Rt;
const fs = new Jn();
var Xr;
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
    typeof s == "string" ? o = new URL(s).searchParams : s instanceof URL ? o = s.searchParams : oe.isUri(s) && (o = new URL(s.toString(!0)).searchParams);
    const l = o?.get(n);
    if (l)
      return e.get(l);
  }
  t.getHeadersFromQuery = r;
  function i(s, o, l) {
    if (!globalThis.crossOriginIsolated)
      return;
    const u = o && l ? "3" : l ? "2" : "1";
    s instanceof URLSearchParams ? s.set(n, u) : s[n] = u;
  }
  t.addSearchParam = i;
})(Xr || (Xr = {}));
const Mn = "default", Ha = "$initialize";
class Oa {
  constructor(e, n, r, i, s) {
    this.vsWorker = e, this.req = n, this.channel = r, this.method = i, this.args = s, this.type = 0;
  }
}
class Jr {
  constructor(e, n, r, i) {
    this.vsWorker = e, this.seq = n, this.res = r, this.err = i, this.type = 1;
  }
}
class za {
  constructor(e, n, r, i, s) {
    this.vsWorker = e, this.req = n, this.channel = r, this.eventName = i, this.arg = s, this.type = 2;
  }
}
class ja {
  constructor(e, n, r) {
    this.vsWorker = e, this.req = n, this.event = r, this.type = 3;
  }
}
class Ga {
  constructor(e, n) {
    this.vsWorker = e, this.req = n, this.type = 4;
  }
}
class Qa {
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
      }, this._send(new Oa(this._workerId, i, e, n, r));
    });
  }
  listen(e, n, r) {
    let i = null;
    const s = new me({
      onWillAddFirstListener: () => {
        i = String(++this._lastSentReq), this._pendingEmitters.set(i, s), this._send(new za(this._workerId, i, e, n, r));
      },
      onDidRemoveLastListener: () => {
        this._pendingEmitters.delete(i), this._send(new Ga(this._workerId, i)), i = null;
      }
    });
    return s.event;
  }
  handleMessage(e) {
    !e || !e.vsWorker || this._workerId !== -1 && e.vsWorker !== this._workerId || this._handleMessage(e);
  }
  createProxyToRemoteChannel(e, n) {
    const r = {
      get: (i, s) => (typeof s == "string" && !i[s] && (ds(s) ? i[s] = (o) => this.listen(e, s, o) : ms(s) ? i[s] = this.listen(e, s, void 0) : s.charCodeAt(0) === 36 && (i[s] = async (...o) => (await n?.(), this.sendMessage(e, s, o)))), i[s])
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
      this._send(new Jr(this._workerId, n, i, void 0));
    }, (i) => {
      i.detail instanceof Error && (i.detail = Cr(i.detail)), this._send(new Jr(this._workerId, n, void 0, Cr(i)));
    });
  }
  _handleSubscribeEventMessage(e) {
    const n = e.req, r = this._handler.handleEvent(e.channel, e.eventName, e.arg)((i) => {
      this._send(new ja(this._workerId, n, i));
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
function ms(t) {
  return t[0] === "o" && t[1] === "n" && ss(t.charCodeAt(2));
}
function ds(t) {
  return /^onDynamic/.test(t) && ss(t.charCodeAt(9));
}
class Ya {
  constructor(e, n) {
    this._localChannels = /* @__PURE__ */ new Map(), this._remoteChannels = /* @__PURE__ */ new Map(), this._requestHandlerFactory = n, this._requestHandler = null, this._protocol = new Qa({
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
    if (e === Mn && n === Ha)
      return this.initialize(r[0], r[1], r[2]);
    const i = e === Mn ? this._requestHandler : this._localChannels.get(e);
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
    const i = e === Mn ? this._requestHandler : this._localChannels.get(e);
    if (!i)
      throw new Error(`Missing channel ${e} on worker thread`);
    if (ds(n)) {
      const s = i[n].call(i, r);
      if (typeof s != "function")
        throw new Error(`Missing dynamic event ${n} on request handler.`);
      return s;
    }
    if (ms(n)) {
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
    return n && (typeof n.baseUrl < "u" && delete n.baseUrl, typeof n.paths < "u" && typeof n.paths.vs < "u" && delete n.paths.vs, typeof n.trustedTypesPolicy < "u" && delete n.trustedTypesPolicy, n.catchError = !0, globalThis.require.config(n)), import(`${fs.asBrowserUri(`${r}.js`).toString(!0)}`).then((s) => {
      if (this._requestHandler = s.create(this), !this._requestHandler)
        throw new Error("No RequestHandler!");
    });
  }
}
class Be {
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
function Zr(t, e) {
  return (e << 5) - e + t | 0;
}
function Xa(t, e) {
  e = Zr(149417, e);
  for (let n = 0, r = t.length; n < r; n++)
    e = Zr(t.charCodeAt(n), e);
  return e;
}
function kn(t, e, n = 32) {
  const r = n - e, i = ~((1 << r) - 1);
  return (t << e | (i & t) >>> r) >>> 0;
}
function Kr(t, e = 0, n = t.byteLength, r = 0) {
  for (let i = 0; i < n; i++)
    t[e + i] = r;
}
function Ja(t, e, n = "0") {
  for (; t.length < e; )
    t = n + t;
  return t;
}
function wt(t, e = 32) {
  return t instanceof ArrayBuffer ? Array.from(new Uint8Array(t)).map((n) => n.toString(16).padStart(2, "0")).join("") : Ja((t >>> 0).toString(16), e / 4);
}
const hn = class hn {
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
      let u = o;
      if (Kt(o))
        if (l + 1 < n) {
          const c = e.charCodeAt(l + 1);
          Gn(c) ? (l++, u = os(o, c)) : u = 65533;
        } else {
          s = o;
          break;
        }
      else Gn(o) && (u = 65533);
      if (i = this._push(r, i, u), l++, l < n)
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
    )), this._totalLen += this._buffLen, this._wrapUp()), wt(this._h0) + wt(this._h1) + wt(this._h2) + wt(this._h3) + wt(this._h4);
  }
  _wrapUp() {
    this._buff[this._buffLen++] = 128, Kr(this._buff, this._buffLen), this._buffLen > 56 && (this._step(), Kr(this._buff));
    const e = 8 * this._totalLen;
    this._buffDV.setUint32(56, Math.floor(e / 4294967296), !1), this._buffDV.setUint32(60, e % 4294967296, !1), this._step();
  }
  _step() {
    const e = hn._bigBlock32, n = this._buffDV;
    for (let h = 0; h < 64; h += 4)
      e.setUint32(h, n.getUint32(h, !1), !1);
    for (let h = 64; h < 320; h += 4)
      e.setUint32(h, kn(e.getUint32(h - 12, !1) ^ e.getUint32(h - 32, !1) ^ e.getUint32(h - 56, !1) ^ e.getUint32(h - 64, !1), 1), !1);
    let r = this._h0, i = this._h1, s = this._h2, o = this._h3, l = this._h4, u, c, f;
    for (let h = 0; h < 80; h++)
      h < 20 ? (u = i & s | ~i & o, c = 1518500249) : h < 40 ? (u = i ^ s ^ o, c = 1859775393) : h < 60 ? (u = i & s | i & o | s & o, c = 2400959708) : (u = i ^ s ^ o, c = 3395469782), f = kn(r, 5) + u + l + c + e.getUint32(h * 4, !1) & 4294967295, l = o, o = s, s = kn(i, 30), i = r, r = f;
    this._h0 = this._h0 + r & 4294967295, this._h1 = this._h1 + i & 4294967295, this._h2 = this._h2 + s & 4294967295, this._h3 = this._h3 + o & 4294967295, this._h4 = this._h4 + l & 4294967295;
  }
};
hn._bigBlock32 = new DataView(new ArrayBuffer(320));
let ei = hn;
class ti {
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
function Za(t, e, n) {
  return new De(new ti(t), new ti(e)).ComputeDiff(n).changes;
}
class Ze {
  static Assert(e, n) {
    if (!e)
      throw new Error(n);
  }
}
class Ke {
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
class ni {
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
    (this.m_originalCount > 0 || this.m_modifiedCount > 0) && this.m_changes.push(new Be(this.m_originalStart, this.m_originalCount, this.m_modifiedStart, this.m_modifiedCount)), this.m_originalCount = 0, this.m_modifiedCount = 0, this.m_originalStart = 1073741824, this.m_modifiedStart = 1073741824;
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
class De {
  /**
   * Constructs the DiffFinder
   */
  constructor(e, n, r = null) {
    this.ContinueProcessingPredicate = r, this._originalSequence = e, this._modifiedSequence = n;
    const [i, s, o] = De._getElements(e), [l, u, c] = De._getElements(n);
    this._hasStrings = o && c, this._originalStringElements = i, this._originalElementsOrHash = s, this._modifiedStringElements = l, this._modifiedElementsOrHash = u, this.m_forwardHistory = [], this.m_reverseHistory = [];
  }
  static _isStringArray(e) {
    return e.length > 0 && typeof e[0] == "string";
  }
  static _getElements(e) {
    const n = e.getElements();
    if (De._isStringArray(n)) {
      const r = new Int32Array(n.length);
      for (let i = 0, s = n.length; i < s; i++)
        r[i] = Xa(n[i], 0);
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
    const r = De._getStrictElement(this._originalSequence, e), i = De._getStrictElement(this._modifiedSequence, n);
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
      let h;
      return r <= i ? (Ze.Assert(e === n + 1, "originalStart should only be one more than originalEnd"), h = [
        new Be(e, 0, r, i - r + 1)
      ]) : e <= n ? (Ze.Assert(r === i + 1, "modifiedStart should only be one more than modifiedEnd"), h = [
        new Be(e, n - e + 1, r, 0)
      ]) : (Ze.Assert(e === n + 1, "originalStart should only be one more than originalEnd"), Ze.Assert(r === i + 1, "modifiedStart should only be one more than modifiedEnd"), h = []), h;
    }
    const o = [0], l = [0], u = this.ComputeRecursionPoint(e, n, r, i, o, l, s), c = o[0], f = l[0];
    if (u !== null)
      return u;
    if (!s[0]) {
      const h = this.ComputeDiffRecursive(e, c, r, f, s);
      let m = [];
      return s[0] ? m = [
        new Be(c + 1, n - (c + 1) + 1, f + 1, i - (f + 1) + 1)
      ] : m = this.ComputeDiffRecursive(c + 1, n, f + 1, i, s), this.ConcatenateChanges(h, m);
    }
    return [
      new Be(e, n - e + 1, r, i - r + 1)
    ];
  }
  WALKTRACE(e, n, r, i, s, o, l, u, c, f, h, m, d, g, b, x, v, E) {
    let N = null, _ = null, y = new ni(), w = n, A = r, C = d[0] - x[0] - i, V = -1073741824, J = this.m_forwardHistory.length - 1;
    do {
      const $ = C + e;
      $ === w || $ < A && c[$ - 1] < c[$ + 1] ? (h = c[$ + 1], g = h - C - i, h < V && y.MarkNextChange(), V = h, y.AddModifiedElement(h + 1, g), C = $ + 1 - e) : (h = c[$ - 1] + 1, g = h - C - i, h < V && y.MarkNextChange(), V = h - 1, y.AddOriginalElement(h, g + 1), C = $ - 1 - e), J >= 0 && (c = this.m_forwardHistory[J], e = c[0], w = 1, A = c.length - 1);
    } while (--J >= -1);
    if (N = y.getReverseChanges(), E[0]) {
      let $ = d[0] + 1, P = x[0] + 1;
      if (N !== null && N.length > 0) {
        const S = N[N.length - 1];
        $ = Math.max($, S.getOriginalEnd()), P = Math.max(P, S.getModifiedEnd());
      }
      _ = [
        new Be($, m - $ + 1, P, b - P + 1)
      ];
    } else {
      y = new ni(), w = o, A = l, C = d[0] - x[0] - u, V = 1073741824, J = v ? this.m_reverseHistory.length - 1 : this.m_reverseHistory.length - 2;
      do {
        const $ = C + s;
        $ === w || $ < A && f[$ - 1] >= f[$ + 1] ? (h = f[$ + 1] - 1, g = h - C - u, h > V && y.MarkNextChange(), V = h + 1, y.AddOriginalElement(h + 1, g + 1), C = $ + 1 - s) : (h = f[$ - 1], g = h - C - u, h > V && y.MarkNextChange(), V = h, y.AddModifiedElement(h + 1, g + 1), C = $ - 1 - s), J >= 0 && (f = this.m_reverseHistory[J], s = f[0], w = 1, A = f.length - 1);
      } while (--J >= -1);
      _ = y.getChanges();
    }
    return this.ConcatenateChanges(N, _);
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
    let u = 0, c = 0, f = 0, h = 0, m = 0, d = 0;
    e--, r--, s[0] = 0, o[0] = 0, this.m_forwardHistory = [], this.m_reverseHistory = [];
    const g = n - e + (i - r), b = g + 1, x = new Int32Array(b), v = new Int32Array(b), E = i - r, N = n - e, _ = e - r, y = n - i, A = (N - E) % 2 === 0;
    x[E] = e, v[N] = n, l[0] = !1;
    for (let C = 1; C <= g / 2 + 1; C++) {
      let V = 0, J = 0;
      f = this.ClipDiagonalBound(E - C, C, E, b), h = this.ClipDiagonalBound(E + C, C, E, b);
      for (let P = f; P <= h; P += 2) {
        P === f || P < h && x[P - 1] < x[P + 1] ? u = x[P + 1] : u = x[P - 1] + 1, c = u - (P - E) - _;
        const S = u;
        for (; u < n && c < i && this.ElementsAreEqual(u + 1, c + 1); )
          u++, c++;
        if (x[P] = u, u + c > V + J && (V = u, J = c), !A && Math.abs(P - N) <= C - 1 && u >= v[P])
          return s[0] = u, o[0] = c, S <= v[P] && C <= 1448 ? this.WALKTRACE(E, f, h, _, N, m, d, y, x, v, u, n, s, c, i, o, A, l) : null;
      }
      const $ = (V - e + (J - r) - C) / 2;
      if (this.ContinueProcessingPredicate !== null && !this.ContinueProcessingPredicate(V, $))
        return l[0] = !0, s[0] = V, o[0] = J, $ > 0 && C <= 1448 ? this.WALKTRACE(E, f, h, _, N, m, d, y, x, v, u, n, s, c, i, o, A, l) : (e++, r++, [
          new Be(e, n - e + 1, r, i - r + 1)
        ]);
      m = this.ClipDiagonalBound(N - C, C, N, b), d = this.ClipDiagonalBound(N + C, C, N, b);
      for (let P = m; P <= d; P += 2) {
        P === m || P < d && v[P - 1] >= v[P + 1] ? u = v[P + 1] - 1 : u = v[P - 1], c = u - (P - N) - y;
        const S = u;
        for (; u > e && c > r && this.ElementsAreEqual(u, c); )
          u--, c--;
        if (v[P] = u, A && Math.abs(P - E) <= C && u <= x[P])
          return s[0] = u, o[0] = c, S >= x[P] && C <= 1448 ? this.WALKTRACE(E, f, h, _, N, m, d, y, x, v, u, n, s, c, i, o, A, l) : null;
      }
      if (C <= 1447) {
        let P = new Int32Array(h - f + 2);
        P[0] = E - f + 1, Ke.Copy2(x, f, P, 1, h - f + 1), this.m_forwardHistory.push(P), P = new Int32Array(d - m + 2), P[0] = N - m + 1, Ke.Copy2(v, m, P, 1, d - m + 1), this.m_reverseHistory.push(P);
      }
    }
    return this.WALKTRACE(E, f, h, _, N, m, d, y, x, v, u, n, s, c, i, o, A, l);
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
        const c = this.ElementsAreStrictEqual(r.originalStart, r.modifiedStart);
        if (this.ElementsAreStrictEqual(r.originalStart + r.originalLength, r.modifiedStart + r.modifiedLength) && !c)
          break;
        r.originalStart++, r.modifiedStart++;
      }
      const u = [null];
      if (n < e.length - 1 && this.ChangesOverlap(e[n], e[n + 1], u)) {
        e[n] = u[0], e.splice(n + 1, 1), n--;
        continue;
      }
    }
    for (let n = e.length - 1; n >= 0; n--) {
      const r = e[n];
      let i = 0, s = 0;
      if (n > 0) {
        const h = e[n - 1];
        i = h.originalStart + h.originalLength, s = h.modifiedStart + h.modifiedLength;
      }
      const o = r.originalLength > 0, l = r.modifiedLength > 0;
      let u = 0, c = this._boundaryScore(r.originalStart, r.originalLength, r.modifiedStart, r.modifiedLength);
      for (let h = 1; ; h++) {
        const m = r.originalStart - h, d = r.modifiedStart - h;
        if (m < i || d < s || o && !this.OriginalElementsAreEqual(m, m + r.originalLength) || l && !this.ModifiedElementsAreEqual(d, d + r.modifiedLength))
          break;
        const b = (m === i && d === s ? 5 : 0) + this._boundaryScore(m, r.originalLength, d, r.modifiedLength);
        b > c && (c = b, u = h);
      }
      r.originalStart -= u, r.modifiedStart -= u;
      const f = [null];
      if (n > 0 && this.ChangesOverlap(e[n - 1], e[n], f)) {
        e[n - 1] = f[0], e.splice(n, 1), n++;
        continue;
      }
    }
    if (this._hasStrings)
      for (let n = 1, r = e.length; n < r; n++) {
        const i = e[n - 1], s = e[n], o = s.originalStart - i.originalStart - i.originalLength, l = i.originalStart, u = s.originalStart + s.originalLength, c = u - l, f = i.modifiedStart, h = s.modifiedStart + s.modifiedLength, m = h - f;
        if (o < 5 && c < 20 && m < 20) {
          const d = this._findBetterContiguousSequence(l, c, f, m, o);
          if (d) {
            const [g, b] = d;
            (g !== i.originalStart + i.originalLength || b !== i.modifiedStart + i.modifiedLength) && (i.originalLength = g - i.originalStart, i.modifiedLength = b - i.modifiedStart, s.originalStart = g + o, s.modifiedStart = b + o, s.originalLength = u - s.originalStart, s.modifiedLength = h - s.modifiedStart);
          }
        }
      }
    return e;
  }
  _findBetterContiguousSequence(e, n, r, i, s) {
    if (n < s || i < s)
      return null;
    const o = e + n - s + 1, l = r + i - s + 1;
    let u = 0, c = 0, f = 0;
    for (let h = e; h < o; h++)
      for (let m = r; m < l; m++) {
        const d = this._contiguousSequenceScore(h, m, s);
        d > 0 && d > u && (u = d, c = h, f = m);
      }
    return u > 0 ? [c, f] : null;
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
      return Ke.Copy(e, 0, i, 0, e.length - 1), i[e.length - 1] = r[0], Ke.Copy(n, 1, i, e.length, n.length - 1), i;
    } else {
      const i = new Array(e.length + n.length);
      return Ke.Copy(e, 0, i, 0, e.length), Ke.Copy(n, 0, i, e.length, n.length), i;
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
    if (Ze.Assert(e.originalStart <= n.originalStart, "Left change is not less than or equal to right change"), Ze.Assert(e.modifiedStart <= n.modifiedStart, "Left change is not less than or equal to right change"), e.originalStart + e.originalLength >= n.originalStart || e.modifiedStart + e.modifiedLength >= n.modifiedStart) {
      const i = e.originalStart;
      let s = e.originalLength;
      const o = e.modifiedStart;
      let l = e.modifiedLength;
      return e.originalStart + e.originalLength >= n.originalStart && (s = n.originalStart + n.originalLength - e.originalStart), e.modifiedStart + e.modifiedLength >= n.modifiedStart && (l = n.modifiedStart + n.modifiedLength - e.modifiedStart), r[0] = new Be(i, s, o, l), !0;
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
      const u = s % 2 === 0;
      return l === u ? 0 : 1;
    } else {
      const u = o % 2 === 0;
      return l === u ? i - 1 : i - 2;
    }
  }
}
class O {
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
    return e === this.lineNumber && n === this.column ? this : new O(e, n);
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
    return O.equals(this, e);
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
    return O.isBefore(this, e);
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
    return O.isBeforeOrEqual(this, e);
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
    return new O(this.lineNumber, this.column);
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
    return new O(e.lineNumber, e.column);
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
}
class I {
  constructor(e, n, r, i) {
    e > r || e === r && n > i ? (this.startLineNumber = r, this.startColumn = i, this.endLineNumber = e, this.endColumn = n) : (this.startLineNumber = e, this.startColumn = n, this.endLineNumber = r, this.endColumn = i);
  }
  /**
   * Test if this range is empty.
   */
  isEmpty() {
    return I.isEmpty(this);
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
    return I.containsPosition(this, e);
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
    return I.containsRange(this, e);
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
    return I.strictContainsRange(this, e);
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
    return I.plusRange(this, e);
  }
  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  static plusRange(e, n) {
    let r, i, s, o;
    return n.startLineNumber < e.startLineNumber ? (r = n.startLineNumber, i = n.startColumn) : n.startLineNumber === e.startLineNumber ? (r = n.startLineNumber, i = Math.min(n.startColumn, e.startColumn)) : (r = e.startLineNumber, i = e.startColumn), n.endLineNumber > e.endLineNumber ? (s = n.endLineNumber, o = n.endColumn) : n.endLineNumber === e.endLineNumber ? (s = n.endLineNumber, o = Math.max(n.endColumn, e.endColumn)) : (s = e.endLineNumber, o = e.endColumn), new I(r, i, s, o);
  }
  /**
   * A intersection of the two ranges.
   */
  intersectRanges(e) {
    return I.intersectRanges(this, e);
  }
  /**
   * A intersection of the two ranges.
   */
  static intersectRanges(e, n) {
    let r = e.startLineNumber, i = e.startColumn, s = e.endLineNumber, o = e.endColumn;
    const l = n.startLineNumber, u = n.startColumn, c = n.endLineNumber, f = n.endColumn;
    return r < l ? (r = l, i = u) : r === l && (i = Math.max(i, u)), s > c ? (s = c, o = f) : s === c && (o = Math.min(o, f)), r > s || r === s && i > o ? null : new I(r, i, s, o);
  }
  /**
   * Test if this range equals other.
   */
  equalsRange(e) {
    return I.equalsRange(this, e);
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
    return I.getEndPosition(this);
  }
  /**
   * Return the end position (which will be after or equal to the start position)
   */
  static getEndPosition(e) {
    return new O(e.endLineNumber, e.endColumn);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  getStartPosition() {
    return I.getStartPosition(this);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  static getStartPosition(e) {
    return new O(e.startLineNumber, e.startColumn);
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
    return new I(this.startLineNumber, this.startColumn, e, n);
  }
  /**
   * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
   */
  setStartPosition(e, n) {
    return new I(e, n, this.endLineNumber, this.endColumn);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  collapseToStart() {
    return I.collapseToStart(this);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  static collapseToStart(e) {
    return new I(e.startLineNumber, e.startColumn, e.startLineNumber, e.startColumn);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  collapseToEnd() {
    return I.collapseToEnd(this);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  static collapseToEnd(e) {
    return new I(e.endLineNumber, e.endColumn, e.endLineNumber, e.endColumn);
  }
  /**
   * Moves the range by the given amount of lines.
   */
  delta(e) {
    return new I(this.startLineNumber + e, this.startColumn, this.endLineNumber + e, this.endColumn);
  }
  // ---
  static fromPositions(e, n = e) {
    return new I(e.lineNumber, e.column, n.lineNumber, n.column);
  }
  static lift(e) {
    return e ? new I(e.startLineNumber, e.startColumn, e.endLineNumber, e.endColumn) : null;
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
        const l = e.startColumn | 0, u = n.startColumn | 0;
        if (l === u) {
          const c = e.endLineNumber | 0, f = n.endLineNumber | 0;
          if (c === f) {
            const h = e.endColumn | 0, m = n.endColumn | 0;
            return h - m;
          }
          return c - f;
        }
        return l - u;
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
}
function ri(t) {
  return t < 0 ? 0 : t > 255 ? 255 : t | 0;
}
function et(t) {
  return t < 0 ? 0 : t > 4294967295 ? 4294967295 : t | 0;
}
class Nr {
  constructor(e) {
    const n = ri(e);
    this._defaultValue = n, this._asciiMap = Nr._createAsciiMap(n), this._map = /* @__PURE__ */ new Map();
  }
  static _createAsciiMap(e) {
    const n = new Uint8Array(256);
    return n.fill(e), n;
  }
  set(e, n) {
    const r = ri(n);
    e >= 0 && e < 256 ? this._asciiMap[e] = r : this._map.set(e, r);
  }
  get(e) {
    return e >= 0 && e < 256 ? this._asciiMap[e] : this._map.get(e) || this._defaultValue;
  }
  clear() {
    this._asciiMap.fill(this._defaultValue), this._map.clear();
  }
}
class Ka {
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
class el {
  constructor(e) {
    let n = 0, r = 0;
    for (let s = 0, o = e.length; s < o; s++) {
      const [l, u, c] = e[s];
      u > n && (n = u), l > r && (r = l), c > r && (r = c);
    }
    n++, r++;
    const i = new Ka(
      r,
      n,
      0
      /* State.Invalid */
    );
    for (let s = 0, o = e.length; s < o; s++) {
      const [l, u, c] = e[s];
      i.set(l, u, c);
    }
    this._states = i, this._maxCharCode = n;
  }
  nextState(e, n) {
    return n < 0 || n >= this._maxCharCode ? 0 : this._states.get(e, n);
  }
}
let In = null;
function tl() {
  return In === null && (In = new el([
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
  ])), In;
}
let xt = null;
function nl() {
  if (xt === null) {
    xt = new Nr(
      0
      /* CharacterClass.None */
    );
    const t = ` 	<>'"、。｡､，．：；‘〈「『〔（［｛｢｣｝］）〕』」〉’｀～…`;
    for (let n = 0; n < t.length; n++)
      xt.set(
        t.charCodeAt(n),
        1
        /* CharacterClass.ForceTermination */
      );
    const e = ".,;:";
    for (let n = 0; n < e.length; n++)
      xt.set(
        e.charCodeAt(n),
        2
        /* CharacterClass.CannotEndIn */
      );
  }
  return xt;
}
class nn {
  static _createLink(e, n, r, i, s) {
    let o = s - 1;
    do {
      const l = n.charCodeAt(o);
      if (e.get(l) !== 2)
        break;
      o--;
    } while (o > i);
    if (i > 0) {
      const l = n.charCodeAt(i - 1), u = n.charCodeAt(o);
      (l === 40 && u === 41 || l === 91 && u === 93 || l === 123 && u === 125) && o--;
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
  static computeLinks(e, n = tl()) {
    const r = nl(), i = [];
    for (let s = 1, o = e.getLineCount(); s <= o; s++) {
      const l = e.getLineContent(s), u = l.length;
      let c = 0, f = 0, h = 0, m = 1, d = !1, g = !1, b = !1, x = !1;
      for (; c < u; ) {
        let v = !1;
        const E = l.charCodeAt(c);
        if (m === 13) {
          let N;
          switch (E) {
            case 40:
              d = !0, N = 0;
              break;
            case 41:
              N = d ? 0 : 1;
              break;
            case 91:
              b = !0, g = !0, N = 0;
              break;
            case 93:
              b = !1, N = g ? 0 : 1;
              break;
            case 123:
              x = !0, N = 0;
              break;
            case 125:
              N = x ? 0 : 1;
              break;
            // The following three rules make it that ' or " or ` are allowed inside links
            // only if the link is wrapped by some other quote character
            case 39:
            case 34:
            case 96:
              h === E ? N = 1 : h === 39 || h === 34 || h === 96 ? N = 0 : N = 1;
              break;
            case 42:
              N = h === 42 ? 1 : 0;
              break;
            case 124:
              N = h === 124 ? 1 : 0;
              break;
            case 32:
              N = b ? 0 : 1;
              break;
            default:
              N = r.get(E);
          }
          N === 1 && (i.push(nn._createLink(r, l, s, f, c)), v = !0);
        } else if (m === 12) {
          let N;
          E === 91 ? (g = !0, N = 0) : N = r.get(E), N === 1 ? v = !0 : m = 13;
        } else
          m = n.nextState(m, E), m === 0 && (v = !0);
        v && (m = 1, d = !1, g = !1, x = !1, f = c + 1, h = E), c++;
      }
      m === 13 && i.push(nn._createLink(r, l, s, f, u));
    }
    return i;
  }
}
function rl(t) {
  return !t || typeof t.getLineCount != "function" || typeof t.getLineContent != "function" ? [] : nn.computeLinks(t);
}
const fn = class fn {
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
fn.INSTANCE = new fn();
let Zn = fn;
const gs = Object.freeze(function(t, e) {
  const n = setTimeout(t.bind(e), 0);
  return { dispose() {
    clearTimeout(n);
  } };
});
var rn;
(function(t) {
  function e(n) {
    return n === t.None || n === t.Cancelled || n instanceof Wt ? !0 : !n || typeof n != "object" ? !1 : typeof n.isCancellationRequested == "boolean" && typeof n.onCancellationRequested == "function";
  }
  t.isCancellationToken = e, t.None = Object.freeze({
    isCancellationRequested: !1,
    onCancellationRequested: Xt.None
  }), t.Cancelled = Object.freeze({
    isCancellationRequested: !0,
    onCancellationRequested: gs
  });
})(rn || (rn = {}));
class Wt {
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
    return this._isCancelled ? gs : (this._emitter || (this._emitter = new me()), this._emitter.event);
  }
  dispose() {
    this._emitter && (this._emitter.dispose(), this._emitter = null);
  }
}
class il {
  constructor(e) {
    this._token = void 0, this._parentListener = void 0, this._parentListener = e && e.onCancellationRequested(this.cancel, this);
  }
  get token() {
    return this._token || (this._token = new Wt()), this._token;
  }
  cancel() {
    this._token ? this._token instanceof Wt && this._token.cancel() : this._token = rn.Cancelled;
  }
  dispose(e = !1) {
    e && this.cancel(), this._parentListener?.dispose(), this._token ? this._token instanceof Wt && this._token.dispose() : this._token = rn.None;
  }
}
class Er {
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
const Ht = new Er(), Kn = new Er(), er = new Er(), sl = new Array(230), ol = /* @__PURE__ */ Object.create(null), al = /* @__PURE__ */ Object.create(null);
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
    const [s, o, l, u, c, f, h, m, d] = i;
    if (r[o] || (r[o] = !0, ol[l] = o, al[l.toLowerCase()] = o), !n[u]) {
      if (n[u] = !0, !c)
        throw new Error(`String representation missing for key code ${u} around scan code ${l}`);
      Ht.define(u, c), Kn.define(u, m || c), er.define(u, d || m || c);
    }
    f && (sl[f] = u);
  }
})();
var ii;
(function(t) {
  function e(l) {
    return Ht.keyCodeToStr(l);
  }
  t.toString = e;
  function n(l) {
    return Ht.strToKeyCode(l);
  }
  t.fromString = n;
  function r(l) {
    return Kn.keyCodeToStr(l);
  }
  t.toUserSettingsUS = r;
  function i(l) {
    return er.keyCodeToStr(l);
  }
  t.toUserSettingsGeneral = i;
  function s(l) {
    return Kn.strToKeyCode(l) || er.strToKeyCode(l);
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
    return Ht.keyCodeToStr(l);
  }
  t.toElectronAccelerator = o;
})(ii || (ii = {}));
function ll(t, e) {
  const n = (e & 65535) << 16 >>> 0;
  return (t | n) >>> 0;
}
class le extends I {
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
    return le.selectionsEqual(this, e);
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
    return this.getDirection() === 0 ? new le(this.startLineNumber, this.startColumn, e, n) : new le(e, n, this.startLineNumber, this.startColumn);
  }
  /**
   * Get the position at `positionLineNumber` and `positionColumn`.
   */
  getPosition() {
    return new O(this.positionLineNumber, this.positionColumn);
  }
  /**
   * Get the position at the start of the selection.
  */
  getSelectionStart() {
    return new O(this.selectionStartLineNumber, this.selectionStartColumn);
  }
  /**
   * Create a new selection with a different `selectionStartLineNumber` and `selectionStartColumn`.
   */
  setStartPosition(e, n) {
    return this.getDirection() === 0 ? new le(e, n, this.endLineNumber, this.endColumn) : new le(this.endLineNumber, this.endColumn, e, n);
  }
  // ----
  /**
   * Create a `Selection` from one or two positions
   */
  static fromPositions(e, n = e) {
    return new le(e.lineNumber, e.column, n.lineNumber, n.column);
  }
  /**
   * Creates a `Selection` from a range, given a direction.
   */
  static fromRange(e, n) {
    return n === 0 ? new le(e.startLineNumber, e.startColumn, e.endLineNumber, e.endColumn) : new le(e.endLineNumber, e.endColumn, e.startLineNumber, e.startColumn);
  }
  /**
   * Create a `Selection` from an `ISelection`.
   */
  static liftSelection(e) {
    return new le(e.selectionStartLineNumber, e.selectionStartColumn, e.positionLineNumber, e.positionColumn);
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
    return s === 0 ? new le(e, n, r, i) : new le(r, i, e, n);
  }
}
function ul(t) {
  return typeof t == "string";
}
const si = /* @__PURE__ */ Object.create(null);
function a(t, e) {
  if (ul(e)) {
    const n = si[e];
    if (n === void 0)
      throw new Error(`${t} references an unknown codicon: ${e}`);
    e = n;
  }
  return si[t] = e, { id: t };
}
const cl = {
  add: a("add", 6e4),
  plus: a("plus", 6e4),
  gistNew: a("gist-new", 6e4),
  repoCreate: a("repo-create", 6e4),
  lightbulb: a("lightbulb", 60001),
  lightBulb: a("light-bulb", 60001),
  repo: a("repo", 60002),
  repoDelete: a("repo-delete", 60002),
  gistFork: a("gist-fork", 60003),
  repoForked: a("repo-forked", 60003),
  gitPullRequest: a("git-pull-request", 60004),
  gitPullRequestAbandoned: a("git-pull-request-abandoned", 60004),
  recordKeys: a("record-keys", 60005),
  keyboard: a("keyboard", 60005),
  tag: a("tag", 60006),
  gitPullRequestLabel: a("git-pull-request-label", 60006),
  tagAdd: a("tag-add", 60006),
  tagRemove: a("tag-remove", 60006),
  person: a("person", 60007),
  personFollow: a("person-follow", 60007),
  personOutline: a("person-outline", 60007),
  personFilled: a("person-filled", 60007),
  gitBranch: a("git-branch", 60008),
  gitBranchCreate: a("git-branch-create", 60008),
  gitBranchDelete: a("git-branch-delete", 60008),
  sourceControl: a("source-control", 60008),
  mirror: a("mirror", 60009),
  mirrorPublic: a("mirror-public", 60009),
  star: a("star", 60010),
  starAdd: a("star-add", 60010),
  starDelete: a("star-delete", 60010),
  starEmpty: a("star-empty", 60010),
  comment: a("comment", 60011),
  commentAdd: a("comment-add", 60011),
  alert: a("alert", 60012),
  warning: a("warning", 60012),
  search: a("search", 60013),
  searchSave: a("search-save", 60013),
  logOut: a("log-out", 60014),
  signOut: a("sign-out", 60014),
  logIn: a("log-in", 60015),
  signIn: a("sign-in", 60015),
  eye: a("eye", 60016),
  eyeUnwatch: a("eye-unwatch", 60016),
  eyeWatch: a("eye-watch", 60016),
  circleFilled: a("circle-filled", 60017),
  primitiveDot: a("primitive-dot", 60017),
  closeDirty: a("close-dirty", 60017),
  debugBreakpoint: a("debug-breakpoint", 60017),
  debugBreakpointDisabled: a("debug-breakpoint-disabled", 60017),
  debugHint: a("debug-hint", 60017),
  terminalDecorationSuccess: a("terminal-decoration-success", 60017),
  primitiveSquare: a("primitive-square", 60018),
  edit: a("edit", 60019),
  pencil: a("pencil", 60019),
  info: a("info", 60020),
  issueOpened: a("issue-opened", 60020),
  gistPrivate: a("gist-private", 60021),
  gitForkPrivate: a("git-fork-private", 60021),
  lock: a("lock", 60021),
  mirrorPrivate: a("mirror-private", 60021),
  close: a("close", 60022),
  removeClose: a("remove-close", 60022),
  x: a("x", 60022),
  repoSync: a("repo-sync", 60023),
  sync: a("sync", 60023),
  clone: a("clone", 60024),
  desktopDownload: a("desktop-download", 60024),
  beaker: a("beaker", 60025),
  microscope: a("microscope", 60025),
  vm: a("vm", 60026),
  deviceDesktop: a("device-desktop", 60026),
  file: a("file", 60027),
  fileText: a("file-text", 60027),
  more: a("more", 60028),
  ellipsis: a("ellipsis", 60028),
  kebabHorizontal: a("kebab-horizontal", 60028),
  mailReply: a("mail-reply", 60029),
  reply: a("reply", 60029),
  organization: a("organization", 60030),
  organizationFilled: a("organization-filled", 60030),
  organizationOutline: a("organization-outline", 60030),
  newFile: a("new-file", 60031),
  fileAdd: a("file-add", 60031),
  newFolder: a("new-folder", 60032),
  fileDirectoryCreate: a("file-directory-create", 60032),
  trash: a("trash", 60033),
  trashcan: a("trashcan", 60033),
  history: a("history", 60034),
  clock: a("clock", 60034),
  folder: a("folder", 60035),
  fileDirectory: a("file-directory", 60035),
  symbolFolder: a("symbol-folder", 60035),
  logoGithub: a("logo-github", 60036),
  markGithub: a("mark-github", 60036),
  github: a("github", 60036),
  terminal: a("terminal", 60037),
  console: a("console", 60037),
  repl: a("repl", 60037),
  zap: a("zap", 60038),
  symbolEvent: a("symbol-event", 60038),
  error: a("error", 60039),
  stop: a("stop", 60039),
  variable: a("variable", 60040),
  symbolVariable: a("symbol-variable", 60040),
  array: a("array", 60042),
  symbolArray: a("symbol-array", 60042),
  symbolModule: a("symbol-module", 60043),
  symbolPackage: a("symbol-package", 60043),
  symbolNamespace: a("symbol-namespace", 60043),
  symbolObject: a("symbol-object", 60043),
  symbolMethod: a("symbol-method", 60044),
  symbolFunction: a("symbol-function", 60044),
  symbolConstructor: a("symbol-constructor", 60044),
  symbolBoolean: a("symbol-boolean", 60047),
  symbolNull: a("symbol-null", 60047),
  symbolNumeric: a("symbol-numeric", 60048),
  symbolNumber: a("symbol-number", 60048),
  symbolStructure: a("symbol-structure", 60049),
  symbolStruct: a("symbol-struct", 60049),
  symbolParameter: a("symbol-parameter", 60050),
  symbolTypeParameter: a("symbol-type-parameter", 60050),
  symbolKey: a("symbol-key", 60051),
  symbolText: a("symbol-text", 60051),
  symbolReference: a("symbol-reference", 60052),
  goToFile: a("go-to-file", 60052),
  symbolEnum: a("symbol-enum", 60053),
  symbolValue: a("symbol-value", 60053),
  symbolRuler: a("symbol-ruler", 60054),
  symbolUnit: a("symbol-unit", 60054),
  activateBreakpoints: a("activate-breakpoints", 60055),
  archive: a("archive", 60056),
  arrowBoth: a("arrow-both", 60057),
  arrowDown: a("arrow-down", 60058),
  arrowLeft: a("arrow-left", 60059),
  arrowRight: a("arrow-right", 60060),
  arrowSmallDown: a("arrow-small-down", 60061),
  arrowSmallLeft: a("arrow-small-left", 60062),
  arrowSmallRight: a("arrow-small-right", 60063),
  arrowSmallUp: a("arrow-small-up", 60064),
  arrowUp: a("arrow-up", 60065),
  bell: a("bell", 60066),
  bold: a("bold", 60067),
  book: a("book", 60068),
  bookmark: a("bookmark", 60069),
  debugBreakpointConditionalUnverified: a("debug-breakpoint-conditional-unverified", 60070),
  debugBreakpointConditional: a("debug-breakpoint-conditional", 60071),
  debugBreakpointConditionalDisabled: a("debug-breakpoint-conditional-disabled", 60071),
  debugBreakpointDataUnverified: a("debug-breakpoint-data-unverified", 60072),
  debugBreakpointData: a("debug-breakpoint-data", 60073),
  debugBreakpointDataDisabled: a("debug-breakpoint-data-disabled", 60073),
  debugBreakpointLogUnverified: a("debug-breakpoint-log-unverified", 60074),
  debugBreakpointLog: a("debug-breakpoint-log", 60075),
  debugBreakpointLogDisabled: a("debug-breakpoint-log-disabled", 60075),
  briefcase: a("briefcase", 60076),
  broadcast: a("broadcast", 60077),
  browser: a("browser", 60078),
  bug: a("bug", 60079),
  calendar: a("calendar", 60080),
  caseSensitive: a("case-sensitive", 60081),
  check: a("check", 60082),
  checklist: a("checklist", 60083),
  chevronDown: a("chevron-down", 60084),
  chevronLeft: a("chevron-left", 60085),
  chevronRight: a("chevron-right", 60086),
  chevronUp: a("chevron-up", 60087),
  chromeClose: a("chrome-close", 60088),
  chromeMaximize: a("chrome-maximize", 60089),
  chromeMinimize: a("chrome-minimize", 60090),
  chromeRestore: a("chrome-restore", 60091),
  circleOutline: a("circle-outline", 60092),
  circle: a("circle", 60092),
  debugBreakpointUnverified: a("debug-breakpoint-unverified", 60092),
  terminalDecorationIncomplete: a("terminal-decoration-incomplete", 60092),
  circleSlash: a("circle-slash", 60093),
  circuitBoard: a("circuit-board", 60094),
  clearAll: a("clear-all", 60095),
  clippy: a("clippy", 60096),
  closeAll: a("close-all", 60097),
  cloudDownload: a("cloud-download", 60098),
  cloudUpload: a("cloud-upload", 60099),
  code: a("code", 60100),
  collapseAll: a("collapse-all", 60101),
  colorMode: a("color-mode", 60102),
  commentDiscussion: a("comment-discussion", 60103),
  creditCard: a("credit-card", 60105),
  dash: a("dash", 60108),
  dashboard: a("dashboard", 60109),
  database: a("database", 60110),
  debugContinue: a("debug-continue", 60111),
  debugDisconnect: a("debug-disconnect", 60112),
  debugPause: a("debug-pause", 60113),
  debugRestart: a("debug-restart", 60114),
  debugStart: a("debug-start", 60115),
  debugStepInto: a("debug-step-into", 60116),
  debugStepOut: a("debug-step-out", 60117),
  debugStepOver: a("debug-step-over", 60118),
  debugStop: a("debug-stop", 60119),
  debug: a("debug", 60120),
  deviceCameraVideo: a("device-camera-video", 60121),
  deviceCamera: a("device-camera", 60122),
  deviceMobile: a("device-mobile", 60123),
  diffAdded: a("diff-added", 60124),
  diffIgnored: a("diff-ignored", 60125),
  diffModified: a("diff-modified", 60126),
  diffRemoved: a("diff-removed", 60127),
  diffRenamed: a("diff-renamed", 60128),
  diff: a("diff", 60129),
  diffSidebyside: a("diff-sidebyside", 60129),
  discard: a("discard", 60130),
  editorLayout: a("editor-layout", 60131),
  emptyWindow: a("empty-window", 60132),
  exclude: a("exclude", 60133),
  extensions: a("extensions", 60134),
  eyeClosed: a("eye-closed", 60135),
  fileBinary: a("file-binary", 60136),
  fileCode: a("file-code", 60137),
  fileMedia: a("file-media", 60138),
  filePdf: a("file-pdf", 60139),
  fileSubmodule: a("file-submodule", 60140),
  fileSymlinkDirectory: a("file-symlink-directory", 60141),
  fileSymlinkFile: a("file-symlink-file", 60142),
  fileZip: a("file-zip", 60143),
  files: a("files", 60144),
  filter: a("filter", 60145),
  flame: a("flame", 60146),
  foldDown: a("fold-down", 60147),
  foldUp: a("fold-up", 60148),
  fold: a("fold", 60149),
  folderActive: a("folder-active", 60150),
  folderOpened: a("folder-opened", 60151),
  gear: a("gear", 60152),
  gift: a("gift", 60153),
  gistSecret: a("gist-secret", 60154),
  gist: a("gist", 60155),
  gitCommit: a("git-commit", 60156),
  gitCompare: a("git-compare", 60157),
  compareChanges: a("compare-changes", 60157),
  gitMerge: a("git-merge", 60158),
  githubAction: a("github-action", 60159),
  githubAlt: a("github-alt", 60160),
  globe: a("globe", 60161),
  grabber: a("grabber", 60162),
  graph: a("graph", 60163),
  gripper: a("gripper", 60164),
  heart: a("heart", 60165),
  home: a("home", 60166),
  horizontalRule: a("horizontal-rule", 60167),
  hubot: a("hubot", 60168),
  inbox: a("inbox", 60169),
  issueReopened: a("issue-reopened", 60171),
  issues: a("issues", 60172),
  italic: a("italic", 60173),
  jersey: a("jersey", 60174),
  json: a("json", 60175),
  kebabVertical: a("kebab-vertical", 60176),
  key: a("key", 60177),
  law: a("law", 60178),
  lightbulbAutofix: a("lightbulb-autofix", 60179),
  linkExternal: a("link-external", 60180),
  link: a("link", 60181),
  listOrdered: a("list-ordered", 60182),
  listUnordered: a("list-unordered", 60183),
  liveShare: a("live-share", 60184),
  loading: a("loading", 60185),
  location: a("location", 60186),
  mailRead: a("mail-read", 60187),
  mail: a("mail", 60188),
  markdown: a("markdown", 60189),
  megaphone: a("megaphone", 60190),
  mention: a("mention", 60191),
  milestone: a("milestone", 60192),
  gitPullRequestMilestone: a("git-pull-request-milestone", 60192),
  mortarBoard: a("mortar-board", 60193),
  move: a("move", 60194),
  multipleWindows: a("multiple-windows", 60195),
  mute: a("mute", 60196),
  noNewline: a("no-newline", 60197),
  note: a("note", 60198),
  octoface: a("octoface", 60199),
  openPreview: a("open-preview", 60200),
  package: a("package", 60201),
  paintcan: a("paintcan", 60202),
  pin: a("pin", 60203),
  play: a("play", 60204),
  run: a("run", 60204),
  plug: a("plug", 60205),
  preserveCase: a("preserve-case", 60206),
  preview: a("preview", 60207),
  project: a("project", 60208),
  pulse: a("pulse", 60209),
  question: a("question", 60210),
  quote: a("quote", 60211),
  radioTower: a("radio-tower", 60212),
  reactions: a("reactions", 60213),
  references: a("references", 60214),
  refresh: a("refresh", 60215),
  regex: a("regex", 60216),
  remoteExplorer: a("remote-explorer", 60217),
  remote: a("remote", 60218),
  remove: a("remove", 60219),
  replaceAll: a("replace-all", 60220),
  replace: a("replace", 60221),
  repoClone: a("repo-clone", 60222),
  repoForcePush: a("repo-force-push", 60223),
  repoPull: a("repo-pull", 60224),
  repoPush: a("repo-push", 60225),
  report: a("report", 60226),
  requestChanges: a("request-changes", 60227),
  rocket: a("rocket", 60228),
  rootFolderOpened: a("root-folder-opened", 60229),
  rootFolder: a("root-folder", 60230),
  rss: a("rss", 60231),
  ruby: a("ruby", 60232),
  saveAll: a("save-all", 60233),
  saveAs: a("save-as", 60234),
  save: a("save", 60235),
  screenFull: a("screen-full", 60236),
  screenNormal: a("screen-normal", 60237),
  searchStop: a("search-stop", 60238),
  server: a("server", 60240),
  settingsGear: a("settings-gear", 60241),
  settings: a("settings", 60242),
  shield: a("shield", 60243),
  smiley: a("smiley", 60244),
  sortPrecedence: a("sort-precedence", 60245),
  splitHorizontal: a("split-horizontal", 60246),
  splitVertical: a("split-vertical", 60247),
  squirrel: a("squirrel", 60248),
  starFull: a("star-full", 60249),
  starHalf: a("star-half", 60250),
  symbolClass: a("symbol-class", 60251),
  symbolColor: a("symbol-color", 60252),
  symbolConstant: a("symbol-constant", 60253),
  symbolEnumMember: a("symbol-enum-member", 60254),
  symbolField: a("symbol-field", 60255),
  symbolFile: a("symbol-file", 60256),
  symbolInterface: a("symbol-interface", 60257),
  symbolKeyword: a("symbol-keyword", 60258),
  symbolMisc: a("symbol-misc", 60259),
  symbolOperator: a("symbol-operator", 60260),
  symbolProperty: a("symbol-property", 60261),
  wrench: a("wrench", 60261),
  wrenchSubaction: a("wrench-subaction", 60261),
  symbolSnippet: a("symbol-snippet", 60262),
  tasklist: a("tasklist", 60263),
  telescope: a("telescope", 60264),
  textSize: a("text-size", 60265),
  threeBars: a("three-bars", 60266),
  thumbsdown: a("thumbsdown", 60267),
  thumbsup: a("thumbsup", 60268),
  tools: a("tools", 60269),
  triangleDown: a("triangle-down", 60270),
  triangleLeft: a("triangle-left", 60271),
  triangleRight: a("triangle-right", 60272),
  triangleUp: a("triangle-up", 60273),
  twitter: a("twitter", 60274),
  unfold: a("unfold", 60275),
  unlock: a("unlock", 60276),
  unmute: a("unmute", 60277),
  unverified: a("unverified", 60278),
  verified: a("verified", 60279),
  versions: a("versions", 60280),
  vmActive: a("vm-active", 60281),
  vmOutline: a("vm-outline", 60282),
  vmRunning: a("vm-running", 60283),
  watch: a("watch", 60284),
  whitespace: a("whitespace", 60285),
  wholeWord: a("whole-word", 60286),
  window: a("window", 60287),
  wordWrap: a("word-wrap", 60288),
  zoomIn: a("zoom-in", 60289),
  zoomOut: a("zoom-out", 60290),
  listFilter: a("list-filter", 60291),
  listFlat: a("list-flat", 60292),
  listSelection: a("list-selection", 60293),
  selection: a("selection", 60293),
  listTree: a("list-tree", 60294),
  debugBreakpointFunctionUnverified: a("debug-breakpoint-function-unverified", 60295),
  debugBreakpointFunction: a("debug-breakpoint-function", 60296),
  debugBreakpointFunctionDisabled: a("debug-breakpoint-function-disabled", 60296),
  debugStackframeActive: a("debug-stackframe-active", 60297),
  circleSmallFilled: a("circle-small-filled", 60298),
  debugStackframeDot: a("debug-stackframe-dot", 60298),
  terminalDecorationMark: a("terminal-decoration-mark", 60298),
  debugStackframe: a("debug-stackframe", 60299),
  debugStackframeFocused: a("debug-stackframe-focused", 60299),
  debugBreakpointUnsupported: a("debug-breakpoint-unsupported", 60300),
  symbolString: a("symbol-string", 60301),
  debugReverseContinue: a("debug-reverse-continue", 60302),
  debugStepBack: a("debug-step-back", 60303),
  debugRestartFrame: a("debug-restart-frame", 60304),
  debugAlt: a("debug-alt", 60305),
  callIncoming: a("call-incoming", 60306),
  callOutgoing: a("call-outgoing", 60307),
  menu: a("menu", 60308),
  expandAll: a("expand-all", 60309),
  feedback: a("feedback", 60310),
  gitPullRequestReviewer: a("git-pull-request-reviewer", 60310),
  groupByRefType: a("group-by-ref-type", 60311),
  ungroupByRefType: a("ungroup-by-ref-type", 60312),
  account: a("account", 60313),
  gitPullRequestAssignee: a("git-pull-request-assignee", 60313),
  bellDot: a("bell-dot", 60314),
  debugConsole: a("debug-console", 60315),
  library: a("library", 60316),
  output: a("output", 60317),
  runAll: a("run-all", 60318),
  syncIgnored: a("sync-ignored", 60319),
  pinned: a("pinned", 60320),
  githubInverted: a("github-inverted", 60321),
  serverProcess: a("server-process", 60322),
  serverEnvironment: a("server-environment", 60323),
  pass: a("pass", 60324),
  issueClosed: a("issue-closed", 60324),
  stopCircle: a("stop-circle", 60325),
  playCircle: a("play-circle", 60326),
  record: a("record", 60327),
  debugAltSmall: a("debug-alt-small", 60328),
  vmConnect: a("vm-connect", 60329),
  cloud: a("cloud", 60330),
  merge: a("merge", 60331),
  export: a("export", 60332),
  graphLeft: a("graph-left", 60333),
  magnet: a("magnet", 60334),
  notebook: a("notebook", 60335),
  redo: a("redo", 60336),
  checkAll: a("check-all", 60337),
  pinnedDirty: a("pinned-dirty", 60338),
  passFilled: a("pass-filled", 60339),
  circleLargeFilled: a("circle-large-filled", 60340),
  circleLarge: a("circle-large", 60341),
  circleLargeOutline: a("circle-large-outline", 60341),
  combine: a("combine", 60342),
  gather: a("gather", 60342),
  table: a("table", 60343),
  variableGroup: a("variable-group", 60344),
  typeHierarchy: a("type-hierarchy", 60345),
  typeHierarchySub: a("type-hierarchy-sub", 60346),
  typeHierarchySuper: a("type-hierarchy-super", 60347),
  gitPullRequestCreate: a("git-pull-request-create", 60348),
  runAbove: a("run-above", 60349),
  runBelow: a("run-below", 60350),
  notebookTemplate: a("notebook-template", 60351),
  debugRerun: a("debug-rerun", 60352),
  workspaceTrusted: a("workspace-trusted", 60353),
  workspaceUntrusted: a("workspace-untrusted", 60354),
  workspaceUnknown: a("workspace-unknown", 60355),
  terminalCmd: a("terminal-cmd", 60356),
  terminalDebian: a("terminal-debian", 60357),
  terminalLinux: a("terminal-linux", 60358),
  terminalPowershell: a("terminal-powershell", 60359),
  terminalTmux: a("terminal-tmux", 60360),
  terminalUbuntu: a("terminal-ubuntu", 60361),
  terminalBash: a("terminal-bash", 60362),
  arrowSwap: a("arrow-swap", 60363),
  copy: a("copy", 60364),
  personAdd: a("person-add", 60365),
  filterFilled: a("filter-filled", 60366),
  wand: a("wand", 60367),
  debugLineByLine: a("debug-line-by-line", 60368),
  inspect: a("inspect", 60369),
  layers: a("layers", 60370),
  layersDot: a("layers-dot", 60371),
  layersActive: a("layers-active", 60372),
  compass: a("compass", 60373),
  compassDot: a("compass-dot", 60374),
  compassActive: a("compass-active", 60375),
  azure: a("azure", 60376),
  issueDraft: a("issue-draft", 60377),
  gitPullRequestClosed: a("git-pull-request-closed", 60378),
  gitPullRequestDraft: a("git-pull-request-draft", 60379),
  debugAll: a("debug-all", 60380),
  debugCoverage: a("debug-coverage", 60381),
  runErrors: a("run-errors", 60382),
  folderLibrary: a("folder-library", 60383),
  debugContinueSmall: a("debug-continue-small", 60384),
  beakerStop: a("beaker-stop", 60385),
  graphLine: a("graph-line", 60386),
  graphScatter: a("graph-scatter", 60387),
  pieChart: a("pie-chart", 60388),
  bracket: a("bracket", 60175),
  bracketDot: a("bracket-dot", 60389),
  bracketError: a("bracket-error", 60390),
  lockSmall: a("lock-small", 60391),
  azureDevops: a("azure-devops", 60392),
  verifiedFilled: a("verified-filled", 60393),
  newline: a("newline", 60394),
  layout: a("layout", 60395),
  layoutActivitybarLeft: a("layout-activitybar-left", 60396),
  layoutActivitybarRight: a("layout-activitybar-right", 60397),
  layoutPanelLeft: a("layout-panel-left", 60398),
  layoutPanelCenter: a("layout-panel-center", 60399),
  layoutPanelJustify: a("layout-panel-justify", 60400),
  layoutPanelRight: a("layout-panel-right", 60401),
  layoutPanel: a("layout-panel", 60402),
  layoutSidebarLeft: a("layout-sidebar-left", 60403),
  layoutSidebarRight: a("layout-sidebar-right", 60404),
  layoutStatusbar: a("layout-statusbar", 60405),
  layoutMenubar: a("layout-menubar", 60406),
  layoutCentered: a("layout-centered", 60407),
  target: a("target", 60408),
  indent: a("indent", 60409),
  recordSmall: a("record-small", 60410),
  errorSmall: a("error-small", 60411),
  terminalDecorationError: a("terminal-decoration-error", 60411),
  arrowCircleDown: a("arrow-circle-down", 60412),
  arrowCircleLeft: a("arrow-circle-left", 60413),
  arrowCircleRight: a("arrow-circle-right", 60414),
  arrowCircleUp: a("arrow-circle-up", 60415),
  layoutSidebarRightOff: a("layout-sidebar-right-off", 60416),
  layoutPanelOff: a("layout-panel-off", 60417),
  layoutSidebarLeftOff: a("layout-sidebar-left-off", 60418),
  blank: a("blank", 60419),
  heartFilled: a("heart-filled", 60420),
  map: a("map", 60421),
  mapHorizontal: a("map-horizontal", 60421),
  foldHorizontal: a("fold-horizontal", 60421),
  mapFilled: a("map-filled", 60422),
  mapHorizontalFilled: a("map-horizontal-filled", 60422),
  foldHorizontalFilled: a("fold-horizontal-filled", 60422),
  circleSmall: a("circle-small", 60423),
  bellSlash: a("bell-slash", 60424),
  bellSlashDot: a("bell-slash-dot", 60425),
  commentUnresolved: a("comment-unresolved", 60426),
  gitPullRequestGoToChanges: a("git-pull-request-go-to-changes", 60427),
  gitPullRequestNewChanges: a("git-pull-request-new-changes", 60428),
  searchFuzzy: a("search-fuzzy", 60429),
  commentDraft: a("comment-draft", 60430),
  send: a("send", 60431),
  sparkle: a("sparkle", 60432),
  insert: a("insert", 60433),
  mic: a("mic", 60434),
  thumbsdownFilled: a("thumbsdown-filled", 60435),
  thumbsupFilled: a("thumbsup-filled", 60436),
  coffee: a("coffee", 60437),
  snake: a("snake", 60438),
  game: a("game", 60439),
  vr: a("vr", 60440),
  chip: a("chip", 60441),
  piano: a("piano", 60442),
  music: a("music", 60443),
  micFilled: a("mic-filled", 60444),
  repoFetch: a("repo-fetch", 60445),
  copilot: a("copilot", 60446),
  lightbulbSparkle: a("lightbulb-sparkle", 60447),
  robot: a("robot", 60448),
  sparkleFilled: a("sparkle-filled", 60449),
  diffSingle: a("diff-single", 60450),
  diffMultiple: a("diff-multiple", 60451),
  surroundWith: a("surround-with", 60452),
  share: a("share", 60453),
  gitStash: a("git-stash", 60454),
  gitStashApply: a("git-stash-apply", 60455),
  gitStashPop: a("git-stash-pop", 60456),
  vscode: a("vscode", 60457),
  vscodeInsiders: a("vscode-insiders", 60458),
  codeOss: a("code-oss", 60459),
  runCoverage: a("run-coverage", 60460),
  runAllCoverage: a("run-all-coverage", 60461),
  coverage: a("coverage", 60462),
  githubProject: a("github-project", 60463),
  mapVertical: a("map-vertical", 60464),
  foldVertical: a("fold-vertical", 60464),
  mapVerticalFilled: a("map-vertical-filled", 60465),
  foldVerticalFilled: a("fold-vertical-filled", 60465),
  goToSearch: a("go-to-search", 60466),
  percentage: a("percentage", 60467),
  sortPercentage: a("sort-percentage", 60467),
  attach: a("attach", 60468)
}, hl = {
  dialogError: a("dialog-error", "error"),
  dialogWarning: a("dialog-warning", "warning"),
  dialogInfo: a("dialog-info", "info"),
  dialogClose: a("dialog-close", "close"),
  treeItemExpanded: a("tree-item-expanded", "chevron-down"),
  // collapsed is done with rotation
  treeFilterOnTypeOn: a("tree-filter-on-type-on", "list-filter"),
  treeFilterOnTypeOff: a("tree-filter-on-type-off", "list-selection"),
  treeFilterClear: a("tree-filter-clear", "close"),
  treeItemLoading: a("tree-item-loading", "loading"),
  menuSelection: a("menu-selection", "check"),
  menuSubmenu: a("menu-submenu", "chevron-right"),
  menuBarMore: a("menubar-more", "more"),
  scrollbarButtonLeft: a("scrollbar-button-left", "triangle-left"),
  scrollbarButtonRight: a("scrollbar-button-right", "triangle-right"),
  scrollbarButtonUp: a("scrollbar-button-up", "triangle-up"),
  scrollbarButtonDown: a("scrollbar-button-down", "triangle-down"),
  toolBarMore: a("toolbar-more", "more"),
  quickInputBack: a("quick-input-back", "arrow-left"),
  dropDownButton: a("drop-down-button", 60084),
  symbolCustomColor: a("symbol-customcolor", 60252),
  exportIcon: a("export", 60332),
  workspaceUnspecified: a("workspace-unspecified", 60355),
  newLine: a("newline", 60394),
  thumbsDownFilled: a("thumbsdown-filled", 60435),
  thumbsUpFilled: a("thumbsup-filled", 60436),
  gitFetch: a("git-fetch", 60445),
  lightbulbSparkleAutofix: a("lightbulb-sparkle-autofix", 60447),
  debugBreakpointPending: a("debug-breakpoint-pending", 60377)
}, k = {
  ...cl,
  ...hl
};
class ps {
  constructor() {
    this._tokenizationSupports = /* @__PURE__ */ new Map(), this._factories = /* @__PURE__ */ new Map(), this._onDidChange = new me(), this.onDidChange = this._onDidChange.event, this._colorMap = null;
  }
  handleChange(e) {
    this._onDidChange.fire({
      changedLanguages: e,
      changedColorMap: !1
    });
  }
  register(e, n) {
    return this._tokenizationSupports.set(e, n), this.handleChange([e]), Yt(() => {
      this._tokenizationSupports.get(e) === n && (this._tokenizationSupports.delete(e), this.handleChange([e]));
    });
  }
  get(e) {
    return this._tokenizationSupports.get(e) || null;
  }
  registerFactory(e, n) {
    this._factories.get(e)?.dispose();
    const r = new fl(this, e, n);
    return this._factories.set(e, r), Yt(() => {
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
class fl extends gt {
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
class ml {
  constructor(e, n, r) {
    this.offset = e, this.type = n, this.language = r, this._tokenBrand = void 0;
  }
  toString() {
    return "(" + this.offset + ", " + this.type + ")";
  }
}
var oi;
(function(t) {
  t[t.Increase = 0] = "Increase", t[t.Decrease = 1] = "Decrease";
})(oi || (oi = {}));
var ai;
(function(t) {
  const e = /* @__PURE__ */ new Map();
  e.set(0, k.symbolMethod), e.set(1, k.symbolFunction), e.set(2, k.symbolConstructor), e.set(3, k.symbolField), e.set(4, k.symbolVariable), e.set(5, k.symbolClass), e.set(6, k.symbolStruct), e.set(7, k.symbolInterface), e.set(8, k.symbolModule), e.set(9, k.symbolProperty), e.set(10, k.symbolEvent), e.set(11, k.symbolOperator), e.set(12, k.symbolUnit), e.set(13, k.symbolValue), e.set(15, k.symbolEnum), e.set(14, k.symbolConstant), e.set(15, k.symbolEnum), e.set(16, k.symbolEnumMember), e.set(17, k.symbolKeyword), e.set(27, k.symbolSnippet), e.set(18, k.symbolText), e.set(19, k.symbolColor), e.set(20, k.symbolFile), e.set(21, k.symbolReference), e.set(22, k.symbolCustomColor), e.set(23, k.symbolFolder), e.set(24, k.symbolTypeParameter), e.set(25, k.account), e.set(26, k.issues);
  function n(s) {
    let o = e.get(s);
    return o || (console.info("No codicon found for CompletionItemKind " + s), o = k.symbolProperty), o;
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
})(ai || (ai = {}));
var li;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.Explicit = 1] = "Explicit";
})(li || (li = {}));
var ui;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.PasteAs = 1] = "PasteAs";
})(ui || (ui = {}));
var ci;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.TriggerCharacter = 2] = "TriggerCharacter", t[t.ContentChange = 3] = "ContentChange";
})(ci || (ci = {}));
var hi;
(function(t) {
  t[t.Text = 0] = "Text", t[t.Read = 1] = "Read", t[t.Write = 2] = "Write";
})(hi || (hi = {}));
j("Array", "array"), j("Boolean", "boolean"), j("Class", "class"), j("Constant", "constant"), j("Constructor", "constructor"), j("Enum", "enumeration"), j("EnumMember", "enumeration member"), j("Event", "event"), j("Field", "field"), j("File", "file"), j("Function", "function"), j("Interface", "interface"), j("Key", "key"), j("Method", "method"), j("Module", "module"), j("Namespace", "namespace"), j("Null", "null"), j("Number", "number"), j("Object", "object"), j("Operator", "operator"), j("Package", "package"), j("Property", "property"), j("String", "string"), j("Struct", "struct"), j("TypeParameter", "type parameter"), j("Variable", "variable");
var fi;
(function(t) {
  const e = /* @__PURE__ */ new Map();
  e.set(0, k.symbolFile), e.set(1, k.symbolModule), e.set(2, k.symbolNamespace), e.set(3, k.symbolPackage), e.set(4, k.symbolClass), e.set(5, k.symbolMethod), e.set(6, k.symbolProperty), e.set(7, k.symbolField), e.set(8, k.symbolConstructor), e.set(9, k.symbolEnum), e.set(10, k.symbolInterface), e.set(11, k.symbolFunction), e.set(12, k.symbolVariable), e.set(13, k.symbolConstant), e.set(14, k.symbolString), e.set(15, k.symbolNumber), e.set(16, k.symbolBoolean), e.set(17, k.symbolArray), e.set(18, k.symbolObject), e.set(19, k.symbolKey), e.set(20, k.symbolNull), e.set(21, k.symbolEnumMember), e.set(22, k.symbolStruct), e.set(23, k.symbolEvent), e.set(24, k.symbolOperator), e.set(25, k.symbolTypeParameter);
  function n(r) {
    let i = e.get(r);
    return i || (console.info("No codicon found for SymbolKind " + r), i = k.symbolProperty), i;
  }
  t.toIcon = n;
})(fi || (fi = {}));
const he = class he {
  /**
   * Returns a {@link FoldingRangeKind} for the given value.
   *
   * @param value of the kind.
   */
  static fromValue(e) {
    switch (e) {
      case "comment":
        return he.Comment;
      case "imports":
        return he.Imports;
      case "region":
        return he.Region;
    }
    return new he(e);
  }
  /**
   * Creates a new {@link FoldingRangeKind}.
   *
   * @param value of the kind.
   */
  constructor(e) {
    this.value = e;
  }
};
he.Comment = new he("comment"), he.Imports = new he("imports"), he.Region = new he("region");
let mi = he;
var di;
(function(t) {
  t[t.AIGenerated = 1] = "AIGenerated";
})(di || (di = {}));
var gi;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(gi || (gi = {}));
var pi;
(function(t) {
  function e(n) {
    return !n || typeof n != "object" ? !1 : typeof n.id == "string" && typeof n.title == "string";
  }
  t.is = e;
})(pi || (pi = {}));
var bi;
(function(t) {
  t[t.Type = 1] = "Type", t[t.Parameter = 2] = "Parameter";
})(bi || (bi = {}));
new ps();
new ps();
var yi;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(yi || (yi = {}));
var _i;
(function(t) {
  t[t.Unknown = 0] = "Unknown", t[t.Disabled = 1] = "Disabled", t[t.Enabled = 2] = "Enabled";
})(_i || (_i = {}));
var wi;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.Auto = 2] = "Auto";
})(wi || (wi = {}));
var xi;
(function(t) {
  t[t.None = 0] = "None", t[t.KeepWhitespace = 1] = "KeepWhitespace", t[t.InsertAsSnippet = 4] = "InsertAsSnippet";
})(xi || (xi = {}));
var Li;
(function(t) {
  t[t.Method = 0] = "Method", t[t.Function = 1] = "Function", t[t.Constructor = 2] = "Constructor", t[t.Field = 3] = "Field", t[t.Variable = 4] = "Variable", t[t.Class = 5] = "Class", t[t.Struct = 6] = "Struct", t[t.Interface = 7] = "Interface", t[t.Module = 8] = "Module", t[t.Property = 9] = "Property", t[t.Event = 10] = "Event", t[t.Operator = 11] = "Operator", t[t.Unit = 12] = "Unit", t[t.Value = 13] = "Value", t[t.Constant = 14] = "Constant", t[t.Enum = 15] = "Enum", t[t.EnumMember = 16] = "EnumMember", t[t.Keyword = 17] = "Keyword", t[t.Text = 18] = "Text", t[t.Color = 19] = "Color", t[t.File = 20] = "File", t[t.Reference = 21] = "Reference", t[t.Customcolor = 22] = "Customcolor", t[t.Folder = 23] = "Folder", t[t.TypeParameter = 24] = "TypeParameter", t[t.User = 25] = "User", t[t.Issue = 26] = "Issue", t[t.Snippet = 27] = "Snippet";
})(Li || (Li = {}));
var vi;
(function(t) {
  t[t.Deprecated = 1] = "Deprecated";
})(vi || (vi = {}));
var Ni;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.TriggerCharacter = 1] = "TriggerCharacter", t[t.TriggerForIncompleteCompletions = 2] = "TriggerForIncompleteCompletions";
})(Ni || (Ni = {}));
var Ei;
(function(t) {
  t[t.EXACT = 0] = "EXACT", t[t.ABOVE = 1] = "ABOVE", t[t.BELOW = 2] = "BELOW";
})(Ei || (Ei = {}));
var Si;
(function(t) {
  t[t.NotSet = 0] = "NotSet", t[t.ContentFlush = 1] = "ContentFlush", t[t.RecoverFromMarkers = 2] = "RecoverFromMarkers", t[t.Explicit = 3] = "Explicit", t[t.Paste = 4] = "Paste", t[t.Undo = 5] = "Undo", t[t.Redo = 6] = "Redo";
})(Si || (Si = {}));
var Ai;
(function(t) {
  t[t.LF = 1] = "LF", t[t.CRLF = 2] = "CRLF";
})(Ai || (Ai = {}));
var Ri;
(function(t) {
  t[t.Text = 0] = "Text", t[t.Read = 1] = "Read", t[t.Write = 2] = "Write";
})(Ri || (Ri = {}));
var Ci;
(function(t) {
  t[t.None = 0] = "None", t[t.Keep = 1] = "Keep", t[t.Brackets = 2] = "Brackets", t[t.Advanced = 3] = "Advanced", t[t.Full = 4] = "Full";
})(Ci || (Ci = {}));
var Mi;
(function(t) {
  t[t.acceptSuggestionOnCommitCharacter = 0] = "acceptSuggestionOnCommitCharacter", t[t.acceptSuggestionOnEnter = 1] = "acceptSuggestionOnEnter", t[t.accessibilitySupport = 2] = "accessibilitySupport", t[t.accessibilityPageSize = 3] = "accessibilityPageSize", t[t.ariaLabel = 4] = "ariaLabel", t[t.ariaRequired = 5] = "ariaRequired", t[t.autoClosingBrackets = 6] = "autoClosingBrackets", t[t.autoClosingComments = 7] = "autoClosingComments", t[t.screenReaderAnnounceInlineSuggestion = 8] = "screenReaderAnnounceInlineSuggestion", t[t.autoClosingDelete = 9] = "autoClosingDelete", t[t.autoClosingOvertype = 10] = "autoClosingOvertype", t[t.autoClosingQuotes = 11] = "autoClosingQuotes", t[t.autoIndent = 12] = "autoIndent", t[t.automaticLayout = 13] = "automaticLayout", t[t.autoSurround = 14] = "autoSurround", t[t.bracketPairColorization = 15] = "bracketPairColorization", t[t.guides = 16] = "guides", t[t.codeLens = 17] = "codeLens", t[t.codeLensFontFamily = 18] = "codeLensFontFamily", t[t.codeLensFontSize = 19] = "codeLensFontSize", t[t.colorDecorators = 20] = "colorDecorators", t[t.colorDecoratorsLimit = 21] = "colorDecoratorsLimit", t[t.columnSelection = 22] = "columnSelection", t[t.comments = 23] = "comments", t[t.contextmenu = 24] = "contextmenu", t[t.copyWithSyntaxHighlighting = 25] = "copyWithSyntaxHighlighting", t[t.cursorBlinking = 26] = "cursorBlinking", t[t.cursorSmoothCaretAnimation = 27] = "cursorSmoothCaretAnimation", t[t.cursorStyle = 28] = "cursorStyle", t[t.cursorSurroundingLines = 29] = "cursorSurroundingLines", t[t.cursorSurroundingLinesStyle = 30] = "cursorSurroundingLinesStyle", t[t.cursorWidth = 31] = "cursorWidth", t[t.disableLayerHinting = 32] = "disableLayerHinting", t[t.disableMonospaceOptimizations = 33] = "disableMonospaceOptimizations", t[t.domReadOnly = 34] = "domReadOnly", t[t.dragAndDrop = 35] = "dragAndDrop", t[t.dropIntoEditor = 36] = "dropIntoEditor", t[t.emptySelectionClipboard = 37] = "emptySelectionClipboard", t[t.experimentalWhitespaceRendering = 38] = "experimentalWhitespaceRendering", t[t.extraEditorClassName = 39] = "extraEditorClassName", t[t.fastScrollSensitivity = 40] = "fastScrollSensitivity", t[t.find = 41] = "find", t[t.fixedOverflowWidgets = 42] = "fixedOverflowWidgets", t[t.folding = 43] = "folding", t[t.foldingStrategy = 44] = "foldingStrategy", t[t.foldingHighlight = 45] = "foldingHighlight", t[t.foldingImportsByDefault = 46] = "foldingImportsByDefault", t[t.foldingMaximumRegions = 47] = "foldingMaximumRegions", t[t.unfoldOnClickAfterEndOfLine = 48] = "unfoldOnClickAfterEndOfLine", t[t.fontFamily = 49] = "fontFamily", t[t.fontInfo = 50] = "fontInfo", t[t.fontLigatures = 51] = "fontLigatures", t[t.fontSize = 52] = "fontSize", t[t.fontWeight = 53] = "fontWeight", t[t.fontVariations = 54] = "fontVariations", t[t.formatOnPaste = 55] = "formatOnPaste", t[t.formatOnType = 56] = "formatOnType", t[t.glyphMargin = 57] = "glyphMargin", t[t.gotoLocation = 58] = "gotoLocation", t[t.hideCursorInOverviewRuler = 59] = "hideCursorInOverviewRuler", t[t.hover = 60] = "hover", t[t.inDiffEditor = 61] = "inDiffEditor", t[t.inlineSuggest = 62] = "inlineSuggest", t[t.inlineEdit = 63] = "inlineEdit", t[t.letterSpacing = 64] = "letterSpacing", t[t.lightbulb = 65] = "lightbulb", t[t.lineDecorationsWidth = 66] = "lineDecorationsWidth", t[t.lineHeight = 67] = "lineHeight", t[t.lineNumbers = 68] = "lineNumbers", t[t.lineNumbersMinChars = 69] = "lineNumbersMinChars", t[t.linkedEditing = 70] = "linkedEditing", t[t.links = 71] = "links", t[t.matchBrackets = 72] = "matchBrackets", t[t.minimap = 73] = "minimap", t[t.mouseStyle = 74] = "mouseStyle", t[t.mouseWheelScrollSensitivity = 75] = "mouseWheelScrollSensitivity", t[t.mouseWheelZoom = 76] = "mouseWheelZoom", t[t.multiCursorMergeOverlapping = 77] = "multiCursorMergeOverlapping", t[t.multiCursorModifier = 78] = "multiCursorModifier", t[t.multiCursorPaste = 79] = "multiCursorPaste", t[t.multiCursorLimit = 80] = "multiCursorLimit", t[t.occurrencesHighlight = 81] = "occurrencesHighlight", t[t.overviewRulerBorder = 82] = "overviewRulerBorder", t[t.overviewRulerLanes = 83] = "overviewRulerLanes", t[t.padding = 84] = "padding", t[t.pasteAs = 85] = "pasteAs", t[t.parameterHints = 86] = "parameterHints", t[t.peekWidgetDefaultFocus = 87] = "peekWidgetDefaultFocus", t[t.placeholder = 88] = "placeholder", t[t.definitionLinkOpensInPeek = 89] = "definitionLinkOpensInPeek", t[t.quickSuggestions = 90] = "quickSuggestions", t[t.quickSuggestionsDelay = 91] = "quickSuggestionsDelay", t[t.readOnly = 92] = "readOnly", t[t.readOnlyMessage = 93] = "readOnlyMessage", t[t.renameOnType = 94] = "renameOnType", t[t.renderControlCharacters = 95] = "renderControlCharacters", t[t.renderFinalNewline = 96] = "renderFinalNewline", t[t.renderLineHighlight = 97] = "renderLineHighlight", t[t.renderLineHighlightOnlyWhenFocus = 98] = "renderLineHighlightOnlyWhenFocus", t[t.renderValidationDecorations = 99] = "renderValidationDecorations", t[t.renderWhitespace = 100] = "renderWhitespace", t[t.revealHorizontalRightPadding = 101] = "revealHorizontalRightPadding", t[t.roundedSelection = 102] = "roundedSelection", t[t.rulers = 103] = "rulers", t[t.scrollbar = 104] = "scrollbar", t[t.scrollBeyondLastColumn = 105] = "scrollBeyondLastColumn", t[t.scrollBeyondLastLine = 106] = "scrollBeyondLastLine", t[t.scrollPredominantAxis = 107] = "scrollPredominantAxis", t[t.selectionClipboard = 108] = "selectionClipboard", t[t.selectionHighlight = 109] = "selectionHighlight", t[t.selectOnLineNumbers = 110] = "selectOnLineNumbers", t[t.showFoldingControls = 111] = "showFoldingControls", t[t.showUnused = 112] = "showUnused", t[t.snippetSuggestions = 113] = "snippetSuggestions", t[t.smartSelect = 114] = "smartSelect", t[t.smoothScrolling = 115] = "smoothScrolling", t[t.stickyScroll = 116] = "stickyScroll", t[t.stickyTabStops = 117] = "stickyTabStops", t[t.stopRenderingLineAfter = 118] = "stopRenderingLineAfter", t[t.suggest = 119] = "suggest", t[t.suggestFontSize = 120] = "suggestFontSize", t[t.suggestLineHeight = 121] = "suggestLineHeight", t[t.suggestOnTriggerCharacters = 122] = "suggestOnTriggerCharacters", t[t.suggestSelection = 123] = "suggestSelection", t[t.tabCompletion = 124] = "tabCompletion", t[t.tabIndex = 125] = "tabIndex", t[t.unicodeHighlighting = 126] = "unicodeHighlighting", t[t.unusualLineTerminators = 127] = "unusualLineTerminators", t[t.useShadowDOM = 128] = "useShadowDOM", t[t.useTabStops = 129] = "useTabStops", t[t.wordBreak = 130] = "wordBreak", t[t.wordSegmenterLocales = 131] = "wordSegmenterLocales", t[t.wordSeparators = 132] = "wordSeparators", t[t.wordWrap = 133] = "wordWrap", t[t.wordWrapBreakAfterCharacters = 134] = "wordWrapBreakAfterCharacters", t[t.wordWrapBreakBeforeCharacters = 135] = "wordWrapBreakBeforeCharacters", t[t.wordWrapColumn = 136] = "wordWrapColumn", t[t.wordWrapOverride1 = 137] = "wordWrapOverride1", t[t.wordWrapOverride2 = 138] = "wordWrapOverride2", t[t.wrappingIndent = 139] = "wrappingIndent", t[t.wrappingStrategy = 140] = "wrappingStrategy", t[t.showDeprecated = 141] = "showDeprecated", t[t.inlayHints = 142] = "inlayHints", t[t.editorClassName = 143] = "editorClassName", t[t.pixelRatio = 144] = "pixelRatio", t[t.tabFocusMode = 145] = "tabFocusMode", t[t.layoutInfo = 146] = "layoutInfo", t[t.wrappingInfo = 147] = "wrappingInfo", t[t.defaultColorDecorators = 148] = "defaultColorDecorators", t[t.colorDecoratorsActivatedOn = 149] = "colorDecoratorsActivatedOn", t[t.inlineCompletionsAccessibilityVerbose = 150] = "inlineCompletionsAccessibilityVerbose";
})(Mi || (Mi = {}));
var ki;
(function(t) {
  t[t.TextDefined = 0] = "TextDefined", t[t.LF = 1] = "LF", t[t.CRLF = 2] = "CRLF";
})(ki || (ki = {}));
var Ii;
(function(t) {
  t[t.LF = 0] = "LF", t[t.CRLF = 1] = "CRLF";
})(Ii || (Ii = {}));
var Ti;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 3] = "Right";
})(Ti || (Ti = {}));
var Pi;
(function(t) {
  t[t.Increase = 0] = "Increase", t[t.Decrease = 1] = "Decrease";
})(Pi || (Pi = {}));
var Bi;
(function(t) {
  t[t.None = 0] = "None", t[t.Indent = 1] = "Indent", t[t.IndentOutdent = 2] = "IndentOutdent", t[t.Outdent = 3] = "Outdent";
})(Bi || (Bi = {}));
var Fi;
(function(t) {
  t[t.Both = 0] = "Both", t[t.Right = 1] = "Right", t[t.Left = 2] = "Left", t[t.None = 3] = "None";
})(Fi || (Fi = {}));
var Di;
(function(t) {
  t[t.Type = 1] = "Type", t[t.Parameter = 2] = "Parameter";
})(Di || (Di = {}));
var Ui;
(function(t) {
  t[t.Automatic = 0] = "Automatic", t[t.Explicit = 1] = "Explicit";
})(Ui || (Ui = {}));
var Vi;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(Vi || (Vi = {}));
var tr;
(function(t) {
  t[t.DependsOnKbLayout = -1] = "DependsOnKbLayout", t[t.Unknown = 0] = "Unknown", t[t.Backspace = 1] = "Backspace", t[t.Tab = 2] = "Tab", t[t.Enter = 3] = "Enter", t[t.Shift = 4] = "Shift", t[t.Ctrl = 5] = "Ctrl", t[t.Alt = 6] = "Alt", t[t.PauseBreak = 7] = "PauseBreak", t[t.CapsLock = 8] = "CapsLock", t[t.Escape = 9] = "Escape", t[t.Space = 10] = "Space", t[t.PageUp = 11] = "PageUp", t[t.PageDown = 12] = "PageDown", t[t.End = 13] = "End", t[t.Home = 14] = "Home", t[t.LeftArrow = 15] = "LeftArrow", t[t.UpArrow = 16] = "UpArrow", t[t.RightArrow = 17] = "RightArrow", t[t.DownArrow = 18] = "DownArrow", t[t.Insert = 19] = "Insert", t[t.Delete = 20] = "Delete", t[t.Digit0 = 21] = "Digit0", t[t.Digit1 = 22] = "Digit1", t[t.Digit2 = 23] = "Digit2", t[t.Digit3 = 24] = "Digit3", t[t.Digit4 = 25] = "Digit4", t[t.Digit5 = 26] = "Digit5", t[t.Digit6 = 27] = "Digit6", t[t.Digit7 = 28] = "Digit7", t[t.Digit8 = 29] = "Digit8", t[t.Digit9 = 30] = "Digit9", t[t.KeyA = 31] = "KeyA", t[t.KeyB = 32] = "KeyB", t[t.KeyC = 33] = "KeyC", t[t.KeyD = 34] = "KeyD", t[t.KeyE = 35] = "KeyE", t[t.KeyF = 36] = "KeyF", t[t.KeyG = 37] = "KeyG", t[t.KeyH = 38] = "KeyH", t[t.KeyI = 39] = "KeyI", t[t.KeyJ = 40] = "KeyJ", t[t.KeyK = 41] = "KeyK", t[t.KeyL = 42] = "KeyL", t[t.KeyM = 43] = "KeyM", t[t.KeyN = 44] = "KeyN", t[t.KeyO = 45] = "KeyO", t[t.KeyP = 46] = "KeyP", t[t.KeyQ = 47] = "KeyQ", t[t.KeyR = 48] = "KeyR", t[t.KeyS = 49] = "KeyS", t[t.KeyT = 50] = "KeyT", t[t.KeyU = 51] = "KeyU", t[t.KeyV = 52] = "KeyV", t[t.KeyW = 53] = "KeyW", t[t.KeyX = 54] = "KeyX", t[t.KeyY = 55] = "KeyY", t[t.KeyZ = 56] = "KeyZ", t[t.Meta = 57] = "Meta", t[t.ContextMenu = 58] = "ContextMenu", t[t.F1 = 59] = "F1", t[t.F2 = 60] = "F2", t[t.F3 = 61] = "F3", t[t.F4 = 62] = "F4", t[t.F5 = 63] = "F5", t[t.F6 = 64] = "F6", t[t.F7 = 65] = "F7", t[t.F8 = 66] = "F8", t[t.F9 = 67] = "F9", t[t.F10 = 68] = "F10", t[t.F11 = 69] = "F11", t[t.F12 = 70] = "F12", t[t.F13 = 71] = "F13", t[t.F14 = 72] = "F14", t[t.F15 = 73] = "F15", t[t.F16 = 74] = "F16", t[t.F17 = 75] = "F17", t[t.F18 = 76] = "F18", t[t.F19 = 77] = "F19", t[t.F20 = 78] = "F20", t[t.F21 = 79] = "F21", t[t.F22 = 80] = "F22", t[t.F23 = 81] = "F23", t[t.F24 = 82] = "F24", t[t.NumLock = 83] = "NumLock", t[t.ScrollLock = 84] = "ScrollLock", t[t.Semicolon = 85] = "Semicolon", t[t.Equal = 86] = "Equal", t[t.Comma = 87] = "Comma", t[t.Minus = 88] = "Minus", t[t.Period = 89] = "Period", t[t.Slash = 90] = "Slash", t[t.Backquote = 91] = "Backquote", t[t.BracketLeft = 92] = "BracketLeft", t[t.Backslash = 93] = "Backslash", t[t.BracketRight = 94] = "BracketRight", t[t.Quote = 95] = "Quote", t[t.OEM_8 = 96] = "OEM_8", t[t.IntlBackslash = 97] = "IntlBackslash", t[t.Numpad0 = 98] = "Numpad0", t[t.Numpad1 = 99] = "Numpad1", t[t.Numpad2 = 100] = "Numpad2", t[t.Numpad3 = 101] = "Numpad3", t[t.Numpad4 = 102] = "Numpad4", t[t.Numpad5 = 103] = "Numpad5", t[t.Numpad6 = 104] = "Numpad6", t[t.Numpad7 = 105] = "Numpad7", t[t.Numpad8 = 106] = "Numpad8", t[t.Numpad9 = 107] = "Numpad9", t[t.NumpadMultiply = 108] = "NumpadMultiply", t[t.NumpadAdd = 109] = "NumpadAdd", t[t.NUMPAD_SEPARATOR = 110] = "NUMPAD_SEPARATOR", t[t.NumpadSubtract = 111] = "NumpadSubtract", t[t.NumpadDecimal = 112] = "NumpadDecimal", t[t.NumpadDivide = 113] = "NumpadDivide", t[t.KEY_IN_COMPOSITION = 114] = "KEY_IN_COMPOSITION", t[t.ABNT_C1 = 115] = "ABNT_C1", t[t.ABNT_C2 = 116] = "ABNT_C2", t[t.AudioVolumeMute = 117] = "AudioVolumeMute", t[t.AudioVolumeUp = 118] = "AudioVolumeUp", t[t.AudioVolumeDown = 119] = "AudioVolumeDown", t[t.BrowserSearch = 120] = "BrowserSearch", t[t.BrowserHome = 121] = "BrowserHome", t[t.BrowserBack = 122] = "BrowserBack", t[t.BrowserForward = 123] = "BrowserForward", t[t.MediaTrackNext = 124] = "MediaTrackNext", t[t.MediaTrackPrevious = 125] = "MediaTrackPrevious", t[t.MediaStop = 126] = "MediaStop", t[t.MediaPlayPause = 127] = "MediaPlayPause", t[t.LaunchMediaPlayer = 128] = "LaunchMediaPlayer", t[t.LaunchMail = 129] = "LaunchMail", t[t.LaunchApp2 = 130] = "LaunchApp2", t[t.Clear = 131] = "Clear", t[t.MAX_VALUE = 132] = "MAX_VALUE";
})(tr || (tr = {}));
var nr;
(function(t) {
  t[t.Hint = 1] = "Hint", t[t.Info = 2] = "Info", t[t.Warning = 4] = "Warning", t[t.Error = 8] = "Error";
})(nr || (nr = {}));
var rr;
(function(t) {
  t[t.Unnecessary = 1] = "Unnecessary", t[t.Deprecated = 2] = "Deprecated";
})(rr || (rr = {}));
var qi;
(function(t) {
  t[t.Inline = 1] = "Inline", t[t.Gutter = 2] = "Gutter";
})(qi || (qi = {}));
var $i;
(function(t) {
  t[t.Normal = 1] = "Normal", t[t.Underlined = 2] = "Underlined";
})($i || ($i = {}));
var Wi;
(function(t) {
  t[t.UNKNOWN = 0] = "UNKNOWN", t[t.TEXTAREA = 1] = "TEXTAREA", t[t.GUTTER_GLYPH_MARGIN = 2] = "GUTTER_GLYPH_MARGIN", t[t.GUTTER_LINE_NUMBERS = 3] = "GUTTER_LINE_NUMBERS", t[t.GUTTER_LINE_DECORATIONS = 4] = "GUTTER_LINE_DECORATIONS", t[t.GUTTER_VIEW_ZONE = 5] = "GUTTER_VIEW_ZONE", t[t.CONTENT_TEXT = 6] = "CONTENT_TEXT", t[t.CONTENT_EMPTY = 7] = "CONTENT_EMPTY", t[t.CONTENT_VIEW_ZONE = 8] = "CONTENT_VIEW_ZONE", t[t.CONTENT_WIDGET = 9] = "CONTENT_WIDGET", t[t.OVERVIEW_RULER = 10] = "OVERVIEW_RULER", t[t.SCROLLBAR = 11] = "SCROLLBAR", t[t.OVERLAY_WIDGET = 12] = "OVERLAY_WIDGET", t[t.OUTSIDE_EDITOR = 13] = "OUTSIDE_EDITOR";
})(Wi || (Wi = {}));
var Hi;
(function(t) {
  t[t.AIGenerated = 1] = "AIGenerated";
})(Hi || (Hi = {}));
var Oi;
(function(t) {
  t[t.Invoke = 0] = "Invoke", t[t.Automatic = 1] = "Automatic";
})(Oi || (Oi = {}));
var zi;
(function(t) {
  t[t.TOP_RIGHT_CORNER = 0] = "TOP_RIGHT_CORNER", t[t.BOTTOM_RIGHT_CORNER = 1] = "BOTTOM_RIGHT_CORNER", t[t.TOP_CENTER = 2] = "TOP_CENTER";
})(zi || (zi = {}));
var ji;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 4] = "Right", t[t.Full = 7] = "Full";
})(ji || (ji = {}));
var Gi;
(function(t) {
  t[t.Word = 0] = "Word", t[t.Line = 1] = "Line", t[t.Suggest = 2] = "Suggest";
})(Gi || (Gi = {}));
var Qi;
(function(t) {
  t[t.Left = 0] = "Left", t[t.Right = 1] = "Right", t[t.None = 2] = "None", t[t.LeftOfInjectedText = 3] = "LeftOfInjectedText", t[t.RightOfInjectedText = 4] = "RightOfInjectedText";
})(Qi || (Qi = {}));
var Yi;
(function(t) {
  t[t.Off = 0] = "Off", t[t.On = 1] = "On", t[t.Relative = 2] = "Relative", t[t.Interval = 3] = "Interval", t[t.Custom = 4] = "Custom";
})(Yi || (Yi = {}));
var Xi;
(function(t) {
  t[t.None = 0] = "None", t[t.Text = 1] = "Text", t[t.Blocks = 2] = "Blocks";
})(Xi || (Xi = {}));
var Ji;
(function(t) {
  t[t.Smooth = 0] = "Smooth", t[t.Immediate = 1] = "Immediate";
})(Ji || (Ji = {}));
var Zi;
(function(t) {
  t[t.Auto = 1] = "Auto", t[t.Hidden = 2] = "Hidden", t[t.Visible = 3] = "Visible";
})(Zi || (Zi = {}));
var ir;
(function(t) {
  t[t.LTR = 0] = "LTR", t[t.RTL = 1] = "RTL";
})(ir || (ir = {}));
var Ki;
(function(t) {
  t.Off = "off", t.OnCode = "onCode", t.On = "on";
})(Ki || (Ki = {}));
var e1;
(function(t) {
  t[t.Invoke = 1] = "Invoke", t[t.TriggerCharacter = 2] = "TriggerCharacter", t[t.ContentChange = 3] = "ContentChange";
})(e1 || (e1 = {}));
var t1;
(function(t) {
  t[t.File = 0] = "File", t[t.Module = 1] = "Module", t[t.Namespace = 2] = "Namespace", t[t.Package = 3] = "Package", t[t.Class = 4] = "Class", t[t.Method = 5] = "Method", t[t.Property = 6] = "Property", t[t.Field = 7] = "Field", t[t.Constructor = 8] = "Constructor", t[t.Enum = 9] = "Enum", t[t.Interface = 10] = "Interface", t[t.Function = 11] = "Function", t[t.Variable = 12] = "Variable", t[t.Constant = 13] = "Constant", t[t.String = 14] = "String", t[t.Number = 15] = "Number", t[t.Boolean = 16] = "Boolean", t[t.Array = 17] = "Array", t[t.Object = 18] = "Object", t[t.Key = 19] = "Key", t[t.Null = 20] = "Null", t[t.EnumMember = 21] = "EnumMember", t[t.Struct = 22] = "Struct", t[t.Event = 23] = "Event", t[t.Operator = 24] = "Operator", t[t.TypeParameter = 25] = "TypeParameter";
})(t1 || (t1 = {}));
var n1;
(function(t) {
  t[t.Deprecated = 1] = "Deprecated";
})(n1 || (n1 = {}));
var r1;
(function(t) {
  t[t.Hidden = 0] = "Hidden", t[t.Blink = 1] = "Blink", t[t.Smooth = 2] = "Smooth", t[t.Phase = 3] = "Phase", t[t.Expand = 4] = "Expand", t[t.Solid = 5] = "Solid";
})(r1 || (r1 = {}));
var i1;
(function(t) {
  t[t.Line = 1] = "Line", t[t.Block = 2] = "Block", t[t.Underline = 3] = "Underline", t[t.LineThin = 4] = "LineThin", t[t.BlockOutline = 5] = "BlockOutline", t[t.UnderlineThin = 6] = "UnderlineThin";
})(i1 || (i1 = {}));
var s1;
(function(t) {
  t[t.AlwaysGrowsWhenTypingAtEdges = 0] = "AlwaysGrowsWhenTypingAtEdges", t[t.NeverGrowsWhenTypingAtEdges = 1] = "NeverGrowsWhenTypingAtEdges", t[t.GrowsOnlyWhenTypingBefore = 2] = "GrowsOnlyWhenTypingBefore", t[t.GrowsOnlyWhenTypingAfter = 3] = "GrowsOnlyWhenTypingAfter";
})(s1 || (s1 = {}));
var o1;
(function(t) {
  t[t.None = 0] = "None", t[t.Same = 1] = "Same", t[t.Indent = 2] = "Indent", t[t.DeepIndent = 3] = "DeepIndent";
})(o1 || (o1 = {}));
const ut = class ut {
  static chord(e, n) {
    return ll(e, n);
  }
};
ut.CtrlCmd = 2048, ut.Shift = 1024, ut.Alt = 512, ut.WinCtrl = 256;
let sr = ut;
function dl() {
  return {
    editor: void 0,
    // undefined override expected here
    languages: void 0,
    // undefined override expected here
    CancellationTokenSource: il,
    Emitter: me,
    KeyCode: tr,
    KeyMod: sr,
    Position: O,
    Range: I,
    Selection: le,
    SelectionDirection: ir,
    MarkerSeverity: nr,
    MarkerTag: rr,
    Uri: oe,
    Token: ml
  };
}
const Ct = class Ct {
  static getChannel(e) {
    return e.getChannel(Ct.CHANNEL_NAME);
  }
  static setChannel(e, n) {
    e.setChannel(Ct.CHANNEL_NAME, n);
  }
};
Ct.CHANNEL_NAME = "editorWorkerHost";
let or = Ct;
var a1;
class gl {
  constructor() {
    this[a1] = "LinkedMap", this._map = /* @__PURE__ */ new Map(), this._head = void 0, this._tail = void 0, this._size = 0, this._state = 0;
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
  [(a1 = Symbol.toStringTag, Symbol.iterator)]() {
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
class pl extends gl {
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
class bl extends pl {
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
class yl {
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
new bl(10);
function _l(t) {
  let e = [];
  for (; Object.prototype !== t; )
    e = e.concat(Object.getOwnPropertyNames(t)), t = Object.getPrototypeOf(t);
  return e;
}
function l1(t) {
  const e = [];
  for (const n of _l(t))
    typeof t[n] == "function" && e.push(n);
  return e;
}
function wl(t, e) {
  const n = (i) => function() {
    const s = Array.prototype.slice.call(arguments, 0);
    return e(i, s);
  }, r = {};
  for (const i of t)
    r[i] = n(i);
  return r;
}
var u1;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 4] = "Right", t[t.Full = 7] = "Full";
})(u1 || (u1 = {}));
var c1;
(function(t) {
  t[t.Left = 1] = "Left", t[t.Center = 2] = "Center", t[t.Right = 3] = "Right";
})(c1 || (c1 = {}));
var h1;
(function(t) {
  t[t.Both = 0] = "Both", t[t.Right = 1] = "Right", t[t.Left = 2] = "Left", t[t.None = 3] = "None";
})(h1 || (h1 = {}));
function xl(t, e, n, r, i) {
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
function Ll(t, e, n, r, i) {
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
function vl(t, e, n, r, i) {
  return xl(t, e, n, r, i) && Ll(t, e, n, r, i);
}
class Nl {
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
          pa(e, n, this._searchRegex.lastIndex) > 65535 ? this._searchRegex.lastIndex += 2 : this._searchRegex.lastIndex += 1;
          continue;
        }
        return null;
      }
      if (this._prevMatchStartIndex = i, this._prevMatchLength = s, !this._wordSeparators || vl(this._wordSeparators, e, n, i, s))
        return r;
    } while (r);
    return null;
  }
}
function El(t, e = "Unreachable") {
  throw new Error(e);
}
function sn(t) {
  if (!t()) {
    debugger;
    t(), Et(new ce("Assertion Failed"));
  }
}
function bs(t, e) {
  let n = 0;
  for (; n < t.length - 1; ) {
    const r = t[n], i = t[n + 1];
    if (!e(r, i))
      return !1;
    n++;
  }
  return !0;
}
const Sl = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
function Al(t = "") {
  let e = "(-?\\d*\\.\\d\\w*)|([^";
  for (const n of Sl)
    t.indexOf(n) >= 0 || (e += "\\" + n);
  return e += "\\s]+)", new RegExp(e, "g");
}
const ys = Al();
function _s(t) {
  let e = ys;
  if (t && t instanceof RegExp)
    if (t.global)
      e = t;
    else {
      let n = "g";
      t.ignoreCase && (n += "i"), t.multiline && (n += "m"), t.unicode && (n += "u"), e = new RegExp(t.source, n);
    }
  return e.lastIndex = 0, e;
}
const ws = new Ps();
ws.unshift({
  maxLen: 1e3,
  windowSize: 15,
  timeBudget: 150
});
function Sr(t, e, n, r, i) {
  if (e = _s(e), i || (i = Qt.first(ws)), n.length > i.maxLen) {
    let c = t - i.maxLen / 2;
    return c < 0 ? c = 0 : r += c, n = n.substring(c, t + i.maxLen / 2), Sr(t, e, n, r, i);
  }
  const s = Date.now(), o = t - 1 - r;
  let l = -1, u = null;
  for (let c = 1; !(Date.now() - s >= i.timeBudget); c++) {
    const f = o - i.windowSize * c;
    e.lastIndex = Math.max(0, f);
    const h = Rl(e, n, o, l);
    if (!h && u || (u = h, f <= 0))
      break;
    l = f;
  }
  if (u) {
    const c = {
      word: u[0],
      startColumn: r + 1 + u.index,
      endColumn: r + 1 + u.index + u[0].length
    };
    return e.lastIndex = 0, c;
  }
  return null;
}
function Rl(t, e, n, r) {
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
class Cl {
  static computeUnicodeHighlights(e, n, r) {
    const i = r ? r.startLineNumber : 1, s = r ? r.endLineNumber : e.getLineCount(), o = new f1(n), l = o.getCandidateCodePoints();
    let u;
    l === "allNonBasicAscii" ? u = new RegExp("[^\\t\\n\\r\\x20-\\x7E]", "g") : u = new RegExp(`${Ml(Array.from(l))}`, "g");
    const c = new Nl(null, u), f = [];
    let h = !1, m, d = 0, g = 0, b = 0;
    e: for (let x = i, v = s; x <= v; x++) {
      const E = e.getLineContent(x), N = E.length;
      c.reset(0);
      do
        if (m = c.next(E), m) {
          let _ = m.index, y = m.index + m[0].length;
          if (_ > 0) {
            const V = E.charCodeAt(_ - 1);
            Kt(V) && _--;
          }
          if (y + 1 < N) {
            const V = E.charCodeAt(y - 1);
            Kt(V) && y++;
          }
          const w = E.substring(_, y);
          let A = Sr(_ + 1, ys, E, 0);
          A && A.endColumn <= _ + 1 && (A = null);
          const C = o.shouldHighlightNonBasicASCII(w, A ? A.word : null);
          if (C !== 0) {
            if (C === 3 ? d++ : C === 2 ? g++ : C === 1 ? b++ : El(), f.length >= 1e3) {
              h = !0;
              break e;
            }
            f.push(new I(x, _ + 1, x, y + 1));
          }
        }
      while (m);
    }
    return {
      ranges: f,
      hasMore: h,
      ambiguousCharacterCount: d,
      invisibleCharacterCount: g,
      nonBasicAsciiCharacterCount: b
    };
  }
  static computeUnicodeHighlightReason(e, n) {
    const r = new f1(n);
    switch (r.shouldHighlightNonBasicASCII(e, null)) {
      case 0:
        return null;
      case 2:
        return {
          kind: 1
          /* UnicodeHighlighterReasonKind.Invisible */
        };
      case 3: {
        const s = e.codePointAt(0), o = r.ambiguousCharacters.getPrimaryConfusable(s), l = Tt.getLocales().filter((u) => !Tt.getInstance(/* @__PURE__ */ new Set([...n.allowedLocales, u])).isAmbiguous(s));
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
function Ml(t, e) {
  return `[${fa(t.map((r) => String.fromCodePoint(r)).join(""))}]`;
}
class f1 {
  constructor(e) {
    this.options = e, this.allowedCodePoints = new Set(e.allowedCodePoints), this.ambiguousCharacters = Tt.getInstance(new Set(e.allowedLocales));
  }
  getCandidateCodePoints() {
    if (this.options.nonBasicASCII)
      return "allNonBasicAscii";
    const e = /* @__PURE__ */ new Set();
    if (this.options.invisibleCharacters)
      for (const n of St.codePoints)
        m1(String.fromCodePoint(n)) || e.add(n);
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
        const l = o.codePointAt(0), u = ya(o);
        i = i || u, !u && !this.ambiguousCharacters.isAmbiguous(l) && !St.isInvisibleCharacter(l) && (s = !0);
      }
    return (
      /* Don't allow mixing weird looking characters with ASCII */
      !i && /* Is there an obviously weird looking character? */
      s ? 0 : this.options.invisibleCharacters && !m1(e) && St.isInvisibleCharacter(r) ? 2 : this.options.ambiguousCharacters && this.ambiguousCharacters.isAmbiguous(r) ? 3 : 0
    );
  }
}
function m1(t) {
  return t === " " || t === `
` || t === "	";
}
class Ot {
  constructor(e, n, r) {
    this.changes = e, this.moves = n, this.hitTimeout = r;
  }
}
class kl {
  constructor(e, n) {
    this.lineRangeMapping = e, this.changes = n;
  }
}
class U {
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
      n.splice(r, i - r, new U(s, o));
    }
  }
  static tryCreate(e, n) {
    if (!(e > n))
      return new U(e, n);
  }
  static ofLength(e) {
    return new U(0, e);
  }
  static ofStartAndLength(e, n) {
    return new U(e, e + n);
  }
  constructor(e, n) {
    if (this.start = e, this.endExclusive = n, e > n)
      throw new ce(`Invalid range: ${this.toString()}`);
  }
  get isEmpty() {
    return this.start === this.endExclusive;
  }
  delta(e) {
    return new U(this.start + e, this.endExclusive + e);
  }
  deltaStart(e) {
    return new U(this.start + e, this.endExclusive);
  }
  deltaEnd(e) {
    return new U(this.start, this.endExclusive + e);
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
    return new U(Math.min(this.start, e.start), Math.max(this.endExclusive, e.endExclusive));
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
      return new U(n, r);
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
      throw new ce(`Invalid clipping range: ${this.toString()}`);
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
      throw new ce(`Invalid clipping range: ${this.toString()}`);
    return e < this.start ? this.endExclusive - (this.start - e) % this.length : e >= this.endExclusive ? this.start + (e - this.start) % this.length : e;
  }
  forEach(e) {
    for (let n = this.start; n < this.endExclusive; n++)
      e(n);
  }
}
function pt(t, e) {
  const n = Pt(t, e);
  return n === -1 ? void 0 : t[n];
}
function Pt(t, e, n = 0, r = t.length) {
  let i = n, s = r;
  for (; i < s; ) {
    const o = Math.floor((i + s) / 2);
    e(t[o]) ? i = o + 1 : s = o;
  }
  return i - 1;
}
function Il(t, e) {
  const n = ar(t, e);
  return n === t.length ? void 0 : t[n];
}
function ar(t, e, n = 0, r = t.length) {
  let i = n, s = r;
  for (; i < s; ) {
    const o = Math.floor((i + s) / 2);
    e(t[o]) ? s = o : i = o + 1;
  }
  return i;
}
const mn = class mn {
  constructor(e) {
    this._array = e, this._findLastMonotonousLastIdx = 0;
  }
  /**
   * The predicate must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
   * For subsequent calls, current predicate must be weaker than (or equal to) the previous predicate, i.e. more entries must be `true`.
   */
  findLastMonotonous(e) {
    if (mn.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (const r of this._array)
          if (this._prevFindLastPredicate(r) && !e(r))
            throw new Error("MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.");
      }
      this._prevFindLastPredicate = e;
    }
    const n = Pt(this._array, e, this._findLastMonotonousLastIdx);
    return this._findLastMonotonousLastIdx = n + 1, n === -1 ? void 0 : this._array[n];
  }
};
mn.assertInvariants = !1;
let on = mn;
class B {
  static fromRangeInclusive(e) {
    return new B(e.startLineNumber, e.endLineNumber + 1);
  }
  /**
   * @param lineRanges An array of sorted line ranges.
   */
  static joinMany(e) {
    if (e.length === 0)
      return [];
    let n = new Le(e[0].slice());
    for (let r = 1; r < e.length; r++)
      n = n.getUnion(new Le(e[r].slice()));
    return n.ranges;
  }
  static join(e) {
    if (e.length === 0)
      throw new ce("lineRanges cannot be empty");
    let n = e[0].startLineNumber, r = e[0].endLineNumberExclusive;
    for (let i = 1; i < e.length; i++)
      n = Math.min(n, e[i].startLineNumber), r = Math.max(r, e[i].endLineNumberExclusive);
    return new B(n, r);
  }
  static ofLength(e, n) {
    return new B(e, e + n);
  }
  /**
   * @internal
   */
  static deserialize(e) {
    return new B(e[0], e[1]);
  }
  constructor(e, n) {
    if (e > n)
      throw new ce(`startLineNumber ${e} cannot be after endLineNumberExclusive ${n}`);
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
    return new B(this.startLineNumber + e, this.endLineNumberExclusive + e);
  }
  deltaLength(e) {
    return new B(this.startLineNumber, this.endLineNumberExclusive + e);
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
    return new B(Math.min(this.startLineNumber, e.startLineNumber), Math.max(this.endLineNumberExclusive, e.endLineNumberExclusive));
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
      return new B(n, r);
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
    return this.isEmpty ? null : new I(this.startLineNumber, 1, this.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER);
  }
  /**
   * @deprecated Using this function is discouraged because it might lead to bugs: The end position is not guaranteed to be a valid position!
  */
  toExclusiveRange() {
    return new I(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
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
    return new U(this.startLineNumber - 1, this.endLineNumberExclusive - 1);
  }
}
class Le {
  constructor(e = []) {
    this._normalizedRanges = e;
  }
  get ranges() {
    return this._normalizedRanges;
  }
  addRange(e) {
    if (e.length === 0)
      return;
    const n = ar(this._normalizedRanges, (i) => i.endLineNumberExclusive >= e.startLineNumber), r = Pt(this._normalizedRanges, (i) => i.startLineNumber <= e.endLineNumberExclusive) + 1;
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
    const n = pt(this._normalizedRanges, (r) => r.startLineNumber <= e);
    return !!n && n.endLineNumberExclusive > e;
  }
  intersects(e) {
    const n = pt(this._normalizedRanges, (r) => r.startLineNumber < e.endLineNumberExclusive);
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
        const l = this._normalizedRanges[r], u = e._normalizedRanges[i];
        l.startLineNumber < u.startLineNumber ? (o = l, r++) : (o = u, i++);
      } else r < this._normalizedRanges.length ? (o = this._normalizedRanges[r], r++) : (o = e._normalizedRanges[i], i++);
      s === null ? s = o : s.endLineNumberExclusive >= o.startLineNumber ? s = new B(s.startLineNumber, Math.max(s.endLineNumberExclusive, o.endLineNumberExclusive)) : (n.push(s), s = o);
    }
    return s !== null && n.push(s), new Le(n);
  }
  /**
   * Subtracts all ranges in this set from `range` and returns the result.
   */
  subtractFrom(e) {
    const n = ar(this._normalizedRanges, (o) => o.endLineNumberExclusive >= e.startLineNumber), r = Pt(this._normalizedRanges, (o) => o.startLineNumber <= e.endLineNumberExclusive) + 1;
    if (n === r)
      return new Le([e]);
    const i = [];
    let s = e.startLineNumber;
    for (let o = n; o < r; o++) {
      const l = this._normalizedRanges[o];
      l.startLineNumber > s && i.push(new B(s, l.startLineNumber)), s = l.endLineNumberExclusive;
    }
    return s < e.endLineNumberExclusive && i.push(new B(s, e.endLineNumberExclusive)), new Le(i);
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
    return new Le(n);
  }
  getWithDelta(e) {
    return new Le(this._normalizedRanges.map((n) => n.delta(e)));
  }
}
const Fe = class Fe {
  static betweenPositions(e, n) {
    return e.lineNumber === n.lineNumber ? new Fe(0, n.column - e.column) : new Fe(n.lineNumber - e.lineNumber, n.column - 1);
  }
  static ofRange(e) {
    return Fe.betweenPositions(e.getStartPosition(), e.getEndPosition());
  }
  static ofText(e) {
    let n = 0, r = 0;
    for (const i of e)
      i === `
` ? (n++, r = 0) : r++;
    return new Fe(n, r);
  }
  constructor(e, n) {
    this.lineCount = e, this.columnCount = n;
  }
  isGreaterThanOrEqualTo(e) {
    return this.lineCount !== e.lineCount ? this.lineCount > e.lineCount : this.columnCount >= e.columnCount;
  }
  createRange(e) {
    return this.lineCount === 0 ? new I(e.lineNumber, e.column, e.lineNumber, e.column + this.columnCount) : new I(e.lineNumber, e.column, e.lineNumber + this.lineCount, this.columnCount + 1);
  }
  addToPosition(e) {
    return this.lineCount === 0 ? new O(e.lineNumber, e.column + this.columnCount) : new O(e.lineNumber + this.lineCount, this.columnCount + 1);
  }
  toString() {
    return `${this.lineCount},${this.columnCount}`;
  }
};
Fe.zero = new Fe(0, 0);
let d1 = Fe;
class Tl {
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
class ge {
  static inverse(e, n, r) {
    const i = [];
    let s = 1, o = 1;
    for (const u of e) {
      const c = new ge(new B(s, u.original.startLineNumber), new B(o, u.modified.startLineNumber));
      c.modified.isEmpty || i.push(c), s = u.original.endLineNumberExclusive, o = u.modified.endLineNumberExclusive;
    }
    const l = new ge(new B(s, n + 1), new B(o, r + 1));
    return l.modified.isEmpty || i.push(l), i;
  }
  static clip(e, n, r) {
    const i = [];
    for (const s of e) {
      const o = s.original.intersect(n), l = s.modified.intersect(r);
      o && !o.isEmpty && l && !l.isEmpty && i.push(new ge(o, l));
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
    return new ge(this.modified, this.original);
  }
  join(e) {
    return new ge(this.original.join(e.original), this.modified.join(e.modified));
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping() {
    const e = this.original.toInclusiveRange(), n = this.modified.toInclusiveRange();
    if (e && n)
      return new be(e, n);
    if (this.original.startLineNumber === 1 || this.modified.startLineNumber === 1) {
      if (!(this.modified.startLineNumber === 1 && this.original.startLineNumber === 1))
        throw new ce("not a valid diff");
      return new be(new I(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1), new I(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1));
    } else
      return new be(new I(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), new I(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER));
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping2(e, n) {
    if (g1(this.original.endLineNumberExclusive, e) && g1(this.modified.endLineNumberExclusive, n))
      return new be(new I(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1), new I(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1));
    if (!this.original.isEmpty && !this.modified.isEmpty)
      return new be(I.fromPositions(new O(this.original.startLineNumber, 1), tt(new O(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), e)), I.fromPositions(new O(this.modified.startLineNumber, 1), tt(new O(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), n)));
    if (this.original.startLineNumber > 1 && this.modified.startLineNumber > 1)
      return new be(I.fromPositions(tt(new O(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER), e), tt(new O(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), e)), I.fromPositions(tt(new O(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER), n), tt(new O(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), n)));
    throw new ce();
  }
}
function tt(t, e) {
  if (t.lineNumber < 1)
    return new O(1, 1);
  if (t.lineNumber > e.length)
    return new O(e.length, e[e.length - 1].length + 1);
  const n = e[t.lineNumber - 1];
  return t.column > n.length + 1 ? new O(t.lineNumber, n.length + 1) : t;
}
function g1(t, e) {
  return t >= 1 && t <= e.length;
}
class Me extends ge {
  static fromRangeMappings(e) {
    const n = B.join(e.map((i) => B.fromRangeInclusive(i.originalRange))), r = B.join(e.map((i) => B.fromRangeInclusive(i.modifiedRange)));
    return new Me(n, r, e);
  }
  constructor(e, n, r) {
    super(e, n), this.innerChanges = r;
  }
  flip() {
    return new Me(this.modified, this.original, this.innerChanges?.map((e) => e.flip()));
  }
  withInnerChangesFromLineRanges() {
    return new Me(this.original, this.modified, [this.toRangeMapping()]);
  }
}
class be {
  static assertSorted(e) {
    for (let n = 1; n < e.length; n++) {
      const r = e[n - 1], i = e[n];
      if (!(r.originalRange.getEndPosition().isBeforeOrEqual(i.originalRange.getStartPosition()) && r.modifiedRange.getEndPosition().isBeforeOrEqual(i.modifiedRange.getStartPosition())))
        throw new ce("Range mappings must be sorted");
    }
  }
  constructor(e, n) {
    this.originalRange = e, this.modifiedRange = n;
  }
  toString() {
    return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`;
  }
  flip() {
    return new be(this.modifiedRange, this.originalRange);
  }
  /**
   * Creates a single text edit that describes the change from the original to the modified text.
  */
  toTextEdit(e) {
    const n = e.getValueOfRange(this.modifiedRange);
    return new Tl(this.originalRange, n);
  }
}
const Pl = 3;
class Bl {
  computeDiff(e, n, r) {
    const s = new Ul(e, n, {
      maxComputationTime: r.maxComputationTimeMs,
      shouldIgnoreTrimWhitespace: r.ignoreTrimWhitespace,
      shouldComputeCharChanges: !0,
      shouldMakePrettyDiff: !0,
      shouldPostProcessCharChanges: !0
    }).computeDiff(), o = [];
    let l = null;
    for (const u of s.changes) {
      let c;
      u.originalEndLineNumber === 0 ? c = new B(u.originalStartLineNumber + 1, u.originalStartLineNumber + 1) : c = new B(u.originalStartLineNumber, u.originalEndLineNumber + 1);
      let f;
      u.modifiedEndLineNumber === 0 ? f = new B(u.modifiedStartLineNumber + 1, u.modifiedStartLineNumber + 1) : f = new B(u.modifiedStartLineNumber, u.modifiedEndLineNumber + 1);
      let h = new Me(c, f, u.charChanges?.map((m) => new be(new I(m.originalStartLineNumber, m.originalStartColumn, m.originalEndLineNumber, m.originalEndColumn), new I(m.modifiedStartLineNumber, m.modifiedStartColumn, m.modifiedEndLineNumber, m.modifiedEndColumn))));
      l && (l.modified.endLineNumberExclusive === h.modified.startLineNumber || l.original.endLineNumberExclusive === h.original.startLineNumber) && (h = new Me(l.original.join(h.original), l.modified.join(h.modified), l.innerChanges && h.innerChanges ? l.innerChanges.concat(h.innerChanges) : void 0), o.pop()), o.push(h), l = h;
    }
    return sn(() => bs(o, (u, c) => c.original.startLineNumber - u.original.endLineNumberExclusive === c.modified.startLineNumber - u.modified.endLineNumberExclusive && // There has to be an unchanged line in between (otherwise both diffs should have been joined)
    u.original.endLineNumberExclusive < c.original.startLineNumber && u.modified.endLineNumberExclusive < c.modified.startLineNumber)), new Ot(o, [], s.quitEarly);
  }
}
function xs(t, e, n, r) {
  return new De(t, e, n).ComputeDiff(r);
}
let p1 = class {
  constructor(e) {
    const n = [], r = [];
    for (let i = 0, s = e.length; i < s; i++)
      n[i] = lr(e[i], 1), r[i] = ur(e[i], 1);
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
    for (let u = n; u <= r; u++) {
      const c = this.lines[u], f = e ? this._startColumns[u] : 1, h = e ? this._endColumns[u] : c.length + 1;
      for (let m = f; m < h; m++)
        i[l] = c.charCodeAt(m - 1), s[l] = u + 1, o[l] = m, l++;
      !e && u < r && (i[l] = 10, s[l] = u + 1, o[l] = c.length + 1, l++);
    }
    return new Fl(i, s, o);
  }
};
class Fl {
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
class mt {
  constructor(e, n, r, i, s, o, l, u) {
    this.originalStartLineNumber = e, this.originalStartColumn = n, this.originalEndLineNumber = r, this.originalEndColumn = i, this.modifiedStartLineNumber = s, this.modifiedStartColumn = o, this.modifiedEndLineNumber = l, this.modifiedEndColumn = u;
  }
  static createFromDiffChange(e, n, r) {
    const i = n.getStartLineNumber(e.originalStart), s = n.getStartColumn(e.originalStart), o = n.getEndLineNumber(e.originalStart + e.originalLength - 1), l = n.getEndColumn(e.originalStart + e.originalLength - 1), u = r.getStartLineNumber(e.modifiedStart), c = r.getStartColumn(e.modifiedStart), f = r.getEndLineNumber(e.modifiedStart + e.modifiedLength - 1), h = r.getEndColumn(e.modifiedStart + e.modifiedLength - 1);
    return new mt(i, s, o, l, u, c, f, h);
  }
}
function Dl(t) {
  if (t.length <= 1)
    return t;
  const e = [t[0]];
  let n = e[0];
  for (let r = 1, i = t.length; r < i; r++) {
    const s = t[r], o = s.originalStart - (n.originalStart + n.originalLength), l = s.modifiedStart - (n.modifiedStart + n.modifiedLength);
    Math.min(o, l) < Pl ? (n.originalLength = s.originalStart + s.originalLength - n.originalStart, n.modifiedLength = s.modifiedStart + s.modifiedLength - n.modifiedStart) : (e.push(s), n = s);
  }
  return e;
}
class At {
  constructor(e, n, r, i, s) {
    this.originalStartLineNumber = e, this.originalEndLineNumber = n, this.modifiedStartLineNumber = r, this.modifiedEndLineNumber = i, this.charChanges = s;
  }
  static createFromDiffResult(e, n, r, i, s, o, l) {
    let u, c, f, h, m;
    if (n.originalLength === 0 ? (u = r.getStartLineNumber(n.originalStart) - 1, c = 0) : (u = r.getStartLineNumber(n.originalStart), c = r.getEndLineNumber(n.originalStart + n.originalLength - 1)), n.modifiedLength === 0 ? (f = i.getStartLineNumber(n.modifiedStart) - 1, h = 0) : (f = i.getStartLineNumber(n.modifiedStart), h = i.getEndLineNumber(n.modifiedStart + n.modifiedLength - 1)), o && n.originalLength > 0 && n.originalLength < 20 && n.modifiedLength > 0 && n.modifiedLength < 20 && s()) {
      const d = r.createCharSequence(e, n.originalStart, n.originalStart + n.originalLength - 1), g = i.createCharSequence(e, n.modifiedStart, n.modifiedStart + n.modifiedLength - 1);
      if (d.getElements().length > 0 && g.getElements().length > 0) {
        let b = xs(d, g, s, !0).changes;
        l && (b = Dl(b)), m = [];
        for (let x = 0, v = b.length; x < v; x++)
          m.push(mt.createFromDiffChange(b[x], d, g));
      }
    }
    return new At(u, c, f, h, m);
  }
}
class Ul {
  constructor(e, n, r) {
    this.shouldComputeCharChanges = r.shouldComputeCharChanges, this.shouldPostProcessCharChanges = r.shouldPostProcessCharChanges, this.shouldIgnoreTrimWhitespace = r.shouldIgnoreTrimWhitespace, this.shouldMakePrettyDiff = r.shouldMakePrettyDiff, this.originalLines = e, this.modifiedLines = n, this.original = new p1(e), this.modified = new p1(n), this.continueLineDiff = b1(r.maxComputationTime), this.continueCharDiff = b1(r.maxComputationTime === 0 ? 0 : Math.min(r.maxComputationTime, 5e3));
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
    const e = xs(this.original, this.modified, this.continueLineDiff, this.shouldMakePrettyDiff), n = e.changes, r = e.quitEarly;
    if (this.shouldIgnoreTrimWhitespace) {
      const l = [];
      for (let u = 0, c = n.length; u < c; u++)
        l.push(At.createFromDiffResult(this.shouldIgnoreTrimWhitespace, n[u], this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges));
      return {
        quitEarly: r,
        changes: l
      };
    }
    const i = [];
    let s = 0, o = 0;
    for (let l = -1, u = n.length; l < u; l++) {
      const c = l + 1 < u ? n[l + 1] : null, f = c ? c.originalStart : this.originalLines.length, h = c ? c.modifiedStart : this.modifiedLines.length;
      for (; s < f && o < h; ) {
        const m = this.originalLines[s], d = this.modifiedLines[o];
        if (m !== d) {
          {
            let g = lr(m, 1), b = lr(d, 1);
            for (; g > 1 && b > 1; ) {
              const x = m.charCodeAt(g - 2), v = d.charCodeAt(b - 2);
              if (x !== v)
                break;
              g--, b--;
            }
            (g > 1 || b > 1) && this._pushTrimWhitespaceCharChange(i, s + 1, 1, g, o + 1, 1, b);
          }
          {
            let g = ur(m, 1), b = ur(d, 1);
            const x = m.length + 1, v = d.length + 1;
            for (; g < x && b < v; ) {
              const E = m.charCodeAt(g - 1), N = m.charCodeAt(b - 1);
              if (E !== N)
                break;
              g++, b++;
            }
            (g < x || b < v) && this._pushTrimWhitespaceCharChange(i, s + 1, g, x, o + 1, b, v);
          }
        }
        s++, o++;
      }
      c && (i.push(At.createFromDiffResult(this.shouldIgnoreTrimWhitespace, c, this.original, this.modified, this.continueCharDiff, this.shouldComputeCharChanges, this.shouldPostProcessCharChanges)), s += c.originalLength, o += c.modifiedLength);
    }
    return {
      quitEarly: r,
      changes: i
    };
  }
  _pushTrimWhitespaceCharChange(e, n, r, i, s, o, l) {
    if (this._mergeTrimWhitespaceCharChange(e, n, r, i, s, o, l))
      return;
    let u;
    this.shouldComputeCharChanges && (u = [new mt(n, r, n, i, s, o, s, l)]), e.push(new At(n, n, s, s, u));
  }
  _mergeTrimWhitespaceCharChange(e, n, r, i, s, o, l) {
    const u = e.length;
    if (u === 0)
      return !1;
    const c = e[u - 1];
    return c.originalEndLineNumber === 0 || c.modifiedEndLineNumber === 0 ? !1 : c.originalEndLineNumber === n && c.modifiedEndLineNumber === s ? (this.shouldComputeCharChanges && c.charChanges && c.charChanges.push(new mt(n, r, n, i, s, o, s, l)), !0) : c.originalEndLineNumber + 1 === n && c.modifiedEndLineNumber + 1 === s ? (c.originalEndLineNumber = n, c.modifiedEndLineNumber = s, this.shouldComputeCharChanges && c.charChanges && c.charChanges.push(new mt(n, r, n, i, s, o, s, l)), !0) : !1;
  }
}
function lr(t, e) {
  const n = da(t);
  return n === -1 ? e : n + 1;
}
function ur(t, e) {
  const n = ga(t);
  return n === -1 ? e : n + 2;
}
function b1(t) {
  if (t === 0)
    return () => !0;
  const e = Date.now();
  return () => Date.now() - e < t;
}
function Vl(t, e, n = (r, i) => r === i) {
  if (t === e)
    return !0;
  if (!t || !e || t.length !== e.length)
    return !1;
  for (let r = 0, i = t.length; r < i; r++)
    if (!n(t[r], e[r]))
      return !1;
  return !0;
}
function* ql(t, e) {
  let n, r;
  for (const i of t)
    r !== void 0 && e(r, i) ? n.push(i) : (n && (yield n), n = [i]), r = i;
  n && (yield n);
}
function $l(t, e) {
  for (let n = 0; n <= t.length; n++)
    e(n === 0 ? void 0 : t[n - 1], n === t.length ? void 0 : t[n]);
}
function Wl(t, e) {
  for (let n = 0; n < t.length; n++)
    e(n === 0 ? void 0 : t[n - 1], t[n], n + 1 === t.length ? void 0 : t[n + 1]);
}
function Hl(t, e) {
  for (const n of e)
    t.push(n);
}
var cr;
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
})(cr || (cr = {}));
function zt(t, e) {
  return (n, r) => e(t(n), t(r));
}
const jt = (t, e) => t - e;
function Ol(t) {
  return (e, n) => -t(e, n);
}
const ct = class ct {
  constructor(e) {
    this.iterate = e;
  }
  toArray() {
    const e = [];
    return this.iterate((n) => (e.push(n), !0)), e;
  }
  filter(e) {
    return new ct((n) => this.iterate((r) => e(r) ? n(r) : !0));
  }
  map(e) {
    return new ct((n) => this.iterate((r) => n(e(r))));
  }
  findLast(e) {
    let n;
    return this.iterate((r) => (e(r) && (n = r), !0)), n;
  }
  findLastMaxBy(e) {
    let n, r = !0;
    return this.iterate((i) => ((r || cr.isGreaterThan(e(i, n))) && (r = !1, n = i), !0)), n;
  }
};
ct.empty = new ct((e) => {
});
let y1 = ct;
class ke {
  static trivial(e, n) {
    return new ke([new Q(U.ofLength(e.length), U.ofLength(n.length))], !1);
  }
  static trivialTimedOut(e, n) {
    return new ke([new Q(U.ofLength(e.length), U.ofLength(n.length))], !0);
  }
  constructor(e, n) {
    this.diffs = e, this.hitTimeout = n;
  }
}
class Q {
  static invert(e, n) {
    const r = [];
    return $l(e, (i, s) => {
      r.push(Q.fromOffsetPairs(i ? i.getEndExclusives() : Re.zero, s ? s.getStarts() : new Re(n, (i ? i.seq2Range.endExclusive - i.seq1Range.endExclusive : 0) + n)));
    }), r;
  }
  static fromOffsetPairs(e, n) {
    return new Q(new U(e.offset1, n.offset1), new U(e.offset2, n.offset2));
  }
  static assertSorted(e) {
    let n;
    for (const r of e) {
      if (n && !(n.seq1Range.endExclusive <= r.seq1Range.start && n.seq2Range.endExclusive <= r.seq2Range.start))
        throw new ce("Sequence diffs must be sorted");
      n = r;
    }
  }
  constructor(e, n) {
    this.seq1Range = e, this.seq2Range = n;
  }
  swap() {
    return new Q(this.seq2Range, this.seq1Range);
  }
  toString() {
    return `${this.seq1Range} <-> ${this.seq2Range}`;
  }
  join(e) {
    return new Q(this.seq1Range.join(e.seq1Range), this.seq2Range.join(e.seq2Range));
  }
  delta(e) {
    return e === 0 ? this : new Q(this.seq1Range.delta(e), this.seq2Range.delta(e));
  }
  deltaStart(e) {
    return e === 0 ? this : new Q(this.seq1Range.deltaStart(e), this.seq2Range.deltaStart(e));
  }
  deltaEnd(e) {
    return e === 0 ? this : new Q(this.seq1Range.deltaEnd(e), this.seq2Range.deltaEnd(e));
  }
  intersect(e) {
    const n = this.seq1Range.intersect(e.seq1Range), r = this.seq2Range.intersect(e.seq2Range);
    if (!(!n || !r))
      return new Q(n, r);
  }
  getStarts() {
    return new Re(this.seq1Range.start, this.seq2Range.start);
  }
  getEndExclusives() {
    return new Re(this.seq1Range.endExclusive, this.seq2Range.endExclusive);
  }
}
const Oe = class Oe {
  constructor(e, n) {
    this.offset1 = e, this.offset2 = n;
  }
  toString() {
    return `${this.offset1} <-> ${this.offset2}`;
  }
  delta(e) {
    return e === 0 ? this : new Oe(this.offset1 + e, this.offset2 + e);
  }
  equals(e) {
    return this.offset1 === e.offset1 && this.offset2 === e.offset2;
  }
};
Oe.zero = new Oe(0, 0), Oe.max = new Oe(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
let Re = Oe;
const dn = class dn {
  isValid() {
    return !0;
  }
};
dn.instance = new dn();
let Bt = dn;
class zl {
  constructor(e) {
    if (this.timeout = e, this.startTime = Date.now(), this.valid = !0, e <= 0)
      throw new ce("timeout must be positive");
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
class Tn {
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
function hr(t) {
  return t === 32 || t === 9;
}
const Mt = class Mt {
  static getKey(e) {
    let n = this.chrKeys.get(e);
    return n === void 0 && (n = this.chrKeys.size, this.chrKeys.set(e, n)), n;
  }
  constructor(e, n, r) {
    this.range = e, this.lines = n, this.source = r, this.histogram = [];
    let i = 0;
    for (let s = e.startLineNumber - 1; s < e.endLineNumberExclusive - 1; s++) {
      const o = n[s];
      for (let u = 0; u < o.length; u++) {
        i++;
        const c = o[u], f = Mt.getKey(c);
        this.histogram[f] = (this.histogram[f] || 0) + 1;
      }
      i++;
      const l = Mt.getKey(`
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
Mt.chrKeys = /* @__PURE__ */ new Map();
let an = Mt;
class jl {
  compute(e, n, r = Bt.instance, i) {
    if (e.length === 0 || n.length === 0)
      return ke.trivial(e, n);
    const s = new Tn(e.length, n.length), o = new Tn(e.length, n.length), l = new Tn(e.length, n.length);
    for (let g = 0; g < e.length; g++)
      for (let b = 0; b < n.length; b++) {
        if (!r.isValid())
          return ke.trivialTimedOut(e, n);
        const x = g === 0 ? 0 : s.get(g - 1, b), v = b === 0 ? 0 : s.get(g, b - 1);
        let E;
        e.getElement(g) === n.getElement(b) ? (g === 0 || b === 0 ? E = 0 : E = s.get(g - 1, b - 1), g > 0 && b > 0 && o.get(g - 1, b - 1) === 3 && (E += l.get(g - 1, b - 1)), E += i ? i(g, b) : 1) : E = -1;
        const N = Math.max(x, v, E);
        if (N === E) {
          const _ = g > 0 && b > 0 ? l.get(g - 1, b - 1) : 0;
          l.set(g, b, _ + 1), o.set(g, b, 3);
        } else N === x ? (l.set(g, b, 0), o.set(g, b, 1)) : N === v && (l.set(g, b, 0), o.set(g, b, 2));
        s.set(g, b, N);
      }
    const u = [];
    let c = e.length, f = n.length;
    function h(g, b) {
      (g + 1 !== c || b + 1 !== f) && u.push(new Q(new U(g + 1, c), new U(b + 1, f))), c = g, f = b;
    }
    let m = e.length - 1, d = n.length - 1;
    for (; m >= 0 && d >= 0; )
      o.get(m, d) === 3 ? (h(m, d), m--, d--) : o.get(m, d) === 1 ? m-- : d--;
    return h(-1, -1), u.reverse(), new ke(u, !1);
  }
}
class Ls {
  compute(e, n, r = Bt.instance) {
    if (e.length === 0 || n.length === 0)
      return ke.trivial(e, n);
    const i = e, s = n;
    function o(b, x) {
      for (; b < i.length && x < s.length && i.getElement(b) === s.getElement(x); )
        b++, x++;
      return b;
    }
    let l = 0;
    const u = new Gl();
    u.set(0, o(0, 0));
    const c = new Ql();
    c.set(0, u.get(0) === 0 ? null : new _1(null, 0, 0, u.get(0)));
    let f = 0;
    e: for (; ; ) {
      if (l++, !r.isValid())
        return ke.trivialTimedOut(i, s);
      const b = -Math.min(l, s.length + l % 2), x = Math.min(l, i.length + l % 2);
      for (f = b; f <= x; f += 2) {
        const v = f === x ? -1 : u.get(f + 1), E = f === b ? -1 : u.get(f - 1) + 1, N = Math.min(Math.max(v, E), i.length), _ = N - f;
        if (N > i.length || _ > s.length)
          continue;
        const y = o(N, _);
        u.set(f, y);
        const w = N === v ? c.get(f + 1) : c.get(f - 1);
        if (c.set(f, y !== N ? new _1(w, N, _, y - N) : w), u.get(f) === i.length && u.get(f) - f === s.length)
          break e;
      }
    }
    let h = c.get(f);
    const m = [];
    let d = i.length, g = s.length;
    for (; ; ) {
      const b = h ? h.x + h.length : 0, x = h ? h.y + h.length : 0;
      if ((b !== d || x !== g) && m.push(new Q(new U(b, d), new U(x, g))), !h)
        break;
      d = h.x, g = h.y, h = h.prev;
    }
    return m.reverse(), new ke(m, !1);
  }
}
class _1 {
  constructor(e, n, r, i) {
    this.prev = e, this.x = n, this.y = r, this.length = i;
  }
}
class Gl {
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
class Ql {
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
class ln {
  constructor(e, n, r) {
    this.lines = e, this.range = n, this.considerWhitespaceChanges = r, this.elements = [], this.firstElementOffsetByLineIdx = [], this.lineStartOffsets = [], this.trimmedWsLengthsByLineIdx = [], this.firstElementOffsetByLineIdx.push(0);
    for (let i = this.range.startLineNumber; i <= this.range.endLineNumber; i++) {
      let s = e[i - 1], o = 0;
      i === this.range.startLineNumber && this.range.startColumn > 1 && (o = this.range.startColumn - 1, s = s.substring(o)), this.lineStartOffsets.push(o);
      let l = 0;
      if (!r) {
        const c = s.trimStart();
        l = s.length - c.length, s = c.trimEnd();
      }
      this.trimmedWsLengthsByLineIdx.push(l);
      const u = i === this.range.endLineNumber ? Math.min(this.range.endColumn - 1 - o - l, s.length) : s.length;
      for (let c = 0; c < u; c++)
        this.elements.push(s.charCodeAt(c));
      i < this.range.endLineNumber && (this.elements.push(10), this.firstElementOffsetByLineIdx.push(this.elements.length));
    }
  }
  toString() {
    return `Slice: "${this.text}"`;
  }
  get text() {
    return this.getText(new U(0, this.length));
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
    const n = x1(e > 0 ? this.elements[e - 1] : -1), r = x1(e < this.elements.length ? this.elements[e] : -1);
    if (n === 7 && r === 8)
      return 0;
    if (n === 8)
      return 150;
    let i = 0;
    return n !== r && (i += 10, n === 0 && r === 1 && (i += 1)), i += w1(n), i += w1(r), i;
  }
  translateOffset(e, n = "right") {
    const r = Pt(this.firstElementOffsetByLineIdx, (s) => s <= e), i = e - this.firstElementOffsetByLineIdx[r];
    return new O(this.range.startLineNumber + r, 1 + this.lineStartOffsets[r] + i + (i === 0 && n === "left" ? 0 : this.trimmedWsLengthsByLineIdx[r]));
  }
  translateRange(e) {
    const n = this.translateOffset(e.start, "right"), r = this.translateOffset(e.endExclusive, "left");
    return r.isBefore(n) ? I.fromPositions(r, r) : I.fromPositions(n, r);
  }
  /**
   * Finds the word that contains the character at the given offset
   */
  findWordContaining(e) {
    if (e < 0 || e >= this.elements.length || !Pn(this.elements[e]))
      return;
    let n = e;
    for (; n > 0 && Pn(this.elements[n - 1]); )
      n--;
    let r = e;
    for (; r < this.elements.length && Pn(this.elements[r]); )
      r++;
    return new U(n, r);
  }
  countLinesIn(e) {
    return this.translateOffset(e.endExclusive).lineNumber - this.translateOffset(e.start).lineNumber;
  }
  isStronglyEqual(e, n) {
    return this.elements[e] === this.elements[n];
  }
  extendToFullLines(e) {
    const n = pt(this.firstElementOffsetByLineIdx, (i) => i <= e.start) ?? 0, r = Il(this.firstElementOffsetByLineIdx, (i) => e.endExclusive <= i) ?? this.elements.length;
    return new U(n, r);
  }
}
function Pn(t) {
  return t >= 97 && t <= 122 || t >= 65 && t <= 90 || t >= 48 && t <= 57;
}
const Yl = {
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
function w1(t) {
  return Yl[t];
}
function x1(t) {
  return t === 10 ? 8 : t === 13 ? 7 : hr(t) ? 6 : t >= 97 && t <= 122 ? 0 : t >= 65 && t <= 90 ? 1 : t >= 48 && t <= 57 ? 2 : t === -1 ? 3 : t === 44 || t === 59 ? 5 : 4;
}
function Xl(t, e, n, r, i, s) {
  let { moves: o, excludedChanges: l } = Zl(t, e, n, s);
  if (!s.isValid())
    return [];
  const u = t.filter((f) => !l.has(f)), c = Kl(u, r, i, e, n, s);
  return Hl(o, c), o = e0(o), o = o.filter((f) => {
    const h = f.original.toOffsetRange().slice(e).map((d) => d.trim());
    return h.join(`
`).length >= 15 && Jl(h, (d) => d.length >= 2) >= 2;
  }), o = t0(t, o), o;
}
function Jl(t, e) {
  let n = 0;
  for (const r of t)
    e(r) && n++;
  return n;
}
function Zl(t, e, n, r) {
  const i = [], s = t.filter((u) => u.modified.isEmpty && u.original.length >= 3).map((u) => new an(u.original, e, u)), o = new Set(t.filter((u) => u.original.isEmpty && u.modified.length >= 3).map((u) => new an(u.modified, n, u))), l = /* @__PURE__ */ new Set();
  for (const u of s) {
    let c = -1, f;
    for (const h of o) {
      const m = u.computeSimilarity(h);
      m > c && (c = m, f = h);
    }
    if (c > 0.9 && f && (o.delete(f), i.push(new ge(u.range, f.range)), l.add(u.source), l.add(f.source)), !r.isValid())
      return { moves: i, excludedChanges: l };
  }
  return { moves: i, excludedChanges: l };
}
function Kl(t, e, n, r, i, s) {
  const o = [], l = new yl();
  for (const m of t)
    for (let d = m.original.startLineNumber; d < m.original.endLineNumberExclusive - 2; d++) {
      const g = `${e[d - 1]}:${e[d + 1 - 1]}:${e[d + 2 - 1]}`;
      l.add(g, { range: new B(d, d + 3) });
    }
  const u = [];
  t.sort(zt((m) => m.modified.startLineNumber, jt));
  for (const m of t) {
    let d = [];
    for (let g = m.modified.startLineNumber; g < m.modified.endLineNumberExclusive - 2; g++) {
      const b = `${n[g - 1]}:${n[g + 1 - 1]}:${n[g + 2 - 1]}`, x = new B(g, g + 3), v = [];
      l.forEach(b, ({ range: E }) => {
        for (const _ of d)
          if (_.originalLineRange.endLineNumberExclusive + 1 === E.endLineNumberExclusive && _.modifiedLineRange.endLineNumberExclusive + 1 === x.endLineNumberExclusive) {
            _.originalLineRange = new B(_.originalLineRange.startLineNumber, E.endLineNumberExclusive), _.modifiedLineRange = new B(_.modifiedLineRange.startLineNumber, x.endLineNumberExclusive), v.push(_);
            return;
          }
        const N = {
          modifiedLineRange: x,
          originalLineRange: E
        };
        u.push(N), v.push(N);
      }), d = v;
    }
    if (!s.isValid())
      return [];
  }
  u.sort(Ol(zt((m) => m.modifiedLineRange.length, jt)));
  const c = new Le(), f = new Le();
  for (const m of u) {
    const d = m.modifiedLineRange.startLineNumber - m.originalLineRange.startLineNumber, g = c.subtractFrom(m.modifiedLineRange), b = f.subtractFrom(m.originalLineRange).getWithDelta(d), x = g.getIntersection(b);
    for (const v of x.ranges) {
      if (v.length < 3)
        continue;
      const E = v, N = v.delta(-d);
      o.push(new ge(N, E)), c.addRange(E), f.addRange(N);
    }
  }
  o.sort(zt((m) => m.original.startLineNumber, jt));
  const h = new on(t);
  for (let m = 0; m < o.length; m++) {
    const d = o[m], g = h.findLastMonotonous((w) => w.original.startLineNumber <= d.original.startLineNumber), b = pt(t, (w) => w.modified.startLineNumber <= d.modified.startLineNumber), x = Math.max(d.original.startLineNumber - g.original.startLineNumber, d.modified.startLineNumber - b.modified.startLineNumber), v = h.findLastMonotonous((w) => w.original.startLineNumber < d.original.endLineNumberExclusive), E = pt(t, (w) => w.modified.startLineNumber < d.modified.endLineNumberExclusive), N = Math.max(v.original.endLineNumberExclusive - d.original.endLineNumberExclusive, E.modified.endLineNumberExclusive - d.modified.endLineNumberExclusive);
    let _;
    for (_ = 0; _ < x; _++) {
      const w = d.original.startLineNumber - _ - 1, A = d.modified.startLineNumber - _ - 1;
      if (w > r.length || A > i.length || c.contains(A) || f.contains(w) || !L1(r[w - 1], i[A - 1], s))
        break;
    }
    _ > 0 && (f.addRange(new B(d.original.startLineNumber - _, d.original.startLineNumber)), c.addRange(new B(d.modified.startLineNumber - _, d.modified.startLineNumber)));
    let y;
    for (y = 0; y < N; y++) {
      const w = d.original.endLineNumberExclusive + y, A = d.modified.endLineNumberExclusive + y;
      if (w > r.length || A > i.length || c.contains(A) || f.contains(w) || !L1(r[w - 1], i[A - 1], s))
        break;
    }
    y > 0 && (f.addRange(new B(d.original.endLineNumberExclusive, d.original.endLineNumberExclusive + y)), c.addRange(new B(d.modified.endLineNumberExclusive, d.modified.endLineNumberExclusive + y))), (_ > 0 || y > 0) && (o[m] = new ge(new B(d.original.startLineNumber - _, d.original.endLineNumberExclusive + y), new B(d.modified.startLineNumber - _, d.modified.endLineNumberExclusive + y)));
  }
  return o;
}
function L1(t, e, n) {
  if (t.trim() === e.trim())
    return !0;
  if (t.length > 300 && e.length > 300)
    return !1;
  const i = new Ls().compute(new ln([t], new I(1, 1, 1, t.length), !1), new ln([e], new I(1, 1, 1, e.length), !1), n);
  let s = 0;
  const o = Q.invert(i.diffs, t.length);
  for (const f of o)
    f.seq1Range.forEach((h) => {
      hr(t.charCodeAt(h)) || s++;
    });
  function l(f) {
    let h = 0;
    for (let m = 0; m < t.length; m++)
      hr(f.charCodeAt(m)) || h++;
    return h;
  }
  const u = l(t.length > e.length ? t : e);
  return s / u > 0.6 && u > 10;
}
function e0(t) {
  if (t.length === 0)
    return t;
  t.sort(zt((n) => n.original.startLineNumber, jt));
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
function t0(t, e) {
  const n = new on(t);
  return e = e.filter((r) => {
    const i = n.findLastMonotonous((l) => l.original.startLineNumber < r.original.endLineNumberExclusive) || new ge(new B(1, 1), new B(1, 1)), s = pt(t, (l) => l.modified.startLineNumber < r.modified.endLineNumberExclusive);
    return i !== s;
  }), e;
}
function v1(t, e, n) {
  let r = n;
  return r = N1(t, e, r), r = N1(t, e, r), r = n0(t, e, r), r;
}
function N1(t, e, n) {
  if (n.length === 0)
    return n;
  const r = [];
  r.push(n[0]);
  for (let s = 1; s < n.length; s++) {
    const o = r[r.length - 1];
    let l = n[s];
    if (l.seq1Range.isEmpty || l.seq2Range.isEmpty) {
      const u = l.seq1Range.start - o.seq1Range.endExclusive;
      let c;
      for (c = 1; c <= u && !(t.getElement(l.seq1Range.start - c) !== t.getElement(l.seq1Range.endExclusive - c) || e.getElement(l.seq2Range.start - c) !== e.getElement(l.seq2Range.endExclusive - c)); c++)
        ;
      if (c--, c === u) {
        r[r.length - 1] = new Q(new U(o.seq1Range.start, l.seq1Range.endExclusive - u), new U(o.seq2Range.start, l.seq2Range.endExclusive - u));
        continue;
      }
      l = l.delta(-c);
    }
    r.push(l);
  }
  const i = [];
  for (let s = 0; s < r.length - 1; s++) {
    const o = r[s + 1];
    let l = r[s];
    if (l.seq1Range.isEmpty || l.seq2Range.isEmpty) {
      const u = o.seq1Range.start - l.seq1Range.endExclusive;
      let c;
      for (c = 0; c < u && !(!t.isStronglyEqual(l.seq1Range.start + c, l.seq1Range.endExclusive + c) || !e.isStronglyEqual(l.seq2Range.start + c, l.seq2Range.endExclusive + c)); c++)
        ;
      if (c === u) {
        r[s + 1] = new Q(new U(l.seq1Range.start + u, o.seq1Range.endExclusive), new U(l.seq2Range.start + u, o.seq2Range.endExclusive));
        continue;
      }
      c > 0 && (l = l.delta(c));
    }
    i.push(l);
  }
  return r.length > 0 && i.push(r[r.length - 1]), i;
}
function n0(t, e, n) {
  if (!t.getBoundaryScore || !e.getBoundaryScore)
    return n;
  for (let r = 0; r < n.length; r++) {
    const i = r > 0 ? n[r - 1] : void 0, s = n[r], o = r + 1 < n.length ? n[r + 1] : void 0, l = new U(i ? i.seq1Range.endExclusive + 1 : 0, o ? o.seq1Range.start - 1 : t.length), u = new U(i ? i.seq2Range.endExclusive + 1 : 0, o ? o.seq2Range.start - 1 : e.length);
    s.seq1Range.isEmpty ? n[r] = E1(s, t, e, l, u) : s.seq2Range.isEmpty && (n[r] = E1(s.swap(), e, t, u, l).swap());
  }
  return n;
}
function E1(t, e, n, r, i) {
  let o = 1;
  for (; t.seq1Range.start - o >= r.start && t.seq2Range.start - o >= i.start && n.isStronglyEqual(t.seq2Range.start - o, t.seq2Range.endExclusive - o) && o < 100; )
    o++;
  o--;
  let l = 0;
  for (; t.seq1Range.start + l < r.endExclusive && t.seq2Range.endExclusive + l < i.endExclusive && n.isStronglyEqual(t.seq2Range.start + l, t.seq2Range.endExclusive + l) && l < 100; )
    l++;
  if (o === 0 && l === 0)
    return t;
  let u = 0, c = -1;
  for (let f = -o; f <= l; f++) {
    const h = t.seq2Range.start + f, m = t.seq2Range.endExclusive + f, d = t.seq1Range.start + f, g = e.getBoundaryScore(d) + n.getBoundaryScore(h) + n.getBoundaryScore(m);
    g > c && (c = g, u = f);
  }
  return t.delta(u);
}
function r0(t, e, n) {
  const r = [];
  for (const i of n) {
    const s = r[r.length - 1];
    if (!s) {
      r.push(i);
      continue;
    }
    i.seq1Range.start - s.seq1Range.endExclusive <= 2 || i.seq2Range.start - s.seq2Range.endExclusive <= 2 ? r[r.length - 1] = new Q(s.seq1Range.join(i.seq1Range), s.seq2Range.join(i.seq2Range)) : r.push(i);
  }
  return r;
}
function i0(t, e, n) {
  const r = Q.invert(n, t.length), i = [];
  let s = new Re(0, 0);
  function o(u, c) {
    if (u.offset1 < s.offset1 || u.offset2 < s.offset2)
      return;
    const f = t.findWordContaining(u.offset1), h = e.findWordContaining(u.offset2);
    if (!f || !h)
      return;
    let m = new Q(f, h);
    const d = m.intersect(c);
    let g = d.seq1Range.length, b = d.seq2Range.length;
    for (; r.length > 0; ) {
      const x = r[0];
      if (!(x.seq1Range.intersects(m.seq1Range) || x.seq2Range.intersects(m.seq2Range)))
        break;
      const E = t.findWordContaining(x.seq1Range.start), N = e.findWordContaining(x.seq2Range.start), _ = new Q(E, N), y = _.intersect(x);
      if (g += y.seq1Range.length, b += y.seq2Range.length, m = m.join(_), m.seq1Range.endExclusive >= x.seq1Range.endExclusive)
        r.shift();
      else
        break;
    }
    g + b < (m.seq1Range.length + m.seq2Range.length) * 2 / 3 && i.push(m), s = m.getEndExclusives();
  }
  for (; r.length > 0; ) {
    const u = r.shift();
    u.seq1Range.isEmpty || (o(u.getStarts(), u), o(u.getEndExclusives().delta(-1), u));
  }
  return s0(n, i);
}
function s0(t, e) {
  const n = [];
  for (; t.length > 0 || e.length > 0; ) {
    const r = t[0], i = e[0];
    let s;
    r && (!i || r.seq1Range.start < i.seq1Range.start) ? s = t.shift() : s = e.shift(), n.length > 0 && n[n.length - 1].seq1Range.endExclusive >= s.seq1Range.start ? n[n.length - 1] = n[n.length - 1].join(s) : n.push(s);
  }
  return n;
}
function o0(t, e, n) {
  let r = n;
  if (r.length === 0)
    return r;
  let i = 0, s;
  do {
    s = !1;
    const l = [
      r[0]
    ];
    for (let u = 1; u < r.length; u++) {
      let h = function(d, g) {
        const b = new U(f.seq1Range.endExclusive, c.seq1Range.start);
        return t.getText(b).replace(/\s/g, "").length <= 4 && (d.seq1Range.length + d.seq2Range.length > 5 || g.seq1Range.length + g.seq2Range.length > 5);
      };
      var o = h;
      const c = r[u], f = l[l.length - 1];
      h(f, c) ? (s = !0, l[l.length - 1] = l[l.length - 1].join(c)) : l.push(c);
    }
    r = l;
  } while (i++ < 10 && s);
  return r;
}
function a0(t, e, n) {
  let r = n;
  if (r.length === 0)
    return r;
  let i = 0, s;
  do {
    s = !1;
    const u = [
      r[0]
    ];
    for (let c = 1; c < r.length; c++) {
      let m = function(g, b) {
        const x = new U(h.seq1Range.endExclusive, f.seq1Range.start);
        if (t.countLinesIn(x) > 5 || x.length > 500)
          return !1;
        const E = t.getText(x).trim();
        if (E.length > 20 || E.split(/\r\n|\r|\n/).length > 1)
          return !1;
        const N = t.countLinesIn(g.seq1Range), _ = g.seq1Range.length, y = e.countLinesIn(g.seq2Range), w = g.seq2Range.length, A = t.countLinesIn(b.seq1Range), C = b.seq1Range.length, V = e.countLinesIn(b.seq2Range), J = b.seq2Range.length, $ = 130;
        function P(S) {
          return Math.min(S, $);
        }
        return Math.pow(Math.pow(P(N * 40 + _), 1.5) + Math.pow(P(y * 40 + w), 1.5), 1.5) + Math.pow(Math.pow(P(A * 40 + C), 1.5) + Math.pow(P(V * 40 + J), 1.5), 1.5) > ($ ** 1.5) ** 1.5 * 1.3;
      };
      var l = m;
      const f = r[c], h = u[u.length - 1];
      m(h, f) ? (s = !0, u[u.length - 1] = u[u.length - 1].join(f)) : u.push(f);
    }
    r = u;
  } while (i++ < 10 && s);
  const o = [];
  return Wl(r, (u, c, f) => {
    let h = c;
    function m(E) {
      return E.length > 0 && E.trim().length <= 3 && c.seq1Range.length + c.seq2Range.length > 100;
    }
    const d = t.extendToFullLines(c.seq1Range), g = t.getText(new U(d.start, c.seq1Range.start));
    m(g) && (h = h.deltaStart(-g.length));
    const b = t.getText(new U(c.seq1Range.endExclusive, d.endExclusive));
    m(b) && (h = h.deltaEnd(b.length));
    const x = Q.fromOffsetPairs(u ? u.getEndExclusives() : Re.zero, f ? f.getStarts() : Re.max), v = h.intersect(x);
    o.length > 0 && v.getStarts().equals(o[o.length - 1].getEndExclusives()) ? o[o.length - 1] = o[o.length - 1].join(v) : o.push(v);
  }), o;
}
class S1 {
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
    const n = e === 0 ? 0 : A1(this.lines[e - 1]), r = e === this.lines.length ? 0 : A1(this.lines[e]);
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
function A1(t) {
  let e = 0;
  for (; e < t.length && (t.charCodeAt(e) === 32 || t.charCodeAt(e) === 9); )
    e++;
  return e;
}
class l0 {
  constructor() {
    this.dynamicProgrammingDiffing = new jl(), this.myersDiffingAlgorithm = new Ls();
  }
  computeDiff(e, n, r) {
    if (e.length <= 1 && Vl(e, n, (y, w) => y === w))
      return new Ot([], [], !1);
    if (e.length === 1 && e[0].length === 0 || n.length === 1 && n[0].length === 0)
      return new Ot([
        new Me(new B(1, e.length + 1), new B(1, n.length + 1), [
          new be(new I(1, 1, e.length, e[e.length - 1].length + 1), new I(1, 1, n.length, n[n.length - 1].length + 1))
        ])
      ], [], !1);
    const i = r.maxComputationTimeMs === 0 ? Bt.instance : new zl(r.maxComputationTimeMs), s = !r.ignoreTrimWhitespace, o = /* @__PURE__ */ new Map();
    function l(y) {
      let w = o.get(y);
      return w === void 0 && (w = o.size, o.set(y, w)), w;
    }
    const u = e.map((y) => l(y.trim())), c = n.map((y) => l(y.trim())), f = new S1(u, e), h = new S1(c, n), m = f.length + h.length < 1700 ? this.dynamicProgrammingDiffing.compute(f, h, i, (y, w) => e[y] === n[w] ? n[w].length === 0 ? 0.1 : 1 + Math.log(1 + n[w].length) : 0.99) : this.myersDiffingAlgorithm.compute(f, h, i);
    let d = m.diffs, g = m.hitTimeout;
    d = v1(f, h, d), d = o0(f, h, d);
    const b = [], x = (y) => {
      if (s)
        for (let w = 0; w < y; w++) {
          const A = v + w, C = E + w;
          if (e[A] !== n[C]) {
            const V = this.refineDiff(e, n, new Q(new U(A, A + 1), new U(C, C + 1)), i, s);
            for (const J of V.mappings)
              b.push(J);
            V.hitTimeout && (g = !0);
          }
        }
    };
    let v = 0, E = 0;
    for (const y of d) {
      sn(() => y.seq1Range.start - v === y.seq2Range.start - E);
      const w = y.seq1Range.start - v;
      x(w), v = y.seq1Range.endExclusive, E = y.seq2Range.endExclusive;
      const A = this.refineDiff(e, n, y, i, s);
      A.hitTimeout && (g = !0);
      for (const C of A.mappings)
        b.push(C);
    }
    x(e.length - v);
    const N = R1(b, e, n);
    let _ = [];
    return r.computeMoves && (_ = this.computeMoves(N, e, n, u, c, i, s)), sn(() => {
      function y(A, C) {
        if (A.lineNumber < 1 || A.lineNumber > C.length)
          return !1;
        const V = C[A.lineNumber - 1];
        return !(A.column < 1 || A.column > V.length + 1);
      }
      function w(A, C) {
        return !(A.startLineNumber < 1 || A.startLineNumber > C.length + 1 || A.endLineNumberExclusive < 1 || A.endLineNumberExclusive > C.length + 1);
      }
      for (const A of N) {
        if (!A.innerChanges)
          return !1;
        for (const C of A.innerChanges)
          if (!(y(C.modifiedRange.getStartPosition(), n) && y(C.modifiedRange.getEndPosition(), n) && y(C.originalRange.getStartPosition(), e) && y(C.originalRange.getEndPosition(), e)))
            return !1;
        if (!w(A.modified, n) || !w(A.original, e))
          return !1;
      }
      return !0;
    }), new Ot(N, _, g);
  }
  computeMoves(e, n, r, i, s, o, l) {
    return Xl(e, n, r, i, s, o).map((f) => {
      const h = this.refineDiff(n, r, new Q(f.original.toOffsetRange(), f.modified.toOffsetRange()), o, l), m = R1(h.mappings, n, r, !0);
      return new kl(f, m);
    });
  }
  refineDiff(e, n, r, i, s) {
    const l = c0(r).toRangeMapping2(e, n), u = new ln(e, l.originalRange, s), c = new ln(n, l.modifiedRange, s), f = u.length + c.length < 500 ? this.dynamicProgrammingDiffing.compute(u, c, i) : this.myersDiffingAlgorithm.compute(u, c, i);
    let h = f.diffs;
    return h = v1(u, c, h), h = i0(u, c, h), h = r0(u, c, h), h = a0(u, c, h), {
      mappings: h.map((d) => new be(u.translateRange(d.seq1Range), c.translateRange(d.seq2Range))),
      hitTimeout: f.hitTimeout
    };
  }
}
function R1(t, e, n, r = !1) {
  const i = [];
  for (const s of ql(t.map((o) => u0(o, e, n)), (o, l) => o.original.overlapOrTouch(l.original) || o.modified.overlapOrTouch(l.modified))) {
    const o = s[0], l = s[s.length - 1];
    i.push(new Me(o.original.join(l.original), o.modified.join(l.modified), s.map((u) => u.innerChanges[0])));
  }
  return sn(() => !r && i.length > 0 && (i[0].modified.startLineNumber !== i[0].original.startLineNumber || n.length - i[i.length - 1].modified.endLineNumberExclusive !== e.length - i[i.length - 1].original.endLineNumberExclusive) ? !1 : bs(i, (s, o) => o.original.startLineNumber - s.original.endLineNumberExclusive === o.modified.startLineNumber - s.modified.endLineNumberExclusive && // There has to be an unchanged line in between (otherwise both diffs should have been joined)
  s.original.endLineNumberExclusive < o.original.startLineNumber && s.modified.endLineNumberExclusive < o.modified.startLineNumber)), i;
}
function u0(t, e, n) {
  let r = 0, i = 0;
  t.modifiedRange.endColumn === 1 && t.originalRange.endColumn === 1 && t.originalRange.startLineNumber + r <= t.originalRange.endLineNumber && t.modifiedRange.startLineNumber + r <= t.modifiedRange.endLineNumber && (i = -1), t.modifiedRange.startColumn - 1 >= n[t.modifiedRange.startLineNumber - 1].length && t.originalRange.startColumn - 1 >= e[t.originalRange.startLineNumber - 1].length && t.originalRange.startLineNumber <= t.originalRange.endLineNumber + i && t.modifiedRange.startLineNumber <= t.modifiedRange.endLineNumber + i && (r = 1);
  const s = new B(t.originalRange.startLineNumber + r, t.originalRange.endLineNumber + 1 + i), o = new B(t.modifiedRange.startLineNumber + r, t.modifiedRange.endLineNumber + 1 + i);
  return new Me(s, o, [t]);
}
function c0(t) {
  return new ge(new B(t.seq1Range.start + 1, t.seq1Range.endExclusive + 1), new B(t.seq2Range.start + 1, t.seq2Range.endExclusive + 1));
}
const C1 = {
  getLegacy: () => new Bl(),
  getDefault: () => new l0()
};
function qe(t, e) {
  const n = Math.pow(10, e);
  return Math.round(t * n) / n;
}
class X {
  constructor(e, n, r, i = 1) {
    this._rgbaBrand = void 0, this.r = Math.min(255, Math.max(0, e)) | 0, this.g = Math.min(255, Math.max(0, n)) | 0, this.b = Math.min(255, Math.max(0, r)) | 0, this.a = qe(Math.max(Math.min(1, i), 0), 3);
  }
  static equals(e, n) {
    return e.r === n.r && e.g === n.g && e.b === n.b && e.a === n.a;
  }
}
class de {
  constructor(e, n, r, i) {
    this._hslaBrand = void 0, this.h = Math.max(Math.min(360, e), 0) | 0, this.s = qe(Math.max(Math.min(1, n), 0), 3), this.l = qe(Math.max(Math.min(1, r), 0), 3), this.a = qe(Math.max(Math.min(1, i), 0), 3);
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
    let u = 0, c = 0;
    const f = (l + o) / 2, h = o - l;
    if (h > 0) {
      switch (c = Math.min(f <= 0.5 ? h / (2 * f) : h / (2 - 2 * f), 1), o) {
        case n:
          u = (r - i) / h + (r < i ? 6 : 0);
          break;
        case r:
          u = (i - n) / h + 2;
          break;
        case i:
          u = (n - r) / h + 4;
          break;
      }
      u *= 60, u = Math.round(u);
    }
    return new de(u, c, f, s);
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
    let o, l, u;
    if (r === 0)
      o = l = u = i;
    else {
      const c = i < 0.5 ? i * (1 + r) : i + r - i * r, f = 2 * i - c;
      o = de._hue2rgb(f, c, n + 1 / 3), l = de._hue2rgb(f, c, n), u = de._hue2rgb(f, c, n - 1 / 3);
    }
    return new X(Math.round(o * 255), Math.round(l * 255), Math.round(u * 255), s);
  }
}
class st {
  constructor(e, n, r, i) {
    this._hsvaBrand = void 0, this.h = Math.max(Math.min(360, e), 0) | 0, this.s = qe(Math.max(Math.min(1, n), 0), 3), this.v = qe(Math.max(Math.min(1, r), 0), 3), this.a = qe(Math.max(Math.min(1, i), 0), 3);
  }
  static equals(e, n) {
    return e.h === n.h && e.s === n.s && e.v === n.v && e.a === n.a;
  }
  // from http://www.rapidtables.com/convert/color/rgb-to-hsv.htm
  static fromRGBA(e) {
    const n = e.r / 255, r = e.g / 255, i = e.b / 255, s = Math.max(n, r, i), o = Math.min(n, r, i), l = s - o, u = s === 0 ? 0 : l / s;
    let c;
    return l === 0 ? c = 0 : s === n ? c = ((r - i) / l % 6 + 6) % 6 : s === r ? c = (i - n) / l + 2 : c = (n - r) / l + 4, new st(Math.round(c * 60), u, s, e.a);
  }
  // from http://www.rapidtables.com/convert/color/hsv-to-rgb.htm
  static toRGBA(e) {
    const { h: n, s: r, v: i, a: s } = e, o = i * r, l = o * (1 - Math.abs(n / 60 % 2 - 1)), u = i - o;
    let [c, f, h] = [0, 0, 0];
    return n < 60 ? (c = o, f = l) : n < 120 ? (c = l, f = o) : n < 180 ? (f = o, h = l) : n < 240 ? (f = l, h = o) : n < 300 ? (c = l, h = o) : n <= 360 && (c = o, h = l), c = Math.round((c + u) * 255), f = Math.round((f + u) * 255), h = Math.round((h + u) * 255), new X(c, f, h, s);
  }
}
const H = class H {
  static fromHex(e) {
    return H.Format.CSS.parseHex(e) || H.red;
  }
  static equals(e, n) {
    return !e && !n ? !0 : !e || !n ? !1 : e.equals(n);
  }
  get hsla() {
    return this._hsla ? this._hsla : de.fromRGBA(this.rgba);
  }
  get hsva() {
    return this._hsva ? this._hsva : st.fromRGBA(this.rgba);
  }
  constructor(e) {
    if (e)
      if (e instanceof X)
        this.rgba = e;
      else if (e instanceof de)
        this._hsla = e, this.rgba = de.toRGBA(e);
      else if (e instanceof st)
        this._hsva = e, this.rgba = st.toRGBA(e);
      else
        throw new Error("Invalid color ctor argument");
    else throw new Error("Color needs a value");
  }
  equals(e) {
    return !!e && X.equals(this.rgba, e.rgba) && de.equals(this.hsla, e.hsla) && st.equals(this.hsva, e.hsva);
  }
  /**
   * http://www.w3.org/TR/WCAG20/#relativeluminancedef
   * Returns the number in the set [0, 1]. O => Darkest Black. 1 => Lightest white.
   */
  getRelativeLuminance() {
    const e = H._relativeLuminanceForComponent(this.rgba.r), n = H._relativeLuminanceForComponent(this.rgba.g), r = H._relativeLuminanceForComponent(this.rgba.b), i = 0.2126 * e + 0.7152 * n + 0.0722 * r;
    return qe(i, 4);
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
    return new H(new de(this.hsla.h, this.hsla.s, this.hsla.l + this.hsla.l * e, this.hsla.a));
  }
  darken(e) {
    return new H(new de(this.hsla.h, this.hsla.s, this.hsla.l - this.hsla.l * e, this.hsla.a));
  }
  transparent(e) {
    const { r: n, g: r, b: i, a: s } = this.rgba;
    return new H(new X(n, r, i, s * e));
  }
  isTransparent() {
    return this.rgba.a === 0;
  }
  isOpaque() {
    return this.rgba.a === 1;
  }
  opposite() {
    return new H(new X(255 - this.rgba.r, 255 - this.rgba.g, 255 - this.rgba.b, this.rgba.a));
  }
  makeOpaque(e) {
    if (this.isOpaque() || e.rgba.a !== 1)
      return this;
    const { r: n, g: r, b: i, a: s } = this.rgba;
    return new H(new X(e.rgba.r - s * (e.rgba.r - n), e.rgba.g - s * (e.rgba.g - r), e.rgba.b - s * (e.rgba.b - i), 1));
  }
  toString() {
    return this._toString || (this._toString = H.Format.CSS.format(this)), this._toString;
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
};
H.white = new H(new X(255, 255, 255, 1)), H.black = new H(new X(0, 0, 0, 1)), H.red = new H(new X(255, 0, 0, 1)), H.blue = new H(new X(0, 0, 255, 1)), H.green = new H(new X(0, 255, 0, 1)), H.cyan = new H(new X(0, 255, 255, 1)), H.lightgrey = new H(new X(211, 211, 211, 1)), H.transparent = new H(new X(0, 0, 0, 0));
let bt = H;
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
      function u(d) {
        return `#${l(d.rgba.r)}${l(d.rgba.g)}${l(d.rgba.b)}`;
      }
      n.formatHex = u;
      function c(d, g = !1) {
        return g && d.rgba.a === 1 ? t.Format.CSS.formatHex(d) : `#${l(d.rgba.r)}${l(d.rgba.g)}${l(d.rgba.b)}${l(Math.round(d.rgba.a * 255))}`;
      }
      n.formatHexA = c;
      function f(d) {
        return d.isOpaque() ? t.Format.CSS.formatHex(d) : t.Format.CSS.formatRGBA(d);
      }
      n.format = f;
      function h(d) {
        const g = d.length;
        if (g === 0 || d.charCodeAt(0) !== 35)
          return null;
        if (g === 7) {
          const b = 16 * m(d.charCodeAt(1)) + m(d.charCodeAt(2)), x = 16 * m(d.charCodeAt(3)) + m(d.charCodeAt(4)), v = 16 * m(d.charCodeAt(5)) + m(d.charCodeAt(6));
          return new t(new X(b, x, v, 1));
        }
        if (g === 9) {
          const b = 16 * m(d.charCodeAt(1)) + m(d.charCodeAt(2)), x = 16 * m(d.charCodeAt(3)) + m(d.charCodeAt(4)), v = 16 * m(d.charCodeAt(5)) + m(d.charCodeAt(6)), E = 16 * m(d.charCodeAt(7)) + m(d.charCodeAt(8));
          return new t(new X(b, x, v, E / 255));
        }
        if (g === 4) {
          const b = m(d.charCodeAt(1)), x = m(d.charCodeAt(2)), v = m(d.charCodeAt(3));
          return new t(new X(16 * b + b, 16 * x + x, 16 * v + v));
        }
        if (g === 5) {
          const b = m(d.charCodeAt(1)), x = m(d.charCodeAt(2)), v = m(d.charCodeAt(3)), E = m(d.charCodeAt(4));
          return new t(new X(16 * b + b, 16 * x + x, 16 * v + v, (16 * E + E) / 255));
        }
        return null;
      }
      n.parseHex = h;
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
})(bt || (bt = {}));
function vs(t) {
  const e = [];
  for (const n of t) {
    const r = Number(n);
    (r || r === 0 && n.replace(/\s/g, "") !== "") && e.push(r);
  }
  return e;
}
function Ar(t, e, n, r) {
  return {
    red: t / 255,
    blue: n / 255,
    green: e / 255,
    alpha: r
  };
}
function Lt(t, e) {
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
function h0(t, e) {
  if (!t)
    return;
  const n = bt.Format.CSS.parseHex(e);
  if (n)
    return {
      range: t,
      color: Ar(n.rgba.r, n.rgba.g, n.rgba.b, n.rgba.a)
    };
}
function M1(t, e, n) {
  if (!t || e.length !== 1)
    return;
  const i = e[0].values(), s = vs(i);
  return {
    range: t,
    color: Ar(s[0], s[1], s[2], n ? s[3] : 1)
  };
}
function k1(t, e, n) {
  if (!t || e.length !== 1)
    return;
  const i = e[0].values(), s = vs(i), o = new bt(new de(s[0], s[1] / 100, s[2] / 100, n ? s[3] : 1));
  return {
    range: t,
    color: Ar(o.rgba.r, o.rgba.g, o.rgba.b, o.rgba.a)
  };
}
function vt(t, e) {
  return typeof t == "string" ? [...t.matchAll(e)] : t.findMatches(e);
}
function f0(t) {
  const e = [], r = vt(t, /\b(rgb|rgba|hsl|hsla)(\([0-9\s,.\%]*\))|(#)([A-Fa-f0-9]{3})\b|(#)([A-Fa-f0-9]{4})\b|(#)([A-Fa-f0-9]{6})\b|(#)([A-Fa-f0-9]{8})\b/gm);
  if (r.length > 0)
    for (const i of r) {
      const s = i.filter((c) => c !== void 0), o = s[1], l = s[2];
      if (!l)
        continue;
      let u;
      if (o === "rgb") {
        const c = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*\)$/gm;
        u = M1(Lt(t, i), vt(l, c), !1);
      } else if (o === "rgba") {
        const c = /^\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
        u = M1(Lt(t, i), vt(l, c), !0);
      } else if (o === "hsl") {
        const c = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*\)$/gm;
        u = k1(Lt(t, i), vt(l, c), !1);
      } else if (o === "hsla") {
        const c = /^\(\s*(36[0]|3[0-5][0-9]|[12][0-9][0-9]|[1-9]?[0-9])\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(100|\d{1,2}[.]\d*|\d{1,2})%\s*,\s*(0[.][0-9]+|[.][0-9]+|[01][.]|[01])\s*\)$/gm;
        u = k1(Lt(t, i), vt(l, c), !0);
      } else o === "#" && (u = h0(Lt(t, i), o + l));
      u && e.push(u);
    }
  return e;
}
function m0(t) {
  return !t || typeof t.getValue != "function" || typeof t.positionAt != "function" ? [] : f0(t);
}
const I1 = new RegExp("\\bMARK:\\s*(.*)$", "d"), d0 = /^-+|-+$/g;
function g0(t, e) {
  let n = [];
  if (e.findRegionSectionHeaders && e.foldingRules?.markers) {
    const r = p0(t, e);
    n = n.concat(r);
  }
  if (e.findMarkSectionHeaders) {
    const r = b0(t);
    n = n.concat(r);
  }
  return n;
}
function p0(t, e) {
  const n = [], r = t.getLineCount();
  for (let i = 1; i <= r; i++) {
    const s = t.getLineContent(i), o = s.match(e.foldingRules.markers.start);
    if (o) {
      const l = { startLineNumber: i, startColumn: o[0].length + 1, endLineNumber: i, endColumn: s.length + 1 };
      if (l.endColumn > l.startColumn) {
        const u = {
          range: l,
          ...Ns(s.substring(o[0].length)),
          shouldBeInComments: !1
        };
        (u.text || u.hasSeparatorLine) && n.push(u);
      }
    }
  }
  return n;
}
function b0(t) {
  const e = [], n = t.getLineCount();
  for (let r = 1; r <= n; r++) {
    const i = t.getLineContent(r);
    y0(i, r, e);
  }
  return e;
}
function y0(t, e, n) {
  I1.lastIndex = 0;
  const r = I1.exec(t);
  if (r) {
    const i = r.indices[1][0] + 1, s = r.indices[1][1] + 1, o = { startLineNumber: e, startColumn: i, endLineNumber: e, endColumn: s };
    if (o.endColumn > o.startColumn) {
      const l = {
        range: o,
        ...Ns(r[1]),
        shouldBeInComments: !0
      };
      (l.text || l.hasSeparatorLine) && n.push(l);
    }
  }
}
function Ns(t) {
  t = t.trim();
  const e = t.startsWith("-");
  return t = t.replace(d0, ""), { text: t, hasSeparatorLine: e };
}
var T1;
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
})(T1 || (T1 = {}));
const ie = class ie {
  static fromArray(e) {
    return new ie((n) => {
      n.emitMany(e);
    });
  }
  static fromPromise(e) {
    return new ie(async (n) => {
      n.emitMany(await e);
    });
  }
  static fromPromises(e) {
    return new ie(async (n) => {
      await Promise.all(e.map(async (r) => n.emitOne(await r)));
    });
  }
  static merge(e) {
    return new ie(async (n) => {
      await Promise.all(e.map(async (r) => {
        for await (const i of r)
          n.emitOne(i);
      }));
    });
  }
  constructor(e, n) {
    this._state = 0, this._results = [], this._error = null, this._onReturn = n, this._onStateChanged = new me(), queueMicrotask(async () => {
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
          await Xt.toPromise(this._onStateChanged.event);
        } while (!0);
      },
      return: async () => (this._onReturn?.(), { done: !0, value: void 0 })
    };
  }
  static map(e, n) {
    return new ie(async (r) => {
      for await (const i of e)
        r.emitOne(n(i));
    });
  }
  map(e) {
    return ie.map(this, e);
  }
  static filter(e, n) {
    return new ie(async (r) => {
      for await (const i of e)
        n(i) && r.emitOne(i);
    });
  }
  filter(e) {
    return ie.filter(this, e);
  }
  static coalesce(e) {
    return ie.filter(e, (n) => !!n);
  }
  coalesce() {
    return ie.coalesce(this);
  }
  static async toPromise(e) {
    const n = [];
    for await (const r of e)
      n.push(r);
    return n;
  }
  toPromise() {
    return ie.toPromise(this);
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
ie.EMPTY = ie.fromArray([]);
let P1 = ie;
class _0 {
  constructor(e) {
    this.values = e, this.prefixSum = new Uint32Array(e.length), this.prefixSumValidIndex = new Int32Array(1), this.prefixSumValidIndex[0] = -1;
  }
  insertValues(e, n) {
    e = et(e);
    const r = this.values, i = this.prefixSum, s = n.length;
    return s === 0 ? !1 : (this.values = new Uint32Array(r.length + s), this.values.set(r.subarray(0, e), 0), this.values.set(r.subarray(e), e + s), this.values.set(n, e), e - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = e - 1), this.prefixSum = new Uint32Array(this.values.length), this.prefixSumValidIndex[0] >= 0 && this.prefixSum.set(i.subarray(0, this.prefixSumValidIndex[0] + 1)), !0);
  }
  setValue(e, n) {
    return e = et(e), n = et(n), this.values[e] === n ? !1 : (this.values[e] = n, e - 1 < this.prefixSumValidIndex[0] && (this.prefixSumValidIndex[0] = e - 1), !0);
  }
  removeValues(e, n) {
    e = et(e), n = et(n);
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
    return e < 0 ? 0 : (e = et(e), this._getPrefixSum(e));
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
    return new w0(i, e - o);
  }
}
class w0 {
  constructor(e, n) {
    this.index = e, this.remainder = n, this._prefixSumIndexOfResultBrand = void 0, this.index = e, this.remainder = n;
  }
}
class x0 {
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
      this._acceptDeleteRange(r.range), this._acceptInsertText(new O(r.range.startLineNumber, r.range.startColumn), r.text);
    this._versionId = e.versionId, this._cachedTextValue = null;
  }
  _ensureLineStarts() {
    if (!this._lineStarts) {
      const e = this._eol.length, n = this._lines.length, r = new Uint32Array(n);
      for (let i = 0; i < n; i++)
        r[i] = this._lines[i].length + e;
      this._lineStarts = new _0(r);
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
    const r = ma(n);
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
class L0 {
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
    this._models[e.url] = new v0(oe.parse(e.url), e.lines, e.EOL, e.versionId);
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
class v0 extends x0 {
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
      const i = this._lines[r], s = this.offsetAt(new O(r + 1, 1)), o = i.matchAll(e);
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
    const r = Sr(e.column, _s(n), this._lines[e.lineNumber - 1], 0);
    return r ? new I(e.lineNumber, r.startColumn, e.lineNumber, r.endColumn) : null;
  }
  words(e) {
    const n = this._lines, r = this._wordenize.bind(this);
    let i = 0, s = "", o = 0, l = [];
    return {
      *[Symbol.iterator]() {
        for (; ; )
          if (o < l.length) {
            const u = s.substring(l[o].start, l[o].end);
            o += 1, yield u;
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
    if (!O.isIPosition(e))
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
const gn = class gn {
  constructor() {
    this._workerTextModelSyncServer = new L0();
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
    return i ? Cl.computeUnicodeHighlights(i, n, r) : { ranges: [], hasMore: !1, ambiguousCharacterCount: 0, invisibleCharacterCount: 0, nonBasicAsciiCharacterCount: 0 };
  }
  async $findSectionHeaders(e, n) {
    const r = this._getModel(e);
    return r ? g0(r, n) : [];
  }
  // ---- BEGIN diff --------------------------------------------------------------------------
  async $computeDiff(e, n, r, i) {
    const s = this._getModel(e), o = this._getModel(n);
    return !s || !o ? null : Gt.computeDiff(s, o, r, i);
  }
  static computeDiff(e, n, r, i) {
    const s = i === "advanced" ? C1.getDefault() : C1.getLegacy(), o = e.getLinesContent(), l = n.getLinesContent(), u = s.computeDiff(o, l, r), c = u.changes.length > 0 ? !1 : this._modelsAreIdentical(e, n);
    function f(h) {
      return h.map((m) => [m.original.startLineNumber, m.original.endLineNumberExclusive, m.modified.startLineNumber, m.modified.endLineNumberExclusive, m.innerChanges?.map((d) => [
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
      identical: c,
      quitEarly: u.hitTimeout,
      changes: f(u.changes),
      moves: u.moves.map((h) => [
        h.lineRangeMapping.original.startLineNumber,
        h.lineRangeMapping.original.endLineNumberExclusive,
        h.lineRangeMapping.modified.startLineNumber,
        h.lineRangeMapping.modified.endLineNumberExclusive,
        f(h.changes)
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
    n = n.slice(0).sort((u, c) => {
      if (u.range && c.range)
        return I.compareRangesUsingStarts(u.range, c.range);
      const f = u.range ? 0 : 1, h = c.range ? 0 : 1;
      return f - h;
    });
    let l = 0;
    for (let u = 1; u < n.length; u++)
      I.getEndPosition(n[l].range).equals(I.getStartPosition(n[u].range)) ? (n[l].range = I.fromPositions(I.getStartPosition(n[l].range), I.getEndPosition(n[u].range)), n[l].text += n[u].text) : (l++, n[l] = n[u]);
    n.length = l + 1;
    for (let { range: u, text: c, eol: f } of n) {
      if (typeof f == "number" && (o = f), I.isEmpty(u) && !c)
        continue;
      const h = i.getValueInRange(u);
      if (c = c.replace(/\r\n|\n|\r/g, i.eol), h === c)
        continue;
      if (Math.max(c.length, h.length) > Gt._diffLimit) {
        s.push({ range: u, text: c });
        continue;
      }
      const m = Za(h, c, r), d = i.offsetAt(I.lift(u).getStartPosition());
      for (const g of m) {
        const b = i.positionAt(d + g.originalStart), x = i.positionAt(d + g.originalStart + g.originalLength), v = {
          text: c.substr(g.modifiedStart, g.modifiedLength),
          range: { startLineNumber: b.lineNumber, startColumn: b.column, endLineNumber: x.lineNumber, endColumn: x.column }
        };
        i.getValueInRange(v.range) !== v.text && s.push(v);
      }
    }
    return typeof o == "number" && s.push({ eol: o, text: "", range: { startLineNumber: 0, startColumn: 0, endLineNumber: 0, endColumn: 0 } }), s;
  }
  // ---- END minimal edits ---------------------------------------------------------------
  async $computeLinks(e) {
    const n = this._getModel(e);
    return n ? rl(n) : null;
  }
  // --- BEGIN default document colors -----------------------------------------------------------
  async $computeDefaultDocumentColors(e) {
    const n = this._getModel(e);
    return n ? m0(n) : null;
  }
  async $textualSuggest(e, n, r, i) {
    const s = new pn(), o = new RegExp(r, i), l = /* @__PURE__ */ new Set();
    e: for (const u of e) {
      const c = this._getModel(u);
      if (c) {
        for (const f of c.words(o))
          if (!(f === n || !isNaN(Number(f))) && (l.add(f), l.size > Gt._suggestionsLimit))
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
    for (let u = n.startLineNumber; u < n.endLineNumber; u++) {
      const c = s.getLineWords(u, o);
      for (const f of c) {
        if (!isNaN(Number(f.word)))
          continue;
        let h = l[f.word];
        h || (h = [], l[f.word] = h), h.push({
          startLineNumber: u,
          startColumn: f.startColumn,
          endLineNumber: u,
          endColumn: f.endColumn
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
    const u = o.getValueInRange(n), c = o.getWordAtPosition({ lineNumber: n.startLineNumber, column: n.startColumn }, l);
    if (!c)
      return null;
    const f = o.getValueInRange(c);
    return Zn.INSTANCE.navigateValueSet(n, u, c, f, r);
  }
};
gn._diffLimit = 1e5, gn._suggestionsLimit = 1e4;
let fr = gn;
class Gt extends fr {
  constructor(e, n) {
    super(), this._host = e, this._foreignModuleFactory = n, this._foreignModule = null;
  }
  async $ping() {
    return "pong";
  }
  // ---- BEGIN foreign module support --------------------------------------------------------------------------
  $loadForeignModule(e, n, r) {
    const o = {
      host: wl(r, (l, u) => this._host.$fhr(l, u)),
      getMirrorModels: () => this._getModels()
    };
    return this._foreignModuleFactory ? (this._foreignModule = this._foreignModuleFactory(o, n), Promise.resolve(l1(this._foreignModule))) : new Promise((l, u) => {
      const c = (f) => {
        this._foreignModule = f.create(o, n), l(l1(this._foreignModule));
      };
      import(`${fs.asBrowserUri(`${e}.js`).toString(!0)}`).then(c).catch(u);
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
typeof importScripts == "function" && (globalThis.monaco = dl());
let mr = !1;
function N0(t) {
  if (mr)
    return;
  mr = !0;
  const e = new Ya((n) => {
    globalThis.postMessage(n);
  }, (n) => new Gt(or.getChannel(n), t));
  globalThis.onmessage = (n) => {
    e.onmessage(n.data);
  };
}
globalThis.onmessage = (t) => {
  mr || N0(null);
};
