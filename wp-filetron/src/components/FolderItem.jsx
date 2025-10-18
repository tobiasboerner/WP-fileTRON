/**
 * Folder Item Component
 *
 * Presentational row used inside the folder tree.
 */

import classNames from 'classnames';
import { __ } from '@wordpress/i18n';

export default function FolderItem( {
	folder,
	level = 0,
	selectedFolder,
	onSelect,
	onContextMenu,
	isExpanded,
	onToggleExpand,
	hasChildren,
	childCount = 0,
} ) {
	const isSelected = selectedFolder === folder.id;

	const handleSelect = () => {
		onSelect( folder.id );
	};

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			event.preventDefault();
			onSelect( folder.id );
		}
	};

	return (
		<div
			className={ classNames(
				'wft-flex wft-items-center wft-gap-1.5 wft-px-2 wft-py-1.5 wft-rounded wft-text-sm wft-transition-colors',
				{
					'wft-bg-blue-50 wft-text-blue-700 wft-font-medium':
						isSelected,
					'wft-text-gray-700 hover:wft-bg-gray-100': ! isSelected,
				}
			) }
			style={ { paddingLeft: `${ level * 14 + 12 }px` } }
			onClick={ handleSelect }
			onKeyDown={ handleKeyDown }
			onContextMenu={ ( event ) => onContextMenu?.( event, folder ) }
			role="button"
			tabIndex={ 0 }
		>
			{ /* Expand / Collapse */ }
			{ hasChildren ? (
				<button
					type="button"
					onClick={ ( event ) => {
						event.stopPropagation();
						onToggleExpand( folder.id );
					} }
					className="wft-p-0.5 hover:wft-bg-gray-200 wft-rounded"
					aria-expanded={ isExpanded }
					aria-label={
						isExpanded
							? __( 'Collapse folder', 'wp-filetron' )
							: __( 'Expand folder', 'wp-filetron' )
					}
				>
					<svg
						className={ classNames(
							'wft-w-3 wft-h-3 wft-transition-transform wft-text-gray-500',
							{ 'wft-rotate-90': isExpanded }
						) }
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fillRule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			) : (
				<span className="wft-w-3.5" />
			) }

			{ /* Folder icon */ }
			<span
				className="wft-text-base"
				style={ { color: folder.color || '#6B7280' } }
				aria-hidden="true"
			>
				📁
			</span>

			{ /* Folder name */ }
			<span className="wft-flex-1 wft-truncate">{ folder.name }</span>

			{ /* Child count */ }
			{ hasChildren && (
				<span
					className="wft-text-xs wft-text-gray-500"
					aria-hidden="true"
				>
					{ childCount }
				</span>
			) }
		</div>
	);
}
