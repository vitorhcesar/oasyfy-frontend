import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";
import { AlertTriangle, CheckCircle, Search } from "lucide-react";

interface IColorsTabLivePreviewProps {
  theme: IGatewayThemeColors;
  mode: "light" | "dark";
}

export function ColorsTabLivePreview({
  theme,
  mode,
}: IColorsTabLivePreviewProps) {
  const bg =
    mode === "light" ? theme.backgroundColor : theme.darkBackgroundColor;
  const fg =
    mode === "light" ? theme.foregroundColor : theme.darkForegroundColor;
  const card = mode === "light" ? theme.cardColor : theme.darkCardColor;
  const cardFg =
    mode === "light" ? theme.cardForeground : theme.darkCardForeground;
  const border = mode === "light" ? theme.borderColor : theme.darkBorderColor;
  const muted =
    mode === "light" ? theme.mutedForeground : theme.darkMutedForeground;
  const primary =
    mode === "light" ? theme.primaryColor : theme.darkPrimaryColor;
  const mutedBg = mode === "light" ? theme.mutedColor : theme.darkMutedColor;

  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-colors duration-300 h-full"
      style={{ backgroundColor: `hsl(${bg})`, color: `hsl(${fg})` }}
    >
      {/* Nav */}
      <div
        className="flex items-center justify-between pb-3"
        style={{ borderBottom: `1px solid hsl(${border})` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `hsl(${primary})` }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: `hsl(${theme.primaryForeground})` }}
            >
              O
            </span>
          </div>
          <span className="text-xs font-bold" style={{ color: `hsl(${fg})` }}>
            Oasyfy
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-medium"
            style={{ color: `hsl(${muted})` }}
          >
            Dashboard
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: `hsl(${muted})` }}
          >
            Transações
          </span>
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: `hsl(${mutedBg})` }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
          style={{
            backgroundColor: `hsl(${primary})`,
            color: `hsl(${theme.primaryForeground})`,
          }}
        >
          Primário
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: `hsl(${theme.successColor})`,
            color: "white",
          }}
        >
          Sucesso
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: `hsl(${theme.warningColor})`,
            color: "white",
          }}
        >
          Alerta
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: `hsl(${theme.destructiveColor})`,
            color: "white",
          }}
        >
          Erro
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
          style={{ borderColor: `hsl(${border})`, color: `hsl(${fg})` }}
        >
          Outline
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle
              size={11}
              style={{ color: `hsl(${theme.successColor})` }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: `hsl(${cardFg})` }}
            >
              Aprovado
            </span>
          </div>
          <p
            className="text-base font-bold leading-none"
            style={{ color: `hsl(${cardFg})` }}
          >
            R$ 1.234,56
          </p>
          <p className="text-xs mt-1" style={{ color: `hsl(${muted})` }}>
            Volume do período
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle
              size={11}
              style={{ color: `hsl(${theme.warningColor})` }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: `hsl(${cardFg})` }}
            >
              Pendente
            </span>
          </div>
          <p
            className="text-base font-bold leading-none"
            style={{ color: `hsl(${cardFg})` }}
          >
            12
          </p>
          <p className="text-xs mt-1" style={{ color: `hsl(${muted})` }}>
            Transações
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-lg px-3 py-2 text-xs flex items-center gap-2"
          style={{
            backgroundColor: `hsl(${card})`,
            border: `1px solid hsl(${border})`,
            color: `hsl(${muted})`,
          }}
        >
          <Search size={10} style={{ color: `hsl(${muted})` }} />
          Pesquisar transações...
        </div>
        <div
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: `hsl(${primary})`,
            color: `hsl(${theme.primaryForeground})`,
          }}
        >
          Buscar
        </div>
      </div>

      {/* Table preview */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid hsl(${border})` }}
      >
        <div
          className="flex items-center text-xs font-semibold px-3 py-2"
          style={{ backgroundColor: `hsl(${mutedBg})`, color: `hsl(${muted})` }}
        >
          <span className="flex-1">Nome</span>
          <span className="w-20 text-right">Valor</span>
          <span className="w-16 text-right">Status</span>
        </div>
        {[
          {
            name: "João Silva",
            amount: "R$ 89,90",
            status: "Pago",
            statusColor: theme.successColor,
          },
          {
            name: "Maria Santos",
            amount: "R$ 245,00",
            status: "Pendente",
            statusColor: theme.warningColor,
          },
        ].map((row, i) => (
          <div
            key={i}
            className="flex items-center text-xs px-3 py-2"
            style={{
              backgroundColor: `hsl(${card})`,
              borderTop: `1px solid hsl(${border})`,
            }}
          >
            <span
              className="flex-1 font-medium"
              style={{ color: `hsl(${cardFg})` }}
            >
              {row.name}
            </span>
            <span
              className="w-20 text-right font-medium"
              style={{ color: `hsl(${cardFg})` }}
            >
              {row.amount}
            </span>
            <span className="w-16 text-right">
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold"
                style={{
                  backgroundColor: `hsl(${row.statusColor} / 0.12)`,
                  color: `hsl(${row.statusColor})`,
                }}
              >
                {row.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
