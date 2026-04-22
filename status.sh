#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         JOB-AI PLATFORM - STATUS CHECK                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check PostgreSQL
echo "🗄️  PostgreSQL Database:"
if pg_ctl -D /tmp/pgdata status > /dev/null 2>&1; then
    echo "   ✅ Running"
    SOURCES=$(psql -h /tmp -U vscode -d job_ai -t -c "SELECT COUNT(*) FROM job_sources;" 2>/dev/null | tr -d ' ')
    echo "   📊 Job sources in DB: $SOURCES"
else
    echo "   ❌ Not running"
    echo "   💡 Start with: pg_ctl -D /tmp/pgdata -o '-k /tmp' -l /tmp/pgdata/pg.log start"
fi
echo ""

# Check Backend
echo "🔧 Backend API (Node.js):"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✅ Running on http://localhost:5000"
    HEALTH=$(curl -s http://localhost:5000/health | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null)
    echo "   💚 Health: $HEALTH"
else
    echo "   ❌ Not running"
    echo "   💡 Start with: cd backend && npm run dev"
fi
echo ""

# Check Frontend
echo "🎨 Frontend (React + Vite):"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Running on http://localhost:3000"
    TITLE=$(curl -s http://localhost:3000 | grep -o "<title>.*</title>" | sed 's/<[^>]*>//g')
    echo "   📱 App: $TITLE"
else
    echo "   ❌ Not running"
    echo "   💡 Start with: cd frontend && npm run dev"
fi
echo ""

# Check Analysis
echo "📊 Data Analysis:"
if [ -f "docs/analysis/job_analysis.py" ]; then
    echo "   ✅ Script ready: docs/analysis/job_analysis.py"
    CHARTS=$(ls docs/analysis/*.png 2>/dev/null | wc -l)
    if [ "$CHARTS" -gt 0 ]; then
        echo "   📈 Generated charts: $CHARTS"
    else
        echo "   ⏳ No charts yet - run: python3 docs/analysis/job_analysis.py"
    fi
else
    echo "   ❌ Analysis script not found"
fi
echo ""

# Check Scraper
echo "🕷️  Job Scraper:"
if [ -f "scraper/scheduler.py" ]; then
    echo "   ✅ Scheduler ready: scraper/scheduler.py"
    echo "   💡 Run with: cd scraper && python3 scheduler.py"
else
    echo "   ❌ Scheduler not found"
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "📖 Full documentation: docs/SETUP_GUIDE.md"
echo "════════════════════════════════════════════════════════════"
