/**
 * Store reducer tests
 *
 * Verifies upload queue and pagination interplay introduced in recent
 * UI enhancements.
 */

import * as actions from '../actions';
import { reducer } from '../reducer';

const initState = reducer( undefined, { type: '@@INIT' } );

describe( 'store reducer', () => {
	it( 'stores a provided upload queue array', () => {
		const queue = [
			{ id: 'a', status: 'pending', progress: 0 },
			{ id: 'b', status: 'completed', progress: 100 },
		];
		const state = reducer( initState, actions.setUploadQueue( queue ) );

		expect( state.uploadQueue ).toEqual( queue );
	} );

	it( 'normalises non-array upload queue payloads', () => {
		const state = reducer( initState, actions.setUploadQueue( null ) );
		expect( state.uploadQueue ).toEqual( [] );
	} );

	it( 'normalises folder ids on add and update', () => {
		const seeded = reducer( initState, actions.setFolders( [] ) );

		const added = reducer(
			seeded,
			actions.addFolder( { id: '12', parent_id: '0', name: 'Docs' } )
		);

		expect( added.folders ).toHaveLength( 1 );
		expect( added.folders[ 0 ].id ).toBe( 12 );
		expect( added.folders[ 0 ].parent_id ).toBe( 0 );

		const updated = reducer(
			added,
			actions.updateFolder( {
				id: '12',
				parent_id: '5',
				name: 'Docs 2',
			} )
		);

		expect( updated.folders[ 0 ].parent_id ).toBe( 5 );
		expect( updated.folders[ 0 ].name ).toBe( 'Docs 2' );
	} );

	it( 'deduplicates expanded folder ids while normalising', () => {
		const state = reducer(
			initState,
			actions.setExpandedFolders( [ '4', 4, null, 7, '7' ] )
		);

		expect( state.expandedFolders ).toEqual( [ 4, 7 ] );
	} );

	it( 'updates media collection and pagination counters', () => {
		const payload = {
			items: [
				{ id: 1, title: 'Item 1' },
				{ id: 2, title: 'Item 2' },
			],
			total: 12,
			totalPages: 4,
			currentPage: 2,
		};

		const state = reducer(
			initState,
			actions.setMedia(
				payload.items,
				payload.total,
				payload.totalPages,
				payload.currentPage
			)
		);

		expect( state.media ).toHaveLength( 2 );
		expect( state.mediaTotal ).toBe( payload.total );
		expect( state.mediaTotalPages ).toBe( payload.totalPages );
		expect( state.mediaCurrentPage ).toBe( payload.currentPage );
	} );

	it( 'allows adjusting the media page size with guarding against invalid values', () => {
		const withPerPage = reducer( initState, actions.setMediaPerPage( 96 ) );
		expect( withPerPage.mediaPerPage ).toBe( 96 );

		const unchanged = reducer(
			withPerPage,
			actions.setMediaPerPage( -10 )
		);
		expect( unchanged.mediaPerPage ).toBe( 96 );

		const fallback = reducer(
			withPerPage,
			actions.setMediaCurrentPage( 'foo' )
		);
		expect( fallback.mediaCurrentPage ).toBe( 1 );
	} );

	it( 'adds new media items to the front of the list and increments totals', () => {
		const seeded = reducer( initState, actions.setMedia( [], 0, 0, 1 ) );

		const firstInsert = reducer(
			seeded,
			actions.addMediaItem( { id: 1, title: 'Attachment' } )
		);

		expect( firstInsert.media ).toHaveLength( 1 );
		expect( firstInsert.media[ 0 ].id ).toBe( 1 );
		expect( firstInsert.mediaTotal ).toBe( 1 );

		const secondInsert = reducer(
			firstInsert,
			actions.addMediaItem( { id: 2, title: 'Second' } )
		);

		expect( secondInsert.media ).toHaveLength( 2 );
		expect( secondInsert.media[ 0 ].id ).toBe( 2 );
		expect( secondInsert.mediaTotal ).toBe( 2 );
	} );

	it( 'updates existing media items without increasing totals', () => {
		const seeded = reducer(
			initState,
			actions.setMedia( [ { id: 1, title: 'Original' } ], 1, 1, 1 )
		);

		const updated = reducer(
			seeded,
			actions.addMediaItem( { id: 1, title: 'Updated title' } )
		);

		expect( updated.media ).toHaveLength( 1 );
		expect( updated.media[ 0 ].title ).toBe( 'Updated title' );
		expect( updated.mediaTotal ).toBe( 1 );
	} );

	it( 'toggles the upload overlay and normalises input', () => {
		const openState = reducer(
			initState,
			actions.setUploadOverlayVisible( 1 )
		);
		expect( openState.uploadOverlayVisible ).toBe( true );

		const closedState = reducer(
			initState,
			actions.setUploadOverlayVisible( null )
		);
		expect( closedState.uploadOverlayVisible ).toBe( false );
	} );

	it( 'propagates loading and error states with proper resets', () => {
		const loadingState = reducer( initState, actions.setLoading( true ) );
		expect( loadingState.isLoading ).toBe( true );

		const errored = reducer(
			loadingState,
			actions.setError( 'Something went wrong' )
		);
		expect( errored.error ).toBe( 'Something went wrong' );
		expect( errored.isLoading ).toBe( false );

		const cleared = reducer( errored, actions.clearError() );
		expect( cleared.error ).toBeNull();
	} );

	it( 'removes media items and clears related state', () => {
		const seeded = reducer(
			initState,
			actions.setMedia(
				[
					{ id: 1, title: 'Keep me' },
					{ id: 2, title: 'Remove me' },
				],
				2,
				1,
				1
			)
		);
		const withSelection = {
			...seeded,
			selectedMedia: [ 2 ],
			previewMediaId: 2,
		};

		const nextState = reducer(
			withSelection,
			actions.removeMediaItems( [ 2 ] )
		);

		expect( nextState.media ).toHaveLength( 1 );
		expect( nextState.media[ 0 ].id ).toBe( 1 );
		expect( nextState.mediaTotal ).toBe( 1 );
		expect( nextState.selectedMedia ).toEqual( [] );
		expect( nextState.previewMediaId ).toBeNull();
	} );

	it( 'updates folder assignments for multiple media items', () => {
		const seeded = reducer(
			initState,
			actions.setMedia(
				[
					{ id: 1, folder_id: 0 },
					{ id: 2, folder_id: 0 },
				],
				2,
				1,
				1
			)
		);

		const updated = reducer(
			seeded,
			actions.updateMediaFolders( [ 1, 2 ], 7 )
		);

		expect( updated.media.map( ( item ) => item.folder_id ) ).toEqual( [
			7, 7,
		] );
	} );

	it( 'tracks preview media id explicitly', () => {
		const withPreview = reducer( initState, actions.setPreviewMedia( 5 ) );
		expect( withPreview.previewMediaId ).toBe( 5 );

		const clearedPreview = reducer(
			withPreview,
			actions.clearPreviewMedia()
		);
		expect( clearedPreview.previewMediaId ).toBeNull();
	} );
} );
