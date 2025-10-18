const baseConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [
		...( baseConfig.setupFilesAfterEnv || [] ),
		'<rootDir>/src/test-utils/setup-tests.js',
	],
};
