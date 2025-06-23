#!/bin/bash

# Fix permissions for all shell scripts in the project

echo "🔧 Fixing script permissions..."

# Make all .sh files executable
find . -name "*.sh" -exec chmod +x {} \;

# Verify permissions
echo "📋 Current script permissions:"
ls -la scripts/*.sh

echo "✅ All scripts are now executable!"
echo ""
echo "You can now run:"
echo "  npm run setup:docker"
echo "  npm run test:docker"
echo "  npm run setup:playwright"
