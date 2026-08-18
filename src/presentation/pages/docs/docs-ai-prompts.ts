const API = "https://app.oasyfy.com/api/v1";

function numbered(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function endpointPrompt(input: {
  title: string;
  description: string;
  method: "GET" | "POST";
  path: string;
  auth: boolean;
  permission?: string;
  query?: string;
  body?: string;
  responses: string;
  example: string;
}): string {
  const url = `${API}${input.path}`;
  const authLine = input.auth
    ? "Header `x-api-key: sk_live_OAS_...` (ou `Authorization: Bearer sk_live_OAS_...`)."
    : "Esta rota não exige autenticação.";
  const permissionLine = input.permission
    ? `\nPermissão da chave: \`${input.permission}\`.`
    : "";
  const queryBlock = input.query
    ? `\n## Query\n${input.query}\n`
    : "";
  const bodyBlock = input.body ? `\n## Body\n${input.body}\n` : "";
  const impl = numbered(
    [
      input.auth
        ? "Configure os headers de autenticação com sua API key (`x-api-key`)"
        : "Não envie API key nesta rota",
      input.body
        ? "Construa o body da requisição seguindo o schema acima"
        : "Monte a URL com os query params quando existirem",
      `Envie a requisição para a URL especificada usando o método ${input.method}`,
      "Trate os possíveis códigos de resposta (sucesso e erro)",
      "Implemente tratamento de erros adequado para garantir robustez",
    ],
  );

  return `# Integração com API - ${input.title}

## Descrição
${input.description}

## Endpoint
- **Método:** ${input.method}
- **URL:** ${url}

## Autenticação
${authLine}${permissionLine}
${queryBlock}${bodyBlock}
## Respostas
${input.responses}

## Exemplo de Resposta
${input.example}

## Instruções para Implementação
${impl}
`;
}

export const DOCS_AI_PROMPTS: Record<string, string> = {
  "": `# Integração com API - Introdução Oasyfy

## Descrição
A API Oasyfy é REST/HTTPS para criar cobranças PIX, consultar transações, solicitar saques e receber webhooks quando o status de uma venda muda. A documentação é pública; o uso da API continua privado (liberação administrativa + chave em /seller/api).

## Base URL
${API}

## Autenticação
Toda chamada ao gateway (exceto healthcheck) usa:
- Header \`x-api-key: sk_live_OAS_...\`
- ou \`Authorization: Bearer sk_live_OAS_...\`
- \`Content-Type: application/json\`

Permissões da chave: \`consulta\`, \`venda\`, \`saque\`, \`rastreio\`. Sem liberação o gateway responde \`api_access_denied\`.

## Valores
Valores monetários em **centavos** (15000 = R$ 150,00). \`transaction_id\` é inteiro positivo, não UUID.

## Instruções para Implementação
${numbered([
  "Guarde a API key só no servidor; nunca no frontend público",
  "Use HTTPS e o header x-api-key em todas as rotas /gateway/*",
  "Comece por GET /gateway/ping para validar a chave",
  "Crie cobranças com POST /gateway/pix e acompanhe o status via webhook sale.status_changed",
  "Trate 401/403/400 e o envelope { \"error\": \"...\" }",
])}
`,

  autenticacao: `# Integração com API - Autenticação

## Descrição
Como autenticar requisições no gateway Oasyfy. A chave é gerada no portal (API → Chaves) depois da liberação administrativa.

## Headers
- \`x-api-key: sk_live_OAS_...\` (preferencial)
- ou \`Authorization: Bearer sk_live_OAS_...\`
- \`Content-Type: application/json\`

## Permissões
Cada chave escolhe um subconjunto: \`consulta\`, \`venda\`, \`saque\`, \`rastreio\`. Se a conta tiver IPs autorizados, as chamadas do gateway precisam vir desses IPs.

## Erros
- 401 — chave inválida ou ausente
- 403 — permissão, IP ou \`api_access_denied\`

## Instruções para Implementação
${numbered([
  "Crie a chave no portal após a liberação da conta",
  "Envie x-api-key em todas as rotas /api/v1/gateway/*",
  "Mapeie 401 e 403 para o usuário da integração",
  "Não exponha a chave em apps client-side",
])}
`,

  erros: `# Integração com API - Tratamento de erros

## Descrição
Códigos HTTP do gateway Oasyfy. Endpoints do gateway devolvem JSON plano.

## Códigos
- 200 / 201 — sucesso
- 400 — parâmetros inválidos (a mensagem inclui o nome do campo)
- 401 — API key inválida ou ausente
- 403 — permissão, IP ou API não liberada
- 404 — recurso não encontrado
- 410 — recurso removido (refunds_via_webhook_only)
- 500 / 502 — erro interno ou falha na adquirente

## Exemplo
\`\`\`json
{
  "error": "api_access_denied",
  "message": "Acesso à API não está habilitado para esta conta."
}
\`\`\`

## Instruções para Implementação
${numbered([
  "Trate 400 lendo o campo error (ex.: customer_name: ...; amount: ...)",
  "Em 403 com api_access_denied, oriente o seller a pedir liberação",
  "Não faça retry agressivo em 401/403/400",
  "Em 502 ao gerar PIX, a transação pode já existir — consulte por transaction_id",
])}
`,

  enums: `# Integração com API - Enums

## Status da transação
\`pending | paid | completed | failed | refunded | cancelled | chargeback\`

## Método
\`pix | card | boleto | crypto | withdrawal\`

A liquidação operacional atual é PIX. Valores em centavos. transaction_id é inteiro.

## Instruções para Implementação
${numbered([
  "Use exatamente esses valores de status e method nas queries",
  "Não envie UUID no lugar de transaction_id",
  "Trate pending como aguardando pagamento PIX",
])}
`,

  faq: `# Integração com API - Dúvidas frequentes

## Polling
Não é obrigatório se você cadastrar um webhook de status da venda (sale.status_changed). Consulta e rastreio continuam disponíveis.

## Lock
POST /gateway/lock trava uma transação para impedir reembolso pelo admin até destrave. Endpoint avançado. A API pública não reembolsa.

## Instruções para Implementação
${numbered([
  "Prefira webhook a polling para confirmar pagamento",
  "Se fizer polling, use GET /gateway/tracking?transaction_id=",
])}
`,

  webhooks: `# Integração com API - Webhooks

## Descrição
A Oasyfy faz POST HTTPS na URL cadastrada no portal (API → Webhooks) quando o status de uma venda muda. Evento v1: \`sale.status_changed\`. Até 3 URLs HTTPS. O secret (\`whsec_...\`) aparece só na criação.

Também é possível passar \`webhook_url\` em POST /gateway/sales e POST /gateway/pix: notifica só aquela cobrança, além das URLs da conta. A mesma URL é idempotente (um destino e um secret). Secret só no 201 da primeira vez. Checkout público não aceita o campo.

## Headers enviados
- Content-Type: application/json
- User-Agent: Oasyfy-Webhooks/1.0
- X-Oasyfy-Event: sale.status_changed
- X-Oasyfy-Delivery-Id: UUID da tentativa
- X-Oasyfy-Signature: sha256=<hex> HMAC-SHA256 do corpo bruto

Responda HTTP 2xx em até 5 segundos. URLs como /api/v1/webhooks/woovi/pix são da adquirente para a Oasyfy — não cadastre no seu sistema.

## Instruções para Implementação
${numbered([
  "Cadastre a URL HTTPS no portal e guarde o secret, ou envie webhook_url na criação da venda/PIX",
  "Valide X-Oasyfy-Signature em tempo constante",
  "Responda 2xx rápido e processe o pedido de forma idempotente pelo campo id",
])}
`,

  "webhooks/status-da-venda": `# Integração com API - Webhook status da venda

## Descrição
Evento \`sale.status_changed\`. Dispara quando o status persistido de uma venda muda (PIX, sales e checkout público). Não dispara na criação em pending, nem em saque, depósito interno, split_credit ou ajuste admin.

## Transições típicas
- pending → paid (PIX pago)
- pending → failed (PIX expirado)
- paid → refunded (reembolso pelo admin ou adquirente — único aviso de estorno; a API não tem POST de reembolso)
- paid → chargeback

## Exemplo de payload
\`\`\`json
{
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
    "metadata": { "order_id": "1234" }
  }
}
\`\`\`

Se \`test\` for true, ignore na lógica de pedido real.

## Instruções para Implementação
${numbered([
  "Use data.transaction_id (inteiro) para localizar o pedido",
  "Trate data.status (paid, failed, refunded, chargeback)",
  "Ignore eventos com test: true",
  "Idempotência pelo campo id (evt_<transactionId>_<status>)",
])}
`,

  "webhooks/seguranca": `# Integração com API - Segurança de webhooks

## Assinatura
Header \`X-Oasyfy-Signature: sha256=<hex>\` — HMAC-SHA256 do corpo bruto com o secret \`whsec_...\`. Compare em tempo constante. Não re-serializar o JSON antes de validar.

## Node.js
\`\`\`js
const crypto = require("crypto");
const expected = "sha256=" + crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");
const ok = crypto.timingSafeEqual(
  Buffer.from(expected),
  Buffer.from(req.headers["x-oasyfy-signature"] || "")
);
\`\`\`

## PHP
\`\`\`php
$expected = 'sha256=' . hash_hmac('sha256', $rawBody, $secret);
$hashEquals = hash_equals($expected, $_SERVER['HTTP_X_OASYFY_SIGNATURE'] ?? '');
\`\`\`

## Retries
Timeout 5s. Sucesso = HTTP 2xx. Até 5 tentativas: 10s, 40s, 2 min, 10 min.

## Instruções para Implementação
${numbered([
  "Leia o body cru (raw) para validar HMAC",
  "Rejeite requisições sem assinatura válida",
  "Guarde ids já processados para idempotência",
])}
`,

  status: endpointPrompt({
    title: "Status da API",
    description:
      "Verificação rápida de status da API (health check). Não exige autenticação. Um retorno bem-sucedido indica que o serviço está ativo.",
    method: "GET",
    path: "/healthcheck",
    auth: false,
    responses: `### 200 OK
- status (number): 200
- message (string): "System is running"
- data.status (string): "ok"`,
    example: `### 200 OK
\`\`\`json
{
  "status": 200,
  "message": "System is running",
  "data": { "status": "ok" }
}
\`\`\``,
  }),

  "produtor/meus-dados": endpointPrompt({
    title: "Meus dados",
    description:
      "Retorna os dados do produtor autenticado pela API key: seller_id, account_id e nome.",
    method: "GET",
    path: "/gateway/me",
    auth: true,
    permission: "consulta",
    responses: `### 200 OK
- seller_id (number)
- account_id (string, ex.: OAS-A1B2C3D4E5)
- name (string)
### 401 / 403
- error (string)`,
    example: `### 200 OK
\`\`\`json
{
  "seller_id": 12,
  "account_id": "OAS-A1B2C3D4E5",
  "name": "Loja Exemplo"
}
\`\`\``,
  }),

  "produtor/meu-saldo": endpointPrompt({
    title: "Meu saldo",
    description:
      "Saldo do produtor em centavos: disponível, retido e total de vendas.",
    method: "GET",
    path: "/gateway/balance",
    auth: true,
    permission: "consulta",
    responses: `### 200 OK
- available (integer, centavos)
- retained (integer, centavos)
- totalSalesAmount (integer, centavos)`,
    example: `### 200 OK
\`\`\`json
{
  "available": 150000,
  "retained": 0,
  "totalSalesAmount": 200000
}
\`\`\``,
  }),

  "produtor/testar-credenciais": endpointPrompt({
    title: "Testar credenciais",
    description:
      "Valida se a API key está correta e a conta tem acesso. Qualquer permissão da chave é aceita. Use no onboarding da integração.",
    method: "GET",
    path: "/gateway/ping",
    auth: true,
    responses: `### 200 OK
- ok (boolean): true
- seller_id (number)
### 401 / 403
- error (string)`,
    example: `### 200 OK
\`\`\`json
{
  "ok": true,
  "seller_id": 12
}
\`\`\``,
  }),

  "consultas/buscar-transacao": endpointPrompt({
    title: "Buscar transação",
    description:
      "Lista transações da conta ou busca uma específica. Sem transaction_id, devolve a lista paginada.",
    method: "GET",
    path: "/gateway/transactions",
    auth: true,
    permission: "consulta",
    query: `- transaction_id (integer, opcional) — ID numérico
- status (enum, opcional) — pending | paid | completed | failed | refunded | cancelled | chargeback
- method (enum, opcional) — pix | card | boleto | crypto | withdrawal
- limit (integer, 1–500, default 50)
- offset (integer, default 0)`,
    responses: `### 200 OK (lista)
- transactions (array)
- total, limit, offset
### 200 OK (uma)
- transaction (objeto)
### 404
- error: "Transação não encontrada"`,
    example: `### 200 OK
\`\`\`json
{
  "transactions": [
    {
      "id": 1042,
      "amount": 15000,
      "status": "paid",
      "method": "pix",
      "customer_name": "João Silva"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
\`\`\``,
  }),

  "venda/criar": endpointPrompt({
    title: "Criar venda",
    description:
      "Cria uma transação pending. Não gera QR PIX — para cobrança com código copia-e-cola use POST /gateway/pix.",
    method: "POST",
    path: "/gateway/sales",
    auth: true,
    permission: "venda",
    body: `JSON:
- customer_name (string, obrigatório)
- customer_email (string, opcional)
- customer_document (string, opcional) — CPF 11 ou CNPJ 14 dígitos. Aliases: cpf, cnpj
- amount (integer, obrigatório) — centavos
- method (enum, obrigatório) — pix | card | boleto | crypto
- description (string, opcional)
- metadata (object, opcional)
- webhook_url (string, opcional) — HTTPS. Notifica só esta venda (além dos webhooks da conta). Mesma URL reutiliza o destino e o secret. Secret só no 201 da 1ª vez. 400 invalid_webhook_url se a URL for insegura.
- split (array, opcional)

\`\`\`json
{
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_document": "52998224725",
  "amount": 15000,
  "method": "pix",
  "description": "Pedido #1234",
  "metadata": { "order_id": "1234" },
  "webhook_url": "https://api.loja.com/oasyfy/orders/1234"
}
\`\`\``,
    responses: `### 201 Created
- message
- transaction (objeto com id inteiro, status pending)
- webhook (opcional) — { url, secret? }. secret só na 1ª vez da URL
### 400
- error — campos inválidos (customer_name e amount são obrigatórios) ou invalid_webhook_url
### 403
- KYC não aprovado ou api_access_denied`,
    example: `### 201 Created
\`\`\`json
{
  "message": "Transação criada com sucesso",
  "transaction": {
    "id": 1042,
    "amount": 15000,
    "method": "pix",
    "status": "pending",
    "customer_name": "João Silva"
  }
}
\`\`\``,
  }),

  "venda/pix": endpointPrompt({
    title: "Gerar PIX",
    description:
      "Cria a transação, gera a cobrança PIX na adquirente e devolve o código copia-e-cola com expiração. Content-Type application/json é obrigatório. Campos obrigatórios: customer_name (string) e amount (número em centavos). Envie também customer_document (CPF ou CNPJ) para identificar o pagador.",
    method: "POST",
    path: "/gateway/pix",
    auth: true,
    permission: "venda",
    body: `JSON:
- customer_name (string, obrigatório)
- customer_email (string, opcional)
- customer_document (string, opcional mas recomendado) — CPF ou CNPJ. Aliases: cpf, cnpj
- amount (integer, obrigatório) — centavos. Aceita também string numérica ("5990")
- description (string, opcional)
- metadata (object, opcional)
- webhook_url (string, opcional) — HTTPS. Callback só desta cobrança. Idempotente se a URL for a mesma. Secret só no 201 da 1ª vez. URL inválida → 400 invalid_webhook_url, sem gerar PIX.
- split (array, opcional)

\`\`\`json
{
  "customer_name": "Maria Santos",
  "customer_email": "maria@email.com",
  "customer_document": "52998224725",
  "amount": 5990,
  "description": "Assinatura mensal",
  "metadata": { "order_id": "A-100" },
  "webhook_url": "https://api.loja.com/oasyfy/hooks"
}
\`\`\``,
    responses: `### 201 Created
- message
- transaction
- pix.transaction_id, pix.amount, pix.pix_code, pix.expiration, pix.status (awaiting_payment)
- webhook (opcional) — { url, secret? }. secret só na 1ª vez daquela URL; omitido se a URL já for a da conta
### 400
- error — se faltar customer_name ou amount, ou invalid_webhook_url
### 403
- KYC / api_access_denied
### 502
- Falha na adquirente; pode incluir transaction_id`,
    example: `### 201 Created
\`\`\`json
{
  "message": "PIX gerado com sucesso",
  "transaction": {
    "id": 1042,
    "amount": 5990,
    "method": "pix",
    "status": "pending",
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
}
\`\`\``,
  }),

  split: `# Integração com API - Split de pagamento

## Descrição
Campo opcional \`split[]\` em POST /gateway/sales e POST /gateway/pix. Percentual até 6 casas; soma ≤ 100%. Sem split na request, o gateway aplica sócios ativos do portal.

## Body (trecho)
\`\`\`json
"split": [
  { "account_id": "OAS-A1B2C3D4E5", "percentage": 17.888888 }
]
\`\`\`

Cada item: account_id (obrigatório) e percentage ou fixed_amount (centavos). Opcional: description, charge_processing_fee.

## Instruções para Implementação
${numbered([
  "Inclua split no mesmo POST de venda ou PIX",
  "Não ultrapasse 100% na soma dos percentuais",
  "Use account_id no formato OAS-...",
])}
`,

  saque: endpointPrompt({
    title: "Solicitar saque",
    description:
      "Solicita saque do saldo disponível. Requer KYC completo (documentos, endereço e banco). Sem pix_key, usa a chave PIX do KYC.",
    method: "POST",
    path: "/gateway/withdrawals",
    auth: true,
    permission: "saque",
    body: `JSON:
- amount (integer, obrigatório) — centavos
- description (string, opcional)
- pix_key (string, opcional)
- pix_key_type (enum, opcional) — cpf | cnpj | email | phone
- auto_execute (boolean, opcional, default true)

\`\`\`json
{
  "amount": 50000,
  "description": "Saque semanal"
}
\`\`\``,
    responses: `### 201 / 200
- transação de saque criada (e executada se auto_execute e a plataforma permitir)
### 400
- chave PIX ausente no KYC
### 403
- KYC incompleto, saques bloqueados ou IP fora da allowlist`,
    example: `### 201 Created
\`\`\`json
{
  "message": "Saque solicitado com sucesso",
  "transaction": {
    "id": 2001,
    "amount": 50000,
    "method": "withdrawal",
    "status": "pending"
  }
}
\`\`\``,
  }),

  rastreio: endpointPrompt({
    title: "Rastrear transação",
    description:
      "Consulta o andamento de uma transação pelo ID numérico.",
    method: "GET",
    path: "/gateway/tracking",
    auth: true,
    permission: "rastreio",
    query: `- transaction_id (integer, obrigatório) — não é UUID`,
    responses: `### 200 OK
- dados da transação (status, pix_code, amounts, etc.)
### 400
- transaction_id ausente
### 404
- transação não encontrada`,
    example: `GET ${API}/gateway/tracking?transaction_id=1042

### 200 OK
\`\`\`json
{
  "tracking": {
    "transaction_id": 1042,
    "status": "paid",
    "method": "pix",
    "amount": 5990,
    "customer_name": "Maria Santos"
  }
}
\`\`\``,
  }),

  reembolso: `# Integração com API - Reembolsos (webhook)

## Descrição
A API pública **não reembolsa**. Não chame nenhum endpoint de estorno. O admin da Oasyfy ou a adquirente reembolsam; o seu servidor recebe \`sale.status_changed\` com \`data.status = refunded\`.

## Como tratar
- Cadastre a URL no portal (API → Webhooks) ou envie \`webhook_url\` na criação da venda/PIX
- \`if (payload.data.status === "refunded")\` atualize o pedido
- Idempotência pelo campo \`id\` (\`evt_<transactionId>_refunded\`)
- GET /gateway/transactions e GET /gateway/tracking ainda mostram \`status: refunded\`

## Chamada antiga
POST /gateway/refunds com API key válida responde 410:

\`\`\`json
{
  "error": "refunds_via_webhook_only",
  "message": "Reembolso não é mais feito pela API. Escute sale.status_changed com data.status=refunded."
}
\`\`\`

Sem chave: 401.

## Instruções para Implementação
${numbered([
  "Não implemente POST de reembolso contra a API Oasyfy",
  "Escute sale.status_changed e trate data.status === refunded",
  "Use o campo id para não processar o mesmo estorno duas vezes",
])}
`,
};

export function getFullDocsAiPrompt(): string {
  const sections = Object.values(DOCS_AI_PROMPTS);
  return [
    "# Integração completa com a API Oasyfy",
    "",
    "Você é um assistente implementando a integração com a API de pagamentos Oasyfy (PIX, consultas, saques e webhooks).",
    "Use este documento como fonte da verdade. Não invente rotas, campos ou formatos.",
    "",
    `Base URL: ${API}`,
    "Autenticação: header `x-api-key: sk_live_OAS_...` (ou `Authorization: Bearer sk_live_OAS_...`).",
    "Content-Type: application/json. Valores em centavos. transaction_id é inteiro positivo, não UUID.",
    "A liquidação operacional atual é PIX. Para status de venda, use o webhook `sale.status_changed`. A API não reembolsa: trate `data.status === refunded`.",
    "",
    "---",
    "",
    sections.join("\n\n---\n\n"),
  ].join("\n");
}

export function getDocsAiPrompt(slug: string): string | undefined {
  if (slug === "integrar-com-ia") {
    return getFullDocsAiPrompt();
  }
  return DOCS_AI_PROMPTS[slug];
}
