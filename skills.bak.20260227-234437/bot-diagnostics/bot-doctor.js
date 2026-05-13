#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HOME = process.env.HOME || '';
const OPENCLAW_CONFIG_PATH =
  process.env.OPENCLAW_CONFIG_PATH || path.join(HOME, '.openclaw', 'openclaw.json');
const CREDENTIALS_DIR = path.join(HOME, '.openclaw', 'credentials');
const GATEWAY_ERR_LOG = path.join(HOME, '.openclaw', 'logs', 'gateway.err.log');
const GATEWAY_RUNTIME_LOG = path.join('/tmp', 'openclaw', `openclaw-${new Date().toISOString().slice(0, 10)}.log`);
const DEFAULT_PROBE_TIMEOUT_SEC = 45;
const DEFAULT_LOG_LINES = 3000;
const DEFAULT_SINCE_MINUTES = 240;

function stripAnsi(text) {
  return String(text || '').replace(/\u001b\[[0-9;]*m/g, '');
}

function tailLines(text, lineCount = 12) {
  const lines = stripAnsi(text)
    .split(/\r?\n/)
    .filter(Boolean);
  return lines.slice(Math.max(0, lines.length - lineCount)).join('\n');
}

function parseJsonFromMixedOutput(text) {
  const clean = stripAnsi(text || '').trim();
  if (!clean) return null;

  const lines = clean.split(/\r?\n/);
  const jsonStartIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  });

  if (jsonStartIndex >= 0) {
    const candidate = lines.slice(jsonStartIndex).join('\n');
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  const firstObj = clean.indexOf('{');
  const lastObj = clean.lastIndexOf('}');
  if (firstObj >= 0 && lastObj > firstObj) {
    try {
      return JSON.parse(clean.slice(firstObj, lastObj + 1));
    } catch {
      // fall through
    }
  }

  const firstArr = clean.indexOf('[');
  const lastArr = clean.lastIndexOf(']');
  if (firstArr >= 0 && lastArr > firstArr) {
    try {
      return JSON.parse(clean.slice(firstArr, lastArr + 1));
    } catch {
      // fall through
    }
  }

  return null;
}

function safeSnippet(text, maxChars = 280) {
  const compact = stripAnsi(text || '').replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  return compact.length <= maxChars ? compact : `${compact.slice(0, maxChars - 3)}...`;
}

function toErrorObject(run) {
  return {
    cmd: run.cmd,
    status: run.status,
    signal: run.signal || null,
    error: run.error || null,
    stderr: safeSnippet(tailLines(run.stderr, 10), 500),
    stdout: safeSnippet(tailLines(run.stdout, 10), 500),
  };
}

function runOpenclaw(args, timeoutMs = 30000) {
  const proc = spawnSync('openclaw', args, {
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    ok: proc.status === 0,
    status: proc.status,
    signal: proc.signal,
    error: proc.error ? proc.error.message : null,
    stdout: proc.stdout || '',
    stderr: proc.stderr || '',
    cmd: `openclaw ${args.join(' ')}`,
  };
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function getConfig() {
  const config = readJsonFile(OPENCLAW_CONFIG_PATH);
  if (!config) {
    throw new Error(`Failed to parse OpenClaw config: ${OPENCLAW_CONFIG_PATH}`);
  }
  return config;
}

function getAgents(config) {
  return (config?.agents?.list || []).map((item) => item.id).filter(Boolean);
}

function getTelegramBinding(config, agentId) {
  const bindings = config?.bindings || [];
  return bindings.find((item) => item?.agentId === agentId && item?.match?.channel === 'telegram') || null;
}

function getTelegramAccountConfig(config, accountId) {
  const telegram = config?.channels?.telegram || {};
  const accounts = telegram?.accounts || {};
  const accountConfig = accounts[accountId] || null;
  return { telegram, accountConfig };
}

function getAllowFilePath(accountId) {
  return path.join(CREDENTIALS_DIR, `telegram-${accountId}-allowFrom.json`);
}

function evaluateAllowFrom(accountId, dmPolicy, userId) {
  const file = getAllowFilePath(accountId);

  if (!userId) {
    return {
      status: 'skip',
      message: 'user id not provided',
      file,
    };
  }

  if (dmPolicy !== 'pairing') {
    return {
      status: 'skip',
      message: `dmPolicy is ${dmPolicy || 'unknown'} (pairing check not required)`,
      file,
    };
  }

  if (!fs.existsSync(file)) {
    return {
      status: 'warn',
      message: 'allowFrom file missing',
      file,
      allowFrom: [],
      userAllowed: false,
    };
  }

  const parsed = readJsonFile(file);
  if (!parsed) {
    return {
      status: 'warn',
      message: 'allowFrom file is invalid JSON',
      file,
      allowFrom: [],
      userAllowed: false,
    };
  }

  const allowFrom = Array.isArray(parsed.allowFrom) ? parsed.allowFrom.map(String) : [];
  const userAllowed = allowFrom.includes(String(userId));
  return {
    status: userAllowed ? 'ok' : 'warn',
    message: userAllowed ? 'user is allowlisted' : 'user is not in allowFrom',
    file,
    allowFrom,
    userAllowed,
  };
}

function ensureAllowUser(accountId, userId) {
  const file = getAllowFilePath(accountId);
  let payload = { version: 1, allowFrom: [] };

  if (fs.existsSync(file)) {
    const parsed = readJsonFile(file);
    if (parsed) payload = parsed;
  }

  payload.version = 1;
  if (!Array.isArray(payload.allowFrom)) payload.allowFrom = [];

  const id = String(userId);
  const existed = payload.allowFrom.includes(id);
  if (!existed) payload.allowFrom.push(id);

  writeJsonFile(file, payload);
  return { file, existed, updated: !existed };
}

function checkHealth() {
  const run = runOpenclaw(['health'], 35000);
  if (!run.ok) {
    return {
      name: 'gateway_health',
      status: 'error',
      message: 'openclaw health failed',
      detail: toErrorObject(run),
    };
  }

  return {
    name: 'gateway_health',
    status: 'ok',
    message: 'openclaw health ok',
    detail: safeSnippet(run.stdout, 600),
  };
}

function checkPairingQueue(userId) {
  if (!userId) {
    return {
      name: 'pairing_queue',
      status: 'skip',
      message: 'user id not provided',
      detail: null,
    };
  }

  const run = runOpenclaw(['pairing', 'list', 'telegram', '--json'], 20000);
  if (!run.ok) {
    return {
      name: 'pairing_queue',
      status: 'warn',
      message: 'failed to read pairing queue',
      detail: toErrorObject(run),
    };
  }

  const parsed = parseJsonFromMixedOutput(run.stdout);
  if (!parsed || !Array.isArray(parsed.requests)) {
    return {
      name: 'pairing_queue',
      status: 'warn',
      message: 'pairing queue returned non-JSON output',
      detail: safeSnippet(run.stdout, 600),
    };
  }

  const pendingForUser = parsed.requests.filter((item) => String(item?.id || '') === String(userId));
  return {
    name: 'pairing_queue',
    status: pendingForUser.length > 0 ? 'warn' : 'ok',
    message:
      pendingForUser.length > 0
        ? `pending pairing exists for user ${userId}`
        : `no pending pairing for user ${userId}`,
    detail: {
      pendingCount: pendingForUser.length,
      pending: pendingForUser.map((item) => ({
        id: item.id,
        code: item.code || null,
        accountId: item?.meta?.accountId || null,
        createdAt: item.createdAt || null,
      })),
    },
  };
}

function checkModelStatus(agentId) {
  const run = runOpenclaw(['models', '--agent', agentId, 'status', '--json'], 30000);
  if (!run.ok) {
    return {
      name: 'model_status',
      status: 'error',
      message: `failed to read model status for agent ${agentId}`,
      detail: toErrorObject(run),
    };
  }

  const parsed = parseJsonFromMixedOutput(run.stdout);
  if (!parsed) {
    return {
      name: 'model_status',
      status: 'error',
      message: `model status output is not valid JSON for agent ${agentId}`,
      detail: safeSnippet(run.stdout, 800),
    };
  }

  const fallbackCount = Array.isArray(parsed.fallbacks) ? parsed.fallbacks.length : 0;
  return {
    name: 'model_status',
    status: fallbackCount > 0 ? 'ok' : 'warn',
    message:
      fallbackCount > 0
        ? `model configured with ${fallbackCount} fallback(s)`
        : 'model configured without fallbacks',
    detail: {
      defaultModel: parsed.defaultModel || null,
      resolvedDefault: parsed.resolvedDefault || null,
      fallbacks: parsed.fallbacks || [],
      allowed: parsed.allowed || [],
    },
  };
}

function classifyProbeFailure(text) {
  const lower = String(text || '').toLowerCase();
  if (lower.includes('access not configured')) return 'access_not_configured';
  if (lower.includes('all models failed')) return 'all_models_failed';
  if (lower.includes('timed out')) return 'model_timeout';
  if (lower.includes('etimedout')) return 'probe_timeout';
  if (lower.includes('telegram bot token missing')) return 'telegram_token_missing';
  return 'unknown';
}

function checkAgentProbe(agentId, timeoutSec) {
  const timeoutMs = Math.max(10, Number(timeoutSec || DEFAULT_PROBE_TIMEOUT_SEC)) * 1000;
  const run = runOpenclaw(
    ['agent', '--agent', agentId, '--message', 'reply with exactly ok', '--json', '--timeout', String(timeoutSec || DEFAULT_PROBE_TIMEOUT_SEC)],
    timeoutMs + 10000
  );

  if (!run.ok) {
    const merged = `${run.stderr}\n${run.stdout}`;
    return {
      name: 'agent_probe',
      status: 'error',
      message: `probe failed for agent ${agentId}`,
      detail: {
        category: classifyProbeFailure(merged),
        failure: toErrorObject(run),
      },
    };
  }

  const parsed = parseJsonFromMixedOutput(run.stdout);
  if (!parsed) {
    return {
      name: 'agent_probe',
      status: 'error',
      message: `probe returned non-JSON output for agent ${agentId}`,
      detail: safeSnippet(run.stdout, 800),
    };
  }

  const payloadText = parsed?.result?.payloads?.[0]?.text || '';
  return {
    name: 'agent_probe',
    status: parsed.status === 'ok' ? 'ok' : 'error',
    message: parsed.status === 'ok' ? 'probe completed' : `probe returned status=${parsed.status || 'unknown'}`,
    detail: {
      runId: parsed.runId || null,
      durationMs: parsed?.result?.meta?.durationMs || null,
      provider: parsed?.result?.meta?.agentMeta?.provider || null,
      model: parsed?.result?.meta?.agentMeta?.model || null,
      sampleReply: safeSnippet(payloadText, 180),
    },
  };
}

function parseTimestampFromLogLine(line) {
  const raw = String(line || '');
  const prefixed = raw.match(/^(\d{4}-\d{2}-\d{2}T[0-9:.+\-Z]+)\s/);
  if (prefixed) {
    const ts = Date.parse(prefixed[1]);
    if (!Number.isNaN(ts)) return ts;
  }
  const embedded = raw.match(/"time":"([^"]+)"/);
  if (!embedded) return null;
  const ts = Date.parse(embedded[1]);
  if (Number.isNaN(ts)) return null;
  return ts;
}

function scanGatewayErrLog(maxLines, sinceMinutes) {
  if (!fs.existsSync(GATEWAY_ERR_LOG)) {
    return {
      name: 'gateway_err_log',
      status: 'skip',
      message: 'gateway.err.log not found',
      detail: { file: GATEWAY_ERR_LOG },
    };
  }

  const raw = fs.readFileSync(GATEWAY_ERR_LOG, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - Math.max(200, Number(maxLines) || DEFAULT_LOG_LINES)));
  const cutoffTs = Date.now() - Math.max(1, Number(sinceMinutes) || DEFAULT_SINCE_MINUTES) * 60 * 1000;
  const recent = tail.filter((line) => {
    const ts = parseTimestampFromLogLine(line);
    if (!ts) return true;
    return ts >= cutoffTs;
  });

  const patterns = [
    { key: 'access_not_configured', regex: /access not configured/i },
    { key: 'all_models_failed', regex: /all models failed/i },
    { key: 'llm_timeout', regex: /llm request timed out|upstream.*timeout|failovererror: llm request timed out/i },
    { key: 'telegram_token_missing', regex: /telegram bot token missing/i },
    { key: 'telegram_send_failed', regex: /telegram send failed|sendmessage.*failed|chat not found/i },
  ];

  const counts = {};
  const lastLine = {};
  for (const item of patterns) {
    counts[item.key] = 0;
    lastLine[item.key] = null;
  }

  for (const line of recent) {
    for (const item of patterns) {
      if (item.regex.test(line)) {
        counts[item.key] += 1;
        lastLine[item.key] = line;
      }
    }
  }

  const hasSignals = Object.values(counts).some((value) => value > 0);
  return {
    name: 'gateway_err_log',
    status: hasSignals ? 'warn' : 'ok',
    message: hasSignals ? 'recent error signals found in gateway.err.log' : 'no recent critical patterns in gateway.err.log',
    detail: {
      file: GATEWAY_ERR_LOG,
      scannedLines: tail.length,
      consideredRecentLines: recent.length,
      sinceMinutes: Math.max(1, Number(sinceMinutes) || DEFAULT_SINCE_MINUTES),
      counts,
      lastLine,
    },
  };
}

function scanGatewayRuntimeLog(maxLines, sinceMinutes) {
  if (!fs.existsSync(GATEWAY_RUNTIME_LOG)) {
    return {
      name: 'gateway_runtime_log',
      status: 'skip',
      message: 'gateway runtime log not found',
      detail: { file: GATEWAY_RUNTIME_LOG },
    };
  }

  const raw = fs.readFileSync(GATEWAY_RUNTIME_LOG, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - Math.max(200, Number(maxLines) || DEFAULT_LOG_LINES)));
  const cutoffTs = Date.now() - Math.max(1, Number(sinceMinutes) || DEFAULT_SINCE_MINUTES) * 60 * 1000;
  const recent = tail.filter((line) => {
    const ts = parseTimestampFromLogLine(line);
    if (!ts) return true;
    return ts >= cutoffTs;
  });

  const patterns = [
    { key: 'no_mention', regex: /reason":"no-mention"/i },
    { key: 'telegram_send_ok', regex: /telegram sendMessage ok/i },
    { key: 'spawn_docker_enoent', regex: /spawn docker ENOENT/i },
    { key: 'gateway_1006', regex: /gateway closed \(1006/i },
    { key: 'reaction_invalid', regex: /REACTION_INVALID/i },
  ];

  const counts = {};
  const lastLine = {};
  for (const item of patterns) {
    counts[item.key] = 0;
    lastLine[item.key] = null;
  }

  for (const line of recent) {
    for (const item of patterns) {
      if (item.regex.test(line)) {
        counts[item.key] += 1;
        lastLine[item.key] = line;
      }
    }
  }

  const hasSignals = Object.values(counts).some((value) => value > 0);
  return {
    name: 'gateway_runtime_log',
    status: hasSignals ? 'warn' : 'ok',
    message: hasSignals
      ? 'recent runtime signals found in gateway log'
      : 'no recent critical runtime signals in gateway log',
    detail: {
      file: GATEWAY_RUNTIME_LOG,
      scannedLines: tail.length,
      consideredRecentLines: recent.length,
      sinceMinutes: Math.max(1, Number(sinceMinutes) || DEFAULT_SINCE_MINUTES),
      counts,
      lastLine,
    },
  };
}

function analyzeChecks(checks, context) {
  const errors = checks.filter((item) => item.status === 'error');
  const warns = checks.filter((item) => item.status === 'warn');

  const likelyRootCauses = [];
  const nextActions = [];

  const probe = checks.find((item) => item.name === 'agent_probe');
  if (probe && probe.status === 'error') {
    const category = probe?.detail?.category || 'unknown';
    if (category === 'all_models_failed' || category === 'model_timeout') {
      likelyRootCauses.push('Model provider timeout or upstream instability');
      nextActions.push('Retry with a shorter prompt and lower concurrency.');
      nextActions.push(`Check provider health and fallbacks: openclaw models --agent ${context.agentId} status --json`);
    }
    if (category === 'access_not_configured') {
      likelyRootCauses.push('DM access/pairing not configured for this sender.');
    }
    if (category === 'telegram_token_missing') {
      likelyRootCauses.push('Telegram bot token missing for bound account.');
    }
    if (category === 'probe_timeout') {
      likelyRootCauses.push('Probe command timed out before receiving a model response.');
      nextActions.push(`Increase probe timeout: node ${__filename} diagnose --agent ${context.agentId} --probe --timeout 60`);
    }
  }

  const allow = checks.find((item) => item.name === 'telegram_allow_from');
  if (allow && allow.status === 'warn' && context.userId) {
    likelyRootCauses.push('Sender is not in allowFrom for this Telegram account.');
    nextActions.push(
      `Add sender to allowFrom: node ${__filename} sync-allow --agent ${context.agentId} --user ${context.userId}`
    );
  }

  const pairing = checks.find((item) => item.name === 'pairing_queue');
  if (pairing && pairing.status === 'warn') {
    const firstCode = pairing?.detail?.pending?.[0]?.code;
    likelyRootCauses.push('Pending pairing request exists for sender.');
    if (firstCode) {
      nextActions.push(`Approve pairing: openclaw pairing approve telegram ${firstCode} --notify`);
    } else {
      nextActions.push('List pending pairing: openclaw pairing list telegram --json');
    }
  }

  const token = checks.find((item) => item.name === 'telegram_account_token');
  if (token && token.status === 'error') {
    likelyRootCauses.push('Telegram account has no bot token configured.');
    nextActions.push('Set bot token in channels.telegram.accounts.<accountId>.botToken and restart gateway.');
  }

  const accountConfig = checks.find((item) => item.name === 'telegram_account_config');
  if (accountConfig && accountConfig.status === 'error') {
    const accountId = accountConfig?.detail?.accountId || '<accountId>';
    likelyRootCauses.push(`Telegram account config missing for bound account ${accountId}.`);
    nextActions.push(
      `Add channels.telegram.accounts.${accountId} config or update binding to an existing account, then restart gateway.`
    );
  }

  const health = checks.find((item) => item.name === 'gateway_health');
  if (health && health.status === 'error') {
    likelyRootCauses.push('Gateway is not healthy or unavailable.');
    nextActions.push('Restart gateway: openclaw gateway restart');
    nextActions.push('Recheck health: openclaw health');
  }

  const logs = checks.find((item) => item.name === 'gateway_err_log');
  const counts = logs?.detail?.counts || {};
  if (counts.telegram_token_missing > 0) {
    likelyRootCauses.push('At least one Telegram account is missing bot token in recent logs.');
  }
  if (counts.llm_timeout > 0 || counts.all_models_failed > 0) {
    likelyRootCauses.push('Recent LLM timeout/failover errors detected in gateway logs.');
  }

  const runtime = checks.find((item) => item.name === 'gateway_runtime_log');
  const runtimeCounts = runtime?.detail?.counts || {};
  if (runtimeCounts.no_mention > 0) {
    likelyRootCauses.push('Group messages are being dropped by mention gating (no-mention).');
    nextActions.push('Add/align agents.list[].groupChat.mentionPatterns for real @aliases (include Chinese aliases and full-width @).');
  }
  if (runtimeCounts.spawn_docker_enoent > 0) {
    likelyRootCauses.push('Sandbox runtime attempted docker spawn but docker was unavailable.');
    nextActions.push('Verify docker availability (which docker) and sandbox mode compatibility for affected agents.');
  }
  if (runtimeCounts.gateway_1006 > 0) {
    likelyRootCauses.push('Gateway RPC connectivity is unstable (1006 abnormal closure observed).');
    nextActions.push('Restart gateway and re-run health/status probes to confirm stable websocket connectivity.');
  }

  const severity = errors.length > 0 ? 'error' : warns.length > 0 ? 'warn' : 'ok';
  return {
    severity,
    ok: severity === 'ok',
    errorCount: errors.length,
    warnCount: warns.length,
    likelyRootCauses: [...new Set(likelyRootCauses)],
    nextActions: [...new Set(nextActions)],
  };
}

function runAgentChecks(config, options) {
  const { agentId, userId, probe, probeTimeoutSec, sharedHealth, sharedPairing, sharedLogs, sharedRuntimeLog } = options;
  const checks = [];

  if (sharedHealth) checks.push(sharedHealth);

  const binding = getTelegramBinding(config, agentId);
  if (!binding) {
    checks.push({
      name: 'telegram_binding',
      status: 'warn',
      message: `agent ${agentId} has no telegram binding`,
      detail: null,
    });
  } else {
    const accountId = binding?.match?.accountId || 'default';
    checks.push({
      name: 'telegram_binding',
      status: 'ok',
      message: `telegram binding found: account=${accountId}`,
      detail: { accountId },
    });

    const { telegram, accountConfig } = getTelegramAccountConfig(config, accountId);
    if (!accountConfig) {
      checks.push({
        name: 'telegram_account_config',
        status: 'error',
        message: `telegram account config missing for account=${accountId}`,
        detail: { accountId },
      });
    } else {
      const dmPolicy = accountConfig.dmPolicy || telegram.dmPolicy || 'unknown';
      const hasToken = Boolean(
        accountConfig.botToken ||
          accountConfig.tokenFile ||
          (accountId === 'default' && process.env.TELEGRAM_BOT_TOKEN)
      );

      checks.push({
        name: 'telegram_account_token',
        status: hasToken ? 'ok' : 'error',
        message: hasToken
          ? `telegram token configured for account=${accountId}`
          : `telegram token missing for account=${accountId}`,
        detail: { accountId, dmPolicy },
      });

      const allow = evaluateAllowFrom(accountId, dmPolicy, userId);
      checks.push({
        name: 'telegram_allow_from',
        status: allow.status,
        message: allow.message,
        detail: { accountId, dmPolicy, userId: userId || null, ...allow },
      });
    }
  }

  if (sharedPairing) checks.push(sharedPairing);

  checks.push(checkModelStatus(agentId));

  if (probe) {
    checks.push(checkAgentProbe(agentId, probeTimeoutSec));
  } else {
    checks.push({
      name: 'agent_probe',
      status: 'skip',
      message: 'probe skipped (set --probe to enable)',
      detail: null,
    });
  }

  if (sharedLogs) checks.push(sharedLogs);
  if (sharedRuntimeLog) checks.push(sharedRuntimeLog);

  return {
    agentId,
    checks,
    summary: analyzeChecks(checks, { agentId, userId }),
  };
}

function runDiagnose(options) {
  const config = getConfig();
  const health = checkHealth();
  const pairing = checkPairingQueue(options.userId);
  const logs = scanGatewayErrLog(options.logLines, options.sinceMinutes);
  const runtimeLog = scanGatewayRuntimeLog(options.logLines, options.sinceMinutes);

  const result = runAgentChecks(config, {
    agentId: options.agentId,
    userId: options.userId,
    probe: options.probe,
    probeTimeoutSec: options.probeTimeoutSec,
    sharedHealth: health,
    sharedPairing: pairing,
    sharedLogs: logs,
    sharedRuntimeLog: runtimeLog,
  });

  return {
    ok: result.summary.ok,
    command: 'diagnose',
    timestamp: new Date().toISOString(),
    agentId: options.agentId,
    userId: options.userId || null,
    probe: Boolean(options.probe),
    result,
  };
}

function runSweep(options) {
  const config = getConfig();
  const health = checkHealth();
  const pairing = checkPairingQueue(options.userId);
  const logs = scanGatewayErrLog(options.logLines, options.sinceMinutes);
  const runtimeLog = scanGatewayRuntimeLog(options.logLines, options.sinceMinutes);
  const agents = getAgents(config);

  const results = agents.map((agentId) =>
    runAgentChecks(config, {
      agentId,
      userId: options.userId,
      probe: options.probe,
      probeTimeoutSec: options.probeTimeoutSec,
      sharedHealth: health,
      sharedPairing: pairing,
      sharedLogs: logs,
      sharedRuntimeLog: runtimeLog,
    })
  );

  const severityMap = { ok: 0, warn: 1, error: 2 };
  const maxSeverity = results.reduce(
    (max, item) => Math.max(max, severityMap[item.summary.severity] || 0),
    0
  );
  const summarySeverity = Object.keys(severityMap).find((key) => severityMap[key] === maxSeverity) || 'ok';

  return {
    ok: summarySeverity === 'ok',
    command: 'sweep',
    timestamp: new Date().toISOString(),
    userId: options.userId || null,
    probe: Boolean(options.probe),
    agents: results,
    summary: {
      severity: summarySeverity,
      totalAgents: results.length,
      okAgents: results.filter((item) => item.summary.severity === 'ok').length,
      warnAgents: results.filter((item) => item.summary.severity === 'warn').length,
      errorAgents: results.filter((item) => item.summary.severity === 'error').length,
    },
  };
}

function runLogs(options) {
  return {
    ok: true,
    command: 'logs',
    timestamp: new Date().toISOString(),
    result: scanGatewayErrLog(options.logLines, options.sinceMinutes),
  };
}

function runSyncAllow(options) {
  if (!options.userId) {
    throw new Error('sync-allow requires --user <telegram_user_id>');
  }

  const config = getConfig();
  const targets = new Set();

  if (options.agentId) {
    const binding = getTelegramBinding(config, options.agentId);
    if (!binding) {
      throw new Error(`agent ${options.agentId} has no telegram binding`);
    }
    targets.add(binding?.match?.accountId || 'default');
  } else {
    const accounts = Object.keys(config?.channels?.telegram?.accounts || {});
    if (accounts.length === 0) targets.add('default');
    for (const accountId of accounts) targets.add(accountId);
  }

  const changes = [];
  for (const accountId of targets) {
    changes.push({
      accountId,
      ...ensureAllowUser(accountId, options.userId),
    });
  }

  return {
    ok: true,
    command: 'sync-allow',
    timestamp: new Date().toISOString(),
    userId: String(options.userId),
    agentId: options.agentId || null,
    changed: changes.filter((item) => item.updated).length,
    unchanged: changes.filter((item) => !item.updated).length,
    changes,
  };
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() || 'help';
  const opts = {
    probe: false,
    probeTimeoutSec: DEFAULT_PROBE_TIMEOUT_SEC,
    logLines: DEFAULT_LOG_LINES,
    sinceMinutes: DEFAULT_SINCE_MINUTES,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    if (key === 'probe') {
      opts.probe = true;
      continue;
    }
    const value = args.shift();
    if (value === undefined) {
      throw new Error(`Missing value for --${key}`);
    }
    if (key === 'agent') opts.agentId = value;
    else if (key === 'user') opts.userId = value;
    else if (key === 'timeout') opts.probeTimeoutSec = Number(value);
    else if (key === 'log-lines') opts.logLines = Number(value);
    else if (key === 'since-minutes') opts.sinceMinutes = Number(value);
  }

  return { command, opts };
}

function printHelp() {
  const help = {
    usage: [
      'bot-doctor.js diagnose --agent <agent_id> [--user <telegram_user_id>] [--probe] [--timeout 45]',
      'bot-doctor.js sweep [--user <telegram_user_id>] [--probe] [--timeout 45]',
      'bot-doctor.js logs [--log-lines 3000] [--since-minutes 240]',
      'bot-doctor.js sync-allow --user <telegram_user_id> [--agent <agent_id>]',
    ],
    notes: [
      'All commands output JSON for easy parsing in Codex/Claude Code.',
      'diagnose checks gateway health, routing, allowFrom, pairing queue, model status, optional probe, and log signals.',
      'sync-allow updates allowFrom files in ~/.openclaw/credentials.',
    ],
    env: {
      OPENCLAW_CONFIG_PATH: OPENCLAW_CONFIG_PATH,
    },
  };
  console.log(JSON.stringify(help, null, 2));
}

function main() {
  try {
    const { command, opts } = parseArgs(process.argv.slice(2));
    let payload;

    if (command === 'help' || command === '--help' || command === '-h') {
      printHelp();
      return;
    }

    if (command === 'diagnose') {
      if (!opts.agentId) {
        throw new Error('diagnose requires --agent <agent_id>');
      }
      payload = runDiagnose(opts);
    } else if (command === 'sweep') {
      payload = runSweep(opts);
    } else if (command === 'logs') {
      payload = runLogs(opts);
    } else if (command === 'sync-allow') {
      payload = runSyncAllow(opts);
    } else {
      throw new Error(`Unknown command: ${command}`);
    }

    console.log(JSON.stringify(payload, null, 2));
    process.exit(payload.ok ? 0 : 1);
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error: error.message,
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

main();
