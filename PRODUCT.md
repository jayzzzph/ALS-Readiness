# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

A desktop-first browser app. Center sessions run on desktop PCs and laptops, and learners also use desktop for content and progress. Screens must hold up at smaller laptop widths (about 1280px and below). Phone layouts are not a design target for now.

## Users

Three roles, set by the account (no self-registration). Everyone signs in with an **ID number** (format `2026-00001`) and password, and may be forced to change the password on first sign-in.

- **Learner.** An adult or out-of-school learner in the Philippines' Alternative Learning System (ALS). Many have limited or interrupted formal schooling. They take the diagnostic test at the center, see their readiness profile, study content matched to how they learn, take the post-test, and check their progress and schedule.
- **Facilitator.** An ALS facilitator or AIS teacher who runs center sessions. They set up the Muse 2 headband and run the baseline recording and diagnostic test. They manage their cohort, upload stimulus/learning content, read cohort analytics, and export results.
- **Admin.** Manages user accounts and roles across the platform, reviews platform-wide analytics, and produces DepEd reports.

## Product Purpose

ALS Readiness profiles how ready an ALS learner is to start learning. It combines a diagnostic pre-test (the preparatory equivalency exam plus a learner inventory) with an EEG baseline recorded on a Muse 2 headband. It then delivers learning content in the modality that fits the learner (auditory, visual, or reading) and measures change with a post-test. Facilitators get cohort-level analytics to act on.

It is a **capstone/thesis research system, not yet deployed.** Success right now means the research pipeline works end to end for a study cohort and the results are readable by learners and facilitators.

## Positioning

What makes it different is the pairing of an ALS-aligned diagnostic test with an EEG readiness baseline, organized by the ALS learning strands, in one flow a facilitator can run at a Community Learning Center.

## Operating Context

- **Learner pipeline:** participant intake → diagnostic pre-test (per learning strand, e.g. LS1 Communication, LS3 Math & Problem Solving), with the Muse 2 baseline recording done at the center → readiness profile → modality-matched learning content → post-test → My Progress and Schedule.
- **Center sessions:** the diagnostic test and Muse 2 baseline happen at the center on desktop PCs or laptops, run by a facilitator sitting with the learner. The test is a focused, one-question-at-a-time flow with Save & Exit.
- **Facilitator work:** cohort overview, active learners and readiness, learning contents per strand, stimulus content upload, analytics, reports, CSV export.
- **Admin work:** user directory (search, filter by role/status, add users), platform analytics, DepEd reports.

## Capabilities and Constraints

- **Stack (existing):** React 18 + Vite + Tailwind CSS 4 frontend with Radix/shadcn primitives; Python backend (`backend/`, uv, Alembic, PostgreSQL).
- **Headset:** the study uses the **Muse 2** headband. All NeuroSky / MindWave references are outdated (for example `frontend/src/app/components/learner/EEGProfiling.tsx`) and are to be replaced with Muse 2 later.
- **Language:** English-only for now. The English / Filipino / Bisaya switch in `AppLayout` doesn't work and is to be hidden.
- **Units:** sample and test content uses metric units (km, km/h, kg), never imperial.
- **Terminology:** "learning strands" (LS1–LS6), "readiness", "pre-test" / "post-test", "cohort", "facilitator", "stimulus content", "modality" (auditory, visual, reading).
- **Undecided:** whether the language switch returns with real Filipino support; the final readiness bands and how they are worded to learners.

## Brand Commitments

- **Official name: ALS Readiness.** "Brainwaves ALS" (mockup footers and the test header) and "ALSense" (current landing, login, `ALSenseLogo`, footers) are names still to unify into ALS Readiness.
- Tagline seen in the mockups: "Empowering Learners" / "Empowering Adult Learners". Neither is confirmed as final.

## Evidence on Hand

- Design mockups in `docs/mockups/`: Learner Dashboard, Facilitator Dashboard, Admin User Management, M02 P2 Question Screen. They are visual direction, not pixel specs.
- **No outcome data, testimonials, adoption numbers, or DepEd endorsement exist.** Do not write or display claims of effectiveness, learner results, or official approval. Dashboard figures in the mockups and in code (for example the notifications in `AppLayout`) are placeholder data.

## Product Principles

1. **The research has to be honest.** Show what was measured and how. Never present readiness or EEG results as more certain than the study supports.
2. **Learners get plain words.** Short sentences, everyday English, one action per screen in the test flow. Never let jargon (EEG metric names, strand codes alone) stand in for a plain label.
3. **The facilitator runs the session.** Center-session screens (baseline recording, diagnostic test) assume a facilitator is present and keep the learner's screen calm and focused on the task.
4. **Readiness is a starting point, not a verdict.** A low readiness result leads to matched content and next steps, never to a dead end.

## Accessibility & Inclusion

- Users include adult learners with limited formal schooling, and some may be older or have low vision. Keep text large and plain, with high contrast and large click targets.
- Working target: WCAG 2.2 AA contrast and keyboard access (assumed, not yet formally adopted as a project requirement).
- Respect `prefers-reduced-motion` (already followed on the login spinner).
