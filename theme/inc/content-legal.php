<?php
/**
 * Concept legal pages (Fase 8): the briefing document contained no legal
 * text, KvK-nummer, BTW-nummer or vestigingsadres, so none of that is
 * invented here. Both pages are written as a concept and prominently
 * marked as not yet legally reviewed, per the client's explicit choice.
 */

defined( 'ABSPATH' ) || exit;

function finest_legal_concept_notice() {
	return <<<'HTML'
<!-- wp:group {"backgroundColor":"klei","style":{"border":{"width":"1px"},"spacing":{"padding":{"top":"20px","bottom":"20px","left":"24px","right":"24px"},"margin":{"bottom":"var:preset|spacing|40"}}},"borderColor":"rand","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-border-color has-rand-border-color has-klei-background-color has-background" style="border-width:1px;margin-bottom:var(--wp--preset--spacing--40);padding-top:20px;padding-right:24px;padding-bottom:20px;padding-left:24px">
<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size"><strong>Concept — nog niet juridisch gecontroleerd.</strong> Deze pagina is een startpunt op basis van de bekende bedrijfsgegevens. Ontbrekende gegevens (KvK-nummer, btw-nummer, vestigingsadres) zijn hieronder als [AAN TE VULLEN] gemarkeerd. Laat deze tekst controleren door een jurist voordat de site live gaat.</p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
HTML;
}

function finest_algemene_voorwaarden_content() {
	$notice = finest_legal_concept_notice();
	return <<<HTML
{$notice}

<!-- wp:heading {"level":1,"fontSize":"kop"} -->
<h1 class="wp-block-heading has-kop-font-size">Algemene Voorwaarden</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Deze algemene voorwaarden zijn van toepassing op alle overeenkomsten tussen The Finest Impact ("wij", "ons") en de opdrachtgever ("jij", "je") met betrekking tot het gebruik van het marketingplatform en de bijbehorende dienstverlening.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">1. Wie we zijn</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact<br>
KvK-nummer: [AAN TE VULLEN]<br>
Btw-nummer: [AAN TE VULLEN]<br>
Vestigingsadres: [AAN TE VULLEN]<br>
E-mail: <a href="mailto:info@thefinestimpact.com">info@thefinestimpact.com</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">2. De dienst</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact is een marketingplatform voor onafhankelijke opticiens. De precieze omvang van de dienstverlening (strategie, content, campagnes, koppelingen met bestaande systemen) wordt per klant vastgesteld tijdens de kennismaking en strategische marketing sessie, en vastgelegd in een aparte overeenkomst of offerte.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">3. Menselijke controle over gepubliceerde content</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact publiceert niet zelfstandig namens de opdrachtgever. De opdrachtgever behoudt te allen tijde de controle over welke content, campagnes en communicatie daadwerkelijk naar buiten gaan.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">4. Looptijd en opzegging</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[AAN TE VULLEN — looptijd, opzegtermijn en verlengingsvoorwaarden worden per overeenkomst vastgelegd.]</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">5. Aansprakelijkheid</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[AAN TE VULLEN — aansprakelijkheidsbeperking, over te laten aan juridische review voordat deze pagina definitief wordt.]</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">6. Toepasselijk recht</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Op deze voorwaarden is Nederlands recht van toepassing.</p>
<!-- /wp:paragraph -->
HTML;
}

function finest_privacyverklaring_content() {
	$notice = finest_legal_concept_notice();
	return <<<HTML
{$notice}

<!-- wp:heading {"level":1,"fontSize":"kop"} -->
<h1 class="wp-block-heading has-kop-font-size">Privacyverklaring</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact respecteert je privacy. Deze verklaring beschrijft welke persoonsgegevens deze website verzamelt, waarom, en hoe je je rechten kunt uitoefenen.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Wie is verantwoordelijk?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact<br>
KvK-nummer: [AAN TE VULLEN]<br>
Vestigingsadres: [AAN TE VULLEN]<br>
E-mail: <a href="mailto:info@thefinestimpact.com">info@thefinestimpact.com</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Welke gegevens verzamelen we, en waarom</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Deze verklaring beschrijft alleen de gegevens die deze website daadwerkelijk verzamelt — geen algemene claims over cookies of tracking die niet gebruikt worden.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item --><li><strong>Contactformulier.</strong> Wanneer je het contactformulier invult, verwerken we je naam, e-mailadres, bedrijfsnaam (optioneel) en bericht, uitsluitend om te reageren op je aanvraag. Deze gegevens worden per e-mail naar info@thefinestimpact.com gestuurd en niet voor andere doeleinden gebruikt.</li><!-- /wp:list-item -->
<!-- wp:list-item --><li><strong>Technisch noodzakelijke cookies.</strong> Voor het functioneren van deze website worden alleen strikt noodzakelijke, functionele cookies gebruikt (bijvoorbeeld voor de beveiliging van formulieren). Hiervoor is geen toestemming vereist.</li><!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>[AAN TE VULLEN — zodra analytics-, marketing- of trackingcookies daadwerkelijk worden ingezet (bijv. Google Analytics, advertentiepixels), moeten die hier expliciet benoemd worden, samen met een cookiebanner die "alles accepteren" en "alles weigeren" even prominent aanbiedt. Op dit moment zijn geen niet-essentiële cookies actief.]</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Bewaartermijn</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>[AAN TE VULLEN — hoe lang contactformulier-inzendingen bewaard blijven.]</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Jouw rechten</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Je hebt het recht om inzage, correctie of verwijdering van je persoonsgegevens te vragen. Neem hiervoor contact op via <a href="mailto:info@thefinestimpact.com">info@thefinestimpact.com</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Klantgegevens binnen het platform</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Voor gegevens die klanten van The Finest Impact via het platform zelf verwerken (bijvoorbeeld gekoppelde kassa- of nieuwsbriefsystemen) geldt een aparte verwerkersovereenkomst, buiten de scope van deze websiteprivacyverklaring.</p>
<!-- /wp:paragraph -->
HTML;
}
