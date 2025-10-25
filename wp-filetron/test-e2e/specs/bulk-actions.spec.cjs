/**
 * Bulk media actions E2E coverage.
 *
 * Exercises Preview, Move and Delete flows in the React UI.
 */

const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const TEST_MEDIA_PATH = path.resolve(
	__dirname,
	'../fixtures/sample-upload.png'
);

const selectMediaCard = async ( page, media ) => {
	const card = page
		.locator( '#wft-app' )
		.locator( `button[data-media-id="${ media.id }"]` )
		.first();
	await expect( card ).toBeVisible( { timeout: 15_000 } );
	await card.click();
};

const openModalWithRetry = async (
	page,
	triggerLocator,
	modalLocator,
	{ attempts = 3, modalTimeout = 4_000, betweenAttempts = 400 } = {}
) => {
	let lastError;

	for ( let attempt = 1; attempt <= attempts; attempt++ ) {
		try {
			await triggerLocator.click();
			await expect( modalLocator ).toBeVisible( {
				timeout: modalTimeout,
			} );
			return;
		} catch ( error ) {
			lastError = error;
			if ( attempt < attempts ) {
				await page.waitForTimeout( betweenAttempts );
			}
		}
	}

	throw lastError;
};

test.describe( 'Bulk media actions', () => {
	test( 'öffnet die Vorschau über die Aktionsleiste', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( TEST_MEDIA_PATH );

		await admin.visitAdminPage( 'upload.php', 'page=wp-filetron' );
		await expect( page.locator( '#wft-app' ) ).toBeVisible();

		await selectMediaCard( page, media );
		await expect(
			page.locator( '[data-testid="wft-selection-toolbar"]' )
		).toBeVisible( { timeout: 10_000 } );

		const previewButton = page.getByTestId( 'wft-preview-action' );
		await expect( previewButton ).toBeEnabled();
		const previewModal = page.getByTestId( 'wft-preview-modal' );
		await openModalWithRetry( page, previewButton, previewModal, {
			attempts: 4,
			modalTimeout: 5_000,
		} );
		await expect( previewModal.locator( 'img' ) ).toBeVisible( {
			strict: false,
			timeout: 10_000,
		} );
		const mediaTitle =
			media?.title?.rendered || media?.title?.raw || media?.title || '';
		await expect(
			previewModal.getByRole( 'heading', { level: 2 } )
		).toContainText( mediaTitle );

		await page.getByTestId( 'wft-preview-close' ).click();
		await expect( previewModal ).toBeHidden( { timeout: 10_000 } );

		await requestUtils.deleteMedia( media.id );
	} );

	test( 'verschiebt Dateien via Bulk-Modal in einen Ordner', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( TEST_MEDIA_PATH );
		const folderResponse = await requestUtils.rest( {
			method: 'POST',
			path: '/wft/v1/folders',
			data: {
				name: `E2E Move Target ${ Date.now() }`,
			},
		} );

		const folderId = folderResponse?.data?.id;
		expect( folderId ).toBeTruthy();

		await admin.visitAdminPage( 'upload.php', 'page=wp-filetron' );
		await expect( page.locator( '#wft-app' ) ).toBeVisible();

		await selectMediaCard( page, media );
		await expect(
			page.locator( '[data-testid="wft-selection-toolbar"]' )
		).toBeVisible( { timeout: 10_000 } );

		const moveButton = page.getByTestId( 'wft-move-action' );
		await expect( moveButton ).toBeEnabled();
		const moveModal = page.getByTestId( 'wft-move-modal' );
		await openModalWithRetry( page, moveButton, moveModal, {
			attempts: 4,
			modalTimeout: 5_000,
		} );
		await expect( moveModal.locator( 'select' ) ).toBeVisible( {
			strict: false,
			timeout: 10_000,
		} );

		const targetFolderId = Number( folderId );
		await moveModal
			.locator( 'select' )
			.selectOption( String( targetFolderId ) );
		await page.getByTestId( 'wft-move-confirm' ).click();
		await expect( moveModal ).toBeHidden( { timeout: 10_000 } );

		const mediaDetails = await requestUtils.rest( {
			method: 'GET',
			path: `/wft/v1/media/${ media.id }`,
		} );
		expect( Number( mediaDetails?.data?.folder_id ) ).toBe(
			targetFolderId
		);

		await requestUtils.deleteMedia( media.id );
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wft/v1/folders/${ folderId }`,
		} );
	} );

	test( 'löscht selektierte Dateien über die Bulk-Leiste', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const media = await requestUtils.uploadMedia( TEST_MEDIA_PATH );

		await admin.visitAdminPage( 'upload.php', 'page=wp-filetron' );
		await expect( page.locator( '#wft-app' ) ).toBeVisible();

		await selectMediaCard( page, media );
		await expect(
			page.locator( '[data-testid="wft-selection-toolbar"]' )
		).toBeVisible( { timeout: 10_000 } );

		const deleteButton = page.getByTestId( 'wft-delete-action' );
		await expect( deleteButton ).toBeEnabled();
		const deleteModal = page.getByTestId( 'wft-delete-modal' );
		await openModalWithRetry( page, deleteButton, deleteModal, {
			attempts: 4,
			modalTimeout: 5_000,
		} );
		await expect( page.getByTestId( 'wft-delete-cancel' ) ).toBeVisible( {
			timeout: 10_000,
		} );

		await page.getByTestId( 'wft-delete-confirm' ).click();
		await expect( deleteModal ).toBeHidden( { timeout: 10_000 } );

		await expect(
			requestUtils.rest( {
				method: 'GET',
				path: `/wft/v1/media/${ media.id }`,
			} )
		).rejects.toMatchObject( {
			code: 'media_not_found',
			data: expect.objectContaining( { status: 404 } ),
		} );
	} );
} );
