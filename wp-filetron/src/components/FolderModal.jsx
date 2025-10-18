/**
 * Folder Modal Component
 *
 * Modal dialog for creating/editing folders.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useId,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../store';
import { folderAPI, handleAPIError } from '../api/endpoints';

export function deriveInitialFolderState( folder, fallbackParentId = 0 ) {
	const rawParent =
		folder?.parent_id === undefined || folder?.parent_id === null
			? fallbackParentId ?? 0
			: folder.parent_id;
	const numericParent = Number( rawParent );

	return {
		name: folder?.name ?? '',
		parentId: Number.isNaN( numericParent ) ? rawParent : numericParent,
	};
}

export default function FolderModal( {
	folder = null,
	parentId = 0,
	onClose,
} ) {
	const {
		addFolder: addFolderToStore,
		updateFolder: updateFolderInStore,
		setFolders,
		setExpandedFolders,
		setSelectedFolder,
	} = useDispatch( STORE_NAME );
	const isEdit = !! folder;

	// Form state
	const initialState = deriveInitialFolderState( folder, parentId );
	const [ name, setName ] = useState( initialState.name );
	const [ selectedParentId, setSelectedParentId ] = useState(
		initialState.parentId
	);
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ error, setError ] = useState( null );
	const nameInputId = useId();
	const parentSelectId = useId();
	const titleId = useId();

	useEffect( () => {
		const nextState = deriveInitialFolderState( folder, parentId );
		setName( nextState.name );
		setSelectedParentId( nextState.parentId );
		setError( null );
		setIsSubmitting( false );
	}, [ folder, parentId ] );

	// Get all folders for parent selection
	const folders = useSelect( ( select ) =>
		select( STORE_NAME ).getFolders()
	);
	const expandedFolders = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return store.getExpandedFolders ? store.getExpandedFolders() : [];
	}, [] );

	const closeModalIfAllowed = useCallback( () => {
		if ( isSubmitting ) {
			return;
		}
		onClose();
	}, [ isSubmitting, onClose ] );

	const refreshFolders = useCallback( async () => {
		const latest = await folderAPI.getAll();

		if ( ! latest?.success || ! latest?.data ) {
			throw new Error(
				latest?.message ||
					__( 'Failed to refresh folders.', 'wp-filetron' )
			);
		}

		setFolders( latest.data );
		return latest.data;
	}, [ setFolders ] );

	const ensureParentExpanded = useCallback(
		( parent ) => {
			const numericParent = Number( parent ) || 0;
			if ( numericParent === 0 ) {
				return;
			}

			const alreadyExpanded = expandedFolders.some(
				( id ) => Number( id ) === numericParent
			);

			if ( alreadyExpanded ) {
				return;
			}

			const nextExpanded = Array.from(
				new Set( [
					...expandedFolders.map( ( id ) => Number( id ) ),
					numericParent,
				] )
			);

			setExpandedFolders( nextExpanded );
		},
		[ expandedFolders, setExpandedFolders ]
	);

	const excludedFolderIds = useMemo( () => {
		if ( ! folder?.id ) {
			return new Set();
		}

		const descendants = new Set();
		const collect = ( parent ) => {
			folders.forEach( ( item ) => {
				const parentValue = Number( item.parent_id ) || 0;
				if ( parentValue === parent && ! descendants.has( item.id ) ) {
					descendants.add( item.id );
					collect( Number( item.id ) );
				}
			} );
		};

		collect( Number( folder.id ) );
		descendants.add( Number( folder.id ) );
		return descendants;
	}, [ folder?.id, folders ] );

	const treeOptions = useMemo( () => {
		const map = new Map();

		folders.forEach( ( item ) => {
			const itemId = Number( item.id );
			if ( excludedFolderIds.has( itemId ) ) {
				return;
			}

			const parentValue = Number( item.parent_id ) || 0;
			if ( ! map.has( parentValue ) ) {
				map.set( parentValue, [] );
			}
			map.get( parentValue ).push( item );
		} );

		map.forEach( ( list ) => {
			list.sort( ( a, b ) =>
				( a.name || '' ).localeCompare( b.name || '' )
			);
		} );

		const result = [];
		const traverse = ( currentParent = 0, depth = 0 ) => {
			const children = map.get( currentParent ) || [];
			children.forEach( ( child ) => {
				result.push( {
					id: Number( child.id ),
					depth,
					label:
						child.name || __( '(Untitled folder)', 'wp-filetron' ),
				} );
				traverse( Number( child.id ), depth + 1 );
			} );
		};

		traverse();
		return result;
	}, [ folders, excludedFolderIds ] );

	const parentOptions = useMemo( () => {
		const options = treeOptions.map( ( option ) => ( {
			...option,
			displayLabel: `${ '\u00A0\u00A0'.repeat( option.depth ) }${
				option.label
			}`,
		} ) );

		if (
			selectedParentId &&
			selectedParentId !== 0 &&
			! options.some(
				( option ) => Number( option.id ) === Number( selectedParentId )
			)
		) {
			const current = folders.find(
				( item ) => Number( item.id ) === Number( selectedParentId )
			);

			if ( current && ! excludedFolderIds.has( Number( current.id ) ) ) {
				options.unshift( {
					id: Number( current.id ),
					depth: 0,
					label:
						current.name ||
						__( '(Untitled folder)', 'wp-filetron' ),
					displayLabel:
						current.name ||
						__( '(Untitled folder)', 'wp-filetron' ),
				} );
			}
		}

		return options;
	}, [ treeOptions, selectedParentId, folders, excludedFolderIds ] );

	// Handle form submission
	const handleSubmit = async ( e ) => {
		e.preventDefault();
		setError( null );

		if ( ! name.trim() ) {
			setError( __( 'Folder name is required', 'wp-filetron' ) );
			return;
		}

		setIsSubmitting( true );

		try {
			const payload = {
				name: name.trim(),
				parent_id: selectedParentId,
			};
			const response = isEdit
				? await folderAPI.update( folder.id, payload )
				: await folderAPI.create( payload );

			if ( ! response?.success || ! response?.data ) {
				throw new Error(
					response?.message ||
						__( 'Failed to save folder', 'wp-filetron' )
				);
			}

			const savedFolder = response.data;
			const savedParentId = Number( savedFolder.parent_id ) || 0;

			if ( isEdit ) {
				updateFolderInStore( savedFolder );
			} else {
				addFolderToStore( savedFolder );
			}

			ensureParentExpanded( savedParentId );

			if ( ! isEdit && savedFolder?.id ) {
				setSelectedFolder( Number( savedFolder.id ) );
			}

			try {
				await refreshFolders();
			} catch ( syncError ) {
				// eslint-disable-next-line no-console
				console.error(
					'WP fileTRON: failed to refresh folders after saving.',
					syncError
				);
			}

			setIsSubmitting( false );
			onClose();
		} catch ( err ) {
			setError( handleAPIError( err ) );
			setIsSubmitting( false );
		}
	};

	let submitLabel = __( 'Create', 'wp-filetron' );
	if ( isEdit ) {
		submitLabel = __( 'Update', 'wp-filetron' );
	}
	if ( isSubmitting ) {
		submitLabel = __( 'Saving…', 'wp-filetron' );
	}

	return (
		<>
			{ /* Overlay */ }
			<div
				className="wft-fixed wft-inset-0 wft-bg-black wft-bg-opacity-50 wft-z-50"
				onClick={ closeModalIfAllowed }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						event.preventDefault();
						closeModalIfAllowed();
					}
				} }
				role="button"
				tabIndex={ 0 }
				aria-label={ __( 'Close folder modal', 'wp-filetron' ) }
			/>

			{ /* Modal */ }
			<div
				className="wft-fixed wft-inset-0 wft-z-50 wft-flex wft-items-center wft-justify-center wft-p-4"
				role="dialog"
				aria-modal="true"
				aria-labelledby={ titleId }
			>
				<div className="wft-bg-white wft-rounded-lg wft-shadow-xl wft-max-w-md wft-w-full">
					{ /* Header */ }
					<div className="wft-px-6 wft-py-4 wft-border-b wft-border-gray-200">
						<h2
							id={ titleId }
							className="wft-text-lg wft-font-semibold wft-text-gray-900"
						>
							{ isEdit
								? __( 'Edit Folder', 'wp-filetron' )
								: __( 'New Folder', 'wp-filetron' ) }
						</h2>
					</div>

					{ /* Body */ }
					<form
						onSubmit={ handleSubmit }
						className="wft-px-6 wft-py-4"
					>
						{ /* Error Message */ }
						{ error && (
							<div className="wft-mb-4 wft-p-3 wft-bg-red-50 wft-border wft-border-red-200 wft-rounded wft-text-sm wft-text-red-800">
								{ error }
							</div>
						) }

						{ /* Folder Name */ }
						<div className="wft-mb-4">
							<label
								className="wft-block wft-text-sm wft-font-medium wft-text-gray-700 wft-mb-1"
								htmlFor={ nameInputId }
							>
								{ __( 'Folder Name', 'wp-filetron' ) }
							</label>
							<input
								id={ nameInputId }
								type="text"
								value={ name }
								onChange={ ( e ) => setName( e.target.value ) }
								className="wft-w-full wft-px-3 wft-py-2 wft-border wft-border-gray-300 wft-rounded-md focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
								placeholder={ __(
									'Enter folder name…',
									'wp-filetron'
								) }
								required
							/>
						</div>

						{ /* Parent Folder Selection */ }
						<div className="wft-mb-4">
							<label
								className="wft-block wft-text-sm wft-font-medium wft-text-gray-700 wft-mb-1"
								htmlFor={ parentSelectId }
							>
								{ __( 'Parent Folder', 'wp-filetron' ) }
							</label>
							<select
								id={ parentSelectId }
								value={ selectedParentId }
								onChange={ ( e ) =>
									setSelectedParentId(
										Number( e.target.value )
									)
								}
								className="wft-w-full wft-px-3 wft-py-2 wft-border wft-border-gray-300 wft-rounded-md focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
							>
								<option value={ 0 }>
									{ __(
										'— Root (No Parent) —',
										'wp-filetron'
									) }
								</option>
								{ parentOptions.map( ( f ) => (
									<option key={ f.id } value={ f.id }>
										{ f.displayLabel || f.label || f.name }
									</option>
								) ) }
							</select>
						</div>

						{ /* Actions */ }
						<div className="wft-flex wft-justify-end wft-gap-3 wft-pt-4">
							<button
								type="button"
								onClick={ onClose }
								className="wft-px-4 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100 wft-rounded-md"
								disabled={ isSubmitting }
							>
								{ __( 'Cancel', 'wp-filetron' ) }
							</button>
							<button
								type="submit"
								className="wft-px-4 wft-py-2 wft-text-sm wft-font-medium wft-text-white wft-bg-blue-600 hover:wft-bg-blue-700 wft-rounded-md disabled:wft-opacity-50"
								disabled={ isSubmitting }
							>
								{ submitLabel }
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
