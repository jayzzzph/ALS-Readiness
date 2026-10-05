# Pre-test Overview: Gestalt Critique (Before)

- **Target:** `frontend/src/app/components/diagnostic/DiagnosticTest.tsx` (the hub, 205 lines) and `StrandTestCard.tsx` (68 lines), shown inside the shared `AppLayout` shell.
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `learner-dashboard-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `b95e5c3b`.
- **Evidence:** the source code at that commit, and the screenshot `pretest-overview-before.png`. The screenshot is of a learner who has not started: Part I is open, Parts II and III are locked. Part IV is below the fold and not in the image. I read the code and the image. I did not render the page myself or measure it, so no pixel measurements are given. The design skill's automated check (`impeccable detect`) found nothing in either file, so every finding below comes from reading, not from the detector.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. No code was changed for this file.

> **What this screen shows.** The sidebar and top bar are already the rebuilt light shell. The content area is still the old system: an indigo gradient banner, indigo `#3535C5` on every action and label, Tailwind grays, `text-xs` and `text-sm` type, and rose, violet and blue tiles for the three strands. Most "breaks" below come from that, and DESIGN.md treats that system as legacy.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Each part groups its own text, but spacing is off the rhythm and the status chip floats far from its title. |
| Similarity | ❌ Breaks | One indigo means five jobs, locked is amber, and the three strands have three icon colors. |
| Continuity | ⚠️ Partial | One column reads top to bottom, but nothing joins the parts, and Part III splits into three columns. |
| Figure-Ground | ❌ Breaks | A gradient banner is the strongest figure, and the cards carry shadows. |
| Prägnanz (Simplicity) | ❌ Breaks | The same status is shown in tiles, chips and buttons, and one lock reason is printed four times. |
| Symmetry | ⚠️ Partial | The tiles and strand cards are balanced, but nothing leads, and the page is a single column. |
| Connectedness | ❌ Breaks | The order of the parts is the point of the page, and it is only said in words. |
| Common Region | ❌ Breaks | Cards nest: three strand cards sit inside the Part III card. |
| Focal Point | ❌ Breaks | The banner has the most contrast, and the one enabled button is small and low on the page. |
| Common Fate | ⚠️ Partial | Nothing animates, but nothing shares a timing either, and buttons change instantly. |

**Follows 0, partial 4, breaks 6.**

## Principles it partly follows

### Proximity ⚠️
- **Holds:** inside each part card, the label, title and description are stacked tightly (lines 157, 203), so each reads as one block. Inside each strand card, the icon, name, test title and button read as one unit.
- **Off the rhythm:** the banner is padded 28px (`p-7`, line 128), the cards 24px (`p-6`), the gaps between cards 20px (`space-y-5`), the strand grid 16px (`gap-4`), and the strand cards 16px (`p-4`). DESIGN.md's rhythm is 4 / 8 / 16 / 24 / 32 with 32px card padding. 28px and 20px aren't on the scale, so the space inside a card and the space between cards are too close to tell apart.
- **Status far from its title:** the "Required" and "Locked until Part I" chips sit at the top right of the card, level with the "Part I" label (line 203), not with the title. In the screenshot the chip is far from the words it describes, with the button below it.
- **Heading spacing:** "Participant intake" has 24px of card padding above it and a small gap below, so the gap above is not clearly bigger than the gap below, which DESIGN.md asks for.

### Continuity ⚠️
- **Holds:** the four parts are stacked in one column, in order, so the eye moves down the page the way the learner has to.
- **Breaks:** nothing carries the eye from one part to the next. The order is only the "PART I / PART II / PART III" labels. And Part III turns the single column into three side-by-side cards (line 160), so the learner has to switch from reading down to reading across.

### Symmetry ⚠️
- **Holds:** the three stat tiles (lines 139 to 143) and the three strand cards are equal widths, so each row is balanced.
- **Weak:** DESIGN.md asks a dashboard-style screen for a 2/3 main column and 1/3 aside so the main task leads. This hub is one centered column (`max-w-6xl`, line 127) with equal-weight cards, so nothing leads. The next step has the same weight as the finished and locked ones.

### Common Fate ⚠️
- **No decorative motion:** unlike the old dashboard, nothing pulses or lifts.
- **No shared timing:** buttons and chips change color with the browser default and no shared 150 to 200ms on `cubic-bezier(0.23, 1, 0.32, 1)`. There's no press feedback, and no reduced-motion handling because there's no motion to handle. The loading spinner (line 44) spins with no `motion-reduce` fallback.

## Principles it breaks

### Similarity ❌
- **One color means five jobs:** `#3535C5` indigo is on the banner gradient (line 128), every "PART" label (lines 157, 203), the strand icons (the old tiles), every primary button (line 203 and `StrandTestCard` line 61), and the "Show Score" outline (line 55). DESIGN.md's One Job Rule gives deep blue to actions and indigo to learning strands only.
- **Amber means locked:** the "Locked until Part I" chip is amber (line 203). In DESIGN.md amber means "you are here" or readiness, so the one color the system keeps for where the learner is, is used for what they cannot reach yet.
- **Green means done:** "Completed" is `green-50` and `green-700` (line 203, `StrandTestCard` line 53). Green isn't in the palette. Done is deep blue.
- **Three strands, three colors:** English is blue, Filipino rose, Mathematics violet (`StrandTestCard` lines 12, 13, 16). The color carries no meaning, and DESIGN.md says a strand label is an indigo overline. Meanwhile the real strand codes (`LS1-EN`, `LS1-FIL`, `LS3`) are small gray monospace at the top right of each card (line 47).
- **The labels are swapped:** the "PART I" overline is indigo, but it names a step. The strand code, which names a strand, is gray.

### Figure-Ground ❌
- **The wrong figure is strongest:** the banner (line 128) is a navy to indigo gradient with white text. It is the darkest and most contrasting block on the screen, and DESIGN.md keeps navy for sensor information.
- **Shadows on cards:** the part cards use `shadow-sm` (lines 148, 155, 203). DESIGN.md's Flat Workbook Rule keeps shadows for floating layers only.
- **Text blends into the ground:** the disabled strand buttons use `text-gray-400` on `bg-gray-100` (`StrandTestCard` line 61), and DESIGN.md names `#9CA3AF` as failing. In the screenshot the three buttons are the faintest text on the page.

### Prägnanz (Simplicity) ❌
- **The same status three ways:** the learner's position is shown by the three stat tiles ("0/3", "Pending", "In progress", lines 140 to 142), by the chip on each part, and by each button's state. A learner reads "Pending" and "Locked until Part I" and "Required" and has to work out they mean "do Part I".
- **One reason, four times:** "Complete your Participant Intake first" is printed in the Part III header pill (line 158) and again on each of the three disabled strand buttons (`StrandTestCard` line 61). Part II adds "Locked until Part I". In the screenshot you can read the same sentence four times in a row.
- **Three disabled buttons for one lock:** one lock is shown as three buttons, so the page looks like it has three things to do when it has one.
- **No single next step:** DESIGN.md asks for one primary action per area and one task at a time. Here the only enabled button, "Complete intake", is small, in the top card, among five other chips and buttons.

### Connectedness ❌
- **The point of the page isn't drawn:** each part depends on the one before. That dependency is the whole content of the screen, and it appears only as chip text ("Locked until Part I"). No line or shared shape joins Part I to Part II to Part III.
- **Chips float:** the status chip is a separate pill at the edge of the card, not joined to the title it describes.
- **What works:** each strand card's button sits under its own title, and the strand cards are equal.

### Common Region ❌
- **Nested cards:** the Part III card (line 155) contains three bordered strand cards (`StrandTestCard` line 41). DESIGN.md says "Cards never nest". The learner has to sort out two levels of region to find a button.
- **Stat tiles are a fourth kind of region:** three more white boxes above the parts, each holding a number the parts already show.
- **What works:** the banner, the part cards and the stat tiles are each cleanly bounded.

### Focal Point ❌
- **The banner wins:** the gradient banner is the highest-contrast block. Its content, an eyebrow, a title and one sentence, is not an action.
- **The next step is quiet:** the learner's one available action, "Complete intake", is a small button in the card below the fold of attention. DESIGN.md says there is one focal point per screen and amber or the saturated button marks it.
- **Competing signals:** the banner, the indigo buttons, the amber "Locked" chips, the three colored strand tiles and the three stat icons all compete.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same learner.

- **Text too small:** the old hub and strand card use `text-xs` (12px) on 8 lines (the eyebrow, chips, the stat labels, the strand code and the strand test title) and `text-sm` (14px) for descriptions and buttons. DESIGN.md sets learner text at 15px minimum for labels and 18px for sentences, in Atkinson Hyperlegible.
- **Gray body text:** `text-gray-400` or `text-gray-500` on nine lines for descriptions and disabled states.
- **A repeated line in every strand card:** the strand code appears at the top right ("LS1-EN") and again in the test title under the strand name ("LS1-EN Diagnostic Pre-test", `StrandTestCard` line 49). Nothing else is added by the second one.
- **Uppercase overlines with wide tracking at 12px** ("BASELINE ASSESSMENT · MUSE 2 BASELINE RECORDING", line 129) are below the learner minimum and read as decoration.
- **Not checked:** Part IV (below the fold in the screenshot), the unlocked state, the completed state, 1024px width and reduced motion. Only the first state was captured.

## What a rebuild would need

This is a direction to follow when the screen is rebuilt, not a spec. It isn't implemented in this file.

1. **Draw the sequence:** a timeline with a line joining the four parts, so the order and the dependency are visible, not only written.
2. **One focal point:** expand only the part the learner is on, with the one deep-blue button. Collapse finished parts to a row, and show locked parts as a lock plus the reason once.
3. **Remove the repeats:** drop the banner and the three stat tiles, and show progress once, as a ring with its number and word.
4. **No nesting:** put the strand exams in a divided list inside the Part III card, not three cards inside it.
5. **Colors and type:** deep blue for actions, amber for "you are here" only, indigo only for the strand code, no green or rainbow, 15px minimum for labels and 18px for sentences.
6. **Layout:** a 2/3 + 1/3 grid at 1280px with the timeline in the main column, and the aside under it below that width.
