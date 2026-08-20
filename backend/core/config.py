from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "RideClub Intelligence Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET: str = Field("supersecretjwtkey_change_in_prod", env="JWT_SECRET")
    SUPABASE_JWT_SECRET: str = Field("", env="SUPABASE_JWT_SECRET")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database (Set this to your Supabase PostgreSQL connection string)
    # Supabase provides PostGIS enabled out of the box.
    DATABASE_URL: str = Field("postgresql://postgres:postgres@localhost:5432/rie_db", env="DATABASE_URL")
    
    # Redis & Celery
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")

    # CORS
    ALLOWED_ORIGINS: str = Field(
        "http://localhost:5173,http://localhost:5174,http://localhost:5179,http://localhost:5400,https://app.rideclub.in",
        env="ALLOWED_ORIGINS",
    )

    @property
    def ALLOWED_ORIGINS_LIST(self) -> list:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str = Field("", env="FIREBASE_SERVICE_ACCOUNT_PATH")

    # TomTom (default fallback is the currently hardcoded key from the frontend - rotate this ASAP)
    TOMTOM_API_KEY: str = Field("GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ", env="TOMTOM_API_KEY")

    # Twilio (SOS SMS dispatch)
    TWILIO_ACCOUNT_SID: str = Field("", env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field("", env="TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER: str = Field("", env="TWILIO_FROM_NUMBER")

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
