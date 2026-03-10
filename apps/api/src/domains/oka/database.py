"""
OKA Database - Async SQLite engine for OKA job queue and settings.
Separate from the main LifeOs config (which uses Tauri Store).
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

# Store OKA database in user's app data directory
DATA_DIR = os.path.join(os.path.expanduser("~"), ".life-os", "oka")
os.makedirs(DATA_DIR, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{os.path.join(DATA_DIR, 'oka.db')}"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    import src.domains.oka.models  # Import models to register them with Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
