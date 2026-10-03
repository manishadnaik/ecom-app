# react-ui: build with vite, serve static with nginx (SPA fallback).
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/react-ui/package.json ./apps/react-ui/package.json
COPY packages/common-lib/package.json ./packages/common-lib/package.json
RUN npm install
COPY apps/react-ui ./apps/react-ui
COPY packages/common-lib ./packages/common-lib
RUN npm run build -w react-ui

FROM nginx:alpine
COPY apps/react-ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/react-ui/dist /usr/share/nginx/html
EXPOSE 80
