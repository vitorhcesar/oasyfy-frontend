import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Textarea } from "@/presentation/components/ui/textarea";
import type { IPracaMessageDto } from "@/infra/http/services/api/modules/types/praca.types";
import { cn } from "@/presentation/utils/cn";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface IPracaChatProps {
  currentUserId: number;
  messages: IPracaMessageDto[];
  sending?: boolean;
  loadingOlder?: boolean;
  hasOlder?: boolean;
  onSend: (body: string) => Promise<void>;
  onLoadOlder?: () => void;
  onDelete?: (messageId: number) => Promise<void>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PracaChat({
  currentUserId,
  messages,
  sending = false,
  loadingOlder = false,
  hasOlder = false,
  onSend,
  onLoadOlder,
  onDelete,
}: IPracaChatProps) {
  const [draft, setDraft] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    await onSend(body);
    setDraft("");
  };

  return (
    <div className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/40">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {hasOlder && onLoadOlder ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loadingOlder}
              onClick={onLoadOlder}
            >
              {loadingOlder ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Carregar mais
            </Button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Seja o primeiro a escrever na Praça.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.author.id === currentUserId;
            return (
              <div
                key={message.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-3 py-2",
                    mine
                      ? "border-primary/30 bg-primary/10"
                      : "border-white/10 bg-muted/40",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {message.author.displayName}
                    </span>
                    {message.author.role === "admin" ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        Admin
                      </Badge>
                    ) : null}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(message.createdAt)}
                    </span>
                    {onDelete ? (
                      <button
                        type="button"
                        className="ml-auto text-muted-foreground hover:text-destructive"
                        disabled={deletingId === message.id}
                        onClick={async () => {
                          if (
                            !window.confirm(
                              "Apagar esta mensagem para todos na Praça?",
                            )
                          ) {
                            return;
                          }
                          setDeletingId(message.id);
                          try {
                            await onDelete(message.id);
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        aria-label="Apagar mensagem"
                      >
                        {deletingId === message.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                    {message.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <Textarea
          value={draft}
          maxLength={1000}
          placeholder="Escreva uma mensagem…"
          className="min-h-[72px] resize-none"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {draft.trim().length}/1000
          </span>
          <Button
            type="button"
            size="sm"
            disabled={sending || draft.trim().length === 0}
            onClick={() => void submit()}
          >
            {sending ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
