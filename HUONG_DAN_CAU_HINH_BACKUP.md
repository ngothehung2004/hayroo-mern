# Hướng Dẫn Cấu Hình Backup Tự Động

## 📦 Bước 1: Cài Đặt Dependencies

### MongoDB Tools

```bash
# Ubuntu/Debian
sudo apt-get install mongodb-database-tools

# CentOS/RHEL
sudo yum install mongodb-database-tools

# Mac
brew install mongodb-database-tools

# Windows
# Download từ: https://www.mongodb.com/try/download/database-tools
```

### Node.js Dependencies

Đã có sẵn trong project, không cần cài thêm.

---

## ⚙️ Bước 2: Cấu Hình Environment

Thêm vào `server/.env`:

```env
# Database
DATABASE=mongodb://localhost:27017/Ecommerce
DATABASE_NAME=Ecommerce

# Backup Configuration
BACKUP_DIR=./backups
RETENTION_DAYS=30

# Cloud Storage (Optional)
CLOUD_BACKUP_ENABLED=false
CLOUD_PROVIDER=s3
CLOUD_BUCKET=your-backup-bucket
CLOUD_REGION=us-east-1

# AWS S3 (nếu dùng)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Google Cloud Storage (nếu dùng)
GCS_PROJECT_ID=your_project_id
GCS_KEY_FILE=path/to/key.json

# Azure Blob Storage (nếu dùng)
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

---

## 🔧 Bước 3: Cấu Hình Cron Jobs

### Linux/Unix

1. **Tạo file cron:**
   ```bash
   sudo nano /etc/cron.d/hayroo-backup
   ```

2. **Thêm các dòng sau:**
   ```bash
   # Daily backup at 2 AM
   0 2 * * * cd /path/to/project/server && /usr/bin/node scripts/backup-full.js daily >> /var/log/hayroo-backup.log 2>&1

   # Weekly backup on Sunday at 3 AM
   0 3 * * 0 cd /path/to/project/server && /usr/bin/node scripts/backup-full.js weekly >> /var/log/hayroo-backup.log 2>&1

   # Monthly backup on 1st day at 4 AM
   0 4 1 * * cd /path/to/project/server && /usr/bin/node scripts/backup-full.js monthly >> /var/log/hayroo-backup.log 2>&1
   ```

3. **Thay đổi path:**
   - `/path/to/project` → đường dẫn thực tế đến project
   - `/usr/bin/node` → đường dẫn đến node (tìm bằng `which node`)

4. **Set permissions:**
   ```bash
   sudo chmod 644 /etc/cron.d/hayroo-backup
   ```

### Windows

1. **Mở Task Scheduler**
2. **Create Basic Task**
3. **Cấu hình:**
   - Name: "Hayroo Daily Backup"
   - Trigger: Daily, 2:00 AM
   - Action: Start a program
   - Program: `node`
   - Arguments: `scripts/backup-full.js daily`
   - Start in: `D:\path\to\project\server`

4. **Lặp lại cho Weekly và Monthly**

---

## ☁️ Bước 4: Cấu Hình Cloud Storage (Tùy chọn)

### AWS S3

1. **Cài đặt AWS SDK:**
   ```bash
   cd server
   npm install aws-sdk
   ```

2. **Tạo S3 bucket:**
   - Đăng nhập AWS Console
   - Tạo bucket: `hayroo-backups`
   - Enable versioning
   - Enable encryption
   - Set lifecycle policy

3. **Tạo IAM user:**
   - Permissions: `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`
   - Lấy Access Key và Secret Key

4. **Cập nhật .env:**
   ```env
   CLOUD_BACKUP_ENABLED=true
   CLOUD_PROVIDER=s3
   CLOUD_BUCKET=hayroo-backups
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=us-east-1
   ```

### Google Cloud Storage

1. **Cài đặt GCS SDK:**
   ```bash
   npm install @google-cloud/storage
   ```

2. **Tạo service account:**
   - Tạo service account trong GCP
   - Download key file (JSON)
   - Grant Storage Admin role

3. **Cập nhật .env:**
   ```env
   CLOUD_BACKUP_ENABLED=true
   CLOUD_PROVIDER=gcs
   CLOUD_BUCKET=hayroo-backups
   GCS_PROJECT_ID=your_project
   GCS_KEY_FILE=path/to/key.json
   ```

---

## ✅ Bước 5: Test Backup

### Test Manual

```bash
cd server

# Test backup database
npm run backup:db

# Test backup files
npm run backup:files

# Test full backup
npm run backup:full
```

### Verify Backup

```bash
# List backups
ls -lh backups/database/
ls -lh backups/files/

# Check backup log
cat backups/backup.log
```

---

## 🔄 Bước 6: Test Restore

### Test Restore Database

```bash
# List available backups
ls backups/database/

# Test restore (vào test database)
node scripts/test-restore.js daily_2024-01-15_02-00-00.tar.gz

# Verify data
# Check test database có dữ liệu đúng không
```

### Test Full Restore

```bash
# 1. Stop application
# 2. Restore database
node scripts/restore-database.js daily_2024-01-15_02-00-00.tar.gz

# 3. Restore files
tar -xzf backups/files/files_daily_2024-01-15_02-00-00.tar.gz -C server/public/

# 4. Verify và restart
```

---

## 📊 Bước 7: Monitoring

### Check Backup Status

```bash
# View backup log
tail -f backups/backup.log

# Check last backup
ls -lth backups/database/ | head -5
ls -lth backups/files/ | head -5

# Check backup size
du -sh backups/
```

### Setup Alerts

Tạo script check backup và gửi alert nếu failed:

```bash
# check-backup.sh
#!/bin/bash
LAST_BACKUP=$(find backups/ -name "*.tar.gz" -type f -mtime -1 | head -1)
if [ -z "$LAST_BACKUP" ]; then
    echo "ALERT: No backup found in last 24 hours!" | mail -s "Backup Alert" admin@yourdomain.com
fi
```

---

## 🛡️ Bước 8: Offline Backup

### External Drive

1. **Format drive:**
   ```bash
   # Format as ext4 (Linux) hoặc NTFS (Windows)
   ```

2. **Mount drive:**
   ```bash
   # Linux
   sudo mount /dev/sdb1 /mnt/backup-drive
   
   # Copy backup
   cp backups/monthly_*.tar.gz /mnt/backup-drive/
   ```

3. **Unmount và disconnect:**
   ```bash
   sudo umount /mnt/backup-drive
   ```

### Schedule Offline Backup

Thêm vào cron:

```bash
# Weekly offline backup on Saturday
0 5 * * 6 /path/to/offline-backup.sh
```

Script `offline-backup.sh`:
```bash
#!/bin/bash
BACKUP_DRIVE="/mnt/backup-drive"
if [ -d "$BACKUP_DRIVE" ]; then
    cp backups/weekly_*.tar.gz "$BACKUP_DRIVE/"
    umount "$BACKUP_DRIVE"
fi
```

---

## ✅ Checklist

- [ ] MongoDB tools đã cài đặt
- [ ] Backup scripts đã được test
- [ ] Cron jobs đã được cấu hình
- [ ] Cloud storage đã được setup (nếu dùng)
- [ ] Test restore đã thành công
- [ ] Offline backup đã được setup
- [ ] Monitoring đã được cấu hình
- [ ] Alerts đã được setup

---

## 🚨 Troubleshooting

### Lỗi: mongodump not found

```bash
# Cài đặt MongoDB tools
sudo apt-get install mongodb-database-tools
```

### Lỗi: Permission denied

```bash
# Set permissions
chmod +x scripts/*.js
chmod 755 backups/
```

### Lỗi: Backup quá lớn

- Compress tốt hơn
- Chia nhỏ backup
- Sử dụng incremental backup

---

**Sau khi hoàn thành, hệ thống sẽ tự động backup định kỳ!**











