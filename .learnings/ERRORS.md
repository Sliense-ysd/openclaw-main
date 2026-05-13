# Errors Log

Command failures, exceptions, and unexpected behaviors.

---

## 2026-05-03 - Portal download loops through unstable browser automation

Pattern-Key: browser-portal-download-fallback-ladder

Context:
- A bank/company portal document download task took too long because the workflow kept retrying local browser and GStack Browser actions after repeated connection/download failures.
- The real work had separate layers: authenticate, navigate to the document page, identify the document URL/button, capture the download event, verify the file.
- Treating the whole flow as "click around until the file appears in Downloads" created repeated low-signal retries.

Failure mode:
- Retried the same browser/GStack path after daemon instability and backend download errors.
- Used broad local searches that produced excessive noise and risked exposing unrelated secrets in terminal output.
- Switched too late to Playwright persistent context and explicit download-event handling.

Corrective rule:
- For authenticated portal downloads, use visual browser only for login/MFA. After authentication, use Playwright or equivalent automation to inspect DOM links and capture `download` events with explicit output paths.
- Cap identical retries at 2. If the same command, click path, cookie import, or daemon fails twice, change layer instead of restarting.
- Search credentials narrowly under `~/ai-shared/secrets/` and directly relevant project folders; avoid broad `rg` over CloudStorage, runtime dumps, venvs, or downloaded archives.
- Verify downloaded documents by filename, size, openability, entity name, address, date/month, and account/product label before declaring completion.
