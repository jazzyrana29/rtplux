# Dockerfile for running Playwright tests in a container
# This avoids host dependency issues

FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

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
