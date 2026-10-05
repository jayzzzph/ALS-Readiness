---
name: ALSense
description: Readiness profiling and modality-matched learning for ALS learners and facilitators.
colors:
  deep-blue: "#00538A"
  deep-blue-press: "#004270"
  blue-tint: "#CFE4FF"
  highlighter-amber: "#FFAB2E"
  amber-ink: "#835500"
  amber-tint: "#FFDEB5"
  strand-indigo: "#4D35BD"
  instrument-navy: "#1C1D33"
  instrument-navy-deep: "#191A2E"
  paper: "#F8F6F2"
  surface: "#FFFFFF"
  sunken: "#F2F1ED"
  ink: "#1B1D26"
  ink-muted: "#4A4F5C"
  ink-placeholder: "#6B7080"
  field-stroke: "#8A8F9C"
  hairline: "#E2E0DA"
  track: "#E1E2E7"
  low-red: "#BA1A1A"
  low-tint: "#FFDAD7"
  error-stroke: "#B42318"
  error-ink: "#7A1A12"
  error-tint: "#FDECEA"
typography:
  display:
    fontFamily: "'DM Serif Display', Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.1
  headline:
    fontFamily: "'DM Serif Display', Georgia, serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "'DM Serif Display', Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-learner:
    fontFamily: "'Atkinson Hyperlegible', 'DM Sans', system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.01em"
  overline:
    fontFamily: "'DM Sans', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.deep-blue-press}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.deep-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
    height: "44px"
  nav-item-active:
    backgroundColor: "{colors.highlighter-amber}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  answer-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-learner}"
    rounded: "{rounded.md}"
    padding: "24px"
    height: "76px"
  answer-option-selected:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.ink}"
  strand-label:
    textColor: "{colors.strand-indigo}"
    typography: "{typography.overline}"
  chip-readiness-high:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.deep-blue}"
    typography: "{typography.overline}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-readiness-medium:
    backgroundColor: "{colors.amber-tint}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.overline}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  chip-readiness-low:
    backgroundColor: "{colors.low-tint}"
    textColor: "{colors.low-red}"
    typography: "{typography.overline}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  sensor-card:
    backgroundColor: "{colors.instrument-navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "32px"
---

# Design System: ALSense

<!-- Sources: shipped light style in frontend/src/app/components/LandingPage.tsx and auth/LoginPage.tsx, plus the visual direction in docs/mockups/ (Learner Dashboard, Facilitator Dashboard, Admin User Management, M02 P2 Question Screen). Mockup colors were sampled from JPEG pixels, so treat them as close but not exact. Mockups are direction, not pixel specs. -->

## Overview

**Creative North Star: "The Annotated Workbook"**

ALSense should feel like a good study workbook on a classroom desk. Warm paper, headings set in a confident serif, deep blue ink for the things you act on, and an amber highlighter marking where you are and how ready you are. Strand labels are the indigo tabs along the edge of the book, telling you which section you're in. The one exception is the sensor: Muse 2 readings and charts sit on dark navy instrument panels, so measured signal reads as a different kind of information from coursework.

The system is calm, roomy, and literal. Learners are adults, some with little formal schooling, so type runs large, there's one clear action per area, and nothing decorative competes with the task. Facilitator and admin screens are denser (tables, filters, charts) but use the same paper, ink, and highlighter. The light style is the standard on every surface. **The dark navy sidebar and indigo `#3535C5` shell in the current `AppLayout` are old and are being replaced.**

**Key Characteristics:**
- Warm off-white paper ground, white cards with hairline borders, almost no shadow.
- DM Serif Display for headings, DM Sans for interface text, and Atkinson Hyperlegible for learner reading text.
- Deep blue means "act here". Amber means "you are here / readiness". Indigo means "learning strand". Navy means "sensor".
- Desktop-first. It has to work at 1280px laptop widths and a bit below.

## Colors

The palette is warm paper and dark ink with four roles that each mean one thing. A color never borrows another color's job.

### Primary
- **Deep Ink Blue** (`deep-blue`): primary buttons ("Next", "Start Session", "Add User", "Sign In"), links ("View All"), focus rings, the selected pagination page, and high-readiness and progress fills. Darkens to **Pressed Ink** (`deep-blue-press`) on hover. 8.06:1 on white, 7.47:1 on paper.
- **Blue Wash** (`blue-tint`): the background for HIGH readiness chips and for a selected answer option.

### Secondary
- **Highlighter Amber** (`highlighter-amber`): the active sidebar item, the learner's readiness ring, and the "Building Focus"-style status pill. It's a fill color only. Text on it is always `ink` (8.89:1). **White on amber fails (1.89:1).**
- **Amber Ink** (`amber-ink`): any amber that has to be seen on its own, such as the MED readiness chip text, the medium progress-bar fill, and legend and status dots. 6.43:1 on white.
- **Amber Wash** (`amber-tint`): the background for MED readiness chips and the soft glow behind the readiness hero.

### Tertiary
- **Strand Indigo** (`strand-indigo`): learning-strand labels only ("LS1: Communication", "LS3 — MATH & COMPUTATION") and the diagnostic test's progress bar, which tracks progress within a strand. 8.2:1 on white. This replaces the old shell indigo `#3535C5`, which was used everywhere for everything.
- **Instrument Navy** (`instrument-navy`, chart panel `instrument-navy-deep`): Muse 2 sensor cards (Sensor Status, Signal Quality) and EEG/engagement chart panels. White text is 16.5:1 on it.

### Neutral
- **Paper** (`paper`): the page ground on every surface.
- **Surface** (`surface`): cards, the top bar, inputs, answer options.
- **Sunken** (`sunken`): the sidebar, search fields, table header rows.
- **Ink** (`ink`): headings and body text (15.56:1 on paper).
- **Muted Ink** (`ink-muted`): supporting text, meta lines, and timestamps (7.59:1 on paper).
- **Placeholder** (`ink-placeholder`): placeholder text only (4.94:1 on white).
- **Field Stroke** (`field-stroke`): input and answer-option borders (3.24:1, meets the 3:1 rule for UI parts).
- **Hairline** (`hairline`): card borders, dividers, table row rules (decorative only).
- **Track** (`track`): empty progress-bar tracks.
- **Readiness Low** (`low-red` on `low-tint`) and **Error** (`error-stroke`, `error-ink` on `error-tint`): the LOW readiness chip and form/system errors.

### Contrast flags

Checked against WCAG 2.2 AA: 4.5:1 for text, 3:1 for UI parts and graphics.

| Pair | Ratio | Status |
|---|---|---|
| White text on Highlighter Amber | 1.89:1 | **Fails.** Always use ink on amber. |
| Amber readiness ring / legend dot on white | 1.89:1 | **Fails 3:1.** The ring is only OK because the percentage is printed inside it. Legend and status dots must use `amber-ink`. |
| Amber on the sidebar (`sunken`) | 1.70:1 | **Fails.** The active nav item works because ink text sits on a filled amber pill, not because of the amber itself. |
| Deep blue on Instrument Navy | 2.05:1 | **Fails.** Never put primary blue on sensor cards. Use white, amber (8.73:1), or a light blue. |
| `#9CA3AF` (Tailwind gray-400) text on white | 2.54:1 | **Fails.** Used about 26 times in the current code and for the mockup's "Inactive" rows. Use `ink-muted` instead. |
| Track on white | 1.29:1 | Fine as an empty track. The fill carries the meaning (blue 8.06, amber-ink 6.43, red 6.46). |

### Named Rules
**The One Job Rule.** Each accent means one thing. Blue = act. Amber = here / readiness. Indigo = strand. Navy = sensor. If a new element needs color, it takes the color of the job it does, or none.

**The Ink-on-Amber Rule.** Amber is a fill, never a text color on light grounds and never under white text.

**The Readiness Scale Rule.** High = deep blue, Medium = amber (amber-ink for marks), Low = red, everywhere. The Facilitator Dashboard mockup shows Low as violet in the distribution legend and red in the table. Use red in both. Violet isn't part of the system.

## Typography

**Display Font:** DM Serif Display (with Georgia, serif)
**Body Font:** DM Sans (with system-ui, sans-serif)
**Learner Reading Font:** Atkinson Hyperlegible (with DM Sans, system-ui)

**Character:** A warm, bookish serif for headings sits over a clean geometric sans for the interface. Atkinson Hyperlegible is a sans built for low-vision readers, with strongly distinct letterforms (I/l/1, 0/O). It sits next to DM Sans without clashing, as long as each has its own job.

### Hierarchy
- **Display** (400, 3rem, 1.1): one per page, the greeting or landing hero ("Welcome back, Sarah!"). Landing goes up to 3.5rem.
- **Headline** (400, 2rem, 1.2): page titles ("Cohort Overview", "User Directory") and diagnostic question stems. Question stems can go up to 2.5rem when they're short.
- **Title** (400, 1.5rem, 1.25): card and section titles ("Today's Recommendations", "Readiness Distribution").
- **Body** (400, 1rem, 1.55): facilitator and admin interface text, table cells, helper text. Max 70ch.
- **Body Learner** (400, 1.125rem, 1.6): every learner-facing sentence, including instructions, recommendation titles, lesson text, and answer options. Max 65ch.
- **Label** (700, 0.9375rem, +0.01em): buttons, nav items, form labels.
- **Overline** (700, 0.8125rem, +0.06em, uppercase): strand labels, table column headers, readiness chips.

### Atkinson Hyperlegible + DM Sans: verdict
It fits if you split it by job. Use Atkinson for learner body and answer text, and keep DM Sans for the chrome every role shares (nav, buttons, labels, tables, chips). Don't mix the two inside one block of text. Atkinson's x-height and width are close enough to DM Sans that a learner card can mix a DM Sans label with an Atkinson title. Load Atkinson from the installed `@fontsource/atkinson-hyperlegible` (400 and 700 only). The DM fonts are still loaded from a temporary Google Fonts `@import` in each page.

### Named Rules
**The Serif-Is-For-Headings Rule.** DM Serif Display is only for headings and short question stems. It has only one weight and high stroke contrast, so it reads poorly in long passages. A question stem longer than about 25 words switches to Body Learner at 1.5rem.

**The No-Small-Learner-Text Rule.** The mockups use 12–13px nav and button text. That's too small for this audience. Learner screens never go below 15px (labels) or 18px (sentences).

**The No-Monospace Rule.** The mockups use a monospace for "Last login" dates and "Signal Quality". Use DM Sans with `font-variant-numeric: tabular-nums` instead. A fourth typeface adds noise and doesn't help anyone read.

## Layout

- **App shell:** a fixed light sidebar (240px, `sunken`, hairline right border) with the ALSense wordmark and tagline at top, role nav in the middle, and the primary session action, Support, and Logout at the bottom. A 64px white top bar holds the page context, notifications, settings, and avatar. Content sits on `paper` with 24px gutters.
- **Dashboard grid:** at 1280px, a main column of about 2/3 and an aside of about 1/3 (minimum 300px) with 24px gaps. Below about 1100px the aside drops under the main column. Below 1024px the sidebar collapses to a 72px icon rail with tooltips.
- **Focused test mode:** the diagnostic test drops the sidebar. A white header shows the wordmark, the test name, and "Save & Exit". The content is one centered column (max 768px): strand overline, "Question 4 of 20", the indigo progress bar, the question card, then Back and Next on opposite sides. It keeps the same layout at every width.
- **Spacing rhythm:** 4 / 8 / 16 / 24 / 32 / 48 / 64. Cards pad 32px. Sections sit 48px apart.
- **Desktop-first:** design at 1440px and 1280px, and check at 1024px. Nothing may scroll sideways at 1280px except data tables, which scroll inside their card.

## Elevation & Depth

Flat. Depth comes from tone (paper → white card → sunken field) and hairline borders, not shadows. The only dark layer is the instrument navy of sensor panels, which reads as a separate device screen set into the page.

### Named Rules
**The Flat Workbook Rule.** Cards rest flat with a 1px hairline. If a shadow appears at all, it's only on things that float, like menus, popovers, and dialogs. Keep it soft (`0 8px 24px rgba(27,29,38,0.08)`) and never use it on cards.

## Shapes

Soft but not bubbly. Cards and sensor panels use 16px corners. Buttons, inputs, and answer options use 12px. Nav items and small controls use 8px. Chips, status pills, avatars, and progress bars are fully rounded. Readiness and progress use circles (rings) and capsules (bars), and those shapes are reserved for measured progress.

## Components

### Buttons
Big, solid, and calm.
- **Shape:** 12px corners, at least 48px tall (44px for compact facilitator/admin toolbars).
- **Primary:** deep blue fill with white Label text, darkening to pressed ink on hover. Sentence or title case ("Next", "Start Session"). The mockup's all-caps "NEXT" / "BACK" is out.
- **Secondary:** white with a 1px deep-blue border and blue text ("Back", "Export CSV", "Upload Stimulus Content").
- **Focus:** 2px deep-blue outline offset by 2px, on every interactive element (already the pattern in Landing and Login).
- **Loading:** a spinner plus a verb ("Signing in…"), `aria-busy`, and no spinning under `prefers-reduced-motion`.

### Chips
- **Readiness chips:** Overline text on a tint, fully rounded. HIGH is blue on Blue Wash, MED is amber ink on Amber Wash, LOW is red on low tint. Always show the word, never just the color.
- **Role chips:** Learner is muted ink on `sunken`. Facilitator is white on deep blue. The mockup's separate `#1B6BA8` blue becomes the primary blue.
- **Status:** a small dot plus a word ("Active", "Inactive"). The dot is decorative, so the word carries the meaning, in `ink-muted`, not gray-400.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** surface on paper.
- **Shadow Strategy:** none (see the Flat Workbook Rule).
- **Border:** 1px hairline.
- **Internal Padding:** 32px, or 24px in dense facilitator/admin tables.

### Inputs / Fields
- **Style:** white with a 1px field stroke, 12px corners, 48px tall, and an optional 20px leading icon. Search fields can use `sunken` with no border.
- **Focus:** the border turns deep blue and gets a 2px deep-blue ring at 30%.
- **Error:** an error-tint panel with an error-stroke border and error-ink text, plus an icon, `role="alert"`, and `aria-invalid` on the field.
- **Labels:** always visible above the field in Label style. Placeholders are only examples ("2026-00001").

### Navigation
- **Sidebar items:** an icon plus a Label in ink, 44px tall, 8px corners, with a `surface` hover. The **active item is a solid Highlighter Amber pill with ink text and icon.**
- **Per role:** each role shows only its own items. The mockups reused one sidebar with Cohort Management and EEG Insights on the learner screen. Follow the role nav in code, not the mockup.
- **Bottom:** a primary "Start Session" button, then Support and Logout as plain items above the hairline.

### Answer Option (signature)
The diagnostic test's answer row is a full-width white row, about 76px tall, with a 12px corner and a 1px field stroke. The answer is set in Body Learner and a 24px radio circle sits on the right. On hover the border turns deep blue. When selected, it gets a Blue Wash fill, a 2px deep-blue border, and a filled radio. The whole row is clickable and arrow keys move between options. Sample content uses metric units ("40 km/h", not "40 mph"), so the mockup's train question needs to be reworded.

### Readiness Ring (signature)
A thick amber ring around the percentage, set in Display ("78%") with an Overline "READY" under it. It sits on the readiness hero card with an amber-wash glow in one corner and a Title-size plain-language sentence next to it. The percentage is always printed. The ring is never the only thing showing the value. The facilitator Diagnostic Progress ring uses the same shape in deep blue.

### Sensor Panel (signature)
An instrument-navy card for Muse 2 readings: "Sensor Status" with a Connected/Disconnected pill, and "Signal Quality" with a plain-word value ("Excellent") in Title serif and white. Chart panels use the deep navy with light lines (solid light blue for engagement, dashed lavender for cognitive load). Each line needs at least 3:1 against the navy and a text legend. Status pills are words with a dot, never just color.

## Do's and Don'ts

### Do:
- **Do** use `paper` for every page and white cards with a 1px hairline for content.
- **Do** give each accent one job: blue to act, amber for here and readiness, indigo for strands, navy for sensors.
- **Do** put ink text on amber, and use `amber-ink` for amber marks that stand alone.
- **Do** set learner sentences in Atkinson Hyperlegible at 18px or more, and interface chrome in DM Sans.
- **Do** print the number and the word with every readiness ring, bar, and chip.
- **Do** check every screen at 1280px and 1024px.
- **Do** write sample content in metric units and say "ALSense" as the product name.

### Don't:
- **Don't** bring back the dark navy sidebar or the `#3535C5` indigo-everywhere shell from the current `AppLayout`.
- **Don't** put white text on amber, or deep blue on instrument navy.
- **Don't** use `#9CA3AF` gray-400 or anything lighter for text.
- **Don't** use violet for readiness, or a second blue (`#1B6BA8`) for role chips.
- **Don't** set long passages in DM Serif Display, or learner text below 15px.
- **Don't** use all-caps button labels, or a monospace typeface.
- **Don't** add shadows to cards.
- **Don't** show "ALS Readiness" or "Brainwaves ALS" (old mockup names) in new screens, or NeuroSky/MindWave anywhere. The headset is Muse 2.

## Gestalt Principles

The thesis uses these ten Gestalt principles as the design basis for ALSense. Each one maps to rules already set above, so this section explains why the system looks the way it does and adds no new visual direction. Every principle gives a definition, the ALSense rule, and an example from the mockups (`docs/mockups/`) or current screens.

### Proximity
- **Definition:** Elements placed close together are read as one group.
- **ALSense rule:** Spacing gets tighter inside a group and wider between groups, using the 4 / 8 / 16 / 24 / 32 / 48 / 64 rhythm. A label sits 8px above its field. Fields sit 24px apart. Card content is padded 32px from the card edge. Sections sit 48px apart. A heading always has more space above it than below it.
- **Example:** On the Login page, each label is 8px above its input and the two field groups are 24px apart, so "ID Number" clearly belongs to its own input. On the Learner Dashboard, each recommendation's meta line ("15 min", "Video") sits right under its title, apart from the next card.

### Similarity
- **Definition:** Elements that look alike are read as having the same role.
- **ALSense rule:** The One Job Rule. Deep blue means act, amber means here or readiness, indigo means learning strand, navy means sensor. Every primary action is the same deep-blue 48px button with 12px corners. Every strand label is an indigo overline. Every readiness chip is a fully rounded pill of the same size, with only its color and word changing.
- **Example:** "LS1: Communication" and "LS3: Problem Solving" on the Learner Dashboard share the same indigo overline style. "Start Session", "Add User", "Next" and the login "Sign In" share one primary button style. HIGH, MED and LOW in the Facilitator Dashboard table are the same chip in three tints.

### Continuity
- **Definition:** The eye follows a smooth line or path and groups the elements along it.
- **ALSense rule:** Each card keeps one left edge for its content, set by its 32px padding. Focused flows run in one vertical column (max 768px for the test, about 448px for sign-in) and read top to bottom with no side branches. Bars in a table column start on the same x-position.
- **Example:** The M02 Question Screen reads in one straight line: strand label, "Question 4 of 20", progress bar, question, answer options, then Back and Next. In the Facilitator Dashboard's Active Learners table, the strand-progress bars line up so they can be compared at a glance.

### Figure-Ground
- **Definition:** People separate a scene into a figure in front and a ground behind it.
- **ALSense rule:** Paper (`paper`) is always the ground. White cards with a 1px hairline are the figure. Instrument navy is the strongest figure and is kept for sensor readings, so measured signal stands apart from coursework. Only floating layers (menus, popovers, dialogs) get a soft shadow.
- **Example:** The Login card sits as one white figure on the warm paper ground. On the Learner Dashboard, the navy Sensor Status card stands out from the white readiness and recommendation cards around it.

### Prägnanz (Simplicity)
- **Definition:** People read a layout in its simplest stable form, so simpler layouts are understood faster.
- **ALSense rule:** One primary action per area, flat surfaces with no card shadows, and plain-word values instead of raw metrics. Rings and capsules are kept for measured progress only. Learner screens show one task at a time.
- **Example:** The Login page is one card with one heading, two fields and one button. On the Learner Dashboard, Signal Quality says "Excellent" instead of a number.

### Symmetry
- **Definition:** Symmetrical arrangements read as stable, balanced and complete.
- **ALSense rule:** Symmetry is for focused tasks. Sign-in and the diagnostic test are centered columns, with matching controls given equal width and height. Dashboards are asymmetric on purpose (a 2/3 main column and a 1/3 aside) so the main task leads.
- **Example:** On the M02 Question Screen, the column is centered, all four answer options are the same full width and about 76px tall, and Back and Next balance each other on opposite sides. The Login card is centered on the page.

### Connectedness
- **Definition:** Elements joined by a line, fill or shared shape read as related, even more strongly than elements that are only close together.
- **ALSense rule:** A progress fill always sits on its own track, with its label and percentage on the same row. Table cells are joined into rows by hairline rules. The amber active nav pill joins the icon and label into one item. Chart lines join each series' points, with a text legend.
- **Example:** In the Learner Dashboard's Diagnostic Progress card, "LS1 - LS2" connects to its 100% bar and value. In the Facilitator Dashboard, each learner row links their name, strand progress, readiness chip and last activity.

### Common Region
- **Definition:** Elements inside the same bounded area read as one group.
- **ALSense rule:** A card (white, 16px corners, 1px hairline) holds one topic. Cards never nest. The sunken tone marks secondary regions: the sidebar, search fields and table header rows. Errors get their own error-tint region.
- **Example:** In Admin User Management, Search, Role, Status and Clear sit inside one filter card, separate from the user table card. On the Login page, the error message is its own tinted region above the fields it refers to.

### Focal Point
- **Definition:** The element that contrasts most with its surroundings draws attention first.
- **ALSense rule:** One focal point per screen: the Display heading or a signature element such as the readiness ring. Amber appears only where the learner is or how ready they are. Each card has at most one primary button.
- **Example:** On the Learner Dashboard, the amber 78% readiness ring is the focal point. On the Login page, the eye goes from "Sign In" straight to the deep-blue button, the only saturated element.

### Common Fate
- **Definition:** Elements that move or change together are read as one group.
- **ALSense rule:** Things that change together change at the same moment, with the same duration (150 to 200ms) and the same `cubic-bezier(0.23, 1, 0.32, 1)` curve. Under reduced motion they keep fading together but stop moving. Progress fills and readiness values that update together should animate together.
- **Example:** On the Login page, when an error appears, the error message fades in at the same moment both inputs turn their error border, so the message and the fields read as one event. The show/hide password icons crossfade as one control.
