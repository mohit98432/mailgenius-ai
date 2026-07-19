from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, EmailDraft, EmailStatus, SmtpConfig
from app.schemas import ScheduleRequest, EmailOut

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.post("", response_model=EmailOut)
def create_scheduled_email(
    payload: ScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    smtp_cfg = db.query(SmtpConfig).filter(SmtpConfig.user_id == current_user.id).first()
    if not smtp_cfg:
        raise HTTPException(status_code=400, detail="Configure SMTP settings before scheduling")

    from datetime import datetime
    if payload.send_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="send_at must be in the future (UTC)")

    draft = EmailDraft(
        user_id=current_user.id,
        recipient_name=payload.recipient_name,
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body,
        status=EmailStatus.scheduled,
        scheduled_for=payload.send_at,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


@router.get("", response_model=list[EmailOut])
def list_scheduled(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(EmailDraft)
        .filter(EmailDraft.user_id == current_user.id, EmailDraft.status == EmailStatus.scheduled)
        .order_by(EmailDraft.scheduled_for.asc())
        .all()
    )


@router.delete("/{email_id}")
def cancel_scheduled(email_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    draft = (
        db.query(EmailDraft)
        .filter(EmailDraft.id == email_id, EmailDraft.user_id == current_user.id, EmailDraft.status == EmailStatus.scheduled)
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Scheduled email not found")
    db.delete(draft)
    db.commit()
    return {"ok": True}
