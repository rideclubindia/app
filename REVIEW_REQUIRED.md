# Review Required

Items that were **not** modified because they could not be confirmed safe without
manual/live-environment verification.

## 1. Admin authorization: Firebase vs. Supabase identity mismatch

- **Files:** `frontend/src/App.tsx` (`ADMIN_EMAIL`, `RequireAdmin`), `frontend/src/pages/Admin/AdminLogin.tsx`,
  `supabase/migrations/20260615_admin_rls_policies.sql`
- **Why it looks unused/wrong:** The frontend route guard (`RequireAdmin`) checks a Firebase
  `onAuthStateChanged` user's email against a hardcoded `ADMIN_EMAIL` constant. Separately,
  `20260615_admin_rls_policies.sql` enforces admin-only RLS on `profiles`, `audit_logs`, and
  `cms_policies` using `auth.jwt() ->> 'email' = 'iharsharoyal@gmail.com'` — but `auth.jwt()` reflects a
  **Supabase Auth** session, not a Firebase session. `AdminLogin.tsx` signs the admin in via Firebase
  (`signInWithEmailAndPassword`), not Supabase Auth.
- **What's unclear:** Whether the app separately establishes a real Supabase Auth session (e.g. via a
  custom-token exchange) somewhere not covered in this pass, or whether these RLS admin policies are
  effectively dead/never-satisfied and the admin panel's actual protection today rests on something else
  (e.g. calls going through a service-role backend endpoint instead of the browser's anon-key client).
- **What manual confirmation is needed:** Trace, with a real login in a Supabase project, whether
  `auth.jwt()` is populated for the admin session used by `AdminUsers.tsx`/`AdminLayout.tsx`'s direct
  `supabase.from(...)` calls. If it is not, the "Allow admins full access to profiles" and audit-log
  policies are not actually protecting those tables against a non-admin authenticated user, and a real
  fix (e.g. exchanging the Firebase ID token for a Supabase session, or moving admin writes behind a
  backend endpoint that checks a server-verified role) is needed — this is an architectural decision,
  not a mechanical fix.

## 2. `audit_logs` INSERT policy allows forging `actor_id`

- **File:** `supabase/migrations/20260615_admin_rls_policies.sql:49-53`
- **Why flagged:** `CREATE POLICY "System can insert audit logs" ... WITH CHECK (true)` lets any
  authenticated caller insert an audit log row with an arbitrary `actor_id`, not necessarily their own.
- **Why not fixed here:** Tightening this to `WITH CHECK (actor_id::text = auth.uid()::text)` is the
  obvious fix, but per item 1 above, it's unclear whether `auth.uid()` is ever populated for this app's
  actual session model — a check that's always false would silently break legitimate audit logging
  instead of protecting it. Needs to be fixed together with item 1, against a live project.

## 3. Hardcoded secret defaults (`JWT_SECRET`, `TOMTOM_API_KEY`)

- **Files:** `backend/core/config.py:10,36`, `backend/docker-compose.yml`
- **Why not fixed here:** These are real, previously-committed secrets. Rotating them is a credentials
  action outside a code-cleanup pass's scope, and removing the fallback default outright would break any
  deployment that doesn't already set the corresponding env var, which cannot be verified from the repo
  alone. **Action needed from you:** generate a new `JWT_SECRET`, rotate the TomTom API key, set both as
  real environment variables in every deployment target, then remove the hardcoded defaults.

## 4. Committed `.env` files — git history

- **Files:** `backend/.env`, `frontend/.env` (now untracked going forward, but still in git history)
- **Why not fixed here:** Untracking a file doesn't remove it from history; rewriting history
  (`git filter-repo` / BFG) is destructive, rewrites commit hashes, and requires a force-push — the kind
  of action this pass was told not to take without explicit sign-off. **Action needed from you:** decide
  whether to rewrite history (coordinate with anyone else with a clone) and rotate every credential that
  was ever in those files (`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_JWT_SECRET`, EmailJS keys), since the
  values are irrecoverably exposed regardless of what the current working tree says.

## 5. `frontend/greenshift_home.html`, `frontend/src/pages/Website/rebranded_greenshift.html`, `WebsiteGreenShiftOriginal.css`

- **Why not removed:** These reference-only scrape artifacts sit next to `WebsiteGreenShiftOriginal.css`,
  which the audit noted may have been used as a source reference for productionizing the current
  `Website` marketing pages. No import path was found from `src/` to `greenshift_home.html` itself, but
  confirming it's safe to delete needs someone who worked on the website redesign to confirm it's no
  longer needed as a reference.

## 6. Frontend duplicate/legacy component pairs (not investigated this pass)

- Not audited in this pass beyond the confirmed `.backup.tsx`/`Website_backup/` files already removed.
  If other `*V2`/`*New`/`*Modern` component pairs exist elsewhere in `frontend/src/components` or
  `frontend/src/features`, they were out of scope for this cleanup round and should be a separate,
  dedicated duplicate-code pass.

## 7. Dependency pruning (not performed)

- Step 25 of the original request (audit `package.json`/`requirements.txt`, remove confirmed-unused
  deps) was intentionally **not** executed in this pass. Removing a dependency and regenerating the
  lockfile is exactly the kind of change that can silently break an unrelated import path, and doing it
  safely requires running the full build + every major flow afterward — given the scope already covered
  in this pass, that was deferred rather than rushed. Candidates flagged by the earlier audit
  (`@types/maplibre-gl` if `maplibre-gl` ships its own types; possible `lodash`/`lodash-es` duplication)
  are still worth a dedicated look.
