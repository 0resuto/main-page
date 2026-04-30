# Этап 1: Установка всех зависимостей
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Этап 2: Сборка проекта
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Здесь Next.js прочитает ваш .env файл и "зашьет" публичные переменные
RUN npm run build

# Этап 3: Production-образ (финальный)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Копируем только результаты сборки и конфиги, .env сюда НЕ попадает
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Устанавливаем ТОЛЬКО production-зависимости, чтобы сделать образ легким
RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "start"]