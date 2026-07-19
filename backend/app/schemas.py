from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- Email generation ----
class GenerateRequest(BaseModel):
    recipient_name: Optional[str] = None
    recipient_company: Optional[str] = None
    purpose: str
    tone: str = "Professional"
    length: str = "Medium"
    language: str = "English"
    extra_instructions: Optional[str] = None


class RewriteRequest(BaseModel):
    body: str
    action: str  # shorter | longer | professional | friendly | grammar | translate
    language: Optional[str] = "English"


class SubjectRequest(BaseModel):
    body: str


class GeneratedResponse(BaseModel):
    body: str


class SubjectsResponse(BaseModel):
    subjects: List[str]


# ---- Email drafts / scheduling ----
class EmailCreate(BaseModel):
    recipient_name: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    subject: Optional[str] = None
    body: str


class EmailOut(BaseModel):
    id: str
    recipient_name: Optional[str]
    recipient_email: Optional[str]
    subject: Optional[str]
    body: str
    status: str
    scheduled_for: Optional[datetime]
    sent_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ScheduleRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: Optional[str] = None
    subject: str
    body: str
    send_at: datetime  # UTC ISO datetime


class SendNowRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    body: str


# ---- SMTP settings ----
class SmtpConfigIn(BaseModel):
    smtp_host: str
    smtp_port: str
    smtp_email: EmailStr
    smtp_password: Optional[str] = None  # plaintext in transit over HTTPS, encrypted at rest; omit to keep existing


class SmtpConfigOut(BaseModel):
    smtp_host: str
    smtp_port: str
    smtp_email: EmailStr
    configured: bool = True
