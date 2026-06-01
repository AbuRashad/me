"""Database — async engine + session. Works with SQLite (dev) or PostgreSQL (prod)."""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False, future=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    # Import models so they register on metadata before create_all.
    from app.memory import models as _memory_models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
