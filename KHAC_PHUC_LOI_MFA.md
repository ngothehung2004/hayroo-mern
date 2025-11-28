# Khắc Phục Lỗi MFA Verification

## 🔍 Vấn Đề: "Mã thông báo không hợp lệ"

Nếu bạn nhận được lỗi này khi nhập mã từ Google Authenticator, hãy thử các bước sau:

### ✅ Giải Pháp 1: Kiểm Tra Thời Gian

**Nguyên nhân phổ biến nhất:** Thời gian trên server và điện thoại không đồng bộ.

**Cách khắc phục:**
1. Đảm bảo thời gian trên điện thoại đã được cài đặt tự động (Auto time)
2. Đảm bảo thời gian trên máy tính/server đã được đồng bộ
3. Nếu dùng Windows: Settings → Time & Language → Sync now
4. Nếu dùng Mac: System Preferences → Date & Time → Set time zone automatically

### ✅ Giải Pháp 2: Nhập Mã Mới

Mã TOTP thay đổi mỗi 30 giây. Hãy:
1. Đợi mã mới xuất hiện trên Google Authenticator
2. Nhập mã mới ngay lập tức (trong vòng 30 giây)
3. Không nhập mã đã cũ

### ✅ Giải Pháp 3: Kiểm Tra Secret Key

Có thể secret key không được lưu đúng. Hãy:
1. Xóa MFA hiện tại (nếu có)
2. Generate lại QR code mới
3. Quét lại QR code bằng Google Authenticator
4. Đảm bảo quét đúng QR code (không bị mờ, không bị che)

### ✅ Giải Pháp 4: Sử Dụng Manual Entry Key

Thay vì quét QR code, thử nhập manual key:
1. Trong Google Authenticator, chọn "Enter a setup key"
2. Nhập manual key từ trang setup
3. Đảm bảo nhập đúng, không có khoảng trắng

### ✅ Giải Pháp 5: Kiểm Tra Console Logs

Kiểm tra console của backend để xem thông tin debug:
1. Mở terminal chạy backend server
2. Xem logs khi bạn nhập mã
3. Kiểm tra:
   - Secret key có tồn tại không
   - Token được nhận là gì
   - Token mong đợi là gì

### ✅ Giải Pháp 6: Tăng Window Verification

Đã được cập nhật trong code:
- Window đã được tăng từ 2 lên 5 time steps (150 giây)
- Cho phép sai lệch thời gian lớn hơn

### 🔧 Debug Steps

1. **Kiểm tra backend logs:**
   ```bash
   # Trong terminal chạy backend, bạn sẽ thấy:
   Verifying MFA token: { userId: '...', token: '...', ... }
   MFA verification result: true/false
   Current expected token: '...'
   Provided token: '...'
   ```

2. **So sánh token:**
   - Token từ Google Authenticator
   - Token mong đợi từ server (trong logs)
   - Nếu khác nhau → vấn đề về thời gian hoặc secret key

3. **Test với mã hiện tại:**
   - Lấy mã từ Google Authenticator
   - Nhập ngay lập tức
   - Nếu vẫn lỗi, thử mã tiếp theo (đợi 30 giây)

### 📱 Hướng Dẫn Sử Dụng Google Authenticator

1. **Tải ứng dụng:**
   - iOS: App Store → Google Authenticator
   - Android: Google Play → Google Authenticator

2. **Thêm tài khoản:**
   - Mở ứng dụng
   - Chọn "+" hoặc "Add account"
   - Chọn "Scan QR code"
   - Quét QR code từ trang web

3. **Lấy mã:**
   - Mã 6 số sẽ hiển thị
   - Mã tự động thay đổi mỗi 30 giây
   - Nhập mã ngay khi thấy

### ⚠️ Lưu Ý Quan Trọng

1. **Thời gian đồng bộ:** Đây là yêu cầu quan trọng nhất
2. **Mã mới:** Luôn sử dụng mã mới nhất
3. **Không có khoảng trắng:** Đảm bảo mã không có khoảng trắng
4. **Secret key:** Phải giống nhau giữa server và app

### 🐛 Nếu Vẫn Lỗi

1. Kiểm tra backend console để xem logs
2. So sánh token từ app và token mong đợi
3. Thử generate lại QR code và quét lại
4. Kiểm tra xem có nhiều tài khoản MFA trong app không (có thể nhầm)

### 📞 Thông Tin Debug

Khi báo lỗi, hãy cung cấp:
- Thời gian trên điện thoại
- Thời gian trên server
- Token bạn nhập
- Token mong đợi (từ backend logs)
- Secret key (nếu có thể)

---

**Sau khi áp dụng các giải pháp trên, hãy thử lại. Nếu vẫn lỗi, kiểm tra backend logs để xem chi tiết.**











