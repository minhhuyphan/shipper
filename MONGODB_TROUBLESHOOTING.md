# 🔧 MONGODB CONNECTION TROUBLESHOOTING

## ❌ Lỗi: `ECONNREFUSED _mongodb._tcp.cluster0.xxxxx.mongodb.net`

Lỗi này xuất hiện khi backend không thể kết nối tới MongoDB Atlas.

---

## 🔍 Bước 1: Kiểm Tra Cơ Bản

### 1.1 Kiểm Tra Internet Connection

```powershell
# Windows PowerShell
ping 8.8.8.8

# Hoặc kiểm tra DNS
nslookup cluster0.vkey5u6.mongodb.net
```

**Kết quả mong đợi:** 
```
Reply from 8.8.8.8: bytes=32 time=20ms TTL=119
```

Nếu không có reply → **Internet bị cắt hoặc DNS service down** ❌

---

### 1.2 Kiểm Tra MongoDB Atlas Cluster

1. Truy cập [MongoDB Atlas](https://cloud.mongodb.com)
2. Đăng nhập tài khoản
3. Vào **Clusters** → Tìm cluster `cluster0`
4. Kiểm tra status:
   - ✅ **Green (Available)** - Cluster hoạt động bình thường
   - ⏳ **Yellow (Building/Pausing)** - Chưa sẵn sàng
   - ❌ **Red (Error)** - Cluster bị lỗi

**Nếu trạng thái không xanh → Cluster cần được start/fix lại**

---

### 1.3 Kiểm Tra Connection String

Mở file `.env` trong thư mục `server`:

```env
MONGODB_URI=mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin
```

Kiểm tra:
- ✅ Username: `GoXpress` (có đúng không?)
- ✅ Password: `B9qjcDdF4LP1uK77` (có đúng không?)
- ✅ Cluster: `cluster0.vkey5u6` (environment còn hợp lệ không?)
- ✅ Database: `shipper-admin` (có được tạo không?)

**Nếu sai → Update lại connection string** ❌

---

## 🛡️ Bước 2: Kiểm Tra Firewall & IP Whitelist

### 2.1 MongoDB Atlas IP Whitelist

Đây là **lý do phổ biến nhất** gây lỗi `ECONNREFUSED` 🎯

**Cách fix:**

1. Truy cập [MongoDB Atlas](https://cloud.mongodb.com)
2. Vào **Network Access** (bên trái menu)
3. Click **"Add IP Address"**
4. Nhập IP công cộng của máy:
   - **Tùy chọn A:** Nhập IP cụ thể
   - **Tùy chọn B:** Nhập `0.0.0.0/0` (Allow all - ⚠️ chỉ dùng dev)

**Cách lấy IP công cộng:**

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri https://api.ipify.org -UseBasicParsing | Select-Object Content

# Hoặc truy cập
https://api.ipify.org
```

**Sẽ hiển thị IP public của bạn, ví dụ: `203.113.45.123`**

### 2.2 Kiểm Tra Windows Firewall

```powershell
# Tắt Windows Defender Firewall tạm thời (Dev only ⚠️)
netsh advfirewall set allprofiles state off

# Bật lại
netsh advfirewall set allprofiles state on
```

**Hoặc cho phép Node.js qua firewall:**

1. Mở **Windows Defender Firewall** → **Allow an app**
2. Tìm **Node.js** trong list
3. ✅ Tick vào cả **Private** và **Public**

---

## 🔐 Bước 3: Kiểm Tra Database User Credentials

Mở MongoDB Atlas, vào **Database Access** (menu trái):

1. Tìm user `GoXpress`
2. Kiểm tra:
   - ✅ Username đúng không?
   - ✅ Status: **Active** được không?
   - ✅ Password đúng không?

**Nếu mật khẩu sai hoặc expired → Edit user hoặc tạo user mới**

---

## 🧪 Bước 4: Test Connection Trực Tiếp

### Cách 1: Dùng MongoDB Compass (GUI)

1. Tải [MongoDB Compass](https://www.mongodb.com/products/tools/compass)
2. Mở Compass
3. Click **"New Connection"**
4. Paste connection string từ `.env`:
   ```
   mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin
   ```
5. Click **"Connect"**

**Kết quả:**
- ✅ Kết nối thành công → Problem ở backend code
- ❌ Kết nối thất bại → Problem ở MongoDB Atlas config

### Cách 2: Dùng MongoDB Shell

```powershell
# Cài MongoDB Shell (nếu chưa có)
# Windows: chạy MongoDB Installer hoặc download mongosh

mongosh "mongodb+srv://GoXpress:B9qjcDdF4LP1uK77@cluster0.vkey5u6.mongodb.net/shipper-admin"

# Nếu kết nối thành công:
# Sẽ thấy:
# > sh.status()
```

---

## 💡 Bước 5: Kiểm Tra Mạng Máy (Network Debug)

### Test DNS Resolution

```powershell
# Kiểm tra DNS có resolve được không
nslookup cluster0.vkey5u6.mongodb.net

# Kết quả mong đợi:
# Name:    cluster0.vkey5u6.mongodb.net
# Address: 52.xxx.xxx.xxx (MongoDB server IP)
```

### Test Packet Loss

```powershell
# Ping MongoDB Atlas server
ping cluster0.vkey5u6.mongodb.net

# Nếu không có reply:
# - Internet bị cắt
# - DNS không work
# - Firewall chặn
```

---

## 🚀 Bước 6: Cách Fix Theo Tình Huống

### ✅ **FIX 1:** IP Không Được Whitelist (Phổ Biến Nhất)

1. Mở [MongoDB Atlas](https://cloud.mongodb.com)
2. Vào **Network Access**
3. **Add IP Address** →  Input IP public hoặc `0.0.0.0/0`
4. Save
5. Chạy backend lại: `npm run dev`

---

### ✅ **FIX 2:** Username/Password Sai

1. MongoDB Atlas → **Database Access**
2. Edit user `GoXpress` → Reset password
3. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://GoXpress:NEW_PASSWORD@cluster0.vkey5u6.mongodb.net/shipper-admin
   ```
4. Chạy lại: `npm run dev`

---

### ✅ **FIX 3:** Cluster Không Hoạt Động

1. MongoDB Atlas → **Clusters**
2. Nếu cluster dừng → Click **Resume**
3. Chờ cluster sẵn sàng (green status)
4. Chạy lại: `npm run dev`

---

### ✅ **FIX 4:** Tạo Database Mới

Nếu vẫn lỗi, hãy tạo cluster mới:

1. MongoDB Atlas → **Create** → **Build a Database**
2. Chọn **Free** tier
3. Chọn **AWS** region gần bạn
4. Tạo cluster (chờ ~3 phút)
5. **Connect** → Copy connection string → Update `.env`
6. Chạy lại: `npm run dev`

---

### ✅ **FIX 5:** Dùng Local MongoDB (Fallback)

Nếu MongoDB Atlas vẫn không hoạt động, dùng local:

**Cách 1: Dùng Docker**

```powershell
docker run -d `
  --name mongodb-local `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 `
  mongo:latest

# Update .env
# MONGODB_URI=mongodb://admin:admin123@localhost:27017/shipper-admin?authSource=admin

npm run dev
```

**Cách 2: Cài MongoDB Local**

1. Tải [MongoDB Community](https://www.mongodb.com/try/download/community)
2. Cài đặt
3. Update `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/shipper-admin
   ```
4. Chạy: `npm run dev`

---

## 📋 Checklist Debug

Chạy từ trên xuống:

- [ ] Internet có kết nối không? → `ping 8.8.8.8`
- [ ] MongoDB Cluster hoạt động không? → Check MongoDB Atlas UI
- [ ] IP được whitelist không? → Add IP vào MongoDB Atlas **Network Access**
- [ ] Username/Password đúng không? → Check `.env` vs MongoDB Atlas
- [ ] Test kết nối direct? → Dùng MongoDB Compass hoặc mongosh
- [ ] DNS work không? → `nslookup cluster0.vkey5u6.mongodb.net`
- [ ] Windows Firewall chặn không? → Allow Node.js hoặc tắt firewall (dev only)

---

## 📞 Nếu Vẫn Không Fix Được

Ghi nhận thông tin và liên hệ:

1. **Error message** (copy toàn bộ)
2. **IP public** của máy (từ `https://api.ipify.org`)
3. **Cluster status** trong MongoDB Atlas (xanh hay đỏ?)
4. **Database user status** (active hay inactive?)
5. **Connection string** trong `.env`

---

## 🌍 Ngoài Lề: Gửi Code Cho Người Khác

Khi gửi code, **NÊN:**
- ✅ Gửi `.env.example` (có hướng dẫn)
- ✅ Gửi `MONGODB_TROUBLESHOOTING.md` (file này)
- ✅ Nói rõ **MongoDB URI họ cần dùng**
- ✅ Nói rõ **IP whitelist cần add** (hoặc "allow all" cho dev)

**KHÔNG nên:**
- ❌ Gửi `.env` (có credentials real)
- ❌ Để người khác tự debug MongoDB Atlas config

---

**Good luck! 🎉**
