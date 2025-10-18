/**
 * Media Preview Modal
 *
 * Lightweight modal to display a single media item with key metadata.
 */

import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const formatFileSize = ( bytes ) => {
	if ( bytes === null || bytes === undefined ) {
		return '';
	}

	const threshold = 1024;
	if ( Math.abs( bytes ) < threshold ) {
		return `${ bytes } B`;
	}

	const units = [ 'KB', 'MB', 'GB', 'TB' ];
	let size = bytes;
	let unitIndex = -1;

	do {
		size /= threshold;
		unitIndex++;
	} while ( Math.abs( size ) >= threshold && unitIndex < units.length - 1 );

	return `${ size.toFixed( 1 ) } ${ units[ unitIndex ] }`;
};

export default function MediaPreviewModal( { item, onRequestClose } ) {
	if ( ! item ) {
		return null;
	}

	const preview =
		item?.large || item?.medium || item?.thumbnail || item?.url || '';
	const fileName =
		item?.title ||
		item?.alt_text ||
		item?.url?.split( '/' ).pop() ||
		__( 'Untitled file', 'wp-filetron' );

	return (
		<Modal
			title={ __( 'File preview', 'wp-filetron' ) }
			onRequestClose={ onRequestClose }
			className="wft-filetron-modal"
		>
			<div
				className="wft-space-y-4"
				data-testid="wft-preview-modal"
			>
				<div className="wft-rounded-md wft-overflow-hidden wft-bg-gray-100">
					{ preview ? (
						<img
							src={ preview }
							alt={ item?.alt_text || fileName }
							className="wft-w-full wft-object-contain"
						/>
					) : (
						<div className="wft-flex wft-h-48 wft-items-center wft-justify-center wft-text-2xl wft-text-gray-400">
							📄
						</div>
					) }
				</div>

				<div className="wft-space-y-1">
					<h2 className="wft-text-lg wft-font-semibold wft-text-gray-900 wft-truncate">
						{ fileName }
					</h2>
					<p className="wft-text-xs wft-text-gray-500 wft-truncate">
						{ item?.url ||
							__( 'Source URL unavailable', 'wp-filetron' ) }
					</p>
				</div>

				<dl className="wft-grid wft-grid-cols-2 wft-gap-2 wft-text-sm">
					{ item?.mime_type && (
						<>
							<dt className="wft-text-gray-500">
								{ __( 'Type', 'wp-filetron' ) }
							</dt>
							<dd className="wft-text-gray-900">
								{ item.mime_type }
							</dd>
						</>
					) }
					{ item?.file_size && (
						<>
							<dt className="wft-text-gray-500">
								{ __( 'Size', 'wp-filetron' ) }
							</dt>
							<dd className="wft-text-gray-900">
								{ formatFileSize( item.file_size ) }
							</dd>
						</>
					) }
					{ item?.folder_id !== undefined && (
						<>
							<dt className="wft-text-gray-500">
								{ __( 'Folder ID', 'wp-filetron' ) }
							</dt>
							<dd className="wft-text-gray-900">
								{ Number( item.folder_id ) || 0 }
							</dd>
						</>
					) }
					{ item?.uploaded && (
						<>
							<dt className="wft-text-gray-500">
								{ __( 'Uploaded', 'wp-filetron' ) }
							</dt>
							<dd className="wft-text-gray-900">
								{ new Date( item.uploaded ).toLocaleString() }
							</dd>
						</>
					) }
				</dl>

				<div className="wft-flex wft-justify-end">
					<Button
						variant="secondary"
						onClick={ onRequestClose }
						data-testid="wft-preview-close"
					>
						{ __( 'Close', 'wp-filetron' ) }
					</Button>
				</div>
			</div>
		</Modal>
	);
}
