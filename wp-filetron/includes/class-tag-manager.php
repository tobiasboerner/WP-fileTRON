<?php
/**
 * Tag Manager Class
 *
 * Handles tag CRUD operations and media-tag relationships.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Tag Manager Class
 */
class Tag_Manager {

	/**
	 * Get tags table name.
	 *
	 * @return string
	 */
	private static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'filetron_tags';
	}

	/**
	 * Get tag relationships table name.
	 *
	 * @return string
	 */
	private static function get_relationships_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'filetron_tag_relationships';
	}

	/**
	 * Get all tags.
	 *
	 * @param array $args Optional arguments.
	 * @return array|object|null
	 */
	public static function get_tags( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'orderby' => 'name',
			'order'   => 'ASC',
			'search'  => '',
		);

		$args = wp_parse_args( $args, $defaults );
		$table = self::get_table_name();

		$query = "SELECT * FROM {$table}";

		if ( ! empty( $args['search'] ) ) {
			$search = '%' . $wpdb->esc_like( $args['search'] ) . '%';
			$query .= $wpdb->prepare( ' WHERE name LIKE %s', $search );
		}

		$allowed_orderby = array( 'name', 'slug', 'count', 'id' );
		$orderby         = in_array( $args['orderby'], $allowed_orderby, true ) ? $args['orderby'] : 'name';
		$order           = strtoupper( $args['order'] ) === 'DESC' ? 'DESC' : 'ASC';

		$query .= " ORDER BY {$orderby} {$order}";

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		return $wpdb->get_results( $query );
	}

	/**
	 * Get tag by ID.
	 *
	 * @param int $tag_id Tag ID.
	 * @return object|null
	 */
	public static function get_tag( $tag_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $tag_id )
		);
	}

	/**
	 * Create a new tag.
	 *
	 * @param array $data Tag data.
	 * @return int|false Tag ID on success, false on failure.
	 */
	public static function create_tag( $data ) {
		global $wpdb;
		$table = self::get_table_name();

		// Validate required fields.
		if ( empty( $data['name'] ) ) {
			return false;
		}

		// Sanitize data.
		$tag_data = array(
			'name'        => sanitize_text_field( $data['name'] ),
			'slug'        => ! empty( $data['slug'] ) ? sanitize_title( $data['slug'] ) : sanitize_title( $data['name'] ),
			'description' => ! empty( $data['description'] ) ? sanitize_textarea_field( $data['description'] ) : null,
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert( $table, $tag_data );

		if ( $result ) {
			return $wpdb->insert_id;
		}

		return false;
	}

	/**
	 * Update a tag.
	 *
	 * @param int   $tag_id Tag ID.
	 * @param array $data Tag data to update.
	 * @return bool
	 */
	public static function update_tag( $tag_id, $data ) {
		global $wpdb;
		$table = self::get_table_name();

		// Sanitize data.
		$update_data = array();

		if ( isset( $data['name'] ) ) {
			$update_data['name'] = sanitize_text_field( $data['name'] );
		}

		if ( isset( $data['slug'] ) ) {
			$update_data['slug'] = sanitize_title( $data['slug'] );
		}

		if ( isset( $data['description'] ) ) {
			$update_data['description'] = sanitize_textarea_field( $data['description'] );
		}

		if ( empty( $update_data ) ) {
			return false;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->update(
			$table,
			$update_data,
			array( 'id' => $tag_id ),
			null,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete a tag.
	 *
	 * @param int $tag_id Tag ID.
	 * @return bool
	 */
	public static function delete_tag( $tag_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete(
			$table,
			array( 'id' => $tag_id ),
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Get media tags.
	 *
	 * @param int $media_id Media ID.
	 * @return array
	 */
	public static function get_media_tags( $media_id ) {
		global $wpdb;
		$table = self::get_table_name();
		$rel_table = self::get_relationships_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT t.* FROM {$table} t
				INNER JOIN {$rel_table} r ON t.id = r.tag_id
				WHERE r.media_id = %d
				ORDER BY t.name ASC",
				$media_id
			)
		);
	}

	/**
	 * Add tag to media.
	 *
	 * @param int $media_id Media ID.
	 * @param int $tag_id Tag ID.
	 * @return bool
	 */
	public static function add_tag_to_media( $media_id, $tag_id ) {
		global $wpdb;
		$table = self::get_relationships_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert(
			$table,
			array(
				'media_id' => $media_id,
				'tag_id'   => $tag_id,
			),
			array( '%d', '%d' )
		);

		return false !== $result;
	}

	/**
	 * Remove tag from media.
	 *
	 * @param int $media_id Media ID.
	 * @param int $tag_id Tag ID.
	 * @return bool
	 */
	public static function remove_tag_from_media( $media_id, $tag_id ) {
		global $wpdb;
		$table = self::get_relationships_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete(
			$table,
			array(
				'media_id' => $media_id,
				'tag_id'   => $tag_id,
			),
			array( '%d', '%d' )
		);

		return false !== $result;
	}
}
