# Interaction Archetype — Mystery Munchies

The single primary gesture in Mystery Munchies is the cluster-pop tap. Every
visible affordance and every game state transition is downstream of this one
gesture.

## Gesture

| Property | Value |
|---|---|
| Gesture type | Single tap (pointertap) |
| Acts on | Bubble cell |
| Activation | A connected group of 2+ same-color bubbles touching orthogonally |
| Passive feedback | Bubble visual is always rendered, never invisible |
| Active feedback | Group dissolves with smoke wisp; score delta animates upward; tap counter decrements |
| Cancel behavior | Pointer cancel between pointerdown and pointerup aborts the tap; no state change |
| Drag threshold | None — there is no drag gesture; input is committed on pointertap (synthesized when pointerup is over the same cell as pointerdown) |

## Pointer Sequence

1. `pointerdown` on a bubble cell — visual hover/pressed feedback (subtle scale 0.95) starts.
2. `pointermove` outside the cell before `pointerup` — the press is canceled, no tap fires.
3. `pointerup` on the same cell — `pointertap` synthesizes; the cluster is computed and acted on.

The controller-level handler reads the pixel coordinates from the federated
event, asks `BoardRenderer.hitTest()` for the (row, col), then dispatches the
pure `findCluster()` to compute the connected group.

## Outcome Table

| Cluster size | Phase | Outcome |
|---|---|---|
| ≥ 2 | `idle` | Pop: cluster dissolves, score increments, taps decrement |
| 1 (lone bubble) | `idle` | **Wobble**: ~200ms horizontal oscillation, no state change, no tap consumed |
| 0 (empty cell) | `idle` | Silent no-op (no visible cell to wobble) |
| any | `animating-pop`, `animating-fall`, `won`, `lost` | Ignore — input is blocked during sequences |

The wobble is the **canonical** "invalid action" feedback. It is the contract:
no silent rejection, ever. Without wobble feedback the player cannot tell
whether the touch was registered.

## Feel

- **Crisp**: pop animation starts within 16ms of pointertap.
- **Immediate**: tap counter decrements in the same frame; the player sees the
  number drop before the dissolve completes.
- **Forgiving**: lone-bubble wobble does NOT consume a tap. Mistakes are free.
- **Inviting**: GSAP `back.out` easing on the pop scale tween makes each pop
  feel rewarded with a slight bounce.

## Wobble Specification

| Property | Value |
|---|---|
| Trigger | Tap on a cell whose cluster size is 1 |
| Visual | Horizontal x-shake on the bubble container |
| Duration | 200ms (≤ 100ms latency from pointertap) |
| Amplitude | 4px peak displacement |
| Easing | GSAP `power2.out` |
| Cleanup | x position reset to cell center on completion |

## Why This Document Exists

This file is required by the `core-interaction` exit criterion. It is the
durable record of what "the gesture" is, separate from the code, so the
gesture can be reviewed, criticized, and improved without combing through
GameController code.
