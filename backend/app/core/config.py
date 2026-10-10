import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "OnlineShop"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e7b9e")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Domains (Production default to online.shop)
    BASE_DOMAIN: str = os.getenv("BASE_DOMAIN", "online.shop")
    
    # Origins for CORS
    @property
    def CORS_ORIGINS(self) -> list[str]:
        base = self.BASE_DOMAIN
        origins = [
            f"https://{base}",
            f"https://admin.{base}",
            f"https://superadmin.{base}",
            f"https://operator.{base}",
            f"https://courier.{base}",
            f"https://api.{base}",
        ]
        # Add local development origins if needed
        local_origins = os.getenv("LOCAL_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        return origins + local_origins

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    USE_SQLITE: bool = os.getenv("USE_SQLITE", "true").lower() in ("true", "1", "yes")
    SQL_HOST: str = os.getenv("SQL_HOST", "127.0.0.1")
    SQL_USER: str = os.getenv("SQL_USER", "postgres")
    SQL_PASSWORD: str = os.getenv("SQL_PASSWORD", "password")
    SQL_DB_NAME: str = os.getenv("SQL_DB_NAME", "onlineshop")
    SQL_PORT: str = os.getenv("SQL_PORT", "5432")
    
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.USE_SQLITE:
            db_path = "/app/applet/backend/onlineshop.db"
            return f"sqlite+aiosqlite:///{db_path}"
        return f"postgresql+asyncpg://{self.SQL_USER}:{self.SQL_PASSWORD}@{self.SQL_HOST}:{self.SQL_PORT}/{self.SQL_DB_NAME}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL.replace("+asyncpg", "").replace("+aiosqlite", "")
        if self.USE_SQLITE:
            db_path = "/app/applet/backend/onlineshop.db"
            return f"sqlite:///{db_path}"
        # Needed for Alembic migrations which often use sync drivers
        return f"postgresql://{self.SQL_USER}:{self.SQL_PASSWORD}@{self.SQL_HOST}:{self.SQL_PORT}/{self.SQL_DB_NAME}"

settings = Settings()
