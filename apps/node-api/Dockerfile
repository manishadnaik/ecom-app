# node-api: production image. Small (alpine), no devDeps.
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/node-api/package.json ./apps/node-api/package.json
COPY packages/common-lib/package.json ./packages/common-lib/package.json
RUN npm install --omit=dev
COPY apps/node-api/src ./apps/node-api/src
COPY packages/common-lib/src ./packages/common-lib/src
WORKDIR /app/apps/node-api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
