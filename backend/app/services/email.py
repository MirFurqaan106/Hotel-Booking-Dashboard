import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.config import settings

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body_html: str, body_text: str = "") -> bool:
        print(f"\n==========================================")
        print(f"[Email Service] Preparing Mail Notification")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body (Text Preview):\n{body_text or 'HTML email payload'}")
        print(f"==========================================\n")
        
        # If no SMTP credentials are provided, mock the success return
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("[Email Service] SMTP Credentials missing in .env. Mocking dispatch SUCCESS (details printed above).")
            return True
            
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = settings.SMTP_SENDER_EMAIL
            message["To"] = to_email
            
            # Attach text and HTML versions
            if body_text:
                message.attach(MIMEText(body_text, "plain"))
            message.attach(MIMEText(body_html, "html"))
            
            # Connect to SMTP server
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_SENDER_EMAIL, to_email, message.as_string())
            server.quit()
            
            print("[Email Service] Email sent successfully via Gmail SMTP!")
            return True
        except Exception as e:
            print(f"[Email Service] Error sending email via SMTP: {e}")
            return False

    @classmethod
    def send_otp(cls, to_email: str, code: str) -> bool:
        subject = "[Panun Ghar] Verify your account using OTP"
        body_text = f"Your email verification code is: {code}. This OTP is valid for 10 minutes."
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Welcome to Panun Ghar Resort</h2>
                <p>Thank you for registering. Please verify your email using the following One-Time Password (OTP):</p>
                <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; color: #111827; letter-spacing: 0.1em;">
                    {code}
                </div>
                <p style="font-size: 12px; color: #6b7280;">This verification code is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, body_html, body_text)

    @classmethod
    def send_welcome(cls, to_email: str, name: str) -> bool:
        subject = "[Panun Ghar] Welcome to Panun Ghar Resort!"
        body_text = f"Hello {name}, welcome to Panun Ghar Resort. Your account has been verified successfully."
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Verified Successfully!</h2>
                <p>Hello <strong>{name}</strong>,</p>
                <p>Welcome to Panun Ghar Resort! Your account is now active. You can browse, choose, and book premium rooms directly.</p>
                <p>Best regards,<br/>The Panun Ghar Team</p>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, body_html, body_text)

    @classmethod
    def send_password_reset(cls, to_email: str, token: str) -> bool:
        subject = "[Panun Ghar] Reset your password"
        body_text = f"Please use reset token: {token} to reset your password."
        body_html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Password Reset Request</h2>
                <p>We received a request to reset your password. Use the following code/token to complete the reset process:</p>
                <div style="font-size: 18px; font-weight: bold; background: #f3f4f6; padding: 12px; text-align: center; border-radius: 8px; margin: 15px 0;">
                    {token}
                </div>
                <p style="font-size: 12px; color: #6b7280;">If you did not request a password reset, please secure your account.</p>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, body_html, body_text)
