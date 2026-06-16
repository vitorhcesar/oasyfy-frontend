# syntax=docker/dockerfile:1

FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

COPY . .

ARG APP_VERSION=dev
RUN --mount=type=secret,id=prod_env,target=.env.production \
    sh -c '\
      echo "Build version: ${APP_VERSION}" && \
      grep -q "^VITE_API_URL=." .env.production || { echo "VITE_API_URL missing in build env"; exit 1; } && \
      grep -q "^VITE_SUPABASE_URL=." .env.production || { echo "VITE_SUPABASE_URL missing in build env"; exit 1; } && \
      bun run build \
    '

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
