import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import { Textarea } from "@/presentation/components/ui/textarea";
import type {
  IPracaMessageDto,
  IPracaQuotedMessageDto,
} from "@/infra/http/services/api/modules/types/praca.types";
import { cn } from "@/presentation/utils/cn";
import { Loader2, Reply, Send, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface IPracaChatProps {
  currentUserId: number;
  messages: IPracaMessageDto[];
  sending?: boolean;
  loadingOlder?: boolean;
  hasOlder?: boolean;
  onSend: (body: string, quotedMessageId?: number | null) => Promise<void>;
  onLoadOlder?: () => void;
  onDelete?: (messageId: number) => Promise<void>;
}

const NAME_PALETTE = [
  { text: "text-rose-400", bar: "bg-rose-400" },
  { text: "text-emerald-400", bar: "bg-emerald-400" },
  { text: "text-sky-400", bar: "bg-sky-400" },
  { text: "text-amber-400", bar: "bg-amber-400" },
  { text: "text-violet-400", bar: "bg-violet-400" },
  { text: "text-teal-400", bar: "bg-teal-400" },
  { text: "text-orange-400", bar: "bg-orange-400" },
  { text: "text-pink-400", bar: "bg-pink-400" },
] as const;

function authorColor(userId: number) {
  return NAME_PALETTE[Math.abs(userId) % NAME_PALETTE.length] ?? NAME_PALETTE[0];
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function messageDomId(id: number) {
  return `praca-msg-${id}`;
}

function QuotedPreview({
  quoted,
  className,
}: {
  quoted: IPracaQuotedMessageDto;
  className?: string;
}) {
  const color = authorColor(quoted.author.id);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        document
          .getElementById(messageDomId(quoted.id))
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className={cn(
        "mb-1.5 flex w-full overflow-hidden rounded-md bg-black/20 text-left",
        className,
      )}
    >
      <span className={cn("w-1 shrink-0", color.bar)} />
      <span className="min-w-0 flex-1 px-2 py-1.5">
        <span className={cn("block truncate text-[11px] font-semibold", color.text)}>
          {quoted.author.displayName}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {quoted.body}
        </span>
      </span>
    </button>
  );
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
  const [replyTo, setReplyTo] = useState<IPracaMessageDto | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId]);

  const replyPreview = useMemo(() => {
    if (!replyTo) return null;
    return {
      id: replyTo.id,
      body: replyTo.body,
      author: replyTo.author,
    } satisfies IPracaQuotedMessageDto;
  }, [replyTo]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    await onSend(body, replyTo?.id ?? null);
    setDraft("");
    setReplyTo(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/70">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-4"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.07) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        {hasOlder && onLoadOlder ? (
          <div className="mb-3 flex justify-center">
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
          <div className="flex flex-col gap-1.5">
            {messages.map((message) => {
              const mine = message.author.id === currentUserId;
              const color = authorColor(message.author.id);
              return (
                <div
                  key={message.id}
                  id={messageDomId(message.id)}
                  className={cn(
                    "group flex items-end gap-2",
                    mine ? "justify-end" : "justify-start",
                  )}
                >
                  {!mine ? (
                    <Avatar className="mb-0.5 h-8 w-8">
                      {message.author.avatarUrl ? (
                        <AvatarImage
                          src={message.author.avatarUrl}
                          alt={message.author.displayName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-muted text-[10px] font-semibold text-primary">
                        {initialsFromName(message.author.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}

                  {mine ? (
                    <button
                      type="button"
                      className="mb-1 shrink-0 rounded-full p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-white/10 hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Responder"
                      onClick={() => setReplyTo(message)}
                    >
                      <Reply size={14} />
                    </button>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[min(85%,28rem)] rounded-2xl px-2.5 pb-1.5 pt-1.5 shadow-sm",
                      mine
                        ? "rounded-br-md bg-primary/20"
                        : "rounded-bl-md bg-card",
                    )}
                  >
                    {!mine ? (
                      <div className="mb-0.5 flex items-center gap-1.5 px-0.5">
                        <span
                          className={cn(
                            "truncate text-[12px] font-semibold",
                            color.text,
                          )}
                        >
                          {message.author.displayName}
                        </span>
                        {message.author.role === "admin" ? (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1 text-[9px]"
                          >
                            Admin
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    {message.quotedMessage ? (
                      <QuotedPreview quoted={message.quotedMessage} />
                    ) : null}

                    <div className="flex items-end gap-2">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words px-0.5 text-[13.5px] leading-snug text-foreground">
                        {message.body}
                      </p>
                      <span className="mb-px shrink-0 text-[10px] leading-none text-muted-foreground">
                        {formatTime(message.createdAt)}
                      </span>
                      {onDelete ? (
                        <button
                          type="button"
                          className="mb-px shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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
                  </div>

                  {mine ? (
                    <Avatar className="mb-0.5 h-8 w-8">
                      {message.author.avatarUrl ? (
                        <AvatarImage
                          src={message.author.avatarUrl}
                          alt={message.author.displayName}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-[10px] font-semibold text-primary">
                        {initialsFromName(message.author.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <button
                      type="button"
                      className="mb-1 shrink-0 rounded-full p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-white/10 hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Responder"
                      onClick={() => setReplyTo(message)}
                    >
                      <Reply size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-background/80 p-2.5 sm:p-3">
        {replyPreview ? (
          <div className="mb-2 flex items-stretch overflow-hidden rounded-lg bg-muted/50">
            <QuotedPreview
              quoted={replyPreview}
              className="mb-0 min-w-0 flex-1"
            />
            <button
              type="button"
              className="shrink-0 px-2 text-muted-foreground hover:text-foreground"
              aria-label="Cancelar resposta"
              onClick={() => setReplyTo(null)}
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            maxLength={1000}
            placeholder={
              replyTo
                ? `Responder a ${replyTo.author.displayName}…`
                : "Mensagem"
            }
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-2xl border-white/10 bg-card px-3.5 py-2.5"
            rows={1}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
            disabled={sending || draft.trim().length === 0}
            onClick={() => void submit()}
            aria-label="Enviar"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
