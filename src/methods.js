

import compose from './compose';
import { setStatusWapper, thenerWrapper, catcherWrapper, tryWapper,
 throwWapper, delayThrow, notThrowWapper } from './wrapper';

export const METHOD = {

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
