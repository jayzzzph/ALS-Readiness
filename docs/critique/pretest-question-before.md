# Pre-test Question Screen: Gestalt Critique (Before)

- **Target:** `frontend/src/app/components/diagnostic/PretestAttempts.tsx` (325 lines). The main subject is the strand question screen in `StrandAttempt` (lines 136–233), rendered inside `AttemptShell` (lines 65–81). The LRI variant in `LriAttempt` (lines 237–325) is covered in its own section at the end.
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`), with the M02 P2 Question Screen mockup (`docs/mockups/M02 P2 Question Screen (1).jpg`) as the visual reference.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `9495d7a6` (file last changed in `48045ecd`).
- **Evidence:** the source code. No browser check was run for this review, and no answers were submitted. The author took screenshots of the whole pre-test flow afterwards (in `docs/critique/`, sizes in pixels):
  - `pretest-overview-before.png` (1902 × 836): the pre-test hub.
  - `pretest-intake-empty-before.png` (1897 × 836): Participant intake, empty.
  - `pretest-intake-filled-before.png` (1907 × 838): Participant intake, filled in.
  - `pretest-lri-before.png` (1896 × 836): the LRI table.
  - `pretest-lri-submitted-before.png` (918 × 347): the LRI after submitting.
  - `pretest-overview-after-lri-before.png` (1023 × 765): the hub after the LRI.
  - `pretest-start-modal-before.png` (1807 × 765): the test overview modal before Start.
  - `pretest-question-before.png` (1820 × 813): this screen, question 1 of 20 of the English diagnostic exam. It shows the issues described below: the faint Previous link, the indigo Next button and the disabled "Submit baseline responses" button on the first question.
- **Where it appears:** `/diagnostic-test` (`DiagnosticTest.tsx`, line 109) after the learner presses Start in the overview modal. The post-test reuses the same component (`learner/PostTest.tsx`, line 74). It renders full screen, outside `AppLayout`, so the sidebar isn't shown.
- **Scope:** this is a focused Gestalt review done by one reviewer. It isn't the full multi-reviewer `impeccable critique`. No code was changed.

> Like the Learner Dashboard before its rebuild, this screen still uses the **old** visual system: a cool gray ground, indigo `#3535C5` for every action and state, Tailwind grays, and a card with a shadow. DESIGN.md treats that system as legacy. Several of the "breaks" below come from that, and they go away once the screen is rebuilt to the focused test mode in DESIGN.md.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | The question and its options group well, but the progress bar sits equally far from its counter and from the question. |
| Similarity | ❌ Breaks | Indigo marks actions, selection, progress and time alike. Previous and Next don't look like a pair. |
| Continuity | ✅ Follows | One centered column reads top to bottom, from title to question, options and Next. |
| Figure-Ground | ❌ Breaks | Unselected options have a border too faint to see, on a cool gray ground instead of paper. |
| Prägnanz (Simplicity) | ⚠️ Partial | One question at a time, but a box inside a box and a greyed-out Submit button on every question. |
| Symmetry | ⚠️ Partial | The column and options are centered and full width, but Previous and Next are unequal and the last question leaves the right side empty. |
| Connectedness | ✅ Follows | The bar fill sits on its track and each option's letter and text share one bordered row. |
| Common Region | ⚠️ Partial | Notices get their own tinted regions, but the question is a bordered card nested inside another card. |
| Focal Point | ❌ Breaks | The test title is larger and bolder than the question, and the indigo countdown and Next button compete with it. |
| Common Fate | ⚠️ Partial | Selection and time-out states change together, but locked options look unchanged and the spinner ignores reduced motion. |

**Follows 2, partial 5, breaks 3.**

## Principles it follows

### Continuity ✅
- **Where it works:** the screen is a single centered column (`max-w-4xl`, line 68). It reads in one line: the back link, then the title, the "Question N of M" subtitle, the progress bar (line 209), the optional image, the question (line 213), the options (lines 214–220), Previous / Next (lines 222–225), and finally Submit (line 228). There are no side branches, and it's close to the M02 mockup's order.
- **What weakens it:** the column is 896px wide, wider than the 768px DESIGN.md sets for focused test mode, so the eye travels farther across each line. Next and Submit are both right-aligned but on separate rows (lines 224 and 100), so on the last question the path ends in a right-hand button that sits below an empty space where Next used to be.

### Connectedness ✅
- **Progress bar:** the indigo fill sits inside its gray track (line 209), so the bar reads as one measured thing.
- **Options:** each option is one bordered button holding a letter badge (A, B, C…) and the answer text (lines 216–217). The shared border joins them, and the selected state recolors the border, fill and text together.
- **Countdown:** the clock icon and the time are joined in one pill (lines 59–60).
- **Small gap:** DESIGN.md asks for a fill's label and value on the same row as its track. Here the "Question 4 of 20" counter is the card subtitle (line 199), 24px above the bar (`mt-6`, line 76), so the bar and its label are linked only by being near each other.

## Principles it partly follows

### Proximity ⚠️
- **Holds:** the question text sits 24px (`mb-6`) above the options, and the options are 12px apart (`space-y-3`), so the options read as one set that belongs to the question. The SubmitBar is separated by a top border and 20px of padding (line 98), so it reads as a different group from question navigation.
- **The bar floats between groups:** the progress bar has 24px above it (from its counter) and 24px below it (`mb-6`, to the question card). It's equally close to both, so it doesn't clearly belong to either. In the mockup, the counter sits about 8px above the bar, and the question card is much farther away.
- **Off the rhythm:** the shell pads by 24px (`p-6`, line 73) where DESIGN.md asks for 32px, and the header gap, image gap, nav gap and submit padding are 20px (`mb-5`, `mb-5`, `mt-5`, `pt-5`). Option gaps are 12px. Neither 20 nor 12 is on the 4 / 8 / 16 / 24 / 32 / 48 rhythm, so the steps between "inside a group" and "between groups" are too close to tell apart.
- **Title and subtitle are tight:** the title and subtitle are 4px apart (`mt-1`, line 75), which is fine, but the progress bar and the subtitle it describes are six times farther apart.

### Prägnanz (Simplicity) ⚠️
- **Holds:** the learner sees one question at a time, with one set of options and one Next button. That matches "Learner screens show one task at a time."
- **A box inside a box:** the question sits in a bordered, rounded `section` (line 210) inside the white shell card (line 73). That's two outlines around one question, and the learner has to read through both.
- **A disabled action on every question:** "Submit baseline responses" is visible from question 1 as a grey button (lines 98–101), until every question is answered. It's a second action the learner can't use yet, competing with Next.
- **Jargon:** "baseline responses" and "diagnostic exam" are research words. Plainer wording would be "Submit my answers" and the strand name.
- **The count appears twice:** "Question 4 of 20" and the bar both say the same thing. That's the same as the mockup and isn't a problem by itself, but together with the nested box and the disabled Submit, the screen has more parts than the task needs.

### Symmetry ⚠️
- **Holds:** the column is centered and every option is full width (`w-full`, line 216), so the option list reads as a stable stack.
- **Option heights vary:** options use `p-4` with no minimum height, so a one-line and a two-line answer give rows of different heights. DESIGN.md wants equal rows of about 76px.
- **Previous and Next aren't a pair:** Previous is plain grey text with no border or fill (line 223), and Next is a filled indigo button (line 224). In the mockup, Back (outlined) and Next (filled) are the same size and balance each other across the column.
- **The last question is lopsided:** Next is replaced by an empty `<span />` (line 224), so Previous sits alone on the left with nothing to balance it. Submit appears lower down on the right.

### Common Region ⚠️
- **Holds:** the time warning (amber, line 120), the time-up message (red, line 129), load errors (line 89) and submit errors (line 99) each get their own tinted region, close to what they refer to.
- **Breaks with nesting:** the question `section` (line 210, `border border-gray-100 rounded-2xl p-6`) is a card inside the shell card. DESIGN.md says "Cards never nest."
- **The header sits outside every region:** the back link and the countdown (lines 69–72) float on the gray ground above the card, with no header region. The mockup puts the wordmark, the test name and "Save & Exit" in a white header bar.

### Common Fate ⚠️
- **Holds:** selecting an option changes its border, fill and text color at the same moment with one `transition-colors` (line 216). At one minute left, the countdown turns amber at the same time the time-warning notice appears (lines 57, 226), and at zero, the badge turns red as the time-up notice appears. Those read as one event.
- **The lock is invisible:** at expiry the option buttons get `disabled` (line 216), but they have no `disabled:` styles, so they look exactly the same. The learner sees the red notice, but the options don't change with it, so the lock isn't seen as part of the same event.
- **Off-spec timing:** `transition-colors` uses Tailwind's default 150ms and `cubic-bezier(0.4, 0, 0.2, 1)`, not the shared `cubic-bezier(0.23, 1, 0.32, 1)`. The progress fill jumps with no transition at all, so it doesn't move with the question change.
- **No reduced-motion handling:** the loading spinner (`animate-spin`, line 84) has no `motion-reduce` guard.

## Principles it breaks

### Similarity ❌
- **One color, many jobs:** `#3535C5` indigo is used for the Next button (line 224), the Submit button (line 101), the selected option's border (line 216), the progress fill (line 209), the countdown pill text (line 57), the spinner (line 84) and the back link's hover (line 70). DESIGN.md's One Job Rule gives actions to deep blue `#00538A` and keeps strand indigo `#4D35BD` for the strand label and the diagnostic progress bar. Here, "press this", "you picked this", "how far along" and "how much time" all look alike.
- **The countdown looks like a chip:** the time is a fully rounded tinted pill (line 59), the same shape DESIGN.md reserves for readiness chips and measured progress.
- **Navigation buttons don't match:** Previous is a text link and Next is a filled button, so the two halves of one control look like two different kinds of thing.
- **The selected option uses the wrong tint:** it's indigo-50 with indigo-900 text (line 216), not Blue Wash with ink and a 2px deep-blue border.
- **Two visual languages in one file:** the strand screen (rounded, indigo, light borders) and the LRI screen (square, `#244477` navy header, black grid, native radios) look like two different products, even though they're two parts of the same pre-test. See the LRI section below.

### Figure-Ground ❌
- **The wrong ground:** the page is cool gray `#F0F4F8` (line 67), not warm paper `#F8F6F2`.
- **Options blend into the card:** unselected options have a `border-gray-200` (`#E5E7EB`) border on white (line 216), about 1.2:1. DESIGN.md asks for `field-stroke` (3.24:1) on answer options because they're UI parts that must meet 3:1. With a border this faint, the options barely separate from the card, which is a problem when they are the thing the learner has to act on.
- **The card edges are faint too:** the shell card and the nested section use `border-gray-100` (`#F3F4F6`), about 1.1:1 on white. The shell card relies on `shadow-sm` (line 73) to lift it off the ground, which the Flat Workbook Rule forbids.
- **Disabled controls fade too far:** disabled Previous is `text-gray-300` (line 223) and the disabled Submit is `text-gray-400` on `bg-gray-200` (line 101). Disabled controls are exempt from contrast rules, but here they almost disappear instead of reading as "not yet."

### Focal Point ❌
- **The title outranks the question:** the title (for example "LS1 diagnostic exam") is `text-xl font-bold` (20px, line 74). The question is `text-lg font-medium` (18px, line 213). The thing the learner has to read and answer is smaller than the label above it. DESIGN.md sets the question stem as a Headline (2rem DM Serif Display) and makes it the focal point, as in the mockup.
- **Too many saturated elements:** the indigo countdown pill at the top right, the indigo progress fill, the filled indigo Next button and the selected option all use the same strong color, so none of them leads.
- **What should lead:** the question first, then the options, then Next. The timer should be visible but quiet until the warning point.

## The LRI variant (`LriAttempt`, lines 237–325)

The Learner Readiness Inventory renders in the same shell but as a different design. It fails several principles harder than the strand screen.

- **Figure-Ground and Focal Point:** every cell has a `border-slate-800` border (lines 297–310), so a heavy black grid is the strongest figure on the page, ahead of the statements. The header row is `#244477` (line 299), a navy-blue that isn't in the palette and borrows Instrument Navy's "sensor" job.
- **Prägnanz:** all statements are on one page as a matrix, against "one task at a time." Learners also have no count or progress bar to show how many they've answered.
- **Similarity:** answers are native 16px radios (`h-4 w-4`, line 311) with `accent-[#244477]`, not the answer-option rows used everywhere else. Small targets also hurt learners with lower motor precision.
- **Proximity:** the Likert labels are only in the header, so on a long list a learner far down the page has to look back up to remember which column means what.
- **Overflow:** the table has `min-w-[700px]` (line 298), which is fine at 1280px but will scroll inside the card at narrower widths.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same learner.

- **Wrong labels on the post-test:** the Submit button always says "Submit baseline responses" (line 101), and the success screen's button always says "Back to pre-test" (line 113, which ignores the `backLabel` prop). Both appear on the post-test, which reuses `StrandAttempt`.
- **Text too small:** the subtitle, buttons and error text are `text-sm` (14px). The letter badges and countdown are `text-xs` (12px). Answer text is the browser default 16px in DM Sans/system font. DESIGN.md sets learner labels at 15px minimum and learner sentences, including answer options, at 18px in Atkinson Hyperlegible.
- **Small targets:** Previous and Next are `px-4 py-2` (about 36px tall), and options are about 56px tall. DESIGN.md asks for 48px buttons and about 76px options.
- **No visible focus style:** none of the buttons in this file set a focus ring, so they rely on the browser default. DESIGN.md asks for a 2px deep-blue outline with a 2px offset on every interactive element.
- **No arrow-key movement:** options are separate `aria-pressed` toggle buttons, not a radio group, so arrow keys don't move between them as DESIGN.md's Answer Option spec says. A screen reader also hears a list of toggles instead of "one of four."
- **The exit link doesn't say progress is saved:** "Back to pre-test" (line 70) leaves the test while the draft and timer keep going in local storage. The mockup's "Save & Exit" says what happens.
- **Generic image alt text:** every question image is described as "Illustration for this question" (line 212), which tells a screen-reader user nothing.

## What a rebuild would need

This is a direction to follow when the screen is rebuilt, not a spec. It isn't implemented.

1. **Focused test mode shell:** a white header with the ALSense wordmark, the test name and "Save & Exit", then one centered 768px column on paper with no shadow.
2. **The question leads:** a strand overline in strand indigo, then "Question 4 of 20" about 8px above the indigo progress bar, then the question as a Headline in DM Serif Display (Body Learner at 1.5rem when it's longer than about 25 words). The test title moves to the header.
3. **One card:** the question and its options go in a single white card with 32px padding and a hairline border. Remove the nested section.
4. **Answer Option rows:** full-width rows about 76px tall in Body Learner, with a `field-stroke` border, a radio on the right, Blue Wash plus a 2px deep-blue border when selected, a visibly locked state at time-up, and arrow-key movement as a radio group.
5. **Matching navigation:** Back as a secondary outlined button and Next as a primary deep-blue button, both 48px. On the last question, Next becomes "Submit my answers" in the same spot. Remove the always-visible disabled Submit.
6. **Quiet timer:** the countdown as plain muted text with an icon in the header, turning amber ink and then error colors only at the warning point. Don't use a chip shape.
7. **LRI:** use the same option rows, one statement (or a small group) at a time with a counter, and hairline rules instead of the black grid.
8. **Motion:** state changes at 150–200ms on `cubic-bezier(0.23, 1, 0.32, 1)`, the progress fill moving with the question change, and a reduced-motion fallback for the spinner.
