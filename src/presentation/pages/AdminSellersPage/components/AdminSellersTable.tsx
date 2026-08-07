import type {
  IAdminSellerDto,
  TAdminSellerKycStatus,
} from "@/infra/http/services/api/modules/admin-sellers.module";
import {
  acquirerSourceLabel,
  type IAcquirerPreferenceResponseDto,
} from "@/infra/http/services/api/modules/types/acquirer-preference.types";
import { AcquirerBrandLogo } from "@/presentation/components/admin/AcquirerBrandLogo";
import { Button } from "@/presentation/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SELLER_STATUS_CONFIG } from "../constants/seller-status.config";

const PLATFORM_DEFAULT_VALUE = "__platform_default__";

interface IAdminSellersTableProps {
  sellers: IAdminSellerDto[];
  onSellerUpdated?: (seller: IAdminSellerDto) => void;
}

function SellerStatusBadge({ status }: { status: TAdminSellerKycStatus }) {
  const config = SELLER_STATUS_CONFIG[status] ?? SELLER_STATUS_CONFIG.sem_kyc;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${config.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-border/50">
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Seller
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ID
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Adquirente
        </th>
        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cadastro
        </th>
        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ações
        </th>
      </tr>
    </thead>
  );
}

interface ISellerAcquirerDrawerProps {
  seller: IAdminSellerDto;
  onClose: () => void;
  onSaved: (seller: IAdminSellerDto) => void;
}

function SellerAcquirerDrawer({
  seller,
  onClose,
  onSaved,
}: ISellerAcquirerDrawerProps) {
  const apiService = useApiService();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<IAcquirerPreferenceResponseDto | null>(
    null,
  );
  const [selected, setSelected] = useState(PLATFORM_DEFAULT_VALUE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data =
          await apiService.modules.adminSellers.getSellerAcquirerPreference(
            seller.userId,
          );
        if (cancelled) return;
        setDetail(data);
        setSelected(
          data.preference.acquirerId != null
            ? String(data.preference.acquirerId)
            : PLATFORM_DEFAULT_VALUE,
        );
      } catch (err) {
        toast.error(
          getErrorMessageOrDefault(err, "Erro ao carregar preferência"),
        );
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiService, onClose, seller.userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const acquirerId =
        selected === PLATFORM_DEFAULT_VALUE ? null : Number(selected);
      const updated =
        await apiService.modules.adminSellers.updateSellerAcquirerPreference(
          seller.userId,
          acquirerId,
        );
      setDetail(updated);
      onSaved({
        ...seller,
        acquirer: {
          id: updated.effective.acquirerId,
          name: updated.effective.name,
          source: updated.effective.source,
          preferenceAcquirerId: updated.preference.acquirerId,
        },
      });
      toast.success("Preferência do seller atualizada");
      onClose();
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(err, "Erro ao salvar preferência do seller"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-[#141018] shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Adquirente
            </p>
            <h3 className="text-base font-semibold text-foreground">
              {seller.fullName || "Sem nome"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {loading || !detail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Efetiva
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {detail.effective.name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {acquirerSourceLabel(detail.effective.source)}
                </p>
                {detail.preference.acquirerId != null ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Preferência individual:{" "}
                    {detail.availableAcquirers.find(
                      (a) => a.id === detail.preference.acquirerId,
                    )?.name ?? `#${detail.preference.acquirerId}`}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sem preferência individual (herda o padrão)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Definir adquirente
                </label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PLATFORM_DEFAULT_VALUE}>
                      Usar padrão da plataforma
                      {detail.platformDefault?.name
                        ? ` (${detail.platformDefault.name})`
                        : ""}
                    </SelectItem>
                    {detail.availableAcquirers.map((acq) => (
                      <SelectItem key={acq.id} value={String(acq.id)}>
                        {acq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border/50 px-5 py-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !detail}
            className="w-full gap-2 bg-white text-[#0F0617] hover:bg-white/90"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            Salvar
          </Button>
        </div>
      </aside>
    </div>
  );
}

interface ITableRowProps {
  seller: IAdminSellerDto;
  index: number;
  onEditAcquirer: (seller: IAdminSellerDto) => void;
}

function TableRow({ seller, index, onEditAcquirer }: ITableRowProps) {
  const acquirer = seller.acquirer;

  return (
    <tr
      className="animate-fade-in border-b border-border/20 last:border-0 transition-colors hover:bg-muted/20"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-xs font-bold text-primary">
              {(seller.fullName || "?")
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {seller.fullName || "Sem nome"}
          </span>
        </div>
      </td>
      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
        #{seller.userId}
      </td>
      <td className="px-5 py-3.5">
        <SellerStatusBadge status={seller.kycStatus} />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          {acquirer?.name ? (
            <AcquirerBrandLogo
              connection={{
                api_url: "",
                name: acquirer.name,
                logo_key: acquirer.name.toLowerCase(),
              }}
              className="h-6 w-6"
              imageClassName="h-6 w-6 object-contain"
            />
          ) : null}
          <div>
            <p className="text-sm text-foreground">{acquirer?.name ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">
              {acquirer ? acquirerSourceLabel(acquirer.source) : "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs text-muted-foreground">
        {seller.createdAt
          ? new Date(seller.createdAt).toLocaleDateString("pt-BR")
          : "—"}
      </td>
      <td className="px-5 py-3.5 text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => onEditAcquirer(seller)}
        >
          <Settings2 size={14} />
          Adquirente
        </Button>
      </td>
    </tr>
  );
}

export default function AdminSellersTable({
  sellers,
  onSellerUpdated,
}: IAdminSellersTableProps) {
  const [editingSeller, setEditingSeller] = useState<IAdminSellerDto | null>(
    null,
  );
  const [rows, setRows] = useState(sellers);

  useEffect(() => {
    setRows(sellers);
  }, [sellers]);

  const handleSellerUpdated = (updated: IAdminSellerDto) => {
    setRows((prev) =>
      prev.map((row) => (row.userId === updated.userId ? updated : row)),
    );
    onSellerUpdated?.(updated);
  };

  return (
    <>
      <div className="admin-surface overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <TableHeader />

          <tbody>
            {rows.map((seller, index) => (
              <TableRow
                key={seller.userId}
                seller={seller}
                index={index}
                onEditAcquirer={setEditingSeller}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editingSeller ? (
        <SellerAcquirerDrawer
          seller={editingSeller}
          onClose={() => setEditingSeller(null)}
          onSaved={handleSellerUpdated}
        />
      ) : null}
    </>
  );
}
