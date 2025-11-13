#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting NETSPHERE server..."

# Start the server (dependencies already installed during build)
echo "🌐 Starting Express server..."
cd server
npm start
