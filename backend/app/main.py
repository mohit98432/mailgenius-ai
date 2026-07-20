from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, emails, schedule, smtp_settings
from app.services.scheduler import start_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title="MailGenius AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(emails.router)
app.include_router(schedule.router)
app.include_router(smtp_settings.router)


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def home():
    return {
        "message": "Welcome to MailGenius AI API",
        "docs": "/docs"
    }

@app.get("/")
def home():
    return {
        "message": "Welcome to MailGenius AI API",
        "docs": "/docs"
    }