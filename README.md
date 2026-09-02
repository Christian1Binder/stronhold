# STRONHOLD

Deutsch/English browser economy and castle clicker, published at https://christian1binder.github.io/stronhold/.

The application uses three plain JavaScript/HTML files, with no build step or additional runtime dependencies: `index.html` contains the existing economy and interface, `world.js` adds territories and armies, and `events.js` contains the event catalog. Both scripts must load before `Game.init()`. Publish the three files together.

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

The existing `burgherr_v4_cg` local-storage key is retained. Version 7 migrates buildings, workers, resources, units, trade settings, upgrades, legacy land and renown in place. Before migration, the original saved JSON is copied once to `burgherr_v4_cg_before_world_v7` when browser storage permits. Reloading v7 does not reassign buildings, replenish deposits, repeat spear conversion or reroll a battle. New resources start at zero; old negative inventory artifacts are clamped to zero. Language remains in `stronhold_language`. No save reset is required.

## Tests

Run with Node.js:

```sh
node --test tests/economy.test.cjs
```

The tests load the actual inline and local external scripts in document order into an isolated VM. They cover trading, capacity, complete resource accounting, food recovery, staffing, recipes, migration, plot allocation, depleted mines, recruitment, deployment, irreversible battle settlement, home defense, offline peace, every event choice, German/English rendering and inline handler syntax. A seeded 1,000-day scenario combines production, trade, recruitment, adaptive defense, expeditions, scouting, settlement, events and population changes. UI render tests use a lightweight DOM double; they are not a real-browser layout check.
