<?php
/**
 * The Finest Impact theme bootstrap.
 *
 * Block theme: design tokens live in theme.json, page content lives in
 * native Gutenberg blocks (post_content), so content editors work with the
 * normal WordPress block editor: no ACF, no hardcoded PHP templates.
 */

defined( 'ABSPATH' ) || exit;

define( 'FINEST_THEME_VERSION', '1.0.0' );
define( 'FINEST_THEME_DIR', get_template_directory() );
define( 'FINEST_THEME_URI', get_template_directory_uri() );

/**
 * Theme support. Block themes get template-editing support implicitly, but
 * these still need to be declared explicitly.
 */
function finest_theme_setup() {
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'title-tag' );

	add_editor_style( 'assets/css/editor.css' );

	register_nav_menus( array(
		'primary' => __( 'Hoofdmenu', 'finest-impact' ),
		'footer'  => __( 'Footer menu', 'finest-impact' ),
	) );
}
add_action( 'after_setup_theme', 'finest_theme_setup' );

/**
 * Fonts are self-hosted (theme.json fontFace) rather than loaded from
 * fonts.googleapis.com, avoiding sending EU visitors' IPs to a third party
 * on every page load (see Fase 8 / GDPR notes) and avoids FOUC from a
 * render-blocking external stylesheet.
 */
function finest_enqueue_assets() {
	wp_enqueue_style(
		'finest-impact-style',
		get_stylesheet_uri(),
		array(),
		FINEST_THEME_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'finest_enqueue_assets' );

/**
 * Custom block pattern category so our patterns group together in the
 * inserter instead of scattering across "Featured" etc.
 */
function finest_register_pattern_categories() {
	register_block_pattern_category(
		'finest-impact',
		array( 'label' => __( 'The Finest Impact', 'finest-impact' ) )
	);
}
add_action( 'init', 'finest_register_pattern_categories' );

/**
 * WordPress auto-registers any .php file in the theme's patterns/ directory
 * that carries a "Title:"/"Slug:" header comment (since WP 6.0); no manual
 * register_block_pattern() calls needed for the ones designers/editors pick
 * from the inserter. We still expose finest_get_pattern_content() below so
 * provisioning can pull the exact same markup into a page's post_content.
 */

/**
 * Register the outline-button style variation used throughout the patterns
 * (register_block_style, not just a hardcoded className) so editors can
 * also pick it from the block style panel when adding new buttons.
 */
function finest_register_block_styles() {
	register_block_style(
		'core/button',
		array(
			'name'  => 'fi-outline',
			'label' => __( 'Outline', 'finest-impact' ),
		)
	);
}
add_action( 'init', 'finest_register_block_styles' );

require_once FINEST_THEME_DIR . '/inc/template-tags.php';
require_once FINEST_THEME_DIR . '/inc/provisioning.php';
require_once FINEST_THEME_DIR . '/inc/contact-form.php';
