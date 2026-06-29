# Oasyfy Frontend

SPA React da plataforma Oasyfy — painéis admin e seller, KYC, transações e documentação de API.

## Stack

- React 18 + Vite
- TanStack Query + Zustand
- Better Auth client
- Tailwind CSS + shadcn/ui

## Desenvolvimento

```bash
cp env.example .env.local
bun install
bun run dev
```

App em `http://localhost:3000`. Requisições `/api` são proxyadas para o backend local (`8080`).

## Scripts

| Script | Descrição |
|--------|-----------|
| `bun run dev` | Servidor de desenvolvimento |
| `bun run build` | Build de produção |
| `bun run type-check` | TypeScript |
| `bun run test` | Vitest |
| `bun run lint-check` | ESLint |

## Deploy

Deploy de produção via tag GitHub → GHCR → VPS (nginx). `VITE_API_URL` deve estar definido no build.

## Arquitetura

Camadas em `src/`: `presentation`, `domain`, `infra`, `app`, `shared`.
