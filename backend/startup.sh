#!/bin/bash
set -e

echo "=========================================="
echo "Starting Flask AI on port 5000..."
echo "=========================================="
cd /var/www/html/ai-model
python3 app.py --host=0.0.0.0 --port=5000 > /var/www/html/ai-model/flask.log 2>&1 &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

# Give Flask 5 seconds to start
sleep 5

# Check if Flask is actually running
if kill -0 $FLASK_PID 2>/dev/null; then
    echo "✅ Flask is running on port 5000"
else
    echo "❌ Flask FAILED to start! Check logs:"
    cat /var/www/html/ai-model/flask.log
fi

echo "=========================================="
echo "Running Laravel migrations..."
echo "=========================================="
php artisan migrate --force --no-interaction

echo "=========================================="
echo "Starting Laravel on port 8080..."
echo "=========================================="
php artisan serve --host=0.0.0.0 --port=8080