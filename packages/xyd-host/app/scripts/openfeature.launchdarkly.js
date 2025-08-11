var LaunchDarklyProvider = (function (exports, webSdk, launchdarklyJsClientSdk) {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var lodash_isempty = {exports: {}};

	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */
	lodash_isempty.exports;

	var hasRequiredLodash_isempty;

	function requireLodash_isempty () {
		if (hasRequiredLodash_isempty) return lodash_isempty.exports;
		hasRequiredLodash_isempty = 1;
		(function (module, exports) {
			/** Used as references for various `Number` constants. */
			var MAX_SAFE_INTEGER = 9007199254740991;

			/** `Object#toString` result references. */
			var argsTag = '[object Arguments]',
			    funcTag = '[object Function]',
			    genTag = '[object GeneratorFunction]',
			    mapTag = '[object Map]',
			    objectTag = '[object Object]',
			    promiseTag = '[object Promise]',
			    setTag = '[object Set]',
			    weakMapTag = '[object WeakMap]';

			var dataViewTag = '[object DataView]';

			/**
			 * Used to match `RegExp`
			 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
			 */
			var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

			/** Used to detect host constructors (Safari). */
			var reIsHostCtor = /^\[object .+?Constructor\]$/;

			/** Detect free variable `global` from Node.js. */
			var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

			/** Detect free variable `self`. */
			var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

			/** Used as a reference to the global object. */
			var root = freeGlobal || freeSelf || Function('return this')();

			/** Detect free variable `exports`. */
			var freeExports = exports && !exports.nodeType && exports;

			/** Detect free variable `module`. */
			var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

			/** Detect the popular CommonJS extension `module.exports`. */
			var moduleExports = freeModule && freeModule.exports === freeExports;

			/**
			 * Gets the value at `key` of `object`.
			 *
			 * @private
			 * @param {Object} [object] The object to query.
			 * @param {string} key The key of the property to get.
			 * @returns {*} Returns the property value.
			 */
			function getValue(object, key) {
			  return object == null ? undefined : object[key];
			}

			/**
			 * Checks if `value` is a host object in IE < 9.
			 *
			 * @private
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
			 */
			function isHostObject(value) {
			  // Many host objects are `Object` objects that can coerce to strings
			  // despite having improperly defined `toString` methods.
			  var result = false;
			  if (value != null && typeof value.toString != 'function') {
			    try {
			      result = !!(value + '');
			    } catch (e) {}
			  }
			  return result;
			}

			/**
			 * Creates a unary function that invokes `func` with its argument transformed.
			 *
			 * @private
			 * @param {Function} func The function to wrap.
			 * @param {Function} transform The argument transform.
			 * @returns {Function} Returns the new function.
			 */
			function overArg(func, transform) {
			  return function(arg) {
			    return func(transform(arg));
			  };
			}

			/** Used for built-in method references. */
			var funcProto = Function.prototype,
			    objectProto = Object.prototype;

			/** Used to detect overreaching core-js shims. */
			var coreJsData = root['__core-js_shared__'];

			/** Used to detect methods masquerading as native. */
			var maskSrcKey = (function() {
			  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
			  return uid ? ('Symbol(src)_1.' + uid) : '';
			}());

			/** Used to resolve the decompiled source of functions. */
			var funcToString = funcProto.toString;

			/** Used to check objects for own properties. */
			var hasOwnProperty = objectProto.hasOwnProperty;

			/**
			 * Used to resolve the
			 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
			 * of values.
			 */
			var objectToString = objectProto.toString;

			/** Used to detect if a method is native. */
			var reIsNative = RegExp('^' +
			  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
			  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
			);

			/** Built-in value references. */
			var Buffer = moduleExports ? root.Buffer : undefined,
			    propertyIsEnumerable = objectProto.propertyIsEnumerable;

			/* Built-in method references for those with the same name as other `lodash` methods. */
			var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
			    nativeKeys = overArg(Object.keys, Object);

			/* Built-in method references that are verified to be native. */
			var DataView = getNative(root, 'DataView'),
			    Map = getNative(root, 'Map'),
			    Promise = getNative(root, 'Promise'),
			    Set = getNative(root, 'Set'),
			    WeakMap = getNative(root, 'WeakMap');

			/** Detect if properties shadowing those on `Object.prototype` are non-enumerable. */
			var nonEnumShadows = !propertyIsEnumerable.call({ 'valueOf': 1 }, 'valueOf');

			/** Used to detect maps, sets, and weakmaps. */
			var dataViewCtorString = toSource(DataView),
			    mapCtorString = toSource(Map),
			    promiseCtorString = toSource(Promise),
			    setCtorString = toSource(Set),
			    weakMapCtorString = toSource(WeakMap);

			/**
			 * The base implementation of `getTag`.
			 *
			 * @private
			 * @param {*} value The value to query.
			 * @returns {string} Returns the `toStringTag`.
			 */
			function baseGetTag(value) {
			  return objectToString.call(value);
			}

			/**
			 * The base implementation of `_.isNative` without bad shim checks.
			 *
			 * @private
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a native function,
			 *  else `false`.
			 */
			function baseIsNative(value) {
			  if (!isObject(value) || isMasked(value)) {
			    return false;
			  }
			  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
			  return pattern.test(toSource(value));
			}

			/**
			 * Gets the native function at `key` of `object`.
			 *
			 * @private
			 * @param {Object} object The object to query.
			 * @param {string} key The key of the method to get.
			 * @returns {*} Returns the function if it's native, else `undefined`.
			 */
			function getNative(object, key) {
			  var value = getValue(object, key);
			  return baseIsNative(value) ? value : undefined;
			}

			/**
			 * Gets the `toStringTag` of `value`.
			 *
			 * @private
			 * @param {*} value The value to query.
			 * @returns {string} Returns the `toStringTag`.
			 */
			var getTag = baseGetTag;

			// Fallback for data views, maps, sets, and weak maps in IE 11,
			// for data views in Edge < 14, and promises in Node.js.
			if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
			    (Map && getTag(new Map) != mapTag) ||
			    (Promise && getTag(Promise.resolve()) != promiseTag) ||
			    (Set && getTag(new Set) != setTag) ||
			    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
			  getTag = function(value) {
			    var result = objectToString.call(value),
			        Ctor = result == objectTag ? value.constructor : undefined,
			        ctorString = Ctor ? toSource(Ctor) : undefined;

			    if (ctorString) {
			      switch (ctorString) {
			        case dataViewCtorString: return dataViewTag;
			        case mapCtorString: return mapTag;
			        case promiseCtorString: return promiseTag;
			        case setCtorString: return setTag;
			        case weakMapCtorString: return weakMapTag;
			      }
			    }
			    return result;
			  };
			}

			/**
			 * Checks if `func` has its source masked.
			 *
			 * @private
			 * @param {Function} func The function to check.
			 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
			 */
			function isMasked(func) {
			  return !!maskSrcKey && (maskSrcKey in func);
			}

			/**
			 * Checks if `value` is likely a prototype object.
			 *
			 * @private
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
			 */
			function isPrototype(value) {
			  var Ctor = value && value.constructor,
			      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

			  return value === proto;
			}

			/**
			 * Converts `func` to its source code.
			 *
			 * @private
			 * @param {Function} func The function to process.
			 * @returns {string} Returns the source code.
			 */
			function toSource(func) {
			  if (func != null) {
			    try {
			      return funcToString.call(func);
			    } catch (e) {}
			    try {
			      return (func + '');
			    } catch (e) {}
			  }
			  return '';
			}

			/**
			 * Checks if `value` is likely an `arguments` object.
			 *
			 * @static
			 * @memberOf _
			 * @since 0.1.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
			 *  else `false`.
			 * @example
			 *
			 * _.isArguments(function() { return arguments; }());
			 * // => true
			 *
			 * _.isArguments([1, 2, 3]);
			 * // => false
			 */
			function isArguments(value) {
			  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
			  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
			    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
			}

			/**
			 * Checks if `value` is classified as an `Array` object.
			 *
			 * @static
			 * @memberOf _
			 * @since 0.1.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
			 * @example
			 *
			 * _.isArray([1, 2, 3]);
			 * // => true
			 *
			 * _.isArray(document.body.children);
			 * // => false
			 *
			 * _.isArray('abc');
			 * // => false
			 *
			 * _.isArray(_.noop);
			 * // => false
			 */
			var isArray = Array.isArray;

			/**
			 * Checks if `value` is array-like. A value is considered array-like if it's
			 * not a function and has a `value.length` that's an integer greater than or
			 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
			 *
			 * @static
			 * @memberOf _
			 * @since 4.0.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
			 * @example
			 *
			 * _.isArrayLike([1, 2, 3]);
			 * // => true
			 *
			 * _.isArrayLike(document.body.children);
			 * // => true
			 *
			 * _.isArrayLike('abc');
			 * // => true
			 *
			 * _.isArrayLike(_.noop);
			 * // => false
			 */
			function isArrayLike(value) {
			  return value != null && isLength(value.length) && !isFunction(value);
			}

			/**
			 * This method is like `_.isArrayLike` except that it also checks if `value`
			 * is an object.
			 *
			 * @static
			 * @memberOf _
			 * @since 4.0.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is an array-like object,
			 *  else `false`.
			 * @example
			 *
			 * _.isArrayLikeObject([1, 2, 3]);
			 * // => true
			 *
			 * _.isArrayLikeObject(document.body.children);
			 * // => true
			 *
			 * _.isArrayLikeObject('abc');
			 * // => false
			 *
			 * _.isArrayLikeObject(_.noop);
			 * // => false
			 */
			function isArrayLikeObject(value) {
			  return isObjectLike(value) && isArrayLike(value);
			}

			/**
			 * Checks if `value` is a buffer.
			 *
			 * @static
			 * @memberOf _
			 * @since 4.3.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
			 * @example
			 *
			 * _.isBuffer(new Buffer(2));
			 * // => true
			 *
			 * _.isBuffer(new Uint8Array(2));
			 * // => false
			 */
			var isBuffer = nativeIsBuffer || stubFalse;

			/**
			 * Checks if `value` is an empty object, collection, map, or set.
			 *
			 * Objects are considered empty if they have no own enumerable string keyed
			 * properties.
			 *
			 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
			 * jQuery-like collections are considered empty if they have a `length` of `0`.
			 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
			 *
			 * @static
			 * @memberOf _
			 * @since 0.1.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
			 * @example
			 *
			 * _.isEmpty(null);
			 * // => true
			 *
			 * _.isEmpty(true);
			 * // => true
			 *
			 * _.isEmpty(1);
			 * // => true
			 *
			 * _.isEmpty([1, 2, 3]);
			 * // => false
			 *
			 * _.isEmpty({ 'a': 1 });
			 * // => false
			 */
			function isEmpty(value) {
			  if (isArrayLike(value) &&
			      (isArray(value) || typeof value == 'string' ||
			        typeof value.splice == 'function' || isBuffer(value) || isArguments(value))) {
			    return !value.length;
			  }
			  var tag = getTag(value);
			  if (tag == mapTag || tag == setTag) {
			    return !value.size;
			  }
			  if (nonEnumShadows || isPrototype(value)) {
			    return !nativeKeys(value).length;
			  }
			  for (var key in value) {
			    if (hasOwnProperty.call(value, key)) {
			      return false;
			    }
			  }
			  return true;
			}

			/**
			 * Checks if `value` is classified as a `Function` object.
			 *
			 * @static
			 * @memberOf _
			 * @since 0.1.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
			 * @example
			 *
			 * _.isFunction(_);
			 * // => true
			 *
			 * _.isFunction(/abc/);
			 * // => false
			 */
			function isFunction(value) {
			  // The use of `Object#toString` avoids issues with the `typeof` operator
			  // in Safari 8-9 which returns 'object' for typed array and other constructors.
			  var tag = isObject(value) ? objectToString.call(value) : '';
			  return tag == funcTag || tag == genTag;
			}

			/**
			 * Checks if `value` is a valid array-like length.
			 *
			 * **Note:** This method is loosely based on
			 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
			 *
			 * @static
			 * @memberOf _
			 * @since 4.0.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
			 * @example
			 *
			 * _.isLength(3);
			 * // => true
			 *
			 * _.isLength(Number.MIN_VALUE);
			 * // => false
			 *
			 * _.isLength(Infinity);
			 * // => false
			 *
			 * _.isLength('3');
			 * // => false
			 */
			function isLength(value) {
			  return typeof value == 'number' &&
			    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
			}

			/**
			 * Checks if `value` is the
			 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
			 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
			 *
			 * @static
			 * @memberOf _
			 * @since 0.1.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
			 * @example
			 *
			 * _.isObject({});
			 * // => true
			 *
			 * _.isObject([1, 2, 3]);
			 * // => true
			 *
			 * _.isObject(_.noop);
			 * // => true
			 *
			 * _.isObject(null);
			 * // => false
			 */
			function isObject(value) {
			  var type = typeof value;
			  return !!value && (type == 'object' || type == 'function');
			}

			/**
			 * Checks if `value` is object-like. A value is object-like if it's not `null`
			 * and has a `typeof` result of "object".
			 *
			 * @static
			 * @memberOf _
			 * @since 4.0.0
			 * @category Lang
			 * @param {*} value The value to check.
			 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
			 * @example
			 *
			 * _.isObjectLike({});
			 * // => true
			 *
			 * _.isObjectLike([1, 2, 3]);
			 * // => true
			 *
			 * _.isObjectLike(_.noop);
			 * // => false
			 *
			 * _.isObjectLike(null);
			 * // => false
			 */
			function isObjectLike(value) {
			  return !!value && typeof value == 'object';
			}

			/**
			 * This method returns `false`.
			 *
			 * @static
			 * @memberOf _
			 * @since 4.13.0
			 * @category Util
			 * @returns {boolean} Returns `false`.
			 * @example
			 *
			 * _.times(2, _.stubFalse);
			 * // => [false, false]
			 */
			function stubFalse() {
			  return false;
			}

			module.exports = isEmpty; 
		} (lodash_isempty, lodash_isempty.exports));
		return lodash_isempty.exports;
	}

	var lodash_isemptyExports = requireLodash_isempty();
	var isEmpty = /*@__PURE__*/getDefaultExportFromCjs(lodash_isemptyExports);

	var __defProp$1 = Object.defineProperty;
	var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
	var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
	var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
	var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
	var __spreadValues$1 = (a, b) => {
	  for (var prop in b || (b = {}))
	    if (__hasOwnProp$1.call(b, prop))
	      __defNormalProp$1(a, prop, b[prop]);
	  if (__getOwnPropSymbols$1)
	    for (var prop of __getOwnPropSymbols$1(b)) {
	      if (__propIsEnum$1.call(b, prop))
	        __defNormalProp$1(a, prop, b[prop]);
	    }
	  return a;
	};
	const LDContextBuiltIns = {
	  name: "string",
	  anonymous: "boolean"
	};
	function convertAttributes(logger, key, value, object, visited) {
	  if (visited.includes(value)) {
	    logger.error(
	      "Detected a cycle within the evaluation context. The affected part of the context will not be included in evaluation."
	    );
	    return;
	  }
	  if (value instanceof Date) {
	    object[key] = value.toISOString();
	  } else if (typeof value === "object" && !Array.isArray(value)) {
	    object[key] = {};
	    Object.entries(value).forEach(([objectKey, objectValue]) => {
	      convertAttributes(logger, objectKey, objectValue, object[key], [...visited, value]);
	    });
	  } else {
	    object[key] = value;
	  }
	}
	function translateContextCommon(logger, inCommon, inTargetingKey) {
	  const keyAttr = inCommon["key"];
	  const finalKey = inTargetingKey != null ? inTargetingKey : keyAttr;
	  if (keyAttr != null && inTargetingKey != null) {
	    logger.warn(
	      "The EvaluationContext contained both a 'targetingKey' and a 'key' attribute. The 'key' attribute will be discarded."
	    );
	  }
	  if (finalKey == null) {
	    logger.error(
	      "The EvaluationContext must contain either a 'targetingKey' or a 'key' and the type must be a string."
	    );
	  }
	  const convertedContext = { key: finalKey };
	  Object.entries(inCommon).forEach(([key, value]) => {
	    if (key === "targetingKey" || key === "key") {
	      return;
	    }
	    if (key === "privateAttributes") {
	      convertedContext._meta = {
	        privateAttributes: value
	      };
	    } else if (key in LDContextBuiltIns) {
	      const typedKey = key;
	      if (typeof value === LDContextBuiltIns[typedKey]) {
	        convertedContext[key] = value;
	      } else {
	        logger.error(`The attribute '${key}' must be of type ${LDContextBuiltIns[typedKey]}`);
	      }
	    } else {
	      convertAttributes(logger, key, value, convertedContext, [inCommon]);
	    }
	  });
	  return convertedContext;
	}
	function translateContext(logger, evalContext) {
	  let finalKind = "user";
	  if (evalContext["kind"] === "multi") {
	    return Object.entries(evalContext).reduce((acc, [key, value]) => {
	      if (key === "kind") {
	        acc.kind = value;
	      } else if (typeof value === "object" && !Array.isArray(value)) {
	        const valueRecord = value;
	        acc[key] = translateContextCommon(logger, valueRecord, valueRecord["targetingKey"]);
	      } else {
	        logger.error("Top level attributes in a multi-kind context should be Structure types.");
	      }
	      return acc;
	    }, {});
	  }
	  if (evalContext["kind"] !== void 0 && typeof evalContext["kind"] === "string") {
	    finalKind = evalContext["kind"];
	  } else if (evalContext["kind"] !== void 0 && typeof evalContext["kind"] !== "string") {
	    logger.warn("Specified 'kind' of context was not a string.");
	  }
	  return __spreadValues$1({
	    kind: finalKind
	  }, translateContextCommon(logger, evalContext, evalContext.targetingKey));
	}

	function translateErrorKind(errorKind) {
	  switch (errorKind) {
	    case "CLIENT_NOT_READY":
	      return webSdk.ErrorCode.PROVIDER_NOT_READY;
	    case "MALFORMED_FLAG":
	      return webSdk.ErrorCode.PARSE_ERROR;
	    case "FLAG_NOT_FOUND":
	      return webSdk.ErrorCode.FLAG_NOT_FOUND;
	    case "USER_NOT_SPECIFIED":
	      return webSdk.ErrorCode.TARGETING_KEY_MISSING;
	    // General errors.
	    default:
	      return webSdk.ErrorCode.GENERAL;
	  }
	}
	function translateResult(result) {
	  var _a, _b, _c;
	  const resolution = {
	    value: result.value,
	    variant: (_a = result.variationIndex) == null ? void 0 : _a.toString(),
	    reason: (_b = result.reason) == null ? void 0 : _b.kind
	  };
	  if (((_c = result.reason) == null ? void 0 : _c.kind) === "ERROR") {
	    resolution.errorCode = translateErrorKind(result.reason.errorKind);
	  }
	  return resolution;
	}

	var __defProp = Object.defineProperty;
	var __defProps = Object.defineProperties;
	var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
	var __getOwnPropSymbols = Object.getOwnPropertySymbols;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __propIsEnum = Object.prototype.propertyIsEnumerable;
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
	var __objRest = (source, exclude) => {
	  var target = {};
	  for (var prop in source)
	    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
	      target[prop] = source[prop];
	  if (source != null && __getOwnPropSymbols)
	    for (var prop of __getOwnPropSymbols(source)) {
	      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
	        target[prop] = source[prop];
	    }
	  return target;
	};
	function wrongTypeResult(value) {
	  return {
	    value,
	    reason: webSdk.StandardResolutionReasons.ERROR,
	    errorCode: webSdk.ErrorCode.TYPE_MISMATCH
	  };
	}
	class LaunchDarklyClientProvider {
	  constructor(envKey, _a) {
	    this.envKey = envKey;
	    this.metadata = {
	      name: "launchdarkly-client-provider"
	    };
	    this.events = new webSdk.OpenFeatureEventEmitter();
	    /*
	     * implement status field/accessor
	     * https://openfeature.dev/specification/sections/providers#requirement-242
	     * */
	    this._status = webSdk.ProviderStatus.NOT_READY;
	    var _b = _a, { logger, initializationTimeout } = _b, ldOptions = __objRest(_b, ["logger", "initializationTimeout"]);
	    if (logger) {
	      this.logger = logger;
	    } else {
	      this.logger = launchdarklyJsClientSdk.basicLogger({ level: "info" });
	    }
	    this.initializationTimeout = initializationTimeout;
	    this.ldOptions = __spreadProps(__spreadValues({}, ldOptions), { logger: this.logger });
	  }
	  set status(status) {
	    this._status = status;
	  }
	  get status() {
	    return this._status;
	  }
	  get client() {
	    if (!this._client) {
	      throw new webSdk.GeneralError("Provider is not initialized");
	    }
	    return this._client;
	  }
	  async initialize(context) {
	    var _a;
	    const _context = isEmpty(context) ? { anonymous: true } : this.translateContext(context);
	    this._client = launchdarklyJsClientSdk.initialize(this.envKey, _context, this.ldOptions);
	    if ((_a = this.ldOptions) == null ? void 0 : _a.streaming) {
	      this.setListeners();
	    }
	    try {
	      await this._client.waitForInitialization(this.initializationTimeout);
	      this.status = webSdk.ProviderStatus.READY;
	    } catch (e) {
	      this.status = webSdk.ProviderStatus.ERROR;
	    }
	  }
	  onClose() {
	    return this.client.close();
	  }
	  /** set listeners to LD client and event the correspodent event in the Provider
	   * necessary for LD streaming changes
	   * */
	  setListeners() {
	    this.client.on("change", (changeset) => {
	      this.events.emit(webSdk.ProviderEvents.ConfigurationChanged, {
	        flagsChanged: Object.keys(changeset)
	      });
	    });
	  }
	  async onContextChange(oldContext, newContext) {
	    await this.client.identify(this.translateContext(newContext));
	  }
	  resolveBooleanEvaluation(flagKey, defaultValue) {
	    const res = this.client.variationDetail(flagKey, defaultValue);
	    if (typeof res.value === "boolean") {
	      return translateResult(res);
	    }
	    return wrongTypeResult(defaultValue);
	  }
	  resolveNumberEvaluation(flagKey, defaultValue) {
	    const res = this.client.variationDetail(flagKey, defaultValue);
	    if (typeof res.value === "number") {
	      return translateResult(res);
	    }
	    return wrongTypeResult(defaultValue);
	  }
	  resolveObjectEvaluation(flagKey, defaultValue) {
	    const res = this.client.variationDetail(flagKey, defaultValue);
	    if (typeof res.value === "object") {
	      return translateResult(res);
	    }
	    return wrongTypeResult(defaultValue);
	  }
	  resolveStringEvaluation(flagKey, defaultValue) {
	    const res = this.client.variationDetail(flagKey, defaultValue);
	    if (typeof res.value === "string") {
	      return translateResult(res);
	    }
	    return wrongTypeResult(defaultValue);
	  }
	  track(trackingEventName, _context, _c) {
	    var _d = _c, { value } = _d, details = __objRest(_d, ["value"]);
	    this.client.track(trackingEventName, details, value);
	  }
	  translateContext(context) {
	    return translateContext(this.logger, context);
	  }
	}

	exports.LaunchDarklyClientProvider = LaunchDarklyClientProvider;

	return exports;

})({}, OpenFeature, LDClient);
//# sourceMappingURL=index.js.map
