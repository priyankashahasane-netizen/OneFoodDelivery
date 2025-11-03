#!/bin/bash
# Database backup script for PostgreSQL

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Starting database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed: $BACKUP_FILE"
  
  # Compress the backup
  gzip "$BACKUP_FILE"
  echo "Backup compressed: $BACKUP_FILE.gz"
  
  # Optional: Remove backups older than 30 days
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
  
  echo "Cleanup completed"
else
  echo "Backup failed"
  exit 1
fi


