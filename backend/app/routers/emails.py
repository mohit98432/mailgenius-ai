from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, EmailDraft, EmailStatus, SmtpConfig
from app.schemas import (
    GenerateRequest, RewriteRequest, SubjectRequest,
    GeneratedResponse, SubjectsResponse,
    EmailCreate, EmailOut, SendNowRequest,
)
from app.services import gemini
from app.services.mailer import send_email

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/generate", response_model=GeneratedResponse)
def generate(payload: GenerateRequest, current_user: User = Depends(get_current_user)):
    try:
        body = gemini.generate_email(
            purpose=payload.purpose,
            recipient_name=payload.recipient_name or "",
            recipient_company=payload.recipient_company or "",
            tone=payload.tone,
            length=payload.length,
            language=payload.language,
            extra_instructions=payload.extra_instructions or "",
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Generation failed: {exc}") from exc
    return GeneratedResponse(body=body)


@router.post("/rewrite", response_model=GeneratedResponse)
def rewrite(payload: RewriteRequest, current_user: User = Depends(get_current_user)):
    try:
        body = gemini.rewrite_email(payload.body, payload.action, payload.language or "English")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Rewrite failed: {exc}") from exc
    return GeneratedResponse(body=body)


@router.post("/subjects", response_model=SubjectsResponse)
def subjects(payload: SubjectRequest, current_user: User = Depends(get_current_user)):
    try:
        result = gemini.generate_subjects(payload.body)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Subject generation failed: {exc}") from exc
    return SubjectsResponse(subjects=result)


@router.get("", response_model=list[EmailOut])
def list_emails(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(EmailDraft)
        .filter(EmailDraft.user_id == current_user.id)
        .order_by(EmailDraft.created_at.desc())
        .all()
    )


@router.post("", response_model=EmailOut)
def save_draft(payload: EmailCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    draft = EmailDraft(
        user_id=current_user.id,
        recipient_name=payload.recipient_name,
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body,
        status=EmailStatus.draft,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft


@router.delete("/{email_id}")
def delete_email(email_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    draft = db.query(EmailDraft).filter(EmailDraft.id == email_id, EmailDraft.user_id == current_user.id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Email not found")
    db.delete(draft)
    db.commit()
    return {"ok": True}


@router.post("/send-now", response_model=EmailOut)
def send_now(payload: SendNowRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    smtp_cfg = db.query(SmtpConfig).filter(SmtpConfig.user_id == current_user.id).first()
    if not smtp_cfg:
        raise HTTPException(status_code=400, detail="Configure SMTP settings before sending")

    draft = EmailDraft(
        user_id=current_user.id,
        recipient_email=payload.recipient_email,
        subject=payload.subject,
        body=payload.body,
        status=EmailStatus.draft,
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    try:
        send_email(
            smtp_cfg.smtp_host, smtp_cfg.smtp_port, smtp_cfg.smtp_email, smtp_cfg.encrypted_password,
            payload.recipient_email, payload.subject, payload.body,
        )
        draft.status = EmailStatus.sent
        from datetime import datetime
        draft.sent_at = datetime.utcnow()
    except Exception as exc:  # noqa: BLE001
        draft.status = EmailStatus.failed
        draft.error_message = str(exc)
        db.commit()
        raise HTTPException(status_code=502, detail=f"Send failed: {exc}") from exc

    db.commit()
    db.refresh(draft)
    return draft
