#!/bin/bash
set -e

echo "=========================================="
echo "Checking Python..."
echo "=========================================="
which python3
python3 --version

echo "=========================================="
echo "Checking Flask..."
echo "=========================================="
python3 -c "import flask; print(f'Flask version: {flask.__version__}')" || echo "Flask NOT found!"

echo "=========================================="
echo "Checking xgboost..."
echo "=========================================="
python3 -c "import xgboost; print(f'XGBoost version: {xgboost.__version__}')" || echo "XGBoost NOT found!"

echo "=========================================="
echo "Checking models..."
echo "=========================================="
ls -la /var/www/html/ai-model/models/ || echo "Models directory not found!"

echo "=========================================="
echo "Starting Flask AI on port 5000..."
echo "=========================================="
cd /var/www/html/ai-model

# Use nohup to keep Flask running even if parent shell exits
nohup python3 app.py --host=0.0.0.0 --port=5000 > /var/www/html/ai-model/flask.log 2>&1 &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

# Give Flask 15 seconds to load models and start
sleep 15

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
cd /var/www/html
php artisan migrate --force --no-interaction

echo "=========================================="
echo "Starting Laravel on port 8080..."
echo "=========================================="
php artisan serve --host=0.0.0.0 --port=8080