/**
 * Mobile nav toggle + contact form mock. Deliberately independent of
 * motion.js/GSAP — navigation must work even if the motion layer fails.
 */
(function () {
	'use strict';

	var root = document.documentElement;
	if ( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		root.classList.add( 'reduced-motion' );
	} else {
		root.classList.add( 'js-motion' );
	}

	function ready( fn ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', fn );
		} else {
			fn();
		}
	}

	ready( function () {
		var toggle = document.querySelector( '.nav-toggle' );
		var overlay = document.querySelector( '.nav-overlay' );
		if ( toggle && overlay ) {
			toggle.addEventListener( 'click', function () {
				var open = root.classList.toggle( 'nav-open' );
				toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			} );
			overlay.querySelectorAll( 'a' ).forEach( function ( a ) {
				a.addEventListener( 'click', function () {
					root.classList.remove( 'nav-open' );
				} );
			} );
		}

		var form = document.getElementById( 'contact-form' );
		var note = document.getElementById( 'cf-note' );
		if ( form && note ) {
			form.addEventListener( 'submit', function ( ev ) {
				ev.preventDefault();
				note.classList.add( 'show' );
			} );
		}
	} );
} )();
