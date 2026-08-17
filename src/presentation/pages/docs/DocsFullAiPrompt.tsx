import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getFullDocsAiPrompt } from "./docs-ai-prompts";

export function DocsFullAiPrompt() {
  const prompt = getFullDocsAiPrompt();

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Documentação completa copiada para a IA");
    } catch {
      toast.error("Não foi possível copiar o prompt");
    }
  };

  return (
    <div className="space-y-8">
      <p>
        Esta página reúne <strong>toda</strong> a documentação da API em um
        único prompt. Cole no Claude, ChatGPT, Lovable, Cursor ou outra IA para
        implementar a integração completa (PIX, consultas, saques e webhooks).
      </p>
      <button
        type="button"
        onClick={() => void copyPrompt()}
        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
      >
        <Sparkles size={16} className="shrink-0" />
        Copiar documentação completa
      </button>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="documento"
            className="scroll-mt-24 text-lg font-semibold text-white"
          >
            Documento para a IA
          </h2>
          <button
            type="button"
            onClick={() => void copyPrompt()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
            title="Copiar"
          >
            <Copy size={13} />
            Copiar
          </button>
        </div>
        <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-[#11151c] p-4 font-['IBM_Plex_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-[13px] font-medium leading-[1.7] tracking-tight text-[#d7e7f4] [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
          <code>{prompt}</code>
        </pre>
      </div>
    </div>
  );
}
