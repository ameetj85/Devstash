# Auth Security Review

**Last audit:** 2026-03-20
**Auditor:** auth-auditor agent
**Scope:** NextAuth v5 app — custom auth code only (excluding areas NextAuth handles automatically)

---

## Findings

### CRITICAL

None

---

### HIGH

#### No Rate Limiting on Sensitive Auth Endpoints
- **File:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/profile/change-password/route.ts`
- **Issue:** None of the sensitive auth endpoints implement rate limiting. The NextAuth credentials provider also does not add rate limiting automatically.
- **Risk:** An attacker can brute-force passwords on the credentials sign-in flow, spam the forgot-password endpoint to exhaust Resend email quota or flood a victim's inbox, and enumerate valid tokens by rapid-fire calls to `/api/auth/reset-password`.
- **Fix:** Add an edge-compatible rate-limiting layer. A common approach for Next.js is [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) backed by Upstash Redis. Apply per-IP limits: e.g., 5 requests/minute on `/api/auth/forgot-password` and `/api/auth/reset-password`, and 10 requests/minute on `/api/auth/register`. Apply per-IP or per-email limits on the credentials sign-in via a `signIn` callback.

---

### MEDIUM

#### Email Enumeration via Register Endpoint Response
- **File:** `src/app/api/auth/register/route.ts:20-22`
- **Issue:** When a registration attempt is made with an already-registered email, the endpoint returns HTTP 409 with the message `"User already exists"`. This unambiguously confirms whether an email address is in the system.
- **Risk:** An attacker can enumerate valid user email addresses by attempting to register them and observing the 409 vs 201 response. This is a lower-severity enumeration vector — it does not enable account takeover directly, but it can be used to identify accounts for targeted phishing or credential stuffing.
- **Fix:** Return a generic HTTP 200 (or 202) with the same "Check your email" message regardless of whether the email already exists. If email verification is enabled, this is seamless — the real user simply receives a "you already have an account" notice in their inbox. If verification is disabled, a silent no-op or a generic message avoids leaking registration status.

#### Password Minimum Length Only 8 Characters
- **File:** `src/app/api/auth/register/route.ts:15-17`, `src/app/api/auth/reset-password/route.ts:14-16`, `src/app/api/profile/change-password/route.ts:19-21`
- **Issue:** The only password policy enforced server-side is a minimum length of 8 characters. No maximum length is enforced and no complexity requirements exist.
- **Risk (max length):** bcrypt silently truncates input at 72 bytes. A password of 73+ characters will hash and verify the same as its 72-byte prefix. A user who sets a 100-character password could be surprised to find a 72-character prefix also unlocks their account. This is a correctness/UX issue that could become a security issue if users are misled about their password strength.
- **Risk (complexity):** Low practical impact given bcrypt's resistance to offline cracking, but an 8-character password with no complexity constraints is weak for an account securing potentially sensitive developer credentials and prompts.
- **Fix:** (1) Add a server-side maximum length guard (e.g., reject passwords longer than 72 bytes, or pre-hash with SHA-256 before passing to bcrypt to avoid the truncation behavior). (2) Consider raising the minimum to 12 characters and/or adding a strength check (e.g., `zxcvbn`).

#### No Input Sanitization / Max-Length Guard on `name` and `email` Fields at Registration
- **File:** `src/app/api/auth/register/route.ts:8-13`
- **Issue:** The `name` and `email` fields are accepted from the request body without any length limits. An attacker could submit a multi-megabyte `name` or `email` string.
- **Risk:** Could cause excessive memory allocation, slow DB writes, or denial of service on the registration endpoint. The `email` field is passed to Prisma's `findUnique` and `create` — Prisma will pass it to the DB driver, which protects against SQL injection, but the string length itself is unchecked.
- **Fix:** Add explicit length guards: e.g., reject `name` longer than 100 characters and `email` longer than 254 characters (the RFC 5321 max). Also validate `email` format server-side (a simple regex or the `email-validator` package) since the `type: 'email'` on the client form provides no server-side guarantee.

---

### LOW / INFORMATIONAL

#### Token Stored as Plain Text in Database
- **File:** `src/lib/tokens.ts:4-13`, `src/lib/tokens.ts:20-30`
- **Issue:** Verification and password reset tokens (UUID v4) are stored as plain text in the `VerificationToken` table. If the database is compromised, all outstanding tokens are immediately usable by an attacker.
- **Risk:** An attacker with read access to the database can use any unexpired token to verify an email or reset a password. With a 1-hour window for password reset tokens and 24 hours for verification tokens, the exposure window is meaningful.
- **Fix (best practice):** Store a SHA-256 hash of the token in the database; send the raw token in the email link. On redemption, hash the incoming token and compare. This is the same pattern NextAuth's own built-in email provider uses. Implementation: `const stored = crypto.createHash('sha256').update(token).digest('hex')`.

#### `uuid` Package Used Instead of Built-in `crypto.randomUUID()`
- **File:** `src/lib/tokens.ts:1`
- **Issue:** The `uuid` npm package is used (`import { v4 as uuidv4 } from 'uuid'`) when Node.js (v14.17+) and the Web Crypto API both expose `crypto.randomUUID()` natively. The `uuid` package is well-maintained and cryptographically secure, so this is not a security defect — it is an unnecessary dependency.
- **Risk:** None. Informational only.
- **Fix:** Replace `uuidv4()` with `crypto.randomUUID()` and remove the `uuid` dependency to reduce package surface area.

#### `proxy.ts` Matcher Does Not Exclude `/api/` Routes
- **File:** `src/proxy.ts:18-20`
- **Issue:** The `matcher` config uses `/((?!api|_next/static|_next/image|favicon.ico).*)`, which correctly excludes `/api/*` from the proxy. API routes therefore rely entirely on individual route-level `auth()` calls for session enforcement.
- **Risk:** This design is safe as long as every sensitive API route calls `auth()` — which all current profile routes do. However, if a future API route is added without an `auth()` check, there is no middleware backstop. This is a defense-in-depth gap, not a present vulnerability.
- **Fix:** Consider adding `/api/profile/*` to the protected matcher as a secondary enforcement layer, or document this pattern clearly so future API routes default to requiring auth.

#### Forgot-Password Response Time Differs Between Registered and Unregistered Emails
- **File:** `src/app/api/auth/forgot-password/route.ts:14-19`
- **Issue:** The message returned is identical for both cases (good), but the response time differs: for an unregistered email, the handler returns immediately after `findUnique`; for a registered email, it additionally generates a token, writes to the DB, and sends an email via Resend — taking noticeably longer. A timing side-channel could allow an attacker to infer whether an email is registered.
- **Risk:** Low practical impact — requires network-level timing measurement and controlled conditions. But it partially undermines the generic-message enumeration protection.
- **Fix:** To eliminate the timing differential, always perform a constant-time delay (e.g., `await new Promise(r => setTimeout(r, 500))`) before returning, regardless of whether the email was found. Alternatively, always generate a token and discard it for unknown emails.

---

## Passed Checks

- **Password hashing — algorithm:** bcrypt used correctly via `bcryptjs` in `src/app/api/auth/register/route.ts`, `src/app/api/auth/reset-password/route.ts`, and `src/app/api/profile/change-password/route.ts`.
- **Password hashing — cost factor:** Cost factor is 12 (above the recommended minimum of 10) in all three locations.
- **Password hashing — timing-safe comparison:** `bcrypt.compare()` used throughout `src/auth.ts:40` and `src/app/api/profile/change-password/route.ts:36` — never plain `===`.
- **Token generation — entropy:** `uuid` v4 (128-bit random UUID) used in `src/lib/tokens.ts`. This is cryptographically secure and has sufficient entropy for both email verification and password reset tokens.
- **Token expiration — set on creation:** Verification tokens expire in 24 hours (`src/lib/tokens.ts:6`); reset tokens expire in 1 hour (`src/lib/tokens.ts:22`). Both are appropriate windows.
- **Token expiration — enforced on use:** Expiration is checked server-side before accepting a token in both `src/app/api/auth/verify-email/route.ts:19` and `src/app/api/auth/reset-password/route.ts:28`. Expired tokens are also deleted immediately.
- **Single-use enforcement — password reset:** Reset token is deleted immediately after a successful password update in `src/app/api/auth/reset-password/route.ts:44`. Token cannot be reused.
- **Single-use enforcement — email verification:** Verification token is deleted immediately after `emailVerified` is set in `src/app/api/auth/verify-email/route.ts:37`. Token cannot be reused.
- **Previous tokens invalidated on re-request:** Both `generateVerificationToken` and `generatePasswordResetToken` call `deleteMany` before inserting a new token, ensuring only one valid token exists per email at a time (`src/lib/tokens.ts:9`, `src/lib/tokens.ts:25`).
- **Session validation in API routes — profile endpoints:** Both `/api/profile/change-password` and `/api/profile/delete-account` call `auth()` at the top of the handler and return 401 if no session exists.
- **Session user ID used for DB operations:** Both profile routes derive the target user from `session.user.id` (set from the JWT `sub` claim), never from a caller-supplied value. No IDOR risk.
- **Email enumeration — forgot-password message:** `/api/auth/forgot-password` returns the same generic message (`"If that email exists, a reset link has been sent."`) whether or not the email is registered (`src/app/api/auth/forgot-password/route.ts:18`, `src/app/api/auth/forgot-password/route.ts:24`).
- **Password validation on reset and change:** Both reset-password and change-password endpoints enforce a minimum 8-character length and require `password === confirmPassword` server-side.
- **Password not stored in plain text anywhere:** No plain-text password is written to the database at any point. Only `hashedPassword` is persisted.
- **Proxy/middleware protects page routes:** `src/proxy.ts` correctly protects `/dashboard/*` and `/profile/*` page routes, redirecting unauthenticated users to `/sign-in`.

---

## Out of Scope

The following were intentionally not checked (handled by NextAuth v5 automatically):
- CSRF protection
- Secure/HttpOnly cookie flags
- OAuth state parameter validation
- Session rotation
- JWT signing and verification
