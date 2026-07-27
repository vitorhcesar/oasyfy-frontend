# OmegaPay Frontend

SPA React da plataforma OmegaPay — painéis admin e seller, KYC, transações e documentação de API.

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
| `bun run test:e2e` | Playwright (smoke das páginas públicas) |
| `bun run lint-check` | ESLint |

## Deploy

Deploy de produção via tag GitHub → GHCR → VPS (nginx). O workflow executa **testes unitários e E2E** antes do build.

`VITE_API_URL` deve estar definido no build.

E2E autenticado (opcional): defina `PLAYWRIGHT_ADMIN_EMAIL` e `PLAYWRIGHT_ADMIN_PASSWORD` nos secrets do CI para rodar login admin no pipeline.

## Arquitetura

Camadas em `src/`: `presentation`, `domain`, `infra`, `app`, `shared`.
