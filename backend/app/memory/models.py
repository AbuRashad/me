"""Memory engine models — the five memory types."""
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field


class MemoryType(str, Enum):
    working = "working"
    episodic = "episodic"
    semantic = "semantic"
    project = "project"
    relationship = "relationship"


class Memory(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    type: MemoryType = Field(default=MemoryType.working, index=True)
    text: str
    source: str = "manual"          # manual | agent | capture
    agent_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class MemoryCreate(SQLModel):
    type: MemoryType = MemoryType.working
    text: str
    source: str = "manual"
    agent_id: str | None = None
