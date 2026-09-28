<?php
/**
 * Real page content (Gutenberg block markup) sourced from the client's own
 * "Website teksten + briefing versie def" document — nothing here is
 * invented (Fase 8). Legal pages are the one exception the client
 * explicitly approved: a concept, clearly marked as such, since no legal
 * text was supplied in the briefing.
 *
 * Every function returns plain block-comment markup so it round-trips
 * through the block editor exactly like content a person typed by hand.
 */

defined( 'ABSPATH' ) || exit;

function finest_cta_button( $label = 'Plan een kennismaking', $url = '/contact/' ) {
	$url = esc_url( $url );
	$label = esc_html( $label );
	return <<<HTML
<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{$url}">{$label}</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
HTML;
}

function finest_home_page_content() {
	$hero = <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--60)">

<!-- wp:paragraph {"className":"fi-eyebrow"} -->
<p class="fi-eyebrow">Own your spotlight</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Maximale marketingkracht. Optimale zorg.</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">The Finest Impact is een compleet marketingteam in één platform. Marketing voor jouw merk die klaar is voor de toekomst.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Meer zichtbaarheid. Meer continuïteit. Meer commerciële impact.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Van strategie en campagnes tot content, social media, e-mail, vindbaarheid en concurrentieanalyse. Het marketingteam is gepersonaliseerd voor jouw bedrijf en werkt samen vanuit jouw merk, jouw klanten en jouw commerciële doelen. Jij bepaalt de richting en houdt altijd de controle. De agents doen het uitvoerende werk.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Zo houd jij meer tijd over voor waar je écht goed in bent: klanten adviseren, brillen verkopen en de beste oogzorg bieden.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>The Finest Impact laat je marketing presteren.</strong></p>
<!-- /wp:paragraph -->

HTML;
	$hero .= finest_cta_button( 'Plan een kennismaking', '/contact/' );
	$hero .= "\n</div>\n<!-- /wp:group -->";

	$herkenning = <<<'HTML'
<!-- wp:group {"backgroundColor":"zwart","textColor":"linnen","className":"is-style-fi-dark-section","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-fi-dark-section has-linnen-color has-zwart-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)">

<!-- wp:heading {"level":2,"fontSize":"kop"} -->
<h2 class="wp-block-heading has-kop-font-size">Als opticien ligt je aandacht in de winkel</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Bij je klanten, je collectie, je team en de oogzorg die je biedt. Toch vraagt marketing iedere week opnieuw om aandacht.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Een nieuwe brillencollectie die onder de aandacht moet worden gebracht. Social media die bijgehouden moet worden. Een nieuwsbrief die nog verstuurd moet worden. Campagnes die op tijd moeten starten. En natuurlijk wil je die klant regelmatig terugbrengen naar de winkel.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In de praktijk ligt dat werk vaak bij één persoon die marketing naast alle andere werkzaamheden doet. Of verschillende marketing­werkzaamheden worden verdeeld over bureaus, freelancers en losse tools.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Voor je het weet wordt marketing iets wat gebeurt als er tijd over is en is de consistentie ver te zoeken. Vaak ontbreken niet de ideeën, maar de tijd en de capaciteit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>En precies daar begint The Finest Impact.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-fi-outline"} -->
<div class="wp-block-button is-style-fi-outline"><a class="wp-block-button__link wp-element-button" href="/diensten/">Ontdek hoe het werkt</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

</div>
<!-- /wp:group -->
HTML;

	$wat_is = <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">

<!-- wp:heading {"level":2,"fontSize":"kop"} -->
<h2 class="wp-block-heading has-kop-font-size">Alles wat je nodig hebt om marketing van de toekomst te runnen</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Finest Impact brengt jouw marketing samen in één centrale omgeving; één dashboard waar jij iedere dag op kan inloggen om te zien wat er speelt. Misschien moet je iets doen, iets activeren of goedkeuren. Onder het genot van een kopje koffie heb jij het zo op orde en kan je focus naar de winkel.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Strategie, campagnes, content, social media, e-mailmarketing, vindbaarheid, marktinzichten en analyse werken niet langer los van elkaar, maar vanuit dezelfde kennis over jouw bedrijf, je concurrentie en je groeikansen. Goede marketing begint niet bij een losse post, advertentie of nieuwsbrief. Het begint bij weten wie je bent, wie je klanten zijn en wat je wilt bereiken. Daarom richten we The Finest Impact in rondom het DNA van jouw bedrijf.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Daardoor hoef je niet iedere campagne opnieuw vanaf nul te bedenken en hoef je niet steeds verschillende partijen te briefen. Een volledige campagneplanning, opgebouwd vanuit jouw doelstellingen, met 360 graden materialen voor de juiste kanalen, in een oogopslag en gemakkelijk aan te bewerken wanneer jij dat nodig vindt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Je marketing krijgt één lijn en één duidelijke richting.<br><strong>Meer marketingkracht. Zonder een groter marketingteam.</strong></p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group -->
HTML;

	$opticiens = <<<'HTML'
<!-- wp:group {"backgroundColor":"klei","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group has-klei-background-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)">

<!-- wp:heading {"level":2,"fontSize":"kop"} -->
<h2 class="wp-block-heading has-kop-font-size">Speciaal voor opticiens</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Jij bent opticien en je wilt gewoon resultaat. Meer verkopen.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>En dat snappen we. The Finest Impact is ontwikkeld voor opticiens die marketing professioneel willen aanpakken. Het doel is dat marketing consistent bijdraagt aan je bedrijf.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Jij kent je klanten. Jij weet welke collectie belangrijk is. Jij weet wat er in je winkel speelt. Jij bepaalt waar je naartoe wilt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wij zorgen samen met ons platform dat die kennis wordt vertaald naar sterke marketing. Menselijke expertise bepaalt de strategie en bewaakt de kwaliteit. Slimme AI-technologie zorgt voor snelheid, capaciteit en uitvoering.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>Jij brengt de kennis van je bedrijf. The Finest Impact brengt de marketingkracht.</strong></p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group -->
HTML;

	$faq = finest_faq_block();

	$slot = <<<'HTML'
<!-- wp:group {"backgroundColor":"zwart","textColor":"linnen","className":"is-style-fi-dark-section","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-fi-dark-section has-linnen-color has-zwart-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--70);padding-left:var(--wp--preset--spacing--50)">

<!-- wp:paragraph {"className":"fi-eyebrow"} -->
<p class="fi-eyebrow">Own your spotlight</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2,"fontSize":"kop"} -->
<h2 class="wp-block-heading has-kop-font-size">Professionele marketing vraagt geen volledige marketingafdeling</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Het vraagt marketing van de toekomst.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The Finest Impact combineert jouw kennis van je bedrijf met marketingexpertise en AI-technologie die het zware werk voor je doet. Zodat je zichtbaar blijft, sneller commerciële kansen benut en meer uit je marketing haalt. Terwijl jij kunt blijven doen waar jij het verschil maakt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>The Finest Impact laat je marketing presteren.</strong></p>
<!-- /wp:paragraph -->

HTML;
	$slot .= finest_cta_button( 'Plan een kennismaking', '/contact/' );
	$slot .= "\n</div>\n<!-- /wp:group -->";

	return implode( "\n\n", array( $hero, $herkenning, $wat_is, $opticiens, $faq, $slot ) );
}

function finest_faq_item( $question, $answer ) {
	$q = esc_html( $question );
	return <<<HTML
<!-- wp:details -->
<details class="wp-block-details"><summary>{$q}</summary>
<!-- wp:paragraph -->
<p>{$answer}</p>
<!-- /wp:paragraph -->
</details>
<!-- /wp:details -->
HTML;
}

function finest_faq_block() {
	$items = array(
		array( 'Wat is The Finest Impact?', 'The Finest Impact is een compleet marketingteam in één platform, ontwikkeld voor de optiek. Het helpt je bij alles wat nodig is om je marketing structureel goed te organiseren. Van strategie en campagnes tot content, social media, e-mailmarketing, vindbaarheid, marktinzichten en analyse. Alles vertrekt vanuit jouw bedrijf, jouw klanten en jouw commerciële doelen. Zo krijg je meer marketingkracht, zonder zelf een volledige marketingafdeling op te bouwen.' ),
		array( 'Voor wie is The Finest Impact bedoeld?', 'Voor zelfstandige opticiens die marketing belangrijk vinden, maar merken dat het er in de praktijk te vaak bij wordt gedaan. Misschien ligt marketing nu bij jou als ondernemer. Misschien doet een medewerker het erbij. Of werk je met verschillende bureaus en freelancers. The Finest Impact brengt daar meer structuur, snelheid en samenhang in — één platform waarin jouw gehele marketingteam samenkomt.' ),
		array( 'Wat kan The Finest Impact voor mijn optiekbedrijf doen?', 'The Finest Impact helpt je om vooruit te kijken, campagnes op tijd te plannen, regelmatig zichtbaar te zijn, klanten opnieuw te activeren en beter gebruik te maken van kansen in je markt. Niet meer iedere week opnieuw bedenken wat je moet posten of welke actie je moet verzinnen. Je werkt vanuit een duidelijke marketinglijn.' ),
		array( 'Is The Finest Impact alleen bedoeld voor content en social media?', 'Nee. Content is maar één onderdeel van marketing. The Finest Impact helpt ook bij strategie, campagnes, klantactivatie, e-mailmarketing, lokale zichtbaarheid, vindbaarheid in Google en AI, marktontwikkelingen en het analyseren van wat werkt.' ),
		array( 'Werkt The Finest Impact met AI?', 'Ja, AI speelt een belangrijke rol. Maar The Finest Impact is niet ontwikkeld om simpelweg zoveel mogelijk content te produceren. AI wordt ingezet om sneller te kunnen onderzoeken, plannen, maken, analyseren en verbeteren. Jouw bedrijf, klanten en commerciële doelen blijven altijd het uitgangspunt.' ),
		array( 'Krijg ik dan van die typische AI-teksten?', 'Dat willen we juist voorkomen. The Finest Impact leert jouw merk, doelgroep, tone of voice, aanbod en manier van communiceren kennen. Daardoor ontstaat marketing die beter bij jouw merk past en niet klinkt alsof dezelfde tekst ook voor iedere andere opticien geschreven had kunnen zijn.' ),
		array( 'Heb ik nog wel zelf controle over mijn marketing?', 'Altijd. The Finest Impact is geen automatische marketingmachine die zelfstandig van alles publiceert. Zie het als een extra marketingteam naast je. Het platform helpt je denken, voorbereiden, maken en verbeteren. Jij bepaalt uiteindelijk wat past bij jouw bedrijf en wat naar buiten gaat.' ),
		array( 'Kan één medewerker hiermee werken?', 'Ja. Dat is juist één van de uitgangspunten. Je hoeft geen groot marketingteam of senior marketeer in dienst te hebben. Ook een ondernemer, marketingmedewerker of communicatiemedewerker kan met The Finest Impact werken. De kennis en slagkracht die normaal over meerdere specialisten verdeeld is, wordt veel toegankelijker.' ),
		array( 'Vervangt The Finest Impact mijn marketingbureau of marketeer?', 'Dat hoeft niet. Heb je een goede marketeer of een bureau waar je prettig mee werkt, dan kan The Finest Impact juist helpen om meer gedaan te krijgen. Tegelijkertijd kan het platform werkzaamheden overnemen die nu verspreid liggen over verschillende bureaus, freelancers en tools. Je bepaalt dus zelf wat je intern wilt organiseren en waar je externe expertise voor wilt blijven inzetten.' ),
		array( 'Hoe weet The Finest Impact wat bij mijn bedrijf past?', 'Daar begint onze samenwerking mee. Voordat we The Finest Impact voor je inrichten, kijken we naar je bedrijf, positionering, klanten, aanbod, huidige marketing en commerciële ambities. Wat staat al goed? Waar liggen kansen? Wat ontbreekt nog? Pas daarna richten we The Finest Impact in rondom jouw organisatie. Geen standaardpakket waarin iedere opticien hetzelfde krijgt.' ),
		array( 'Hoe starten we?', 'We beginnen met een Strategische Marketing Sessie. Daarin kijken we samen naar je huidige marketing, doelgroep, positionering, zichtbaarheid en commerciële doelen. Vervolgens bepalen we jouw belangrijke data en marketingstrategie, wat eerst aangescherpt moet worden en hoe The Finest Impact jouw marketing het beste kan ondersteunen. Daaruit ontstaat een duidelijke strategische richting voor de komende periode.' ),
		array( 'Kan The Finest Impact samenwerken met systemen die we al gebruiken?', 'Waar dat relevant is, kan The Finest Impact samenwerken met bestaande marketing- en bedrijfssystemen. Denk aan je kassasysteem, meta, nieuwsbrief e.d. Welke koppelingen zinvol zijn, verschilt per organisatie. Ons uitgangspunt is simpel: we koppelen niet omdat het technisch kan, maar alleen wanneer het jouw marketing daadwerkelijk beter, slimmer of makkelijker maakt.' ),
		array( 'Is onze informatie veilig?', 'Daar besteden we vanaf het begin veel aandacht aan. We kijken zorgvuldig naar welke informatie nodig is, wie toegang heeft en hoe bedrijfs- en klantinformatie wordt gebruikt. Daarbij geldt altijd: niet méér data gebruiken dan nodig is. Zeker wanneer systemen of klantgegevens met elkaar worden verbonden, moeten veiligheid en privacy goed geregeld zijn.' ),
		array( 'Wat levert The Finest Impact mij uiteindelijk op?', 'Niet simpelweg meer marketing. Maar betere marketing. Meer structuur. Meer continuïteit. Snellere uitvoering. Sterkere campagnes. Meer zichtbaarheid. Meer inzicht in wat werkt. Meer sales. En vooral: minder tijd kwijt zijn aan het organiseren van marketing. Zodat jij je kunt richten op waar je uiteindelijk het verschil maakt: je klanten, je winkel, je collectie, je sales en goede oogzorg.' ),
		array( 'Wat kost The Finest Impact?', 'The Finest Impact wordt ingericht rondom jouw organisatie. De investering hangt daarom af van waar je nu staat en wat nodig is om je marketing goed te organiseren. Tijdens een kennismaking kijken we eerst naar je huidige situatie en ambities. Daarna kunnen we heel concreet aangeven welke aanpak bij jouw organisatie past.' ),
		array( 'Kan ik eerst zien hoe het werkt?', 'Natuurlijk. Tijdens een demo laten we je zien hoe The Finest Impact werkt aan de hand van herkenbare situaties uit de optiek. Geen technische softwaretour, maar vooral: wat betekent dit voor jouw dagelijkse marketing?' ),
	);

	$out = "<!-- wp:group {\"style\":{\"spacing\":{\"padding\":{\"top\":\"var:preset|spacing|60\",\"bottom\":\"var:preset|spacing|60\"}}},\"layout\":{\"type\":\"constrained\"}} -->\n";
	$out .= '<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">' . "\n\n";
	$out .= "<!-- wp:heading {\"level\":2,\"fontSize\":\"kop\"} -->\n<h2 class=\"wp-block-heading has-kop-font-size\">Veelgestelde vragen</h2>\n<!-- /wp:heading -->\n\n";
	foreach ( $items as $item ) {
		$out .= finest_faq_item( $item[0], $item[1] ) . "\n\n";
	}
	$out .= finest_cta_button( 'Plan een demo', '/contact/' );
	$out .= "\n</div>\n<!-- /wp:group -->";
	return $out;
}

function finest_team_member_block( $name, $role, $phone, $linkedin ) {
	$name_e  = esc_html( $name );
	$role_e  = esc_html( $role );
	$phone_e = esc_html( $phone );
	$li_e    = esc_url( $linkedin );
	return <<<HTML
<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":3,"fontSize":"medium"} -->
<h3 class="wp-block-heading has-medium-font-size">{$name_e}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">{$role_e}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">{$phone_e}<br><a href="mailto:info@thefinestimpact.com">info@thefinestimpact.com</a><br><a href="{$li_e}" target="_blank" rel="noopener">LinkedIn</a></p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:column -->
HTML;
}

function finest_over_ons_page_content() {
	$intro = <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--60)">

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Marketing first. Technology powered. Human controlled.</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Marketing wordt steeds belangrijker, maar voor veel ondernemers ook steeds moeilijker om goed te organiseren. Er zijn meer kanalen, meer data, meer technologie en meer mogelijkheden dan ooit. Maar tijd en capaciteit groeien niet automatisch mee.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Met meer dan 20 jaar ervaring in marketing en ruime kennis van de optiekbranche kennen we die werkelijkheid van heel dichtbij. We weten hoe belangrijk merk, strategie, creativiteit en commercieel inzicht zijn. We weten ook hoe vaak goede marketing blijft liggen omdat de dagelijkse praktijk voorgaat.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>Daarom hebben we The Finest Impact ontwikkeld.</strong></p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group -->

<!-- wp:group {"backgroundColor":"zwart","textColor":"linnen","className":"is-style-fi-dark-section","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-fi-dark-section has-linnen-color has-zwart-background-color has-text-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)">

<!-- wp:heading {"level":2,"fontSize":"kop"} -->
<h2 class="wp-block-heading has-kop-font-size">Marketing expertise en technologie horen bij elkaar</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Technologie kan veel, maar zonder richting, context en commercieel inzicht ontstaat vooral meer output. Daar geloven wij niet in.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Wij geloven in marketing die consistent is en klopt. Marketing die past bij je merk. Marketing die inspeelt op wat klanten nodig hebben. Marketing die zichtbaar maakt waar je voor staat. En marketing die uiteindelijk écht iets moet opleveren, namelijk sales.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Daarom combineren we menselijke expertise met technologie. De mens bepaalt de strategie, bewaakt de kwaliteit en maakt de keuzes. The Finest Impact zorgt voor snelheid, structuur en uitvoeringskracht. Samen ontstaat marketing die efficiënt en consistent wordt en zorgt voor groei.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>Own your spotlight.</strong></p>
<!-- /wp:paragraph -->

HTML;
	$intro .= finest_cta_button( 'Maak kennis met The Finest Impact', 'mailto:info@thefinestimpact.com' );
	$intro .= "\n</div>\n<!-- /wp:group -->";

	$team = "\n\n<!-- wp:group {\"style\":{\"spacing\":{\"padding\":{\"top\":\"var:preset|spacing|60\",\"bottom\":\"var:preset|spacing|60\"}}},\"layout\":{\"type\":\"constrained\"}} -->\n";
	$team .= '<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">' . "\n\n";
	$team .= "<!-- wp:heading {\"level\":2,\"fontSize\":\"kop\"} -->\n<h2 class=\"wp-block-heading has-kop-font-size\">Ontmoet ons team</h2>\n<!-- /wp:heading -->\n\n";
	$team .= "<!-- wp:paragraph -->\n<p>De mensen achter The Finest Impact.</p>\n<!-- /wp:paragraph -->\n\n";
	$team .= "<!-- wp:columns -->\n<div class=\"wp-block-columns\">\n";
	$team .= finest_team_member_block( 'Karin Boon', 'Co-founder & Head of Growth', '+31 6 48 46 99 24', 'https://www.linkedin.com/in/karinboon/' ) . "\n";
	$team .= finest_team_member_block( 'Manon van Gasteren', 'Co-founder & Head of Marketing', '+31 6 22 80 82 36', 'https://www.linkedin.com/in/manonvangasteren/' ) . "\n";
	$team .= finest_team_member_block( 'Ben Verschuur', 'Co-founder & Head of Technology', '+31 6 13 01 32 66', 'https://www.linkedin.com/in/benverschuur/' ) . "\n";
	$team .= finest_team_member_block( 'Bo Seerden', 'Co-founder & Head of Engineering', '+31 6 19 25 11 93', 'https://www.linkedin.com/in/boseerden/' ) . "\n";
	$team .= "</div>\n<!-- /wp:columns -->\n\n</div>\n<!-- /wp:group -->";

	return $intro . $team;
}

function finest_diensten_page_content() {
	$blok1 = <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--60)">

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Van strategie naar marketing die presteert</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Goede marketing begint niet met technologie. Het begint met weten waar je staat, wie je klant is, waar je kansen liggen en wat nodig is om te groeien.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Met meer dan 20 jaar ervaring in marketing en ruime kennis van de optiekbranche weten we hoe marketing werkt, maar vooral ook wat er in de praktijk nodig is om die marketing daadwerkelijk te laten presteren.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Daarom start The Finest Impact altijd vanuit jouw bedrijf. We brengen je marketing in kaart, bepalen samen de juiste richting, versterken wat nog ontbreekt en richten daarna jouw eigen marketingomgeving in.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Vanaf dat moment werk je structureel samen met The Finest Impact, onze marketingexpertise en gespecialiseerde marketing agents.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>Menselijke expertise bepaalt de richting. Technologie zorgt voor snelheid, capaciteit en uitvoering.</strong></p>
<!-- /wp:paragraph -->

HTML;
	$blok1 .= finest_cta_button( 'Plan een kennismaking', '/contact/' );
	$blok1 .= "\n</div>\n<!-- /wp:group -->";

	$stappen = array(
		array( 'We brengen de situatie in kaart', 'We starten met een strategische marketing sessie. Daarin kijken we naar je huidige marketing, doelgroep, positionering, klantreis, zichtbaarheid en commerciële ambities. Het resultaat is een concrete marketing roadmap.' ),
		array( 'We versterken wat nog ontbreekt', 'Op basis van die marketing roadmap bepalen we wat eerst beter moet. Dat kan bijvoorbeeld gaan om positionering, branding, contentstrategie, social media, campagnes, SEO, lokale vindbaarheid of zichtbaarheid in AI.' ),
		array( 'We richten The Finest Impact in', 'Zodra de marketingbasis staat, bouwen we jouw eigen marketingomgeving. We vertalen je merk, doelgroep, tone of voice, aanbod, doelen en kennis naar The Finest Impact en richten de juiste agents, workflows, kwaliteitscontrole en koppelingen in.' ),
		array( 'We gaan ermee werken en optimaliseren', 'Daarna wordt The Finest Impact onderdeel van je dagelijkse marketing. Je team gebruikt de omgeving voor onder andere campagnes, content, klantcommunicatie, zichtbaarheid en analyse. Jullie kennis blijft leidend, terwijl The Finest Impact helpt om sneller, consistent en professioneler te werken. Zo ontstaat stap voor stap een marketingaanpak die niet alleen slimmer is ingericht, maar ook structureel blijft werken.' ),
	);

	$blok2 = "\n\n<!-- wp:group {\"backgroundColor\":\"klei\",\"style\":{\"spacing\":{\"padding\":{\"top\":\"var:preset|spacing|60\",\"bottom\":\"var:preset|spacing|60\",\"left\":\"var:preset|spacing|50\",\"right\":\"var:preset|spacing|50\"}}},\"layout\":{\"type\":\"constrained\"}} -->\n";
	$blok2 .= '<div class="wp-block-group has-klei-background-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--50)">' . "\n\n";
	$blok2 .= "<!-- wp:heading {\"level\":2,\"fontSize\":\"kop\"} -->\n<h2 class=\"wp-block-heading has-kop-font-size\">Hoe gaan we te werk?</h2>\n<!-- /wp:heading -->\n\n";
	$blok2 .= "<!-- wp:paragraph -->\n<p>We werken in vier duidelijke stappen. Zo bouwen we niet zomaar iets, maar zorgen we dat iedere keuze aansluit op jouw organisatie, ambities en marketingdoelen.</p>\n<!-- /wp:paragraph -->\n\n";
	foreach ( $stappen as $i => $stap ) {
		$n = $i + 1;
		$blok2 .= "<!-- wp:heading {\"level\":3,\"fontSize\":\"medium\"} -->\n<h3 class=\"wp-block-heading has-medium-font-size\">{$n}. {$stap[0]}</h3>\n<!-- /wp:heading -->\n\n";
		$blok2 .= "<!-- wp:paragraph -->\n<p>{$stap[1]}</p>\n<!-- /wp:paragraph -->\n\n";
	}
	$blok2 .= "</div>\n<!-- /wp:group -->";

	return $blok1 . $blok2;
}

function finest_contact_page_content() {
	$content = <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--60)">

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Plan een kennismaking</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Tijdens een kennismaking kijken we eerst naar je huidige situatie en ambities. Daarna kunnen we heel concreet aangeven welke aanpak bij jouw organisatie past.</p>
<!-- /wp:paragraph -->

<!-- wp:columns -->
<div class="wp-block-columns">

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Stuur een bericht</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->
[finest_contact_form]
<!-- /wp:shortcode -->

</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">

<!-- wp:heading {"level":2,"fontSize":"medium"} -->
<h2 class="wp-block-heading has-medium-font-size">Direct contact</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><a href="mailto:info@thefinestimpact.com">info@thefinestimpact.com</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Karin Boon — Head of Growth<br>+31 6 48 46 99 24</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Manon van Gasteren — Head of Marketing<br>+31 6 22 80 82 36</p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:column -->

</div>
<!-- /wp:columns -->

</div>
<!-- /wp:group -->
HTML;
	return $content;
}

function finest_klantverhalen_intro_content() {
	return <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--50)">

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Wat gebeurt er wanneer marketing wél structureel wordt?</h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Daar willen we niet alleen over vertellen. We willen het laten zien.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In onze klantverhalen delen we hoe opticiens The Finest Impact gebruiken, wat er verandert in hun dagelijkse marketing en welk resultaat dat oplevert. Van tijdsbesparing en meer zichtbaarheid tot betere campagnes, meer klantactivatie en commerciële groei.</p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group -->

<!-- wp:query {"query":{"postType":"klantverhaal","perPage":9,"inherit":true},"layout":{"type":"grid","columnCount":3}} -->
<div class="wp-block-query">
<!-- wp:post-template -->
<!-- wp:post-featured-image {"isLink":true} /-->
<!-- wp:post-title {"isLink":true,"fontSize":"medium"} /-->
<!-- wp:post-excerpt /-->
<!-- /wp:post-template -->
</div>
<!-- /wp:query -->
HTML;
}

function finest_nieuws_intro_content() {
	return <<<'HTML'
<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--50)">

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size">Blijf voor op wat er in de optiek gebeurt</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>De optiekwereld verandert snel. Nieuwe merken komen op, retailconcepten veranderen, technologie ontwikkelt zich en consumenten verwachten steeds meer. The Finest News volgt wat er gebeurt in Nederland én daarbuiten. Van nieuwe eyewear merken en opvallende winkels tot internationale trends, technologie, AI, events, marketing en ontwikkelingen in de markt.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Maar we brengen niet alleen het nieuws. We kijken vooral naar de vraag: wat betekent dit voor jou als opticien?</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item --><li>Welke ontwikkelingen zijn interessant?</li><!-- /wp:list-item -->
<!-- wp:list-item --><li>Welke trends moet je in de gaten houden?</li><!-- /wp:list-item -->
<!-- wp:list-item --><li>Waar liggen kansen voor jouw winkel, merk of marketing?</li><!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size"><strong>The Finest News. Voor opticiens die niet willen volgen, maar vooruit willen kijken.</strong></p>
<!-- /wp:paragraph -->

</div>
<!-- /wp:group -->

<!-- wp:query {"query":{"postType":"post","perPage":9,"inherit":true},"layout":{"type":"grid","columnCount":3}} -->
<div class="wp-block-query">
<!-- wp:post-template -->
<!-- wp:post-featured-image {"isLink":true} /-->
<!-- wp:post-terms {"term":"nieuws_categorie","fontSize":"label"} /-->
<!-- wp:post-title {"isLink":true,"fontSize":"medium"} /-->
<!-- wp:post-excerpt /-->
<!-- /wp:post-template -->
</div>
<!-- /wp:query -->
HTML;
}

require_once __DIR__ . '/content-legal.php';
