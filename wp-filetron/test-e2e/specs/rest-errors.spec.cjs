/**
 * REST negative flow coverage.
 *
 * Verifies, dass Validierungsfehler der WP fileTRON REST-API korrekt
 * signalisiert werden und der Client aussagekräftige Codes erhält.
 */

const fs = require( 'fs/promises' );
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { request: playwrightRequest } = require( '@playwright/test' );

const TEST_MEDIA_PATH = path.resolve(
	__dirname,
	'../fixtures/sample-upload.png'
);
const WP_BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';
test.describe( 'REST API Fehlerpfade', () => {
	test( 'lehnt Ordner ohne Namen mit 400 und Fehlercode ab', async ( {
		requestUtils,
	} ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/folders',
				data: {
					name: '',
				},
			} )
		).rejects.toMatchObject( {
			code: expect.stringMatching(
				/(invalid_folder_name|rest_invalid_param)/
			),
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'verhindert Media-Upload mit unbekanntem Ordner', async ( {
		requestUtils,
	} ) => {
		const fileBuffer = await fs.readFile( TEST_MEDIA_PATH );

		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/upload',
				multipart: {
					file: {
						name: 'sample-upload.png',
						mimeType: 'image/png',
						buffer: fileBuffer,
					},
					folder_id: '999999',
				},
			} )
		).rejects.toMatchObject( {
			code: 'folder_not_found',
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'lehnt Tag mit zu langem Namen ab', async ( { requestUtils } ) => {
		const longName = 'x'.repeat( 101 );

		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/tags',
				data: {
					name: longName,
				},
			} )
		).rejects.toMatchObject( {
			code: expect.stringMatching(
				/(invalid_tag_name|rest_invalid_param)/
			),
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'verweigert Media-Upload ohne Datei', async ( { requestUtils } ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/upload',
				data: {
					title: 'Kein File',
				},
			} )
		).rejects.toMatchObject( {
			code: 'missing_file',
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'meldet Tag-Löschung für unbekannte ID', async ( {
		requestUtils,
	} ) => {
		await expect(
			requestUtils.rest( {
				method: 'DELETE',
				path: '/wft/v1/tags/999999',
			} )
		).rejects.toMatchObject( {
			code: 'tag_not_found',
			data: expect.objectContaining( { status: 404 } ),
		} );
	} );

	test( 'verweigert Ordneranlage mit unbekanntem Parent', async ( {
		requestUtils,
	} ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/folders',
				data: {
					name: 'Invalid Parent Folder',
					parent_id: 999999,
				},
			} )
		).rejects.toMatchObject( {
			code: 'folder_parent_not_found',
			data: expect.objectContaining( { status: 404 } ),
		} );
	} );

	test( 'verweigert Ordneranlage ohne Namen', async ( { requestUtils } ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/folders',
				data: { name: '  ' },
			} )
		).rejects.toMatchObject( {
			code: expect.stringMatching(
				/(invalid_folder_name|rest_invalid_param)/
			),
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'verweigert Tag-Anlage ohne Namen', async ( { requestUtils } ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/tags',
				data: { name: '' },
			} )
		).rejects.toMatchObject( {
			code: expect.stringMatching(
				/(invalid_tag_name|rest_invalid_param)/
			),
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'verhindert Selbstreferenz oder unbekannten Parent beim Update', async ( {
		requestUtils,
	} ) => {
		const created = await requestUtils.rest( {
			method: 'POST',
			path: '/wft/v1/folders',
			data: {
				name: `Temp Folder ${ Date.now() }`,
			},
		} );

		const folderId = created.data?.id;
		const child = await requestUtils.rest( {
			method: 'POST',
			path: '/wft/v1/folders',
			data: {
				name: `Temp Child ${ Date.now() }`,
				parent_id: folderId,
			},
		} );
		const childId = child.data?.id;

		try {
			await expect(
				requestUtils.rest( {
					method: 'PUT',
					path: `/wft/v1/folders/${ folderId }`,
					data: {
						parent_id: folderId,
					},
				} )
			).rejects.toMatchObject( {
				code: 'folder_parent_invalid',
				data: expect.objectContaining( { status: 400 } ),
			} );

			await expect(
				requestUtils.rest( {
					method: 'PUT',
					path: `/wft/v1/folders/${ folderId }`,
					data: {
						parent_id: 999999,
					},
				} )
			).rejects.toMatchObject( {
				code: 'folder_parent_not_found',
				data: expect.objectContaining( { status: 404 } ),
			} );

			await expect(
				requestUtils.rest( {
					method: 'PUT',
					path: `/wft/v1/folders/${ folderId }`,
					data: {
						parent_id: childId,
					},
				} )
			).rejects.toMatchObject( {
				code: 'folder_parent_cyclic',
				data: expect.objectContaining( { status: 400 } ),
			} );
		} finally {
			if ( childId ) {
				await requestUtils
					.rest( {
						method: 'DELETE',
						path: `/wft/v1/folders/${ childId }`,
					} )
					.catch( () => undefined );
			}
			if ( folderId ) {
				await requestUtils
					.rest( {
						method: 'DELETE',
						path: `/wft/v1/folders/${ folderId }`,
					} )
					.catch( () => undefined );
			}
		}
	} );

	test( 'verweigert Tag-Update mit leerem Namen', async ( {
		requestUtils,
	} ) => {
		const created = await requestUtils.rest( {
			method: 'POST',
			path: '/wft/v1/tags',
			data: { name: `Temp Tag ${ Date.now() }` },
		} );

		const tagId = created.data?.id;

		try {
			await expect(
				requestUtils.rest( {
					method: 'PUT',
					path: `/wft/v1/tags/${ tagId }`,
					data: { name: ' ' },
				} )
			).rejects.toMatchObject( {
				code: 'invalid_tag_name',
				data: expect.objectContaining( { status: 400 } ),
			} );
		} finally {
			await requestUtils
				.rest( {
					method: 'DELETE',
					path: `/wft/v1/tags/${ tagId }`,
				} )
				.catch( () => undefined );
		}
	} );

	test( 'meldet unbekannte Medien-ID bei Tag-Zuordnung', async ( {
		requestUtils,
	} ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/999999/tags',
				data: { tag_ids: [ 1 ] },
			} )
		).rejects.toMatchObject( {
			code: 'media_not_found',
			data: expect.objectContaining( { status: 404 } ),
		} );
	} );

	test( 'validiert Tag-Zuordnung mit nicht existierendem Tag', async ( {
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( TEST_MEDIA_PATH );

		try {
			await expect(
				requestUtils.rest( {
					method: 'POST',
					path: `/wft/v1/media/${ media.id }/tags`,
					data: { tag_ids: [ 999999 ] },
				} )
			).rejects.toMatchObject( {
				code: 'tag_not_found',
				data: expect.objectContaining( { status: 404 } ),
			} );
		} finally {
			await requestUtils.deleteMedia( media.id );
		}
	} );

	test( 'verhindert Media-Update mit unbekanntem Ordner', async ( {
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( TEST_MEDIA_PATH );

		try {
			await expect(
				requestUtils.rest( {
					method: 'PUT',
					path: `/wft/v1/media/${ media.id }`,
					data: { folder_id: 999999 },
				} )
			).rejects.toMatchObject( {
				code: 'folder_not_found',
				data: expect.objectContaining( { status: 400 } ),
			} );
		} finally {
			await requestUtils.deleteMedia( media.id );
		}
	} );

	test( 'erfordert Authentifizierung für Schreiboperationen', async () => {
		const anon = await playwrightRequest.newContext( {
			baseURL: WP_BASE_URL,
		} );
		const response = await anon.post( '/wp-json/wft/v1/folders', {
			data: { name: 'Unauthorized' },
		} );

		expect( response.status() ).toBeGreaterThanOrEqual( 401 );

		const contentType = response.headers()[ 'content-type' ] || '';
		if ( contentType.includes( 'application/json' ) ) {
			const payload = await response.json();
			expect( payload.code ).toMatch( /rest_/ );
		}
		await anon.dispose();
	} );

	test( 'verweigert Tag-Löschung ohne Authentifizierung', async () => {
		const anon = await playwrightRequest.newContext( {
			baseURL: WP_BASE_URL,
		} );

		const response = await anon.delete( '/wp-json/wft/v1/tags/999999' );

		expect( response.status() ).toBeGreaterThanOrEqual( 401 );

		const contentType = response.headers()[ 'content-type' ] || '';
		if ( contentType.includes( 'application/json' ) ) {
			const payload = await response.json();
			expect( payload.code ).toMatch( /rest_/ );
		}

		await anon.dispose();
	} );

	test( 'meldet fehlende Medien-IDs bei Bulk-Löschaufruf', async ( {
		requestUtils,
	} ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/bulk',
				data: {
					action: 'delete',
				},
			} )
		).rejects.toMatchObject( {
			code: 'rest_missing_callback_param',
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'verlangt Tag-IDs bei Bulk-Tagging', async ( { requestUtils } ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/bulk',
				data: {
					media_ids: [ 123 ],
					action: 'tag',
				},
			} )
		).rejects.toMatchObject( {
			code: 'missing_tag_ids',
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );

	test( 'lehnt ungültige Bulk-Aktion ab', async ( { requestUtils } ) => {
		await expect(
			requestUtils.rest( {
				method: 'POST',
				path: '/wft/v1/media/bulk',
				data: {
					media_ids: [ 123 ],
					action: 'destroy',
				},
			} )
		).rejects.toMatchObject( {
			code: 'invalid_action',
			data: expect.objectContaining( { status: 400 } ),
		} );
	} );
} );
