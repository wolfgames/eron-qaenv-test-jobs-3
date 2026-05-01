# Mystery Munchies: Scooby's Bubble Pop
**Tagline:** Every snack reveals a secret — if you dare to look.
**Genre:** Match-3 / Casual Puzzle
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
4. [Level Generation](#level-generation)

**How It Flows**
5. [Game Flow](#game-flow)

---

## Game Overview

Mystery Munchies drops players into a groovy 1970s world alongside Scooby-Doo and the Mystery Inc. gang, where matching glowing ghost-bubbles is the only way to expose the monster lurking behind each haunted location. Tap clusters of same-colored bubbles to pop them, chain combos to reveal hidden clues painted beneath the board, and survive increasingly spooky challenges from vengeful ghosts, slimy monsters, and creaking trap doors. Every cleared board pulls back the curtain on a new chapter of the gang's ongoing mystery — and always rewards Scooby with a well-earned Scooby Snack.

**Setting:** A rotating cast of 1970s haunted locations — a funky beach resort, a groaning amusement park, a cobweb-draped mansion, a fog-drenched lighthouse — each populated by the Mystery Inc. gang in era-authentic bell-bottoms, shag carpet, and wood-paneled décor. Monsters from the Scooby-Doo universe pose as genuine threats until exposed.

**Core Loop:** Player taps clusters of matching ghost-bubbles to pop them → which clears the board and charges the Mystery Meter → which unlocks the next clue fragment and advances the gang closer to unmasking the monster.

## At a Glance

| | |
|---|---|
| **Grid** | 8×10 bubble grid |
| **Input** | Tap (cluster selection) |
| **Bubble Colors** | 5 (Ghastly Green, Phantom Purple, Boo Blue, Fright Orange, Scooby Brown) |
| **Power Bubbles** | Scooby Snack Bomb (5–6 match), Mystery Machine Blast (7–8 match), Unmasking Orb (9+ match) |
| **Session Target** | 2–5 min per level |
| **Move Range** | 12–30 taps per level |
| **Failure** | Yes — out of taps |
| **Continue System** | Watch ad or spend Scooby Snacks (in-game currency) for +5 taps |
| **Star Rating** | 1–3 stars based on efficiency; cosmetic only |
| **Companion** | Scooby-Doo — reacts to every pop with in-character audio barks and animation |

---

## Core Mechanics

### Primary Input

**Input type:** Single tap on any bubble within a valid cluster.
**Acts on:** A contiguous group of 2 or more same-colored bubbles connected horizontally or vertically (diagonal adjacency does not count).
**Produces:** All bubbles in the tapped cluster are simultaneously popped and removed from the grid, triggering gravity fill and scoring.

A tap on a lone bubble (no neighbor of the same color) is an invalid action. The bubble briefly wobbles and no tap is consumed. *(For full invalid action feedback — visual, audio, duration — see [Feedback & Juice](#feedback--juice).)*

### Play Surface

**Dimensions:** 8 columns × 10 rows of circular bubbles, filling the middle 70 % of a portrait phone viewport (roughly 375 × 520 logical points on a 375-wide screen).

**Scaling:** The grid scales proportionally to fit the device width, maintaining at least 44 × 44 pt per bubble cell (visual diameter ~42 pt, tap target padded to 44 pt).

**Cell types:**
- **Normal cell** — contains a colored bubble.
- **Empty cell** — bubble has been popped; subject to gravity fill.
- **Locked cell** — contains a Ghost Barrier or Crate Blocker (introduced mid-game); cannot be popped by normal taps.
- **Clue cell** — hidden beneath the bubble layer; revealed progressively as rows above are cleared.

**Bounds:** Bubbles cannot move outside the 8×10 grid. No wrapping. Top row is row 1; bottom row is row 10. Gravity pulls bubbles downward (toward row 10).

### Game Entities

#### Colored Bubbles

| Property | Detail |
|---|---|
| **Visual** | Translucent sphere with a cartoon ghost face inside, tinted to its color (green, purple, blue, orange, brown). Glows faintly in a 1970s blacklight style. |
| **Behavior** | Remain static until tapped as part of a valid cluster. When popped, play a satisfying "bloop" and dissolve upward in a smoke wisp. |
| **Edge cases** | A bubble at the top row (row 1) that has no colored neighbors above it cannot receive a fill from above — it is removed and not replaced (grid shrinks by one effective row for that column). |

#### Ghost Barrier (Blocker)

| Property | Detail |
|---|---|
| **Visual** | A translucent cartoon ghost locked inside a darker bubble, rattling its chains. Introduced in Chapter 3. |
| **Behavior** | Cannot be tapped directly. Destroyed only when all same-color bubbles adjacent to it are popped in a single cluster pop. Counts as one "hit" per adjacent cluster cleared; Ghost Barriers require 2 hits to remove. |
| **Edge cases** | If a Ghost Barrier is diagonally adjacent only (not orthogonally), it does not receive a hit. A Ghost Barrier in a corner may require deliberate adjacency setup to destroy. |

#### Crate Blocker

| Property | Detail |
|---|---|
| **Visual** | A wooden crate with a spooky stencil (bat, skull, question mark). Introduced in Chapter 5. |
| **Behavior** | Immovable; does not fall with gravity. Cannot be destroyed by cluster pops — only by a Power Bubble explosion that encompasses its cell. |
| **Edge cases** | Crate Blockers on the bottom row prevent clue cells beneath from being revealed unless the crate is destroyed. |

#### Power Bubbles

Power Bubbles replace a random member of the popped cluster when a cluster of 5 or more is cleared.

| Name | Threshold | Visual | Effect |
|---|---|---|---|
| **Scooby Snack Bomb** | 5–6 bubbles | Gold bone-shaped bubble | Clears all bubbles in a 3×3 area centered on the cell where it lands after gravity fill. |
| **Mystery Machine Blast** | 7–8 bubbles | Teal van-shaped bubble | Clears an entire row and entire column (cross pattern). |
| **Unmasking Orb** | 9+ bubbles | Swirling multicolor orb | Clears all bubbles of one random color currently on the board. |

Power Bubbles activate when tapped as part of any valid cluster (even a 2-bubble cluster). They cannot be used individually on an empty tap.

#### Scooby Snack (In-Game Currency Token)

| Property | Detail |
|---|---|
| **Visual** | Floating bone biscuit with "SS" stamped on it; appears briefly after large combos or level completions. |
| **Behavior** | Tapping it within 3 seconds of appearance collects it into the player's currency wallet. Missed tokens disappear with a sad "aw" from Scooby. |
| **Edge cases** | Cannot appear while an animation sequence is in progress. Queued until next idle state. |

#### Clue Fragment

| Property | Detail |
|---|---|
| **Visual** | A piece of parchment with a partial illustration (a masked villain, a footprint, a chemical symbol) painted on the board background, revealed as bubbles above are removed. |
| **Behavior** | Purely visual — not an interactive entity. Fully revealed when all bubbles in the rows above it are cleared. Triggers the Mystery Meter fill animation. |
| **Edge cases** | If the level ends (win or lose) before a clue is fully revealed, the clue preview is shown in the results screen at partial opacity with a "Keep Playing to Reveal" prompt. |

### Movement & Physics Rules

| Condition | Outcome |
|---|---|
| IF a cluster of 2+ same-colored orthogonally-connected bubbles is tapped | THEN all bubbles in the cluster are removed simultaneously. Duration: 300 ms dissolve animation per bubble (staggered 20 ms per bubble in the cluster, largest clusters finish within 500 ms total). |
| IF any cell becomes empty after a cluster pop | THEN all bubbles in the same column above the empty cells fall downward to fill gaps. Duration: 250 ms per row of fall distance, eased with `power2.out`. |
| IF after gravity fill any column has fewer bubbles than the fill threshold (column height < 3 bubbles) AND the level is configured to refill | THEN new randomly-colored bubbles cascade in from the top of the column. Duration: 150 ms per bubble, staggered 30 ms. |
| IF a Power Bubble lands on a cell after gravity fill | THEN it rests in place and is not activated automatically — player must tap a cluster containing it. |
| IF input is received while a pop animation is in progress | THEN the tap is queued and executed after the current animation completes (animation lock, no dropped inputs). |
| IF input is received while gravity fill is in progress | THEN the tap is ignored entirely and no queue entry is created (debounce window = fill animation duration). |
| IF a cluster pop causes a Power Bubble to be included in the cleared area (e.g., Mystery Machine Blast row covers it) | THEN the Power Bubble activates immediately as a chain, adding its effect before gravity fill begins. Maximum chain depth: 3. |
| IF the tap count reaches 0 (out of taps) | THEN no further taps are accepted; the Loss Sequence triggers automatically. |

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method

**Hybrid** — Levels 1–15 (tutorial and early chapters 1–2) are fully hand-crafted. Levels 16 onward use a seeded procedural generator constrained by per-chapter difficulty parameters. Hand-crafted levels are authored in JSON data files owned by the game design team.

### Generation Algorithm

**Step 1: Seed Resolution**
- Inputs: `levelNumber` (integer, 1-based), `chapterNumber` (integer, 1-based)
- Outputs: `rngSeed` (integer)
- Constraints: `rngSeed = (levelNumber * 73856093) XOR (chapterNumber * 19349663)` — deterministic, no timestamp component. Same level + chapter always produces identical output.

**Step 2: Difficulty Parameter Lookup**
- Inputs: `chapterNumber`, `levelIndexWithinChapter` (0-based), difficulty curve table
- Outputs: `tapLimit`, `colorCount`, `blockerCount`, `refillEnabled`, `targetClearPercent`
- Constraints:

| Chapter Range | Colors | Tap Limit | Blockers | Refill | Clear % |
|---|---|---|---|---|---|
| 1–2 (easy) | 4 | 22–30 | 0 | Yes | 70 % |
| 3–4 (medium) | 5 | 18–25 | 2–4 Ghost Barriers | Yes | 75 % |
| 5–6 (hard) | 5 | 14–20 | 2–3 Crates + 2–4 Ghosts | No | 80 % |
| 7+ (expert) | 5 | 12–18 | 3–5 Crates + 3–6 Ghosts | No | 85 % |

Tap limit is drawn uniformly from the range using the seeded RNG.

**Step 3: Color Assignment**
- Inputs: `colorCount`, `rngSeed`
- Outputs: `activeColors[]` (subset of the 5 canonical colors)
- Constraints: Colors chosen randomly from the canonical 5 without replacement. Brown is always included when `colorCount = 5` (Scooby-brand anchor).

**Step 4: Bubble Grid Fill**
- Inputs: `activeColors[]`, grid dimensions (8×10), `blockerCount`, `rngSeed`
- Outputs: Initial bubble grid (80 cells populated)
- Constraints:
  - No color may occupy more than 35 % of non-blocker cells.
  - No color may occupy fewer than 10 % of non-blocker cells.
  - Blockers are placed in the upper 40 % of the grid (rows 1–4), never in column 1 or 8 (edge isolation for approachability).
  - No two Crate Blockers may be orthogonally adjacent.

**Step 5: Solvability Check**
- Inputs: Populated grid, `tapLimit`, `targetClearPercent`
- Outputs: `isSolvable` (boolean), `simulatedTapsUsed` (integer)
- Constraints: Run a greedy simulation (always pop the largest available cluster) and verify that `simulatedTapsUsed ≤ tapLimit` and cleared cells ≥ `targetClearPercent`. This is a soft solvability check — the greedy path is not the only path.

**Step 6: Power Bubble Injection**
- Inputs: Validated grid, `rngSeed`
- Outputs: Grid with 1–3 Power Bubbles pre-seeded at random positions
- Constraints: Power Bubbles replace normal bubbles. No Power Bubble in row 10 (bottom row — too easily missed). At most one Power Bubble per column.

**Step 7: Clue Placement**
- Inputs: Validated grid, `chapterNumber`, chapter clue manifest
- Outputs: Grid with clue fragment metadata attached to rows 7–10
- Constraints: Clue fragment always spans rows 7–10 (bottom quadrant). Clue image is fetched from the chapter's static asset bundle — not generated at runtime.

### Seeding & Reproducibility

The seed formula `(levelNumber * 73856093) XOR (chapterNumber * 19349663)` is applied to a deterministic LCG (Mulberry32 algorithm). All subsequent RNG draws during generation use this seeded instance. The same `levelNumber` + `chapterNumber` pair will always produce an identical level, enabling:
- Reproducible bug reports (share level coordinates, not screenshots)
- A/B testing of generator parameter tweaks against known levels
- Leaderboard fairness (all players see the same generated layout)

**Failed seed handling:** If Step 5 fails (not solvable), increment an internal `attempt` counter (max 10) and re-run from Step 4 with `rngSeed = originalSeed + attempt`. Log the attempt count to analytics.

### Solvability Validation

**Rejection conditions (any one triggers a retry):**
1. Greedy simulation exceeds `tapLimit`.
2. Cleared cells after greedy simulation < `targetClearPercent`.
3. Any color is entirely isolated (zero orthogonal neighbors of the same color across the entire grid — unplockable singleton field).
4. A Crate Blocker is surrounded on all four sides by other Crate Blockers or grid walls (unreachable by Power Bubble explosion).

**Retry logic:** Up to 10 attempts with seed increments. Each attempt re-runs Steps 4–6.

**Fallback chain:**
1. Attempts 1–10: Seeded procedural generation with incrementing seed.
2. Attempt 11: Reduce `blockerCount` by 50 % and retry generation once more.
3. Attempt 12: Replace with a pre-validated hand-crafted level from the chapter's fallback pool (each chapter ships with 3 fallback levels). Log the fallback trigger to analytics.

**Last-resort guarantee:** The fallback pool levels are hand-validated at ship time. They are always solvable within their chapter's tap limit. Fallback pool cannot be exhausted (3 levels chosen by `levelNumber % 3`).

### Hand-Crafted Levels

- **Which levels:** Levels 1–15 (tutorial + Chapters 1–2 first 5 levels each).
- **Where data lives:** `src/game/mysterymunchies/data/levels/hand-crafted/*.json` — one file per level, named `level-001.json` through `level-015.json`.
- **Who owns them:** Game design team. Changes require a content PR with QA sign-off. No automated overwrite.

---

## Game Flow

### Master Flow Diagram

```
App Open
  ↓ (assets load)
Loading Screen  [lifecycle: BOOT]
  ↓ (load complete)
Title Screen  [lifecycle: TITLE]
  ↓ (first launch: tap "Start Adventure")
First-Time Intro Cutscene  [lifecycle: TITLE]
  ↓ (cutscene ends or skip tapped)
Tutorial Level 1  [lifecycle: PLAY]
  ↓ (complete)
Tutorial Level 2  [lifecycle: PLAY]
  ↓ (complete)
Chapter 1 Start Interstitial  [lifecycle: TITLE]
  ↓ (tap "Let's Go!")
Gameplay Screen  [lifecycle: PLAY]
  ↓ (win: clear % met within taps)
Level Complete Screen  [lifecycle: OUTCOME]
  ↓ (tap "Next Level")
Gameplay Screen  [lifecycle: PLAY]
  ... (repeat for all levels in chapter)
  ↓ (final level of chapter won)
Chapter Complete / Clue Reveal Screen  [lifecycle: OUTCOME → PROGRESSION]
  ↓ (tap "Keep Investigating")
Chapter N+1 Start Interstitial  [lifecycle: TITLE]
  ↓ (loops back into gameplay)

[From any Gameplay Screen — taps exhausted]
Loss Screen  [lifecycle: OUTCOME]
  ↓ (tap "Watch Ad" / "Use Scooby Snacks")  → +5 taps → resume Gameplay Screen  [lifecycle: PLAY]
  ↓ (tap "Try Again")  → restart same level → Gameplay Screen  [lifecycle: PLAY]
  ↓ (tap "Retreat")  → Title Screen / Level Map  [lifecycle: TITLE]
```

### Screen Breakdown

#### Loading Screen
- **lifecycle_phase:** BOOT
- **Purpose:** Initialize assets and audio while showing branding.
- **Player sees:** Scooby-Doo silhouette running across a psychedelic 70s background. A bone-shaped progress bar fills from left to right. Mystery Inc. logo fades in.
- **Player does:** Nothing — passive. Session length: 2–4 seconds.
- **What happens next:** Fade to Title Screen once assets are ready.

#### Title Screen
- **lifecycle_phase:** TITLE
- **Purpose:** Entry point; returning players jump back in, new players start onboarding.
- **Player sees:** Animated Mystery Machine parked in front of a haunted manor. Title logo pulses. Two buttons: "Start Adventure" (new game) and "Continue" (returning). Scooby peeks from behind the van.
- **Player does:** Taps "Start Adventure" (first launch) or "Continue" (returning). Session length: ~5 seconds.
- **What happens next:** First launch → First-Time Intro Cutscene. Returning → Chapter Start Interstitial or Level Map.

#### First-Time Intro Cutscene
- **lifecycle_phase:** TITLE
- **Purpose:** Establish the world, tone, and Scooby's role as companion.
- **Player sees:** Animated panels in a groovy 70s comic-strip style. Scooby and Shaggy discover a haunted location; Fred announces it's time to investigate; Velma explains the bubble-matching mechanic through a quick in-universe gag ("Those ghost-bubbles hold the secrets, Shaggy!"). Skip button visible after 3 seconds.
- **Player does:** Watches or taps "Skip". Session length: 20–30 seconds (or instant if skipped).
- **What happens next:** Tutorial Level 1.

#### Tutorial Level 1 — "Pop Your First Ghost-Bubble"
- **lifecycle_phase:** PLAY
- **Purpose:** Teach the tap-to-pop mechanic with zero friction.
- **Player sees:** A simplified 8×4 grid. Three large clusters of 2 colors. A glowing hand icon hovers over the largest cluster. Scooby narrates ("Ruh-roh! Pop those bubbles, Raggy!"). No progress bar shown (tutorial suppressed).
- **Player does:** Taps the highlighted cluster. One more tap completes the tutorial objective.
- **What happens next:** Celebratory pop animation. Short Scooby happy bark. Transition to Tutorial Level 2.

#### Tutorial Level 2 — "Chain for Scooby Snacks"
- **lifecycle_phase:** PLAY
- **Purpose:** Teach Power Bubble creation and the Scooby Snack reward.
- **Player sees:** 8×6 grid pre-seeded with a 6-bubble cluster that will create a Scooby Snack Bomb. Velma's thought-bubble tip: "A big cluster makes a powerful bubble!" No progress bar.
- **Player does:** Taps the large cluster; observes the Scooby Snack Bomb appear; taps it as part of a small cluster to activate.
- **What happens next:** Scooby catches the Snack token mid-air (animated). Transition to Chapter 1 Start Interstitial.

#### Chapter Start Interstitial
- **lifecycle_phase:** TITLE
- **Purpose:** Set narrative context for the chapter's haunted location and monster threat.
- **Player sees:** Full-screen illustration of the chapter's location (e.g., Haunted Beach Resort for Chapter 1). Chapter title card in funky 70s font. Daphne reads a short teaser ("Something's rotten at the Shagadelic Surf Lodge..."). "Let's Go!" button.
- **Player does:** Taps "Let's Go!" or waits for auto-advance (8 seconds). Session length: 5–10 seconds.
- **What happens next:** Gameplay Screen (Level 1 of this chapter).

#### Gameplay Screen
- **lifecycle_phase:** PLAY
- **Purpose:** Core game loop — pop bubbles, clear the board, advance the mystery.
- **Player sees:** 8×10 bubble grid (center). Top HUD: level number, tap counter (remaining taps), Mystery Meter (fills as clues reveal). Bottom area: Scooby sprite reacting in real-time. Background: chapter-themed illustration. Star progress indicators at top.
- **Player does:** Taps bubble clusters. Watches Power Bubbles spawn and chains react. Session length: 2–5 minutes.
- **What happens next:** Win condition met → Level Complete Screen. Tap counter reaches 0 → Loss Screen.

#### Level Complete Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Reward the player and set up the next level.
- **Player sees:** Stars awarded (1–3, based on efficiency). Scooby does a happy dance. Score and "Clue Progress" bar. "Next Level" button. Optional: Scooby Snack token bounce if earned. Session length: 5–10 seconds.
- **Player does:** Taps "Next Level" (or waits 5 seconds for auto-advance). Optionally collects bonus Scooby Snack.
- **What happens next:** Next level's Gameplay Screen (or Chapter Complete Screen if this was the final level).

#### Loss Screen
- **lifecycle_phase:** OUTCOME
- **Purpose:** Gentle recovery — offer continuation without punishment.
- **Player sees:** Scooby looks dejected but not defeated; Shaggy says "Zoinks! We almost had it!" (never "You lose" or "Game Over"). Tap counter shows 0. Three options: "Watch a Short Clip" (ad → +5 taps), "Use Scooby Snacks" (currency → +5 taps), "Try Again" (restart level at no cost). Session length: until player decides.
- **Player does:** Chooses one of the three options.
- **What happens next:** Ad/currency path → resume Gameplay Screen with +5 taps, board state preserved. "Try Again" → Gameplay Screen resets to initial board state. "Retreat" (small button, bottom) → Level Map / Title Screen.

#### Chapter Complete / Clue Reveal Screen
- **lifecycle_phase:** OUTCOME → PROGRESSION
- **Purpose:** Deliver the narrative payoff — the monster is unmasked, the mystery is solved.
- **Player sees:** Full-screen animated sequence: the villain's mask is pulled off (Scooby-Doo classic reveal). Assembled clue fragments play in a short slideshow. Final culprit card ("It was Old Man Jenkins all along!"). Stars summary for the chapter. "Next Chapter" button.
- **Player does:** Watches the reveal (skippable after 5 seconds). Taps "Next Chapter".
- **What happens next:** Chapter N+1 Start Interstitial.

### Board States

| State | Description | Input Accepted? |
|---|---|---|
| **Idle** | Grid is fully settled; no animations in progress | Yes — tap any cluster |
| **Animating — Pop** | Cluster dissolve animation (0–500 ms) | Yes — tap queued, executed after animation |
| **Animating — Fall** | Gravity fill in progress (0–400 ms) | No — tap ignored (debounce) |
| **Animating — Chain** | Power Bubble chain resolving (0–600 ms total) | No — tap ignored |
| **Animating — Cascade** | Refill bubbles entering from top (0–300 ms) | No — tap ignored |
| **Won** | Win condition just evaluated as true | No |
| **Lost** | Tap counter reached 0 | No |
| **Paused** | Player tapped pause button | No — overlay shown |

All state transitions that move or remove bubbles are animated (no instant snaps). Minimum animation duration: 150 ms.

### Win Condition

```
IF (cleared_cells / total_non_blocker_cells) >= targetClearPercent
   AND taps_remaining >= 0
THEN level_is_won
```

Win is evaluated after every gravity fill settles (i.e., after the Idle state is re-entered).

### Lose Condition

```
IF taps_remaining == 0
   AND board_state == Idle
   AND win_condition == false
THEN level_is_lost
```

The lose check runs only when the board reaches Idle with zero taps remaining.

### Win Sequence (ordered)

1. Final cluster pop animation plays.
2. Gravity fill and any chain reactions complete; board reaches Idle.
3. Win condition evaluated → true.
4. Board transitions to Won state; input locked.
5. Mystery Meter fills to 100 % with a shimmer animation (300 ms).
6. Clue fragment in rows 7–10 fully reveals with a parchment-unfurl animation (500 ms).
7. Star calculation runs; 1–3 stars animate in one by one (200 ms each).
8. Scooby victory animation plays (happy bark, tail wag, Scooby Snack catch) — 1.5 seconds.
9. Level Complete Screen fades in.
10. "Next Level" button becomes active.

### Loss Sequence (ordered)

1. Final tap is consumed; tap counter reaches 0.
2. Current animation (if any) completes normally.
3. Board reaches Idle; lose condition evaluated → true.
4. Board transitions to Lost state; input locked.
5. Scooby sad animation plays (drooping ears, quiet whimper) — 1 second.
6. Remaining clue reveals at 30 % opacity with a translucent overlay and "So Close!" text — 500 ms.
7. Loss Screen slides up from the bottom — 300 ms.
8. Options ("Watch a Short Clip", "Use Scooby Snacks", "Try Again") animate in staggered — 100 ms each.
9. Input re-enabled on Loss Screen buttons.
