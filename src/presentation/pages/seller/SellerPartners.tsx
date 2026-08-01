import PageHeader from "@/presentation/components/PageHeader";
import { SellerLayout } from "@/presentation/components/seller/SellerLayout";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import { Checkbox } from "@/presentation/components/ui/checkbox";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import useSellerPartnersQuery from "@/presentation/hooks/use-seller-partners-query";
import type {
  ISellerPartnerDto,
  TSellerPartnerSearchDto,
} from "@/infra/http/services/api/modules/seller-portal.module";
import { Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  active: "Ativo",
  rejected: "Recusado",
  paused: "Pausado",
  revoked: "Removido",
  expired: "Expirado",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected" || status === "revoked") return "destructive";
  return "outline";
}

function PartnerRow({
  partner,
  onPause,
  onResume,
  onRevoke,
  busy,
}: {
  partner: ISellerPartnerDto;
  onPause?: () => void;
  onResume?: () => void;
  onRevoke?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">
            {partner.counterparty_name || partner.invited_email}
          </p>
          <Badge variant={statusVariant(partner.status)}>
            {STATUS_LABEL[partner.status] ?? partner.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {partner.counterparty_email || partner.invited_email}
          {partner.counterparty_account_id
            ? ` · ${partner.counterparty_account_id}`
            : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          Participação:{" "}
          <span className="text-foreground">{partner.percentage}%</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {partner.role === "owner" && partner.status === "active" && (
          <Button variant="outline" size="sm" disabled={busy} onClick={onPause}>
            Pausar
          </Button>
        )}
        {partner.role === "owner" && partner.status === "paused" && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={onResume}
          >
            Retomar
          </Button>
        )}
        {partner.role === "owner" &&
          (partner.status === "active" || partner.status === "paused") && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={onRevoke}
            >
              Remover
            </Button>
          )}
      </div>
    </div>
  );
}

export default function SellerPartners() {
  const {
    data,
    isLoading,
    inviteMutation,
    updateMutation,
    searchPartnerByEmail,
  } = useSellerPartnersQuery();

  const [email, setEmail] = useState("");
  const [percentage, setPercentage] = useState("30");
  const [searchResult, setSearchResult] =
    useState<TSellerPartnerSearchDto | null>(null);
  const [searching, setSearching] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const owned = data?.owned ?? [];

  const preview = useMemo(() => {
    const pct = Number(percentage.replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct > 99) return null;
    const sale = 10000;
    const partnerShare = Math.round((sale * pct) / 100);
    return {
      you: ((sale - partnerShare) / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      partner: (partnerShare / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    };
  }, [percentage]);

  const handleSearch = async () => {
    if (!email.trim()) {
      toast.error("Informe o e-mail");
      return;
    }
    setSearching(true);
    setSearchResult(null);
    try {
      const result = await searchPartnerByEmail(email.trim());
      setSearchResult(result);
      if (!result.found) toast.error("Conta não encontrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    const pct = Number(percentage.replace(",", "."));
    if (!Number.isFinite(pct) || pct <= 0 || pct > 99) {
      toast.error("Percentual inválido (use até 99%)");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Aceite os termos para adicionar o sócio");
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        email: email.trim(),
        percentage: pct,
      });
      toast.success("Sócio adicionado");
      setEmail("");
      setSearchResult(null);
      setAcceptedTerms(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Não foi possível adicionar",
      );
    }
  };

  const busy = inviteMutation.isPending || updateMutation.isPending;

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Financeiro"
          title="Sócios"
          description="Divida automaticamente o valor das vendas com outro seller da OmegaPay."
        />

        <section className="mt-8 space-y-4 rounded-2xl border border-border/70 bg-background/40 p-5">
          <div className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Adicionar sócio</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Busque pela conta pelo e-mail, defina a porcentagem e adicione. As
            vendas sem <code>split[]</code> na API já passam a dividir
            automaticamente.
          </p>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="partner-email">E-mail da conta</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="socio@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-pct">% do sócio</Label>
              <Input
                id="partner-pct"
                inputMode="decimal"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>
          </div>

          {preview && (
            <p className="text-sm text-muted-foreground">
              Em uma venda de R$ 100,00: você fica com {preview.you} e o sócio
              com {preview.partner}.
            </p>
          )}

          {searchResult?.found && (
            <div className="rounded-xl border border-border/60 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">
                {searchResult.display_name} · {searchResult.account_id}
              </p>
              <p className="text-muted-foreground">
                {searchResult.email_masked}
                {!searchResult.eligible && searchResult.ineligible_reason
                  ? ` — ${searchResult.ineligible_reason}`
                  : ""}
              </p>
            </div>
          )}

          <label
            htmlFor="partner-terms"
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
          >
            <Checkbox
              id="partner-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) =>
                setAcceptedTerms(checked === true)
              }
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed text-muted-foreground">
              Li e aceito que a adição do e-mail de um sócio para dividir a
              porcentagem das minhas vendas é feita por minha conta e risco. Sou
              responsável por confirmar que o e-mail informado pertence à pessoa
              ou conta correta.
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleSearch}
              disabled={searching || busy}
            >
              {searching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Buscar
            </Button>
            <Button onClick={handleAdd} disabled={busy || !acceptedTerms}>
              {inviteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Adicionar sócio
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Seus sócios
          </h2>
          <div className="rounded-2xl border border-border/70 px-5">
            {isLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando…
              </div>
            ) : owned.length === 0 ? (
              <p className="py-8 text-sm text-muted-foreground">
                Nenhum sócio ainda. Adicione alguém para começar a dividir
                vendas.
              </p>
            ) : (
              owned.map((p) => (
                <PartnerRow
                  key={p.id}
                  partner={p}
                  busy={busy}
                  onPause={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: p.id,
                        body: { action: "pause" },
                      });
                      toast.success("Parceria pausada");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Falha ao pausar",
                      );
                    }
                  }}
                  onResume={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: p.id,
                        body: { action: "resume" },
                      });
                      toast.success("Parceria retomada");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Falha ao retomar",
                      );
                    }
                  }}
                  onRevoke={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: p.id,
                        body: { action: "revoke" },
                      });
                      toast.success("Sócio removido");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Falha ao remover",
                      );
                    }
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </SellerLayout>
  );
}
