"""
Pydantic v2 schemas for:
  - Zerops API response parsing
  - WebSocket message broadcasting
  - REST endpoint responses
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Zerops API response shapes (what we parse from the upstream API)
# ---------------------------------------------------------------------------

class ZeropsService(BaseModel):
    """Parsed from GET /project/{id}/service-stack items."""
    id: str
    name: str
    # e.g. "python@3.11", "postgresql@14", "static@1"
    serviceType: str = ""
    # e.g. ACTIVE | STOPPED | BUILDING | DEPLOYING | ERROR
    status: str = "UNKNOWN"
    activeContainers: int = 0
    # Raw data passthrough for anything extra
    model_config = {"extra": "ignore"}


class ZeropsAppVersion(BaseModel):
    """Parsed from GET /app-version items."""
    id: str
    serviceStackId: str = ""
    # Pipeline phase: BUILD | PREPARE_RUNTIME | DEPLOY | RUNNING
    build: Optional[str] = None
    prepareRuntime: Optional[str] = None
    deploy: Optional[str] = None
    # Overall status: QUEUED | RUNNING | DONE | FAILED
    status: str = "UNKNOWN"
    created: Optional[datetime] = None
    lastUpdate: Optional[datetime] = None
    model_config = {"extra": "ignore"}


# ---------------------------------------------------------------------------
# WebSocket broadcast message shapes
# ---------------------------------------------------------------------------

class ServiceState(BaseModel):
    """Per-service state snapshot sent over WebSocket."""
    id: str
    name: str
    service_type: str
    status: str
    container_count: int
    last_updated: datetime


class PipelineEventMsg(BaseModel):
    """A pipeline phase event sent over WebSocket."""
    service_id: str
    service_name: str
    version_id: str
    phase: str          # BUILD | PREPARE_RUNTIME | DEPLOY | RUNNING
    phase_status: str   # QUEUED | RUNNING | DONE | FAILED
    message: Optional[str] = None
    event_started_at: Optional[datetime] = None
    event_finished_at: Optional[datetime] = None


class LogEntryMsg(BaseModel):
    """A mission-log entry sent over WebSocket."""
    id: str
    event_type: str
    service_name: Optional[str] = None
    message: str
    severity: str       # INFO | WARN | ERROR | SUCCESS
    occurred_at: datetime


class StateUpdateMessage(BaseModel):
    """
    Top-level WebSocket broadcast.
    type: "state_update" | "full_sync" | "ping"
    """
    type: str = "state_update"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    project_id: str = ""
    project_name: str = "mission-control"
    services: list[ServiceState] = []
    pipeline_events: list[PipelineEventMsg] = []
    log_entries: list[LogEntryMsg] = []


# ---------------------------------------------------------------------------
# REST endpoint response shapes
# ---------------------------------------------------------------------------

class HistoryResponse(BaseModel):
    entries: list[LogEntryMsg]
    total: int


class ServicesResponse(BaseModel):
    services: list[ServiceState]
    polled_at: datetime
