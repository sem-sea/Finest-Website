/* Contact form: validates in the browser (same states and markup contract as
   before: form[data-status] = init | submitting | invalid | sent | error), then
   posts the message to /api/contact. */
(function () {
	'use strict';
	var form = document.getElementById('contact-form');
	if (!form) { return; }

	var loaded = Date.now();
	var out = form.querySelector('.wpcf7-response-output');
	var fields = {
		name: form.querySelector('#tfi-name'),
		email: form.querySelector('#tfi-email'),
		company: form.querySelector('#tfi-company'),
		message: form.querySelector('#tfi-message'),
		consent: form.querySelector('#tfi-consent'),
		website: form.querySelector('[name="website"]')
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

	function fail(text) {
		form.removeAttribute('aria-busy');
		form.setAttribute('data-status', 'invalid');
		out.textContent = text;
		focusEl(out);
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

		fetch(form.getAttribute('data-endpoint') || '/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: fields.name.value.trim(),
				email: fields.email.value.trim(),
				company: fields.company.value.trim(),
				message: fields.message.value.trim(),
				consent: fields.consent.checked,
				website: fields.website ? fields.website.value : '',
				elapsed: Date.now() - loaded
			})
		}).then(function (r) {
			return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, data: data }; });
		}).then(function (res) {
			if (!res.ok) {
				fail((res.data && res.data.error) || 'Het versturen is niet gelukt. Probeer het later opnieuw of mail ons direct.');
				return;
			}
			form.removeAttribute('aria-busy');
			form.setAttribute('data-status', 'sent');
			focusEl(form.querySelector('.tfi-success'));
		}).catch(function () {
			fail('Het versturen is niet gelukt. Controleer je verbinding en probeer het opnieuw.');
		});
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
