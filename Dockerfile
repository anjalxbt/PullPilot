# ============================================================
# Stage 1: deps — install production dependencies only
# ============================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc compat for native modules on Alpine
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ============================================================
# Stage 2: builder — full install + Next.js build
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build args for public env vars (baked in at build time)
# Provide real values via --build-arg or docker-compose args.
# Placeholders below allow the build to complete without live credentials.
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: runner — minimal production image
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy the standalone output produced by `output: 'standalone'`
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
# Copy public/ only if it exists (some projects don't have one)
RUN --mount=type=bind,from=builder,source=/app,target=/build \
    if [ -d /build/public ]; then \
        cp -r /build/public /app/public && chown -R nextjs:nodejs /app/public; \
    fi

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# The standalone bundle includes its own server.js
CMD ["node", "server.js"]
