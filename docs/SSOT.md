# SSOT — Sophia (Single Source of Truth)

> This is the canonical guide for the Sophia MVP. Treat this as **law**. If any other document conflicts, **this wins**.

---

## 0) TL;DR

* **Value prop**: *Plan → Do → Prove* for homeschoolers aligned to the Australian Curriculum.
* **Stack**: Node/Express, MySQL, Sequelize (repos/services), Firebase Auth (or mock), Puppeteer for PDF, S3/MinIO for evidence.
* **Run everything**:

```bash
make up && cd backend && npm ci && npm run build && npm run migrate && npm run seed && npm run test:accept
```

* **Quick smoke**: `make greenpath` (5‑minute end‑to‑end), see §12.

### How to use this doc (Codex quick-start)

* Each feature below lists **routes → controllers → services → repos** and **acceptance tests**.
* Follow **AGENTS.md** for guardrails (determinism, RBAC, privacy, minimal diffs).

### Doc Index (Canvas → What to open)

**OpenAPI patches**: *Sophia — Evidence Upload (API + FE Stub)*, *Sophia — Quizzes for Retention (DDL + API + Planner Hook)*, *Pilot Readiness — PDF Reports, Onboarding, Signed Reads, Nudges, Paywall*.
**RBAC**: *Pilot Readiness — Acceptance Specs + Paywall Wiring* (additions) and §4 here (canonical).
**Acceptance tests**: listed in §10; detailed in *Pilot Readiness — Acceptance Specs + Paywall Wiring* and the feature‑specific docs above.
**Agents**: *AGENTS.md (Repo Root) + Makefile Greenpath*.

---

## 1) Architecture Snapshot

* **Backend**: Express app with layered **routes → controllers → services → repos**; logging with requestId; Zod validation.
* **Data**: MySQL 8 with UUID v4 keys (pre‑generated in Node). **Migrations are canonical.**
* **Auth/RBAC**: Firebase (or mock JWT in tests). `requireOrgScope` and `requireSubscription(feature)` guard protected routes.
* **Adapters**: AI providers behind a small interface; **MockAdapter** passes conformance tests.
* **Artifacts**: Evidence in S3/MinIO (signed PUT/GET). Reports rendered HTML→PDF via Puppeteer.
* **Planning Lite**: heuristic weekly plan from targets/constraints (deterministic greedy fill).
* **Quizzes (Retention)**: micro‑reviews tied to outcomes; spaced by planner hook.
* **Nudges**: low coverage / missed slots / low retention suggestions.
* **Paywall**: thin subscription table + middleware; seed grants trial.

---

## 2) Environment & Services

Create `backend/.env` from `.env.example`. Required keys:

```
TZ=Australia/Adelaide
# Storage
STORAGE_DRIVER=s3
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=sophia-evidence
S3_ACCESS_KEY=dev
S3_SECRET_KEY=dev
EVIDENCE_ALLOWED_MIME=image/jpeg,image/png,application/pdf,video/mp4
EVIDENCE_MAX_BYTES=10485760
EVIDENCE_SIGNED_GET_TTL_MIN=5
# Reports/PDF
REPORTS_PDF_ENABLED=true
REPORTS_PDF_LOCALE=en-AU
# Billing
BILLING_ENABLED=true
TRIAL_DAYS=14
PLAN_HOMESCHOOL_MONTHLY=homeschool_monthly
```

**Podman/Docker**: `make up` starts MySQL (+ optional MinIO). Puppeteer uses bundled Chromium or CI image with Chrome.

---

## 3) Database (Canonical Schema)

> **Migrations are the source of truth:** `backend/src/db/migrations/**`

**Core**: `orgs`, `users`, `org_members`, `login_identities`, `student_profiles`

**Curriculum**: `learning_outcomes`, `knowledge_nodes`, `node_outcomes`, `hub_ethos`, `org_preferences`, `feature_flags`

**Flow**: `activities`, `activity_outcomes`, `tasks`, `task_instances`, `rubrics`, `submissions`

**Review**: `evaluations`, `evaluation_deltas`, `quizzes`, `quiz_items`, `quiz_attempts`

**Planning**: `plans`, `plan_slots`, `plan_templates`

**Media**: `evidence`

**Assist**: `nudges`

**Billing**: `subscriptions`

**Rules**: IDs are **UUID v4** generated in Node; avoid SQL `RETURNING`. Timestamps in UTC; enforce `TZ=Australia/Adelaide` for tests.

---

## 4) RBAC Policy (YAML summary)

> Canonical file: `docs/rbac/matrix.yaml`

```
POST /plans/generate              → supervisor, mentor, student
GET  /plans/:id                   → supervisor, mentor, student
PATCH /plans/:id/slot/:slotId     → supervisor, mentor, student

POST /evidence/signed-url         → supervisor, mentor, student
POST /evidence                    → supervisor, mentor, student
GET  /submissions/:id/evidence    → supervisor, mentor, student

POST /quizzes/generate            → supervisor, mentor, student
GET  /quizzes/:id                 → supervisor, mentor, student
POST /quizzes/:id/submit          → supervisor, mentor, student

POST /onboarding/start            → public, supervisor
GET  /onboarding/:id              → supervisor, mentor, student

GET  /nudges                      → supervisor, mentor, student
POST /admin/nudges/run            → supervisor
```

**Paywall**: require `requireSubscription(feature)` for **planning, evidence, quizzes, reports**.

---

## 5) OpenAPI & SDK

* **Spec**: `docs/openapi/sophia-api.yaml` (single source). Keep in sync with controllers.
* **TS SDK**: `backend/sdk/ts` → `npm run sdk:gen` regenerates types after spec changes.
* Every route must have Zod schemas
  that match the OpenAPI shapes.

---

## 6) Features & Endpoints (with code pointers)

### 6.1 Planning Lite

* **POST** `/plans/generate` → weekly plan from `targets`/`constraints` (+ optional `include_review`).
* **GET** `/plans/{id}` → slots + coverage JSON.
* **PATCH** `/plans/{id}/slot/{slotId}` → `done|skipped|moved|replaced`.
* **Code**: `src/routes/plans.ts` → `controllers/plans.controller.ts` → `services/planner.service.ts`.
* **Notes**: Deterministic greedy fill (no randomness), 09:00 start, 30‑min blocks by index.
* **Tests**: `tests/acceptance/plans.spec.ts` (or included in onboarding/greenpath).

### 6.2 Tasks & Submissions

* **POST** `/tasks/instances` → create instance (ad‑hoc task if no task_id).
* **PUT** `/tasks/instances/{id}/rubric` → set rubric; **POST** `/rubric/lock` → immutable thereafter.
* **POST** `/tasks/instances/{id}/submissions` → create submission.
* **Code**: `routes/tasks.ts` → `controllers/tasks.controller.ts` → `services/tasks.service.ts` → `repos/task.repo.ts`.
* **Tests**: in greenpath and any task lifecycle spec.

### 6.3 Evidence (signed upload + private viewing)

* **POST** `/evidence/signed-url` → presigned PUT for uploads (MIME/size policy).
* **POST** `/evidence` → finalize metadata for a submission.
* **GET** `/submissions/{id}/evidence` → **signed GET** URLs for safe viewing.
* **Code**: `routes/evidence.ts` → `controllers/evidence.controller.ts` → `services/evidence.service.ts` → `services/storage.ts`.
* **Tests**: `tests/acceptance/evidence-upload.spec.ts`, `tests/acceptance/evidence-signed-get.spec.ts`.

### 6.4 Quizzes (Retention)

* **POST** `/quizzes/generate` → items from recent outcomes.
* **GET** `/quizzes/{id}` → item list.
* **POST** `/quizzes/{id}/submit` → scored results + `retention_index`.
* **Code**: `routes/quizzes.ts` → `controllers/quizzes.controller.ts` → `services/quizzes.service.ts` → `ai/adapters/*`.
* **Tests**: `tests/acceptance/quizzes-review.spec.ts`.

### 6.5 Reports (HTML → PDF)

* **POST** `/reports/run` → returns `artifact_url` (HTML or `.pdf` when enabled).
* **Code**: `routes/reports.ts` → `services/reports.service.impl.ts` + `services/report_pdf.service.ts`.
* **Tests**: `tests/acceptance/reporting-pdf.spec.ts`.

### 6.6 Onboarding (10‑minute path)

* **POST** `/onboarding/start` → creates org + supervisor + student; seeds first plan + baseline quiz.
* **GET** `/onboarding/{id}` → `step` and `next`.
* **Code**: `routes/onboarding.ts` → `services/onboarding.service.ts`.
* **Tests**: `tests/acceptance/onboarding.spec.ts`.

### 6.7 Nudges

* **POST** `/admin/nudges/run` (test‑only) → compute nudges.
* **GET** `/nudges` → list for current student.
* **Code**: `routes/nudges.ts` (+ `routes/admin.ts` trigger) → `services/nudges.service.ts`.
* **Tests**: `tests/acceptance/nudges.spec.ts`.

### 6.8 Paywall

* Middleware: `requireSubscription('reports'|'planning'|'evidence'|'quizzes')`.
* **Apply** to reports, plans, evidence, quizzes.
* **Tests**: `tests/acceptance/paywall.spec.ts`.

---

## 7) Adapter Interface (AI providers)

Adapters must implement:

```
generateTask(input)
evaluate(input)
summarizeSession(input)
# Retention
generateQuiz({ outcomes, size })
scoreQuiz({ items, responses })
```

* **MockAdapter** provides deterministic fixtures and must pass conformance tests.
* **Location**: `src/ai/routing/policy.ts`, `src/ai/adapters/mock.adapter.ts`.

---

## 8) Determinism & Security

* **Planner**: no `Math.random`; schedule derived from index (09:00 + n×30min).
* **PDF**: inline fonts/print CSS; do not embed dynamic timestamps beyond ISO.
* **Privacy**: redact signed URL query strings in logs; never log quiz responses at `info`.
* **TZ/Locale**: `TZ=Australia/Adelaide`, `en-AU`.

---

## 9) Seeds & Trial Subscription

* Seed creates canonical `ORG` and **trial** row in `subscriptions` with `trial_ends_at = NOW()+TRIAL_DAYS`.
* Optional: seed one evidence stub for signed‑GET tests.
* **File**: `backend/scripts/seed.ts`.

---

## 10) Acceptance Suite (green map)

* **Onboarding** → `tests/acceptance/onboarding.spec.ts`
* **Evidence** → `tests/acceptance/evidence-upload.spec.ts`, `evidence-signed-get.spec.ts`
* **Quizzes (Retention)** → `tests/acceptance/quizzes-review.spec.ts`
* **Nudges** → `tests/acceptance/nudges.spec.ts`
* **Paywall** → `tests/acceptance/paywall.spec.ts`
* **Reports (PDF)** → `tests/acceptance/reporting-pdf.spec.ts`
* **Planning Lite** → covered via onboarding/greenpath or `plans.spec.ts` if present

Run all:

```bash
npm run test:accept
```

---

## 11) CI Notes

* Use a node image with Chromium or install via Puppeteer steps; set `REPORTS_PDF_ENABLED=true` on that job.
* Always set `TZ=Australia/Adelaide` for stable times.
* Optional: start MinIO via compose; tests don’t require actual PUT success for signed‑GET listing.

---

## 12) 5‑Minute Green Path

* Script: `backend/scripts/greenpath.sh` (cURL sequence).
* Make target: `make greenpath` runs build → migrate → seed → smoke.
* Mirrors acceptance suite behaviors for human validation.

---

## 13) Doc Inventory — Keep vs Archive

**Keep**: this SSOT, OpenAPI (`docs/openapi/sophia-api.yaml`), RBAC (`docs/rbac/matrix.yaml`), migrations, seeds, acceptance tests, adapter mock, CI notes, AGENTS.md, Makefile.

**Archive** (content merged here): Planning Lite doc, Evidence Upload doc, Quizzes for Retention doc, Pilot Readiness docs (PDF/Onboarding/Signed Reads/Nudges/Paywall + Acceptance/Paywall Wiring), Final Integration Patch, 5‑Minute Green Path standalone, Sequelize Models.

> If you keep legacy docs for history, move them into `docs/_archive/`.

---

## 14) Contribution Rules (for Codex & humans)

* Update OpenAPI then run SDK gen when touching APIs.
* Keep controllers thin; apply RBAC + Paywall consistently.
* Pre‑gen UUIDs; avoid SQL `RETURNING`.
* Deterministic outputs; redact sensitive URLs in logs.
* PR must include **What/Why/Verify/Risks** (see AGENTS.md template).
