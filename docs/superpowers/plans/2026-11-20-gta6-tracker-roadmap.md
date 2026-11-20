# GTA VI Tracker + Roadmap Round 3 Implementation Plan

> **For agentic workers:** Tasks below are tracked as checkable steps and implemented in order.

**Goal:** Make the offline 55-trophy guide safer around spoilers and more useful for prioritizing, roadmap planning, and visible evidence.

**Architecture:** Keep the existing static app structure and local storage. Add per-trophy watch metadata, render the new tiered Watch and roadmap from that data, and exercise browser behavior and screenshot states through the existing Playwright capture script.

**Tech Stack:** Vanilla JavaScript modules, HTML, CSS, JSON, Node.js, Playwright.

**Spec:** `/home/hatch/workspace/makefun/specs-gta6-trophy/2026-11-20-tracker-roadmap-design.md`

## Global Constraints

- Preserve all official trophy names, descriptions, grades, and hidden flags.
- Keep `missable: null` and `missableStatus: "unverified"` unchanged.
- Use only counts established by the supplied kit and trophy descriptions.
- Keep the app offline with no `http`/`https` references in `app/`.
- Do not edit `main.ts`, `LICENSE`, or `vendor/makefun-frontend.ts`.
- Make all source edits directly with write/edit tools; do not generate source files by script.

## Review Focus

- Concealed story fields must not be displayed or searchable until earned; browser assertions cover Watch and search.
- Missable filtering must return a proper subset while leaving every `missableStatus` unchanged; browser assertions count results.
- Every trophy needs a tier and grounded single-sentence reason; validate coverage and enum values.
- Screenshot capture must restore a deterministic initial state after browser tests; validate two image-hash runs.
- Roadmap counts and the two completion milestones must remain distinct; inspect the rendered roadmap and data-source constraints.

---

### Task 1: Spoiler-safe tracker and Watch

**Files:** `app/app.js`, `shots.mjs`

- [x] Add browser assertions first for concealed name/description non-matching, Missable subset, and spoiler masking.
- [x] Run `node shots.mjs` and confirm the assertions fail against the current implementation.
- [x] Filter search fields to exclude hidden story name, description, and guide while concealed; mask Watch descriptions as well as names.
- [x] Re-run the browser assertions for masked and earned states.

### Task 2: Watch metadata and tiered rendering

**Files:** `app/data/trophies.json`, `app/app.js`

- [x] Add `watchTier` and one-sentence `watchReason` to every trophy, grounded in its official description; keep null/unverified missable fields intact.
- [x] Render counted Confirmed, Check before advancing, and Unverified groups; infer checks cautiously and label replay availability unknown where unsupported.
- [x] Verify all 55 metadata records and that Missable displays only Confirmed + Check entries.

### Task 3: Roadmap and presentation

**Files:** `app/app.js`, `app/index.html`, `app/style.css`

- [x] Include only the sourced count of 3 card sets, 100 WAiNK locations, and 42 Shooting Range challenges; split 100% completion gold from the final platinum check.
- [x] Add labeled Import/Export controls, visible earned progress, and a visibly active kind filter.
- [x] Browser-check layout, control labels, progress, and separate footer milestones.

### Task 4: Evidence capture

**Files:** `shots.mjs`, `screenshots/01-checklist.jpg`, `screenshots/02-roadmap.jpg`, `screenshots/03-spoiler-pair.jpg`, `screenshots/04-missables.jpg`

- [x] Stage cover with labeled controls, progress, active filter, and open cited guide.
- [x] Stage a spoiler-on capture with masked and earned story trophies side by side.
- [x] Regenerate the four screenshots twice and compare hashes and image constraints.

### Task 5: Acceptance and commit

**Files:** all changes above

- [ ] Run `makefun check` (not run: round rules prohibit it).
- [x] Check 55 trophies, grades 1/2/6/46, 28 hidden, sources on 55/55, no `http`/`https` references in `app/`, and byte-identical dossier rebuild.
- [ ] Commit all changes in one commit authored as `makefun-agent` and report its hash and check result.

## Round 4 Evidence Update

- Keep location-specific routes, eligible pools, character rosters, and mission dependencies unclaimed: the available Exophase/PSNProfiles entries establish trophy text, grades, and selected progress targets, not an independently sourced walkthrough.
- Strengthen count- and condition-based guidance from the supplied list: 250 Stunts, 42 gold Shooting Range challenges, every Top Fun Drone Race location, 20 distinct race wins, 8 stranger strands, every meditation spot, 3 card sets, WAiNK It at 100 locations, 50 Challenges, the three-shop chain, 100 vehicle discoveries, five takedowns in one Combat Focus use, undetected jewelry-store robbery, five Bank Vault robberies with escapes, an Illegal Operation for each gang, $250,000 laundering, $100,000 shop spending, all garage properties, and 10 Scooter Bros registrations.
- Keep every `missableStatus` `unverified`; separate a cautious Check prompt from Confirmed, which remains empty without evidence of a one-time window.
- Show the listed source and its role beside the open guide. Roadmap text marks the sourced counts and character-strand unit while identifying the four legs as a planning aid, not a verified unlock order.
- Re-run browser coverage for concealed-name/description search and display, saved progress after reload, progress export/import, the 55-row baseline, three distinct Watch states, sourced guide rendering, roadmap milestones, zero non-local requests and zero page errors; regenerate all four captures and inspect their size/dimensions.
