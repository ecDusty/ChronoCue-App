# ChronoCue App

A fullscreen countdown timer with agenda mode for live events.

---

## Development Setup

The project is now built with a proper dev stack reverse-engineered from the original Perplexity-generated bundle.

**Tech stack:** React 18 · TypeScript · Vite · Tailwind CSS · Sass (SCSS)

**Source lives in `src/`. The `live/` folder is the build output — do not edit it directly.**

```
npm install       # first time setup
npm run dev       # dev server with hot reload (http://localhost:5173)
npm run build     # type-check + build → live/
npm run preview   # preview the production build locally
npm run typecheck # type-check only, no build
```

### Project structure

```
src/
├── types/          # TypeScript interfaces
├── utils/          # time helpers, audio engine
├── hooks/          # useTimer, useSettings
├── components/     # all UI components
├── styles/         # Sass variables, custom classes, Tailwind entry
├── App.tsx         # main component
└── main.tsx        # React root
live/               # production build output (served by server.cjs)
```

---

## Feature To-Do

### Bug
- [ ] **Font color setting doesn't apply to UI button text**
  The `fontColor` setting currently only colours the timer digits. Buttons use hardcoded Tailwind teal/white classes. Decision needed: should a separate "UI accent colour" control exist, or should `fontColor` drive everything? Recommend adding a distinct `accentColor` setting rather than overloading `fontColor`.

### Architecture
- [x] **Simple timer and Agenda timer should be independent**
  Both modes now have their own `useTimer` instance (`simpleTimer`, `agendaTimer`), so each keeps its own state. Switching away from a *running* timer pauses it (with a first-time confirmation dialog that has a "don't show again" option) and auto-resumes it when you switch back.

### Agenda features
- [ ] **Per-agenda-item settings**
  Each agenda item should carry its own toggles: overtime display on/off, clock blink/fade on/off, gong on/off, gong sound selection. Extend the `AgendaItem` type and surface controls in the agenda editor. Global settings become defaults; per-item settings override them.

- [ ] **Total agenda time tracking with over/under display**
  Track the scheduled total duration (sum of all item durations) vs. actual elapsed time. Show a running delta during the agenda (e.g. "+0:32 over") and a summary when the agenda ends. Also track per-item over/under for a post-run breakdown.

### Previously planned
- [ ] Fix quick add button in Agenda mode
- [ ] Low-time reminders (1 min, 2 min, 5 min, half-way) with sound and visual options
- [ ] Excel import for agenda items
- [ ] Sound options dropdown for end noise
