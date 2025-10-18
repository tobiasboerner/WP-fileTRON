<?php
/**
 * Plugin Name: WP fileTRON
 * Plugin URI: https://github.com/yourusername/wp-filetron
 * Description: Modern WordPress media manager with folder structure, tagging, and asset tracking. A powerful alternative to the default media library.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Your Name
 * Author URI: https://yourwebsite.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wp-filetron
 * Domain Path: /languages
 *
 * @package WP_Filetron
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'WFT_VERSION', '1.0.0' );
define( 'WFT_PLUGIN_FILE', __FILE__ );
define( 'WFT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WFT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WFT_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'WFT_MIN_PHP_VERSION', '7.4' );
define( 'WFT_MIN_WP_VERSION', '6.0' );

/**
 * Check minimum requirements before loading the plugin.
 */
function wft_check_requirements() {
	$errors = array();

	// Check PHP version.
	if ( version_compare( PHP_VERSION, WFT_MIN_PHP_VERSION, '<' ) ) {
		$errors[] = sprintf(
			/* translators: 1: Required PHP version, 2: Current PHP version */
			__( 'WP fileTRON requires PHP version %1$s or higher. You are running version %2$s.', 'wp-filetron' ),
			WFT_MIN_PHP_VERSION,
			PHP_VERSION
		);
	}

	// Check WordPress version.
	global $wp_version;
	if ( version_compare( $wp_version, WFT_MIN_WP_VERSION, '<' ) ) {
		$errors[] = sprintf(
			/* translators: 1: Required WordPress version, 2: Current WordPress version */
			__( 'WP fileTRON requires WordPress version %1$s or higher. You are running version %2$s.', 'wp-filetron' ),
			WFT_MIN_WP_VERSION,
			$wp_version
		);
	}

	if ( ! empty( $errors ) ) {
		add_action(
			'admin_notices',
			function () use ( $errors ) {
				?>
				<div class="notice notice-error">
					<p><strong><?php esc_html_e( 'WP fileTRON cannot be activated:', 'wp-filetron' ); ?></strong></p>
					<ul>
						<?php foreach ( $errors as $error ) : ?>
							<li><?php echo wp_kses_post( $error ); ?></li>
						<?php endforeach; ?>
					</ul>
				</div>
				<?php
			}
		);

		// Deactivate the plugin.
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		deactivate_plugins( WFT_PLUGIN_BASENAME );

		return false;
	}

	return true;
}

// Check requirements.
if ( ! wft_check_requirements() ) {
	return;
}

/**
 * Autoloader for plugin classes.
 *
 * @param string $class_name The name of the class to load.
 */
function wft_autoloader( $class_name ) {
	// Only load classes from our namespace.
	if ( strpos( $class_name, 'WP_Filetron\\' ) !== 0 ) {
		return;
	}

	// Remove namespace prefix.
	$class_name = str_replace( 'WP_Filetron\\', '', $class_name );

	// Convert class name to file name.
	$class_name = strtolower( $class_name );
	$class_name = str_replace( '_', '-', $class_name );

	// Try to load from includes/ first.
	$file = WFT_PLUGIN_DIR . 'includes/class-' . $class_name . '.php';

	if ( file_exists( $file ) ) {
		require_once $file;
		return;
	}

	// Try to load from admin/.
	$file = WFT_PLUGIN_DIR . 'admin/class-' . $class_name . '.php';

	if ( file_exists( $file ) ) {
		require_once $file;
		return;
	}
}
spl_autoload_register( 'wft_autoloader' );

// Load Composer autoloader if it exists.
if ( file_exists( WFT_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once WFT_PLUGIN_DIR . 'vendor/autoload.php';
}

/**
 * Initialize the plugin.
 */
function wft_init() {
	// Load plugin textdomain for translations.
	load_plugin_textdomain(
		'wp-filetron',
		false,
		dirname( WFT_PLUGIN_BASENAME ) . '/languages'
	);

	// Initialize the main plugin class.
	if ( class_exists( 'WP_Filetron\Plugin' ) ) {
		\WP_Filetron\Plugin::instance();
	}
}
add_action( 'plugins_loaded', 'wft_init' );

/**
 * Activation hook.
 */
function wft_activate() {
	// Check requirements again on activation.
	if ( ! wft_check_requirements() ) {
		return;
	}

	// Run installer.
	if ( class_exists( 'WP_Filetron\Installer' ) ) {
		\WP_Filetron\Installer::activate();
	}

	// Flush rewrite rules.
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'wft_activate' );

/**
 * Deactivation hook.
 */
function wft_deactivate() {
	if ( class_exists( 'WP_Filetron\Installer' ) ) {
		\WP_Filetron\Installer::deactivate();
	}

	// Flush rewrite rules.
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'wft_deactivate' );

/**
 * Uninstall hook.
 * Note: This should be in a separate uninstall.php file for WordPress.org compliance.
 */
// register_uninstall_hook( __FILE__, 'wft_uninstall' );
