#!/usr/bin/env bash
# shellcheck shell=bash
set -euo pipefail

OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-$OPENCLAW_HOME/openclaw.json}"
PROVIDER_SWITCH_SCRIPT="${PROVIDER_SWITCH_SCRIPT:-$OPENCLAW_HOME/provider-switch.sh}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INCIDENT_REF="${INCIDENT_REF:-$SCRIPT_DIR/../references/incidents-2026-02-27.md}"

EXPECTED_OPENAI_URL="https://coding.dashscope.aliyuncs.com/v1"
EXPECTED_ANTHROPIC_URL="https://coding.dashscope.aliyuncs.com/apps/anthropic"
EXPECTED_PRIMARY_MODEL="${EXPECTED_PRIMARY_MODEL:-bailian/kimi-k2.5}"
CONTROL_UI_CLIENT_ID="${CONTROL_UI_CLIENT_ID:-openclaw-control-ui}"

log() { printf '[ops-guardrails] %s\n' "$*"; }
die() { printf '[ops-guardrails] ERROR: %s\n' "$*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

usage() {
  cat <<'USAGE'
OpenClaw ops guardrails

Usage:
  ops-guardrails.sh incident-brief
  ops-guardrails.sh preflight
  ops-guardrails.sh autonomy-check
  ops-guardrails.sh context-report --agent <agent_id>
  ops-guardrails.sh context-prune --agent <agent_id> --yes

Notes:
  - context-prune is destructive to session mapping for target agent and requires --yes.
  - all operations are local only.
USAGE
}

incident_brief() {
  [[ -f "$INCIDENT_REF" ]] || die "Incident reference not found: $INCIDENT_REF"
  cat "$INCIDENT_REF"
}

preflight() {
  [[ -f "$CONFIG_PATH" ]] || die "Config not found: $CONFIG_PATH"
  require_cmd node
  require_cmd openclaw

  log "Checking provider endpoints and default routing..."
  node - "$CONFIG_PATH" "$EXPECTED_OPENAI_URL" "$EXPECTED_ANTHROPIC_URL" "$EXPECTED_PRIMARY_MODEL" <<'NODE'
const fs = require("fs");
const [cfgPath, expectedOpenai, expectedAnthropic, expectedPrimary] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const providers = (cfg.models && cfg.models.providers) || {};
const defaults = (((cfg.agents || {}).defaults || {}).model) || {};
const tools = cfg.tools || {};

const checks = [];
function check(label, ok, detail, severity = "FAIL") { checks.push({ label, ok, detail, severity }); }

const bOpenai = providers["bailian"] || {};
const bAnthropic = providers["bailian-anthropic"] || {};

check(
  "bailian openai baseUrl",
  bOpenai.baseUrl === expectedOpenai,
  `actual=${bOpenai.baseUrl || ""} expected=${expectedOpenai}`
);
check(
  "bailian anthropic baseUrl",
  bAnthropic.baseUrl === expectedAnthropic,
  `actual=${bAnthropic.baseUrl || ""} expected=${expectedAnthropic}`
);
check(
  "defaults primary model",
  defaults.primary === expectedPrimary,
  `actual=${defaults.primary || ""} expected=${expectedPrimary}`,
  "WARN"
);
check(
  "tools.exec host",
  tools.exec && tools.exec.host === "gateway",
  `actual=${tools.exec && tools.exec.host ? tools.exec.host : ""}`,
  "WARN"
);
check(
  "tools.exec ask",
  tools.exec && tools.exec.ask === "off",
  `actual=${tools.exec && tools.exec.ask ? tools.exec.ask : ""}`,
  "WARN"
);
check(
  "tools.exec security",
  tools.exec && tools.exec.security === "full",
  `actual=${tools.exec && tools.exec.security ? tools.exec.security : ""}`,
  "WARN"
);

for (const c of checks) {
  const state = c.ok ? "OK" : c.severity;
  console.log(`${state} | ${c.label} | ${c.detail}`);
}
const failed = checks.filter(c => !c.ok && c.severity === "FAIL").length;
process.exit(failed ? 2 : 0);
NODE

  log "Running provider probes..."
  if [[ -x "$PROVIDER_SWITCH_SCRIPT" ]]; then
    "$PROVIDER_SWITCH_SCRIPT" test bailian-kimi-k2.5
    "$PROVIDER_SWITCH_SCRIPT" test bailian-qwen3
  else
    die "Provider switch script not executable: $PROVIDER_SWITCH_SCRIPT"
  fi

  log "Preflight completed."
}

autonomy_check() {
  require_cmd openclaw
  require_cmd node
  [[ -x "$PROVIDER_SWITCH_SCRIPT" ]] || die "Provider switch script not executable: $PROVIDER_SWITCH_SCRIPT"

  log "Gateway probe..."
  local probe_json
  if ! probe_json="$(openclaw gateway probe --timeout 30000 --json 2>/dev/null)"; then
    die "Gateway probe command failed."
  fi
  node - "$probe_json" <<'NODE'
const probe = JSON.parse(process.argv[2]);
if (probe.ok) {
  console.log("OK gateway_probe");
} else {
  console.log(`WARN gateway_probe_failed primaryTargetId=${probe.primaryTargetId || "none"}`);
}
NODE

  log "Checking approvals snapshot..."
  local approvals_json
  approvals_json="$(openclaw approvals get --json)"
  node - "$approvals_json" <<'NODE'
const payload = JSON.parse(process.argv[2]);
const file = payload.file || {};
const d = file.defaults || {};
const agents = file.agents || {};
const keys = Object.keys(agents);
const bad = [];
if (d.ask !== "off" || d.security !== "full") bad.push("defaults");
for (const k of keys) {
  const v = agents[k] || {};
  if (v.ask !== "off" || v.security !== "full") bad.push(k);
}
if (bad.length) {
  console.log(`WARN approvals_not_fully_open=${bad.join(",")}`);
} else {
  console.log("OK approvals_fully_open");
}
NODE

  log "Checking control-ui device scopes..."
  local devices_json
  devices_json="$(openclaw devices list --json)"
  node - "$devices_json" "$CONTROL_UI_CLIENT_ID" <<'NODE'
const data = JSON.parse(process.argv[2]);
const clientId = process.argv[3];
const paired = data.paired || [];
const target = paired.find(d => d.clientId === clientId);
if (!target) {
  console.log(`WARN control_ui_device_not_found clientId=${clientId}`);
  process.exit(0);
}
const tokens = target.tokens || [];
const scopes = new Set(tokens.flatMap(t => t.scopes || []));
const needed = ["operator.read","operator.write","operator.admin","operator.approvals","operator.pairing"];
const missing = needed.filter(s => !scopes.has(s));
if (missing.length) {
  console.log(`WARN control_ui_missing_scopes=${missing.join(",")} deviceId=${target.deviceId}`);
} else {
  console.log(`OK control_ui_scopes deviceId=${target.deviceId}`);
}
NODE

  log "Checking provider routing..."
  "$PROVIDER_SWITCH_SCRIPT" status

  log "Checking cron health..."
  openclaw cron list

  log "Autonomy check completed."
}

context_report() {
  local agent=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --agent) agent="${2:-}"; shift 2 ;;
      *) die "Unknown argument for context-report: $1" ;;
    esac
  done
  [[ -n "$agent" ]] || die "context-report requires --agent <id>"

  local store="$OPENCLAW_HOME/agents/$agent/sessions/sessions.json"
  [[ -f "$store" ]] || die "Session store not found: $store"

  require_cmd node
  log "Token/context report for agent=$agent"
  node - "$store" "$agent" <<'NODE'
const fs = require("fs");
const [store, agent] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(store, "utf8"));
const rows = Object.entries(data)
  .filter(([k]) => k.startsWith(`agent:${agent}:`))
  .map(([key, v]) => ({
    key,
    modelProvider: v.modelProvider || "",
    model: v.model || "",
    totalTokens: v.totalTokens ?? null,
    inputTokens: v.inputTokens ?? null,
    updatedAt: v.updatedAt || 0
  }))
  .sort((a, b) => (b.totalTokens || 0) - (a.totalTokens || 0));

if (!rows.length) {
  console.log("No sessions found for target agent.");
  process.exit(0);
}
for (const r of rows) {
  const t = r.totalTokens == null ? "n/a" : String(r.totalTokens);
  console.log(`${r.key}\tprovider=${r.modelProvider}\tmodel=${r.model}\ttokens=${t}\tupdatedAt=${r.updatedAt}`);
}
NODE
}

context_prune() {
  local agent=""
  local yes="false"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --agent) agent="${2:-}"; shift 2 ;;
      --yes) yes="true"; shift ;;
      *) die "Unknown argument for context-prune: $1" ;;
    esac
  done
  [[ -n "$agent" ]] || die "context-prune requires --agent <id>"
  [[ "$yes" == "true" ]] || die "context-prune requires --yes"

  local dir="$OPENCLAW_HOME/agents/$agent/sessions"
  local store="$dir/sessions.json"
  [[ -f "$store" ]] || die "Session store not found: $store"

  local backup_root="$OPENCLAW_HOME/backups/context-prune"
  local stamp
  stamp="$(date +%Y%m%d-%H%M%S)"
  local backup_dir="$backup_root/$agent-$stamp"
  mkdir -p "$backup_dir"
  cp -a "$dir" "$backup_dir/"
  log "Backup created: $backup_dir/sessions"

  node - "$store" "$agent" <<'NODE'
const fs = require("fs");
const [store, agent] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(store, "utf8"));
let removed = 0;
for (const k of Object.keys(data)) {
  if (k.startsWith(`agent:${agent}:`)) {
    delete data[k];
    removed += 1;
  }
}
fs.writeFileSync(store, JSON.stringify(data, null, 2) + "\n");
console.log(`removed_sessions=${removed}`);
NODE

  log "Restarting gateway to apply clean session mapping..."
  openclaw gateway restart >/dev/null
  log "Context prune completed for agent=$agent"
}

main() {
  [[ $# -gt 0 ]] || { usage; exit 1; }
  case "$1" in
    incident-brief) shift; incident_brief "$@" ;;
    preflight) shift; preflight "$@" ;;
    autonomy-check) shift; autonomy_check "$@" ;;
    context-report) shift; context_report "$@" ;;
    context-prune) shift; context_prune "$@" ;;
    -h|--help|help) usage ;;
    *) die "Unknown command: $1" ;;
  esac
}

main "$@"
