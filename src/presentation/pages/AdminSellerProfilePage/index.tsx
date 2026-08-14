import type { IAdminSellerProfileDto } from "@/infra/http/services/api/modules/types/admin-sellers.types";
import { AddBalanceCreditModal } from "@/presentation/components/admin/AddBalanceCreditModal";
import DeleteSellerAccountModal from "@/presentation/components/admin/DeleteSellerAccountModal";
import { Button } from "@/presentation/components/ui/button";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Plus,
  Shield,
  Trash2,
  Unlock,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import BlockReasonModal from "../AdminKycPage/components/BlockReasonModal";
import { useAdminKycDetailsStore } from "../AdminKycPage/stores/admin-kyc-details.store";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function AdminSellerProfilePage() {
  const { sellerId: sellerIdParam } = useParams();
  const sellerId = Number(sellerIdParam);
  const navigate = useNavigate();
  const apiService = useApiService();
  const queryClient = useQueryClient();
  const { setShowBlockReasonModal, setBlockReason, showBlockReasonModal } =
    useAdminKycDetailsStore();

  const [profile, setProfile] = useState<IAdminSellerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!Number.isFinite(sellerId) || sellerId <= 0) {
      setLoading(false);
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.modules.adminSellers.getSellerProfile(
        sellerId,
      );
      setProfile(data);
    } catch (error) {
      toast.error(
        getErrorMessageOrDefault(error, "Erro ao carregar perfil do seller"),
      );
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [apiService, sellerId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleUnblock = async () => {
    if (
      !window.confirm(
        "Liberar saques para este seller? O histórico de bloqueios será mantido.",
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      await apiService.modules.adminSellers.unblockWithdrawals(sellerId);
      toast.success("Saque liberado");
      await loadProfile();
    } catch (error) {
      toast.error(getErrorMessageOrDefault(error, "Erro ao liberar saque"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="space-y-4 p-6">
          <Button variant="ghost" onClick={() => navigate("/admin/sellers")}>
            <ArrowLeft size={16} className="mr-2" />
            Voltar
          </Button>
          <p className="text-sm text-muted-foreground">Seller não encontrado.</p>
        </div>
      </AdminLayout>
    );
  }

  const { seller, kyc, balance, withdrawal, recentAdjustments } = profile;

  return (
    <AdminLayout>
    <div className="animate-fade-in mx-auto w-full max-w-6xl space-y-6 px-5 py-6 md:px-8 md:py-9">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/sellers")}
        >
          <ArrowLeft size={16} className="mr-2" />
          Sellers
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {seller.fullName || "Sem nome"}
        </h1>
        <span className="rounded-lg border border-border bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground">
          #{seller.id}
        </span>
      </div>

      <section className="admin-surface space-y-3 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Identificação
        </h2>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {seller.email || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Conta: </span>
            {seller.accountId || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Cadastro: </span>
            {seller.createdAt
              ? new Date(seller.createdAt).toLocaleString("pt-BR")
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">KYC: </span>
            {kyc ? (
              <Link
                to="/admin/kyc"
                className="font-medium text-primary hover:underline"
              >
                {kyc.status} (abrir em Produtores)
              </Link>
            ) : (
              <span className="font-medium text-warning">
                KYC ainda não enviado
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="admin-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Controle de saque
            </h2>
            <p className="mt-1 text-sm text-foreground">
              Status:{" "}
              <span
                className={
                  withdrawal.blocked
                    ? "font-semibold text-destructive"
                    : "font-semibold text-success"
                }
              >
                {withdrawal.blocked ? "Travado" : "Liberado"}
              </span>
            </p>
            {withdrawal.blocked ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Motivo: {withdrawal.reason || "—"}
                {withdrawal.blockedAt
                  ? ` · ${new Date(withdrawal.blockedAt).toLocaleString("pt-BR")}`
                  : ""}
                {withdrawal.blockedBy
                  ? ` · por ${withdrawal.blockedBy.name || `#${withdrawal.blockedBy.id}`}`
                  : ""}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              O bloqueio impede novos envios e aprovações, mas não reverte
              operações já liquidadas.
            </p>
          </div>
          <div className="flex gap-2">
            {withdrawal.blocked ? (
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={handleUnblock}
              >
                {actionLoading ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <Unlock size={14} className="mr-2" />
                )}
                Liberar saque
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setBlockReason("");
                  setShowBlockReasonModal(true);
                }}
              >
                <Lock size={14} className="mr-2" />
                Travar saque
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="admin-surface admin-surface-featured p-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Disponível para saque
            </p>
            <button
              type="button"
              onClick={() => setShowCreditModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Plus size={14} />
              Adicionar saldo
            </button>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(balance.available)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="admin-surface p-4">
            <p className="text-xs text-muted-foreground">Retido</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatCurrency(balance.retained)}
            </p>
          </div>
          <div className="admin-surface p-4">
            <p className="text-xs text-muted-foreground">Sacado</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatCurrency(balance.withdrawn)}
            </p>
          </div>
          <div className="admin-surface p-4">
            <p className="text-xs text-muted-foreground">Reembolsado</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatCurrency(balance.refunded)}
            </p>
          </div>
          <div className="admin-surface p-4">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <p className="mt-1 font-semibold tabular-nums">
              {balance.totalSalesCount}
            </p>
          </div>
        </div>

        <div className="admin-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Últimos créditos administrativos
            </p>
          </div>
          {recentAdjustments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum crédito registrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentAdjustments.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/30 pb-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.reason || "—"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="admin-surface space-y-3 border-destructive/30 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive">
          Zona de perigo
        </h2>
        <p className="text-sm text-muted-foreground">
          Exclui a conta, o KYC, transações, arquivos e todos os dados atrelados.
          O usuário precisará se cadastrar novamente.
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setShowDeleteModal(true)}
        >
          <Trash2 size={14} className="mr-2" />
          Excluir seller
        </Button>
      </section>

      {showCreditModal ? (
        <AddBalanceCreditModal
          sellerId={seller.id}
          availableCents={balance.available}
          onClose={() => setShowCreditModal(false)}
          onSuccess={loadProfile}
        />
      ) : null}

      {showBlockReasonModal ? (
        <BlockReasonModal sellerId={seller.id} onUpdate={loadProfile} />
      ) : null}

      <DeleteSellerAccountModal
        seller={{
          userId: seller.id,
          fullName: seller.fullName,
          email: seller.email,
        }}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onDeleted={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
          navigate("/admin/sellers");
        }}
      />
    </div>
    </AdminLayout>
  );
}
