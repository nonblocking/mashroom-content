
import {createStore, compose, applyMiddleware} from 'redux';
import {thunk} from 'redux-thunk';
import reducers from './reducers';

import type {Store} from '../types';

// Enable redux devtools
const composeEnhancers = (process.env.NODE_ENV !== 'production' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

const store: () => Store = () => createStore(
    reducers,
    undefined,
    composeEnhancers(applyMiddleware(thunk)));

export default store;
