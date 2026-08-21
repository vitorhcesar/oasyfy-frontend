import { Button } from "@/presentation/components/ui/button";
import { formatCurrency } from "@/presentation/pages/AdminTransactionsPage/utils/format-currency";
import { prefersReducedMotion } from "@/presentation/components/minigame/minigame-match.util";
import { useEffect } from "react";
import { Link } from "react-router-dom";

interface IMinigameResultModalProps {
  open: boolean;
  youWon: boolean;
  stakeCents: number;
  winnerNetCents: number;
  feeCents: number;
}

export function MinigameResultModal({
  open,
  youWon,
  stakeCents,
  winnerNetCents,
  feeCents,
}: IMinigameResultModalProps) {
  useEffect(() => {
    if (!open || !youWon || prefersReducedMotion()) return;
    let cancelled = false;
    void import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const fire = mod.default;
      fire({
        particleCount: 80,
        spread: 68,
        origin: { y: 0.32 },
        disableForReducedMotion: true,
      });
      window.setTimeout(() => {
        if (cancelled) return;
        fire({
          particleCount: 40,
          angle: 60,
          spread: 50,
          origin: { x: 0, y: 0.6 },
          disableForReducedMotion: true,
        });
        fire({
          particleCount: 40,
          angle: 120,
          spread: 50,
          origin: { x: 1, y: 0.6 },
          disableForReducedMotion: true,
        });
      }, 160);
    });
    return () => {
      cancelled = true;
    };
  }, [open, youWon]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-background p-6 text-center shadow-2xl animate-fade-in-scale">
        <p className="text-2xl font-semibold tracking-tight">
          {youWon ? "Você venceu" : "Você perdeu"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {youWon
            ? `Seu saldo sobe ${formatCurrency(winnerNetCents)} (taxa ${formatCurrency(feeCents)}).`
            : `Você colocou ${formatCurrency(stakeCents)} nesta partida.`}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/seller/praca">Voltar à Praça</Link>
        </Button>
      </div>
    </div>
  );
}
