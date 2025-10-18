/**
 * MediaDetailsPanel tests
 */

import {
	render,
	screen,
	fireEvent,
	waitFor,
	act,
} from '@testing-library/react';
import MediaDetailsPanel from '../MediaDetailsPanel';

jest.mock( '@wordpress/i18n', () => ( {
	__: ( txt ) => txt,
} ) );

const mockStoreName = 'wft/filetron';

const mockStoreDispatch = {
	addMediaItem: jest.fn(),
};
const mockNoticesDispatch = {
	createNotice: jest.fn(),
	removeNotice: jest.fn(),
};

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn( ( storeName ) => {
		if ( storeName === mockStoreName ) {
			return mockStoreDispatch;
		}
		if ( storeName === 'core/notices' ) {
			return mockNoticesDispatch;
		}
		return {};
	} ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '../../store', () => ( {
	STORE_NAME: 'wft/filetron',
} ) );

const mockUpdate = jest.fn();

jest.mock( '../../api/endpoints', () => ( {
	mediaAPI: {
		update: ( ...args ) => mockUpdate( ...args ),
	},
} ) );

const baseItem = {
	id: 1,
	title: 'Sample image',
	alt_text: 'An image',
	description: 'Initial description',
	uploaded: '2024-01-01T00:00:00Z',
};

beforeEach( () => {
	jest.clearAllMocks();
	jest.useFakeTimers();
	mockNoticesDispatch.createNotice.mockReturnValue( 'notice-id' );
} );

afterEach( () => {
	act( () => {
		jest.runOnlyPendingTimers();
	} );
	jest.useRealTimers();
} );

describe( 'MediaDetailsPanel', () => {
	it( 'submits updated metadata and shows success notice', async () => {
		mockUpdate.mockResolvedValue( {
			success: true,
			data: { id: 1, title: 'Updated title' },
		} );

		render( <MediaDetailsPanel item={ baseItem } onClose={ jest.fn() } /> );

		const titleInput = screen.getByLabelText( 'Title' );
		fireEvent.change( titleInput, { target: { value: 'Updated title' } } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save changes' } )
		);

		await waitFor( () => {
			expect( mockUpdate ).toHaveBeenCalledWith( 1, {
				title: 'Updated title',
				alt_text: baseItem.alt_text,
				description: baseItem.description,
			} );
		} );

		await waitFor( () => {
			expect( mockNoticesDispatch.createNotice ).toHaveBeenCalled();
		} );

		expect( mockStoreDispatch.addMediaItem ).toHaveBeenCalledWith( {
			id: 1,
			title: 'Updated title',
		} );
		expect( mockNoticesDispatch.createNotice ).toHaveBeenCalledWith(
			'success',
			'Media details updated.',
			expect.objectContaining( {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);
	} );

	it( 'handles failed saves by surfacing an error notice', async () => {
		mockUpdate.mockRejectedValue( new Error( 'Save failed' ) );

		render( <MediaDetailsPanel item={ baseItem } onClose={ jest.fn() } /> );

		fireEvent.change( screen.getByLabelText( 'Title' ), {
			target: { value: 'Broken update' },
		} );

		fireEvent.submit(
			screen
				.getByRole( 'button', { name: 'Save changes' } )
				.closest( 'form' )
		);

		await waitFor( () => {
			expect( mockUpdate ).toHaveBeenCalled();
		} );

		await waitFor( () => {
			expect( mockNoticesDispatch.createNotice ).toHaveBeenCalled();
		} );

		expect( mockNoticesDispatch.createNotice ).toHaveBeenCalledWith(
			'error',
			'Save failed',
			expect.objectContaining( {
				type: 'snackbar',
				explicitDismiss: true,
			} )
		);

		expect( screen.getByText( 'Save failed' ) ).toBeInTheDocument();
	} );
} );
