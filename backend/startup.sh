#!/bin/bash
set -e

echo "=========================================="
echo "Starting Laravel on port 8080 (EXTERNAL)..."
echo "=========================================="
cd /var/www/html

# Run migrations first
php artisan migrate --force --no-interaction || echo "⚠️ Migrations failed, continuing anyway!"

# Start Laravel in background
nohup php artisan serve --host=0.0.0.0 --port=8080 > /var/www/html/laravel.log 2>&1 &
LARAVEL_PID=$!
echo "Laravel PID: $LARAVEL_PID"

# Give Laravel 5 seconds to start
sleep 5

# Check if Laravel is actually running
if kill -0 $LARAVEL_PID 2>/dev/null; then
    echo "✅ Laravel is running on port 8080 (EXTERNAL)"
else
    echo "❌ Laravel FAILED to start! Check logs:"
    cat /var/www/html/laravel.log
fi

echo "=========================================="
echo "Starting Flask AI on port 5001 (internal)..."
echo "=========================================="
cd /var/www/html/ai-model

# Start Flask on port 5001 (pass PORT as env var, not CLI arg — app.py reads os.environ.get('PORT'))
export PORT=5001
nohup python3 app.py > /var/www/html/ai-model/flask.log 2>&1 &
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
echo "All services started. Waiting for Laravel..."
echo "=========================================="

# Keep container alive by waiting on Laravel
wait $LARAVEL_PID