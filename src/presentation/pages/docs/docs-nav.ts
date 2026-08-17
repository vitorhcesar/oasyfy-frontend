export type TDocsMethod = "GET" | "POST";

export interface IDocsNavItem {
  slug: string;
  title: string;
  method?: TDocsMethod;
  keywords: string;
}

export interface IDocsNavGroup {
  id: string;
  title: string;
  items: IDocsNavItem[];
}

export const DOCS_NAV: IDocsNavGroup[] = [
  {
    id: "start",
    title: "Comece aqui",
    items: [
      {
        slug: "",
        title: "Introdução",
        keywords: "introdução comece api rest https",
      },
    ],
  },
  {
    id: "info",
    title: "Informações da API",
    items: [
      {
        slug: "autenticacao",
        title: "Autenticação",
        keywords: "api key x-api-key bearer permissão",
      },
      {
        slug: "erros",
        title: "Tratamento de erros",
        keywords: "http 401 403 400 api_access_denied",
      },
      {
        slug: "enums",
        title: "Enums (Tipos de dados)",
        keywords: "status pending paid refunded method pix",
      },
    ],
  },
  {
    id: "faq",
    title: "Dúvidas Frequentes",
    items: [
      {
        slug: "faq",
        title: "Dúvidas Frequentes",
        keywords: "liberação chave polling lock uuid",
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    items: [
      {
        slug: "webhooks",
        title: "Visão geral",
        keywords: "webhook outbound https portal hmac x-oasyfy-signature",
      },
      {
        slug: "webhooks/status-da-venda",
        title: "Status da venda",
        keywords: "sale.status_changed paid refunded failed",
      },
      {
        slug: "webhooks/seguranca",
        title: "Segurança",
        keywords: "hmac sha256 assinatura retry idempotência",
      },
    ],
  },
  {
    id: "status",
    title: "Status",
    items: [
      {
        slug: "status",
        title: "Healthcheck",
        method: "GET",
        keywords: "healthcheck health status ok",
      },
    ],
  },
  {
    id: "producer",
    title: "Produtor",
    items: [
      {
        slug: "produtor/meus-dados",
        title: "Meus dados",
        method: "GET",
        keywords: "gateway me account_id",
      },
      {
        slug: "produtor/meu-saldo",
        title: "Meu saldo",
        method: "GET",
        keywords: "gateway balance disponível centavos",
      },
      {
        slug: "produtor/testar-credenciais",
        title: "Testar credenciais",
        method: "GET",
        keywords: "gateway ping ok seller_id",
      },
    ],
  },
  {
    id: "queries",
    title: "Consultas",
    items: [
      {
        slug: "consultas/buscar-transacao",
        title: "Buscar transação",
        method: "GET",
        keywords: "gateway transactions consulta",
      },
    ],
  },
  {
    id: "sale",
    title: "Venda",
    items: [
      {
        slug: "venda/criar",
        title: "Criar venda",
        method: "POST",
        keywords: "gateway sales venda customer_document cpf cnpj amount",
      },
      {
        slug: "venda/pix",
        title: "Gerar PIX",
        method: "POST",
        keywords: "gateway pix qr code customer_document cpf cnpj amount centavos",
      },
    ],
  },
  {
    id: "split",
    title: "Split",
    items: [
      {
        slug: "split",
        title: "Split de pagamento",
        keywords: "split percentage account_id sócios",
      },
    ],
  },
  {
    id: "withdraw",
    title: "Saque",
    items: [
      {
        slug: "saque",
        title: "Solicitar saque",
        method: "POST",
        keywords: "gateway withdrawals saque",
      },
    ],
  },
  {
    id: "tracking",
    title: "Rastreio",
    items: [
      {
        slug: "rastreio",
        title: "Rastrear transação",
        method: "GET",
        keywords: "gateway tracking rastreio",
      },
    ],
  },
  {
    id: "refund",
    title: "Reembolso",
    items: [
      {
        slug: "reembolso",
        title: "Reembolsar",
        method: "POST",
        keywords: "gateway refunds reembolso",
      },
    ],
  },
];

export function findDocsItem(slug: string): IDocsNavItem | undefined {
  const normalized = slug === "introducao" ? "" : slug;
  for (const group of DOCS_NAV) {
    const item = group.items.find((entry) => entry.slug === normalized);
    if (item) return item;
  }
  return undefined;
}

export function findDocsGroup(slug: string): IDocsNavGroup | undefined {
  const normalized = slug === "introducao" ? "" : slug;
  return DOCS_NAV.find((group) =>
    group.items.some((entry) => entry.slug === normalized),
  );
}

export function docsHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}
