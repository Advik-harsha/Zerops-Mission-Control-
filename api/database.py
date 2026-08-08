"""
Async SQLAlchemy engine + session factory.
DATABASE_URL is injected by Zerops via envVariables/envSecrets.
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# Zerops injects DATABASE_URL as postgresql://user:pass@db:5432/dbname
# We must swap the scheme to postgresql+asyncpg:// for asyncpg driver
_raw_url = os.environ.get("DATABASE_URL", "")
if _raw_url.startswith("postgresql://"):
    DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    DATABASE_URL = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = _raw_url

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
