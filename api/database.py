"""
Async SQLAlchemy engine + session factory.
DATABASE_URL is injected by Zerops via envVariables/envSecrets.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# Zerops injects DATABASE_URL as postgresql://user:pass@db:5432/dbname
_raw_url = os.environ.get("DATABASE_URL", "")

if not _raw_url or "${" in _raw_url:
    # Construct from individual Zerops-injected vars
    db_user     = os.environ.get("db_user", "")
    db_password = os.environ.get("db_password", "")
    db_port     = os.environ.get("db_port", "5432")
    db_hostname = os.environ.get("db_hostname", "db")
    if db_user and db_password:
        _raw_url = f"postgresql://{db_user}:{db_password}@db:{db_port}/{db_hostname}"

if _raw_url.startswith("postgresql://"):
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql+asyncpg://"):
    DATABASE_URL = _raw_url
else:
    # Fallback to local SQLite if PostgreSQL env vars are missing or invalid
    DATABASE_URL = "sqlite+aiosqlite:///./mission_control.db"

if "sqlite" in DATABASE_URL:
    engine = create_async_engine(DATABASE_URL, echo=False)
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
