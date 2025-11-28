# Kế Hoạch Sao Lưu và Phục Hồi Dữ Liệu

## 📋 Tổng Quan

Tài liệu này trình bày chiến lược sao lưu và phục hồi dữ liệu cho hệ thống E-commerce Hayroo, đảm bảo tính toàn vẹn dữ liệu và khả năng phục hồi khi có sự cố.

---

## 🎯 Mục Tiêu

1. ✅ Sao lưu tự động định kỳ (hàng ngày, hàng tuần, hàng tháng)
2. ✅ Lưu trữ đa nơi (local + cloud)
3. ✅ Định kỳ kiểm tra quy trình phục hồi
4. ✅ Lưu trữ offline để bảo vệ khỏi tấn công mạng

---

## 📅 1. Chiến Lược Sao Lưu

### Lịch Sao Lưu

#### Daily Backup (Hàng Ngày)
- **Thời gian:** 02:00 AM (giờ server)
- **Nội dung:** 
  - Database (MongoDB)
  - Files/uploads (hình ảnh, documents)
- **Lưu trữ:** 
  - Local server (30 ngày)
  - Cloud storage (90 ngày)
- **Retention:** 30 ngày local, 90 ngày cloud

#### Weekly Backup (Hàng Tuần)
- **Thời gian:** Chủ nhật 03:00 AM
- **Nội dung:** Full backup (database + files)
- **Lưu trữ:**
  - Local server (90 ngày)
  - Cloud storage (1 năm)
  - Offline storage (USB/External drive)
- **Retention:** 90 ngày local, 1 năm cloud, vĩnh viễn offline

#### Monthly Backup (Hàng Tháng)
- **Thời gian:** Ngày 1 hàng tháng, 04:00 AM
- **Nội dung:** Full backup + configuration files
- **Lưu trữ:**
  - Local server (1 năm)
  - Cloud storage (3 năm)
  - Offline storage (vĩnh viễn)
- **Retention:** 1 năm local, 3 năm cloud, vĩnh viễn offline

### Loại Dữ Liệu Sao Lưu

#### Database (MongoDB)
- ✅ Tất cả collections
- ✅ Users, Products, Orders, Categories
- ✅ Configuration data
- ✅ Format: MongoDB dump (compressed .tar.gz)

#### Files & Uploads
- ✅ Product images (`public/uploads/products/`)
- ✅ Category images (`public/uploads/categories/`)
- ✅ Customize images (`public/uploads/customize/`)
- ✅ Format: Tar.gz archive

#### Configuration
- ✅ Environment variables (encrypted)
- ✅ Server configuration
- ✅ SSL certificates (nếu có)

---

## 💾 2. Chiến Lược Lưu Trữ Đa Nơi

### 3-2-1 Backup Rule

**3 copies** - 3 bản sao lưu
- 1 bản chính (production)
- 1 bản local backup
- 1 bản cloud backup

**2 different media** - 2 loại phương tiện khác nhau
- Local disk storage
- Cloud storage (S3, GCS, Azure)

**1 offsite** - 1 bản lưu trữ ngoài site
- Cloud storage (khác data center)
- Hoặc external drive lưu tại vị trí khác

### Lưu Trữ Local

**Vị trí:** `/backups/` trên server

**Cấu trúc:**
```
backups/
├── database/
│   ├── daily_2024-01-15_02-00-00.tar.gz
│   ├── weekly_2024-01-14_03-00-00.tar.gz
│   └── monthly_2024-01-01_04-00-00.tar.gz
├── files/
│   ├── files_daily_2024-01-15_02-00-00.tar.gz
│   └── files_weekly_2024-01-14_03-00-00.tar.gz
└── backup.log
```

**Bảo vệ:**
- Permissions: 600 (chỉ owner đọc/ghi)
- Encryption: Có thể mã hóa sensitive backups

### Lưu Trữ Cloud

#### Option 1: AWS S3

**Ưu điểm:**
- Durable (99.999999999%)
- Scalable
- Encryption at rest
- Lifecycle policies

**Cấu hình:**
```env
CLOUD_PROVIDER=s3
CLOUD_BUCKET=hayroo-backups
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

**Lifecycle Policy:**
- Daily backups → Glacier sau 30 ngày
- Weekly backups → Glacier sau 90 ngày
- Monthly backups → Glacier Deep Archive sau 1 năm

#### Option 2: Google Cloud Storage

**Ưu điểm:**
- Multi-regional storage
- Automatic encryption
- Versioning support

**Cấu hình:**
```env
CLOUD_PROVIDER=gcs
CLOUD_BUCKET=hayroo-backups
GCS_PROJECT_ID=your_project
GCS_KEY_FILE=path/to/key.json
```

#### Option 3: Azure Blob Storage

**Ưu điểm:**
- Geo-redundant storage
- Archive tier
- Integration với Azure services

**Cấu hình:**
```env
CLOUD_PROVIDER=azure
CLOUD_BUCKET=hayroo-backups
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
```

### Lưu Trữ Offline

**Mục đích:** Bảo vệ khỏi ransomware và tấn công mạng

**Phương pháp:**
1. **External Hard Drive:**
   - Backup hàng tuần/tháng
   - Lưu tại vị trí an toàn (khác server)
   - Rotate giữa nhiều drives

2. **Tape Backup:**
   - Cho dữ liệu lớn
   - Lưu trữ lâu dài
   - Lưu tại offsite location

3. **Network Attached Storage (NAS):**
   - Tại vị trí khác
   - Air-gapped (không kết nối internet thường xuyên)

---

## 🔄 3. Quy Trình Sao Lưu

### Tự Động Hóa với Cron

#### Linux/Unix

Tạo file `/etc/cron.d/hayroo-backup`:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project/server && node scripts/backup-full.js daily >> /var/log/backup.log 2>&1

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/project/server && node scripts/backup-full.js weekly >> /var/log/backup.log 2>&1

# Monthly backup on 1st day at 4 AM
0 4 1 * * cd /path/to/project/server && node scripts/backup-full.js monthly >> /var/log/backup.log 2>&1
```

#### Windows Task Scheduler

1. Mở Task Scheduler
2. Create Basic Task
3. Trigger: Daily/Weekly/Monthly
4. Action: Start a program
5. Program: `node`
6. Arguments: `scripts/backup-full.js daily`

### Manual Backup

```bash
# Backup database only
npm run backup:db

# Backup files only
npm run backup:files

# Full backup (daily)
npm run backup:daily

# Full backup (weekly)
npm run backup:weekly

# Full backup (monthly)
npm run backup:monthly
```

---

## 🔍 4. Kiểm Tra Quy Trình Phục Hồi

### Định Kỳ Test Restore

#### Hàng Tháng

1. **Chọn backup ngẫu nhiên:**
   ```bash
   # List backups
   ls -lh backups/database/
   
   # Test restore
   node scripts/test-restore.js daily_2024-01-15_02-00-00.tar.gz
   ```

2. **Verify dữ liệu:**
   - Số lượng collections
   - Số lượng documents
   - Sample data integrity
   - Relationships (foreign keys)

3. **Báo cáo:**
   - Ghi lại kết quả
   - Document issues (nếu có)
   - Update quy trình (nếu cần)

#### Hàng Quý

1. **Full restore test:**
   - Restore vào test environment
   - Verify toàn bộ hệ thống
   - Test application functionality

2. **Disaster recovery drill:**
   - Simulate server failure
   - Restore từ cloud backup
   - Measure recovery time

### Checklist Kiểm Tra

- [ ] Backup file có thể extract được
- [ ] Database có thể restore được
- [ ] Files có thể restore được
- [ ] Dữ liệu đầy đủ và chính xác
- [ ] Application hoạt động sau restore
- [ ] Không có data corruption
- [ ] Recovery time trong SLA

---

## 🛡️ 5. Bảo Vệ Khỏi Tấn Công Mạng

### Air-Gapped Backups

**Khái niệm:** Backups không kết nối với network thường xuyên

**Thực hiện:**
1. **Scheduled offline backup:**
   - Backup vào external drive
   - Disconnect ngay sau khi backup
   - Chỉ connect khi cần backup

2. **Immutable backups:**
   - Sử dụng cloud storage với object lock
   - Không thể xóa/sửa trong retention period
   - Bảo vệ khỏi ransomware

### Encryption

**Tại Rest:**
- Encrypt backups trước khi lưu
- Sử dụng AES-256
- Store encryption keys an toàn

**Trong Transit:**
- Sử dụng TLS khi upload lên cloud
- Verify SSL certificates

### Access Control

**Permissions:**
- Chỉ admin mới có quyền backup/restore
- Log tất cả backup/restore operations
- Audit trail đầy đủ

**Authentication:**
- MFA cho cloud storage accounts
- API keys được rotate định kỳ
- Least privilege principle

---

## 📊 6. Monitoring & Alerting

### Monitoring

**Metrics cần theo dõi:**
- Backup success/failure rate
- Backup size
- Backup duration
- Storage usage
- Restore test results

### Alerting

**Cảnh báo khi:**
- Backup failed
- Backup size bất thường (quá nhỏ/lớn)
- Backup duration quá lâu
- Storage gần đầy
- Restore test failed

**Notification channels:**
- Email
- Slack/Teams
- SMS (cho critical alerts)

---

## 📝 7. Quy Trình Phục Hồi

### Phục Hồi Database

```bash
# 1. List available backups
ls -lh backups/database/

# 2. Restore database
node scripts/restore-database.js daily_2024-01-15_02-00-00.tar.gz

# 3. Verify restore
node scripts/test-restore.js daily_2024-01-15_02-00-00.tar.gz
```

### Phục Hồi Files

```bash
# 1. Extract backup
tar -xzf backups/files/files_daily_2024-01-15_02-00-00.tar.gz -C /tmp/restore

# 2. Copy files về vị trí
cp -r /tmp/restore/uploads/* server/public/uploads/

# 3. Verify permissions
chmod -R 755 server/public/uploads/
```

### Disaster Recovery

**Scenario: Server bị tấn công/ransomware**

1. **Ngắt kết nối server ngay lập tức**
2. **Đánh giá thiệt hại:**
   - Xác định phạm vi
   - Xác định thời điểm sự cố
3. **Chọn backup phù hợp:**
   - Backup trước khi bị tấn công
   - Verify backup không bị ảnh hưởng
4. **Restore:**
   - Setup server mới (nếu cần)
   - Restore từ cloud/offline backup
   - Verify hệ thống
5. **Post-recovery:**
   - Document lessons learned
   - Update security measures
   - Review backup strategy

---

## ✅ Checklist Triển Khai

### Setup
- [ ] Backup scripts đã được tạo
- [ ] Cron jobs đã được cấu hình
- [ ] Cloud storage đã được setup
- [ ] Offline storage đã được chuẩn bị

### Testing
- [ ] Test backup database
- [ ] Test backup files
- [ ] Test restore database
- [ ] Test restore files
- [ ] Test cloud upload
- [ ] Test offline backup

### Documentation
- [ ] Quy trình backup đã được tài liệu hóa
- [ ] Quy trình restore đã được tài liệu hóa
- [ ] Disaster recovery plan đã được tài liệu hóa
- [ ] Contact information đã được cập nhật

### Monitoring
- [ ] Monitoring đã được setup
- [ ] Alerts đã được cấu hình
- [ ] Dashboard đã được tạo

---

## 📞 Liên Hệ

### Backup Team

- **Email:** backup@yourdomain.com
- **On-call:** [Số điện thoại]

### Emergency

- **24/7 Hotline:** [Số điện thoại khẩn cấp]

---

## 📚 Tài Liệu Tham Khảo

- **3-2-1 Backup Rule:** https://www.backblaze.com/blog/the-3-2-1-backup-strategy/
- **AWS S3 Best Practices:** https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
- **MongoDB Backup:** https://docs.mongodb.com/manual/core/backups/
- **Disaster Recovery:** https://www.ready.gov/business/emergency-plans/continuity-planning

---

**Tài liệu này cần được review và cập nhật định kỳ.**











