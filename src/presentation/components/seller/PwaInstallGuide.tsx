import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/presentation/components/ui/tabs";
import { cn } from "@/presentation/utils/cn";
import type {
  TPwaInstallContext,
  TPwaInstallPlatform,
} from "@/presentation/utils/detect-pwa-install-context";
import { CheckCircle2, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { useState } from "react";

const PLATFORM_META: Record<
  TPwaInstallPlatform,
  { label: string; title: string; steps: string[]; note: string }
> = {
  android: {
    label: "Android",
    title: "Instalar no Android",
    steps: [
      "Abra o menu ⋮ (canto superior do Chrome).",
      "Toque em Instalar app ou Adicionar à tela inicial.",
      "Confirme a instalação.",
      "Abra o Omegapay pelo ícone novo e volte em Notificações → Ativar notificações.",
    ],
    note: "Use Chrome ou Edge atualizados; funciona melhor em HTTPS.",
  },
  ios: {
    label: "iOS",
    title: "Instalar no iPhone / iPad",
    steps: [
      "No Safari, toque em Compartilhar (quadrado com seta).",
      "Role e toque em Adicionar à Tela de Início.",
      "Confirme Adicionar.",
      "Abra o app pelo ícone na tela inicial.",
      "Em Notificações, toque em Ativar notificações e permita no sistema.",
    ],
    note: "Requer iOS 16.4+ para push; notificações não funcionam só na aba do Safari sem adicionar à Tela de Início.",
  },
  desktop: {
    label: "Desktop",
    title: "Instalar no computador",
    steps: [
      "Na barra de endereço, clique no ícone de instalação (monitor/+) ou abra o menu ⋮ → Instalar Omegapay.",
      "Confirme a instalação.",
      "O app abre em janela própria; em Notificações, ative os avisos se desejar.",
    ],
    note: "Prefira Chrome ou Edge. Também vale instalar no celular para receber vendas durante o dia.",
  },
};

const PLATFORMS = [
  "android",
  "ios",
  "desktop",
] as const satisfies readonly TPwaInstallPlatform[];

function PlatformIcon({
  platform,
  className,
}: {
  platform: TPwaInstallPlatform;
  className?: string;
}) {
  if (platform === "desktop") {
    return <Monitor className={className} aria-hidden />;
  }
  if (platform === "ios") {
    return <TabletSmartphone className={className} aria-hidden />;
  }
  return <Smartphone className={className} aria-hidden />;
}

function GuideSteps({ platform }: { platform: TPwaInstallPlatform }) {
  const meta = PLATFORM_META[platform];
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{meta.title}</h3>
      <ol className="mt-3 space-y-2.5">
        {meta.steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-semibold text-foreground">
              {index + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground/90">{meta.note}</p>
    </div>
  );
}

type TPwaInstallGuideProps = {
  context: TPwaInstallContext;
  showOtherPlatforms?: boolean;
  className?: string;
};

export function PwaInstallGuide({
  context,
  showOtherPlatforms = true,
  className,
}: TPwaInstallGuideProps) {
  const [selected, setSelected] = useState<TPwaInstallPlatform>(
    context.platform,
  );

  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-background/40 p-5 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-xl p-2.5",
            context.isStandalone
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-primary/15 text-primary",
          )}
        >
          {context.isStandalone ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          ) : (
            <PlatformIcon platform={context.platform} className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">
            {context.isStandalone
              ? "App já instalado neste dispositivo"
              : "Como instalar o app"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.isStandalone
              ? "Você já está usando o Omegapay instalado. Ative as notificações abaixo para receber avisos."
              : "Instale o Omegapay para abrir como app e receber avisos com mais estabilidade."}
          </p>
        </div>
      </div>

      {!context.isStandalone && context.isIosNonSafari ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-100/95"
        >
          No iPhone/iPad, use o <strong className="font-semibold">Safari</strong>{" "}
          para adicionar à Tela de Início e receber notificações. Os passos abaixo
          são do Safari.
        </div>
      ) : null}

      {showOtherPlatforms ? (
        <div className={cn(context.isStandalone ? "mt-5 border-t border-white/10 pt-4" : "mt-4")}>
          {context.isStandalone ? (
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Instalar em outros dispositivos
            </p>
          ) : null}
          <Tabs
            value={selected}
            onValueChange={(value) =>
              setSelected(value as TPwaInstallPlatform)
            }
          >
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/40 p-1">
              {PLATFORMS.map((platform) => (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="gap-1.5 px-2 py-2 text-xs sm:text-sm"
                >
                  <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                  {PLATFORM_META[platform].label}
                  {platform === context.platform ? (
                    <span className="sr-only"> (atual)</span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
            {PLATFORMS.map((platform) => (
              <TabsContent key={platform} value={platform} className="mt-4">
                <GuideSteps platform={platform} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : !context.isStandalone ? (
        <div className="mt-4">
          <GuideSteps platform={context.platform} />
        </div>
      ) : null}
    </section>
  );
}
