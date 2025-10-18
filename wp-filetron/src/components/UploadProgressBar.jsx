/**
 * Upload Progress Bar Component
 */

import classNames from 'classnames';
import { __ } from '@wordpress/i18n';

export default function UploadProgressBar( {
	total,
	completed,
	errors,
	onClick,
} ) {
	if ( ! total ) {
		return null;
	}

	const percent = Math.round( ( completed / total ) * 100 );
	const hasErrors = errors > 0;
	let statusText = __( 'Uploading…', 'wp-filetron' );

	if ( hasErrors ) {
		statusText = __( 'Uploads completed with errors', 'wp-filetron' );
	} else if ( percent >= 100 ) {
		statusText = __( 'Uploads completed', 'wp-filetron' );
	}

	return (
		<button
			type="button"
			onClick={ onClick }
			className="wft-fixed wft-bottom-6 wft-right-6 wft-flex wft-items-center wft-gap-3 wft-bg-white wft-border wft-border-gray-200 wft-shadow-lg wft-rounded-full wft-pl-4 wft-pr-5 wft-py-3 hover:wft-shadow-xl wft-transition"
		>
			<div className="wft-w-40 wft-h-2 wft-bg-gray-200 wft-rounded-full">
				<div
					className={ classNames( 'wft-h-2 wft-rounded-full', {
						'wft-bg-blue-500': ! hasErrors,
						'wft-bg-red-500': hasErrors,
					} ) }
					style={ {
						width: `${ Math.min( 100, Math.max( 0, percent ) ) }%`,
					} }
				/>
			</div>
			<div className="wft-text-sm wft-font-medium wft-text-gray-700">
				{ statusText }
			</div>
		</button>
	);
}
