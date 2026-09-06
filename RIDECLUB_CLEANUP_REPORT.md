# RideClub Cleanup & Security Remediation Report

Three commits on `main`, in order:

1. `b675c9f` — checkpoint of all pre-existing uncommitted work (safety snapshot, no logic changes).
2. `1ca0f21` — scratch/duplicate file cleanup, `.env` untracking, `.gitignore`.
3. `fe5427c` — auth/IDOR security fixes.

Build/typecheck verified after each stage (`tsc -b` clean, `vite build` succeeds, `python -m py_compile`
clean on every touched backend file, `import main` succeeds with no errors). No backend or frontend
automated test suite exists in this repo to run.

---

## Security Fixes

### Authentication (critical)

- **Removed client-side OTP generation/verification.** `frontend/src/pages/LoginScreen.tsx` previously
  generated the 6-digit code with `Math.random()` in the browser, held it in a `useRef`, and compared
  the user's input against that same in-memory value — meaning anyone with devtools could read the code
  or patch the check out entirely. Replaced with `POST /api/v1/auth/request-otp` (backend generates,
  hashes, and emails the code) and `POST /api/v1/auth/verify-otp` (backend is the sole authority on
  correctness; single-use, 5-minute expiry, 5 wrong-guess limit, 30s resend cooldown — `backend/core/otp.py`).
- **Removed the unauthenticated `/auth/emailjs-login` endpoint** (`backend/api/routers/auth.py`), which
  issued a fully valid signed JWT for *any* email address supplied in the request body — a complete
  account-takeover primitive with no proof of ownership.
- **Removed the `local_dev_token_<timestamp>` fallback.** Previously, if the backend auth call failed or
  the backend was unreachable, the frontend silently created a fake token and treated the user as logged
  in. Now: no token, no session, on failure.
- **Removed client-generated Supabase profile identity.** The frontend computed its own SHA-256/rolling
  hash of the email to derive a "user id" and upserted a Supabase `profiles` row with that self-chosen id
  from the browser using the anon key. The id is now returned by the backend (`Token.uid`) only after OTP
  verification succeeds, so identity is server-authoritative.

### Authorization / IDOR

Added `require_ride_access(db, ride_id, user)` (`backend/api/deps.py`) — checks the ride's `owner_id` or
`ride_members` participation before returning ride-scoped data — and applied it to:

| Endpoint | Before | After |
|---|---|---|
| `GET /api/v1/dashboard/ride/{ride_id}` | Any authenticated user, any ride_id | Requires ride ownership/membership |
| `GET /api/v1/analytics/ride/{ride_id}/route` | Any authenticated user, any ride_id (full GPS breadcrumb trail) | Requires ride ownership/membership |
| `GET /api/v1/analytics/ride/{ride_id}/group-intelligence` | **No auth at all** — fully public rider names/positions | Requires auth + ride ownership/membership |
| `POST /api/v1/grca/ingest` | **No auth at all** — anyone could inject/overwrite any ride's cohesion data | Requires auth + ride ownership/membership + 60/min rate limit |
| `GET /api/v1/grca/dashboard/{ride_id}` | **No auth at all** | Requires auth + ride ownership/membership |
| `POST /api/v1/sos/dispatch` | Authenticated, but `ride_id` never checked against caller | Requires ride ownership/membership + 5/hour rate limit |

`grca.py`'s `except Exception as e: raise HTTPException(..., detail=str(e))` was also changed to return a
generic message instead of echoing raw internal exception text to the client.

### Configuration hardening

- `backend/core/config.py`: removed the trailing `"*"` from the default `ALLOWED_ORIGINS` CORS list
  (it was permissive regardless of the explicit allowed-origin entries).
- `backend/main.py`: the `__main__` block's `uvicorn.run(..., reload=True)` now only enables reload when
  `ENV != "production"`, so a direct `python main.py` in a container doesn't accidentally run the dev
  auto-reloader in prod. (Render's actual `startCommand` in `render.yaml` already didn't pass `reload`, so
  this only matters for other execution paths.)

### Not fixed — see `REVIEW_REQUIRED.md`

- Hardcoded `JWT_SECRET`/`TOMTOM_API_KEY` defaults (need real rotation, a credentials action).
- `backend/.env`/`frontend/.env` still in git **history** (untracking ≠ purging history).
- Admin authorization: frontend `ADMIN_EMAIL` check vs. Supabase RLS `auth.jwt()` policies vs. actual
  Firebase-based admin login — these don't obviously connect; needs live-project verification before
  touching.
- `audit_logs` INSERT policy's `WITH CHECK (true)` (forgeable `actor_id`) — tied to the same open question.

---

## Removed Files

All confirmed to have zero references from `src/`, build config, or `package.json` scripts before removal.

**Duplicate/backup/merge artifacts:**
```
frontend/src/pages/WebsiteHome.backup.tsx        — exact duplicate of active WebsiteHome.tsx
frontend/src/pages/WebsitePage.backup.tsx        — exact duplicate of active WebsitePage.tsx
frontend/src/pages/WebsitePolicyPage.backup.tsx  — exact duplicate of active WebsitePolicyPage.tsx
frontend/src/pages/Website.backup.css            — orphaned backup stylesheet
frontend/src/pages/Website_backup/               — full duplicate directory tree of src/pages/Website
frontend/backups/website_backup_2026-09-06.../   — ad-hoc in-repo backup (git is the backup mechanism)
MapView_HEAD.tsx, frontend/MapView_HEAD.tsx      — 0-byte merge-conflict leftovers, outside src/
```

**Website-scraping/migration scratch tooling** (one-off GreenShift/Pexels content-migration scripts,
none referenced by `package.json`, build config, or source):
```
cleanup_profile.js, download_images.js, fix_repeated_images.js, patch_website_images.js, unique_images.js
frontend/cleanup_profile.cjs, contextImages.cjs, contextImages2.cjs, finalImages.cjs, insert_cms.cjs,
  navtest.cjs, replaceImages.cjs, replaceImagesFix.cjs, scrapePexels.cjs, scraper.cjs,
  shot.cjs, shot2.cjs, shot3.cjs, shot4.cjs, fix.py
frontend/detailed_sections.js, fetch_greenshift.js, parse_greenshift.js,
  inspect_sections.js, inspect_snippets.js, inspect_template_sections.js
backend/fix_db.py, backend/insert_cms.py, backend/scratch/
```

**Generated scrape output** (~1MB, intermediate JSON/HTML/CSS from the scripts above):
```
frontend/scratch_all_sections_raw.html, scratch_css/, scratch_css_list.json,
  scratch_extracted_full.json, scratch_root_vars.css, scratch_section_content.json
frontend/greenshift_home.html
frontend/public/greenshift_content.html, frontend/public/greenshift.css
  — these two were inside public/, meaning Vite served the raw scraped HTML at a real,
    guessable production URL despite nothing in the app linking to it. Content-leak risk, not just dead code.
frontend/debug.json, dummy.txt, scratch.txt, temp_unsplash.txt
```
`frontend/blank-site/` — throwaway scaffold directory, unreferenced by build config.

## Removed Duplicate Code

Same as the backup-file removals above — no in-file duplicate logic blocks were consolidated this pass
(scope limited to file-level duplicates with zero references; see `REVIEW_REQUIRED.md` item 6 for
deeper duplicate-code work not attempted).

## Removed Dead Code

- Client-side OTP generation/comparison, EmailJS client-side `init`/`send` call, `generatedOtpRef`,
  `local_dev_token` fallback, and client-side deterministic-UUID derivation — all in `LoginScreen.tsx`
  (superseded by the server-side flow described above, not merely deleted).

## Removed Dependencies

None removed this pass — see `REVIEW_REQUIRED.md` item 7. `@emailjs/browser` is still used by
`frontend/src/pages/Website/Contact/index.tsx`, so it was kept.

## Removed Debug Artifacts

- `frontend/debug.json`, `dummy.txt`, `scratch.txt`, `temp_unsplash.txt` (see Removed Files above).
- No stray `console.log`/`debugger` statements were removed — the earlier audit found only two files
  project-wide using `console.log`, and neither was touched in this pass since removing error/warn
  logging wasn't requested and wasn't found to leak sensitive data.

## Removed Fake/Mock Data

- `local_dev_token_<timestamp>` fallback authentication (see Authentication Fixes above) — this was the
  one confirmed instance of the app treating a failure as a successful login.

## Secret Exposure Findings

- `backend/.env`, `frontend/.env` were tracked in git with no `.gitignore` anywhere excluding them —
  untracked from git going forward (still present on disk), root `.gitignore` added, `frontend/.env.example`
  added with placeholders. **History still contains the old values — rotation still required, see
  `REVIEW_REQUIRED.md` item 4.**
- `backend/core/config.py`: hardcoded `JWT_SECRET` default (`supersecretjwtkey_change_in_prod`) and
  `TOMTOM_API_KEY` default (a real-looking key, with a comment admitting it needs rotation) — left in
  place per `REVIEW_REQUIRED.md` item 3, not silently "fixed" by deleting the fallback.
- EmailJS service/template/public-key IDs, previously hardcoded in `LoginScreen.tsx` and duplicated in
  `.env`, are now sourced once from backend config (`EMAILJS_SERVICE_ID`/`TEMPLATE_ID`/`PUBLIC_KEY`/`PRIVATE_KEY`
  env vars) for server-side sending; the frontend no longer needs or references these at all for login.

## Data Leak Findings

- `analytics.get_group_intelligence` and both `grca` endpoints previously returned live rider names, user
  IDs, and inter-rider GPS distances to **anyone**, authenticated or not. Fixed (see Authorization table
  above).
- `frontend/public/greenshift_content.html`/`greenshift.css` were served at a real production URL with no
  app-level link to them — removed.

## Authentication Fixes

Covered in detail above. Summary: OTP is now generated, hashed, and checked only server-side; a failed
backend call can no longer produce a session; user identity is not client-chosen.

## Authorization Fixes

Covered in detail above (ride-ownership checks added to 5 previously-unprotected or under-protected
endpoints).

## Supabase/RLS Findings

Investigated but **not modified** — see `REVIEW_REQUIRED.md` items 1–2. The admin RLS policies
(`20260615_admin_rls_policies.sql`) key off `auth.jwt()`/`auth.uid()` (Supabase Auth), but the app's admin
login (`AdminLogin.tsx`) authenticates via Firebase, not Supabase Auth — whether these two connect at all
needs live-project verification before either policy is safely tightened or the frontend guard is trusted
further.

## Location Data Findings

Not modified. `useLocationStore.ts`, `LiveRide.tsx`, and `Navigation.tsx` use high-accuracy
`watchPosition` calls appropriate to a live-tracking safety app; no third-party transmission was found.
The one piece of location data persisted in `localStorage` (`LiveRide.tsx`'s pending-SOS cache) is cleared
after use, which is reasonable retention for an offline-retry mechanism.

## Remaining Risks

See `REVIEW_REQUIRED.md` for full detail. Highest priority, in order:

1. Rotate every credential that was ever in `backend/.env`/`frontend/.env`, and the hardcoded
   `JWT_SECRET`/`TOMTOM_API_KEY` defaults.
2. Resolve the Firebase-vs-Supabase-Auth admin identity question, then tighten the `audit_logs` INSERT
   policy's `actor_id` check accordingly.
3. Decide whether to rewrite git history to purge the old `.env` commits.

## Build/Test Results

- `cd backend && python -m py_compile <every touched file>` — all pass.
- `cd backend && python -c "import main"` — imports cleanly, no errors.
- `cd backend && pytest tests/` — no tests exist in the repo (pre-existing gap, not introduced here).
- `cd frontend && npx tsc -b` — passes clean.
- `cd frontend && npx vite build` — succeeds.
- `cd frontend && npx eslint src/pages/LoginScreen.tsx src/App.tsx` — pre-existing errors only (unused
  imports and `any` usages that predate this pass); no new errors introduced by these changes.
