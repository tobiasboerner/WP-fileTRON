/**
 * Toolbar Component
 *
 * Top toolbar with upload, search, and view mode controls.
 */

import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../store';

export default function Toolbar() {
	const dispatch = useDispatch( STORE_NAME );
	const { viewMode, selectedFolder, folderPath } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const currentFolder = store.getSelectedFolder();

		return {
			viewMode: store.getViewMode(),
			selectedFolder: currentFolder,
			folderPath: store.getFolderPath( currentFolder ),
		};
	} );

	const openUploadOverlay = () => {
		dispatch.setUploadOverlayVisible( true );
	};

	const handleBreadcrumbClick = ( folderId ) => {
		dispatch.setSelectedFolder( folderId );
	};

	return (
		<div className="wft-bg-white wft-border-b wft-border-gray-200 wft-px-6 wft-py-3 wft-space-y-3">
			<div className="wft-flex wft-items-center wft-justify-between">
				{ /* Left Side - Actions */ }
				<div className="wft-flex wft-items-center wft-gap-4">
					<button
						className="wft-px-4 wft-py-2 wft-bg-blue-600 wft-text-white wft-rounded-md hover:wft-bg-blue-700 wft-text-sm wft-font-medium"
						onClick={ openUploadOverlay }
					>
						{ __( 'Upload', 'wp-filetron' ) }
					</button>

					<input
						type="text"
						placeholder={ __( 'Search files…', 'wp-filetron' ) }
						className="wft-w-64 wft-px-3 wft-py-2 wft-border wft-border-gray-300 wft-rounded-md wft-text-sm focus:wft-outline-none focus:wft-ring-2 focus:wft-ring-blue-500"
						disabled
					/>
				</div>

				{ /* Right Side - View Mode */ }
				<div className="wft-flex wft-items-center wft-gap-2">
					<span className="wft-text-sm wft-text-gray-500">
						{ __( 'View:', 'wp-filetron' ) }
					</span>

					<button
						onClick={ () => dispatch.setViewMode( 'grid' ) }
						className={ `wft-px-3 wft-py-1 wft-text-xs wft-font-medium wft-rounded ${
							viewMode === 'grid'
								? 'wft-bg-blue-100 wft-text-blue-700'
								: 'wft-bg-gray-100 wft-text-gray-700 hover:wft-bg-gray-200'
						}` }
					>
						{ __( 'Grid', 'wp-filetron' ) }
					</button>

					<button
						onClick={ () => dispatch.setViewMode( 'list' ) }
						className={ `wft-px-3 wft-py-1 wft-text-xs wft-font-medium wft-rounded ${
							viewMode === 'list'
								? 'wft-bg-blue-100 wft-text-blue-700'
								: 'wft-bg-gray-100 wft-text-gray-700 hover:wft-bg-gray-200'
						}` }
					>
						{ __( 'List', 'wp-filetron' ) }
					</button>
				</div>
			</div>

			{ /* Breadcrumb */ }
			<nav aria-label={ __( 'Folder breadcrumb', 'wp-filetron' ) }>
				<ol className="wft-flex wft-items-center wft-gap-2 wft-text-sm wft-text-gray-600">
					<li>
						<button
							type="button"
							onClick={ () => handleBreadcrumbClick( null ) }
							className={ `wft-font-medium ${
								selectedFolder === null
									? 'wft-text-blue-600'
									: 'hover:wft-text-blue-600'
							}` }
						>
							{ __( 'All Files', 'wp-filetron' ) }
						</button>
					</li>

					{ folderPath.map( ( folder, index ) => (
						<li
							key={ folder.id }
							className="wft-flex wft-items-center wft-gap-2"
						>
							<span className="wft-text-gray-300">/</span>
							<button
								type="button"
								onClick={ () =>
									handleBreadcrumbClick( folder.id )
								}
								className={ `${
									index === folderPath.length - 1
										? 'wft-text-blue-600 wft-font-medium'
										: 'hover:wft-text-blue-600'
								}` }
							>
								{ folder.name }
							</button>
						</li>
					) ) }
				</ol>
			</nav>
		</div>
	);
}
