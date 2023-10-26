FROM node:18 as angular_build
WORKDIR /app
COPY . /app
RUN npm ci
RUN npm run build -- --output-path=./dist/frontend

# Этап размещения
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=angular_build /app/dist/frontend /usr/share/nginx/html
