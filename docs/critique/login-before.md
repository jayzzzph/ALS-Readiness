# Sign-in Page: Design Critique (Before)

Method: dual-agent. Assessment A (design review) and Assessment B (deterministic detector scan) ran as two isolated sub-agents. A did not run the detector, and B did not give design opinions. The Gestalt scoring below was done by the main reviewer after both came back.

- **Target:** `frontend/src/app/components/auth/LoginPage.tsx` (166 lines). The sign-in form, reached from the landing page. Mode: Operate.
- **Checked against:** `DESIGN.md` (including its Gestalt Principles section) and `PRODUCT.md`.
- **Date:** 2026-10-05, branch `ui-polish`, code at commit `f1e951d3` (the file was last changed in `25fb0a79`, the login interaction polish).
- **Evidence:** the source code only. No browser was opened and no screenshot was taken, so spacing, focus and the error animation are read from the code, not seen. The detector (`impeccable detect`) found nothing: exit code 0, `[]`. So every finding below comes from reading, not from the detector.
- **Scope:** a critique, not a fix. No code was changed for this file. This page is the reference DESIGN.md's own Gestalt examples were taken from, so it scores well; the findings are about what it leaves out.

## Design health score

All ten heuristics apply to a form.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | A spinner, `aria-busy` and "Signing in…" (lines 140 to 155). Nothing explains a forced password change. |
| 2 | Match between system and real world | 3 | Plain wording, but "ID Number" has no source or format hint beyond the placeholder. |
| 3 | User control and freedom | 3 | "Back to Home" (67 to 73) and a show-password toggle. |
| 4 | Consistency and standards | 3 | Mostly on spec. The toggle is 44px (129) and labels are Title Case against sentence-case copy. |
| 5 | Error prevention | 2 | The ID is not trimmed (`login(idNo, password)`, line 47), so a pasted trailing space fails. The format lives only in the placeholder (101). |
| 6 | Recognition rather than recall | 3 | Labels are visible, but the format hint disappears once the learner types. |
| 7 | Flexibility and efficiency | 3 | `autoComplete` is set and Enter submits. |
| 8 | Aesthetic and minimalist design | 3 | The subtitle (77) repeats the labels, and the password placeholder (119) repeats "Password". |
| 9 | Help users recover from errors | 2 | Messages (39, 51) are generic, do not say which field, do not move focus, and mark both fields invalid (102, 120). |
| 10 | Help and documentation | 1 | No "forgot password", no "ask your facilitator", no contact. |
| **Total** | | **26/40** | **Acceptable (65%)** |

## Design specificity verdict

**Mostly authored.**
- **Authored:** the 448px centered card, the single deep-blue button as the only saturated element, Atkinson sentences at 18px and the error panel built from DESIGN.md's error tokens follow the system closely.
- **Interchangeable:** the copy and flow are standard sign-in boilerplate. Nothing speaks to the learning center, the facilitator or the ID-number context.
- **Deterministic scan:** clean (0 findings, exit 0). The detector does not check for missing help or error wording, so it says nothing about the issues below.

## Overall impression

It is the best-built screen in the app: calm, flat, accessible, with real care in the details. Its weakness is not how it looks but what happens when something goes wrong. A learner who mistypes gets a generic red box and no human route, in a product where the facilitator is the only help and nobody can reset a password themselves. The biggest opportunity is the failure path.

## What's working

- **Accessibility mechanics:** visible labels, `role="alert"` with `aria-describedby`, `autocomplete`, `tabular-nums` on the ID, reduced-motion handling, 48px fields and button, and motion under 200ms.
- **Flat and exact:** a hairline card, 16px corners, no shadow, focus outlines on the button and links. The 8px label gap and 24px field gap (`mb-2`, `space-y-6`, lines 92 and 90) are the DESIGN.md Proximity example.
- **Plain error text:** set in Atkinson at 18px in the error tint with an icon (line 86).

## Priority issues

- **[P1] Error recovery is generic** (lines 38 to 41, 51, 102, 120). The empty-submit message does not name the missing field, focus does not move to it, and a failed sign-in gives no next step. Both fields are marked invalid for any error. *Fix:* field-specific messages with focus on the first invalid field, and wording for wrong credentials like "Check your ID number (it looks like 2026-00001) or ask your facilitator." *Command:* `harden`.
- **[P1] No help path.** There is no "forgot password" and no line about where the ID comes from. PRODUCT.md says there is no self-registration, and there is no self-serve reset, so the facilitator is the only route, and the page does not point to them. *Fix:* one line under the button, "Forgot your password or ID? Ask your facilitator." *Command:* `onboard`, with `clarify`.
- **[P2] The ID format is placeholder-only and the input is untrimmed** (lines 47, 101). *Fix:* helper text under the label, `.trim()` on submit, and `inputMode` if it fits the format. *Command:* `harden`.
- **[P2] Two targets are under the 48px minimum.** The show-password button is 44px (line 129). "Back to Home" (line 70) is about 30px tall (`py-1` plus a 20px icon), small and above the card. *Fix:* 48px for both, or a full-size secondary button. *Command:* `adapt`.
- **[P3] Redundant copy and off-scale spacing.** The subtitle (77) repeats the labels, the password placeholder (119) repeats the label, `mb-7` and `mb-5` are 28px and 20px, off the rhythm, and the header wordmark is not a link. *Command:* `distill` or `polish`.

## Cognitive load

One failure out of eight: **working memory.** The ID format is in a placeholder that vanishes when the learner types, and the page does not say where the ID comes from. The other seven checks pass: one focus, two fields, one button, a clear hierarchy.

## Emotional journey

The calm card with one button reads as safe, and that is the high point. A failed sign-in is the low point: "Unable to sign in. Please try again." (line 51) leaves a nervous learner with a red box and no human route, so the visit ends on blame instead of help.

## Persona red flags

- **Jordan, a first-time learner:** if the ID is typed with a space, or a password change is forced, the page gives a generic error and no guidance. Nothing says "your facilitator has your ID".
- **An older learner with low vision:** "Back to Home" and the eye toggle are the smallest targets. The input focus ring is a 30% blue (line 25), and the border change from `#8A8F9C` to deep blue is the main cue.
- **A keyboard or screen-reader user:** a failed submit is announced by `role="alert"` (good), but focus stays on the button, so the user cannot tell which field to fix, and both fields are announced as invalid. The toggle's `aria-label` is correct.

## Gestalt scorecard

Checked against the Gestalt Principles section of `DESIGN.md`.

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ✅ Follows | 8px label gap, 24px field gap, 32px card padding. A few gaps (20px, 28px) are off the scale. |
| Similarity | ✅ Follows | One input shape, one button, one error panel. |
| Continuity | ✅ Follows | One 448px column read top to bottom on one left edge. |
| Figure-Ground | ✅ Follows | One white card on paper, hairline, no shadow, and the error in its own tint. |
| Prägnanz (Simplicity) | ✅ Follows | One heading, two fields, one button, with a little repeated copy. |
| Symmetry | ✅ Follows | A centered card, as DESIGN.md sets for sign-in. |
| Connectedness | ⚠️ Partial | Icons join their fields, but the error is not joined to the field at fault. |
| Common Region | ✅ Follows | One card, with the error as its own tinted region above the fields. |
| Focal Point | ✅ Follows | The deep-blue button is the only saturated element. |
| Common Fate | ✅ Follows | The error fades in as the field borders change, on one 150 to 200ms curve (from code). |

**Follows 9, partial 1, breaks 0.**

### Principles it follows

- **Proximity ✅:** each label is 8px above its input (`mb-2`, line 19) and the two field groups are 24px apart (`space-y-6`, line 90), which is the DESIGN.md example. The card pads 32px (`p-8`, line 75), and the heading has 32px above and 8px below. The off-scale gaps are the back link to the card (`mb-5`, 20px, line 70) and the subtitle to the form (`mb-7`, 28px, line 77).
- **Similarity ✅:** both fields share `inputClass` (48px, 12px corners, field-stroke border), and the one button uses the same deep blue and 12px corners as the primary buttons elsewhere. The labels are the Label style (15px, 700). Small differences: labels are DM Sans while the sentences are Atkinson, which is the intended split.
- **Continuity ✅:** a single 28rem column (line 66) reads back link, heading, sentence, error, fields, button. The back link is pulled left (`-ml-1`) to share the card's left edge.
- **Figure-Ground ✅:** paper ground, one white card with a 1px hairline and no shadow, and an error tint (`#FDECEA` with a `#B42318` border) that stands out as its own figure.
- **Prägnanz ✅:** one heading, two fields and one button, which DESIGN.md names as its own example. The repeats (subtitle and password placeholder) are small.
- **Symmetry ✅:** a centered card with matching full-width controls, as DESIGN.md sets for sign-in.
- **Common Region ✅:** one card holds the task, and the error is a separate tinted region above the fields it refers to.
- **Focal Point ✅:** the eye goes from the "Sign In" heading to the deep-blue button, the only saturated element.
- **Common Fate ✅ (from code):** the error panel fades and slides over 200ms (line 83) while the field borders change over 150ms, both on `cubic-bezier(0.23, 1, 0.32, 1)`, so message and fields change together. The password icons crossfade as one control, and spinners and presses honor reduced motion. I did not check this in a browser.

### Principle it partly follows

- **Connectedness ⚠️:** the leading icons sit inside their fields, joining icon to input, and the toggle sits inside the password field. But the error panel is above the whole form, and both inputs get `aria-invalid` and the same `aria-describedby` for any error (lines 102 to 103 and 120 to 121). Nothing joins the message to the one field that is wrong, so the learner has to work out which field it is.

## Checks against DESIGN.md and PRODUCT.md

- **Learner text:** sentences are Atkinson 18px (the subtitle and the error), and input text is `text-lg` (18px) but inherits DM Sans (line 24).
- **Controls:** the inputs and the button are 48px and pass. The toggle (44px) and the back link (about 30px) fail the 48px minimum.
- **Color jobs, shadows and contrast:** deep blue is used only for the action, focus and links, there are no shadows, and all text meets the contrast table.
- **Claims:** none. The page makes no claims about the study.
- **Plain words:** "Sign In", "ID Number" and "Password" are plain. "Enter your ID number and password." is clear.
- **No self-registration or reset path:** PRODUCT.md says accounts are set by an admin, and a forced password change on first sign-in is possible. The page does not mention either.

## Minor observations

- The font `@import` is injected inside render (line 59) and the DM fonts are still external, so an offline center falls back to Georgia and system-ui.
- Labels are Title Case ("ID Number") against sentence-case body copy.
- The footer ("© 2026 ALSense") says nothing about who runs the study or how to reach them.
- The hero on the landing page and this page switch alignment and viewport units (`min-h-screen` against `min-h-[100dvh]`).

## Questions to consider

1. If nobody can reset their own password, what should the page say to someone who has forgotten it?
2. Should the first sign-in ask for a new password on this page, and say so, instead of surprising the learner after submit?
3. Does a learner who fails twice at a center need a "Ask your facilitator" button more than a third "Try again"?

## What a rebuild would need

This is a direction, not a spec. It is not implemented in this file. The page needs little change; the work is in the failure path.

1. **Field-specific errors:** name the missing or wrong field, mark only that field invalid, and move focus to it.
2. **A human route:** one line under the button, "Forgot your password or ID? Ask your facilitator."
3. **Format help that stays:** helper text for the ID format under the label, and trim the ID on submit.
4. **48px targets:** the show-password button and "Back to Home".
5. **Cut the repeats:** drop the password placeholder, and shorten or remove the subtitle.
