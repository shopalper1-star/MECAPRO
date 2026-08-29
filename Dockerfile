# ============================================
# FORCE REBUILD - PostgreSQL driver fix
# ============================================
ARG CACHE_BUST=20260829

# ============================================
# STAGE 1: Build Frontend (React + Vite)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN chmod +x node_modules/.bin/vite && ./node_modules/.bin/vite build


# ============================================
# STAGE 2: Build Backend (Laravel) - WITH POSTGRESQL
# ============================================
FROM php:8.2-apache AS backend-builder

WORKDIR /var/www/html

# Install system dependencies + PostgreSQL driver
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd pdo_pgsql pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy backend files
COPY backend/ ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache


# ============================================
# STAGE 3: Build AI Model (Flask)
# ============================================
FROM python:3.11-slim AS ai-model-builder

WORKDIR /app

# Copy requirements and install dependencies
COPY ai-model/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI model source code AND model files
COPY ai-model/ ./

# Verify models exist
RUN ls -la models/


# ============================================
# STAGE 4: Final Combined Image - WITH POSTGRESQL
# ============================================
FROM php:8.2-apache

# Install Python AND build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    libpq-dev \
    gcc \
    g++ \
    net-tools \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && docker-php-ext-install pdo_pgsql pgsql

# ============================================
# 🟢 INSTALL PYTHON PACKAGES - INCLUDING XGBOOST + WAITRESS!
# ============================================
RUN pip3 install --break-system-packages --no-cache-dir \
    flask \
    flask-cors \
    joblib \
    pandas \
    numpy \
    scikit-learn \
    xgboost \
    waitress

# Copy Backend
COPY --from=backend-builder /var/www/html /var/www/html

# Copy Frontend (served from Laravel public folder)
COPY --from=frontend-builder /app/frontend/dist/ /var/www/html/public/

# Copy AI Model source code AND models (CRITICAL!)
COPY --from=ai-model-builder /app /var/www/html/ai-model
COPY --from=ai-model-builder /app/models /var/www/html/ai-model/models

# Set working directory to Laravel
WORKDIR /var/www/html

# Disable Telescope to avoid table errors during migration
ENV TELESCOPE_ENABLED=false

# Clear and cache configuration
RUN php artisan config:clear
RUN php artisan config:cache
RUN php artisan route:cache
RUN php artisan view:cache

# ============================================
# CREATE STARTUP SCRIPT
# ============================================
COPY backend/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Create log file for Flask
RUN touch /var/www/html/ai-model/flask.log

# Expose port
EXPOSE 8080

# ============================================
# STARTUP - Uses startup script for reliability
# ============================================
CMD ["/usr/local/bin/startup.sh"]