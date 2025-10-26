<?php
/**
 * Bootstrap file for PHPStan.
 *
 * Loads Composer autoloader, WordPress stubs and plugin constants so that
 * static analysis finds all required symbols.
 */

$vendor_autoload = __DIR__ . '/vendor/autoload.php';
if ( file_exists( $vendor_autoload ) ) {
	require_once $vendor_autoload;
}

$wordpress_stubs = __DIR__ . '/vendor/php-stubs/wordpress-stubs/wordpress-stubs.php';
if ( file_exists( $wordpress_stubs ) ) {
	require_once $wordpress_stubs;
}

// Define common WordPress constants if the stubs did not set them.
$wp_array_constants = array( 'ARRAY_A', 'ARRAY_N', 'OBJECT', 'OBJECT_K' );
foreach ( $wp_array_constants as $constant ) {
	if ( ! defined( $constant ) ) {
		define( $constant, $constant );
	}
}

$plugin_entry = __DIR__ . '/wp-filetron.php';
if ( file_exists( $plugin_entry ) ) {
	require_once $plugin_entry;
}
