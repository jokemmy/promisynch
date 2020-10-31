'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _whatitis = require('whatitis');

var _whatitis2 = _interopRequireDefault(_whatitis);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _compose = require('./compose');

var _compose2 = _interopRequireDefault(_compose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(_toConsumableArray(resultSet.argument)));
    if (resultSet.err !== null) {
      throw resultSet.err;
    }
    return resultSet;
  };
}

function notThrowWrapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(_toConsumableArray(resultSet.argument)));
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

    if (_whatitis2['default'].Defined(resultSet.result)) {
      resultSet.result = callback(resultSet.result);
    } else {
      resultSet.result = callback.apply(undefined, _toConsumableArray(resultSet.argument));
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
    var wrapped = (0, _compose2['default'])(silentWrapper, setStatusWrapper, thenerWrapper)(callback);
    return chains ? (0, _compose2['default'])(wrapped, chains) : wrapped;
  },
  catchMethod: function catchMethod(chains, callback) {
    var wrapped = (0, _compose2['default'])(silentWrapper, catcherWrapper)(callback);
    return chains ? (0, _compose2['default'])(wrapped, tryWrapper(chains)) : wrapped;
  },
  finallyMethod: function finallyMethod(chains, callback) {
    var wrapped = (0, _compose2['default'])(silentWrapper, throwWrapper)(callback);
    return chains ? (0, _compose2['default'])(wrapped, tryWrapper(chains)) : wrapped;
  },
  thenSyncMethod: function thenSyncMethod(callback) {
    return (0, _compose2['default'])(delayThrow, setStatusWrapper, thenerWrapper)(callback);
  },
  catchSyncMethod: function catchSyncMethod(callback) {
    return (0, _compose2['default'])(delayThrow, catcherWrapper)(callback);
  },
  finallySyncMethod: function finallySyncMethod(callback) {
    return (0, _compose2['default'])(delayThrow, notThrowWrapper)(callback);
  }
};

function initPromisynch(callback) {

  (0, _invariant2['default'])(_whatitis2['default'].Function(callback), 'You must pass a resolver function as the first argument to the chain constructor');

  return function (resolve, reject) {
    try {
      callback(resolve, reject);
    } catch (err) {
      reject(err);
    }
  };
}

var Promisynch = function () {
  _createClass(Promisynch, null, [{
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
      if (_whatitis2['default'].Function(promisynch)) {
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
      if (_whatitis2['default'].Function(promisynch)) {
        var p = Promisynch.of(promisynch);
        p._bubble = true;
        return p;
      }
      promisynch._bubble = true;
      return promisynch;
    }
  }]);

  function Promisynch(resolver) {
    _classCallCheck(this, Promisynch);

    this.status = PENDING;
    this.value = null;
    this.funcs = null;
    initPromisynch(resolver)(this.resolve.bind(this), this.reject.bind(this));
  }

  _createClass(Promisynch, [{
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
        this.value = _whatitis2['default'].Defined(reason) ? reason : null;
        if (this.funcs) {
          arrow = this.funcs(arrow);
          if (_whatitis2['default'].Undefined(reason)) {
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

exports['default'] = Promisynch;