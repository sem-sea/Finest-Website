/* Demo contact form: same states and markup contract as the WordPress form
   (form[data-status] = init | submitting | invalid | sent), but nothing is
   posted anywhere. After "sending" it says so and offers mail/WhatsApp. */
(function () {
	'use strict';
	var form = document.getElementById('contact-form');
	if (!form) { return; }

	var out = form.querySelector('.wpcf7-response-output');
	var fields = {
		name: form.querySelector('#tfi-name'),
		email: form.querySelector('#tfi-email'),
		message: form.querySelector('#tfi-message'),
		consent: form.querySelector('#tfi-consent')
	};

	function clearErrors() {
		form.querySelectorAll('.wpcf7-not-valid-tip').forEach(function (t) { t.remove(); });
		form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
			el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); el.classList.remove('wpcf7-not-valid');
		});
	}
	function flag(el, text, id) {
		var tip = document.createElement('span');
		tip.className = 'wpcf7-not-valid-tip'; tip.id = id; tip.textContent = text;
		el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', id); el.classList.add('wpcf7-not-valid');
		var wrap = el.closest('.wpcf7-form-control-wrap') || el.parentNode;
		wrap.appendChild(tip);
	}
	function focusEl(el) {
		if (!el) { return; }
		if (!el.hasAttribute('tabindex') && !/^(INPUT|TEXTAREA|BUTTON|A)$/.test(el.tagName)) { el.setAttribute('tabindex', '-1'); }
		el.focus();
	}

	function validate() {
		clearErrors();
		var bad = [];
		if (!fields.name.value.trim()) { flag(fields.name, 'Dit veld is verplicht.', 'e-name'); bad.push(fields.name); }
		var mail = fields.email.value.trim();
		if (!mail) { flag(fields.email, 'Dit veld is verplicht.', 'e-email'); bad.push(fields.email); }
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { flag(fields.email, 'Vul een geldig e-mailadres in.', 'e-email'); bad.push(fields.email); }
		var msg = fields.message.value.trim();
		if (!msg) { flag(fields.message, 'Dit veld is verplicht.', 'e-message'); bad.push(fields.message); }
		else if (msg.length < 5) { flag(fields.message, 'Dit veld is te kort.', 'e-message'); bad.push(fields.message); }
		if (!fields.consent.checked) { flag(fields.consent, 'Ga akkoord met de privacyverklaring om je bericht te kunnen versturen.', 'e-consent'); bad.push(fields.consent); }
		return bad;
	}

	form.addEventListener('submit', function (e) {
		e.preventDefault();
		if (form.getAttribute('data-status') === 'submitting') { return; }
		var bad = validate();
		if (bad.length) {
			form.setAttribute('data-status', 'invalid');
			out.textContent = 'Een of meer velden bevatten een fout. Controleer ze en probeer het opnieuw.';
			focusEl(bad[0]);
			return;
		}
		out.textContent = '';
		form.setAttribute('data-status', 'submitting');
		form.setAttribute('aria-busy', 'true');
		window.setTimeout(function () {
			var name = fields.name.value.trim(), body = fields.message.value.trim();
			var text = 'Hallo The Finest Impact, ik ben ' + name + '. ' + body;
			document.getElementById('demo-mail').href = 'mailto:info@thefinestimpact.com?subject=' +
				encodeURIComponent('Kennismaking aangevraagd door ' + name) + '&body=' + encodeURIComponent(body + '\n\n' + name + ' <' + fields.email.value.trim() + '>');
			document.getElementById('demo-wa').href = 'https://wa.me/31648469924?text=' + encodeURIComponent(text);
			form.removeAttribute('aria-busy');
			form.setAttribute('data-status', 'sent');
			focusEl(form.querySelector('.tfi-success'));
		}, 1400);
	});

	/* Fix errors as you type */
	form.addEventListener('input', function (e) {
		var el = e.target;
		if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') {
			var tip = document.getElementById(el.getAttribute('aria-describedby'));
			if (tip) { tip.remove(); }
			el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); el.classList.remove('wpcf7-not-valid');
		}
	});
	form.addEventListener('change', function (e) {
		if (e.target === fields.consent) { form.dispatchEvent(new Event('input', { bubbles: true })); }
	});
})();
