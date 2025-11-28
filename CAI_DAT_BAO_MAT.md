# Hướng Dẫn Cài Đặt Tính Năng Bảo Mật

## 📦 Bước 1: Cài Đặt Dependencies

### Backend
```bash
cd server
npm install
```

Các package mới được thêm:
- `speakeasy`: Tạo và verify TOTP tokens
- `qrcode`: Tạo QR code cho MFA setup

### Frontend
Không cần cài thêm package mới, tất cả đã có sẵn trong React.

## 🔧 Bước 2: Kiểm Tra Cấu Hình

### Backend
Đảm bảo file `.env` trong thư mục `server` có:
```env
DATABASE=mongodb://localhost:27017/Ecommerce
PORT=8000
```

### Frontend
Đảm bảo file `.env` trong thư mục `client` có:
```env
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Bước 3: Chạy Ứng Dụng

### Terminal 1 - Backend
```bash
cd server
npm run start:dev
```

### Terminal 2 - Frontend
```bash
cd client
npm start
```

## ✅ Bước 4: Kiểm Tra Tính Năng

### Test Mật Khẩu Mạnh
1. Truy cập: http://localhost:3000
2. Vào trang đăng ký
3. Thử nhập các mật khẩu yếu để xem validation
4. Nhập mật khẩu mạnh: `Admin123!@#`
5. Quan sát password strength indicator

### Test MFA
1. Đăng nhập với tài khoản admin
2. Vào: http://localhost:3000/admin/dashboard/mfa
3. Click "Enable MFA"
4. Quét QR code bằng Google Authenticator
5. Nhập mã 6 số để kích hoạt
6. Đăng xuất và đăng nhập lại để test MFA verification

## 📱 Cài Đặt Google Authenticator

### iOS
1. Mở App Store
2. Tìm "Google Authenticator"
3. Tải và cài đặt

### Android
1. Mở Google Play Store
2. Tìm "Google Authenticator"
3. Tải và cài đặt

## 🎯 Demo Checklist

- [ ] Đăng ký với mật khẩu yếu → Xem validation error
- [ ] Đăng ký với mật khẩu mạnh → Thành công
- [ ] Vào MFA Security page
- [ ] Generate QR code
- [ ] Quét QR code bằng Google Authenticator
- [ ] Verify và enable MFA
- [ ] Đăng xuất
- [ ] Đăng nhập → Yêu cầu MFA code
- [ ] Nhập mã từ Google Authenticator
- [ ] Đăng nhập thành công

## ⚠️ Lưu Ý

1. **MFA Secret Key**: Được lưu trong database, không nên chia sẻ
2. **Backup Codes**: Hiện tại chưa có tính năng backup codes, nếu mất điện thoại cần liên hệ admin
3. **Testing**: Có thể test với tài khoản admin (role: 1)

## 🐛 Xử Lý Lỗi

### Lỗi: "Cannot find module 'speakeasy'"
```bash
cd server
npm install speakeasy qrcode
```

### Lỗi: "MFA verification failed"
- Kiểm tra thời gian trên server và điện thoại đã đồng bộ
- Thử lại với mã mới (mã thay đổi mỗi 30 giây)

### Lỗi: "Database Not Connected"
- Đảm bảo MongoDB đang chạy
- Kiểm tra connection string trong `.env`

---

**Sau khi cài đặt xong, tham khảo file `BAO_MAT_TAI_KHOAN_QUAN_TRI.md` để biết chi tiết về các tính năng bảo mật.**













