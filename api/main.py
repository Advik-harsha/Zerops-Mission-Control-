"""
Mission Control — FastAPI application.

Endpoints:
  GET  /health          — readiness probe (used by Zerops)
  GET  /api/services    — current service snapshots (REST)
  GET  /api/history     — paginated mission log (REST, for initial page load)
  WS   /ws              — live state updates
"""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import engine, Base, get_db
from models import ServiceSnapshot, MissionLogEntry
from poller import run_poller
from schemas import (
    StateUpdateMessage,
    ServiceState,
    LogEntryMsg,
    HistoryResponse,
    ServicesResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "*",  # Tightened to gui subdomain in production via env var
).split(",")

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    """Thread-safe WebSocket hub. Broadcasts JSON to all active connections."""

    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)
        logger.info("WS client connected. Total: %d", len(self._connections))

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            self._connections.discard(ws)
        logger.info("WS client disconnected. Total: %d", len(self._connections))

    async def broadcast(self, message: StateUpdateMessage):
        """Serialize and broadcast to all connected clients."""
        payload = message.model_dump_json()
        dead: list[WebSocket] = []
        async with self._lock:
            connections = set(self._connections)
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        # Clean up stale connections
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections.discard(ws)

    async def send_current_state(self, ws: WebSocket, last_message: StateUpdateMessage | None):
        """Send the last known state to a newly connected client."""
        if last_message:
            try:
                await ws.send_text(last_message.model_dump_json())
            except Exception:
                pass


manager = ConnectionManager()
_last_broadcast: StateUpdateMessage | None = None
_poller_task: asyncio.Task | None = None


async def _broadcast_fn(msg: StateUpdateMessage):
    global _last_broadcast
    _last_broadcast = msg
    await manager.broadcast(msg)


# ---------------------------------------------------------------------------
# Lifespan: create tables + start poller
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ready.")

    # Start background poller
    global _poller_task
    _poller_task = asyncio.create_task(run_poller(_broadcast_fn))
    logger.info("Poller task started.")

    yield

    # Shutdown: cancel poller gracefully
    if _poller_task and not _poller_task.done():
        _poller_task.cancel()
        try:
            await _poller_task
        except asyncio.CancelledError:
            pass
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Mission Control API",
    version="1.0.0",
    description="Real-time Zerops project visualisation backend.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["ops"])
async def health():
    """Zerops readiness probe."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/services", response_model=ServicesResponse, tags=["data"])
async def get_services(db: AsyncSession = Depends(get_db)):
    """
    Returns the most recent snapshot of each known service.
    Used by the GUI on initial load before WS connects.
    """
    # Get the most recent snapshot per service_id
    result = await db.execute(
        select(ServiceSnapshot)
        .order_by(desc(ServiceSnapshot.polled_at))
        .limit(50)
    )
    rows = result.scalars().all()

    # Deduplicate: keep only the latest per service_id
    seen: set[str] = set()
    services: list[ServiceState] = []
    for row in rows:
        if row.service_id not in seen:
            seen.add(row.service_id)
            services.append(ServiceState(
                id=row.service_id,
                name=row.service_name,
                service_type=row.service_type,
                status=row.status,
                container_count=row.container_count,
                last_updated=row.polled_at or datetime.now(timezone.utc),
            ))

    return ServicesResponse(
        services=services,
        polled_at=datetime.now(timezone.utc),
    )


@app.get("/api/history", response_model=HistoryResponse, tags=["data"])
async def get_history(
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the last N mission log entries.
    Used by the GUI MissionLog component on initial load.
    """
    result = await db.execute(
        select(MissionLogEntry)
        .order_by(desc(MissionLogEntry.occurred_at))
        .limit(limit)
    )
    rows = result.scalars().all()

    entries = [
        LogEntryMsg(
            id=row.id,
            event_type=row.event_type,
            service_name=row.service_name,
            message=row.message,
            severity=row.severity,
            occurred_at=row.occurred_at or datetime.now(timezone.utc),
        )
        for row in reversed(rows)  # Chronological order
    ]

    return HistoryResponse(entries=entries, total=len(entries))


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    Live state stream. Clients connect here and receive:
      - Immediate full_sync (last known state)
      - state_update messages every POLL_INTERVAL_SECONDS
    """
    await manager.connect(ws)

    # Send last known state immediately so the GUI doesn't wait for first poll
    await manager.send_current_state(ws, _last_broadcast)

    try:
        while True:
            # Keep connection alive; handle incoming pings from client
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=30.0)
                if data == "ping":
                    await ws.send_text('{"type":"pong"}')
            except asyncio.TimeoutError:
                # Send server-side keepalive
                try:
                    await ws.send_text('{"type":"ping"}')
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)
