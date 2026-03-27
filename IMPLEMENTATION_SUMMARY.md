B# ✅ "Quên Mật Khẩu" - Triển Khai Hoàn Tất

**Thời gian**: March 18, 2026  
**Trạng thái**: ✅ Sẵn sàng test  
**Ngôn ngữ**: Backend (Node.js/TypeScript) + Frontend (React/TypeScript)

---

## 🎯 Tóm Tắt Chức Năng

Người dùng quên mật khẩu → nhập email → nhận email với link → mở link → đặt lại mật khẩu mới → đăng nhập lại.

**Luồng An Toàn:**

- Token hash (không lưu plain) ✅
- Token expiry 1h ✅
- Generic response (tránh user enumeration) ✅
- Xoá token sau dùng ✅

---

## 📦 Files Tạo/Cập Nhật

### Backend (`server/`)

| File                          | Thay Đổi                                   | Status |
| ----------------------------- | ------------------------------------------ | ------ |
| `src/models/User.ts`          | Thêm `resetTokenHash`, `resetTokenExpiry`  | ✅     |
| `src/services/authService.ts` | Thêm `forgotPassword()`, `resetPassword()` | ✅     |
| `src/services/mailer.ts`      | **[NEW]** Email service (Nodemailer)       | ✅     |
| `src/routes/auth.ts`          | Thêm `/forgot-password`, `/reset-password` | ✅     |
| `package.json`                | Thêm `nodemailer`                          | ✅     |

### Frontend (`client/`)

| File                               | Thay Đổi                                          | Status |
| ---------------------------------- | ------------------------------------------------- | ------ |
| `src/pages/ForgotPasswordPage.tsx` | **[NEW]** Nhập email                              | ✅     |
| `src/pages/ResetPasswordPage.tsx`  | **[NEW]** Đặt lại mật khẩu (từ email link)        | ✅     |
| `src/pages/LoginPage.tsx`          | Thêm nút "Quên mật khẩu?"                         | ✅     |
| `src/App.tsx`                      | Thêm routes `/forgot-password`, `/reset-password` | ✅     |

### Documentation

| File                        | Mục Đích               | Status |
| --------------------------- | ---------------------- | ------ |
| `FORGOT_PASSWORD_SETUP.md`  | Hướng dẫn setup + test | ✅     |
| `IMPLEMENTATION_SUMMARY.md` | File này               | ✅     |

---

## 🚀 Cách Sử Dụng

### 1️⃣ Cấu Hình Email (.env)

Chọn **1** trong 3 option:

**Option A: Mailtrap (Recommended for Testing)**

```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_password
MAIL_FROM=noreply@goxpress.com
```

**Option B: SendGrid (Production)**

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASS=SG.your_sendgrid_api_key
MAIL_FROM=noreply@goxpress.com
```

**Option C: Gmail SMTP**

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=your_email@gmail.com
```

### 2️⃣ Cài Dependencies

```bash
# Backend
cd server
npm install  # nodemailer + @types/nodemailer đã thêm vào package.json

# Frontend (không cần cài gì mới)
cd client
npm install
```

### 3️⃣ Start Services

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

### 4️⃣ Test

1. Vào http://localhost:5173/login
2. Bấm "Quên mật khẩu?"
3. Nhập email
4. Kiểm tra email (Mailtrap inbox)
5. Mở link hoặc copy token
6. Đặt lại mật khẩu
7. Login bằng mật khẩu mới

---

## 📊 API Endpoints

### POST `/api/auth/forgot-password`

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**Response:**

```json
{
  "ok": true,
  "message": "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi."
}
```

### POST `/api/auth/reset-password`

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "token":"plaintext_token_from_email",
    "newPassword":"new_password_123"
  }'
```

**Response:**

```json
{
  "ok": true,
  "message": "Password reset successfully"
}
```

---

## 🔒 Security Checklist

- ✅ Token được hash (SHA256) trước lưu vào DB
- ✅ Plain token chỉ gửi qua email (không lưu)
- ✅ Token expiry 1 giờ
- ✅ Generic response tránh user enumeration
- ✅ Token xoá sau khi dùng thành công
- ✅ Reset attempt validate email + token + expiry
- ⏳ (Optional) Rate limiting (để add sau)
- ⏳ (Optional) Failed attempt logging (để add sau)

---

## 🧪 Test Cases

| Scenario                    | Expected                      | Status  |
| --------------------------- | ----------------------------- | ------- |
| Valid email → receive email | Email in inbox                | ⏳ Test |
| Open email link             | Redirect to /reset-password   | ⏳ Test |
| Valid password match        | Success → redirect to login   | ⏳ Test |
| Password mismatch           | Error message shown           | ⏳ Test |
| Expired token               | Error: "Token has expired"    | ⏳ Test |
| Wrong token                 | Error: "Invalid token"        | ⏳ Test |
| ForgotPassword twice        | Second email overwrites first | ⏳ Test |

---

## 📝 Notes

### Database Migration

Không cần migration script vì Mongoose tự động handle new fields. Tuy nhiên, nếu dùng MongoDB compass, có thể xem reset token fields trong user document.

### Email Templates

Email HTML template đã được tạo sẵn trong `mailer.ts` với:

- Tiêu đề rõ ràng
- Nút "Đặt Lại Mật Khẩu"
- Hiển thị token (fallback)
- Expiry info (60 phút)
- Security warning
- Unsubscribe/ignore info

### Frontend Environment

Client cấu hình `CLIENT_URL=http://localhost:5173` trong `.env` server để tạo reset link.  
Khi deploy production, cần update CLIENT_URL tương ứng với domain.

---

## 🎓 Code Examples

### Forget Password Flow (Frontend)

```typescript
// ForgotPasswordPage.tsx
const handleSubmit = async (e) => {
  const response = await api.post("/auth/forgot-password", { email });
  // Shows generic success message
  // Email sent to user
};
```

### Reset Password Flow (Frontend)

```typescript
// ResetPasswordPage.tsx
const urlEmail = searchParams.get("email"); // From email link
const urlToken = searchParams.get("token"); // From email link

const handleSubmit = async (e) => {
  const response = await api.post("/auth/reset-password", {
    email: urlEmail,
    token: urlToken,
    newPassword: confirmPassword,
  });
  // Redirects to login on success
};
```

### Backend Validation

```typescript
// authService.ts
async forgotPassword(email: string) {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);  // 1h

  // Save hash (not plain token)
  user.resetTokenHash = resetTokenHash;
  user.resetTokenExpiry = resetTokenExpiry;

  // Send email with plain token
  await mailerService.sendPasswordResetEmail({
    email,
    token: resetToken,  // Plain token only in email
    resetLink: `${CLIENT_URL}/reset-password?email=...&token=...`
  });
}
```

---

## 🐛 Troubleshooting

### Q: Email không được gửi?

**A:**

- Check MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS in `.env`
- Restart backend server sau khi thay đổi `.env`
- Check Mailtrap/SendGrid inbox có email test không

### Q: Link reset không hoạt động?

**A:**

- Check CLIENT_URL in `.env` (phải đúng domain)
- Token có hợp lệ không? Xem server logs
- Browser console có error không?

### Q: Token hết hạn quá nhanh?

**A:**

- Expiry được set 1 giờ. Muốn đổi: `new Date(Date.now() + 60 * 60 * 1000)`
- `60 * 60 * 1000` = 1 hour. Đổi số `60` đầu để change minutes

### Q: Muốn test mà không có email thực?

**A:**

- Dùng Mailtrap (recommended) - email capture service, miễn phí
- Hoặc dùng MailHog (local SMTP server)

---

## 📈 Next Steps (Optional Enhancements)

- [ ] Rate limiting (prevent brute force)
- [ ] Email verification on registration
- [ ] 2FA (2-factor authentication)
- [ ] Password strength meter
- [ ] Resend email button (with cooldown)
- [ ] Android deep link support
- [ ] Email template customization (brand colors, logo)
- [ ] SMS backup channel for password reset
- [ ] IP-based rate limiting
- [ ] Failed attempt logging

---

## ✅ Summary

✨ **Backend**: 2 endpoints ready (`/forgot-password`, `/reset-password`)  
✨ **Frontend**: 2 new pages ready (ForgotPassword, ResetPassword)  
✨ **Email**: Nodemailer configured (Mailtrap/SendGrid/Gmail)  
✨ **Security**: Token hash, expiry, generic response  
✨ **UX**: Full flow from login → email → reset → login again

**Status**: Ready for testing & deployment 🎉

---

**Created**: March 18, 2026  
**Backend Lead**: Implemented  
**Frontend Lead**: Implemented  
**Android Team**: Can add deep link support when ready
