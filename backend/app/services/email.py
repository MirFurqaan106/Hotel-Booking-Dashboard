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
        
        # 1. If BREVO_API_KEY / SENDINBLUE API Key is configured, use the Brevo HTTP API directly.
        # This allows sending emails to ANY recipient in the world without domain verification restrictions.
        brevo_key = settings.RESEND_API_KEY  # We will reuse the same env variable name or check settings
        if brevo_key:
            try:
                import requests
                headers = {
                    "accept": "application/json",
                    "api-key": brevo_key,
                    "content-type": "application/json"
                }
                payload = {
                    "sender": {"name": "Panun Ghar Luxury Resort", "email": "mirfurkaan106@gmail.com"},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": body_html
                }
                res = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers, timeout=10)
                if res.status_code in [200, 201, 202]:
                    print("[Email Service] Production email successfully sent via Brevo HTTP API to any guest!")
                    return True
                else:
                    print(f"[Email Service] Brevo HTTP API rejected request: {res.status_code} - {res.text}. Falling back...")
            except Exception as brevo_err:
                print(f"[Email Service] Brevo HTTP API dispatch failed: {brevo_err}. Falling back to SMTP...")

        # If no SMTP credentials are provided, mock the success return
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("[Email Service] SMTP Credentials missing in .env. Mocking dispatch SUCCESS (details printed above).")
            return True
            
        # Try TLS port 587 first, and fallback to SMTP_SSL port 465 if blocked
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = settings.SMTP_SENDER_EMAIL
            message["To"] = to_email
            
            if body_text:
                message.attach(MIMEText(body_text, "plain"))
            message.attach(MIMEText(body_html, "html"))
            
            # 1. Attempt standard TLS connection (Port 587)
            try:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_SENDER_EMAIL, to_email, message.as_string())
                server.quit()
                print("[Email Service] Email sent successfully via TLS (Port 587)!")
                return True
            except Exception as tls_err:
                print(f"[Email Service] TLS connection failed/blocked: {tls_err}. Retrying with SSL (Port 465)...")
                
                # 2. Fallback to secure SSL connection (Port 465)
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=10)
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_SENDER_EMAIL, to_email, message.as_string())
                server.quit()
                print("[Email Service] Email sent successfully via SSL (Port 465)!")
                return True
        except Exception as e:
            print(f"[Email Service] Both TLS and SSL email dispatch failed: {e}")
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
