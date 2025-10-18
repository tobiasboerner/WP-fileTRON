/**
 * Media Details Panel
 *
 * Displays a detailed preview for a selected media item and allows
 * editing of title, alt text, and description metadata.
 */

import {
	useEffect,
	useMemo,
	useState,
	useId,
	useCallback,
} from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import classNames from 'classnames';
import { STORE_NAME } from '../store';
import { mediaAPI } from '../api/endpoints';
import { SNACKBAR_TIMEOUT } from '../utils/snackbar';

function formatFileSize( bytes ) {
	if ( ! bytes && bytes !== 0 ) {
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
}

export default function MediaDetailsPanel( { item, onClose } ) {
	const dispatch = useDispatch( STORE_NAME );
	const { createNotice, removeNotice } = useDispatch( noticesStore );
	const preview = item?.large || item?.medium || item?.thumbnail || item?.url;
	const size = formatFileSize( item?.file_size );
	const uploaded = useMemo( () => {
		if ( ! item?.uploaded || Number.isNaN( Date.parse( item.uploaded ) ) ) {
			return null;
		}
		return new Date( item.uploaded ).toLocaleString();
	}, [ item?.uploaded ] );

	const [ title, setTitle ] = useState( item?.title || '' );
	const [ altText, setAltText ] = useState( item?.alt_text || '' );
	const [ description, setDescription ] = useState( item?.description || '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ saveError, setSaveError ] = useState( null );
	const [ saveSuccess, setSaveSuccess ] = useState( false );
	const titleId = useId();
	const altId = useId();
	const descriptionId = useId();

	const notify = useCallback(
		( status, message ) => {
			const noticeId = createNotice( status, message, {
				type: 'snackbar',
				explicitDismiss: true,
			} );

			if ( noticeId ) {
				setTimeout( () => {
					removeNotice?.( noticeId );
				}, SNACKBAR_TIMEOUT );
			}
		},
		[ createNotice, removeNotice ]
	);

	useEffect( () => {
		setTitle( item?.title || '' );
		setAltText( item?.alt_text || '' );
		setDescription( item?.description || '' );
		setSaveError( null );
		setSaveSuccess( false );
	}, [ item?.id, item?.title, item?.alt_text, item?.description ] );

	const hasChanges = useMemo( () => {
		return (
			title !== ( item?.title || '' ) ||
			altText !== ( item?.alt_text || '' ) ||
			description !== ( item?.description || '' )
		);
	}, [ title, altText, description, item ] );

	const handleSubmit = async ( event ) => {
		event.preventDefault();
		if ( ! item?.id || ! hasChanges || isSaving ) {
			return;
		}

		setIsSaving( true );
		setSaveError( null );
		setSaveSuccess( false );

		try {
			const payload = {
				title,
				alt_text: altText,
				description,
			};

			const response = await mediaAPI.update( item.id, payload );

			if ( response?.success && response?.data ) {
				dispatch.addMediaItem( response.data );
				setSaveSuccess( true );
				notify(
					'success',
					__( 'Media details updated.', 'wp-filetron' )
				);
			} else {
				throw new Error(
					response?.message || 'Failed to update media item'
				);
			}
		} catch ( error ) {
			setSaveError(
				error?.message || __( 'Failed to save changes.', 'wp-filetron' )
			);
			notify(
				'error',
				error?.message || __( 'Failed to save changes.', 'wp-filetron' )
			);
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<aside className="wft-bg-white wft-border wft-border-gray-200 wft-rounded-lg wft-shadow-sm wft-w-full lg:wft-w-80 wft-flex-shrink-0 wft-flex wft-flex-col">
			<div className="wft-flex wft-items-center wft-justify-between wft-px-4 wft-py-3 wft-border-b wft-border-gray-200">
				<h2 className="wft-text-sm wft-font-semibold wft-text-gray-900">
					{ __( 'File details', 'wp-filetron' ) }
				</h2>
				<button
					type="button"
					onClick={ onClose }
					className="wft-text-gray-500 hover:wft-text-gray-700 wft-text-sm wft-font-medium"
				>
					{ __( 'Close', 'wp-filetron' ) }
				</button>
			</div>

			<form
				onSubmit={ handleSubmit }
				className="wft-flex-1 wft-overflow-y-auto wft-p-4 wft-space-y-4"
			>
				{ preview ? (
					<div className="wft-rounded-md wft-overflow-hidden wft-bg-gray-100">
						<img
							src={ preview }
							alt={ item?.alt_text || item?.title || '' }
							className="wft-w-full wft-object-cover"
						/>
					</div>
				) : (
					<div className="wft-flex wft-h-40 wft-items-center wft-justify-center wft-rounded-md wft-bg-gray-100 wft-text-2xl wft-text-gray-400">
						📄
					</div>
				) }

				<div className="wft-space-y-2">
					<div>
						<h3 className="wft-text-base wft-font-semibold wft-text-gray-900 wft-truncate">
							{ item?.title ||
								item?.alt_text ||
								item?.url?.split( '/' ).pop() ||
								__( 'Untitled file', 'wp-filetron' ) }
						</h3>
						<p className="wft-text-xs wft-text-gray-500 wft-truncate">
							{ item?.url ||
								__( 'Missing source URL', 'wp-filetron' ) }
						</p>
					</div>

					<dl className="wft-space-y-2 wft-text-sm">
						{ item?.mime_type && (
							<div className="wft-flex wft-items-start wft-justify-between wft-gap-2">
								<dt className="wft-text-gray-500">
									{ __( 'Type', 'wp-filetron' ) }
								</dt>
								<dd className="wft-text-gray-900">
									{ item.mime_type }
								</dd>
							</div>
						) }

						{ size && (
							<div className="wft-flex wft-items-start wft-justify-between wft-gap-2">
								<dt className="wft-text-gray-500">
									{ __( 'Size', 'wp-filetron' ) }
								</dt>
								<dd className="wft-text-gray-900">{ size }</dd>
							</div>
						) }

						{ item?.dimensions && (
							<div className="wft-flex wft-items-start wft-justify-between wft-gap-2">
								<dt className="wft-text-gray-500">
									{ __( 'Dimensions', 'wp-filetron' ) }
								</dt>
								<dd className="wft-text-gray-900">
									{ item.dimensions }
								</dd>
							</div>
						) }

						{ uploaded && (
							<div className="wft-flex wft-items-start wft-justify-between wft-gap-2">
								<dt className="wft-text-gray-500">
									{ __( 'Uploaded', 'wp-filetron' ) }
								</dt>
								<dd className="wft-text-gray-900">
									{ uploaded }
								</dd>
							</div>
						) }

						{ item?.folder_name && (
							<div className="wft-flex wft-items-start wft-justify-between wft-gap-2">
								<dt className="wft-text-gray-500">
									{ __( 'Folder', 'wp-filetron' ) }
								</dt>
								<dd className="wft-text-gray-900">
									{ item.folder_name }
								</dd>
							</div>
						) }
					</dl>
				</div>

				<div className="wft-space-y-4">
					<div>
						<label
							htmlFor={ titleId }
							className="wft-block wft-text-xs wft-font-medium wft-text-gray-500 wft-mb-1"
						>
							{ __( 'Title', 'wp-filetron' ) }
						</label>
						<input
							id={ titleId }
							type="text"
							className="wft-w-full wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
							value={ title }
							onChange={ ( event ) => {
								setTitle( event.target.value );
								setSaveSuccess( false );
								setSaveError( null );
							} }
						/>
					</div>

					<div>
						<label
							htmlFor={ altId }
							className="wft-block wft-text-xs wft-font-medium wft-text-gray-500 wft-mb-1"
						>
							{ __( 'Alt text', 'wp-filetron' ) }
						</label>
						<input
							id={ altId }
							type="text"
							className="wft-w-full wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
							value={ altText }
							onChange={ ( event ) => {
								setAltText( event.target.value );
								setSaveSuccess( false );
								setSaveError( null );
							} }
							placeholder={ __(
								'Explain the media for assistive technology…',
								'wp-filetron'
							) }
						/>
					</div>

					<div>
						<label
							htmlFor={ descriptionId }
							className="wft-block wft-text-xs wft-font-medium wft-text-gray-500 wft-mb-1"
						>
							{ __( 'Description', 'wp-filetron' ) }
						</label>
						<textarea
							id={ descriptionId }
							className="wft-w-full wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
							rows={ 4 }
							value={ description }
							onChange={ ( event ) => {
								setDescription( event.target.value );
								setSaveSuccess( false );
								setSaveError( null );
							} }
						/>
					</div>

					{ saveError && (
						<div className="wft-rounded-md wft-border wft-border-red-200 wft-bg-red-50 wft-px-3 wft-py-2 wft-text-sm wft-text-red-700">
							{ saveError }
						</div>
					) }

					{ saveSuccess && ! hasChanges && (
						<div className="wft-rounded-md wft-border wft-border-green-200 wft-bg-green-50 wft-px-3 wft-py-2 wft-text-sm wft-text-green-700">
							{ __( 'Changes saved.', 'wp-filetron' ) }
						</div>
					) }
				</div>

				<div className="wft-flex wft-gap-2">
					<button
						type="button"
						className={ classNames(
							'wft-flex-1 wft-inline-flex wft-items-center wft-justify-center wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100',
							{ 'wft-opacity-60': ! item?.url }
						) }
						disabled={ ! item?.url }
						onClick={ () => {
							if ( item?.url && typeof window !== 'undefined' ) {
								window.open( item.url, '_blank', 'noopener' );
							}
						} }
					>
						{ __( 'Open file', 'wp-filetron' ) }
					</button>
					<button
						type="submit"
						className="wft-inline-flex wft-items-center wft-justify-center wft-rounded-md wft-bg-blue-600 wft-px-3 wft-py-2 wft-text-sm wft-font-medium wft-text-white hover:wft-bg-blue-700 disabled:wft-opacity-60"
						disabled={ isSaving || ! hasChanges }
					>
						{ isSaving
							? __( 'Saving…', 'wp-filetron' )
							: __( 'Save changes', 'wp-filetron' ) }
					</button>
					<button
						type="button"
						className="wft-inline-flex wft-items-center wft-justify-center wft-rounded-md wft-bg-gray-100 wft-px-3 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-200"
						onClick={ onClose }
					>
						{ __( 'Done', 'wp-filetron' ) }
					</button>
				</div>
			</form>
		</aside>
	);
}
