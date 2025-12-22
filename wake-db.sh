#!/bin/bash

DB_HOST="koa-mpa-aurora-cluster-instance-1.cdc00uia8wy3.ap-northeast-1.rds.amazonaws.com"
DB_PORT="5432"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="Ycy488929"

echo "正在唤醒数据库..."

# 尝试连接，允许较长超时
PGCONNECT_TIMEOUT=60 PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 数据库已唤醒！"
else
    echo "⏳ 第一次连接可能超时，再试一次..."
    sleep 5
    PGCONNECT_TIMEOUT=60 PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1"
fi