# Hướng Dẫn Kiểm Tra Secret Key MFA

## 🔍 Vấn Đề: Mã không khớp giữa Google Authenticator và Server

Nếu mã từ Google Authenticator không khớp với mã trên server, có thể do secret key không đồng bộ.

## ✅ Các Bước Kiểm Tra và Sửa

### Bước 1: Xóa MFA Cũ và Tạo Lại

1. **Xóa tài khoản MFA cũ trong Google Authenticator:**

   - Mở Google Authenticator
   - Tìm tài khoản "Hayroo E-commerce"
   - Xóa tài khoản đó

2. **Xóa MFA trong hệ thống (nếu có):**
   - Vào trang MFA Security
   - Click "Disable MFA" (nếu đã enable)
   - Hoặc đợi secret key cũ hết hạn

### Bước 2: Generate QR Code Mới

1. **Restart backend server** để áp dụng code mới:

   ```bash
   # Dừng server (Ctrl+C)
   cd server
   npm run start:dev
   ```

2. **Generate QR code mới:**
   - Vào trang MFA Security
   - Click "Enable MFA"
   - **Quan trọng:** Xem backend console logs, bạn sẽ thấy:
     ```
     === Generating New MFA Secret ===
     Secret (base32): [SECRET_KEY]
     Test token with new secret: [TOKEN]
     ```
   - **Ghi lại Secret Key** từ console logs

### Bước 3: Quét QR Code

1. **Mở Google Authenticator**
2. **Chọn "Scan QR code"**
3. **Quét QR code từ trang web**
4. **Kiểm tra:**
   - Tên hiển thị: "Hayroo E-commerce (your-email)"
   - Mã 6 số xuất hiện

### Bước 4: So Sánh Secret Key

**Cách 1: Sử dụng Manual Entry Key**

1. Trong Google Authenticator, chọn "Enter a setup key"
2. Nhập **Manual Entry Key** từ trang web (hiển thị dưới QR code)
3. Đảm bảo nhập đúng, không có khoảng trắng

**Cách 2: Kiểm tra Secret Key trong Database**

1. Xem backend console khi generate QR code
2. Secret key sẽ được log ra
3. So sánh với manual entry key trên trang web

### Bước 5: Test Token

1. **Lấy mã từ Google Authenticator**
2. **Xem mã trên server:**
   - Kiểm tra backend console logs
   - Hoặc gọi API: `GET /api/mfa/current-token` (cần đăng nhập)
3. **So sánh:**
   - Nếu giống nhau → Secret key đúng, có thể do thời gian
   - Nếu khác nhau → Secret key không khớp, cần quét lại

## 🔧 Debug Chi Tiết

### Kiểm Tra Backend Logs

Khi bạn generate QR code mới, backend sẽ log:

```
=== Generating New MFA Secret ===
User ID: ...
User Email: ...
Secret (base32): [SECRET_KEY_HERE]
Secret length: 32
OTPAuth URL: otpauth://totp/...
Test token with new secret: [TOKEN_HERE]
```

Khi bạn nhập mã để verify, backend sẽ log:

```
=== MFA Verification Debug ===
User ID: ...
Token received: [MÃ_BẠN_NHẬP]
Secret key (full): [SECRET_KEY_IN_DB]
Current server token: [MÃ_SERVER_TẠO]
Token match (exact): true/false
```

### So Sánh Secret Key

1. **Secret key từ QR code generation:**

   - Xem trong backend console khi generate
   - Hoặc trong response API (không nên log ra frontend vì bảo mật)

2. **Secret key trong Google Authenticator:**

   - Không thể xem trực tiếp
   - Nhưng có thể verify bằng cách so sánh mã

3. **Secret key trong database:**
   - Xem trong backend console logs khi verify
   - Hoặc query database trực tiếp

## ⚠️ Nguyên Nhân Phổ Biến

### 1. Quét Nhầm QR Code

- **Giải pháp:** Xóa tài khoản cũ, quét lại QR code mới

### 2. Secret Key Bị Thay Đổi

- **Nguyên nhân:** Generate QR code nhiều lần, secret key bị thay đổi
- **Giải pháp:** Luôn xóa tài khoản cũ trong Google Authenticator trước khi quét mới

### 3. Nhầm Tài Khoản

- **Nguyên nhân:** Có nhiều tài khoản MFA trong Google Authenticator
- **Giải pháp:** Xóa tất cả tài khoản cũ, chỉ giữ tài khoản mới nhất

### 4. Thời Gian Không Đồng Bộ

- **Nguyên nhân:** Thời gian trên server và điện thoại khác nhau
- **Giải pháp:** Đồng bộ thời gian tự động trên cả hai thiết bị

## 🎯 Quy Trình Đúng

1. ✅ Xóa tài khoản MFA cũ trong Google Authenticator
2. ✅ Generate QR code mới trên trang web
3. ✅ **Ghi lại Secret Key** từ backend console
4. ✅ Quét QR code bằng Google Authenticator
5. ✅ **So sánh mã** từ Google Authenticator với "Test token" trong console
6. ✅ Nếu giống nhau → Secret key đúng, nhập mã để verify
7. ✅ Nếu khác nhau → Secret key không khớp, quét lại

## 📝 Checklist

- [ ] Đã xóa tài khoản MFA cũ trong Google Authenticator
- [ ] Đã restart backend server
- [ ] Đã generate QR code mới
- [ ] Đã ghi lại Secret Key từ console
- [ ] Đã quét QR code bằng Google Authenticator
- [ ] Đã so sánh mã từ app với test token trong console
- [ ] Mã khớp nhau
- [ ] Đã nhập mã để verify thành công

## 🐛 Nếu Vẫn Không Khớp

1. **Kiểm tra backend console logs:**

   - Secret key khi generate
   - Secret key khi verify
   - So sánh xem có giống nhau không

2. **Thử Manual Entry:**

   - Thay vì quét QR code
   - Nhập manual key trực tiếp vào Google Authenticator
   - Đảm bảo nhập đúng, không có khoảng trắng

3. **Kiểm tra Database:**

   - Query database để xem secret key đã được lưu đúng chưa
   - So sánh với secret key trong console logs

4. **Liên hệ hỗ trợ:**
   - Gửi backend console logs
   - Gửi secret key (nếu có thể)
   - Mô tả các bước đã thực hiện

---

**Lưu ý:** Secret key là thông tin nhạy cảm, không nên chia sẻ công khai. Chỉ dùng để debug trong môi trường development.










