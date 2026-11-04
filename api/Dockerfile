FROM node:24.22.1-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS desarrollo
ENV NODE_ENV=development
COPY . .
# El volumen de vídeos hereda este propietario al crearse.
RUN mkdir -p /data/videos && chown -R node:node /data/videos /app
USER node
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24.22.1-slim AS produccion
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
RUN mkdir -p /data/videos && chown -R node:node /data/videos
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
