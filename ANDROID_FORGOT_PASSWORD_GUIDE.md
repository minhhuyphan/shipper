# 📱 Android - "Quên Mật Khẩu" (Forgot Password) Implementation Guide

**Date**: March 18, 2026  
**Status**: ✅ Ready for Implementation  
**Backend Support**: Node.js/Express (Fully Implemented)

---

## 📋 Tổng Quan Tính Năng

Người dùng Android quên mật khẩu → Nhập email → Nhận email → Click link → Reset password → Đăng nhập lại.

**Backend API sẵn sàng:**
- ✅ POST `/api/auth/forgot-password` 
- ✅ POST `/api/auth/reset-password`
- ✅ Email gửi qua Mailtrap (tested)

---

## 🎯 Android Implementation - Step-by-Step

### **Phase 1: Setup UI & Activities**

#### **1.1 ForgotPasswordActivity.kt**

Tạo file: `app/src/main/java/com/example/quanlygiaohangnhanh/ui/auth/ForgotPasswordActivity.kt`

```kotlin
package com.example.quanlygiaohangnhanh.ui.auth

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.quanlygiaohangnhanh.R
import com.example.quanlygiaohangnhanh.api.AuthApi
import com.example.quanlygiaohangnhanh.api.RetrofitClient
import kotlinx.coroutines.launch

class ForgotPasswordActivity : AppCompatActivity() {
    
    private lateinit var emailEditText: EditText
    private lateinit var sendButton: Button
    private lateinit var authApi: AuthApi
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)
        
        emailEditText = findViewById(R.id.emailEditText)
        sendButton = findViewById(R.id.sendButton)
        authApi = RetrofitClient.getClient().create(AuthApi::class.java)
        
        sendButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            
            if (email.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập email", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(this, "Email không hợp lệ", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            sendPasswordResetEmail(email)
        }
    }
    
    private fun sendPasswordResetEmail(email: String) {
        sendButton.isEnabled = false
        sendButton.text = "Đang gửi..."
        
        lifecycleScope.launch {
            try {
                val request = mapOf("email" to email)
                val response = authApi.forgotPassword(request)
                
                if (response.ok) {
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        "✅ Email đã được gửi! Vui lòng kiểm tra inbox.",
                        Toast.LENGTH_LONG
                    ).show()
                    
                    // Clear input
                    emailEditText.text.clear()
                    
                    // Redirect to login after 2 seconds
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        finish()
                    }, 2000)
                } else {
                    Toast.makeText(
                        this@ForgotPasswordActivity,
                        "Không thể gửi email. Vui lòng thử lại.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@ForgotPasswordActivity,
                    "Lỗi: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                sendButton.isEnabled = true
                sendButton.text = "Gửi Link Đặt Lại"
            }
        }
    }
}
```

---

#### **1.2 ResetPasswordActivity.kt**

Tạo file: `app/src/main/java/com/example/quanlygiaohangnhanh/ui/auth/ResetPasswordActivity.kt`

```kotlin
package com.example.quanlygiaohangnhanh.ui.auth

import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.quanlygiaohangnhanh.R
import com.example.quanlygiaohangnhanh.api.AuthApi
import com.example.quanlygiaohangnhanh.api.RetrofitClient
import kotlinx.coroutines.launch

data class ResetPasswordRequest(
    val email: String,
    val token: String,
    val newPassword: String
)

class ResetPasswordActivity : AppCompatActivity() {
    
    private lateinit var emailEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var confirmPasswordEditText: EditText
    private lateinit var resetButton: Button
    private lateinit var authApi: AuthApi
    
    private var email: String = ""
    private var token: String = ""
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reset_password)
        
        emailEditText = findViewById(R.id.emailEditText)
        passwordEditText = findViewById(R.id.passwordEditText)
        confirmPasswordEditText = findViewById(R.id.confirmPasswordEditText)
        resetButton = findViewById(R.id.resetButton)
        authApi = RetrofitClient.getClient().create(AuthApi::class.java)
        
        // Get email and token from deep link or bundle
        extractEmailAndToken()
        
        // Set email read-only
        emailEditText.isEnabled = false
        emailEditText.setText(email)
        
        resetButton.setOnClickListener {
            val password = passwordEditText.text.toString()
            val confirmPassword = confirmPasswordEditText.text.toString()
            
            // Validation
            if (email.isEmpty() || token.isEmpty()) {
                Toast.makeText(this, "Email hoặc token không hợp lệ", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (password.length < 6) {
                Toast.makeText(this, "Mật khẩu phải ít nhất 6 ký tự", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            if (password != confirmPassword) {
                Toast.makeText(this, "Mật khẩu xác nhận không khớp", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            resetPassword(email, token, password)
        }
    }
    
    private fun extractEmailAndToken() {
        // Method 1: From deep link (myapp://reset-password?email=...&token=...)
        intent?.data?.let { uri ->
            email = uri.getQueryParameter("email") ?: ""
            token = uri.getQueryParameter("token") ?: ""
        }
        
        // Method 2: From Bundle (if started from another activity)
        if (email.isEmpty()) {
            email = intent?.getStringExtra("email") ?: ""
            token = intent?.getStringExtra("token") ?: ""
        }
        
        // Method 3: Manual input (fallback)
        if (email.isEmpty() || token.isEmpty()) {
            Toast.makeText(this, "⚠️ Link không hợp lệ. Vui lòng kiểm tra email lại.", Toast.LENGTH_LONG).show()
        }
    }
    
    private fun resetPassword(email: String, token: String, newPassword: String) {
        resetButton.isEnabled = false
        resetButton.text = "Đang xử lý..."
        
        lifecycleScope.launch {
            try {
                val request = ResetPasswordRequest(
                    email = email,
                    token = token,
                    newPassword = newPassword
                )
                
                val response = authApi.resetPassword(request)
                
                if (response.ok) {
                    Toast.makeText(
                        this@ResetPasswordActivity,
                        "✅ Mật khẩu đã được đặt lại thành công!",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    // Clear password fields
                    passwordEditText.text.clear()
                    confirmPasswordEditText.text.clear()
                    
                    // Redirect to login after 2 seconds
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        // Redirect to LoginActivity
                        startActivity(android.content.Intent(this@ResetPasswordActivity, LoginActivity::class.java))
                        finish()
                    }, 2000)
                } else {
                    Toast.makeText(
                        this@ResetPasswordActivity,
                        "❌ ${response.error ?: "Không thể đặt lại mật khẩu"}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@ResetPasswordActivity,
                    "❌ Lỗi: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                resetButton.isEnabled = true
                resetButton.text = "Đặt Lại Mật Khẩu"
            }
        }
    }
}
```

---

### **Phase 2: API Interface**

#### **2.1 Update AuthApi.kt**

Cập nhật file: `app/src/main/java/com/example/quanlygiaohangnhanh/api/AuthApi.kt`

```kotlin
package com.example.quanlygiaohangnhanh.api

import retrofit2.http.Body
import retrofit2.http.POST

data class ApiResponse(
    val ok: Boolean,
    val message: String? = null,
    val error: String? = null,
    val token: String? = null,
    val user: UserResponse? = null
)

data class UserResponse(
    val id: String,
    val email: String,
    val name: String,
    val phone: String? = null,
    val role: String
)

interface AuthApi {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse
    
    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: Map<String, String>): ApiResponse
    
    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): ApiResponse
    
    @POST("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): ApiResponse
}

data class LoginRequest(
    val email: String? = null,
    val phone: String? = null,
    val password: String
)

data class ResetPasswordRequest(
    val email: String,
    val token: String,
    val newPassword: String
)

data class ChangePasswordRequest(
    val oldPassword: String,
    val newPassword: String
)
```

---

### **Phase 3: Layout XMLs**

#### **3.1 activity_forgot_password.xml**

Tạo file: `app/src/main/res/layout/activity_forgot_password.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:gravity="center"
    android:background="@color/dark_bg">

    <ImageView
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:src="@drawable/ic_lock"
        android:contentDescription="Lock Icon"
        android:scaleType="centerInside" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Quên Mật Khẩu"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="@color/white"
        android:layout_marginTop="20dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Nhập email để nhận link đặt lại mật khẩu"
        android:textSize="14sp"
        android:textColor="@color/gray_light"
        android:layout_marginTop="10dp"
        android:gravity="center" />

    <EditText
        android:id="@+id/emailEditText"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:hint="Email"
        android:inputType="emailAddress"
        android:padding="15dp"
        android:layout_marginTop="30dp"
        android:background="@drawable/edit_text_bg"
        android:textColor="@color/white"
        android:textColorHint="@color/gray_medium" />

    <Button
        android:id="@+id/sendButton"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:text="Gửi Link Đặt Lại"
        android:textSize="16sp"
        android:layout_marginTop="20dp"
        android:background="@drawable/button_primary_bg"
        android:textColor="@color/white" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Nhớ mật khẩu? Đăng nhập"
        android:textSize="14sp"
        android:textColor="@color/blue_accent"
        android:layout_marginTop="20dp"
        android:clickable="true"
        android:focusable="true" />

</LinearLayout>
```

---

#### **3.2 activity_reset_password.xml**

Tạo file: `app/src/main/res/layout/activity_reset_password.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="20dp"
    android:gravity="center"
    android:background="@color/dark_bg">

    <ImageView
        android:layout_width="100dp"
        android:layout_height="100dp"
        android:src="@drawable/ic_lock"
        android:contentDescription="Lock Icon"
        android:scaleType="centerInside" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Đặt Lại Mật Khẩu"
        android:textSize="24sp"
        android:textStyle="bold"
        android:textColor="@color/white"
        android:layout_marginTop="20dp" />

    <EditText
        android:id="@+id/emailEditText"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:hint="Email"
        android:inputType="emailAddress"
        android:padding="15dp"
        android:layout_marginTop="30dp"
        android:background="@drawable/edit_text_bg"
        android:textColor="@color/white"
        android:textColorHint="@color/gray_medium"
        android:enabled="false" />

    <EditText
        android:id="@+id/passwordEditText"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:hint="Mật Khẩu Mới"
        android:inputType="textPassword"
        android:padding="15dp"
        android:layout_marginTop="15dp"
        android:background="@drawable/edit_text_bg"
        android:textColor="@color/white"
        android:textColorHint="@color/gray_medium" />

    <EditText
        android:id="@+id/confirmPasswordEditText"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:hint="Xác Nhận Mật Khẩu"
        android:inputType="textPassword"
        android:padding="15dp"
        android:layout_marginTop="15dp"
        android:background="@drawable/edit_text_bg"
        android:textColor="@color/white"
        android:textColorHint="@color/gray_medium" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="✓ Mật khẩu phải có ít nhất 6 ký tự"
        android:textSize="12sp"
        android:textColor="@color/gray_light"
        android:layout_marginTop="10dp" />

    <Button
        android:id="@+id/resetButton"
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:text="Đặt Lại Mật Khẩu"
        android:textSize="16sp"
        android:layout_marginTop="20dp"
        android:background="@drawable/button_primary_bg"
        android:textColor="@color/white" />

</LinearLayout>
```

---

### **Phase 4: AndroidManifest.xml - Deep Link Setup**

Cập nhật file: `app/src/main/AndroidManifest.xml`

```xml
<activity
    android:name=".ui.auth.ForgotPasswordActivity"
    android:exported="false" />

<activity
    android:name=".ui.auth.ResetPasswordActivity"
    android:exported="true">
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Deep link: myapp://reset-password?email=...&token=... -->
        <data
            android:scheme="myapp"
            android:host="reset-password" />
        
        <!-- Web link: https://your-domain/reset-password?email=...&token=... -->
        <data
            android:scheme="https"
            android:host="localhost"
            android:pathPrefix="/reset-password" />
        <data
            android:scheme="https"
            android:host="your-domain.com"
            android:pathPrefix="/reset-password" />
    </intent-filter>
</activity>
```

---

### **Phase 5: LoginActivity - Add "Quên Mật Khẩu?" Button**

Sửa file: `app/src/main/java/com/example/quanlygiaohangnhanh/ui/auth/LoginActivity.kt`

```kotlin
// In LoginActivity onCreate()
val forgotPasswordButton = findViewById<TextView>(R.id.forgotPasswordText)
forgotPasswordButton.setOnClickListener {
    startActivity(Intent(this, ForgotPasswordActivity::class.java))
}
```

Layout XML (`activity_login.xml`):
```xml
<TextView
    android:id="@+id/forgotPasswordText"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Quên mật khẩu?"
    android:textColor="@color/blue_accent"
    android:textSize="14sp"
    android:clickable="true"
    android:focusable="true"
    android:layout_marginTop="10dp" />
```

---

## 🔗 API Integration - Reference

### **Endpoint 1: Forgot Password**
```
POST http://localhost:5000/api/auth/forgot-password

Request:
{
    "email": "user@example.com"
}

Response (200 - always):
{
    "ok": true,
    "message": "Nếu tài khoản tồn tại, email đặt lại mật khẩu đã được gửi."
}
```

### **Endpoint 2: Reset Password**
```
POST http://localhost:5000/api/auth/reset-password

Request:
{
    "email": "user@example.com",
    "token": "plaintext_token_from_email",
    "newPassword": "new_password_123"
}

Response (200):
{
    "ok": true,
    "message": "Password reset successfully"
}

Response (400):
{
    "ok": false,
    "error": "Token has expired" / "Invalid token" / "Invalid or expired token"
}
```

---

## ✅ Implementation Checklist

- [ ] Copy Retrofit interface (AuthApi.kt) với 2 endpoints mới
- [ ] Tạo ForgotPasswordActivity.kt
- [ ] Tạo ResetPasswordActivity.kt
- [ ] Tạo layout XMLs (2 files)
- [ ] Update AndroidManifest.xml với:
  - [ ] Export ResetPasswordActivity
  - [ ] Intent-filter cho deep link
- [ ] Update LoginActivity: thêm button "Quên mật khẩu?"
- [ ] Update LoginActivity layout: thêm TextView "Quên mật khẩu?"
- [ ] Test flow: Forgot Password → Email → Reset Password

---

## 🧪 Test Flow

### **Step 1: Test Forgot Password**
1. App → Login screen
2. Click "Quên mật khẩu?"
3. Input email: `admin@shipper.com`
4. Click "Gửi Link Đặt Lại"
5. ✅ Toast: "Email đã được gửi"

### **Step 2: Check Email**
1. Mailtrap inbox → Email received
2. Copy token từ email
3. Copy link hoặc construct URL:
   ```
   myapp://reset-password?email=admin@shipper.com&token=TOKEN
   ```

### **Step 3: Open Reset Link**
- **Option A (Deep link)**: ADB command:
  ```bash
  adb shell am start -a android.intent.action.VIEW -d "myapp://reset-password?email=admin@shipper.com&token=TOKEN"
  ```

- **Option B (Manual)**: App sẽ nhận URL từ browser khi user click email link

### **Step 4: Test Reset Password**
1. Input new password: `newpass123`
2. Confirm: `newpass123`
3. Click "Đặt Lại Mật Khẩu"
4. ✅ Toast: "Mật khẩu đã được đặt lại thành công!"
5. Auto-redirect → LoginActivity

### **Step 5: Login with New Password**
1. Email: `admin@shipper.com`
2. Password: `newpass123`
3. ✅ Login successful

---

## 🔒 Security Notes

✅ **Bạn đã implement:**
- Token hash on backend (SHA256)
- Token expiry 1 hour
- Generic response (prevent user enumeration)
- Token cleared after use

✅ **Android-side security:**
- Validate email format trước gửi
- Validate password length (min 6)
- Confirm password match
- Don't log sensitive data (token, password)

---

## 📚 File Structure Summary

```
app/src/main/
├── java/com/example/quanlygiaohangnhanh/
│   ├── ui/auth/
│   │   ├── LoginActivity.kt (UPDATE)
│   │   ├── ForgotPasswordActivity.kt (NEW)
│   │   └── ResetPasswordActivity.kt (NEW)
│   └── api/
│       └── AuthApi.kt (UPDATE)
└── res/layout/
    ├── activity_login.xml (UPDATE)
    ├── activity_forgot_password.xml (NEW)
    └── activity_reset_password.xml (NEW)
```

**Also Update:**
- `AndroidManifest.xml` - Add activities + intent-filter

---

## 🚀 Next Steps

1. **Copy code** từ hướng dẫn này
2. **Create Activities** (ForgotPasswordActivity, ResetPasswordActivity)
3. **Update AuthApi** với 2 endpoints mới
4. **Update Manifest** với intent-filter
5. **Test** trên device/emulator
6. **Optional**: Add rate limiting, show loading spinner

---

## ❓ Q&A

**Q: Email link không mở app?**  
A: Ensure intent-filter có đúng `android:scheme="myapp"` + `android:host="reset-password"`

**Q: Token expiry quá nhanh?**  
A: Backend set 1 hour. Bạn có thể test offline bằng cách copy token ngay sau request

**Q: Password validation lỗi?**  
A: Check `EditText` inputs không có whitespace, validate format trước gửi

**Q: Deep link không trigger?**  
A: Thử test bằng ADB command hoặc click link từ email trong app browser

---

**Status**: ✅ Ready to Implement  
**Backend**: Fully Tested ✅  
**Android**: Step-by-step Guide 📋

Bắt tay vào code! 🚀
