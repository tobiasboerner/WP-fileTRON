#!/usr/bin/env node

/**
 * Wrapper to ensure Playwright stores browsers inside the project so that
 * sandboxed environments permit downloads.
 */

const { spawn } = require( 'child_process' );
const path = require( 'path' );

const playwrightCache = path.resolve(
	__dirname,
	'../node_modules/.cache/ms-playwright'
);

process.env.PLAYWRIGHT_BROWSERS_PATH =
	process.env.PLAYWRIGHT_BROWSERS_PATH || playwrightCache;

const child = spawn(
	'wp-scripts',
	[ 'test-playwright', ...process.argv.slice( 2 ) ],
	{
		stdio: 'inherit',
		env: process.env,
	}
);

child.on( 'exit', ( code, signal ) => {
	if ( typeof code === 'number' ) {
		process.exit( code );
	}

	if ( signal ) {
		process.kill( process.pid, signal );
	}
} );
