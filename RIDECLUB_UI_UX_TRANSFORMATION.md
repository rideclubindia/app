# RideClub UI/UX Transformation — Status

This documents what was actually done against the pixel-perfect transformation brief, and — just as
important — what was **not** done, so nothing here is overclaimed.

## 1. Design principles extracted from references

- Near-white base with felt-not-seen ambient gradients (lavender/peach at low opacity), not a visible
  colored background.
- Translucent glass surfaces (not opaque cards), near-invisible borders, barely-perceptible shadows.
- One dominant element + one primary action per screen; secondary info visually receded.
- Orange as a selective action color, not a decorative one.
- Real content (ride photos, route text, rider counts) over abstract dashboard tiles.

## 2. Design tokens introduced

Added the full `--rc-*` token system to `frontend/src/index.css` `:root` — colors, ambient gradients,
typography scale, spacing scale, radius scale, elevation, glass/blur, control sizes, motion — exactly as
specified, verbatim. This is now the canonical source; no parallel hardcoded token names.

## 3. Components improved (now consuming the tokens directly)

- `.bg-app-canvas` → `var(--rc-gradient-page)` (was a hand-picked visible diagonal gradient; now the
  correct near-white radial-ambient treatment).
- `.card-app` / `.card-app-lg` → translucent (`var(--rc-surface)`), blurred (`backdrop-filter: blur(var(--rc-glass-blur))`),
  near-invisible border (`var(--rc-border-subtle)`), soft shadow (`var(--rc-shadow-soft)`/`--rc-shadow-card`).
  Previously these were opaque white boxes with a visible drop shadow — that was still "just changing
  colors/shadows," which is exactly what the brief said not to do again. This is now genuinely different:
  glass, not painted boxes.
- `.btn-app-primary`, `.nav-bar-app`, `.nav-fab-app` → same token-driven treatment.
- All literal `#FF5A00` orange references in `HomeLandscape.tsx`, `LeftNavigationRail.tsx`, and
  `ProfileHMI.tsx` replaced with the canonical `--rc-primary` (`#FF6B22`) so there is one orange, not two.

## 4. Screens improved this pass

- **Home** (`HomeLandscape.tsx`): full composition rebuild in a prior pass (header, greeting, search,
  quick actions, featured ride from real Supabase data, upcoming rides list) — now additionally reads
  the new glass-surface tokens instead of opaque cards.
- **Profile** (`ProfileHMI.tsx`): full composition rebuild in a prior pass using only real data (no
  invented Level/XP/Clubs/Badges) — now additionally reads the new glass-surface tokens.
- **Nav rail** (`LeftNavigationRail.tsx`): floating pill bar with raised FAB — now glass-surfaced.

## 5. UX improvement this pass: the missing "+" flow

The center "+" nav action previously jumped straight to Create Ride with no way to instead find a ride,
join with a code, or report an incident from the same entry point — exactly the gap flagged. Added
`CreateActionSheet.tsx`, a bottom sheet with four equal options (Create Ride, Find a Ride, Join with
Code, Report Incident), wired to the FAB. All four routes already existed in the app; nothing new was
invented, just made reachable from the "+" entry point.

## 6a. Follow-up migration pass (this session)

A repo-wide audit found the situation had already moved on from what section 6 described: `CreateRide.tsx`,
`MyIncidents.tsx`, `MapView.tsx`, `GroupsHMI.tsx`, `MapControls.tsx`, `RideDetail.tsx`, `ExploreRides.tsx`,
`ReportIncident.tsx`, and `CreateActionSheet.tsx` were all already using `card-app`/`btn-app-primary`/
`bg-app-canvas` — no `card-soft`/`card-soft-accent` usage remains anywhere in `frontend/src`. What was
still inconsistent was the **orange itself**: several screens hardcoded the older `#FF5A00` / `#ef4523`
oranges (and one `#FF8A3D→#FF5A00` gradient) instead of `--rc-primary`/`--rc-gradient-brand`. Fixed:

- `frontend/src/pages/LoginScreen.tsx` — replaced `#FF5A00` (focus rings) and `#ef4523` (headline accent,
  underline bars, feature-icon color, legal links) with `var(--rc-primary)`; replaced both
  `linear-gradient(135deg, #FF8A3D 0%, #FF5A00 100%)` CTA button gradients with the canonical
  `var(--rc-gradient-brand)`.
- `frontend/src/pages/MapView.tsx` — replaced all `#ef4523` usages (report-incident modal selection
  states, marker color, focus rings, buttons) with `var(--rc-primary)`.
- `frontend/src/App.tsx` — replaced `#ef4523` in the "web access restricted" CTA button and the
  maintenance-screen icon SVG fills with `var(--rc-primary)`.

`HomeMap.tsx` and `RiderCockpitLayout.tsx` were checked and found to have no card/orange UI to migrate
(pure map-canvas logic and the intentionally-separate dark HMI cockpit theme, respectively). `CreateRide.tsx`
still has many literal `#FF6B22` occurrences inline (in `className`/`style`) rather than `var(--rc-primary)`
— left as-is since `#FF6B22` is byte-for-byte the same value as the token (zero visual difference) and
replacing ~30 occurrences for a purely cosmetic/no-op change would violate the minimal-diff rule; flagged
here rather than silently left unmentioned.

## 6b. Bento Grid layout system (this session)

Added a shared Bento Grid utility to `frontend/src/index.css` (`.bento-grid`, `.bento-tile`,
`.bento-tile--wide`, `.bento-tile--lg`, `.bento-tile--tall`) and applied it to four screens' main
content areas. No new colors/radii/shadows were invented — every value comes from the existing
`--rc-*` tokens (`--rc-surface`, `--rc-border-subtle`, `--rc-radius-2xl`, `--rc-shadow-soft`/
`--rc-shadow-floating`, `--rc-space-*`, `--rc-duration-normal`, `--rc-ease-standard`), so a
`.bento-tile` and a `.card-app` are the same surface, just placed on a grid instead of stacked.

- `.bento-grid` is `1fr` (mobile) → `repeat(2, 1fr)` at `640px` → `repeat(4, 1fr)` at `1024px`,
  mobile-first, no horizontal scroll (tiles wrap into the grid, they never force overflow).
- `.bento-tile` carries the glass surface, border, radius and soft shadow, plus a
  `transform: scale(1.02)` + shadow-lift hover, both wrapped in
  `@media (prefers-reduced-motion: reduce)` so the scale/transition is dropped entirely for users
  who've asked for reduced motion.
- `.bento-tile--media` is a variant for tiles that already carry their own visual (a full-bleed
  photo banner) — it keeps the radius/clipping/hover but drops the background/border/shadow so it
  doesn't double up with the photo.
- Size variants: `--wide` spans 2 columns at ≥640px, `--tall` spans 2 rows, `--lg` spans 2×2 — used
  to make one tile dominant instead of a uniform grid of identical boxes, per this app's existing
  "one dominant element" principle (section 1).

Applied to:

- **`HomeLandscape.tsx`** — the Featured Ride banner, quick actions, and upcoming rides list (three
  previously separate flex-stacked sections) are now one `.bento-grid`: the featured ride is
  `bento-tile--lg bento-tile--media` (dominant, keeps its own photo/gradient), quick actions sit in
  a `bento-tile--wide` tile, and each upcoming ride is its own `bento-tile`. The "Upcoming Rides /
  See All" row spans the full grid width via an inline `gridColumn: '1 / -1'` (no new CSS class
  needed for a one-off full-bleed row).
- **`ExploreRides.tsx`** — the ride list (`filteredRides.map`) is now a `.bento-grid`; the first
  (top-sorted) ride is `bento-tile--wide` as the dominant card, the rest are equal `bento-tile`s.
  Loading skeleton and empty state were left as plain stacked `card-app` blocks (they're transient/
  single-message states, not a "cards grid").
- **`features/groups/GroupsHMI.tsx`** — the browsable groups list is now a `.bento-grid` with the
  first group as `bento-tile--wide`. Caveat: this list also renders inside a fixed-width
  (300–380px) sidebar in landscape mode — CSS media queries are viewport-width based, not
  container-width based, so on a wide viewport with the sidebar visible, the grid will still try to
  go 2-column and squeeze two ~150px-wide row-style tiles side by side. This was not visually
  verified in a browser; if it looks cramped in landscape, the simplest fix is a container query
  (not yet supported by this codebase's build target) or scoping `.bento-grid` to single-column
  when it's a descendant of the landscape sidebar. Flagging rather than guessing further.
- **`features/profile/ProfileHMI.tsx`** — the "Stats row" (4 metric cards) is now a `.bento-grid`
  of 4 equal `bento-tile`s (no dominant tile here — not every bento grid needs one; the brief's own
  spec allows "varied spans," not "always asymmetric"). The Achievements grid and Menu grid
  (`grid-cols-3`/`grid-cols-5`) were left untouched — they're icon-only mini-grids, not the
  "cards"-style tiles this pass targeted, and touching them wasn't requested.

Not touched, per explicit constraint: `backend/`, `supabase/migrations/`, `LoginScreen.tsx`,
`MapView.tsx`, `HomeMap.tsx`, `RiderCockpitLayout.tsx`, `LeftNavigationRail.tsx`.

`npx tsc -b` was run after these changes and is clean. **No visual QA in an actual browser** — same
standing limitation as the rest of this document; the hover scale/shadow-lift, the 1/2/4-column
breakpoint collapse, and the GroupsHMI sidebar-width caveat above are all unverified by eye.

## 6. What was NOT done (be specific, not vague)

This brief asks for a genuinely large scope — full interaction-state coverage, skeleton loading states,
error-state copy, three full refinement passes across every screen, responsive verification at 7
breakpoints, and a full component audit for hardcoded values. None of that has happened. Specifically:

- The token system and `card-app`/`btn-app-primary`/`bg-app-canvas` utilities are now used consistently
  across the light "app" screens (Home, Profile, nav rail, Create Ride, Map, Explore Rides, Ride Detail,
  Report Incident, My Incidents, Groups, Login, Create-action sheet). The dark HMI/cockpit screens
  (`RiderCockpitLayout.tsx` and the `hmi/` tree) intentionally remain a separate dark design language and
  were not touched.
- **No skeleton loading states** were added anywhere — Home's ride list and Profile's stats still show
  nothing/zero while their Supabase queries are in flight.
- **No explicit empty/error-state copy** was written beyond what already existed (e.g. Home's "No
  upcoming public rides yet" line, which was already reasonably worded).
- **No interaction-state audit** (hover/pressed/focus/disabled/loading/success per element) was performed.
- **No responsive verification** was run across the specified breakpoint set.
- **No dedicated Ride Detail screen** rebuild happened this pass (that was queued as the next screen
  before this message arrived; still not started).
- Typecheck (`tsc -b`) was run after each change and is clean, but **no visual QA pass in an actual
  browser** happened from my side this turn — screenshots from you are still the only way I can verify
  any of this looks right, same limitation as the rest of this conversation.

## 7. Remaining inconsistencies

1. Two coexisting card systems (`card-app`/`card-app-lg` on the token system vs. `card-soft`/
   `card-soft-accent` elsewhere) — needs a follow-up pass to migrate the remaining screens onto the
   token-driven system, or the token system isn't actually "canonical" yet.
2. `CreateActionSheet`'s "Report Incident" and "Find a Ride" both currently point at `/map` — that's the
   real route for both today; if incident reporting needs a distinct entry point/modal on that page, that
   is a product decision outside a visual-only pass.

## 8. Future layout recommendation (per instructions: document, don't implement)

The brief's Ride Detail spec (hero photo → overlapping content card → stat chips → host row → route
preview → highlights → sticky Join button) doesn't map onto `JoinRide.tsx`'s current simple form layout
at all — that page has no photo, no route preview, no highlights data model. Building that screen
properly means either extending `CreateRide.tsx`'s ride record with highlight tags, or building a new
ride-preview screen that reads an existing ride's data before joining. That's a layout/data-model change,
flagged here rather than silently implemented.
