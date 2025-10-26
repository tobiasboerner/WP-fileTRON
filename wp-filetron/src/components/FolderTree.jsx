/**
 * Folder Tree Component
 *
 * Hierarchical folder browser with drag-and-drop behaviour
 * built on @dnd-kit. Supports arbitrary nesting by offering
 * drop-zones before folders and within folders (children).
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useId,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	closestCorners,
	useDroppable,
	useDraggable,
	useSensors,
	useSensor,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import FolderItem from './FolderItem';
import FolderModal from './FolderModal';
import { STORE_NAME } from '../store';
import { folderAPI } from '../api/endpoints';

const ROOT_PARENT_ID = 0;
const DROP_TYPES = {
	BEFORE: 'before',
	INTO: 'into',
	ROOT: 'root',
};
const DROP_ZONE_PREFIX = 'folder-dropzone';
const AUTO_EXPAND_DELAY = 500;

const createDropZoneId = ( type, folderId = ROOT_PARENT_ID ) =>
	`${ DROP_ZONE_PREFIX }:${ type }:${ folderId }`;

const parseDropZoneId = ( id ) => {
	if ( typeof id !== 'string' ) {
		return null;
	}

	const segments = id.split( ':' );
	const prefix = segments[ 0 ];
	if ( prefix !== DROP_ZONE_PREFIX ) {
		return null;
	}

	const normalizedType = DROP_TYPES[ segments[ 1 ]?.toUpperCase?.() ];
	if ( ! normalizedType ) {
		return null;
	}

	const maybeId = segments[ 2 ];
	const rawFolderId =
		maybeId === undefined || maybeId === ''
			? ROOT_PARENT_ID
			: Number( maybeId );

	return {
		type: normalizedType,
		folderId: Number.isNaN( rawFolderId ) ? ROOT_PARENT_ID : rawFolderId,
	};
};

const normalizeParentId = ( parentId ) =>
	parentId === null || parentId === undefined ? ROOT_PARENT_ID : parentId;

const getIndentForLevel = ( level ) => level * 14 + 12;

const insertWithOrder = ( list, folder, parentId, index ) => {
	const safeIndex = Math.max( 0, Math.min( index, list.length ) );
	const working = list.map( ( item ) => ( {
		...item,
		parent_id: parentId,
	} ) );

	working.splice( safeIndex, 0, {
		...folder,
		parent_id: parentId,
	} );

	return working.map( ( item, orderIndex ) => ( {
		...item,
		order_index: orderIndex,
	} ) );
};

export default function FolderTree() {
	const dispatch = useDispatch( STORE_NAME );
	const [ contextMenu, setContextMenu ] = useState( null );
	const [ editingFolder, setEditingFolder ] = useState( null );
	const [ pendingDelete, setPendingDelete ] = useState( null );
	const [ deleteError, setDeleteError ] = useState( null );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ activeFolderId, setActiveFolderId ] = useState( null );
	const deleteDialogTitleId = useId();
	const autoExpandTimeoutRef = useRef( null );

	const sensors = useSensors(
		useSensor( PointerSensor, {
			activationConstraint: { distance: 6 },
		} )
	);

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
	const foldersById = useMemo( () => {
		const map = new Map();
		folders.forEach( ( folder ) => {
			map.set( folder.id, folder );
		} );
		return map;
	}, [ folders ] );

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

	const buildSiblingSnapshot = useCallback(
		( parentId, excludeId = null ) => {
			const normalizedParent = normalizeParentId( parentId );
			return getChildFolders( normalizedParent )
				.filter( ( folder ) => folder.id !== excludeId )
				.map( ( folder ) => ( {
					...folder,
					parent_id: normalizedParent,
				} ) );
		},
		[ getChildFolders ]
	);

	const computeMoveUpdates = useCallback(
		( folder, dropTarget ) => {
			if ( ! folder || ! dropTarget ) {
				return null;
			}

			const originParentId = normalizeParentId( folder.parent_id );
			let destinationParentId = originParentId;
			let destinationSiblings = [];
			let insertIndex = 0;

			if ( dropTarget.type === DROP_TYPES.ROOT ) {
				destinationParentId = ROOT_PARENT_ID;
				destinationSiblings = buildSiblingSnapshot(
					destinationParentId,
					folder.id
				);
				insertIndex = destinationSiblings.length;
			} else if ( dropTarget.type === DROP_TYPES.INTO ) {
				destinationParentId = dropTarget.folderId;
				destinationSiblings = buildSiblingSnapshot(
					destinationParentId,
					folder.id
				);
				insertIndex = destinationSiblings.length;
			} else if ( dropTarget.type === DROP_TYPES.BEFORE ) {
				const targetFolder = foldersById.get( dropTarget.folderId );
				if ( ! targetFolder || targetFolder.id === folder.id ) {
					return null;
				}

				destinationParentId = normalizeParentId(
					targetFolder.parent_id
				);
				destinationSiblings = buildSiblingSnapshot(
					destinationParentId,
					folder.id
				);
				const targetIndex = destinationSiblings.findIndex(
					( candidate ) => candidate.id === targetFolder.id
				);
				insertIndex =
					targetIndex === -1
						? destinationSiblings.length
						: targetIndex;
			} else {
				return null;
			}

			const currentIndex = getChildFolders( originParentId ).findIndex(
				( candidate ) => candidate.id === folder.id
			);

			if (
				currentIndex === -1 ||
				( destinationParentId === originParentId &&
					currentIndex === insertIndex )
			) {
				return null;
			}

			if ( destinationParentId === originParentId ) {
				return insertWithOrder(
					destinationSiblings,
					folder,
					destinationParentId,
					insertIndex
				);
			}

			const originSiblings = buildSiblingSnapshot(
				originParentId,
				folder.id
			);
			const destinationUpdates = insertWithOrder(
				destinationSiblings,
				folder,
				destinationParentId,
				insertIndex
			);
			const originUpdates = originSiblings.map(
				( item, orderIndex ) => ( {
					...item,
					order_index: orderIndex,
					parent_id: originParentId,
				} )
			);

			return [ ...originUpdates, ...destinationUpdates ];
		},
		[ buildSiblingSnapshot, foldersById, getChildFolders ]
	);

	const blockedDropTargets = useMemo( () => {
		if ( ! activeFolderId ) {
			return new Set();
		}

		const stack = [ activeFolderId ];
		const blocked = new Set( [ activeFolderId ] );

		while ( stack.length > 0 ) {
			const currentId = stack.pop();
			getChildFolders( currentId ).forEach( ( child ) => {
				if ( ! blocked.has( child.id ) ) {
					blocked.add( child.id );
					stack.push( child.id );
				}
			} );
		}

		return blocked;
	}, [ activeFolderId, getChildFolders ] );

	const applyFolderMove = useCallback(
		async ( folderId, dropTarget ) => {
			const folder = foldersById.get( folderId );
			if ( ! folder || ! dropTarget ) {
				return;
			}

			if (
				dropTarget.type === DROP_TYPES.INTO &&
				blockedDropTargets.has( dropTarget.folderId )
			) {
				return;
			}
			if ( dropTarget.type === DROP_TYPES.BEFORE ) {
				const targetFolder = foldersById.get( dropTarget.folderId );
				const targetParent = normalizeParentId(
					targetFolder?.parent_id
				);
				if (
					! targetFolder ||
					blockedDropTargets.has( targetParent )
				) {
					return;
				}
			}

			const updates = computeMoveUpdates( folder, dropTarget );
			if ( ! updates || updates.length === 0 ) {
				return;
			}

			const previousSnapshots = updates
				.map( ( entry ) => foldersById.get( entry.id ) )
				.filter( Boolean )
				.map( ( snapshot ) => ( { ...snapshot } ) );

			updates.forEach( ( entry ) => {
				dispatch.updateFolder( entry );
			} );

			try {
				await Promise.all(
					updates.map( ( entry ) =>
						folderAPI.update( entry.id, {
							parent_id: normalizeParentId( entry.parent_id ),
							order_index: entry.order_index,
						} )
					)
				);
			} catch ( error ) {
				previousSnapshots.forEach( ( snapshot ) => {
					dispatch.updateFolder( snapshot );
				} );

				const message =
					error?.message ||
					__(
						'Unable to move folder. Please try again.',
						'wp-filetron'
					);
				dispatch.setError( message );
			}
		},
		[ blockedDropTargets, computeMoveUpdates, dispatch, foldersById ]
	);

	const clearAutoExpandTimeout = useCallback( () => {
		if ( autoExpandTimeoutRef.current ) {
			clearTimeout( autoExpandTimeoutRef.current );
			autoExpandTimeoutRef.current = null;
		}
	}, [] );

	useEffect(
		() => () => {
			clearAutoExpandTimeout();
		},
		[ clearAutoExpandTimeout ]
	);

	const handleDragStart = ( event ) => {
		const folderId = Number( event?.active?.id );
		if ( Number.isNaN( folderId ) ) {
			return;
		}
		setActiveFolderId( folderId );
	};

	const handleDragOver = ( event ) => {
		const dropTarget = parseDropZoneId( event?.over?.id );
		if ( dropTarget?.type === DROP_TYPES.INTO ) {
			const targetId = dropTarget.folderId;
			if (
				targetId &&
				! blockedDropTargets.has( targetId ) &&
				! isFolderExpanded( targetId )
			) {
				clearAutoExpandTimeout();
				autoExpandTimeoutRef.current = setTimeout( () => {
					dispatch.toggleFolderExpanded( targetId );
				}, AUTO_EXPAND_DELAY );
				return;
			}
		}

		clearAutoExpandTimeout();
	};

	const handleDragCancel = () => {
		clearAutoExpandTimeout();
		setActiveFolderId( null );
	};

	const handleDragEnd = async ( event ) => {
		clearAutoExpandTimeout();
		const folderId = Number( event?.active?.id );
		const dropTarget = parseDropZoneId( event?.over?.id );
		setActiveFolderId( null );

		if ( Number.isNaN( folderId ) || ! dropTarget ) {
			return;
		}

		await applyFolderMove( folderId, dropTarget );
	};

	const isDragging = Boolean( activeFolderId );
	const activeFolder = activeFolderId
		? foldersById.get( activeFolderId )
		: null;
	const activeFolderParentId = activeFolder
		? normalizeParentId( activeFolder.parent_id )
		: null;
	const canRemoveAssignment =
		activeFolderParentId !== null &&
		activeFolderParentId !== ROOT_PARENT_ID;

	const renderFolderList = ( parentId, level = 0 ) => {
		const children = getChildFolders( parentId );
		if ( children.length === 0 ) {
			return null;
		}

		return (
			<div className="wft-space-y-0.5">
				{ children.map( ( folder ) => {
					const childCount = getChildFolders( folder.id ).length;
					const beforeDropId = createDropZoneId(
						DROP_TYPES.BEFORE,
						folder.id
					);
					const intoDropId = createDropZoneId(
						DROP_TYPES.INTO,
						folder.id
					);

					return (
						<div key={ folder.id } className="wft-space-y-0.5">
							{ isDragging && (
								<FolderDropZone
									id={ beforeDropId }
									indent={ getIndentForLevel( level ) }
									type="before"
									disabled={
										folder.id === activeFolderId ||
										blockedDropTargets.has(
											normalizeParentId(
												folder.parent_id
											)
										)
									}
									folderId={ folder.id }
								/>
							) }
							<DraggableFolderRow
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
							{ isDragging && (
								<FolderDropZone
									id={ intoDropId }
									indent={ getIndentForLevel( level ) + 24 }
									type="into"
									label={ sprintf(
										/* translators: %s is the folder name. */
										__( 'Move into “%s”', 'wp-filetron' ),
										folder.name
									) }
									disabled={ blockedDropTargets.has(
										folder.id
									) }
									folderId={ folder.id }
								/>
							) }
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
		<DndContext
			sensors={ sensors }
			collisionDetection={ closestCorners }
			modifiers={ [ restrictToVerticalAxis ] }
			onDragStart={ handleDragStart }
			onDragOver={ handleDragOver }
			onDragEnd={ handleDragEnd }
			onDragCancel={ handleDragCancel }
		>
			<div className="wft-space-y-0.5">
				<RootDropTargetButton
					dropId={ createDropZoneId(
						DROP_TYPES.ROOT,
						ROOT_PARENT_ID
					) }
					isSelected={ selectedFolder === null }
					onSelect={ handleSelectFolder }
					isDragging={ isDragging }
					showDropHint={ canRemoveAssignment }
				/>

				{ getChildFolders( ROOT_PARENT_ID ).length === 0 ? (
					<div className="wft-px-2 wft-py-4 wft-text-xs wft-text-gray-500 wft-text-center">
						{ __( 'No folders yet', 'wp-filetron' ) }
						<br />
						{ __( 'Click + to create one', 'wp-filetron' ) }
					</div>
				) : (
					renderFolderList( ROOT_PARENT_ID, 0 )
				) }
			</div>

			<DragOverlay modifiers={ [ restrictToVerticalAxis ] }>
				{ activeFolder ? (
					<div className="wft-pointer-events-none">
						<FolderItem
							folder={ activeFolder }
							level={ 0 }
							selectedFolder={ activeFolder.id }
							onSelect={ () => {} }
							onContextMenu={ () => {} }
							isExpanded={ false }
							onToggleExpand={ () => {} }
							hasChildren={
								getChildFolders( activeFolder.id ).length > 0
							}
							childCount={
								getChildFolders( activeFolder.id ).length
							}
						/>
					</div>
				) : null }
			</DragOverlay>

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
		</DndContext>
	);
}

function DraggableFolderRow( props ) {
	const { folder } = props;
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable( { id: folder.id } );

	const style = {
		transform: transform
			? `translate3d(${ transform.x }px, ${ transform.y }px, 0)`
			: undefined,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			{ ...attributes }
			{ ...listeners }
			className="wft-relative"
			data-testid="wft-folder-row"
			data-folder-id={ folder.id }
		>
			<FolderItem { ...props } />
		</div>
	);
}

function FolderDropZone( { id, indent, type, disabled, label, folderId } ) {
	const { setNodeRef, isOver } = useDroppable( {
		id,
		disabled,
	} );

	if ( disabled ) {
		return null;
	}
	const isBefore = type === DROP_TYPES.BEFORE;

	return (
		<div
			ref={ setNodeRef }
			className={ classNames(
				'wft-transition-all wft-rounded wft-border wft-border-dashed wft-border-transparent wft-w-full',
				{
					'wft-h-1 wft-bg-transparent': isBefore,
					'wft-px-2 wft-py-1 wft-text-xs wft-font-medium wft-text-blue-700 wft-bg-blue-50/60':
						! isBefore,
					'wft-border-blue-300 wft-bg-blue-100': isOver,
				}
			) }
			style={ { marginLeft: `${ indent }px` } }
			aria-hidden={ isBefore }
			aria-label={ isBefore ? undefined : label }
			data-testid={ `wft-dropzone-${ type }` }
			data-folder-id={ folderId }
		>
			{ ! isBefore && <span className="wft-truncate">{ label }</span> }
		</div>
	);
}

function RootDropTargetButton( {
	dropId,
	isSelected,
	onSelect,
	isDragging,
	showDropHint,
} ) {
	const { setNodeRef, isOver } = useDroppable( {
		id: dropId,
		disabled: ! isDragging,
	} );

	return (
		<button
			type="button"
			ref={ setNodeRef }
			onClick={ () => onSelect( null ) }
			className={ classNames(
				'wft-w-full wft-text-left wft-px-2 wft-py-1.5 wft-rounded wft-text-sm wft-flex wft-items-center wft-gap-2 wft-transition-colors',
				{
					'wft-bg-blue-50 wft-text-blue-700 wft-font-medium':
						isSelected,
					'wft-text-gray-700 hover:wft-bg-gray-100': ! isSelected,
					'wft-ring-2 wft-ring-blue-400 wft-ring-offset-1': isOver,
				}
			) }
			data-testid="wft-folder-root-dropzone"
		>
			<span aria-hidden="true">📁</span>
			<span>{ __( 'All Files', 'wp-filetron' ) }</span>
			{ isOver && showDropHint && (
				<span className="wft-ml-auto wft-text-xs wft-text-blue-600">
					{ __(
						'Drop here to remove folder assignment',
						'wp-filetron'
					) }
				</span>
			) }
		</button>
	);
}
