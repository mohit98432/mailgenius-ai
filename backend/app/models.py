import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Text, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    smtp_config = relationship("SmtpConfig", back_populates="user", uselist=False, cascade="all, delete-orphan")
    emails = relationship("EmailDraft", back_populates="user", cascade="all, delete-orphan")


class SmtpConfig(Base):
    __tablename__ = "smtp_configs"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    smtp_host = Column(String, nullable=False)
    smtp_port = Column(String, nullable=False)
    smtp_email = Column(String, nullable=False)
    encrypted_password = Column(Text, nullable=False)  # Fernet-encrypted app password
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="smtp_config")


class EmailStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    sent = "sent"
    failed = "failed"


class EmailDraft(Base):
    __tablename__ = "emails"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    recipient_name = Column(String, nullable=True)
    recipient_email = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False, default="")

    status = Column(SAEnum(EmailStatus), default=EmailStatus.draft, nullable=False)
    scheduled_for = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="emails")
