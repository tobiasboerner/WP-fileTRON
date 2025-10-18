/**
 * Folder Tree Component
 *
 * Hierarchical folder browser with improved drag-and-drop behaviour
 * built on react-beautiful-dnd. Supports arbitrary nesting by using
 * combine targets for moving folders into other folders.
 */

import { useCallback, useMemo, useState, useId } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import FolderItem from './FolderItem';
import FolderModal from './FolderModal';
import { STORE_NAME } from '../store';
import { folderAPI } from '../api/endpoints';

const ROOT_PARENT_ID = 0;

export default function FolderTree() {
	const dispatch = useDispatch( STORE_NAME );
	const [ contextMenu, setContextMenu ] = useState( null );
	const [ editingFolder, setEditingFolder ] = useState( null );
	const [ pendingDelete, setPendingDelete ] = useState( null );
	const [ deleteError, setDeleteError ] = useState( null );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const deleteDialogTitleId = useId();

	const { folders, selectedFolder, expandedFolders } = useSelect(
		( select ) => {
			const store = select( STORE_NAME );

			return {
				folders: store.getFolders(),
				selectedFolder: store.getSelectedFolder(),
				expandedFolders: store.getExpandedFolders(),
			};
		}
	);

	const foldersByParent = useMemo( () => {
		const grouped = new Map();

		folders.forEach( ( folder ) => {
			const parentId = folder.parent_id ?? ROOT_PARENT_ID;
			if ( ! grouped.has( parentId ) ) {
				grouped.set( parentId, [] );
			}
			grouped.get( parentId ).push( folder );
		} );

		grouped.forEach( ( list ) => {
			list.sort( ( a, b ) => {
				if ( a.order_index !== b.order_index ) {
					return a.order_index - b.order_index;
				}
				return a.name.localeCompare( b.name );
			} );
		} );

		return grouped;
	}, [ folders ] );
	const getChildFolders = useCallback(
		( parentId ) => foldersByParent.get( parentId ?? ROOT_PARENT_ID ) || [],
		[ foldersByParent ]
	);

	const isFolderExpanded = useCallback(
		( folderId ) => expandedFolders.includes( folderId ),
		[ expandedFolders ]
	);

	const closeContextMenu = useCallback( () => {
		setContextMenu( null );
	}, [] );

	const handleSelectFolder = ( folderId ) => {
		dispatch.setSelectedFolder( folderId );
		closeContextMenu();
	};

	const handleToggleFolder = ( folderId ) => {
		dispatch.toggleFolderExpanded( folderId );
	};

	const handleContextMenu = ( event, folder ) => {
		event.preventDefault();
		event.stopPropagation();

		setContextMenu( {
			x: event.clientX,
			y: event.clientY,
			folder,
		} );
	};

	const handleDeleteFolder = ( folder ) => {
		if ( ! folder ) {
			return;
		}

		setPendingDelete( folder );
		setDeleteError( null );
		closeContextMenu();
	};

	const cancelDeleteFolder = () => {
		setPendingDelete( null );
		setDeleteError( null );
	};

	const confirmDeleteFolder = async () => {
		if ( ! pendingDelete ) {
			return;
		}

		setIsDeleting( true );

		try {
			const response = await folderAPI.delete( pendingDelete.id );

			if ( response.success ) {
				dispatch.removeFolder( pendingDelete.id );
				cancelDeleteFolder();
				return;
			}

			throw new Error( response.message || 'Failed to delete folder' );
		} catch ( error ) {
			const message =
				error?.message ||
				__( 'Failed to delete folder', 'wp-filetron' );
			setDeleteError( message );
			dispatch.setError( message );
		} finally {
			setIsDeleting( false );
		}
	};

	const renderFolderList = ( parentId, level = 0 ) => {
		const children = getChildFolders( parentId );
		if ( children.length === 0 ) {
			return null;
		}

		return (
			<div className="wft-space-y-0.5">
				{ children.map( ( folder ) => {
					const childCount = getChildFolders( folder.id ).length;

					return (
						<div key={ folder.id }>
							<FolderItem
								folder={ folder }
								level={ level }
								selectedFolder={ selectedFolder }
								onSelect={ handleSelectFolder }
								onContextMenu={ handleContextMenu }
								isExpanded={ isFolderExpanded( folder.id ) }
								onToggleExpand={ handleToggleFolder }
								hasChildren={ childCount > 0 }
								childCount={ childCount }
							/>
							{ isFolderExpanded( folder.id ) &&
								childCount > 0 && (
									<div className="wft-ml-3">
										{ renderFolderList(
											folder.id,
											level + 1
										) }
									</div>
								) }
						</div>
					);
				} ) }
			</div>
		);
	};

	const deleteMessage = pendingDelete
		? sprintf(
				/* translators: %s is the folder name. */
				__(
					'Are you sure you want to delete the folder “%s”? Files inside will remain available in All Files.',
					'wp-filetron'
				),
				pendingDelete.name
		  )
		: '';

	return (
		<div className="wft-space-y-0.5">
			<button
				onClick={ () => handleSelectFolder( null ) }
				className={ classNames(
					'wft-w-full wft-text-left wft-px-2 wft-py-1.5 wft-rounded wft-text-sm wft-flex wft-items-center wft-gap-2',
					{
						'wft-bg-blue-50 wft-text-blue-700 wft-font-medium':
							selectedFolder === null,
						'wft-text-gray-700 hover:wft-bg-gray-100':
							selectedFolder !== null,
					}
				) }
			>
				<span aria-hidden="true">📁</span>
				<span>{ __( 'All Files', 'wp-filetron' ) }</span>
			</button>

			{ getChildFolders( ROOT_PARENT_ID ).length === 0 ? (
				<div className="wft-px-2 wft-py-4 wft-text-xs wft-text-gray-500 wft-text-center">
					{ __( 'No folders yet', 'wp-filetron' ) }
					<br />
					{ __( 'Click + to create one', 'wp-filetron' ) }
				</div>
			) : (
				renderFolderList( ROOT_PARENT_ID, 0 )
			) }

			{ contextMenu && (
				<>
					<div
						className="wft-fixed wft-inset-0 wft-z-40"
						onClick={ closeContextMenu }
						onKeyDown={ ( event ) => {
							if ( event.key === 'Enter' || event.key === ' ' ) {
								event.preventDefault();
								closeContextMenu();
							}
						} }
						role="button"
						tabIndex={ 0 }
						aria-label={ __( 'Close folder menu', 'wp-filetron' ) }
					/>
					<div
						className="wft-fixed wft-z-50 wft-bg-white wft-rounded-md wft-shadow-lg wft-border wft-border-gray-200 wft-py-1 wft-min-w-[160px]"
						style={ {
							left: `${ contextMenu.x }px`,
							top: `${ contextMenu.y }px`,
						} }
					>
						<button
							onClick={ () => {
								if ( contextMenu?.folder ) {
									setEditingFolder( contextMenu.folder );
								}
								closeContextMenu();
							} }
							className="wft-w-full wft-text-left wft-px-4 wft-py-2 wft-text-sm wft-text-gray-700 hover:wft-bg-gray-100"
						>
							{ __( 'Rename', 'wp-filetron' ) }
						</button>
						<hr className="wft-my-1 wft-border-gray-200" />
						<button
							onClick={ () =>
								handleDeleteFolder( contextMenu.folder )
							}
							className="wft-w-full wft-text-left wft-px-4 wft-py-2 wft-text-sm wft-text-red-600 hover:wft-bg-red-50"
						>
							{ __( 'Delete', 'wp-filetron' ) }
						</button>
					</div>
				</>
			) }

			{ pendingDelete && (
				<>
					<div
						className="wft-fixed wft-inset-0 wft-bg-black wft-bg-opacity-40 wft-z-40"
						onClick={ cancelDeleteFolder }
						onKeyDown={ ( event ) => {
							if ( event.key === 'Enter' || event.key === ' ' ) {
								event.preventDefault();
								cancelDeleteFolder();
							}
						} }
						role="button"
						tabIndex={ 0 }
						aria-label={ __(
							'Cancel folder deletion',
							'wp-filetron'
						) }
					/>
					<div
						className="wft-fixed wft-inset-0 wft-z-50 wft-flex wft-items-center wft-justify-center wft-p-4"
						role="dialog"
						aria-modal="true"
						aria-labelledby={ deleteDialogTitleId }
					>
						<div className="wft-bg-white wft-rounded-lg wft-shadow-xl wft-max-w-md wft-w-full wft-border wft-border-gray-200">
							<div className="wft-px-6 wft-py-4 wft-border-b wft-border-gray-200">
								<h2
									id={ deleteDialogTitleId }
									className="wft-text-lg wft-font-semibold wft-text-gray-900"
								>
									{ __( 'Delete folder', 'wp-filetron' ) }
								</h2>
							</div>
							<div className="wft-px-6 wft-py-4 wft-space-y-4">
								<p className="wft-text-sm wft-text-gray-700">
									{ deleteMessage }
								</p>
								{ deleteError && (
									<div className="wft-p-3 wft-bg-red-50 wft-border wft-border-red-200 wft-rounded wft-text-sm wft-text-red-700">
										{ deleteError }
									</div>
								) }
								<div className="wft-flex wft-justify-end wft-gap-3">
									<button
										type="button"
										onClick={ cancelDeleteFolder }
										className="wft-px-4 wft-py-2 wft-text-sm wft-font-medium wft-text-gray-700 hover:wft-bg-gray-100 wft-rounded-md"
										disabled={ isDeleting }
									>
										{ __( 'Cancel', 'wp-filetron' ) }
									</button>
									<button
										type="button"
										onClick={ confirmDeleteFolder }
										className="wft-px-4 wft-py-2 wft-text-sm wft-font-medium wft-text-white wft-bg-red-600 hover:wft-bg-red-700 wft-rounded-md disabled:wft-opacity-50"
										disabled={ isDeleting }
									>
										{ isDeleting
											? __( 'Deleting…', 'wp-filetron' )
											: __( 'Delete', 'wp-filetron' ) }
									</button>
								</div>
							</div>
						</div>
					</div>
				</>
			) }

			{ editingFolder && (
				<FolderModal
					folder={ editingFolder }
					onClose={ () => setEditingFolder( null ) }
				/>
			) }
		</div>
	);
}
