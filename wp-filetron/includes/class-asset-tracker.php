<?php
/**
 * Asset Tracker Class
 *
 * Handles media usage tracking across posts, pages, and other content.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Asset Tracker Class
 */
class Asset_Tracker {

	/**
	 * Get usage table name.
	 *
	 * @return string
	 */
	private static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'filetron_usage';
	}

	/**
	 * Get media usage.
	 *
	 * @param int $media_id Media ID.
	 * @return array
	 */
	public static function get_media_usage( $media_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT u.*, p.post_title, p.post_type, p.post_status
				FROM {$table} u
				LEFT JOIN {$wpdb->posts} p ON u.post_id = p.ID
				WHERE u.media_id = %d
				ORDER BY u.last_checked DESC",
				$media_id
			)
		);
	}

	/**
	 * Track media usage in post.
	 *
	 * @param int    $media_id Media ID.
	 * @param int    $post_id Post ID.
	 * @param string $usage_type Usage type (post_content, featured_image, etc.).
	 * @param array  $context Additional context data.
	 * @return bool
	 */
	public static function track_usage( $media_id, $post_id, $usage_type, $context = array() ) {
		global $wpdb;
		$table = self::get_table_name();

		$data = array(
			'media_id'   => $media_id,
			'post_id'    => $post_id,
			'usage_type' => $usage_type,
			'context'    => wp_json_encode( $context ),
		);

		// Check if usage already exists.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT id FROM {$table} WHERE media_id = %d AND post_id = %d AND usage_type = %s",
				$media_id,
				$post_id,
				$usage_type
			)
		);

		if ( $exists ) {
			// Update existing record.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->update(
				$table,
				array( 'context' => $data['context'] ),
				array( 'id' => $exists ),
				array( '%s' ),
				array( '%d' )
			);
		} else {
			// Insert new record.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$result = $wpdb->insert( $table, $data );
		}

		return false !== $result;
	}

	/**
	 * Remove usage tracking.
	 *
	 * @param int $media_id Media ID.
	 * @param int $post_id Post ID (optional).
	 * @return bool
	 */
	public static function remove_usage( $media_id, $post_id = null ) {
		global $wpdb;
		$table = self::get_table_name();

		$where = array( 'media_id' => $media_id );
		$format = array( '%d' );

		if ( null !== $post_id ) {
			$where['post_id'] = $post_id;
			$format[] = '%d';
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete( $table, $where, $format );

		return false !== $result;
	}

	/**
	 * Check if media is used anywhere.
	 *
	 * @param int $media_id Media ID.
	 * @return bool
	 */
	public static function is_media_used( $media_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = $wpdb->get_var(
			$wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE media_id = %d", $media_id )
		);

		return $count > 0;
	}

	/**
	 * Scan post content for media usage.
	 *
	 * Will be fully implemented in Phase 9.
	 *
	 * @param int $post_id Post ID.
	 * @return array Found media IDs.
	 */
	public static function scan_post_content( $post_id ) {
		// TODO: Implement in Phase 9.
		return array();
	}

	/**
	 * Bulk scan all posts for media usage.
	 *
	 * Will be fully implemented in Phase 9.
	 *
	 * @return array Scan results.
	 */
	public static function bulk_scan() {
		// TODO: Implement in Phase 9.
		return array(
			'scanned' => 0,
			'found'   => 0,
		);
	}
}
