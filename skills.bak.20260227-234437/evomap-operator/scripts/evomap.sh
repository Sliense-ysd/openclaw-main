#!/usr/bin/env bash
# shellcheck shell=bash
set -euo pipefail

EVOMAP_CREDS_FILE="${EVOMAP_CREDS_FILE:-$HOME/.openclaw/credentials/evomap.env}"
EVOMAP_OUTPUT_DIR="${EVOMAP_OUTPUT_DIR:-$HOME/.openclaw/workspace/skills/evomap-operator/runs}"
SNAP_LIMIT="${SNAP_LIMIT:-320}"
WAIT_MS="${WAIT_MS:-3500}"

RUN_ID="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$EVOMAP_OUTPUT_DIR/run-$RUN_ID"
mkdir -p "$RUN_DIR"

log() { printf '[evomap] %s\n' "$*"; }
die() { printf '[evomap] ERROR: %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

load_creds() {
  if [[ -f "$EVOMAP_CREDS_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$EVOMAP_CREDS_FILE"
    set +a
  fi
}

require_creds() {
  load_creds
  [[ -n "${EVOMAP_EMAIL:-}" ]] || die "EVOMAP_EMAIL is empty (set env or $EVOMAP_CREDS_FILE)"
  [[ -n "${EVOMAP_PASSWORD:-}" ]] || die "EVOMAP_PASSWORD is empty (set env or $EVOMAP_CREDS_FILE)"
}

js_quote() {
  node -e 'process.stdout.write(JSON.stringify(process.argv[1] || ""))' "$1"
}

browser_eval() {
  local target_id="$1"
  local fn_code="$2"
  openclaw browser evaluate --target-id "$target_id" --fn "$fn_code"
}

open_tab() {
  local url="$1"
  local out id
  out="$(openclaw browser open "$url")"
  id="$(printf '%s\n' "$out" | awk '/^id:/{print $2; exit}')"
  [[ -n "$id" ]] || die "Failed to parse target id from browser open output"
  printf '%s\n' "$id"
}

snapshot_labels() {
  local target_id="$1"
  local out_file="$2"
  openclaw browser snapshot --target-id "$target_id" --format ai --limit "$SNAP_LIMIT" --labels >"$out_file"
}

extract_ref() {
  local file="$1"
  local pattern="$2"
  rg -n "$pattern" "$file" | head -n 1 | sed -E 's/.*\[ref=([^]]+)\].*/\1/' || true
}

target_url() {
  local target_id="$1"
  openclaw browser tabs --json | node -e '
let s = "";
process.stdin.on("data", d => (s += d));
process.stdin.on("end", () => {
  const id = process.argv[1];
  const j = JSON.parse(s || "{}");
  const tabs = j.tabs || [];
  const t = tabs.find(x => x.targetId === id || x.id === id);
  process.stdout.write((t && t.url) ? t.url : "");
});
' "$target_id"
}

capture_shot() {
  local target_id="$1"
  openclaw browser screenshot "$target_id" --full-page | awk -F'MEDIA:' 'NF>1{print $2; exit}' || true
}

type_ref() {
  local target_id="$1"
  local ref="$2"
  local value="$3"
  [[ -n "$ref" ]] || return 1
  openclaw browser click --target-id "$target_id" "$ref" >/dev/null || true
  openclaw browser type --target-id "$target_id" "$ref" "$value" >/dev/null
}

set_first_match_value() {
  local target_id="$1"
  local selectors_js="$2"
  local value="$3"
  local value_js result
  value_js="$(js_quote "$value")"
  result="$(browser_eval "$target_id" "() => { const selectors = $selectors_js; const value = $value_js; let el = null; for (const sel of selectors) { el = document.querySelector(sel); if (el) break; } if (!el) return 'missing'; el.focus(); if ('value' in el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } return 'ok'; }")"
  [[ "$result" == '"ok"' ]] || return 1
}

click_first_by_text() {
  local target_id="$1"
  local needle="$2"
  local needle_js result
  needle_js="$(js_quote "$needle")"
  result="$(browser_eval "$target_id" "() => { const needle = ($needle_js || '').toLowerCase(); const nodes = [...document.querySelectorAll('button, a, [role=\"button\"]')]; const hit = nodes.find(n => (n.textContent || '').trim().toLowerCase().includes(needle)); if (!hit) return 'missing'; hit.click(); return 'clicked'; }")"
  [[ "$result" == '"clicked"' ]] || return 1
}

login_flow() {
  require_creds

  local target_id before after final_url shot email_ref pass_ref submit_ref live_snap
  target_id="$(open_tab "https://evomap.ai/login")"
  openclaw browser wait --target-id "$target_id" --time 1800 >/dev/null || true

  before="$RUN_DIR/login-before.txt"
  snapshot_labels "$target_id" "$before"

  # If already logged in, /login often redirects away.
  final_url="$(target_url "$target_id")"
  if [[ "$final_url" != *"/login"* ]] && [[ -n "$final_url" ]]; then
    log "Already signed in at: $final_url"
    printf '%s\n' "$target_id"
    return 0
  fi

  live_snap="$RUN_DIR/login-live-1.txt"
  snapshot_labels "$target_id" "$live_snap"
  email_ref="$(extract_ref "$live_snap" 'textbox "Email" \[ref=')"
  type_ref "$target_id" "$email_ref" "$EVOMAP_EMAIL" || die "Email input not found. Inspect: $live_snap"

  live_snap="$RUN_DIR/login-live-2.txt"
  snapshot_labels "$target_id" "$live_snap"
  pass_ref="$(extract_ref "$live_snap" 'textbox "Password" \[ref=')"
  type_ref "$target_id" "$pass_ref" "$EVOMAP_PASSWORD" || die "Password input not found. Inspect: $live_snap"

  live_snap="$RUN_DIR/login-live-3.txt"
  snapshot_labels "$target_id" "$live_snap"
  submit_ref="$(extract_ref "$live_snap" 'button "Continue with Email" \[ref=')"
  if [[ -n "$submit_ref" ]]; then
    openclaw browser click --target-id "$target_id" "$submit_ref" >/dev/null
  else
    click_first_by_text "$target_id" "Continue with Email" || die "Login submit button not found. Inspect: $live_snap"
  fi
  openclaw browser wait --target-id "$target_id" --time "$WAIT_MS" >/dev/null || true

  after="$RUN_DIR/login-after.txt"
  snapshot_labels "$target_id" "$after"
  final_url="$(target_url "$target_id")"
  shot="$(capture_shot "$target_id")"

  if rg -qi 'Log in to EvoMap|Continue with Email|Forgot password\?' "$after"; then
    die "Login appears unsuccessful. Inspect: $after"
  fi

  log "Login finished: target=$target_id url=${final_url:-unknown}"
  log "Artifacts: $before $after ${shot:-}"
  printf '%s\n' "$target_id"
}

ensure_ask_tab() {
  local target_id pre_snap current_url
  target_id="$(open_tab "https://evomap.ai/ask")"
  openclaw browser wait --target-id "$target_id" --time 1800 >/dev/null || true

  pre_snap="$RUN_DIR/ask-precheck.txt"
  snapshot_labels "$target_id" "$pre_snap"

  if rg -qi 'Log in to EvoMap|Continue with Email|Forgot password\?' "$pre_snap"; then
    log "Ask page requires login; running login flow"
    target_id="$(login_flow)"
    current_url="$(target_url "$target_id")"
    if [[ "$current_url" != *"/ask"* ]]; then
      openclaw browser navigate --target-id "$target_id" "https://evomap.ai/ask" >/dev/null
      openclaw browser wait --target-id "$target_id" --time 1500 >/dev/null || true
    fi
  fi

  printf '%s\n' "$target_id"
}

ask_flow() {
  local title="" context="" log_output="" intent="auto" submit="false"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title) title="${2:-}"; shift 2 ;;
      --context) context="${2:-}"; shift 2 ;;
      --log) log_output="${2:-}"; shift 2 ;;
      --intent) intent="${2:-auto}"; shift 2 ;;
      --submit) submit="true"; shift ;;
      *) die "Unknown ask option: $1" ;;
    esac
  done

  [[ -n "$title" ]] || die "--title is required"
  [[ -n "$context" ]] || die "--context is required"

  local target_id before after shot final_url
  target_id="$(ensure_ask_tab)"

  before="$RUN_DIR/ask-before.txt"
  snapshot_labels "$target_id" "$before"

  set_first_match_value "$target_id" "['input[placeholder*=\"How can I\"]','input[placeholder*=\"Question\"]','input[aria-label*=\"Question\" i]','input[name*=\"title\" i]']" "$title" || die "Question title field not found. Inspect: $before"
  set_first_match_value "$target_id" "['textarea[placeholder*=\"CI logs\"]','textarea[placeholder*=\"Context\"]','textarea[name*=\"context\" i]','textarea']" "$context" || die "Context field not found. Inspect: $before"

  if [[ -n "$log_output" ]]; then
    set_first_match_value "$target_id" "['textarea[placeholder*=\"Paste relevant logs\"]','textarea[aria-label*=\"Log\" i]']" "$log_output" || log "Optional log field not found; skipped"
  fi

  case "$intent" in
    auto|"") ;;
    repair|Repair) click_first_by_text "$target_id" "Repair" || log "Intent button not found: Repair" ;;
    optimize|Optimize) click_first_by_text "$target_id" "Optimize" || log "Intent button not found: Optimize" ;;
    innovate|Innovate) click_first_by_text "$target_id" "Innovate" || log "Intent button not found: Innovate" ;;
    *) die "Invalid --intent: $intent (allowed: auto|repair|optimize|innovate)" ;;
  esac

  if [[ "$submit" == "true" ]]; then
    click_first_by_text "$target_id" "Submit" || die "Submit button not found. Inspect: $before"
    openclaw browser wait --target-id "$target_id" --time "$WAIT_MS" >/dev/null || true
  fi

  after="$RUN_DIR/ask-after.txt"
  snapshot_labels "$target_id" "$after"
  final_url="$(target_url "$target_id")"
  shot="$(capture_shot "$target_id")"

  log "Ask flow done: target=$target_id submit=$submit url=${final_url:-unknown}"
  log "Artifacts: $before $after ${shot:-}"
}

capture_flow() {
  local url="https://evomap.ai/ask"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --url) url="${2:-}"; shift 2 ;;
      *) die "Unknown capture option: $1" ;;
    esac
  done
  [[ -n "$url" ]] || die "--url cannot be empty"

  local target_id snap shot final_url
  target_id="$(open_tab "$url")"
  openclaw browser wait --target-id "$target_id" --time 1800 >/dev/null || true
  snap="$RUN_DIR/capture.txt"
  snapshot_labels "$target_id" "$snap"
  final_url="$(target_url "$target_id")"
  shot="$(capture_shot "$target_id")"
  log "Capture done: target=$target_id url=${final_url:-unknown}"
  log "Artifacts: $snap ${shot:-}"
}

usage() {
  cat <<'USAGE'
EvoMap automation helper for OpenClaw browser

Usage:
  evomap.sh login
  evomap.sh ask --title "<text>" --context "<text>" [--log "<text>"] [--intent auto|repair|optimize|innovate] [--submit]
  evomap.sh capture [--url "https://evomap.ai/..."]

Env:
  EVOMAP_EMAIL
  EVOMAP_PASSWORD
  EVOMAP_CREDS_FILE   (default: ~/.openclaw/credentials/evomap.env)
  EVOMAP_OUTPUT_DIR   (default: ~/.openclaw/workspace/skills/evomap-operator/runs)
USAGE
}

main() {
  require_cmd openclaw
  [[ $# -gt 0 ]] || { usage; exit 1; }

  case "$1" in
    login) shift; login_flow >/dev/null ;;
    ask) shift; ask_flow "$@" ;;
    capture) shift; capture_flow "$@" ;;
    -h|--help|help) usage ;;
    *) die "Unknown command: $1" ;;
  esac
}

main "$@"
