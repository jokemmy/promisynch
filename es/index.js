var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

import is from 'whatitis';
import invariant from 'invariant';
import compose from './compose';

// 状态
var PENDING = 'pending';
var FULFILLED = 'resolved';
var REJECTED = 'rejected';
var NOPE = function NOPE() {};

function setStatus(chain, status) {
  chain.status = status;
}

function createError(error) {
  return 'Unhandled Promisynch Rejection: ' + error;
}

// results 数组
// return undefined/单个/数组
function getValue(results) {
  return results.length === 0 ? null : results.length === 1 ? results[0] : results;
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
      throw createError(err);
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
        throw createError(err);
      });
      return Object.assign(resultSet, { err: err, timer: timer, result: [err] });
    }
  };
}

// use in finally method, catch a error and throw this error or throw the last error
function throwWapper(callback) {
  return function (resultSet) {
    callback.apply(undefined, [resultSet.err || null, resultSet.err ? null : resultSet.result].concat(_toConsumableArray(resultSet.argument)));
    if (resultSet.err) {
      throw createError(resultSet.err);
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
  finallyMethod: function finallyMethod(chains, callback) {
    var wrapped = compose(throwWapper)(callback);
    return chains ? compose(wrapped, tryWapper(chains)) : wrapped;
  },
  thenSyncMethod: function thenSyncMethod(callback) {
    return compose(delayThrow, setStatusWapper, thenerWrapper)(callback);
  },
  catchSyncMethod: function catchSyncMethod(callback) {
    return compose(delayThrow, catcherWrapper)(callback);
  },
  finallySyncMethod: function finallySyncMethod(callback) {
    return compose(delayThrow, notThrowWapper)(callback);
  }
};

function initPromisynch(callback) {

  invariant(is.Function(callback), 'You must pass a resolver function as the first argument to the chain constructor');

  return function (resolve, reject) {
    try {
      callback(resolve, reject);
    } catch (err) {
      reject(err);
    }
  };
}

// function removeSync( chain ) {
//   setTimeout(() => {
//     delete chain._sync;
//   });
// }


// function bindMethod( func ) {
//   return function( callback ) {
//     if ( this._sync ) {
//       this._set = METHOD[`${func}SyncMethod`]( callback )( this._set );
//       this.value = this._set.result;
//     } else {
//       this._funcs = METHOD[`${func}Method`]( this._funcs, callback );
//     }
//     return this;
//   };
// }


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
        });
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
        });
      });
      return promisynch;
    }
  }]);

  function Promisynch(resolver) {
    _classCallCheck(this, Promisynch);

    this.status = PENDING;
    this.value = null;
    this.funcs = null;

    // const resolve = ( ...value ) => {
    //   if ( this.status === PENDING ) {
    //     let arrow = {
    //       err: null,
    //       result: undefined,
    //       argument: value,
    //       chain: this
    //     };
    //     this.value = getValue( value );
    //     if ( this.funcs ) {
    //       arrow = this.funcs( arrow );
    //       if ( value.length > 0 ) {
    //         this.value = arrow.result;
    //       }
    //     }
    //     this.status = FULFILLED;
    //   }
    //   return this;
    // };

    // const reject = ( ...reason ) => {
    //   if ( this.status === PENDING ) {
    //     let arrow = {
    //       err: reason,
    //       result: undefined,
    //       argument: reason,
    //       chain: this
    //     };
    //     this.value = getValue( reason );
    //     if ( this.funcs ) {
    //       arrow = this.funcs( arrow );
    //       if ( reason.length > 0 ) {
    //         this.value = arrow.result;
    //       }
    //     }
    //     this.status = REJECTED;
    //   }
    //   return this;
    // };


    // [ 'resolve', 'reject' ].forEach( func => {
    //   const body = this[func].bind( this );
    //   this[func] = function( ...args ) {
    //     return body( funcs, ...args );
    //   };
    // });

    // [ 'then', 'catch', 'finally' ].forEach( func => {
    //   this[func] = callback => {
    //     if ( this._sync ) {
    //       this._set = METHOD[`${func}SyncMethod`]( callback )( this._set );
    //       this.value = this._set.result;
    //     } else {
    //       this._funcs = METHOD[`${func}Method`]( this._funcs, callback );
    //     }
    //     return this;
    //   };
    // });

    // const thenMethod = this.then;
    // const catchMethod = this.catch;
    // this.then = ( resolve, reject ) => {
    //   if ( is.Function( resolve )) {
    //     thenMethod( resolve );
    //   }
    //   if ( is.Function( reject )) {
    //     catchMethod( reject );
    //   }
    //   return this;
    // };

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

    // resolve( ...value ) {
    //   // 还没有结束
    //   if ( this.status === PENDING ) {
    //     this.value = getValue( value );
    //     this.status = FULFILLED;
    //     this._set = {
    //       err: null,
    //       result: undefined,
    //       argument: value,
    //       chain: this
    //     };
    //     if ( this._funcs ) {
    //       this._set = this._funcs( this._set );
    //     } else {
    //       removeSync( this );
    //       this._sync = true;
    //     }
    //   }
    //   return this;
    // }

    // reject( ...reason ) {
    //   if ( this.status === PENDING ) {
    //     this.value = getValue( reason );
    //     this.status = REJECTED;
    //     this._set = {
    //       err: reason,
    //       result: undefined,
    //       argument: reason,
    //       chain: this
    //     };
    //     if ( this._funcs ) {
    //       this._set = this._funcs( this._set );
    //     } else {
    //       removeSync( this );
    //       this._sync = true;
    //     }
    //   }
    //   return this;
    // }

  }]);

  return Promisynch;
}();

export default Promisynch;