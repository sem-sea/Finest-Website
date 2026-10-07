/**
 * The Finest Impact — demo motion layer (same engine as the WordPress
 * theme's assets/js/motion.js). Progressive enhancement: content is fully
 * visible with JS off, under prefers-reduced-motion, or if any vendored
 * file fails to load — see showFallback().
 */
(function () {
	'use strict';

	var root = document.documentElement;
	var reducedMotion =
		root.classList.contains( 'reduced-motion' ) ||
		( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );

	var fallbackShown = false;
	function showFallback() {
		if ( fallbackShown ) return;
		fallbackShown = true;
		root.classList.add( 'motion-fallback' );
	}
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

			if ( window.Lenis ) {
				var lenis = new window.Lenis( {
					duration: 1.1,
					easing: function ( t ) { return 1 - Math.pow( 1 - t, 3 ); },
					smoothWheel: true,
				} );
				lenis.on( 'scroll', window.ScrollTrigger.update );
				gsap.ticker.add( function ( time ) { lenis.raf( time * 1000 ); } );
				gsap.ticker.lagSmoothing( 0 );
			}

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
				gsap.set( headlines, { opacity: 1 } );
			}

			var photos = document.querySelectorAll( '.fi-reveal' );
			if ( photos.length ) {
				gsap.set( photos, { clipPath: 'inset(16% 16% 16% 16% round 2px)', scale: 1.06 } );
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

			var storiesTrack = document.querySelector( '.stories-track' );
			if ( storiesTrack ) {
				var cards = storiesTrack.querySelectorAll( '.story-card' );
				var dots = document.querySelectorAll( '.stories-progress span' );
				var mm = gsap.matchMedia();

				mm.add( '(min-width: 900px)', function () {
					root.classList.add( 'stories-pinned' );
					var trackWidth = storiesTrack.scrollWidth - storiesTrack.parentElement.offsetWidth;
					var pinTl = gsap.to( storiesTrack, {
						x: -trackWidth,
						ease: 'none',
						scrollTrigger: {
							trigger: '.stories-pin',
							start: 'top top+=80',
							end: function () { return '+=' + ( trackWidth + 400 ); },
							pin: true,
							scrub: 0.6,
							invalidateOnRefresh: true,
							onUpdate: function ( self ) {
								if ( ! dots.length ) return;
								var idx = Math.min( cards.length - 1, Math.floor( self.progress * cards.length ) );
								dots.forEach( function ( d, i ) {
									d.classList.toggle( 'is-active', i <= idx );
								} );
							},
						},
					} );
					return function () {
						root.classList.remove( 'stories-pinned' );
						pinTl.scrollTrigger && pinTl.scrollTrigger.kill();
						gsap.set( storiesTrack, { clearProps: 'transform' } );
					};
				} );

				gsap.set( cards, { opacity: 0, y: 24 } );
				window.ScrollTrigger.batch( cards, {
					start: 'top 90%',
					once: true,
					onEnter: function ( batch ) {
						gsap.to( batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 } );
					},
				} );

				if ( ! window.matchMedia( '(min-width: 900px)' ).matches && dots.length ) {
					storiesTrack.addEventListener( 'scroll', function () {
						var ratio = storiesTrack.scrollLeft / ( storiesTrack.scrollWidth - storiesTrack.clientWidth || 1 );
						var idx = Math.min( cards.length - 1, Math.round( ratio * ( cards.length - 1 ) ) );
						dots.forEach( function ( d, i ) { d.classList.toggle( 'is-active', i <= idx ); } );
					}, { passive: true } );
				}
			}

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

			window.clearTimeout( fallbackTimer );
		} catch ( e ) {
			showFallback();
		}
	} );
} )();
