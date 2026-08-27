# AMS n8n Production Runbook

This runbook describes how the checked-in AMS automation should be configured in n8n. The workflow files intentionally contain no shared secret. The secret must be injected into the n8n runtime and into the AMS application environment separately.

## Required runtime variables

| Variable | Required value | Purpose |
|---|---|---|
| `N8N_SHARED_SECRET` | A random value of at least 32 characters | Authenticates n8n callbacks and the campaign webhook request. The value must match the AMS server environment exactly. |
| `AMS_BASE_URL` | `https://alumni.mzcet.in` | Public base URL used by n8n when calling AMS callback endpoints. Do not use `localhost`, an internal port, or an HTTP-only URL in production. |
| SMTP credentials | Managed through an n8n credential | Sends campaign and unmatched-reply notifications without embedding credentials in workflow JSON. |
| IMAP credentials | Managed through an n8n credential | Reads the alumni reply mailbox. |

## Workflow installation

Import `n8n_Workflow_1_Campaign_Sender.json` and `n8n_Workflow_2_Reply_Watcher.json`, or update the existing combined `AMS Email Reply Watcher` workflow with the repaired node definitions. Confirm that the campaign sender webhook path is `ams-campaign-send` and that the reply watcher uses the plus-address format `alumnims+<assignmentId>@mountzion.ac.in`.

The email sender node must be configured to continue through its error output. The success and failure branches must both call the AMS callback endpoint with the same campaign and recipient identifiers. The callback endpoint rejects invalid statuses and ignores duplicate finalization callbacks, which prevents campaign counters from being incremented twice.

## Pre-publish checks

Before publishing, verify the following conditions in n8n. The `N8N_SHARED_SECRET` expression resolves to a non-empty value in the n8n runtime. The SMTP and IMAP credentials are selected from n8n-managed credentials. The callback URL resolves to `https://alumni.mzcet.in/api/v1/email-campaigns/...`, and the request header is `X-Automation-Secret` with the runtime expression rather than a literal secret. Finally, confirm that the workflow is published and that the webhook is active.

Publishing or activating the workflow is a production state change. It should be performed only after the values above have been checked and a controlled test campaign or test mailbox is available.

## Verification sequence

First, call the AMS health endpoint and confirm that it returns HTTP 200. Next, create a test campaign with one non-production recipient, confirm that n8n receives the webhook, verify one success or failure callback in the AMS campaign record, and confirm that the campaign counter changes exactly once. Then send a tagged test reply to the IMAP mailbox and confirm that one `AlumniReplies` record is created. Unmatched replies should notify the administrator without being inserted as a reply for an arbitrary assignment.

The current n8n workspace inspection showed the AMS reply watcher workflow but no recorded executions. The workflow should therefore be published and tested explicitly before being treated as production-ready.
