var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

import is from 'whatitis';
import invariant from 'invariant';
import compose from './compose';

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
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(_toConsumableArray(resultSet.argument)));
    if (resultSet.err) {
      throw resultSet.err;
    }
    return resultSet;
  };
}

function notThrowWapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(_toConsumableArray(resultSet.argument)));
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
      resultSet.result = callback.apply(undefined, _toConsumableArray(resultSet.argument));
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

  invariant(is.Function(callback), 'Hope: You must pass a resolver function as the first argument to the chain constructor');

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
  _createClass(Chain, null, [{
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
            chn.reject.apply(chn, _toConsumableArray(chainResults));
          }
          chn.resolve.apply(chn, _toConsumableArray(chainResults));
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

    _classCallCheck(this, Chain);

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

  _createClass(Chain, [{
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

export default Chain;