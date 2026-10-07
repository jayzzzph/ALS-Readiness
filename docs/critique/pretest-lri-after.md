# LRI Table: Gestalt Critique (After)

- **Target:** the Learner Readiness Inventory in `frontend/src/app/components/diagnostic/PretestAttempts.tsx`, `LriAttempt`, with its table rebuilt (commits `74e80d19` and `904b840e`). The table is lines 540 to 569 and the progress bar is lines 532 to 537.
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `pretest-lri-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence:** the source code and the screenshot `pretest-lri-after.png` (1867 × 877): the top of the table with 4 of 10 statements answered. I read the code and the image. I did not render the page myself or measure it, so no pixel measurements are given. The design skill's automated check (`impeccable detect`) found nothing in the file.
- **The screenshot is a different state from the before.** The before image is a fresh table with nothing answered, in the oldest page frame. The after image has four statements answered and shows the current frame (the white header with "Save & Exit"). The statements are also in a different order, because the order is shuffled per learner. So the two images compare the design, not the same data. The screenshot ends partway through row 9, so the lower rows and the submit button are not in it.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. Not checked in a browser: the sticky header while scrolling (lines 543 and 544, from code only), 1024px width, the time-up state, and reduced motion.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ✅ Follows | A statement and its four answers share a padded row, and answered rows are tinted across it. |
| Similarity | ✅ Follows | Custom radios, blue wash, Atkinson 18px and the primary button all match the question screen. |
| Continuity | ✅ Follows | The answer columns line up under their labels, and rows read along hairlines. |
| Figure-Ground | ✅ Follows | The black grid and navy header are gone: paper ground, white card, hairline rows. |
| Prägnanz (Simplicity) | ⚠️ Partial | It is still a matrix of every statement on one page, though now with a count and a bar. |
| Symmetry | ✅ Follows | A centered column with four equal-width answer columns. |
| Connectedness | ✅ Follows | The bar sits on its track with its count, and an answered row is joined to its chosen cell by tint. |
| Common Region | ✅ Follows | One card, one header band, hairline rows, and no boxed cells. |
| Focal Point | ⚠️ Partial | The title and progress lead, but the tint draws the eye to the answered rows, not the ones left. |
| Common Fate | ✅ Follows | One 150ms curve for the cell, the dot and the row tint, with reduced-motion fallbacks (from code). |

**Follows 8, partial 2, breaks 0.** The before version followed 1, partly followed 4 and broke 5.

## Principles it follows

### Proximity ✅
- **One row, one task:** each statement and its four choices share a row with 16px above and below (`py-4`, line 550), and a hairline between rows. In the screenshot, row 5 wraps to two lines and the radios stay centered on it.
- **The tint bridges the gap:** a short statement leaves a stretch of space before its first radio, as in rows 2 and 3. The faint blue wash on an answered row runs across that gap, so the statement and its answer still read as one unit.
- **Labels stay in reach:** the column labels are in a sticky header (`sticky top-[5.5rem] lg:top-16`, lines 543 and 544), so on a long inventory they stay under the page header. This is from the code, not seen while scrolling.

### Similarity ✅
- **Same answer control as the question screen:** a 24px circle with a 2px field-stroke border and a 12px deep-blue dot that grows in, on a hidden native radio, drawn the same way as `AnswerOption` (line 228). The chosen choice gets a Blue Wash fill, as the chosen answer does there.
- **Same type roles:** statements are Atkinson at 18px (pinned inline, line 551), column labels are DM Sans bold at 15px (the Label style), the title is DM Serif Display.
- **Same button and frame:** "Submit my answers" is the same `primaryButton`, in the same `AttemptShell` frame as the exam screens.
- **One job per color:** deep blue for the progress fill, the dot and the button, and blue wash for answered. No navy, no black.

### Continuity ✅
- **Columns line up:** the four answer columns are fixed at `w-[5.5rem] sm:w-28` (line 544), so every radio in a column shares one vertical axis under its label. In the screenshot the circles run straight down under "Strongly Disagree", "Disagree", "Agree" and "Strongly Agree".
- **Rows read across:** the hairlines are horizontal only, so the eye follows a row from the statement to its choices without crossing vertical rules.

### Figure-Ground ✅
- **Ground and figure:** paper ground, one white card with a 1px hairline, no shadow. The black grid and the navy `#244477` header are gone.
- **A quiet header band:** the header row is the sunken tone (`#F2F1ED`), DESIGN.md's tone for secondary regions, with ink text. It marks the labels without competing with the statements.
- **Statements are the figure:** at 18px ink on white, they are now the darkest thing in each row.

### Symmetry ✅
- **Balanced:** the card is a centered column (`max-w-5xl`), and the four answer columns are equal. Every choice cell has the same size, so no option looks more important.
- **No sideways scroll:** the `min-w-[700px]` and its scroll wrapper are gone. The columns shrink instead of overflowing, which matters at 1024px. Not checked in a browser.

### Connectedness ✅
- **Progress with its words:** the bar sits on its track with "4 of 10 answered" on the same row (lines 532 to 537), as DESIGN.md asks. It has `role="progressbar"` and the count is printed, so the bar is never the only signal.
- **Answer joined to its row:** choosing a cell fills it with blue wash and tints the whole row, so the answered row and its choice read as one thing. In the screenshot, rows 1, 2, 3 and 5 are tinted and each has one washed cell.
- **Screen readers:** every radio keeps its `aria-label` of statement and choice, and each statement is a row header (`<th scope="row">`), which gives a clearer table than before.

### Common Region ✅
- **One region per job:** the card holds the inventory, the sunken band holds the labels, and hairlines divide the rows. There are no boxed cells.
- **A small region in a region:** the chosen cell's wash sits inside a tinted row, so it is a second tone in the same row. At 25% tint the two blues are close, and the filled dot is what carries the state.

### Common Fate ✅ (from code)
- **Shared timing:** the cell wash, the row tint and the dot all use 150ms on `cubic-bezier(0.23, 1, 0.32, 1)`, and the progress fill slides over 200ms on the same curve. A choice therefore changes the cell, the row and the bar together. The cell also has a press scale.
- **Reduced motion:** the dot's scale, the press scale and the bar's slide are behind `motion-reduce` and `motion-safe`. This is from the code. I did not check it in a browser.

## Principles it partly follows

### Prägnanz (Simplicity) ⚠️
- **Better:** the heavy grid, the navy band and the 16px circles are gone, and the learner now sees a count, a bar and a plain submit label.
- **Still a matrix:** `pretest-question-before.md` recommended one statement at a time. The table still puts every statement on one page, with four circles on each row. For a Likert inventory this is a standard form and the sticky header and the tint make it manageable, but it is forty circles on ten statements, and more on a longer inventory.
- **No reason on the disabled button:** the question screen says "3 questions still need an answer" with a link to the first one. The LRI's submit stays disabled until every row is answered and says nothing about what is missing.

### Focal Point ⚠️
- **Holds:** the Display title leads, and the deep-blue progress fill is the one saturated bar on the page.
- **The tint points the wrong way:** answered rows take a blue wash, so the figure is what is finished. In the screenshot, 4 of 10 answered, the tinted rows catch the eye and the white rows are the gaps. The unanswered rows only stand out by comparison, and this reverses once most rows are answered. A solid fill for the rows left to do, or an accent on the next one, would point at the work.
- **The action is below the screenshot:** the submit button sits after the table, so at this size it is out of view. It is not sticky.

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ✅ Follows | Statement and radios were split by a column rule, with the labels only in a header. Now a tinted row joins them, and the header is sticky (from code). |
| Similarity | ❌ Breaks | ✅ Follows | Native 16px radios and a `#244477` header became custom 24px radios, Atkinson 18px and the shared button. |
| Continuity | ⚠️ Partial | ✅ Follows | Five vertical black rules per row became hairlines between rows only. |
| Figure-Ground | ❌ Breaks | ✅ Follows | The black grid and navy header became a sunken header band and hairlines. The card has no shadow. |
| Prägnanz | ❌ Breaks | ⚠️ Partial | Added a count and a bar and removed the heavy grid. It is still a full matrix, and the disabled submit still gives no reason. |
| Symmetry | ✅ Follows | ✅ Follows | Still a centered column of equal answer columns. The minimum width and sideways scroll are gone. |
| Connectedness | ❌ Breaks | ✅ Follows | A chosen answer was a 16px dot. Now the cell washes, the row tints and the bar counts it, all together. |
| Common Region | ⚠️ Partial | ✅ Follows | 55 boxed cells became one band, hairline rows and no boxes. |
| Focal Point | ❌ Breaks | ⚠️ Partial | The navy header no longer leads. The title and progress do, though the tint highlights answered rows and the submit button is out of view. |
| Common Fate | ⚠️ Partial | ✅ Follows | Default radio changes and no hover became one 150ms curve across the cell, dot and row, with a press scale and reduced-motion fallbacks (from code). |
| **Total** | **1 follow, 4 partial, 5 break** | **8 follow, 2 partial, 0 break** | |

| Other issue (from the before file) | Before | After |
|---|---|---|
| Click target | The 16px circle only | The whole cell, 56px tall and 88 to 112px wide, with a hover state |
| Statement text | 14px, default sans | Atkinson 18px, ink |
| Column labels | 14px white on navy | 15px bold ink on the sunken band, sticky (from code) |
| Overflow at 1024px | `min-w-[700px]` and a scroll wrapper | Columns shrink, with no scroll wrapper. Not checked in a browser |
| Focus style | Browser default ring | A 2px deep-blue outline on the cell (`has-[:focus-visible]`) |
| Submit label | "Submit baseline responses" | "Submit my answers" |
| Progress | None | "N of M answered" with a bar |
| Gray text | `text-gray-800` | `#1B1D26` and `#4A4F5C` |

## Remaining issues outside the Gestalt list

- **Two names for one test:** the heading still reads "Learner Readiness Index Assessment" (both screenshots), while the hub's empty state and the dashboard say "Readiness Inventory". This is a data or copy decision.
- **A help line for the disabled button:** the question screen names how many answers are missing and links to the first. The LRI could do the same without changing the submit logic.
- **The sticky header is unseen:** it depends on the page header being 64px at `lg` and about 88px below that (`top-[5.5rem] lg:top-16`). If the shell's height changes, those two numbers need to change with it.
- **Not checked:** 1024px and phone widths, the time-up state with locked cells, a long inventory, and the bottom of the table.
- **Screenshot dates:** `pretest-lri-after.png` shows a mid-way state. A fresh after image (nothing answered) and a nearly-finished one would show the tint in both directions.
