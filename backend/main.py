from __future__ import annotations

import os
from contextlib import asynccontextmanager
from dataclasses import dataclass

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

def split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]

@dataclass(frozen=True)
class Settings:
    database_url: str
    allowed_origins: list[str]

def get_settings() -> Settings:
    database_url = os.environ.get("ANALYTICS_DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("ANALYTICS_DATABASE_URL is not set")

    allowed_origins = split_csv(
        os.environ.get(
            "ANALYTICS_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://127.0.0.1:8080",
        )
    )

    return Settings(
        database_url=database_url,
        allowed_origins=allowed_origins,
    )

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)

class VisitIn(BaseModel):
    idempotency_key: str = Field(min_length=1, max_length=255)
    visitor_id: str = Field(min_length=1, max_length=255)
    path: str = Field(min_length=1, max_length=512)

class TrackListenIn(BaseModel):
    idempotency_key: str = Field(min_length=1, max_length=255)
    visitor_id: str = Field(min_length=1, max_length=255)
    track_id: str = Field(min_length=1, max_length=255)
    track_title: str = Field(min_length=1, max_length=512)
    listened_seconds: int = Field(ge=30, le=60 * 60 * 24)

class SiteStatsOut(BaseModel):
    total_visits: int
    unique_visitors: int
    listened_tracks: int

pool = AsyncConnectionPool(
    conninfo=settings.database_url,
    kwargs={"row_factory": dict_row},
    min_size=1,
    max_size=5,
    open=False,
)

async def init_db() -> None:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_visitors (
                    visitor_id TEXT PRIMARY KEY,
                    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            # Auto-migrate event_id to idempotency_key if it exists (for backwards compatibility)
            for table_name in ["analytics_visits", "analytics_track_listens"]:
                await cursor.execute(
                    "SELECT column_name FROM information_schema.columns WHERE table_name=%s AND column_name='event_id';",
                    (table_name,)
                )
                if await cursor.fetchone():
                    await cursor.execute(f"ALTER TABLE {table_name} RENAME COLUMN event_id TO idempotency_key;")
                    await cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT IF EXISTS {table_name}_event_id_key;")
                    await cursor.execute(f"ALTER TABLE {table_name} ADD CONSTRAINT {table_name}_idempotency_key_key UNIQUE (idempotency_key);")

            await cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_visits (
                    id BIGSERIAL PRIMARY KEY,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id),
                    path TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            await cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_track_listens (
                    id BIGSERIAL PRIMARY KEY,
                    idempotency_key TEXT NOT NULL UNIQUE,
                    visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id),
                    track_id TEXT NOT NULL,
                    track_title TEXT NOT NULL,
                    listened_seconds INTEGER NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            await cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_statistics (
                    id INTEGER PRIMARY KEY,
                    total_visits BIGINT NOT NULL DEFAULT 0,
                    unique_visitors BIGINT NOT NULL DEFAULT 0,
                    listened_tracks BIGINT NOT NULL DEFAULT 0
                );
                """
            )
            await cursor.execute(
                """
                INSERT INTO analytics_statistics (id, total_visits, unique_visitors, listened_tracks)
                SELECT 
                    1,
                    (SELECT COUNT(*) FROM analytics_visits),
                    (SELECT COUNT(*) FROM analytics_visitors),
                    (SELECT COUNT(*) FROM analytics_track_listens)
                ON CONFLICT (id) DO UPDATE
                SET 
                    total_visits = (SELECT COUNT(*) FROM analytics_visits),
                    unique_visitors = (SELECT COUNT(*) FROM analytics_visitors),
                    listened_tracks = (SELECT COUNT(*) FROM analytics_track_listens)
                WHERE analytics_statistics.total_visits = 0 AND (SELECT COUNT(*) FROM analytics_visits) > 0;
                """
            )
            
            # Triggers for O(1) stats lookup
            await cursor.execute(
                """
                CREATE OR REPLACE FUNCTION increment_visits()
                RETURNS TRIGGER AS $$
                BEGIN
                    UPDATE analytics_statistics SET total_visits = total_visits + 1 WHERE id = 1;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """
            )
            await cursor.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_increment_visits') THEN
                        CREATE TRIGGER trg_increment_visits
                        AFTER INSERT ON analytics_visits
                        FOR EACH ROW EXECUTE FUNCTION increment_visits();
                    END IF;
                END $$;
                """
            )

            await cursor.execute(
                """
                CREATE OR REPLACE FUNCTION increment_unique_visitors()
                RETURNS TRIGGER AS $$
                BEGIN
                    UPDATE analytics_statistics SET unique_visitors = unique_visitors + 1 WHERE id = 1;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """
            )
            await cursor.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_increment_unique_visitors') THEN
                        CREATE TRIGGER trg_increment_unique_visitors
                        AFTER INSERT ON analytics_visitors
                        FOR EACH ROW EXECUTE FUNCTION increment_unique_visitors();
                    END IF;
                END $$;
                """
            )

            await cursor.execute(
                """
                CREATE OR REPLACE FUNCTION increment_listened_tracks()
                RETURNS TRIGGER AS $$
                BEGIN
                    UPDATE analytics_statistics SET listened_tracks = listened_tracks + 1 WHERE id = 1;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """
            )
            await cursor.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_increment_listened_tracks') THEN
                        CREATE TRIGGER trg_increment_listened_tracks
                        AFTER INSERT ON analytics_track_listens
                        FOR EACH ROW EXECUTE FUNCTION increment_listened_tracks();
                    END IF;
                END $$;
                """
            )

        await connection.commit()

@asynccontextmanager
async def lifespan(_: FastAPI):
    await pool.open(wait=True)
    await init_db()
    try:
        yield
    finally:
        await pool.close()

app = FastAPI(title="main-page analytics", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

async def upsert_visitor(cursor, visitor_id: str) -> None:
    await cursor.execute(
        """
        INSERT INTO analytics_visitors (visitor_id)
        VALUES (%s)
        ON CONFLICT (visitor_id)
        DO UPDATE SET last_seen_at = NOW();
        """,
        (visitor_id,),
    )

@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/analytics/visits", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/second")
async def create_visit(request: Request, payload: VisitIn) -> dict[str, bool]:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await upsert_visitor(cursor, payload.visitor_id)
            await cursor.execute(
                """
                INSERT INTO analytics_visits (idempotency_key, visitor_id, path)
                VALUES (%s, %s, %s)
                ON CONFLICT (idempotency_key) DO NOTHING;
                """,
                (payload.idempotency_key, payload.visitor_id, payload.path),
            )
        await connection.commit()
    return {"accepted": True}

@app.post("/analytics/track-listens", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/second")
async def create_track_listen(request: Request, payload: TrackListenIn) -> dict[str, bool]:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await upsert_visitor(cursor, payload.visitor_id)
            await cursor.execute(
                """
                INSERT INTO analytics_track_listens (
                    idempotency_key,
                    visitor_id,
                    track_id,
                    track_title,
                    listened_seconds
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (idempotency_key) DO NOTHING;
                """,
                (
                    payload.idempotency_key,
                    payload.visitor_id,
                    payload.track_id,
                    payload.track_title,
                    payload.listened_seconds,
                ),
            )
        await connection.commit()
    return {"accepted": True}

@app.get("/analytics/stats", response_model=SiteStatsOut)
async def get_stats() -> SiteStatsOut:
    async with pool.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                SELECT total_visits, unique_visitors, listened_tracks 
                FROM analytics_statistics 
                WHERE id = 1;
                """
            )
            row = await cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="failed to load analytics stats",
        )

    return SiteStatsOut(**row)
