# Название этапа сборки
# Этап сборки
FROM node:18 as angular_build
WORKDIR /app
COPY ./frontend /app
RUN npm ci
RUN npm run build -- --output-path=./dist/frontend

# Этап размещения
FROM nginx:alpine
COPY --from=angular_build /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
