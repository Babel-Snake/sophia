# Sophia Makefile — dev ergonomics for Codex & humans
# Usage: `make up`, `make migrate`, `make seed`, `make test:accept`, `make greenpath`

# Detect Podman vs Docker. Override with `make COMPOSE="docker compose" up` if desired.
COMPOSE ?= $(shell command -v podman >/dev/null 2>&1 && echo "podman compose" || echo "docker compose")
BACKEND := backend
ENV ?= $(BACKEND)/.env

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "Targets:"
	@echo "  make up              # start services (MySQL, MinIO if present)"
	@echo "  make down            # stop services"
	@echo "  make logs            # follow container logs"
	@echo "  make build           # npm install + build backend"
	@echo "  make migrate         # run DB migrations"
	@echo "  make seed            # seed canonical org + trial subscription"
	@echo "  make test:accept     # run acceptance suite"
	@echo "  make greenpath       # 5-minute end-to-end smoke"

.PHONY: up
up:
	$(COMPOSE) up -d

.PHONY: down
down:
	$(COMPOSE) down -v

.PHONY: logs
logs:
	$(COMPOSE) logs -f --tail=200

.PHONY: build
build:
	cd $(BACKEND) && npm ci && npm run build

.PHONY: migrate
migrate: build
	cd $(BACKEND) && npm run migrate

.PHONY: seed
seed: migrate
	cd $(BACKEND) && npm run seed

.PHONY: test\:accept
test\:accept: seed
	# Ensure deterministic env for tests
	cd $(BACKEND) && TZ=Australia/Adelaide REPORTS_PDF_ENABLED=true BILLING_ENABLED=true npm run test:accept

# 5-minute E2E smoke. Requires backend/scripts/greenpath.sh (idempotent).
.PHONY: greenpath
greenpath: seed
	TZ=Australia/Adelaide REPORTS_PDF_ENABLED=true BILLING_ENABLED=true \
	bash $(BACKEND)/scripts/greenpath.sh || (echo "greenpath script missing or failed" && exit 1)
