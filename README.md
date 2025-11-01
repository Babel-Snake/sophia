README.md
Sophia — Plan → Do → Prove (MVP)

Personalised tutoring + assessment for homeschoolers aligned to the Australian Curriculum. Students plan tasks, do real‑world work, and prove learning with evidence, quizzes, and curriculum‑aligned reports.

Status: MVP scaffolding ready for agentic build (Codex). See docs/SSOT.md for the canonical spec.

Features (MVP)

Planning Lite: weekly plan from targets/constraints (deterministic).

Tasks → Rubrics → Submissions: learner‑led goals with measurable criteria.

Evidence: secure upload (presigned PUT) + private viewing (signed GET).

Quizzes (Retention): micro‑reviews tied to outcomes; retention index.

Reports: HTML → PDF (ACARA‑aligned summary).

Onboarding: 10‑minute path (org + supervisor + student + baseline quiz).

Nudges: low coverage, missed slots, low retention.

Paywall: gated features via subscription (trial seeded for tests).

Architecture

Backend: Node/Express, Sequelize (MySQL), layered routes → controllers → services → repos, Zod validation, logger with requestId.

Auth: Firebase (prod) or mock JWT (tests/dev).

Storage: S3/MinIO for evidence artifacts.

PDF: Puppeteer → HTML to PDF.

AI: adapter interface (model‑agnostic); MockAdapter for tests.

See docs/SSOT.md and docs/openapi/sophia-api.yaml.

Repo layout
backend/
  scripts/greenpath.sh       # 5‑minute smoke
  tests/acceptance/*         # Jest + Supertest acceptance suite
  .env.example               # copy to .env
Makefile                     # up, migrate, seed, test:accept, greenpath
/docs
  SSOT.md
  openapi/sophia-api.yaml
  rbac/matrix.yaml
Quickstart (dev)
cp backend/.env.example backend/.env
make up           # start DB (and MinIO if present)
make migrate      # apply migrations
make seed         # seed canonical org + trial
make test:accept  # run acceptance suite
make greenpath    # 5‑minute end‑to‑end smoke

Podman is supported automatically; override with COMPOSE="docker compose" make up if needed.

Environment

Key variables live in backend/.env (see .env.example).

TZ=Australia/Adelaide, REPORTS_PDF_ENABLED=true, BILLING_ENABLED=true

Storage driver and S3/MinIO credentials

Auth provider (mock in dev/tests; firebase in prod)

OpenAPI & SDK

Canonical spec: docs/openapi/sophia-api.yaml

Keep controllers in sync and run SDK gen when the spec changes:

cd backend && npm run sdk:gen
CI & Branch Protection

Workflow: .github/workflows/ci.yml runs acceptance tests.

Public repo → enable Branch protection on main: require PR, 1 approval, CI green, up‑to‑date branch.

Working with Codex (agentic build)

Create issues mapping 1:1 to acceptance specs.

In a ChatGPT Project, pin docs/SSOT.md, AGENTS.md, OpenAPI, RBAC, and tests.

Instruct Codex: Plan → propose diffs → run make test:accept → open PR. You approve merges.

License

Business Source License 1.1 (Change Date: 2029‑10‑24 → GPL‑2.0). See LICENSE.

Security

Do not commit secrets. See SECURITY.md for reporting.

Credits

© 2025 Jacob Smith. See LICENSE for terms.
Small test change to verify PR + CI wiring.
