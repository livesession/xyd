"use strict";
var OpenFeature = (() => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __defProps = Object.defineProperties;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getOwnPropSymbols = Object.getOwnPropertySymbols;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __propIsEnum = Object.prototype.propertyIsEnumerable;
    var __reflectGet = Reflect.get;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __spreadValues = (a, b) => {
        for (var prop in b || (b = {}))
            if (__hasOwnProp.call(b, prop))
                __defNormalProp(a, prop, b[prop]);
        if (__getOwnPropSymbols)
            for (var prop of __getOwnPropSymbols(b)) {
                if (__propIsEnum.call(b, prop))
                    __defNormalProp(a, prop, b[prop]);
            }
        return a;
    };
    var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
    var __commonJS = (cb, mod) => function __require() {
        return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
    var __export = (target, all) => {
        for (var name in all)
            __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
            for (let key of __getOwnPropNames(from))
                if (!__hasOwnProp.call(to, key) && key !== except)
                    __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
        }
        return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
        mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var __superGet = (cls, obj, key) => __reflectGet(__getProtoOf(cls), key, obj);
    var __async = (__this, __arguments, generator) => {
        return new Promise((resolve, reject) => {
            var fulfilled = (value) => {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            };
            var rejected = (value) => {
                try {
                    step(generator.throw(value));
                } catch (e) {
                    reject(e);
                }
            };
            var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
            step((generator = generator.apply(__this, __arguments)).next());
        });
    };

    // ../../node_modules/eventemitter3/index.js
    var require_eventemitter3 = __commonJS({
        "../../node_modules/eventemitter3/index.js"(exports, module) {
            "use strict";
            var has = Object.prototype.hasOwnProperty;
            var prefix = "~";
            function Events() {
            }
            if (Object.create) {
                Events.prototype = /* @__PURE__ */ Object.create(null);
                if (!new Events().__proto__) prefix = false;
            }
            function EE(fn, context, once) {
                this.fn = fn;
                this.context = context;
                this.once = once || false;
            }
            function addListener(emitter, event, fn, context, once) {
                if (typeof fn !== "function") {
                    throw new TypeError("The listener must be a function");
                }
                var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
                if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
                else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
                else emitter._events[evt] = [emitter._events[evt], listener];
                return emitter;
            }
            function clearEvent(emitter, evt) {
                if (--emitter._eventsCount === 0) emitter._events = new Events();
                else delete emitter._events[evt];
            }
            function EventEmitter2() {
                this._events = new Events();
                this._eventsCount = 0;
            }
            EventEmitter2.prototype.eventNames = function eventNames() {
                var names = [], events, name;
                if (this._eventsCount === 0) return names;
                for (name in events = this._events) {
                    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
                }
                if (Object.getOwnPropertySymbols) {
                    return names.concat(Object.getOwnPropertySymbols(events));
                }
                return names;
            };
            EventEmitter2.prototype.listeners = function listeners(event) {
                var evt = prefix ? prefix + event : event, handlers = this._events[evt];
                if (!handlers) return [];
                if (handlers.fn) return [handlers.fn];
                for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
                    ee[i] = handlers[i].fn;
                }
                return ee;
            };
            EventEmitter2.prototype.listenerCount = function listenerCount(event) {
                var evt = prefix ? prefix + event : event, listeners = this._events[evt];
                if (!listeners) return 0;
                if (listeners.fn) return 1;
                return listeners.length;
            };
            EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
                var evt = prefix ? prefix + event : event;
                if (!this._events[evt]) return false;
                var listeners = this._events[evt], len = arguments.length, args, i;
                if (listeners.fn) {
                    if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
                    switch (len) {
                        case 1:
                            return listeners.fn.call(listeners.context), true;
                        case 2:
                            return listeners.fn.call(listeners.context, a1), true;
                        case 3:
                            return listeners.fn.call(listeners.context, a1, a2), true;
                        case 4:
                            return listeners.fn.call(listeners.context, a1, a2, a3), true;
                        case 5:
                            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
                        case 6:
                            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
                    }
                    for (i = 1, args = new Array(len - 1); i < len; i++) {
                        args[i - 1] = arguments[i];
                    }
                    listeners.fn.apply(listeners.context, args);
                } else {
                    var length = listeners.length, j;
                    for (i = 0; i < length; i++) {
                        if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
                        switch (len) {
                            case 1:
                                listeners[i].fn.call(listeners[i].context);
                                break;
                            case 2:
                                listeners[i].fn.call(listeners[i].context, a1);
                                break;
                            case 3:
                                listeners[i].fn.call(listeners[i].context, a1, a2);
                                break;
                            case 4:
                                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                                break;
                            default:
                                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                                    args[j - 1] = arguments[j];
                                }
                                listeners[i].fn.apply(listeners[i].context, args);
                        }
                    }
                }
                return true;
            };
            EventEmitter2.prototype.on = function on(event, fn, context) {
                return addListener(this, event, fn, context, false);
            };
            EventEmitter2.prototype.once = function once(event, fn, context) {
                return addListener(this, event, fn, context, true);
            };
            EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
                var evt = prefix ? prefix + event : event;
                if (!this._events[evt]) return this;
                if (!fn) {
                    clearEvent(this, evt);
                    return this;
                }
                var listeners = this._events[evt];
                if (listeners.fn) {
                    if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
                        clearEvent(this, evt);
                    }
                } else {
                    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
                        if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
                            events.push(listeners[i]);
                        }
                    }
                    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
                    else clearEvent(this, evt);
                }
                return this;
            };
            EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
                var evt;
                if (event) {
                    evt = prefix ? prefix + event : event;
                    if (this._events[evt]) clearEvent(this, evt);
                } else {
                    this._events = new Events();
                    this._eventsCount = 0;
                }
                return this;
            };
            EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
            EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
            EventEmitter2.prefixed = prefix;
            EventEmitter2.EventEmitter = EventEmitter2;
            if ("undefined" !== typeof module) {
                module.exports = EventEmitter2;
            }
        }
    });

    // src/index.ts
    var index_exports = {};
    __export(index_exports, {
        AllProviderEvents: () => ClientProviderEvents,
        AllProviderStatus: () => ClientProviderStatus,
        ClientProviderEvents: () => ClientProviderEvents,
        ClientProviderStatus: () => ClientProviderStatus,
        DefaultLogger: () => DefaultLogger,
        ErrorCode: () => ErrorCode,
        FlagNotFoundError: () => FlagNotFoundError,
        GeneralError: () => GeneralError,
        GenericEventEmitter: () => GenericEventEmitter,
        InMemoryProvider: () => InMemoryProvider,
        InvalidContextError: () => InvalidContextError,
        LOG_LEVELS: () => LOG_LEVELS,
        MapHookData: () => MapHookData,
        NOOP_PROVIDER: () => NOOP_PROVIDER,
        OpenFeature: () => OpenFeature,
        OpenFeatureAPI: () => OpenFeatureAPI,
        OpenFeatureCommonAPI: () => OpenFeatureCommonAPI,
        OpenFeatureError: () => OpenFeatureError,
        OpenFeatureEventEmitter: () => OpenFeatureEventEmitter,
        ParseError: () => ParseError,
        ProviderEvents: () => ClientProviderEvents,
        ProviderFatalError: () => ProviderFatalError,
        ProviderNotReadyError: () => ProviderNotReadyError,
        ProviderStatus: () => ClientProviderStatus,
        ProviderWrapper: () => ProviderWrapper,
        SafeLogger: () => SafeLogger,
        ServerProviderEvents: () => ServerProviderEvents,
        ServerProviderStatus: () => ServerProviderStatus,
        StandardResolutionReasons: () => StandardResolutionReasons,
        TargetingKeyMissingError: () => TargetingKeyMissingError,
        TelemetryAttribute: () => TelemetryAttribute,
        TelemetryFlagMetadata: () => TelemetryFlagMetadata,
        TypeMismatchError: () => TypeMismatchError,
        createEvaluationEvent: () => createEvaluationEvent,
        instantiateErrorByErrorCode: () => instantiateErrorByErrorCode,
        isObject: () => isObject,
        isString: () => isString,
        objectOrUndefined: () => objectOrUndefined,
        statusMatchesEvent: () => statusMatchesEvent,
        stringOrUndefined: () => stringOrUndefined
    });

    // ../shared/src/hooks/hook-data.ts
    var MapHookData = class {
        constructor() {
            this.data = /* @__PURE__ */ new Map();
        }
        set(key, value) {
            this.data.set(key, value);
        }
        get(key) {
            return this.data.get(key);
        }
        has(key) {
            return this.data.has(key);
        }
        delete(key) {
            return this.data.delete(key);
        }
        clear() {
            this.data.clear();
        }
    };

    // ../shared/src/evaluation/evaluation.ts
    var StandardResolutionReasons = {
        /**
         * The resolved value is static (no dynamic evaluation).
         */
        STATIC: "STATIC",
        /**
         *  The resolved value was configured statically, or otherwise fell back to a pre-configured value.
         */
        DEFAULT: "DEFAULT",
        /**
         * The resolved value was the result of a dynamic evaluation, such as a rule or specific user-targeting.
         */
        TARGETING_MATCH: "TARGETING_MATCH",
        /**
         * The resolved value was the result of pseudorandom assignment.
         */
        SPLIT: "SPLIT",
        /**
         * The resolved value was retrieved from cache.
         */
        CACHED: "CACHED",
        /**
         * The resolved value was the result of the flag being disabled in the management system.
         */
        DISABLED: "DISABLED",
        /**
         * The reason for the resolved value could not be determined.
         */
        UNKNOWN: "UNKNOWN",
        /**
         * The resolved value is non-authoritative or possibly out of date.
         */
        STALE: "STALE",
        /**
         * The resolved value was the result of an error.
         *
         * Note: The `errorCode` and `errorMessage` fields may contain additional details of this error.
         */
        ERROR: "ERROR"
    };
    var ErrorCode = /* @__PURE__ */ ((ErrorCode2) => {
        ErrorCode2["PROVIDER_NOT_READY"] = "PROVIDER_NOT_READY";
        ErrorCode2["PROVIDER_FATAL"] = "PROVIDER_FATAL";
        ErrorCode2["FLAG_NOT_FOUND"] = "FLAG_NOT_FOUND";
        ErrorCode2["PARSE_ERROR"] = "PARSE_ERROR";
        ErrorCode2["TYPE_MISMATCH"] = "TYPE_MISMATCH";
        ErrorCode2["TARGETING_KEY_MISSING"] = "TARGETING_KEY_MISSING";
        ErrorCode2["INVALID_CONTEXT"] = "INVALID_CONTEXT";
        ErrorCode2["GENERAL"] = "GENERAL";
        return ErrorCode2;
    })(ErrorCode || {});

    // ../shared/src/errors/open-feature-error-abstract.ts
    var OpenFeatureError = class _OpenFeatureError extends Error {
        constructor(message, options) {
            super(message);
            Object.setPrototypeOf(this, _OpenFeatureError.prototype);
            this.name = "OpenFeatureError";
            this.cause = options == null ? void 0 : options.cause;
        }
    };

    // ../shared/src/errors/flag-not-found-error.ts
    var FlagNotFoundError = class _FlagNotFoundError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _FlagNotFoundError.prototype);
            this.name = "FlagNotFoundError";
            this.code = "FLAG_NOT_FOUND" /* FLAG_NOT_FOUND */;
        }
    };

    // ../shared/src/errors/general-error.ts
    var GeneralError = class _GeneralError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _GeneralError.prototype);
            this.name = "GeneralError";
            this.code = "GENERAL" /* GENERAL */;
        }
    };

    // ../shared/src/errors/invalid-context-error.ts
    var InvalidContextError = class _InvalidContextError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _InvalidContextError.prototype);
            this.name = "InvalidContextError";
            this.code = "INVALID_CONTEXT" /* INVALID_CONTEXT */;
        }
    };

    // ../shared/src/errors/parse-error.ts
    var ParseError = class _ParseError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _ParseError.prototype);
            this.name = "ParseError";
            this.code = "PARSE_ERROR" /* PARSE_ERROR */;
        }
    };

    // ../shared/src/errors/provider-fatal-error.ts
    var ProviderFatalError = class _ProviderFatalError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _ProviderFatalError.prototype);
            this.name = "ProviderFatalError";
            this.code = "PROVIDER_FATAL" /* PROVIDER_FATAL */;
        }
    };

    // ../shared/src/errors/provider-not-ready-error.ts
    var ProviderNotReadyError = class _ProviderNotReadyError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _ProviderNotReadyError.prototype);
            this.name = "ProviderNotReadyError";
            this.code = "PROVIDER_NOT_READY" /* PROVIDER_NOT_READY */;
        }
    };

    // ../shared/src/errors/targeting-key-missing-error.ts
    var TargetingKeyMissingError = class _TargetingKeyMissingError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _TargetingKeyMissingError.prototype);
            this.name = "TargetingKeyMissingError";
            this.code = "TARGETING_KEY_MISSING" /* TARGETING_KEY_MISSING */;
        }
    };

    // ../shared/src/errors/type-mismatch-error.ts
    var TypeMismatchError = class _TypeMismatchError extends OpenFeatureError {
        constructor(message, options) {
            super(message, options);
            Object.setPrototypeOf(this, _TypeMismatchError.prototype);
            this.name = "TypeMismatchError";
            this.code = "TYPE_MISMATCH" /* TYPE_MISMATCH */;
        }
    };

    // ../shared/src/errors/index.ts
    var instantiateErrorByErrorCode = (errorCode, message) => {
        switch (errorCode) {
            case "FLAG_NOT_FOUND" /* FLAG_NOT_FOUND */:
                return new FlagNotFoundError(message);
            case "PARSE_ERROR" /* PARSE_ERROR */:
                return new ParseError(message);
            case "TYPE_MISMATCH" /* TYPE_MISMATCH */:
                return new TypeMismatchError(message);
            case "TARGETING_KEY_MISSING" /* TARGETING_KEY_MISSING */:
                return new TargetingKeyMissingError(message);
            case "INVALID_CONTEXT" /* INVALID_CONTEXT */:
                return new InvalidContextError(message);
            case "PROVIDER_NOT_READY" /* PROVIDER_NOT_READY */:
                return new ProviderNotReadyError(message);
            case "PROVIDER_FATAL" /* PROVIDER_FATAL */:
                return new ProviderFatalError(message);
            default:
                return new GeneralError(message);
        }
    };

    // ../shared/src/provider/provider.ts
    var ServerProviderStatus = /* @__PURE__ */ ((ServerProviderStatus2) => {
        ServerProviderStatus2["NOT_READY"] = "NOT_READY";
        ServerProviderStatus2["READY"] = "READY";
        ServerProviderStatus2["ERROR"] = "ERROR";
        ServerProviderStatus2["STALE"] = "STALE";
        ServerProviderStatus2["FATAL"] = "FATAL";
        return ServerProviderStatus2;
    })(ServerProviderStatus || {});
    var ClientProviderStatus = /* @__PURE__ */ ((ClientProviderStatus2) => {
        ClientProviderStatus2["NOT_READY"] = "NOT_READY";
        ClientProviderStatus2["READY"] = "READY";
        ClientProviderStatus2["ERROR"] = "ERROR";
        ClientProviderStatus2["STALE"] = "STALE";
        ClientProviderStatus2["FATAL"] = "FATAL";
        ClientProviderStatus2["RECONCILING"] = "RECONCILING";
        return ClientProviderStatus2;
    })(ClientProviderStatus || {});

    // ../shared/src/events/events.ts
    var ServerProviderEvents = /* @__PURE__ */ ((ServerProviderEvents2) => {
        ServerProviderEvents2["Ready"] = "PROVIDER_READY";
        ServerProviderEvents2["Error"] = "PROVIDER_ERROR";
        ServerProviderEvents2["ConfigurationChanged"] = "PROVIDER_CONFIGURATION_CHANGED";
        ServerProviderEvents2["Stale"] = "PROVIDER_STALE";
        return ServerProviderEvents2;
    })(ServerProviderEvents || {});
    var ClientProviderEvents = /* @__PURE__ */ ((ClientProviderEvents2) => {
        ClientProviderEvents2["Ready"] = "PROVIDER_READY";
        ClientProviderEvents2["Error"] = "PROVIDER_ERROR";
        ClientProviderEvents2["ConfigurationChanged"] = "PROVIDER_CONFIGURATION_CHANGED";
        ClientProviderEvents2["ContextChanged"] = "PROVIDER_CONTEXT_CHANGED";
        ClientProviderEvents2["Reconciling"] = "PROVIDER_RECONCILING";
        ClientProviderEvents2["Stale"] = "PROVIDER_STALE";
        return ClientProviderEvents2;
    })(ClientProviderEvents || {});

    // ../shared/src/events/event-utils.ts
    var eventStatusMap = {
        ["READY" /* READY */]: "PROVIDER_READY" /* Ready */,
        ["ERROR" /* ERROR */]: "PROVIDER_ERROR" /* Error */,
        ["FATAL" /* FATAL */]: "PROVIDER_ERROR" /* Error */,
        ["STALE" /* STALE */]: "PROVIDER_STALE" /* Stale */,
        ["RECONCILING" /* RECONCILING */]: "PROVIDER_RECONCILING" /* Reconciling */,
        ["NOT_READY" /* NOT_READY */]: void 0
    };
    var statusMatchesEvent = (event, status) => {
        return !status && event === "PROVIDER_READY" /* Ready */ || eventStatusMap[status] === event;
    };

    // ../shared/src/logger/default-logger.ts
    var DefaultLogger = class {
        error(...args) {
            console.error(...args);
        }
        warn(...args) {
            console.warn(...args);
        }
        info() {
        }
        debug() {
        }
    };

    // ../shared/src/logger/safe-logger.ts
    var LOG_LEVELS = ["error", "warn", "info", "debug"];
    var SafeLogger = class {
        constructor(logger) {
            this.fallbackLogger = new DefaultLogger();
            try {
                for (const level of LOG_LEVELS) {
                    if (!logger[level] || typeof logger[level] !== "function") {
                        throw new Error(`The provided logger is missing the ${level} method.`);
                    }
                }
                this.logger = logger;
            } catch (err) {
                console.error(err);
                console.error("Falling back to the default logger.");
                this.logger = this.fallbackLogger;
            }
        }
        error(...args) {
            this.log("error", ...args);
        }
        warn(...args) {
            this.log("warn", ...args);
        }
        info(...args) {
            this.log("info", ...args);
        }
        debug(...args) {
            this.log("debug", ...args);
        }
        log(level, ...args) {
            try {
                this.logger[level](...args);
            } catch (error) {
                this.fallbackLogger[level](...args);
            }
        }
    };

    // ../shared/src/events/generic-event-emitter.ts
    var GenericEventEmitter = class {
        constructor(globalLogger) {
            this.globalLogger = globalLogger;
            this._handlers = {
                ["PROVIDER_CONFIGURATION_CHANGED" /* ConfigurationChanged */]: /* @__PURE__ */ new WeakMap(),
                ["PROVIDER_CONTEXT_CHANGED" /* ContextChanged */]: /* @__PURE__ */ new WeakMap(),
                ["PROVIDER_READY" /* Ready */]: /* @__PURE__ */ new WeakMap(),
                ["PROVIDER_ERROR" /* Error */]: /* @__PURE__ */ new WeakMap(),
                ["PROVIDER_STALE" /* Stale */]: /* @__PURE__ */ new WeakMap(),
                ["PROVIDER_RECONCILING" /* Reconciling */]: /* @__PURE__ */ new WeakMap()
            };
        }
        // here we use E, to restrict the events a provider can manually emit (PROVIDER_CONTEXT_CHANGED is emitted by the SDK)
        emit(eventType, context) {
            this.eventEmitter.emit(eventType, context);
        }
        addHandler(eventType, handler) {
            const asyncHandler = (details) => __async(this, null, function* () {
                var _a;
                try {
                    yield handler(details);
                } catch (err) {
                    (_a = this._logger) == null ? void 0 : _a.error("Error running event handler:", err);
                }
            });
            const existingAsyncHandlers = this._handlers[eventType].get(handler);
            this._handlers[eventType].set(handler, [...existingAsyncHandlers || [], asyncHandler]);
            this.eventEmitter.on(eventType, asyncHandler);
        }
        removeHandler(eventType, handler) {
            const existingAsyncHandlers = this._handlers[eventType].get(handler);
            if (existingAsyncHandlers) {
                const removedAsyncHandler = existingAsyncHandlers.pop();
                if (removedAsyncHandler) {
                    this.eventEmitter.removeListener(eventType, removedAsyncHandler);
                }
            }
        }
        removeAllHandlers(eventType) {
            if (eventType) {
                this.eventEmitter.removeAllListeners(eventType);
            } else {
                this.eventEmitter.removeAllListeners();
            }
        }
        getHandlers(eventType) {
            return this.eventEmitter.listeners(eventType);
        }
        setLogger(logger) {
            this._eventLogger = new SafeLogger(logger);
            return this;
        }
        get _logger() {
            var _a, _b;
            return (_b = this._eventLogger) != null ? _b : (_a = this.globalLogger) == null ? void 0 : _a.call(this);
        }
    };

    // ../shared/src/telemetry/attributes.ts
    var TelemetryAttribute = {
        /**
         * The lookup key of the feature flag.
         *
         * - type: `string`
         * - requirement level: `required`
         * - example: `logo-color`
         */
        KEY: "feature_flag.key",
        /**
         * Describes a class of error the operation ended with.
         *
         * - type: `string`
         * - requirement level: `conditionally required`
         * - condition: `reason` is `error`
         * - example: `flag_not_found`
         */
        ERROR_CODE: "error.type",
        /**
         * A message explaining the nature of an error occurring during flag evaluation.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `Flag not found`
         */
        ERROR_MESSAGE: "error.message",
        /**
         * A semantic identifier for an evaluated flag value.
         *
         * - type: `string`
         * - requirement level: `conditionally required`
         * - condition: variant is defined on the evaluation details
         * - example: `blue`; `on`; `true`
         */
        VARIANT: "feature_flag.result.variant",
        /**
         * The evaluated value of the feature flag.
         *
         * - type: `undefined`
         * - requirement level: `conditionally required`
         * - condition: variant is not defined on the evaluation details
         * - example: `#ff0000`; `1`; `true`
         */
        VALUE: "feature_flag.result.value",
        /**
         * The unique identifier for the flag evaluation context. For example, the targeting key.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `5157782b-2203-4c80-a857-dbbd5e7761db`
         */
        CONTEXT_ID: "feature_flag.context.id",
        /**
         * The reason code which shows how a feature flag value was determined.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `targeting_match`
         */
        REASON: "feature_flag.result.reason",
        /**
         * Describes a class of error the operation ended with.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `flag_not_found`
         */
        PROVIDER: "feature_flag.provider.name",
        /**
         * The identifier of the flag set to which the feature flag belongs.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `proj-1`; `ab98sgs`; `service1/dev`
         */
        FLAG_SET_ID: "feature_flag.set.id",
        /**
         * The version of the ruleset used during the evaluation. This may be any stable value which uniquely identifies the ruleset.
         *
         * - type: `string`
         * - requirement level: `recommended`
         * - example: `1.0.0`; `2021-01-01`
         */
        VERSION: "feature_flag.version"
    };

    // ../shared/src/telemetry/flag-metadata.ts
    var TelemetryFlagMetadata = {
        /**
         * The context identifier returned in the flag metadata uniquely identifies
         * the subject of the flag evaluation. If not available, the targeting key
         * should be used.
         */
        CONTEXT_ID: "contextId",
        /**
         * 	A logical identifier for the flag set.
         */
        FLAG_SET_ID: "flagSetId",
        /**
         * 	A version string (format unspecified) for the flag or flag set.
         */
        VERSION: "version"
    };

    // ../shared/src/telemetry/evaluation-event.ts
    var FLAG_EVALUATION_EVENT_NAME = "feature_flag.evaluation";
    function createEvaluationEvent(hookContext, evaluationDetails) {
        var _a, _b;
        const attributes = {
            [TelemetryAttribute.KEY]: hookContext.flagKey,
            [TelemetryAttribute.PROVIDER]: hookContext.providerMetadata.name,
            [TelemetryAttribute.REASON]: ((_a = evaluationDetails.reason) != null ? _a : StandardResolutionReasons.UNKNOWN).toLowerCase()
        };
        if (evaluationDetails.variant) {
            attributes[TelemetryAttribute.VARIANT] = evaluationDetails.variant;
        } else {
            attributes[TelemetryAttribute.VALUE] = evaluationDetails.value;
        }
        const contextId = evaluationDetails.flagMetadata[TelemetryFlagMetadata.CONTEXT_ID] || hookContext.context.targetingKey;
        if (contextId) {
            attributes[TelemetryAttribute.CONTEXT_ID] = contextId;
        }
        const setId = evaluationDetails.flagMetadata[TelemetryFlagMetadata.FLAG_SET_ID];
        if (setId) {
            attributes[TelemetryAttribute.FLAG_SET_ID] = setId;
        }
        const version = evaluationDetails.flagMetadata[TelemetryFlagMetadata.VERSION];
        if (version) {
            attributes[TelemetryAttribute.VERSION] = version;
        }
        if (evaluationDetails.reason === StandardResolutionReasons.ERROR) {
            attributes[TelemetryAttribute.ERROR_CODE] = ((_b = evaluationDetails.errorCode) != null ? _b : "GENERAL" /* GENERAL */).toLowerCase();
            if (evaluationDetails.errorMessage) {
                attributes[TelemetryAttribute.ERROR_MESSAGE] = evaluationDetails.errorMessage;
            }
        }
        return {
            name: FLAG_EVALUATION_EVENT_NAME,
            attributes
        };
    }

    // ../shared/src/type-guards.ts
    function isString(value) {
        return typeof value === "string";
    }
    function stringOrUndefined(value) {
        return isString(value) ? value : void 0;
    }
    function isObject(value) {
        return typeof value === "object";
    }
    function objectOrUndefined(value) {
        return isObject(value) ? value : void 0;
    }

    // ../shared/src/filter.ts
    function isDefined(input) {
        return typeof input !== "undefined" && input !== null;
    }

    // ../shared/src/open-feature.ts
    var ProviderWrapper = class {
        constructor(_provider, _status, _statusEnumType) {
            this._provider = _provider;
            this._status = _status;
            this._pendingContextChanges = 0;
            var _a, _b, _c;
            (_a = _provider.events) == null ? void 0 : _a.addHandler("PROVIDER_READY" /* Ready */, () => {
                this._status = _statusEnumType.READY;
            });
            (_b = _provider.events) == null ? void 0 : _b.addHandler("PROVIDER_STALE" /* Stale */, () => {
                this._status = _statusEnumType.STALE;
            });
            (_c = _provider.events) == null ? void 0 : _c.addHandler("PROVIDER_ERROR" /* Error */, (details) => {
                if ((details == null ? void 0 : details.errorCode) === "PROVIDER_FATAL" /* PROVIDER_FATAL */) {
                    this._status = _statusEnumType.FATAL;
                } else {
                    this._status = _statusEnumType.ERROR;
                }
            });
        }
        get provider() {
            return this._provider;
        }
        set provider(provider) {
            this._provider = provider;
        }
        get status() {
            return this._status;
        }
        set status(status) {
            this._status = status;
        }
        get allContextChangesSettled() {
            return this._pendingContextChanges === 0;
        }
        incrementPendingContextChanges() {
            this._pendingContextChanges++;
        }
        decrementPendingContextChanges() {
            this._pendingContextChanges--;
        }
    };
    var OpenFeatureCommonAPI = class {
        constructor(category) {
            this._hooks = [];
            this._context = {};
            this._logger = new DefaultLogger();
            this._clientEventHandlers = /* @__PURE__ */ new Map();
            this._domainScopedContext = /* @__PURE__ */ new Map();
            this._clientEvents = /* @__PURE__ */ new Map();
            this._runsOn = category;
        }
        addHooks(...hooks) {
            this._hooks = [...this._hooks, ...hooks];
            return this;
        }
        getHooks() {
            return this._hooks;
        }
        clearHooks() {
            this._hooks = [];
            return this;
        }
        setLogger(logger) {
            this._logger = new SafeLogger(logger);
            return this;
        }
        /**
         * Get metadata about the default provider.
         * @returns {ProviderMetadata} Provider Metadata
         */
        get providerMetadata() {
            return this.getProviderMetadata();
        }
        /**
         * Get metadata about a registered provider using the client name.
         * An unbound or empty client name will return metadata from the default provider.
         * @param {string} domain An identifier which logically binds clients with providers
         * @returns {ProviderMetadata} Provider Metadata
         */
        getProviderMetadata(domain) {
            return this.getProviderForClient(domain).metadata;
        }
        /**
         * Adds a handler for the given provider event type.
         * The handlers are called in the order they have been added.
         * API (global) events run for all providers.
         * @param {AnyProviderEvent} eventType The provider event type to listen to
         * @param {EventHandler} handler The handler to run on occurrence of the event type
         * @param {EventOptions} options Optional options such as signal for aborting
         */
        addHandler(eventType, handler, options) {
            [.../* @__PURE__ */ new Map([[void 0, this._defaultProvider]]), ...this._domainScopedProviders].forEach((keyProviderTuple) => {
                var _a;
                const domain = keyProviderTuple[0];
                const provider = keyProviderTuple[1].provider;
                const status = keyProviderTuple[1].status;
                const shouldRunNow = statusMatchesEvent(eventType, status);
                if (shouldRunNow) {
                    try {
                        handler({ domain, providerName: provider.metadata.name });
                    } catch (err) {
                        (_a = this._logger) == null ? void 0 : _a.error("Error running event handler:", err);
                    }
                }
            });
            this._apiEmitter.addHandler(eventType, handler);
            if ((options == null ? void 0 : options.signal) && typeof options.signal.addEventListener === "function") {
                options.signal.addEventListener("abort", () => {
                    this.removeHandler(eventType, handler);
                });
            }
        }
        /**
         * Removes a handler for the given provider event type.
         * @param {AnyProviderEvent} eventType The provider event type to remove the listener for
         * @param {EventHandler} handler The handler to remove for the provider event type
         */
        removeHandler(eventType, handler) {
            this._apiEmitter.removeHandler(eventType, handler);
        }
        /**
         * Removes all event handlers.
         */
        clearHandlers() {
            this._apiEmitter.removeAllHandlers();
        }
        /**
         * Gets the current handlers for the given provider event type.
         * @param {AnyProviderEvent} eventType The provider event type to get the current handlers for
         * @returns {EventHandler[]} The handlers currently attached to the given provider event type
         */
        getHandlers(eventType) {
            return this._apiEmitter.getHandlers(eventType);
        }
        setAwaitableProvider(domainOrProvider, providerOrUndefined) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const domain = stringOrUndefined(domainOrProvider);
            const provider = (_a = objectOrUndefined(domainOrProvider)) != null ? _a : objectOrUndefined(providerOrUndefined);
            if (!provider) {
                this._logger.debug("No provider defined, ignoring setProvider call");
                return;
            }
            const oldProvider = this.getProviderForClient(domain);
            const providerName = provider.metadata.name;
            if (oldProvider === provider) {
                this._logger.debug("Provider is already set, ignoring setProvider call");
                return;
            }
            if (!provider.runsOn) {
                this._logger.debug(`Provider '${provider.metadata.name}' has not defined its intended use.`);
            } else if (provider.runsOn !== this._runsOn) {
                throw new GeneralError(`Provider '${provider.metadata.name}' is intended for use on the ${provider.runsOn}.`);
            }
            const emitters = this.getAssociatedEventEmitters(domain);
            let initializationPromise = void 0;
            const wrappedProvider = new ProviderWrapper(
                provider,
                this._statusEnumType.NOT_READY,
                this._statusEnumType
            );
            if (typeof provider.initialize === "function" && !this.allProviders.includes(provider)) {
                initializationPromise = (_e = (_d = (_c = provider.initialize) == null ? void 0 : _c.call(provider, domain ? (_b = this._domainScopedContext.get(domain)) != null ? _b : this._context : this._context)) == null ? void 0 : _d.then(() => {
                    var _a2;
                    wrappedProvider.status = this._statusEnumType.READY;
                    this.getAssociatedEventEmitters(domain).forEach((emitter) => {
                        emitter == null ? void 0 : emitter.emit("PROVIDER_READY" /* Ready */, { clientName: domain, domain, providerName });
                    });
                    (_a2 = this._apiEmitter) == null ? void 0 : _a2.emit("PROVIDER_READY" /* Ready */, { clientName: domain, domain, providerName });
                })) == null ? void 0 : _e.catch((error) => {
                    var _a2;
                    if ((error == null ? void 0 : error.code) === "PROVIDER_FATAL" /* PROVIDER_FATAL */) {
                        wrappedProvider.status = this._statusEnumType.FATAL;
                    } else {
                        wrappedProvider.status = this._statusEnumType.ERROR;
                    }
                    this.getAssociatedEventEmitters(domain).forEach((emitter) => {
                        emitter == null ? void 0 : emitter.emit("PROVIDER_ERROR" /* Error */, {
                            clientName: domain,
                            domain,
                            providerName,
                            message: error == null ? void 0 : error.message
                        });
                    });
                    (_a2 = this._apiEmitter) == null ? void 0 : _a2.emit("PROVIDER_ERROR" /* Error */, {
                        clientName: domain,
                        domain,
                        providerName,
                        message: error == null ? void 0 : error.message
                    });
                    throw error;
                });
            } else {
                wrappedProvider.status = this._statusEnumType.READY;
                emitters.forEach((emitter) => {
                    emitter == null ? void 0 : emitter.emit("PROVIDER_READY" /* Ready */, { clientName: domain, domain, providerName });
                });
                (_f = this._apiEmitter) == null ? void 0 : _f.emit("PROVIDER_READY" /* Ready */, { clientName: domain, domain, providerName });
            }
            if (domain) {
                this._domainScopedProviders.set(domain, wrappedProvider);
            } else {
                this._defaultProvider = wrappedProvider;
            }
            this.transferListeners(oldProvider, provider, domain, emitters);
            if (!this.allProviders.includes(oldProvider)) {
                (_h = (_g = oldProvider == null ? void 0 : oldProvider.onClose) == null ? void 0 : _g.call(oldProvider)) == null ? void 0 : _h.catch((err) => {
                    this._logger.error(`error closing provider: ${err == null ? void 0 : err.message}, ${err == null ? void 0 : err.stack}`);
                });
            }
            return initializationPromise;
        }
        getProviderForClient(domain) {
            var _a, _b;
            if (!domain) {
                return this._defaultProvider.provider;
            }
            return (_b = (_a = this._domainScopedProviders.get(domain)) == null ? void 0 : _a.provider) != null ? _b : this._defaultProvider.provider;
        }
        buildAndCacheEventEmitterForClient(domain) {
            const emitter = this._clientEvents.get(domain);
            if (emitter) {
                return emitter;
            }
            const newEmitter = this._createEventEmitter();
            this._clientEvents.set(domain, newEmitter);
            const clientProvider = this.getProviderForClient(domain);
            Object.values(ClientProviderEvents).forEach(
                (eventType) => {
                    var _a;
                    return (_a = clientProvider.events) == null ? void 0 : _a.addHandler(eventType, (details) => __async(this, null, function* () {
                        newEmitter.emit(eventType, __spreadProps(__spreadValues({}, details), {
                            clientName: domain,
                            domain,
                            providerName: clientProvider.metadata.name
                        }));
                    }));
                }
            );
            return newEmitter;
        }
        getUnboundEmitters() {
            const domainScopedProviders = [...this._domainScopedProviders.keys()];
            const eventEmitterNames = [...this._clientEvents.keys()].filter(isDefined);
            const unboundEmitterNames = eventEmitterNames.filter((name) => !domainScopedProviders.includes(name));
            return [
                // all unbound, named emitters
                ...unboundEmitterNames.map((name) => this._clientEvents.get(name)),
                // the default emitter
                this._clientEvents.get(void 0)
            ].filter(isDefined);
        }
        getAssociatedEventEmitters(domain) {
            return domain ? [this.buildAndCacheEventEmitterForClient(domain)] : this.getUnboundEmitters();
        }
        transferListeners(oldProvider, newProvider, domain, emitters) {
            var _a;
            (_a = this._clientEventHandlers.get(domain)) == null ? void 0 : _a.forEach((eventHandler) => {
                var _a2;
                return (_a2 = oldProvider.events) == null ? void 0 : _a2.removeHandler(...eventHandler);
            });
            const newClientHandlers = Object.values(ClientProviderEvents).map((eventType) => {
                const handler = (details) => __async(this, null, function* () {
                    emitters.forEach((emitter) => {
                        emitter == null ? void 0 : emitter.emit(eventType, __spreadProps(__spreadValues({}, details), { clientName: domain, domain, providerName: newProvider.metadata.name }));
                    });
                    this._apiEmitter.emit(eventType, __spreadProps(__spreadValues({}, details), {
                        clientName: domain,
                        domain,
                        providerName: newProvider.metadata.name
                    }));
                });
                return [eventType, handler];
            });
            this._clientEventHandlers.set(domain, newClientHandlers);
            newClientHandlers.forEach((eventHandler) => {
                var _a2;
                return (_a2 = newProvider.events) == null ? void 0 : _a2.addHandler(...eventHandler);
            });
        }
        close() {
            return __async(this, null, function* () {
                var _a, _b;
                try {
                    yield (_b = (_a = this == null ? void 0 : this._defaultProvider.provider) == null ? void 0 : _a.onClose) == null ? void 0 : _b.call(_a);
                } catch (err) {
                    this.handleShutdownError(this._defaultProvider.provider, err);
                }
                const wrappers = Array.from(this._domainScopedProviders);
                yield Promise.all(
                    wrappers.map((_0) => __async(this, [_0], function* ([, wrapper]) {
                        var _a2, _b2;
                        try {
                            yield (_b2 = wrapper == null ? void 0 : (_a2 = wrapper.provider).onClose) == null ? void 0 : _b2.call(_a2);
                        } catch (err) {
                            this.handleShutdownError(wrapper == null ? void 0 : wrapper.provider, err);
                        }
                    }))
                );
            });
        }
        clearProvidersAndSetDefault(defaultProvider) {
            return __async(this, null, function* () {
                try {
                    yield this.close();
                } catch (err) {
                    this._logger.error("Unable to cleanly close providers. Resetting to the default configuration.");
                } finally {
                    this._domainScopedProviders.clear();
                    this._defaultProvider = new ProviderWrapper(
                        defaultProvider,
                        this._statusEnumType.NOT_READY,
                        this._statusEnumType
                    );
                }
            });
        }
        get allProviders() {
            return [
                ...[...this._domainScopedProviders.values()].map((wrappers) => wrappers.provider),
                this._defaultProvider.provider
            ];
        }
        handleShutdownError(provider, err) {
            this._logger.error(`Error during shutdown of provider ${provider.metadata.name}: ${err}`);
            this._logger.error(err == null ? void 0 : err.stack);
        }
    };

    // src/provider/no-op-provider.ts
    var REASON_NO_OP = "No-op";
    var NoopFeatureProvider = class {
        constructor() {
            this.metadata = {
                name: "No-op Provider"
            };
        }
        resolveBooleanEvaluation(_, defaultValue) {
            return this.noOp(defaultValue);
        }
        resolveStringEvaluation(_, defaultValue) {
            return this.noOp(defaultValue);
        }
        resolveNumberEvaluation(_, defaultValue) {
            return this.noOp(defaultValue);
        }
        resolveObjectEvaluation(_, defaultValue) {
            return this.noOp(defaultValue);
        }
        noOp(defaultValue) {
            return {
                value: defaultValue,
                reason: REASON_NO_OP
            };
        }
    };
    var NOOP_PROVIDER = new NoopFeatureProvider();

    // ../../node_modules/eventemitter3/index.mjs
    var import_index = __toESM(require_eventemitter3(), 1);

    // src/events/open-feature-event-emitter.ts
    var OpenFeatureEventEmitter = class extends GenericEventEmitter {
        constructor() {
            super();
            this.eventEmitter = new import_index.default();
        }
    };

    // src/provider/in-memory-provider/variant-not-found-error.ts
    var VariantNotFoundError = class _VariantNotFoundError extends OpenFeatureError {
        constructor(message) {
            super(message);
            Object.setPrototypeOf(this, _VariantNotFoundError.prototype);
            this.name = "VariantNotFoundError";
            this.code = "GENERAL" /* GENERAL */;
        }
    };

    // src/provider/in-memory-provider/in-memory-provider.ts
    var InMemoryProvider = class {
        constructor(flagConfiguration = {}) {
            this.events = new OpenFeatureEventEmitter();
            this.runsOn = "client";
            this.metadata = {
                name: "in-memory"
            };
            this._flagConfiguration = __spreadValues({}, flagConfiguration);
        }
        /**
         * Overwrites the configured flags.
         * @param { FlagConfiguration } flagConfiguration new flag configuration
         */
        putConfiguration(flagConfiguration) {
            return __async(this, null, function* () {
                try {
                    const flagsChanged = Object.entries(__spreadValues(__spreadValues({}, flagConfiguration), this._flagConfiguration)).map(([key]) => key);
                    this._flagConfiguration = __spreadValues({}, flagConfiguration);
                    this.events.emit("PROVIDER_CONFIGURATION_CHANGED" /* ConfigurationChanged */, { flagsChanged });
                } catch (err) {
                    this.events.emit("PROVIDER_ERROR" /* Error */);
                    throw err;
                }
            });
        }
        resolveBooleanEvaluation(flagKey, defaultValue, context, logger) {
            return this.resolveAndCheckFlag(flagKey, defaultValue, context || this._context, logger);
        }
        resolveNumberEvaluation(flagKey, defaultValue, context, logger) {
            return this.resolveAndCheckFlag(flagKey, defaultValue, context || this._context, logger);
        }
        resolveStringEvaluation(flagKey, defaultValue, context, logger) {
            return this.resolveAndCheckFlag(flagKey, defaultValue, context || this._context, logger);
        }
        resolveObjectEvaluation(flagKey, defaultValue, context, logger) {
            return this.resolveAndCheckFlag(flagKey, defaultValue, context || this._context, logger);
        }
        resolveAndCheckFlag(flagKey, defaultValue, context, logger) {
            if (!(flagKey in this._flagConfiguration)) {
                const message = `no flag found with key ${flagKey}`;
                logger == null ? void 0 : logger.debug(message);
                throw new FlagNotFoundError(message);
            }
            if (this._flagConfiguration[flagKey].disabled) {
                return { value: defaultValue, reason: StandardResolutionReasons.DISABLED };
            }
            const resolvedFlag = this.resolveFlagWithReason(flagKey, context);
            if (resolvedFlag.value === void 0) {
                const message = `no value associated with variant provided for ${flagKey} found`;
                logger == null ? void 0 : logger.error(message);
                throw new VariantNotFoundError(message);
            }
            if (typeof resolvedFlag.value != typeof defaultValue) {
                throw new TypeMismatchError();
            }
            return resolvedFlag;
        }
        resolveFlagWithReason(flagKey, ctx) {
            try {
                const resolutionResult = this.lookupFlagValue(flagKey, ctx);
                return resolutionResult;
            } catch (error) {
                if (!(error instanceof OpenFeatureError)) {
                    throw new GeneralError((error == null ? void 0 : error.message) || "unknown error");
                }
                throw error;
            }
        }
        lookupFlagValue(flagKey, ctx) {
            var _a;
            const flagSpec = this._flagConfiguration[flagKey];
            const isContextEval = ctx && (flagSpec == null ? void 0 : flagSpec.contextEvaluator);
            const variant = isContextEval ? (_a = flagSpec.contextEvaluator) == null ? void 0 : _a.call(flagSpec, ctx) : flagSpec.defaultVariant;
            const value = variant && (flagSpec == null ? void 0 : flagSpec.variants[variant]);
            const reason = isContextEval ? StandardResolutionReasons.TARGETING_MATCH : StandardResolutionReasons.STATIC;
            return __spreadProps(__spreadValues({
                value
            }, variant && { variant }), {
                reason
            });
        }
    };

    // src/client/internal/open-feature-client.ts
    var OpenFeatureClient = class {
        constructor(providerAccessor, providerStatusAccessor, emitterAccessor, apiContextAccessor, apiHooksAccessor, globalLogger, options) {
            this.providerAccessor = providerAccessor;
            this.providerStatusAccessor = providerStatusAccessor;
            this.emitterAccessor = emitterAccessor;
            this.apiContextAccessor = apiContextAccessor;
            this.apiHooksAccessor = apiHooksAccessor;
            this.globalLogger = globalLogger;
            this.options = options;
            this._hooks = [];
        }
        get metadata() {
            var _a, _b;
            return {
                // Use domain if name is not provided
                name: (_a = this.options.domain) != null ? _a : this.options.name,
                domain: (_b = this.options.domain) != null ? _b : this.options.name,
                version: this.options.version,
                providerMetadata: this.providerAccessor().metadata
            };
        }
        get providerStatus() {
            return this.providerStatusAccessor();
        }
        addHandler(eventType, handler, options) {
            var _a;
            this.emitterAccessor().addHandler(eventType, handler);
            const shouldRunNow = statusMatchesEvent(eventType, this.providerStatus);
            if (shouldRunNow) {
                try {
                    handler({
                        clientName: this.metadata.name,
                        domain: this.metadata.domain,
                        providerName: this._provider.metadata.name
                    });
                } catch (err) {
                    (_a = this._logger) == null ? void 0 : _a.error("Error running event handler:", err);
                }
            }
            if ((options == null ? void 0 : options.signal) && typeof options.signal.addEventListener === "function") {
                options.signal.addEventListener("abort", () => {
                    this.removeHandler(eventType, handler);
                });
            }
        }
        removeHandler(notificationType, handler) {
            this.emitterAccessor().removeHandler(notificationType, handler);
        }
        getHandlers(eventType) {
            return this.emitterAccessor().getHandlers(eventType);
        }
        setLogger(logger) {
            this._clientLogger = new SafeLogger(logger);
            return this;
        }
        addHooks(...hooks) {
            this._hooks = [...this._hooks, ...hooks];
            return this;
        }
        getHooks() {
            return this._hooks;
        }
        clearHooks() {
            this._hooks = [];
            return this;
        }
        getBooleanValue(flagKey, defaultValue, options) {
            return this.getBooleanDetails(flagKey, defaultValue, options).value;
        }
        getBooleanDetails(flagKey, defaultValue, options) {
            return this.evaluate(flagKey, this._provider.resolveBooleanEvaluation, defaultValue, "boolean", options);
        }
        getStringValue(flagKey, defaultValue, options) {
            return this.getStringDetails(flagKey, defaultValue, options).value;
        }
        getStringDetails(flagKey, defaultValue, options) {
            return this.evaluate(
                flagKey,
                // this isolates providers from our restricted string generic argument.
                this._provider.resolveStringEvaluation,
                defaultValue,
                "string",
                options
            );
        }
        getNumberValue(flagKey, defaultValue, options) {
            return this.getNumberDetails(flagKey, defaultValue, options).value;
        }
        getNumberDetails(flagKey, defaultValue, options) {
            return this.evaluate(
                flagKey,
                // this isolates providers from our restricted number generic argument.
                this._provider.resolveNumberEvaluation,
                defaultValue,
                "number",
                options
            );
        }
        getObjectValue(flagKey, defaultValue, options) {
            return this.getObjectDetails(flagKey, defaultValue, options).value;
        }
        getObjectDetails(flagKey, defaultValue, options) {
            return this.evaluate(flagKey, this._provider.resolveObjectEvaluation, defaultValue, "object", options);
        }
        track(occurrenceKey, occurrenceDetails = {}) {
            var _a, _b, _c;
            try {
                this.shortCircuitIfNotReady();
                if (typeof this._provider.track === "function") {
                    const frozenContext = Object.freeze(__spreadValues({}, this.apiContextAccessor((_a = this == null ? void 0 : this.options) == null ? void 0 : _a.domain)));
                    return (_c = (_b = this._provider).track) == null ? void 0 : _c.call(_b, occurrenceKey, frozenContext, occurrenceDetails);
                } else {
                    this._logger.debug("Provider does not support the track function; will no-op.");
                }
            } catch (err) {
                this._logger.debug("Error recording tracking event.", err);
            }
        }
        evaluate(flagKey, resolver, defaultValue, flagType, options = {}) {
            var _a, _b;
            const allHooks = [
                ...this.apiHooksAccessor(),
                ...this.getHooks(),
                ...options.hooks || [],
                ...this._provider.hooks || []
            ];
            const allHooksReversed = [...allHooks].reverse();
            const context = __spreadValues({}, this.apiContextAccessor((_a = this == null ? void 0 : this.options) == null ? void 0 : _a.domain));
            const hookContexts = allHooksReversed.map(
                () => Object.freeze({
                    flagKey,
                    defaultValue,
                    flagValueType: flagType,
                    clientMetadata: this.metadata,
                    providerMetadata: this._provider.metadata,
                    context,
                    logger: this._logger,
                    hookData: new MapHookData()
                })
            );
            let evaluationDetails;
            try {
                this.beforeHooks(allHooks, hookContexts, options);
                this.shortCircuitIfNotReady();
                const resolution = resolver.call(this._provider, flagKey, defaultValue, context, this._logger);
                const resolutionDetails = __spreadProps(__spreadValues({}, resolution), {
                    flagMetadata: Object.freeze((_b = resolution.flagMetadata) != null ? _b : {}),
                    flagKey
                });
                if (resolutionDetails.errorCode) {
                    const err = instantiateErrorByErrorCode(resolutionDetails.errorCode, resolutionDetails.errorMessage);
                    this.errorHooks(allHooksReversed, hookContexts, err, options);
                    evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err, resolutionDetails.flagMetadata);
                } else {
                    this.afterHooks(allHooksReversed, hookContexts, resolutionDetails, options);
                    evaluationDetails = resolutionDetails;
                }
            } catch (err) {
                this.errorHooks(allHooksReversed, hookContexts, err, options);
                evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err);
            }
            this.finallyHooks(allHooksReversed, hookContexts, evaluationDetails, options);
            return evaluationDetails;
        }
        beforeHooks(hooks, hookContexts, options) {
            var _a;
            for (const [index, hook] of hooks.entries()) {
                const hookContextIndex = hooks.length - 1 - index;
                const hookContext = hookContexts[hookContextIndex];
                Object.freeze(hookContext);
                Object.freeze(hookContext.context);
                (_a = hook == null ? void 0 : hook.before) == null ? void 0 : _a.call(hook, hookContext, Object.freeze(options.hookHints));
            }
        }
        afterHooks(hooks, hookContexts, evaluationDetails, options) {
            var _a;
            for (const [index, hook] of hooks.entries()) {
                const hookContext = hookContexts[index];
                (_a = hook == null ? void 0 : hook.after) == null ? void 0 : _a.call(hook, hookContext, evaluationDetails, options.hookHints);
            }
        }
        errorHooks(hooks, hookContexts, err, options) {
            var _a;
            for (const [index, hook] of hooks.entries()) {
                try {
                    const hookContext = hookContexts[index];
                    (_a = hook == null ? void 0 : hook.error) == null ? void 0 : _a.call(hook, hookContext, err, options.hookHints);
                } catch (err2) {
                    this._logger.error(`Unhandled error during 'error' hook: ${err2}`);
                    if (err2 instanceof Error) {
                        this._logger.error(err2.stack);
                    }
                    this._logger.error(err2 == null ? void 0 : err2.stack);
                }
            }
        }
        finallyHooks(hooks, hookContexts, evaluationDetails, options) {
            var _a;
            for (const [index, hook] of hooks.entries()) {
                try {
                    const hookContext = hookContexts[index];
                    (_a = hook == null ? void 0 : hook.finally) == null ? void 0 : _a.call(hook, hookContext, evaluationDetails, options.hookHints);
                } catch (err) {
                    this._logger.error(`Unhandled error during 'finally' hook: ${err}`);
                    if (err instanceof Error) {
                        this._logger.error(err.stack);
                    }
                    this._logger.error(err == null ? void 0 : err.stack);
                }
            }
        }
        get _provider() {
            return this.providerAccessor();
        }
        get _logger() {
            return this._clientLogger || this.globalLogger();
        }
        shortCircuitIfNotReady() {
            if (this.providerStatus === "NOT_READY" /* NOT_READY */) {
                throw new ProviderNotReadyError("provider has not yet initialized");
            } else if (this.providerStatus === "FATAL" /* FATAL */) {
                throw new ProviderFatalError("provider is in an irrecoverable error state");
            }
        }
        getErrorEvaluationDetails(flagKey, defaultValue, err, flagMetadata = {}) {
            const errorMessage = err == null ? void 0 : err.message;
            const errorCode = (err == null ? void 0 : err.code) || "GENERAL" /* GENERAL */;
            return {
                errorCode,
                errorMessage,
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                flagMetadata: Object.freeze(flagMetadata),
                flagKey
            };
        }
    };

    // src/open-feature.ts
    var GLOBAL_OPENFEATURE_API_KEY = Symbol.for("@openfeature/web-sdk/api");
    var _globalThis = globalThis;
    var OpenFeatureAPI = class _OpenFeatureAPI extends OpenFeatureCommonAPI {
        constructor() {
            super("client");
            this._statusEnumType = ClientProviderStatus;
            this._apiEmitter = new OpenFeatureEventEmitter();
            this._defaultProvider = new ProviderWrapper(
                NOOP_PROVIDER,
                "NOT_READY" /* NOT_READY */,
                this._statusEnumType
            );
            this._domainScopedProviders = /* @__PURE__ */ new Map();
            this._createEventEmitter = () => new OpenFeatureEventEmitter();
        }
        /**
         * Gets a singleton instance of the OpenFeature API.
         * @ignore
         * @returns {OpenFeatureAPI} OpenFeature API
         */
        static getInstance() {
            const globalApi = _globalThis[GLOBAL_OPENFEATURE_API_KEY];
            if (globalApi) {
                return globalApi;
            }
            const instance = new _OpenFeatureAPI();
            _globalThis[GLOBAL_OPENFEATURE_API_KEY] = instance;
            return instance;
        }
        getProviderStatus(domain) {
            var _a, _b;
            if (!domain) {
                return this._defaultProvider.status;
            }
            return (_b = (_a = this._domainScopedProviders.get(domain)) == null ? void 0 : _a.status) != null ? _b : this._defaultProvider.status;
        }
        setProviderAndWait(clientOrProvider, providerContextOrUndefined, contextOrUndefined) {
            return __async(this, null, function* () {
                const domain = stringOrUndefined(clientOrProvider);
                const provider = domain ? objectOrUndefined(providerContextOrUndefined) : objectOrUndefined(clientOrProvider);
                const context = domain ? objectOrUndefined(contextOrUndefined) : objectOrUndefined(providerContextOrUndefined);
                if (context) {
                    if (domain) {
                        this._domainScopedContext.set(domain, context);
                    } else {
                        this._context = context;
                    }
                }
                yield this.setAwaitableProvider(domain, provider);
            });
        }
        setProvider(domainOrProvider, providerContextOrUndefined, contextOrUndefined) {
            const domain = stringOrUndefined(domainOrProvider);
            const provider = domain ? objectOrUndefined(providerContextOrUndefined) : objectOrUndefined(domainOrProvider);
            const context = domain ? objectOrUndefined(contextOrUndefined) : objectOrUndefined(providerContextOrUndefined);
            if (context) {
                if (domain) {
                    this._domainScopedContext.set(domain, context);
                } else {
                    this._context = context;
                }
            }
            const maybePromise = this.setAwaitableProvider(domain, provider);
            Promise.resolve(maybePromise).catch((err) => {
                this._logger.error("Error during provider initialization:", err);
            });
            return this;
        }
        getProvider(domain) {
            return this.getProviderForClient(domain);
        }
        setContext(domainOrContext, contextOrUndefined) {
            return __async(this, null, function* () {
                var _a, _b;
                const domain = stringOrUndefined(domainOrContext);
                const context = (_b = (_a = objectOrUndefined(domainOrContext)) != null ? _a : objectOrUndefined(contextOrUndefined)) != null ? _b : {};
                if (domain) {
                    const wrapper = this._domainScopedProviders.get(domain);
                    if (wrapper) {
                        const oldContext = this.getContext(domain);
                        this._domainScopedContext.set(domain, context);
                        yield this.runProviderContextChangeHandler(domain, wrapper, oldContext, context);
                    } else {
                        this._domainScopedContext.set(domain, context);
                    }
                } else {
                    const oldContext = this._context;
                    this._context = context;
                    const unboundProviders = Array.from(this._domainScopedProviders.entries()).filter(([domain2]) => !this._domainScopedContext.has(domain2)).reduce((acc, [domain2, wrapper]) => {
                        acc.push({ domain: domain2, wrapper });
                        return acc;
                    }, []);
                    const allDomainRecords = [
                        // add in the default (no domain)
                        { domain: void 0, wrapper: this._defaultProvider },
                        ...unboundProviders
                    ];
                    yield Promise.all(
                        allDomainRecords.map((dm) => this.runProviderContextChangeHandler(dm.domain, dm.wrapper, oldContext, context))
                    );
                }
            });
        }
        getContext(domainOrUndefined) {
            const domain = stringOrUndefined(domainOrUndefined);
            if (domain) {
                const context = this._domainScopedContext.get(domain);
                if (context) {
                    return context;
                } else {
                    this._logger.debug(`Unable to find context for '${domain}'.`);
                }
            }
            return this._context;
        }
        clearContext(domainOrUndefined) {
            return __async(this, null, function* () {
                const domain = stringOrUndefined(domainOrUndefined);
                if (domain) {
                    const wrapper = this._domainScopedProviders.get(domain);
                    if (wrapper) {
                        const oldContext = this.getContext(domain);
                        this._domainScopedContext.delete(domain);
                        const newContext = this.getContext();
                        yield this.runProviderContextChangeHandler(domain, wrapper, oldContext, newContext);
                    } else {
                        this._domainScopedContext.delete(domain);
                    }
                } else {
                    return this.setContext({});
                }
            });
        }
        /**
         * Resets the global evaluation context and removes the evaluation context for
         * all domains.
         */
        clearContexts() {
            return __async(this, null, function* () {
                yield this.clearContext();
                yield Promise.allSettled(Array.from(this._domainScopedProviders.keys()).map((domain) => this.clearContext(domain)));
            });
        }
        /**
         * A factory function for creating new domain-scoped OpenFeature clients. Clients
         * can contain their own state (e.g. logger, hook, context). Multiple domains
         * can be used to segment feature flag configuration.
         *
         * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
         * Otherwise, the default provider is used until a provider is assigned to that name.
         * @param {string} domain An identifier which logically binds clients with providers
         * @param {string} version The version of the client (only used for metadata)
         * @returns {Client} OpenFeature Client
         */
        getClient(domain, version) {
            return new OpenFeatureClient(
                // functions are passed here to make sure that these values are always up to date,
                // and so we don't have to make these public properties on the API class.
                () => this.getProviderForClient(domain),
                () => this.getProviderStatus(domain),
                () => this.buildAndCacheEventEmitterForClient(domain),
                (domain2) => this.getContext(domain2),
                () => this.getHooks(),
                () => this._logger,
                { domain, version }
            );
        }
        /**
         * Clears all registered providers and resets the default provider.
         * @returns {Promise<void>}
         */
        clearProviders() {
            return __async(this, null, function* () {
                yield __superGet(_OpenFeatureAPI.prototype, this, "clearProvidersAndSetDefault").call(this, NOOP_PROVIDER);
                this._domainScopedContext.clear();
            });
        }
        runProviderContextChangeHandler(domain, wrapper, oldContext, newContext) {
            return __async(this, null, function* () {
                var _a, _b, _c, _d, _e, _f;
                const providerName = ((_b = (_a = wrapper.provider) == null ? void 0 : _a.metadata) == null ? void 0 : _b.name) || "unnamed-provider";
                try {
                    if (typeof wrapper.provider.onContextChange === "function") {
                        const maybePromise = wrapper.provider.onContextChange(oldContext, newContext);
                        if (typeof (maybePromise == null ? void 0 : maybePromise.then) === "function") {
                            wrapper.incrementPendingContextChanges();
                            wrapper.status = this._statusEnumType.RECONCILING;
                            this.getAssociatedEventEmitters(domain).forEach((emitter) => {
                                emitter == null ? void 0 : emitter.emit("PROVIDER_RECONCILING" /* Reconciling */, { domain, providerName });
                            });
                            (_c = this._apiEmitter) == null ? void 0 : _c.emit("PROVIDER_RECONCILING" /* Reconciling */, { domain, providerName });
                            yield maybePromise;
                            wrapper.decrementPendingContextChanges();
                        }
                    }
                    wrapper.status = this._statusEnumType.READY;
                    if (wrapper.allContextChangesSettled) {
                        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
                            emitter == null ? void 0 : emitter.emit("PROVIDER_CONTEXT_CHANGED" /* ContextChanged */, { clientName: domain, domain, providerName });
                        });
                        (_d = this._apiEmitter) == null ? void 0 : _d.emit("PROVIDER_CONTEXT_CHANGED" /* ContextChanged */, { clientName: domain, domain, providerName });
                    }
                } catch (err) {
                    wrapper.decrementPendingContextChanges();
                    wrapper.status = this._statusEnumType.ERROR;
                    if (wrapper.allContextChangesSettled) {
                        const error = err;
                        const message = `Error running ${providerName}'s context change handler: ${error == null ? void 0 : error.message}`;
                        (_e = this._logger) == null ? void 0 : _e.error(`${message}`, err);
                        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
                            emitter == null ? void 0 : emitter.emit("PROVIDER_ERROR" /* Error */, { clientName: domain, domain, providerName, message });
                        });
                        (_f = this._apiEmitter) == null ? void 0 : _f.emit("PROVIDER_ERROR" /* Error */, { clientName: domain, domain, providerName, message });
                    }
                }
            });
        }
    };
    var OpenFeature = OpenFeatureAPI.getInstance();
    return __toCommonJS(index_exports);
})();