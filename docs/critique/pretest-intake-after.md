# Participant Intake: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/diagnostic/ParticipantIntake.tsx`, rebuilt in the light card style with a sticky aside (commits `f3d42dff` and `e802fa05`).
- **Checked against:** the Gestalt Principles section of `DESIGN.md`. The same method as `pretest-intake-before.md`.
- **Date:** 2026-10-05, branch `ui-polish`.
- **Evidence: the source code only. There is no after screenshot.** `pretest-intake-after.png` does not exist in `docs/critique/`, so I could not look at the rebuilt page. Every verdict below comes from reading the code and DESIGN.md, and none comes from seeing the page. In particular, how the layout looks at 1280px and 1024px, whether the strand labels wrap in three columns, and whether the submit button is below the fold are all unchecked. The design skill's automated check (`impeccable detect`) found nothing in the file. When the screenshot is added, the "Not checked" list below should be rechecked against it.
- **Scope:** a focused Gestalt review done by one reviewer, not the full multi-reviewer `impeccable critique`. Not checked: the error and success messages, the saved-intake ("Update intake") state, 1024px and phone widths, and reduced motion in a browser.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Labels, fields and cards sit on the rhythm and cards pad 32px, but the strand gaps are 12px. |
| Similarity | ✅ Follows | One 48px field shape, one button, one blue, and indigo is gone. |
| Continuity | ✅ Follows | One left edge in the card, and a single path down three cards. |
| Figure-Ground | ✅ Follows | Paper ground, white cards with a hairline, no shadows, no gradient. |
| Prägnanz (Simplicity) | ⚠️ Partial | One primary action, but the aside adds three cards and "Choose at least one" is said twice. |
| Symmetry | ✅ Follows | The 2/3 + 1/3 split matches the hub, and the groups are equal width. |
| Connectedness | ✅ Follows | Each label wraps its field, the attempts field follows its question, and the progress bar has its words. |
| Common Region | ✅ Follows | One card per topic and no nested cards. |
| Focal Point | ⚠️ Partial | The Display title leads and the button is the only saturated element, but it is probably far down the page. |
| Common Fate | ✅ Follows | One 150ms curve for fields, rows and the button, with reduced-motion fallbacks (from code). |

**Follows 6, partial 4, breaks 0.** The before version followed 0, partly followed 6 and broke 4.

## Principles it follows

### Similarity ✅
- **One job per color (the One Job Rule):**
  - **Deep blue `#00538A`:** the submit button (the hub's own `primaryButton`, imported from `StrandTestCard.tsx`), the focus border and ring on every field, the back link, and ticked strands and the saved-message border.
  - **Amber:** only "Part I of 4" in the aside, as the "you are here" segment (deep blue once an intake is saved).
  - **Indigo and navy:** not used.
- **One control shape:** text inputs, selects and the number inputs share `inputClass` (line 22): 48px tall, 12px corners, field-stroke border, Atkinson 18px. Selects get a drawn chevron (`SelectBox`) so they match instead of showing the native arrow.
- **Answer-option look for strands:** each strand is a full-height row with a 24px checkbox, a field-stroke border that turns deep blue on hover, and a Blue Wash fill when ticked (`has-[:checked]`, line 127). That is the same pattern as the question screen's answer options.
- **Same disabled look:** the attempts field goes sunken with muted text when disabled, the same tone DESIGN.md uses for secondary regions.

### Continuity ✅
- **One path:** the page title, the intro and three cards run in one column, in the order a learner answers them. Each card's content shares one left edge from its 32px padding.
- **Fewer width changes:** rows are 3 columns (About you), 1 (attainment), 3 (strands), then a field narrowed to `sm:max-w-48` (months), and 2 (A&E). The months field is the only odd one, and it is left-aligned so the edge still holds.

### Figure-Ground ✅
- **Ground and figure:** the ground is paper (the shell). The white cards with a 1px `#E2E0DA` hairline are the figures.
- **Flat:** no card has a shadow, and the gradient banner is gone.
- **Visible fields:** field borders are `#8A8F9C` (3.24:1 on white, the DESIGN.md field stroke), up from `gray-200`. Placeholders are `#6B7080` (4.94:1). The error panel uses the error tokens with an icon and `role="alert"`.

### Symmetry ✅
- **Same split as the hub:** at 1280px the form takes the main column and the aside takes 22rem (`xl:grid-cols-[minmax(0,1fr)_22rem]`, line 88), the same classes as the pre-test hub. It is a judgment call: DESIGN.md lists focused tasks as centered columns, but this page sits between two hub-style screens and now matches them.
- **Equal where it should be:** the three About-you fields share a row at equal widths, and so do the three strands and the two A&E fields.
- **Below 1280px:** the aside moves under the form, as three cards in a row from `lg`. Not seen in a browser.

### Connectedness ✅
- **Label and field joined:** `Field` wraps the input in its `<label>`, so a click on the label focuses the field, and the label is 8px above it.
- **A real dependency drawn:** the attempts field sits beside "Have you taken the A&E test before?" and is disabled and sunken until the answer is Yes (unchanged logic).
- **Progress with its words:** the "Part I of 4" bar has four capsules on one row, one filled, plus "You are here" or "Intake saved. You can still update it." in words. The bar is `aria-hidden`, so the words carry the meaning, as DESIGN.md asks.
- **Saved message joined to the form:** the success and error messages are tinted regions above the cards, with an icon, not a toast.

### Common Region ✅
- **One card per topic:** About you, Your ALS learning, and A&E test history (`intake-about`, `intake-als`, `intake-ae`, lines 109, 118 and 138). The blue info box is gone.
- **No nesting:** the strand rows are bordered controls inside a card, in the same way the question screen's answer options are, not cards. The aside has its own three cards.

### Common Fate ✅ (from code)
- **Shared timing:** fields, strand rows and the button all use 150ms on `cubic-bezier(0.23, 1, 0.32, 1)`. The button comes from `primaryButton`, which also has a press scale.
- **Reduced motion:** the spinner is behind `motion-safe`, and the press scale has a `motion-reduce` override. This is from the code. I did not check it in a browser.

## Principles it partly follows

### Proximity ⚠️
- **On the rhythm:** label to field is 8px (`mt-2`), fields are 24px apart (`gap-6`, `space-y-6`), cards are 24px apart, and cards pad 32px from `sm` up (`sm:p-8`), as DESIGN.md sets. Each card title has 32px above it and 24px below, so the gap above is bigger.
- **Off the scale:** the strand rows are 12px apart (`gap-3`, line 125) and sit 12px under the "Choose at least one." line. 12px isn't on the 4 / 8 / 16 / 24 scale. The hub's strand rows use similar spacing, so it matches the hub, but it is off the written rule.
- **Smaller padding on narrow screens:** cards pad 24px below `sm` (`p-6`).

### Prägnanz (Simplicity) ⚠️
- **Better:** the banner, the icon tile and the blue info box are gone. The "required" note is one sentence in the intro, and there is one primary button.
- **Six boxes for one form:** the three form cards sit beside three aside cards. "Part I of 4" and the intro both say "Part I", and "Why we ask" and "What's next" are one short sentence each, so each is a full card for one line.
- **Said twice:** "Choose at least one." under the strand legend (line 124) and "Choose at least one learning strand to continue." beside the button (line 150) are the same message.

### Focal Point ⚠️
- **Holds:** the Display title (3rem, DM Serif) is the largest thing on the page. The submit button is the only saturated block, and the amber "you are here" segment is small.
- **Probably far from the eye:** the button sits after three cards, so at a laptop height it is likely below the fold. I could not check that without a screenshot. The sticky aside stays in view while the form scrolls, but it holds no action.
- **Disabled without a visible reason until a strand is ticked,** though the line beside it now says why.

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ⚠️ Partial | Fields were all 24px apart with no groups. Now they are grouped in cards at 32px padding, but the strand gaps are 12px. |
| Similarity | ❌ Breaks | ✅ Follows | Indigo on five jobs became deep blue for actions and focus. Inputs and selects share one 48px shape, and strands look like answer options. |
| Continuity | ⚠️ Partial | ✅ Follows | Rows that switched between 3, 1, 3, 1 and 2 columns now sit in three cards with one left edge each. The months field is the one exception. |
| Figure-Ground | ❌ Breaks | ✅ Follows | The gradient banner, the card shadow and the faint `gray-200` field borders are gone. Fields use the 3:1 field stroke. |
| Prägnanz | ⚠️ Partial | ⚠️ Partial | The banner, the icon tile and the info box are gone. The aside adds three cards, and "Choose at least one" is said twice. |
| Symmetry | ⚠️ Partial | ✅ Follows | A narrow 598px card in an empty screen became the hub's 2/3 + 1/3 split. |
| Connectedness | ⚠️ Partial | ✅ Follows | "Part I" was a 12px eyebrow. Now "Part I of 4" has a bar and its words. The attempts field still follows its question. |
| Common Region | ❌ Breaks | ✅ Follows | Eight fields in one region became three cards, one per topic. |
| Focal Point | ❌ Breaks | ⚠️ Partial | The banner no longer leads, and the Display title and the deep blue button do. The button is probably far down the page. |
| Common Fate | ⚠️ Partial | ✅ Follows | Default transitions and no press feedback became one 150ms curve, a press scale, and `motion-safe` on the spinner (from code). |
| **Total** | **0 follow, 6 partial, 4 break** | **6 follow, 4 partial, 0 break** | |

| Other issue (from the before file) | Before | After |
|---|---|---|
| Label and input text size | 14px (`text-sm`) | Atkinson 18px, labels bold |
| Field height | About 42px | 48px (`h-12`) |
| Field border | `gray-200`, well under 3:1 | `#8A8F9C`, 3.24:1 |
| Strand checkbox | Browser default 16px | 24px in a full-height row, with a blue wash when ticked |
| Heading type | Bold sans | DM Serif Display, 3rem page title and 1.5rem card titles |
| Button | Indigo, no press feedback, pale grey when disabled | Deep blue `primaryButton`, press scale, muted fill when disabled, and a line saying why |
| Gray text | `text-gray-500` and `text-gray-700` | `#1B1D26` and `#4A4F5C` |
| Spinner | No reduced-motion fallback | `motion-safe` |

## Remaining issues outside the Gestalt list

- **No after screenshot:** `pretest-intake-after.png` is missing, so none of the layout was seen. It should be added and this file rechecked at 1280px and 1024px.
- **No per-field error state:** a missing or out-of-range value is caught by the browser's own validation bubble, not DESIGN.md's error-tint panel with `aria-invalid`. This was left alone on purpose, because the rebuild was not allowed to touch validation.
- **Strand labels in three columns:** at 1280px each strand box is narrow, so labels like "English (LS1-EN)" may wrap to two lines. Not seen.
- **The aside's progress is local:** it only knows whether this intake exists. It does not know whether Parts II to IV are done, because the intake page does not load them.
- **Not checked:** the saved and error states, 1024px and phone widths, and the aside's three-across layout between 1024px and 1279px.
