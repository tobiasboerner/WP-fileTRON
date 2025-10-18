/**
 * Upload + Pagination E2E flow
 *
 * Preconditions:
 * - WordPress test environment running (`npx wp-env start` or equivalent)
 * - Plugin activated
 * - Playwright Chromium installed (`npx playwright install chromium`)
 *
 * Uses Playwright fixtures exposed by @wordpress/e2e-test-utils-playwright.
 */

const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const TEST_MEDIA_PATH = path.resolve(
	__dirname,
	'../fixtures/sample-upload.png'
);
const MINIMUM_MEDIA_ITEMS = 50;

test.describe( 'Upload queue pagination flow', () => {
	test( 'uploads a file and keeps pagination in sync', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const baselineMedia = await requestUtils.listMedia();
		const baselineIds = new Set( baselineMedia.map( ( item ) => item.id ) );
		let ensuredCount = baselineMedia.length;

		while ( ensuredCount < MINIMUM_MEDIA_ITEMS ) {
			await requestUtils.uploadMedia( TEST_MEDIA_PATH );
			ensuredCount += 1;
		}

		try {
			await admin.visitAdminPage( 'upload.php', 'page=wp-filetron' );
			await expect( page.locator( '#wft-app' ) ).toBeVisible();

			await page
				.getByRole( 'button', { name: 'Upload', exact: true } )
				.first()
				.click();
			await expect(
				page.locator( 'text=Upload files' ).first()
			).toBeVisible();

			await page.setInputFiles(
				'label:has-text("Choose files") input[type="file"]',
				TEST_MEDIA_PATH
			);

			await expect(
				page.locator( '.wft-app :text("Upload queue")' )
			).toBeVisible();
			await expect(
				page.locator( 'text=All uploads completed successfully.' )
			).toBeVisible( { timeout: 20000 } );

			await page.getByRole( 'button', { name: 'Close' } ).click();

			const snackbarList = page.locator( '.wft-snackbar-list' );
			await expect( snackbarList ).toBeVisible();
			await expect( snackbarList ).toContainText(
				'uploaded successfully'
			);

			const dismissButton = snackbarList
				.locator( '.components-snackbar__dismiss-button' )
				.first();
			if ( await dismissButton.isVisible() ) {
				await dismissButton.click();
			}

			await page.selectOption( '#wft-media-per-page', '48' );
			const nextButton = page.getByRole( 'button', { name: 'Next' } );
			await expect( nextButton ).toBeEnabled();
			await nextButton.click();

			await expect(
				page.locator( 'text=/Page \\d+ of \\d+/' )
			).toBeVisible();
		} finally {
			const mediaAfter = await requestUtils.listMedia();
			const newItems = mediaAfter.filter(
				( item ) => ! baselineIds.has( item.id )
			);

			for ( const item of newItems ) {
				await requestUtils.deleteMedia( item.id );
			}
		}
	} );
} );
