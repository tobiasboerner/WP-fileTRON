/**
 * Upload Overlay Component
 *
 * Positioned overlay for the upload workflow.
 */

import classNames from 'classnames';

export default function UploadOverlay( { isOpen, onClose, children } ) {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<div className="wft-fixed wft-inset-0 wft-z-[1000] wft-flex wft-items-center wft-justify-center">
			<div
				className="wft-absolute wft-inset-0 wft-bg-gray-900 wft-bg-opacity-50"
				onClick={ onClose }
				role="presentation"
			/>
			<div
				className={ classNames(
					'wft-relative wft-z-[1001] wft-max-w-3xl wft-w-full wft-mx-4',
					'wft-bg-white wft-rounded-xl wft-shadow-2xl wft-border wft-border-gray-200'
				) }
			>
				{ children }
			</div>
		</div>
	);
}
