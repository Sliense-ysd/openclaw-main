#!/usr/bin/env bash
set -u

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${1:-$HOME/.openclaw/workspace/memory/incidents/$TS}"
LOG_FILE="$OUT_DIR/summary.log"
JSON_OUT="$OUT_DIR/openclaw-redacted.json"

mkdir -p "$OUT_DIR"

run() {
  local name="$1"
  shift
  {
    echo
    echo "===== $name ====="
    echo "CMD: $*"
    "$@" 2>&1
    local rc=$?
    echo "RC: $rc"
  } >>"$LOG_FILE"
}

echo "snapshot_ts=$TS" >"$LOG_FILE"
echo "out_dir=$OUT_DIR" >>"$LOG_FILE"

run "gateway_status" openclaw gateway status
run "health" openclaw health
run "status" openclaw status
run "cron_list" openclaw cron list
run "models_main" openclaw models status --agent main --json
run "models_coding" openclaw models status --agent coding --json
run "models_operations" openclaw models status --agent operations --json
run "models_product" openclaw models status --agent product --json
run "models_backlink" openclaw models status --agent backlink --json

TODAY_LOG="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
if [[ -f "$TODAY_LOG" ]]; then
  cp "$TODAY_LOG" "$OUT_DIR/openclaw-today.log"
  rg -n "no-mention|spawn docker ENOENT|gateway closed \\(1006|API rate limit|No available auth profile|FailoverError|sendMessage ok|cron|REACTION_INVALID" \
    "$TODAY_LOG" >"$OUT_DIR/openclaw-today-focus.log" 2>/dev/null || true
fi

if [[ -f "$HOME/.openclaw/openclaw.json" ]]; then
  python3 - "$HOME/.openclaw/openclaw.json" "$JSON_OUT" <<'PY'
import json
import sys

src = sys.argv[1]
dst = sys.argv[2]

with open(src, "r", encoding="utf-8") as f:
    data = json.load(f)

SENSITIVE_KEYS = {
    "apiKey",
    "botToken",
    "appSecret",
    "token",
    "authorization",
    "password",
}

def mask(v):
    if not isinstance(v, str):
        return v
    if len(v) <= 8:
        return "***"
    return v[:4] + "..." + v[-4:]

def walk(obj):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in SENSITIVE_KEYS:
                out[k] = mask(v)
            else:
                out[k] = walk(v)
        return out
    if isinstance(obj, list):
        return [walk(x) for x in obj]
    return obj

masked = walk(data)
with open(dst, "w", encoding="utf-8") as f:
    json.dump(masked, f, ensure_ascii=False, indent=2)
PY
fi

echo
echo "Snapshot complete: $OUT_DIR"
