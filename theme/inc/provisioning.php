<?php
/**
 * "1-zip" auto-provisioning: activating this theme builds the full site
 * (pages, permalinks, taxonomy terms) with no manual setup.
 *
 * Every lesson from the case-study table in the WordPress Build Blueprint is
 * applied here on purpose:
 *  - ensure_page() uses get_posts(['post_parent'=>...]), never
 *    get_page_by_path(), so it finds child pages on a second run instead of
 *    creating "-2" duplicates.
 *  - The "done" flag is set from both the activation hook and the
 *    admin_init safety net, so a plugin activated after the theme doesn't
 *    leave provisioning permanently un-flagged.
 *  - permalink_structure is set (and rewrite rules flushed) on activation,
 *    or every internal link silently falls back to the homepage.
 *  - Custom taxonomy registration happens on init, and all provisioning
 *    that touches it runs on/after admin_init (after_switch_theme fires
 *    post-init in a real switch_theme() request); never on plugins_loaded.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register the "Nieuws" category taxonomy used by native posts (The Finest
 * News uses core `post`, not a custom post type, so it gets archives/RSS/
 * categories for free; see functions.php comment).
 */
function finest_register_taxonomies() {
	register_taxonomy(
		'nieuws_categorie',
		'post',
		array(
			'labels' => array(
				'name'          => __( 'Nieuws categorieën', 'finest-impact' ),
				'singular_name' => __( 'Nieuws categorie', 'finest-impact' ),
			),
			'hierarchical'      => true,
			'public'            => true,
			'show_in_rest'      => true,
			'rewrite'           => array( 'slug' => 'nieuws-categorie' ),
		)
	);
}
add_action( 'init', 'finest_register_taxonomies' );

/**
 * Klantverhalen (client stories) as their own post type, separate from
 * Nieuws so the two "vogue.nl-style" sections (Fase 1 briefing) don't mix
 * in one archive/category list.
 */
function finest_register_post_types() {
	register_post_type( 'klantverhaal', array(
		'labels' => array(
			'name'          => __( 'Klantverhalen', 'finest-impact' ),
			'singular_name' => __( 'Klantverhaal', 'finest-impact' ),
			'add_new_item'  => __( 'Nieuw klantverhaal toevoegen', 'finest-impact' ),
		),
		'public'       => true,
		// No native archive: the /klantverhalen/ page below (with its own
		// embedded wp:query block) IS the landing page for this post type.
		// A has_archive route at the same slug would silently win over that
		// page's rewrite rule and serve WP's bare archive template instead
		// of the real, editable page content (caught in clean-room testing:
		// the page provisioned fine, but /klantverhalen/ rendered "Archives:
		// Klantverhalen" from archive.html, not finest_klantverhalen_intro_content()).
		'has_archive'  => false,
		'rewrite'      => array( 'slug' => 'klantverhalen' ),
		'show_in_rest' => true,
		'menu_icon'    => 'dashicons-format-quote',
		'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
		'template'     => array(
			array( 'core/paragraph', array( 'placeholder' => 'Korte samenvatting van het klantverhaal…' ) ),
		),
	) );
}
add_action( 'init', 'finest_register_post_types' );

/**
 * Create a page if (and only if) it doesn't already exist at this exact
 * parent; safe to call on every activation.
 *
 * @param string $slug
 * @param string $title
 * @param string $content   Full block markup for post_content.
 * @param int    $parent_id
 * @param string $template  Optional "Template Name" block template slug.
 * @return int Post ID.
 */
function finest_ensure_page( $slug, $title, $content = '', $parent_id = 0, $template = '' ) {
	$existing = get_posts( array(
		'name'           => $slug,
		'post_type'      => 'page',
		'post_status'    => 'any',
		'post_parent'    => $parent_id,
		'posts_per_page' => 1,
	) );

	if ( ! empty( $existing ) ) {
		return $existing[0]->ID;
	}

	$page_id = wp_insert_post( array(
		'post_title'   => $title,
		'post_name'    => $slug,
		'post_status'  => 'publish',
		'post_type'    => 'page',
		'post_parent'  => $parent_id,
		'post_content' => $content,
	) );

	if ( $template && ! is_wp_error( $page_id ) ) {
		update_post_meta( $page_id, '_wp_page_template', $template );
	}

	return is_wp_error( $page_id ) ? 0 : $page_id;
}

/**
 * Create a term if it doesn't already exist. Idempotent like ensure_page().
 */
function finest_ensure_term( $name, $taxonomy, $parent_id = 0 ) {
	$existing = get_term_by( 'name', $name, $taxonomy );
	if ( $existing ) {
		return $existing->term_id;
	}
	$result = wp_insert_term( $name, $taxonomy, array( 'parent' => $parent_id ) );
	return is_wp_error( $result ) ? 0 : $result['term_id'];
}

/**
 * Sideload a theme asset photo into the media library as a real attachment,
 * once, so it is a normal, editable/replaceable WordPress image (not a
 * hardcoded theme-relative path baked into post_content). Idempotent: looks
 * up by exact attachment title before copying anything.
 *
 * @param string $filename Filename under /assets/img/photography/.
 * @param string $title    Attachment title (also used as the lookup key and
 *                          the default alt text).
 * @return int Attachment ID, or 0 if the source file is missing or the
 *             upload failed.
 */
function finest_ensure_photo( $filename, $title ) {
	$existing = get_posts( array(
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'title'          => $title,
		'posts_per_page' => 1,
	) );
	if ( ! empty( $existing ) ) {
		return $existing[0]->ID;
	}

	$source_path = FINEST_THEME_DIR . '/assets/img/photography/' . $filename;
	if ( ! file_exists( $source_path ) ) {
		return 0;
	}

	$filetype = wp_check_filetype( $filename, null );
	$upload   = wp_upload_bits( $filename, null, file_get_contents( $source_path ) );
	if ( ! empty( $upload['error'] ) ) {
		return 0;
	}

	$attachment_id = wp_insert_attachment( array(
		'post_mime_type' => $filetype['type'],
		'post_title'     => $title,
		'post_status'    => 'inherit',
	), $upload['file'] );

	if ( is_wp_error( $attachment_id ) || ! $attachment_id ) {
		return 0;
	}

	require_once ABSPATH . 'wp-admin/includes/image.php';
	$metadata = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
	wp_update_attachment_metadata( $attachment_id, $metadata );
	update_post_meta( $attachment_id, '_wp_attachment_image_alt', $title );

	return $attachment_id;
}

/**
 * The actual provisioning run: pages, terms, front-page setting.
 * Safe to call more than once: every step is idempotent.
 */
function finest_provision_content() {
	require_once FINEST_THEME_DIR . '/inc/content-pages.php';

	// Nieuws categories from the briefing.
	$nieuws_categorieen = array(
		'Brands & People',
		'Industrie news',
		'Retail & store concepts',
		'Trends & innovatie',
		'Events & fairs',
		'Marketing',
		'Internationaal news',
	);
	foreach ( $nieuws_categorieen as $cat ) {
		finest_ensure_term( $cat, 'nieuws_categorie' );
	}

	// Every one of these pages opens with its own manually-authored <h1> in
	// post_content (so the hero styling/fi-reveal-lines treatment can differ
	// per page), so every one of them needs the 'page-onepager' template —
	// the default 'page' template also renders wp:post-title, which without
	// this produces two <h1> tags on the same page (caught in clean-room
	// testing: algemene-voorwaarden and privacyverklaring were shipping with
	// a duplicate heading).
	$home_id = finest_ensure_page( 'home', 'Home', finest_home_page_content(), 0, 'page-onepager' );
	finest_ensure_page( 'over-ons', 'Over ons', finest_over_ons_page_content(), 0, 'page-onepager' );
	finest_ensure_page( 'diensten', 'Diensten', finest_diensten_page_content(), 0, 'page-onepager' );
	finest_ensure_page( 'contact', 'Contact', finest_contact_page_content(), 0, 'page-onepager' );
	finest_ensure_page( 'algemene-voorwaarden', 'Algemene Voorwaarden', finest_algemene_voorwaarden_content(), 0, 'page-onepager' );
	finest_ensure_page( 'privacyverklaring', 'Privacyverklaring', finest_privacyverklaring_content(), 0, 'page-onepager' );
	finest_ensure_page( 'klantverhalen', 'Klantverhalen', finest_klantverhalen_intro_content(), 0, 'page-onepager' );
	finest_ensure_page( 'nieuws', 'The Finest News', finest_nieuws_intro_content(), 0, 'page-onepager' );

	// Homepage is a real page (so it's editable like any other page), set
	// as the static front page rather than left as the latest-posts default.
	if ( $home_id ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
	}

	// Deliberately NOT setting page_for_posts to the nieuws page: WordPress
	// treats a "Posts page" specially and renders the blog index in its
	// place, discarding that page's own post_content entirely. The nieuws
	// page already embeds its own wp:query block (postType "post", same
	// posts, same category support), so it gets the listing it needs while
	// staying a normal, fully-editable page like every other one here
	// (caught in clean-room testing: with page_for_posts set, visiting
	// /nieuws/ silently skipped finest_nieuws_intro_content() entirely).

	finest_ensure_primary_menu();
}

/**
 * Build the primary nav menu from the provisioned pages, only if a menu
 * isn't already assigned (avoids clobbering manual edits on re-activation).
 */
function finest_ensure_primary_menu() {
	if ( has_nav_menu( 'primary' ) ) {
		return;
	}

	$menu_name = 'Hoofdmenu';
	$menu_id   = wp_get_nav_menu_object( $menu_name );
	if ( ! $menu_id ) {
		$menu_id = wp_create_nav_menu( $menu_name );
	} else {
		$menu_id = $menu_id->term_id;
	}

	$items = array(
		'diensten'     => 'Diensten',
		'over-ons'     => 'Over ons',
		'klantverhalen' => 'Klantverhalen',
		'nieuws'       => 'Nieuws',
		'contact'      => 'Contact',
	);

	foreach ( $items as $slug => $label ) {
		$page = get_page_by_path( $slug );
		if ( ! $page ) {
			continue;
		}
		$existing_items = wp_get_nav_menu_items( $menu_id );
		$already_there  = false;
		if ( $existing_items ) {
			foreach ( $existing_items as $item ) {
				if ( (int) $item->object_id === $page->ID ) {
					$already_there = true;
					break;
				}
			}
		}
		if ( ! $already_there ) {
			wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-title'     => $label,
				'menu-item-object'    => 'page',
				'menu-item-object-id' => $page->ID,
				'menu-item-type'      => 'post_type',
				'menu-item-status'    => 'publish',
			) );
		}
	}

	set_theme_mod( 'nav_menu_locations', array_merge(
		(array) get_theme_mod( 'nav_menu_locations', array() ),
		array( 'primary' => $menu_id )
	) );
}

/**
 * Runs on theme activation. Permalinks are fixed here too: a fresh WP
 * install defaults to plain "?p=123" links, which silently sends every
 * pretty internal link ("/over-ons/") back to the homepage instead of
 * a 404 (Fase 5's single most important gotcha).
 */
function finest_on_activation() {
	finest_provision_content();

	if ( ! get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
	}

	update_option( 'finest_content_provisioned', '1' );
	flush_rewrite_rules();
}
add_action( 'after_switch_theme', 'finest_on_activation' );

/**
 * Safety net: if some other activation order left provisioning unflagged
 * (e.g. a dependent plugin activated after the theme), run it once from
 * the admin. Never runs before init, so custom taxonomies are already
 * registered by the time this touches them.
 */
function finest_provision_content_once() {
	if ( get_option( 'finest_content_provisioned' ) ) {
		return;
	}
	finest_provision_content();
	update_option( 'finest_content_provisioned', '1' );
}
add_action( 'admin_init', 'finest_provision_content_once' );
