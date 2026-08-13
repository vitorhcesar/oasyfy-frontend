import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import useAdminGoalsQuery, {
  type TAdminGoalView,
} from "@/presentation/hooks/use-admin-goals-query";
import useAdminSellersQuery from "@/presentation/hooks/use-admin-sellers-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Award,
  DollarSign,
  Gift,
  Loader2,
  Pencil,
  Percent,
  Plus,
  ShoppingCart,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Goal = TAdminGoalView;
type TGoalFilter = "active" | "global" | "individual" | null;

const goalTypeConfig = {
  revenue: {
    label: "Faturamento",
    icon: DollarSign,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  transaction_count: {
    label: "Qtd. de Vendas",
    icon: ShoppingCart,
    color: "text-success",
    bg: "bg-success/10",
  },
  avg_ticket: {
    label: "Ticket Médio",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  new_customers: {
    label: "Novos Clientes",
    icon: Users,
    color: "text-warning",
    bg: "bg-warning/10",
  },
};

const rewardTypeConfig = {
  balance_bonus: {
    label: "Bônus em Saldo",
    icon: Gift,
    color: "text-primary",
  },
  fee_discount: {
    label: "Desconto na Taxa",
    icon: Percent,
    color: "text-success",
  },
  badge: { label: "Badge/Selo", icon: Award, color: "text-warning" },
  custom: { label: "Personalizado", icon: Star, color: "text-primary" },
};

const emptyForm = {
  title: "",
  description: "",
  goal_type: "revenue" as Goal["goal_type"],
  target_value: "",
  reward_type: "balance_bonus" as Goal["reward_type"],
  reward_value: "",
  reward_description: "",
  seller_id: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  is_active: true,
};

const INPUT_CLASS =
  "w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";
const SELECT_CLASS =
  "w-full appearance-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";

function activeSurface(filter: TGoalFilter) {
  if (filter === "active") return "border-primary/45 !bg-primary/20";
  if (filter === "global") return "border-warning/45 !bg-warning/20";
  if (filter === "individual") return "border-success/45 !bg-success/20";
  return "";
}

export default function AdminGoals() {
  const apiService = useApiService();
  const { data: goals, isLoading, invalidateQuery } = useAdminGoalsQuery();
  const { data: sellersDto } = useAdminSellersQuery();
  const sellers = sellersDto.map((s) => ({
    user_id: String(s.userId),
    full_name: s.fullName,
    account_id: s.accountId,
  }));
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TGoalFilter>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setForm({
      title: goal.title,
      description: goal.description || "",
      goal_type: goal.goal_type,
      target_value:
        goal.goal_type === "revenue" || goal.goal_type === "avg_ticket"
          ? String(goal.target_value / 100)
          : String(goal.target_value),
      reward_type: goal.reward_type,
      reward_value:
        goal.reward_type === "balance_bonus"
          ? String(goal.reward_value / 100)
          : String(goal.reward_value),
      reward_description: goal.reward_description || "",
      seller_id: goal.seller_id || "",
      start_date: goal.start_date,
      end_date: goal.end_date || "",
      is_active: goal.is_active,
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.target_value) {
      toast.error("Preencha o título e o valor da meta");
      return;
    }
    setSaving(true);

    const isCurrency =
      form.goal_type === "revenue" || form.goal_type === "avg_ticket";
    const targetValue = isCurrency
      ? Math.round(parseFloat(form.target_value) * 100)
      : parseInt(form.target_value);
    const rewardValue =
      form.reward_type === "balance_bonus"
        ? Math.round(parseFloat(form.reward_value || "0") * 100)
        : parseInt(form.reward_value || "0");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      goal_type: form.goal_type,
      target_value: targetValue,
      reward_type: form.reward_type,
      reward_value: rewardValue,
      reward_description: form.reward_description.trim() || null,
      seller_id: form.seller_id || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await apiService.modules.adminConfig.updateSellerGoal(
          Number(editingId),
          payload,
        );
      } else {
        await apiService.modules.adminConfig.createSellerGoal(payload);
      }
      toast.success(editingId ? "Meta atualizada" : "Meta criada");
      setShowForm(false);
      await invalidateQuery();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar meta");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.modules.adminConfig.deleteSellerGoal(Number(id));
      toast.success("Meta excluída");
      await invalidateQuery();
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const toggleActive = async (goal: Goal) => {
    await apiService.modules.adminConfig.toggleSellerGoalActive(
      Number(goal.id),
      !goal.is_active,
    );
    await invalidateQuery();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v / 100);

  const formatTargetValue = (goal: Goal) => {
    if (goal.goal_type === "revenue" || goal.goal_type === "avg_ticket")
      return formatCurrency(goal.target_value);
    return goal.target_value.toLocaleString("pt-BR");
  };

  const formatRewardValue = (goal: Goal) => {
    if (goal.reward_type === "balance_bonus")
      return formatCurrency(goal.reward_value);
    if (goal.reward_type === "fee_discount") return `${goal.reward_value}%`;
    return goal.reward_value ? String(goal.reward_value) : "—";
  };

  const activeGoals = useMemo(
    () => goals.filter((g) => g.is_active),
    [goals],
  );
  const inactiveGoals = useMemo(
    () => goals.filter((g) => !g.is_active),
    [goals],
  );
  const globalActiveCount = activeGoals.filter((g) => !g.seller_id).length;
  const individualActiveCount = activeGoals.filter((g) => g.seller_id).length;

  const displayedActive = useMemo(() => {
    if (!activeFilter) return activeGoals;
    if (activeFilter === "active") return activeGoals;
    if (activeFilter === "global")
      return activeGoals.filter((g) => !g.seller_id);
    return activeGoals.filter((g) => !!g.seller_id);
  }, [activeGoals, activeFilter]);

  const showInactive = !activeFilter;

  const stats = [
    {
      key: "active" as const,
      label: "Metas Ativas",
      value: activeGoals.length,
      icon: Target,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      key: "global" as const,
      label: "Globais",
      value: globalActiveCount,
      icon: Trophy,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      key: "individual" as const,
      label: "Individuais",
      value: individualActiveCount,
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const handleStatFilterChange = (key: TGoalFilter) => {
    setActiveFilter((prev) => (prev === key ? null : key));
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-9">
        <header className="mb-7 flex animate-fade-in flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Comercial
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-[2.15rem]">
              Metas
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Crie metas para os sellers e configure premiações ao atingi-las.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
          >
            <Plus size={16} />
            Nova Meta
          </button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((stat) => {
            const isActive = activeFilter === stat.key;
            return (
              <button
                key={stat.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleStatFilterChange(stat.key)}
                className={cn(
                  "admin-surface admin-surface-interactive p-3.5 text-left",
                  isActive && activeSurface(stat.key),
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
                    isActive ? "bg-black/20" : stat.bg,
                    stat.color,
                  )}
                >
                  <stat.icon size={16} />
                </div>
                <p className="text-xl font-bold leading-none tracking-tight text-foreground tabular-nums">
                  {stat.value}
                </p>
                <p
                  className={cn(
                    "mt-1.5 text-xs leading-tight",
                    isActive
                      ? cn("font-semibold", stat.color)
                      : "text-muted-foreground",
                  )}
                >
                  {stat.label}
                </p>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <div className="admin-surface px-6 py-16 text-center">
            <Target className="mx-auto mb-3 text-muted-foreground" size={24} />
            <p className="mb-1 text-base font-semibold text-foreground">
              Nenhuma meta criada
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              Crie a primeira meta para seus sellers.
            </p>
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
            >
              <Plus size={15} /> Criar Meta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActive.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Metas Ativas ({displayedActive.length})
                </p>
                <div className="space-y-3">
                  {displayedActive.map((goal) => {
                    const gtc = goalTypeConfig[goal.goal_type];
                    const rtc = rewardTypeConfig[goal.reward_type];
                    const seller = sellers.find(
                      (s) => s.user_id === goal.seller_id,
                    );
                    return (
                      <div key={goal.id} className="admin-surface p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                                gtc.bg,
                              )}
                            >
                              <gtc.icon size={18} className={gtc.color} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-semibold text-foreground">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                  {goal.description}
                                </p>
                              )}
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    {gtc.label}
                                  </span>{" "}
                                  · Alvo:{" "}
                                  <span className="font-bold text-foreground">
                                    {formatTargetValue(goal)}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <rtc.icon size={12} className={rtc.color} />
                                  {rtc.label}:{" "}
                                  <span className="font-bold text-foreground">
                                    {formatRewardValue(goal)}
                                  </span>
                                </span>
                                {goal.reward_description && (
                                  <span className="text-sm text-muted-foreground">
                                    "{goal.reward_description}"
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold",
                                    goal.seller_id
                                      ? "border-success/25 bg-success/10 text-success"
                                      : "border-primary/25 bg-primary/10 text-primary",
                                  )}
                                >
                                  {goal.seller_id
                                    ? seller?.full_name ||
                                      seller?.account_id ||
                                      "Seller"
                                    : "Global"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(goal.start_date),
                                    "dd/MM/yyyy",
                                    { locale: ptBR },
                                  )}
                                  {goal.end_date &&
                                    ` → ${format(
                                      new Date(goal.end_date),
                                      "dd/MM/yyyy",
                                      { locale: ptBR },
                                    )}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <button
                              onClick={() => openEdit(goal)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => toggleActive(goal)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Desativar"
                            >
                              <X size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {displayedActive.length === 0 && activeFilter && (
              <div className="admin-surface px-6 py-12 text-center">
                <p className="text-base text-muted-foreground">
                  Nenhuma meta encontrada para este filtro.
                </p>
              </div>
            )}

            {showInactive && inactiveGoals.length > 0 && (
              <>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Inativas ({inactiveGoals.length})
                </p>
                <div className="space-y-3">
                  {inactiveGoals.map((goal) => {
                    const gtc = goalTypeConfig[goal.goal_type];
                    return (
                      <div
                        key={goal.id}
                        className="admin-surface p-4 opacity-70 transition-opacity hover:opacity-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl",
                                gtc.bg,
                              )}
                            >
                              <gtc.icon size={15} className={gtc.color} />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">
                                {goal.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {gtc.label} · {formatTargetValue(goal)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => toggleActive(goal)}
                              className="inline-flex h-9 items-center rounded-xl border border-transparent bg-white px-3 text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90"
                            >
                              Reativar
                            </button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border/60 bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editingId ? "Editar Meta" : "Nova Meta"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Título *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Faturar R$ 50.000 no mês"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Detalhes da meta..."
                className={cn(INPUT_CLASS, "h-20 resize-none")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Tipo de Meta
                </label>
                <select
                  value={form.goal_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      goal_type: e.target.value as Goal["goal_type"],
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="revenue">Faturamento</option>
                  <option value="transaction_count">Qtd. de Vendas</option>
                  <option value="avg_ticket">Ticket Médio</option>
                  <option value="new_customers">Novos Clientes</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Valor Alvo *{" "}
                  {(form.goal_type === "revenue" ||
                    form.goal_type === "avg_ticket") &&
                    "(R$)"}
                </label>
                <input
                  type="number"
                  value={form.target_value}
                  onChange={(e) =>
                    setForm({ ...form, target_value: e.target.value })
                  }
                  placeholder={form.goal_type === "revenue" ? "50000" : "100"}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Tipo de Premiação
                </label>
                <select
                  value={form.reward_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reward_type: e.target.value as Goal["reward_type"],
                    })
                  }
                  className={SELECT_CLASS}
                >
                  <option value="balance_bonus">Bônus em Saldo</option>
                  <option value="fee_discount">Desconto na Taxa</option>
                  <option value="badge">Badge/Selo</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Valor da Premiação{" "}
                  {form.reward_type === "balance_bonus" && "(R$)"}{" "}
                  {form.reward_type === "fee_discount" && "(%)"}
                </label>
                <input
                  type="number"
                  value={form.reward_value}
                  onChange={(e) =>
                    setForm({ ...form, reward_value: e.target.value })
                  }
                  placeholder={
                    form.reward_type === "balance_bonus" ? "500" : "10"
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Descrição da Premiação
              </label>
              <input
                value={form.reward_description}
                onChange={(e) =>
                  setForm({ ...form, reward_description: e.target.value })
                }
                placeholder="Ex: Bônus de R$ 500 no saldo"
                className={INPUT_CLASS}
              />
            </div>

            <div className="h-px bg-border/50" />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Seller (deixe vazio para meta global)
              </label>
              <select
                value={form.seller_id}
                onChange={(e) =>
                  setForm({ ...form, seller_id: e.target.value })
                }
                className={SELECT_CLASS}
              >
                <option value="">Global (todos os sellers)</option>
                {sellers.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.full_name || s.account_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Data Final (opcional)
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="rounded"
                id="is_active"
              />
              <label
                htmlFor="is_active"
                className="cursor-pointer text-sm text-foreground"
              >
                Meta ativa
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 flex-1 rounded-xl bg-white text-sm font-semibold text-[#111827] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Atualizar Meta"
                    : "Criar Meta"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
