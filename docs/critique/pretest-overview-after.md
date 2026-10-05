# Pre-test Overview: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/diagnostic/DiagnosticTest.tsx` and `StrandTestCard.tsx`, rebuilt as a timeline with a progress aside (commits `a645e9a5` and `655ecd43`, plus the strand-row cleanup in the commit that adds this file).
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `pretest-overview-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence:** the source code and the screenshot `pretest-overview-after.png`. I read the code and the image. I did not render the page myself or measure it, so no pixel measurements are given. The design skill's automated check (`impeccable detect`) found nothing in either file.
- **The screenshot is a different learner state from the before.** The before image is a learner who has not started (Part I open, the rest locked). The after image is a learner who has finished Part I and Part II and the English exam, with Filipino started and Mathematics not. So the two images compare the layout, not the same data. The screenshot also predates one change in this commit: it still shows the test title line ("LS1-EN Diagnostic Pre-test") under each strand name, which is now removed from the strand rows.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. Not checked: 1024px width, phone width, the locked-only and all-done states, Part IV expanded, and reduced motion in the browser.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Mostly on the rhythm, but cards are padded 24px (not 32px) and strand rows 20px. |
| Similarity | ✅ Follows | One button look, one marker set, and each color has one job. |
| Continuity | ✅ Follows | A thin line joins the four parts, and everything shares one left edge. |
| Figure-Ground | ✅ Follows | Paper ground, one white figure, no card shadows, navy only for Muse 2. |
| Prägnanz (Simplicity) | ⚠️ Partial | One place for "where you are", but two deep-blue buttons sit in Part III. |
| Symmetry | ✅ Follows | A deliberate 2/3 + 1/3 split at 1280px, as DESIGN.md sets for dashboards. |
| Connectedness | ✅ Follows | The line draws the order, and the ring prints its number and word. |
| Common Region | ✅ Follows | One card per topic and no nested cards. |
| Focal Point | ⚠️ Partial | The open part leads, but the navy Muse 2 card and two primary buttons compete. |
| Common Fate | ✅ Follows | One 150ms curve for presses, and one-time fills with reduced-motion fallbacks (from code). |

**Follows 7, partial 3, breaks 0.** The before version followed 0, partly followed 4 and broke 6.

## Principles it follows

### Similarity ✅
- **One job per color (the One Job Rule):**
  - **Deep blue:** every action (`primaryButton` and `secondaryButton`, `StrandTestCard.tsx` lines 18 to 19), done markers, the done line, and the progress ring.
  - **Amber:** only where the learner is: the current marker and "You are here".
  - **Indigo:** only the strand codes (`LS1-EN`, `LS1-FIL`, `LS3`).
  - **Navy:** only the Muse 2 card.
- **Gone:** the green "Completed" chips, the amber "Locked" chips, the rose, violet and blue strand tiles, and indigo as an action color.
- **One marker set:** done is a blue circle with a check, current is an amber circle with its number, locked is a white circle with a lock (`TimelineItem`, `DiagnosticTest.tsx` line 265). Every part uses them, so a learner learns them once.
- **Small inconsistency:** a finished part says "Done" as bold text, while a finished strand row says "Done" with an outlined check icon. Same word, two looks.

### Continuity ✅
- **One path:** the parts run down one column with a thin line joining the markers (line 271). The line is deep blue after a finished part and gray after the rest, so the eye follows it from Part I to Part IV. In the screenshot, it runs blue through Parts I and II and turns gray after the open part.
- **One left edge:** the markers share one edge, and every title and card starts at the same 64px offset, so the column reads cleanly.
- **Better than before:** Part III no longer turns the column into three side-by-side cards. Its strands are rows in the same column.

### Figure-Ground ✅
- **Ground and figure:** the ground is warm paper. The open part is the only large white card, so it is the figure.
- **Navy for the sensor only:** the gradient banner is gone. Instrument navy appears once, on the Muse 2 card.
- **Flat:** no card has a shadow. The old `shadow-sm` is gone.
- **Readable text:** no `#9CA3AF`. Supporting text is `#4A4F5C`, and a locked button is a muted fill with readable text.

### Symmetry ✅
- **Deliberate asymmetry:** at 1280px the timeline takes the main column and the aside takes a fixed 22rem column (`DiagnosticTest.tsx` line 179). That is the dashboard split DESIGN.md sets, so the main task leads.
- **Equal where it should be:** the strand rows share the same columns for name, status and button, so they line up.
- **Not checked at 1024px.** The aside is written to drop under the timeline with its two cards side by side, but that wasn't seen in a browser.

### Connectedness ✅
- **The order is drawn:** the dependency between parts is now a line, not a chip. A finished stretch is joined in deep blue.
- **Ring:** it prints its number and its word ("2 of 4 parts done"), as DESIGN.md asks.
- **Status sits with its title:** "Done", "You are here" and the lock reason are directly under the part name, not in a chip at the edge. In each strand row, the status sits on the same line as its button.

### Common Region ✅
- **One card per topic:** the open part, the progress ring and the Muse 2 note each have one card.
- **No nesting:** the strand exams are a hairline-divided list inside the Part III card (`StrandTestCard` `variant="row"`, line 74). The three nested cards are gone, and so are the three stat tiles.
- **Compact rows have no region on purpose:** finished and locked parts are plain rows, so the one bounded card is the one that matters.

### Common Fate ✅ (from code)
- **Shared timing:** presses use 150ms and `cubic-bezier(0.23, 1, 0.32, 1)` on every button. The ring fill reveals once over 300ms on the same curve.
- **Reduced motion:** the fill, the press scale and the spinner are all behind `motion-safe` or `motion-reduce`. This is from the code. I did not check it in the browser.

## Principles it partly follows

### Proximity ⚠️
- **On the rhythm:** parts are 24px apart (`pb-6`), the marker is 24px from its text, and the title, description and status stack at 8px and 12px.
- **Below the card padding rule:** cards are padded 24px (`p-6`), not DESIGN.md's 32px. That was a deliberate trade to tighten the page, but it is off the written rule.
- **Off the scale:** the strand rows use 20px (`py-5`, `StrandTestCard.tsx` line 74).
- **Tight "Done":** in a finished row, "Done" sits directly under the part name with no gap, which reads as one unit but is the tightest spacing on the page.
- **Empty bands:** in the open card, the description wraps at about 34rem, so a band of empty paper sits to its right (visible in the screenshot). In each strand row there is a wide gap between the strand name and its status.

### Prägnanz (Simplicity) ⚠️
- **Better:** where the learner is shows once, as the markers plus the ring. The banner, the three stat tiles, the repeated lock reason and the three disabled buttons are gone.
- **Still two primary buttons:** in the screenshot, "Resume test" (Filipino) and "Attempt test" (Mathematics) are both deep blue in the same card. DESIGN.md says each card has at most one primary button. Both are real choices (either exam can be taken first), so this is a judgment call, not a bug.
- **Repeated words:** "Done" appears on Part I, Part II and the English row, and "Not yet" appears on both unfinished rows. These are short and consistent, but a learner reads them four times.
- **A note appears twice:** Part IV's name and the Muse 2 note both mention the recording.

### Focal Point ⚠️
- **Holds:** the open part is the only white card, its marker is the only amber on the page, and it holds the deep-blue buttons. The eye goes there.
- **Competes:** the navy Muse 2 card is still the highest-contrast block, as it was on the dashboard, and it holds a single note.
- **Two primary buttons** split the attention inside the open card.
- **Possible fixes:** lighten the Muse 2 card until it has real sensor data, and make only the first unfinished strand's button deep blue with the rest outlined.

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ⚠️ Partial | 28px and 20px spacing became 24px parts and 8 or 12px inside a part. Status now sits under its title. Still 24px card padding, not 32px. |
| Similarity | ❌ Breaks | ✅ Follows | Indigo on five jobs became deep blue for actions and indigo for strand codes only. Amber means "you are here", and green and the rainbow tiles are gone. |
| Continuity | ⚠️ Partial | ✅ Follows | A line now joins the parts, and Part III is rows in the same column, not three columns. |
| Figure-Ground | ❌ Breaks | ✅ Follows | The gradient banner and the card shadows are gone. The open part is the one white figure, and navy is for Muse 2. |
| Prägnanz | ❌ Breaks | ⚠️ Partial | Stat tiles, chips and the four-times lock reason became markers plus one ring. Two primary buttons remain in Part III. |
| Symmetry | ⚠️ Partial | ✅ Follows | One centered column of equal cards became the 2/3 + 1/3 dashboard split. |
| Connectedness | ❌ Breaks | ✅ Follows | The dependency between parts, once only chip text, is a line. The ring prints number and word. |
| Common Region | ❌ Breaks | ✅ Follows | Three nested strand cards became divided rows. The three stat tiles are gone. |
| Focal Point | ❌ Breaks | ⚠️ Partial | The banner no longer leads. The open part does, though the Muse 2 card and two primary buttons still compete. |
| Common Fate | ⚠️ Partial | ✅ Follows | Instant color changes became one 150ms curve with press feedback, and the fill is a one-time reveal with reduced-motion fallbacks (from code). |
| **Total** | **0 follow, 4 partial, 6 break** | **7 follow, 3 partial, 0 break** | |

| Other issue (from the before file) | Before | After |
|---|---|---|
| Learner text size | 12px on 8 lines, 14px for descriptions and buttons | 15px minimum (the strand code), labels 15 to 17px, sentences 18px |
| Gray body text | `text-gray-400` or `-500` on nine lines | Not used. Supporting text is `#4A4F5C` |
| Lock reason repeated | 4 times (header pill and three buttons), plus "Locked until Part I" | Once per locked part, as a row. Strand rows read it to screen readers only |
| Repeated test title in each strand card | Shown under the name, repeating the code above it | Removed from strand rows. Still shown in the post-test hub's cards, where the title says "Post-test" |
| Banner eyebrow at 12px, uppercase | "BASELINE ASSESSMENT · MUSE 2 BASELINE RECORDING" | Removed with the banner |
| Disabled button contrast | `gray-400` on `gray-100` | `#4A4F5C` on `#E1E2E7` |

## Remaining issues outside the Gestalt list

- **Two names for one test:** the API title is "Learner Readiness Index Assessment" (both screenshots), but the hub's empty state and the dashboard say "Readiness Inventory". One of them should change, and it's a data or copy decision.
- **The screenshot ends partway through Part IV,** so the locked row at the bottom is visible but its full spacing isn't.
- **1024px, phone width, the locked-only state and the all-done state** haven't been seen in a browser. Part IV expanded (the "Start Recording" state) hasn't either.
- **Finished Part III stays collapsed** unless a strand has "Show Score" available. That is by design, but it means a learner who finished all three exams sees one row and no per-strand statuses.
- **Post-test hub:** `PostTest.tsx` still sits in the old white section. It uses the restyled strand card, so it is a mix of old and new until it is rebuilt.
