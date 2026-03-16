# 🚀 BACKEND SETUP CHO ANDROID APP

## Bước C: Cấu hình Backend cho Android

### 1️⃣ CORS Configuration (Mở cửa cho Android)

#### Vấn đề:
- Backend chỉ cho phép request từ `http://localhost:5173` (Web Frontend)
- Android app gửi request từ địa chỉ khác → bị chặn CORS

#### Giải pháp:
Backend đã được cấu hình để hỗ trợ multiple origins:

```typescript
// server/src/index.ts
app.use(cors({ 
    origin: config.allowedOrigins,  // Mảng origins được phép
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

#### Cấu hình `.env`:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://10.0.2.2:5000,http://192.168.1.*
```

**Giải thích:**
- `http://localhost:5173` - Web Frontend (React)
- `http://localhost:3000` - Backend server local
- `http://10.0.2.2:5000` - Android Emulator (alias localhost)
- `http://192.168.1.*` - Physical device (IP máy tính)

---

### 2️⃣ JWT Authentication Setup

#### Authentication Flow:

```
┌─────────────────────────────────────────────────────────┐
│  1. Android App Login                                   │
│     POST /api/auth/login                                │
│     { email, password }                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  2. Backend Generate JWT Token                          │
│     const token = jwt.sign({id, role}, secret,          │
│       { expiresIn: '7d' })                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  3. Return Token to Android                             │
│     { token, user: {...} }                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  4. Android App Lưu Token vào SharedPreferences         │
│     (hoặc EncryptedSharedPreferences)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  5. Mọi request sau gửi Authorization Header           │
│     Authorization: Bearer <token>                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  6. Backend Verify Token và Tiếp tục                    │
│     const decoded = jwt.verify(token, secret)          │
│     const user = findUser(decoded.id)                  │
└─────────────────────────────────────────────────────────┘
```

#### JWT Configuration (`.env`):
```env
JWT_SECRET=your-super-secret-key-must-change-in-production
JWT_EXPIRES_IN=7d
```

⚠️ **IMPORTANT**: 
- Thay đổi `JWT_SECRET` trước khi deploy production
- Giữ bí mật `JWT_SECRET` (không commit vào Git)

---

### 3️⃣ Authentication Middleware

Backend hỗ trợ 2 cách gửi token (cho Android linh hoạt):

```typescript
// Cách 1: Standard HTTP Header
Authorization: Bearer eyJhbGc...

// Cách 2: Custom Header (nếu Android dùng)
x-auth-token: eyJhbGc...
```

```typescript
// server/src/middleware/auth.ts
export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') 
                  || req.header('x-auth-token');
    
    if (!token) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    
    req.user = user;
    next();
};
```

---

### 4️⃣ Local Development Setup

#### 🖥️ Máy tính development:

1. **Clone project:**
   ```bash
   cd d:\shipper\server
   ```

2. **Tạo `.env` từ `.env.example`:**
   ```bash
   cp .env.example .env
   ```

3. **Cơ bản `.env` cho local:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/shipper-admin
   JWT_SECRET=dev-secret-key-only
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://10.0.2.2:5000,http://192.168.1.100
   ```

4. **Run backend:**
   ```bash
   npm install
   npm run dev
   ```

#### 📱 Android Emulator:
- Truy cập: `http://10.0.2.2:5000`
- `10.0.2.2` = localhost alias trong emulator

#### 📱 Physical Device (cùng Wi-Fi):
- Tìm IP máy tính: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
- Ví dụ: `192.168.1.100`
- Android truy cập: `http://192.168.1.100:5000`

---

### 5️⃣ API Endpoints cho Android

#### Authentication:
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "driver@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f...",
    "email": "driver@example.com",
    "name": "Tài xế",
    "role": "driver"
  }
}
```

#### Get User Info (Protected):
```
GET /api/auth/me
Authorization: Bearer eyJhbGc...

Response:
{
  "user": {
    "id": "507f...",
    "email": "driver@example.com",
    "name": "Tài xế",
    "role": "driver"
  }
}
```

#### Update Driver Location (Protected):
```
PATCH /api/admin/drivers/{id}/location
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "latitude": 10.7769,
  "longitude": 106.7009,
  "status": "online"
}
```

---

### 6️⃣ Testing với Postman

1. **Import vào Postman:**
   - File: `server/swagger.ts` hoặc truy cập `http://localhost:5000/api-docs`

2. **Set up Environment trong Postman:**
   ```
   {
     "base_url": "http://localhost:5000",
     "token": "{{token_từ_login_response}}"
   }
   ```

3. **Test Login:**
   ```
   POST http://localhost:5000/api/auth/login
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```

4. **Set token từ response:**
   - Copy `token` từ response
   - Paste vào Postman Environment: `token`

5. **Test Protected Endpoint:**
   ```
   GET http://localhost:5000/api/auth/me
   Headers:
     Authorization: Bearer {{token}}
   ```

---

### 7️⃣ Production Deployment

#### ☁️ Hosting Options:
1. **Heroku** - Dễ nhất
2. **Railway** - Tương tự Heroku
3. **DigitalOcean** - Rẻ hơn
4. **AWS EC2** - Mạnh mẽ nhất

#### Environment Variables Production:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/shipper-prod
JWT_SECRET=your-very-long-secret-key-12345...
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

#### HTTPS/SSL:
- Let's Encrypt (miễn phí)
- AWS Certificate Manager (miễn phí trên AWS)

---

### 8️⃣ Troubleshooting

#### ❌ CORS Error trên Android:
```
Access to XMLHttpRequest at 'http://...' from origin 'http://...' 
has been blocked by CORS policy
```

**Giải pháp:**
- Kiểm tra `ALLOWED_ORIGINS` trong `.env`
- Đảm bảo Android gửi từ IP được liệt kê
- Check backend logs: `🔌 [IP] GET /api/...`

#### ❌ Token Expired Error:
```json
{ "error": "Token expired" }
```

**Giải pháp:**
- Login lại để lấy token mới
- Hoặc tăng `JWT_EXPIRES_IN` nếu cần

#### ❌ 401 Unauthorized:
```json
{ "error": "Access denied. No token provided." }
```

**Giải pháp:**
- Kiểm tra header: `Authorization: Bearer <token>`
- Không thiếu `Bearer ` prefix
- Token phải hợp lệ (chưa hết hạn)

---

## ✅ Checklist Hoàn Thành

- [ ] CORS cấu hình cho multiple origins
- [ ] JWT_SECRET được set trong `.env` (không `default-secret`)
- [ ] `.env` file không bị commit (thêm vào `.gitignore`)
- [ ] Backend test locally với Postman
- [ ] Android app cấu hình đúng base URL
- [ ] Token được lưu trong SharedPreferences trên Android
- [ ] Protected endpoints hoạt động với Authorization header
- [ ] Real-time tracking (Socket.IO) được test

---

## 📚 Tài Liệu Thêm

- [Express CORS](https://github.com/expressjs/cors)
- [JWT Guide](https://jwt.io/)
- [Android Retrofit](https://square.github.io/retrofit/)
- [Socket.IO Client Android](https://socket.io/docs/v4/socket-io-client-android/)

