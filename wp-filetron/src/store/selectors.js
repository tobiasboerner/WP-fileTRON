/**
 * Redux Selectors
 *
 * Selectors for accessing state in the WP fileTRON store.
 */

const toNumericId = ( value ) => {
	if ( value === null || value === undefined ) {
		return value;
	}
	const numeric = Number( value );
	return Number.isNaN( numeric ) ? value : numeric;
};

/**
 * Folder Selectors
 */

export function getFolders( state ) {
	return state.folders;
}

export function getFolderById( state, id ) {
	const targetId = toNumericId( id );
	return state.folders.find( ( folder ) => folder.id === targetId );
}

export function getRootFolders( state ) {
	return state.folders.filter( ( folder ) => folder.parent_id === 0 );
}

export function getChildFolders( state, parentId ) {
	const targetParentId = toNumericId( parentId );
	return state.folders.filter(
		( folder ) => folder.parent_id === targetParentId
	);
}

export function getSelectedFolder( state ) {
	return state.selectedFolder;
}

export function getExpandedFolders( state ) {
	return state.expandedFolders;
}

export function isFolderExpanded( state, folderId ) {
	const targetId = toNumericId( folderId );
	return state.expandedFolders.includes( targetId );
}

/* eslint-disable-next-line jsdoc/check-line-alignment */
/**
 * Get folder hierarchy as a tree structure.
 *
 * @param {Object} state Application state slice.
 * @return {Array} Nested folder collection.
 */
export function getFolderTree( state ) {
	const buildTree = ( parentId = 0 ) => {
		return state.folders
			.filter( ( folder ) => folder.parent_id === parentId )
			.map( ( folder ) => ( {
				...folder,
				children: buildTree( folder.id ),
			} ) );
	};

	return buildTree();
}

/* eslint-disable-next-line jsdoc/check-line-alignment */
/**
 * Get breadcrumb path for a folder.
 *
 * @param {Object} state Application state slice.
 * @param {number|string|null} folderId Folder identifier.
 * @return {Array} Ordered folder path.
 */
export function getFolderPath( state, folderId ) {
	const path = [];
	let currentId = folderId;

	while ( currentId ) {
		const folder = getFolderById( state, currentId );
		if ( ! folder ) break;

		path.unshift( folder );
		currentId = folder.parent_id;
	}

	return path;
}

/**
 * Tag Selectors
 */

export function getTags( state ) {
	return state.tags;
}

export function getTagById( state, id ) {
	return state.tags.find( ( tag ) => tag.id === id );
}

/**
 * Media Selectors
 */

export function getMedia( state ) {
	return state.media;
}

export function getMediaById( state, id ) {
	return state.media.find( ( item ) => item.id === id );
}

export function getSelectedMedia( state ) {
	return state.selectedMedia;
}

export function isMediaSelected( state, mediaId ) {
	return state.selectedMedia.includes( mediaId );
}

export function getMediaPagination( state ) {
	return {
		total: state.mediaTotal,
		totalPages: state.mediaTotalPages,
		currentPage: state.mediaCurrentPage,
		perPage: state.mediaPerPage,
	};
}

export function getMediaPerPage( state ) {
	return state.mediaPerPage;
}

/**
 * UI Selectors
 */

export function getViewMode( state ) {
	return state.viewMode;
}

export function isLoading( state ) {
	return state.isLoading;
}

export function getError( state ) {
	return state.error;
}

export function hasError( state ) {
	return state.error !== null;
}

/**
 * Upload selectors
 */

export function isUploadOverlayVisible( state ) {
	return Boolean( state.uploadOverlayVisible );
}

export function getUploadQueue( state ) {
	return Array.isArray( state.uploadQueue ) ? state.uploadQueue : [];
}
