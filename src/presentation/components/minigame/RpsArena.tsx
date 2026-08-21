import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import {
  getMinigameCatalogItem,
} from "@/presentation/components/praca/minigame-catalog";
import { MinigameResultModal } from "@/presentation/components/minigame/MinigameResultModal";
import {
  prefersReducedMotion,
  rpsWinsNeeded,
} from "@/presentation/components/minigame/minigame-match.util";
import {
  RPS_CHOICES,
  initialsFromName,
  rpsEmoji,
  shortPlayerName,
} from "@/presentation/components/minigame/rps-choices";
import type {
  IMinigameMatchDto,
  TRpsChoice,
} from "@/infra/http/services/api/modules/types/minigame.types";
import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { cn } from "@/presentation/utils/cn";
import { useEffect, useRef, useState, type ReactNode } from "react";

type TArenaPhase = "play" | "reveal" | "round-result";

interface IRpsArenaProps {
  match: IMinigameMatchDto;
  submitting?: boolean;
  onChoose: (choice: TRpsChoice) => Promise<void>;
}

export function RpsArena({ match, submitting = false, onChoose }: IRpsArenaProps) {
  const game = getMinigameCatalogItem(match.type);
  const winsNeeded = rpsWinsNeeded(match.gameConfig.bestOf);
  const GameIcon = game?.Icon;
  const [phase, setPhase] = useState<TArenaPhase>("play");
  const [displayedYouScore, setDisplayedYouScore] = useState(match.you.score);
  const [displayedOpponentScore, setDisplayedOpponentScore] = useState(
    match.opponent.score,
  );
  const [revealRound, setRevealRound] = useState<
    IMinigameMatchDto["rounds"][number] | null
  >(null);
  const [showResultModal, setShowResultModal] = useState(
    match.settlement != null,
  );
  const [, setTick] = useState(0);
  const hydratedRef = useRef(false);
  const animatedRoundRef = useRef(0);
  const matchRef = useRef(match);
  matchRef.current = match;
  const lastRoundNumber = match.rounds[match.rounds.length - 1]?.roundNumber ?? 0;

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const snapshot = matchRef.current;
    const last = snapshot.rounds[snapshot.rounds.length - 1] ?? null;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      animatedRoundRef.current = last?.roundNumber ?? 0;
      setDisplayedYouScore(snapshot.you.score);
      setDisplayedOpponentScore(snapshot.opponent.score);
      if (snapshot.settlement) setShowResultModal(true);
      return;
    }
    if (!last || last.roundNumber <= animatedRoundRef.current) return;
    animatedRoundRef.current = last.roundNumber;

    const reduced = prefersReducedMotion();
    const nextYou = snapshot.you.score;
    const nextOpp = snapshot.opponent.score;
    const finished = snapshot.settlement != null;

    if (reduced) {
      setDisplayedYouScore(nextYou);
      setDisplayedOpponentScore(nextOpp);
      setRevealRound(null);
      setPhase("play");
      if (finished) setShowResultModal(true);
      return;
    }

    setRevealRound(last);
    setPhase("reveal");
    const roundResultAt = window.setTimeout(() => setPhase("round-result"), 850);
    const scoreAt = window.setTimeout(() => {
      setDisplayedYouScore(nextYou);
      setDisplayedOpponentScore(nextOpp);
    }, 1150);
    const resumeAt = window.setTimeout(() => {
      setPhase("play");
      setRevealRound(null);
      if (finished) setShowResultModal(true);
    }, 2200);

    return () => {
      window.clearTimeout(roundResultAt);
      window.clearTimeout(scoreAt);
      window.clearTimeout(resumeAt);
    };
  }, [lastRoundNumber]);

  const current = match.currentRound;
  const revealing = phase !== "play";
  const seconds =
    current && phase === "play" ? remainingSeconds(current.deadlineAt) : null;
  const youChoice =
    revealing && revealRound
      ? revealRound.yourChoice
      : current?.yourChoice ?? null;
  const opponentChoice =
    revealing && revealRound ? revealRound.opponentChoice : null;
  const opponentLocked =
    !revealing && current?.opponentLocked === true && current.opponentChoice == null;

  const roundWinnerLabel = revealRound
    ? revealRound.winnerSide === "you"
      ? "Você venceu a rodada"
      : revealRound.winnerSide === "opponent"
        ? `${shortPlayerName(match.opponent.displayName)} venceu a rodada`
        : "Empate"
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {GameIcon ? <GameIcon className="h-5 w-6" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {game?.label ?? "Minigame"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(match.stakeCents)} · melhor de{" "}
            {match.gameConfig.bestOf}
          </p>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <PlayerPanel
          name={match.opponent.displayName}
          avatarUrl={match.opponent.avatarUrl}
          score={displayedOpponentScore}
          winsNeeded={winsNeeded}
          choice={revealing ? null : opponentChoice}
          locked={opponentLocked}
          waitingLabel={revealing ? "" : "Escolhendo…"}
          align="opponent"
        />
        <PlayerPanel
          name={match.you.displayName}
          avatarUrl={match.you.avatarUrl}
          score={displayedYouScore}
          winsNeeded={winsNeeded}
          choice={revealing ? null : youChoice}
          locked={current?.youLocked === true && !revealing}
          waitingLabel={
            revealing ? "" : current?.youLocked ? "Você já escolheu" : "Sua vez"
          }
          align="you"
          footer={
            match.status === "in_progress" && current && !revealing ? (
              <div className="grid w-full max-w-md grid-cols-3 gap-2 sm:gap-3">
                {RPS_CHOICES.map((choice) => {
                  const selected = current.yourChoice === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      disabled={
                        submitting || current.youLocked || match.settlement != null
                      }
                      onClick={() => void onChoose(choice.value)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-3xl border transition-transform duration-200 motion-reduce:transition-none",
                        selected
                          ? "scale-[1.03] border-primary bg-primary/20"
                          : "border-white/10 bg-background/55 hover:bg-white/10",
                        "disabled:opacity-60",
                      )}
                    >
                      <span className="text-4xl sm:text-5xl md:text-6xl leading-none">
                        {choice.emoji}
                      </span>
                      <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                        {choice.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null
          }
        />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          {phase === "play" && seconds != null && match.status === "in_progress" ? (
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full border-4 bg-background/80 text-3xl font-semibold tabular-nums shadow-lg backdrop-blur-md sm:h-24 sm:w-24 sm:text-4xl",
                seconds <= 5
                  ? "border-destructive text-destructive animate-rps-timer-urgent motion-reduce:animate-none"
                  : "border-primary text-foreground animate-rps-timer-pulse motion-reduce:animate-none",
              )}
            >
              {seconds}
            </div>
          ) : null}

          {phase === "reveal" && revealRound ? (
            <div className="flex items-center gap-6 sm:gap-10">
              <span className="text-6xl sm:text-8xl animate-rps-emoji-in motion-reduce:animate-none">
                {rpsEmoji(revealRound.opponentChoice)}
              </span>
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                vs
              </span>
              <span
                className="text-6xl sm:text-8xl animate-rps-emoji-in motion-reduce:animate-none"
                style={{ animationDelay: "80ms" }}
              >
                {rpsEmoji(revealRound.yourChoice)}
              </span>
            </div>
          ) : null}

          {phase === "round-result" && roundWinnerLabel ? (
            <div className="rounded-2xl border border-white/10 bg-background/85 px-5 py-3 shadow-xl backdrop-blur-md animate-rps-winner-in motion-reduce:animate-none">
              <p className="text-lg font-semibold sm:text-xl">{roundWinnerLabel}</p>
            </div>
          ) : null}
        </div>
      </div>

      <MinigameResultModal
        open={showResultModal && match.settlement != null}
        youWon={match.settlement?.youWon === true}
        stakeCents={match.stakeCents}
        winnerNetCents={match.settlement?.winnerNetCents ?? 0}
        feeCents={match.settlement?.feeCents ?? 0}
      />
    </div>
  );
}

function remainingSeconds(deadlineAt: string) {
  return Math.max(
    0,
    Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000),
  );
}

function PlayerPanel({
  name,
  avatarUrl,
  score,
  winsNeeded,
  choice,
  locked,
  waitingLabel,
  align,
  footer,
}: {
  name: string;
  avatarUrl: string | null;
  score: number;
  winsNeeded: number;
  choice: TRpsChoice | null;
  locked: boolean;
  waitingLabel: string;
  align: "you" | "opponent";
  footer?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-6",
        align === "you"
          ? "bg-primary/[0.07] md:border-l md:border-white/10"
          : "bg-black/[0.03] dark:bg-white/[0.03]",
      )}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: winsNeeded }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-3 w-3 rounded-full border-2 transition-colors duration-500 sm:h-3.5 sm:w-3.5 motion-reduce:transition-none",
                index < score
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-white/30 bg-transparent",
              )}
            />
          ))}
        </div>
        <Avatar className="h-16 w-16 ring-2 ring-white/15 sm:h-20 sm:w-20 md:h-24 md:w-24">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className="text-sm font-semibold text-primary sm:text-base">
            {initialsFromName(name)}
          </AvatarFallback>
        </Avatar>
        <p className="max-w-full truncate text-center text-sm font-semibold">
          {shortPlayerName(name)}
        </p>
      </div>

      <div className="flex min-h-[4.5rem] flex-col items-center justify-center">
        {choice ? (
          <span className="text-5xl sm:text-6xl animate-rps-emoji-in motion-reduce:animate-none">
            {rpsEmoji(choice)}
          </span>
        ) : locked ? (
          <p className="rounded-full border border-white/10 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground animate-rps-locked motion-reduce:animate-none">
            Já escolheu
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{waitingLabel}</p>
        )}
      </div>

      <div className="flex w-full justify-center">{footer}</div>
    </section>
  );
}
