

import is from 'whatitis';
import invariant from 'invariant';
import compose from './compose';


const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';


function setStatus( chain, status ) {
  chain._state = status;
}


function getResult( results ) {
  return results.length <= 1 ? results[0] : results;
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


// use in always method, catch a error and throw this error or throw the last error
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
  alwaysMethod( chains, callback ) {
    const wrapped = compose( throwWapper )( callback );
    return chains ? compose( wrapped, tryWapper( chains )) : wrapped;
  },
  thenSyncMethod( callback ) {
    return compose( delayThrow, setStatusWapper, thenerWrapper )( callback );
  },
  catchSyncMethod( callback ) {
    return compose( delayThrow, catcherWrapper )( callback );
  },
  alwaysSyncMethod( callback ) {
    return compose( delayThrow, notThrowWapper )( callback );
  }
};


function initChain( callback ) {

  invariant(
    is.Function( callback ),
    'Hope: You must pass a resolver function as the first argument to the chain constructor'
  );

  return function( resolve, reject ) {
    try {
      callback( resolve, reject );
    } catch ( err ) {
      reject( err );
    }
  };
}


function removeSet( chain ) {
  setTimeout(() => {
    delete chain._sync;
  });
}


class Chain {

  static of( resolver ) {
    return new Chain( resolver );
  }

  static resolve( value ) {
    return Chain.of( resolve => resolve( value ));
  }

  static reject( reason ) {
    return Chain.of(( _, reject ) => reject( reason ));
  }

  static all( chains_ ) {
    const chn = Chain.of(() => {});
    const chains = Array.from( chains_ );
    function checkAll( chs ) {
      if ( chs.every( chain => chain._state !== PENDING )) {
        const chainResults = chs.map( chain => chain._result );
        if ( chs.some( chain => chain._state === REJECTED )) {
          chn.reject( ...chainResults );
        }
        chn.resolve( ...chainResults );
      }
    }
    chains.forEach( chain => {
      chain.always(() => checkAll( chains )).catch(() => {});
    });
    return chn;
  }

  static race( chains_ ) {
    const chn = Chain.of(() => {});
    const chains = Array.from( chains_ );
    function checkOne( chs ) {
      if ( chs.some( chain => chain._state !== PENDING )) {
        const chain = chs.find( chain => chain._state !== PENDING );
        if ( chain._state === REJECTED ) {
          chn.reject( chain._result );
        }
        chn.resolve( chain._result );
      }
    }
    chains.forEach( chain => {
      chain.always(() => checkOne( chains )).catch(() => {});
    });
    return chn;
  }

  constructor( resolver ) {
    // this._sync = null;
    this._result = null;
    this._state = PENDING;

    let chains = null;
    const initialize = initChain( resolver );

    [ 'resolve', 'reject' ].forEach( func => {
      const body = this[func].bind( this );
      this[func] = function( ...args ) {
        return body( chains, ...args );
      };
    });

    [ 'then', 'catch', 'always' ].forEach( func => {
      this[func] = callback => {
        if ( this._sync ) {
          this._set = METHOD[`${func}SyncMethod`]( callback )( this._set );
          this._result = this._set.result;
        } else {
          chains = METHOD[`${func}Method`]( chains, callback );
        }
        return this;
      };
    });

    const thenMethod = this.then;
    const catchMethod = this.catch;
    this.then = ( resolve, reject ) => {
      if ( is.Function( resolve )) {
        thenMethod( resolve );
      }
      if ( is.Function( reject )) {
        catchMethod( reject );
      }
      return this;
    };

    initialize( this.resolve, this.reject );
  }

  resolve( chains, ...value ) {
    if ( this._state === PENDING ) {
      this._result = getResult( value );
      this._state = FULFILLED;
      this._set = {
        err: null,
        result: undefined,
        argument: value,
        chain: this
      };
      if ( chains ) {
        this._set = chains( this._set );
        // this._result = this._set.result;
      } else {
        removeSet( this );
        this._sync = true;
      }
    }
    return this;
  }

  reject( chains, ...reason ) {
    if ( this._state === PENDING ) {
      this._result = getResult( reason );
      this._state = REJECTED;
      this._set = {
        err: reason,
        result: undefined,
        argument: reason,
        chain: this
      };
      if ( chains ) {
        this._set = chains( this._set );
        // this._result = this._set.result;
      } else {
        removeSet( this );
        this._sync = true;
      }
    }
    return this;
  }

}

export default Chain;
