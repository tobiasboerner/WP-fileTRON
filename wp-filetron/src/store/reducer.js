/**
 * Redux Reducer
 *
 * State management for WP fileTRON.
 */

const DEFAULT_STATE = {
	// Upload overlay state
	uploadOverlayVisible: false,
	uploadQueue: [],

	// Folders
	folders: [],
	selectedFolder: null,
	expandedFolders: [],

	// Tags
	tags: [],

	// Media
	media: [],
	selectedMedia: [],
	mediaTotal: 0,
	mediaTotalPages: 0,
	mediaCurrentPage: 1,
	mediaPerPage: 50,

	// UI
	viewMode: 'grid', // 'grid' or 'list'
	isLoading: false,
	error: null,
};

const normalizeNumericId = ( value, { defaultValue = value } = {} ) => {
	const numeric = Number( value );
	return Number.isNaN( numeric ) ? defaultValue : numeric;
};

const normalizeFolder = ( folder ) => {
	if ( ! folder || typeof folder !== 'object' ) {
		return folder;
	}

	const normalized = { ...folder };

	if ( 'id' in normalized ) {
		normalized.id = normalizeNumericId( normalized.id );
	}

	normalized.parent_id =
		normalized.parent_id === undefined || normalized.parent_id === null
			? 0
			: normalizeNumericId( normalized.parent_id, { defaultValue: 0 } );

	if ( 'order_index' in normalized ) {
		normalized.order_index = normalizeNumericId( normalized.order_index, {
			defaultValue: normalized.order_index,
		} );
	}

	return normalized;
};

const normalizeFolders = ( folders ) =>
	Array.isArray( folders ) ? folders.map( normalizeFolder ) : [];

const expandIds = ( ids ) => {
	if ( ! Array.isArray( ids ) ) {
		return [];
	}

	const normalized = ids
		.map( ( id ) =>
			id === null || id === undefined
				? id
				: normalizeNumericId( id )
		)
		.filter( ( id ) => id !== null && id !== undefined );

	return Array.from( new Set( normalized ) );
};

const normalizeMediaItem = ( item ) => {
	if ( ! item || typeof item !== 'object' ) {
		return item;
	}

	const normalized = { ...item };

	if ( 'id' in normalized ) {
		normalized.id = normalizeNumericId( normalized.id );
	}

	if (
		'folder_id' in normalized &&
		normalized.folder_id !== null &&
		normalized.folder_id !== undefined
	) {
		normalized.folder_id = normalizeNumericId( normalized.folder_id, {
			defaultValue: 0,
		} );
	}

	return normalized;
};

export function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		// Upload overlay state
		case 'SET_UPLOAD_OVERLAY_VISIBLE':
			return {
				...state,
				uploadOverlayVisible: Boolean( action.isVisible ),
			};

		case 'SET_UPLOAD_QUEUE':
			return {
				...state,
				uploadQueue: Array.isArray( action.queue ) ? action.queue : [],
			};

		// Folder Actions
		case 'SET_FOLDERS':
			return {
				...state,
				folders: normalizeFolders( action.folders ),
			};

		case 'ADD_FOLDER':
			return {
				...state,
				folders: [ ...state.folders, normalizeFolder( action.folder ) ],
			};

		case 'UPDATE_FOLDER': {
			const updatedFolder = normalizeFolder( action.folder );
			return {
				...state,
				folders: state.folders.map( ( folder ) =>
					folder.id === updatedFolder.id ? updatedFolder : folder
				),
			};
		}

		case 'REMOVE_FOLDER': {
			const removalId = normalizeNumericId( action.id );
			return {
				...state,
				folders: state.folders.filter(
					( folder ) => folder.id !== removalId
				),
				selectedFolder:
					state.selectedFolder === removalId
						? null
						: state.selectedFolder,
			};
		}

		case 'SET_SELECTED_FOLDER':
			return {
				...state,
				selectedFolder:
					action.folderId === null
						? null
						: normalizeNumericId( action.folderId ),
			};

		case 'SET_EXPANDED_FOLDERS':
			return {
				...state,
				expandedFolders: expandIds( action.folderIds ),
			};

		case 'TOGGLE_FOLDER_EXPANDED': {
			const toggleId = normalizeNumericId( action.folderId );
			const isExpanded = state.expandedFolders.includes( toggleId );

			return {
				...state,
				expandedFolders: isExpanded
					? state.expandedFolders.filter( ( id ) => id !== toggleId )
					: [ ...state.expandedFolders, toggleId ],
			};
		}

		// Tag Actions
		case 'SET_TAGS':
			return {
				...state,
				tags: action.tags,
			};

		case 'ADD_TAG':
			return {
				...state,
				tags: [ ...state.tags, action.tag ],
			};

		// Media Actions
		case 'SET_MEDIA': {
			const normalizedMedia = Array.isArray( action.media )
				? action.media.map( ( item ) => normalizeMediaItem( item ) )
				: [];
			return {
				...state,
				media: normalizedMedia,
				mediaTotal: action.total,
				mediaTotalPages: action.totalPages,
				mediaCurrentPage: action.currentPage,
			};
		}

		case 'SET_SELECTED_MEDIA':
			return {
				...state,
				selectedMedia: action.mediaIds,
			};

		case 'TOGGLE_MEDIA_SELECTION': {
			const toggleMediaId = action.mediaId;
			const isSelected = state.selectedMedia.includes( toggleMediaId );
			return {
				...state,
				selectedMedia: isSelected
					? state.selectedMedia.filter(
							( id ) => id !== toggleMediaId
					  )
					: [ ...state.selectedMedia, toggleMediaId ],
			};
		}

		case 'CLEAR_MEDIA_SELECTION':
			return {
				...state,
				selectedMedia: [],
			};

		case 'SET_MEDIA_CURRENT_PAGE':
			return {
				...state,
				mediaCurrentPage:
					action.page === undefined || action.page === null
						? state.mediaCurrentPage
						: normalizeNumericId( action.page, {
								defaultValue: 1,
						  } ),
			};
		case 'SET_MEDIA_PER_PAGE': {
			const perPage =
				action.perPage === undefined || action.perPage === null
					? state.mediaPerPage
					: normalizeNumericId( action.perPage, {
							defaultValue: state.mediaPerPage,
					  } );
			return {
				...state,
				mediaPerPage: perPage > 0 ? perPage : state.mediaPerPage,
			};
		}

		case 'ADD_MEDIA_ITEM': {
			const mediaItem = normalizeMediaItem( action.mediaItem );

			if ( ! mediaItem ) {
				return state;
			}

			const existingIndex = state.media.findIndex(
				( item ) => Number( item.id ) === Number( mediaItem.id )
			);

			let updatedMedia;
			let updatedTotal = state.mediaTotal;

			if ( existingIndex !== -1 ) {
				updatedMedia = state.media.map( ( item, index ) =>
					index === existingIndex ? { ...item, ...mediaItem } : item
				);
			} else {
				updatedMedia = [ mediaItem, ...state.media ];
				updatedTotal += 1;
			}

			return {
				...state,
				media: updatedMedia,
				mediaTotal: updatedTotal,
			};
		}

		// UI Actions
		case 'SET_VIEW_MODE':
			return {
				...state,
				viewMode: action.mode,
			};

		case 'SET_LOADING':
			return {
				...state,
				isLoading: action.isLoading,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.error,
				isLoading: false,
			};

		case 'CLEAR_ERROR':
			return {
				...state,
				error: null,
			};

		default:
			return state;
	}
}
