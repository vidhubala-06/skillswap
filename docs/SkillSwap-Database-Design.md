# SkillSwap — Complete Database Design Document

**Database Engine:** MySQL (via MySQL Workbench)
**Access Layer:** `mysql2` (raw SQL, no ORM)
**ID Convention:** `CHAR(36)` UUIDs generated in Node (via `uuid` package) for all tables EXCEPT `skills`, which uses `INT AUTO_INCREMENT`.

---

## 1. Table: `users`

Core authentication table. Kept intentionally minimal/skinny since it's hit on nearly every request.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| role | ENUM('user','admin') | NOT NULL, DEFAULT 'user' |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false |
| account_status | ENUM('active','temp_banned','permanently_banned') | NOT NULL, DEFAULT 'active' |
| temp_ban_until | DATETIME | nullable |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  email_verified BOOLEAN NOT NULL DEFAULT false,
  account_status ENUM('active','temp_banned','permanently_banned') NOT NULL DEFAULT 'active',
  temp_ban_until DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Table: `auth_tokens`

Handles BOTH email verification and password reset tokens (merged, distinguished by `type`).

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| token | VARCHAR(255) | UNIQUE, NOT NULL |
| type | ENUM('email_verification','password_reset') | NOT NULL |
| expires_at | DATETIME | NOT NULL |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE auth_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  type ENUM('email_verification','password_reset') NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auth_token (token),
  INDEX idx_auth_user_type (user_id, type)
);
```

**Connection:** `users (1) ──< (many) auth_tokens`. One user can have multiple tokens over time (e.g., multiple resend attempts). `ON DELETE CASCADE`.

---

## 3. Table: `refresh_tokens`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| token_hash | VARCHAR(255) | NOT NULL |
| expires_at | DATETIME | NOT NULL |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| revoked | BOOLEAN | NOT NULL, DEFAULT false |

```sql
CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_token_hash (token_hash)
);
```

**Connection:** `users (1) ──< (many) refresh_tokens` — one row per active session/device. Token is SHA-256 hashed before storage (never store raw).

---

## 4. Table: `profiles`

| Field | Type | Constraints |
|---|---|---|
| user_id | CHAR(36) | PRIMARY KEY, FK → users(id) |
| name | VARCHAR(255) | NOT NULL |
| linkedin_url | VARCHAR(500) | nullable |
| github_url | VARCHAR(500) | nullable |
| experience | TEXT | nullable |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP |

```sql
CREATE TABLE profiles (
  user_id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  experience TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Connection:** `users (1) ──── (1) profiles` — strict one-to-one; `user_id` is both PK and FK.

---

## 5. Table: `skills`

The live, real, searchable skill catalog ONLY. No suggestions/pending entries live here.

| Field | Type | Constraints |
|---|---|---|
| id | INT | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(150) | UNIQUE, NOT NULL |
| normalized_name | VARCHAR(150) | UNIQUE, NOT NULL |
| created_by | CHAR(36) | nullable, FK → users(id) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  normalized_name VARCHAR(150) UNIQUE NOT NULL,
  created_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FULLTEXT INDEX idx_skills_fulltext (name)
);
```

**Connection:** `users (1) ──< (many) skills` via `created_by` (NULL = seeded, otherwise an admin's user_id — never a regular user's ID, since users can only submit *suggestions*, not real skills directly).

**Note:** `id` is auto-increment — never supply it manually on INSERT. Read back via `result.insertId`.

---

## 6. Table: `skill_suggestions`

User-submitted skill requests — entirely separate from the real catalog until an admin acts on them.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| suggested_name | VARCHAR(150) | NOT NULL |
| normalized_name | VARCHAR(150) | NOT NULL |
| submitted_by | CHAR(36) | NOT NULL, FK → users(id) |
| status | ENUM('pending','handled','dismissed') | NOT NULL, DEFAULT 'pending' |
| resulting_skill_id | INT | nullable, FK → skills(id) |
| request_count | INT | NOT NULL, DEFAULT 1 |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| reviewed_at | DATETIME | nullable |

```sql
CREATE TABLE skill_suggestions (
  id CHAR(36) PRIMARY KEY,
  suggested_name VARCHAR(150) NOT NULL,
  normalized_name VARCHAR(150) NOT NULL,
  submitted_by CHAR(36) NOT NULL,
  status ENUM('pending','handled','dismissed') NOT NULL DEFAULT 'pending',
  resulting_skill_id INT,
  request_count INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resulting_skill_id) REFERENCES skills(id) ON DELETE SET NULL,
  INDEX idx_suggestion_normalized (normalized_name, status)
);
```

**Connection:** `users (1) ──< (many) skill_suggestions`; `skills (1) ──< (many) skill_suggestions` via `resulting_skill_id` (links a handled suggestion to the fresh skill row an admin created from it).

**Key behavior:** admin NEVER approves a user's row directly into the live catalog — admin always creates a fresh `skills` row himself (even when using a suggestion as inspiration), and the original suggestion is marked `handled`, linked via `resulting_skill_id`.

---

## 7. Table: `quiz_questions`

Per-skill question bank. Generated ONCE per skill (at seed time or when a new skill is created), NOT regenerated per attempt.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| skill_id | INT | NOT NULL, FK → skills(id) |
| question | TEXT | NOT NULL |
| options | JSON | NOT NULL |
| correct_option_id | VARCHAR(10) | NOT NULL |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE quiz_questions (
  id CHAR(36) PRIMARY KEY,
  skill_id INT NOT NULL,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_option_id VARCHAR(10) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_quiz_questions_skill (skill_id)
);
```

**Connection:** `skills (1) ──< (many) quiz_questions` — currently 30 questions per skill (configurable/expandable later).

**Generation trigger points:** (1) one-time batch script after initial skill seeding, (2) automatically whenever a NEW skill is created (admin direct-add, or admin "use this suggestion").

---

## 8. Table: `quiz_sessions`

Holds the specific 25-question, freshly-shuffled set presented for ONE attempt. Transient — cleaned up 24-48hrs after submission via a monitored `node-cron` job.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| skill_id | INT | NOT NULL, FK → skills(id) |
| questions_json | JSON | NOT NULL — the 25 selected questions, reshuffled, WITH correct answers (server-only, never sent to client in full) |
| status | ENUM('active','submitted','expired') | NOT NULL, DEFAULT 'active' |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| expires_at | DATETIME | NOT NULL — created_at + 20 minutes |

```sql
CREATE TABLE quiz_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  questions_json JSON NOT NULL,
  status ENUM('active','submitted','expired') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_quiz_session_user (user_id, status)
);
```

---

## 9. Table: `quiz_attempts`

Permanent score history (no question content — lightweight, kept forever).

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| skill_id | INT | NOT NULL, FK → skills(id) |
| score | SMALLINT | NOT NULL |
| total_marks | SMALLINT | NOT NULL, DEFAULT 50 |
| passed | BOOLEAN | NOT NULL |
| attempted_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE quiz_attempts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  score SMALLINT NOT NULL,
  total_marks SMALLINT NOT NULL DEFAULT 50,
  passed BOOLEAN NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_quiz_attempts_user_skill (user_id, skill_id, attempted_at)
);
```

**Quiz rules:** 25 questions × 2 marks = 50 total. Pass threshold ≥ 48 (allows exactly 1 wrong). Correct-option position is force-shuffled server-side (Fisher-Yates) on every attempt regardless of the LLM's own claimed randomization.

---

## 10. Table: `user_known_skills`

Junction table between users and skills — "known" side. Carries quiz verification state.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| skill_id | INT | NOT NULL, FK → skills(id) |
| status | ENUM('pending_quiz','verified','cooldown') | NOT NULL, DEFAULT 'pending_quiz' |
| self_rating | TINYINT | nullable, CHECK 1–10 |
| best_quiz_score | SMALLINT | nullable |
| cooldown_until | DATETIME | nullable — QUIZ-FAIL cooldown, fixed 24hrs, system-set only, NEVER user-editable |
| verified_at | DATETIME | nullable |

```sql
CREATE TABLE user_known_skills (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  status ENUM('pending_quiz','verified','cooldown') NOT NULL DEFAULT 'pending_quiz',
  self_rating TINYINT CHECK (self_rating BETWEEN 1 AND 10),
  best_quiz_score SMALLINT,
  cooldown_until DATETIME,
  verified_at DATETIME,
  UNIQUE KEY uniq_user_skill (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_known_skills_user (user_id),
  INDEX idx_known_skills_skill_status (skill_id, status)
);
```

**Connection:** many-to-many junction, `users ──< user_known_skills >── skills`.

**Important rule:** at least ONE verified known skill is mandatory before Dashboard/Find Match access unlocks (checked live via `COUNT(*) WHERE status='verified'`, not a stored flag). Removing a skill that would drop this count below 1 is blocked.

---

## 11. Table: `user_wanted_skills`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| skill_id | INT | NOT NULL, FK → skills(id) |

```sql
CREATE TABLE user_wanted_skills (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  UNIQUE KEY uniq_user_wanted (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX idx_wanted_skills_user (user_id),
  INDEX idx_wanted_skills_skill (skill_id)
);
```

**Rule:** a skill can never be in BOTH `user_known_skills` and `user_wanted_skills` for the same user — enforced at the APPLICATION level (array-overlap check before any DB write; two tables kept separate rather than merged, per project decision), not via a DB constraint.

---

## 12. Table: `skill_cooldowns`

Post-swap TEACHING cooldown — global per (teacher, skill), blocks matching for anyone seeking that skill from that teacher (not scoped to a specific learner). USER-EDITABLE (custom days), unlike the quiz-fail cooldown.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) — the teacher |
| skill_id | INT | NOT NULL, FK → skills(id) |
| last_taught_to_user_id | CHAR(36) | nullable, FK → users(id) — audit reference only |
| cooldown_until | DATETIME | nullable — NULL = "Nil", no cooldown |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE skill_cooldowns (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  skill_id INT NOT NULL,
  last_taught_to_user_id CHAR(36),
  cooldown_until DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_skill_cooldown (user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY (last_taught_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Unique key is `(user_id, skill_id)` ONLY** — one cooldown row per teacher-skill pair, upserted (`ON DUPLICATE KEY UPDATE`) on every swap completion or manual edit from My Profile.

---

## 13. Table: `swap_requests`

The central workflow table.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| requester_id | CHAR(36) | NOT NULL, FK → users(id) |
| recipient_id | CHAR(36) | NOT NULL, FK → users(id) |
| offered_skill_id | INT | NOT NULL, FK → skills(id) — requester's known skill (what requester teaches) |
| wanted_skill_id | INT | NOT NULL, FK → skills(id) — recipient's known skill (what recipient teaches) |
| status | ENUM('pending','accepted','rejected','in_progress','completed','cancelled') | NOT NULL, DEFAULT 'pending' |
| reject_reason | TEXT | nullable |
| session_date | DATE | nullable |
| session_time | TIME | nullable |
| requester_marked_complete | BOOLEAN | NOT NULL, DEFAULT false |
| recipient_marked_complete | BOOLEAN | NOT NULL, DEFAULT false |
| completed_at | DATETIME | nullable |
| day_reminder_sent | BOOLEAN | NOT NULL, DEFAULT false |
| hour_reminder_sent | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP, ON UPDATE CURRENT_TIMESTAMP |

```sql
CREATE TABLE swap_requests (
  id CHAR(36) PRIMARY KEY,
  requester_id CHAR(36) NOT NULL,
  recipient_id CHAR(36) NOT NULL,
  offered_skill_id INT NOT NULL,
  wanted_skill_id INT NOT NULL,
  status ENUM('pending','accepted','rejected','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  session_date DATE,
  session_time TIME,
  requester_marked_complete BOOLEAN NOT NULL DEFAULT false,
  recipient_marked_complete BOOLEAN NOT NULL DEFAULT false,
  completed_at DATETIME,
  day_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  hour_reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id),
  FOREIGN KEY (offered_skill_id) REFERENCES skills(id),
  FOREIGN KEY (wanted_skill_id) REFERENCES skills(id),
  INDEX idx_swap_recipient_status (recipient_id, status),
  INDEX idx_swap_requester_status (requester_id, status)
);
```

**Status lifecycle:** `pending` → (`accepted` → `in_progress` → `completed`) OR `rejected` OR `cancelled`.

**Records are NEVER deleted** — even completed/rejected/cancelled swaps persist permanently for history, admin audit, and chat-gating purposes.

---

## 14. Table: `user_locks`

Fast lock lookup — one row per currently-locked user.

| Field | Type | Constraints |
|---|---|---|
| user_id | CHAR(36) | PRIMARY KEY, FK → users(id) |
| locked_by_swap_id | CHAR(36) | NOT NULL, FK → swap_requests(id) |

```sql
CREATE TABLE user_locks (
  user_id CHAR(36) PRIMARY KEY,
  locked_by_swap_id CHAR(36) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by_swap_id) REFERENCES swap_requests(id) ON DELETE CASCADE
);
```

**Lifecycle:** row inserted on swap ACCEPT (both parties), deleted on swap COMPLETE (both marked done) or on admin-forced cancellation (e.g., ban).

---

## 15. Table: `conversations`

One PERMANENT row per user-pair (not per swap request). Never deleted, never expires.

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_a_id | CHAR(36) | NOT NULL, FK → users(id) — always the smaller UUID |
| user_b_id | CHAR(36) | NOT NULL, FK → users(id) — always the larger UUID |
| latest_swap_request_id | CHAR(36) | nullable, FK → swap_requests(id) — governs current send-permission |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE conversations (
  id CHAR(36) PRIMARY KEY,
  user_a_id CHAR(36) NOT NULL,
  user_b_id CHAR(36) NOT NULL,
  latest_swap_request_id CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pair (user_a_id, user_b_id),
  FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (latest_swap_request_id) REFERENCES swap_requests(id) ON DELETE SET NULL
);
```

**Canonical ordering:** enforced via `LEAST(id1,id2)` / `GREATEST(id1,id2)` at insert time — guarantees exactly one row per pair.

**Rules (finalized):**
- Full message history is PERMANENT — never deleted, never expires
- Sending is GATED by `latest_swap_request_id → swap_requests.status`: allowed if `pending`/`accepted`/`in_progress`; blocked if `rejected`/`cancelled`
- A new swap request between the same pair re-points `latest_swap_request_id`, automatically REOPENING the send-ability

---

## 16. Table: `chat_messages`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| conversation_id | CHAR(36) | NOT NULL, FK → conversations(id) |
| sender_id | CHAR(36) | NOT NULL, FK → users(id) |
| message_type | ENUM('text','image','file') | NOT NULL, DEFAULT 'text' |
| message | TEXT | nullable (text content; NULL if type ≠ 'text') |
| attachment_url | VARCHAR(500) | nullable (Cloudinary URL) |
| attachment_name | VARCHAR(255) | nullable (original filename) |
| attachment_size | INT | nullable (bytes) |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE chat_messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  sender_id CHAR(36) NOT NULL,
  message_type ENUM('text','image','file') NOT NULL DEFAULT 'text',
  message TEXT,
  attachment_url VARCHAR(500),
  attachment_name VARCHAR(255),
  attachment_size INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_chat_conversation_created (conversation_id, created_at)
);
```

**Media storage:** Cloudinary (`resource_type: 'auto'` — images get full image treatment, PDFs/docs stored as `raw`). Only the URL is stored in DB, never the binary file.

**Pagination:** cursor-based on `created_at` (not OFFSET) — load latest 50, scroll-up loads older via `WHERE created_at < <oldest_loaded_timestamp>`.

---

## 17. Table: `notifications`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| type | ENUM(...) | NOT NULL — see list below |
| message | TEXT | NOT NULL |
| related_swap_id | CHAR(36) | nullable, FK → swap_requests(id) |
| is_read | BOOLEAN | NOT NULL, DEFAULT false |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type ENUM(
    'swap_request_received','swap_request_accepted','swap_request_rejected',
    'swap_request_cancelled','session_reminder','skill_suggestion_handled',
    'account_warning'
  ) NOT NULL,
  message TEXT NOT NULL,
  related_swap_id CHAR(36),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_swap_id) REFERENCES swap_requests(id) ON DELETE SET NULL,
  INDEX idx_notifications_user_read (user_id, is_read, created_at)
);
```

Written to at the same points emails are already sent (swap accept/reject/cancel, session reminders, skill suggestion handled, warnings issued) — piggybacks on existing event points rather than new logic.

---

## 18. Table: `reports`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| reporter_id | CHAR(36) | NOT NULL, FK → users(id) |
| reported_user_id | CHAR(36) | NOT NULL, FK → users(id) |
| swap_request_id | CHAR(36) | nullable, FK → swap_requests(id) — contextual reference |
| reason | TEXT | NOT NULL |
| status | ENUM('pending','dismissed','warned','temp_banned','permanently_banned') | NOT NULL, DEFAULT 'pending' |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| reviewed_at | DATETIME | nullable |

```sql
CREATE TABLE reports (
  id CHAR(36) PRIMARY KEY,
  reporter_id CHAR(36) NOT NULL,
  reported_user_id CHAR(36) NOT NULL,
  swap_request_id CHAR(36),
  reason TEXT NOT NULL,
  status ENUM('pending','dismissed','warned','temp_banned','permanently_banned') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (swap_request_id) REFERENCES swap_requests(id) ON DELETE SET NULL,
  INDEX idx_reports_status (status, created_at)
);
```

**Reportable from:** Active Swap Page (during accepted/in_progress) AND Chat Page (any time a conversation exists, regardless of swap status) — both call the same `POST /api/reports` endpoint.

---

## 19. Table: `warnings`

| Field | Type | Constraints |
|---|---|---|
| id | CHAR(36) | PRIMARY KEY |
| user_id | CHAR(36) | NOT NULL, FK → users(id) |
| report_id | CHAR(36) | nullable, FK → reports(id) |
| message | TEXT | NOT NULL |
| issued_by | CHAR(36) | NOT NULL, FK → users(id) — the admin |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

```sql
CREATE TABLE warnings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  report_id CHAR(36),
  message TEXT NOT NULL,
  issued_by CHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## Full Entity-Relationship Map

```
users (1) ──── (1) profiles
users (1) ──< (many) auth_tokens
users (1) ──< (many) refresh_tokens
users (1) ──< (many) skills                [via created_by, nullable]
users (1) ──< (many) skill_suggestions     [via submitted_by]
skills (1) ──< (many) skill_suggestions    [via resulting_skill_id, nullable]
skills (1) ──< (many) quiz_questions
users (1) ──< (many) quiz_sessions >── (many) 1 skills
users (1) ──< (many) quiz_attempts >── (many) 1 skills
users (1) ──< (many) user_known_skills  >── (many) 1 skills
users (1) ──< (many) user_wanted_skills >── (many) 1 skills
users (1) ──< (many) skill_cooldowns    >── (many) 1 skills
users (1) ──< (many) swap_requests  [as requester]
users (1) ──< (many) swap_requests  [as recipient]
swap_requests (1) ──── (1) skills [offered_skill_id]
swap_requests (1) ──── (1) skills [wanted_skill_id]
users (1) ──── (1, optional) user_locks
swap_requests (1) ──< (many) user_locks
users (1) ──< (many) conversations  [via user_a_id / user_b_id]
swap_requests (1) ──< (many) conversations [via latest_swap_request_id]
conversations (1) ──< (many) chat_messages
users (1) ──< (many) notifications
swap_requests (1) ──< (many) notifications [via related_swap_id]
users (1) ──< (many) reports  [as reporter_id]
users (1) ──< (many) reports  [as reported_user_id]
swap_requests (1) ──< (many) reports
users (1) ──< (many) warnings
reports (1) ──< (many) warnings [via report_id]
```

---

## Key Cross-Cutting Rules

1. **Two cooldown types, never confused:**
   - Quiz-fail cooldown (`user_known_skills.cooldown_until`) — fixed 24hrs, hardcoded in backend, NEVER user-provided
   - Teaching cooldown (`skill_cooldowns.cooldown_until`) — custom days, user-editable (initially at swap completion, later from My Profile)

2. **Onboarding gate:** at least 1 verified known skill required to unlock Dashboard/Find Match — computed live (`COUNT WHERE status='verified' >= 1`), enforced via backend middleware, not a stored flag.

3. **Skill/suggestion separation:** `skills` = live catalog (admin/seed only). `skill_suggestions` = user requests (never auto-promoted).

4. **A skill cannot be both known and wanted** for the same user — application-level check (array overlap), not a DB constraint, since the two tables are kept separate.

5. **All destructive/validation checks run BEFORE any transaction begins** — a rejected action never partially writes to the database.

6. **Nothing is ever hard-deleted** from `swap_requests`, `chat_messages`, `quiz_attempts`, or `reports` — permanent audit trail by design.

7. **Account moderation:** `active` → `temp_banned` (auto-reactivates on login attempt once `temp_ban_until` passes) or `permanently_banned`. Banning force-cancels any active swap and releases both parties' locks.
