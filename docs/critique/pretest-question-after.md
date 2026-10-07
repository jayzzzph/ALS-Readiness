# Pre-test Question Screen: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/diagnostic/PretestAttempts.tsx` (556 lines), the rebuilt strand question screen in `StrandAttempt` inside the rebuilt `AttemptShell` (with its sticky footer). The code was reviewed at commit `b8d355f4`, after the rebuild (`10ac3cf8`), the image and exit-hint fixes (`074e794a`), the header and progress-bar fixes (`d9972c95`), the picture-dialog sizing and error-red timer warning (`455e98e6`), the red countdown at 10 minutes (`6f7b4535`), the notices above the card and the time's-up message (`02952bd0`), and the sticky Back/Next bar (`1388336e`).
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`) and the M02 P2 Question Screen mockup. The same method as `pretest-question-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence:** the source code, plus the author's browser screenshots in `docs/critique/` (sizes in pixels, read with Pillow). No browser check was run for this review, and no answers were submitted. The three screenshots are real PNGs. The first two were WebP data saved under a `.png` name, and were converted to PNG without changing the pixels.
  - `pretest-question-after.png` (1597 × 877, PNG): question 1 of 20 of the Filipino diagnostic exam, retaken after the latest fixes. The first option is unselected, the third is selected, and the header reads "1 of 20 answered" and 23:53 left, so the timer is still muted gray (the red starts at 10 minutes). It shows the single-row header, the bar that follows the answered count, a long unillustrated stem, and the sticky Back/Next bar (`1388336e`): the page is scrolled to the top and the card runs past the bottom, yet Back and Next are pinned in a white bar with a hairline top edge, cutting across the third option. It shows no notice, since 23:53 is outside both the warning and the red range. Below the bar there is a white strip that belongs to the capture, not to the page.
  - `pretest-question-image-dialog-after.png` (1565 × 882): the question 2 passage opened in the picture dialog, titled "Picture for question 2" with "Close" at the top right. It predates `455e98e6`, so the dialog still fills the screen and the passage covers only the top fifth. In the current code the dialog is sized to the picture. Behind the overlay, the header shows the single row with the inline hint.
  - `pretest-question-timeout-submitted-after.png` (1202 × 526): the success screen after the attempt was auto-submitted when the timer reached 0:00. It predates the time's-up message (`02952bd0`), so it still shows "Your responses have been submitted. Thank you for completing this." The code now shows "Time's up. Your answers were submitted. You answered N of 20 questions." The author tested auto-submit at 0:00 and it worked.
- **Scope:** this is a focused Gestalt review done by one reviewer, the same as the before file. The design skill's automated check (`impeccable detect`) found nothing on the file. The LRI table and the overview modal before Start were left unchanged on purpose and aren't scored here.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ✅ Follows | The counter, bar and its label form one group 48px above the question card, and each hint sits next to what it explains. |
| Similarity | ✅ Follows | Blue means act, indigo means strand and progress, red means time or a problem, and Back and Next are a matched pair. Amber is no longer used for the timer. |
| Continuity | ✅ Follows | One 768px column from the strand label down to Back and Next, with one left edge inside the card. |
| Figure-Ground | ✅ Follows | Paper ground, one flat white card, and answer rows with a 3.24:1 border. |
| Prägnanz (Simplicity) | ✅ Follows | One question, one primary action, no disabled Submit button waiting on every question, and one clear message when time runs out. |
| Symmetry | ⚠️ Partial | The header and the Back/Next pair are balanced, but "Submit my answers" is wider than Back, and a disabled Back on question 1 is lighter than Next. The sticky bar keeps the pair in one place. |
| Connectedness | ✅ Follows | The bar and "N of 20 answered" share one row, each radio sits inside its row, and the picture and its "see larger" line are one control. |
| Common Region | ✅ Follows | A white header region, one card per question with no nesting, a white footer bar for Back and Next, and tinted regions for notices and errors. |
| Focal Point | ✅ Follows | The question is the largest type on the screen, and the timer stays quiet until 10 minutes are left. |
| Common Fate | ✅ Follows | Selection, the progress fill and the question change share 150–200ms on one curve, and nothing moves under reduced motion. |

**Follows 9, partial 1, breaks 0.** The before version followed 2, partly followed 5 and broke 3.

## Principles it follows

### Proximity ✅
- **The progress group is tight:** the strand label, "Question 2 of 20" (8px below it) and the bar row (8px below that) read as one group. The question card sits 48px below the bar (`mt-12`, line 396), so the bar no longer floats halfway between its counter and the question, as it did before.
- **The bar's label is on its row:** "7 of 20 answered" sits at the end of the bar (line 392), not on a separate line above it.
- **Hints sit next to what they explain:** "See the picture larger" is 8px under the picture. On the last question, the "N questions still need an answer" line sits 24px under the card, with a "Go to question N" link in the same sentence. Submit is now in the footer bar, so the line no longer sits directly above it. In the header, "Your answers are saved. The timer keeps running." sits right before "Save & Exit" (line 118).
- **Notices sit with the progress group:** the time warning, the time's-up notice and submit errors sit 24px under the bar and 48px above the card, so they read as part of the status area above the question, not as something under the options.
- **On the rhythm:** the card pads 32px (24px on narrow screens), the stem has 32px above the options, and sections are 48px apart. Back and Next sit in a footer bar with 12px of padding above and below.
- **Off the rhythm, still:** the options are 12px apart (`space-y-3`, line 400). That gap is small enough to read as "inside a group", but it isn't one of the 4 / 8 / 16 / 24 steps.

### Continuity ✅
- **One column:** the screen is one centered 768px column (`max-w-3xl`), down from 896px. It reads in a straight line: strand label, question counter, bar, notices, card (picture, question, options), then Back and Next.
- **The footer follows the column:** the sticky Back/Next bar spans the window, but its buttons sit inside the same 768px column, so they line up with the card's edges.
- **One left edge in the card:** the picture, the "see larger" line, the stem and the options all start at the card's padding. The stem is left-aligned on purpose, unlike the mockup's centered stem, so long questions and passages keep a straight reading edge.
- **The path ends where it should:** on the last question, Submit takes Next's place in the same spot, so the path still ends at the bottom-right action. Because the bar is pinned to the bottom of the window, that spot no longer moves with the question's length or with the notices above the card.

### Figure-Ground ✅
- **Ground and figure:** the ground is warm paper `#F8F6F2`. The question is one white card with a 1px hairline and no shadow (the Flat Workbook Rule). The header is white with a hairline bottom edge.
- **Options are visible figures:** unselected rows use the `field-stroke` border `#8A8F9C` (3.24:1 on white), up from about 1.2:1. A selected row gets Blue Wash, a 2px deep-blue edge and a filled radio, as in the Answer Option spec. In the screenshot, the selected row is clearly the strongest row.
- **The picture dialog is the only floating layer:** it gets the one soft shadow DESIGN.md allows for floating things, over a dim ink overlay (line 255). In the dialog screenshot, the white panel and the passage stand clearly in front of the dimmed test.
- **Disabled controls still read as "not yet":** the disabled Submit is muted ink on the track gray, and the disabled Back is placeholder ink with a hairline. Neither fades away.

### Prägnanz (Simplicity) ✅
- **One task:** one question, one set of options, one primary button.
- **No waiting Submit button:** the disabled "Submit baseline responses" that showed on every question is gone. Submit appears only on the last question, or anywhere after time runs out, which is where a failed auto-submit is retried.
- **No box inside a box:** the nested question `section` is gone.
- **One message at time-up:** the notice says "Time's up. Your answers are locked and are being submitted as they are. Unanswered questions count as incorrect." After the auto-submit, the success screen says "Time's up. Your answers were submitted. You answered N of 20 questions." instead of the generic "Thank you for completing this.", so a learner who ran out of time isn't left wondering why some answers are missing.
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
- **A footer region:** Back and Next sit in a white bar with a hairline top edge, pinned to the bottom of the window while the card is taller than the screen. At the end of a long page it rests under the page padding, so it never covers the last answer. The bar is a second white region next to the header, which frames the question card between them.
- **Notices get their own regions:** the time warning, the time's-up notice and submit errors share one look: error tint (`#FDECEA`), an error-red border and an icon. They sit above the card, under the progress bar, so they never push Back and Next out of view.

### Focal Point ✅
- **The question leads:** the stem is a DM Serif Display headline at 32px (40px when it's 10 words or fewer), and the largest type on the screen. The stage name in the header is 15px. Long stems (over 25 words) switch to 24px Atkinson so they stay readable.
- **One saturated action:** Next (or Submit) is the only filled deep-blue control. The selected answer is a pale wash, and the indigo bar is thin.
- **The timer is quiet, then loud:** "13:03 left" is muted text with an icon, not a colored pill. At 10 minutes left it turns bold error red (`#B42318`), and at zero it reads "Time's up" in darker error ink (`#7A1A12`). The red is plain text, so it draws the eye without competing with the question headline. At 1 minute left, a notice appears above the card: "Less than a minute left. When time runs out, your answers will be submitted automatically as they are."
- **Picture questions:** a passage picture comes before the stem, at full card width. It's larger than the stem, but it's grey text in an image, so the bold serif question still stands out, as the screenshot shows. This is also the right reading order: passage first, then question.

### Common Fate ✅
- **One timing:** every state change uses `cubic-bezier(0.23, 1, 0.32, 1)` (line 52). Presses and selection take 150ms, and the progress fill, the question change and the dialog take 200ms.
- **Things that change together move together:** picking an answer recolors the row, fills the radio dot and slides the bar forward at the same moment, because the bar now counts answers. The timer turns red at 10 minutes with a 200ms color transition. At 1 minute, the warning notice appears above the card. At zero, the timer, the notice and the locked rows all change at once. Locked rows turn gray (line 213), which the before version didn't show.
- **The question change reads as one event:** a new question fades in with a 4px rise, and keyboard focus moves to its heading (line 333).
- **Reduced motion:** under `prefers-reduced-motion`, presses don't scale, the radio dot only fades, the bar jumps instead of sliding, the question and dialog only fade, and spinners stop. This is in the code but wasn't checked in a browser for this review.

## Principles it partly follows

### Similarity ✅
- **Blue means act:** deep blue is used only for actions and the selected answer: Next, Submit, Back's outline, the "see larger" line, focus rings, and the selected row's wash and edge.
- **Indigo means strand and progress:** it is used only for the strand label and the progress bar, as DESIGN.md assigns.
- **Red means time or a problem:** the countdown from 10 minutes, the warning and time's-up notices, and submit errors all use the same error red, so one color carries one idea. The amber warning that borrowed amber's "you are here / readiness" job is gone (`455e98e6`), which resolves the partial score before.
- **Pairs match:** Back and Next are the same height and minimum width, outlined and filled, so they read as one pair. Every answer row looks the same. The header's "Save & Exit" and the dialog's "Close" share one style.
- **Watch point:** red at 10 minutes of a 30-minute test is early for an error color, and the warning at 1 minute uses the same red, so the two stages differ by the notice rather than by color. That is a judgment call, not a break.

### Symmetry ⚠️
- **Holds:**
  - The column is centered, and every answer row is the same width and at least 76px tall.
  - The header is one 64px row with everything vertically centered (line 109). The brand sits on the left and the timer, hint and exit sit on the right. The old header, where the stacked hint pushed the right side taller, is gone.
  - Back and Next share a 160px minimum width. The screenshot shows them the same size on opposite sides.
- **Uneven on the last question:** "Submit my answers" is wider than Back, so the pair no longer mirrors.
- **Uneven on question 1:** Back is disabled and drawn in hairline and placeholder ink, so the left side is visibly lighter than the filled Next.
- **Sticky bar:** the pair keeps its positions in the pinned bar on every question, so the unevenness above is the only imbalance.
- **Narrow screens:** below 1024px, the exit hint moves to a second line under the header row, which makes the header taller on one side.
- **Possible fixes:** give Back and the primary button one shared width (for example 200px), and keep the disabled Back's outline at the field-stroke color.

## Remaining issues outside the Gestalt list

- **Strand label wording:** the label reads "LS1-EN: ENGLISH". The strand code is accurate but technical. "English" alone, or the strand's full name, would be plainer.
- **The overview modal is unchanged:** the "Start" dialog before the first question still uses the old indigo, 14px text and "diagnostic exam" wording, so the first thing a learner sees doesn't match the screen that follows.
- **The LRI is unchanged:** it sits in the new header and card, but the table itself still has the black grid, the navy header and 16px radios.
- **Generic picture text:** images are described as "Picture for question N", because the test data has no description to use.
- **Timing is still client-side:** the timer and auto-submit run in the browser (unchanged, by decision).
- **The picture dialog:** it used to fill the screen even for a short passage. Since `455e98e6` it is sized to the picture, up to the screen, so short passages fit and tall ones scroll. `pretest-question-image-dialog-after.png` still shows the old full-screen dialog.
- **Screenshots:** `pretest-question-after.png` was retaken and shows the sticky bar. The red timer and the 1-minute notice aren't in a screenshot: they're verified from the code and the author's earlier test. The dialog screenshot (picture-sized dialog) and the success screenshot (new time's-up message) still predate their changes. Only their file formats were fixed.

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ✅ Follows | The bar now sits 8px under its counter, with its value on its row, and 48px above the question. Spacing moved to the 8/24/32/48 rhythm, except the 12px option gap. |
| Similarity | ❌ Breaks | ✅ Follows | One indigo for everything became blue = act, indigo = strand/progress and red = time or a problem. Back and Next became a matched pair, the countdown is no longer a chip, and the time warning no longer borrows amber. |
| Continuity | ✅ Follows | ✅ Follows | The column narrowed from 896px to 768px, and Submit now ends the path in Next's spot, in a bar pinned to the bottom of the window. |
| Figure-Ground | ❌ Breaks | ✅ Follows | Gray ground became paper, the shadowed card became a flat hairline card, and the option border went from 1.2:1 to 3.24:1. |
| Prägnanz | ⚠️ Partial | ✅ Follows | The nested box, the always-visible disabled Submit and "baseline responses" are gone. Position and answered progress each have one display. |
| Symmetry | ⚠️ Partial | ⚠️ Partial | Equal 76px rows, a matched Back/Next pair and a centered one-row header. The last-question Submit and the disabled Back on question 1 still unbalance the pair. |
| Connectedness | ✅ Follows | ✅ Follows | The bar's label moved onto its row, the radio sits inside the row, and the picture and its "see larger" line became one control. |
| Common Region | ⚠️ Partial | ✅ Follows | The nested card is gone, and the header and the Back/Next footer each got a white region. Notices sit above the card. |
| Focal Point | ❌ Breaks | ✅ Follows | The 18px question under a 20px title became a 32–40px serif headline, and the timer went quiet until 10 minutes are left. |
| Common Fate | ⚠️ Partial | ✅ Follows | One curve at 150–200ms. Selection and the bar move together, locked rows visibly change at time-up, and there's reduced-motion support. |
| **Total** | **2 follow, 5 partial, 3 break** | **9 follow, 1 partial, 0 break** | |

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
| Time warnings | Not covered | Red countdown at 10 minutes, a notice above the card at 1 minute, a locked "Time's up" notice at zero, and a success message that says how many questions were answered |
| Back/Next position | Moved with the page | Pinned in a sticky footer bar |
