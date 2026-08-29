#!/bin/bash
set -e

echo "=========================================="
echo "Starting Flask AI on port 5001 (internal)..."
echo "=========================================="
cd /var/www/html/ai-model

# Start Flask on port 5001 (NOT 5000!)
nohup python3 app.py --host=0.0.0.0 --port=5001 > /var/www/html/ai-model/flask.log 2>&1 &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

# Give Flask 15 seconds to load models and start
sleep 15

# Check if Flask is actually running
if kill -0 $FLASK_PID 2>/dev/null; then
    echo "✅ Flask is running on port 5001 (internal)"
else
    echo "❌ Flask FAILED to start! Check logs:"
    cat /var/www/html/ai-model/flask.log
fi

echo "=========================================="
echo "Clearing Laravel view cache..."
echo "=========================================="
cd /var/www/html
php artisan view:clear

echo "=========================================="
echo "Running Laravel migrations..."
echo "=========================================="
php artisan migrate --force --no-interaction

echo "=========================================="
echo "Starting Laravel on port 8080 (EXTERNAL)..."
echo "=========================================="
# This MUST run in foreground so it stays alive!
exec php artisan serve --host=0.0.0.0 --port=8080