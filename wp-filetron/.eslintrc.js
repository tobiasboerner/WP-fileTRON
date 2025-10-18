module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	overrides: [
		{
			files: [ 'src/**/*.test.js', 'src/**/*.test.jsx' ],
			env: {
				jest: true,
				browser: true,
			},
			globals: {
				jest: 'readonly',
				React: 'readonly',
			},
		},
		{
			files: [ 'test-e2e/**/*.spec.js' ],
			env: {
				jest: true,
				browser: true,
			},
			globals: {
				page: 'readonly',
				browser: 'readonly',
				context: 'readonly',
			},
		},
	],
	rules: {
		// Customize rules as needed
		'@wordpress/no-unsafe-wp-apis': 'warn',
		'jsdoc/require-param-description': 'off',
		'jsdoc/require-returns-description': 'off',
		'no-console': 'warn',
	},
};
