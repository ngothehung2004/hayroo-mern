# 📦 Hệ Thống Sao Lưu và Phục Hồi Dữ Liệu

## 🎯 Tổng Quan

Hệ thống backup tự động cho project E-commerce Hayroo, đảm bảo:
- ✅ Sao lưu tự động định kỳ (hàng ngày, hàng tuần, hàng tháng)
- ✅ Lưu trữ đa nơi (local + cloud)
- ✅ Kiểm tra quy trình phục hồi định kỳ
- ✅ Lưu trữ offline bảo vệ khỏi tấn công mạng

---

## 📁 Cấu Trúc Files

```
server/scripts/
├── backup-database.js      # Backup MongoDB database
├── backup-files.js         # Backup files/uploads
├── backup-full.js          # Full backup (database + files)
├── backup-cloud.js         # Upload backup lên cloud
├── restore-database.js     # Restore database từ backup
├── test-restore.js         # Test quy trình restore
├── backup-scheduler.js     # Scheduler chạy trong Node.js
└── setup-cron.sh           # Script setup cron jobs (Linux)

backups/
├── database/               # Database backups
├── files/                  # File backups
└── backup.log             # Backup log
```

---

## 🚀 Quick Start

### 1. Backup Thủ Công

```bash
cd server

# Backup database
npm run backup:db

# Backup files
npm run backup:files

# Full backup (daily)
npm run backup:daily

# Full backup (weekly)
npm run backup:weekly

# Full backup (monthly)
npm run backup:monthly
```

### 2. Restore Database

```bash
# List backups
ls backups/database/

# Restore
npm run restore:db daily_2024-01-15_02-00-00.tar.gz
```

### 3. Test Restore

```bash
# Test restore vào test database
node scripts/test-restore.js daily_2024-01-15_02-00-00.tar.gz
```

---

## ⚙️ Cấu Hình

### Environment Variables

Thêm vào `server/.env`:

```env
# Database
DATABASE=mongodb://localhost:27017/Ecommerce
DATABASE_NAME=Ecommerce

# Backup
RETENTION_DAYS=30

# Cloud (Optional)
CLOUD_BACKUP_ENABLED=false
CLOUD_PROVIDER=s3
CLOUD_BUCKET=your-bucket
```

Xem chi tiết: [HUONG_DAN_CAU_HINH_BACKUP.md](./HUONG_DAN_CAU_HINH_BACKUP.md)

---

## 📅 Lịch Backup Tự Động

### Linux/Unix (Cron)

```bash
# Setup tự động
sudo bash server/scripts/setup-cron.sh

# Hoặc tạo thủ công
sudo nano /etc/cron.d/hayroo-backup
```

**Lịch mặc định:**
- **Daily:** 2:00 AM
- **Weekly:** Sunday 3:00 AM
- **Monthly:** Day 1, 4:00 AM

### Windows (Task Scheduler)

1. Mở Task Scheduler
2. Create Basic Task
3. Cấu hình trigger và action

Xem chi tiết: [HUONG_DAN_CAU_HINH_BACKUP.md](./HUONG_DAN_CAU_HINH_BACKUP.md#bước-3-cấu-hình-cron-jobs)

### Node.js Scheduler

```bash
# Chạy scheduler trong Node.js
node server/scripts/backup-scheduler.js
```

---

## ☁️ Cloud Storage

### AWS S3

```bash
# Cài đặt
npm install aws-sdk

# Cấu hình .env
CLOUD_BACKUP_ENABLED=true
CLOUD_PROVIDER=s3
CLOUD_BUCKET=hayroo-backups
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Google Cloud Storage

```bash
# Cài đặt
npm install @google-cloud/storage

# Cấu hình .env
CLOUD_BACKUP_ENABLED=true
CLOUD_PROVIDER=gcs
CLOUD_BUCKET=hayroo-backups
GCS_PROJECT_ID=your_project
GCS_KEY_FILE=path/to/key.json
```

### Azure Blob Storage

```bash
# Cài đặt
npm install @azure/storage-blob

# Cấu hình .env
CLOUD_BACKUP_ENABLED=true
CLOUD_PROVIDER=azure
CLOUD_BUCKET=hayroo-backups
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

---

## 🔍 Kiểm Tra Backup

### Xem Log

```bash
# Backup log
tail -f backups/backup.log

# Restore test log
tail -f backups/restore-test.log
```

### List Backups

```bash
# Database backups
ls -lh backups/database/

# File backups
ls -lh backups/files/

# Check size
du -sh backups/
```

### Verify Backup

```bash
# Test restore
node scripts/test-restore.js daily_2024-01-15_02-00-00.tar.gz
```

---

## 🛡️ Bảo Mật

### Encryption

- Backups được compress (tar.gz)
- Cloud storage có encryption at rest
- Có thể thêm encryption trước khi backup

### Access Control

- Chỉ admin có quyền backup/restore
- Cloud credentials được lưu trong .env (không commit)
- Log tất cả operations

### Offline Backup

- Backup vào external drive
- Disconnect sau khi backup
- Rotate giữa nhiều drives

---

## 📊 Monitoring

### Metrics

- Backup success/failure rate
- Backup size
- Backup duration
- Storage usage

### Alerts

Setup alerts khi:
- Backup failed
- Backup size bất thường
- Storage gần đầy
- Restore test failed

---

## 🚨 Disaster Recovery

### Quy Trình Phục Hồi

1. **Đánh giá thiệt hại**
2. **Chọn backup phù hợp**
3. **Restore database**
4. **Restore files**
5. **Verify hệ thống**

Xem chi tiết: [KE_HOACH_SAO_LUU_VA_PHUC_HOI.md](./KE_HOACH_SAO_LUU_VA_PHUC_HOI.md#-7-quy-trình-phục-hồi)

---

## 📚 Tài Liệu

- **[KE_HOACH_SAO_LUU_VA_PHUC_HOI.md](./KE_HOACH_SAO_LUU_VA_PHUC_HOI.md)** - Kế hoạch chi tiết
- **[HUONG_DAN_CAU_HINH_BACKUP.md](./HUONG_DAN_CAU_HINH_BACKUP.md)** - Hướng dẫn cấu hình

---

## ✅ Checklist

- [ ] Backup scripts đã được test
- [ ] Cron jobs đã được setup
- [ ] Cloud storage đã được cấu hình (nếu dùng)
- [ ] Test restore đã thành công
- [ ] Offline backup đã được setup
- [ ] Monitoring đã được cấu hình
- [ ] Team đã được training

---

## 🆘 Troubleshooting

### Backup Failed

1. Check MongoDB connection
2. Check disk space
3. Check permissions
4. View backup log

### Restore Failed

1. Verify backup file integrity
2. Check MongoDB connection
3. Check disk space
4. Try test restore first

### Cloud Upload Failed

1. Check credentials
2. Check network connection
3. Check bucket permissions
4. Verify SDK installed

---

## 📞 Liên Hệ

- **Backup Team:** backup@yourdomain.com
- **Emergency:** [Hotline]

---

**Last Updated:** 2024-01-15











