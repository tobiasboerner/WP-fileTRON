<?php
/**
 * Folder Manager Class
 *
 * Handles folder CRUD operations and hierarchy management.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Folder Manager Class
 */
class Folder_Manager {

	/**
	 * Get folder relationships table name.
	 *
	 * @return string
	 */
	private static function get_relationships_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'filetron_folder_relationships';
	}

	/**
	 * Get folders table name.
	 *
	 * @return string
	 */
	private static function get_table_name() {
		global $wpdb;
		return $wpdb->prefix . 'filetron_folders';
	}

	/**
	 * Get all folders.
	 *
	 * @param array $args Optional arguments.
	 * @return array|object|null
	 */
	public static function get_folders( $args = array() ) {
		global $wpdb;

		$defaults = array(
			'parent_id' => null,
			'orderby'   => 'order_index',
			'order'     => 'ASC',
		);

		$args = wp_parse_args( $args, $defaults );
		$table = self::get_table_name();

		$query = "SELECT * FROM {$table}";

		if ( null !== $args['parent_id'] ) {
			$query .= $wpdb->prepare( ' WHERE parent_id = %d', $args['parent_id'] );
		}

		$allowed_orderby = array( 'order_index', 'name', 'created_at', 'updated_at', 'id' );
		$orderby         = in_array( $args['orderby'], $allowed_orderby, true ) ? $args['orderby'] : 'order_index';

		$order = strtoupper( $args['order'] ) === 'DESC' ? 'DESC' : 'ASC';

		$query .= " ORDER BY {$orderby} {$order}";

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
		return $wpdb->get_results( $query );
	}

	/**
	 * Get folder by ID.
	 *
	 * @param int $folder_id Folder ID.
	 * @return object|null
	 */
	public static function get_folder( $folder_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		return $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $folder_id )
		);
	}

	/**
	 * Create a new folder.
	 *
	 * @param array $data Folder data.
	 * @return int|false Folder ID on success, false on failure.
	 */
	public static function create_folder( $data ) {
		global $wpdb;
		$table = self::get_table_name();

		// Validate required fields.
		if ( empty( $data['name'] ) ) {
			return false;
		}

		// Sanitize data.
		$folder_data = array(
			'name'      => sanitize_text_field( $data['name'] ),
			'slug'      => ! empty( $data['slug'] ) ? sanitize_title( $data['slug'] ) : sanitize_title( $data['name'] ),
			'parent_id' => isset( $data['parent_id'] ) ? absint( $data['parent_id'] ) : 0,
			'color'     => ! empty( $data['color'] ) ? sanitize_hex_color( $data['color'] ) : null,
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert( $table, $folder_data );

		if ( $result ) {
			return $wpdb->insert_id;
		}

		return false;
	}

	/**
	 * Update a folder.
	 *
	 * @param int   $folder_id Folder ID.
	 * @param array $data Folder data to update.
	 * @return bool
	 */
	public static function update_folder( $folder_id, $data ) {
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

		if ( isset( $data['parent_id'] ) ) {
			$update_data['parent_id'] = absint( $data['parent_id'] );
		}

		if ( isset( $data['color'] ) ) {
			$update_data['color'] = sanitize_hex_color( $data['color'] );
		}

		if ( isset( $data['order_index'] ) ) {
			$update_data['order_index'] = absint( $data['order_index'] );
		}

		if ( empty( $update_data ) ) {
			return false;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->update(
			$table,
			$update_data,
			array( 'id' => $folder_id ),
			null,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete a folder.
	 *
	 * @param int $folder_id Folder ID.
	 * @return bool
	 */
	public static function delete_folder( $folder_id ) {
		global $wpdb;
		$table = self::get_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete(
			$table,
			array( 'id' => $folder_id ),
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Get folder tree (hierarchical structure).
	 *
	 * Will be fully implemented in Phase 4.
	 *
	 * @return array
	 */
	public static function get_folder_tree() {
		// TODO: Implement in Phase 4.
		return array();
	}

	/**
	 * Assign a media item to a folder.
	 *
	 * @param int $media_id Media attachment ID.
	 * @param int $folder_id Folder ID (0 to remove assignment).
	 * @return bool
	 */
	public static function assign_media_to_folder( $media_id, $folder_id ) {
		global $wpdb;

		$media_id  = absint( $media_id );
		$folder_id = absint( $folder_id );

		if ( $media_id <= 0 ) {
			return false;
		}

		$table = self::get_relationships_table_name();

		// Remove existing assignments.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete(
			$table,
			array( 'media_id' => $media_id ),
			array( '%d' )
		);

		if ( $folder_id > 0 ) {
			if ( ! self::get_folder( $folder_id ) ) {
				return false;
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			return false !== $wpdb->insert(
				$table,
				array(
					'media_id'  => $media_id,
					'folder_id' => $folder_id,
				),
				array( '%d', '%d' )
			);
		}

		return true;
	}

	/**
	 * Determine whether a folder is a descendant of another.
	 *
	 * @param int $candidate_id Potential child folder ID.
	 * @param int $ancestor_id  Potential ancestor folder ID.
	 * @return bool
	 */
	public static function is_descendant( $candidate_id, $ancestor_id ) {
		$candidate_id = absint( $candidate_id );
		$ancestor_id  = absint( $ancestor_id );

		if ( $candidate_id <= 0 || $ancestor_id <= 0 || $candidate_id === $ancestor_id ) {
			return false;
		}

		$visited = array();
		$current = self::get_folder( $candidate_id );

		while ( $current && ! in_array( (int) $current->id, $visited, true ) ) {
			$visited[] = (int) $current->id;

			$parent_id = isset( $current->parent_id ) ? (int) $current->parent_id : 0;

			if ( $parent_id === $ancestor_id ) {
				return true;
			}

			if ( $parent_id <= 0 ) {
				break;
			}

			$current = self::get_folder( $parent_id );
		}

		return false;
	}

	/**
	 * Get folder assignment for a media item.
	 *
	 * @param int $media_id Media attachment ID.
	 * @return int|null
	 */
	public static function get_media_folder_id( $media_id ) {
		global $wpdb;
		$table = self::get_relationships_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$folder_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT folder_id FROM {$table} WHERE media_id = %d LIMIT 1",
				absint( $media_id )
			)
		);

		return null === $folder_id ? null : (int) $folder_id;
	}

	/**
	 * Get folder assignments for a set of media IDs.
	 *
	 * @param array $media_ids Array of media IDs.
	 * @return array<int,int> Map of media_id => folder_id.
	 */
	public static function get_media_folder_map( $media_ids ) {
		global $wpdb;

		if ( empty( $media_ids ) || ! is_array( $media_ids ) ) {
			return array();
		}

		$media_ids = array_values( array_unique( array_map( 'absint', $media_ids ) ) );
		$media_ids = array_filter( $media_ids, static function( $id ) {
			return $id > 0;
		} );

		if ( empty( $media_ids ) ) {
			return array();
		}

		$table        = self::get_relationships_table_name();
		$placeholders = implode( ',', array_fill( 0, count( $media_ids ), '%d' ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT media_id, folder_id FROM {$table} WHERE media_id IN ({$placeholders})",
				$media_ids
			),
			ARRAY_A
		);

		$map = array();
		foreach ( $results as $row ) {
			$map[ (int) $row['media_id'] ] = (int) $row['folder_id'];
		}

		return $map;
	}

	/**
	 * Get media IDs that belong to a specific folder.
	 *
	 * @param int $folder_id Folder ID.
	 * @return array<int>
	 */
	public static function get_media_ids_by_folder( $folder_id ) {
		global $wpdb;

		$folder_id = absint( $folder_id );
		if ( $folder_id <= 0 ) {
			return array();
		}

		$table = self::get_relationships_table_name();

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT media_id FROM {$table} WHERE folder_id = %d",
				$folder_id
			)
		);

		return array_map( 'absint', $ids );
	}
}
