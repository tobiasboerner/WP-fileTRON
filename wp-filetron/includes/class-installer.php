<?php
/**
 * Installer Class
 *
 * Handles plugin activation, deactivation, and database setup.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Installer Class
 */
class Installer {

	/**
	 * Database version.
	 *
	 * @var string
	 */
	const DB_VERSION = '1.0.0';

	/**
	 * Run on plugin activation.
	 */
	public static function activate() {
		// Create database tables.
		self::create_tables();

		// Set default options.
		self::set_default_options();

		// Set activation timestamp.
		if ( ! get_option( 'wft_first_install' ) ) {
			update_option( 'wft_first_install', time() );
		}

		// Update version.
		update_option( 'wft_version', WFT_VERSION );
		update_option( 'wft_db_version', self::DB_VERSION );
	}

	/**
	 * Run on plugin deactivation.
	 */
	public static function deactivate() {
		// Clear any cached data.
		wp_cache_flush();

		// Note: We don't delete tables or data on deactivation.
		// That should only happen on uninstall.
	}

	/**
	 * Create database tables.
	 *
	 * This will be fully implemented in Phase 2.
	 */
	private static function create_tables() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		// Table names.
		$tables = array(
			'folders'              => $wpdb->prefix . 'filetron_folders',
			'tags'                 => $wpdb->prefix . 'filetron_tags',
			'tag_relationships'    => $wpdb->prefix . 'filetron_tag_relationships',
			'folder_relationships' => $wpdb->prefix . 'filetron_folder_relationships',
			'usage'                => $wpdb->prefix . 'filetron_usage',
		);

		// SQL for creating tables.
		$sql = array();

		// Folders table.
		$sql[] = "CREATE TABLE {$tables['folders']} (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			name varchar(255) NOT NULL,
			slug varchar(255) NOT NULL,
			parent_id bigint(20) UNSIGNED DEFAULT 0,
			color varchar(7) DEFAULT NULL,
			order_index int(11) DEFAULT 0,
			created_at datetime DEFAULT CURRENT_TIMESTAMP,
			updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY parent_idx (parent_id),
			KEY slug_idx (slug)
		) $charset_collate;";

		// Tags table.
		$sql[] = "CREATE TABLE {$tables['tags']} (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			name varchar(100) NOT NULL,
			slug varchar(100) NOT NULL,
			description text DEFAULT NULL,
			count int(11) DEFAULT 0,
			PRIMARY KEY (id),
			UNIQUE KEY slug_unique (slug)
		) $charset_collate;";

		// Tag relationships table.
		$sql[] = "CREATE TABLE {$tables['tag_relationships']} (
			media_id bigint(20) UNSIGNED NOT NULL,
			tag_id bigint(20) UNSIGNED NOT NULL,
			PRIMARY KEY (media_id, tag_id),
			KEY tag_idx (tag_id)
		) $charset_collate;";

		// Folder relationships table.
		$sql[] = "CREATE TABLE {$tables['folder_relationships']} (
			media_id bigint(20) UNSIGNED NOT NULL,
			folder_id bigint(20) UNSIGNED NOT NULL,
			PRIMARY KEY (media_id, folder_id),
			KEY folder_idx (folder_id)
		) $charset_collate;";

		// Usage table.
		$sql[] = "CREATE TABLE {$tables['usage']} (
			id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			media_id bigint(20) UNSIGNED NOT NULL,
			post_id bigint(20) UNSIGNED DEFAULT NULL,
			usage_type varchar(50) DEFAULT NULL,
			context text DEFAULT NULL,
			last_checked datetime DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY media_idx (media_id),
			KEY post_idx (post_id)
		) $charset_collate;";

		// Include WordPress upgrade functions.
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		// Create tables.
		foreach ( $sql as $query ) {
			dbDelta( $query );
		}
	}

	/**
	 * Set default plugin options.
	 */
	private static function set_default_options() {
		$default_settings = array(
			'replace_media_library' => false,
			'lazy_loading'          => true,
			'items_per_page'        => 50,
			'default_view'          => 'grid',
			'thumbnail_size'        => 'medium',
			'max_uploads'           => 3,
			'auto_scan_usage'       => true,
			'scan_interval'         => 'daily',
		);

		if ( ! get_option( 'wft_settings' ) ) {
			update_option( 'wft_settings', $default_settings );
		}
	}

	/**
	 * Get database version.
	 *
	 * @return string
	 */
	public static function get_db_version() {
		return get_option( 'wft_db_version', '0' );
	}

	/**
	 * Check if database needs update.
	 *
	 * @return bool
	 */
	public static function needs_db_update() {
		$current_version = self::get_db_version();
		return version_compare( $current_version, self::DB_VERSION, '<' );
	}

	/**
	 * Run database update.
	 * Called when database version changes.
	 */
	public static function update_db() {
		$current_version = self::get_db_version();

		// Log the update.
		error_log( sprintf( 'WP fileTRON: Updating database from version %s to %s', $current_version, self::DB_VERSION ) );

		// Run the table creation again (dbDelta will update existing tables).
		self::create_tables();

		// Run version-specific updates.
		self::run_version_updates( $current_version );

		// Update the database version.
		update_option( 'wft_db_version', self::DB_VERSION );

		// Clear all caches.
		wp_cache_flush();

		error_log( 'WP fileTRON: Database update completed.' );
	}

	/**
	 * Run version-specific database updates.
	 *
	 * @param string $installed_version Currently installed version.
	 */
	private static function run_version_updates( $installed_version ) {
		// Example: if ( version_compare( $installed_version, '1.1.0', '<' ) ) {
		//     self::update_to_1_1_0();
		// }

		// For now, no version-specific updates needed.
	}

	/**
	 * Get all table names.
	 *
	 * @return array
	 */
	public static function get_table_names() {
		global $wpdb;

		return array(
			'folders'              => $wpdb->prefix . 'filetron_folders',
			'tags'                 => $wpdb->prefix . 'filetron_tags',
			'tag_relationships'    => $wpdb->prefix . 'filetron_tag_relationships',
			'folder_relationships' => $wpdb->prefix . 'filetron_folder_relationships',
			'usage'                => $wpdb->prefix . 'filetron_usage',
		);
	}

	/**
	 * Check if all tables exist.
	 *
	 * @return bool
	 */
	public static function tables_exist() {
		global $wpdb;

		$tables = self::get_table_names();

		foreach ( $tables as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Drop all plugin tables.
	 * WARNING: This will delete all data!
	 * Only called on uninstall.
	 */
	public static function drop_tables() {
		global $wpdb;

		$tables = self::get_table_names();

		foreach ( $tables as $table ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
		}
	}

	/**
	 * Delete all plugin options.
	 * Only called on uninstall.
	 */
	public static function delete_options() {
		delete_option( 'wft_version' );
		delete_option( 'wft_db_version' );
		delete_option( 'wft_settings' );
		delete_option( 'wft_first_install' );
	}

	/**
	 * Get installation info for debugging.
	 *
	 * @return array
	 */
	public static function get_install_info() {
		return array(
			'plugin_version'   => WFT_VERSION,
			'db_version'       => self::get_db_version(),
			'first_install'    => get_option( 'wft_first_install' ),
			'tables_exist'     => self::tables_exist(),
			'needs_db_update'  => self::needs_db_update(),
			'php_version'      => PHP_VERSION,
			'wp_version'       => get_bloginfo( 'version' ),
			'mysql_version'    => self::get_mysql_version(),
		);
	}

	/**
	 * Get MySQL version.
	 *
	 * @return string
	 */
	private static function get_mysql_version() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_var( 'SELECT VERSION()' );
	}
}
