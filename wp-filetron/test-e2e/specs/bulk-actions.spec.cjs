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
	const selector = `button[data-media-id="${ media.id }"]`;
	await page.locator( selector ).first().click();
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
	const previewButton = page.locator(
		'button[data-testid="wft-preview-action"]'
	);
	await expect( previewButton ).toBeEnabled();
	await previewButton.click();

	const previewDialog = page.getByRole( 'dialog', {
		name: 'File preview',
	} );
	await expect( previewDialog ).toBeVisible( { timeout: 10_000 } );
	await expect(
		previewDialog.getByRole( 'heading', { name: media.title } )
	).toBeVisible();

		await previewDialog.getByRole( 'button', { name: 'Close' } ).click();
		await expect( previewDialog ).toBeHidden();

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
	const moveButton = page.locator( 'button[data-testid="wft-move-action"]' );
	await expect( moveButton ).toBeEnabled();
	await moveButton.click();

	const moveDialog = page.getByRole( 'dialog', { name: 'Move files' } );
	await expect( moveDialog ).toBeVisible( { timeout: 10_000 } );

	await moveDialog
		.getByLabelText( 'Target folder' )
		.selectOption( String( folderId ) );
		await moveDialog.getByRole( 'button', { name: 'Move' } ).click();

		await expect( moveDialog ).toBeHidden();

		const mediaDetails = await requestUtils.rest( {
			method: 'GET',
			path: `/wft/v1/media/${ media.id }`,
		} );
		expect( mediaDetails?.data?.folder_id ).toBe( folderId );

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
	const deleteButton = page.locator(
		'button[data-testid="wft-delete-action"]'
	);
	await expect( deleteButton ).toBeEnabled();
	await deleteButton.click();

	const deleteDialog = page.getByRole( 'dialog', {
		name: /Delete \d+ file/,
	} );
	await expect( deleteDialog ).toBeVisible( { timeout: 10_000 } );

	await deleteDialog.getByRole( 'button', { name: 'Delete' } ).click();
	await expect( deleteDialog ).toBeHidden( { timeout: 10_000 } );

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
