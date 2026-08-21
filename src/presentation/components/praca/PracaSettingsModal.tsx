import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { Switch } from "@/presentation/components/ui/switch";

interface IPracaSettingsModalProps {
  open: boolean;
  challengesEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  onChallengesEnabledChange: (enabled: boolean) => void;
}

export function PracaSettingsModal({
  open,
  challengesEnabled,
  onOpenChange,
  onChallengesEnabledChange,
}: IPracaSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-[420px] gap-0 border-border/60 p-0 sm:rounded-2xl">
        <DialogHeader className="px-5 pb-3 pt-5 pr-12 text-left">
          <DialogTitle className="text-base font-semibold tracking-tight">
            Configurações Gerais
          </DialogTitle>
          <DialogDescription className="sr-only">
            Preferências da Praça
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 pb-5">
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Desafios
            </h3>
            <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Receber desafios
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Quando desligado, outros sellers não poderão te desafiar.
                </p>
              </div>
              <Switch
                checked={challengesEnabled}
                onCheckedChange={onChallengesEnabledChange}
                aria-label="Receber desafios"
              />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
