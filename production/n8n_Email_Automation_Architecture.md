# Email Automation via n8n — Full Architecture & Build Prompt

## FIX 0 — Prerequisite, do this before anything else

`backend/src/helpers/email.js`'s `sendEmail()` is mocked — it never calls
`getTransporter().sendMail()`, just logs and returns a fake success. Real
SMTP delivery has never worked. Fix this function to actually call
`getTransporter().sendMail({ from, to, subject, html })` and return the
real result. Verify with one real test email before building anything else
in this doc. Also confirm `CORS_ORIGIN` in production `.env` is your real
domain (`https://alumnims.mzcet.in`), not the `*` wildcard default.

---

## Architecture overview

```
AMS Backend (Node/Express)          n8n (self-hosted, same college server)
─────────────────────────           ──────────────────────────────────────
Leader clicks "Request Details"
  → preview modal (existing pattern)
  → POST /api/v1/email-campaigns
     {leaderId, assignmentIds[]}   ──webhook──▶  [Campaign Trigger Workflow]
                                                        │
                                                  Split into batches
                                                  (e.g. 25/batch)
                                                        │
                                                  Loop: SMTP Send node
                                                  (rate-limited, delay
                                                   between batches)
                                                        │
                                                  HTTP node reports each
                                                  send status back
◀── POST /api/v1/email-campaigns/:id/log  ───────────┘
     {assignmentId, status, messageId}

─────────────────────────           ──────────────────────────────────────
                              [IMAP Trigger Workflow — separate, always-on]
                                    Watches shared mailbox
                                    New mail arrives → parse To: header
                                    Extract assignmentId from
                                    plus-address (alumnirequests+
                                    {assignmentId}@mountzion.ac.in)
                                          │
                                    HTTP node → POST callback
◀── POST /api/v1/email-campaigns/replies/ingest ─────┘
     {assignmentId, rawReplyText, receivedAt}
     → stored in AlumniReplies table
     → surfaced in assigned member's dashboard
```

Two separate n8n workflows, not one: a **trigger-based send workflow**
(fires per campaign) and an **always-on IMAP watch workflow** (runs
independently, forever). Don't conflate them — a failure in one shouldn't
take down the other.

---

## Database changes (new tables, additive only — no changes to existing tables)

```sql
CREATE TABLE EmailCampaigns (
    campaign_id INT IDENTITY PRIMARY KEY,
    leader_id INT NOT NULL REFERENCES Users(user_id),
    team_id INT NOT NULL REFERENCES Teams(team_id),
    total_recipients INT NOT NULL,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Queued', -- Queued, InProgress, Completed, Failed
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    completed_at DATETIME2 NULL
);

CREATE TABLE EmailCampaignRecipients (
    recipient_id INT IDENTITY PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES EmailCampaigns(campaign_id),
    assignment_id INT NOT NULL REFERENCES AlumniAssignments(assignment_id),
    alumni_id INT NOT NULL REFERENCES Alumni(alumni_id),
    email VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, Sent, Failed, Bounced
    message_id VARCHAR(255) NULL,
    sent_at DATETIME2 NULL
);

CREATE TABLE AlumniReplies (
    reply_id INT IDENTITY PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES AlumniAssignments(assignment_id),
    alumni_id INT NOT NULL REFERENCES Alumni(alumni_id),
    raw_reply_text NVARCHAR(MAX) NOT NULL,
    received_at DATETIME2 DEFAULT GETUTCDATE(),
    review_status VARCHAR(30) DEFAULT 'Pending Review', -- Pending Review, Reviewed
    reviewed_by INT NULL REFERENCES Users(user_id),
    reviewed_at DATETIME2 NULL
);
CREATE INDEX IX_AlumniReplies_Assignment ON AlumniReplies(assignment_id);
CREATE INDEX IX_EmailCampaignRecipients_Campaign ON EmailCampaignRecipients(campaign_id);
```

Add as a numbered migration file per the existing migration runner pattern
(`003_email_automation.sql`), not inline DDL.

---

## Backend endpoints (Node/Express, reuse existing auth middleware)

All endpoints below require the existing JWT auth middleware. The two n8n
callback endpoints additionally require a shared-secret header check —
see Security section.

1. **`POST /api/v1/email-campaigns`** (Leader only, role-checked)
   Body: `{ assignmentIds: [...] }` — or omit to mean "all my team's
   assignments with a non-null alumni email."
   - Validates the leader owns/leads the team for every assignment ID
     given (reuse the same team-scoping check as Feature 1's reassign
     endpoint — don't write a new authorization check from scratch).
   - Creates one `EmailCampaigns` row + one `EmailCampaignRecipients` row
     per alumnus with a valid email.
   - Fires the n8n webhook (`N8N_CAMPAIGN_WEBHOOK_URL` env var) with
     `{ campaignId, recipients: [{recipientId, assignmentId, name, email}] }`.
   - Returns `{ campaignId, totalRecipients }` immediately — actual
     sending happens async in n8n, don't block the HTTP response on it.

2. **`GET /api/v1/email-campaigns/:id`** (Leader/Admin)
   Returns live campaign status — `sent_count`, `failed_count`,
   `total_recipients`, `status`. Frontend polls this every few seconds
   while a campaign is `InProgress` (or use Feature 5's Socket.io room —
   emit `campaignProgress` on each log-ingest call instead of polling, if
   Feature 5 is already built).

3. **`POST /api/v1/email-campaigns/:id/log`** (n8n → AMS, secret-protected)
   Body: `{ recipientId, status: 'Sent'|'Failed', messageId }`.
   Updates `EmailCampaignRecipients` row, increments the parent
   `EmailCampaigns.sent_count`/`failed_count`. When all recipients are
   accounted for, set `EmailCampaigns.status = 'Completed'`.

4. **`POST /api/v1/email-campaigns/replies/ingest`** (n8n → AMS,
   secret-protected)
   Body: `{ assignmentId, rawReplyText, receivedAt }`.
   Validates `assignmentId` exists and has a `member_id` assigned, inserts
   into `AlumniReplies`. Does NOT touch `Alumni` table directly — human
   review only, per the standing rule in this project (no silent
   auto-write from unverified external input, same principle as the alias
   auto-learning fix and the LinkedIn extractor design).

5. **`GET /api/v1/email-campaigns/replies`** (Member/Leader/Admin, scoped)
   Returns pending replies for the logged-in user's own assignments
   (Member), team (Leader), or all (Admin) — reuse the same role-scoping
   pattern as every other list endpoint in this app.

6. **`POST /api/v1/email-campaigns/replies/:id/review`** (Member/Leader)
   Marks a reply `Reviewed` after the member has read it and manually
   updated the alumnus's record through the normal edit flow. This is a
   status flag, not an auto-update trigger.

---

## n8n workflow design

### Workflow 1 — Campaign Sender (webhook-triggered)

1. **Webhook node** — receives `{campaignId, recipients[]}` from AMS.
   Validate the shared secret header immediately; reject with 401 if
   missing/wrong before doing anything else.
2. **Split In Batches node** — batch size 25 (tune based on your SMTP
   provider's per-minute limit; if using college SMTP, ask IT what their
   actual rate limit is before hardcoding a number).
3. **Loop body**: for each recipient in the batch —
   - **Set node**: build personalized subject/HTML body, and the
     `Reply-To` header as `alumnirequests+{{assignmentId}}@mountzion.ac.in`
     (or whatever your actual shared mailbox domain is).
   - **Send Email (SMTP) node**.
   - **HTTP Request node** → `POST {AMS_BASE_URL}/api/v1/email-campaigns/{{campaignId}}/log`
     with the send result (success/fail + provider messageId), authenticated
     with the shared secret header.
4. **Wait node** between batches (e.g. 10-30 seconds) to avoid tripping
   spam/rate-limit flags on the sending mailbox.
5. **Error handling**: wrap the SMTP Send node with an error-output branch
   that still calls the log endpoint with `status: 'Failed'` — a failed
   send must not silently vanish, it needs to show up in the campaign
   status the leader sees.

### Workflow 2 — Reply Watcher (always-on, IMAP trigger)

1. **Email Trigger (IMAP) node** — polls the shared mailbox
   (`alumnirequests@mountzion.ac.in`) on an interval (e.g. every 2 minutes).
2. **Function/Code node** — parse the `To`/`Delivered-To` header for the
   `+assignmentId` tag. If no valid tag is found (someone replied from a
   forwarded/altered thread), route to a fallback branch: notify an admin
   inbox that an unmatched reply arrived, rather than silently dropping it.
3. **HTTP Request node** → `POST {AMS_BASE_URL}/api/v1/email-campaigns/replies/ingest`
   with the extracted `assignmentId` + reply body text, shared-secret
   authenticated.
4. Mark the email as read/move to a processed folder in the IMAP node
   settings, so it isn't re-ingested on the next poll cycle.

### "Clone single workflow into many things" — how to actually do this in n8n

You don't hand-clone the workflow per team/leader. Build it **once**,
parameterized entirely by the webhook payload (`campaignId`, `recipients`,
mailbox address as an n8n **Credential**, not hardcoded). One workflow
instance serves every leader and every campaign — the payload from AMS is
what varies, not the workflow. If you literally duplicate the workflow
per-leader, you've built something that breaks the moment you add a new
leader and someone forgets to clone-and-edit it. Don't do that. Use
n8n's built-in **Sub-workflow** node if you want to reuse the "send one
personalized email" logic inside both the initial campaign AND a future
manual resend/retry feature — call it as a sub-workflow from both parents
instead of copy-pasting the node chain twice.

---

## Load management

- **Batching**: covered above (Split In Batches + Wait node).
- **Don't fire two campaigns concurrently against the same mailbox** — add
  a simple lock: before Workflow 1 starts sending, check
  `GET /api/v1/email-campaigns?status=InProgress` — if one's already
  running, queue the new one (n8n's built-in queue mode, or simply have
  the AMS backend reject a new campaign creation with a 409 while one is
  `InProgress`, and let the leader retry once it's done). Simpler to
  enforce this in the AMS backend than in n8n.
- **DB connection load**: the log/ingest endpoints will get called once
  per recipient per campaign — for large batches (hundreds of alumni),
  that's hundreds of small HTTP calls hitting your Node backend and MSSQL.
  This is fine at college scale, but don't have each call open a new DB
  connection — confirm your existing `mssql` pool config
  (`DB_POOL_MIN`/`DB_POOL_MAX` in `.env`) has enough headroom; 10 max
  connections is likely fine for this volume but worth a quick check under
  real load once built.

---

## Security (non-negotiable, in order of importance)

1. **Shared secret between AMS and n8n.** Every AMS→n8n webhook call and
   every n8n→AMS callback must include a header like
   `X-Automation-Secret: {value}`, checked against an env var
   (`N8N_SHARED_SECRET`) on both sides. Without this, anyone who discovers
   either URL can trigger mass emails or inject fake alumni replies
   straight into your database — this is not optional hardening, it's the
   minimum bar.
2. **n8n itself must be behind auth.** Self-hosted n8n has its own login —
   make sure it's not left on default credentials, and don't expose the
   n8n editor UI on a public port without a reverse proxy + auth in front
   of it (e.g. Nginx basic auth, or keep it on localhost/internal network
   only, accessible via SSH tunnel or VPN, not the public domain).
3. **Rate-limit the campaign creation endpoint** on the AMS side — a
   leader (or a compromised leader account) triggering the same campaign
   repeatedly could spam the entire alumni base. A simple check ("no new
   campaign from this leader within the last N minutes") is enough at this
   scale.
4. **Validate `assignmentId` ownership on every reply ingest** — the
   ingest endpoint must confirm the assignment actually exists before
   inserting into `AlumniReplies`; don't trust n8n's parsed value blindly
   even though n8n itself is behind the shared secret (defense in depth —
   n8n could relay a malformed/manipulated header if the mailbox is ever
   compromised).
5. **Don't let reply text auto-write to `Alumni`.** Already covered above,
   repeating because it's the single most important rule in this whole
   feature — a reply is untrusted external input from a stranger's inbox,
   never write it directly into your production data.

---

## Frontend (premium UI/UX, keep it scoped)

- Leader dashboard: "Request Details" button → existing-pattern preview
  modal (recipient count + list) → confirm → campaign progress bar
  (live via Socket.io `campaignProgress` room event, or polling
  `GET /api/v1/email-campaigns/:id` every 3-5s if Feature 5 isn't built
  yet) → completion summary (sent/failed counts).
- Member dashboard: new "Alumni Replies" section/badge showing pending
  reply count, list view (alumnus name, reply snippet, received date) →
  click to expand full reply text → "Mark Reviewed" after they've updated
  the record through the existing edit form. Don't build a separate
  edit-from-reply UI — route them to the existing alumni edit screen,
  reuse it.
- Keep visual design consistent with the existing Reassign/DB
  Health/Calendar modals already built — same modal card style, same
  button hierarchy (primary action right-aligned, cancel/secondary left).
  Don't introduce a new design language for this one feature.

---

## Build order

1. Fix 0 (email actually sends) — mandatory first, nothing else works
   without it.
2. Database migration (new tables).
3. Backend endpoints 1-3 (campaign creation, status, send-log ingest) +
   n8n Workflow 1 (sender) — build and test send-side completely before
   touching replies.
4. Backend endpoints 4-6 (reply ingest, list, review) + n8n Workflow 2
   (IMAP watcher) — build and test reply-side once send-side is proven
   working end-to-end with a real test campaign to a real test alumnus
   email you control.
5. Frontend (leader campaign UI, member reply inbox).
6. Load/security hardening pass — rate limiting, connection pool check,
   n8n auth lockdown — after the feature works, before real alumni data
   goes through it.

Show me the exact endpoint contracts and the n8n workflow JSON export
before wiring the frontend. Wait for go-ahead after step 3 before starting
step 4 — verify the sender half completely with a real test send first.
