import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/presentation/components/ui/tooltip";
import { getDocsAiPrompt } from "./docs-ai-prompts";

export function DocsIntegrateAiButton({ slug }: { slug: string }) {
  const prompt = getDocsAiPrompt(slug);
  if (!prompt) return null;

  const isFullGuide = slug === "integrar-com-ia";

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(
        isFullGuide
          ? "Documentação completa copiada para a IA"
          : "Prompt copiado para a IA",
      );
    } catch {
      toast.error("Não foi possível copiar o prompt");
    }
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => void copyPrompt()}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/70 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
        >
          <Sparkles size={14} className="shrink-0" />
          Integrar com IA
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="border-white/10 bg-black text-xs text-white"
      >
        {isFullGuide
          ? "Copiar documentação completa para a IA"
          : "Copiar instruções para IA (Claude, ChatGPT, Lovable, etc)"}
      </TooltipContent>
    </Tooltip>
  );
}
