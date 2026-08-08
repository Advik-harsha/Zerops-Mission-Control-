"""
SQLAlchemy ORM models for persisting Zerops API snapshots.
Tables are created on startup via Base.metadata.create_all().
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


def _gen_id() -> str:
    return str(uuid.uuid4())


class ServiceSnapshot(Base):
    """
    One row per service per polling cycle.
    Captures the instantaneous health picture.
    """
    __tablename__ = "service_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_gen_id)
    project_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    service_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    service_type: Mapped[str] = mapped_column(String(64), nullable=False)
    # ACTIVE | STOPPED | BUILDING | DEPLOYING | ERROR | UNKNOWN
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    container_count: Mapped[int] = mapped_column(Integer, default=0)
    polled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class PipelineEvent(Base):
    """
    One row per pipeline phase transition observed from /app-version.
    Deduplication key: (service_id, version_id, phase).
    """
    __tablename__ = "pipeline_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_gen_id)
    service_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    # App-version UUID from Zerops
    version_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    # BUILD | PREPARE_RUNTIME | DEPLOY | RUNNING
    phase: Mapped[str] = mapped_column(String(32), nullable=False)
    # QUEUED | RUNNING | DONE | FAILED
    phase_status: Mapped[str] = mapped_column(String(16), nullable=False)
    # Raw message / description from Zerops (if any)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    event_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    event_finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class MissionLogEntry(Base):
    """
    Human-readable flight-log entries — derived from service and pipeline events.
    These are what the MissionLog UI component displays.
    """
    __tablename__ = "mission_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_gen_id)
    # DEPLOY | STATUS_CHANGE | RESTART | SCALE | INFO | ERROR
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), default="INFO")  # INFO | WARN | ERROR | SUCCESS
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
