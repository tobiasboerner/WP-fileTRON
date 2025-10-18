<?php
/**
 * Main Plugin Class
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main Plugin Class
 *
 * Singleton pattern implementation.
 */
class Plugin {

	/**
	 * The single instance of the class.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Admin instance.
	 *
	 * @var Admin|null
	 */
	public $admin = null;

	/**
	 * REST API instance.
	 *
	 * @var REST_API|null
	 */
	public $rest_api = null;

	/**
	 * Installer instance.
	 *
	 * @var Installer|null
	 */
	public $installer = null;

	/**
	 * Main Plugin Instance.
	 *
	 * Ensures only one instance of Plugin is loaded or can be loaded.
	 *
	 * @return Plugin - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Plugin Constructor.
	 */
	private function __construct() {
		$this->init_hooks();
		$this->includes();
		$this->init_classes();
	}

	/**
	 * Hook into actions and filters.
	 */
	private function init_hooks() {
		// Initialize plugin after WordPress is loaded.
		add_action( 'init', array( $this, 'init' ), 0 );

		// Enqueue scripts and styles.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Include required core files.
	 */
	private function includes() {
		// No manual includes needed - using autoloader.
		// But we could include files that don't follow PSR-4 here if needed.
	}

	/**
	 * Initialize plugin classes.
	 */
	private function init_classes() {
		// Initialize Admin.
		if ( is_admin() ) {
			$this->admin = new Admin();
		}

		// Initialize REST API.
		$this->rest_api = new REST_API();
	}

	/**
	 * Init Plugin when WordPress Initializes.
	 */
	public function init() {
		// Check if database needs update.
		$this->maybe_update_db();

		/**
		 * Fires after WP fileTRON is fully loaded.
		 *
		 * @since 1.0.0
		 */
		do_action( 'wft_plugin_loaded' );
	}

	/**
	 * Check if database needs update and run it if needed.
	 */
	private function maybe_update_db() {
		// Only run in admin.
		if ( ! is_admin() ) {
			return;
		}

		// Check if update is needed.
		if ( Installer::needs_db_update() ) {
			// Run the update.
			Installer::update_db();

			// Show admin notice.
			add_action( 'admin_notices', array( $this, 'show_db_updated_notice' ) );
		}
	}

	/**
	 * Show database updated notice.
	 */
	public function show_db_updated_notice() {
		?>
		<div class="notice notice-success is-dismissible">
			<p>
				<?php
				printf(
					/* translators: %s: Plugin name */
					esc_html__( '%s database has been updated successfully.', 'wp-filetron' ),
					'<strong>WP fileTRON</strong>'
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_admin_scripts( $hook ) {
		// Only load on our plugin page.
		if ( 'toplevel_page_wp-filetron' !== $hook ) {
			return;
		}

		// Enqueue our React app (will be built by webpack).
		$asset_file = WFT_PLUGIN_DIR . 'build/index.asset.php';

		if ( file_exists( $asset_file ) ) {
			$asset = include $asset_file;

			// Enqueue the script.
			wp_enqueue_script(
				'wft-admin-app',
				WFT_PLUGIN_URL . 'build/index.js',
				$asset['dependencies'],
				$asset['version'],
				true
			);

			// Enqueue the styles.
			wp_enqueue_style(
				'wft-admin-app',
				WFT_PLUGIN_URL . 'build/index.css',
				array( 'wp-components' ),
				$asset['version']
			);

			// Pass data to JavaScript.
			wp_localize_script(
				'wft-admin-app',
				'wftData',
				array(
					'apiUrl'      => rest_url( 'wft/v1/' ),
					'nonce'       => wp_create_nonce( 'wp_rest' ),
					'pluginUrl'   => WFT_PLUGIN_URL,
					'assetsUrl'   => WFT_PLUGIN_URL . 'assets/',
					'version'     => WFT_VERSION,
					'currentUser' => array(
						'id'           => get_current_user_id(),
						'name'         => wp_get_current_user()->display_name,
						'capabilities' => array(
							'upload_files'   => current_user_can( 'upload_files' ),
							'delete_posts'   => current_user_can( 'delete_posts' ),
							'manage_options' => current_user_can( 'manage_options' ),
						),
					),
					'i18n'        => array(
						'appTitle'       => __( 'WP fileTRON', 'wp-filetron' ),
						'loading'        => __( 'Loading...', 'wp-filetron' ),
						'error'          => __( 'An error occurred', 'wp-filetron' ),
						'noPermission'   => __( 'You do not have permission to perform this action.', 'wp-filetron' ),
						'confirmDelete'  => __( 'Are you sure you want to delete this?', 'wp-filetron' ),
					),
				)
			);
		}
	}

	/**
	 * Get the plugin version.
	 *
	 * @return string
	 */
	public function get_version() {
		return WFT_VERSION;
	}

	/**
	 * Get the plugin URL.
	 *
	 * @return string
	 */
	public function plugin_url() {
		return WFT_PLUGIN_URL;
	}

	/**
	 * Get the plugin path.
	 *
	 * @return string
	 */
	public function plugin_path() {
		return WFT_PLUGIN_DIR;
	}

	/**
	 * Prevent cloning.
	 */
	private function __clone() {
		// Prevent cloning of the instance.
	}

	/**
	 * Prevent unserializing.
	 */
	public function __wakeup() {
		// Prevent unserializing of the instance.
	}
}
