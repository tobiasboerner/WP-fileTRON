/**
 * API Endpoints
 *
 * Centralized API communication with the WordPress REST API.
 * All endpoints use wp.apiFetch which handles nonces automatically.
 */

import apiFetch from '@wordpress/api-fetch';

const API_NAMESPACE = 'wft/v1';

/* eslint-disable jsdoc/check-line-alignment */

/**
 * Folder API
 */
export const folderAPI = {
	/**
	 * Get all folders
	 * @param {number|null} parentId - Filter by parent folder ID
	 * @return {Promise}
	 */
	getAll( parentId = null ) {
		const params = parentId !== null ? `?parent_id=${ parentId }` : '';
		return apiFetch( {
			path: `${ API_NAMESPACE }/folders${ params }`,
			method: 'GET',
		} );
	},

	/**
	 * Create a new folder
	 * @param {Object} data - Folder data (name, color, parent_id)
	 * @return {Promise}
	 */
	create( data ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/folders`,
			method: 'POST',
			data,
		} );
	},

	/**
	 * Update a folder
	 * @param {number} id - Folder ID
	 * @param {Object} data - Updated folder data
	 * @return {Promise}
	 */
	update( id, data ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/folders/${ id }`,
			method: 'PUT',
			data,
		} );
	},

	/**
	 * Delete a folder
	 * @param {number} id - Folder ID
	 * @return {Promise}
	 */
	delete( id ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/folders/${ id }`,
			method: 'DELETE',
		} );
	},
};

/**
 * Tag API
 */
export const tagAPI = {
	/**
	 * Get all tags
	 * @param {string|null} search - Search query
	 * @return {Promise}
	 */
	getAll( search = null ) {
		const params = search
			? `?search=${ encodeURIComponent( search ) }`
			: '';
		return apiFetch( {
			path: `${ API_NAMESPACE }/tags${ params }`,
			method: 'GET',
		} );
	},

	/**
	 * Create a new tag
	 * @param {Object} data - Tag data (name, description)
	 * @return {Promise}
	 */
	create( data ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/tags`,
			method: 'POST',
			data,
		} );
	},

	/**
	 * Update a tag
	 * @param {number} id - Tag ID
	 * @param {Object} data - Updated tag data
	 * @return {Promise}
	 */
	update( id, data ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/tags/${ id }`,
			method: 'PUT',
			data,
		} );
	},

	/**
	 * Delete a tag
	 * @param {number} id - Tag ID
	 * @return {Promise}
	 */
	delete( id ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/tags/${ id }`,
			method: 'DELETE',
		} );
	},

	/**
	 * Get tags for a media item
	 * @param {number} mediaId - Media ID
	 * @return {Promise}
	 */
	getMediaTags( mediaId ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ mediaId }/tags`,
			method: 'GET',
		} );
	},

	/**
	 * Add tags to a media item
	 * @param {number} mediaId - Media ID
	 * @param {Array} tagIds - Array of tag IDs
	 * @return {Promise}
	 */
	addToMedia( mediaId, tagIds ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ mediaId }/tags`,
			method: 'POST',
			data: { tag_ids: tagIds },
		} );
	},
};

/**
 * Media API
 */
export const mediaAPI = {
	/**
	 * Get all media items
	 * @param {Object} params - Query parameters (folder_id, per_page, page)
	 * @return {Promise}
	 */
	getAll( params = {} ) {
		const queryString = new URLSearchParams( params ).toString();
		const path = queryString
			? `${ API_NAMESPACE }/media?${ queryString }`
			: `${ API_NAMESPACE }/media`;

		return apiFetch( {
			path,
			method: 'GET',
		} );
	},

	/**
	 * Upload a media file
	 * @param {FormData} formData - FormData containing file and optional fields
	 * @return {Promise}
	 */
	upload( formData ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/upload`,
			method: 'POST',
			body: formData,
		} );
	},

	/**
	 * Get a single media item
	 * @param {number} id - Media ID
	 * @return {Promise}
	 */
	get( id ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ id }`,
			method: 'GET',
		} );
	},

	/**
	 * Delete a media item
	 * @param {number} id - Media ID
	 * @return {Promise}
	 */
	delete( id ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ id }`,
			method: 'DELETE',
		} );
	},

	/**
	 * Update media metadata
	 * @param {number} id - Media ID
	 * @param {Object} data - Updated metadata
	 * @return {Promise}
	 */
	update( id, data ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ id }`,
			method: 'PUT',
			data,
		} );
	},

	/**
	 * Get media usage
	 * @param {number} id - Media ID
	 * @return {Promise}
	 */
	getUsage( id ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/${ id }/usage`,
			method: 'GET',
		} );
	},

	/**
	 * Bulk operations on media
	 * @param {string} action - Action to perform (delete, tag)
	 * @param {Array} mediaIds - Array of media IDs
	 * @param {Object} extraData - Additional data (e.g., tag_ids for 'tag' action)
	 * @return {Promise}
	 */
	bulk( action, mediaIds, extraData = {} ) {
		return apiFetch( {
			path: `${ API_NAMESPACE }/media/bulk`,
			method: 'POST',
			data: {
				action,
				media_ids: mediaIds,
				...extraData,
			},
		} );
	},
};

/**
 * Helper function to handle API errors
 * @param {Error} error - Error object
 * @return {string} - User-friendly error message
 */
export function handleAPIError( error ) {
	if ( error.message ) {
		return error.message;
	}

	if ( error.code ) {
		// Map error codes to user-friendly messages
		const errorMessages = {
			rest_forbidden: 'Du hast keine Berechtigung für diese Aktion.',
			rest_cookie_invalid_nonce:
				'Sitzung abgelaufen. Bitte Seite neu laden.',
			invalid_folder_name: 'Ungültiger Ordnername.',
			folder_not_found: 'Ordner nicht gefunden.',
			media_move_forbidden:
				'Dir fehlt die Berechtigung, diese Datei zu verschieben.',
			media_delete_forbidden:
				'Dir fehlt die Berechtigung, diese Datei zu löschen.',
			missing_folder_id: 'Bitte wähle einen Zielordner.',
			folder_assignment_failed:
				'Die Datei konnte nicht in den Zielordner verschoben werden.',
			invalid_tag_name: 'Ungültiger Tag-Name.',
			media_not_found: 'Datei nicht gefunden.',
			media_delete_failed: 'Die Datei konnte nicht gelöscht werden.',
		};

		return errorMessages[ error.code ] || `Fehler: ${ error.code }`;
	}

	return 'Ein unbekannter Fehler ist aufgetreten.';
}

/* eslint-enable jsdoc/check-line-alignment */
