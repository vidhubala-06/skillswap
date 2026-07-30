# SkillSwap — Complete Page & Functionality Specification

**Stack:** React + Tailwind (frontend) | Node + Express (backend) | MySQL via `mysql2` | Socket.io (real-time) | Resend (email) | Cloudinary (media)

Refer to `SkillSwap-Database-Design.md` for full table schemas referenced throughout.

---

## Site Map / Navigation Flow

```
Landing → Sign Up → Email Verify Pending → (click email link) → Login
Login → Dashboard (if verified skill exists) OR Quiz Landing (if not)
Login (admin) → Admin Dashboard

Dashboard ──┬── My Profile
            ├── Find Match ── Matched Profile ── (send request) ── Swap Requests
            ├── Swap Requests ── (accept) ── Active Swap ── Cooldown Selection ── Dashboard
            ├── Chat (inbox + threads)
            ├── Notifications
            └── Quiz Landing ── Quiz Attempt ── Quiz Result
```

---

## PAGE 1 — Landing Page

**Purpose:** Public marketing page, no auth required.

**Components:** Nav (logo, Log In / Sign Up buttons), hero section, feature highlights, footer.

**Data flow:** None — fully static, zero DB/API calls.

---

## PAGE 2 — Sign Up Page

**Components:** Email, Password, Confirm Password, Terms checkbox, Submit button, error banner, "Already have an account?" link.

**Logic & Data Flow:**
1. Client-side validation (format, match, terms checked)
2. `POST /api/auth/signup`
3. Backend: re-validate → check email uniqueness → bcrypt hash password → insert `users` → generate token → insert `auth_tokens` (type='email_verification') → send Resend email → all wrapped in a transaction (rollback if token insert fails, preventing an unverifiable "ghost" account)
4. Redirect → Page 3

**Tables touched:** `users`, `auth_tokens`

---

## PAGE 3 — Email Verification Pending Page

**Components:** "Check your inbox" message, Resend button (60s cooldown), wrong-email link.

**Logic & Data Flow:**
- Resend: `POST /api/auth/resend-verification` → delete old tokens of type='email_verification' → generate new → send new email
- Verification link handler (not a full page — fires on load): `POST /api/auth/verify-email {token}` → validate not expired → `UPDATE users SET email_verified=true` → delete all tokens for user → redirect to Login

**Tables touched:** `users`, `auth_tokens`

---

## PAGE 4 — Login Page

**Components:** Email, Password, Forgot Password link, Submit, error banner.

**Logic & Data Flow:**
1. `POST /api/auth/login`
2. Backend: lookup by email → generic error if not found ("Invalid email or password") → bcrypt compare → check `email_verified` (specific error if false) → check `account_status` (block if `permanently_banned`; if `temp_banned` and `temp_ban_until` still future, block; if passed, reactivate to `active` inline)
3. On success: sign JWT access token (15 min), generate + hash refresh token (7 day), insert into `refresh_tokens`, set both as httpOnly cookies (`secure` flag conditional on `NODE_ENV`)
4. Redirect by role: admin → Admin Dashboard; user → Dashboard (if ≥1 verified skill) or Quiz Landing (if not)

**Auth architecture (applies to EVERY subsequent request):** Middleware verifies JWT on each request; expired → frontend auto-calls `/api/auth/refresh`; refresh invalid/revoked → force logout. Socket.io handshake reuses the same cookie-based verification.

**Tables touched:** `users`, `refresh_tokens`

---

## PAGE 5 — Forgot / Reset Password Page

**Components:** Step 1 (email input, generic confirmation message), Step 2 (new password + confirm, reached via emailed link).

**Logic & Data Flow:**
1. `POST /api/auth/forgot-password` → always returns identical generic response regardless of whether email exists (prevents enumeration) → internally, if found: delete old `password_reset` tokens, insert new (1hr expiry), send email
2. `POST /api/auth/reset-password {token, newPassword}` → validate token → update `password_hash` → delete token → **revoke ALL refresh_tokens for that user** (forces logout everywhere, security best practice) → redirect to Login

**Tables touched:** `users`, `auth_tokens`, `refresh_tokens`

---

## PAGE 6 — Profile Setup Page

**Components:** Name, LinkedIn URL, GitHub URL, Experience textarea; Known Skills section (debounced search dropdown, chips, "Add new skill" option); Wanted Skills section (mirrored); cross-exclusion (a skill selected in one list is filtered out of the other's search); Save button.

**Logic & Data Flow:**
- **Skill search:** debounced 300ms → `GET /api/skills/search?q=` → `LIKE` prefix-ranked query on `skills` (no status filter needed — table only ever contains live, real skills)
- **Add new skill:** does NOT add directly — submits to `skill_suggestions` (`status='pending'`), with duplicate-detection incrementing `request_count` if already pending. No chip added.
- **Save:** validation BEFORE transaction — (1) in-memory known/wanted overlap check, (2) confirm all skill IDs exist in DB — then transaction: upsert `profiles`, insert/delete `user_known_skills` (new ones as `pending_quiz`) and `user_wanted_skills` to match current selection
- Redirect → Quiz Landing Page (Page 7), carrying the pending-quiz skill list

**Tables touched:** `profiles`, `skills`, `skill_suggestions`, `user_known_skills`, `user_wanted_skills`

---

## PAGE 7 — Quiz Landing Page

**Components:** One card per known skill — status badge (Not Started / Verified / Cooldown + live countdown), Start/Retry Quiz button (enabled per status + cooldown expiry).

**Logic & Data Flow:**
- `GET /api/quiz/status` → joined query ordered to surface actionable items first (pending_quiz → cooldown → verified)
- **Onboarding gate:** if the user has 0 verified skills, navigation to Dashboard/Find Match/etc. is blocked — a persistent banner shows here: "Pass at least one quiz to unlock the rest of SkillSwap." Enforced by backend middleware (`requireAtLeastOneVerifiedSkill`) on gated routes, not just frontend hiding.
- Clicking Start/Retry → `POST /api/quiz/start {skillId}` → backend re-validates eligibility (status/cooldown, live) → pulls 25 random questions from the pre-generated `quiz_questions` bank for that skill → shuffles each question's options (Fisher-Yates) → inserts into `quiz_sessions` → strips correct answers → sends to frontend with `sessionId`
- Navigate → Quiz Attempt Page (Page 8)

**Tables touched:** `user_known_skills`, `skills`, `quiz_questions` (read), `quiz_sessions` (insert)

---

## PAGE 8 — Quiz Attempt Page

**Components:** Progress indicator ("Question X of 25"), countdown timer (20 min), question text, 4 option cards, Next/Submit button. No back-navigation.

**Logic & Data Flow:**
- Answers held in frontend state; one final `POST /api/quiz/submit {sessionId, answers}` at the end
- Backend validates session (belongs to requester, `status='active'`, not expired) → grades deterministically (string comparison, 2 marks/correct) → pass threshold **≥48/50** (≤1 wrong allowed)
- Updates `quiz_sessions.status='submitted'` → inserts permanent `quiz_attempts` row → updates `user_known_skills`:
  - Pass → `status='verified'`, `best_quiz_score`, `verified_at=NOW()`
  - Fail → `status='cooldown'`, `cooldown_until = NOW() + INTERVAL 24 HOUR` (hardcoded constant, never client-supplied)
- Navigate → Quiz Result Page (Page 9)

**Quiz question SOURCE (important):** questions are NOT generated live per attempt. They are generated ONCE per skill (30 questions, via one LLM call) either during initial seeding or the moment a new skill is created by an admin. Quiz-taking only ever reads from the pre-built `quiz_questions` bank — no LLM call on this hot path.

**Retention:** `quiz_sessions` rows cleaned up 24-48hrs after submission via a monitored `node-cron` job (logged, not blindly trusted — live-query filtering on `status='active'` protects correctness even if cleanup lags). `quiz_attempts` retained permanently (negligible size at any realistic scale).

**Tables touched:** `quiz_sessions`, `quiz_attempts`, `user_known_skills`

---

## PAGE 9 — Quiz Result Page

**Components:** Score display, pass/fail banner, self-rating input (1-10, if passed), cooldown countdown (if failed).

**Logic & Data Flow:**
- Result data arrives directly from Page 8's submit response (no extra fetch)
- If passed: `POST /api/skills/self-rating {skillId, rating}` → backend confirms skill is actually `verified` first → `UPDATE user_known_skills SET self_rating=?`
- Redirect: if this was the user's first-ever pass (unlocking onboarding), show a small celebratory note and go to Dashboard; otherwise back to Quiz Landing (more skills may still be pending) or Dashboard

**Tables touched:** `user_known_skills`

---

## PAGE 10 — Dashboard / Home

**Components:** Welcome header, profile summary card, known/wanted skill count badges, active-swap banner (if locked), pending-requests indicator, quick actions (Find Match, Quiz Status).

**Route gate:** `requireAtLeastOneVerifiedSkill` middleware applies here.

**Logic & Data Flow:**
- `GET /api/dashboard` — aggregates: profile name, skill counts (verified/pending/cooldown via `SUM(CASE...)`), wanted count, active lock + partner info (if locked), pending incoming request count — all cheap, indexed, single-row/small-aggregate queries

**Tables touched:** `profiles`, `user_known_skills`, `user_wanted_skills`, `user_locks`, `swap_requests`

---

## PAGE 11 — My Profile Page (view/edit)

**Components:** Same as Profile Setup, pre-filled; skill chips removable; **Teaching Cooldowns section** (new) — list of skills ever taught, each showing current cooldown status, editable custom-days input + "Clear Cooldown" button.

**Logic & Data Flow:**
- Load: profile + known/wanted skills + `skill_cooldowns` rows (only skills ever taught appear here)
- Save (profile/skills): same validation-before-transaction pattern as Setup, PLUS:
  - **Verified-count guard:** removing a known skill is blocked if it would drop verified-skill count below 1 (checked before transaction: count current verified, subtract those being removed, reject if result < 1)
  - **Active-swap guard:** removing a skill currently the subject of an active locked swap is blocked
- Edit Teaching Cooldown: `POST /api/skill-cooldowns/:skillId/update {cooldownDays}` → validated (0-365 or null) → upserts `skill_cooldowns.cooldown_until` (server-computed) → takes effect immediately in Find Match queries (same table, single source of truth)

**Tables touched:** `profiles`, `user_known_skills`, `user_wanted_skills`, `skill_cooldowns`, `skill_suggestions`, `user_locks` (for active-swap guard check)

---

## PAGE 12 — Find Match Page

**Components:** Wanted-skill selector, "Find Match" button, results (match-type label: Mutual/One-way; progressively-rendered cards with "Load More" — full result set fetched at once, frontend paces rendering, no backend LIMIT).

**Route gate:** `requireAtLeastOneVerifiedSkill`.

**Logic & Data Flow:**
- Two-way query first: filters `user_known_skills` (skill_id + status='verified'), excludes quiz-fail cooldown, excludes locked users (`user_locks`), excludes teaching-cooldown'd users (`skill_cooldowns`), excludes banned users (`account_status='active'`), requires reciprocal want-match via `EXISTS` subquery. `ORDER BY RAND()`, no LIMIT.
- If zero results → fallback query (same filters, drops the reciprocal requirement)
- Response: `{matchType, results[]}`

**Efficiency:** driving filter hits composite index `(skill_id, status)`; all exclusion checks are indexed point lookups on small candidate sets; `ORDER BY RAND()` without LIMIT is acceptable at realistic project scale (hundreds of candidates).

**Tables touched:** `user_known_skills`, `user_wanted_skills`, `skills`, `user_locks`, `skill_cooldowns`, `profiles`, `users` (account_status)

---

## PAGE 13 — Matched User's Public Profile Page

**Components:** Name, LinkedIn/GitHub, experience, full known-skills list (with ratings), wanted-skills list, "Send Swap Request" button, conditional "Message" button (visible only once a `conversations` row exists between the pair).

**Logic & Data Flow:**
- Load: explicit column selection only (never `SELECT *`) — profile, known skills, wanted skills, plus a `conversations` existence check for the Message button
- **Send Request:** modal (wanted skill locked/pre-filled, offered skill dropdown from requester's own verified skills) → `POST /api/swap-requests`
  - ALL validation runs BEFORE any transaction: requester's offered skill still verified, recipient's wanted skill still verified, neither party locked, no duplicate pending request, recipient not in teaching cooldown, recipient not banned
  - **Stale-data handling:** each validation failure returns a distinct error code (e.g., `RECIPIENT_SKILL_UNAVAILABLE`, `RECIPIENT_LOCKED`, `RECIPIENT_IN_COOLDOWN`, `DUPLICATE_PENDING_REQUEST`) — frontend catches each specifically, refetches the profile to show current data, and guides the user accordingly (rather than a generic dead-end error)
  - On success (transaction): insert `swap_requests` (status='pending') + upsert `conversations` (using `LEAST()`/`GREATEST()` for canonical pair ordering, pointing `latest_swap_request_id` to the new request — this is what OPENS the chat channel) → Resend email to recipient → notification inserted

**Tables touched:** `profiles`, `user_known_skills`, `user_wanted_skills`, `swap_requests`, `conversations`, `user_locks`, `skill_cooldowns`, `notifications`

---

## PAGE 14 — Swap Requests Page (Received / Sent / Completed)

**Components:** Three tabs.
- **Received:** pending requests, Accept / Reject (reason-required modal) buttons
- **Sent:** pending/rejected/cancelled requests, reject reason shown inline, Cancel button (pending only)
- **Completed:** full permanent history, "skill I taught" / "skill I learned" per row

**Logic & Data Flow:**
- **Accept (transactional, race-safe via `FOR UPDATE`):** re-check still pending → check neither locked → update `status='accepted'` → insert `user_locks` for both → **auto-cancel** all OTHER pending requests involving either party immediately (not deferred) → commit → email + notification to requester → redirect both to Active Swap Page
- **Reject:** `UPDATE ... SET status='rejected', reject_reason=? WHERE status='pending'` (guards race) → email + notification → chat auto-blocks (status-driven, no separate action)
- **Cancel (requester only, pending only):** `UPDATE ... WHERE requester_id=? AND status='pending'` → same chat-blocking effect

**Tables touched:** `swap_requests`, `user_locks`, `notifications`

---

## PAGE 15 — Active Swap Page

**Components — two gated states:**
- **State 1 (accepted, unscheduled):** ONLY Session Scheduler visible/actionable (date + time picker, Confirm button); everything else hidden with banner. Chat shortcut remains accessible. "Report an Issue" available.
- **State 2 (in_progress, scheduled):** full page — session details (editable), chat shortcut, dual-confirmation section ("You: ✅/⏳", "Partner: ✅/⏳"), "Report an Issue" still available.

**Logic & Data Flow:**
- **Scheduling:** `UPDATE swap_requests SET session_date=?, session_time=?, status='in_progress'` — this status transition IS the mandatory gate (mark-complete endpoint only checks `status='in_progress'`, which implies scheduling is done)
- **Reminder emails:** `node-cron` job (every 5-10 min) checks for sessions matching "today" or "within next hour", tracked via `day_reminder_sent`/`hour_reminder_sent` flags to prevent duplicates
- **Mark Complete (dual confirmation):** gate-checked (`status='in_progress'`) → sets requester or recipient's flag → Socket.io emits live update to both → when BOTH flags true (transaction): `status='completed'`, `completed_at=NOW()`, release both `user_locks` → redirect both to Cooldown Selection
- **Report an Issue:** modal (reason required) → `POST /api/reports {swapRequestId, reason}` → validated (reporter is a participant, status is accepted/in_progress) → inserted as `status='pending'` for admin review

**Tables touched:** `swap_requests`, `user_locks`, `reports`, `notifications`

---

## PAGE 16 — Post-Swap Cooldown Selection Page

**Components:** "You taught `<skill>`" header, custom-days number input, "Nil" button, Confirm button.

**Logic & Data Flow:**
- Each user redirected independently, sees only the skill THEY taught (requester → offered_skill_id, recipient → wanted_skill_id)
- `POST /api/skill-cooldowns {skillId, cooldownDays}` → validated (0-365 or null) → server computes `cooldown_until = NOW() + INTERVAL ? DAY` (or NULL) → upserts `skill_cooldowns` (unique on user_id+skill_id, so this OVERWRITES any prior cooldown for this teacher-skill pair) → redirect to Dashboard
- No coordination needed between the two users — fully independent

**Tables touched:** `skill_cooldowns`

---

## PAGE 17 — Chat Page (Inbox + Thread View)

**Components:** Left panel (conversation list, one row per person ever interacted with), right panel (message thread, sender-aligned bubbles, input box), "Report User" button in thread header, attachment icon for media.

**Logic & Data Flow:**
- **Inbox load:** one row per `conversations` entry the user is part of, with last message preview
- **Thread load:** cursor-based pagination — latest 50 messages first (`ORDER BY created_at DESC LIMIT 50`), scroll-up loads older via `WHERE created_at < <oldest_loaded>`
- **History is PERMANENT and always viewable**, regardless of the conversation's open/closed state
- **Sending (text):** backend checks sender is a participant AND `swap_requests.status IN ('pending','accepted','in_progress')` — else rejected with "This conversation is closed" (frontend shows disabled input + banner)
- **Sending (media):** file uploaded via backend endpoint (multer → Cloudinary, `resource_type:'auto'`) → same status gate applies → message inserted with `message_type`, `attachment_url`, `attachment_name`, `attachment_size`
- **Real-time:** Socket.io, authenticated via the same httpOnly JWT cookie at handshake; new messages emitted to a room keyed by `conversation_id`
- **Reopening:** automatic — a new swap request between the same pair re-points `conversations.latest_swap_request_id`, immediately re-enabling sending
- **Report User:** available regardless of swap status (as long as the conversation exists) — broader than the Active Swap Page's report entry point, since bad behavior can happen during pre-acceptance negotiation too

**Tables touched:** `conversations`, `chat_messages`, `swap_requests` (status check), `reports`

---

## PAGE 18 — Notifications Page

**Components:** Chronological list (icon, message, timestamp, read/unread state), "Mark all as read", click-through to relevant page.

**Logic & Data Flow:**
- Written to at existing event points (swap accept/reject/cancel, session reminders, skill suggestion handled, warnings) — no new triggering logic, just one more insert alongside each existing email send
- `GET /api/notifications` (paginated), `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`
- Optional real-time push via the existing Socket.io connection

**Tables touched:** `notifications`

---

## PAGE 19 — Admin Login Page

Uses the SAME `/api/auth/login` endpoint as regular users — distinction is purely `role`-based redirect after successful auth (JWT already embeds role).

---

## PAGE 20 — Admin Dashboard

**Components:** Stat cards — total users, swaps by status, total skills, pending skill suggestions, quiz pass rate.

**Data flow:** Simple aggregate `COUNT`/`GROUP BY` queries across `users`, `swap_requests`, `skills`, `skill_suggestions`, `quiz_attempts`.

---

## PAGE 21 — Admin: All Users List

**Components:** Searchable, filterable, **paginated** (LIMIT/OFFSET — the one legitimate use of pagination in this app) table.

**Data flow:** `LEFT JOIN` profiles (a user might exist without a complete profile yet) with optional name/email search.

---

## PAGE 22 — Admin: User Detail Page

**Components:** Full profile, known/wanted skills, quiz history, complete swap history (all statuses including completed), warning history. Explicitly EXCLUDES password hash and private chat content.

**Data flow:** Multiple joined queries scoped to one `user_id`.

---

## PAGE — Admin: Manage Skills

**Components:** Direct Add form (instantly live), Pending Suggestions queue (sorted by `request_count DESC` — most-requested first), "Use this suggestion" (pre-fills Add form, admin can edit before confirming) / "Dismiss" per row.

**Logic & Data Flow:**
- Direct add: `INSERT INTO skills (name, normalized_name, created_by)` — admin's own ID, immediately live, NO status/approval needed
- Use suggestion (transaction): insert fresh `skills` row (admin-owned) + update the suggestion to `status='handled'`, `resulting_skill_id` linked
- Dismiss: `status='dismissed'`
- **Every new skill insertion (either path) triggers one-time LLM generation of 30 quiz questions** into `quiz_questions` for that skill — synchronous with a loading state on the admin action (acceptable given this is an infrequent admin operation, not a user-facing hot path)

---

## PAGE — Admin: Reports Queue

**Components:** List of pending reports (reporter, reported user, reason, context), four actions per row: **Dismiss**, **Send Warning** (message textarea), **Temporary Ban** (duration input), **Permanent Ban** (confirmation step).

**Logic & Data Flow:**
- Dismiss: `status='dismissed'`
- Warning: insert `warnings` row + notification to warned user + report `status='warned'`
- Temp Ban: `users.account_status='temp_banned'`, `temp_ban_until` set + force-cancel any active swap + release both parties' locks + report `status='temp_banned'`
- Permanent Ban: same as temp but `account_status='permanently_banned'` (no expiry) + resolves ALL other pending reports against this user too

**Login enforcement:** banned users blocked at login; `temp_banned` auto-reactivates to `active` on login attempt once `temp_ban_until` has passed (no cron needed — self-correcting check at the point that matters).

**Matching enforcement:** `account_status='active'` required in both Find Match queries.

---

## PAGE 23 — 404 Page

Static, no DB interaction.

---

## Cross-Cutting Architectural Rules (apply everywhere)

1. **Validation always runs BEFORE any database transaction** — a rejected action touches the database not at all.
2. **Every write-heavy action** (accept, mark-complete, ban) uses a transaction — all-or-nothing, with row-locking (`FOR UPDATE`) where race conditions are possible (concurrent accept attempts).
3. **Explicit column selection everywhere** — never `SELECT *`, especially on any endpoint exposing data to another user (profiles, public views).
4. **Stale-data races are expected and handled** — any action involving another user's current state (sending a swap request, matching) re-validates fresh at submit time, with specific error codes guiding recovery rather than a generic failure.
5. **Two distinct cooldowns, never conflated:** quiz-fail (system-fixed, 24hr) vs. teaching (user-editable, custom days).
6. **Background jobs (node-cron)** — quiz session cleanup, swap reminder emails — both logged/monitored, with live query filters as a safety net if a job run is ever missed.
7. **Nothing critical is ever silently deleted** — swap history, chat history, quiz attempts, and reports all persist permanently for audit and continuity.
