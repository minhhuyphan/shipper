# � Shipper Admin Dashboard

Hệ thống quản lý back-office hoàn chỉnh cho nền tảng giao hàng với 4 module chính.

## 🎯 Chức Năng Chính

### 1. **Dashboard** 📊

- Xem tổng quan doanh thu, số đơn hàng
- Biểu đồ doanh số theo thời gian (hàng ngày, tuần, tháng)
- Danh sách tài xế đang hoạt động
- Thống kê số lượng đơn hàng
- Theo dõi hiệu suất giao hàng

### 2. **Quản Lý Đơn Hàng** 📋

- Danh sách tất cả đơn hàng với bộ lọc & tìm kiếm
- Xem chi tiết đơn hàng (địa chỉ, giá cước, tài xế, COD,...)
- Xem lịch sử trạng thái đơn hàng (timeline)
- Xử lý đơn hàng bị khiếu nại
- Lịch sử kiểm tra & audit log
- In thông tin đơn hàng

### 3. **Quản Lý Tài Xế** 👨‍💼

- Danh sách tài xế với trạng thái (duyệt, từ chối, khóa)
- Xem chi tiết profile tài xế
- Duyệt/từ chối đơn xin ứng tuyển
- Khóa/mở khóa tài khoản tài xế
- Xem lịch sử giao hàng của tài xế
- Xuất danh sách tài xế ra CSV

### 4. **Thanh Toán COD (Tiền Mặt)** 💵

- Quản lý tiền COD của từng tài xế
- Xem chi tiết các đơn hàng COD chưa thanh toán
- Ghi nhận tiền thanh toán từ tài xế
- Lịch sử giao dịch COD
- Báo cáo thanh toán COD
- Xuất báo cáo ra CSV

### 5. **Cấu Hình Giá Cước** 💰

- Tạo & chỉnh sửa bảng giá
- Tính giá cước theo khoảng cách
- Phí cơ bản & kinh phí khác
- Phiên bản giá (hiệu lực từ đến)
- Mô phỏng tính giá (test trước khi áp dụng)
- Lịch sử thay đổi giá cước

## 🔐 Tính Năng Bảo Mật

- **Xác thực JWT** — Token-based authentication
- **Phân quyền (RBAC)** — Admin & Staff roles
- **Mã hóa mật khẩu** — Bcrypt hashing
- **Validate dữ liệu** — Zod schema validation
- **Audit log** — Ghi nhận tất cả thay đổi

## 🏗️ Tech Stack

| Thành Phần           | Công Nghệ                    |
| -------------------- | ---------------------------- |
| **Runtime**          | Node.js 18+                  |
| **Server**           | Express.js, TypeScript       |
| **Database**         | MongoDB, Mongoose            |
| **Frontend**         | React 19, Vite, TailwindCSS  |
| **Realtime**         | Socket.IO                    |
| **API Docs**         | Swagger/OpenAPI              |
| **Validation**       | Zod                          |
| **State Management** | React Query (TanStack Query) |
| **Charts**           | ECharts                      |
| **Routing**          | React Router v7              |

## 🚀 Cài Đặt & Chạy

### Yêu Cầu

- Node.js 18+
- MongoDB (local hoặc remote)

### 1. Cấu Hình MongoDB

Chỉnh sửa `server/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/shipper-admin
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 2. Cài Đặt Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Khởi Chạy

```bash
# Terminal 1 - Backend (port 5000)
cd server
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

### 4. Truy Cập

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5000
- **API Docs (Swagger)**: http://localhost:5000/api-docs

### 5. Tài Khoản Mặc Định

```
Email: admin@shipper.local
Password: password123
```

## 📁 Cấu Trúc Project

```
shipper/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/         # Pages (Login, Dashboard, Orders, etc)
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # Auth context
│   │   ├── api/           # API services
│   │   └── assets/        # Images, fonts
│   └── vite.config.ts
│
├── server/                # Express Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── models/        # MongoDB schemas
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── utils/         # Utilities
│   │   ├── config/        # Configuration
│   │   └── index.ts       # Server entry
│   └── package.json
│
├── android/               # Android mobile app
├── docker-compose.yml     # Docker configuration
├── README.md              # This file
└── MOBILE_API_GUIDE.md    # Mobile API documentation
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` — Đăng nhập
- `POST /api/auth/logout` — Đăng xuất
- `POST /api/auth/refresh` — Làm mới token

### Orders

- `GET /api/orders` — Danh sách đơn hàng
- `GET /api/orders/:id` — Chi tiết đơn hàng
- `PUT /api/orders/:id` — Cập nhật đơn hàng
- `GET /api/orders/:id/timeline` — Lịch sử trạng thái

### Drivers

- `GET /api/drivers` — Danh sách tài xế
- `GET /api/drivers/:id` — Chi tiết tài xế
- `PATCH /api/drivers/:id/approve` — Duyệt tài xế
- `PATCH /api/drivers/:id/lock` — Khóa tài khoản

### Pricing

- `GET /api/pricing` — Danh sách bảng giá
- `POST /api/pricing` — Tạo bảng giá mới
- `PUT /api/pricing/:id` — Cập nhật bảng giá
- `POST /api/pricing/simulate` — Mô phỏng tính giá

### COD Settlement

- `GET /api/cod-settlement` — Danh sách thanh toán COD
- `POST /api/cod-settlement` — Ghi nhận tiền COD
- `GET /api/cod-settlement/report` — Báo cáo COD

### Statistics

- `GET /api/stats/revenue` — Thống kê doanh thu
- `GET /api/stats/orders` — Thống kê đơn hàng
- `GET /api/stats/drivers` — Thống kê tài xế

## 🔧 Phát Triển

### Build Production

```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

### Lint & Format

```bash
cd client
npm run lint
```

## 📚 Tài Liệu Bổ Sung

- [MOBILE_API_GUIDE.md](MOBILE_API_GUIDE.md) — API cho ứng dụng mobile tài xế
- [BACKEND_ANDROID_SETUP.md](BACKEND_ANDROID_SETUP.md) — Hướng dẫn cấu hình backend cho Android
- [API_FIXED_NOTES.md](API_FIXED_NOTES.md) — Ghi chú về các sửa chữa API

## 📞 Support

Liên hệ hỗ trợ kỹ thuật để được giúp đỡ.

---

**Phiên bản**: 1.0.0 | **Cập nhật**: Tháng 3, 2026
