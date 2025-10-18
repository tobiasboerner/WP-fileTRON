<?php
/**
 * REST API Class
 *
 * Registers and handles all REST API endpoints.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API Class
 */
class REST_API {

	/**
	 * API namespace.
	 *
	 * @var string
	 */
	const API_NAMESPACE = 'wft/v1';

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register all REST API routes.
	 */
	public function register_routes() {
		// Register folder routes.
		$this->register_folder_routes();

		// Register tag routes.
		$this->register_tag_routes();

		// Register media routes.
		$this->register_media_routes();
	}

	/**
	 * Register folder routes.
	 */
	private function register_folder_routes() {
		// GET /folders - Get all folders.
		register_rest_route(
			self::API_NAMESPACE,
			'/folders',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_folders' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'parent_id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
						'validate_callback' => 'rest_validate_request_arg',
					),
				),
			)
		);

		// POST /folders - Create folder.
		register_rest_route(
			self::API_NAMESPACE,
			'/folders',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_folder' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'name'      => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => array( $this, 'validate_folder_name' ),
					),
					'parent_id' => array(
						'type'              => 'integer',
						'default'           => 0,
						'sanitize_callback' => 'absint',
					),
					'color'     => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_hex_color',
					),
				),
			)
		);

		// PUT /folders/{id} - Update folder.
		register_rest_route(
			self::API_NAMESPACE,
			'/folders/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_folder' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id'          => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'name'        => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'parent_id'   => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'color'       => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_hex_color',
					),
					'order_index' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// DELETE /folders/{id} - Delete folder.
		register_rest_route(
			self::API_NAMESPACE,
			'/folders/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_folder' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Register tag routes.
	 */
	private function register_tag_routes() {
		// GET /tags - Get all tags.
		register_rest_route(
			self::API_NAMESPACE,
			'/tags',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_tags' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'search' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			)
		);

		// POST /tags - Create tag.
		register_rest_route(
			self::API_NAMESPACE,
			'/tags',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_tag' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'name'        => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => array( $this, 'validate_tag_name' ),
					),
					'description' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
				),
			)
		);

		// PUT /tags/{id} - Update tag.
		register_rest_route(
			self::API_NAMESPACE,
			'/tags/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_tag' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id'          => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'name'        => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
				),
			)
		);

		// DELETE /tags/{id} - Delete tag.
		register_rest_route(
			self::API_NAMESPACE,
			'/tags/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_tag' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// POST /media/{id}/tags - Add tags to media.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)/tags',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'add_media_tags' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id'      => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'tag_ids' => array(
						'type'              => 'array',
						'required'          => true,
						'items'             => array( 'type' => 'integer' ),
						'sanitize_callback' => array( $this, 'sanitize_int_array' ),
					),
				),
			)
		);

		// GET /media/{id}/tags - Get media tags.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)/tags',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_media_tags' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Register media routes.
	 */
	private function register_media_routes() {
		// GET /media - Get all media.
		register_rest_route(
			self::API_NAMESPACE,
			'/media',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_media' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'folder_id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'per_page'  => array(
						'type'              => 'integer',
						'default'           => 50,
						'sanitize_callback' => 'absint',
					),
					'page'      => array(
						'type'              => 'integer',
						'default'           => 1,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// POST /media/upload - Upload a new media file.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/upload',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'upload_media' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'title'       => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'alt_text'    => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'folder_id'   => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'tag_ids'     => array(
						'type'              => 'array',
						'items'             => array( 'type' => 'integer' ),
						'sanitize_callback' => array( $this, 'sanitize_int_array' ),
					),
				),
			)
		);

		// GET /media/{id} - Get single media.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_single_media' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// PUT /media/{id} - Update media.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_media' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id'          => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
					'title'       => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'alt_text'    => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					),
					'folder_id'   => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// DELETE /media/{id} - Delete media.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_media' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// GET /media/{id}/usage - Get media usage.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/(?P<id>\d+)/usage',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_media_usage' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'id' => array(
						'type'              => 'integer',
						'required'          => true,
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		// POST /media/bulk - Bulk operations.
		register_rest_route(
			self::API_NAMESPACE,
			'/media/bulk',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'bulk_media_operation' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => array(
					'media_ids' => array(
						'type'              => 'array',
						'required'          => true,
						'items'             => array( 'type' => 'integer' ),
						'sanitize_callback' => array( $this, 'sanitize_int_array' ),
					),
					'action'    => array(
						'type'              => 'string',
						'required'          => true,
						'enum'              => array( 'move', 'delete', 'tag' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'folder_id' => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'tag_ids'   => array(
						'type'              => 'array',
						'items'             => array( 'type' => 'integer' ),
						'sanitize_callback' => array( $this, 'sanitize_int_array' ),
					),
				),
			)
		);
	}

	/**
	 * Check permission for API requests.
	 *
	 * @return bool
	 */
	public function check_permission() {
		// User must be able to upload files.
		return current_user_can( 'upload_files' );
	}

	/**
	 * Validate folder name.
	 *
	 * @param mixed           $value   Value to validate.
	 * @param \WP_REST_Request $request Request object.
	 * @param string          $param   Parameter name.
	 * @return bool|WP_Error
	 */
	public function validate_folder_name( $value, $request, $param ) {
		if ( empty( $value ) || strlen( $value ) > 255 ) {
			return new \WP_Error(
				'invalid_folder_name',
				__( 'Folder name must be between 1 and 255 characters.', 'wp-filetron' ),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * Validate tag name.
	 *
	 * @param mixed           $value   Value to validate.
	 * @param \WP_REST_Request $request Request object.
	 * @param string          $param   Parameter name.
	 * @return bool|WP_Error
	 */
	public function validate_tag_name( $value, $request, $param ) {
		if ( empty( $value ) || strlen( $value ) > 100 ) {
			return new \WP_Error(
				'invalid_tag_name',
				__( 'Tag name must be between 1 and 100 characters.', 'wp-filetron' ),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * Sanitize array of integers.
	 *
	 * @param array $value Value to sanitize.
	 * @return array
	 */
	public function sanitize_int_array( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}
		return array_map( 'absint', $value );
	}

	/**
	 * Return success response.
	 *
	 * @param mixed  $data    Response data.
	 * @param string $message Success message.
	 * @param int    $status  HTTP status code.
	 * @return \WP_REST_Response
	 */
	private function success_response( $data = null, $message = '', $status = 200 ) {
		$response = array(
			'success' => true,
		);

		if ( ! empty( $message ) ) {
			$response['message'] = $message;
		}

		if ( null !== $data ) {
			$response['data'] = $data;
		}

		return new \WP_REST_Response( $response, $status );
	}

	/**
	 * Return error response.
	 *
	 * @param string $code    Error code.
	 * @param string $message Error message.
	 * @param int    $status  HTTP status code.
	 * @return \WP_Error
	 */
	private function error_response( $code, $message, $status = 400 ) {
		return new \WP_Error( $code, $message, array( 'status' => $status ) );
	}

	// ============================================
	// FOLDER ENDPOINTS
	// ============================================

	/**
	 * Get folders.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_folders( $request ) {
		$parent_id = $request->get_param( 'parent_id' );

		$args = array();
		if ( null !== $parent_id ) {
			$args['parent_id'] = $parent_id;
		}

		$folders = Folder_Manager::get_folders( $args );

		return $this->success_response( $folders );
	}

	/**
	 * Create folder.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_folder( $request ) {
		$name = (string) $request->get_param( 'name' );
		if ( '' === trim( $name ) ) {
			return $this->error_response(
				'invalid_folder_name',
				__( 'Folder name must be between 1 and 255 characters.', 'wp-filetron' ),
				400
			);
		}

		$data = array(
			'name'      => $name,
			'parent_id' => $request->get_param( 'parent_id' ),
			'color'     => $request->get_param( 'color' ),
		);

		$parent_id = isset( $data['parent_id'] ) ? absint( $data['parent_id'] ) : 0;
		if ( $parent_id > 0 && ! Folder_Manager::get_folder( $parent_id ) ) {
			return $this->error_response(
				'folder_parent_not_found',
				__( 'The specified parent folder does not exist.', 'wp-filetron' ),
				404
			);
		}

		$folder_id = Folder_Manager::create_folder( $data );

		if ( ! $folder_id ) {
			return $this->error_response(
				'folder_creation_failed',
				__( 'Failed to create folder.', 'wp-filetron' ),
				500
			);
		}

		$folder = Folder_Manager::get_folder( $folder_id );

		return $this->success_response(
			$folder,
			__( 'Folder created successfully.', 'wp-filetron' ),
			201
		);
	}

	/**
	 * Update folder.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_folder( $request ) {
		$folder_id = $request->get_param( 'id' );

		// Check if folder exists.
		$folder = Folder_Manager::get_folder( $folder_id );
		if ( ! $folder ) {
			return $this->error_response(
				'folder_not_found',
				__( 'Folder not found.', 'wp-filetron' ),
				404
			);
		}

		$data = array();
		foreach ( array( 'name', 'parent_id', 'color', 'order_index' ) as $field ) {
			$value = $request->get_param( $field );
			if ( null !== $value ) {
				$data[ $field ] = $value;
			}
		}

		if ( array_key_exists( 'parent_id', $data ) ) {
			$new_parent = absint( $data['parent_id'] );

			if ( $new_parent === (int) $folder_id ) {
				return $this->error_response(
					'folder_parent_invalid',
					__( 'A folder cannot be its own parent.', 'wp-filetron' ),
					400
				);
			}

			if ( $new_parent > 0 && ! Folder_Manager::get_folder( $new_parent ) ) {
				return $this->error_response(
					'folder_parent_not_found',
					__( 'The specified parent folder does not exist.', 'wp-filetron' ),
					404
				);
			}

			if ( $new_parent > 0 && Folder_Manager::is_descendant( $new_parent, $folder_id ) ) {
				return $this->error_response(
					'folder_parent_cyclic',
					__( 'Cannot move a folder inside its own descendant.', 'wp-filetron' ),
					400
				);
			}
		}

		if ( array_key_exists( 'name', $data ) && '' === trim( (string) $data['name'] ) ) {
			return $this->error_response(
				'invalid_folder_name',
				__( 'Folder name must be between 1 and 255 characters.', 'wp-filetron' ),
				400
			);
		}

		$result = Folder_Manager::update_folder( $folder_id, $data );

		if ( ! $result ) {
			return $this->error_response(
				'folder_update_failed',
				__( 'Failed to update folder.', 'wp-filetron' ),
				500
			);
		}

		$folder = Folder_Manager::get_folder( $folder_id );

		return $this->success_response(
			$folder,
			__( 'Folder updated successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Delete folder.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_folder( $request ) {
		$folder_id = $request->get_param( 'id' );

		// Check if folder exists.
		$folder = Folder_Manager::get_folder( $folder_id );
		if ( ! $folder ) {
			return $this->error_response(
				'folder_not_found',
				__( 'Folder not found.', 'wp-filetron' ),
				404
			);
		}

		$result = Folder_Manager::delete_folder( $folder_id );

		if ( ! $result ) {
			return $this->error_response(
				'folder_delete_failed',
				__( 'Failed to delete folder.', 'wp-filetron' ),
				500
			);
		}

		return $this->success_response(
			null,
			__( 'Folder deleted successfully.', 'wp-filetron' )
		);
	}

	// ============================================
	// TAG ENDPOINTS
	// ============================================

	/**
	 * Get tags.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_tags( $request ) {
		$args = array();

		$search = $request->get_param( 'search' );
		if ( ! empty( $search ) ) {
			$args['search'] = $search;
		}

		$tags = Tag_Manager::get_tags( $args );

		return $this->success_response( $tags );
	}

	/**
	 * Create tag.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_tag( $request ) {
		$name = (string) $request->get_param( 'name' );
		if ( '' === trim( $name ) ) {
			return $this->error_response(
				'invalid_tag_name',
				__( 'Tag name must be between 1 and 100 characters.', 'wp-filetron' ),
				400
			);
		}

		$data = array(
			'name'        => $name,
			'description' => $request->get_param( 'description' ),
		);

		$tag_id = Tag_Manager::create_tag( $data );

		if ( ! $tag_id ) {
			return $this->error_response(
				'tag_creation_failed',
				__( 'Failed to create tag.', 'wp-filetron' ),
				500
			);
		}

		$tag = Tag_Manager::get_tag( $tag_id );

		return $this->success_response(
			$tag,
			__( 'Tag created successfully.', 'wp-filetron' ),
			201
		);
	}

	/**
	 * Update tag.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_tag( $request ) {
		$tag_id = $request->get_param( 'id' );

		// Check if tag exists.
		$tag = Tag_Manager::get_tag( $tag_id );
		if ( ! $tag ) {
			return $this->error_response(
				'tag_not_found',
				__( 'Tag not found.', 'wp-filetron' ),
				404
			);
		}

		$data = array();
		foreach ( array( 'name', 'description' ) as $field ) {
			$value = $request->get_param( $field );
			if ( null !== $value ) {
				$data[ $field ] = $value;
			}
		}

		if (
			array_key_exists( 'name', $data ) &&
			'' === trim( (string) $data['name'] )
		) {
			return $this->error_response(
				'invalid_tag_name',
				__( 'Tag name must be between 1 and 100 characters.', 'wp-filetron' ),
				400
			);
		}

		$result = Tag_Manager::update_tag( $tag_id, $data );

		if ( ! $result ) {
			return $this->error_response(
				'tag_update_failed',
				__( 'Failed to update tag.', 'wp-filetron' ),
				500
			);
		}

		$tag = Tag_Manager::get_tag( $tag_id );

		return $this->success_response(
			$tag,
			__( 'Tag updated successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Delete tag.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_tag( $request ) {
		$tag_id = $request->get_param( 'id' );

		// Check if tag exists.
		$tag = Tag_Manager::get_tag( $tag_id );
		if ( ! $tag ) {
			return $this->error_response(
				'tag_not_found',
				__( 'Tag not found.', 'wp-filetron' ),
				404
			);
		}

		$result = Tag_Manager::delete_tag( $tag_id );

		if ( ! $result ) {
			return $this->error_response(
				'tag_delete_failed',
				__( 'Failed to delete tag.', 'wp-filetron' ),
				500
			);
		}

		return $this->success_response(
			null,
			__( 'Tag deleted successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Add tags to media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function add_media_tags( $request ) {
		$media_id = absint( $request->get_param( 'id' ) );
		$raw_tag_ids = $request->get_param( 'tag_ids' );

		if ( $media_id <= 0 ) {
			return $this->error_response(
				'media_not_found',
				__( 'The specified media item does not exist.', 'wp-filetron' ),
				404
			);
		}

		$media_post = get_post( $media_id );
		if ( ! $media_post || 'attachment' !== $media_post->post_type ) {
			return $this->error_response(
				'media_not_found',
				__( 'The specified media item does not exist.', 'wp-filetron' ),
				404
			);
		}

		if ( empty( $raw_tag_ids ) || ! is_array( $raw_tag_ids ) ) {
			return $this->error_response(
				'invalid_tag_ids',
				__( 'No tag IDs were provided.', 'wp-filetron' ),
				400
			);
		}

		$tag_ids = array_filter(
			array_map( 'absint', $this->sanitize_int_array( $raw_tag_ids ) )
		);

		if ( empty( $tag_ids ) ) {
			return $this->error_response(
				'invalid_tag_ids',
				__( 'No valid tag IDs were provided.', 'wp-filetron' ),
				400
			);
		}

		$unique_tag_ids = array_values( array_unique( $tag_ids ) );

		foreach ( $unique_tag_ids as $tag_id ) {
			if ( ! Tag_Manager::get_tag( $tag_id ) ) {
				return $this->error_response(
					'tag_not_found',
					__( 'One or more tags could not be found.', 'wp-filetron' ),
					404
				);
			}
		}

		foreach ( $unique_tag_ids as $tag_id ) {
			Tag_Manager::add_tag_to_media( $media_id, $tag_id );
		}

		$tags = Tag_Manager::get_media_tags( $media_id );

		return $this->success_response(
			$tags,
			__( 'Tags added successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Get media tags.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_media_tags( $request ) {
		$media_id = $request->get_param( 'id' );
		$tags     = Tag_Manager::get_media_tags( $media_id );

		return $this->success_response( $tags );
	}

	// ============================================
	// MEDIA ENDPOINTS
	// ============================================

	/**
	 * Upload media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function upload_media( $request ) {
		$file_params = $request->get_file_params();

		if ( empty( $file_params ) || empty( $file_params['file'] ) ) {
			return $this->error_response(
				'missing_file',
				__( 'No file was uploaded.', 'wp-filetron' ),
				400
			);
		}

		$file       = $file_params['file'];
		$validation = $this->validate_upload_file( $file );

		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$file_data = array(
			'name'     => sanitize_file_name( $file['name'] ),
			'type'     => isset( $file['type'] ) ? $file['type'] : '',
			'tmp_name' => $file['tmp_name'],
			'error'    => $file['error'],
			'size'     => $file['size'],
		);

		$uploaded = wp_handle_upload(
			$file_data,
			array(
				'test_form' => false,
			)
		);

		if ( isset( $uploaded['error'] ) ) {
			return $this->error_response(
				'upload_failed',
				$uploaded['error'],
				500
			);
		}

		$title       = $request->get_param( 'title' );
		$description = $request->get_param( 'description' );

		if ( empty( $title ) ) {
			$title = preg_replace( '/\.[^.]+$/', '', $file_data['name'] );
		}

		$attachment = array(
			'post_mime_type' => $uploaded['type'],
			'post_title'     => sanitize_text_field( $title ),
			'post_content'   => null !== $description ? sanitize_textarea_field( $description ) : '',
			'post_status'    => 'inherit',
		);

		$attachment_id = wp_insert_attachment( $attachment, $uploaded['file'] );

		if ( is_wp_error( $attachment_id ) ) {
			@unlink( $uploaded['file'] );

			return $this->error_response(
				'attachment_failed',
				$attachment_id->get_error_message(),
				500
			);
		}

		$metadata = wp_generate_attachment_metadata( $attachment_id, $uploaded['file'] );
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$alt_text = $request->get_param( 'alt_text' );
		if ( null !== $alt_text ) {
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', sanitize_text_field( $alt_text ) );
		}

		$assigned_folder_id = 0;
		$folder_id          = $request->get_param( 'folder_id' );
		if ( null !== $folder_id ) {
			$folder_id = absint( $folder_id );

			if ( $folder_id > 0 && ! Folder_Manager::get_folder( $folder_id ) ) {
				wp_delete_attachment( $attachment_id, true );

				return $this->error_response(
					'folder_not_found',
					__( 'The specified folder does not exist.', 'wp-filetron' ),
					400
				);
			}

			if (
				$folder_id > 0 &&
				! Folder_Manager::assign_media_to_folder( $attachment_id, $folder_id )
			) {
				wp_delete_attachment( $attachment_id, true );

				return $this->error_response(
					'folder_assignment_failed',
					__( 'Failed to assign media to the specified folder.', 'wp-filetron' ),
					500
				);
			}
			if ( 0 === $folder_id ) {
				Folder_Manager::assign_media_to_folder( $attachment_id, 0 );
			}
			$assigned_folder_id = $folder_id;
		}

		$tag_ids = $request->get_param( 'tag_ids' );
		if ( is_array( $tag_ids ) ) {
			$tag_ids = $this->sanitize_int_array( $tag_ids );

			foreach ( $tag_ids as $tag_id ) {
				if ( $tag_id > 0 ) {
					Tag_Manager::add_tag_to_media( $attachment_id, $tag_id );
				}
			}
		}

		/**
		 * Fires after a media file has been uploaded via the WP fileTRON API.
		 *
		 * @param int               $attachment_id Attachment ID.
		 * @param \WP_REST_Request  $request       Request object.
		 * @param array             $uploaded      Upload data array.
		 */
		do_action( 'wft_after_media_upload', $attachment_id, $request, $uploaded );

		$post = get_post( $attachment_id );

		return $this->success_response(
			$this->format_media_item( $post, $assigned_folder_id ),
			__( 'Media uploaded successfully.', 'wp-filetron' ),
			201
		);
	}

	/**
	 * Get media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_media( $request ) {
		$folder_filter = $request->get_param( 'folder_id' );
		$folder_filter = null !== $folder_filter ? absint( $folder_filter ) : null;

		$args = array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'posts_per_page' => max( 1, (int) $request->get_param( 'per_page' ) ),
			'paged'          => max( 1, (int) $request->get_param( 'page' ) ),
		);

		if ( $folder_filter && $folder_filter > 0 ) {
			$filtered_media_ids = Folder_Manager::get_media_ids_by_folder( $folder_filter );

			if ( empty( $filtered_media_ids ) ) {
				return $this->success_response(
					array(
						'items'        => array(),
						'total'        => 0,
						'total_pages'  => 0,
						'current_page' => $args['paged'],
					)
				);
			}

			$args['post__in'] = $filtered_media_ids;
			$args['orderby']  = 'post__in';
		}

		$query      = new \WP_Query( $args );
		$media      = array();
		$post_ids   = wp_list_pluck( $query->posts, 'ID' );
		$folder_map = Folder_Manager::get_media_folder_map( $post_ids );

		foreach ( $query->posts as $post ) {
			$media[] = $this->format_media_item(
				$post,
				isset( $folder_map[ $post->ID ] ) ? $folder_map[ $post->ID ] : null
			);
		}

		return $this->success_response(
			array(
				'items'        => $media,
				'total'        => (int) $query->found_posts,
				'total_pages'  => (int) $query->max_num_pages,
				'current_page' => (int) $args['paged'],
			)
		);
	}

	/**
	 * Get single media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_single_media( $request ) {
		$media_id = $request->get_param( 'id' );
		$post     = get_post( $media_id );

		if ( ! $post || 'attachment' !== $post->post_type ) {
			return $this->error_response(
				'media_not_found',
				__( 'Media not found.', 'wp-filetron' ),
				404
			);
		}

		$folder_id = Folder_Manager::get_media_folder_id( $media_id );

		return $this->success_response( $this->format_media_item( $post, $folder_id ) );
	}

	/**
	 * Update media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function update_media( $request ) {
		$media_id = $request->get_param( 'id' );
		$post     = get_post( $media_id );

		if ( ! $post || 'attachment' !== $post->post_type ) {
			return $this->error_response(
				'media_not_found',
				__( 'Media not found.', 'wp-filetron' ),
				404
			);
		}

		// Update post fields.
		$update_data = array( 'ID' => $media_id );

		$title = $request->get_param( 'title' );
		if ( null !== $title ) {
			$update_data['post_title'] = $title;
		}

		$description = $request->get_param( 'description' );
		if ( null !== $description ) {
			$update_data['post_content'] = $description;
		}

		if ( count( $update_data ) > 1 ) {
			wp_update_post( $update_data );
		}

		// Update alt text.
		$alt_text = $request->get_param( 'alt_text' );
		if ( null !== $alt_text ) {
			update_post_meta( $media_id, '_wp_attachment_image_alt', $alt_text );
		}

		$folder_param = $request->get_param( 'folder_id' );
		if ( null !== $folder_param ) {
			$folder_param = absint( $folder_param );

			if ( $folder_param > 0 && ! Folder_Manager::get_folder( $folder_param ) ) {
				return $this->error_response(
					'folder_not_found',
					__( 'The specified folder does not exist.', 'wp-filetron' ),
					400
				);
			}

			Folder_Manager::assign_media_to_folder( $media_id, $folder_param );
		}

		$updated_post = get_post( $media_id );
		$folder_id    = Folder_Manager::get_media_folder_id( $media_id );

		return $this->success_response(
			$this->format_media_item( $updated_post, $folder_id ),
			__( 'Media updated successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Delete media.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function delete_media( $request ) {
		$media_id = absint( $request->get_param( 'id' ) );
		$post     = get_post( $media_id );

		if ( ! $post || 'attachment' !== $post->post_type ) {
			return $this->error_response(
				'media_not_found',
				__( 'Media not found.', 'wp-filetron' ),
				404
			);
		}

		// Remove folder mapping prior to deletion.
		Folder_Manager::assign_media_to_folder( $media_id, 0 );

		$deleted = wp_delete_attachment( $media_id, true );

		if ( false === $deleted ) {
			return $this->error_response(
				'media_delete_failed',
				__( 'Failed to delete media.', 'wp-filetron' ),
				500
			);
		}

		return $this->success_response(
			array(
				'id' => $media_id,
			),
			__( 'Media deleted successfully.', 'wp-filetron' )
		);
	}

	/**
	 * Get media usage.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_media_usage( $request ) {
		$media_id = $request->get_param( 'id' );
		$usage    = Asset_Tracker::get_media_usage( $media_id );

		return $this->success_response( $usage );
	}

	/**
	 * Bulk media operation.
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function bulk_media_operation( $request ) {
		$media_ids = $request->get_param( 'media_ids' );
		$action    = $request->get_param( 'action' );

		if ( empty( $media_ids ) || ! is_array( $media_ids ) ) {
			return $this->error_response(
				'rest_invalid_param',
				__( 'Media IDs are required.', 'wp-filetron' ),
				400
			);
		}

		$results = array(
			'success_ids' => array(),
			'failed'      => array(),
		);

		switch ( $action ) {
			case 'delete':
				foreach ( $media_ids as $media_id ) {
					$media_id = absint( $media_id );
					$post     = get_post( $media_id );

					if ( ! $post || 'attachment' !== $post->post_type ) {
						$results['failed'][] = array(
							'id'   => $media_id,
							'code' => 'media_not_found',
						);
						continue;
					}

					Folder_Manager::assign_media_to_folder( $media_id, 0 );

					if ( wp_delete_attachment( $media_id, true ) ) {
						$results['success_ids'][] = $media_id;
					} else {
						$results['failed'][] = array(
							'id'   => $media_id,
							'code' => 'media_delete_failed',
						);
					}
				}
				break;

			case 'move':
				$target_folder = $request->get_param( 'folder_id' );
				$target_folder = null === $target_folder ? null : absint( $target_folder );

				if ( null === $target_folder ) {
					return $this->error_response(
						'missing_folder_id',
						__( 'Folder ID is required for move action.', 'wp-filetron' ),
						400
					);
				}

				if ( $target_folder > 0 && ! Folder_Manager::get_folder( $target_folder ) ) {
					return $this->error_response(
						'folder_not_found',
						__( 'The specified folder does not exist.', 'wp-filetron' ),
						404
					);
				}

				foreach ( $media_ids as $media_id ) {
					$media_id = absint( $media_id );
					$post     = get_post( $media_id );

					if ( ! $post || 'attachment' !== $post->post_type ) {
						$results['failed'][] = array(
							'id'   => $media_id,
							'code' => 'media_not_found',
						);
						continue;
					}

					$assigned = Folder_Manager::assign_media_to_folder( $media_id, $target_folder );

					if ( $assigned ) {
						$results['success_ids'][] = $media_id;
					} else {
						$results['failed'][] = array(
							'id'   => $media_id,
							'code' => 'folder_assignment_failed',
						);
					}
				}
				break;

			case 'tag':
				$tag_ids = $request->get_param( 'tag_ids' );
				if ( empty( $tag_ids ) ) {
					return $this->error_response(
						'missing_tag_ids',
						__( 'Tag IDs are required for tag action.', 'wp-filetron' )
					);
				}

				foreach ( $media_ids as $media_id ) {
					$media_id = absint( $media_id );
					foreach ( $tag_ids as $tag_id ) {
						Tag_Manager::add_tag_to_media( $media_id, $tag_id );
					}
					$results['success_ids'][] = $media_id;
				}
				break;

			default:
				return $this->error_response(
					'invalid_action',
					__( 'Invalid bulk action.', 'wp-filetron' )
				);
		}

		$data = array(
			'success_count' => count( $results['success_ids'] ),
			'failed_count'  => count( $results['failed'] ),
			'success_ids'   => array_map( 'absint', $results['success_ids'] ),
		);

		if ( ! empty( $results['failed'] ) ) {
			$data['failed'] = $results['failed'];
		}

		return $this->success_response(
			$data,
			__( 'Bulk operation completed.', 'wp-filetron' )
		);
	}

	/**
	 * Format media item for API response.
	 *
	 * @param \WP_Post $post Post object.
	 * @return array
	 */
	private function format_media_item( $post, $folder_id = null ) {
		$metadata  = wp_get_attachment_metadata( $post->ID );
		$folder_id = null === $folder_id ? Folder_Manager::get_media_folder_id( $post->ID ) : $folder_id;
		$folder_id = $folder_id ? (int) $folder_id : 0;

		return array(
			'id'          => $post->ID,
			'title'       => $post->post_title,
			'description' => $post->post_content,
			'alt_text'    => get_post_meta( $post->ID, '_wp_attachment_image_alt', true ),
			'url'         => wp_get_attachment_url( $post->ID ),
			'thumbnail'   => wp_get_attachment_image_url( $post->ID, 'thumbnail' ),
			'medium'      => wp_get_attachment_image_url( $post->ID, 'medium' ),
			'mime_type'   => $post->post_mime_type,
			'file_size'   => isset( $metadata['filesize'] ) ? $metadata['filesize'] : filesize( get_attached_file( $post->ID ) ),
			'width'       => isset( $metadata['width'] ) ? $metadata['width'] : null,
			'height'      => isset( $metadata['height'] ) ? $metadata['height'] : null,
			'uploaded'    => $post->post_date,
			'folder_id'   => $folder_id,
		);
	}

	/**
	 * Validate uploaded file before processing.
	 *
	 * @param array $file File array from $_FILES.
	 * @return bool|\WP_Error
	 */
	private function validate_upload_file( $file ) {
		if ( empty( $file['tmp_name'] ) || ! file_exists( $file['tmp_name'] ) ) {
			return $this->error_response(
				'invalid_upload',
				__( 'Uploaded file could not be found.', 'wp-filetron' ),
				400
			);
		}

		if ( ! empty( $file['error'] ) ) {
			return $this->error_response(
				'upload_error',
				$this->get_upload_error_message( (int) $file['error'] ),
				400
			);
		}

		$max_size = wp_max_upload_size();
		if ( $max_size && ! empty( $file['size'] ) && (int) $file['size'] > $max_size ) {
			return $this->error_response(
				'file_too_large',
				sprintf(
					/* translators: %s: maximum allowed file size. */
					__( 'File exceeds the maximum upload size of %s.', 'wp-filetron' ),
					size_format( $max_size )
				),
				400
			);
		}

		$check = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'] );
		if ( empty( $check['type'] ) || empty( $check['ext'] ) ) {
			return $this->error_response(
				'invalid_file_type',
				__( 'This file type is not allowed.', 'wp-filetron' ),
				400
			);
		}

		$dangerous_extensions = array( 'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'pl', 'py', 'jsp', 'asp', 'sh', 'cgi' );
		if ( in_array( strtolower( $check['ext'] ), $dangerous_extensions, true ) ) {
			return $this->error_response(
				'invalid_file_type',
				__( 'Executable files are not allowed.', 'wp-filetron' ),
				400
			);
		}

		return true;
	}

	/**
	 * Map PHP upload error codes to readable messages.
	 *
	 * @param int $code PHP upload error code.
	 * @return string
	 */
	private function get_upload_error_message( $code ) {
		switch ( $code ) {
			case UPLOAD_ERR_INI_SIZE:
			case UPLOAD_ERR_FORM_SIZE:
				return __( 'The uploaded file exceeds the maximum allowed size.', 'wp-filetron' );
			case UPLOAD_ERR_PARTIAL:
				return __( 'The uploaded file was only partially uploaded.', 'wp-filetron' );
			case UPLOAD_ERR_NO_FILE:
				return __( 'No file was uploaded.', 'wp-filetron' );
			case UPLOAD_ERR_NO_TMP_DIR:
				return __( 'Missing a temporary folder on the server.', 'wp-filetron' );
			case UPLOAD_ERR_CANT_WRITE:
				return __( 'Failed to write the file to disk.', 'wp-filetron' );
			case UPLOAD_ERR_EXTENSION:
				return __( 'A PHP extension stopped the file upload.', 'wp-filetron' );
			default:
				return __( 'File upload failed due to an unknown error.', 'wp-filetron' );
		}
	}
}
