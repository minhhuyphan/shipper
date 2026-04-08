/**
 * Mailer Service
 * Chức năng: Cấu hình và gửi email thông báo (ví dụ: email đặt lại mật khẩu).
 */
import nodemailer from "nodemailer";
import { config } from "../config";

const mailConfig = {
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: false, // Port 587 sử dụng STARTTLS
  requireTLS: true, // Gmail yêu cầu TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
};

const transporter = nodemailer.createTransport(mailConfig);

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer configuration error:", error);
  } else {
    console.log("✅ Mailer ready - SMTP connection verified");
  }
});

export interface SendPasswordResetEmailParams {
  email: string;
  token: string;
  resetLink: string;
}

export class MailerService {
  async sendPasswordResetEmail({
    email,
    token,
    resetLink,
  }: SendPasswordResetEmailParams) {
    // Removed app links
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; font-size: 24px; margin: 0; }
            .content { color: #555; line-height: 1.6; }
            .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 20px 0; color: #856404; }
            .code-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Đặt Lại Mật Khẩu</h1>
            </div>

          <div class="content">
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Đặt Lại Mật Khẩu (Web)</a>
            </div>
            <div class="warning">
              <strong>⚠️ Lưu ý An Toàn:</strong><br>
              - Liên kết này sẽ hết hạn sau <strong>60 phút</strong>.<br>
              - Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.<br>
              - Không bao giờ chia sẻ liên kết này với ai khác.
            </div>
            <p>Nếu liên kết trên không hoạt động, vui lòng truy cập:</p>
            <p style="word-break: break-all; color: #007bff;">${resetLink}</p>
          </div>

          <div class="footer">
            <p>© 2026 GoXpress. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi vì bạn có tài khoản tại hệ thống của chúng tôi.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@goxpress.com",
      to: email,
      subject: "[GoXpress] Yêu cầu đặt lại mật khẩu",
      html: htmlContent,
      text: `Yêu cầu đặt lại mật khẩu\n\nMã: ${token}\n\nLink: ${resetLink}\n\nMã hết hạn sau 60 phút.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await transporter.verify();
      console.log("✅ Mail transporter is ready");
      return true;
    } catch (error) {
      console.error("❌ Mail transporter error:", error);
      return false;
    }
  }
}

export const mailerService = new MailerService();
