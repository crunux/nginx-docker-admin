FROM node:20-alpine AS base
WORKDIR /app

# Dependencias
COPY package.json package-lock.json ./
RUN npm install

# Build
COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
