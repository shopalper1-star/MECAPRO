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

# Copy AI model source code
COPY ai-model/ ./

# Copy model files
COPY ai-model/models/ ./models/


# ============================================
# STAGE 4: Final Combined Image - WITH POSTGRESQL
# ============================================
FROM php:8.2-apache

# Install Python AND PostgreSQL driver for final image
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libpq-dev \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && docker-php-ext-install pdo_pgsql pgsql

# Copy Backend
COPY --from=backend-builder /var/www/html /var/www/html

# Copy Frontend (served from Laravel public folder) - FIXED: Added trailing slash
COPY --from=frontend-builder /app/frontend/dist/ /var/www/html/public/

# Copy AI Model
COPY --from=ai-model-builder /app /var/www/html/ai-model
COPY --from=ai-model-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

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
# REMOVED: RUN php artisan migrate --force
# (Database not available during build)
# ============================================

# Expose port
EXPOSE 8080

# ============================================
# STARTUP SCRIPT - Runs migrations on container start
# ============================================
CMD ["sh", "-c", "php artisan migrate --force --no-interaction && php artisan serve --host=0.0.0.0 --port=8080"]