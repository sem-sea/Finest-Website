<?php
/**
 * Contact form: shortcode renders the form (with a real nonce, since this
 * runs as PHP at request time; post_content itself is never executed as
 * PHP by WordPress, so the nonce field cannot live in block markup
 * directly), and template_redirect handles the POST.
 *
 * Fase 11 checklist applied: nonce + honeypot, esc_html/esc_attr on every
 * echoed value, wp_mail() instead of a raw mail() call, no direct SQL.
 */

defined( 'ABSPATH' ) || exit;

function finest_contact_form_shortcode() {
	ob_start();
	$sent  = isset( $_GET['finest_contact'] ) && 'sent' === $_GET['finest_contact'];
	$error = isset( $_GET['finest_contact'] ) && 'error' === $_GET['finest_contact'];
	?>
	<?php if ( $sent ) : ?>
		<p class="finest-form-success"><?php esc_html_e( 'Bedankt voor je bericht. We nemen zo snel mogelijk contact op.', 'finest-impact' ); ?></p>
	<?php else : ?>
		<?php if ( $error ) : ?>
			<p class="finest-form-error"><?php esc_html_e( 'Er ging iets mis. Probeer het opnieuw of mail ons direct op info@thefinestimpact.com.', 'finest-impact' ); ?></p>
		<?php endif; ?>
		<form class="finest-contact-form" method="post" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<p>
				<label for="finest-name"><?php esc_html_e( 'Naam', 'finest-impact' ); ?></label><br>
				<input type="text" id="finest-name" name="finest_name" required>
			</p>
			<p>
				<label for="finest-email"><?php esc_html_e( 'E-mailadres', 'finest-impact' ); ?></label><br>
				<input type="email" id="finest-email" name="finest_email" required>
			</p>
			<p>
				<label for="finest-company"><?php esc_html_e( 'Bedrijfsnaam', 'finest-impact' ); ?></label><br>
				<input type="text" id="finest-company" name="finest_company">
			</p>
			<p>
				<label for="finest-message"><?php esc_html_e( 'Bericht', 'finest-impact' ); ?></label><br>
				<textarea id="finest-message" name="finest_message" rows="5" required></textarea>
			</p>
			<p class="finest-hp-field" aria-hidden="true" style="position:absolute;left:-9999px;">
				<label for="finest-website">Laat dit veld leeg</label>
				<input type="text" id="finest-website" name="finest_website" tabindex="-1" autocomplete="off">
			</p>
			<?php wp_nonce_field( 'finest_contact_form', 'finest_contact_nonce' ); ?>
			<input type="hidden" name="finest_contact_action" value="1">
			<button type="submit" class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Versturen', 'finest-impact' ); ?></button>
		</form>
	<?php endif; ?>
	<?php
	return ob_get_clean();
}
add_shortcode( 'finest_contact_form', 'finest_contact_form_shortcode' );

/**
 * Handle the POST before any output is sent, so we can redirect (POST →
 * redirect → GET) instead of re-submitting the form on refresh.
 */
function finest_handle_contact_submission() {
	if ( empty( $_POST['finest_contact_action'] ) ) {
		return;
	}

	if ( ! isset( $_POST['finest_contact_nonce'] ) ||
		! wp_verify_nonce( wp_unslash( $_POST['finest_contact_nonce'] ), 'finest_contact_form' ) ) {
		wp_safe_redirect( add_query_arg( 'finest_contact', 'error', wp_get_referer() ?: home_url( '/contact/' ) ) );
		exit;
	}

	// Honeypot: a real visitor never fills this hidden field.
	if ( ! empty( $_POST['finest_website'] ) ) {
		wp_safe_redirect( add_query_arg( 'finest_contact', 'sent', wp_get_referer() ?: home_url( '/contact/' ) ) );
		exit;
	}

	// Simple rate limit: one submission per IP per 60 seconds.
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
	$rate_key = 'finest_contact_rl_' . md5( $ip );
	if ( get_transient( $rate_key ) ) {
		wp_safe_redirect( add_query_arg( 'finest_contact', 'error', wp_get_referer() ?: home_url( '/contact/' ) ) );
		exit;
	}
	set_transient( $rate_key, 1, 60 );

	$name    = isset( $_POST['finest_name'] ) ? sanitize_text_field( wp_unslash( $_POST['finest_name'] ) ) : '';
	$email   = isset( $_POST['finest_email'] ) ? sanitize_email( wp_unslash( $_POST['finest_email'] ) ) : '';
	$company = isset( $_POST['finest_company'] ) ? sanitize_text_field( wp_unslash( $_POST['finest_company'] ) ) : '';
	$message = isset( $_POST['finest_message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['finest_message'] ) ) : '';

	if ( ! $name || ! is_email( $email ) || ! $message ) {
		wp_safe_redirect( add_query_arg( 'finest_contact', 'error', wp_get_referer() ?: home_url( '/contact/' ) ) );
		exit;
	}

	$to      = 'info@thefinestimpact.com';
	$subject = sprintf( '[Website] Kennismaking aangevraagd door %s', $name );
	$body    = "Naam: {$name}\nE-mail: {$email}\nBedrijf: {$company}\n\nBericht:\n{$message}";
	$headers = array( 'Reply-To: ' . $name . ' <' . $email . '>' );

	$sent_ok = wp_mail( $to, $subject, $body, $headers );

	wp_safe_redirect( add_query_arg( 'finest_contact', $sent_ok ? 'sent' : 'error', wp_get_referer() ?: home_url( '/contact/' ) ) );
	exit;
}
add_action( 'template_redirect', 'finest_handle_contact_submission' );
