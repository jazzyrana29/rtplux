# Multi-stage Dockerfile for RTPLUX Casino Platform

# Stage 1: Base Node.js image
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash

# Stage 2: Dependencies installation
FROM base AS deps
COPY package*.json ./
RUN npm ci --force --only=production && npm cache clean --force

# Stage 3: Development dependencies
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci --force

# Stage 4: Build stage
FROM dev-deps AS builder
COPY . .
RUN npm run build

# Stage 5: Production image
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]

# Stage 6: Development image
FROM dev-deps AS development
ENV NODE_ENV=development

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Stage 7: Testing image with Playwright
FROM mcr.microsoft.com/playwright:v1.40.0-focal AS testing

WORKDIR /app

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Copy package files
COPY package*.json ./
RUN npm ci --force

# Copy source code
COPY . .

# Install Playwright browsers (already included in base image)
RUN npx playwright install

# Set environment variables
ENV CI=true
ENV NODE_ENV=test

# Expose port for dev server
EXPOSE 3000

# Default command
CMD ["npm", "run", "test"]
