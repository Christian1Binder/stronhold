# STRONHOLD

Deutsch/English browser economy and castle clicker, published at https://christian1binder.github.io/stronhold/.

The application has no build step or additional runtime dependencies. Publish `index.html`, `world.js`, `kingdom.js`, `events.js` and `kingdom.css` together. Script order is base game → world → kingdom → events → `Game.init()`. The version query on local assets prevents mixing old cached rules with the new release.

## Major Update · 2026-09-05 · v8

### Gebiete und Übersicht

- Das Stammland bietet jetzt **36 Siedlungsplätze, 10 Waldplätze, 16 fruchtbare Plätze, 4 Steinbruchplätze und 3 Minenplätze**. Davon belegen die drei Startgebäude drei Siedlungsplätze. Holzfäller und Jäger nutzen eigene Waldplätze. Bestehende Lehen erhalten einmalig zusätzliche Reserven; erschöpfte Vorkommen werden beim Laden nicht aufgefüllt.
- Über der Karte lässt sich das angezeigte Baugebiet wechseln. Die vier Kartenflächen und die Baukarten zeigen freie Plätze direkt an. Die Gebäudeanzeige zählt pro Typ im gewählten Gebiet; Baukarten zeigen lokale und gesamte Gebäudezahl. Produktion und Arbeiterverwaltung gelten weiterhin für das ganze Lehen. Bei erschöpften Vorkommen meldet die Kartenanzeige keine nutzbaren Minenplätze.
- Nach jeweils zwei weiteren erschlossenen Gebieten erscheinen drei neue Nachbargebiete. Die bisherige zusätzliche Burgstufensperre entfällt. Es gibt keine letzte Grenze: Ein neutrales Gebiet je Abschnitt sichert einen friedlichen Einstieg, weiterer Fortschritt erfordert Eroberungen.
- Namen entstehen aus 16 Ortsanfängen, 12 Endungen, 24 Vornamen, sieben geschlechtsgerechten Titelstufen und späteren Beinamen. Titel und Gegnerstärke berücksichtigen Burgstufe und Grenzfortschritt. Nummerierte Ortsvarianten verhindern Duplikate nach Ausschöpfen der Namenskombinationen. Namen, Stärke und Kampfwürfe bleiben gespeichert. Gebiets- und Gegnerlisten haben Seiten und getrennte Ansichten für Besitz und Grenze.
- Unter 🛡️ und ⚔️ zeigt eine Truppentabelle jede Gattung mit Gesamtbestand, verfügbaren und entsandten Einheiten. Baumeister im Gerätebau werden zusätzlich ausgewiesen. Sold und Heimatverteidigung stehen unmittelbar daneben.

### Originalketten und eigene Spielbalance

Recherchierte Grundlage: [Firefly: Stronghold HD Manual](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/40950/manuals/Stronghold%20HD%20Manual%20-%20English.pdf), Abschnitte 4.2–4.4, 6.1–6.3, 9.1–9.6 und die Warenflussdiagramme 10.2–10.3.

| Kette nach dem Handbuch | Umsetzung |
| --- | --- |
| Weizen → Mühle → Mehl → Bäckerei → Brot | Bäckereien verbrauchen kein Holz. |
| Hopfen → Brauerei → Bier → Wirtshaus | Ausschank braucht einen Wirt; kein Weizen oder Holz beim Brauen. |
| Milchviehhof → Kühe/Käse; Gerberei → Lederrüstung | Drei Kühe ermöglichen Käse; eine verarbeitete Kuh liefert drei Lederrüstungen. |
| Holz → Bogen / Armbrust / Speer / Pike | Je Waffe 2 / 3 / 1 / 2 Holz. |
| Eisen → Schwert / Streitkolben / Metallrüstung | Je Gegenstand 1 Eisen. |

Pikeniere benötigen nun Metallrüstung, Armbrust- und Streitkolbenkämpfer Lederrüstung. Spezialisierte Werkstattvarianten stellen die Produkte der ursprünglichen Handwerksberufe dar. Streitkolben und passende Sturmtruppen ergänzen das Sortiment.

**An den Klicker angepasste Werte:** Ein Spieltag dauert vier Sekunden. Ein Müller verarbeitet zwei Weizen pro Tag; eine Mühle bietet drei Arbeitsplätze und versorgt bei Vollbesetzung sechs Bäckereien. Eine Bäckerei liefert vier Brot pro Mehl; eine Brauerei vier Bier pro Hopfen. Ein Wirtshaus versorgt 30 Bewohner mit je 0,2 Bier täglich. Die Nachzucht dauert vier Arbeitstage je Kuh. Eine Gerberei benötigt drei Arbeitstage je Kuh; Materialmangel erlaubt höchstens einen gespeicherten Arbeitszyklus. Durchsatzboni beeinflussen Arbeitszeit und Verbrauch gemeinsam. Diese Mengen und Zeiten sind Spielbalancewerte unserer Simulation. Transportwege und einzelne Laufanimationen bleiben abstrahiert.

### Baumeister und Belagerung

Die Baumeistergilde kostet 300 Gold, 100 Holz und 50 Stein; sie ermöglicht die Ausbildung für 30 Gold je freiem Bewohner. Geräte benötigen verfügbare Baumeister, Ressourcen und mehrere Spieltage. Ein laufender Gerätebau bindet seine Mannschaft. Diese Personen können währenddessen keinen Feldzug bemannen; die Gilde lässt sich erst danach abreißen.

| Gerät | Besatzung laut Handbuch | Bauzeit hier | Materialkosten hier | Steinmunition je Feldzug |
| --- | ---: | ---: | --- | ---: |
| Tragbarer Schild | 1 | 2 Tage | 40 Gold, 15 Holz | 0 |
| Katapult | 2 | 3 Tage | 150 Gold, 60 Holz | 10 |
| Tribok | 3 | 5 Tage | 300 Gold, 100 Holz | 20 |
| Rammbock | 4 | 4 Tage | 200 Gold, 80 Holz | 0 |
| Belagerungsturm | 4 | 5 Tage | 250 Gold, 100 Holz | 0 |

Die Feldzugsauswahl ergänzt die benötigte Mannschaft automatisch. Proviant umfasst auch diese Personen; Munition wird einmal beim Aufbruch bezahlt. Belagerungswirkung ergänzt die Truppenstärke um höchstens 60 % der gegnerischen Stärke. Schilde und Türme können Verluste um bis zu 25 % senken; jeder Angriff verursacht weiterhin mindestens einen Verlust. Geräte erleiden ebenfalls Verluste und müssen ohne ausreichende überlebende Besatzung zurückgelassen werden. Erhaltene Geräte sind bis zur Rückkehr gebunden. Belagerungen und der Transport von Gerätebausätzen verwenden unser bestehendes abstraktes Feldzugsmodell.

### Spielstände und Veröffentlichung

Vor dem Update wird der gespeicherte Originalzustand einmal unter `burgherr_v4_cg_before_major_v8` gesichert, soweit Browserspeicher verfügbar ist. Der aktive Speicherschlüssel und die Sprachwahl bleiben bestehen. Bestehende Viehhöfe werden samt Besetzung zu Milchviehhöfen; Lederwerkstätten zu Gerbereien. Vorhandene Rohhäute und Leder bleiben verwendbar und werden zuerst verarbeitet. Alte Handelsbestände bleiben kompatibel. Neue Ereignisangebote verwenden die aktuellen Waren.

Vorhandene Milchviehhöfe starten mit ihrer Herde; neu gebaute Höfe ziehen sie erst auf. Bestehende Brauereien erhalten einmalig ein Wirtshaus mit gewünschter Besetzung; verfügbare Bewohner bestimmen, ob es sofort arbeitet. Alte Truppen bleiben erhalten, laufende Feldzüge behalten ihre Werte. Die Übernahme gewährt 16 Spieltage Angriffsschutz. Offline laufen Wirtschaft und Nachzucht mit dem bisherigen reduzierten Durchsatz weiter; Gerätebau, Feldzüge und Ereignisse warten auf aktive Spieltage.

Repository-Backup: `backup-2026-09-05-vor-major-v8` bei Commit `08c79ee9a00383c2b5b7b29620b119e972137e90`. Veröffentlichung erfolgt weiter über die bestehende GitHub-Pages-Adresse.

Die folgenden Abschnitte dokumentieren frühere Versionen; für die aktuelle Mechanik gelten die v8-Regeln oben.

## Territory and campaign update · 2026-09-02 · v7

- The homeland starts with 16 settlement plots, 6 fertile plots, 2 quarry plots and 1 iron-mine plot. Farms compete for fertile land; hunters and lumberjacks use settlement plots. Existing buildings receive grandfathered capacity and are never removed by migration. Legacy land upgrades and their bonuses remain intact.
- Building placement can be automatic or restricted to an owned territory. Construction requires a suitable free plot and, for a mine, a usable deposit. Removing a building refunds 50% of its construction resources and frees its plot. The trading post, last warehouse/granary and each territorial outpost are protected. Demolition can reduce storage/housing; the confirmation explains overflow risk.
- Stone and iron deposits are finite, including during offline production. Mining honors the number of buildings and assigned workers in each owned region. Unowned deposits cannot be mined. Paid geological discoveries add a modest deposit, never a new plot.
- Click assistance is limited per game day: base budgets are 8 wood, 5 apples, and 2 stone per staffed quarry. Staffed lumberjacks/orchards add 2 to their respective budgets. Each tool upgrade raises budgets by 30% of the base and retains its per-click bonus. Stone clicks consume real deposits. A combo can award its 5 gold bonus at most once per game day.
- Each frontier offers one neutral territory and two named enemy territories. Scouting reserves one idle resident for 2 days. Settlement needs two idle residents, resources and 6 days; securing conquered land needs two residents, resources and 4 days. Completion adds one territorial outpost and unlocks the region's plots. Another frontier requires both five more castle levels and two developed territories per prior frontier.
- Enemies have saved strengths, tactics and attack schedules. Their strengths are fixed at discovery relative to castle level, never rescaled to the player's army. Defeating an enemy permanently ends its attacks. Neutral land cannot provide an unlimited alternative to conquest.
- Pikemen require a pike, leather armor, one idle resident and 30 gold. Crossbowmen require a crossbow, leather armor, one idle resident and 35 gold. Each new weapon recipe uses 2 wood and 1 iron. Existing spear-equipped `pikeman` soldiers migrate once to `spearman`; no soldiers or equipment are discarded. Pikemen counter cavalry (+70%); crossbowmen counter heavy infantry (+55%). Ranged troops with insufficient melee protection suffer a 30% effectiveness penalty.
- Select a field army under ⚔️. The forecast reports victory chance, a casualty range, provisions, return day, remaining home defense and the next announced threat. Travel, battle and return are separate saved phases. Every offensive battle loses at least one soldier. Survivors remain away until their return day. A captured region still needs a completed outpost project before construction is allowed.
- `S.units` includes both home and deployed soldiers. Only `World.homeUnits()` can defend. Casualties reduce both military counts and population; deployed soldiers never die in a home raid. One paid expedition can be active at a time. Its random battle roll is committed on departure and retained across reloads; battle consequences cannot be applied twice.
- Civilians consume one ration/day. Soldiers at home consume 1.25 each; deployed soldiers carry prepaid expedition provisions and are excluded from home consumption. Every soldier costs 0.15 gold/day and pays no tax. Unpaid upkeep gives −2 mood for that day. Long-term starvation can kill civilians and home soldiers, never provisioned field troops. Production still works with empty food stores.
- Attacks begin from castle level 6, with an initial warning period. Migrated saves get 16 protected game days. Pending attacks are saved before the defense dialog opens. All campaign, settlement, truce and event deadlines use game days; offline progress never advances battles, casualties, events or projects.
- There are 100 distinct selectable events plus 5 conditional follow-up stories: 20 common stories, 15 for each of the five castle-rank ranges, and the five legacy events. Conditions filter stories about farms, mines, herds, armies or enemies. The last five event IDs cannot recur immediately; at least 15 remain eligible at every castle level, even in a minimal settlement. Choices have explicit costs/consequences, a free exit, timed effects and/or follow-ups. All consequences are revalidated on selection, including housing and provisions. Event dialogs wait until the tutorial is complete or skipped.
- All new controls, forecasts, stories, consequences, troop descriptions and production displays support German and English. The existing main layout and mobile presentation are retained; new management dialogs are responsive. Blocking events and attacks appear above management menus.

Backup before publication: branch `backup-2026-09-02-vor-gebietsupdate`, commit `fbe7b71830032805cdedaf07f6b99497cbddbe87`. Publication remains on the existing GitHub Pages repository; the separate `stronghold` project is not touched.

## Economy update · 2026-09-01

- Market prices are fixed per five units. Automatic trading uses exact quantities, not five-unit lots: sell every surplus to its maximum, then buy shortages to their minimum. It runs when settings change and before/after production. Gold reserves and shared storage capacities remain hard limits.
- Processing uses explicit input/output recipes. Guild, extra-shift and renown bonuses increase throughput and input consumption together. Food processing has priority over brewing and weapons when inputs are scarce.
- Base recipes per assigned worker and tick: a mill uses 2 wheat for 2 flour; a bakery uses 1 flour and 1 wood for 4 bread; a brewery uses 1 wheat, 1 hops and 1 wood for 4 beer.
- A cattle farm produces 2 meat and 1 hide; a tannery turns 1 hide into 1 leather; a leather workshop turns 1 leather into 1 leather armor. A Castle Guard uses a spear, leather armor, one idle resident and 25 gold.
- The v6 base food demand was one ration per resident per tick; v7 adds the military rules above. Beer is separate, uses its own drink capacity, and is served at 0.2 per resident at home for up to +3 happiness. Beer never feeds residents or takes granary space.
- Production continues with empty stocks. Population losses only reduce staffing if the workforce actually exceeds the remaining population. Food jobs have priority, and intended staffing is restored when residents return. Manually paused jobs stay paused. Starvation deaths require sustained shortages.
- The production ledger separates gross output, processing inputs, food/beer consumption, trading, overflow losses and net inventory changes. It reports the last completed tick, not a promise about future output.
- Renown grants automatic benefits at 25, 75, 150, 300 and 600. At 300: +20% contract gold and +10% production throughput, tax gold and defense. Existing renown applies immediately; it is not spent and does not affect market prices.
- Offline progress uses the same recipes and trading at 45% throughput for up to two hours. Population consumption, taxes, raids and events do not advance while offline.

## Saves and language

The existing `burgherr_v4_cg` local-storage key and `stronhold_language` preference are retained. v8 migration is described above; v6→v7 spear conversion still runs only for saves older than v7. No save reset is required.

## Tests

Run with Node.js:

```sh
node --test tests/economy.test.cjs
```

The tests load the actual inline and local external scripts in document order into an isolated VM. Coverage includes trading, resource accounting, food recovery, recipes, multi-worker mills, cow breeding and slaughter, inn coverage, save conversion, territory switching, over 100 frontier generations, name persistence, finite deposits, troop and engineer recruitment, crew reservation, siege construction, ammunition, campaign forecasts, casualties, returns, offline peace, event choices, both languages and generated handler syntax. A seeded 1,000-day scenario combines economy, trade, recruitment, adaptive defense, campaigns, settlement, events and population changes. UI render tests use a lightweight DOM double; they are not a real-browser layout check.
