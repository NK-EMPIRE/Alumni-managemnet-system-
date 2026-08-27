# Alumni Management System — Production Audit and Automation Report

**Repository:** `NK-EMPIRE/Alumni-managemnet-system-`  
**Branch:** `naveen`  
**Scope:** Security hardening, performance, UI reliability, n8n campaign automation, and controlled email testing.

## Executive summary

The `naveen` branch was audited and hardened across the Express server, authorization services, password recovery, file-import pipeline, email automation, realtime client connections, admin dashboard loading, export behavior, dependency set, and repository hygiene. The latest follow-up change corrects the testing behavior: **normal production campaigns can still send to eligible alumni**, while an explicit **Test mode** routes the campaign only to the two approved test addresses.

The application and checked-in n8n workflow now enforce this separation. Test mode is an explicit request flag, exposed through the campaign modal. The AMS API replaces the selected alumni destinations with exactly the approved test recipients before dispatch. The n8n sender applies a second fail-closed check before SMTP whenever `testMode` is true. A normal campaign with `testMode` false continues to use the eligible alumni recipient list.

No email was sent during this work. No workflow execution was triggered. The live n8n editor became intermittently offline while being inspected, so the final live draft/publish state must be confirmed in n8n before the first controlled test.

## Approved test recipients

| Address | Role |
|---|---|
| `naveen.karthickbusiness@gmail.com` | Controlled test recipient |
| `sundareswaran9407@mountzion.ac.in` | Controlled test recipient |

These addresses are used only when **Test mode** is enabled. Any other address in a test-mode payload causes the n8n authorization gate to fail and prevents the SMTP node from being reached.

## Implemented changes

| Area | Change |
|---|---|
| Server security | Strict CORS origin parsing, Helmet security headers, safer body limits, API JSON 404 handling, production secret checks, response compression, and authenticated Socket.IO handshakes. |
| Authorization | Assignment ownership checks for alumni mutations and history access, capped pagination, role-case authorization fixes, and register-number validation. |
| Password security | Removed predictable default reset credentials, added cryptographically generated temporary passwords, retained forced password rotation, and prevented unknown-account reset enumeration. |
| File imports | Temporary upload files are deleted after import, preview, or sheet inspection. Company/designation normalization is awaited before persistence. The vulnerable `xlsx` dependency was replaced with ExcelJS, with a compatible `uuid` override. |
| Email automation | Removed committed n8n secrets and unsafe URL fallbacks, required the public AMS callback URL in production, excluded completed assignments, validated callback statuses, and made duplicate callbacks idempotent. |
| Test-mode routing | Added `testMode` to the campaign API and payload. In test mode, the AMS application replaces alumni destinations with exactly the two approved test addresses. |
| n8n safety | The sender authorization gate requires the shared secret and allows either normal mode or a test-mode payload whose every recipient is on the two-address allowlist. |
| Campaign UI | Added a clearly labeled **Test mode** checkbox to the team-leader and team-member campaign modals. The checkbox is reset on each modal open and its value is sent with the launch request. |
| Dashboard performance | Reduced initial admin payloads to bounded pages and changed exports to fetch pages of 100 records instead of issuing one oversized request. |
| Realtime UI | Admin, leader, and notification Socket.IO clients now pass the access token during the handshake. |
| Repository hygiene | Removed committed runtime logs and uploaded workbooks and strengthened ignore rules. |

## Verification results

| Check | Result |
|---|---:|
| JavaScript syntax check | Passed — 102 files checked |
| Unit and regression tests | Passed — 8 tests |
| HTTP smoke test | Passed — health response, CSP, no Express `x-powered-by`, and API 404 behavior |
| n8n workflow JSON validation | Passed — both workflow files parse successfully |
| Test recipient helper | Covered — exactly the two approved addresses are generated and alumni addresses are not retained |
| Dependency audit | Passed in the prior verified change set — 0 vulnerabilities |
| Email execution | Not performed |
| n8n workflow execution | Not performed |
| n8n publish/activation | Not confirmed because the live editor became intermittently offline |

## Live n8n status

The live workspace contains the `AMS Email Reply Watcher` workflow and its sender branch. The primary sender authorization node was opened and edited in the browser draft to use the following logic:

> Shared secret matches **and** (`testMode` is false **or** every recipient is one of the two approved test addresses).

The editor later displayed `Offline`, and the browser session stopped responding reliably. Therefore, the live edit must not be treated as published until the n8n editor reconnects and the configuration is visibly saved/published.

## Correct testing procedure

First deploy the latest `naveen` branch to the AMS host and confirm the application environment contains `AMS_BASE_URL=https://alumni.mzcet.in`, the correct n8n webhook URL, and the same strong `N8N_SHARED_SECRET` used by n8n. Then update the live n8n sender authorization node with the checked-in workflow logic, verify SMTP/IMAP credentials and callback URLs, save the workflow, and publish it.

For the first email test, open the AMS campaign modal, enable **Test mode**, and confirm the warning lists only the two approved addresses. Before launching, verify that the request is a test campaign. The resulting AMS payload will contain only `naveen.karthickbusiness@gmail.com` and `sundareswaran9407@mountzion.ac.in`; no alumni address will be dispatched. I did not perform this send because it requires explicit confirmation immediately before sending.

For normal production use, leave **Test mode** unchecked. The API will select eligible alumni according to team and assignment rules, and n8n will send those dynamic recipients through the regular campaign path.

## Pushed code

The earlier audit/hardening commits were pushed to `origin/naveen`. The current follow-up contains the test-mode routing correction, UI controls, workflow expression update, regression coverage, and runbook correction. After verification, these follow-up changes should be committed and pushed to the same branch.
