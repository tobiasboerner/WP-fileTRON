/**
 * WordPress Data Store
 *
 * Registers the WP fileTRON store with WordPress data module.
 */

import { register, createReduxStore } from '@wordpress/data';
import * as actions from './actions';
import * as selectors from './selectors';
import { reducer } from './reducer';

const STORE_NAME = 'wft/filetron';

const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

export { STORE_NAME };
export default store;
