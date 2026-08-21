import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/presentation/components/ui/sheet";
import { Button } from "@/presentation/components/ui/button";
import { MinigameQuoteSummary } from "@/presentation/components/praca/MinigameQuoteSummary";
import { getMinigameCatalogItem } from "@/presentation/components/praca/minigame-catalog";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { useMinigameLobbySocket } from "@/presentation/hooks/use-minigame-lobby-socket";
import type { IMinigameChallengeDto } from "@/infra/http/services/api/modules/types/minigame.types";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { useAuthContext } from "@/presentation/context/AuthContext";
import { Clock, Loader2, Swords } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

function remainingLabel(expiresAt: string, nowMs: number) {
  const ms = new Date(expiresAt).getTime() - nowMs;
  return Math.max(0, Math.ceil(ms / 1000));
}

export function SellerMinigamePanels() {
  const apiService = useApiService();
  const { user } = useAuthContext();
  const currentUserId = Number(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [incoming, setIncoming] = useState<IMinigameChallengeDto[]>([]);
  const [activeMinigameId, setActiveMinigameId] = useState<number | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const loadInbox = useCallback(async () => {
    if (!Number.isInteger(currentUserId) || currentUserId <= 0) return;
    try {
      const data = await apiService.modules.sellerMinigame.inbox();
      const pending = data.challenges.filter((item) => item.status === "pending");
      setIncoming(
        pending.filter((item) => Number(item.challenged.sellerId) === currentUserId),
      );
      setActiveMinigameId(data.activeMinigameId);
    } catch {
      // layout should not toast on every poll
    }
  }, [apiService, currentUserId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useMinigameLobbySocket({
    enabled: Number.isInteger(currentUserId) && currentUserId > 0,
    onSync: () => {
      void loadInbox();
    },
    onEvent: (event) => {
      if (event.type === "challenge.incoming") {
        const challenge = event.challenge;
        if (Number(challenge.challenged.sellerId) !== currentUserId) return;
        setIncoming((current) =>
          current.some((item) => item.id === challenge.id)
            ? current
            : [challenge, ...current],
        );
      }
      if (event.type === "challenge.accepted") {
        setIncoming([]);
        setActiveMinigameId(event.challenge.id);
        navigate(`/seller/minigames/${event.challenge.id}`);
      }
      if (event.type === "match.finished") {
        setActiveMinigameId(null);
        toast.success("Minigame encerrado");
      }
    },
  });

  const visibleIncoming = incoming.filter(
    (item) => remainingLabel(item.expiresAt, nowTick) > 0 && item.status === "pending",
  );
  const featured = visibleIncoming[0] ?? null;
  const onMatchPage =
    activeMinigameId != null &&
    location.pathname === `/seller/minigames/${activeMinigameId}`;

  const handleAccept = async (id: number) => {
    setActingId(id);
    try {
      await apiService.modules.sellerMinigame.accept(id);
      navigate(`/seller/minigames/${id}`);
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível aceitar"));
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (id: number) => {
    setActingId(id);
    try {
      await apiService.modules.sellerMinigame.decline(id);
      setIncoming((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Não foi possível recusar"));
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <Sheet open={featured != null && !onMatchPage}>
        <SheetContent side="right" className="flex w-[90%] flex-col sm:max-w-lg">
          {featured ? (
            <IncomingChallengeBody
              challenge={featured}
              remainingSeconds={remainingLabel(featured.expiresAt, nowTick)}
              acting={actingId === featured.id}
              onAccept={() => void handleAccept(featured.id)}
              onDecline={() => void handleDecline(featured.id)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      {activeMinigameId != null && !onMatchPage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-background/90 px-4 py-3 shadow-lg backdrop-blur-md">
            <Swords size={18} className="text-primary" />
            <p className="text-sm font-medium">Você está no meio de um minigame</p>
            <Button asChild size="sm">
              <Link to={`/seller/minigames/${activeMinigameId}`}>Voltar</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function IncomingChallengeBody({
  challenge,
  remainingSeconds,
  acting,
  onAccept,
  onDecline,
}: {
  challenge: IMinigameChallengeDto;
  remainingSeconds: number;
  acting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const game = getMinigameCatalogItem(challenge.type);
  const GameIcon = game?.Icon;
  const winnerNetCents = challenge.stakeCents - challenge.feeCents;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-start gap-2.5 pr-6 text-left">
          <Swords className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>Desafio na Praça</span>
        </SheetTitle>
        <SheetDescription>
          {challenge.challenger.displayName} te desafiou. O valor é reservado
          até o aceite.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/10 px-3 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            {GameIcon ? <GameIcon className="h-6 w-7" /> : <Swords size={20} />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {game?.label ?? "Minigame"}
            </p>
            {challenge.type === "rock_paper_scissors" ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Melhor de {challenge.gameConfig.bestOf}
              </p>
            ) : null}
          </div>
        </div>

        <MinigameQuoteSummary
          stakeCents={challenge.stakeCents}
          potCents={challenge.potCents}
          feeCents={challenge.feeCents}
          winnerNetCents={winnerNetCents}
        />

        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Clock size={15} />
          </span>
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            Expira em
          </p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {remainingSeconds}s
          </p>
        </div>
      </div>

      <SheetFooter className="gap-2 sm:justify-stretch">
        <Button variant="outline" disabled={acting} onClick={onDecline}>
          Recusar
        </Button>
        <Button disabled={acting} onClick={onAccept}>
          {acting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Swords size={16} />
          )}
          Aceitar
        </Button>
      </SheetFooter>
    </>
  );
}
