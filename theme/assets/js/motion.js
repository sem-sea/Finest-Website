/**
 * The Finest Impact — motion layer.
 *
 * Interaction/transition language adapted from verostudio.com (read from
 * their shipped CSS, not guessed): entrance reveals use clip-path "mask"
 * opens and staggered line reveals on power/expo easing, a thin scroll
 * progress line, and a smooth Lenis scroll synced to ScrollTrigger.
 *
 * This is a pure progressive-enhancement layer on top of ordinary Gutenberg
 * block content: it only ever adds `fi-reveal` / `fi-reveal-lines` classes
 * as motion hooks. Content is fully present and visible with JS off, with
 * prefers-reduced-motion, or if any of the vendored libraries fail to load
 * — `showFallback()` is only ever called on a failure/degraded path, never
 * after animations have actually been wired up (that would !important-
 * override the reveal states this script just set).
 */
(function () {
	'use strict';

	var root = document.documentElement;
	var reducedMotion =
		root.classList.contains( 'reduced-motion' ) ||
		( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );

	var fallbackShown = false;
	function showFallback() {
		if ( fallbackShown ) {
			return;
		}
		fallbackShown = true;
		root.classList.add( 'motion-fallback' );
	}
	// Last-resort safety net: if this script hangs or something unforeseen
	// never calls clearTimeout, content is never stuck invisible for long.
	var fallbackTimer = window.setTimeout( showFallback, 4000 );

	function ready( fn ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', fn );
		} else {
			fn();
		}
	}

	ready( function () {
		if ( reducedMotion ) {
			showFallback();
			return;
		}

		if ( typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined' ) {
			showFallback();
			return;
		}

		try {
			var gsap = window.gsap;
			gsap.registerPlugin( window.ScrollTrigger );

			// --- smooth scroll, synced to ScrollTrigger ---
			if ( window.Lenis ) {
				var lenis = new window.Lenis( {
					duration: 1.1,
					easing: function ( t ) {
						return 1 - Math.pow( 1 - t, 3 );
					},
					smoothWheel: true,
				} );
				lenis.on( 'scroll', window.ScrollTrigger.update );
				gsap.ticker.add( function ( time ) {
					lenis.raf( time * 1000 );
				} );
				gsap.ticker.lagSmoothing( 0 );
			}

			// --- staggered line reveal on headline moments ---
			var headlines = document.querySelectorAll( '.fi-reveal-lines' );
			if ( window.SplitText && headlines.length ) {
				gsap.registerPlugin( window.SplitText );
				headlines.forEach( function ( heading ) {
					var split = window.SplitText.create( heading, {
						type: 'lines',
						mask: 'lines',
						linesClass: 'fi-line',
					} );
					gsap.set( heading, { opacity: 1 } );
					gsap.set( split.lines, { yPercent: 110, opacity: 0 } );
					window.ScrollTrigger.create( {
						trigger: heading,
						start: 'top 85%',
						once: true,
						onEnter: function () {
							gsap.to( split.lines, {
								yPercent: 0,
								opacity: 1,
								duration: 1,
								ease: 'expo.out',
								stagger: 0.08,
							} );
						},
					} );
				} );
			} else if ( headlines.length ) {
				// SplitText failed to load independently of gsap/ScrollTrigger:
				// skip the line-by-line reveal, show the heading as-is.
				gsap.set( headlines, { opacity: 1 } );
			}

			// --- clip-path "mask" reveal on photography ---
			var photos = document.querySelectorAll( '.fi-reveal' );
			if ( photos.length ) {
				gsap.set( photos, {
					clipPath: 'inset(16% 16% 16% 16% round 2px)',
					scale: 1.06,
				} );
				window.ScrollTrigger.batch( photos, {
					start: 'top 88%',
					once: true,
					onEnter: function ( batch ) {
						gsap.to( batch, {
							clipPath: 'inset(0% 0% 0% 0% round 2px)',
							scale: 1,
							duration: 1.3,
							ease: 'power4.out',
							stagger: 0.12,
						} );
					},
				} );
			}

			// --- thin scroll-progress line (own element, zero markup cost) ---
			var bar = document.createElement( 'div' );
			bar.className = 'fi-scroll-progress';
			bar.setAttribute( 'aria-hidden', 'true' );
			document.body.appendChild( bar );
			gsap.set( bar, { scaleX: 0, transformOrigin: 'left center' } );
			gsap.to( bar, {
				scaleX: 1,
				ease: 'none',
				scrollTrigger: {
					trigger: document.documentElement,
					start: 'top top',
					end: 'max',
					scrub: 0.3,
				},
			} );

			// Success: every targeted element's visibility is now owned by
			// GSAP inline styles. Just cancel the safety net — do NOT call
			// showFallback() here, it would force-override the reveal states
			// above with !important and kill the animation for everyone.
			window.clearTimeout( fallbackTimer );
		} catch ( e ) {
			showFallback();
		}
	} );
} )();
