FROM node:20-slim AS base
WORKDIR /app

FROM base AS builder
COPY . .

RUN npm install
RUN npm --prefix api install

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm --prefix api run prisma:generate
RUN npm run build
RUN npm --prefix api run build

FROM base AS web-runner
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.config.ts ./vite.config.ts

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]

FROM base AS api-runner
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

COPY --from=builder /app/api/package.json ./api/package.json
COPY --from=builder /app/api/package-lock.json ./api/package-lock.json
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/src/generated ./api/src/generated
COPY --from=builder /app/api/prisma ./api/prisma
COPY --from=builder /app/api/prisma.config.ts ./api/prisma.config.ts

WORKDIR /app/api
CMD ["node", "dist/src/index.js"]
