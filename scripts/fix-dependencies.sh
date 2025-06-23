#!/bin/bash

# Fix dependency conflicts and rebuild

echo "🔧 Fixing dependency conflicts..."

# Remove existing node_modules and lock files
rm -rf node_modules
rm -f package-lock.json

# Clear npm cache
npm cache clean --force

# Install with force flag to resolve conflicts
npm install --force

# Make scripts executable
chmod +x scripts/*.sh

echo "✅ Dependencies fixed!"
echo ""
echo "Now you can run:"
echo "  npm run setup:docker"
echo "  npm run test:docker"
