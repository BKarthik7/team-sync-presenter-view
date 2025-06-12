#!/bin/bash

echo "🚀 Deploying Backend..."

# Navigate to backend directory
cd backend || exit 1

# Build the backend
echo "📦 Building backend..."
npm run build

# Deploy to Vercel with specific project name
echo "🔄 Deploying to Vercel..."
vercel deploy --prod --name team-sync-presenter-view-backend --confirm

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Backend deployment successful!"
else
    echo "❌ Backend deployment failed!"
    exit 1
fi

# Return to root directory
cd ..
