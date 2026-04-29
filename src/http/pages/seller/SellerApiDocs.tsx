import { SellerLayout } from "@/http/components/seller/SellerLayout";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  DollarSign,
  Globe,
  Hash,
  Loader2,
  Lock,
  Play,
  RefreshCw,
  Search,
  SplitSquareVertical,
  Terminal,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BASE_URL = `${
  import.meta.env.VITE_SUPABASE_URL
}/functions/v1/api-gateway`;

/* ── Shared sub-components ── */

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado");
      }}
      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-all"
      title="Copiar"
    >
      <Copy size={12} />
    </button>
  );
}

function CodeBlock({
  code,
  language = "json",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-border/20">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
          {language}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success("Código copiado");
          }}
          className="p-1 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <Copy size={11} />
        </button>
      </div>
      <pre className="bg-muted/10 p-4 overflow-x-auto text-xs font-mono text-foreground/80 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
        styles[method] || "bg-muted/20 text-muted-foreground border-border/20"
      }`}
    >
      {method}
    </span>
  );
}

function ParamTable({
  title,
  params,
}: {
  title: string;
  params: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
        <Hash size={11} className="text-muted-foreground/50" />
        {title}
      </h4>
      <div className="rounded-xl border border-border/20 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/15 border-b border-border/10">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Parâmetro
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                Tipo
              </th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                Descrição
              </th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr
                key={p.name}
                className={
                  i < params.length - 1 ? "border-b border-border/5" : ""
                }
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <code className="font-mono text-foreground text-[11px]">
                      {p.name}
                    </code>
                    {p.required && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-destructive/70 bg-destructive/5 px-1.5 py-0.5 rounded">
                        req
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground/50 text-[10px] font-mono sm:hidden block mt-0.5">
                    {p.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-top hidden sm:table-cell">
                  <span className="text-muted-foreground/60 font-mono text-[10px]">
                    {p.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground align-top">
                  {p.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Endpoint data ── */

interface EndpointSection {
  id: string;
  title: string;
  icon: React.ElementType;
  permission: string;
  description: string;
  endpoints: {
    method: string;
    path: string;
    description: string;
    headers: { name: string; value: string; required: boolean }[];
    bodyParams?: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
    queryParams?: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
    requestExample?: string;
    responseExample: string;
  }[];
}

const SECTIONS: EndpointSection[] = [
  {
    id: "auth",
    title: "Autenticação",
    icon: Lock,
    permission: "-",
    description: "Como autenticar suas requisições à API.",
    endpoints: [
      {
        method: "INFO",
        path: "Todas as rotas",
        description:
          "Todas as requisições à API devem incluir sua chave de API no header. A chave é gerada na aba API > Chaves API.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        responseExample: `// Header obrigatório em todas as requisições:
{
  "x-api-key": "sk_live_OAS_sua_chave_aqui",
  "Content-Type": "application/json"
}

// Erros de autenticação:
// 401 - API key inválida ou ausente
// 403 - Permissão não habilitada ou IP não autorizado`,
      },
    ],
  },
  {
    id: "consulta",
    title: "Consulta",
    icon: Search,
    permission: "consulta",
    description: "Consulte transações com filtros e paginação.",
    endpoints: [
      {
        method: "GET",
        path: "/consulta",
        description:
          "Lista todas as transações do seller com paginação e filtros.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
        ],
        queryParams: [
          {
            name: "transaction_id",
            type: "string (UUID)",
            required: false,
            description: "ID de uma transação específica",
          },
          {
            name: "status",
            type: "string",
            required: false,
            description: "Filtrar por status: pending, paid, failed, refunded",
          },
          {
            name: "method",
            type: "string",
            required: false,
            description: "Filtrar por método: pix, card, boleto, crypto",
          },
          {
            name: "limit",
            type: "integer",
            required: false,
            description: "Quantidade por página (padrão: 50)",
          },
          {
            name: "offset",
            type: "integer",
            required: false,
            description: "Paginação offset (padrão: 0)",
          },
        ],
        responseExample: `{
  "transactions": [
    {
      "id": "uuid",
      "amount": 15000,
      "method": "pix",
      "status": "paid",
      "customer_name": "João Silva",
      "customer_email": "joao@email.com",
      "created_at": "2026-04-08T12:00:00Z",
      "metadata": {}
    }
  ],
  "total": 142,
  "limit": 50,
  "offset": 0
}`,
      },
      {
        method: "GET",
        path: "/consulta?transaction_id={id}",
        description: "Consulta uma transação específica pelo ID.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
        ],
        responseExample: `{
  "transaction": {
    "id": "uuid",
    "amount": 15000,
    "method": "pix",
    "status": "paid",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "description": "Produto X",
    "metadata": { "order_id": "123" },
    "created_at": "2026-04-08T12:00:00Z",
    "updated_at": "2026-04-08T12:05:00Z"
  }
}`,
      },
    ],
  },
  {
    id: "venda",
    title: "Venda",
    icon: DollarSign,
    permission: "venda",
    description: "Crie transações e gere cobranças PIX.",
    endpoints: [
      {
        method: "POST",
        path: "/venda",
        description: "Cria uma nova transação de venda.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        bodyParams: [
          {
            name: "customer_name",
            type: "string",
            required: true,
            description: "Nome do cliente",
          },
          {
            name: "customer_email",
            type: "string",
            required: false,
            description: "Email do cliente",
          },
          {
            name: "amount",
            type: "integer",
            required: true,
            description: "Valor em centavos (ex: 1500 = R$ 15,00)",
          },
          {
            name: "method",
            type: "string",
            required: true,
            description: "Método: pix, card, boleto, crypto",
          },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Descrição da venda",
          },
          {
            name: "metadata",
            type: "object",
            required: false,
            description: "Dados adicionais (order_id, etc.)",
          },
          {
            name: "split",
            type: "array",
            required: false,
            description: "Divisão de pagamento (ver seção Split)",
          },
        ],
        requestExample: `{
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "amount": 15000,
  "method": "pix",
  "description": "Pedido #1234",
  "metadata": {
    "order_id": "1234",
    "product": "Curso Online"
  }
}`,
        responseExample: `{
  "message": "Transação criada com sucesso",
  "transaction": {
    "id": "uuid",
    "amount": 15000,
    "method": "pix",
    "status": "pending",
    "customer_name": "João Silva",
    "created_at": "2026-04-08T12:00:00Z"
  }
}`,
      },
      {
        method: "POST",
        path: "/pix",
        description: "Gera um PIX com QR Code e expiração de 30 minutos.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        bodyParams: [
          {
            name: "customer_name",
            type: "string",
            required: true,
            description: "Nome do pagador",
          },
          {
            name: "customer_email",
            type: "string",
            required: false,
            description: "Email do pagador",
          },
          {
            name: "amount",
            type: "integer",
            required: true,
            description: "Valor em centavos",
          },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Descrição do pagamento",
          },
          {
            name: "metadata",
            type: "object",
            required: false,
            description: "Dados adicionais",
          },
          {
            name: "split",
            type: "array",
            required: false,
            description: "Divisão de pagamento (ver seção Split)",
          },
        ],
        requestExample: `{
  "customer_name": "Maria Santos",
  "amount": 5990,
  "description": "Assinatura mensal"
}`,
        responseExample: `{
  "message": "PIX gerado com sucesso",
  "transaction": {
    "id": "uuid",
    "amount": 5990,
    "method": "pix",
    "status": "pending",
    "created_at": "2026-04-08T12:00:00Z"
  },
  "pix": {
    "transaction_id": "uuid",
    "amount": 5990,
    "expiration": "2026-04-08T12:30:00Z",
    "status": "awaiting_payment"
  }
}`,
      },
    ],
  },
  {
    id: "split",
    title: "Split de Pagamento",
    icon: SplitSquareVertical,
    permission: "venda",
    description: "Divida pagamentos entre múltiplas contas.",
    endpoints: [
      {
        method: "POST",
        path: "/venda (com split)",
        description:
          "Divide o pagamento entre múltiplas contas. O percentual aceita até 6 casas decimais. A soma dos splits não pode ultrapassar 100%. O restante fica com o seller principal.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        bodyParams: [
          {
            name: "split[].account_id",
            type: "string",
            required: true,
            description: "ID da conta destino (ex: OAS-A1B2C3D4E5)",
          },
          {
            name: "split[].percentage",
            type: "number",
            required: true,
            description: "Percentual (0.000001 a 100). Ex: 17.888888",
          },
          {
            name: "split[].fixed_amount",
            type: "integer",
            required: false,
            description: "Valor fixo em centavos (alternativa ao %)",
          },
          {
            name: "split[].description",
            type: "string",
            required: false,
            description: 'Descrição (ex: "Comissão afiliado")',
          },
          {
            name: "split[].charge_processing_fee",
            type: "boolean",
            required: false,
            description: "Desconta taxa deste split (padrão: false)",
          },
        ],
        requestExample: `{
  "customer_name": "João Silva",
  "amount": 100000,
  "method": "pix",
  "description": "Venda com split",
  "split": [
    {
      "account_id": "OAS-A1B2C3D4E5",
      "percentage": 17.888888,
      "description": "Comissão afiliado"
    },
    {
      "account_id": "OAS-F6G7H8I9J0",
      "percentage": 5.5,
      "description": "Taxa plataforma",
      "charge_processing_fee": true
    },
    {
      "account_id": "OAS-K1L2M3N4O5",
      "fixed_amount": 500,
      "description": "Taxa fixa parceiro"
    }
  ]
}`,
        responseExample: `{
  "message": "Transação criada com sucesso",
  "transaction": {
    "id": "uuid",
    "amount": 100000,
    "method": "pix",
    "status": "pending"
  },
  "split_details": {
    "total_splits": 3,
    "breakdown": [
      { "account_id": "OAS-A1B2C3D4E5", "percentage": 17.888888, "amount": 17889, "description": "Comissão afiliado" },
      { "account_id": "OAS-F6G7H8I9J0", "percentage": 5.5, "amount": 5500, "description": "Taxa plataforma" },
      { "account_id": "OAS-K1L2M3N4O5", "fixed_amount": 500, "amount": 500, "description": "Taxa fixa parceiro" }
    ],
    "seller_amount": 76111,
    "seller_percentage": 76.111112
  }
}`,
      },
      {
        method: "POST",
        path: "/pix (com split)",
        description:
          "Gera PIX com divisão automática. Mesmo formato do split na rota /venda.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        requestExample: `{
  "customer_name": "Maria Santos",
  "amount": 29900,
  "description": "Curso com afiliado",
  "split": [
    {
      "account_id": "OAS-A1B2C3D4E5",
      "percentage": 30,
      "description": "Afiliado"
    }
  ]
}`,
        responseExample: `{
  "message": "PIX gerado com sucesso",
  "transaction": { "id": "uuid", "amount": 29900, "status": "pending" },
  "pix": { "transaction_id": "uuid", "amount": 29900, "expiration": "..." },
  "split_details": {
    "total_splits": 1,
    "breakdown": [
      { "account_id": "OAS-A1B2C3D4E5", "percentage": 30, "amount": 8970 }
    ],
    "seller_amount": 20930,
    "seller_percentage": 70
  }
}`,
      },
    ],
  },
  {
    id: "saque",
    title: "Saque",
    icon: RefreshCw,
    permission: "saque",
    description: "Solicite saques para sua conta bancária.",
    endpoints: [
      {
        method: "POST",
        path: "/saque",
        description:
          "Solicita um saque. Requer KYC aprovado e IP autorizado. O valor é em centavos.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
          { name: "Content-Type", value: "application/json", required: true },
        ],
        bodyParams: [
          {
            name: "amount",
            type: "integer",
            required: true,
            description: "Valor em centavos (ex: 50000 = R$ 500,00)",
          },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Descrição do saque",
          },
        ],
        requestExample: `{
  "amount": 50000,
  "description": "Saque semanal"
}`,
        responseExample: `{
  "message": "Saque solicitado com sucesso",
  "withdrawal": {
    "id": "uuid",
    "amount": 50000,
    "status": "pending",
    "created_at": "2026-04-08T12:00:00Z"
  }
}`,
      },
    ],
  },
  {
    id: "rastreio",
    title: "Rastreio",
    icon: Truck,
    permission: "rastreio",
    description: "Rastreie o status das suas transações.",
    endpoints: [
      {
        method: "GET",
        path: "/rastreio?transaction_id={id}",
        description: "Rastreia o status completo de uma transação.",
        headers: [
          { name: "x-api-key", value: "sk_live_OAS_...", required: true },
        ],
        queryParams: [
          {
            name: "transaction_id",
            type: "string (UUID)",
            required: true,
            description: "ID da transação a rastrear",
          },
        ],
        responseExample: `{
  "tracking": {
    "transaction_id": "uuid",
    "status": "paid",
    "method": "pix",
    "amount": 15000,
    "customer_name": "João Silva",
    "created_at": "2026-04-08T12:00:00Z",
    "updated_at": "2026-04-08T12:05:00Z",
    "metadata": {
      "order_id": "1234",
      "pix_generated": true
    }
  }
}`,
      },
    ],
  },
];

/* ── Endpoint card ── */

function EndpointCard({
  endpoint,
}: {
  endpoint: EndpointSection["endpoints"][0];
}) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testApiKey, setTestApiKey] = useState("");
  const [testBody, setTestBody] = useState(endpoint.requestExample || "");
  const [testQuery, setTestQuery] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    status: number;
    body: string;
  } | null>(null);

  const canTest =
    endpoint.method !== "INFO" && !endpoint.path.includes("(com split)");

  const handleTest = async () => {
    if (!testApiKey.trim()) {
      toast.error("Insira sua API key");
      return;
    }
    setTestLoading(true);
    setTestResponse(null);
    try {
      const cleanPath = endpoint.path.split("?")[0];
      let url = `${BASE_URL}${cleanPath}`;
      if (testQuery.trim()) url += `?${testQuery.trim()}`;
      const opts: RequestInit = {
        method: endpoint.method,
        headers: {
          "x-api-key": testApiKey,
          "Content-Type": "application/json",
        },
      };
      if (
        ["POST", "PUT", "PATCH"].includes(endpoint.method) &&
        testBody.trim()
      ) {
        opts.body = testBody.trim();
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}
      setTestResponse({ status: res.status, body: formatted });
    } catch (err: any) {
      setTestResponse({ status: 0, body: `Erro de conexão: ${err.message}` });
    } finally {
      setTestLoading(false);
    }
  };

  const isInfo = endpoint.method === "INFO";

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        expanded
          ? "border-border/40 bg-card/50 shadow-sm"
          : "border-border/20 hover:border-border/40"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 md:px-5 py-3.5 text-left group"
      >
        {!isInfo && <MethodBadge method={endpoint.method} />}
        {isInfo && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-muted/30 text-muted-foreground border border-border/20">
            INFO
          </span>
        )}
        <code className="text-xs font-mono text-foreground/80 flex-1 truncate">
          {endpoint.path}
        </code>
        <ChevronDown
          size={14}
          className={`text-muted-foreground/40 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 space-y-5 border-t border-border/10 pt-4 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {endpoint.description}
          </p>

          {/* Headers */}
          {endpoint.headers.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                <Lock size={11} className="text-muted-foreground/50" />
                Headers
              </h4>
              <div className="rounded-xl border border-border/15 divide-y divide-border/10 overflow-hidden">
                {endpoint.headers.map((h) => (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs"
                  >
                    <code className="font-mono text-foreground/80 shrink-0">
                      {h.name}
                    </code>
                    <span className="text-muted-foreground/50 truncate flex-1">
                      {h.value}
                    </span>
                    {h.required && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-destructive/70 bg-destructive/5 px-1.5 py-0.5 rounded shrink-0">
                        req
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Params */}
          {endpoint.queryParams && endpoint.queryParams.length > 0 && (
            <ParamTable
              title="Query Parameters"
              params={endpoint.queryParams}
            />
          )}

          {/* Body Params */}
          {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
            <ParamTable title="Body Parameters" params={endpoint.bodyParams} />
          )}

          {/* Request Example */}
          {endpoint.requestExample && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
                <ArrowRight size={11} className="text-muted-foreground/50" />
                Request
              </h4>
              <CodeBlock code={endpoint.requestExample} />
            </div>
          )}

          {/* Response Example */}
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
              <ArrowRight
                size={11}
                className="text-muted-foreground/50 rotate-180"
              />
              Response
            </h4>
            <CodeBlock code={endpoint.responseExample} />
          </div>

          {/* Test Endpoint */}
          {canTest && (
            <div className="pt-1">
              <button
                onClick={() => setTesting(!testing)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  testing
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
                }`}
              >
                <Terminal size={12} />
                {testing ? "Fechar playground" : "Testar endpoint"}
              </button>

              {testing && (
                <div className="mt-4 space-y-3 p-4 rounded-xl bg-muted/10 border border-border/20">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                      API Key
                    </label>
                    <input
                      type="text"
                      placeholder="sk_live_OAS_..."
                      value={testApiKey}
                      onChange={(e) => setTestApiKey(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border/30 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {endpoint.method === "GET" &&
                    endpoint.queryParams &&
                    endpoint.queryParams.length > 0 && (
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                          Query string
                        </label>
                        <input
                          type="text"
                          placeholder="status=paid&limit=10"
                          value={testQuery}
                          onChange={(e) => setTestQuery(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/30 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    )}

                  {["POST", "PUT", "PATCH"].includes(endpoint.method) && (
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5 block">
                        Body (JSON)
                      </label>
                      <textarea
                        rows={6}
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-border/30 bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleTest}
                    disabled={testLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-all disabled:opacity-50"
                  >
                    {testLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Play size={12} />
                    )}
                    Enviar requisição
                  </button>

                  {testResponse && (
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Resposta
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            testResponse.status >= 200 &&
                            testResponse.status < 300
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : testResponse.status >= 400
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {testResponse.status || "ERR"}
                        </span>
                      </div>
                      <CodeBlock code={testResponse.body} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Status codes ── */

const STATUS_CODES = [
  { code: "200", desc: "Sucesso", color: "bg-emerald-500" },
  { code: "201", desc: "Recurso criado com sucesso", color: "bg-emerald-500" },
  {
    code: "400",
    desc: "Requisição inválida (parâmetros faltando ou inválidos)",
    color: "bg-amber-500",
  },
  { code: "401", desc: "API key inválida ou ausente", color: "bg-red-500" },
  {
    code: "403",
    desc: "Permissão negada ou IP não autorizado",
    color: "bg-red-500",
  },
  { code: "404", desc: "Recurso não encontrado", color: "bg-muted-foreground" },
  { code: "500", desc: "Erro interno do servidor", color: "bg-red-500" },
];

const SPLIT_RULES = [
  "Percentual aceita até 6 casas decimais (ex: 17.888888%)",
  "A soma dos percentuais não pode ultrapassar 100%",
  "O valor restante permanece com o seller principal",
  "Pode combinar percentage e fixed_amount no mesmo split",
  "fixed_amount é descontado primeiro, depois os percentuais são calculados sobre o restante",
  "Valores são arredondados para o centavo mais próximo",
  "O account_id deve ser o ID de uma conta ativa na plataforma",
  "Se charge_processing_fee for true, a taxa de processamento é descontada daquele split",
];

/* ── Main page ── */

export default function SellerApiDocs() {
  const [activeSection, setActiveSection] = useState("auth");

  return (
    <SellerLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {/* Hero header */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Documentação API
              </h1>
              <p className="text-xs text-muted-foreground">
                Referência completa do gateway de pagamentos
              </p>
            </div>
          </div>

          {/* Base URL */}
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/15 border border-border/20">
            <Globe size={13} className="text-muted-foreground/50 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 shrink-0">
              Base URL
            </span>
            <code className="text-xs font-mono text-foreground/80 flex-1 truncate">
              {BASE_URL}
            </code>
            <CopyButton text={BASE_URL} />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <nav className="w-48 shrink-0 sticky top-4 self-start hidden md:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-3 px-3">
              Endpoints
            </p>
            <div className="space-y-0.5">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isActive
                        ? "bg-primary/8 text-primary border border-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    }`}
                  >
                    <Icon
                      size={14}
                      strokeWidth={1.8}
                      className={
                        isActive ? "text-primary" : "text-muted-foreground/50"
                      }
                    />
                    {section.title}
                    {isActive && (
                      <ChevronRight
                        size={12}
                        className="ml-auto text-primary/50"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Mobile nav */}
            <div className="flex gap-1.5 overflow-x-auto md:hidden pb-4 mb-2 scrollbar-hide">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary border border-primary/15"
                        : "text-muted-foreground bg-muted/15 border border-border/10 hover:bg-muted/30"
                    }`}
                  >
                    <Icon size={12} />
                    {section.title}
                  </button>
                );
              })}
            </div>

            {SECTIONS.filter((s) => s.id === activeSection).map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="animate-fade-in">
                  {/* Section header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        className="text-primary"
                      />
                      <h2 className="text-base font-semibold text-foreground">
                        {section.title}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground/70">
                      {section.description}
                    </p>
                    {section.permission !== "-" && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/15 border border-border/15">
                        <Lock size={10} className="text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground">
                          Permissão:
                        </span>
                        <code className="text-[10px] font-mono text-foreground/70">
                          {section.permission}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Endpoints */}
                  <div className="space-y-3">
                    {section.endpoints.map((ep, i) => (
                      <EndpointCard key={i} endpoint={ep} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Status codes */}
            {activeSection === "auth" && (
              <div className="mt-8 rounded-xl border border-border/20 overflow-hidden">
                <div className="px-5 py-3.5 bg-muted/10 border-b border-border/10">
                  <h3 className="text-xs font-semibold text-foreground">
                    Códigos de Status HTTP
                  </h3>
                </div>
                <div className="divide-y divide-border/5">
                  {STATUS_CODES.map((s) => (
                    <div
                      key={s.code}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="flex items-center gap-2 w-16 shrink-0">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${s.color}`}
                        />
                        <code className="font-mono text-xs font-bold text-foreground">
                          {s.code}
                        </code>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {s.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split rules */}
            {activeSection === "split" && (
              <div className="mt-8 rounded-xl border border-border/20 overflow-hidden">
                <div className="px-5 py-3.5 bg-muted/10 border-b border-border/10">
                  <h3 className="text-xs font-semibold text-foreground">
                    Regras do Split
                  </h3>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2.5">
                    {SPLIT_RULES.map((rule, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xs text-muted-foreground"
                      >
                        <div className="w-4 h-4 rounded-md bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-primary">
                            {i + 1}
                          </span>
                        </div>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
