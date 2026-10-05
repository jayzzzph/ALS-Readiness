# Pre-test Question Screen: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/diagnostic/PretestAttempts.tsx` (539 lines), the rebuilt strand question screen in `StrandAttempt` (lines 288–441) inside the rebuilt `AttemptShell` (lines 104–132). The code was reviewed at commit `d9972c95`, after the rebuild (`10ac3cf8`), the image and exit-hint fixes (`074e794a`), and the header and progress-bar fixes (`d9972c95`).
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`) and the M02 P2 Question Screen mockup. The same method as `pretest-question-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence:** the source code, plus the author's browser screenshots in `docs/critique/` (sizes in pixels). No browser check was run for this review, and no answers were submitted.
  - `pretest-question-after.png` (1567 × 866): question 2 of 20 of the English diagnostic exam, with a passage image, the first option selected, "7 of 20 answered" and 13:03 left. **It was taken before `d9972c95`.** So it still shows the old header (items pinned to the top edge, the exit hint stacked under "Save & Exit") and a progress bar that follows the question position (about 10% filled while 7 of 20 are answered). Both are described below as they are in the code now, not as in this image. The page was zoomed out: the 768px column measures about 640px, so everything appears at about 83% of its CSS size (the 18px answer text shows as about 15px).
  - `pretest-question-image-dialog-after.png`: **not in the repository** when this file was written, so the image dialog is reviewed from the code only.
- **Scope:** this is a focused Gestalt review done by one reviewer, the same as the before file. The design skill's automated check (`impeccable detect`) found nothing on the file. The LRI table and the overview modal before Start were left unchanged on purpose and aren't scored here.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ✅ Follows | The counter, bar and its label form one group 48px above the question card, and each hint sits next to what it explains. |
| Similarity | ⚠️ Partial | Blue means act, indigo means strand and progress, and Back and Next are a matched pair. The amber time warning borrows amber's "here / readiness" job. |
| Continuity | ✅ Follows | One 768px column from the strand label down to Back and Next, with one left edge inside the card. |
| Figure-Ground | ✅ Follows | Paper ground, one flat white card, and answer rows with a 3.24:1 border. |
| Prägnanz (Simplicity) | ✅ Follows | One question, one primary action, and no disabled Submit button waiting on every question. |
| Symmetry | ⚠️ Partial | The header and the Back/Next pair are balanced, but "Submit my answers" is wider than Back, and a disabled Back on question 1 is lighter than Next. |
| Connectedness | ✅ Follows | The bar and "N of 20 answered" share one row, each radio sits inside its row, and the picture and its "see larger" line are one control. |
| Common Region | ✅ Follows | A white header region, one card per question with no nesting, and tinted regions for notices and errors. |
| Focal Point | ✅ Follows | The question is the largest type on the screen, and the timer stays quiet until the last minute. |
| Common Fate | ✅ Follows | Selection, the progress fill and the question change share 150–200ms on one curve, and nothing moves under reduced motion. |

**Follows 8, partial 2, breaks 0.** The before version followed 2, partly followed 5 and broke 3.

## Principles it follows

### Proximity ✅
- **The progress group is tight:** the strand label, "Question 2 of 20" (8px below it) and the bar row (8px below that) read as one group. The question card sits 48px below the bar (`mt-12`, line 396), so the bar no longer floats halfway between its counter and the question, as it did before.
- **The bar's label is on its row:** "7 of 20 answered" sits at the end of the bar (line 392), not on a separate line above it.
- **Hints sit next to what they explain:** "See the picture larger" is 8px under the picture. On the last question, the "N questions still need an answer" line sits 24px above the Submit button it explains (line 421). In the header, "Your answers are saved. The timer keeps running." sits right before "Save & Exit" (line 118).
- **On the rhythm:** the card pads 32px (24px on narrow screens), the stem has 32px above the options, the nav row has 32px above it, and sections are 48px apart.
- **Off the rhythm, still:** the options are 12px apart (`space-y-3`, line 400). That gap is small enough to read as "inside a group", but it isn't one of the 4 / 8 / 16 / 24 steps.

### Continuity ✅
- **One column:** the screen is one centered 768px column (`max-w-3xl`, line 128), down from 896px. It reads in a straight line: strand label, question counter, bar, card (picture, question, options), notices, then Back and Next.
- **One left edge in the card:** the picture, the "see larger" line, the stem and the options all start at the card's padding. The stem is left-aligned on purpose, unlike the mockup's centered stem, so long questions and passages keep a straight reading edge.
- **The path ends where it should:** on the last question, Submit takes Next's place in the same spot, so the path still ends at the bottom-right action. Before, it ended at a separate Submit row under an empty space.

### Figure-Ground ✅
- **Ground and figure:** the ground is warm paper `#F8F6F2`. The question is one white card with a 1px hairline and no shadow (the Flat Workbook Rule). The header is white with a hairline bottom edge.
- **Options are visible figures:** unselected rows use the `field-stroke` border `#8A8F9C` (3.24:1 on white), up from about 1.2:1. A selected row gets Blue Wash, a 2px deep-blue edge and a filled radio, as in the Answer Option spec. In the screenshot, the selected row is clearly the strongest row.
- **The picture dialog is the only floating layer:** it gets the one soft shadow DESIGN.md allows for floating things, over a dim ink overlay (line 255).
- **Disabled controls still read as "not yet":** the disabled Submit is muted ink on the track gray, and the disabled Back is placeholder ink with a hairline. Neither fades away.

### Prägnanz (Simplicity) ✅
- **One task:** one question, one set of options, one primary button.
- **No waiting Submit button:** the disabled "Submit baseline responses" that showed on every question is gone. Submit appears only on the last question, or anywhere after time runs out, which is where a failed auto-submit is retried.
- **No box inside a box:** the nested question `section` is gone.
- **Plain words:** "Submit my answers", "Save & Exit", "13:03 left", "7 of 20 answered". "Baseline responses" is gone. The strand label still uses the code ("LS1-EN: ENGLISH"), see the remaining issues.
- **Two numbers, two meanings:** "Question 2 of 20" is the position, and the bar with "7 of 20 answered" is the progress. Each number now has one display. In the screenshot, which predates `d9972c95`, the bar showed the position while its neighbor said "7 of 20 answered", which read as a contradiction. That's fixed in the code.

### Connectedness ✅
- **Bar and value:** the fill sits on its track, with its value on the same row (lines 389–392), as DESIGN.md asks. Its screen-reader label is the same visible text (`aria-labelledby`).
- **Answer rows:** the text, the radio circle and the row's border are one clickable label around a native radio (line 210). Selection recolors all three at once.
- **Picture and its action:** the picture and "See the picture larger" are one button, so the line clearly belongs to that picture.
- **Header:** a hairline divider separates the timer from the exit hint, so the hint reads as part of "Save & Exit", not as a caption for the time.

### Common Region ✅
- **A header region:** the wordmark, stage, timer and "Save & Exit" now sit in one white header bar, instead of floating on the ground above the card.
- **One card per question:** the picture, the stem and the options share one card. Cards don't nest. The picture's 1px hairline frames the image itself, not a second region.
- **Notices get their own regions:** the time warning (Amber Wash), time-up and submit errors (error tint with an error-stroke border and an icon) each sit just below the card, where they apply.

### Focal Point ✅
- **The question leads:** the stem is a DM Serif Display headline at 32px (40px when it's 10 words or fewer), and the largest type on the screen. The stage name in the header is 15px. Long stems (over 25 words) switch to 24px Atkinson so they stay readable.
- **One saturated action:** Next (or Submit) is the only filled deep-blue control. The selected answer is a pale wash, and the indigo bar is thin.
- **The timer is quiet:** "13:03 left" is muted text with an icon, not a colored pill. It turns amber ink in the last minute and error ink at zero.
- **Picture questions:** a passage picture comes before the stem, at full card width. It's larger than the stem, but it's grey text in an image, so the bold serif question still stands out, as the screenshot shows. This is also the right reading order: passage first, then question.

### Common Fate ✅
- **One timing:** every state change uses `cubic-bezier(0.23, 1, 0.32, 1)` (line 52). Presses and selection take 150ms, and the progress fill, the question change and the dialog take 200ms.
- **Things that change together move together:** picking an answer recolors the row, fills the radio dot and slides the bar forward at the same moment, because the bar now counts answers. At the warning point, the timer turns amber as the warning notice appears. At zero, the timer, the notice and the locked rows all change at once. Locked rows turn gray (line 213), which the before version didn't show.
- **The question change reads as one event:** a new question fades in with a 4px rise, and keyboard focus moves to its heading (line 333).
- **Reduced motion:** under `prefers-reduced-motion`, presses don't scale, the radio dot only fades, the bar jumps instead of sliding, the question and dialog only fade, and spinners stop. This is in the code but wasn't checked in a browser for this review.

## Principles it partly follows

### Similarity ⚠️
- **Holds:**
  - Deep blue is used only for actions and the selected answer: Next, Submit, Back's outline, the "see larger" line, focus rings, and the selected row's wash and edge.
  - Strand indigo is used only for the strand label and the progress bar, as DESIGN.md assigns.
  - Back and Next are the same height and minimum width, outlined and filled, so they read as one pair. Before, they looked like a link and a button.
  - Every answer row looks the same.
  - The header's "Save & Exit" and the dialog's "Close" share one style.
- **Amber borrows a job:** the last-minute warning uses Amber Wash and amber ink. DESIGN.md gives amber to "you are here / readiness", not to warnings. It's readable and calm, but it means amber can mean "you are here" on the dashboard and "hurry" on this screen.
- **Possible fix:** give the time warning its own treatment, for example ink text with a clock icon and no fill. Or extend DESIGN.md to name amber as the "attention" color if that's the intent.

### Symmetry ⚠️
- **Holds:**
  - The column is centered, and every answer row is the same width and at least 76px tall.
  - The header is one 64px row with everything vertically centered (line 109). The brand sits on the left and the timer, hint and exit sit on the right. The old header, where the stacked hint pushed the right side taller, is gone.
  - Back and Next share a 160px minimum width. The screenshot shows them the same size on opposite sides.
- **Uneven on the last question:** "Submit my answers" is wider than Back, so the pair no longer mirrors.
- **Uneven on question 1:** Back is disabled and drawn in hairline and placeholder ink, so the left side is visibly lighter than the filled Next.
- **Narrow screens:** below 1024px, the exit hint moves to a second line under the header row, which makes the header taller on one side.
- **Possible fixes:** give Back and the primary button one shared width (for example 200px), and keep the disabled Back's outline at the field-stroke color.

## Remaining issues outside the Gestalt list

- **Strand label wording:** the label reads "LS1-EN: ENGLISH". The strand code is accurate but technical. "English" alone, or the strand's full name, would be plainer.
- **The overview modal is unchanged:** the "Start" dialog before the first question still uses the old indigo, 14px text and "diagnostic exam" wording, so the first thing a learner sees doesn't match the screen that follows.
- **The LRI is unchanged:** it sits in the new header and card, but the table itself still has the black grid, the navy header and 16px radios.
- **Generic picture text:** images are described as "Picture for question N", because the test data has no description to use.
- **Timing is still client-side:** the timer and auto-submit run in the browser (unchanged, by decision).
- **Screenshots:** the after screenshot predates the header and progress-bar fix, and the image-dialog screenshot is missing. Both are worth retaking.

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ✅ Follows | The bar now sits 8px under its counter, with its value on its row, and 48px above the question. Spacing moved to the 8/24/32/48 rhythm, except the 12px option gap. |
| Similarity | ❌ Breaks | ⚠️ Partial | One indigo for everything became blue = act and indigo = strand/progress. Back and Next became a matched pair, and the countdown is no longer a chip. The amber time warning still borrows amber's job. |
| Continuity | ✅ Follows | ✅ Follows | The column narrowed from 896px to 768px, and Submit now ends the path in Next's spot. |
| Figure-Ground | ❌ Breaks | ✅ Follows | Gray ground became paper, the shadowed card became a flat hairline card, and the option border went from 1.2:1 to 3.24:1. |
| Prägnanz | ⚠️ Partial | ✅ Follows | The nested box, the always-visible disabled Submit and "baseline responses" are gone. Position and answered progress each have one display. |
| Symmetry | ⚠️ Partial | ⚠️ Partial | Equal 76px rows, a matched Back/Next pair and a centered one-row header. The last-question Submit and the disabled Back on question 1 still unbalance the pair. |
| Connectedness | ✅ Follows | ✅ Follows | The bar's label moved onto its row, the radio sits inside the row, and the picture and its "see larger" line became one control. |
| Common Region | ⚠️ Partial | ✅ Follows | The nested card is gone, and the header got its own white region. |
| Focal Point | ❌ Breaks | ✅ Follows | The 18px question under a 20px title became a 32–40px serif headline, and the timer went quiet. |
| Common Fate | ⚠️ Partial | ✅ Follows | One curve at 150–200ms. Selection and the bar move together, locked rows visibly change at time-up, and there's reduced-motion support. |
| **Total** | **2 follow, 5 partial, 3 break** | **8 follow, 2 partial, 0 break** | |

| Other issue (from the before file) | Before | After |
|---|---|---|
| Post-test labels | "Submit baseline responses" and "Back to pre-test" also shown on the post-test | "Submit my answers", and the success button follows the stage ("Back to post-test"). The header says "Post-test" |
| Text size | 14px subtitle and buttons, 12px badges and countdown, 16px answers in the system font | 15px minimum for labels and buttons, 18px answers in Atkinson Hyperlegible, a 32–40px question |
| Target size | About 36px Previous/Next and about 56px options | 48px Back/Next, 44px "Save & Exit", options at least 76px |
| Focus style | Browser default | A 2px deep-blue outline with a 2px offset on every control, including answer rows |
| Arrow keys | Separate toggle buttons | Native radios in a radio group: arrow keys move between options, and screen readers hear "1 of 4" |
| Exit wording | "Back to pre-test", with no word on the timer | "Save & Exit", plus "Your answers are saved. The timer keeps running." |
| Picture size | Capped at 288px tall | Full card width, and opens larger in a dialog (click, Enter or Space; Escape closes it) |
| Picture text | "Illustration for this question" | "Picture for question N" (still generic, as the data has no descriptions) |
| Spinner | Always spins | Stops under reduced motion |
