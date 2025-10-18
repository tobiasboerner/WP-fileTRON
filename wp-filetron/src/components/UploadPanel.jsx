/**
 * Upload Panel Component
 *
 * Drag-and-drop upload queue backed by the REST API and Redux store.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useId,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import classNames from 'classnames';
import { STORE_NAME } from '../store';
import { mediaAPI } from '../api/endpoints';
import { SNACKBAR_TIMEOUT } from '../utils/snackbar';

const MAX_PARALLEL_UPLOADS = 3;

export default function UploadPanel( { onClose } ) {
	const {
		setUploadQueue,
		setUploadOverlayVisible,
		addMediaItem,
		setMedia,
		setError: setStoreError,
	} = useDispatch( STORE_NAME );
	const { createNotice, removeNotice } = useDispatch( noticesStore );

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
	const { selectedFolder, currentPage } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const pagination = store.getMediaPagination
			? store.getMediaPagination()
			: { currentPage: 1 };

		return {
			selectedFolder: store.getSelectedFolder(),
			currentPage: pagination.currentPage || 1,
		};
	}, [] );
	const queue = useSelect( ( select ) =>
		select( STORE_NAME ).getUploadQueue
			? select( STORE_NAME ).getUploadQueue()
			: []
	);

	const queueList = useMemo( () => {
		return Array.isArray( queue ) ? queue : [];
	}, [ queue ] );
	const queueRef = useRef( queueList );

	useEffect( () => {
		queueRef.current = queueList;
	}, [ queueList ] );

	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const [ isUploading, setIsUploading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ successMessage, setSuccessMessage ] = useState( '' );
	const fileInputId = useId();

	const pendingItems = useMemo(
		() => queueList.filter( ( item ) => item.status === 'pending' ),
		[ queueList ]
	);

	const updateQueue = useCallback(
		( updater ) => {
			const baseQueue = queueRef.current.slice();
			let nextQueue;
			if ( typeof updater === 'function' ) {
				nextQueue = updater( baseQueue );
			} else if ( Array.isArray( updater ) ) {
				nextQueue = updater;
			} else {
				nextQueue = baseQueue;
			}
			queueRef.current = nextQueue;
			setUploadQueue( nextQueue );
		},
		[ setUploadQueue ]
	);

	const handleFilesAdded = useCallback(
		( files ) => {
			const fileArray = Array.from( files );
			if ( ! fileArray.length ) {
				return;
			}

			const newItems = fileArray.map( ( file ) => ( {
				id: `${ file.name }-${ file.size }-${
					file.lastModified
				}-${ Math.random() }`,
				file,
				progress: 0,
				status: 'pending',
			} ) );

			updateQueue( ( prev ) => [ ...prev, ...newItems ] );
		},
		[ updateQueue ]
	);

	const handleDrop = useCallback(
		( event ) => {
			event.preventDefault();
			handleFilesAdded( event.dataTransfer.files );
			setIsDraggingOver( false );
		},
		[ handleFilesAdded ]
	);

	const handleDragOver = useCallback( ( event ) => {
		event.preventDefault();
		setIsDraggingOver( true );
	}, [] );

	const handleDragLeave = useCallback( ( event ) => {
		if ( event.target === event.currentTarget ) {
			setIsDraggingOver( false );
		}
	}, [] );

	const handleClose = useCallback( () => {
		setUploadOverlayVisible( false );
		onClose?.();
	}, [ setUploadOverlayVisible, onClose ] );

	const handleClearQueue = useCallback( () => {
		updateQueue( [] );
		setSuccessMessage( '' );
		setError( null );
	}, [ updateQueue ] );

	const refreshMediaListing = useCallback( async () => {
		try {
			const params = { page: currentPage };
			if ( selectedFolder ) {
				params.folder_id = selectedFolder;
			}

			const response = await mediaAPI.getAll( params );
			if ( response?.success && response?.data ) {
				const {
					items = [],
					total = 0,
					total_pages: totalPages = 0,
					current_page: responsePage = currentPage,
				} = response.data;
				setMedia( items, total, totalPages, responsePage );
			}
		} catch ( fetchError ) {
			const message =
				fetchError?.message ||
				__( 'Failed to refresh media library.', 'wp-filetron' );
			setStoreError(
				message ||
					__( 'Failed to refresh media library.', 'wp-filetron' )
			);
			notify( 'error', message );
		}
	}, [ currentPage, notify, selectedFolder, setMedia, setStoreError ] );

	const flushQueue = useCallback( async () => {
		if ( isUploading ) {
			return;
		}

		const snapshot = queueRef.current.filter(
			( item ) => item.status === 'pending'
		);
		if ( ! snapshot.length ) {
			return;
		}

		setIsUploading( true );
		setError( null );
		setSuccessMessage( '' );

		let hadErrors = false;
		let successfulUploads = 0;
		let firstErrorMessage = '';

		const runUpload = async ( item ) => {
			try {
				updateQueue( ( prev ) =>
					prev.map( ( entry ) =>
						entry.id === item.id
							? {
									...entry,
									status: 'uploading',
									progress: Math.max( entry.progress, 5 ),
							  }
							: entry
					)
				);

				const formData = new FormData();
				formData.append( 'file', item.file );
				if ( selectedFolder ) {
					formData.append( 'folder_id', selectedFolder );
				}

				const response = await mediaAPI.upload( formData );

				if ( response?.success && response?.data ) {
					addMediaItem( response.data );
					successfulUploads += 1;
				} else {
					throw new Error( __( 'Upload failed', 'wp-filetron' ) );
				}

				updateQueue( ( prev ) =>
					prev.map( ( entry ) =>
						entry.id === item.id
							? { ...entry, status: 'completed', progress: 100 }
							: entry
					)
				);
			} catch ( uploadError ) {
				hadErrors = true;
				const message =
					uploadError.message || __( 'Upload failed', 'wp-filetron' );
				if ( ! firstErrorMessage ) {
					firstErrorMessage = message;
				}
				setError( message );
				updateQueue( ( prev ) =>
					prev.map( ( entry ) =>
						entry.id === item.id
							? {
									...entry,
									status: 'error',
									progress: 0,
									error: message,
							  }
							: entry
					)
				);
			}
		};

		const batches = [];
		for ( let i = 0; i < snapshot.length; i += MAX_PARALLEL_UPLOADS ) {
			const slice = snapshot.slice( i, i + MAX_PARALLEL_UPLOADS );
			if ( slice.length ) {
				batches.push( slice );
			}
		}

		for ( const batch of batches ) {
			// eslint-disable-next-line no-await-in-loop
			await Promise.all( batch.map( runUpload ) );
		}

		setIsUploading( false );

		if ( successfulUploads > 0 ) {
			await refreshMediaListing();
			const successNotice = sprintf(
				/* translators: %s is the number of files uploaded successfully. */
				_n(
					'%s file uploaded successfully.',
					'%s files uploaded successfully.',
					successfulUploads,
					'wp-filetron'
				),
				successfulUploads
			);
			notify( 'success', successNotice );
			if ( ! hadErrors ) {
				setSuccessMessage(
					__( 'All uploads completed successfully.', 'wp-filetron' )
				);
			}
		}

		if ( hadErrors ) {
			const errorNotice =
				firstErrorMessage ||
				__(
					'Some uploads failed. Check the queue for more details.',
					'wp-filetron'
				);
			notify( 'error', errorNotice );
		}
	}, [
		addMediaItem,
		notify,
		isUploading,
		refreshMediaListing,
		selectedFolder,
		updateQueue,
	] );

	useEffect( () => {
		if ( ! isUploading && pendingItems.length > 0 ) {
			flushQueue();
		}
	}, [ flushQueue, isUploading, pendingItems.length ] );

	useEffect( () => {
		if ( ! isUploading && queueList.length === 0 ) {
			setError( null );
		}
	}, [ queueList, isUploading ] );

	const handleFileInputChange = useCallback(
		( event ) => {
			handleFilesAdded( event.target.files );
			event.target.value = '';
		},
		[ handleFilesAdded ]
	);

	const total = queueList.length;
	const completed = queueList.filter(
		( item ) => item.status === 'completed'
	).length;
	const hasActiveUploads = queueList.some(
		( item ) => item.status === 'uploading' || item.status === 'pending'
	);

	return (
		<div className="wft-bg-white wft-rounded-xl wft-shadow-xl wft-overflow-hidden wft-flex wft-flex-col wft-max-h-[90vh]">
			<div className="wft-flex wft-items-start wft-justify-between wft-px-6 wft-py-6 wft-border-b wft-border-gray-100">
				<div>
					<h3 className="wft-text-base wft-font-semibold wft-text-gray-900">
						{ __( 'Upload files', 'wp-filetron' ) }
					</h3>
					<p className="wft-text-sm wft-text-gray-600">
						{ __(
							'Drag files here or choose files to upload. Each file will be stored in the selected folder.',
							'wp-filetron'
						) }
					</p>
				</div>
				<button
					type="button"
					onClick={ handleClose }
					className="wft-text-gray-500 hover:wft-text-gray-700"
				>
					✕
				</button>
			</div>

			<div className="wft-flex-1 wft-overflow-y-auto wft-px-6 wft-pt-6 wft-pb-4 wft-space-y-4">
				<div
					className={ classNames(
						'wft-border wft-border-dashed wft-border-gray-300 wft-rounded-lg wft-p-8 wft-text-center wft-transition-colors',
						{
							'wft-border-blue-400 wft-bg-blue-50':
								isDraggingOver,
							'wft-bg-gray-50': ! isDraggingOver,
						}
					) }
					onDrop={ handleDrop }
					onDragOver={ handleDragOver }
					onDragLeave={ handleDragLeave }
				>
					<p className="wft-text-sm wft-text-gray-600">
						{ __( 'Drop files here', 'wp-filetron' ) }
					</p>
					<p className="wft-text-xs wft-text-gray-500 wft-mt-2">
						{ __(
							'JPEG, PNG, GIF, PDF up to your site limit.',
							'wp-filetron'
						) }
					</p>
					<div className="wft-mt-4">
						<label
							htmlFor={ fileInputId }
							className="wft-inline-flex wft-items-center wft-px-4 wft-py-2 wft-bg-white wft-border wft-border-gray-300 wft-rounded-md wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100 wft-cursor-pointer"
						>
							{ __( 'Choose files', 'wp-filetron' ) }
							<input
								id={ fileInputId }
								type="file"
								multiple
								className="wft-hidden"
								onChange={ handleFileInputChange }
							/>
						</label>
					</div>
				</div>

				{ error && (
					<div className="wft-px-3 wft-py-2 wft-bg-red-50 wft-border wft-border-red-200 wft-text-sm wft-text-red-700 wft-rounded">
						{ error }
					</div>
				) }

				{ successMessage && ! hasActiveUploads && (
					<div className="wft-px-3 wft-py-2 wft-bg-green-50 wft-border wft-border-green-200 wft-text-sm wft-text-green-700 wft-rounded">
						{ successMessage }
					</div>
				) }

				{ total > 0 && (
					<div className="wft-space-y-3">
						<div className="wft-flex wft-items-center wft-justify-between">
							<h4 className="wft-text-sm wft-font-semibold wft-text-gray-800">
								{ __( 'Upload queue', 'wp-filetron' ) }
							</h4>
							<button
								type="button"
								onClick={ handleClearQueue }
								className="wft-text-xs wft-text-gray-500 hover:wft-text-gray-700"
								disabled={ isUploading }
							>
								{ __( 'Clear queue', 'wp-filetron' ) }
							</button>
						</div>

						<ul className="wft-space-y-2 wft-max-h-64 wft-overflow-y-auto wft-pr-1">
							{ queueList.map( ( item ) => (
								<li
									key={ item.id }
									className="wft-border wft-border-gray-200 wft-rounded-md wft-p-3 wft-bg-white"
								>
									<div className="wft-flex wft-items-center wft-justify-between">
										<div>
											<p className="wft-text-sm wft-font-medium wft-text-gray-800">
												{ item.file.name }
											</p>
											<p className="wft-text-xs wft-text-gray-500">
												{ sizeFormat( item.file.size ) }
											</p>
										</div>
										<span className="wft-text-xs wft-font-medium wft-text-gray-600">
											{ statusLabel( item.status ) }
										</span>
									</div>
									<div className="wft-mt-2 wft-h-2 wft-bg-gray-200 wft-rounded">
										<div
											className={ classNames(
												'wft-h-2 wft-rounded',
												{
													'wft-bg-blue-500':
														item.status ===
															'uploading' ||
														item.status ===
															'completed',
													'wft-bg-red-500':
														item.status === 'error',
												}
											) }
											style={ {
												width: `${ item.progress }%`,
											} }
										/>
									</div>
									{ item.error && (
										<p className="wft-mt-2 wft-text-xs wft-text-red-600">
											{ item.error }
										</p>
									) }
								</li>
							) ) }
						</ul>

						<div className="wft-flex wft-items-center wft-justify-end wft-gap-3">
							<button
								type="button"
								onClick={ handleClose }
								className="wft-text-sm wft-text-gray-600 hover:wft-text-gray-800"
							>
								{ __( 'Close', 'wp-filetron' ) }
							</button>
						</div>
					</div>
				) }
			</div>

			{ ! isUploading && total > 0 && completed === total && (
				<div className="wft-bg-gray-50 wft-px-6 wft-py-4 wft-text-sm wft-text-gray-600 wft-border-t wft-border-gray-200">
					{ __(
						'Uploads complete. You can close this panel or add more files.',
						'wp-filetron'
					) }
				</div>
			) }
		</div>
	);
}

function sizeFormat( bytes ) {
	if ( ! bytes && bytes !== 0 ) {
		return '';
	}

	const thresh = 1024;
	if ( Math.abs( bytes ) < thresh ) {
		return `${ bytes } B`;
	}

	const units = [ 'KB', 'MB', 'GB', 'TB' ];
	let u = -1;

	do {
		bytes /= thresh;
		u++;
	} while ( Math.abs( bytes ) >= thresh && u < units.length - 1 );

	return `${ bytes.toFixed( 1 ) } ${ units[ u ] }`;
}

function statusLabel( status ) {
	switch ( status ) {
		case 'pending':
			return __( 'Queued', 'wp-filetron' );
		case 'uploading':
			return __( 'Uploading…', 'wp-filetron' );
		case 'completed':
			return __( 'Completed', 'wp-filetron' );
		case 'error':
			return __( 'Failed', 'wp-filetron' );
		default:
			return '';
	}
}
