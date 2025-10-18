/**
 * Media Grid Component
 *
 * Renders uploaded media items in a simple grid/list presentation.
 */

import { useCallback, useMemo, useState, useId } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Modal, SelectControl } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import classNames from 'classnames';
import { STORE_NAME } from '../store';
import LoadingSpinner from './LoadingSpinner';
import MediaDetailsPanel from './MediaDetailsPanel';
import { mediaAPI, handleAPIError } from '../api/endpoints';
import { SNACKBAR_TIMEOUT } from '../utils/snackbar';
import MediaPreviewModal from './MediaPreviewModal';

export default function MediaGrid() {
	const dispatch = useDispatch( STORE_NAME );
	const { createNotice, removeNotice } = useDispatch( noticesStore );
	const {
		media,
		viewMode,
		isLoading,
		selectedFolder,
		selectedMedia,
		mediaPagination,
		mediaPerPage,
		folders,
		previewMedia,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			media: store.getMedia(),
			viewMode: store.getViewMode(),
			isLoading: store.isLoading(),
			selectedFolder: store.getSelectedFolder(),
			selectedMedia: store.getSelectedMedia
				? store.getSelectedMedia()
				: [],
			mediaPagination: store.getMediaPagination
				? store.getMediaPagination()
				: { total: 0, totalPages: 0, currentPage: 1 },
			mediaPerPage: store.getMediaPerPage ? store.getMediaPerPage() : 50,
			folders: store.getFolders ? store.getFolders() : [],
			previewMedia: store.getPreviewMedia
				? store.getPreviewMedia()
				: null,
		};
	} );

	const [ isDeleteOpen, setIsDeleteOpen ] = useState( false );
	const [ isMoveOpen, setIsMoveOpen ] = useState( false );
	const [ isDeleteProcessing, setIsDeleteProcessing ] = useState( false );
	const [ isMoveProcessing, setIsMoveProcessing ] = useState( false );
	const [ deleteError, setDeleteError ] = useState( null );
	const [ moveError, setMoveError ] = useState( null );
	const [ moveFolderId, setMoveFolderId ] = useState(
		selectedFolder === null || selectedFolder === undefined
			? 0
			: Number( selectedFolder )
	);
	const deleteTitleId = useId();
	const moveTitleId = useId();

	const notify = useCallback(
		( status, message ) => {
			const noticeId = createNotice?.( status, message, {
				type: 'snackbar',
				explicitDismiss: true,
			} );

			if ( noticeId && removeNotice ) {
				setTimeout( () => {
					removeNotice( noticeId );
				}, SNACKBAR_TIMEOUT );
			}
		},
		[ createNotice, removeNotice ]
	);

	const moveOptions = useMemo( () => {
		const baseOptions = [
			{
				label: __( 'All files', 'wp-filetron' ),
				value: 0,
			},
		];

		const sorted = [ ...folders ].sort( ( a, b ) =>
			( a?.name || '' ).localeCompare( b?.name || '' )
		);

		sorted.forEach( ( folder ) => {
			baseOptions.push( {
				label: folder?.name || __( '(Untitled folder)', 'wp-filetron' ),
				value: Number( folder.id ),
			} );
		} );

		return baseOptions;
	}, [ folders ] );

	const items = useMemo( () => media || [], [ media ] );
	const filteredItems = useMemo( () => {
		if ( ! selectedFolder ) {
			return items;
		}
		const targetId = Number( selectedFolder );
		return items.filter(
			( item ) => Number( item.folder_id ) === targetId
		);
	}, [ items, selectedFolder ] );

	const hasItems = filteredItems.length > 0;
	const selectedIds = useMemo( () => {
		return Array.isArray( selectedMedia ) ? selectedMedia : [];
	}, [ selectedMedia ] );
	const itemsInView = filteredItems.length;
	const perPage =
		mediaPagination.perPage || mediaPerPage || itemsInView || 50;
	const totalAvailable = mediaPagination.total || itemsInView;
	const totalPages = mediaPagination.totalPages || 1;
	const currentPage = mediaPagination.currentPage || 1;
	const selectedCount = selectedIds.length;
	const selectedIdSet = useMemo( () => {
		if ( selectedIds.length === 0 ) {
			return new Set();
		}
		return new Set(
			selectedIds.map( ( id ) => {
				const numeric = Number( id );
				return Number.isNaN( numeric ) ? id : numeric;
			} )
		);
	}, [ selectedIds ] );
	const selectedItems = useMemo( () => {
		if ( selectedIdSet.size === 0 ) {
			return [];
		}
		return filteredItems.filter( ( item ) => {
			const numericId = Number( item.id );
			return (
				selectedIdSet.has( item.id ) ||
				selectedIdSet.has( numericId ) ||
				selectedIdSet.has( item?.id?.toString?.() )
			);
		} );
	}, [ filteredItems, selectedIdSet ] );
	const handlePageChange = useCallback(
		( page ) => {
			const maxPage = Math.max( 1, totalPages );
			const nextPage = Math.min( Math.max( page, 1 ), maxPage );
			if ( nextPage !== currentPage ) {
				dispatch.setMediaCurrentPage( nextPage );
			}
		},
		[ dispatch, currentPage, totalPages ]
	);
	const activeItem = selectedItems.length === 1 ? selectedItems[ 0 ] : null;
	const perPageOptions = useMemo( () => {
		const baseOptions = [ 24, 48, 96, 150 ];
		if ( ! baseOptions.includes( perPage ) ) {
			baseOptions.push( perPage );
		}
		return baseOptions.sort( ( a, b ) => a - b );
	}, [ perPage ] );

	const emptyStateTitle = selectedFolder
		? __( 'No files in this folder yet', 'wp-filetron' )
		: __( 'No files uploaded yet', 'wp-filetron' );

	const emptyStateDescription = selectedFolder
		? __(
				'Move or upload files into this folder to see them here.',
				'wp-filetron'
		  )
		: __( 'No media available yet.', 'wp-filetron' );
	const toolbarUploadHint = __(
		'Use the Upload button in the toolbar to add new files at any time.',
		'wp-filetron'
	);

	const handlePrimarySelect = useCallback(
		( event, mediaId ) => {
			const supportsToggle =
				event?.metaKey || event?.ctrlKey || event?.shiftKey;

			if ( supportsToggle ) {
				dispatch.toggleMediaSelection( mediaId );
				return;
			}

			const alreadySelected = selectedIds.includes( mediaId );
			if ( alreadySelected && selectedIds.length === 1 ) {
				dispatch.clearMediaSelection();
				return;
			}

			dispatch.setSelectedMedia( [ mediaId ] );
		},
		[ dispatch, selectedIds ]
	);

	const closeDeleteModal = useCallback( () => {
		if ( isDeleteProcessing ) {
			return;
		}
		setIsDeleteOpen( false );
		setDeleteError( null );
	}, [ isDeleteProcessing ] );

	const closeMoveModal = useCallback( () => {
		if ( isMoveProcessing ) {
			return;
		}
		setIsMoveOpen( false );
		setMoveError( null );
	}, [ isMoveProcessing ] );

	const handleDeleteConfirm = useCallback( async () => {
		if ( isDeleteProcessing || selectedIds.length === 0 ) {
			return;
		}

		setIsDeleteProcessing( true );
		setDeleteError( null );

		try {
			let response;
			if ( selectedIds.length === 1 ) {
				response = await mediaAPI.delete( selectedIds[ 0 ] );
			} else {
				response = await mediaAPI.bulk( 'delete', selectedIds );
			}

			if ( ! response?.success ) {
				throw new Error(
					response?.message ||
						__( 'Failed to delete media items.', 'wp-filetron' )
				);
			}

			let successIds = [];
			if (
				Array.isArray( response?.data?.success_ids ) &&
				response.data.success_ids.length
			) {
				successIds = response.data.success_ids;
			} else if ( response?.data?.id ) {
				successIds = [ response.data.id ];
			}

			if ( successIds.length ) {
				dispatch.removeMediaItems( successIds );
				notify(
					'success',
					sprintf(
						/* translators: %s: number of files deleted. */
						_n(
							'%s file deleted.',
							'%s files deleted.',
							successIds.length,
							'wp-filetron'
						),
						successIds.length
					)
				);
			}

			if ( response?.data?.failed?.length ) {
				const failedCount = response.data.failed.length;
				notify(
					'warning',
					sprintf(
						/* translators: %s: number of files that could not be deleted. */
						_n(
							'%s file could not be deleted.',
							'%s files could not be deleted.',
							failedCount,
							'wp-filetron'
						),
						failedCount
					)
				);
			}

			dispatch.clearMediaSelection();
			dispatch.clearPreviewMedia();
			setIsDeleteOpen( false );
		} catch ( error ) {
			const message =
				handleAPIError( error ) ||
				__( 'Failed to delete media items.', 'wp-filetron' );
			setDeleteError( message );
			notify( 'error', message );
		} finally {
			setIsDeleteProcessing( false );
		}
	}, [ dispatch, isDeleteProcessing, notify, selectedIds ] );

	const handleMoveConfirm = useCallback( async () => {
		if ( isMoveProcessing || selectedIds.length === 0 ) {
			return;
		}

		setIsMoveProcessing( true );
		setMoveError( null );

		try {
			const response = await mediaAPI.bulk( 'move', selectedIds, {
				folder_id: moveFolderId,
			} );

			if ( ! response?.success ) {
				throw new Error(
					response?.message ||
						__( 'Failed to move media items.', 'wp-filetron' )
				);
			}

			let successIds = [];
			if ( Array.isArray( response?.data?.success_ids ) ) {
				successIds = response.data.success_ids;
			}

			if ( successIds.length ) {
				dispatch.updateMediaFolders( successIds, moveFolderId );
				notify(
					'success',
					sprintf(
						/* translators: %s: number of files moved. */
						_n(
							'%s file moved.',
							'%s files moved.',
							successIds.length,
							'wp-filetron'
						),
						successIds.length
					)
				);
			}

			if ( response?.data?.failed?.length ) {
				const failedCount = response.data.failed.length;
				notify(
					'warning',
					sprintf(
						/* translators: %s: number of files that could not be moved. */
						_n(
							'%s file could not be moved.',
							'%s files could not be moved.',
							failedCount,
							'wp-filetron'
						),
						failedCount
					)
				);

				if ( ! successIds.length ) {
					setMoveError(
						__(
							'Failed to move the selected files.',
							'wp-filetron'
						)
					);
					setIsMoveProcessing( false );
					return;
				}
			}

			dispatch.clearMediaSelection();
			dispatch.clearPreviewMedia();
			setIsMoveOpen( false );
		} catch ( error ) {
			const message =
				handleAPIError( error ) ||
				__( 'Failed to move media items.', 'wp-filetron' );
			setMoveError( message );
			notify( 'error', message );
		} finally {
			setIsMoveProcessing( false );
		}
	}, [ dispatch, moveFolderId, isMoveProcessing, notify, selectedIds ] );

	const openPreviewModal = useCallback( () => {
		if ( selectedIds.length !== 1 ) {
			return;
		}

		dispatch.setPreviewMedia( selectedIds[ 0 ] );
	}, [ dispatch, selectedIds ] );

	const closePreviewModal = useCallback( () => {
		dispatch.clearPreviewMedia();
	}, [ dispatch ] );

	if ( isLoading ) {
		return (
			<div className="wft-flex wft-items-center wft-justify-center wft-h-full wft-p-12">
				<LoadingSpinner
					label={ __( 'Loading media…', 'wp-filetron' ) }
				/>
			</div>
		);
	}

	if ( ! hasItems ) {
		return (
			<>
				<div className="wft-p-6">
					<div className="wft-bg-white wft-rounded-lg wft-shadow-sm wft-p-12 wft-text-center">
						<div className="wft-mb-4">
							<svg
								className="wft-w-16 wft-h-16 wft-mx-auto wft-text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={ 2 }
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h3 className="wft-text-lg wft-font-semibold wft-text-gray-900 wft-mb-2">
							{ emptyStateTitle }
						</h3>
						<p className="wft-text-gray-600">
							{ emptyStateDescription }
						</p>
						<p className="wft-text-sm wft-text-gray-500 wft-mt-4">
							{ toolbarUploadHint }
						</p>
					</div>
				</div>
				{ isDeleteOpen && (
					<Modal
						title={ sprintf(
							/* translators: %s: number of files scheduled for deletion. */
							_n(
								'Delete %s file?',
								'Delete %s files?',
								selectedIds.length,
								'wp-filetron'
							),
							selectedIds.length
						) }
						onRequestClose={ closeDeleteModal }
						shouldCloseOnClickOutside={ ! isDeleteProcessing }
						shouldCloseOnEsc={ ! isDeleteProcessing }
						className="wft-filetron-modal"
						aria-labelledby={ deleteTitleId }
					>
						<p id={ deleteTitleId } className="wft-mb-4">
							{ sprintf(
								/* translators: %s: number of selected files. */
								_n(
									'This action will permanently delete %s file. This cannot be undone.',
									'This action will permanently delete %s files. This cannot be undone.',
									selectedIds.length,
									'wp-filetron'
								),
								selectedIds.length
							) }
						</p>
						{ deleteError && (
							<div className="wft-mb-3 wft-rounded wft-bg-red-50 wft-px-3 wft-py-2 wft-text-sm wft-text-red-700">
								{ deleteError }
							</div>
						) }
						<div className="wft-flex wft-justify-end wft-gap-2">
							<Button
								variant="secondary"
								onClick={ closeDeleteModal }
								disabled={ isDeleteProcessing }
							>
								{ __( 'Cancel', 'wp-filetron' ) }
							</Button>
							<Button
								variant="primary"
								isDestructive
								onClick={ handleDeleteConfirm }
								isBusy={ isDeleteProcessing }
							>
								{ __( 'Delete', 'wp-filetron' ) }
							</Button>
						</div>
					</Modal>
				) }
				{ isMoveOpen && (
					<Modal
						title={ __( 'Move files', 'wp-filetron' ) }
						onRequestClose={ closeMoveModal }
						shouldCloseOnClickOutside={ ! isMoveProcessing }
						shouldCloseOnEsc={ ! isMoveProcessing }
						className="wft-filetron-modal"
						aria-labelledby={ moveTitleId }
					>
						<div className="wft-space-y-4">
							<p id={ moveTitleId }>
								{ __(
									'Select a target folder for the selected files.',
									'wp-filetron'
								) }
							</p>
							<SelectControl
								label={ __( 'Target folder', 'wp-filetron' ) }
								value={ String( moveFolderId ) }
								onChange={ ( value ) =>
									setMoveFolderId( Number( value ) )
								}
								options={ moveOptions.map( ( option ) => ( {
									label: option.label,
									value: String( option.value ),
								} ) ) }
							/>
							{ moveError && (
								<div className="wft-rounded wft-bg-red-50 wft-px-3 wft-py-2 wft-text-sm wft-text-red-700">
									{ moveError }
								</div>
							) }
							<div className="wft-flex wft-justify-end wft-gap-2">
								<Button
									variant="secondary"
									onClick={ closeMoveModal }
									disabled={ isMoveProcessing }
								>
									{ __( 'Cancel', 'wp-filetron' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ handleMoveConfirm }
									isBusy={ isMoveProcessing }
								>
									{ __( 'Move', 'wp-filetron' ) }
								</Button>
							</div>
						</div>
					</Modal>
				) }
				{ previewMedia && (
					<MediaPreviewModal
						item={ previewMedia }
						onRequestClose={ closePreviewModal }
					/>
				) }
			</>
		);
	}

	const isGridView = viewMode !== 'list';
	const totalSelected = selectedIds.length;

	const sidePanel = () => {
		if ( activeItem ) {
			return (
				<MediaDetailsPanel
					item={ activeItem }
					onClose={ () => {
						if ( totalSelected <= 1 ) {
							dispatch.clearMediaSelection();
						} else {
							dispatch.toggleMediaSelection( activeItem.id );
						}
					} }
				/>
			);
		}

		if ( selectedCount > 1 ) {
			return (
				<div className="wft-hidden lg:wft-flex lg:wft-flex-col lg:wft-w-80 wft-bg-white wft-border wft-border-blue-100 wft-rounded-lg wft-shadow-sm wft-p-4 wft-text-sm wft-text-blue-900">
					<h3 className="wft-text-base wft-font-semibold wft-mb-2">
						{ __( 'Multiple selection', 'wp-filetron' ) }
					</h3>
					<p className="wft-leading-snug">
						{ __(
							'Nutze die Aktionsleiste, um ausgewählte Dateien zu verschieben oder zu löschen.',
							'wp-filetron'
						) }
					</p>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="wft-p-6">
			<div className="wft-mb-4 wft-flex wft-flex-wrap wft-items-center wft-justify-between wft-gap-3">
				<div className="wft-text-sm wft-text-gray-600">
					{ selectedFolder
						? __(
								'Managing files within this folder.',
								'wp-filetron'
						  )
						: __( 'Browsing all files.', 'wp-filetron' ) }
				</div>
				<span className="wft-text-xs wft-text-gray-500">
					{ toolbarUploadHint }
				</span>
			</div>
			{ selectedCount > 0 && (
				<div
					className="wft-mb-4 wft-flex wft-flex-wrap wft-items-center wft-justify-between wft-gap-3 wft-bg-blue-50 wft-border wft-border-blue-200 wft-rounded-md wft-px-4 wft-py-2"
					role="status"
					aria-live="polite"
				>
					<span className="wft-text-sm wft-font-medium wft-text-blue-800">
						{ sprintf(
							/* translators: %s is the number of selected media items. */
							_n(
								'%s item selected',
								'%s items selected',
								selectedCount,
								'wp-filetron'
							),
							selectedCount
						) }{ ' ' }
						{ totalAvailable > 0 &&
							sprintf(
								/* translators: %s is the total number of items in the current view. */
								__( 'of %s in view', 'wp-filetron' ),
								totalAvailable
							) }
					</span>
					<div className="wft-flex wft-flex-wrap wft-items-center wft-gap-2">
						{ selectedIds.length === 1 && (
							<Button
								variant="secondary"
								onClick={ openPreviewModal }
								disabled={
									isDeleteProcessing || isMoveProcessing
								}
								data-testid="wft-preview-action"
							>
								{ __( 'Preview', 'wp-filetron' ) }
							</Button>
						) }
						<Button
							variant="secondary"
							onClick={ () => {
								setMoveError( null );
								setMoveFolderId(
									selectedFolder === null ||
										selectedFolder === undefined
										? 0
										: Number( selectedFolder )
								);
								setIsMoveOpen( true );
							} }
							disabled={
								isDeleteProcessing ||
								isMoveProcessing ||
								selectedIds.length === 0
							}
							data-testid="wft-move-action"
						>
							{ __( 'Move', 'wp-filetron' ) }
						</Button>
						<Button
							variant="secondary"
							isDestructive
							onClick={ () => {
								setDeleteError( null );
								setIsDeleteOpen( true );
							} }
							disabled={
								isDeleteProcessing ||
								isMoveProcessing ||
								selectedIds.length === 0
							}
							data-testid="wft-delete-action"
						>
							{ __( 'Delete', 'wp-filetron' ) }
						</Button>
						<Button
							variant="link"
							onClick={ () => {
								if ( filteredItems.length === 0 ) {
									return;
								}
								if (
									filteredItems.length === selectedIds.length
								) {
									dispatch.clearMediaSelection();
								} else {
									dispatch.setSelectedMedia(
										filteredItems.map( ( item ) => item.id )
									);
								}
							} }
						>
							{ filteredItems.length === selectedIds.length
								? __( 'Unselect all', 'wp-filetron' )
								: __( 'Select all', 'wp-filetron' ) }
						</Button>
						<Button
							variant="link"
							onClick={ () => {
								if ( filteredItems.length ) {
									dispatch.setSelectedMedia( [
										filteredItems[ 0 ].id,
									] );
								}
							} }
						>
							{ __( 'Preview first', 'wp-filetron' ) }
						</Button>
						<Button
							variant="link"
							onClick={ () => dispatch.clearMediaSelection() }
						>
							{ __( 'Clear selection', 'wp-filetron' ) }
						</Button>
					</div>
				</div>
			) }
			<div className="wft-flex wft-flex-col lg:wft-flex-row wft-gap-6">
				<div className="wft-flex-1">
					<div
						className={ classNames( {
							'wft-grid wft-grid-cols-1 md:wft-grid-cols-2 xl:wft-grid-cols-3 wft-gap-4':
								isGridView,
							'wft-flex wft-flex-col wft-gap-2': ! isGridView,
						} ) }
					>
						{ filteredItems.map( ( item ) => (
							<MediaCard
								key={ item.id }
								item={ item }
								viewMode={ viewMode }
								isSelected={
									selectedIdSet.has( item.id ) ||
									selectedIdSet.has( Number( item.id ) ) ||
									selectedIdSet.has( item?.id?.toString?.() )
								}
								onSelect={ handlePrimarySelect }
							/>
						) ) }
					</div>

					{ ( totalPages > 1 ||
						( perPageOptions && perPageOptions.length > 0 ) ) && (
						<PaginationControls
							currentPage={ currentPage }
							totalPages={ totalPages }
							onChange={ handlePageChange }
							disabled={ isLoading }
							itemsInView={ itemsInView }
							totalItems={ totalAvailable }
							perPage={ perPage }
							perPageOptions={ perPageOptions }
							onPerPageChange={ ( nextPerPage ) => {
								dispatch.setMediaPerPage( nextPerPage );
								dispatch.setMediaCurrentPage( 1 );
							} }
						/>
					) }
				</div>

				{ sidePanel() }
			</div>
		</div>
	);
}

function MediaCard( { item, viewMode, isSelected, onSelect } ) {
	const isGridView = viewMode !== 'list';

	const preview = item.thumbnail || item.medium || item.url;

	const handleClick = ( event ) => {
		onSelect?.( event, item.id );
	};

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			event.preventDefault();
			onSelect?.( event, item.id );
		}
	};

	return (
		<button
			type="button"
			className={ classNames(
				'wft-relative wft-border wft-border-gray-200 wft-rounded-lg wft-bg-white wft-shadow-sm wft-text-left focus:wft-ring-2 focus:wft-ring-blue-500 focus:wft-outline-none',
				{
					'wft-flex wft-items-center wft-gap-4 wft-px-4 wft-py-3':
						! isGridView,
					'wft-p-4 wft-space-y-3': isGridView,
					'wft-border-blue-400 wft-ring-1 wft-ring-blue-300':
						isSelected,
				}
			) }
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			aria-pressed={ isSelected }
			data-media-id={ item.id }
		>
			{ isSelected && (
				<span className="wft-absolute wft-top-3 wft-right-3 wft-flex wft-h-6 wft-w-6 wft-items-center wft-justify-center wft-rounded-full wft-bg-blue-600 wft-text-white wft-text-xs">
					✓
				</span>
			) }
			{ preview ? (
				<div
					className={ classNames( {
						'wft-flex-shrink-0': ! isGridView,
					} ) }
				>
					<img
						src={ preview }
						alt={ item.alt_text || item.title || '' }
						className={ classNames(
							'wft-object-cover wft-rounded-md',
							{
								'wft-w-20 wft-h-20': ! isGridView,
								'wft-w-full wft-h-40': isGridView,
							}
						) }
					/>
				</div>
			) : (
				<div
					className={ classNames(
						'wft-flex wft-items-center wft-justify-center wft-bg-gray-100 wft-text-gray-500 wft-rounded-md',
						{
							'wft-w-20 wft-h-20': ! isGridView,
							'wft-w-full wft-h-40': isGridView,
						}
					) }
				>
					📄
				</div>
			) }

			<div
				className={ classNames( {
					'wft-space-y-1': isGridView,
					'wft-flex-1': ! isGridView,
				} ) }
			>
				<p className="wft-text-sm wft-font-medium wft-text-gray-900 wft-truncate">
					{ item.title ||
						item.alt_text ||
						item.url?.split( '/' ).pop() }
				</p>
				<p className="wft-text-xs wft-text-gray-500">
					{ item.mime_type } · { sizeFormat( item.file_size ) }
				</p>
				<p className="wft-text-xs wft-text-gray-400">
					{ new Date( item.uploaded ).toLocaleString() }
				</p>
			</div>
		</button>
	);
}

function PaginationControls( {
	currentPage,
	totalPages,
	onChange,
	disabled,
	itemsInView,
	totalItems,
	perPage,
	perPageOptions,
	onPerPageChange,
} ) {
	const effectivePerPage =
		perPage && perPage > 0 ? perPage : Math.max( itemsInView, 1 );
	const rangeStart =
		totalItems === 0 ? 0 : ( currentPage - 1 ) * effectivePerPage + 1;
	const rangeEnd =
		totalItems === 0
			? 0
			: Math.min( totalItems, rangeStart + itemsInView - 1 );

	const handlePrev = () => onChange( currentPage - 1 );
	const handleNext = () => onChange( currentPage + 1 );
	const handleInputChange = ( event ) => {
		const value = Number( event.target.value );
		if ( Number.isNaN( value ) ) {
			return;
		}
		onChange( value );
	};

	return (
		<div className="wft-mt-4 wft-flex wft-flex-col wft-gap-3">
			<div className="wft-flex wft-flex-wrap wft-items-center wft-justify-between wft-gap-3">
				<button
					type="button"
					className="wft-inline-flex wft-items-center wft-justify-center wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100 disabled:wft-opacity-60"
					onClick={ handlePrev }
					disabled={ disabled || currentPage <= 1 }
				>
					{ __( 'Previous', 'wp-filetron' ) }
				</button>
				<div className="wft-flex wft-items-center wft-gap-2 wft-text-sm wft-text-gray-700">
					<span>
						{ sprintf(
							/* translators: %1$s: current page, %2$s: total pages. */
							__( 'Page %1$s of %2$s', 'wp-filetron' ),
							currentPage,
							totalPages
						) }
					</span>
					<input
						type="number"
						min="1"
						max={ totalPages }
						value={ currentPage }
						onChange={ handleInputChange }
						disabled={ disabled }
						className="wft-w-16 wft-rounded wft-border wft-border-gray-300 wft-bg-white wft-px-2 wft-py-1 wft-text-sm focus:wft-outline-none focus:wft-ring-1 focus:wft-ring-blue-500"
					/>
				</div>
				<button
					type="button"
					className="wft-inline-flex wft-items-center wft-justify-center wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-px-3 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100 disabled:wft-opacity-60"
					onClick={ handleNext }
					disabled={ disabled || currentPage >= totalPages }
				>
					{ __( 'Next', 'wp-filetron' ) }
				</button>
				{ Array.isArray( perPageOptions ) &&
					perPageOptions.length > 0 && (
						<div className="wft-flex wft-items-center wft-gap-2 wft-text-sm wft-text-gray-700">
							<label
								htmlFor="wft-media-per-page"
								className="wft-text-gray-500"
							>
								{ __( 'Items per page:', 'wp-filetron' ) }
							</label>
							<select
								id="wft-media-per-page"
								className="wft-rounded-md wft-border wft-border-gray-300 wft-bg-white wft-pl-3 wft-pr-8 wft-py-1 wft-text-sm focus:wft-outline-none focus:wft-ring-1 focus:wft-ring-blue-500"
								value={ effectivePerPage }
								onChange={ ( event ) =>
									onPerPageChange?.(
										Number( event.target.value )
									)
								}
								disabled={ disabled }
							>
								{ perPageOptions.map( ( option ) => (
									<option key={ option } value={ option }>
										{ option }
									</option>
								) ) }
							</select>
						</div>
					) }
			</div>
			<div className="wft-text-xs wft-text-gray-500">
				{ totalItems === 0
					? __( 'No media available.', 'wp-filetron' )
					: sprintf(
							/* translators: 1: start index, 2: end index, 3: total items */
							__( 'Showing %1$s–%2$s of %3$s', 'wp-filetron' ),
							rangeStart,
							rangeEnd,
							totalItems
					  ) }
			</div>
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
