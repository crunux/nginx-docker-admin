FROM oven/bun:1 AS base
WORKDIR /app

# Dependencias
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Código fuente
COPY src ./src

ENV NODE_ENV=production

EXPOSE 4000 4001
CMD ["bun", "src/index.ts"]