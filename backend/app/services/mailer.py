import smtplib
from email.mime.text import MIMEText

from app.security import decrypt_secret


import smtplib
from email.mime.text import MIMEText

from app.security import decrypt_secret


def send_email(
    smtp_host: str,
    smtp_port: str,
    smtp_email: str,
    encrypted_password: str,
    to_email: str,
    subject: str,
    body: str,
) -> None:
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
        print("Connecting to SMTP server...")

        try:
            with smtplib.SMTP(smtp_host, port, timeout=20) as server:
                print("Connected!")

                server.set_debuglevel(1)

                server.starttls()
                print("TLS OK")

                server.login(smtp_email, password)
                print("Login OK")

                server.sendmail(smtp_email, [to_email], msg.as_string())
                print("Mail sent!")

        except Exception as e:
            print("SMTP ERROR:", repr(e))
            raise