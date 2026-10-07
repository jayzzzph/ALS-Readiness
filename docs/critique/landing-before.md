# Landing Page: Design Critique (Before)

Method: dual-agent. Assessment A (design review) and Assessment B (deterministic detector scan) ran as two isolated sub-agents. A did not run the detector, and B did not give design opinions. The Gestalt scoring below was done by the main reviewer after both came back.

- **Target:** `frontend/src/app/components/LandingPage.tsx` (80 lines). A public, signed-out page: header, hero, "How it works" (three steps), a facilitator line, and a footer. Mode: Persuade, but a very small one.
- **Checked against:** `DESIGN.md` (including its Gestalt Principles section) and `PRODUCT.md`.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `f1e951d3` (the file was last changed before this branch's restyle work, in the commits that restyled it to the light system).
- **Evidence:** the source code only. No browser was opened and no screenshot was taken, so spacing, wrapping and font loading are read from the code, not seen. The detector (`impeccable detect`) found nothing: exit code 0, `[]`. So every finding below comes from reading, not from the detector.
- **Scope:** a critique, not a fix. No code was changed for this file.

## Design health score

Heuristic 7 (flexibility and efficiency) is `n/a`: the page has one path and no repeated task. The total is out of 36, not 40.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | A static page with nothing asynchronous. Nothing is missing. |
| 2 | Match between system and real world | 2 | "Preparatory equivalency exam" (line 10), "modality-matched" (41), "analytics" (41, 70) and "AIS teachers" (70) are never explained. |
| 3 | User control and freedom | 3 | One exit, Sign In. |
| 4 | Consistency and standards | 3 | The header button is weight 500 (28) and the hero button 700 (45). Sentences are DM Sans, not Atkinson as on the sign-in page. |
| 5 | Error prevention | 2 | Nothing says a visitor needs an ID number, or where to get one, before they click Sign In. |
| 6 | Recognition rather than recall | 3 | Everything is visible. |
| 7 | Flexibility and efficiency | n/a | One path, no repeat tasks. |
| 8 | Aesthetic and minimalist design | 3 | Clean, but the facilitator line (69 to 71) is styled as a fourth step. |
| 9 | Error recovery | 3 | There are no error states. |
| 10 | Help and documentation | 1 | No contact, no "ask your facilitator", nothing about the study. |
| **Total** | | **23/36** | **Acceptable (64%)** |

## Design specificity verdict

**Half-authored.**
- **Authored:** the paper ground, the serif headings, the hairlines and the flat, shadow-free treatment follow DESIGN.md's "Annotated Workbook". The big serif step numerals (57 to 68) are the one workbook-like gesture.
- **Interchangeable:** the structure is a centered hero, one button and three steps, and the copy could sit on any education product. There is no amber, no learner-facing voice, and nothing about the learning center, the facilitator or the headband. Swap the name and it fits any "adaptive learning platform".
- **Deterministic scan:** clean (0 findings, exit 0). The detector does not check for jargon, tone or missing content, so it says nothing about the biggest issues here.

## Overall impression

It is calm, honest and correctly flat, and it makes one clear ask. But it is written for a funder, not for the adult learner who arrives at it. The headline is an unconfirmed tagline, step 1 uses the scariest word ("exam") with no reassurance, and the one thing that makes the study different, the Muse 2 headband, is not mentioned. The biggest opportunity is to rewrite it in the learner's words and tell them what to bring.

## What's working

- **Honest:** there are no invented numbers, testimonials or DepEd claims, which PRODUCT.md rules out. The three steps match the real pipeline.
- **Flat and focused:** no shadows, hairlines only, and one saturated element (the 60px hero button, line 45). Focus outlines are on every button (line 15).
- **Sound structure:** a real `<ol>` with `aria-labelledby` (52 to 56), correct heading order, and the decorative numerals are `aria-hidden`.

## Priority issues

- **[P1] Jargon in the hero and in step 1** (lines 10, 41, 70). It breaks PRODUCT.md's "plain words" principle, and "exam" is the scariest word on the page. *Fix:* say what the learner does ("Answer questions about reading, writing and math, and a short set about how you like to learn") and "listening, seeing or reading" instead of "auditory" or "modality". *Command:* `clarify`.
- **[P1] Nothing prepares the learner for the Muse 2 headband or the study, and nothing says where an ID comes from.** The product's difference is the EEG baseline and the page leaves it out. That is a gap against "the research has to be honest", and a surprise at the center. *Fix:* one plain sentence about the headband, "this is part of a research study" (if true for the cohort), and "Your facilitator gives you your ID number". *Command:* `onboard`, with `clarify` for the wording.
- **[P2] The unconfirmed tagline is the H1** (line 38). PRODUCT.md says neither mockup tagline is final, and "Empowering" talks about learners, not to them. *Fix:* a plain "what you will do here" headline, or keep the tagline out until it is decided. *Command:* `clarify`.
- **[P2] Learner sentences are not Atkinson, and the header Sign In is under 48px.** The hero and step text (lines 40 and 64) are DM Sans at 20px and 18px. The header button is about 42px tall (24px text line, `py-2`, 2px border; line 28), under DESIGN.md's 48px, and it is the first tab stop. *Fix:* Atkinson for sentences, and a 48px secondary button in the 700 Label style. *Command:* `typeset`, then `adapt`.
- **[P3] Polish.** The step numerals are deep blue (line 59), but blue means "act" and they are not actions. Spacing uses 96, 80, 96 and 40px (`pt-24`, `pb-20`, `pb-24`, `mb-10`), off the 4 / 8 / 16 / 24 / 32 / 48 / 64 rhythm. There are two Sign In buttons. *Command:* `polish`.

## Cognitive load

One failure out of eight: **grouping.** The facilitator line (69 to 71) reuses the step-row border and spacing, so it reads as a fourth step and mixes two audiences. The other seven checks pass: one focus, three steps, a clear hierarchy, one decision, and no memory load.

## Emotional journey

A nervous learner meets a funder-voice headline, then "preparatory equivalency exam" in step 1, with no word that this is not pass or fail and that a facilitator will be with them. The calm paper and big serif numerals are the high point. The end is a lone Sign In, an unexplained "for facilitators" line and a bare footer, so the visit fades out instead of reassuring.

## Persona red flags

- **Jordan, a first-time learner:** step 1 says "exam" and "inventory" and never says it is not pass or fail. "Readiness profile" (line 11) sounds like a verdict, against the principle that readiness is a starting point. Nothing under the button says "ask your facilitator".
- **An older learner with low vision:** the header Sign In is the smallest and lightest target on the page, and the footer is 14px (line 75). The hero holds up at 200% zoom.
- **A keyboard or screen-reader user:** the first tab stop is the 42px header button. The list and headings are good. Fonts load from a Google `@import` (line 4), so on a slow center connection the page falls back to Georgia and system-ui.

## Gestalt scorecard

Checked against the Gestalt Principles section of `DESIGN.md`.

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Spacing is generous but off the rhythm, and the facilitator line is spaced like a step. |
| Similarity | ⚠️ Partial | Blue numerals look like actions, and a note looks like a step. |
| Continuity | ⚠️ Partial | A centered hero over a left-aligned, narrower list. |
| Figure-Ground | ✅ Follows | Paper ground, hairlines, no shadows, and one saturated button as the figure. |
| Prägnanz (Simplicity) | ✅ Follows | One heading, one sentence, one action, three steps. |
| Symmetry | ✅ Follows | A centered focused column, as DESIGN.md sets for focused tasks. |
| Connectedness | ⚠️ Partial | Each numeral shares a row with its text, but nothing joins one step to the next. |
| Common Region | ⚠️ Partial | No cards, so hairlines do the work, and two audiences share one region. |
| Focal Point | ✅ Follows | The 3.5rem Display heading, then the one saturated button. |
| Common Fate | ⚠️ Partial | A 200ms color change on the default curve, with no press feedback. |

**Follows 4, partial 6, breaks 0.**

### Principles it follows

- **Figure-Ground ✅:** the ground is paper (`#F8F6F2`), the header and footer are white bands with a hairline, and nothing has a shadow (the Flat Workbook Rule). The hero button is the one saturated block, so it is the figure.
- **Prägnanz ✅:** the hero is one H1, one sentence and one button (lines 36 to 49), and the list is three short steps. There is no decoration. The only repetition is the second Sign In button in the header.
- **Symmetry ✅:** the hero is a centered column (`text-center max-w-4xl mx-auto`), which DESIGN.md gives to focused tasks, and the single button sits on the axis.
- **Focal Point ✅:** the Display heading at 3.5rem leads, and the 60px deep-blue button is the only saturated element. Amber appears only as the text-selection color, so it does not compete.

### Principles it partly follows

- **Proximity ⚠️:** inside the hero, the heading is 24px above the sentence (`mb-6`) and the sentence is 40px above the button (`mb-10`), so the button reads as its own unit. Each step is 24px of padding with a 24px gap between numeral and text, which is on the rhythm. But the section gaps are 96px (`pt-24`), 80px (`pb-20`) and 96px (`pb-24`), which are not on DESIGN.md's scale (4 / 8 / 16 / 24 / 32 / 48 / 64), and the facilitator line has the same 24px top rule and padding as a step, so it is spaced as if it belonged to the list.
- **Similarity ⚠️:** the two Sign In buttons differ on purpose (outline at weight 500 in the header, solid at 700 in the hero), but the weight difference is not a system rule. The step numerals use deep blue (line 59), the same blue as the buttons, so a number looks as actionable as a button; DESIGN.md's One Job Rule gives blue to "act here". The facilitator line is styled like a step, so it looks like one.
- **Continuity ⚠️:** the hero is centered and the steps are left-aligned in a narrower column (`max-w-2xl`, line 52). The eye has to find a new left edge between the two, and the headline's center axis does not continue into the list.
- **Connectedness ⚠️:** a numeral shares a row with its title and sentence, and a hairline above each row joins the three as a set. But the order is shown by the numerals alone, with no line or shape joining step 1 to step 2 to step 3. The hub's timeline now does this; the landing page does not.
- **Common Region ⚠️:** there are no cards. Hairlines separate the steps and the facilitator line, which suits a flat page. But learners and facilitators, two audiences with different needs, share one region and one rule style, so the note reads as part of the steps.
- **Common Fate ⚠️:** both buttons change color over 200ms (`transition-colors duration-200`) on the browser's default curve, not DESIGN.md's `cubic-bezier(0.23, 1, 0.32, 1)`, and there is no press feedback. The login page does use the shared curve and a press scale, so the two pages differ.

## Checks against DESIGN.md and PRODUCT.md

- **Learner text:** the hero sentence (20px) and the step sentences (18px) meet the size minimum but are DM Sans, not Atkinson Hyperlegible, which DESIGN.md sets for every learner-facing sentence. The footer text is 14px, under the 15px label minimum.
- **Buttons:** the hero button (60px) passes. The header button (about 42px) fails the 48px minimum.
- **Shadows and contrast:** none, as the system asks. Body, muted and placeholder text meet the contrast table.
- **Claims:** no invented claims. "Your results show how ready you are" (line 11) leans toward a verdict, and "readiness is a starting point, not a verdict" is not said anywhere.
- **ALS and AIS:** "Alternative Learning System" is spelled out in the H1, but "ALS learners" follows in the next line and "AIS teachers" (line 70) is never expanded.
- **Tagline:** the H1 reuses "Empowering", which PRODUCT.md lists as unconfirmed.
- **Where an ID comes from:** PRODUCT.md says there is no self-registration. The page does not say that IDs come from a facilitator.

## Minor observations

- The font `@import` is injected inside render (line 23), and the DM fonts are still external, so an offline center falls back to Georgia and system-ui.
- `min-h-screen` is used here and `min-h-[100dvh]` on the sign-in page.
- The footer ("© 2026 ALSense") says nothing about who runs the study or how to reach them.

## Questions to consider

1. Does a landing page earn its place, or should a learner sent from a center land straight on a sign-in page that says "Your facilitator gave you an ID"?
2. If the tagline is unconfirmed, why is it the largest text on the first screen?
3. Would an adult learner call this a "readiness profile", or is that a thesis term the interface is borrowing?

## What a rebuild would need

This is a direction, not a spec. It is not implemented in this file.

1. **Plain words:** rewrite the headline and the three steps in what the learner does, and drop "modality", "analytics" and "preparatory equivalency exam" from the first screen.
2. **Say what to bring:** one line that the facilitator gives out the ID number, and one about the Muse 2 headband and the study.
3. **Atkinson and 48px:** learner sentences in Atkinson at 18px or more, a 48px header button, and a 16px or larger footer.
4. **One job per color:** make the step numerals ink (or draw the order with a line like the pre-test hub) so blue only means "act".
5. **Separate the audiences:** give the facilitator line its own region, or move it to the footer.
6. **Shared motion:** the same 150ms curve and press scale as the sign-in page.
