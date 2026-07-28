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
    <div className="liquid-glass-control rounded-[22px] p-5">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <Activity size={16} className="text-primary" /> Ações rápidas
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.link)}
            className="group flex items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-white/10"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-primary/20">
              <action.icon
                size={18}
                className="text-muted-foreground transition-colors group-hover:text-primary"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none text-foreground">
                {action.label}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
