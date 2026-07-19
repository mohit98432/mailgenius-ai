from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, SmtpConfig
from app.schemas import SmtpConfigIn, SmtpConfigOut
from app.security import encrypt_secret

router = APIRouter(prefix="/smtp", tags=["smtp"])


@router.get("", response_model=SmtpConfigOut)
def get_smtp(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cfg = db.query(SmtpConfig).filter(SmtpConfig.user_id == current_user.id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="No SMTP configuration saved yet")
    return SmtpConfigOut(smtp_host=cfg.smtp_host, smtp_port=cfg.smtp_port, smtp_email=cfg.smtp_email)


@router.put("", response_model=SmtpConfigOut)
def upsert_smtp(payload: SmtpConfigIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cfg = db.query(SmtpConfig).filter(SmtpConfig.user_id == current_user.id).first()

    if not cfg and not payload.smtp_password:
        raise HTTPException(status_code=400, detail="smtp_password is required when creating a new SMTP configuration")

    if cfg:
        cfg.smtp_host = payload.smtp_host
        cfg.smtp_port = payload.smtp_port
        cfg.smtp_email = payload.smtp_email
        if payload.smtp_password:
            cfg.encrypted_password = encrypt_secret(payload.smtp_password)
    else:
        cfg = SmtpConfig(
            user_id=current_user.id,
            smtp_host=payload.smtp_host,
            smtp_port=payload.smtp_port,
            smtp_email=payload.smtp_email,
            encrypted_password=encrypt_secret(payload.smtp_password),
        )
        db.add(cfg)
    db.commit()
    return SmtpConfigOut(smtp_host=cfg.smtp_host, smtp_port=cfg.smtp_port, smtp_email=cfg.smtp_email)
