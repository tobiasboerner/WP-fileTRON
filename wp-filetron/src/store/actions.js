/**
 * Redux Actions
 *
 * Synchronous action creators for the WP fileTRON store.
 */

/**
 * Folder Actions
 */

export function setFolders( folders ) {
	return {
		type: 'SET_FOLDERS',
		folders,
	};
}

export function addFolder( folder ) {
	return {
		type: 'ADD_FOLDER',
		folder,
	};
}

export function updateFolder( folder ) {
	return {
		type: 'UPDATE_FOLDER',
		folder,
	};
}

export function removeFolder( id ) {
	return {
		type: 'REMOVE_FOLDER',
		id,
	};
}

export function setSelectedFolder( folderId ) {
	return {
		type: 'SET_SELECTED_FOLDER',
		folderId,
	};
}

export function setExpandedFolders( folderIds ) {
	return {
		type: 'SET_EXPANDED_FOLDERS',
		folderIds,
	};
}

export function toggleFolderExpanded( folderId ) {
	return {
		type: 'TOGGLE_FOLDER_EXPANDED',
		folderId,
	};
}

/**
 * Tag Actions
 */

export function setTags( tags ) {
	return {
		type: 'SET_TAGS',
		tags,
	};
}

export function addTag( tag ) {
	return {
		type: 'ADD_TAG',
		tag,
	};
}

/**
 * Media Actions
 */

export function setMedia( media, total, totalPages, currentPage ) {
	return {
		type: 'SET_MEDIA',
		media,
		total,
		totalPages,
		currentPage,
	};
}

export function setSelectedMedia( mediaIds ) {
	return {
		type: 'SET_SELECTED_MEDIA',
		mediaIds,
	};
}

export function toggleMediaSelection( mediaId ) {
	return {
		type: 'TOGGLE_MEDIA_SELECTION',
		mediaId,
	};
}

export function clearMediaSelection() {
	return {
		type: 'CLEAR_MEDIA_SELECTION',
	};
}

export function addMediaItem( mediaItem ) {
	return {
		type: 'ADD_MEDIA_ITEM',
		mediaItem,
	};
}

export function setMediaCurrentPage( page ) {
	return {
		type: 'SET_MEDIA_CURRENT_PAGE',
		page,
	};
}

export function setMediaPerPage( perPage ) {
	return {
		type: 'SET_MEDIA_PER_PAGE',
		perPage,
	};
}

/**
 * UI Actions
 */

export function setViewMode( mode ) {
	return {
		type: 'SET_VIEW_MODE',
		mode,
	};
}

export function setLoading( isLoading ) {
	return {
		type: 'SET_LOADING',
		isLoading,
	};
}

export function setError( error ) {
	return {
		type: 'SET_ERROR',
		error,
	};
}

export function clearError() {
	return {
		type: 'CLEAR_ERROR',
	};
}

/**
 * Upload UI Actions
 */

export function setUploadOverlayVisible( isVisible ) {
	return {
		type: 'SET_UPLOAD_OVERLAY_VISIBLE',
		isVisible,
	};
}

export function setUploadQueue( queue ) {
	return {
		type: 'SET_UPLOAD_QUEUE',
		queue,
	};
}
