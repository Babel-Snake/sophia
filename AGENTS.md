# AGENTS.md — Sophia Coding Agents

> One‑pager for Codex (and similar coding agents). Put **this file at repo root**. Agents should read it **before** editing code.

## Mission

Ship a reliable MVP for **Sophia** (Plan → Do → Prove) with acceptance tests green and a stable trial paywall.

## Golden Rules

1. **Follow the SSOT:** `docs/SSOT.md` is the single source of truth. If anything conflicts, **SSOT wins**.
2. **Tests first:** Your goal is to make specific tests in `backend/tests/acceptance/**` pass **without weakening them**.
3. **Migrations are canonical:** DB schema is defined by migrations under `backend/src/db/migrations/**`. Pre‑generate UUIDs (no SQL `RETURNING`).
4. **Determinism:** No randomness in planning or scoring; PDF output path must be predictable.
5. **Security:** Never log full signed URLs or quiz responses at `info` level. Respect RBAC and paywall middleware.
6. **Minimal diffs:** Enumerate files you’ll change, then keep edits small and well‑commented. Add unit/acceptance tests when fixing bugs.

## Repo Conventions

* **Backend:** Node 18+, Express, Sequelize (repos/services pattern), MySQL.
* **Auth/RBAC:** `src/middleware/{auth,rbac}.ts`. Require `requireOrgScope` and `requireSubscription(feature)` on protected routes.
* **Logging:** Use the shared logger; include `requestId` in logs.
* **Adapters:** Implement `src/ai/routing/policy.ts` contract. Mock adapter must always pass conformance tests.

## Do / Don’t

**Do**

* Keep controllers thin; put logic in services.
* Add Zod validation for every request body.
* Update **OpenAPI** (`docs/openapi/sophia-api.yaml`) and run SDK gen when API changes.

**Don’t**

* Don’t change acceptance test intent nor comment out expectations.
* Don’t introduce nondeterministic time/date logic (use locale `en-AU`, `TZ=Australia/Adelaide`).

## Workflow (every task)

1. **Plan**: Quote the exact tests to satisfy and list files to touch.
2. **Diff**: Propose concise diffs (summaries) before writing code.
3. **Run**: `make test:accept` and paste failing lines; iterate.
4. **Explain**: In PR, include risk notes and rollback plan.

## Commands agents may run

```bash
make up             # start services
make migrate        # apply migrations
make seed           # seed canonical org + trial sub
make test:accept    # run acceptance suite
make greenpath      # 5-minute end-to-end smoke (see Makefile snippet below)
```

## Paywall & Privacy

* Protected features: **planning, evidence, quizzes, reports**. Use `requireSubscription(feature)`.
* Never expose raw object keys or signed URLs in logs or client messages.

---

# Makefile — add `greenpath`

> Append the following target to your repo `Makefile`.

```makefile
greenpath:
	cd backend && \
	npm run build && \
	npm run migrate && \
	npm run seed && \
	REPORTS_PDF_ENABLED=true BILLING_ENABLED=true \
	bash ./scripts/greenpath.sh || true
```

Create `backend/scripts/greenpath.sh` with the cURL sequence from **SSOT §12** (5‑Minute Green Path). Keep it idempotent and exit 0 on success; non‑zero on failure.

---

## Minimal PR Template (agents must use)

```md
### What changed
- Short bullet list of diffs.

### Why
- Which acceptance test(s) and user story.

### How to verify
- Commands to run (`make test:accept`, optional `make greenpath`).

### Risk & rollback
- Risk level (low/med/high), affected routes, rollback steps.
```

## Contact

If a route, schema, or adapter detail is unclear, quote the relevant **SSOT** section and ask for a clarification before editing code.

---

## Project Instructions (paste into ChatGPT Project)

Use this exact block in your Project → *Project instructions* so the agent always follows the same rules.

```text
You are the Sophia coding agent. Law: docs/SSOT.md and AGENTS.md. Goal: make acceptance tests in backend/tests/acceptance/** pass without weakening them.
Workflow per issue: (1) PLAN — quote relevant SSOT sections; list files to touch. (2) DIFFS — propose concise diffs. (3) RUN — make test:accept; paste failing lines; iterate. (4) PR — fill the PR template (diffs, why, how to verify, risk & rollback).
Constraints: migrations are canonical; pre-generate UUIDs; deterministic output; do not log signed URLs or quiz responses; enforce RBAC + paywall; keep controllers thin and logic in services; update OpenAPI + run sdk:gen when API changes; redact secrets.
```

## Permissions Ladder (what to request and when)

1. **Read** repo + run static analysis.
2. **Edit** only the files enumerated in PLAN.
3. **Run** commands: `make up`, `make migrate`, `make seed`, `make test:accept`, `make greenpath`.
4. **PR** creation with the PR template. **Never merge** without human approval.

## Stop Conditions (agent must halt & ask)

* OpenAPI vs controller mismatch it cannot reconcile.
* Attempting to modify acceptance test **intent**.
* Any change that would leak secrets/signed URLs or weaken paywall/RBAC.
* Non-deterministic output introduced (time/random IO without seeding).

## Secrets & Privacy

* Do not print `.env` values or signed URL query strings in logs or PRs.
* Use redaction helpers; log only high-level resource identifiers.

## File-Touch Rules

* Controllers: wiring only. Validation in middleware/Zod. Keep under ~150 LOC if possible.
* Services: business logic + transactions. Unit-testable.
* Repos: DB access only; no business rules.
* Tests: never commented-out assertions; add tests when fixing bugs.
