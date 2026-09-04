# Toggle Calendar — V0.3 Update Plan 🇵🇰

> **Current:** V0.2 — PWA install, recurring events, NLP input, Urdu mode, notifications, drag & drop, perf optimizations (debounced search, memoized prayer times, event delegation, service-worker caching).
> **Goal:** V0.3 — Harden what exists, add user-requested features, and raise engineering quality.

---

## Pillar 1 — V0.2 Debt & Polish 🧹

| Task | File(s) | Status |
|------|---------|--------|
| Remove dead `[dir="rtl"]` mirror CSS rules | `style.css` | ✅ Done |
| Add MIT `LICENSE` file (badge in README already claims it) | `LICENSE` [NEW] | ✅ Done |
| Network-first caching for `index.html` (no stale shell between releases) | `sw.js` | ✅ Done |
| Global error handler + user-visible toast on JS errors | `js/main.js` | ✅ Done |
| Static check script + CI workflow | `scripts/check.mjs`, `.github/workflows/ci.yml` [NEW] | ✅ Done |
| Remove duplicate service-worker registration | `js/main.js` | ✅ Done |
| PNG icons (180×180 `apple-touch-icon`) for Safari/iOS install | `icons/`, `index.html`, `manifest.json` | ✅ Done |
| Complete Urdu coverage: month title, status-bar pills, modal titles | `js/constants.js` (URDU map), `js/components/sidebar.js`, `js/components/modal.js` | ✅ Core done — modal field labels & popover buttons TODO |
| Audit remaining hardcoded `font-family` elements so Urdu font applies everywhere | `style.css` | ⬜ TODO |
| Add screenshots (light/dark/Urdu) to README | `assets/`, `README.md` | ⬜ TODO |

## Pillar 2 — Features ✨

| Task | Notes | Effort |
|------|-------|--------|
| Real reminder scheduling via Service Worker | Fire when tab is backgrounded, not just on the 30s tick | M |
| "Edit this occurrence only" for recurring events | Currently only series-level move with confirm dialog | M |
| ↻ Recurrence badge on event chips | Visual indicator on month/week views | S |
| ICS / JSON import | Complement existing export; migration path from Google Calendar | M |
| Search upgrades: date-range + category filters | Current search is substring-only | M |
| Custom user categories & colors | Replace hardcoded `CAT_COLORS` | M |
| Stats / year heatmap view | GitHub-style event density; reuses mini-cal patterns | M |
| Automatic Ramadan detection via Hijri engine | Replace manual `showRamadan` toggle | S |
| Load shedding schedules per DISCO (K-Electric, LESCO…) | Replace per-city approximations | M |
| Print / PDF-friendly month view stylesheet | Wall-calendar use case | S |
| Swipe-to-close + drag handle for mobile sidebar | Mobile UX polish | S |

## Pillar 3 — Engineering Quality 🔧

| Task | Notes | Effort |
|------|-------|--------|
| Browser smoke tests (seed: headless Edge/Chromium harness used for sidebar & Urdu bug fixes) | Boot, language toggle, hamburger, event CRUD, drag | M |
| ES modules migration | Replace 14 script tags + `window.Toggle` globals (~40 aliases) | L |
| localStorage schema migration layer | Old saved events lack `recurrence`/`reminder` fields | S |
| Selective render APIs | `renderAll()` still rebuilds mini-cal + sidebar widgets every interaction | M |
| Accessibility: `aria-expanded` on hamburger, modal focus trap, arrow-key day-cell nav, focus rings | A11y pass | M |
| Mobile audit at 320px; Day/Agenda chips hidden ≤640px | Responsive gaps | S |
| CI: deploy to GitHub Pages on release | Keeps the live site in sync (stale-deploy bit us during debugging) | S |

---

## Suggested Execution Order

```
PNG icons + Urdu coverage (finish V0.2)  →  smoke tests  →  ICS import  →
SW reminders  →  custom categories  →  ES modules  →  stats heatmap  →  a11y pass
```

## Effort scale
XS < 30 min · S < 1.5 hrs · M < 4 hrs · L < 8 hrs
