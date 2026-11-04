FROM node:24.22.1-slim AS deps
WORKDIR /app
# Next.js fija este destino al compilar. Si el servicio cambia de nombre, hay que reconstruir.
ENV API_INTERNAL_URL=http://api:4000
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS desarrollo
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

FROM node:24.22.1-slim AS produccion
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
