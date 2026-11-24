# Agent instructions — Mochi Quest living-world wiki

This is a design and knowledge-maintenance guide, not a replacement for repository-level instructions. Follow any applicable parent or repository instructions first. Do not overwrite a repository's existing AGENTS.md. The normative design prose is Japanese; preserve the Japanese user-facing language and existing names.

## Read before implementation

1. Read `SCHEMA.md`, `wiki/index.md`, `wiki/game-vision.md`, and `wiki/decisions.md`.
2. Read `wiki/current-repository.md`, `wiki/architecture.md`, `wiki/save-and-migration.md`, `wiki/implementation-roadmap.md`, and `wiki/acceptance-tests.md`.
3. Open only relevant system pages and their dependencies; do not load the entire wiki for a narrow change.
4. Inspect actual HEAD, relevant code, tests, build and deployment config before editing. The recorded commit is historical evidence, not a claim about current HEAD. Record discrepancies in the wiki without silently treating assumptions as facts.

## Scope and non-negotiable rules

- Implement game systems before writing or replacing the main storyline. The festival premise and two secret regions are fixed; the incident, culprit, political explanation, final verdict and ending are not. Do not invent them as canonical facts.
- Preserve existing world art, traversal, delivery, stamp collection, modes, mounts, baths, landmarks, photos, music, save transfer and mobile controls unless a specific approved requirement changes them.
- All new systems must be optional pathways to play. No forced daily logins, real-time penalties, destructive survival timers, mandatory economic grind, or all-NPC completion gates.
- Use deterministic, testable domain rules for resources, crafting, market, time, NPC knowledge, quest progress and saves. Generative AI may provide only names, product descriptions and NPC tasting reactions. Never allow generated content to modify or invent gameplay state, story facts, secret knowledge or item attributes. Always provide a local fallback.
- Do not add external runtime inference or a paid dependency without explicit configuration and cost controls. Default gameplay must work without network AI or model downloads.
- Prefer the existing browser/Three.js architecture, ES modules, repo test conventions, small dependency-free modules and data-driven definitions. Reuse existing scenery and code; do not rebuild the renderer or introduce a new framework merely to implement the design.
- Use stable IDs, explicit units, validation, atomic state transitions, seeded deterministic behavior when needed, and backwards-compatible persistence. Preserve unknown legacy data until migration is validated. Never silently overwrite a playable save on validation failure.
- Implement in vertical slices with visible playable behavior. Avoid audit-only phases, unrequested refactors, massive speculative scaffolding or blanket rewrites. Do not implement a later phase simply because it is described here.

## Execution workflow

- Determine the active phase and read its acceptance criteria. If a [DESIGN] tuning value is required, use the proposed default and document any change. A blocking [OPEN] decision must be surfaced; avoid choosing story canon, paid infrastructure, destructive migration or major visual changes without approval. For reversible technical choices, take the smallest safe approach and report it.
- Add or update pure domain tests with the existing `node --test` convention. Run `npm test` and the applicable build/smoke tests; test actual play on desktop and touch where possible. Never claim a test was run if it was not.
- Work on a bounded diff; no production deployment, paid service activation, or main-branch push unless explicitly requested. Keep experiments behind safe feature/config switches when appropriate.
- At handoff, report changed files, tested behavior, commands and results, migration impact, known limitations, unverified criteria, and recommended next phase. Keep the game playable if the phase is incomplete.

## Wiki operations

- Ingest: append a new immutable note under `raw/` for new user direction or evidence; update affected design pages, decisions, index and append log. Never rewrite earlier raw sources.
- Query: read index, follow relevant links, answer from the current owner pages and cite IDs/paths; distinguish current design, baseline and implementation evidence. Do not mutate wiki for ordinary questions unless asked.
- Update: edit the owning page of a rule, not multiple independent copies; check all dependent links and tests. Preserve stable page paths and requirement IDs, update the page's date/status and append one log entry.
- Lint: check links, duplicate IDs, contradictory rules, units, secret-knowledge leaks, stale baseline facts and orphan pages. Do not perform broad audits unrelated to the changed surface. A lint report is not implementation evidence.

See `SCHEMA.md` for page conventions, authority and conflict handling.
