#!/bin/bash

echo "Starting Job AI Application..."

# Check if PostgreSQL is running
if ! pg_ctl -D /tmp/pgdata status > /dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    pg_ctl -D /tmp/pgdata -o "-k /tmp/postgresql" -l /tmp/pgdata/postgres.log start
    sleep 2
fi

# Start backend
echo "Starting backend on port 5000..."
cd /workspaces/job-ai/backend
pkill -f "ts-node-dev" 2>/dev/null
nohup npm run dev > /tmp/backend.log 2>&1 &
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd /workspaces/job-ai/frontend
pkill -f "vite" 2>/dev/null
nohup npm run dev > /tmp/frontend.log 2>&1 &
sleep 5

echo ""
echo "✅ Application started!"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "In Codespace, open: https://$CODESPACE_NAME-3000.app.github.dev"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
