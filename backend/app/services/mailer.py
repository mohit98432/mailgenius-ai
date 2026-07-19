import smtplib
from email.mime.text import MIMEText

from app.security import decrypt_secret


def send_email(smtp_host: str, smtp_port: str, smtp_email: str, encrypted_password: str,
                to_email: str, subject: str, body: str) -> None:
    """Sends a plaintext email over SMTP using an app-password style credential.
    Raises on failure; caller is responsible for catching and recording the error."""
    password = decrypt_secret(encrypted_password)

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_email
    msg["To"] = to_email

    port = int(smtp_port)
    if port == 465:
        with smtplib.SMTP_SSL(smtp_host, port, timeout=20) as server:
            server.login(smtp_email, password)
            server.sendmail(smtp_email, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, port, timeout=20) as server:
            server.starttls()
            server.login(smtp_email, password)
            server.sendmail(smtp_email, [to_email], msg.as_string())
