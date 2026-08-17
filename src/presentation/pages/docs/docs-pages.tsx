import { getApiBaseUrl } from "@/infra/http/services/api/api-env";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

function apiRoot(): string {
  try {
    return `${getApiBaseUrl()}/api/v1`;
  } catch {
    return "https://app.oasyfy.com/api/v1";
  }
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-zinc-200">
      <code>{children}</code>
    </pre>
  );
}

function H({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-24 text-lg font-semibold text-white"
    >
      {children}
    </h2>
  );
}

export interface IDocsPage {
  title: string;
  summary: string;
  toc: { id: string; label: string }[];
  body: ReactNode;
}

export const DOCS_PAGES: Record<string, IDocsPage> = {
  "": {
    title: "Introdução",
    summary: "Aprenda a configurar e realizar transações",
    toc: [
      { id: "base", label: "Requisições e URL base" },
      { id: "auth", label: "Autenticação" },
      { id: "format", label: "Formato de respostas" },
      { id: "access", label: "Acesso à API" },
    ],
    body: (
      <div className="space-y-8">
        <p>
          Bem-vindo à API Oasyfy. Ela oferece endpoints REST para criar cobranças
          PIX, consultar transações, solicitar saques e receber{" "}
          <Link className="text-emerald-400 hover:underline" to="/docs/webhooks">
            webhooks
          </Link>{" "}
          quando o status de uma venda muda.
        </p>
        <p>
          Cartão, boleto e crypto existem no schema de criação de venda, mas a
          liquidação operacional atual é <strong>PIX</strong>.
        </p>
        <H id="base">Requisições e URL base</H>
        <p>A API é REST e exige HTTPS em produção.</p>
        <Code>{apiRoot()}</Code>
        <p className="text-sm text-zinc-400">
          Exemplo de produção: <code>https://app.oasyfy.com/api/v1</code>
        </p>
        <H id="auth">Autenticação</H>
        <p>
          Toda chamada ao gateway usa a chave da conta. Veja{" "}
          <Link
            className="text-emerald-400 hover:underline"
            to="/docs/autenticacao"
          >
            Autenticação API
          </Link>
          .
        </p>
        <H id="format">Formato de respostas</H>
        <p>
          Endpoints do gateway devolvem JSON plano (objeto da transação, lista,
          ou <code>{`{ "error": "..." }`}</code>). Rotas do portal autenticado
          usam envelope <code>status / message / data</code>.
        </p>
        <H id="access">Acesso à API</H>
        <p>
          A documentação é pública. O uso da API continua privado: a
          administração libera a conta, você cria a chave em{" "}
          <code>/seller/api</code> e só então as chamadas autenticam. Sem
          liberação o gateway responde <code>api_access_denied</code>.
        </p>
      </div>
    ),
  },
  autenticacao: {
    title: "Autenticação",
    summary: "Como autenticar requisições no gateway",
    toc: [
      { id: "headers", label: "Headers" },
      { id: "permissions", label: "Permissões" },
      { id: "errors", label: "Erros" },
    ],
    body: (
      <div className="space-y-8">
        <H id="headers">Headers</H>
        <p>
          Envie a chave no header <code>x-api-key</code> ou como{" "}
          <code>Authorization: Bearer sk_live_OAS_...</code>. A chave é gerada no
          portal, em API → Chaves, depois da liberação administrativa.
        </p>
        <Code>{`x-api-key: sk_live_OAS_...
Content-Type: application/json`}</Code>
        <H id="permissions">Permissões</H>
        <p>
          Cada chave escolhe um subconjunto: <code>consulta</code>,{" "}
          <code>venda</code>, <code>saque</code>, <code>rastreio</code>. Se a
          conta tiver IPs autorizados, qualquer chamada do gateway precisa vir
          desses IPs.
        </p>
        <H id="errors">Erros</H>
        <ul className="list-disc space-y-1 pl-5 text-zinc-300">
          <li>401 — chave inválida ou ausente</li>
          <li>403 — permissão, IP ou <code>api_access_denied</code></li>
        </ul>
      </div>
    ),
  },
  erros: {
    title: "Tratamento de erros",
    summary: "Códigos HTTP do gateway",
    toc: [{ id: "codes", label: "Códigos" }],
    body: (
      <div className="space-y-8">
        <H id="codes">Códigos</H>
        <ul className="list-disc space-y-2 pl-5 text-zinc-300">
          <li>200 / 201 — sucesso</li>
          <li>400 — parâmetros inválidos</li>
          <li>401 — API key inválida ou ausente</li>
          <li>403 — permissão, IP ou API não liberada</li>
          <li>404 — recurso não encontrado</li>
          <li>500 — erro interno</li>
        </ul>
        <Code>{`{
  "error": "api_access_denied",
  "message": "Acesso à API não está habilitado para esta conta."
}`}</Code>
      </div>
    ),
  },
  enums: {
    title: "Enums (Tipos de dados)",
    summary: "Valores aceitos em status e método",
    toc: [
      { id: "status", label: "Status" },
      { id: "method", label: "Método" },
    ],
    body: (
      <div className="space-y-8">
        <H id="status">Status da transação</H>
        <Code>{`pending | paid | completed | failed | refunded | cancelled | chargeback`}</Code>
        <H id="method">Método</H>
        <Code>{`pix | card | boleto | crypto | withdrawal`}</Code>
        <p>
          Valores monetários estão em <strong>centavos</strong>.{" "}
          <code>transaction_id</code> é inteiro positivo, não UUID.
        </p>
      </div>
    ),
  },
  faq: {
    title: "Dúvidas Frequentes",
    summary: "Perguntas comuns de integração",
    toc: [
      { id: "poll", label: "Preciso fazer polling?" },
      { id: "lock", label: "O que é lock?" },
    ],
    body: (
      <div className="space-y-8">
        <H id="poll">Preciso fazer polling?</H>
        <p>
          Não é obrigatório se você cadastrar um webhook de{" "}
          <Link
            className="text-emerald-400 hover:underline"
            to="/docs/webhooks/status-da-venda"
          >
            status da venda
          </Link>
          . Consulta e rastreio continuam disponíveis.
        </p>
        <H id="lock">O que é lock?</H>
        <p>
          <code>POST /gateway/lock</code> trava uma transação para impedir
          reembolso até destrave. Endpoint avançado, fora da navegação
          principal.
        </p>
      </div>
    ),
  },
  webhooks: {
    title: "Webhooks",
    summary: "A Oasyfy avisa o seu servidor quando a venda muda de status",
    toc: [
      { id: "how", label: "Como funciona" },
      { id: "setup", label: "Cadastro" },
      { id: "not", label: "O que não é" },
    ],
    body: (
      <div className="space-y-8">
        <H id="how">Como funciona</H>
        <p>
          Depois que o pagamento é confirmado (ou expirado, reembolsado, etc.),
          a Oasyfy faz <code>POST</code> HTTPS na URL cadastrada com o evento{" "}
          <code>sale.status_changed</code>.
        </p>
        <H id="setup">Cadastro</H>
        <p>
          No portal, em API → Webhooks (conta com API liberada). Até 3 URLs
          HTTPS. O signing secret aparece só na criação.
        </p>
        <H id="not">O que não é</H>
        <p>
          URLs como <code>/api/v1/webhooks/woovi/pix</code> são da adquirente
          para a Oasyfy. Não cadastre isso no seu sistema.
        </p>
      </div>
    ),
  },
  "webhooks/status-da-venda": {
    title: "Status da venda",
    summary: "Evento sale.status_changed",
    toc: [
      { id: "when", label: "Quando dispara" },
      { id: "payload", label: "Payload" },
    ],
    body: (
      <div className="space-y-8">
        <H id="when">Quando dispara</H>
        <p>
          Sempre que o <code>status</code> persistido de uma venda muda:
          pending→paid, pending→failed (PIX expirado), paid→refunded/chargeback.
          Não dispara na criação em pending, nem em saque, depósito interno,
          split_credit ou ajuste admin. Vendas de checkout público entram.
        </p>
        <H id="payload">Payload</H>
        <Code>{`{
  "id": "evt_1042_paid",
  "type": "sale.status_changed",
  "created_at": "2026-08-17T14:22:01.000Z",
  "test": false,
  "data": {
    "transaction_id": 1042,
    "previous_status": "pending",
    "status": "paid",
    "amount": 15000,
    "currency": "BRL",
    "method": "pix",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "description": "Pedido #1234",
    "metadata": { "order_id": "1234" },
    "created_at": "2026-08-17T14:20:00.000Z",
    "updated_at": "2026-08-17T14:22:01.000Z"
  }
}`}</Code>
      </div>
    ),
  },
  "webhooks/seguranca": {
    title: "Segurança",
    summary: "HMAC, retries e idempotência",
    toc: [
      { id: "hmac", label: "Assinatura" },
      { id: "retry", label: "Retries" },
      { id: "idemp", label: "Idempotência" },
    ],
    body: (
      <div className="space-y-8">
        <H id="hmac">Assinatura</H>
        <p>
          Header <code>X-Oasyfy-Signature: sha256=&lt;hex&gt;</code> — HMAC-SHA256
          do corpo bruto com o secret. Compare em tempo constante.
        </p>
        <Code>{`const crypto = require("crypto");
const expected = "sha256=" + crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");`}</Code>
        <H id="retry">Retries</H>
        <p>
          Timeout 5s. Sucesso = HTTP 2xx. Até 5 tentativas com backoff (10s, 40s,
          2m, 10m). Eventos de teste vêm com <code>test: true</code> — ignore na
          lógica de pedido real.
        </p>
        <H id="idemp">Idempotência</H>
        <p>
          Use o campo <code>id</code> (<code>evt_&lt;transactionId&gt;_&lt;status&gt;</code>
          ). Reprocessar o webhook da adquirente não gera um segundo POST se o
          status não mudou.
        </p>
      </div>
    ),
  },
  status: {
    title: "Healthcheck",
    summary: "Verifica se a API está no ar",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          <code>GET {apiRoot()}/healthcheck</code> — sem API key.
        </p>
        <Code>{`GET ${apiRoot()}/healthcheck

{
  "status": 200,
  "message": "System is running",
  "data": { "status": "ok" }
}`}</Code>
      </div>
    ),
  },
  "produtor/meus-dados": {
    title: "Meus dados",
    summary: "GET /gateway/me",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>consulta</code>.
        </p>
        <Code>{`GET ${apiRoot()}/gateway/me

{
  "seller_id": 12,
  "account_id": "OAS-A1B2C3D4E5",
  "name": "Loja Exemplo"
}`}</Code>
      </div>
    ),
  },
  "produtor/meu-saldo": {
    title: "Meu saldo",
    summary: "GET /gateway/balance",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>consulta</code>. Valores em centavos.
        </p>
        <Code>{`GET ${apiRoot()}/gateway/balance

{
  "available": 150000,
  "retained": 0,
  "totalSalesAmount": 200000
}`}</Code>
      </div>
    ),
  },
  "produtor/testar-credenciais": {
    title: "Testar credenciais",
    summary: "GET /gateway/ping",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>Qualquer chave válida. Útil para validar a integração.</p>
        <Code>{`GET ${apiRoot()}/gateway/ping

{ "ok": true, "seller_id": 12 }`}</Code>
      </div>
    ),
  },
  "consultas/buscar-transacao": {
    title: "Buscar transação",
    summary: "GET /gateway/transactions",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>consulta</code>. Query:{" "}
          <code>transaction_id</code> (int), <code>status</code>,{" "}
          <code>method</code>, <code>limit</code>, <code>offset</code>.
        </p>
        <Code>{`GET ${apiRoot()}/gateway/transactions?status=paid&limit=50`}</Code>
      </div>
    ),
  },
  "venda/criar": {
    title: "Criar venda",
    summary: "POST /gateway/sales",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>. Cria transação <code>pending</code>.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/sales

{
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "amount": 15000,
  "method": "pix",
  "description": "Pedido #1234",
  "metadata": { "order_id": "1234" }
}`}</Code>
      </div>
    ),
  },
  "venda/pix": {
    title: "Gerar PIX",
    summary: "POST /gateway/pix",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>. Gera cobrança PIX com QR e expiração.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/pix

{
  "customer_name": "Maria Santos",
  "amount": 5990,
  "description": "Assinatura mensal"
}`}</Code>
      </div>
    ),
  },
  split: {
    title: "Split de pagamento",
    summary: "Divisão no POST de venda ou PIX",
    toc: [{ id: "rules", label: "Regras" }],
    body: (
      <div className="space-y-8">
        <H id="rules">Regras</H>
        <p>
          Campo opcional <code>split[]</code> em <code>/gateway/sales</code> e{" "}
          <code>/gateway/pix</code>. Percentual até 6 casas; soma ≤ 100%. Sem
          split na request, o gateway aplica sócios ativos do portal.
        </p>
        <Code>{`"split": [
  { "account_id": "OAS-A1B2C3D4E5", "percentage": 17.888888 }
]`}</Code>
      </div>
    ),
  },
  saque: {
    title: "Solicitar saque",
    summary: "POST /gateway/withdrawals",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>saque</code>. Requer KYC e IP autorizado quando a
          conta usa allowlist.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/withdrawals

{ "amount": 50000, "description": "Saque semanal" }`}</Code>
      </div>
    ),
  },
  rastreio: {
    title: "Rastrear transação",
    summary: "GET /gateway/tracking",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>rastreio</code>. Query obrigatória{" "}
          <code>transaction_id</code> (inteiro).
        </p>
        <Code>{`GET ${apiRoot()}/gateway/tracking?transaction_id=1042`}</Code>
      </div>
    ),
  },
  reembolso: {
    title: "Reembolsar",
    summary: "POST /gateway/refunds",
    toc: [{ id: "req", label: "Request" }],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/refunds

{ "transaction_id": 1042, "reason": "Desistência" }`}</Code>
      </div>
    ),
  },
};
