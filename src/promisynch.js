

import is from 'whatitis';
import kindOf from 'kind-of';
import invariant from 'invariant';
import METHOD from './METHOD';


// 状态
const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';


function initPromisynch( resolver, resolve, reject ) {

  invariant(
    is.Function( resolver ),
    `Promisynch resolver ${kindOf( resolver )} is not a function`
  );

  try {
    resolver( resolve, reject );
  } catch ( err ) {
    reject( err );
  }
}

class Promisynch {

  static of( resolver ) {
    return new Promisynch( resolver );
  }

  static resolve( value ) {
    return Promisynch.of( resolve => resolve( value ));
  }

  static reject( error ) {
    return Promisynch.of(( _, reject ) => reject( error ));
  }

  static all( psArray ) {
    // 代理对象
    return Promisynch.of(( resolve, reject ) => {
      // 复制数组
      const pss = Array.from( psArray );
      function checkAll( pss ) {
        // 监测全部运行完成之后才运行里面的内容
        if ( pss.every( ps => ps.getStatus() !== PENDING )) {
          const results = pss.map( ps => ps.getResult());
          if ( pss.some( ps => ps.getStatus() === REJECTED )) {
            reject( ...results );
          }
          resolve( ...results );
        }
      }
      pss.forEach( ps => {
        // 每个 promise 添加监测
        ps.finally(() => checkAll( pss )).catch(() => {});
      });
    });
  }

  static race( psArray ) {
    // 代理对象
    return Promisynch.of(( resolve, reject ) => {
      let checked = false;
      // 复制数组
      const pss = Array.from( psArray );
      function checkOne( pss ) {
        if ( !checked ) {
          const len = pss.filter( ps => ps.getStatus() !== PENDING ).length;
          if ( len === 1 ) {
            checked = true;
            const ps = pss.find( ps => ps.getStatus() !== PENDING );
            if ( ps.getStatus() === REJECTED ) {
              reject( ps.getResult());
            }
            resolve( ps.getResult());
          }
        }
      }
      pss.forEach( ps => {
        ps.finally(() => checkOne( pss )).catch(() => {});
      });
    });
  }

  constructor( resolver ) {

    this.result = undefined;
    this.status = PENDING;

    let chain = null;

    [ 'resolve', 'reject' ].forEach( func => {
      const body = this[func].bind( this );
      this[func] = function( ...args ) {
        return body( chain, ...args );
      };
    });

    [ 'then', 'catch', 'finally' ].forEach( func => {
      this[func] = callback => {
        if ( this._sync ) {
          this._set = METHOD[`${func}SyncMethod`]( callback )( this._set );
          this._result = this._set.result;
        } else {
          chain = METHOD[`${func}Method`]( chain, callback );
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

    initPromisynch( resolver, this.resolve, this.reject );
  }

  then( resolve, reject ) {
    if ( this.status === RESOLVED ) {
      resolve( this.result );
    } else if ( this.status === REJECTED ) {
      resolve( this.result );
    }
  }

  setStatus( status ) {
    this.status = status;
  }

  getStatus() {
    return this.status;
  }

  resolve( chain, ...value ) {
    if ( this._state === PENDING ) {
      this._result = getResult( value );
      this._state = RESOLVED;
      this._set = {
        err: null,
        result: undefined,
        argument: value,
        chain: this
      };
      if ( chain ) {
        this._set = chain( this._set );
        // this._result = this._set.result;
      } else {
        removeSet( this );
        this._sync = true;
      }
    }
    return this;
  }

  reject( chain, ...reason ) {
    if ( this._state === PENDING ) {
      this._result = getResult( reason );
      this._state = REJECTED;
      this._set = {
        err: reason,
        result: undefined,
        argument: reason,
        chain: this
      };
      if ( chain ) {
        this._set = chain( this._set );
        // this._result = this._set.result;
      } else {
        removeSet( this );
        this._sync = true;
      }
    }
    return this;
  }

}

export default Promisynch;
