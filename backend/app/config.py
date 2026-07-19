from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str
    fernet_key: str
    database_url: str = "sqlite:///./mailgenius.db"
    gemini_api_key: str
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173"
    algorithm: str = "HS256"

    @property
    def cors_origin_list(self):
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
