from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "RideClub Intelligence Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = Field(False, env="DEBUG")

    # Security
    JWT_SECRET: str = Field("supersecretjwtkey_change_in_prod", env="JWT_SECRET")
    SUPABASE_JWT_SECRET: str = Field("", env="SUPABASE_JWT_SECRET")
    ALGORITHM: str = "HS256"

    # Supabase project + service-role key, used server-side only (never sent
    # to the client) so authenticated-but-not-Supabase-Auth requests (this
    # app only ever holds the anon key client-side) can still write to
    # RLS-locked resources like the incident-photos storage bucket, after
    # get_current_user has verified the caller's own token.
    SUPABASE_URL: str = Field("", env="SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field("", env="SUPABASE_SERVICE_ROLE_KEY")
    # Newer Supabase projects issue an sb_secret_ key instead; either name works
    SUPABASE_SECRET_KEY: str = Field("", env="SUPABASE_SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database (Set this to your Supabase PostgreSQL connection string)
    # Supabase provides PostGIS enabled out of the box.
    DATABASE_URL: str = Field("postgresql://postgres:postgres@localhost:5432/rie_db", env="DATABASE_URL")
    
    # Redis & Celery
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")

    # CORS
    ALLOWED_ORIGINS: str = Field(
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://app.rideclub.in",
        env="ALLOWED_ORIGINS",
    )

    @property
    def ALLOWED_ORIGINS_LIST(self) -> list:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str = Field("", env="FIREBASE_SERVICE_ACCOUNT_PATH")

    # EmailJS (server-side OTP delivery — see core/email.py)
    EMAILJS_SERVICE_ID: str = Field("", env="EMAILJS_SERVICE_ID")
    EMAILJS_TEMPLATE_ID: str = Field("", env="EMAILJS_TEMPLATE_ID")
    EMAILJS_PUBLIC_KEY: str = Field("", env="EMAILJS_PUBLIC_KEY")
    EMAILJS_PRIVATE_KEY: str = Field("", env="EMAILJS_PRIVATE_KEY")

    # TomTom (default fallback is the currently hardcoded key from the frontend - rotate this ASAP)
    TOMTOM_API_KEY: str = Field("GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ", env="TOMTOM_API_KEY")

    # Twilio (SOS SMS dispatch)
    TWILIO_ACCOUNT_SID: str = Field("", env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field("", env="TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER: str = Field("", env="TWILIO_FROM_NUMBER")

    # Real-time platform (backend/realtime/)
    RTC_MAX_DEVICES_PER_USER: int = Field(5, env="RTC_MAX_DEVICES_PER_USER")
    RTC_IDLE_TIMEOUT_S: int = Field(1800, env="RTC_IDLE_TIMEOUT_S")  # 30 min silence -> drop
    # WebSocket Architecture.md §21 — explicit connection caps, distinct from
    # the handshake-frequency rate limiter (that throttles connect *rate*,
    # not concurrent *count*). Refuse gracefully rather than degrade under
    # unbounded per-instance/per-IP connection growth.
    RTC_MAX_CONNECTIONS_PER_INSTANCE: int = Field(30000, env="RTC_MAX_CONNECTIONS_PER_INSTANCE")
    RTC_MAX_CONNECTIONS_PER_IP: int = Field(200, env="RTC_MAX_CONNECTIONS_PER_IP")
    RTC_MAX_MESSAGE_VIOLATIONS: int = Field(20, env="RTC_MAX_MESSAGE_VIOLATIONS")  # rate-limit hits before disconnect

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
if settings.SUPABASE_SECRET_KEY:
    settings.SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SECRET_KEY
