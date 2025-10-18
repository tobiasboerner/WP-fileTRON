const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

module.exports = {
	...baseConfig,
	testDir: './test-e2e/specs',
	outputDir: baseConfig.outputDir,
};
