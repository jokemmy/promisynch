

import is from 'whatitis';
import invariant from 'invariant';
import compose from './compose';


// 状态
const PENDING = 'pending';
const FULFILLED = 'resolved';
const REJECTED = 'rejected';
const NOPE = () => {};

function setStatus( chain, status ) {
  chain.status = status;
}

// function createError( error  ) {
//   return `Unhandled Promisynch Rejection: ${error}`;
// }

// results 数组
// return undefined/单个/数组
function getValue( results ) {
  return results.length === 0
    ? null : results.length === 1
    ? results[0] : results;
}


function setStatusWrapper( chains ) {
  return function( resultSet ) {
    try {
      setStatus( resultSet.chain, resultSet.err ? REJECTED : FULFILLED );
      return chains( resultSet );
    } catch ( err ) {
      resultSet.err = err;
      resultSet.result = [err];
      setStatus( resultSet.chain, REJECTED );
      throw err;
    }
  };
}


function tryWrapper( chains ) {
  return function( resultSet ) {
    try {
      return chains( resultSet );
    } catch ( err ) {
      return Object.assign( resultSet, { err, result: [err]});
    }
  };
}


function delayThrow( chains ) {
  return function( resultSet ) {
    try {
      return chains( resultSet );
    } catch ( err ) {
      const timer = setTimeout(() => {
        throw err;
      });
      return Object.assign( resultSet, { err, timer, result: [err]});
    }
  };
}


// use in finally method, catch a error and throw this error or throw the last error
function throwWrapper( callback ) {
  return function( resultSet ) {
    callback(
      resultSet.err || null,
      resultSet.err ? null : resultSet.result,
      ...resultSet.argument
    );
    if ( resultSet.err ) {
      throw resultSet.err;
    }
    return resultSet;
  };
}


function notThrowWrapper( callback ) {
  return function( resultSet ) {
    callback(
      resultSet.err || null,
      resultSet.err ? null : resultSet.result,
      ...resultSet.argument
    );
    return resultSet;
  };
}


function thenerWrapper( callback ) {
  return function handler( resultSet_ ) {
    const resultSet = Object.assign({}, resultSet_ );

    if ( resultSet.err ) {
      return resultSet;
    }

    if ( is.Defined( resultSet.result )) {
      resultSet.result = callback( resultSet.result );
    } else {
      resultSet.result = callback( ...resultSet.argument );
    }

    return resultSet;
  };
}


function catcherWrapper( callback ) {
  return function handler( resultSet_ ) {
    const resultSet = Object.assign({}, resultSet_ );

    if ( !resultSet.err ) {
      return resultSet;
    }

    if ( resultSet.timer ) {
      clearTimeout( resultSet.timer );
      delete resultSet.timer;
    }

    resultSet.result = callback( resultSet.err );
    return Object.assign( resultSet, { err: null });
  };
}


const METHOD = {
  thenMethod( chains, callback ) {
    const wrapped = compose( setStatusWrapper, thenerWrapper )( callback );
    return chains ? compose( wrapped, chains ) : wrapped;
  },
  catchMethod( chains, callback ) {
    const wrapped = compose( catcherWrapper )( callback );
    return chains ? compose( wrapped, tryWrapper( chains )) : wrapped;
  },
  finallyMethod( chains, callback ) {
    const wrapped = compose( throwWrapper )( callback );
    return chains ? compose( wrapped, tryWrapper( chains )) : wrapped;
  },
  thenSyncMethod( callback ) {
    return compose( delayThrow, setStatusWrapper, thenerWrapper )( callback );
  },
  catchSyncMethod( callback ) {
    return compose( delayThrow, catcherWrapper )( callback );
  },
  finallySyncMethod( callback ) {
    return compose( delayThrow, notThrowWrapper )( callback );
  }
};


function initPromisynch( callback ) {

  invariant(
    is.Function( callback ),
    'You must pass a resolver function as the first argument to the chain constructor'
  );

  return function( resolve, reject ) {
    try {
      callback( resolve, reject );
    } catch ( err ) {
      reject( err );
    }
  };
}


class Promisynch {

  static of( resolver ) {
    return new Promisynch( resolver || NOPE );
  }

  static resolve( value ) {
    return Promisynch.of( onResolve => onResolve( value ));
  }

  static reject( reason ) {
    return Promisynch.of(( _, onReject ) => onReject( reason ));
  }

  static all( promisynchArray ) {
    const promisynch = Promisynch.of();
    const psArray = Array.from( promisynchArray );
    function checkAll( psArray ) {
      if ( promisynch.status === PENDING ) {
        // 发生错误提前返回
        if ( psArray.some( ps => ps.status === REJECTED )) {
          const ps = psArray.find( ps => ps.status === REJECTED );
          promisynch.reject( ps.value );
        } else if ( psArray.every( ps => ps.status !== PENDING )) {
          // 所有完成并且没有发生错误,返回所有结果
          promisynch.resolve( psArray.map( psResult => psResult.value ));
        }
      }
    }
    psArray.forEach( ps => {
      ps.finally(() => checkAll( psArray )).catch( NOPE );
    });
    return promisynch;
  }

  static race( promisynchArray ) {
    const promisynch = Promisynch.of();
    const psArray = Array.from( promisynchArray );
    function checkOne( psArray ) {
      if ( promisynch.status === PENDING ) {
        // if ( psArray.some( ps => ps.status !== PENDING )) {
          const ps = psArray.find( ps => ps.status !== PENDING );
          if ( ps.status === REJECTED ) {
            promisynch.reject( ps.value );
          } else {
            promisynch.resolve( ps.value );
          }
        // }
      }
    }
    psArray.forEach( ps => {
      ps.finally(() => checkOne( psArray )).catch( NOPE );
    });
    return promisynch;
  }

  constructor( resolver ) {

    this.status = PENDING;
    this.value = null;
    this.funcs = null;

    initPromisynch( resolver )( this.resolve.bind( this ), this.reject.bind( this ));
  }

  resolve( ...value ) {
    if ( this.status === PENDING ) {
      this.status = FULFILLED;
      let arrow = {
        err: null,
        result: undefined,
        argument: value,
        chain: this
      };
      this.value = getValue( value );
      if ( this.funcs ) {
        arrow = this.funcs( arrow );
        if ( value.length === 0 ) {
          this.value = arrow.result;
        }
        delete this.funcs;
      } else {
        this._set = arrow;
      }
    }
    return this;
  }

  reject( reason ) {
    if ( this.status === PENDING ) {
      this.status = REJECTED;
      let arrow = {
        err: reason,
        result: undefined,
        argument: [reason],
        chain: this
      };
      this.value = is.Defined( reason ) ? reason : null;
      if ( this.funcs ) {
        arrow = this.funcs( arrow );
        if ( is.Undefined( reason )) {
          this.value = arrow.result;
        }
        delete this.funcs;
      } else {
        this._set = arrow;
      }
    }
    return this;
  }

  then( onResolve, onReject ) {
    if ( this.status === PENDING ) {
      if ( onResolve ) {
        this.funcs = METHOD.thenMethod( this.funcs, onResolve );
      }
      if ( onReject ) {
        this.funcs = METHOD.catchMethod( this.funcs, onReject );
      }
    } else {
      if ( onResolve ) {
        this._set = METHOD.thenSyncMethod( onResolve )( this._set );
        this.value = this._set.result;
      }
      if ( onReject ) {
        this._set = METHOD.catchSyncMethod( onReject )( this._set );
        this.value = this._set.result;
      }
    }
    return this;
  }

  catch( onReject ) {
    if ( this.status === PENDING ) {
      if ( onReject ) {
        this.funcs = METHOD.catchMethod( this.funcs, onReject );
      }
    } else {
      if ( onReject ) {
        this._set = METHOD.catchSyncMethod( onReject )( this._set );
        this.value = this._set.result;
      }
    }
    return this;
  }

  finally( onFinally ) {
    if ( this.status === PENDING ) {
      if ( onFinally ) {
        this.funcs = METHOD.finallyMethod( this.funcs, onFinally );
      }
    } else {
      if ( onFinally ) {
        this._set = METHOD.finallySyncMethod( onFinally )( this._set );
        this.value = this._set.result;
      }
    }
    return this;
  }
}

export default Promisynch;
