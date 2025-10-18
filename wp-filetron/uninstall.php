<?php
/**
 * Uninstall Script
 *
 * Fired when the plugin is uninstalled.
 *
 * @package WP_Filetron
 */

// Exit if uninstall not called from WordPress.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Load plugin file to access classes.
require_once plugin_dir_path( __FILE__ ) . 'wp-filetron.php';

/**
 * Uninstall WP fileTRON.
 *
 * This will:
 * - Drop all database tables
 * - Delete all plugin options
 * - Clean up transients and cached data
 *
 * WARNING: This is irreversible and will delete all media organization data!
 * The actual media files in wp-content/uploads will NOT be deleted.
 */
function wft_uninstall() {
	// Check if user has permission.
	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	// Get the setting to check if user wants to keep data.
	$settings = get_option( 'wft_settings', array() );
	$keep_data = isset( $settings['keep_data_on_uninstall'] ) ? $settings['keep_data_on_uninstall'] : false;

	// If user wants to keep data, don't delete anything.
	if ( $keep_data ) {
		error_log( 'WP fileTRON: Uninstall - Keeping data as per user settings.' );
		return;
	}

	// Log the uninstall.
	error_log( 'WP fileTRON: Starting uninstall process.' );

	// Use Installer class to drop tables and delete options.
	if ( class_exists( 'WP_Filetron\Installer' ) ) {
		// Drop all tables.
		\WP_Filetron\Installer::drop_tables();

		// Delete all options.
		\WP_Filetron\Installer::delete_options();
	}

	// Delete any transients.
	delete_transient( 'wft_folders_cache' );
	delete_transient( 'wft_tags_cache' );

	// Clear all WordPress caches.
	wp_cache_flush();

	// Log completion.
	error_log( 'WP fileTRON: Uninstall completed successfully.' );
}

// Run the uninstall function.
wft_uninstall();
