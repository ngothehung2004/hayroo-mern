# Tài Liệu Bảo Mật Tài Khoản Quản Trị

## 📋 Tổng Quan

Hệ thống đã được tích hợp các tính năng bảo mật nâng cao cho tài khoản quản trị:

1. **Mật khẩu mạnh (Strong Password)**: Yêu cầu mật khẩu đáp ứng các tiêu chuẩn bảo mật cao
2. **Multi-Factor Authentication (MFA)**: Xác thực hai yếu tố sử dụng TOTP (Time-based One-Time Password)

---

## 🔐 1. Mật Khẩu Mạnh (Strong Password)

### Yêu Cầu Mật Khẩu

Khi đăng ký tài khoản mới, hệ thống yêu cầu mật khẩu phải đáp ứng các tiêu chuẩn sau:

- ✅ **Ít nhất 8 ký tự**
- ✅ **Có ít nhất 1 chữ hoa** (A-Z)
- ✅ **Có ít nhất 1 chữ thường** (a-z)
- ✅ **Có ít nhất 1 số** (0-9)
- ✅ **Có ít nhất 1 ký tự đặc biệt** (!@#$%^&*()_+-=[]{}|;':",./<>?)

### Ví Dụ Mật Khẩu Hợp Lệ

```
✅ Admin123!@#
✅ SecurePass2024!
✅ MyP@ssw0rd
✅ Strong#Pass1
```

### Ví Dụ Mật Khẩu Không Hợp Lệ

```
❌ admin123        (thiếu chữ hoa và ký tự đặc biệt)
❌ ADMIN123        (thiếu chữ thường và ký tự đặc biệt)
❌ AdminPass       (thiếu số và ký tự đặc biệt)
❌ Admin1          (quá ngắn, thiếu ký tự đặc biệt)
```

### Giao Diện

Khi người dùng nhập mật khẩu trong form đăng ký, hệ thống sẽ hiển thị indicator trực quan:
- ✓ (màu xanh): Đã đáp ứng yêu cầu
- ○ (màu xám): Chưa đáp ứng yêu cầu

---

## 🔒 2. Multi-Factor Authentication (MFA)

### Tổng Quan

MFA là lớp bảo mật thứ hai yêu cầu người dùng cung cấp mã xác thực từ ứng dụng authenticator (như Google Authenticator) sau khi nhập mật khẩu.

### Cách Hoạt Động

1. **Setup MFA**:
   - Admin đăng nhập vào hệ thống
   - Vào menu "MFA Security" trong admin dashboard
   - Click "Enable MFA"
   - Quét QR code bằng ứng dụng Google Authenticator (hoặc ứng dụng TOTP khác)
   - Nhập mã 6 số từ ứng dụng để xác nhận và kích hoạt MFA

2. **Login với MFA**:
   - Nhập email và mật khẩu như bình thường
   - Nếu tài khoản đã bật MFA, hệ thống sẽ yêu cầu nhập mã 6 số từ ứng dụng authenticator
   - Nhập mã để hoàn tất đăng nhập

3. **Disable MFA**:
   - Vào "MFA Security" trong admin dashboard
   - Click "Disable MFA"
   - Xác nhận để tắt MFA

### Cài Đặt Ứng Dụng Authenticator

#### Google Authenticator
1. Tải ứng dụng từ App Store (iOS) hoặc Google Play (Android)
2. Mở ứng dụng
3. Chọn "Scan QR code" hoặc "Enter setup key"
4. Quét QR code từ hệ thống hoặc nhập manual key

#### Microsoft Authenticator
1. Tải ứng dụng từ App Store hoặc Google Play
2. Thêm tài khoản mới
3. Chọn "Work or school account" hoặc "Other"
4. Quét QR code

### API Endpoints

#### Backend Endpoints

```
POST /api/mfa/generate-secret
- Tạo secret key và QR code cho MFA setup
- Yêu cầu: Đăng nhập (JWT token)
- Body: { userId: "..." }
- Response: { secret, qrCode, manualEntryKey }

POST /api/mfa/verify-enable
- Verify token và enable MFA
- Yêu cầu: Đăng nhập (JWT token)
- Body: { userId: "...", token: "123456" }
- Response: { success, verified }

POST /api/mfa/verify-token
- Verify MFA token khi login
- Yêu cầu: Không cần đăng nhập
- Body: { userId: "...", token: "123456" }
- Response: { verified, token, user }

POST /api/mfa/disable
- Disable MFA
- Yêu cầu: Đăng nhập (JWT token)
- Body: { userId: "..." }
- Response: { success }

POST /api/mfa/status
- Kiểm tra trạng thái MFA
- Yêu cầu: Đăng nhập (JWT token)
- Body: { userId: "..." }
- Response: { mfaEnabled, hasSecret }
```

---

## 📸 Hướng Dẫn Demo

### Demo 1: Đăng Ký với Mật Khẩu Mạnh

1. Truy cập trang đăng ký
2. Nhập thông tin tài khoản
3. Khi nhập mật khẩu, quan sát password strength indicator
4. Thử nhập các mật khẩu yếu để xem validation
5. Nhập mật khẩu mạnh đáp ứng tất cả yêu cầu
6. Hoàn tất đăng ký

**Screenshots để chụp:**
- Form đăng ký với password strength indicator
- Thông báo lỗi khi mật khẩu không đáp ứng yêu cầu
- Thông báo thành công khi đăng ký

### Demo 2: Bật MFA cho Tài Khoản Admin

1. Đăng nhập với tài khoản admin
2. Vào Admin Dashboard → MFA Security
3. Click "Enable MFA"
4. Quét QR code bằng Google Authenticator
5. Nhập mã 6 số để xác nhận
6. Xác nhận MFA đã được bật

**Screenshots để chụp:**
- Trang MFA Security (trước khi bật)
- QR code hiển thị
- Form nhập mã xác thực
- Trạng thái MFA đã bật

### Demo 3: Đăng Nhập với MFA

1. Đăng xuất khỏi hệ thống
2. Đăng nhập lại với email và mật khẩu
3. Hệ thống yêu cầu nhập mã MFA
4. Mở Google Authenticator và lấy mã 6 số
5. Nhập mã vào form
6. Hoàn tất đăng nhập

**Screenshots để chụp:**
- Form đăng nhập bình thường
- Form yêu cầu mã MFA
- Google Authenticator hiển thị mã
- Đăng nhập thành công

---

## 🔧 Cài Đặt và Cấu Hình

### Backend Dependencies

Đã thêm vào `server/package.json`:
```json
{
  "speakeasy": "^2.0.0",
  "qrcode": "^1.5.3"
}
```

### Cài Đặt Dependencies

```bash
cd server
npm install
```

### Cấu Hình Database

Model User đã có sẵn các trường:
- `secretKey`: Lưu secret key cho MFA (base32)
- `verified`: Trạng thái MFA (true/false)

### Frontend Components

Các component đã được tạo:
- `client/src/components/admin/mfa/MFASetup.js` - Component setup MFA
- `client/src/components/admin/mfa/MFAPage.js` - Page wrapper
- `client/src/components/admin/mfa/FetchApi.js` - API functions
- `client/src/components/shop/auth/MFAVerification.js` - Component verify MFA khi login

---

## 📊 Lợi Ích Bảo Mật

### Mật Khẩu Mạnh
- ✅ Giảm nguy cơ bị brute force attack
- ✅ Bảo vệ khỏi dictionary attack
- ✅ Tuân thủ các tiêu chuẩn bảo mật (OWASP, NIST)

### Multi-Factor Authentication
- ✅ Bảo vệ tài khoản ngay cả khi mật khẩu bị lộ
- ✅ Tuân thủ yêu cầu bảo mật 2FA
- ✅ Tăng cường bảo mật cho tài khoản quản trị
- ✅ Sử dụng TOTP (Time-based OTP) - tiêu chuẩn công nghiệp

---

## 🎯 Kết Luận

Hệ thống đã được tích hợp đầy đủ các tính năng bảo mật:
1. ✅ Validation mật khẩu mạnh với indicator trực quan
2. ✅ Multi-Factor Authentication với TOTP
3. ✅ Giao diện thân thiện, dễ sử dụng
4. ✅ API endpoints đầy đủ cho quản lý MFA
5. ✅ Tích hợp vào admin dashboard

Các tính năng này giúp bảo vệ tài khoản quản trị khỏi các cuộc tấn công phổ biến và tuân thủ các tiêu chuẩn bảo mật hiện đại.

---

**Tài liệu này có thể được sử dụng để trình bày trong báo cáo về các biện pháp bảo mật đã triển khai.**













