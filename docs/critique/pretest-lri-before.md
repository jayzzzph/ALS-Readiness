# LRI Table: Gestalt Critique (Before)

- **Target:** the Learner Readiness Inventory in `frontend/src/app/components/diagnostic/PretestAttempts.tsx`, `LriAttempt` and its table (the table is lines 297 to 318 at the commit below).
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `pretest-overview-before.md`. The code-level findings for the LRI are first set out in the LRI section of `pretest-question-before.md`. This file adds the screenshot and scores each principle.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `9495d7a6`. The table was not touched again until commit `74e80d19`.
- **Evidence:** the source code, and the screenshot `pretest-lri-before.png` (1896 × 836): a learner who has just opened the inventory, with nothing answered and the submit button disabled. I read the code and the image. I did not render the page myself or measure it, so no pixel measurements are given.
- **The screenshot is older than the code in one place.** It shows the oldest page frame: a small gray "‹ Back to pre-test" link on a cool grey page, with no header bar, and a bold sans title. The code at the commit above already has the `AttemptShell` frame (a white header with the ALSense wordmark and "Save & Exit"), so the frame in the image is not what that code draws. The table inside the card is the same in both, and that is what this file is about.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. No code was changed for this file. Not checked: 1024px width (the table has `min-w-[700px]`), a table with answers selected, the time-up state, and reduced motion.

> **What this screen shows.** One white card, about 745px wide, centered on a cool grey page. In it: a bold title, a one-line instruction, and a ten-row, five-column table with a navy header and a black grid. Every Likert answer is a small native radio circle. Submit is a pale disabled button at the bottom right.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | A statement and its answers share a row, but the column labels sit only in the header. |
| Similarity | ❌ Breaks | Small native radios and a navy header that look nothing like the answer options on the question screen. |
| Continuity | ⚠️ Partial | The columns line up, but the black vertical rules cut every row's path. |
| Figure-Ground | ❌ Breaks | The black grid is the strongest figure, ahead of the statements. |
| Prägnanz (Simplicity) | ❌ Breaks | Forty identical circles and a heavy rule around every cell, with no count of what is done. |
| Symmetry | ✅ Follows | A centered card and four equal-width answer columns. |
| Connectedness | ❌ Breaks | A row's only sign that it was answered would be a 16px dot. |
| Common Region | ⚠️ Partial | One card for one topic, but every cell is boxed, so there are regions inside regions. |
| Focal Point | ❌ Breaks | The navy header is the focal point, and the one action is pale and disabled. |
| Common Fate | ⚠️ Partial | Radios change at the browser's default speed, with no shared timing or press feedback. |

**Follows 1, partial 4, breaks 5.**

## Principles it follows

### Symmetry ✅
- **Balanced:** the card is centered and the four answer columns are the same width (`w-[12.5%]`, line 302), so the choices read as one even block. DESIGN.md gives focused tasks a centered column.
- **Caveat:** the card is only about 745px wide on a 1,896px screen, so most of the screen is empty grey. That is a size problem, not a balance one.

## Principles it partly follows

### Proximity ⚠️
- **Holds:** each statement and its four radios share one row, with equal 12px cell padding (`p-3`, lines 308 and 310), and the alternating white and `slate-50` rows (`odd:bg-white even:bg-slate-50`, line 307) help the eye stay on one row.
- **Labels far from the answers:** "Strongly Disagree / Disagree / Agree / Strongly Agree" appear once, in the header. With ten rows it fits one screen, but on a longer inventory a learner has to look back up to know what the third column means. The header isn't sticky.
- **Statement far from its radios:** the statement is left-aligned in a 50% column, and the radios are centered in four columns to its right, so the eye has to jump across the column rule. In the screenshot a short statement leaves a wide gap before its first radio.

### Continuity ⚠️
- **Holds:** the four answer columns line up exactly, so a learner can scan down one column.
- **Broken by the grid:** every cell has a black border (`border-slate-800`, lines 297 to 310), so each row is cut by five vertical black rules. The eye follows rules, not rows, and the black vertical lines pull it down the columns when the task is to read across.

### Common Region ⚠️
- **Holds:** the card holds one topic, the inventory.
- **Regions inside regions:** the table is bordered, and so is every cell, and the header is a filled block. A learner reads a card, then a table, then 55 cells. DESIGN.md says a card holds one topic and cards never nest, and each cell acts like a small card.

### Common Fate ⚠️
- **No shared timing:** the radios change at the browser's default and nothing shares a 150 to 200ms curve. There is no press feedback and no hover state on the cells, so nothing tells a learner which cell a click will hit.
- **Nothing animates,** so there is nothing for reduced motion to do.

## Principles it breaks

### Similarity ❌
- **A different product from the question screen:** answers there are full-width rows with a 24px custom radio, a field-stroke border and a Blue Wash when chosen. Here they are native 16px circles (`h-4 w-4`, line 311) with `accent-[#244477]`. A learner who has done the diagnostic exams finds a different control for the same job.
- **A color from nowhere:** the header is `#244477` (line 299), a navy that is not in the palette and borrows Instrument Navy's "sensor" job.
- **Type:** statements and labels are 14px (`text-sm`, line 298) in the default sans, not Atkinson Hyperlegible at 18px.

### Figure-Ground ❌
- **The black grid is the figure:** `border-slate-800` on every cell and on the table (lines 297 to 310) makes the heaviest, darkest lines on the page. The statements, which are the content, read as gaps between lines.
- **The header is the second figure:** a solid navy band with white text, the darkest large area on the screen.
- **No ground rule:** the page is a cool grey, not the warm paper DESIGN.md sets as the ground on every surface.

### Prägnanz (Simplicity) ❌
- **Forty identical circles:** ten statements by four answers is a field of identical empty circles, with more than a dozen heavy rules drawn through it. The learner has to find one row, then one column, among them. DESIGN.md asks for one task at a time and plain, simple shapes.
- **No progress:** nothing says how many statements are answered. The submit button is disabled with no word on what it is waiting for.
- **Label:** the button reads "Submit baseline responses", which is a research word, not the learner's.

### Connectedness ❌
- **The grid joins everything equally:** because every cell has the same border, a statement is joined to the cell above it as much as to the radios beside it. Rows and columns are equally connected, but the task is a row.
- **A chosen answer barely shows:** selecting a radio only fills a 16px dot. The row, the cell and the page do not change, so the learner cannot scan the table for the rows they have not answered.
- **Credit:** each radio has an `aria-label` that names its statement and its choice (line 311), so a screen reader hears a clear group.

### Focal Point ❌
- **The header leads:** the navy band is the highest-contrast element. It holds only the column labels.
- **The action is quiet:** the one action is a pale grey disabled button at the bottom right of the card (`Submit baseline responses`). Nothing on the page is a saturated call to act.
- **Competing signals:** the black grid, the navy header and the zebra rows all want the eye.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same learner.

- **Targets too small:** the radio is a 16px circle with no label area, so a learner must hit a 16px circle inside a 12px-padded cell. DESIGN.md asks for large targets and about 76px option rows. The click area is only the circle itself.
- **Text too small:** statements, headers, the title's subtitle and the button are 14px. DESIGN.md sets learner labels at 15px minimum and sentences at 18px.
- **Overflow:** the table has `min-w-[700px]` (line 298) inside `overflow-x-auto`, so at 1024px or less it can scroll sideways inside the card. A header that scrolls sideways is also not sticky.
- **No visible focus style:** native radios rely on the browser default ring, which is faint on the black grid. DESIGN.md asks for a 2px deep-blue outline with a 2px offset.
- **Title and name:** the heading says "Learner Readiness Index Assessment" while the hub's empty state and the dashboard say "Readiness Inventory".
- **Not checked:** a half-answered table, the time-up state, and any width below 1280px.

## What a rebuild would need

This is a direction to follow when the screen is rebuilt, not a spec. It isn't implemented in this file.

1. **Take out the grid:** remove the black borders and the navy header. Use a light header band and hairline rules between rows.
2. **Real answer controls:** custom radios like the question screen's answer options, with the whole cell as the target and a Blue Wash for the chosen one.
3. **Learner type:** statements in Atkinson at 18px, labels at 15px or more.
4. **Keep the labels in view:** make the column header sticky under the page header.
5. **Show progress:** an "N of M answered" count with a progress bar on its track, and a tint on answered rows so the unanswered ones stand out.
6. **A learner's word on the button:** "Submit my answers".
7. **No sideways scroll at 1024px:** let the columns shrink instead of setting a minimum table width.
