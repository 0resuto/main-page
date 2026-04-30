from __future__ import annotations

import os
from contextlib import asynccontextmanager
from dataclasses import dataclass

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


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
            "http://localhost:3000,http://127.0.0.1:3000",
        )
    )

    return Settings(
        database_url=database_url,
        allowed_origins=allowed_origins,
    )


settings = get_settings()


class VisitIn(BaseModel):
    event_id: str = Field(min_length=1, max_length=255)
    visitor_id: str = Field(min_length=1, max_length=255)
    path: str = Field(min_length=1, max_length=512)


class TrackListenIn(BaseModel):
    event_id: str = Field(min_length=1, max_length=255)
    visitor_id: str = Field(min_length=1, max_length=255)
    track_id: str = Field(min_length=1, max_length=255)
    track_title: str = Field(min_length=1, max_length=512)
    listened_seconds: int = Field(ge=30, le=60 * 60 * 24)


class SiteStatsOut(BaseModel):
    total_visits: int
    unique_visitors: int
    listened_tracks: int


pool = ConnectionPool(
    conninfo=settings.database_url,
    kwargs={"row_factory": dict_row},
    min_size=1,
    max_size=5,
    open=False,
)


def init_db() -> None:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_visitors (
                    visitor_id TEXT PRIMARY KEY,
                    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_visits (
                    id BIGSERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL UNIQUE,
                    visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id),
                    path TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS analytics_track_listens (
                    id BIGSERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL UNIQUE,
                    visitor_id TEXT NOT NULL REFERENCES analytics_visitors(visitor_id),
                    track_id TEXT NOT NULL,
                    track_title TEXT NOT NULL,
                    listened_seconds INTEGER NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
        connection.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    pool.open(wait=True)
    init_db()
    try:
        yield
    finally:
        pool.close()


app = FastAPI(title="main-page analytics", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


def upsert_visitor(visitor_id: str) -> None:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO analytics_visitors (visitor_id)
                VALUES (%s)
                ON CONFLICT (visitor_id)
                DO UPDATE SET last_seen_at = NOW();
                """,
                (visitor_id,),
            )
        connection.commit()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analytics/visits", status_code=status.HTTP_202_ACCEPTED)
def create_visit(payload: VisitIn) -> dict[str, bool]:
    upsert_visitor(payload.visitor_id)

    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO analytics_visits (event_id, visitor_id, path)
                VALUES (%s, %s, %s)
                ON CONFLICT (event_id) DO NOTHING;
                """,
                (payload.event_id, payload.visitor_id, payload.path),
            )
        connection.commit()

    return {"accepted": True}


@app.post("/analytics/track-listens", status_code=status.HTTP_202_ACCEPTED)
def create_track_listen(payload: TrackListenIn) -> dict[str, bool]:
    if payload.listened_seconds < 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="listen threshold has not been reached",
        )

    upsert_visitor(payload.visitor_id)

    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO analytics_track_listens (
                    event_id,
                    visitor_id,
                    track_id,
                    track_title,
                    listened_seconds
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (event_id) DO NOTHING;
                """,
                (
                    payload.event_id,
                    payload.visitor_id,
                    payload.track_id,
                    payload.track_title,
                    payload.listened_seconds,
                ),
            )
        connection.commit()

    return {"accepted": True}


@app.get("/analytics/stats", response_model=SiteStatsOut)
def get_stats() -> SiteStatsOut:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    (SELECT COUNT(*)::BIGINT FROM analytics_visits) AS total_visits,
                    (SELECT COUNT(*)::BIGINT FROM analytics_visitors) AS unique_visitors,
                    (SELECT COUNT(*)::BIGINT FROM analytics_track_listens) AS listened_tracks;
                """
            )
            row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="failed to load analytics stats",
        )

    return SiteStatsOut(**row)
