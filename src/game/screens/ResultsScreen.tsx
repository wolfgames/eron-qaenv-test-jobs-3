import { createMemo, createSignal, Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';
import { PhaseCode } from '~/game/mystery-munchies/state/types';
import { WatchAdResponse } from '~/game/mystery-munchies/logic/winLossSequences';

/**
 * Results screen — branches between win and loss based on boardPhase.
 *
 * Per the GDD's collision-resolved:results-copy, this screen never shows
 * 'Game Over' on either branch. The win branch reads as 'Mystery Solved!'
 * and the loss branch shows Shaggy's "Zoinks! We almost had it!" line
 * with three recovery options.
 *
 * The Watch Ad button is intentionally visible and responsive — it is
 * NOT a stub. Tapping it surfaces a 'Coming Soon' toast (per
 * q-continue-system-ad-integration core-pass decision).
 */
export function ResultsScreen() {
  const { goto } = useScreen();
  const [toastMessage, setToastMessage] = createSignal<string | null>(null);

  const isWin = createMemo(() => gameState.boardPhaseCode() === PhaseCode.won);
  const stars = createMemo(() => gameState.starsEarned());

  const handlePlayAgain = () => {
    gameState.reset();
    goto('game');
  };

  const handleNextLevel = () => {
    gameState.reset();
    gameState.incrementLevel();
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  const handleWatchAd = () => {
    const response = WatchAdResponse.handleTap();
    setToastMessage(response.message);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const handleSpendSnacks = () => {
    setToastMessage('Coming Soon — Scooby Snack wallet unlocks soon.');
    setTimeout(() => setToastMessage(null), 2400);
  };

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#2D1A4A] to-[#0E0524] px-6">
      <Show
        when={isWin()}
        fallback={
          // ── Loss branch ──────────────────────────────────────────────
          <div class="flex flex-col items-center" style={{ 'max-width': '320px' }}>
            <h1 class="text-3xl font-bold text-[#FFC857] mb-2">
              Zoinks! We almost had it!
            </h1>
            <p class="text-white/80 text-sm mb-6 text-center">
              The Mystery Inc. gang ran out of taps before solving the
              mystery. Try again, Shaggy?
            </p>

            <div class="text-center mb-8">
              <p class="text-white/60 text-sm mb-1">Score</p>
              <p class="text-5xl font-bold text-white">
                {gameState.score()}
              </p>
            </div>

            <div class="flex flex-col gap-3 w-full">
              <Button onClick={handleWatchAd}>Watch Ad — +5 Taps</Button>
              <Button variant="secondary" onClick={handleSpendSnacks}>
                Spend +5 Snacks — +5 Taps
              </Button>
              <Button variant="secondary" onClick={handlePlayAgain}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={handleMainMenu}>
                Main Menu
              </Button>
            </div>
          </div>
        }
      >
        {/* ── Win branch ────────────────────────────────────────────── */}
        <div class="flex flex-col items-center" style={{ 'max-width': '320px' }}>
          <h1 class="text-3xl font-bold text-[#FFC857] mb-2">Mystery Solved!</h1>
          <p class="text-white/80 text-sm mb-4 text-center">
            Like, far out! The gang unmasks another monster.
          </p>

          <div class="flex gap-2 mb-6 text-3xl">
            <span class={stars() >= 1 ? 'text-[#FFD24A]' : 'text-white/20'}>*</span>
            <span class={stars() >= 2 ? 'text-[#FFD24A]' : 'text-white/20'}>*</span>
            <span class={stars() >= 3 ? 'text-[#FFD24A]' : 'text-white/20'}>*</span>
          </div>

          <div class="text-center mb-8">
            <p class="text-white/60 text-sm mb-1">Score</p>
            <p class="text-5xl font-bold text-white">{gameState.score()}</p>
          </div>

          <div class="flex flex-col gap-3 w-full">
            <Button onClick={handleNextLevel}>Next Level</Button>
            <Button variant="secondary" onClick={handlePlayAgain}>Play Again</Button>
            <Button variant="secondary" onClick={handleMainMenu}>Main Menu</Button>
          </div>
        </div>
      </Show>

      {/* Toast — used by Watch Ad / Snacks responses */}
      <Show when={toastMessage()}>
        <div
          class="absolute bottom-24 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-2xl"
          style={{ background: '#1A1030', color: '#FFC857' }}
        >
          {toastMessage()}
        </div>
      </Show>
    </div>
  );
}
