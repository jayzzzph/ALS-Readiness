# Learner Dashboard: Gestalt Critique (Before)

- **Target:** `frontend/src/app/components/learner/LearnerDashboard.tsx` (169 lines), shown inside the shared `AppLayout` shell.
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c481359c`).
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `7cd7e23f`.
- **Evidence:** the source code, plus the page rendered in Chromium after signing in through `/login` with a real seeded learner account against the local backend. No session was faked. Full-page screenshots: `learner-dashboard-before-1280.png` and `learner-dashboard-before-1024.png`. The design skill's automated check (`impeccable detect`) flagged one problem: a purple gradient at line 125.
- **Scope:** this is a focused Gestalt review done by one reviewer. It isn't the full multi-reviewer `impeccable critique`. No code was changed.

> This screen still uses the **old** visual system: the dark navy sidebar, indigo `#3535C5` everywhere, a cool gray background, Tailwind grays and emoji. DESIGN.md treats that system as legacy. Many of the "breaks" below come from that, and they go away once the screen is rebuilt in the light style.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Groups mostly hold, but spacing is off the DESIGN.md rhythm and status text sits far from its step. |
| Similarity | ❌ Breaks | One destination looks four different ways, and one color means four different things. |
| Continuity | ✅ Follows | The pipeline stepper reads cleanly left to right, though a second progress bar runs parallel to it. |
| Figure-Ground | ❌ Breaks | A navy greeting banner is the strongest figure, on a cool gray ground instead of paper. |
| Prägnanz (Simplicity) | ❌ Breaks | Pre-test can be reached four ways, the streak is shown three times and progress four times. |
| Symmetry | ⚠️ Partial | The stepper is balanced, but the stats and Quick Actions grids leave empty columns. |
| Connectedness | ✅ Follows | Connector lines join the steps, and each content bar shares a row with its percentage. |
| Common Region | ⚠️ Partial | Each section has its card, but tiles nest inside cards and some grids leave blank regions. |
| Focal Point | ❌ Breaks | Five elements compete for attention, and the readiness ring from the mockup is missing. |
| Common Fate | ❌ Breaks | Motion is unrelated and decorative: an endless pulse, a 500ms bar and hover lifts, with no reduced-motion fallback. |

**Follows 2, partial 3, breaks 5.**

## Principles it follows

### Continuity ✅
- **Where it works:** the Learning Pipeline stepper (lines 57–85) puts Pre-test, Learning Content, Post-test and View Progress on one horizontal line. The labels and descriptions are centered under each circle, so the eye travels left to right along the path the learner actually follows.
- **What weakens it:** a separate gradient progress bar (lines 53–56) runs parallel just above the stepper, filled to 12.5%. Two parallel lines that disagree (step 1 of 4 on the stepper versus an eighth of the bar) split the path in two. The stepper alone carries it.

### Connectedness ✅
- **Stepper:** the connector line between steps (lines 67–68) ties the four steps into one sequence. It turns green when a step is done, so the connection also shows completion.
- **Recent Learning Content:** each item's progress fill sits on its own track with the percentage on the same row (lines 155–159). That matches the DESIGN.md rule that a fill always sits on its track with its value beside it.
- **Small gap:** the "Step 1 of 4" pill (line 50) sits in the card header, away from the stepper it describes. It's connected only by being inside the same card.

## Principles it partly follows

### Proximity ⚠️
- **Holds:** in the stat tiles (lines 108–114), value, label and "View" are stacked tightly, so each tile reads as one unit. In the Current step row (lines 87–96), the label and description are grouped on the left and the action on the right.
- **Off the rhythm:** card padding is 20px (`p-5`), and the gaps are 12px (`gap-3`) and 20px (`space-y-5`, `gap-5`). DESIGN.md's rhythm is 4 / 8 / 16 / 24 / 32 with 32px card padding. Because 20 and 12 aren't on the scale, the spacing between groups and inside groups is too close to tell apart.
- **Heading spacing is reversed:** "Learning Pipeline" has 20px above it (card padding) and 16px below (`mb-4`). Both are small, and the gap below nearly equals the gap above. DESIGN.md asks for clearly more space above a heading than below.
- **Status far from its step:** "Current step: Pre-test / Participant intake required" (lines 89–90) repeats the description already under the Pre-test circle about 70px higher. The status and the step it describes are far apart, so the learner reads the same message twice in two places.

### Symmetry ⚠️
- **Holds:** the stepper's four columns share equal width (`flex-1`), so it reads as a balanced row.
- **Breaks in the stats row:** it's a 4-column grid with 3 tiles (lines 100–105), so the right quarter is empty (see the screenshot).
- **Breaks in Quick Actions:** it's a 3-column grid holding one card (lines 119–121), so two thirds of the row is blank.
- **Result:** neither row is balanced, and neither uses the deliberate 2/3 + 1/3 asymmetry DESIGN.md sets for dashboards. They look unfinished rather than intentional.

### Common Region ⚠️
- **Holds:** the welcome banner, Learning Pipeline, each stat, Quick Actions and Recent Learning Content each have their own bounded card, so the main sections separate clearly.
- **Breaks with nested cards:** Quick Actions rows (line 133) and Recent Learning Content tiles (line 152) are gray-50 rounded boxes inside white cards. DESIGN.md says "Cards never nest". A tile inside a card makes two levels of region the learner has to sort out.
- **Breaks with empty regions:** the empty grid cells above suggest regions that should hold something but don't.
- **Breaks with the shell:** the shell's dark sidebar region doesn't match the light sidebar DESIGN.md specifies.

## Principles it breaks

### Similarity ❌
- **One destination looks four different ways:** Pre-test appears as an indigo stepper circle (line 74), a purple-tinted stat tile reading "Start" (line 102), a purple-gradient Quick Action row (line 125) and a sidebar item. A learner can't tell from appearance that these all lead to the same place.
- **One color means four different things:** `#3535C5` indigo marks the active step (line 15), the step label (line 79), the Continue button (line 93), the "View" and "See all" links (lines 113, 148) and in-progress content fills (line 157). DESIGN.md's One Job Rule gives deep blue to actions and indigo to learning strands only.
- **The palette is rainbow-coded:** purple, orange, yellow, green, blue and a cyan gradient (lines 102–104, 125–128) are used as decoration with no meaning attached. The detector flags the purple gradient (line 125) as an AI-palette tell.
- **Emoji stand in for icons:** 📹 🎧 📖 in Recent Learning Content (line 153) and 👋 in the greeting (line 36) mix a second icon language in with the Lucide icons.

### Figure-Ground ❌
- **The wrong figure is strongest:** the welcome banner (line 33) is navy `#0B1F3A` with white text, the darkest and most contrasting block on the page. DESIGN.md keeps navy for sensor readings only, because measured signal should be the strongest figure. Here a greeting holds that slot.
- **The wrong ground:** the page sits on a cool gray (`AppLayout`), not warm paper `#F8F6F2`. The dark navy sidebar also competes with the content as a second figure.
- **Text blends into the ground:** step descriptions, the percentages and the "Step 1 of 4" pill use `text-gray-400` (`#9CA3AF`, 2.54:1 on white), which DESIGN.md flags as failing. The pending steps blur into the background instead of reading as content to come.

### Prägnanz (Simplicity) ❌
- **Too many ways to one place:** Pre-test can be reached from the stepper, the Continue button, the "Start" stat tile and the Quick Actions row, plus the sidebar.
- **The streak is shown three times:** in the banner sentence, the banner badge (lines 38–43) and a stat tile (line 103).
- **Progress is shown four times:** the gradient bar, the stepper, the "Step 1 of 4" pill and the "Current step" line.
- **No simple stable reading:** a learner with limited schooling has to work out that all of these mean "do the Pre-test next". DESIGN.md asks for one primary action per area and one task at a time.

### Focal Point ❌
- **Five elements compete:** the dark navy banner, the endless pulsing ring on the Pre-test circle (line 76), the indigo Continue button, the orange "7-day streak" text and badge, and the large "Start", "7 days" and "8" numbers. There's no single entry point.
- **The intended focal point is missing:** in the Learner Dashboard mockup, the amber readiness ring ("78% READY") is the focal point and the main reason this screen exists. This screen shows no readiness at all.
- **What should lead:** the one thing the learner needs to do (Continue to Pre-test) isn't the most prominent element.

### Common Fate ❌
- **Endless decorative pulse:** `animate-ping` on the active step (line 76) pulses forever, with no `motion-reduce` guard. Nothing else moves with it, so it reads as an alarm, not as part of a group.
- **Unrelated timing:** the progress bar uses `transition-all duration-500` (line 54), over the 150–200ms DESIGN.md sets and on `all` properties. Stat tiles lift and gain a shadow on hover (`hover:-translate-y-0.5 hover:shadow-md`, line 109). Step circles scale to 110% (line 74). Each uses its own timing and the default curve, not the shared `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Shadows break the flat rule:** the hover shadow adds depth to cards, which DESIGN.md's Flat Workbook Rule forbids.
- **No reduced-motion handling:** none of this motion is turned off under reduced motion.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same learner.

- **A dead link:** the "Achievements" stat tile navigates to `achievements` (line 104), but that route is commented out in `App.tsx` (line 120). Clicking it leads nowhere useful.
- **Hardcoded demo data shown as real:** "7-day streak", "8" achievements, every pipeline status and all three content items are constants (lines 6–23, 38, 42, 103–104). PRODUCT.md says not to present placeholder figures as real learner results. The real-account screenshots confirm it: a brand-new learner account still shows a 7-day streak, 8 achievements and 65% / 100% / 0% content progress.
- **Text too small:** most text is `text-xs`/`text-sm` (12–14px). DESIGN.md sets learner text at 15px minimum for labels and 18px for sentences, in Atkinson Hyperlegible.
- **Fixed greeting:** "Good morning 👋" shows at any time of day.

## What a rebuild would need

This is a direction to follow when the screen is rebuilt, not a spec. It isn't implemented.

1. **One focal point:** a readiness hero card with the amber ring and one plain sentence, plus one primary "Continue to Pre-test" button in deep blue.
2. **One path:** keep the stepper as the only progress display. Remove the duplicate bar, the "Step 1 of 4" pill and the repeated "Current step" text.
3. **Navy only for Muse 2:** use it for the Sensor Status / Signal Quality card, and turn the greeting into a Display heading on paper.
4. **Layout:** a 2/3 + 1/3 grid at 1280px. Main column: readiness, then Today's Recommendations. Aside: sensor, then Diagnostic Progress. No empty cells.
5. **Spacing and color:** use 32px card padding and the 24/48 rhythm. Indigo goes only on strand labels such as "LS1: Communication", and Lucide icons replace the emoji.
6. **Motion:** remove `animate-ping` and the hover lifts. Any fill animation runs once at 150–200ms on the shared curve, with a reduced-motion fallback.
