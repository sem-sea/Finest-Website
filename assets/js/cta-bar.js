/* Contact bar: show after the first screen, step aside over the footer.
   Without JS the bar is simply always visible. */
(function () {
	var bar = document.getElementById('finest-cta-bar');
	if (!bar || !('IntersectionObserver' in window)) { return; }
	var root = document.documentElement, past = false, atFooter = false;
	root.classList.add('js-cta');
	function apply() {
		var show = past && !atFooter;
		bar.classList.toggle('is-visible', show);
		root.classList.toggle('has-cta-bar', show);
	}
	function onScroll() {
		var p = (window.pageYOffset || root.scrollTop) > window.innerHeight * 0.6;
		if (p !== past) { past = p; apply(); }
	}
	var footer = document.querySelector('.site-footer');
	if (footer) {
		new IntersectionObserver(function (e) { atFooter = e[0].isIntersecting; apply(); }).observe(footer);
	}
	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();
})();
