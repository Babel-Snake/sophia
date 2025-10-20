# AGENTS.md — Sophia Coding Agents

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
