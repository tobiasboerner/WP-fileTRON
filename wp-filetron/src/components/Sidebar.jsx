/**
 * Sidebar Component
 *
 * Left sidebar containing folder tree and tags.
 */
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import FolderTree from './FolderTree';
import FolderModal from './FolderModal';
import { STORE_NAME } from '../store';

export default function Sidebar( { width } ) {
	const [ showFolderModal, setShowFolderModal ] = useState( false );
	const selectedFolder = useSelect( ( select ) =>
		select( STORE_NAME ).getSelectedFolder()
	);

	const handleCloseModal = () => {
		setShowFolderModal( false );
	};

	const computedWidth = typeof width === 'number' ? width : 320;
	const inlineStyle = {
		width: `${ computedWidth }px`,
		minWidth: '240px',
		maxWidth: '520px',
	};

	return (
		<aside
			style={ inlineStyle }
			className="wft-bg-white wft-border-r wft-border-gray-200 wft-flex wft-flex-col wft-h-full"
		>
			{ /* Folders Section */ }
			<div className="wft-flex-1 wft-overflow-y-auto">
				<div className="wft-p-4">
					<div className="wft-flex wft-items-center wft-justify-between wft-mb-3">
						<h2 className="wft-text-sm wft-font-semibold wft-text-gray-900">
							{ __( 'Folders', 'wp-filetron' ) }
						</h2>
						<button
							onClick={ () => setShowFolderModal( true ) }
							className="wft-text-blue-600 hover:wft-text-blue-700 wft-text-lg wft-font-bold"
							title={ __( 'New Folder', 'wp-filetron' ) }
						>
							+
						</button>
					</div>

					<FolderTree />
				</div>
			</div>

			{ /* Tags Section (Placeholder for Phase 7) */ }
			<div className="wft-border-t wft-border-gray-200 wft-p-4">
				<h2 className="wft-text-sm wft-font-semibold wft-text-gray-900 wft-mb-2">
					{ __( 'Tags', 'wp-filetron' ) }
				</h2>
				<p className="wft-text-xs wft-text-gray-500">
					{ __( 'Coming in Phase 7', 'wp-filetron' ) }
				</p>
			</div>

			{ /* Folder Modal */ }
			{ showFolderModal && (
				<FolderModal
					parentId={ selectedFolder ?? 0 }
					onClose={ handleCloseModal }
					// Key ensures a fresh form when switching parent contexts
					key={ `create-folder-${ selectedFolder ?? 'root' }` }
				/>
			) }
		</aside>
	);
}
