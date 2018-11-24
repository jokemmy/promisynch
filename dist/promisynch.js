(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.promisynch = factory());
}(this, (function () { 'use strict';

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isobject = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isobject$1 = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

function isObjectObject(o) {
  return isobject$1(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

var isPlainObject = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};

var toString = Object.prototype.toString;

var kindOf = function kindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';

  var type = typeof val;
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'symbol') return 'symbol';
  if (type === 'function') {
    return isGeneratorFn(val) ? 'generatorfunction' : 'function';
  }

  if (isArray(val)) return 'array';
  if (isBuffer(val)) return 'buffer';
  if (isArguments(val)) return 'arguments';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  if (isRegexp(val)) return 'regexp';

  switch (ctorName(val)) {
    case 'Symbol': return 'symbol';
    case 'Promise': return 'promise';

    // Set, Map, WeakSet, WeakMap
    case 'WeakMap': return 'weakmap';
    case 'WeakSet': return 'weakset';
    case 'Map': return 'map';
    case 'Set': return 'set';

    // 8-bit typed arrays
    case 'Int8Array': return 'int8array';
    case 'Uint8Array': return 'uint8array';
    case 'Uint8ClampedArray': return 'uint8clampedarray';

    // 16-bit typed arrays
    case 'Int16Array': return 'int16array';
    case 'Uint16Array': return 'uint16array';

    // 32-bit typed arrays
    case 'Int32Array': return 'int32array';
    case 'Uint32Array': return 'uint32array';
    case 'Float32Array': return 'float32array';
    case 'Float64Array': return 'float64array';
  }

  if (isGeneratorObj(val)) {
    return 'generator';
  }

  // Non-plain objects
  type = toString.call(val);
  switch (type) {
    case '[object Object]': return 'object';
    // iterators
    case '[object Map Iterator]': return 'mapiterator';
    case '[object Set Iterator]': return 'setiterator';
    case '[object String Iterator]': return 'stringiterator';
    case '[object Array Iterator]': return 'arrayiterator';
  }

  // other
  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
};

function ctorName(val) {
  return val.constructor ? val.constructor.name : null;
}

function isArray(val) {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val) {
  return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function'
    && typeof val.getDate === 'function'
    && typeof val.setDate === 'function';
}

function isRegexp(val) {
  if (val instanceof RegExp) return true;
  return typeof val.flags === 'string'
    && typeof val.ignoreCase === 'boolean'
    && typeof val.multiline === 'boolean'
    && typeof val.global === 'boolean';
}

function isGeneratorFn(name, val) {
  return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(val) {
  return typeof val.throw === 'function'
    && typeof val.return === 'function'
    && typeof val.next === 'function';
}

function isArguments(val) {
  try {
    if (typeof val.length === 'number' && typeof val.callee === 'function') {
      return true;
    }
  } catch (err) {
    if (err.message.indexOf('callee') !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser),
 * take a look at https://github.com/feross/is-buffer
 */

function isBuffer(val) {
  if (val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}

var itis = {};

['Array', 'Number', 'Function', 'RegExp', 'Boolean', 'Date', 'Error', 'Arguments', 'Null', 'String'].forEach(function (name) {
  itis[name] = function (v) {
    return kindOf(v) === name.toLowerCase();
  };
});

/**
 * 2017-08-12 rainx
 * If a variable is not equal to null or undefined, I think it is defined.
 */
var isDefined = (function (variable) {
  return variable !== null && variable !== undefined;
});

/**
 * 2017-08-12 rainx
 * Be contrary to isDefined.
 */
var isUndefined = (function (variable) {
  return variable === null || variable === undefined;
});

function isItClass(Cls) {
  return function (obj) {
    return obj instanceof Cls;
  };
}

var isWindow = function (win) {
  return win != null && win === win.window;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * nodeType 说明 http://www.w3school.com.cn/jsref/prop_node_nodetype.asp
 *
 * 1 Element  代表元素
 *   Element, Text, Comment, ProcessingInstruction, CDATASection, EntityReference
 * 2 Attr  代表属性
 *   Text, EntityReference
 * 3 Text  代表元素或属性中的文本内容
 *   None
 * 4 CDATASection  代表文档中的 CDATA 部分（不会由解析器解析的文本）
 *   None
 * 5 EntityReference  代表实体引用
 *   Element, ProcessingInstruction, Comment, Text, CDATASection, EntityReference
 * 6 Entity  代表实体
 *   Element, ProcessingInstruction, Comment, Text, CDATASection, EntityReference
 * 7 ProcessingInstruction  代表处理指令
 *   None
 * 8 Comment  代表注释
 *   None
 * 9 Document  代表整个文档（DOM 树的根节点）
 *   Element, ProcessingInstruction, Comment, DocumentType
 * 10 DocumentType  向为文档定义的实体提供接口
 *   None
 * 11 DocumentFragment  代表轻量级的 Document 对象，能够容纳文档的某个部分
 *   Element, ProcessingInstruction, Comment, Text, CDATASection, EntityReference
 * 12 Notation  代表 DTD 中声明的符号
 *   None
 */

var isElement = (function (element) {
  return (typeof element === 'undefined' ? 'undefined' : _typeof(element)) === 'object' && element.nodeType === 1;
});

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isDocument = (function (element) {
  return (typeof element === 'undefined' ? 'undefined' : _typeof$1(element)) === 'object' && element.nodeType === 9;
});

var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

function getLength(obj) {
  return isobject(obj) ? obj.length : undefined;
}

var isArrayLike = function (collection) {
  var length = getLength(collection);
  return itis.Number(length) && length >= 0 && length <= MAX_ARRAY_INDEX;
};

// Number, Function, RegExp, Boolean, Date, Error, Arguments,
// PlainObject, Object, Array, ArrayLike, Element
var is = Object.assign(itis, {
  Undefined: isUndefined,
  Defined: isDefined,
  Element: isElement,
  Window: isWindow,
  Document: isDocument,
  PlainObject: isPlainObject,
  Object: isobject,
  ArrayLike: isArrayLike,
  isItClass: isItClass
});

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var NODE_ENV = "development";

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

var invariant_1 = invariant;

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var PENDING = 'PENDING';
var FULFILLED = 'FULFILLED';
var REJECTED = 'REJECTED';

function setStatus(chain, status) {
  chain._state = status;
}

function getResult(results) {
  return results.length <= 1 ? results[0] : results;
}

function setStatusWapper(chains) {
  return function (resultSet) {
    try {
      setStatus(resultSet.chain, resultSet.err ? REJECTED : FULFILLED);
      return chains(resultSet);
    } catch (err) {
      resultSet.err = err;
      resultSet.result = [err];
      setStatus(resultSet.chain, REJECTED);
      throw err;
    }
  };
}

function tryWapper(chains) {
  return function (resultSet) {
    try {
      return chains(resultSet);
    } catch (err) {
      return Object.assign(resultSet, { err: err, result: [err] });
    }
  };
}

function delayThrow(chains) {
  return function (resultSet) {
    try {
      return chains(resultSet);
    } catch (err) {
      var timer = setTimeout(function () {
        throw err;
      });
      return Object.assign(resultSet, { err: err, timer: timer, result: [err] });
    }
  };
}

// use in always method, catch a error and throw this error or throw the last error
function throwWapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(toConsumableArray(resultSet.argument)));
    if (resultSet.err) {
      throw resultSet.err;
    }
    return resultSet;
  };
}

function notThrowWapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(toConsumableArray(resultSet.argument)));
    return resultSet;
  };
}

function thenerWrapper(callback) {
  return function handler(resultSet_) {
    var resultSet = Object.assign({}, resultSet_);

    if (resultSet.err) {
      return resultSet;
    }

    if (is.Defined(resultSet.result)) {
      resultSet.result = callback(resultSet.result);
    } else {
      resultSet.result = callback.apply(undefined, toConsumableArray(resultSet.argument));
    }

    return resultSet;
  };
}

function catcherWrapper(callback) {
  return function handler(resultSet_) {
    var resultSet = Object.assign({}, resultSet_);

    if (!resultSet.err) {
      return resultSet;
    }

    if (resultSet.timer) {
      clearTimeout(resultSet.timer);
      delete resultSet.timer;
    }

    resultSet.result = callback(resultSet.err);
    return Object.assign(resultSet, { err: null });
  };
}

var METHOD = {
  thenMethod: function thenMethod(chains, callback) {
    var wrapped = compose(setStatusWapper, thenerWrapper)(callback);
    return chains ? compose(wrapped, chains) : wrapped;
  },
  catchMethod: function catchMethod(chains, callback) {
    var wrapped = compose(catcherWrapper)(callback);
    return chains ? compose(wrapped, tryWapper(chains)) : wrapped;
  },
  alwaysMethod: function alwaysMethod(chains, callback) {
    var wrapped = compose(throwWapper)(callback);
    return chains ? compose(wrapped, tryWapper(chains)) : wrapped;
  },
  thenSyncMethod: function thenSyncMethod(callback) {
    return compose(delayThrow, setStatusWapper, thenerWrapper)(callback);
  },
  catchSyncMethod: function catchSyncMethod(callback) {
    return compose(delayThrow, catcherWrapper)(callback);
  },
  alwaysSyncMethod: function alwaysSyncMethod(callback) {
    return compose(delayThrow, notThrowWapper)(callback);
  }
};

function initChain(callback) {

  invariant_1(is.Function(callback), 'Hope: You must pass a resolver function as the first argument to the chain constructor');

  return function (resolve, reject) {
    try {
      callback(resolve, reject);
    } catch (err) {
      reject(err);
    }
  };
}

function removeSet(chain) {
  setTimeout(function () {
    delete chain._sync;
  });
}

var Chain = function () {
  createClass(Chain, null, [{
    key: 'of',
    value: function of(resolver) {
      return new Chain(resolver);
    }
  }, {
    key: 'resolve',
    value: function resolve(value) {
      return Chain.of(function (resolve) {
        return resolve(value);
      });
    }
  }, {
    key: 'reject',
    value: function reject(reason) {
      return Chain.of(function (_, reject) {
        return reject(reason);
      });
    }
  }, {
    key: 'all',
    value: function all(chains_) {
      var chn = Chain.of(function () {});
      var chains = Array.from(chains_);
      function checkAll(chs) {
        if (chs.every(function (chain) {
          return chain._state !== PENDING;
        })) {
          var chainResults = chs.map(function (chain) {
            return chain._result;
          });
          if (chs.some(function (chain) {
            return chain._state === REJECTED;
          })) {
            chn.reject.apply(chn, toConsumableArray(chainResults));
          }
          chn.resolve.apply(chn, toConsumableArray(chainResults));
        }
      }
      chains.forEach(function (chain) {
        chain.always(function () {
          return checkAll(chains);
        })['catch'](function () {});
      });
      return chn;
    }
  }, {
    key: 'race',
    value: function race(chains_) {
      var chn = Chain.of(function () {});
      var chains = Array.from(chains_);
      function checkOne(chs) {
        if (chs.some(function (chain) {
          return chain._state !== PENDING;
        })) {
          var chain = chs.find(function (chain) {
            return chain._state !== PENDING;
          });
          if (chain._state === REJECTED) {
            chn.reject(chain._result);
          }
          chn.resolve(chain._result);
        }
      }
      chains.forEach(function (chain) {
        chain.always(function () {
          return checkOne(chains);
        })['catch'](function () {});
      });
      return chn;
    }
  }]);

  function Chain(resolver) {
    var _this = this;

    classCallCheck(this, Chain);

    // this._sync = null;
    this._result = null;
    this._state = PENDING;

    var chains = null;
    var initialize = initChain(resolver);

    ['resolve', 'reject'].forEach(function (func) {
      var body = _this[func].bind(_this);
      _this[func] = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return body.apply(undefined, [chains].concat(args));
      };
    });

    ['then', 'catch', 'always'].forEach(function (func) {
      _this[func] = function (callback) {
        if (_this._sync) {
          _this._set = METHOD[func + 'SyncMethod'](callback)(_this._set);
          _this._result = _this._set.result;
        } else {
          chains = METHOD[func + 'Method'](chains, callback);
        }
        return _this;
      };
    });

    var thenMethod = this.then;
    var catchMethod = this['catch'];
    this.then = function (resolve, reject) {
      if (is.Function(resolve)) {
        thenMethod(resolve);
      }
      if (is.Function(reject)) {
        catchMethod(reject);
      }
      return _this;
    };

    initialize(this.resolve, this.reject);
  }

  createClass(Chain, [{
    key: 'resolve',
    value: function resolve(chains) {
      for (var _len2 = arguments.length, value = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        value[_key2 - 1] = arguments[_key2];
      }

      if (this._state === PENDING) {
        this._result = getResult(value);
        this._state = FULFILLED;
        this._set = {
          err: null,
          result: undefined,
          argument: value,
          chain: this
        };
        if (chains) {
          this._set = chains(this._set);
          // this._result = this._set.result;
        } else {
          removeSet(this);
          this._sync = true;
        }
      }
      return this;
    }
  }, {
    key: 'reject',
    value: function reject(chains) {
      for (var _len3 = arguments.length, reason = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        reason[_key3 - 1] = arguments[_key3];
      }

      if (this._state === PENDING) {
        this._result = getResult(reason);
        this._state = REJECTED;
        this._set = {
          err: reason,
          result: undefined,
          argument: reason,
          chain: this
        };
        if (chains) {
          this._set = chains(this._set);
          // this._result = this._set.result;
        } else {
          removeSet(this);
          this._sync = true;
        }
      }
      return this;
    }
  }]);
  return Chain;
}();

return Chain;

})));
