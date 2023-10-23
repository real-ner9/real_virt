# Название этапа сборки
FROM node:18 AS angular_build

# Установка рабочего каталога
WORKDIR /app
COPY ../frontend /app

# Установка зависимостей и сборка проекта
RUN npm ci
RUN npm run build -- --output-path=./dist

# Запуск приложения в production-режиме
CMD ["npx", "http-server", "./dist"]
