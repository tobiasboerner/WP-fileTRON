/* eslint-env jest */

import { render, screen } from '@testing-library/react';
import FolderModal, {
	deriveInitialFolderState,
} from '../../components/FolderModal';

const mockDispatch = {
	addFolder: jest.fn(),
	updateFolder: jest.fn(),
	setFolders: jest.fn(),
	setExpandedFolders: jest.fn(),
	setSelectedFolder: jest.fn(),
};

let mockFolders = [];
let mockExpandedFolders = [];

jest.mock( '@wordpress/data', () => ( {
	createReduxStore: jest.fn( () => ( {} ) ),
	register: jest.fn(),
	useDispatch: () => mockDispatch,
	useSelect: ( mapSelect ) =>
		mapSelect( () => ( {
			getFolders: () => mockFolders,
			getExpandedFolders: () => mockExpandedFolders,
		} ) ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: ( str ) => str,
} ) );

describe( 'deriveInitialFolderState', () => {
	it( 'returns defaults for a new folder with provided parent id', () => {
		const result = deriveInitialFolderState( null, 7 );

		expect( result ).toEqual( {
			name: '',
			parentId: 7,
		} );
	} );

	it( 'prefers folder data when editing an existing folder', () => {
		const result = deriveInitialFolderState(
			{
				name: 'Archives',
				color: '#123456',
				parent_id: '4',
			},
			1
		);

		expect( result ).toEqual( {
			name: 'Archives',
			parentId: 4,
		} );
	} );

	it( 'falls back to root when parent is null and no fallback provided', () => {
		const result = deriveInitialFolderState(
			{
				name: 'Loose',
				color: '#abcdef',
				parent_id: null,
			},
			undefined
		);

		expect( result ).toEqual( {
			name: 'Loose',
			parentId: 0,
		} );
	} );
} );

describe( 'FolderModal component sync', () => {
	const noop = () => {};

	beforeEach( () => {
		jest.clearAllMocks();
		mockFolders = [];
		mockExpandedFolders = [];
	} );

	it( 'resets form state when the folder prop updates with new data', () => {
		mockFolders = [
			{ id: 5, parent_id: 0, name: 'Projects' },
			{ id: 10, parent_id: 0, name: 'Drafts' },
		];

		const { rerender } = render(
			<FolderModal
				folder={ { id: 10, name: 'Drafts', parent_id: 0 } }
				parentId={ 0 }
				onClose={ noop }
			/>
		);

		expect(
			screen.getByLabelText( 'Folder Name' )
		).toHaveValue( 'Drafts' );
		expect( screen.getByLabelText( 'Parent Folder' ) ).toHaveValue( '0' );

		mockFolders = [
			{ id: 5, parent_id: 0, name: 'Projects' },
			{ id: 10, parent_id: 5, name: 'Marketing' },
		];

		rerender(
			<FolderModal
				folder={ { id: 10, name: 'Marketing', parent_id: 5 } }
				parentId={ 0 }
				onClose={ noop }
			/>
		);

		expect(
			screen.getByLabelText( 'Folder Name' )
		).toHaveValue( 'Marketing' );
		expect( screen.getByLabelText( 'Parent Folder' ) ).toHaveValue( '5' );
	} );
} );
