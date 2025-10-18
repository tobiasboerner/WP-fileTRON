/**
 * WP fileTRON - Main Entry Point
 *
 * @package
 */

import { render } from '@wordpress/element';
import App from './App';
import './styles/main.scss';

// Register the store (must be imported before App)
import './store';

// Wait for DOM to be ready.
document.addEventListener( 'DOMContentLoaded', () => {
	const rootElement = document.getElementById( 'wft-app' );

	if ( rootElement ) {
		render( <App />, rootElement );
	}
} );
