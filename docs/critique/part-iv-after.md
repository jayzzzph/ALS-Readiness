# Part IV Baseline EEG Recording Screen: Gestalt Critique (After)

- **Target:** `frontend/src/app/components/diagnostic/BaselineEegRecording.tsx` (704 lines), the rebuilt Part IV screen, with its recording logic in `frontend/src/app/features/eeg/useEegSession.ts` (283 lines) and the four Muse 2 drivers beside it (`muse2-ble.js`, `eeg-stream.js`, `recorder.js`, `mock-muse.js`, copied unchanged from the Muse 2 EEG Recorder package). It uses `AttemptShell` from `PretestAttempts.tsx`, which gained two optional props (`maxWidth`, `compact`) for this screen.
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`) and the Product Principles in `PRODUCT.md`. The same method as `part-iv-before.md`.
- **Date:** 2026-10-06, branch `eeg-part-iv`, code at commit `f6f42b6a`. The screen was built over `f4440513`, `88379d53`, `6cd7bde0`, `59bcfca3`, `d1e90eea` and `f6f42b6a`.
- **Evidence:** the source code, plus four screenshots taken for this review. All are real PNGs, viewport only, 1366 × 768 at device scale factor 1. The screen was mounted directly in a throwaway harness (no login) and driven with the dev-only demo signal. The "Demo sensors" control that forces sensor states was hidden in the pictures, since it is a test tool and not part of the product. The harness was removed afterwards. The recordings in these pictures are the synthetic demo signal, not a person.
  - `part-iv-after-setup.png`: setup, step 1, before anything is connected. The rail shows step 1 expanded and the other three collapsed. The card holds the first guide frame ("Turn it on"), three step dots with the first active, a pause button and the deep-blue "The headband is on" button. The navy sensor card shows the head map with all four sensors "Waiting" and a "Not connected" pill. The live signal card sits below it, with its "Zoom: Normal · ±100 µV" control and an empty message.
  - `part-iv-after-fit.png`: setup, step 3 with the demo signal connected and AF7 forced to Poor. Steps 1 and 2 are collapsed with checks. The card shows the "Move hair away from the forehead" frame and caption, "3 of 4 sensors ready", and only the quiet "Continue with a weak signal" link. The head map shows AF7 Poor (red, with a warning icon and the word), AF8 and TP10 Good, TP9 Fair. The live signal shows four traces.
  - `part-iv-after-recording.png`: recording, with the countdown at 00:10. A large ring, "Sit still and relax." under it, four chips (all Good, forced for this picture), "Show signal" at the left and a quiet "Cancel recording" at the right.
  - `part-iv-after-done.png`: "Baseline recorded", "15 seconds recorded.", the note that recordings can't be uploaded yet, "Back to pre-test" as the primary button and "Export CSV" as secondary.
- **Also checked in a browser (not in a picture):** at a true 1366 × 768 and 1920 × 1080 viewport with the demo signal, every setup step, the recording view with the signal open and the done card fit without scrolling (page height 736 to 760 px of 768 at the tightest). The guide loop runs about 2.5 s a frame, a dot pauses on its frame, the loop holds in a hidden tab and stops when step 1 ends. Each step 3 state (Waiting, Fair, TP9 Poor, AF7 Poor, All Good) shows the expected frame, caption and button, and step 3 does not advance by itself. Under reduced motion the wear guide shows its three frames side by side. The smallest text measured in the step cards, the live signal card and the recording view is 15px. The design skill's automated check (`impeccable detect`) found nothing on the screen file after the first rebuild (`88379d53`); it was not rerun on the later commits.
- **Not checked:** a real Muse 2, a keyboard-only walk-through, a screen reader, widths below 1280px, reduced motion on the countdown ring and sensor chips (it is in the code only), or any browser except Chrome.
- **Scope:** this is a focused Gestalt review done by one reviewer, the same as the before file. It isn't the full multi-reviewer `impeccable critique`.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Groups read clearly, but cards pad 20px instead of 32px and several gaps (12px, 20px) are off the rhythm. |
| Similarity | ✅ Follows | Blue means act, amber means you are here, navy means sensor, and Good, Fair and Poor use the readiness scale with a word and an icon. |
| Continuity | ✅ Follows | The rail runs top to bottom with one action per step, and recording and done are single centered columns. |
| Figure-Ground | ✅ Follows | Paper ground, flat hairline cards, and navy kept for the sensor, with white rings that keep the circles readable on it. |
| Prägnanz (Simplicity) | ⚠️ Partial | Recording and done are very simple, but setup shows the guide, a head map, a live signal and five or more controls at once. |
| Symmetry | ⚠️ Partial | Centered columns and a balanced footer row, but the recording and done views sit high and leave the lower 40% empty. |
| Connectedness | ✅ Follows | Leader lines join each sensor to its word, the rail line joins the steps, and chips, ring and time are each one object. |
| Common Region | ✅ Follows | A header bar, one card per topic, no nested cards, and tinted regions for banners and errors. |
| Focal Point | ⚠️ Partial | The ring and the "Baseline recorded" heading lead, but in setup the navy head map competes with the current step. |
| Common Fate | ⚠️ Partial | Parts that change together change together, but some durations (250ms, 600ms) are outside DESIGN.md's 150 to 200ms. |

**Follows 5, partial 5, breaks 0.** The before version followed 1, partly followed 5 and broke 4.

## Principles it follows

### Similarity ✅
- **Blue means act:** the one primary button of each step (`The headband is on`, `Pair Muse 2`, `Continue to recording`, `Start 15-second recording`, `Back to pre-test`) is deep blue. Secondary actions (`Export CSV`, `Continue with a weaker signal`) are outlined. The step dots, the pause button and "Show signal" use the same blue as the other controls.
- **Amber means you are here:** the current step's marker is amber with ink text, the same as the pre-test hub timeline, and done steps are blue with a check.
- **Navy means sensor:** the head map card is Instrument Navy, and nothing else on the screen is navy.
- **One scale for contact quality:** Good is blue, Fair is amber ink and Poor is error red, following the Readiness Scale Rule. Every state also has a word and an icon (a check, a minus, a warning triangle), so quality never relies on color alone. A lost connection uses the same error red.
- **Pairs match:** the connection pill, the battery text and the sensor pills share one style.
- **Watch point:** the Good chips on the recording view are blue, the same hue as the action buttons. They are not buttons, but the hue is shared. The icon and word carry the meaning, and the chip fill is the light Blue Wash, not the button's fill.

### Continuity ✅
- **Setup:** the rail reads top to bottom (put on, pair, check the fit, record), with a thin line between the markers. In each expanded card the path runs title, picture, caption, then the controls row with the one action at its right end.
- **Recording:** one centered 768px column from the ring, down through "Sit still and relax.", the sensor chips, and a single row with "Show signal" and "Cancel recording".
- **Done:** one centered card, with the primary action first and Export CSV beside it.
- **The step moves only when the facilitator moves it:** step 3 no longer advances by itself, so the path never changes under the facilitator's eyes.

### Figure-Ground ✅
- **Ground and figure:** the ground is warm paper `#F8F6F2` (via `AttemptShell`). Cards are white with a 1px hairline and no shadow. The navy sensor card is the strongest figure, as the sensor should be.
- **Readable on navy:** each sensor circle has a white ring and an icon, so a blue or red fill stays visible on navy. Labels use white and `#D9DBEA` on `#1C1D33`.
- **The pictures sit in the page:** the guide images are drawn on the paper color, so they appear as a soft panel inside the white card, with no hard rectangle.
- **The one floating layer:** the toast ("CSV exported", "Recording cancelled and deleted") is a dark pill that floats above the page.

### Connectedness ✅
- **Sensors and their words:** a thin leader line joins each circle on the head to its name, its place ("Left forehead") and its word, which sit outside the head so nothing overlaps the circles or the outline.
- **The rail:** the markers are joined by a line that is blue for done steps and gray for the rest, as on the hub timeline.
- **Chips:** each chip joins an icon, the sensor name and the word in one shape.
- **Ring and time:** the countdown sits inside its ring, and the blue arc is the time left, so the number and the shape are one object.
- **Guide:** the picture, its caption, the dots and the pause button are stacked in one group with 4 to 8px between them.

### Common Region ✅
- **A header region:** the white `AttemptShell` header holds the wordmark, "Part IV: Baseline EEG recording" and "Exit", the same as the strand question screen.
- **One card per topic:** the current step, the sensor head map and the live signal each have their own card. Cards don't nest. The guide picture is an inset panel and not a second card.
- **Banners:** a dropped connection, a lost connection and a recovered recording each get their own tinted region (error tint with a red border, or a neutral gray for the recovery notice), above the content.

## Principles it partly follows

### Proximity ⚠️
- **Holds:** the picture, its caption (8px below) and the controls row (4px below) read as one group. The rail's steps are 20px apart and the sensor card's content is 24px from its edge. The label next to each sensor sits right beside it.
- **Off the rhythm:** the step card pads 20px (`p-5`) where DESIGN.md asks for 32px (24px for denser screens). Gaps of 12px (`mt-3`) and 20px (`pb-5`) are not on the 4 / 8 / 16 / 24 / 32 rhythm. These were tightened on purpose, so that every step fits a 1366 × 768 screen without scrolling.
- **The count and the buttons:** in step 3, "3 of 4 sensors ready" sits on its own row at the right, with the buttons 8px below it. It could sit nearer to the head map, which is where the facilitator is reading the sensors.

### Prägnanz (Simplicity) ⚠️
- **Holds in recording and done:** the recording view has one number, one sentence for the learner, four chips, and two quiet controls. The done view has a heading, one line of fact, and two buttons. Both follow "one task at a time".
- **Setup carries a lot:** at one time the facilitator sees the rail (four steps), a guide with a picture, a caption, three dots, a pause button and the step's button, the navy card with a connection pill, a battery reading and four sensors, and a live signal with a Zoom control. That is more than ten controls and readouts on one screen, even though the current step has only one primary action.
- **Plain words:** "Pair Muse 2", "Check the fit", "Good fit. Ask the learner to sit still and relax." The Zoom control uses Small, Normal and Large with the µV range as a secondary label. The range ("±100 µV") is the one place technical language stays.
- **One state, one display:** each fact now has one place. The connection is the pill, the sensor quality is the head map and the chips, and the time left is the ring. This fixes the five-way repetition in the before version.

### Symmetry ⚠️
- **Holds:** the recording and done views are centered columns. "Show signal" and "Cancel recording" balance each other at opposite ends of one row.
- **The composition sits high:** on a 1366 × 768 screen, the recording view's content ends at about y = 460 and the done card at about y = 480, which leaves the lower 40% of the screen empty. On a larger screen the gap is larger still.
- **Setup is asymmetric by design:** the rail (32rem) and the sensor column are unequal, as DESIGN.md allows for a dashboard-like layout, and the tallest column (the rail on step 3) sets the page height.

### Focal Point ⚠️
- **Recording and done lead clearly:** the 3.5rem serif countdown inside the ring is the focal point of the recording view, and "Baseline recorded" at 2rem serif is the focal point of the done card. The quiet Cancel is a text link.
- **Setup has two competing leaders:** the navy head map card is the largest and highest-contrast shape on screen, and it sits next to the expanded step card that holds the action. In `part-iv-after-fit.png`, the red warning circle on a navy card draws the eye before the caption and the quiet link. That is partly right (the problem is on the head), but the facilitator's next action is on the left.
- **The quiet link is quiet on purpose:** with a Poor sensor, the step offers only "Continue with a weak signal" as a text link, so the way forward is easy to miss. That matches the intent (fix the fit first), but it makes the focal point the problem and not the next step.

### Common Fate ⚠️
- **Holds:** when a sensor's level changes, its circle, icon, pill word and chip update in the same render. The guide's next frame fades in and the caption changes with it. When the headband is on, the step card and the rail marker change together.
- **Timing:** the guide's crossfade is 600ms on `cubic-bezier(0.23, 1, 0.32, 1)` with a 2.5s hold, the dots and chips are 200ms, the step card entrance is 200ms and the ring updates over 250ms. 250ms and 600ms are outside DESIGN.md's 150 to 200ms. The 2.5s loop and the soft crossfade were requested, but they are still exceptions.
- **The head map doesn't animate:** a sensor's SVG fill, icon and pill word change instantly. They change together, but with no transition.
- **Reduced motion:** the guide is checked in a browser. Without motion it shows its frames side by side, a pinned frame switches instantly, and the loop stops. The ring, chips and card entrance use `motion-reduce` utilities, but that wasn't checked in a browser for this review.

## What the rebuild changed outside the Gestalt list

| Issue (from the before file) | Before | After |
|---|---|---|
| The screen was a simulation | Timers and a flag; no Bluetooth, no signal, nothing saved; said "Recording captured" anyway | Real Web Bluetooth pairing, sensor contact checks, a fixed-length recording that stops by itself, Cancel, reconnect, recovery and CSV export. It says only what was measured, and says plainly that upload isn't available yet |
| Text size | 12px stage labels, spec rows and instructions; 14px subtitle | 15px minimum everywhere measured; sentences the learner reads at 18px in Atkinson Hyperlegible |
| Wrong audience in the copy | One text spoke to the facilitator and the learner ("your forehead") | Instructions are for the facilitator, with one learner line during recording: "Sit still and relax." |
| Em dash and the duplicated name | "Baseline EEG Recording — Muse 2 Headband" | The header reads "Part IV: Baseline EEG recording"; no em dashes in the screen's text |
| Focus style | None set | A 2px deep-blue outline with a 2px offset on every control |
| Contrast | Stage labels at 2.54:1 (`#9CA3AF`) | No gray-400; muted text is `#4A4F5C` |
| Color carried the state | A green or gray icon plus the words | Every sensor state has a word and an icon, and the connection pill has a word |
| Fits one screen | Yes (1366 × 768) | Yes, with more on it (page height 736 to 760 px of 768 in setup) |
| Motion | Four things animating at once, none guarded | One authored motion at a time, with reduced-motion handling for the guide |

## Before / after

| Principle | Before | After | What changed |
|---|---|---|---|
| Proximity | ⚠️ Partial | ⚠️ Partial | The action now sits with its instruction and its picture. Cards pad 20px and a few gaps are off the rhythm, so the score stays partial. |
| Similarity | ❌ Breaks | ✅ Follows | Four active colors and two primary buttons became blue = act, amber = here, navy = sensor and the readiness scale for contact, always with a word and an icon. |
| Continuity | ⚠️ Partial | ✅ Follows | A rail that runs top to bottom, with one action per step. Recording and done are single columns. |
| Figure-Ground | ❌ Breaks | ✅ Follows | Gray ground and 1.1:1 borders became paper and flat hairline cards. Navy is kept for the sensor. |
| Prägnanz | ❌ Breaks | ⚠️ Partial | One state in five places became one state in one place. Setup still shows a lot at once. |
| Symmetry | ⚠️ Partial | ⚠️ Partial | Centered focused views, but the lower 40% is empty at 1366 × 768. |
| Connectedness | ✅ Follows | ✅ Follows | Leader lines, a joined rail, and chips and ring that are each one object. |
| Common Region | ⚠️ Partial | ✅ Follows | A white header region, one card per topic, no gradient banner. |
| Focal Point | ❌ Breaks | ⚠️ Partial | The ring and the result lead. In setup the navy card still competes with the step. |
| Common Fate | ⚠️ Partial | ⚠️ Partial | One curve and reduced motion for the guide. Some durations are outside 150 to 200ms. |
| **Total** | **1 follows, 5 partial, 4 break** | **5 follow, 5 partial, 0 break** | |

## Still open

These are not Gestalt findings. They need a decision or more work before this is a finished feature.

- **No upload endpoint.** The backend has no EEG endpoint, so the only way out is Export CSV. A recording that is never exported stays in the browser's IndexedDB on that computer (the screen offers it back the next time Part IV opens). The backend needs an authenticated upload (the spec is in `docs/pr-eeg-part-iv.md`). Until then the done screen says "ALSense can't upload recordings yet."
- **The 15-second length is a placeholder.** `BASELINE_SECONDS = 15` came from the old screen's `RECORD_DURATION_MS`, which was commented "testing". It is not a protocol value. The real length has to come from the study, and it is one constant to change.
- **Not tested on a real Muse 2.** Everything here was exercised with the demo signal. Web Bluetooth pairing, real contact quality, the reconnect path and the battery reading are untested on hardware. The contact thresholds (`QUALITY_THRESHOLDS` in `eeg-stream.js`) are heuristics to tune on real learners, and the demo signal never reports a Poor sensor on its own.
- **Part IV status in the hub is still hardcoded.** `partDone[3]` is `false` (`DiagnosticTest.tsx`, line 143), so the hub never shows Part IV as done. "Back to pre-test" returns to the hub, and the old "Finish pre-test" path to stimulus content is no longer called. This needs a server-side flag.
- **Composition at 1366 × 768.** The recording and done views leave the lower 40% empty. Centering the content vertically would fix it, at the cost of moving it when a banner appears.
- **Setup competes for focus.** The navy card and the step card both lead. Making the navy card quieter until a sensor is connected would help.
- **Spacing exceptions.** The 20px card padding and 12px gaps were chosen to fit one screen. A longer-term fix is a smaller guide image or two columns inside the card, so the padding can return to 24px or 32px.
- **Browsers.** Web Bluetooth works only in Chrome and Edge on a computer. Other browsers get a plain note, and the demo signal is available only in development.
- **Learner code.** The recording is saved under the learner's internal numeric account id (`user.raw.id`) because no anonymized code exists in the app yet. A real anonymized code, and a consent step for EEG data (RA 10173), are still needed.
- **Screenshots.** The pictures don't show the guide's motion, the reduced-motion layout, step 2, step 4, the reconnect and lost banners, the cancel confirmation or a recording that stopped early. They were checked in a browser, not captured.
