(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('@babel/runtime/helpers/typeof')) :
	typeof define === 'function' && define.amd ? define(['@babel/runtime/helpers/typeof'], factory) :
	(global.Promisynch = factory(global._typeof));
}(this, (function (_typeof) { 'use strict';

_typeof = _typeof && _typeof.hasOwnProperty('default') ? _typeof['default'] : _typeof;

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isobject = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

function isObjectObject(o) {
  return isobject(o) === true
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
  return typeof val.constructor === 'function' ? val.constructor.name : null;
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

function classOf(Cls) {
  return function (obj) {
    return obj instanceof Cls;
  };
}

var isWindow = function (win) {
  return win != null && win === win.window;
};

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
  return _typeof(element) === 'object' && element.nodeType === 1;
});

var isDocument = (function (element) {
  return _typeof(element) === 'object' && element.nodeType === 9;
});

var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

function getLength(obj) {
  return isobject(obj) ? obj.length : undefined;
}

var isArrayLike = function (collection) {
  var length = getLength(collection);
  return itis.Number(length) && length >= 0 && length <= MAX_ARRAY_INDEX;
};

var isOneOf = function (array) {
  return function (variable) {
    return array.indexOf(variable) !== -1;
  };
};

var isOneOfType = function (array) {
  return function (variable) {
    return array.reduce(function (result, type) {
      var funName = "is".concat(type[0].toUpperCase() + type.slice(1));

      if (itis[funName]) {
        return result || itis[funName](variable);
      }

      return result || false;
    }, false);
  };
};

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
  classOf: classOf,
  oneOfType: isOneOfType,
  oneOf: isOneOf
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

// 状态
var PENDING = 'pending';
var FULFILLED = 'resolved';
var REJECTED = 'rejected';
var NOPE = function NOPE() {};

function setStatus(chain, status) {
  chain.status = status;
}

// function createError( error  ) {
//   return `Unhandled Promisynch Rejection: ${error}`;
// }

// results 数组
// return undefined/单个/数组
function getValue(results) {
  return results.length === 0 ? null : results.length === 1 ? results[0] : results;
}

function setStatusWrapper(chains) {
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

function tryWrapper(chains) {
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
      if (resultSet.chain._silent === true) {
        return Object.assign(resultSet, { err: err, result: [err] });
      }
      var timer = setTimeout(function () {
        throw err;
      });
      return Object.assign(resultSet, { err: err, timer: timer, result: [err] });
    }
  };
}

// use in finally method, catch a error and throw this error or throw the last error
function throwWrapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(toConsumableArray(resultSet.argument)));
    if (resultSet.err !== null) {
      throw resultSet.err;
    }
    return resultSet;
  };
}

function notThrowWrapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(toConsumableArray(resultSet.argument)));
    return resultSet;
  };
}

function silentWrapper(chains) {
  return function (resultSet) {
    if (resultSet.chain._silent === true) {
      try {
        return chains(resultSet);
      } catch (err) {
        return Object.assign(resultSet, { err: err, result: [err] });
      }
    } else {
      return chains(resultSet);
    }
  };
}

function thenerWrapper(callback) {
  return function handler(resultSet_) {
    var resultSet = Object.assign({}, resultSet_);

    if (resultSet.err !== null) {
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

    if (resultSet.err === null) {
      return resultSet;
    }

    if (resultSet.timer) {
      clearTimeout(resultSet.timer);
      delete resultSet.timer;
    }

    resultSet.result = callback(resultSet.err);
    return Object.assign(resultSet, resultSet.chain._bubble === true ? {} : { err: null });
  };
}

var METHOD = {
  thenMethod: function thenMethod(chains, callback) {
    var wrapped = compose(silentWrapper, setStatusWrapper, thenerWrapper)(callback);
    return chains ? compose(wrapped, chains) : wrapped;
  },
  catchMethod: function catchMethod(chains, callback) {
    var wrapped = compose(silentWrapper, catcherWrapper)(callback);
    return chains ? compose(wrapped, tryWrapper(chains)) : wrapped;
  },
  finallyMethod: function finallyMethod(chains, callback) {
    var wrapped = compose(silentWrapper, throwWrapper)(callback);
    return chains ? compose(wrapped, tryWrapper(chains)) : wrapped;
  },
  thenSyncMethod: function thenSyncMethod(callback) {
    return compose(delayThrow, setStatusWrapper, thenerWrapper)(callback);
  },
  catchSyncMethod: function catchSyncMethod(callback) {
    return compose(delayThrow, catcherWrapper)(callback);
  },
  finallySyncMethod: function finallySyncMethod(callback) {
    return compose(delayThrow, notThrowWrapper)(callback);
  }
};

function initPromisynch(callback) {

  invariant_1(is.Function(callback), 'You must pass a resolver function as the first argument to the chain constructor');

  return function (resolve, reject) {
    try {
      callback(resolve, reject);
    } catch (err) {
      reject(err);
    }
  };
}

var Promisynch = function () {
  createClass(Promisynch, null, [{
    key: 'of',
    value: function of(resolver) {
      return new Promisynch(resolver || NOPE);
    }
  }, {
    key: 'resolve',
    value: function resolve(value) {
      return Promisynch.of(function (onResolve) {
        return onResolve(value);
      });
    }
  }, {
    key: 'reject',
    value: function reject(reason) {
      return Promisynch.of(function (_, onReject) {
        return onReject(reason);
      });
    }
  }, {
    key: 'all',
    value: function all(promisynchArray) {
      var promisynch = Promisynch.of();
      var psArray = Array.from(promisynchArray);
      function checkAll(psArray) {
        if (promisynch.status === PENDING) {
          // 发生错误提前返回
          if (psArray.some(function (ps) {
            return ps.status === REJECTED;
          })) {
            var ps = psArray.find(function (ps) {
              return ps.status === REJECTED;
            });
            promisynch.reject(ps.value);
          } else if (psArray.every(function (ps) {
            return ps.status !== PENDING;
          })) {
            // 所有完成并且没有发生错误,返回所有结果
            promisynch.resolve(psArray.map(function (psResult) {
              return psResult.value;
            }));
          }
        }
      }
      psArray.forEach(function (ps) {
        ps['finally'](function () {
          return checkAll(psArray);
        })['catch'](NOPE);
      });
      return promisynch;
    }
  }, {
    key: 'race',
    value: function race(promisynchArray) {
      var promisynch = Promisynch.of();
      var psArray = Array.from(promisynchArray);
      function checkOne(psArray) {
        if (promisynch.status === PENDING) {
          // if ( psArray.some( ps => ps.status !== PENDING )) {
          var ps = psArray.find(function (ps) {
            return ps.status !== PENDING;
          });
          if (ps.status === REJECTED) {
            promisynch.reject(ps.value);
          } else {
            promisynch.resolve(ps.value);
          }
          // }
        }
      }
      psArray.forEach(function (ps) {
        ps['finally'](function () {
          return checkOne(psArray);
        })['catch'](NOPE);
      });
      return promisynch;
    }
  }, {
    key: 'silent',
    value: function silent(promisynch) {
      if (is.Function(promisynch)) {
        var p = Promisynch.of(promisynch);
        p._silent = true;
        return p;
      }
      promisynch._silent = true;
      return promisynch;
    }
  }, {
    key: 'bubble',
    value: function bubble(promisynch) {
      if (is.Function(promisynch)) {
        var p = Promisynch.of(promisynch);
        p._bubble = true;
        return p;
      }
      promisynch._bubble = true;
      return promisynch;
    }
  }]);

  function Promisynch(resolver) {
    classCallCheck(this, Promisynch);

    this.status = PENDING;
    this.value = null;
    this.funcs = null;
    initPromisynch(resolver)(this.resolve.bind(this), this.reject.bind(this));
  }

  createClass(Promisynch, [{
    key: 'resolve',
    value: function resolve() {
      for (var _len = arguments.length, value = Array(_len), _key = 0; _key < _len; _key++) {
        value[_key] = arguments[_key];
      }

      if (this.status === PENDING) {
        this.status = FULFILLED;
        var arrow = {
          err: null,
          result: undefined,
          argument: value,
          chain: this
        };
        this.value = getValue(value);
        if (this.funcs) {
          arrow = this.funcs(arrow);
          if (value.length === 0) {
            this.value = arrow.result;
          }
          delete this.funcs;
        } else {
          this._set = arrow;
        }
      }
      return this;
    }
  }, {
    key: 'reject',
    value: function reject(reason) {
      if (this.status === PENDING) {
        this.status = REJECTED;
        var arrow = {
          err: reason,
          result: undefined,
          argument: [reason],
          chain: this
        };
        this.value = is.Defined(reason) ? reason : null;
        if (this.funcs) {
          arrow = this.funcs(arrow);
          if (is.Undefined(reason)) {
            this.value = arrow.result;
          }
          delete this.funcs;
        } else {
          this._set = arrow;
        }
      }
      return this;
    }
  }, {
    key: 'then',
    value: function then(onResolve, onReject) {
      if (this.status === PENDING) {
        if (onResolve) {
          this.funcs = METHOD.thenMethod(this.funcs, onResolve);
        }
        if (onReject) {
          this.funcs = METHOD.catchMethod(this.funcs, onReject);
        }
      } else {
        if (onResolve) {
          this._set = METHOD.thenSyncMethod(onResolve)(this._set);
          this.value = this._set.result;
        }
        if (onReject) {
          this._set = METHOD.catchSyncMethod(onReject)(this._set);
          this.value = this._set.result;
        }
      }
      return this;
    }
  }, {
    key: 'catch',
    value: function _catch(onReject) {
      if (this.status === PENDING) {
        if (onReject) {
          this.funcs = METHOD.catchMethod(this.funcs, onReject);
        }
      } else {
        if (onReject) {
          this._set = METHOD.catchSyncMethod(onReject)(this._set);
          this.value = this._set.result;
        }
      }
      return this;
    }
  }, {
    key: 'finally',
    value: function _finally(onFinally) {
      if (this.status === PENDING) {
        if (onFinally) {
          this.funcs = METHOD.finallyMethod(this.funcs, onFinally);
        }
      } else {
        if (onFinally) {
          this._set = METHOD.finallySyncMethod(onFinally)(this._set);
          this.value = this._set.result;
        }
      }
      return this;
    }
  }]);
  return Promisynch;
}();

return Promisynch;

})));
