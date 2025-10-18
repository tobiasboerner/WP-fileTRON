/**
 * MediaGrid interaction tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import MediaGrid from '../MediaGrid';

const mockDispatch = {
	setMediaPerPage: jest.fn(),
	setMediaCurrentPage: jest.fn(),
	clearMediaSelection: jest.fn(),
	setSelectedMedia: jest.fn(),
	toggleMediaSelection: jest.fn(),
	removeMediaItems: jest.fn(),
	updateMediaFolders: jest.fn(),
	setPreviewMedia: jest.fn(),
	clearPreviewMedia: jest.fn(),
};

const selectReturnValue = {
	media: [
		{ id: 1, folder_id: 0, title: 'Image 1' },
		{ id: 2, folder_id: 0, title: 'Image 2' },
	],
	viewMode: 'grid',
	isLoading: false,
	selectedFolder: null,
	selectedMedia: [],
	mediaPagination: {
		total: 20,
		totalPages: 3,
		currentPage: 1,
		perPage: 24,
	},
};

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => mockDispatch,
	useSelect: ( mapSelect ) =>
		mapSelect( () => ( {
			getMedia: () => selectReturnValue.media,
			getViewMode: () => selectReturnValue.viewMode,
			isLoading: () => selectReturnValue.isLoading,
			getSelectedFolder: () => selectReturnValue.selectedFolder,
			getSelectedMedia: () => selectReturnValue.selectedMedia,
			getMediaPagination: () => selectReturnValue.mediaPagination,
			getPreviewMedia: () => null,
		} ) ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( str ) => str,
	_n: ( one, other, value ) => ( value === 1 ? one : other ),
	sprintf: ( format, ...args ) =>
		format.replace( /%s/g, () => String( args.shift() ) ),
} ) );

jest.mock( '../../store', () => ( {
	STORE_NAME: 'wft/filetron',
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

jest.mock( '@wordpress/components', () => {
	const { createElement } = require( '@wordpress/element' );
	return {
		Button: ( { children, ...props } ) =>
			createElement( 'button', props, children ),
		Modal: ( { children, ...props } ) =>
			createElement( 'div', { ...props, role: 'dialog' }, children ),
		SelectControl: ( { options = [], value, onChange, ...props } ) =>
			createElement(
				'select',
				{
					...props,
					value,
					onChange: ( event ) =>
						onChange && onChange( event.target.value ),
				},
				options.map( ( option ) =>
					createElement(
						'option',
						{ key: option.value, value: option.value },
						option.label
					)
				)
			),
	};
} );

describe( 'MediaGrid', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'verweist auf den Toolbar-Upload statt eigener Buttons', () => {
		render( <MediaGrid /> );

		expect(
			screen.queryByRole( 'button', { name: /Upload files/i } )
		).toBeNull();
		expect(
			screen.getByText(
				'Use the Upload button in the toolbar to add new files at any time.'
			)
		).toBeInTheDocument();
	} );

	it( 'updates per-page selection and resets pagination', () => {
		render( <MediaGrid /> );

		const select = screen.getByLabelText( 'Items per page:' );
		fireEvent.change( select, { target: { value: '48' } } );

		expect( mockDispatch.setMediaPerPage ).toHaveBeenCalledWith( 48 );
		expect( mockDispatch.setMediaCurrentPage ).toHaveBeenCalledWith( 1 );
	} );
} );
