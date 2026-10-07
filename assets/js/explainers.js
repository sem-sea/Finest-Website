/**
 * The Finest Impact — scroll-driven canvas companion diagrams.
 * Each .explainer-canvas sits beside its paragraph (never replacing copy)
 * and draws progressively as that section scrolls through view. No
 * external deps beyond GSAP/ScrollTrigger (already vendored in motion.js).
 * Respects prefers-reduced-motion (renders the end state, no animation).
 */
(function () {
	'use strict';

	function ready( fn ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', fn );
		} else {
			fn();
		}
	}

	var EASE = {
		out3: function ( t ) { return 1 - Math.pow( 1 - t, 3 ); },
		inOut: function ( t ) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow( -2 * t + 2, 3 ) / 2; },
		out2: function ( t ) { return 1 - ( 1 - t ) * ( 1 - t ); },
	};
	function clamp( v, a, b ) { return Math.max( a, Math.min( b, v ) ); }
	function lerp( a, b, t ) { return a + ( b - a ) * t; }
	// progress of one "beat" out of n total beats, each beat spanning 1/n of the overall 0..1 scene progress
	function beat( p, i, n, overlap ) {
		overlap = overlap || 0.35;
		var span = 1 / n, start = i * span * ( 1 - overlap ), end = start + span * ( 1 + overlap * ( n - 1 ) );
		return clamp( ( p - start ) / Math.max( 0.0001, end - start ), 0, 1 );
	}

	function roundRect( ctx, x, y, w, h, r ) {
		ctx.beginPath();
		ctx.moveTo( x + r, y );
		ctx.arcTo( x + w, y, x + w, y + h, r );
		ctx.arcTo( x + w, y + h, x, y + h, r );
		ctx.arcTo( x, y + h, x, y, r );
		ctx.arcTo( x, y, x + w, y, r );
		ctx.closePath();
	}

	function label( ctx, text, x, y, opts ) {
		opts = opts || {};
		ctx.save();
		ctx.globalAlpha *= opts.alpha != null ? opts.alpha : 1;
		ctx.font = ( opts.weight || 500 ) + ' ' + ( opts.size || 13 ) + 'px "Jost", sans-serif';
		ctx.fillStyle = opts.color || '#000';
		ctx.textAlign = opts.align || 'center';
		ctx.textBaseline = opts.baseline || 'middle';
		if ( opts.tracking ) {
			var chars = text.split( '' ), total = 0;
			ctx.save();
			chars.forEach( function ( c ) { total += ctx.measureText( c ).width + opts.tracking; } );
			total -= opts.tracking;
			var startX = opts.align === 'left' ? x : opts.align === 'right' ? x - total : x - total / 2;
			var cx = startX;
			chars.forEach( function ( c ) {
				ctx.textAlign = 'left';
				ctx.fillText( c, cx, y );
				cx += ctx.measureText( c ).width + opts.tracking;
			} );
			ctx.restore();
		} else {
			ctx.fillText( text, x, y );
		}
		ctx.restore();
	}

	/* ---------------------------------------------------------------- */
	/* Fig: a canvas bound to a progress value (0..1), DPR-aware, resize-safe */
	function Fig( el, scene ) {
		this.el = el;
		this.scene = scene;
		this.canvas = el.querySelector( 'canvas' );
		this.ctx = this.canvas.getContext( '2d' );
		this.p = 0;
		this.ambientT = 0;
		this.raf = 0;
		this.visible = false;
		this.layout();
		var self = this;
		new ResizeObserver( function () { self.layout(); } ).observe( this.el );
		new IntersectionObserver( function ( es ) {
			es.forEach( function ( e ) {
				self.visible = e.isIntersecting;
				if ( self.visible ) { self.el.classList.add( 'in' ); self.startAmbient(); }
			} );
		}, { threshold: 0.05 } ).observe( this.canvas );
	}
	Fig.prototype.layout = function () {
		var w = this.el.clientWidth || 320;
		var h = Math.round( w * ( this.scene.designH / this.scene.designW ) );
		var dpr = Math.min( 2, window.devicePixelRatio || 1 );
		this.canvas.style.width = w + 'px';
		this.canvas.style.height = h + 'px';
		this.canvas.width = Math.round( w * dpr );
		this.canvas.height = Math.round( h * dpr );
		this.ctx.setTransform( dpr * ( w / this.scene.designW ), 0, 0, dpr * ( w / this.scene.designW ), 0, 0 );
		this.w = w; this.h = h;
		this.render();
	};
	Fig.prototype.setProgress = function ( p ) {
		this.p = p;
		this.render();
	};
	Fig.prototype.render = function () {
		var ctx = this.ctx, S = this.scene;
		ctx.clearRect( 0, 0, S.designW, S.designH );
		S.draw( ctx, this.p, this.ambientT, { clamp: clamp, lerp: lerp, beat: beat, ease: EASE, roundRect: roundRect, label: label, W: S.designW, H: S.designH } );
	};
	Fig.prototype.startAmbient = function () {
		if ( this.raf || window.__FI_REDUCED ) return;
		var self = this, last = performance.now();
		var tick = function ( now ) {
			self.raf = 0;
			var dt = ( now - last ) / 1000; last = now;
			if ( self.p >= 0.98 && self.scene.ambient ) {
				self.ambientT += dt;
				self.render();
			}
			if ( self.visible ) self.raf = requestAnimationFrame( tick );
		};
		this.raf = requestAnimationFrame( tick );
	};

	/* ---------------------------------------------------------------- */
	/* Scene: pulse — intro stats ("meer zichtbaarheid / continuïteit / impact") */
	var sceneStats = {
		designW: 480, designH: 360, ambient: true,
		draw: function ( ctx, p, t, h ) {
			var cx = h.W / 2, cy = h.H / 2 - 14;
			var words = [ 'Zichtbaarheid', 'Continuïteit', 'Impact' ];
			var radii = [ 58, 92, 126 ];
			for ( var i = 0; i < 3; i++ ) {
				var bp = h.beat( p, i, 3, 0.5 );
				var e = h.ease.out3( bp );
				if ( e <= 0 ) continue;
				var r = radii[ i ] * h.ease.out2( Math.min( 1, e * 1.3 ) );
				var pulse = 1 + ( t ? Math.sin( t * 1.1 + i * 1.7 ) * 0.01 : 0 );
				ctx.save();
				ctx.globalAlpha = Math.min( 1, e * 1.4 );
				ctx.strokeStyle = i === 1 ? '#DCCDBC' : '#000000';
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.arc( cx, cy, r * pulse, 0, Math.PI * 2 );
				ctx.stroke();
				ctx.restore();
				if ( e > 0.55 ) {
					var lp = h.clamp( ( e - 0.55 ) / 0.45, 0, 1 );
					var ang = -Math.PI / 2 + i * 0.05;
					var lx = cx + Math.cos( ang ) * r, ly = cy + Math.sin( ang ) * r;
					h.label( ctx, words[ i ], lx, ly - 10, { color: '#000', size: 13, weight: 400, alpha: lp, tracking: 0.3 } );
				}
			}
			ctx.save();
			var dotA = h.clamp( p * 2, 0, 1 );
			ctx.globalAlpha = dotA;
			ctx.fillStyle = '#000';
			ctx.beginPath(); ctx.arc( cx, cy, 4, 0, Math.PI * 2 ); ctx.fill();
			ctx.restore();
		},
	};

	/* ---------------------------------------------------------------- */
	/* Scene: mess-to-order — problem section (dark bg, light strokes) */
	var sceneMess = {
		designW: 480, designH: 320, ambient: false,
		items: [
			{ label: 'Collectie' }, { label: 'Social' }, { label: 'Nieuwsbrief' },
			{ label: 'Campagne' }, { label: 'Klant' }, { label: 'Vindbaarheid' },
		],
		seeds: [ 0.12, 0.83, 0.3, 0.68, 0.55, 0.05 ],
		draw: function ( ctx, p, t, h ) {
			var n = this.items.length, gridY = h.H / 2 + 6;
			var gridGap = h.W / ( n + 1 );
			for ( var i = 0; i < n; i++ ) {
				var seed = this.seeds[ i ];
				var rx0 = h.W * ( 0.08 + seed * 0.84 );
				var ry0 = h.H * ( 0.18 + ( ( seed * 7 ) % 1 ) * 0.64 );
				var rot0 = ( seed - 0.5 ) * 0.9;
				var e = h.ease.inOut( h.clamp( ( p - i * 0.02 ) / 0.8, 0, 1 ) );
				var x = h.lerp( rx0, gridGap * ( i + 1 ), e );
				var y = h.lerp( ry0, gridY, e );
				var rot = h.lerp( rot0, 0, e );
				var size = 34;
				ctx.save();
				ctx.translate( x, y );
				ctx.rotate( rot );
				ctx.globalAlpha = 0.95;
				ctx.strokeStyle = '#F7F3EE';
				ctx.lineWidth = 1.3;
				h.roundRect( ctx, -size / 2, -size / 2, size, size, 6 );
				ctx.stroke();
				ctx.restore();
				h.label( ctx, this.items[ i ].label, x, y + size / 2 + 16, { color: '#F7F3EE', size: 10.5, weight: 400, alpha: 0.55 + 0.45 * e, tracking: 0.15 } );
			}
			if ( p > 0.85 ) {
				var la = h.clamp( ( p - 0.85 ) / 0.15, 0, 1 );
				ctx.save();
				ctx.globalAlpha = la * 0.5;
				ctx.strokeStyle = '#DCCDBC';
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo( gridGap * 0.6, gridY );
				ctx.lineTo( gridGap * ( n + 0.4 ), gridY );
				ctx.stroke();
				ctx.restore();
			}
		},
	};

	/* ---------------------------------------------------------------- */
	/* Scene: hub & spoke — "Wat is The Finest Impact?" (the centerpiece) */
	var sceneHub = {
		designW: 520, designH: 460, ambient: true,
		nodes: [
			{ label: 'Strategie', a: -95 }, { label: 'Content', a: -35 }, { label: 'Social', a: 25 },
			{ label: 'E-mail', a: 85 }, { label: 'Vindbaarheid', a: 145 }, { label: 'Analyse', a: -155 },
		],
		draw: function ( ctx, p, t, h ) {
			var cx = h.W / 2, cy = h.H / 2 - 24, rCore = 30, rNode = 150;
			var n = this.nodes.length;
			var convergeP = h.beat( p, n, n + 1, 0.6 );
			for ( var i = 0; i < n; i++ ) {
				var node = this.nodes[ i ];
				var bp = h.beat( p, i, n, 0.55 );
				var e = h.ease.out3( bp );
				if ( e <= 0 ) continue;
				var ang = ( node.a * Math.PI ) / 180;
				var ex = cx + Math.cos( ang ) * rNode, ey = cy + Math.sin( ang ) * rNode;
				var drift = convergeP * 0.5;
				var tx = h.lerp( ex, cx + Math.cos( ang ) * rNode * 0.78, drift );
				var ty = h.lerp( ey, cy + Math.sin( ang ) * rNode * 0.78, drift );
				var lineLen = h.clamp( e * 1.25, 0, 1 );
				var midx = h.lerp( cx, tx, lineLen ), midy = h.lerp( cy, ty, lineLen );
				ctx.save();
				ctx.globalAlpha = Math.min( 1, e * 1.5 ) * ( 1 - drift * 0.15 );
				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1.1;
				ctx.beginPath();
				ctx.moveTo( cx, cy );
				ctx.lineTo( midx, midy );
				ctx.stroke();
				ctx.restore();
				if ( e > 0.5 ) {
					var ne = h.clamp( ( e - 0.5 ) / 0.5, 0, 1 );
					var amb = this.ambient && t ? Math.sin( t * 0.8 + i ) * 1.5 : 0;
					ctx.save();
					ctx.globalAlpha = ne;
					ctx.fillStyle = '#F7F3EE';
					ctx.strokeStyle = '#000';
					ctx.lineWidth = 1.1;
					ctx.beginPath();
					ctx.arc( tx, ty + amb, 20, 0, Math.PI * 2 );
					ctx.fill(); ctx.stroke();
					ctx.restore();
					h.label( ctx, node.label, tx, ty + amb + 34, { color: '#000', size: 11.5, weight: 400, alpha: ne, tracking: 0.1 } );
				}
			}
			var coreE = h.ease.out3( h.clamp( p * 3, 0, 1 ) );
			ctx.save();
			ctx.globalAlpha = coreE;
			ctx.fillStyle = '#000';
			ctx.beginPath(); ctx.arc( cx, cy, rCore * coreE, 0, Math.PI * 2 ); ctx.fill();
			ctx.restore();
			if ( coreE > 0.6 ) {
				h.label( ctx, 'Jouw merk', cx, cy, { color: '#F7F3EE', size: 11, weight: 500, alpha: coreE, tracking: 0.05 } );
			}
			if ( convergeP > 0.05 ) {
				h.label( ctx, 'Eén marketinglijn', cx, cy + rCore + 34, { color: '#000', size: 12.5, weight: 500, alpha: convergeP, tracking: 0.12 } );
				ctx.save();
				ctx.globalAlpha = convergeP * 0.8;
				ctx.strokeStyle = '#DCCDBC';
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.moveTo( cx, cy + rCore + 6 );
				ctx.lineTo( cx, cy + rCore + 20 );
				ctx.stroke();
				ctx.restore();
			}
		},
	};

	/* ---------------------------------------------------------------- */
	/* Scene: balance — "Speciaal voor opticiens" (mens bepaalt, AI voert uit) */
	var sceneBalance = {
		designW: 480, designH: 300, ambient: true,
		draw: function ( ctx, p, t, h ) {
			var cy = h.H / 2 - 10, leftX = h.W * 0.26, rightX = h.W * 0.74;
			var e = h.ease.out3( h.clamp( p * 1.6, 0, 1 ) );
			ctx.save();
			ctx.globalAlpha = e;
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 1.2;
			ctx.beginPath(); ctx.moveTo( leftX, cy ); ctx.lineTo( rightX, cy ); ctx.stroke();
			ctx.restore();
			[ [ leftX, 'Jij', '#000' ], [ rightX, 'AI', '#DCCDBC' ] ].forEach( function ( node, idx ) {
				var ne = h.ease.out3( h.clamp( ( p - idx * 0.12 ) * 1.6, 0, 1 ) );
				if ( ne <= 0 ) return;
				ctx.save();
				ctx.globalAlpha = ne;
				ctx.fillStyle = node[ 2 ];
				ctx.beginPath(); ctx.arc( node[ 0 ], cy, 26, 0, Math.PI * 2 ); ctx.fill();
				ctx.restore();
				h.label( ctx, node[ 1 ], node[ 0 ], cy, { color: idx === 0 ? '#F7F3EE' : '#000', size: 13, weight: 500, alpha: ne } );
			} );
			if ( p > 0.35 && this.ambient ) {
				var flowP = h.clamp( ( p - 0.35 ) / 0.2, 0, 1 );
				var cycle = t ? ( t * 0.35 ) % 1 : 0;
				for ( var k = 0; k < 3; k++ ) {
					var fp = ( cycle + k / 3 ) % 1;
					var fx = h.lerp( leftX + 28, rightX - 28, fp );
					ctx.save();
					ctx.globalAlpha = flowP * ( 0.3 + 0.4 * Math.sin( fp * Math.PI ) );
					ctx.fillStyle = '#000';
					ctx.beginPath(); ctx.arc( fx, cy, 2.4, 0, Math.PI * 2 ); ctx.fill();
					ctx.restore();
				}
			}
			if ( p > 0.55 ) {
				var la = h.clamp( ( p - 0.55 ) / 0.3, 0, 1 );
				h.label( ctx, 'Mens bepaalt de richting.', h.W / 2, cy + 58, { color: '#000', size: 12, weight: 400, alpha: la } );
				h.label( ctx, 'AI vergroot je capaciteit.', h.W / 2, cy + 76, { color: '#000', size: 12, weight: 400, alpha: la } );
			}
		},
	};

	/* ---------------------------------------------------------------- */
	ready( function () {
		var REDUCED = document.documentElement.classList.contains( 'reduced-motion' ) ||
			( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
		window.__FI_REDUCED = REDUCED;

		var scenes = { stats: sceneStats, mess: sceneMess, hub: sceneHub, balance: sceneBalance };
		var blocks = document.querySelectorAll( '.explainer-canvas[data-scene]' );
		if ( ! blocks.length ) return;

		blocks.forEach( function ( el ) {
			var scene = scenes[ el.dataset.scene ];
			if ( ! scene ) return;
			var fig = new Fig( el, scene );
			if ( REDUCED || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined' ) {
				fig.setProgress( 1 );
				return;
			}
			var grid = el.closest( '.explainer-grid' ) || el.parentElement;
			var mm = window.gsap.matchMedia();
			// Desktop: the canvas is sticky, so it stays on screen for the whole
			// time its paired text is being read — tie progress to the full grid.
			mm.add( '(min-width: 900px)', function () {
				var st = window.ScrollTrigger.create( {
					trigger: grid,
					start: 'top bottom',
					end: 'bottom 60%',
					scrub: 0.4,
					onUpdate: function ( self ) { fig.setProgress( self.progress ); },
				} );
				return function () { st.kill(); };
			} );
			// Mobile: the canvas is NOT sticky — it scrolls off screen quickly if
			// tied to the (much taller) text block below it. Tie progress tightly
			// to the canvas's own short transit through the viewport instead, so
			// the full drawing completes while it's actually visible.
			mm.add( '(max-width: 899px)', function () {
				var st = window.ScrollTrigger.create( {
					trigger: el,
					start: 'top 92%',
					end: 'bottom 55%',
					scrub: true,
					onUpdate: function ( self ) { fig.setProgress( self.progress ); },
				} );
				return function () { st.kill(); };
			} );
		} );
	} );
} )();
