#!/bin/bash

echo "🚀 Deploying Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/.." || exit 1

# Install dependencies if needed
echo "📦 Installing dependencies..."
if ! npm install; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
if ! npm run build; then
    echo "❌ Build failed"
    exit 1
fi

# Deploy to Vercel with specific project name
echo "🔄 Deploying to Vercel..."
if ! vercel deploy --prod --name team-sync-presenter-view-frontend --confirm; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Frontend deployment successful!"
