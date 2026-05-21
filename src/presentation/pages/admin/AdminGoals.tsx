import { supabase } from "@/infra/integrations/supabase/client";
import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { cn } from "@/presentation/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Award,
  DollarSign,
  Gift,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Goal = {
  id: string;
  title: string;
  description: string | null;
  goal_type: "revenue" | "transaction_count" | "avg_ticket" | "new_customers";
  target_value: number;
  reward_type: "balance_bonus" | "fee_discount" | "badge" | "custom";
  reward_value: number;
  reward_description: string | null;
  seller_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
};

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
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  avg_ticket: {
    label: "Ticket Médio",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  new_customers: {
    label: "Novos Clientes",
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
};

const rewardTypeConfig = {
  balance_bonus: { label: "Bônus em Saldo", icon: Gift, color: "text-primary" },
  fee_discount: {
    label: "Desconto na Taxa",
    icon: Percent,
    color: "text-emerald-600",
  },
  badge: { label: "Badge/Selo", icon: Award, color: "text-amber-600" },
  custom: { label: "Personalizado", icon: Star, color: "text-purple-600" },
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

export default function AdminGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sellers, setSellers] = useState<
    { user_id: string; full_name: string | null; account_id: string }[]
  >([]);

  const fetchGoals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_goals")
      .select("*")
      .order("created_at", { ascending: false });
    setGoals((data as Goal[]) ?? []);
    setLoading(false);
  };

  const fetchSellers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, account_id");
    setSellers(data ?? []);
  };

  useEffect(() => {
    fetchGoals();
    fetchSellers();
  }, []);

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

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("seller_goals")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("seller_goals").insert(payload));
    }

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar meta");
    } else {
      toast.success(editingId ? "Meta atualizada" : "Meta criada");
      setShowForm(false);
      fetchGoals();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("seller_goals").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("Meta excluída");
      fetchGoals();
    }
  };

  const toggleActive = async (goal: Goal) => {
    await supabase
      .from("seller_goals")
      .update({ is_active: !goal.is_active })
      .eq("id", goal.id);
    fetchGoals();
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

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const selectClass =
    "w-full px-3.5 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer";

  const activeGoals = goals.filter((g) => g.is_active);
  const inactiveGoals = goals.filter((g) => !g.is_active);

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Metas & Premiações
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crie metas para os sellers e configure premiações ao atingi-las
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nova Meta
          </button>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-fade-in"
          style={{ animationDelay: "50ms" }}
        >
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-primary" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                Metas Ativas
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {activeGoals.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                Globais
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {activeGoals.filter((g) => !g.seller_id).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-purple-500" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                Individuais
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {activeGoals.filter((g) => g.seller_id).length}
            </p>
          </div>
        </div>

        {/* Goals List */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-muted" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-16 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Target className="text-muted-foreground/40" size={24} />
            </div>
            <p className="text-foreground font-semibold mb-1">
              Nenhuma meta criada
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie a primeira meta para seus sellers.
            </p>
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={14} className="inline mr-1" /> Criar Meta
            </button>
          </div>
        ) : (
          <div
            className="space-y-3 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {activeGoals.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Metas Ativas ({activeGoals.length})
                </h3>
                {activeGoals.map((goal, i) => {
                  const gtc = goalTypeConfig[goal.goal_type];
                  const rtc = rewardTypeConfig[goal.reward_type];
                  const seller = sellers.find(
                    (s) => s.user_id === goal.seller_id
                  );
                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl bg-card border border-border/40 p-5 hover:shadow-sm transition-all animate-fade-in"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                              gtc.bg
                            )}
                          >
                            <gtc.icon size={18} className={gtc.color} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">
                              {goal.title}
                            </h4>
                            {goal.description && (
                              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                {goal.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs text-muted-foreground/60">
                                <span className="font-medium text-foreground">
                                  {gtc.label}
                                </span>{" "}
                                · Alvo:{" "}
                                <span className="font-bold text-foreground">
                                  {formatTargetValue(goal)}
                                </span>
                              </span>
                              <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                                <rtc.icon size={10} className={rtc.color} />
                                {rtc.label}:{" "}
                                <span className="font-bold text-foreground">
                                  {formatRewardValue(goal)}
                                </span>
                              </span>
                              {goal.reward_description && (
                                <span className="text-xs text-muted-foreground/60">
                                  "{goal.reward_description}"
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                                  goal.seller_id
                                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                    : "bg-primary/10 text-primary border-primary/20"
                                )}
                              >
                                {goal.seller_id
                                  ? seller?.full_name ||
                                    seller?.account_id ||
                                    "Seller"
                                  : "Global"}
                              </span>
                              <span className="text-xs text-muted-foreground/40">
                                {format(
                                  new Date(goal.start_date),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                                {goal.end_date &&
                                  ` → ${format(
                                    new Date(goal.end_date),
                                    "dd/MM/yyyy",
                                    { locale: ptBR }
                                  )}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(goal)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => toggleActive(goal)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {inactiveGoals.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">
                  Inativas ({inactiveGoals.length})
                </h3>
                {inactiveGoals.map((goal) => {
                  const gtc = goalTypeConfig[goal.goal_type];
                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl bg-card/50 border border-border/20 p-4 opacity-60 hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              gtc.bg
                            )}
                          >
                            <gtc.icon size={14} className={gtc.color} />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-foreground">
                              {goal.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {gtc.label} · {formatTargetValue(goal)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleActive(goal)}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            Reativar
                          </button>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-2 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                Título *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Faturar R$ 50.000 no mês"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Detalhes da meta..."
                className={cn(inputClass, "h-16 resize-none")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
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
                  className={selectClass}
                >
                  <option value="revenue">Faturamento</option>
                  <option value="transaction_count">Qtd. de Vendas</option>
                  <option value="avg_ticket">Ticket Médio</option>
                  <option value="new_customers">Novos Clientes</option>
                </select>
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
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
                  className={inputClass}
                />
              </div>
            </div>

            <div className="h-px bg-border/30" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
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
                  className={selectClass}
                >
                  <option value="balance_bonus">Bônus em Saldo</option>
                  <option value="fee_discount">Desconto na Taxa</option>
                  <option value="badge">Badge/Selo</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
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
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                Descrição da Premiação
              </label>
              <input
                value={form.reward_description}
                onChange={(e) =>
                  setForm({ ...form, reward_description: e.target.value })
                }
                placeholder="Ex: Bônus de R$ 500 no saldo"
                className={inputClass}
              />
            </div>

            <div className="h-px bg-border/30" />

            <div>
              <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                Seller (deixe vazio para meta global)
              </label>
              <select
                value={form.seller_id}
                onChange={(e) =>
                  setForm({ ...form, seller_id: e.target.value })
                }
                className={selectClass}
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
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-muted-foreground mb-1 block">
                  Data Final (opcional)
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className={inputClass}
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
                className="text-sm text-foreground cursor-pointer"
              >
                Meta ativa
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : editingId
                  ? "Atualizar Meta"
                  : "Criar Meta"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
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
