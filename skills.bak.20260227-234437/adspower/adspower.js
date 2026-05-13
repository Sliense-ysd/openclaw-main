const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

const API_KEY = process.env.ADSPOWER_API_KEY || '';
const CTRL_API_BASE = process.env.ADSPOWER_CTRL_API || 'http://127.0.0.1:20725';
const STATIC_LOCAL_API_BASE = process.env.ADSPOWER_API || '';
const ADSPOWER_BASE_URL = process.env.ADSPOWER_BASE_URL || 'https://api.adspower.com/';
const PROVIDED_AUTH_TOKEN = process.env.ADSPOWER_AUTH_TOKEN || '';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 500;

let localApiBaseCache = STATIC_LOCAL_API_BASE || '';
let authTokenCache = PROVIDED_AUTH_TOKEN || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResponseBody(data) {
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    return { raw: data };
  }
}

function normalizeError(payload) {
  if (!payload) return 'AdsPower API error';
  if (typeof payload.msg === 'string' && payload.msg.length > 0) return payload.msg;
  if (typeof payload.error === 'string' && payload.error.length > 0) return payload.error;
  if (typeof payload.raw === 'string' && payload.raw.length > 0) return payload.raw;
  return 'AdsPower API error';
}

function isRateLimited(payload) {
  const msg = payload?.msg || '';
  return typeof msg === 'string' && msg.toLowerCase().includes('too many request');
}

function isAlreadyStoppedMessage(message) {
  if (typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('not open') ||
    lower.includes('already close') ||
    lower.includes('already closed')
  );
}

function buildUrl(base, path, query = {}) {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function extractAuthTokenFromPs() {
  try {
    const pidsOutput = execSync(
      "ps -axo pid=,command= | grep 'adspower_global/cwd_global/lib/main.min.js' | grep -v grep",
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const pids = pidsOutput
      .split('\n')
      .map((line) => line.trim().split(/\s+/)[0])
      .filter(Boolean);

    for (const pid of pids) {
      try {
        const envLine = execSync(`ps eww -p ${pid}`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        const match = envLine.match(/(?:^|\s)AUTH=([^\s]+)/);
        if (match && match[1]) {
          return match[1];
        }
      } catch {
        // Try next process.
      }
    }
  } catch {
    // Ignore process detection errors.
  }
  return '';
}

async function requestRaw(base, path, query = {}, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = undefined,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  const url = buildUrl(base, path, query);
  const transport = url.protocol === 'https:' ? https : http;
  const requestBody = body === undefined ? null : JSON.stringify(body);
  const mergedHeaders = { ...headers };
  if (requestBody && !mergedHeaders['Content-Type']) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  if (requestBody) {
    mergedHeaders['Content-Length'] = Buffer.byteLength(requestBody);
  }

  return new Promise((resolve, reject) => {
    const req = transport.request(
      url,
      {
        method,
        timeout: timeoutMs,
        headers: mergedHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          const parsed = parseResponseBody(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${normalizeError(parsed)}`));
            return;
          }
          resolve(parsed);
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(new Error(`AdsPower API unreachable: ${err.message}`));
    });

    if (requestBody) req.write(requestBody);
    req.end();
  });
}

async function requestWithRetry(base, path, query = {}, options = {}) {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const payload = await requestRaw(base, path, query, options);
      if (isRateLimited(payload) && attempt < maxRetries) {
        await sleep(RETRY_BACKOFF_MS * (attempt + 1));
        continue;
      }
      return payload;
    } catch (err) {
      const retryable =
        err.message.includes('timeout') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('socket hang up') ||
        err.message.includes('ECONNREFUSED');
      if (!retryable || attempt >= maxRetries) throw err;
      await sleep(RETRY_BACKOFF_MS * (attempt + 1));
    }
  }

  throw new Error('AdsPower request failed after retries');
}

async function isLocalApiReachable(base) {
  try {
    const payload = await requestWithRetry(base, '/status', {}, { maxRetries: 0, timeoutMs: 3000 });
    return payload?.code === 0 || payload?.msg === 'success';
  } catch {
    return false;
  }
}

async function resolveAuthToken() {
  if (authTokenCache) return authTokenCache;
  authTokenCache = extractAuthTokenFromPs();
  return authTokenCache;
}

async function startLocalApi() {
  if (localApiBaseCache) {
    const ok = await isLocalApiReachable(localApiBaseCache);
    if (ok) return localApiBaseCache;
    localApiBaseCache = '';
  }

  const authToken = await resolveAuthToken();
  if (!authToken) {
    throw new Error(
      'Cannot auto-detect AdsPower AUTH token. Set ADSPOWER_AUTH_TOKEN manually or restart AdsPower client.'
    );
  }

  const payload = {};
  if (API_KEY) payload.apiKey = API_KEY;
  if (ADSPOWER_BASE_URL) payload.baseUrl = ADSPOWER_BASE_URL;

  const startRes = await requestWithRetry(CTRL_API_BASE, '/api/startLocalAPI', {}, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: payload,
    maxRetries: 1,
  });

  if (startRes?.code !== 0) {
    throw new Error(normalizeError(startRes));
  }

  const port = startRes?.data?.localAPIPort;
  if (!port) {
    throw new Error('startLocalAPI succeeded but localAPIPort is missing');
  }

  localApiBaseCache = `http://127.0.0.1:${port}`;
  const localApiReady = await isLocalApiReachable(localApiBaseCache);
  if (!localApiReady) {
    throw new Error(`Local API started but not reachable: ${localApiBaseCache}`);
  }
  return localApiBaseCache;
}

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error(
      'Missing ADSPOWER_API_KEY. Export it first: export ADSPOWER_API_KEY=<your_api_key>'
    );
  }
}

async function requestLocal(path, query = {}, options = {}) {
  const { requireApiKey = true } = options;
  if (requireApiKey) ensureApiKey();

  const localApiBase = await startLocalApi();
  const headers = {};
  if (API_KEY) {
    headers['api-key'] = API_KEY;
  }

  return requestWithRetry(localApiBase, path, query, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
}

function ensureSuccess(payload) {
  if (payload?.code !== 0) {
    throw new Error(normalizeError(payload));
  }
}

async function status() {
  const result = {
    ok: false,
    controlApiBase: CTRL_API_BASE,
    localApiBase: STATIC_LOCAL_API_BASE || null,
    hasApiKey: Boolean(API_KEY),
    hasAuthToken: Boolean(PROVIDED_AUTH_TOKEN),
  };

  try {
    const ctrl = await requestWithRetry(CTRL_API_BASE, '/', {}, { maxRetries: 1 });
    result.control = ctrl;
  } catch (e) {
    result.controlError = e.message;
  }

  try {
    const localApiBase = await startLocalApi();
    result.localApiBase = localApiBase;
    const localStatus = await requestWithRetry(localApiBase, '/status', {}, { maxRetries: 1 });
    result.localStatus = localStatus;
    result.ok = true;
  } catch (e) {
    result.localError = e.message;
  }

  return result;
}

async function list() {
  const res = await requestLocal('/api/v1/user/list', { page: 1, page_size: 100 });
  ensureSuccess(res);
  const profiles = (res.data?.list || []).map((p) => ({
    serial_number: p.serial_number,
    name: p.name || p.remark || '',
    group: p.group_name || '',
    status: p.status || 'unknown',
    ip: p.ip || '',
  }));
  return { count: profiles.length, profiles };
}

async function active(serialNumber) {
  const res = await requestLocal('/api/v1/browser/active', { serial_number: serialNumber });
  ensureSuccess(res);
  return { serialNumber, active: res.data || null };
}

async function start(serialNumber) {
  const res = await requestLocal('/api/v1/browser/start', { serial_number: serialNumber });
  ensureSuccess(res);
  const ws = res.data?.ws;
  return {
    serialNumber,
    cdpUrl: ws?.puppeteer || null,
    selenium: ws?.selenium || null,
    debugPort: res.data?.debug_port || null,
    webdriver: res.data?.webdriver || null,
  };
}

async function stop(serialNumber) {
  const res = await requestLocal('/api/v1/browser/stop', { serial_number: serialNumber });
  if (res?.code !== 0) {
    const message = normalizeError(res);
    if (isAlreadyStoppedMessage(message)) {
      return { serialNumber, stopped: true, alreadyStopped: true };
    }
    throw new Error(message);
  }
  return { serialNumber, stopped: true };
}

async function connect(serialNumber, options = {}) {
  const keepOpen = Boolean(options.keepOpen);
  let started = false;
  let startResult = null;
  let browser = null;
  let result = null;
  let stopError = null;

  try {
    startResult = await start(serialNumber);
    started = true;

    if (!startResult.cdpUrl) throw new Error('No CDP URL returned');

    let chromium;
    try {
      chromium = require('playwright').chromium;
    } catch {
      try {
        chromium = require('playwright-core').chromium;
      } catch {
        throw new Error('playwright not installed — run: npm i playwright');
      }
    }

    browser = await chromium.connectOverCDP(startResult.cdpUrl);
    const contexts = browser.contexts();
    const pages = contexts.flatMap((context) => context.pages());
    const pageInfo = await Promise.all(
      pages.map(async (page) => {
        let title = '';
        try {
          title = await page.title();
        } catch {
          title = '';
        }
        return { url: page.url(), title };
      })
    );

    result = {
      ...startResult,
      connected: true,
      contexts: contexts.length,
      pages: pageInfo,
      keepOpen,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Best-effort close.
      }
    }

    if (started && !keepOpen) {
      try {
        await stop(serialNumber);
      } catch (e) {
        stopError = e.message;
      }
    }
  }

  if (!result) {
    throw new Error('Failed to connect to AdsPower profile');
  }

  if (!keepOpen) {
    result.profileStopped = !stopError;
    if (stopError) result.stopError = stopError;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg = args[1];
  const flags = new Set(args.slice(2));

  const commands = {
    status: () => status(),
    list: () => list(),
    active: () => {
      if (!arg) throw new Error('Usage: adspower.js active <serial_number>');
      return active(arg);
    },
    start: () => {
      if (!arg) throw new Error('Usage: adspower.js start <serial_number>');
      return start(arg);
    },
    stop: () => {
      if (!arg) throw new Error('Usage: adspower.js stop <serial_number>');
      return stop(arg);
    },
    connect: () => {
      if (!arg) throw new Error('Usage: adspower.js connect <serial_number> [--keep-open]');
      return connect(arg, { keepOpen: flags.has('--keep-open') });
    },
  };

  if (!cmd || !commands[cmd]) {
    console.log(
      JSON.stringify(
        {
          error: `Unknown command: ${cmd || '(none)'}`,
          usage:
            'adspower.js <status|list|active|start|stop|connect> [serial_number] [--keep-open]',
          env: {
            ADSPOWER_API: STATIC_LOCAL_API_BASE || '(auto)',
            ADSPOWER_CTRL_API: CTRL_API_BASE,
            ADSPOWER_API_KEY: API_KEY ? 'set' : 'missing',
            ADSPOWER_AUTH_TOKEN: PROVIDED_AUTH_TOKEN ? 'set' : '(auto)',
            ADSPOWER_BASE_URL,
          },
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  try {
    const result = await commands[cmd]();
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }, null, 2));
    process.exit(1);
  }
}

main();
