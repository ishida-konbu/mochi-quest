# Mochi Quest 開発ガイド

Mochi Quest 2 の開発計画は [実装ロードマップ](mochi-quest-llm-wiki/wiki/implementation-roadmap.md) を正本とする。

- 開発を始める前に、[設計Wikiの索引](mochi-quest-llm-wiki/wiki/index.md)、ロードマップ、[設計決定](mochi-quest-llm-wiki/wiki/decisions.md) を参照し、今回の変更に関係する設計ページと完了条件を確認する。
- ユーザーの最新の依頼を優先する。既存の計画と異なる決定があれば、その経緯と影響範囲を記録する。
- 方針や優先順位が変わったらロードマップと該当する設計ページを更新する。完了条件を満たした作業には検証結果を添え、残作業はその状態が分かるようにする。
- Wikiを編集するときは [Wikiの運用ガイド](mochi-quest-llm-wiki/AGENTS.md) に従い、関係する変更を [変更ログ](mochi-quest-llm-wiki/wiki/log.md) に追記する。

## Local-first implementation and orchestration

- Default to local development in a dedicated branch or worktree. Read [the development workflow](docs/codex-development.md) before implementing; read [the quality review protocol](docs/codex-quality-review.md) for changes that affect gameplay, visuals, dialogue, or camera.
- Use the approved Wiki as the normative design. Implement dependency-aware, playable vertical slices; dynamically delegate only when it materially improves quality or execution. Use the project-scoped Codex configuration and specialist roles where available. Avoid recursive delegation and conflicting concurrent file edits.
- Run the applicable tests, build, and real local browser validation. For a phase-wide or cross-cutting visual/gameplay milestone, independently run all seven specialist reviews; for narrow changes, select the impacted lenses and record why others are not applicable. Explicit phase acceptance requirements take precedence over the default review scope.
- Keep all game implementation, playtesting, evidence, and fixes local until the owner explicitly approves release of the identified revision. Do not push, open a PR, merge, deploy, change production resources, enable paid services, or use production credentials during local implementation. A request to implement is not a request to publish. Local commits, if authorized, are not publication.
- Do not weaken acceptance criteria, hide material defects, fabricate execution evidence, or substitute a source-code review for rendered gameplay. Stop at a playable local handoff, not at a production deployment.
