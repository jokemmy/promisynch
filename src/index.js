

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

// results 数组
// return undefined/单个/数组
function getValue( results ) {
  return results.length === 0
    ? null : results.length === 1
    ? results[0] : results;
}


function setStatusWapper( chains ) {
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


function tryWapper( chains ) {
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
function throwWapper( callback ) {
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


function notThrowWapper( callback ) {
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
    const wrapped = compose( setStatusWapper, thenerWrapper )( callback );
    return chains ? compose( wrapped, chains ) : wrapped;
  },
  catchMethod( chains, callback ) {
    const wrapped = compose( catcherWrapper )( callback );
    return chains ? compose( wrapped, tryWapper( chains )) : wrapped;
  },
  finallyMethod( chains, callback ) {
    const wrapped = compose( throwWapper )( callback );
    return chains ? compose( wrapped, tryWapper( chains )) : wrapped;
  },
  thenSyncMethod( callback ) {
    return compose( delayThrow, setStatusWapper, thenerWrapper )( callback );
  },
  catchSyncMethod( callback ) {
    return compose( delayThrow, catcherWrapper )( callback );
  },
  finallySyncMethod( callback ) {
    return compose( delayThrow, notThrowWapper )( callback );
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
      if ( psArray.every( promisynch => promisynch.status !== PENDING )) {
        const psResults = psArray.map( psResult => psResult.value );
        if ( psArray.some( promisynch => promisynch.status === REJECTED )) {
          promisynch.reject( psResults );
        }
        promisynch.resolve( psResults );
      }
    }
    psArray.forEach( promisynch => {
      promisynch.finally(() => checkAll( psArray )).catch(() => {});
    });
    return promisynch;
  }

  static race( promisynchArray ) {
    const promisynch = Promisynch.of();
    const psArray = Array.from( promisynchArray );
    function checkOne( psArray ) {
      if ( psArray.some( ps => ps.status !== PENDING )) {
        const ps = psArray.find( ps => ps.status !== PENDING );
        if ( ps.status === REJECTED ) {
          promisynch.reject( ps.value );
        }
        promisynch.resolve( ps.value );
      }
    }
    psArray.forEach( promisynch => {
      promisynch.finally(() => checkOne( psArray )).catch(() => {});
    });
    return promisynch;
  }

  constructor( resolver ) {

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

    initPromisynch( resolver )( this.resolve, this.reject );
  }

  resolve( ...value ) {
    if ( this.status === PENDING ) {
      let arrow = {
        err: null,
        result: undefined,
        argument: value,
        chain: this
      };
      this.value = getValue( value );
      if ( this.funcs ) {
        arrow = this.funcs( arrow );
        if ( value.length > 0 ) {
          this.value = arrow.result;
        }
      }
      this.status = FULFILLED;
    }
    return this;
  }

  reject( ...reason ) {
    if ( this.status === PENDING ) {
      let arrow = {
        err: reason,
        result: undefined,
        argument: reason,
        chain: this
      };
      this.value = getValue( reason );
      if ( this.funcs ) {
        arrow = this.funcs( arrow );
        if ( reason.length > 0 ) {
          this.value = arrow.result;
        }
      }
      this.status = REJECTED;
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

}

export default Promisynch;
