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
        try:
            print(f"Subject: {subject}")
            print(f"Body (Text Preview):\n{body_text or 'HTML email payload'}")
        except UnicodeEncodeError:
            print(f"Subject: {subject.encode('ascii', 'replace').decode('ascii')}")
            print(f"Body (Text Preview):\n{body_text.encode('ascii', 'replace').decode('ascii') if body_text else 'HTML email payload'}")
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
            
            # Connect to SMTP server with a 10s timeout to prevent hanging threads
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
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
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; margin: 0 auto 10px auto; font-family: sans-serif; line-height: 60px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">P</div>
                        <h2 style="margin: 0; color: #1e3a8a; font-size: 22px; font-weight: 800;">Panun Ghar Luxury Resort</h2>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600;">Srinagar, Kashmir</span>
                    </div>
                    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Thank you for registering. Please verify your email using the following secure One-Time Password (OTP):</p>
                    <div style="font-size: 28px; font-weight: 800; background: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0; color: #1e3a8a; letter-spacing: 0.15em;">
                        {code}
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 25px;">This OTP is valid for 10 minutes. If you did not request this, you can ignore this email.</p>
                </div>
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
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; margin: 0 auto 10px auto; font-family: sans-serif; line-height: 60px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">P</div>
                        <h2 style="margin: 0; color: #1e3a8a; font-size: 22px; font-weight: 800;">Panun Ghar Luxury Resort</h2>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600;">Srinagar, Kashmir</span>
                    </div>
                    <h3 style="color: #10b981; margin-top: 0;">Verified Successfully!</h3>
                    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Hello <strong>{name}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">Welcome to Panun Ghar Resort! Your account is now active. You can browse, choose, and book premium rooms directly.</p>
                    <p style="font-size: 14px; color: #6b7280; margin-top: 25px;">Best regards,<br/>The Panun Ghar Team</p>
                </div>
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
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; background-color: #f9fafb;">
                <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #06b6d4); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; margin: 0 auto 10px auto; font-family: sans-serif; line-height: 60px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">P</div>
                        <h2 style="margin: 0; color: #1e3a8a; font-size: 22px; font-weight: 800;">Panun Ghar Luxury Resort</h2>
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 600;">Srinagar, Kashmir</span>
                    </div>
                    <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">We received a request to reset your password. Use the following code/token to complete the reset process:</p>
                    <div style="font-size: 22px; font-weight: 800; background: #f3f4f6; padding: 12px; text-align: center; border-radius: 8px; margin: 20px 0; color: #1e3a8a; letter-spacing: 0.1em;">
                        {token}
                    </div>
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 25px;">If you did not request a password reset, please secure your account immediately.</p>
                </div>
            </body>
        </html>
        """
        return cls.send_email(to_email, subject, body_html, body_text)
