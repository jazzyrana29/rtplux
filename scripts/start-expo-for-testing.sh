#!/bin/bash

# Start Expo Web Server for Testing

echo "🚀 Starting Expo Web Server for Testing"
echo "======================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get APP_URL and extract port
APP_URL=${APP_URL:-"http://localhost:8081"}
PORT=$(echo $APP_URL | sed 's/.*://' | sed 's/\/.*//')

print_status "Starting Expo web server on port $PORT..."
print_status "APP_URL: $APP_URL"

# Check if port is already in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Port $PORT is already in use"
    print_status "Checking if it's an Expo server..."
    
    if curl -f "$APP_URL" &> /dev/null; then
        print_success "Expo server is already running at $APP_URL"
        exit 0
    else
        print_warning "Port is occupied by another service"
        print_status "Killing process on port $PORT..."
        kill -9 $(lsof -t -i:$PORT) 2>/dev/null || true
        sleep 2
    fi
fi

# Start Expo web server
print_status "Starting Expo web server..."
npx expo start --web --port $PORT &
EXPO_PID=$!

# Wait for server to be ready
print_status "Waiting for Expo server to be ready..."
for i in {1..30}; do
    if curl -f "$APP_URL" &> /dev/null; then
        print_success "Expo server is ready at $APP_URL"
        print_success "Process ID: $EXPO_PID"
        echo $EXPO_PID > .expo-pid
        exit 0
    fi
    sleep 2
    echo -n "."
done

print_warning "Expo server may not be ready yet"
print_status "Check manually at $APP_URL"
echo $EXPO_PID > .expo-pid
