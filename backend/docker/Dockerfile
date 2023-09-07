FROM node:18 AS go_to_vrit_app

WORKDIR /app
COPY .. /app

RUN npm ci
RUN npm run build

CMD npm run start:prod