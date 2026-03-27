# 📧 Hướng Dẫn Cấu Hình "Quên Mật Khẩu" (Email Reset)

## 🎯 Tính Năng Mới

- **ForgotPasswordPage**: Người dùng nhập email để nhận link đặt lại mật khẩu
- **ResetPasswordPage**: Người dùng mở link từ email, nhập mật khẩu mới
- **Backend**: 2 endpoints `/auth/forgot-password` và `/auth/reset-password`
- **Email**: Gửi qua Nodemailer (hỗ trợ Mailtrap để test, SendGrid/SMTP cho production)

---

## 📝 Backend Setup

### 1. Cài Package `nodemailer`

```bash
cd server
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. Cập nhật `.env` (server/.env)

#### Option A: Dùng Mailtrap (để Test)

**Mailtrap là dịch vụ test email miễn phí, không gửi email thực, chỉ capture để kiểm tra.**

1. Đăng ký tài khoản miễn phí tại: https://mailtrap.io/
2. Tạo project & inbox
3. Copy SMTP credentials từ Mailtrap dashboard
4. Thêm vào `.env`:

```env
# Email Configuration (Mailtrap - for testing)
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_password
MAIL_FROM=noreply@goxpress.com

# Existing configs
MONGODB_URI=...
JWT_SECRET=...
CLIENT_URL=http://localhost:5173
```

#### Option B: Dùng SendGrid (Production)

**SendGrid là dịch vụ email production-ready.**

1. Đăng ký tài khoản tại: https://sendgrid.com/
2. Tạo API key
3. Cấu hình trong `.env`:

```env
# Email Configuration (SendGrid)
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey  # Luôn là "apikey"
MAIL_PASS=SG.your_sendgrid_api_key
MAIL_FROM=noreply@goxpress.com
```

#### Option C: Dùng Gmail SMTP

**⚠️ Lưu ý: Gmail yêu cầu "App Password" nếu bật 2FA.**

1. Bật 2-factor authentication trên Gmail
2. Tạo App Password tại: https://myaccount.google.com/apppasswords
3. Cấu hình trong `.env`:

```env
# Email Configuration (Gmail)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password  # NOT your Gmail password, use App Password
MAIL_FROM=your_email@gmail.com
```

### 3. Kiểm Tra Database Schema

**User.ts đã được cập nhật với các trường mới:**

```typescript
resetTokenHash: String; // Hash của token (không lưu plain token)
resetTokenExpiry: Date; // Thời gian hết hạn (1h)
```

---

## 🌐 Frontend Setup

### 1. Pages Mới

- **`client/src/pages/ForgotPasswordPage.tsx`**: Nhập email
- **`client/src/pages/ResetPasswordPage.tsx`**: Đặt lại mật khẩu (lấy email + token từ URL)
- **`client/src/App.tsx`**: Đã thêm routes `/forgot-password` và `/reset-password`

### 2. UI Updates

- **LoginPage**: Thêm nút "Quên mật khẩu?" → navigate tới ForgotPasswordPage

---

## 🧪 Test End-to-End

### Step 1: Chuẩn Bị

```bash
# Terminal 1: Start backend
cd server
npm install
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### Step 2: Test Forgot Password

1. Vào http://localhost:5173/login
2. Bấm nút "Quên mật khẩu?"
3. Nhập email (ví dụ: admin@shipper.com)
4. Bấm "Gửi Link Đặt Lại"

**Expected**: Toast "Email đã được gửi" → page redirect về login

### Step 3: Kiểm Tra Email (Mailtrap)

1. Vào https://mailtrap.io/
2. Vào inbox của project
3. Xem email vừa nhận
4. Copy link reset hoặc click nó (sẽ mở http://localhost:5173/reset-password?email=...&token=...)

### Step 4: Test Reset Password

1. Mở link từ email (hoặc đi http://localhost:5173/reset-password)
2. Nhập mật khẩu mới lần 1
3. Nhập mật khẩu mới lần 2 (xác nhận)
4. Bấm "Đặt Lại Mật Khẩu"

**Expected**: Toast success → redirect về login → login bằng mật khẩu mới

---

## 🔒 Bảo Mật

✅ **Đã implement:**

- Token hash (không lưu plain token)
- Token expiry 1 giờ
- Generic response (/forgot-password) tránh user enumeration
- Xoá token sau khi sử dụng thành công

### ⚠️ Khuyến Nghị Bổ Sung (Optional)

- [ ] Rate limit: 3 request/giờ/user (dùng `express-rate-limit`)
- [ ] Log failed reset attempts
- [ ] IP-based rate limiting

---

## 📚 API Endpoints

### POST `/api/auth/forgot-password`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (always 200, generic):**

```json
{
  "ok": true,
  "message": "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi."
}
```

**Email Content:**

- Tiêu đề: `[GoXpress] Yêu cầu đặt lại mật khẩu`
- Body: Link reset + token + expiry info
- Fallback: Admin có thể paste token vào UI nếu click link không hoạt động

---

### POST `/api/auth/reset-password`

**Request:**

```json
{
  "email": "user@example.com",
  "token": "plaintext_token_from_email",
  "newPassword": "new_password_123"
}
```

**Response (on success):**

```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

**Response (on failure, 400):**

```json
{
  "ok": false,
  "error": "Token has expired" / "Invalid token" / "Invalid or expired token"
}
```

---

## 📂 Files Changed/Created

### Backend

- ✅ `server/src/models/User.ts` — Added resetTokenHash, resetTokenExpiry
- ✅ `server/src/services/authService.ts` — Added forgotPassword(), resetPassword()
- ✅ `server/src/services/mailer.ts` — Email service (Nodemailer)
- ✅ `server/src/routes/auth.ts` — Added /forgot-password, /reset-password endpoints
- ✅ `server/package.json` — Added nodemailer dependency

### Frontend

- ✅ `client/src/pages/ForgotPasswordPage.tsx` — Forgot password form
- ✅ `client/src/pages/ResetPasswordPage.tsx` — Reset password form (URL param recovery)
- ✅ `client/src/pages/LoginPage.tsx` — Added "Forgot password?" link
- ✅ `client/src/App.tsx` — Added routes for forgot/reset pages

---

## 🚀 Production Checklist

- [ ] Cấu hình SMTP/SendGrid credentials trong `.env`
- [ ] Set `CLIENT_URL` đúng với domain production
- [ ] Set `MAIL_FROM` tới địa chỉ hợp lệ
- [ ] Test end-to-end trên production (hoặc staging)
- [ ] Monitor email delivery (SendGrid dashboard)
- [ ] Log password reset events (optional, enhances security audit)
- [ ] Add rate limiting (optional, prevents abuse)
- [ ] Test email link trên mobile (deep link hoặc web link)

---

## 🐛 Troubleshooting

### Email không được gửi

- [ ] Kiểm tra MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
- [ ] Test SMTP connection: `npm run dev` sẽ log "✅ Mail transporter is ready"
- [ ] Kiểm tra inbox Mailtrap/SendGrid

### Token hết hạn quá nhanh

- [ ] Token expiry được set 1 giờ, xem `authService.ts` line: `new Date(Date.now() + 60 * 60 * 1000)`
- [ ] Nếu muốn đổi, sửa `* 60` (60 phút)

### Email link không mở app/website

- [ ] Kiểm tra CLIENT_URL trong `.env`
- [ ] Nếu dùng deep link Android, cấu hình intent-filter đúng

---

## ✨ Próximas Melhorias (Future)

- [ ] 2FA email verification
- [ ] Password strength meter
- [ ] Resend email button (với rate limit)
- [ ] Android deep link support (khi Android team sẵn sàng)
- [ ] Email templates (HTML beautification)

---

**Created**: March 18, 2026  
**Status**: ✅ Ready for testing
