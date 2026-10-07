# Participant Intake: Gestalt Critique (Before)

- **Target:** `frontend/src/app/components/diagnostic/ParticipantIntake.tsx` (102 lines), shown inside the shared `AppLayout` shell.
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `pretest-overview-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `9e6b8924`.
- **Evidence:** the source code at that commit, and two screenshots: `pretest-intake-empty-before.png` (1897 × 836, nothing filled in) and `pretest-intake-filled-before.png` (1907 × 838, all fields filled and all three strands ticked). I read the code and the images. I did not render the page myself or measure it, so no pixel measurements are given.
- **The screenshots are older than the code in one place.** Both show Civil status as a free-text input with the placeholder "e.g., Single". The code at the commit above already has the Civil status dropdown (`civilStatusChoices`, line 87). So that one field in the images is not what the code does. Everything else matches.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. No code was changed for this file. Not checked: 1024px width, phone width, the error and success messages, the saved-intake ("Update intake") state, and reduced motion.

> **What this screen shows.** The sidebar and top bar are the rebuilt light shell. The content is the old system: an indigo gradient banner, indigo `#3535C5` on the focus rings, the checkboxes and the button, Tailwind grays, and `text-sm` type. The form is one 598px-wide card, centered in a content area about 1,700px wide, so paper shows on both sides.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Labels sit close to their fields, but every field is the same 24px apart, so nothing is grouped. |
| Similarity | ❌ Breaks | Indigo does five jobs, and the button, the focus ring and the checkboxes are not the system's blue. |
| Continuity | ⚠️ Partial | One column down one left edge, but the row widths switch between 3, 1, 3, 1 and 2 columns. |
| Figure-Ground | ❌ Breaks | A gradient banner is the strongest figure, the card has a shadow, and the field borders are faint. |
| Prägnanz (Simplicity) | ⚠️ Partial | One task and one button, but the same message is said twice and an icon tile adds nothing. |
| Symmetry | ⚠️ Partial | A centered column suits a focused task, but it is narrow and leaves most of the screen empty. |
| Connectedness | ⚠️ Partial | The A&E fields share a row, but nothing says where Part I sits in the pre-test. |
| Common Region | ❌ Breaks | Eight fields about three different topics share one undivided region. |
| Focal Point | ❌ Breaks | The banner leads, and the one action is a small button, pale and disabled in the empty state. |
| Common Fate | ⚠️ Partial | Fields use a default transition, and the button has no shared timing or press feedback. |

**Follows 0, partial 6, breaks 4.**

## Principles it partly follows

### Proximity ⚠️
- **Holds:** each label sits close above its field (`mt-1.5`, line 101), so a label reads as part of its input. Age, Sex and Civil status share one row, and the two A&E fields share another.
- **No group spacing:** every field and field row is 24px apart (`space-y-6`, line 79), including between topics. The step from "Civil status" to "Highest educational attainment" is the same as the step from "Highest educational attainment" to the strands. DESIGN.md asks for wider gaps between groups than inside them.
- **Off the rhythm:** the banner is padded 28px (`p-7`, lines 72 and 79), which isn't on the 4 / 8 / 16 / 24 / 32 scale, and the card padding is not the 32px DESIGN.md sets.
- **Heading spacing:** "Participant intake" (line 75) has 28px of banner padding and an icon tile above it and 8px below, so the gap above is bigger, as it should be. That is the one place heading space is right.

### Continuity ⚠️
- **Holds:** the form reads top to bottom with one left edge set by the card padding.
- **Breaks the path:** the rows go 3 columns (Age, Sex, Civil status), 1, 1 (strands, as 3 small boxes), 1, then 2 (A&E). The learner's eye has to re-find the column edges on each row. The attempts field (the second A&E column) does not line up with anything above it.

### Prägnanz (Simplicity) ⚠️
- **Holds:** it is one task with one submit button, and no side branches.
- **Said twice:** the banner says "Complete this background questionnaire once…" (line 76), and then a blue box says "All fields are required. You can come back and update your answers at any time." (line 80). Both are the same kind of preamble in two boxes.
- **Decoration:** the white clipboard icon in a tinted tile (line 73) tells the learner nothing the title does not.
- **Strands as three small boxes:** the checkboxes are native 16px boxes in a row of three bordered rows, so the learner has to hit a small target and read three labels at once.

### Symmetry ⚠️
- **Holds:** DESIGN.md gives focused tasks a centered column, and this one is centered (`max-w-3xl mx-auto`, line 69). The three-column and two-column rows are balanced.
- **Weak:** the card is about 598px wide in a content area about 1,700px wide (both screenshots). The hub it came from uses the 2/3 + 1/3 dashboard split, so this page is a different shape from the screen before and after it.

### Connectedness ⚠️
- **Holds:** "Number of previous A&E attempts" sits right beside "Have you taken the A&E test before?", and it is greyed and disabled (`disabled:bg-gray-100`) until the answer is Yes. That is a real dependency drawn by position and fill.
- **Missing:** "Part I" appears only as a 12px eyebrow in the banner ("PRE-TEST · PART I", line 74). Nothing shows that there are four parts, where this one is, or what comes next.

### Common Fate ⚠️
- **No shared timing:** the inputs use Tailwind's bare `transition` with its default timing, and the submit button has no transition and no press feedback. There is no 150 to 200ms shared curve.
- **Loading spinner:** the `animate-spin` spinner (line 79) has no reduced-motion fallback.

## Principles it breaks

### Similarity ❌
- **One color means five jobs:** `#3535C5` indigo is on the banner gradient (line 72), the focus border and ring on every input (line 14), the checkbox accent (line 90), the back link's hover (line 70) and the submit button (line 93). DESIGN.md gives indigo to learning-strand labels only, and gives actions deep blue `#00538A`.
- **The action is the wrong blue:** in the filled screenshot, "Submit participant intake" is indigo, not the deep blue every other primary button in the redesigned pre-test uses.
- **Controls differ in kind:** text inputs and selects share one class, but the native select arrow, the 16px checkboxes and the disabled grey input each look like a different control.
- **Blue means "information" here:** the info box (`bg-blue-50`, `text-blue-900`, line 80) uses Tailwind blue for a note. In DESIGN.md blue means "act here".

### Figure-Ground ❌
- **The wrong figure is strongest:** the banner (line 72) is a navy to indigo gradient with white text. It is the darkest block on the screen, and DESIGN.md keeps navy for sensor information.
- **A shadow on the card:** `shadow-sm` (line 71). DESIGN.md's Flat Workbook Rule keeps shadows for floating layers only.
- **Faint fields:** inputs use `border-gray-200` on white (`inputClass`, line 14), well under the 3:1 DESIGN.md asks of an input's border (its field stroke is `#8A8F9C`, 3.24:1). In the empty screenshot the fields are nearly the same tone as the card, so the empty boxes are the hardest thing on the page to see. The placeholders ("e.g., Grade 10") are very light.

### Common Region ❌
- **One region, three topics:** DESIGN.md says a card holds one topic. This card holds who the learner is (age, sex, civil status), their schooling in ALS (attainment, strands, months) and their A&E history, with nothing to mark where one ends and the next starts.
- **A second kind of region inside:** the blue info box (line 80) and the three bordered strand boxes (line 90) sit inside the card as extra boxes, so the card has four kinds of region and no meaningful one.

### Focal Point ❌
- **The banner wins:** the gradient banner is the highest-contrast block. Its content, an icon, an eyebrow, a title and a sentence, is not an action.
- **The action is quiet:** the one action is a small button at the bottom right of the card (line 93). In the empty screenshot it is a pale grey `disabled:bg-gray-300` with light text, so the page has no saturated element at all. It is also disabled until a strand is ticked, but nothing says why.
- **Competing signals:** the banner, the blue info box and the indigo button all want the eye.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same learner.

- **Text too small:** labels are `text-sm` (14px, `Field`, line 101), the strand legend is `text-sm`, the inputs are `text-sm` and the info box is `text-sm`. DESIGN.md sets learner labels at 15px minimum and sentences at 18px, in Atkinson Hyperlegible. The page uses neither.
- **Short fields:** inputs are `py-2.5` with 14px text, about 42px tall (DESIGN.md: 48px), and the strand checkboxes are the browser default 16px.
- **Gray text:** `text-gray-500` for the back link (line 70) and `text-gray-700` for labels, where DESIGN.md's ink and muted ink should be.
- **No type roles:** headings are bold sans (`font-bold`, line 75), not DM Serif Display. The whole page is one typeface.
- **Back link:** "Back to pre-test" is small gray text with a 16px arrow, above the card.
- **Not checked:** the error and success messages, and what a returning learner sees after saving.

## What a rebuild would need

This is a direction to follow when the screen is rebuilt, not a spec. It isn't implemented in this file.

1. **Group the fields:** three cards, one per topic (about you, ALS learning, A&E history), so the group is a region as well as a gap.
2. **Drop the banner:** a Display page title and one sentence on paper, like the hub, with the "required" note folded into that sentence.
3. **System colors and sizes:** deep blue for the action and focus, 48px fields with a 1px field stroke, 12px corners, labels and inputs in Atkinson at 18px, and the Civil status dropdown kept.
4. **Easier strand choice:** larger checkbox rows with a blue wash when ticked, like the answer options.
5. **Use the width:** a 2/3 + 1/3 grid at 1280px with the form on the left, and an aside saying where Part I sits and what comes next.
6. **Shared timing and no card shadow:** one 150ms curve on fields and the button, a press scale, and a `motion-safe` spinner.
