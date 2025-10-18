/**
 * UploadPanel behavioural tests
 */

/* eslint-disable no-console */
import { render, waitFor, act } from '@testing-library/react';
import UploadPanel from '../UploadPanel';

const mockStoreName = 'wft/filetron';

const mockDispatch = {
	setUploadQueue: jest.fn(),
	setUploadOverlayVisible: jest.fn(),
	setError: jest.fn(),
	addMediaItem: jest.fn(),
};
const mockNoticesDispatch = {
	createNotice: jest.fn(),
	removeNotice: jest.fn(),
};

const baseQueueItem = {
	id: 'file-1',
	file: new File( [ 'pretend' ], 'demo.png', { type: 'image/png' } ),
	progress: 0,
	status: 'pending',
};

let mockSelectState;

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn( ( storeName ) => {
		if ( storeName === mockStoreName ) {
			return mockDispatch;
		}
		if ( storeName === 'core/notices' ) {
			return mockNoticesDispatch;
		}
		return {};
	} ),
	useSelect: jest.fn( ( mapSelect ) =>
		mapSelect( () => ( {
			getUploadQueue: () => mockSelectState.queue,
			getSelectedFolder: () => mockSelectState.selectedFolder,
		} ) )
	),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../../store', () => ( {
	STORE_NAME: 'wft/filetron',
} ) );

const mockUpload = jest.fn();
const mockGetAll = jest.fn().mockResolvedValue( {
	success: true,
	data: {
		items: [],
		total: 0,
		total_pages: 0,
		current_page: 1,
	},
} );

jest.mock( '../../api/endpoints', () => ( {
	mediaAPI: {
		upload: ( ...args ) => mockUpload( ...args ),
		getAll: ( ...args ) => mockGetAll( ...args ),
	},
} ) );

describe( 'UploadPanel', () => {
	beforeEach( () => {
		mockSelectState = {
			queue: [ baseQueueItem ],
			selectedFolder: 42,
		};
		jest.clearAllMocks();
		jest.useFakeTimers();
		mockNoticesDispatch.createNotice.mockReturnValue( 'notice-id' );
		// eslint-disable-next-line no-console
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		act( () => {
			jest.runOnlyPendingTimers();
		} );
		jest.useRealTimers();
		console.error.mockRestore();
	} );

	it( 'uploads pending files and notifies success', async () => {
		mockUpload.mockResolvedValue( {
			success: true,
			data: { id: 101, title: 'New upload' },
		} );

		render( <UploadPanel /> );

		await waitFor( () => {
			expect( mockUpload ).toHaveBeenCalled();
		} );
		await waitFor( () => {
			expect( mockNoticesDispatch.createNotice ).toHaveBeenCalled();
		} );

		await act( async () => {
			jest.runOnlyPendingTimers();
		} );

		expect( mockDispatch.addMediaItem ).toHaveBeenCalledWith( {
			id: 101,
			title: 'New upload',
		} );
		expect( mockNoticesDispatch.createNotice ).toHaveBeenCalledWith(
			'success',
			expect.stringContaining( 'file uploaded successfully' ),
			expect.objectContaining( {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
	} );

	it( 'handles upload failures and reports errors', async () => {
		mockUpload.mockRejectedValue( new Error( 'Upload exploded' ) );

		render( <UploadPanel /> );

		await waitFor( () => {
			expect( mockUpload ).toHaveBeenCalled();
		} );
		await waitFor( () => {
			expect( mockNoticesDispatch.createNotice ).toHaveBeenCalled();
		} );

		await act( async () => {
			jest.runOnlyPendingTimers();
		} );

		expect( mockNoticesDispatch.createNotice ).toHaveBeenCalledWith(
			'error',
			'Upload exploded',
			expect.objectContaining( {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
	} );
} );
