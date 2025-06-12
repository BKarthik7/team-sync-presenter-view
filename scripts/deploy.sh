#!/bin/bash

# Make scripts executable
chmod +x ./scripts/deploy-frontend.sh
chmod +x ./scripts/deploy-backend.sh

# Deploy Backend first
./scripts/deploy-backend.sh

# Deploy Frontend after backend
./scripts/deploy-frontend.sh

echo "✅ Deployment completed!"
