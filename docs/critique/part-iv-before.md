# Part IV Baseline EEG Recording Screen: Gestalt Critique (Before)

- **Target:** `frontend/src/app/components/diagnostic/BaselineEegRecording.tsx` (230 lines), the Part IV screen of the pre-test. It is opened from `DiagnosticTest.tsx` (line 127) when the learner presses "Start Recording" on Part IV, and it renders full screen, outside `AppLayout`.
- **Checked against:** the Gestalt Principles section of `DESIGN.md` (commit `c87b0624`) and the Product Principles in `PRODUCT.md`. The same method as `pretest-question-before.md`.
- **Date:** 2026-10-06, branch `ui-polish`, code at commit `4b84220f` (the file was last changed in `cb2c0ebc`).
- **Evidence:** the source code, plus two screenshots taken for this review. Both are real PNGs, viewport only, 1366 × 768 at device scale factor 1. The screen was mounted directly in a throwaway harness (no login) from a temporary git worktree of `ui-polish`. The worktree and harness were removed afterwards, and nothing in the app was changed.
  - `part-iv-before-1.png`: the screen before "Connect Headband" is pressed. A dark gradient header with a "Not Connected" icon, a Muse 2 card with a headband drawing, four spec rows and the indigo "Connect Headband" button, a "Capture Stages" list in faded gray, a dark "Device Recording" panel that says "Waiting to start", and a "Setup Instructions" card with five steps.
  - `part-iv-before-2.png`: the same screen about six seconds after pressing "Connect Headband", in the recording stage. The header badge is green and says "Connected". The device card shows a "Recording Baseline EEG…" chip with a spinner. The stage list shows a green check and an indigo active stage. The dark panel shows a pulsing cyan icon, a monospace "00:12", and "Baseline recording in progress — stay relaxed and still". An "Overall Progress" bar below it reads 41%.
- **Scope:** this is a focused Gestalt review done by one reviewer. It isn't the full multi-reviewer `impeccable critique`. The next section is a functional finding that matters more than anything visual.

## The screen is a simulation (functional finding)

Before any design score: **this screen does not record anything.** It only looks like it does.

- **"Connect Headband" connects nothing.** `handleConnect` (lines 49–53) sets `connected` to true and starts a timer. There is no Bluetooth call and no device.
- **No signal is read, drawn or stored.** The file's own comment says the waveform was removed (lines 6–8). The "recording" is a set of timers: calibrate for 3 seconds, "record" for 15 seconds (`RECORD_DURATION_MS = 15_000`, line 11, commented "hardcoded baseline recording length - 15s (testing)"), then "Processing Baseline Data" for 4 seconds (lines 13–19, 33–47). Nothing is collected in the processing stage either.
- **It reports a capture that never happened.** When the timers finish, the panel says "Recording captured" (line 169), and the done card says "Baseline Recording Complete" and "15-second baseline EEG captured" (lines 194–195). `PRODUCT.md` Product Principle 1 is "The research has to be honest. Show what was measured and how." This screen shows something as measured when nothing was.
- **The device facts are hardcoded text.** "Bluetooth Low Energy", "256 Hz" and "4-channel EEG (TP9, AF7, AF8, TP10)" (line 106) are fixed strings. They describe a device the screen never contacted.
- **Part IV can be "finished" with no EEG at all.** "Finish pre-test" calls `onComplete`, which navigates to `stimulus-content` (`DiagnosticTest.tsx`, line 127). The hub never learns that Part IV was done (`partDone[3]` is hardcoded `false`, line 143). `PRODUCT.md` says success right now means the research pipeline works end to end. This screen is the one place the pipeline should receive EEG, and it can't.
- **None of the real states exist.** There is no failure to connect, no lost connection, no sensor contact check, no way to cancel a recording, and nothing to recover if the tab closes. A learner with a poor sensor and a learner with no headband on get the same result.
- **The setup instructions can't be checked.** "Wait for the LED to blink blue" (line 213) is good advice, but the screen has no way to know whether it happened.

The score below covers the visual design only. Fixing the design without fixing this would only make the simulation more convincing.

> This screen still uses the **old** visual system: a cool gray ground, indigo `#3535C5` for actions and state, Tailwind grays, green for success, and a dark gradient banner. DESIGN.md treats that system as legacy. Several of the "breaks" below come from that.

## Scorecard

| Principle | Verdict | One-line reason |
|---|---|---|
| Proximity | ⚠️ Partial | Each card groups one topic, but the Connect button is far from the instructions that tell the learner to press it. |
| Similarity | ❌ Breaks | Indigo, green, cyan and light blue all mean something. The Connect and Finish buttons are different colors. |
| Continuity | ⚠️ Partial | It reads in two columns, but the task path (read the steps, then connect) runs right to left. |
| Figure-Ground | ❌ Breaks | Cool gray ground, near-invisible card borders, and stage labels at 2.54:1 that fade into the card. |
| Prägnanz (Simplicity) | ❌ Breaks | One state is shown in five places, and the screen lists specs the facilitator doesn't need. |
| Symmetry | ⚠️ Partial | The columns balance in height, but the header and panels are lopsided in weight. |
| Connectedness | ✅ Follows | The progress fill sits on its track with its value on the row, and each stage joins its marker and label. |
| Common Region | ⚠️ Partial | Cards hold one topic each, but there is no header region and two heavy dark regions dominate. |
| Focal Point | ❌ Breaks | The dark header and the empty dark panel outweigh the one action, and the countdown shares the stage with a gradient bar. |
| Common Fate | ⚠️ Partial | A stage change updates several parts together, but the motion ignores reduced motion and the shared curve. |

**Follows 1, partial 5, breaks 4.**

## Principles it follows

### Connectedness ✅
- **Progress bar:** the fill sits inside its gray track with its label ("Overall Progress") and its value ("41%") on the same row (lines 177–183). That matches DESIGN.md's rule that a fill sits on its own track with its label and value on one row.
- **Stages:** each stage row joins a numbered circle and its label (lines 135–141). A done stage turns the circle green with a check, so marker and label change together.
- **Countdown:** the pulsing icon, the time and its caption sit together in one dark panel (lines 156–172).
- **Small gap:** the stages have no line between them, so they read as a list and not as a path. The hub's timeline joins its parts with a line.

## Principles it partly follows

### Proximity ⚠️
- **Holds:** the device card keeps the headband drawing, the four spec rows and the button in one group (lines 90–125), with 6px between the spec rows (`space-y-1.5`) and 16px before the button (`mb-4`). The 6px gap isn't on the rhythm either.
- **The action is far from its instruction:** the only action on the screen, "Connect Headband" (line 111), is in the top-left card. The instruction that says "Click 'Connect Headband' to pair" (line 214) is in the bottom-right card. In the screenshot they are on opposite sides of the screen, the button at the left and the instruction in the bottom right. The connection state is a third place, the icon in the header at the top right.
- **Off the rhythm:** the page pads 16px or 32px (`p-4 sm:p-8`), cards pad 20px (`p-5`), and the gaps are 16px, 20px and 12px (`space-y-4`, `gap-5`, `gap-3`). 20px and 12px are not on DESIGN.md's 4 / 8 / 16 / 24 / 32 rhythm, so the step between "inside a group" and "between groups" is hard to read.

### Continuity ⚠️
- **Holds:** the page is one centered block (`max-w-5xl`) that reads from the back link, to the header, then down two columns.
- **The task path doesn't follow the reading path:** the natural order is "read the setup steps, put the band on, press Connect, wait". The screen puts Connect first (left), the stage list under it, and the instructions last (right, bottom). A facilitator who reads left to right and top to bottom presses Connect before reading the setup steps.
- **The path ends nowhere on the recording screen:** while recording, the left column ends with a stage list and the right with a progress bar. There is no single next thing to look at.

### Symmetry ⚠️
- **Holds:** the two columns end at nearly the same height (about 722px and 697px in the first screenshot), and the content is centered in a fixed width.
- **Weight is lopsided:** the dark header (a banner with a large status icon at its right end) and the dark panel hold most of the visual weight. The light cards around them look like minor pieces.
- **Mixed alignment:** the header text is left-aligned and the status icon is right-aligned, the panel content is centered, and the cards are left-aligned. There is no shared axis.

### Common Region ⚠️
- **Holds:** each white card holds one topic (the device, the stages, the instructions, the progress). Cards don't nest.
- **No header region:** "Back to pre-test" floats on the gray ground above the page (line 65). The strand question screen and DESIGN.md's focused test mode put the wordmark, the test name and the exit in one white header bar. Here the exit isn't in any region, and it doesn't say what leaving does.
- **Two heavy regions:** the gradient header (line 70) and the dark recording panel (line 150) are the strongest regions. They use `#0B1F3A`, which isn't Instrument Navy `#1C1D33`, so the one color DESIGN.md keeps for the sensor is approximated by a second navy.

### Common Fate ⚠️
- **Holds:** when a stage changes, the stage circle, the device chip, the panel text, the countdown and the progress bar all update at the same moment, so they read as one event (lines 33–47).
- **Off-spec timing:** the progress fill uses `transition-all duration-300` with the default easing (line 182), not the shared `cubic-bezier(0.23, 1, 0.32, 1)`.
- **No reduced-motion handling:** the status LED pulses (`animation: pulse`, line 102), the panel dot pulses (`animate-pulse`, line 152), the panel icon ripples (`animate-ping`, line 157), and the device chip and the active stage each show a spinner (`animate-spin`, lines 121, 140). None is guarded by `motion-reduce`. Four things move at once even though only one state is changing.

## Principles it breaks

### Similarity ❌
- **One screen, four "active" colors:** the Connect button, the active stage circle, the progress percentage and the progress fill start are indigo `#3535C5` (lines 112, 136, 179, 182). Success and "connected" are green (lines 80, 116, 136, 169). The recording icon and the progress bar end in cyan (lines 158, 182). Secondary text on the dark panels is light blue (`text-blue-300`, `text-blue-200/70`). DESIGN.md's One Job Rule gives acting to deep blue, strand and progress to indigo, and readiness to blue, amber and red. Here, "press this", "you are here", "connected", "done" and "how far" are spread across four hues with no rule.
- **Two different primary buttons:** "Connect Headband" is an indigo `rounded-xl` button (line 112) and "Finish pre-test" is a green one (line 200). They are the one action of the same screen at two moments, and they look like they belong to two different products.
- **A chip shape for a status:** the "Connected" and "Recording…" states are rounded tinted pills, the same shape DESIGN.md keeps for readiness chips.
- **Monospace as a costume:** "Part IV" and the countdown are in a monospace (lines 73, 165). DESIGN.md's No-Monospace Rule says to use DM Sans with tabular numerals.

### Figure-Ground ❌
- **The wrong ground:** the page is cool gray `#F0F4F8` (line 63), not warm paper `#F8F6F2`.
- **Cards are almost invisible:** the white cards use `border-gray-100` (`#F3F4F6`) on white, about 1.1:1, and the page ground (`#F0F4F8`) is nearly the same tone as the border. The cards separate from the ground only by being white, and they are barely framed.
- **Text fades into the card:** the capture stages that haven't happened yet are `text-gray-400` (`#9CA3AF`) at 12px (line 139). DESIGN.md lists `#9CA3AF` as failing, at 2.54:1 on white. In the first screenshot all four stage labels are hard to read, and they are the only place that says what will happen.
- **The strongest figures are the empty ones:** the dark panel is the largest, highest-contrast shape on the screen, and when the learner arrives it holds a small icon and the words "Waiting to start". The figure carries the least information.

### Prägnanz (Simplicity) ❌
- **One state, five displays:** the same fact, "where are we", appears in the header badge ("Connected"), the device chip ("Recording Baseline EEG…"), the stage list (the active stage), the panel text and countdown, and the overall progress bar. In the second screenshot the countdown says 12 seconds left, the bar says 41%, and the stage list says stage 2. They are all correct, and a facilitator has to decide which one to believe.
- **A percentage that isn't about the recording:** "Overall Progress" averages the stages, including the 3-second calibrating and the 4-second processing stage, so 3 seconds into a 15-second recording (12 seconds left) it reads 41% (lines 56–57). The learner is not 41% of the way through anything they can see.
- **Specs nobody asked for:** the device card lists the device, the protocol, the sampling rate and the channels (line 106). A facilitator setting up a headband does not need "Bluetooth Low Energy" or "256 Hz". The card's job is to get the headband connected.
- **Jargon:** "Processing Baseline Data" and "Capture Stages" are research words, and the screen shows a processing stage that does nothing.
- **A decorative drawing:** the headband SVG is a gray shape with a status dot (lines 93–104). It doesn't show how to wear the band, which is what the setup needs.

### Focal Point ❌
- **The dark parts lead:** at 1366 × 768, the gradient header and the dark panel are the two highest-contrast regions. The one action, "Connect Headband", is a saturated button, but it sits in a small card below the header and to the left of the panel.
- **The title is small:** "Baseline EEG Capture" is 20px (`1.25rem`, inline, line 76), set in the system sans, on a banner. DESIGN.md sets a page title as a 2rem DM Serif Display headline.
- **Competing signals while recording:** the green "Connected" icon, the cyan pulsing icon, the large monospace countdown and the gradient progress bar all ask for attention. The countdown leads, which is right, but it shares the screen with three other saturated things.
- **What should lead:** before connecting, the next action. While recording, the time left. Afterwards, the result and one way forward.

## Other issues found along the way

These aren't Gestalt principles, but they affect the same facilitator and learner.

- **Text too small:** the subtitle is `text-sm` (14px), the capture stages, spec rows and setup instructions are `text-xs` (12px), and the header labels are `text-xs`. DESIGN.md sets 15px as the minimum on learner screens and 18px for sentences the learner reads.
- **Wrong audience in the copy:** the instructions say "your forehead" and "Sit still and relax during the 15-second baseline recording" (lines 211, 215). `PRODUCT.md` says a facilitator sits with the learner and sets up the headband. One text speaks to both people.
- **An em dash and a duplicated name:** "Baseline EEG Recording — Muse 2 Headband" (line 74) says the headband again, one line above the card titled "Muse 2 Headband".
- **No visible focus style:** none of the buttons sets a focus ring.
- **Color carries the connection state:** the header icon is green or gray, and the words "Connected" and "Not Connected" do repeat it. That part is fine. The device LED dot (line 101) has no word and is only decorative.
- **Gray-400 elsewhere:** the headband drawing and the disabled stage text use `#D1D5DB` and `#9CA3AF`, below the contrast DESIGN.md allows.
- **Fits one screen:** at 1366 × 768 the whole screen fits without scrolling (the content ends near y = 723). That's a point in its favor and one to keep.

## What a rebuild would need

This is a direction, not a spec. It isn't implemented in this review.

1. **Make it real:** pair over Web Bluetooth, read the four channels, check each sensor's contact, record a fixed number of samples that stops by itself, and offer the result as a CSV (and, when the backend has one, an upload). Show only what was measured. Keep Cancel, reconnect and recovery.
2. **Focused shell:** a white header with the wordmark, the part name and "Exit", then paper ground and white cards with a hairline and no shadow.
3. **One state, one display:** a rail of steps for setup, a countdown for recording, a plain result at the end.
4. **Facilitator-first copy:** instructions addressed to the facilitator, one short learner-facing line ("Sit still and relax.") at 18px in Atkinson Hyperlegible.
5. **One job per color:** deep blue for the one action, navy only for the sensor, amber for "you are here", red for a poor sensor or a lost connection, and the word always next to the color.
6. **Show how to wear it:** a picture guide in place of the gray drawing and the spec rows.
7. **Real states:** a sensor-contact view with each sensor's word, a failure and a reconnect state, and a result that says exactly what was recorded.
8. **Motion:** state changes on `cubic-bezier(0.23, 1, 0.32, 1)`, with nothing animating under `prefers-reduced-motion`.
