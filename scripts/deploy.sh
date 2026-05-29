#!/bin/bash
# Full deployment script
# Run from /var/www/print-on-demand after pulling latest code
# Usage: bash scripts/deploy.sh

set -e

echo "=== Print-on-Demand: Deploy ==="

echo "1. Installing dependencies..."
npm ci

echo "2. Generating Prisma client..."
npx prisma generate

echo "3. Running database migrations..."
npx prisma migrate deploy

echo "4. Building Next.js..."
npm run build

echo "5. Copying static assets to standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "6. Restarting PM2 process..."
pm2 restart print-on-demand || pm2 start ecosystem.config.js --env production

echo "=== Deploy complete ==="
pm2 list
