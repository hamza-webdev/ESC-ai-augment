#!/bin/bash

# ESC Football App - Script de sauvegarde automatique
# Espoir Sportif de Chorbane

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="db"
DB_NAME="esc_db"
DB_USER="esc_user"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/esc_backup_$TIMESTAMP.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"

log "Démarrage de la sauvegarde de la base de données ESC..."

# Create database backup
log "Création de la sauvegarde: $BACKUP_FILE"

if pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --no-password > "$BACKUP_FILE"; then
    log "Sauvegarde SQL créée avec succès"
    
    # Compress the backup
    log "Compression de la sauvegarde..."
    if gzip "$BACKUP_FILE"; then
        log "Sauvegarde compressée: $BACKUP_COMPRESSED"
        
        # Get file size
        SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
        log "Taille de la sauvegarde: $SIZE"
    else
        warn "Échec de la compression, conservation du fichier non compressé"
    fi
else
    error "Échec de la création de la sauvegarde"
    exit 1
fi

# Clean up old backups
log "Nettoyage des anciennes sauvegardes (> $RETENTION_DAYS jours)..."

DELETED_COUNT=0
for file in "$BACKUP_DIR"/esc_backup_*.sql.gz; do
    if [ -f "$file" ]; then
        # Check if file is older than retention period
        if [ "$(find "$file" -mtime +$RETENTION_DAYS)" ]; then
            rm "$file"
            DELETED_COUNT=$((DELETED_COUNT + 1))
            log "Supprimé: $(basename "$file")"
        fi
    fi
done

if [ $DELETED_COUNT -gt 0 ]; then
    log "Supprimé $DELETED_COUNT anciennes sauvegardes"
else
    log "Aucune ancienne sauvegarde à supprimer"
fi

# Show backup statistics
log "Statistiques des sauvegardes:"
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/esc_backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
log "  - Nombre total de sauvegardes: $TOTAL_BACKUPS"
log "  - Taille totale: $TOTAL_SIZE"

log "Sauvegarde terminée avec succès!"

# Optional: Send notification (if configured)
if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"✅ Sauvegarde ESC Football réussie: $BACKUP_COMPRESSED ($SIZE)\"}" \
         &>/dev/null || warn "Échec de l'envoi de la notification"
fi
