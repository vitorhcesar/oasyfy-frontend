import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
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

function shortDisplayName(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
}

function initialsFromName(name: string) {
  const parts = shortDisplayName(name).split(/\s+/).filter(Boolean);
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
  onDismiss,
  embedded = false,
}: {
  quoted: IPracaQuotedMessageDto;
  className?: string;
  onDismiss?: () => void;
  embedded?: boolean;
}) {
  const color = authorColor(quoted.author.id);
  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-[6px]",
        embedded
          ? "bg-black/[0.06] dark:bg-black/25"
          : "bg-muted/80",
        className,
      )}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          document
            .getElementById(messageDomId(quoted.id))
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        className="flex min-w-0 flex-1 text-left"
      >
        <span className={cn("w-[3px] shrink-0 self-stretch", color.bar)} />
        <span className="min-w-0 flex-1 px-2 py-1">
          <span
            className={cn(
              "block truncate text-[13px] font-semibold leading-tight",
              color.text,
            )}
          >
            {shortDisplayName(quoted.author.displayName)}
          </span>
          <span
            className={cn(
              "mt-0.5 block truncate leading-snug",
              embedded
                ? "text-[12.5px] text-foreground/80 dark:text-foreground/70"
                : "text-[13px] text-muted-foreground",
            )}
          >
            {quoted.body}
          </span>
        </span>
      </button>
      {onDismiss ? (
        <button
          type="button"
          className="shrink-0 px-2 text-muted-foreground hover:text-foreground"
          aria-label="Cancelar resposta"
          onClick={onDismiss}
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

function MessageAvatar({
  name,
  avatarUrl,
  mine,
}: {
  name: string;
  avatarUrl: string | null;
  mine?: boolean;
}) {
  return (
    <Avatar className="mb-0.5 h-8 w-8">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "text-[10px] font-semibold text-primary",
          mine ? "bg-primary/20" : "bg-muted",
        )}
      >
        {initialsFromName(name)}
      </AvatarFallback>
    </Avatar>
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
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
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
                    <MessageAvatar
                      name={message.author.displayName}
                      avatarUrl={message.author.avatarUrl}
                    />
                  ) : null}

                  {mine ? (
                    <button
                      type="button"
                      className="mb-1 shrink-0 rounded-full p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-white/10 hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Responder"
                      onClick={() => setReplyTo(message)}
                    >
                      <Reply size={16} />
                    </button>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[min(88%,36rem)] px-2 pb-1.5 pt-1.5 shadow-sm",
                      mine
                        ? "rounded-2xl rounded-br-sm bg-primary/25"
                        : "rounded-2xl rounded-bl-sm bg-card",
                    )}
                  >
                    {!mine ? (
                      <div className="mb-1 flex items-center gap-1.5 px-1">
                        <span
                          className={cn(
                            "truncate text-sm font-semibold",
                            color.text,
                          )}
                        >
                          {shortDisplayName(message.author.displayName)}
                        </span>
                        {message.author.role === "admin" ? (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            Admin
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    {message.quotedMessage ? (
                      <QuotedPreview
                        quoted={message.quotedMessage}
                        className="mb-1"
                        embedded
                      />
                    ) : null}

                    <div className="flex items-end gap-2 px-1">
                      <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] leading-snug text-foreground">
                        {message.body}
                      </p>
                      <span className="mb-px shrink-0 text-xs leading-none text-muted-foreground">
                        {formatTime(message.createdAt)}
                      </span>
                      {onDelete ? (
                        <button
                          type="button"
                          className="mb-px shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          disabled={deletingId === message.id}
                          onClick={() => setPendingDeleteId(message.id)}
                          aria-label="Apagar mensagem"
                        >
                          {deletingId === message.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {mine ? (
                    <MessageAvatar
                      name={message.author.displayName}
                      avatarUrl={message.author.avatarUrl}
                      mine
                    />
                  ) : (
                    <button
                      type="button"
                      className="mb-1 shrink-0 rounded-full p-1.5 text-muted-foreground opacity-70 transition-opacity hover:bg-white/10 hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
                      aria-label="Responder"
                      onClick={() => setReplyTo(message)}
                    >
                      <Reply size={16} />
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
        <div className="flex items-end gap-2">
          <div className="flex min-h-[48px] min-w-0 flex-1 flex-col rounded-[1.35rem] border border-white/10 bg-card px-2 py-1.5">
            {replyPreview ? (
              <QuotedPreview
                quoted={replyPreview}
                className="mb-1.5"
                onDismiss={() => setReplyTo(null)}
              />
            ) : null}
            <Textarea
              value={draft}
              maxLength={1000}
              placeholder="Mensagem"
              className="min-h-[36px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2.5 py-1.5 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full"
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

      {onDelete ? (
        <ConfirmationModal
          open={pendingDeleteId != null}
          onOpenChange={(open) => {
            if (!open) setPendingDeleteId(null);
          }}
          title="Apagar mensagem"
          description="Apagar esta mensagem para todos na Praça? Esta ação não pode ser desfeita."
          confirmLabel="Apagar"
          onConfirm={async () => {
            if (pendingDeleteId == null) return;
            setDeletingId(pendingDeleteId);
            try {
              await onDelete(pendingDeleteId);
            } finally {
              setDeletingId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
