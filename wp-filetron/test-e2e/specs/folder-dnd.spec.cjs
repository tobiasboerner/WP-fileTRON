/**
 * Folder Drag & Drop coverage.
 *
 * Creates Ordner über die App-REST-API (via window.wftData),
 * prüft blockierte rekursive Drops, ein gültiges Move und Root-Drop.
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const waitForWftApi = async ( page ) => {
	await page.waitForFunction(
		() => window.wftData?.apiUrl && window.wftData?.nonce,
		{ timeout: 10_000 }
	);
};

const callFolderApi = async ( page, { method = 'GET', endpoint, body } ) => {
	return page.evaluate(
		async ( { reqMethod, reqEndpoint, reqBody } ) => {
			if ( ! window.wftData?.apiUrl || ! window.wftData?.nonce ) {
				throw new Error( 'wftData not initialised' );
			}

			const base = window.wftData.apiUrl.replace( /\/+$/, '' );
			const normalizedEndpoint = String( reqEndpoint || '' ).replace(
				/^\/+/,
				''
			);
			const response = await fetch( `${ base }/${ normalizedEndpoint }`, {
				method: reqMethod,
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.wftData.nonce,
				},
				body: reqBody ? JSON.stringify( reqBody ) : undefined,
			} );

			const json = await response.json();
			if ( ! response.ok ) {
				throw new Error(
					`Folder API ${ reqMethod } ${ normalizedEndpoint } failed: ${ JSON.stringify(
						json
					) }`
				);
			}
			return json;
		},
		{ reqMethod: method, reqEndpoint: endpoint, reqBody: body }
	);
};

const createFolder = async ( page, { name, parentId = 0 } ) => {
	const response = await callFolderApi( page, {
		method: 'POST',
		endpoint: 'folders',
		body: {
			name,
			parent_id: parentId,
		},
	} );
	return response?.data;
};

const deleteFolder = async ( page, folderId ) => {
	if ( ! folderId ) {
		return;
	}

	try {
		await callFolderApi( page, {
			method: 'DELETE',
			endpoint: `folders/${ folderId }`,
		} );
	} catch {
		// Ignore if already deleted.
	}
};

const fetchFolders = async ( page ) => {
	const response = await callFolderApi( page, {
		method: 'GET',
		endpoint: 'folders',
	} );
	return Array.isArray( response?.data ) ? response.data : [];
};

const waitForFolderParent = async (
	page,
	folderId,
	expectedParentId,
	timeout = 6_000
) => {
	await expect
		.poll(
			async () => {
				const folders = await fetchFolders( page );
				const folder = folders.find(
					( entry ) => Number( entry.id ) === Number( folderId )
				);
				if ( ! folder ) {
					return null;
				}
				return Number( folder.parent_id ) || 0;
			},
			{
				message: `Wartet auf Parent ${ expectedParentId } für Folder ${ folderId }`,
				timeout,
			}
		)
		.toBe( Number( expectedParentId ) || 0 );
};

const folderRow = ( page, folderId ) =>
	page.locator(
		`[data-testid="wft-folder-row"][data-folder-id="${ folderId }"]`
	);

const dropZone = ( page, type, folderId ) =>
	page.locator(
		`[data-testid="wft-dropzone-${ type }"][data-folder-id="${ folderId }"]`
	);

const dragFolderToLocator = async ( page, sourceLocator, targetLocator ) => {
	await expect( sourceLocator ).toBeVisible( { timeout: 10_000 } );
	await sourceLocator.scrollIntoViewIfNeeded();
	const sourceBox = await sourceLocator.boundingBox();
	expect( sourceBox, 'Quelle benötigt Bounding Box' ).toBeTruthy();

	await page.mouse.move(
		sourceBox.x + sourceBox.width / 2,
		sourceBox.y + sourceBox.height / 2
	);
	await page.mouse.down();
	await page.mouse.move(
		sourceBox.x + sourceBox.width / 2 + 12,
		sourceBox.y + sourceBox.height / 2 + 4,
		{ steps: 3 }
	);
	await page.waitForTimeout( 80 );

	let released = false;

	try {
		await targetLocator.waitFor( { state: 'attached', timeout: 4_000 } );
		await targetLocator.scrollIntoViewIfNeeded();
		const targetBox = await targetLocator.boundingBox();
		expect( targetBox, 'Dropzone benötigt Bounding Box' ).toBeTruthy();
		await page.mouse.move(
			targetBox.x + targetBox.width / 2,
			targetBox.y + targetBox.height / 2,
			{ steps: 5 }
		);
		await page.waitForTimeout( 150 );
		await page.mouse.up();
		released = true;
		await page.waitForTimeout( 100 );
	} finally {
		if ( ! released ) {
			await page.mouse.up().catch( () => {} );
		}
	}
};

const startDragOnFolder = async ( page, sourceLocator ) => {
	await expect( sourceLocator ).toBeVisible( { timeout: 10_000 } );
	await sourceLocator.scrollIntoViewIfNeeded();
	const sourceBox = await sourceLocator.boundingBox();
	expect( sourceBox ).toBeTruthy();
	const startX = sourceBox.x + sourceBox.width / 2;
	const startY = sourceBox.y + sourceBox.height / 2;
	await page.mouse.move( startX, startY );
	await page.mouse.down();
	await page.mouse.move( startX + 12, startY + 4, { steps: 3 } );
	await page.waitForTimeout( 60 );
};

test.describe( 'Folder Drag & Drop', () => {
	test( 'blockiert rekursive Moves und erlaubt valides Verschieben plus Root-Drop', async ( {
		admin,
		page,
	} ) => {
		await admin.visitAdminPage( 'upload.php', 'page=wp-filetron' );
		await expect( page.locator( '#wft-app' ) ).toBeVisible();
		await waitForWftApi( page );

		const timestamp = Date.now();
		const parentFolder = await createFolder( page, {
			name: `DnD Parent ${ timestamp }`,
		} );
		const childFolder = await createFolder( page, {
			name: `DnD Child ${ timestamp }`,
			parentId: parentFolder.id,
		} );
		const siblingFolder = await createFolder( page, {
			name: `DnD Sibling ${ timestamp }`,
		} );

		// Reload, damit der React-Tree die neuen Ordner zieht.
		await page.reload();
		await expect( page.locator( '#wft-app' ) ).toBeVisible();
		await waitForWftApi( page );

		try {
			const parentRow = folderRow( page, parentFolder.id );
			await expect( parentRow ).toBeVisible( { timeout: 10_000 } );

			// Parent aufklappen, sodass Child sichtbar ist.
			const expandButton = parentRow.locator(
				'button[aria-label="Expand folder"]'
			);
			if ( await expandButton.isVisible() ) {
				const isExpanded =
					( await expandButton.getAttribute( 'aria-expanded' ) ) ===
					'true';
				if ( ! isExpanded ) {
					await expandButton.click();
				}
			}

			await expect( folderRow( page, childFolder.id ) ).toBeVisible( {
				timeout: 10_000,
			} );

			// 1) Rekursiver Drop wird blockiert.
			await startDragOnFolder( page, parentRow );
			const childIntoDrop = dropZone( page, 'into', childFolder.id );
			await expect( childIntoDrop ).toHaveCount( 0, { timeout: 1_500 } );
			await page.mouse.up();
			await waitForFolderParent( page, parentFolder.id, 0 );

			// 2) Valides Move: Sibling → Parent
			await dragFolderToLocator(
				page,
				folderRow( page, siblingFolder.id ),
				dropZone( page, 'into', parentFolder.id )
			);
			await waitForFolderParent(
				page,
				siblingFolder.id,
				parentFolder.id
			);

			// 3) Root-Drop vom Child auf „All Files“.
			const rootDrop = page.getByTestId( 'wft-folder-root-dropzone' );
			await startDragOnFolder( page, folderRow( page, childFolder.id ) );
			const rootBox = await rootDrop.boundingBox();
			expect( rootBox ).toBeTruthy();
			await page.mouse.move(
				rootBox.x + rootBox.width / 2,
				rootBox.y + rootBox.height / 2,
				{ steps: 4 }
			);
			await expect(
				rootDrop.getByText( 'Drop here to remove folder assignment' )
			).toBeVisible( { timeout: 2_000 } );
			await page.waitForTimeout( 120 );
			await page.mouse.up();
			await waitForFolderParent( page, childFolder.id, 0 );
		} finally {
			await deleteFolder( page, siblingFolder.id );
			await deleteFolder( page, childFolder.id );
			await deleteFolder( page, parentFolder.id );
		}
	} );
} );
