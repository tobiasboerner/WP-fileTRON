/**
 * WP fileTRON - Main App Component
 *
 * @package
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import classNames from 'classnames';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SnackbarList } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { STORE_NAME } from './store';
import { folderAPI, tagAPI, mediaAPI } from './api/endpoints';

// Components
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import MediaGrid from './components/MediaGrid';
import LoadingSpinner from './components/LoadingSpinner';
import UploadOverlay from './components/UploadOverlay';
import UploadPanel from './components/UploadPanel';
import UploadProgressBar from './components/UploadProgressBar';

function App() {
	const storeDispatch = useDispatch( STORE_NAME );
	const { removeNotice } = useDispatch( noticesStore );

	const {
		isLoading,
		error,
		selectedFolder,
		uploadOverlayVisible,
		uploadQueue,
		mediaPage,
		mediaPerPage,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const pagination = store.getMediaPagination
			? store.getMediaPagination()
			: {};
		return {
			isLoading: store.isLoading(),
			error: store.getError(),
			selectedFolder: store.getSelectedFolder(),
			uploadOverlayVisible: store.isUploadOverlayVisible
				? store.isUploadOverlayVisible()
				: false,
			uploadQueue: store.getUploadQueue ? store.getUploadQueue() : [],
			mediaPage: pagination.currentPage || 1,
			mediaPerPage: pagination.perPage || 50,
		};
	} );
	const notices = useSelect(
		( select ) =>
			select( noticesStore )
				.getNotices()
				.filter( ( notice ) => notice.type === 'snackbar' ),
		[]
	);

	const uploadStats = useMemo( () => {
		const queueList = Array.isArray( uploadQueue ) ? uploadQueue : [];
		const total = queueList.length;
		const completed = queueList.filter(
			( item ) => item.status === 'completed'
		).length;
		const errors = queueList.filter(
			( item ) => item.status === 'error'
		).length;
		const active = queueList.some(
			( item ) => item.status === 'uploading' || item.status === 'pending'
		);
		return { total, completed, errors, active };
	}, [ uploadQueue ] );

	const previousFolderRef = useRef( selectedFolder );
	const sidebarDragState = useRef( {
		startX: 0,
		startWidth: 320,
	} );
	const isResizingSidebarRef = useRef( false );
	const [ sidebarWidth, setSidebarWidth ] = useState( 320 );
	const [ isResizingSidebar, setIsResizingSidebar ] = useState( false );
	const noticeTimersRef = useRef( {} );

	useEffect( () => {
		const timers = noticeTimersRef.current;

		Object.keys( timers ).forEach( ( id ) => {
			const exists = notices.some( ( notice ) => notice.id === id );
			if ( ! exists ) {
				clearTimeout( timers[ id ] );
				delete timers[ id ];
			}
		} );

		notices.forEach( ( notice ) => {
			if ( timers[ notice.id ] ) {
				return;
			}

			timers[ notice.id ] = setTimeout( () => {
				removeNotice( notice.id );
				delete timers[ notice.id ];
			}, 4000 );
		} );
	}, [ notices, removeNotice ] );

	useEffect(
		() => () => {
			Object.values( noticeTimersRef.current ).forEach( ( timeoutId ) =>
				clearTimeout( timeoutId )
			);
			noticeTimersRef.current = {};
		},
		[]
	);

	useEffect( () => {
		const timers = noticeTimersRef.current;

		// clear timers for notices that already disappeared
		Object.keys( timers ).forEach( ( id ) => {
			const stillVisible = notices.some( ( notice ) => notice.id === id );
			if ( ! stillVisible ) {
				clearTimeout( timers[ id ] );
				delete timers[ id ];
			}
		} );

		// schedule auto-dismiss for new notices
		notices.forEach( ( notice ) => {
			if ( timers[ notice.id ] ) {
				return;
			}

			timers[ notice.id ] = setTimeout( () => {
				removeNotice( notice.id );
				delete timers[ notice.id ];
			}, 4000 );
		} );
	}, [ notices, removeNotice ] );

	useEffect( () => {
		return () => {
			Object.values( noticeTimersRef.current ).forEach( ( timeoutId ) =>
				clearTimeout( timeoutId )
			);
			noticeTimersRef.current = {};
		};
	}, [] );

	const clampSidebarWidth = useCallback( ( value ) => {
		const MIN_WIDTH = 240;
		const MAX_WIDTH = 520;
		return Math.min( MAX_WIDTH, Math.max( MIN_WIDTH, value ) );
	}, [] );

	const handleSidebarPointerMove = useCallback(
		( event ) => {
			if ( ! isResizingSidebarRef.current ) {
				return;
			}

			const delta = event.clientX - sidebarDragState.current.startX;
			const nextWidth = clampSidebarWidth(
				sidebarDragState.current.startWidth + delta
			);
			setSidebarWidth( nextWidth );
		},
		[ clampSidebarWidth ]
	);

	const stopSidebarResize = useCallback( () => {
		if ( ! isResizingSidebarRef.current ) {
			return;
		}

		isResizingSidebarRef.current = false;
		setIsResizingSidebar( false );
		document.body.style.userSelect = '';
		document.body.style.cursor = '';

		window.removeEventListener( 'pointermove', handleSidebarPointerMove );
		window.removeEventListener( 'pointerup', stopSidebarResize );
	}, [ handleSidebarPointerMove ] );

	useEffect( () => () => stopSidebarResize(), [ stopSidebarResize ] );

	const startSidebarResize = useCallback(
		( event ) => {
			isResizingSidebarRef.current = true;
			setIsResizingSidebar( true );
			sidebarDragState.current = {
				startX: event.clientX,
				startWidth: sidebarWidth,
			};
			document.body.style.userSelect = 'none';
			document.body.style.cursor = 'col-resize';

			window.addEventListener( 'pointermove', handleSidebarPointerMove );
			window.addEventListener( 'pointerup', stopSidebarResize );
			event.preventDefault();
		},
		[ handleSidebarPointerMove, sidebarWidth, stopSidebarResize ]
	);

	useEffect( () => {
		const loadData = async () => {
			storeDispatch.setLoading( true );

			try {
				const [ foldersResponse, tagsResponse ] = await Promise.all( [
					folderAPI.getAll(),
					tagAPI.getAll(),
				] );

				if ( foldersResponse.success ) {
					storeDispatch.setFolders( foldersResponse.data );
				}

				if ( tagsResponse.success ) {
					storeDispatch.setTags( tagsResponse.data );
				}

				storeDispatch.setLoading( false );
			} catch ( err ) {
				storeDispatch.setError(
					err.message || __( 'Failed to load data', 'wp-filetron' )
				);
				storeDispatch.setLoading( false );
			}
		};

		loadData();
	}, [ storeDispatch ] );

	useEffect( () => {
		let isCancelled = false;

		const loadMedia = async () => {
			storeDispatch.setLoading( true );

			try {
				const params = selectedFolder
					? { folder_id: selectedFolder }
					: {};
				params.page = mediaPage;
				if ( mediaPerPage ) {
					params.per_page = mediaPerPage;
				}
				const mediaResponse = await mediaAPI.getAll( params );

				if (
					! isCancelled &&
					mediaResponse.success &&
					mediaResponse.data
				) {
					const {
						items = [],
						total = 0,
						total_pages: totalPages = 0,
						current_page: currentPage = 1,
					} = mediaResponse.data;

					storeDispatch.setMedia(
						items,
						total,
						totalPages,
						currentPage
					);
				}
			} catch ( err ) {
				if ( ! isCancelled ) {
					storeDispatch.setError(
						err.message ||
							__( 'Failed to load media.', 'wp-filetron' )
					);
				}
			} finally {
				if ( ! isCancelled ) {
					storeDispatch.setLoading( false );
				}
			}
		};

		loadMedia();

		return () => {
			isCancelled = true;
		};
	}, [ storeDispatch, selectedFolder, mediaPage, mediaPerPage ] );

	useEffect( () => {
		if ( previousFolderRef.current !== selectedFolder ) {
			previousFolderRef.current = selectedFolder;
			storeDispatch.setMediaCurrentPage( 1 );
		}
	}, [ storeDispatch, selectedFolder ] );

	if ( isLoading ) {
		return <LoadingSpinner />;
	}

	return (
		<>
			<div className="wft-app wft-h-screen wft-flex wft-flex-col">
				{ /* Error Display */ }
				{ error && (
					<div className="wft-bg-red-50 wft-border-b wft-border-red-200 wft-px-6 wft-py-3">
						<div className="wft-flex wft-items-center wft-justify-between">
							<span className="wft-text-sm wft-text-red-800">
								⚠️ { error }
							</span>
							<button
								onClick={ () => storeDispatch.clearError() }
								className="wft-text-red-600 hover:wft-text-red-800 wft-text-sm wft-font-medium"
							>
								{ __( 'Dismiss', 'wp-filetron' ) }
							</button>
						</div>
					</div>
				) }

				<div className="wft-flex wft-flex-1 wft-overflow-hidden">
					<Sidebar width={ sidebarWidth } />

					<div
						role="slider"
						aria-orientation="horizontal"
						aria-label={ __(
							'Resize folder sidebar',
							'wp-filetron'
						) }
						aria-valuenow={ Math.round( sidebarWidth ) }
						aria-valuemin={ 240 }
						aria-valuemax={ 520 }
						tabIndex={ 0 }
						className={ classNames(
							'wft-relative wft-z-30 wft-flex wft-items-center wft-justify-center',
							'wft-w-2 wft-cursor-col-resize wft-select-none',
							'wft-bg-transparent focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-300'
						) }
						onPointerDown={ startSidebarResize }
						onKeyDown={ ( event ) => {
							if ( event.key === 'ArrowLeft' ) {
								event.preventDefault();
								setSidebarWidth( ( width ) =>
									clampSidebarWidth( width - 16 )
								);
							}
							if ( event.key === 'ArrowRight' ) {
								event.preventDefault();
								setSidebarWidth( ( width ) =>
									clampSidebarWidth( width + 16 )
								);
							}
						} }
					>
						<span
							className={ classNames(
								'wft-h-full wft-w-[2px] wft-rounded',
								isResizingSidebar
									? 'wft-bg-blue-400'
									: 'wft-bg-gray-200 hover:wft-bg-gray-300'
							) }
						/>
					</div>

					<main className="wft-flex-1 wft-flex wft-flex-col wft-overflow-hidden">
						<Toolbar />

						<div className="wft-flex-1 wft-overflow-y-auto wft-bg-gray-50">
							<MediaGrid />
						</div>
					</main>
				</div>
			</div>

			<UploadOverlay
				isOpen={ uploadOverlayVisible }
				onClose={ () => storeDispatch.setUploadOverlayVisible( false ) }
			>
				<UploadPanel
					onClose={ () =>
						storeDispatch.setUploadOverlayVisible( false )
					}
				/>
			</UploadOverlay>

			{ ! uploadOverlayVisible &&
				uploadStats.active &&
				uploadStats.total > 0 && (
					<UploadProgressBar
						total={ uploadStats.total }
						completed={ uploadStats.completed }
						errors={ uploadStats.errors }
						onClick={ () =>
							storeDispatch.setUploadOverlayVisible( true )
						}
					/>
				) }
			<SnackbarList
				notices={ notices }
				onRemove={ removeNotice }
				className="wft-snackbar-list wft-fixed wft-bottom-6 wft-right-4 sm:wft-right-6 wft-z-[2000] wft-flex wft-flex-col wft-items-end wft-space-y-3 wft-max-w-sm wft-pointer-events-auto"
			/>
		</>
	);
}

export default App;
