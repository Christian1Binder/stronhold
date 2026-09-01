# STRONHOLD

Deutsch/English browser economy and castle clicker. The production app is the self-contained `index.html` served by GitHub Pages.

## Economy update · 2026-09-01

- Market prices are fixed per five units. Automatic trading uses exact quantities, not five-unit lots: sell every surplus to its maximum, then buy shortages to their minimum. It runs when settings change and before/after production. Gold reserves and shared storage capacities remain hard limits.
- Processing uses explicit input/output recipes. Guild, extra-shift and renown bonuses increase throughput and input consumption together. Food processing has priority over brewing and weapons when inputs are scarce.
- Base recipes per assigned worker and tick: a mill uses 2 wheat for 2 flour; a bakery uses 1 flour and 1 wood for 4 bread; a brewery uses 1 wheat, 1 hops and 1 wood for 4 beer.
- A cattle farm produces 2 meat and 1 hide; a tannery turns 1 hide into 1 leather; a leather workshop turns 1 leather into 1 leather armor. A Castle Guard uses a spear, leather armor, one idle resident and 25 gold.
- Food demand is one ration per resident per tick. Beer is separate, uses its own drink capacity, and is served at 0.2 per resident for up to +3 happiness. Beer never feeds residents or takes granary space.
- Production continues with empty stocks. Population losses only reduce staffing if the workforce actually exceeds the remaining population. Food jobs have priority, and intended staffing is restored when residents return. Manually paused jobs stay paused. Starvation deaths require sustained shortages.
- The production ledger separates gross output, processing inputs, food/beer consumption, trading, overflow losses and net inventory changes. It reports the last completed tick, not a promise about future output.
- Renown grants automatic benefits at 25, 75, 150, 300 and 600. At 300: +20% contract gold and +10% production throughput, tax gold and defense. Existing renown applies immediately; it is not spent and does not affect market prices.
- Offline progress uses the same recipes and trading at 45% throughput for up to two hours. Population consumption, taxes, raids and events do not advance while offline.

## Saves and language

The existing `burgherr_v4_cg` local-storage key is retained. Version 6 migrates buildings, workers, resources, units, trade settings, upgrades and renown in place. New resources start at zero; old negative inventory artifacts are clamped to zero. The language selection remains in `stronhold_language`. No save reset is required.

## Tests

Run with Node.js:

```sh
node --test tests/economy.test.cjs
```

The tests use the actual inline game script in an isolated VM. They cover trading, reserves, capacity, production accounting, empty-food recovery, staffing, fixed recipes, leather equipment, renown, migration, offline progress and both language paths. UI render tests use a lightweight DOM double and are not a substitute for a real-browser layout check.
