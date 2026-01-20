# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Установите ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci
COPY . .
# Соберите приложение
RUN npm run build

# Финальный образ
FROM node:20-alpine

WORKDIR /app
# Установите ТОЛЬКО production-зависимости
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
# Скопируйте скомпилированный код
COPY --from=builder /app/dist ./dist
# (опционально) скопируйте assets, если есть

EXPOSE 3000

CMD ["node", "dist/main"]