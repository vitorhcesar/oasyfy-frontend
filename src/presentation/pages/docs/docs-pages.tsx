import { getApiBaseUrl } from "@/infra/http/services/api/api-env";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { DocsFullAiPrompt } from "./DocsFullAiPrompt";

function apiRoot(): string {
  try {
    return `${getApiBaseUrl()}/api/v1`;
  } catch {
    return "https://app.oasyfy.com/api/v1";
  }
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#11151c] p-4 font-['IBM_Plex_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-[13px] font-medium leading-[1.7] tracking-tight text-[#d7e7f4]">
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

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      {children}
    </p>
  );
}

function ParamTable({
  title,
  params,
}: {
  title: string;
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Campo</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Tipo</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {params.map((param) => (
              <tr key={param.name} className="border-t border-white/5">
                <td className="px-3 py-2.5 align-top">
                  <code className="text-zinc-100">{param.name}</code>
                  {param.required && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-400">
                      req
                    </span>
                  )}
                  <div className="mt-0.5 font-mono text-[10px] text-zinc-500 sm:hidden">
                    {param.type}
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 align-top font-mono text-zinc-500 sm:table-cell">
                  {param.type}
                </td>
                <td className="px-3 py-2.5 align-top text-zinc-400">
                  {param.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
        <p>
          Para implementar tudo de uma vez com Claude, ChatGPT ou Lovable, use{" "}
          <Link
            className="text-emerald-400 hover:underline"
            to="/docs/integrar-com-ia"
          >
            Integrar com IA
          </Link>
          .
        </p>
      </div>
    ),
  },
  "integrar-com-ia": {
    title: "Integrar com IA",
    summary: "Documentação completa para colar no Claude, ChatGPT, Lovable ou Cursor",
    toc: [{ id: "documento", label: "Documento para a IA" }],
    body: <DocsFullAiPrompt />,
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
      { id: "sale", label: "Por venda" },
      { id: "headers", label: "Headers" },
      { id: "not", label: "O que não é" },
    ],
    body: (
      <div className="space-y-8">
        <H id="how">Como funciona</H>
        <p>
          Depois que o pagamento é confirmado (ou expirado, reembolsado, etc.),
          a Oasyfy faz <code>POST</code> HTTPS na URL cadastrada com o evento{" "}
          <code>sale.status_changed</code>. O body é JSON. Responda{" "}
          <code>2xx</code> em até 5 segundos.
        </p>
        <p>
          Na v1 o único evento é{" "}
          <Link
            className="text-emerald-400 hover:underline"
            to="/docs/webhooks/status-da-venda"
          >
            status da venda
          </Link>
          . Cadastro, secret e teste ficam no portal — não há CRUD de webhook
          no gateway com <code>x-api-key</code>.
        </p>
        <H id="setup">Cadastro</H>
        <p>
          Portal: API → Webhooks (conta com API liberada). Até 3 URLs HTTPS. O
          signing secret (<code>whsec_...</code>) aparece só na criação; copie
          na hora. Use o botão Testar para receber um payload com{" "}
          <code>test: true</code>.
        </p>
        <H id="sale">Webhook por venda</H>
        <p>
          Além do cadastro no portal, <code>POST /gateway/sales</code> e{" "}
          <code>POST /gateway/pix</code> aceitam <code>webhook_url</code>{" "}
          opcional. O evento é o mesmo (<code>sale.status_changed</code>) e
          dispara <strong>só nessa cobrança</strong>, além das URLs da conta.
        </p>
        <p>
          Pode ser sempre a mesma URL (idempotente: um destino e um secret) ou
          um path por pedido (<code>/hooks/orders/1234</code>). O secret (
          <code>whsec_...</code>) vem só no 201 da primeira vez daquela URL.
          GET de transação nunca devolve o secret. Checkout público não aceita
          o campo.
        </p>
        <H id="headers">Headers enviados</H>
        <ParamTable
          title="Cada POST inclui"
          params={[
            {
              name: "Content-Type",
              type: "string",
              required: true,
              description: "application/json",
            },
            {
              name: "User-Agent",
              type: "string",
              required: true,
              description: "Oasyfy-Webhooks/1.0",
            },
            {
              name: "X-Oasyfy-Event",
              type: "string",
              required: true,
              description: "sale.status_changed",
            },
            {
              name: "X-Oasyfy-Delivery-Id",
              type: "string",
              required: true,
              description: "UUID da tentativa de entrega",
            },
            {
              name: "X-Oasyfy-Signature",
              type: "string",
              required: true,
              description: "sha256=<hex> do corpo bruto. Ver Segurança.",
            },
          ]}
        />
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
      { id: "transitions", label: "Transições" },
      { id: "payload", label: "Payload" },
    ],
    body: (
      <div className="space-y-8">
        <H id="when">Quando dispara</H>
        <p>
          Sempre que o <code>status</code> persistido de uma venda muda. Vendas
          criadas via <code>POST /gateway/pix</code>,{" "}
          <code>POST /gateway/sales</code> e checkout público entram.
        </p>
        <p>
          Não dispara na criação em <code>pending</code>, nem em saque,
          depósito interno, split_credit ou ajuste admin.
        </p>
        <H id="transitions">Transições típicas</H>
        <ParamTable
          title="De → para"
          params={[
            {
              name: "pending → paid",
              type: "evento",
              required: false,
              description: "PIX pago (webhook da adquirente confirmado)",
            },
            {
              name: "pending → failed",
              type: "evento",
              required: false,
              description: "PIX expirado sem pagamento",
            },
            {
              name: "paid → refunded",
              type: "evento",
              required: false,
              description: "Reembolso concluído",
            },
            {
              name: "paid → chargeback",
              type: "evento",
              required: false,
              description: "Chargeback",
            },
          ]}
        />
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
    "customer_document": "52998224725",
    "description": "Pedido #1234",
    "metadata": { "order_id": "1234" },
    "webhook_scope": "gateway",
    "created_at": "2026-08-17T14:20:00.000Z",
    "updated_at": "2026-08-17T14:22:01.000Z"
  }
}`}</Code>
        <ParamTable
          title="Campos de data"
          params={[
            {
              name: "id",
              type: "string",
              required: true,
              description:
                "evt_<transactionId>_<status> — use para idempotência",
            },
            {
              name: "type",
              type: "string",
              required: true,
              description: "Sempre sale.status_changed",
            },
            {
              name: "test",
              type: "boolean",
              required: true,
              description:
                "true só no botão Testar do portal — ignore no pedido real",
            },
            {
              name: "data.transaction_id",
              type: "integer",
              required: true,
              description: "ID numérico da transação (não é UUID)",
            },
            {
              name: "data.amount",
              type: "integer",
              required: true,
              description: "Valor em centavos",
            },
            {
              name: "data.customer_document",
              type: "string | null",
              required: false,
              description:
                "CPF (11) ou CNPJ (14), só dígitos, se enviado na venda",
            },
            {
              name: "data.webhook_scope",
              type: "string",
              required: false,
              description:
                "account (portal) ou gateway (webhook_url da request)",
            },
          ]}
        />
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
          do corpo bruto (bytes recebidos, sem re-serializar) com o secret.
          Compare em tempo constante.
        </p>
        <Code>{`const crypto = require("crypto");
const expected = "sha256=" + crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");
const ok = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(req.headers["x-oasyfy-signature"] || "")
);`}</Code>
        <Code>{`<?php
$expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
$hashEquals = hash_equals($expected, $_SERVER['HTTP_X_OASYFY_SIGNATURE'] ?? '');`}</Code>
        <H id="retry">Retries</H>
        <p>
          Timeout 5s. Sucesso = HTTP 2xx. Até 5 tentativas com backoff: 10s,
          40s, 2 min, 10 min. Eventos de teste vêm com <code>test: true</code> —
          ignore na lógica de pedido real.
        </p>
        <H id="idemp">Idempotência</H>
        <p>
          Use o campo <code>id</code> (
          <code>evt_&lt;transactionId&gt;_&lt;status&gt;</code>
          ). Reprocessar o webhook da adquirente não gera um segundo POST se o
          status não mudou. Guarde os IDs já processados.
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
    toc: [
      { id: "req", label: "Request" },
      { id: "params", label: "Query" },
    ],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>consulta</code>. Sem <code>transaction_id</code>,
          lista as transações da conta.
        </p>
        <Code>{`GET ${apiRoot()}/gateway/transactions?status=paid&limit=50
x-api-key: sk_live_OAS_...`}</Code>
        <H id="params">Query</H>
        <ParamTable
          title="Parâmetros"
          params={[
            {
              name: "transaction_id",
              type: "integer",
              required: false,
              description: "ID numérico. Também aceito como string na query.",
            },
            {
              name: "status",
              type: "enum",
              required: false,
              description:
                "pending | paid | completed | failed | refunded | cancelled | chargeback",
            },
            {
              name: "method",
              type: "enum",
              required: false,
              description: "pix | card | boleto | crypto | withdrawal",
            },
            {
              name: "limit",
              type: "integer",
              required: false,
              description: "1–500. Default 50.",
            },
            {
              name: "offset",
              type: "integer",
              required: false,
              description: "Default 0.",
            },
          ]}
        />
      </div>
    ),
  },
  "venda/criar": {
    title: "Criar venda",
    summary: "POST /gateway/sales",
    toc: [
      { id: "req", label: "Request" },
      { id: "body", label: "Body" },
    ],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>. Cria transação <code>pending</code>.
          Para gerar QR Code PIX, use{" "}
          <Link className="text-emerald-400 hover:underline" to="/docs/venda/pix">
            Gerar PIX
          </Link>
          .
        </p>
        <Code>{`POST ${apiRoot()}/gateway/sales
x-api-key: sk_live_OAS_...
Content-Type: application/json

{
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_document": "52998224725",
  "amount": 15000,
  "method": "pix",
  "description": "Pedido #1234",
  "metadata": { "order_id": "1234" },
  "webhook_url": "https://api.loja.com/oasyfy/orders/1234"
}`}</Code>
        <H id="body">Body</H>
        <ParamTable
          title="Campos"
          params={[
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
              description: "E-mail válido",
            },
            {
              name: "customer_document",
              type: "string",
              required: false,
              description:
                "CPF (11) ou CNPJ (14). Também aceita os aliases cpf e cnpj.",
            },
            {
              name: "amount",
              type: "integer",
              required: true,
              description: "Centavos. 15000 = R$ 150,00. Número, não string.",
            },
            {
              name: "method",
              type: "enum",
              required: true,
              description: "pix | card | boleto | crypto. Liquidação atual: PIX.",
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
              description: "JSON livre (order_id, etc.)",
            },
            {
              name: "webhook_url",
              type: "string",
              required: false,
              description:
                "HTTPS. Notifica só esta venda. Mesma URL = mesmo secret (idempotente). Secret só no 201 da 1ª vez.",
            },
            {
              name: "split",
              type: "array",
              required: false,
              description: "Ver Split de pagamento",
            },
          ]}
        />
      </div>
    ),
  },
  "venda/pix": {
    title: "Gerar PIX",
    summary: "POST /gateway/pix",
    toc: [
      { id: "req", label: "Request" },
      { id: "body", label: "Body" },
      { id: "res", label: "Resposta" },
    ],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>. Cria a transação, gera a cobrança na
          adquirente e devolve o código copia-e-cola. Header{" "}
          <code>Content-Type: application/json</code> é obrigatório — body
          vazio ou campos com nomes diferentes geram 400.
        </p>
        <Note>
          Os campos obrigatórios são customer_name (string) e amount (número em
          centavos). Sem eles a API responde 400 com expected string / expected
          number received undefined. Envie também customer_document (CPF ou
          CNPJ) para identificar o pagador na adquirente.
        </Note>
        <Code>{`POST ${apiRoot()}/gateway/pix
x-api-key: sk_live_OAS_...
Content-Type: application/json

{
  "customer_name": "Maria Santos",
  "customer_email": "maria@email.com",
  "customer_document": "52998224725",
  "amount": 5990,
  "description": "Assinatura mensal",
  "metadata": { "order_id": "A-100" },
  "webhook_url": "https://api.loja.com/oasyfy/hooks"
}`}</Code>
        <H id="body">Body</H>
        <ParamTable
          title="Campos"
          params={[
            {
              name: "customer_name",
              type: "string",
              required: true,
              description: "Nome do pagador (debtor_name na adquirente)",
            },
            {
              name: "customer_email",
              type: "string",
              required: false,
              description: "E-mail válido",
            },
            {
              name: "customer_document",
              type: "string",
              required: false,
              description:
                "CPF ou CNPJ do pagador. Dígitos ou formatado. Aliases: cpf, cnpj.",
            },
            {
              name: "amount",
              type: "integer",
              required: true,
              description:
                "Centavos. 5990 = R$ 59,90. JSON number; string numérica também é aceita.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "Descrição / comment da cobrança",
            },
            {
              name: "metadata",
              type: "object",
              required: false,
              description: "JSON livre. customer_document também é gravado aqui.",
            },
            {
              name: "webhook_url",
              type: "string",
              required: false,
              description:
                "HTTPS. Callback só desta cobrança, além dos webhooks da conta. URL inválida → 400 invalid_webhook_url, sem gerar PIX.",
            },
            {
              name: "split",
              type: "array",
              required: false,
              description: "Ver Split de pagamento",
            },
            {
              name: "pix_code",
              type: "string",
              required: false,
              description:
                "Avançado: informa um EMV já gerado e pula a chamada à adquirente.",
            },
          ]}
        />
        <H id="res">Resposta 201</H>
        <Code>{`{
  "message": "PIX gerado com sucesso",
  "transaction": {
    "id": 1042,
    "amount": 5990,
    "method": "pix",
    "status": "pending",
    "customer_name": "Maria Santos",
    "pix_code": "00020126..."
  },
  "pix": {
    "transaction_id": 1042,
    "amount": 5990,
    "pix_code": "00020126...",
    "expiration": "2026-08-17T15:00:00.000Z",
    "status": "awaiting_payment"
  },
  "webhook": {
    "url": "https://api.loja.com/oasyfy/hooks",
    "secret": "whsec_..."
  }
}`}</Code>
        <p>
          <code>webhook.secret</code> aparece só na primeira vez daquela URL.
          Nas seguintes o 201 traz só <code>webhook.url</code>. Se a URL já
          estiver cadastrada na conta, a chave <code>webhook</code> é omitida.
        </p>
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
    toc: [
      { id: "req", label: "Request" },
      { id: "body", label: "Body" },
    ],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>saque</code>. Requer KYC completo (documentos,
          endereço e banco) e IP autorizado quando a conta usa allowlist. Sem{" "}
          <code>pix_key</code>, usa a chave PIX do KYC.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/withdrawals
x-api-key: sk_live_OAS_...
Content-Type: application/json

{
  "amount": 50000,
  "description": "Saque semanal"
}`}</Code>
        <H id="body">Body</H>
        <ParamTable
          title="Campos"
          params={[
            {
              name: "amount",
              type: "integer",
              required: true,
              description: "Centavos. Número inteiro positivo.",
            },
            {
              name: "description",
              type: "string",
              required: false,
              description: "Descrição do saque",
            },
            {
              name: "pix_key",
              type: "string",
              required: false,
              description:
                "Chave de destino. Se omitida, usa a chave PIX cadastrada no KYC.",
            },
            {
              name: "pix_key_type",
              type: "enum",
              required: false,
              description:
                "cpf | cnpj | email | phone — junto com pix_key, se não usar a chave do KYC",
            },
            {
              name: "auto_execute",
              type: "boolean",
              required: false,
              description:
                "Default true. Só executa se o saque automático da plataforma estiver ligado.",
            },
          ]}
        />
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
          <code>transaction_id</code> (inteiro, não UUID).
        </p>
        <Code>{`GET ${apiRoot()}/gateway/tracking?transaction_id=1042
x-api-key: sk_live_OAS_...`}</Code>
      </div>
    ),
  },
  reembolso: {
    title: "Reembolsar",
    summary: "POST /gateway/refunds",
    toc: [
      { id: "req", label: "Request" },
      { id: "body", label: "Body" },
    ],
    body: (
      <div className="space-y-8">
        <H id="req">Request</H>
        <p>
          Permissão <code>venda</code>.
        </p>
        <Code>{`POST ${apiRoot()}/gateway/refunds
x-api-key: sk_live_OAS_...
Content-Type: application/json

{ "transaction_id": 1042, "reason": "Desistência" }`}</Code>
        <H id="body">Body</H>
        <ParamTable
          title="Campos"
          params={[
            {
              name: "transaction_id",
              type: "integer",
              required: true,
              description: "ID numérico da transação",
            },
            {
              name: "reason",
              type: "string",
              required: false,
              description: "Motivo do reembolso",
            },
            {
              name: "fake",
              type: "boolean",
              required: false,
              description:
                "Default false. true marca reembolso interno sem chamar a adquirente.",
            },
          ]}
        />
      </div>
    ),
  },
};
