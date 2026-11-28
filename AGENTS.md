## Project environment

- **TypeScript first, always with Bun.** Use `bun` / `bunx` for TypeScript runtime, package management, scripts, tests, and tooling. Do not introduce npm, pnpm, or Yarn workflows unless Bun cannot support the requirement and the exception is documented.
- **Python only for gaps that TypeScript/Bun cannot reasonably solve.** Use `uv` for Python environments, dependencies, and execution (`uv add`, `uv run`); do not introduce pip, Poetry, or Conda workflows. The project uses Python **3.13**, pinned in `.python-version`. Use the project-local `.venv` created by `uv venv`; run Python with `uv run ...` so commands resolve to that environment. Activate `.venv/bin/activate` only for interactive shells; never use system `python` or `pip` for project work.
- Keep TypeScript and Python dependencies separated, and document why any Python tool is necessary for the task.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues for `Wade11s/llm-arch-components`. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five canonical default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Review tooling

For reference-image crops and single-figure visual checks, use `docs/agents/review-tooling.md`.
