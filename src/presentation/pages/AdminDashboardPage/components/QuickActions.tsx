import {
  Activity,
  CreditCard,
  FileCheck,
  RefreshCcw,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();

  const quickActions = [
    {
      label: "Revisar KYCs",
      description: "Aprovar ou rejeitar verificações",
      icon: FileCheck,
      link: "/admin/kyc",
    },
    {
      label: "Ver Sellers",
      description: "Gerenciar contas de sellers",
      icon: Users,
      link: "/admin/sellers",
    },
    {
      label: "Transações",
      description: "Visualizar pagamentos",
      icon: CreditCard,
      link: "/admin/transactions",
    },
    {
      label: "Saques",
      description: "Gerenciar saques pendentes",
      icon: Wallet,
      link: "/admin/withdrawals",
    },
    {
      label: "Estornos",
      description: "Analisar solicitações",
      icon: RefreshCcw,
      link: "/admin/refunds",
    },
    {
      label: "Configurações",
      description: "Personalizar gateway",
      icon: Activity,
      link: "/admin/general",
    },
  ];

  return (
    <div className="rounded-xl bg-card border border-border/50 p-3">
      <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <Activity size={11} className="text-primary" /> Ações rápidas
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.link)}
            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-all text-left"
          >
            <div className="w-6 h-6 rounded-md bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
              <action.icon
                size={11}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-foreground leading-none">
                {action.label}
              </p>
              <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
