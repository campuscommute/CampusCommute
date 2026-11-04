# Campus Commute — Security Audit Report

> **Scope:** Full static analysis of frontend (React/Supabase), backend (Node/Express/MongoDB), database schema, RLS policies, Edge Functions, and service layer.  
> **Date:** November 2026  
> **Status:** Findings documented only — no code changes made.

---

## Severity Legend

| Level | Meaning |
|---|---|
| 🔴 **Critical** | Exploitable with no special privileges; direct data breach or account takeover |
| 🟠 **High** | Requires a valid session but can breach other users' data or bypass core logic |
| 🟡 **Medium** | Degrades security posture; exploitable in specific conditions |
| 🟢 **Low** | Defence-in-depth concern; low exploitability but should be fixed |
| ℹ️ **Info** | Best-practice gap with no direct exploit path |

---

## Summary

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | PIN stored with reversible Base64 encoding | 🔴 Critical | Open |
| 2 | Full profiles readable by every anonymous session | 🔴 Critical | Open |
| 3 | Admin phone number hardcoded in client bundle | 🟠 High | Open |
| 4 | OTP generated with `Math.random()` (non-CSPRNG) | 🟠 High | Open |
| 5 | OTP stored in plain text in database | 🟠 High | Open |
| 6 | No OTP expiry on Supabase path | 🟡 Medium | Open |
| 7 | Women-only gender rule enforced only in UI | 🟡 Medium | Open |
| 8 | Support ticket insert open to anonymous bots | 🟡 Medium | Open |
| 9 | Edge Function `create-user` has no auth or input validation | 🟠 High | Open |
| 10 | `profiles_update_own` allows any field to be self-updated | 🟠 High | Open |
| 11 | `rateBooking` has no ownership check | 🟠 High | Open |
| 12 | Seat count decremented on client — race condition possible | 🟡 Medium | Open |
| 13 | `ilike` search query vulnerable to pattern injection | 🟡 Medium | Open |
| 14 | GPS coordinates written without ownership check | 🟡 Medium | Open |
| 15 | Storage policies allow any authenticated user to upload | 🟡 Medium | Open |
| 16 | `profiles_select_all` exposes `pin_hash` to public | 🔴 Critical | Open |
| 17 | Backend JWT secret has no minimum length check | 🟡 Medium | Open |
| 18 | No CSRF protection on Express routes | 🟢 Low | Open |
| 19 | Error messages leak internal detail | 🟢 Low | Open |
| 20 | `cancelBooking` has no ownership check | 🟠 High | Open |

---

## Detailed Findings

---

### F-01 🔴 Critical — PIN stored with reversible Base64 encoding

**File:** `src/context/AuthContext.jsx` lines 24–28

```js
const hashPin   = (pin, phone) => btoa(`${pin}:${phone.replace(/\D/g, '')}`);
const verifyPin = (pin, phone, hash) => {
  try { return atob(hash) === `${pin}:${phone.replace(/\D/g, '')}`; }
  catch { return false; }
};
```

**What it does:** `btoa()` is Base64 encoding, not a cryptographic hash. The output `NDEyNzo5MjIwNjEyMzE1` decodes instantly to `4127:9220612315` with `atob()` in any browser console.

**Impact:** Anyone who can read the `pin_hash` column (which they can — see F-02) recovers the plain PIN and phone number of every user in milliseconds. Combined with F-02, this is a full credential dump.

**Also stored in:** `localStorage` via `writeCachedProfile()` — the full profile row including `pin_hash` is cached unencrypted in the browser.

**Supabase schema comment admits it:** `pin_hash text, -- base64(pin:phone), used for sign-in verification`

**Remedy:**
- Move PIN verification entirely server-side via a Supabase Edge Function
- Use `bcrypt` (cost ≥ 12) or `argon2id` with a per-user random salt
- Never return `pin_hash` in any query response or cache it client-side
- Add failed-attempt counter (lock after 5 failures for 15 min)

---

### F-02 🔴 Critical — Full profile row readable by every anonymous session

**File:** `supabase/schema.sql` line ~239

```sql
create policy "profiles_select_all"
  on public.profiles for select using (true);
```

**What it does:** Every Supabase anonymous session (created automatically on app open, no sign-in required) can execute:
```sql
SELECT * FROM profiles;
```
This returns: `phone`, `email`, `pin_hash`, `college_id_url`, `selfie_url`, `enrollment_no`, `auth_id`, `emergency_contact`, `saved_routes` for every user.

**Impact:** Full PII dump of all users without authentication. Combined with F-01, delivers crackable credentials for every account.

**Remedy:**
- Replace with two scoped policies:
  - Owner: `using (auth.uid() = id OR auth.uid() = auth_id)` — full row
  - Public: a view `profiles_public(id, name, college, rating, is_verified, avatar_url)` — no phone, no pin_hash, no documents
- Add `pin_hash` to a column-level security exclusion or move it to a separate `auth_secrets` table with no public select policy

---

### F-03 🟠 High — Admin phone hardcoded in compiled client bundle

**File:** `src/context/AuthContext.jsx` lines 15–21

```js
const ADMIN_PHONES = ['9220612315'];
const isAdminPhone = (phone) => {
  const clean = String(phone).replace(/\D/g, '');
  return ADMIN_PHONES.some(p => clean === p || clean.endsWith(p));
};
```

**What it does:** The admin's phone number is shipped in every browser's JavaScript bundle. Anyone can open DevTools → Sources → search for `ADMIN_PHONES` and read the number.

**Additional risk:** `isAdminPhone` runs entirely in the browser. A modified client could fake a profile object with `phone: '9220612315'` and bypass the check. The function is only as trustworthy as the data it receives — which comes from a fully-readable profiles table (F-02).

**Remedy:**
- Remove `ADMIN_PHONES` completely
- Determine admin status exclusively from `profiles.role === 'admin'` — this value comes from the DB and is enforced by RLS
- Never expose admin identity signals in client code

---

### F-04 🟠 High — OTP generated with `Math.random()` (non-CSPRNG)

**Files:**
- `src/services/bookingsService.js` line 4: `const makeOTP = () => String(Math.floor(1000 + Math.random() * 9000));`
- `backend/utils/token.util.js` line 30: `return String(Math.floor(1000 + Math.random() * 9000));`

**What it does:** `Math.random()` is a pseudorandom number generator seeded from system entropy but **not designed for cryptographic use**. V8's implementation uses xorshift128+ which has known statistical biases and its internal state can potentially be predicted after observing enough outputs.

**Impact:** An attacker who books multiple rides and observes the OTP sequence can narrow the state space and predict future OTPs.

**Also:** The OTP is only 4 digits (1000–9999 = 9000 possibilities). Even with a perfect CSPRNG, brute-forcing 9000 values is trivial without rate limiting.

**Remedy:**
- Use `crypto.getRandomValues(new Uint32Array(1))` (Web Crypto API, available in all modern browsers and Deno)
- Generate OTP server-side (Edge Function) so the passenger session never touches the generation code
- Expand to 6 digits minimum
- Add rate-limit of 3 attempts per booking before locking

---

### F-05 🟠 High — OTP stored in plain text in database

**File:** `supabase/schema.sql` — `bookings.otp text`

**File:** `src/services/bookingsService.js` line 36: `otp: otp` (plain 4-digit string inserted directly)

**What it does:** The OTP is stored as a plain text string in the `bookings` table. Any session that can read the bookings row (drivers can, via `bookings_select_parties` policy) sees the passenger's OTP before the ride starts.

**The `bookings_select_parties` policy allows drivers to read:**
```sql
or exists (
  select 1 from public.profiles
  where (id = auth.uid() or auth_id = auth.uid())
    and id = (select driver_id from public.rides where id = ride_id)
)
```

So the driver's session can query their ride's bookings and read the OTP column directly — defeating the purpose of the verification step.

**Additionally:** `getMyOfferedRides()` returns `id, status, otp, otp_verified` from bookings — the OTP is included in the response to the driver's client.

**Remedy:**
- Store only `bcrypt(otp)` in the database — never the plain code
- Return the plain OTP to the passenger exactly once (at booking time) over HTTPS, then discard it
- On driver verification, hash the entered value and compare to the stored hash server-side

---

### F-06 🟡 Medium — No OTP expiry on Supabase path

**File:** `supabase/schema.sql` — `bookings` table has no `otp_expires_at` column

**File:** `src/services/bookingsService.js` — no expiry set on insert

**Context:** The Express/MongoDB path (`backend/controllers/booking.controller.js` line 54) *does* set `expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)` and checks it in `verifyOTP`. However, the frontend **bypasses Express entirely** and writes directly to Supabase — so the expiry logic is never executed in production.

**Impact:** An OTP generated at booking time remains valid indefinitely. A passenger could share/reuse an OTP from a cancelled or old booking.

**Remedy:**
- Add `otp_expires_at TIMESTAMPTZ` to the `bookings` table
- Set to `ride.date + departure time + 2 hours` at generation time
- Check `NOW() < otp_expires_at` in the verification Edge Function
- Null out the OTP hash after first successful use to prevent replay

---

### F-07 🟡 Medium — Women-only gender rule enforced only in UI

**Files:**
- `src/pages/OfferRidePage.jsx` — `disabled={!isFemale}` on the Women Only button
- `supabase/schema.sql` — `bookings_insert_passenger` policy has no gender check

**What it does:** The client disables the Women Only preference button for non-female users. However, someone using Postman, `curl`, or a modified browser session can:
1. Insert a ride with `preference = 'women-only'` as a male driver
2. Book a `women-only` ride as a male passenger

Neither action is blocked at the database level.

**The `women_only_rides` view does check driver gender:**
```sql
where r.preference = 'women-only' and p.gender = 'female'
```
But this only filters the **view** — the underlying `rides` table has no such constraint.

**Remedy:**
- Add a `BEFORE INSERT` trigger on `rides` that rejects `preference = 'women-only'` unless the driver's `gender = 'female'` in their profile
- Add a `BEFORE INSERT` trigger on `bookings` that rejects insertion if `ride.preference = 'women-only'` and `passenger.gender != 'female'`

---

### F-08 🟡 Medium — Support ticket insert open to anonymous bots

**File:** `supabase/migrations/support_tickets.sql` line ~47

```sql
create policy "tickets_insert_any"
  on public.support_tickets for insert
  with check (true);
```

**What it does:** Any Supabase anonymous session — which is created automatically without any user action — can insert unlimited support tickets with arbitrary content.

**Impact:** Spam flooding the support queue; potential for abusive or malicious content injection into admin panel.

**Remedy:**
- Move ticket submission to a Supabase Edge Function
- Add per-IP rate limiting (3 tickets/hour) using Deno KV or Upstash Redis
- For anonymous users, require a CAPTCHA token (Cloudflare Turnstile or hCaptcha) verified server-side
- Add server-side message sanitisation

---

### F-09 🟠 High — Edge Function `create-user` has no auth or input validation

**File:** `supabase/functions/create-user/index.ts`

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',   // ← accepts any origin
  ...
};

const { email, password, name, phone, college, gender } = await req.json();
// ← no input validation, no auth check

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,  // ← full DB access, bypasses all RLS
  ...
);
```

**Problems:**
1. **No authentication check** — any HTTP client can call this function URL
2. **Wildcard CORS** — any website can trigger it via a user's browser
3. **No input validation** — `email`, `name`, `phone` are used as-is; a 10MB string in `name` would be inserted into the DB
4. **Service role key** — if successfully called, bypasses all RLS and can read/write any table
5. **No rate limiting** — an attacker can create thousands of fake accounts

**Remedy:**
- Validate all inputs (required fields, max lengths, format checks) before using service-role client
- Restrict `Access-Control-Allow-Origin` to production domain only
- Add rate limit via Deno KV: `5 signups per IP per hour`
- Consider requiring a signed request token from the main app to prove the call originated legitimately

---

### F-10 🟠 High — `profiles_update_own` allows any field to be self-updated

**File:** `supabase/schema.sql` line ~247

```sql
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id or auth.uid() = auth_id);
```

**What it does:** There is no column-level restriction. A user's session can update **any column** in their own profile row, including:
- `role` → self-promote to admin: `UPDATE profiles SET role='admin' WHERE id='...'`
- `is_verified` → self-verify: `UPDATE profiles SET is_verified=true WHERE id='...'`
- `total_rides`, `rating` → fake reputation

**Impact:** Any user can self-promote to admin and self-verify, completely bypassing the verification review process.

**Note:** The `profiles_admin_all` policy that uses JWT claims would still require the JWT to contain the admin role, so the admin panel might not immediately grant access — but `is_verified` can be trivially self-set, bypassing the college ID review.

**Remedy:**
- Use column-level security or a trigger to block updates to `role`, `is_verified`, `verification_status`, `total_rides`, `rating`, `verified_at` from non-admin sessions
- Alternatively, replace the `UPDATE` policy with a restricted one:
  ```sql
  create policy "profiles_update_own"
    on public.profiles for update
    using (auth.uid() = id or auth.uid() = auth_id)
    with check (
      -- prevent role/verification escalation
      role = (select role from public.profiles where id = auth.uid()) and
      is_verified = (select is_verified from public.profiles where id = auth.uid())
    );
  ```

---

### F-11 🟠 High — `rateBooking` has no ownership check

**File:** `src/services/bookingsService.js` lines 107–114

```js
export async function rateBooking(bookingId, { score, comment }) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ passenger_rating: score, passenger_comment: comment, ... })
    .eq('id', bookingId)   // ← only filter is bookingId
    .select()
    .single();
```

**What it does:** The update only filters by `bookingId`. The RLS `bookings_update_parties` policy does check ownership (passenger or driver), but the service function itself trusts the caller to pass their own booking ID.

**More importantly:** `passenger_rating` is a column any passenger can update on any booking they own — but there's no check that:
- The booking is in `completed` status before rating
- The passenger hasn't already rated (re-rating is possible, overwriting the previous score)
- The score is actually 1–5 (there is a DB `check` constraint, but client could try negative values)

**Remedy:**
- Add server-side guard: only allow rating when `booking.status = 'completed'`
- Add `rated_at` check: if already set, reject re-rating
- Move rating to an Edge Function that verifies ownership and status atomically

---

### F-12 🟡 Medium — Seat count decremented on client, race condition possible

**File:** `src/services/bookingsService.js` lines 43–50

```js
// Step 1: insert booking
const { data: booking } = await supabase.from('bookings').insert([...]);

// Step 2: decrement seats (separate request, non-atomic)
await supabase.from('rides')
  .update({ available_seats: ride.available_seats - seatsBooked })
  .eq('id', rideId);
```

**What it does:** The booking insert and seat decrement are **two separate Supabase calls with no transaction**. If two passengers book simultaneously:
1. Both read `available_seats = 1`
2. Both insert bookings successfully (no lock)
3. Both decrement: `1 - 1 = 0` written twice → 0 seats, 2 bookings, net -1 seats

**Impact:** Overbooking — more passengers booked than seats available.

**Remedy:**
- Use a PostgreSQL function with `FOR UPDATE` locking:
  ```sql
  create function book_seat(p_ride_id uuid, p_passenger_id uuid, ...)
  returns bookings as $$
  declare
    v_ride rides%rowtype;
  begin
    select * into v_ride from rides where id = p_ride_id for update;
    if v_ride.available_seats < 1 then raise exception 'No seats available'; end if;
    update rides set available_seats = available_seats - 1 where id = p_ride_id;
    insert into bookings (...) values (...) returning *;
  end;
  $$ language plpgsql security definer;
  ```

---

### F-13 🟡 Medium — `ilike` search vulnerable to pattern injection

**File:** `src/services/ridesService.js` lines 35–36

```js
if (from && !fromLat) query = query.ilike('from_label', `%${from}%`);
if (to   && !toLat)   query = query.ilike('to_label',   `%${to}%`);
```

**What it does:** User-supplied `from` and `to` strings are interpolated directly into a `LIKE` pattern. PostgreSQL `LIKE` special characters `%` and `_` in the input will be treated as wildcards.

**Example:** Searching `from = "%%"` returns every ride in the table regardless of location.

**Impact:** Pattern injection for excessive data extraction (not SQL injection — Supabase parameterises the value, but the wildcard characters themselves are injected).

**Remedy:**
- Escape `%` and `_` in user input before passing to `ilike`:
  ```js
  const escapeLike = (s) => s.replace(/[%_\\]/g, '\\$&');
  query.ilike('from_label', `%${escapeLike(from)}%`);
  ```

---

### F-14 🟡 Medium — GPS coordinates written without ownership check in service layer

**File:** `src/services/ridesService.js` lines 244–252

```js
export async function updateRideLocation(rideId, { lat, lng }) {
  await supabase
    .from('rides')
    .update({ current_lat: lat, current_lng: lng, ... })
    .eq('id', rideId);   // ← no driver_id check at service layer
}
```

**What it does:** The service function trusts `rideId` alone. Although the RLS `rides_update_driver` policy should block non-drivers, the client-side code does not check ownership before calling. More critically: `lat` and `lng` are passed directly from `navigator.geolocation` without range validation — a tampered browser can send arbitrary coordinate values.

**Impact:** A malicious passenger who obtains a `rideId` could attempt to poison the live location data for that ride (though RLS should block this — the risk is defence-in-depth).

**Remedy:**
- Validate coordinate ranges: `-90 ≤ lat ≤ 90`, `-180 ≤ lng ≤ 180` before calling `updateRideLocation`
- Add `driver_id` filter to the update call (already done for `startRide`/`completeRide`)

---

### F-15 🟡 Medium — Storage `insert` policy allows any authenticated session to upload to any path

**File:** `supabase/schema.sql` lines ~303–308

```sql
create policy "storage_insert_auth"
  on storage.objects for insert
  with check (
    bucket_id = 'campus-commute'
    and auth.role() = 'authenticated'
  );
```

**What it does:** Any authenticated user (including anonymous sessions, which have `auth.role() = 'authenticated'`) can upload a file to **any path** in the `campus-commute` bucket. This means a user can upload files to another user's `avatars/` subfolder, overwriting their profile photo.

**Remedy:**
- Restrict uploads to the user's own subfolder:
  ```sql
  with check (
    bucket_id = 'campus-commute'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
  ```

---

### F-16 🔴 Critical — `profiles_select_all` exposes `pin_hash` (already covered in F-02, separate finding)

This deserves a standalone entry because `pin_hash` is specifically documented in the schema as:
```sql
pin_hash text, -- base64(pin:phone), used for sign-in verification
```

The column is not marked `select: false` in any policy, is returned in `SELECT *` queries, and is cached in `localStorage`. An attacker who extracts `localStorage` from a shared device (school computer, cafe) gets the PIN hash of whoever last logged in — and decodes it trivially.

**Remedy:**
- Immediately: add `pin_hash` to the `profiles_update_own` check to prevent self-reading via `SELECT *`
- Long-term: move to a separate `auth_secrets(profile_id, pin_bcrypt)` table with no public select policy

---

### F-17 🟡 Medium — Backend JWT secret has no minimum length enforcement

**File:** `backend/app.js` + `backend/utils/token.util.js`

```js
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

**What it does:** `JWT_SECRET` comes from `.env`. If the developer sets a short or guessable value (e.g. `"secret"`, `"campus"`, `"1234"`), the JWT becomes brute-forceable using tools like `hashcat` or `jwt-cracker`.

**Impact:** Full account takeover for all users on the Express backend.

**Remedy:**
- Add startup validation:
  ```js
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }
  ```
- Rotate to a 256-bit random secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### F-18 🟢 Low — No CSRF protection on Express routes

**File:** `backend/app.js` — no `csurf` or `SameSite` cookie configuration

**What it does:** The Express API uses JWT Bearer tokens in the `Authorization` header (not cookies), which are inherently CSRF-safe. However, if the app ever migrates to cookie-based sessions, it would be vulnerable without this protection already in place.

**Current risk:** Low — Bearer tokens are not sent automatically by browsers, so CSRF is not a current threat.

**Remedy:**
- Ensure cookies (if ever used) are set with `SameSite=Strict` and `HttpOnly`
- Document the intentional choice of Bearer tokens as CSRF mitigation

---

### F-19 🟢 Low — Error messages leak internal detail

**File:** `backend/middleware/error.middleware.js` (not shown but referenced in app.js)

**File:** `src/services/bookingsService.js` — Supabase errors thrown directly:
```js
if (rideErr) throw rideErr;   // exposes Supabase error detail to client
```

**What it does:** Raw Supabase and MongoDB errors can contain table names, column names, constraint names, and internal query structure. Example: `duplicate key value violates unique constraint "profiles_phone_key"` reveals the constraint name and table structure.

**Remedy:**
- Wrap all thrown errors in user-friendly messages before surfacing to the client
- Log raw errors server-side only; return generic messages to the browser

---

### F-20 🟠 High — `cancelBooking` has no ownership check

**File:** `src/services/bookingsService.js` lines 88–100

```js
export async function cancelBooking(bookingId, reason = '') {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_by: 'passenger', ... })
    .eq('id', bookingId)   // ← only filter
```

**What it does:** The service function only filters by `bookingId`. The `bookings_update_parties` RLS policy restricts updates to the passenger or driver of that booking — so RLS provides the real guard. However, if a bug in the policy ever exists, or if the anon session has broader access, any session with a known booking UUID can cancel it.

**Impact:** Booking cancellation by an unauthorised party (if RLS has a gap).

**Remedy:**
- Add explicit ownership filter at the service layer:
  ```js
  .eq('id', bookingId)
  .eq('passenger_id', currentUserId)   // explicit, belt-and-suspenders
  ```

---

## TABLE VIII — Findings and Planned Remedies

| Finding | Why it matters | Remedy |
|---|---|---|
| **PIN stored with reversible encoding** (F-01) | `btoa()` in `AuthContext.jsx` produces Base64, not a hash. Any read of the `pin_hash` column — which is publicly readable (F-02) — instantly decodes to the plain PIN and phone number | Replace `btoa` with bcrypt (cost ≥ 12) inside a server-side Edge Function; never return `pin_hash` to the client; add failed-attempt locking |
| **Profiles readable by every session** (F-02 + F-16) | `profiles_select_all using (true)` exposes `phone`, `email`, `pin_hash`, `college_id_url`, `selfie_url`, `enrollment_no` to every anonymous session — no sign-in required | Replace with two scoped policies: owner gets full row; public gets a view with only `id, name, college, rating, is_verified, avatar_url` |
| **Administrator number in client code** (F-03) | `ADMIN_PHONES = ['9220612315']` is shipped in the compiled JS bundle; anyone can read the admin's phone number in DevTools | Remove `ADMIN_PHONES` entirely; determine admin status only from `profiles.role = 'admin'` enforced by RLS |
| **OTP generated with `Math.random()`** (F-04) | `Math.random()` is not cryptographically secure; 4-digit space (9000 values) is brute-forceable without rate limiting | Use `crypto.getRandomValues()` in a server-side Edge Function; expand to 6 digits; add 3-attempt limit per booking |
| **OTP stored in plain text** (F-05) | `bookings.otp text` stores the raw code; drivers can read it via `bookings_select_parties` and `getMyOfferedRides()` returns it in the response, defeating the verification purpose | Store only `bcrypt(otp)` in DB; return plain code to passenger once over HTTPS; verify by hashing input and comparing server-side |
| **No OTP expiry** (F-06) | No `otp_expires_at` column in Supabase bookings; OTPs remain valid indefinitely — Express backend sets expiry but the frontend bypasses Express entirely | Add `otp_expires_at` column; set to departure time + 2 hours; enforce check in Edge Function; null out hash after first use |
| **Booking gender rule in UI only** (F-07) | Women-only restriction is a React button disable; anyone using Postman or a modified session can book a `women-only` ride as male or post one as a non-female driver | Add PostgreSQL `BEFORE INSERT` trigger on `rides` and `bookings` to enforce gender rules at the database level |
| **Open ticket insert policy** (F-08) | `tickets_insert_any with check (true)` allows unlimited anonymous ticket spam with no rate limit or CAPTCHA | Move submission to Edge Function with per-IP rate limit (3/hour), honeypot field, and CAPTCHA for anonymous users |
| **Edge Function without caller checks** (F-09) | `create-user/index.ts` has wildcard CORS, no auth header verification, no input validation, and uses the service-role key which bypasses all RLS | Validate all inputs, restrict CORS to production domain, add rate limiting via Deno KV, require origin verification |
| **`profiles_update_own` allows role escalation** (F-10) | Policy places no restriction on which columns can be updated; a user can self-set `role = 'admin'` or `is_verified = true` | Add `WITH CHECK` that prevents modification of `role`, `is_verified`, `rating`, and `total_rides` by non-admin sessions |

---

## Risk Matrix

```
                 LIKELIHOOD
                 Low      Medium    High
              ┌────────┬─────────┬──────────┐
   HIGH       │        │ F-09    │ F-01     │
   IMPACT     │        │ F-10    │ F-02     │
              │        │ F-11    │ F-05     │
              ├────────┼─────────┼──────────┤
   MEDIUM     │ F-18   │ F-06    │ F-04     │
   IMPACT     │ F-19   │ F-07    │ F-03     │
              │        │ F-12    │ F-08     │
              │        │ F-13    │          │
              │        │ F-14    │          │
              ├────────┼─────────┼──────────┤
   LOW        │        │ F-15    │          │
   IMPACT     │        │ F-17    │          │
              │        │ F-20    │          │
              └────────┴─────────┴──────────┘
```

---

## Recommended Fix Order

### Phase 1 — Immediate (before any public launch)
1. **F-02** — Restrict `profiles_select_all` to a public view (no phone/pin_hash)
2. **F-01** — Move PIN to bcrypt; never return `pin_hash` from DB
3. **F-10** — Block self-promotion via `profiles_update_own` WITH CHECK
4. **F-05** — Stop storing plain OTP; store bcrypt hash only
5. **F-03** — Remove `ADMIN_PHONES` from client bundle

### Phase 2 — Before beta
6. **F-09** — Harden Edge Function with input validation and rate limiting
7. **F-04** — Move OTP generation to server with CSPRNG
8. **F-06** — Add OTP expiry column and enforcement
9. **F-07** — Add DB trigger for women-only gender enforcement
10. **F-11** — Add booking status check before allowing ratings

### Phase 3 — Hardening
11. **F-12** — Replace two-step booking with atomic PostgreSQL function
12. **F-08** — Add rate limiting and CAPTCHA to support ticket submission
13. **F-13** — Escape LIKE wildcards in search input
14. **F-14** — Validate GPS coordinate ranges
15. **F-15** — Restrict storage uploads to own subfolder
16. **F-17** — Enforce minimum JWT secret length on startup
17. **F-19** — Sanitise error messages before surfacing to client
18. **F-20** — Add explicit passenger_id filter to `cancelBooking`

---

*This audit was performed via static code analysis only. Dynamic testing (penetration testing, fuzzing, dependency scanning) is recommended before public launch.*
