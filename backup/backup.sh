#!/bin/bash

set -e

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
DB_HOST="mysql"
DB_NAME="femvelle_prod"
DB_USER="femvelle"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup process at $(date)"

# Database backup
echo "Creating database backup..."
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --opt \
    $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully"
else
    echo "Database backup failed"
    exit 1
fi

# Media files backup (if using local storage)
if [ -d "/var/www/media" ]; then
    echo "Creating media files backup..."
    tar -czf $BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz -C /var/www media/
    
    if [ $? -eq 0 ]; then
        echo "Media backup completed successfully"
    else
        echo "Media backup failed"
        exit 1
    fi
fi

# Upload to S3
if [ ! -z "$BACKUP_BUCKET" ]; then
    echo "Uploading backups to S3..."
    
    # Upload database backup
    aws s3 cp $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz \
        s3://$BACKUP_BUCKET/database/db_backup_$TIMESTAMP.sql.gz \
        --storage-class STANDARD_IA
    
    # Upload media backup if exists
    if [ -f "$BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz" ]; then
        aws s3 cp $BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz \
            s3://$BACKUP_BUCKET/media/media_backup_$TIMESTAMP.tar.gz \
            --storage-class STANDARD_IA
    fi
    
    echo "S3 upload completed"
fi

# Clean up old local backups
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "media_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups
if [ ! -z "$BACKUP_BUCKET" ]; then
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    
    # List and delete old database backups
    aws s3 ls s3://$BACKUP_BUCKET/database/ | while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%Y-%m-%d)
        if [[ "$createDate" < "$CUTOFF_DATE" ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                aws s3 rm s3://$BACKUP_BUCKET/database/$fileName
            fi
        fi
    done
    
    # List and delete old media backups
    aws s3 ls s3://$BACKUP_BUCKET/media/ | while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%Y-%m-%d)
        if [[ "$createDate" < "$CUTOFF_DATE" ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                aws s3 rm s3://$BACKUP_BUCKET/media/$fileName
            fi
        fi
    done
fi

# Verify backup integrity
echo "Verifying backup integrity..."
if [ -f "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" ]; then
    gzip -t $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz
    if [ $? -eq 0 ]; then
        echo "Database backup integrity check passed"
    else
        echo "Database backup integrity check failed"
        exit 1
    fi
fi

# Send notification (optional)
if [ ! -z "$WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Femvelle backup completed successfully at $(date)\"}" \
        $WEBHOOK_URL
fi

echo "Backup process completed successfully at $(date)"