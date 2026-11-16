import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "").strip()
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "memcode")
    MONGODB_TIMEOUT_MS: int = int(os.getenv("MONGODB_TIMEOUT_MS", "5000"))
    CORS_ORIGINS: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    )

    def validate(self) -> None:
        if len(self.SECRET_KEY.encode("utf-8")) < 32:
            raise RuntimeError(
                "SECRET_KEY must be configured with at least 32 bytes. "
                "Generate one with: openssl rand -hex 32"
            )
        if self.ALGORITHM not in {"HS256", "HS384", "HS512"}:
            raise RuntimeError("ALGORITHM must be HS256, HS384, or HS512.")
        if self.ACCESS_TOKEN_EXPIRE_MINUTES < 1:
            raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be positive.")
        if self.MONGODB_TIMEOUT_MS < 1:
            raise RuntimeError("MONGODB_TIMEOUT_MS must be positive.")
        if not self.MONGODB_URI:
            raise RuntimeError("MONGODB_URI must not be empty.")
        if not self.MONGODB_DATABASE:
            raise RuntimeError("MONGODB_DATABASE must not be empty.")


settings = Settings()
