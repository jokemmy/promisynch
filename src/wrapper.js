

import is from 'whatitis';
import { REJECTED, RESOLVED } from './state';

function setStatus( ps, state ) {
  ps.state = state;
}

export function setStatusWapper( chain ) {
  return function( resultSet ) {
    try {
      setStatus( resultSet.chain, resultSet.err ? REJECTED : RESOLVED );
      return chain( resultSet );
    } catch ( err ) {
      resultSet.err = err;
      resultSet.result = [err];
      setStatus( resultSet.chain, REJECTED );
      throw err;
    }
  };
}


export function tryWapper( chain ) {
  return function( resultSet ) {
    try {
      return chain( resultSet );
    } catch ( err ) {
      return Object.assign( resultSet, { err, result: [err]});
    }
  };
}


export function delayThrow( chain ) {
  return function( resultSet ) {
    try {
      return chain( resultSet );
    } catch ( err ) {
      const timer = setTimeout(() => {
        throw err;
      });
      return Object.assign( resultSet, { err, timer, result: [err]});
    }
  };
}


// use in finally method, catch a error and throw this error or throw the last error
export function throwWapper( callback ) {
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


export function notThrowWapper( callback ) {
  return function( resultSet ) {
    callback(
      resultSet.err || null,
      resultSet.err ? null : resultSet.result,
      ...resultSet.argument
    );
    return resultSet;
  };
}


export function thenerWrapper( callback ) {
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


export function catcherWrapper( callback ) {
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
