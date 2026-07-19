"""Background job that checks for due scheduled emails once a minute and sends them.
Uses APScheduler's in-process BackgroundScheduler backed by the same database rows,
so it survives being polled from a single worker process. For multi-worker/multi-dyno
deployments, replace this with a proper queue (Celery/RQ) so only one worker sends
each job."""
import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import EmailDraft, EmailStatus, SmtpConfig
from app.services.mailer import send_email

logger = logging.getLogger("mailgenius.scheduler")


def _process_due_emails():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due = (
            db.query(EmailDraft)
            .filter(EmailDraft.status == EmailStatus.scheduled, EmailDraft.scheduled_for <= now)
            .all()
        )
        for email in due:
            smtp_cfg = db.query(SmtpConfig).filter(SmtpConfig.user_id == email.user_id).first()
            if not smtp_cfg:
                email.status = EmailStatus.failed
                email.error_message = "No SMTP configuration found for user"
                db.commit()
                continue
            try:
                send_email(
                    smtp_cfg.smtp_host,
                    smtp_cfg.smtp_port,
                    smtp_cfg.smtp_email,
                    smtp_cfg.encrypted_password,
                    email.recipient_email,
                    email.subject or "(no subject)",
                    email.body,
                )
                email.status = EmailStatus.sent
                email.sent_at = datetime.utcnow()
                email.error_message = None
            except Exception as exc:  # noqa: BLE001 - record and move on, don't crash the loop
                email.status = EmailStatus.failed
                email.error_message = str(exc)
                logger.exception("Failed to send scheduled email %s", email.id)
            db.commit()
    finally:
        db.close()


_scheduler = BackgroundScheduler()


def start_scheduler():
    if not _scheduler.running:
        _scheduler.add_job(_process_due_emails, "interval", minutes=1, id="send_due_emails", replace_existing=True)
        _scheduler.start()


def shutdown_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
