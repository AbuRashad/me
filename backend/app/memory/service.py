"""Memory service — store, list, and build retrieval context for agents."""
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.memory.models import Memory, MemoryCreate, MemoryType

_TYPE_LABELS = {
    MemoryType.working: "ذاكرة عاملة",
    MemoryType.episodic: "ذاكرة أحداث",
    MemoryType.semantic: "ذاكرة معرفية",
    MemoryType.project: "ذاكرة مشاريع",
    MemoryType.relationship: "ذاكرة علاقات",
}


async def add_memory(session: AsyncSession, data: MemoryCreate) -> Memory:
    mem = Memory(**data.model_dump())
    session.add(mem)
    await session.commit()
    await session.refresh(mem)
    return mem


async def list_memories(session: AsyncSession, mem_type: MemoryType | None = None,
                        limit: int = 200) -> list[Memory]:
    stmt = select(Memory).order_by(Memory.created_at.desc()).limit(limit)
    if mem_type:
        stmt = stmt.where(Memory.type == mem_type)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def delete_memory(session: AsyncSession, mem_id: int) -> bool:
    mem = await session.get(Memory, mem_id)
    if not mem:
        return False
    await session.delete(mem)
    await session.commit()
    return True


async def build_context(session: AsyncSession, limit: int = 25) -> str:
    """Assemble recent memories into a context string for an agent prompt.

    In production this uses pgvector similarity search; here we use recency.
    """
    mems = await list_memories(session, limit=limit)
    return "\n".join(f"- [{_TYPE_LABELS.get(m.type, m.type)}] {m.text}" for m in mems)
