# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/build ./build
COPY server ./server
COPY package.json package-lock.json ./
RUN npm ci --only=production --silent
EXPOSE 4000
CMD ["node", "server/index.js"]
