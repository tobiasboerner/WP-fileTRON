<?php
/**
 * Admin Class
 *
 * Handles all admin-related functionality.
 *
 * @package WP_Filetron
 */

namespace WP_Filetron;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin Class
 */
class Admin {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
	}

	/**
	 * Add admin menu.
	 */
	public function add_admin_menu() {
		add_menu_page(
			__( 'WP fileTRON', 'wp-filetron' ),           // Page title
			__( 'fileTRON', 'wp-filetron' ),              // Menu title
			'upload_files',                                // Capability
			'wp-filetron',                                 // Menu slug
			array( $this, 'render_admin_page' ),           // Callback
			$this->get_menu_icon(),                        // Icon
			20                                             // Position (below Media)
		);

		// Add Settings submenu.
		add_submenu_page(
			'wp-filetron',
			__( 'Settings', 'wp-filetron' ),
			__( 'Settings', 'wp-filetron' ),
			'manage_options',
			'wp-filetron-settings',
			array( $this, 'render_settings_page' )
		);

		// Add API Test submenu (development only).
		add_submenu_page(
			'wp-filetron',
			__( 'API Test', 'wp-filetron' ),
			__( '🧪 API Test', 'wp-filetron' ),
			'upload_files',
			'wp-filetron-api-test',
			array( $this, 'render_api_test_page' )
		);
	}

	/**
	 * Get menu icon (base64 encoded SVG).
	 *
	 * @return string
	 */
	private function get_menu_icon() {
		// Simple folder icon SVG
		return 'data:image/svg+xml;base64,' . base64_encode(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
			</svg>'
		);
	}

	/**
	 * Render main admin page.
	 */
	public function render_admin_page() {
		// Check user capabilities.
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'wp-filetron' ) );
		}

		?>
		<div class="wrap">
			<div id="wft-app" class="wft-app">
				<!-- React app will be mounted here -->
				<div style="padding: 20px; text-align: center;">
					<p><?php esc_html_e( 'Loading WP fileTRON...', 'wp-filetron' ); ?></p>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Render settings page.
	 */
	public function render_settings_page() {
		// Check user capabilities.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'wp-filetron' ) );
		}

		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

			<div class="notice notice-info">
				<p><?php esc_html_e( 'Settings page will be implemented in a future phase.', 'wp-filetron' ); ?></p>
			</div>

			<!-- Settings form will be added later -->
			<form method="post" action="options.php">
				<?php
				// Output security fields for the registered setting.
				// settings_fields( 'wft_settings_group' );

				// Output setting sections and their fields.
				// do_settings_sections( 'wp-filetron-settings' );

				// Output save settings button.
				// submit_button( __( 'Save Settings', 'wp-filetron' ) );
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Render API test page.
	 */
	public function render_api_test_page() {
		// Check user capabilities.
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'wp-filetron' ) );
		}

		// Include the test page template.
		require_once WFT_PLUGIN_DIR . 'admin/test-api.php';
	}
}
