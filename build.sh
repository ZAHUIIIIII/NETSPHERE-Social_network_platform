#!/bin/bash

# Exit on error
set -e

echo "🔨 Building NETSPHERE server..."

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

echo "✅ Build completed successfully!"
