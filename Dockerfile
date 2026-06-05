# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install

# ---- Builder ----
FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Prisma CLI aislado (instalado con npm para tener un node_modules plano y funcional).
# Permite ejecutar `prisma db push` al arrancar el contenedor.
RUN mkdir -p /app/prisma-cli \
    && cd /app/prisma-cli \
    && echo '{"dependencies":{"prisma":"6.19.3"}}' > package.json \
    && npm install --omit=dev --loglevel=error \
    && chown -R nextjs:nodejs /app/prisma-cli

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# pdfkit está marcado como external en next.config.mjs (no se bundlea) y con pnpm
# el tracer del standalone no copia el paquete completo. Lo instalamos con npm
# (layout plano) y lo mezclamos dentro de node_modules del standalone, incluyendo
# todas sus deps transitivas (fontkit, crypto-js, linebreak, png-js, etc.).
USER root
RUN mkdir -p /tmp/pdfkit-install \
    && cd /tmp/pdfkit-install \
    && echo '{"dependencies":{"pdfkit":"^0.18.0"}}' > package.json \
    && npm install --omit=dev --loglevel=error \
    && mkdir -p /app/node_modules \
    && cp -rn /tmp/pdfkit-install/node_modules/. /app/node_modules/ \
    && chown -R nextjs:nodejs /app/node_modules \
    && rm -rf /tmp/pdfkit-install

RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

COPY --chown=nextjs:nodejs scripts ./scripts
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

# Railway enruta por IPv6; escuchar en :: (dual-stack) cubre IPv4 e IPv6 y
# evita el 502 "failed to respond".
ENV PORT=3000
ENV HOSTNAME="::"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
