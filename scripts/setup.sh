#!/bin/bash

echo "Setting up AI Career Intelligence Platform..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd /workspaces/job-ai/backend && npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd /workspaces/job-ai/frontend && npm install

# Install scraper dependencies
echo "Installing scraper dependencies..."
cd /workspaces/job-ai/scraper && pip install -r requirements.txt
playwright install chromium

echo "Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start PostgreSQL: docker-compose up -d postgres"
echo "  2. Start backend: cd backend && npm run dev"
echo "  3. Start frontend: cd frontend && npm run dev"
echo "  4. Run scraper: cd scraper && scrapy crawl remoteok"
echo ""
echo "Or use: bash scripts/start-all.sh"
