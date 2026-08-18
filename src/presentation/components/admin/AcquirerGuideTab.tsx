import { getApiBaseUrl } from "@/infra/http/services/api/api-env";
import { WOOVI_WEBHOOK_EVENTS } from "@/presentation/constants/woovi-webhook-events";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { cn } from "@/presentation/utils/cn";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

function CopyBlock({ label, value }: { label?: string; value: string }) {
  return (
    <div className="space-y-1">
      {label ? (
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      ) : null}
      <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
        <code className="text-base font-mono text-foreground break-all flex-1">
          {value}
        </code>
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copiado!");
          }}
        >
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}

function GuideStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-base font-bold">
        {number}
      </div>
      <div className="space-y-2 min-w-0 flex-1 pb-6 border-b border-border/30 last:border-0 last:pb-0">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function ExternalDocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
    >
      {label}
      <ExternalLink size={13} />
    </a>
  );
}

export function AcquirerGuideTab() {
  const apiBase = getApiBaseUrl();
  const wooviWebhookUrl = `${apiBase}/api/v1/webhooks/woovi/pix`;
  const cartwaveWebhookUrl = `${apiBase}/api/v1/webhooks/cartwave/pix`;
  const onlyupWebhookUrl = `${apiBase}/api/v1/webhooks/onlyup/pix`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <BookOpen size={22} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">
            Guia completo de integração
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Siga na ordem: carregue as adquirentes na aba{" "}
            <strong>Conexões</strong>, configure credenciais e webhooks no
            provedor, depois defina o roteamento PIX na aba{" "}
            <strong>Depósito</strong>. URLs abaixo usam sua API atual (
            <code className="text-foreground">{apiBase}</code>).
          </p>
        </div>
      </div>

      {/* Checklist geral */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist geral (Oasyfy)</CardTitle>
          <CardDescription className="text-sm">
            Antes de ir para produção, confira todos os itens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {[
            "Aba Conexões → Carregar adquirentes padrão (Woovi + Cartwave + OnlyUp)",
            "Configurar credenciais de cada provedor → status Conectada",
            "Ativar o switch da adquirente que será usada",
            "Aba Depósito → adicionar adquirente(s) em PIX com prioridade (failover)",
            "Seller com KYC aprovado e chave PIX no cadastro bancário (saques)",
            "Testar PIX entrada (depósito/cobrança) e webhook de pagamento",
            "Testar saque via gateway ou aprovação admin via API (Woovi PIX Out)",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="text-primary shrink-0 mt-0.5"
              />
              <span>{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* WOOVI */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Woovi / OpenPix</CardTitle>
            <Badge variant="outline" className="text-sm">
              PIX entrada + PIX saída
            </Badge>
          </div>
          <CardDescription className="text-sm">
            Receber cobranças PIX e enviar saques (PIX Out). Documentação:{" "}
            <ExternalDocLink
              href="https://developers.woovi.com/docs/apis/api-getting-started"
              label="developers.woovi.com"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte A — No painel Woovi
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Criar conta e escolher ambiente">
                <p>
                  Use <strong>Sandbox</strong> para desenvolvimento (
                  <code>https://api.woovi-sandbox.com</code>) e{" "}
                  <strong>Produção</strong> quando for ao ar (
                  <code>https://api.woovi.com</code>).
                </p>
                <p>
                  Acesse o painel Woovi / OpenPix da sua conta (sandbox ou
                  produção).
                </p>
              </GuideStep>

              <GuideStep number={2} title="Criar aplicativo (App ID)">
                <p>
                  No menu de API / Plugins / Aplicações, crie um app e copie o{" "}
                  <strong>App ID</strong>. Esse valor é o Bearer token em todas
                  as chamadas:
                </p>
                <CopyBlock value="Authorization: Bearer SEU_APP_ID" />
                <p>
                  Para <strong>saques (PIX Out)</strong>, o app precisa do
                  escopo <code>PAYMENT_POST</code> habilitado. Sem isso, saques
                  retornam erro na API.
                </p>
              </GuideStep>

              <GuideStep number={3} title="Saldo para testar saques (sandbox)">
                <p>
                  No sandbox, garanta saldo na conta Woovi antes de testar{" "}
                  <code>POST /api/v1/payment</code>. Receber PIX (cobrança) não
                  exige saldo prévio; pagar/sacar exige.
                </p>
              </GuideStep>

              <GuideStep number={4} title="Cadastrar webhooks (um por evento)">
                <p>
                  Woovi exige <strong>um webhook por tipo de evento</strong>,
                  todos apontando para a mesma URL do Oasyfy:
                </p>
                <CopyBlock label="URL do webhook" value={wooviWebhookUrl} />
                <p>
                  Em cada webhook, defina um valor em{" "}
                  <strong>Authorization</strong> (secret). Exemplo:{" "}
                  <code>meu-secret-webhook-woovi</code>. Você repetirá esse
                  mesmo valor no Oasyfy no campo &quot;Secret do webhook&quot;.
                </p>
                <p className="font-medium text-foreground">
                  Eventos obrigatórios:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  {WOOVI_WEBHOOK_EVENTS.map((ev) => (
                    <li key={ev.event}>
                      <code className="text-foreground">{ev.event}</code> —{" "}
                      {ev.description}
                    </li>
                  ))}
                </ul>
                <p>
                  Exemplo de criação via API Woovi (repita para cada evento,
                  alterando <code>event</code>):
                </p>
                <CopyBlock
                  value={`curl -X POST "https://api.woovi-sandbox.com/api/v1/webhook" \\
  -H "Authorization: Bearer SEU_APP_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "webhook": {
      "name": "oasyfy-charge-completed",
      "event": "OPENPIX:CHARGE_COMPLETED",
      "url": "${wooviWebhookUrl}",
      "authorization": "meu-secret-webhook-woovi",
      "isActive": true
    }
  }'`}
                />
              </GuideStep>

              <GuideStep number={5} title="Chave PIX do beneficiário (saques)">
                <p>
                  Saques enviam PIX para a chave cadastrada no{" "}
                  <strong>KYC do seller</strong> no Oasyfy (aba bancária do
                  onboarding). Não é configurado na Woovi — a Woovi só executa o
                  pagamento para o alias informado na API.
                </p>
              </GuideStep>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte B — No Oasyfy (aba Conexões)
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Carregar e abrir Woovi">
                <p>
                  Aba <strong>Conexões</strong> → se vazio, clique em{" "}
                  <strong>Carregar adquirentes padrão</strong> → botão{" "}
                  <strong>Configurar</strong> na linha Woovi.
                </p>
              </GuideStep>

              <GuideStep number={2} title="Preencher credenciais Woovi">
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>URL da API</strong> — sandbox ou produção (ver
                    passo A.1)
                  </li>
                  <li>
                    <strong>App ID (Access Token)</strong> — App ID copiado da
                    Woovi
                  </li>
                  <li>
                    <strong>Secret do webhook</strong> — mesmo valor do campo
                    Authorization configurado nos webhooks Woovi
                  </li>
                  <li>
                    <strong>Client ID</strong> — opcional; fallback de validação
                    do webhook
                  </li>
                </ul>
                <p>
                  Salve. Status deve ficar <strong>Conectada</strong>. Ative o
                  switch na lista.
                </p>
              </GuideStep>

              <GuideStep number={3} title="Roteamento PIX (aba Depósito)">
                <p>
                  Aba <strong>Roteamento inteligente (Depósito)</strong> →
                  método <strong>PIX</strong> → adicionar <strong>Woovi</strong>{" "}
                  com prioridade 1. Se Cartwave também estiver ativa, ordem
                  define failover (1ª falha → tenta 2ª).
                </p>
              </GuideStep>

              <GuideStep number={4} title="Saques PIX Out">
                <p>
                  Saques usam o mesmo roteamento <strong>PIX</strong> (não a aba
                  Saque). Fluxos:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Gateway: <code>POST /api/v1/gateway/withdrawals</code> (API
                    key com permissão saque)
                  </li>
                  <li>
                    Portal seller: solicita saque → admin aprova com{" "}
                    <strong>Aprovar via API</strong>
                  </li>
                </ul>
                <p>
                  Correlation ID do saque = ID da transação de saque no Oasyfy.
                  Webhook <code>OPENPIX:MOVEMENT_CONFIRMED</code> conclui o
                  saque.
                </p>
              </GuideStep>

              <GuideStep number={5} title="Testar Woovi">
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Gerar PIX: portal seller (Depósito) ou{" "}
                    <code>POST /api/v1/gateway/pix</code>
                  </li>
                  <li>Pagar cobrança no sandbox Woovi</li>
                  <li>
                    Confirmar webhook 200 e transação <strong>paid</strong>
                  </li>
                  <li>
                    Saque: seller com saldo + KYC → gateway withdrawal ou
                    aprovação admin
                  </li>
                </ul>
              </GuideStep>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARTWAVE */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Cartwave Hub</CardTitle>
            <Badge variant="outline" className="text-sm">
              PIX entrada (cobrança)
            </Badge>
          </div>
          <CardDescription className="text-sm">
            API base padrão:{" "}
            <code className="text-foreground">https://api.cartwavehub.com.br</code>
            . Integração focada em QR Code PIX cópia e cola.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte A — No painel Cartwave
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Obter credenciais de API">
                <p>No painel Cartwave Hub, localize ou solicite:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Client ID (ci)</strong> — identificador do cliente
                    nas requisições
                  </li>
                  <li>
                    <strong>Access Token</strong> — Bearer token da API
                  </li>
                  <li>
                    <strong>Chave HMAC</strong> — secret para assinar o body das
                    requisições POST e validar webhooks
                  </li>
                  <li>
                    <strong>Agência (branch)</strong> e{" "}
                    <strong>Número da conta</strong> — conta origem PIX na
                    Cartwave
                  </li>
                </ul>
              </GuideStep>

              <GuideStep number={2} title="Configurar webhook de PIX">
                <p>
                  Cadastre a URL de notificação de pagamento PIX apontando para
                  o Oasyfy:
                </p>
                <CopyBlock label="URL do webhook" value={cartwaveWebhookUrl} />
                <p>
                  A Cartwave envia POST com JSON (<code>type</code> +{" "}
                  <code>data</code>) e headers:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <code>ci</code> — Client ID
                  </li>
                  <li>
                    <code>hmac</code> — HMAC-SHA512 do corpo bruto usando a
                    chave HMAC
                  </li>
                </ul>
                <p>
                  Evento principal de pagamento:{" "}
                  <code>QR_CODE_COPY_AND_PASTE_PAID</code>. O Oasyfy valida
                  assinatura antes de atualizar a transação.
                </p>
              </GuideStep>

              <GuideStep number={3} title="Ambiente e IP (se aplicável)">
                <p>
                  Confirme com a Cartwave se há whitelist de IP ou URLs
                  específicas para sandbox vs produção. Use a URL de API
                  fornecida por eles se diferir do padrão.
                </p>
              </GuideStep>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte B — No Oasyfy (aba Conexões)
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Abrir Cartwave e preencher todos os campos">
                <p>
                  Aba <strong>Conexões</strong> → <strong>Configurar</strong>{" "}
                  na linha Cartwave. Todos os campos são obrigatórios para
                  status Conectada:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>URL da API (padrão Cartwave Hub)</li>
                  <li>Client ID</li>
                  <li>Access Token (chave secreta)</li>
                  <li>Chave HMAC</li>
                  <li>Agência (branch)</li>
                  <li>Número da conta</li>
                </ul>
                <p>Salve, ative o switch.</p>
              </GuideStep>

              <GuideStep number={2} title="Roteamento PIX">
                <p>
                  Aba <strong>Depósito</strong> → PIX → adicionar Cartwave na
                  ordem desejada. Com Woovi + Cartwave, a 2ª só é usada se a 1ª
                  falhar (failover).
                </p>
              </GuideStep>

              <GuideStep number={3} title="Como a API assina requisições">
                <p>
                  POSTs para Cartwave (<code>/v2/finance/create-pix-copy-and-paste</code>
                  ) enviam:
                </p>
                <CopyBlock value={`Authorization: Bearer {accessToken}
ci: {clientId}
hmac: HMAC-SHA512(hmacKey, bodyJSON)
Content-Type: application/json`} />
              </GuideStep>

              <GuideStep number={4} title="Testar Cartwave">
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Proxy direto: <code>POST /api/v1/pix/cartwave/create</code>{" "}
                    (seller/admin logado)
                  </li>
                  <li>
                    Ou roteamento: depósito seller / gateway PIX (se Cartwave for
                    prioridade 1 no roteamento)
                  </li>
                  <li>Pagar QR e verificar webhook + status paid</li>
                </ul>
              </GuideStep>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2">
            <AlertTriangle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Saques:</strong> Cartwave nesta
              integração é usada para <strong>receber PIX</strong>. Saques
              automáticos via API usam <strong>Woovi PIX Out</strong>. A aba
              &quot;Roteamento Saque&quot; é para métodos futuros (TED/crypto);
              PIX Out Woovi segue roteamento de depósito PIX.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ONLYUP */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">OnlyUp</CardTitle>
            <Badge variant="outline" className="text-sm">
              PIX entrada (cash-in)
            </Badge>
          </div>
          <CardDescription className="text-sm">
            Host cash-in:{" "}
            <code className="text-foreground">https://api.pix.onlyup.com.br</code>
            . OAuth curto + mTLS (PFX). Sem HMAC no webhook — confirme com{" "}
            <code>GET /cob</code>. Documentação:{" "}
            <ExternalDocLink
              href="https://onlyu.readme.io"
              label="onlyu.readme.io"
            />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte A — No Finance OnlyUp
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Gerar credenciais da API QRCODES">
                <p>
                  Na aba <strong>Finance → API QRCODES</strong>, gere Client ID
                  e Client Secret. Não use as credenciais da API CONTAS no
                  cash-in.
                </p>
              </GuideStep>
              <GuideStep number={2} title="Certificado mTLS (PFX)">
                <p>
                  Baixe o <strong>.pfx</strong> e a senha. A Oasyfy usa esse
                  par em todas as chamadas cash-in (token, cobrança, webhook,
                  estorno).
                </p>
              </GuideStep>
              <GuideStep number={3} title="Chave Pix recebedora">
                <p>
                  Informe a chave DICT cadastrada na conta OnlyUp. Ela vai no
                  body de <code>PUT /cob</code> e no path{" "}
                  <code>PUT /webhook/{"{chave}"}</code>.
                </p>
              </GuideStep>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
              Parte B — No Oasyfy (aba Conexões)
            </h3>
            <div className="space-y-0">
              <GuideStep number={1} title="Preencher cash-in e salvar">
                <p>
                  Aba <strong>Conexões</strong> → Configurar OnlyUp: URL da API,
                  Client ID, Client Secret, PFX, senha do PFX e Chave Pix.
                </p>
              </GuideStep>
              <GuideStep number={2} title="Configurar webhook pela Oasyfy">
                <p>
                  Use o botão <strong>Configurar webhook</strong>. A Oasyfy
                  registra:
                </p>
                <CopyBlock label="URL do webhook" value={onlyupWebhookUrl} />
                <p>
                  Cash-in <strong>não tem HMAC</strong>. Quem tiver a URL pode
                  POSTAR; o pagamento só vira pago após{" "}
                  <code>GET /cob</code> = <code>CONCLUIDA</code>.
                </p>
              </GuideStep>
              <GuideStep number={3} title="Roteamento e teste">
                <p>
                  Aba Depósito → PIX → incluir OnlyUp na ordem de failover.
                  Homologação é produção com valor baixo (não há sandbox
                  público).
                </p>
              </GuideStep>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Failover + mapeamento */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Roteamento, failover e mapeamento de campos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="py-2 pr-3 font-medium text-foreground">
                    Oasyfy (Conexões)
                  </th>
                  <th className="py-2 pr-3 font-medium text-foreground">
                    Woovi
                  </th>
                  <th className="py-2 font-medium text-foreground">
                    Cartwave
                  </th>
                  <th className="py-2 font-medium text-foreground">
                    OnlyUp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  [
                    "URL da API",
                    "api.woovi.com / sandbox",
                    "api.cartwavehub.com.br",
                    "api.pix.onlyup.com.br",
                  ],
                  ["Access Token / Secret", "App ID", "Bearer token", "OAuth 5 min + Client Secret"],
                  ["HMAC / Auth webhook", "Secret webhook", "Chave HMAC", "Sem HMAC; GET /cob"],
                  ["Client ID", "Opcional (webhook)", "Obrigatório (header ci)", "OAuth cash-in"],
                  ["Extra", "Não usa", "Agência / Conta", "PFX + senha + Chave Pix"],
                  ["Webhook URL", wooviWebhookUrl, cartwaveWebhookUrl, onlyupWebhookUrl],
                  ["Saques PIX", "Sim (PAYMENT_POST)", "Não", "v1.1 (API Conta)"],
                ].map(([label, woovi, cartwave, onlyup]) => (
                  <tr key={label}>
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {label}
                    </td>
                    <td className="py-2 pr-3">{woovi}</td>
                    <td className="py-2 pr-3">{cartwave}</td>
                    <td className="py-2">{onlyup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>
            <strong className="text-foreground">Failover:</strong> na aba Depósito
            → PIX, arraste prioridades (1 = primeira tentativa). Se Woovi está
            em 1 e falhar, Cartwave em 2 é tentada automaticamente.
          </p>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Problemas comuns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {[
            {
              q: "Lista de conexões vazia, sem botão Configurar",
              a: 'Aba Conexões → "Carregar adquirentes padrão" ou rode bun run db:seed no backend.',
            },
            {
              q: "Webhook Woovi retorna 401",
              a: "Secret do webhook no Oasyfy (hmac_key) deve ser idêntico ao Authorization configurado na Woovi.",
            },
            {
              q: "Webhook retorna 404 transação não encontrada",
              a: "Correlation ID da cobrança/saque deve ser o ID da transação Oasyfy. Gere PIX/saque pelo sistema, não só pela Woovi isolada.",
            },
            {
              q: "Saque retorna 502",
              a: "App Woovi sem PAYMENT_POST, saldo insuficiente no sandbox, ou chave PIX inválida no KYC.",
            },
            {
              q: "Cartwave não conecta",
              a: "Todos os 5 campos obrigatórios + URL API. Verifique agência/conta com suporte Cartwave.",
            },
            {
              q: "Webhook OnlyUp não marca pago",
              a: "Cash-in não usa HMAC. Confirme PFX/mTLS, chave Pix e que GET /cob retorna CONCLUIDA. A URL do webhook é segredo de operação.",
            },
            {
              q: "PIX não usa Woovi mesmo configurada",
              a: "Verifique switch ativo, status Conectada, e Woovi na aba Depósito → PIX com prioridade 1.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className={cn(
                "rounded-lg border border-border/40 p-3 space-y-1",
              )}
            >
              <p className="font-medium text-foreground text-sm">{item.q}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-sm gap-2"
          onClick={() => {
            window.open("https://developers.woovi.com", "_blank");
          }}
        >
          Documentação Woovi
          <ExternalLink size={14} />
        </Button>
      </div>
    </div>
  );
}
