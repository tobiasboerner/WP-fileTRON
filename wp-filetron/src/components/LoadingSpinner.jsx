/**
 * Loading Spinner Component
 */

import { __ } from '@wordpress/i18n';

export default function LoadingSpinner( { label } ) {
	const message = label || __( 'Loading WP fileTRON…', 'wp-filetron' );

	return (
		<div className="wft-flex wft-items-center wft-justify-center wft-py-12 wft-bg-gray-50">
			<div className="wft-text-center">
				<div className="wft-animate-spin wft-rounded-full wft-h-12 wft-w-12 wft-border-b-2 wft-border-blue-600 wft-mx-auto wft-mb-4"></div>
				<p className="wft-text-gray-600">{ message }</p>
			</div>
		</div>
	);
}

LoadingSpinner.defaultProps = {
	label: null,
};
