#!/usr/bin/env bash
set -euo pipefail

# Sophia 5‑Minute Green Path — idempotent smoke test
# Mirrors the SSOT §12 sequence. Requires backend running at http://localhost:3000
# Usage: bash backend/scripts/greenpath.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
TZ=${TZ:-Australia/Adelaide}
export TZ

jq_present() { command -v jq >/dev/null 2>&1; }
base64_wrap() { if base64 --help 2>&1 | grep -q "--wrap"; then base64 --wrap=0; else base64 -w0 2>/dev/null || base64; fi; }

ORG=${ORG:-11111111-1111-1111-1111-111111111111}
SUP=${SUP:-22222222-2222-2222-2222-222222222222}
STU=${STU:-33333333-3333-3333-3333-333333333333}

auth_header() {
  local user="$1"; local role="$2";
  if jq_present; then
    local payload; payload=$(jq -nc --arg orgId "$ORG" --arg userId "$user" --arg role "$role" '{orgId:$orgId,userId:$userId,role:$role}');
    printf "Authorization: Bearer test.%s.sig" "$(printf '%s' "$payload" | base64_wrap)"
  else
    # Fallback: static token (the server should accept any bearer in dev/mock)
    printf "Authorization: Bearer test.eyJvcmdJZCI6IiQxIiwidXNlcklkIjoiJDIiLCJyb2xlIjoiJDMifQ.sig" "$ORG" "$user" "$role"
  fi
}

say() { printf "\n\033[1;34m▶ %s\033[0m\n" "$*"; }
ok() { printf "\033[0;32m✓ %s\033[0m\n" "$*"; }
fail() { printf "\033[0;31m✗ %s\033[0m\n" "$*"; exit 1; }

# 1) Onboarding
say "Onboarding: org + supervisor + student + baseline quiz"
ONB=$(curl -sS -X POST "$BASE_URL/onboarding/start" -H 'Content-Type: application/json' \
  -d '{"org_name":"Pilot Org","supervisor_name":"Parent Pat","student_display_name":"Learner Lee"}')
ONB_ID=$(printf '%s' "$ONB" | jq -r '.id // empty')
FIRST_QUIZ_ID=$(printf '%s' "$ONB" | jq -r '.first_quiz_id // empty')
[[ -n "$ONB_ID" ]] || fail "onboarding/start did not return id"
ok "onboarding/start → id=$ONB_ID, first_quiz_id=$FIRST_QUIZ_ID"

# 2) Planning Lite
say "Planning Lite: generate plan for week"
WEEK_START=$(date -I)
PLAN=$(curl -sS -X POST "$BASE_URL/plans/generate" \
  -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' \
  -d '{"org_id":"'$ORG'","student_user_id":"'$STU'","week_start":"'$WEEK_START'","targets":{"Maths":{"minutes":60},"English":{"minutes":60}},"include_review":true}')
PLAN_ID=$(printf '%s' "$PLAN" | jq -r '.id // empty')
SLOT_ID=$(printf '%s' "$PLAN" | jq -r '.slots[0].id // empty')
[[ -n "$PLAN_ID" && -n "$SLOT_ID" ]] || fail "plan generation did not return id/slot"
ok "plan → id=$PLAN_ID slot[0]=$SLOT_ID"

# 3) Task instance + rubric + submission
say "Task instance + rubric + submission"
TI=$(curl -sS -X POST "$BASE_URL/tasks/instances" -H "$(auth_header "$SUP" supervisor)" -H 'Content-Type: application/json' \
  -d '{"org_id":"'$ORG'","student_user_id":"'$STU'","title":"Number facts practice","description":"30‑min warmup"}')
TI_ID=$(printf '%s' "$TI" | jq -r '.id // empty')
[[ -n "$TI_ID" ]] || fail "task instance creation failed"

curl -sS -X PUT "$BASE_URL/tasks/instances/$TI_ID/rubric" -H "$(auth_header "$SUP" supervisor)" -H 'Content-Type: application/json' \
  -d '{"criteria":[{"key":"accuracy","scale":"0-4"},{"key":"fluency","scale":"0-4"}]}' >/dev/null
curl -sS -X POST "$BASE_URL/tasks/instances/$TI_ID/rubric/lock" -H "$(auth_header "$SUP" supervisor)" >/dev/null
SUB=$(curl -sS -X POST "$BASE_URL/tasks/instances/$TI_ID/submissions" -H "$(auth_header "$STU" student)")
SUB_ID=$(printf '%s' "$SUB" | jq -r '.id // empty')
[[ -n "$SUB_ID" ]] || fail "submission creation failed"
ok "submission → id=$SUB_ID"

# 4) Evidence: presign + finalize + list
say "Evidence: presign → finalize → list"
PRE=$(curl -sS -X POST "$BASE_URL/evidence/signed-url" -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' \
  -d '{"submission_id":"'$SUB_ID'","filename":"work.jpg","content_type":"image/jpeg","bytes":1024}')
OBJ=$(printf '%s' "$PRE" | jq -r '.object_key // empty')
[[ -n "$OBJ" ]] || fail "presign did not return object_key"

curl -sS -X POST "$BASE_URL/evidence" -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' \
  -d '{"submission_id":"'$SUB_ID'","type":"file","object_key":"'$OBJ'","content_type":"image/jpeg","bytes":1024}' >/dev/null

LIST=$(curl -sS -X GET "$BASE_URL/submissions/$SUB_ID/evidence" -H "$(auth_header "$STU" student)")
URL=$(printf '%s' "$LIST" | jq -r '.data[0].url // empty')
[[ -n "$URL" ]] || fail "evidence list missing url"
ok "evidence list → first url present"

# 5) Quiz: generate → get → submit
say "Quiz: generate → get → submit"
QZ=$(curl -sS -X POST "$BASE_URL/quizzes/generate" -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' \
  -d '{"org_id":"'$ORG'","student_user_id":"'$STU'","from_days":30,"size":5}')
QZ_ID=$(printf '%s' "$QZ" | jq -r '.id // empty')
[[ -n "$QZ_ID" ]] || fail "quiz generation failed"

ITEMS=$(curl -sS -X GET "$BASE_URL/quizzes/$QZ_ID" -H "$(auth_header "$STU" student)")
RESP=$(printf '%s' "$ITEMS" | jq '{responses: (.items | map({item_id: .id, response: (if .item_type=="mcq" then .choices[0] else "my answer" end) })) }')
RES=$(curl -sS -X POST "$BASE_URL/quizzes/$QZ_ID/submit" -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' -d "$RESP")
RI=$(printf '%s' "$RES" | jq -r '.retention_index // empty')
[[ -n "$RI" ]] || fail "quiz submit returned no retention_index"
ok "quiz retention_index = $RI"

# 6) Planning recovery + nudges
say "Planning recovery: mark slot skipped and run nudges"
curl -sS -X PATCH "$BASE_URL/plans/$PLAN_ID/slot/$SLOT_ID" -H "$(auth_header "$STU" student)" -H 'Content-Type: application/json' -d '{"status":"skipped"}' >/dev/null

curl -sS -X POST "$BASE_URL/admin/nudges/run" -H "$(auth_header "$SUP" supervisor)" >/dev/null
NDG=$(curl -sS -X GET "$BASE_URL/nudges" -H "$(auth_header "$STU" student)")
COUNT=$(printf '%s' "$NDG" | jq -r '.data | length')
[[ "$COUNT" != "null" ]] || fail "nudges list failed"
ok "nudges count = $COUNT"

# 7) Report (PDF if enabled)
say "Reports: run ACARA term summary"
RPT=$(curl -sS -X POST "$BASE_URL/reports/run" -H "$(auth_header "$SUP" supervisor)" -H 'Content-Type: application/json' \
  -d '{"org_id":"'$ORG'","template_key":"acara-term-summary"}')
ART=$(printf '%s' "$RPT" | jq -r '.artifact_url // empty')
[[ -n "$ART" ]] || fail "reports/run returned no artifact_url"
ok "report artifact_url = $ART"

say "All good — green path completed."
