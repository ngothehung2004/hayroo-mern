# Hướng Dẫn Chạy Project E-commerce MERN Stack

## 📋 Yêu Cầu Hệ Thống

Trước khi bắt đầu, bạn cần cài đặt:
- **Node.js** (phiên bản 14 trở lên) - [Tải tại đây](https://nodejs.org/)
- **MongoDB** (cài đặt local hoặc sử dụng MongoDB Atlas) - [Tải tại đây](https://www.mongodb.com/try/download/community)
- **npm** (đi kèm với Node.js) hoặc **yarn**

## 🚀 Các Bước Chạy Project

### Bước 1: Cài Đặt Dependencies

Mở terminal và chạy các lệnh sau:

#### 1.1. Cài đặt dependencies cho Client (Frontend)
```bash
cd "Bản sao nnkb/MERN_Stack_Project_Ecommerce_Hayroo/client"
npm install
```

#### 1.2. Cài đặt dependencies cho Server (Backend)
```bash
cd "Bản sao nnkb/MERN_Stack_Project_Ecommerce_Hayroo/server"
npm install
```

### Bước 2: Cấu Hình MongoDB

Bạn có 2 lựa chọn:

#### Lựa chọn A: Sử dụng MongoDB Local (Khuyến nghị cho development)

1. Đảm bảo MongoDB đã được cài đặt và đang chạy trên máy của bạn
2. MongoDB sẽ tự động tạo database `Ecommerce` khi chạy server

#### Lựa chọn B: Sử dụng MongoDB Atlas (Cloud)

1. Tạo tài khoản tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster mới
3. Lấy connection string (có dạng: `mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority`)

### Bước 3: Tạo File .env cho Server

Tạo file `.env` trong thư mục `server` với nội dung:

```env
# Database Connection
# Nếu dùng MongoDB local:
DATABASE=mongodb://localhost:27017/Ecommerce

# Nếu dùng MongoDB Atlas, thay bằng connection string của bạn:
# DATABASE=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority

# Server Port (mặc định là 8000)
PORT=8000

# Braintree Payment Gateway (Tùy chọn - cần cho tính năng thanh toán)
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key
```

**Lưu ý:** 
- Nếu bạn chỉ test local, có thể bỏ qua Braintree keys
- Nếu cần tính năng thanh toán, đăng ký tại [Braintree](https://www.braintreepayments.com/)

### Bước 4: Tạo File .env cho Client

Tạo file `.env` trong thư mục `client` với nội dung:

```env
REACT_APP_API_URL=http://localhost:8000
```

### Bước 5: Chạy Server (Backend)

Mở terminal thứ nhất và chạy:

```bash
cd "Bản sao nnkb/MERN_Stack_Project_Ecommerce_Hayroo/server"
npm run start:dev
```

Bạn sẽ thấy thông báo:
- `Database Connected Successfully` (nếu kết nối MongoDB thành công)
- `Server is running on 8000` (hoặc port bạn đã cấu hình)

### Bước 6: Chạy Client (Frontend)

Mở terminal thứ hai và chạy:

```bash
cd "Bản sao nnkb/MERN_Stack_Project_Ecommerce_Hayroo/client"
npm start
```

Ứng dụng sẽ tự động mở tại: **http://localhost:3000**

## ✅ Kiểm Tra

Sau khi chạy cả 2 terminal:
- ✅ Backend server chạy tại: `http://localhost:8000`
- ✅ Frontend client chạy tại: `http://localhost:3000`
- ✅ Database đã kết nối thành công

## 🔐 Tạo Tài Khoản Admin

Để tạo tài khoản admin:
1. Mở file `server/controller/auth.js`
2. Tìm phần `newUser` object
3. Đặt `role: 1` để tạo admin (mặc định `role: 0` là customer)
4. Đăng ký tài khoản mới qua giao diện web

## 📁 Cấu Trúc Thư Mục Upload

Các thư mục upload sẽ tự động được tạo khi chạy server:
- `server/public/uploads/products/` - Ảnh sản phẩm
- `server/public/uploads/categories/` - Ảnh danh mục
- `server/public/uploads/customize/` - Ảnh banner/customize

## ⚠️ Lưu Ý Quan Trọng

1. **Windows Users:** Script `start` trong client có thể cần chỉnh sửa. Nếu gặp lỗi với `NODE_OPTIONS=--openssl-legacy-provider`, bạn có thể:
   - Cài đặt `cross-env`: `npm install --save-dev cross-env`
   - Hoặc chạy trực tiếp: `react-scripts start`

2. **MongoDB không chạy:** Đảm bảo MongoDB service đang chạy trước khi start server

3. **Port đã được sử dụng:** Nếu port 3000 hoặc 8000 đã được sử dụng, bạn cần:
   - Thay đổi PORT trong file `.env` của server
   - Hoặc set `PORT=3001` cho client: `set PORT=3001 && npm start` (Windows) hoặc `PORT=3001 npm start` (Mac/Linux)

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "Database Not Connected"
- Kiểm tra MongoDB đã được cài đặt và đang chạy
- Kiểm tra connection string trong file `.env`
- Nếu dùng MongoDB Atlas, kiểm tra Network Access đã cho phép IP của bạn

### Lỗi: "Cannot find module"
- Xóa thư mục `node_modules` và file `package-lock.json`
- Chạy lại `npm install`

### Lỗi: "Port already in use"
- Đóng các ứng dụng đang sử dụng port đó
- Hoặc thay đổi port trong file `.env`

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
- Node.js version: `node --version` (nên >= 14)
- npm version: `npm --version`
- MongoDB version: `mongod --version`

---

**Chúc bạn chạy project thành công! 🎉**













