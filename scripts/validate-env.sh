#!/bin/bash

# Validate environment variables script
set -e

echo "🔍 Validating environment variables..."

# Check if .env file exists
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo "⚠️  No .env or .env.local file found"
    echo "📋 Creating .env from env-example..."
    cp env-example .env
    echo "✅ Created .env file from env-example"
    echo "🔧 Please update the values in .env file"
fi

# Required variables
REQUIRED_VARS=("APP_URL")

# Check required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        echo "💡 Please set $var in your .env file"
        exit 1
    else
        echo "✅ $var is set"
    fi
done

# Optional variables with warnings
OPTIONAL_VARS=("PARTNER_ID" "POSTHOG_KEY" "SENTRY_DSN")

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  Optional variable $var is not set"
    else
        echo "✅ $var is set"
    fi
done

echo "🎉 Environment validation completed!"
