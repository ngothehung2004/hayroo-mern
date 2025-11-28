#!/bin/bash

# Script tự động setup cron jobs cho backup
# Chạy: bash scripts/setup-cron.sh

PROJECT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
SERVER_DIR="$PROJECT_DIR/server"
NODE_PATH=$(which node)
CRON_FILE="/etc/cron.d/hayroo-backup"

echo "═══════════════════════════════════════════"
echo "  Setup Cron Jobs for Backup"
echo "═══════════════════════════════════════════"
echo ""
echo "Project directory: $PROJECT_DIR"
echo "Server directory: $SERVER_DIR"
echo "Node path: $NODE_PATH"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  This script needs to be run as root (sudo)"
  echo "Please run: sudo bash scripts/setup-cron.sh"
  exit 1
fi

# Create cron file
echo "Creating cron file: $CRON_FILE"
cat > "$CRON_FILE" << EOF
# Hayroo E-commerce Backup Schedule
# Generated on $(date)

# Daily backup at 2 AM
0 2 * * * cd $SERVER_DIR && $NODE_PATH scripts/backup-full.js daily >> /var/log/hayroo-backup.log 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd $SERVER_DIR && $NODE_PATH scripts/backup-full.js weekly >> /var/log/hayroo-backup.log 2>&1

# Monthly backup on 1st day at 4 AM
0 4 1 * * cd $SERVER_DIR && $NODE_PATH scripts/backup-full.js monthly >> /var/log/hayroo-backup.log 2>&1
EOF

# Set permissions
chmod 644 "$CRON_FILE"

echo "✅ Cron jobs have been set up!"
echo ""
echo "Schedule:"
echo "  - Daily: 2:00 AM"
echo "  - Weekly: Sunday 3:00 AM"
echo "  - Monthly: 1st day 4:00 AM"
echo ""
echo "Log file: /var/log/hayroo-backup.log"
echo ""
echo "To verify, run:"
echo "  sudo crontab -l"
echo "  cat $CRON_FILE"
echo ""
echo "To test backup manually:"
echo "  cd $SERVER_DIR"
echo "  npm run backup:daily"











