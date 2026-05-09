# CLAUDE.md

Read `AGENTS.md` first. It is the canonical instruction file for Claude, Codex, Cursor, Cline, and any other coding agent working in this repo.

@AGENTS.md

Claude-specific reminders:

- Treat `docs/specs/*.md` and `docs/specs/15-doc-refresh-plan.md` as canon.
- Do not reintroduce PostGIS, Redis/BullMQ, PWA/Web Push as MVP, filesystem uploads, fake Strava credit, or group-only event chat.
- If a request conflicts with the current specs, pause and surface the exact conflict before writing code.
- Keep commits small and conventional. Do not bypass hooks without explicit user approval.
- For audits, lead with concrete findings and file references; do not turn stretch ideas into committed scope unless the specs are updated too.
