# Learner Dashboard: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/learner/LearnerDashboard.tsx` and the rebuilt `frontend/src/app/components/shared/AppLayout.tsx` shell (commit `73858b56`).
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`). The same method as `learner-dashboard-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence:** the source code, plus the page rendered in Chromium after signing in through `/login` with a real seeded learner account against the local backend. No session was faked. Layout measurements were taken at 100% zoom (device pixel ratio 1) at 1280px and 1024px.
- **Screenshots:** `learner-dashboard-after-1280.png` and `learner-dashboard-after-1024.png`, taken in Chrome at 100% zoom with the page laid out at 1280px and 1024px. The saved images are about 82% of CSS size, **1050×1148** and **828×1456**, so they are smaller than the before images (1280×1162 and 1024×1162) even though the layout widths match. They were captured as WebP and converted to PNG with no other change.
- **Scope:** this is a focused Gestalt review done by one reviewer, the same as the before file. The design skill's automated check (`impeccable detect`) found nothing on either file.

> **What this account shows.** The test learner has not started the pre-test and is not in an active cohort. So the screenshots show the empty states: readiness "Not yet", pre-test "0 of 5 parts done", and "No lessons yet". Filled progress bars, filled rings and done steps exist in the code but don't appear in these captures.

## Measured layout

| | 1280px | 1024px |
|---|---|---|
| Grid | Main column 600px + aside 352px, 24px gap | One column 705px, then two aside cards (340px each) side by side |
| Readiness card / Muse 2 card | Same row, both **267px** tall | Readiness on top, Muse 2 moves below the main column |
| Horizontal overflow | None | None |
| Font sizes in the content area | 15, 16, 17, 18, 24, 28, 32, 48px | Same |

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ✅ Follows | Spacing is on the DESIGN.md rhythm, and every status sits directly under the thing it describes. |
| Similarity | ✅ Follows | Each color has one job, and each kind of thing has one look. |
| Continuity | ✅ Follows | One four-step path, with nothing running parallel to it. |
| Figure-Ground | ✅ Follows | Paper ground, white cards, and navy kept for the Muse 2 card. |
| Prägnanz (Simplicity) | ✅ Follows | One progress display, one primary button, and no repeated numbers. |
| Symmetry | ⚠️ Partial | Balanced at 1280px. At 1024px the two aside cards differ a lot in height. |
| Connectedness | ✅ Follows | Connector lines join the steps, and each fill sits on its track with its value. |
| Common Region | ✅ Follows | One card per topic, no nested tiles, and no empty grid cells. |
| Focal Point | ⚠️ Partial | The readiness card leads, but the navy Muse 2 card next to it is the highest-contrast block. |
| Common Fate | ✅ Follows | Shared timing and curve, one-time fills, and no movement under reduced motion. |

**Follows 8, partial 2, breaks 0.** The before version followed 2, partly followed 3 and broke 5.

## Principles it follows

### Proximity ✅
- **On the rhythm:** cards are padded 32px and separated by 24px, on the 4 / 8 / 16 / 24 / 32 rhythm.
- **Headings have room above them:** the welcome heading has 40px below it before the first card. Card titles have the card's 32px padding above and 24–32px below.
- **Statuses stay with their step:** in the steps display, each status ("You are here", "After Pre-test") sits 4px under its step name, and each step sits under its circle. The old "Current step" line, which repeated the status far from the step, is gone.
- **Pre-test progress:** each part's name and "Not yet" / "Done" share one row, 12px from the next part.
- **Small inconsistency:** the gap under the card title is 32px in "Your learning steps" and 24px in the other two cards.

### Similarity ✅
- **One color per job (the One Job Rule):**
  - **Deep blue:** the one primary button, done steps, and progress fills.
  - **Amber:** where the learner is right now (the active nav item and the current step) and readiness (the ring track).
  - **Indigo:** only the strand codes (LS1, LS3).
  - **Navy:** only the Muse 2 card.
- **Consistent looks:** Pre-test now looks the same everywhere it appears: an amber current step, and the sidebar item when active. Locked steps share one look (a white circle with a lock). Pre-test parts share one status style (a clock for not yet, a check for done).
- **One icon language:** emoji and the rainbow palette are gone. All icons are Lucide at a consistent stroke.
- **Watch:** there are two rings on the screen. They're told apart by color (amber means readiness, deep blue means pre-test progress) and by their labels. Keep that difference if a third ring is ever added.

### Continuity ✅
- **One path:** "Your learning steps" is the only progress line. Pre-test, Learning Content, Post-test and My Progress sit on one horizontal path, and the second gradient bar that ran parallel to it is gone.
- **One left edge:** every card's content starts on the same edge, set by the 32px padding. The page reads top to bottom: welcome, readiness, steps, strands.

### Figure-Ground ✅
- **Ground and figures:** the ground is warm paper `#F8F6F2` everywhere, including the light sidebar. White cards with a hairline border are the figures.
- **Navy for the sensor only:** instrument navy is used only for the Muse 2 card, as DESIGN.md reserves it for sensor information. The navy greeting banner is gone.
- **Readable text:** no text uses the failing `#9CA3AF` gray anymore. Supporting text is `#4A4F5C` (7.59:1 on paper).

### Prägnanz (Simplicity) ✅
- **Before:** Pre-test could be reached four ways from the dashboard, the streak was shown three times and progress four times.
- **After:** there's one primary action ("Continue to Pre-test"), one display of where the learner is, and one pre-test breakdown.
- **Gone:** the welcome line that repeated the next step. Also the Quick Actions, the streak, the Achievements tile and the stats row.
- **What's left:** the clickable step circles and the sidebar also lead to Pre-test. The sidebar is global navigation, and the circles are part of the steps display, so this is acceptable.

### Connectedness ✅
- **Steps:** a connector line joins the four steps, and it turns deep blue between steps that are done (in code, not visible on this account).
- **Rings:** both always print their value inside ("Not yet / READINESS", "0 of 5 / parts done").
- **Strand bars:** each one sits on its own track with "x of y lessons" on the row above (in code, not visible on this account because there's no cohort).

### Common Region ✅
- **One topic per card:** readiness, steps, strands, Muse 2 and pre-test progress each have one card.
- **No nesting:** there are no gray tiles inside cards anymore. The "No lessons yet" empty state was moved out of its tinted box so it doesn't create a second region inside the card.
- **No empty cells:** both grids hold exactly the cards they have, and nothing sits blank.

### Common Fate ✅
- **Shared timing:** every press and hover in the shell and dashboard uses 150ms and the same `cubic-bezier(0.23, 1, 0.32, 1)`. Menus open from the corner they come out of (150ms) and close instantly.
- **Fills reveal together:** progress fills (rings and bars) reveal once over 300ms on the same curve, so fills that update together move together.
- **Decorative motion removed:** the endless `animate-ping`, the 500ms bar and the hover lifts are gone.
- **Reduced motion:** under `prefers-reduced-motion`, scale and fill movement are off and the loading pulse stops. This was checked in the browser.

## Principles it partly follows

### Symmetry ⚠️
- **Holds at 1280px:** the 2/3 + 1/3 split is the deliberate asymmetry DESIGN.md sets for dashboards. The top row is balanced, with the readiness and Muse 2 cards both 267px tall. The four steps share equal columns.
- **Weak at 1024px:** the Muse 2 card (about 223px) and Pre-test progress (about 448px) share a row. The Muse 2 card keeps its natural height (stretching it left a large empty navy block), so roughly 225px of paper sits under it.
- **Possible fixes:** stack the two cards at this width, or put Pre-test progress first and full width.

### Focal Point ⚠️
- **Holds:** the readiness card is the intended focal point. It's first, it's the largest card, and it holds the only saturated button. The amber ring and corner glow support it.
- **Competes:** the navy Muse 2 card sits in the same row and is the highest-contrast block on the page. It currently holds only one sentence, because there's no live sensor data.
- **Amber is used three times:** the active nav item, the current step and the readiness ring. That's consistent with the "you are here / readiness" job, but it means amber doesn't single out one element.
- **Possible fixes:** soften the Muse 2 card until real sensor data exists, for example by making it shorter at 1280px instead of matching the readiness card. Or give it real content (the baseline status) once the API provides it.

## Remaining issues outside the Gestalt list

- **No readiness or sensor data from the API yet,** so those two cards are informational empty states. They'll need a real state when the readiness profile and Muse 2 baseline status are exposed.
- **DESIGN.md mismatch:** DESIGN.md's sidebar spec includes "Start Session" and "Support". Neither exists, because neither has a defined action yet.
- **Wrapping at 1280px:** "Learning Content" and "After Learning Content" wrap to two lines in the steps display.
- **Seed data:** the seeded account's name makes the greeting read "Welcome, Alternative!".

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ✅ Follows | 20px/12px spacing became 32px/24px on the rhythm, and the duplicate "Current step" line was removed. |
| Similarity | ❌ Breaks | ✅ Follows | Pre-test went from four looks to one. Indigo is no longer used for everything, the rainbow palette and emoji are gone, and each color has one job. |
| Continuity | ✅ Follows | ✅ Follows | Kept the stepper and removed the parallel gradient bar that split the path. |
| Figure-Ground | ❌ Breaks | ✅ Follows | The navy greeting banner became a heading on paper. Navy now means Muse 2 only, the cool gray ground became paper, and the failing gray text is gone. |
| Prägnanz | ❌ Breaks | ✅ Follows | Four paths to Pre-test became one button. Three streaks and four progress displays became one steps display. |
| Symmetry | ⚠️ Partial | ⚠️ Partial | No more empty grid cells, and the top row is equal at 1280px. Uneven aside cards remain at 1024px. |
| Connectedness | ✅ Follows | ✅ Follows | Kept the connectors and bar-plus-value rows. Done segments now use deep blue. |
| Common Region | ⚠️ Partial | ✅ Follows | Nested tiles and empty cells are gone, and there's one card per topic. |
| Focal Point | ❌ Breaks | ⚠️ Partial | Five competing elements became one readiness card with one button. The navy Muse 2 card still competes. |
| Common Fate | ❌ Breaks | ✅ Follows | The endless pulse, 500ms bar and hover lifts became one 150ms curve with one-time fills and reduced-motion support. |
| **Total** | **2 follow, 3 partial, 5 break** | **8 follow, 2 partial, 0 break** | |

| Other issue (from the before file) | Before | After |
|---|---|---|
| Dead Achievements link | Linked to a commented-out route | Removed |
| Hardcoded demo data (7-day streak, 8 achievements, content %) | Shown as real results | Removed. Every figure comes from the learner's records, with empty states where there's no data |
| Learner text size | 12–14px, plus 13px overlines | 15px minimum (the uppercase labels), labels 16–17px, sentences 18px |
| Low-contrast gray text (`#9CA3AF`, 2.54:1) | Step descriptions, percentages, pill | Not used. Supporting text is `#4A4F5C` (7.59:1) |
| Fixed "Good morning" greeting | Shown at any time | Removed |
