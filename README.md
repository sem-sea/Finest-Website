# The Finest Impact — website + eigen CMS

De site draait op Vercel. De inhoud (pagina's, nieuws, klantverhalen, foto's, instellingen,
gebruikers en berichten uit het contactformulier) staat in één **privé Vercel Blob-opslag**.
Beheer via **/admin**.

## Eerste keer instellen
1. Vercel → project → **Storage** → Create → **Blob** → *Private*, regio **Frankfurt (fra1)** → koppel aan dit project (alle omgevingen).
2. **Redeploy** het project (zodat `BLOB_READ_WRITE_TOKEN` actief wordt).
3. Open `/admin`, vul de installatiecode (`CMS_SETUP_TOKEN`) in en maak je beheerdersaccount.
4. Instellingen → **Opslag controleren** moet “Alles werkt” tonen.

Omgevingsvariabelen: `CMS_SECRET` (sessies), `CMS_SETUP_TOKEN` (eerste account), `BLOB_READ_WRITE_TOKEN` (opslag).
Optioneel: `RESEND_API_KEY` (+ `CONTACT_FROM`) om contactberichten ook per e-mail te ontvangen.

## Hoe het werkt
- `api/site.js` bouwt de publieke pagina's uit de opgeslagen inhoud (zelfde HTML/CSS als voorheen); `api/cms.js` is de beheer-API.
- `content-seed/` is de beginstaat; die wordt bij het eerste gebruik naar de opslag gekopieerd. Zonder opslag toont de site de beginstaat (alleen lezen).
- Wijzigingen zijn binnen ± 30 seconden zichtbaar (CDN-cache).
- Beveiliging: wachtwoorden met scrypt, sessie-cookie HttpOnly + SameSite=Strict, CSRF-header, alle HTML wordt bij het opslaan gesaneerd, inlogpogingen en contactformulier hebben rate limits.

## Lokaal draaien en testen
```
npm i
npm run dev      # http://127.0.0.1:3000 , opslag in .dev-data/
npm test         # volledige end-to-end test (76 controles)
```
`legacy-static/` bevat de oorspronkelijke handgemaakte pagina's (alleen ter referentie; niet gedeployed).
Het WordPress-thema staat als zip in de root (`finest-impact-theme-v*.zip`).
