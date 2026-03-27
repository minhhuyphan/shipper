# 🚀 HƯỚNG DẪN SETUP BACKEND CHO NGƯỜI KHÁC

Hướng dẫn này giúp bạn setup và chạy backend shipper-admin trên máy tính của mình.

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: 18.0 trở lên ([Tải tại nodejs.org](https://nodejs.org))
- **MongoDB**: Một trong các tùy chọn dưới
- **Terminal/PowerShell**: Để chạy lệnh

---

## 🗄️ Bước 1: Setup MongoDB

Chọn **một trong 3 tùy chọn** sau:

### ✅ Tùy Chọn 1: MongoDB Cloud (Atlas) - ⭐ **RECOMMENDED**

**Ưu điểm:** 
- Không cần cài gì thêm
- Tự động backup & bảo mật
- Miễn phí 512MB cho dự án nhỏ

**Các bước:**

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Đăng ký tài khoản miễn phí
3. Tạo organization & project
4. Click **"Create"** → **"Build a Database"**
5. Chọn **Free** tier
6. Chọn **AWS** và region gần bạn nhất (ví dụ: Singapore)
7. Tạo cluster (chờ 2-3 phút)
8. Đợi cluster sẵn sàng, click **"Connect"**
9. Chọn **Drivers** → **NodeJS** → Copy connection string

```
Sẽ có kết quả tương tự:
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shipper-admin?retryWrites=true&w=majority
```

10. Trong file `.env`, paste connection string vào `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shipper-admin
```

---

### ✅ Tùy Chọn 2: Docker (MongoDB Container)

**Yêu cầu:** Docker Desktop phải được cài trước

**Chạy MongoDB trong Docker:**

```powershell
docker run -d `
  --name mongodb `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 `
  mongo:latest
```

**Cấu hình `.env`:**

```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/shipper-admin?authSource=admin
```

**Kiểm tra MongoDB đang chạy:**

```powershell
docker ps
```

---

### ✅ Tùy Chọn 3: MongoDB Local (Windows)

**Tải & cài:**

1. Tải [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
2. Cài đặt với **MongoDB Compass** (giao diện quản lý)
3. MongoDB tự động chạy ở port `27017`

**Cấu hình `.env` (không có user/password nếu để mặc định):**

```env
MONGODB_URI=mongodb://localhost:27017/shipper-admin
```

---

## ⚙️ Bước 2: Cấu Hình Backend

### 2.1 Copy file cấu hình

```powershell
cd server
copy .env.example .env
```

### 2.2 Chỉnh sửa `.env`

Mở file `server/.env` và điền đầy đủ thông tin:

```env
# === MONGODB CONNECTION ===
# Chọn connection string từ tùy chọn MongoDB ở Bước 1
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/shipper-admin

# === SERVER CONFIG ===
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# === JWT SECURITY ===
JWT_SECRET=your-super-secret-jwt-key-change-me-in-production
JWT_EXPIRES_IN=7d

# === OPTIONAL: CORS ===
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://10.0.2.2:5000
```

**Giải thích từng biến:**

| Biến | Ý Nghĩa | Ví Dụ |
|------|---------|-------|
| `MONGODB_URI` | Kết nối database | `mongodb://localhost:27017/shipper-admin` |
| `PORT` | Port server chạy | `5000` |
| `NODE_ENV` | Môi trường chạy | `development` hoặc `production` |
| `CLIENT_URL` | URL frontend (React) | `http://localhost:5173` |
| `JWT_SECRET` | Khóa bảo mật token | Chuỗi bất kỳ (càng dài càng tốt) |
| `JWT_EXPIRES_IN` | Thời gian token hết hạn | `7d` = 7 ngày |

---

## 📦 Bước 3: Cài Đặt Dependencies

```powershell
cd server
npm install
```

Chờ cài xong (2-5 phút).

---

## ▶️ Bước 4: Chạy Backend

### Chế độ Development (tự reload khi code thay đổi):

```powershell
npm run dev
```

**Kết quả thành công:**

```
[INFO] Server running on http://localhost:5000
[INFO] Connected to MongoDB
[INFO] Swagger API docs at http://localhost:5000/api-docs
```

### Hoặc Build + Run Production:

```powershell
npm run build
npm start
```

---

## ✅ Bước 5: Kiểm Tra Backend Hoạt Động

### Cách 1: Mở Swagger UI (Dễ nhất)

1. Mở trình duyệt
2. Truy cập: `http://localhost:5000/api-docs`
3. Thử gọi API `/api/auth/seed` để tạo tài khoản test

### Cách 2: Dùng cURL

```powershell
# Kiểm tra server có sống không
curl http://localhost:5000/api/health

# Hoặc dùng PowerShell
Invoke-WebRequest -Uri http://localhost:5000/api/health
```

### Cách 3: Mở Frontend (React)

Mở terminal khác:

```powershell
cd client
npm install
npm run dev
```

Truy cập: `http://localhost:5173` → Đăng nhập test

---

## 🔧 Troubleshooting

### ❌ Lỗi: "Could not connect to MongoDB"

**Kiểm tra:**

1. ✅ MongoDB có đang chạy không?
   - Nếu dùng **Atlas**: Kiểm tra internet connection
   - Nếu dùng **Docker**: `docker ps` có thấy mongodb không?
   - Nếu dùng **Local**: MongoDB service có chạy không?

2. ✅ Connection string có đúng không?
   - Mở `server/.env` → kiểm tra `MONGODB_URI`
   - Nếu dùng **Atlas**: Username/password phải đúng
   - Nếu dùng local: Phải là `mongodb://localhost:27017/...`

3. ✅ Firewall/Network có chặn không?
   - Nếu dùng **Atlas**: MongoDB Atlas phải thêm IP của bạn vào whitelist (chọn "Allow Access from Anywhere" nếu dev)

**Cách debug:**

```powershell
# Test kết nối MongoDB
npm run dev

# Xem chi tiết logs
```

---

### ❌ Lỗi: "Port 5000 already in use"

Thay đổi PORT trong `.env`:

```env
PORT=5001
```

Hoặc kill process đang dùng port 5000:

```powershell
# Tìm process
netstat -ano | findstr :5000

# Kill process (thay PID)
taskkill /PID 1234 /F
```

---

### ❌ Lỗi: "Cannot find module 'xxx'"

Cài đặt dependencies lại:

```powershell
cd server
rm -r node_modules
npm install
```

---

## 🌐 Setup Frontend (Tùy Chọn)

Nếu muốn chạy cả giao diện web:

```powershell
cd client
npm install
npm run dev
```

Truy cập: `http://localhost:5173`

**Tài khoản test (sau khi chạy seed):**
- Email: `admin@example.com`
- Mật khẩu: `password123`

---

## 📚 API Endpoints Chính

| Method | Endpoint | Mô Tả |
|--------|----------|--------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/seed` | Tạo dữ liệu test |
| GET | `/api/orders` | Danh sách đơn hàng |
| GET | `/api/orders/:id` | Chi tiết đơn hàng |
| GET | `/api/drivers` | Danh sách tài xế |
| GET | `/api/stats` | Thống kê |

Xem tất cả API tại: `http://localhost:5000/api-docs`

---

## 🛠️ Một Số Lệnh Hữu Ích

```powershell
# Phát triển
npm run dev

# Build production
npm run build

# Chạy production
npm start

# Tạo dữ liệu test
npm run seed

# Kiểm tra code
npm run lint
```

---

## 📞 Cần Giúp?

1. **Kiểm tra logs:** Xem thông báo lỗi trong terminal
2. **Swagger API:** `http://localhost:5000/api-docs` → Thử các API
3. **GitHub Issues:** Nếu lỗi vẫn tiếp tục

---

## ✨ Bước Tiếp Theo (Nếu Đã Setup Thành Công)

- [ ] Làm quen với codebase
- [ ] Chạy frontend test
- [ ] Đọc [MOBILE_API_GUIDE.md](./MOBILE_API_GUIDE.md) nếu cần integrate Android/Mobile
- [ ] Đọc [API_FIXED_NOTES.md](./API_FIXED_NOTES.md) để biết các fix/improvement gần đây

---

**Happy coding! 🎉**
