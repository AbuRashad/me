"""API routes — agents, memory, briefings."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_session
from app.core import ai
from app.agents.definitions import AGENTS
from app.memory import service as memory_service
from app.memory.models import MemoryCreate, MemoryType

router = APIRouter(prefix="/api")


# ---- Agents ----
class ChatRequest(BaseModel):
    messages: list[dict]          # [{role, content}, ...]
    use_memory: bool = True


@router.get("/agents")
async def list_agents():
    return [{"id": a.id, "name": a.name, "role": a.role} for a in AGENTS.values()]


@router.post("/agents/{agent_id}/chat")
async def chat_with_agent(agent_id: str, req: ChatRequest,
                          session: AsyncSession = Depends(get_session)):
    agent = AGENTS.get(agent_id)
    if not agent:
        raise HTTPException(404, "agent not found")
    context = await memory_service.build_context(session) if req.use_memory else ""
    reply = await ai.chat(agent.system, req.messages, context)
    return {"agent": agent_id, "reply": reply}


# ---- Memory ----
@router.get("/memories")
async def get_memories(type: MemoryType | None = None,
                       session: AsyncSession = Depends(get_session)):
    return await memory_service.list_memories(session, type)


@router.post("/memories")
async def create_memory(data: MemoryCreate,
                        session: AsyncSession = Depends(get_session)):
    return await memory_service.add_memory(session, data)


@router.delete("/memories/{mem_id}")
async def remove_memory(mem_id: int, session: AsyncSession = Depends(get_session)):
    ok = await memory_service.delete_memory(session, mem_id)
    if not ok:
        raise HTTPException(404, "memory not found")
    return {"deleted": mem_id}


# ---- Briefings ----
@router.post("/briefing/morning")
async def morning_briefing(session: AsyncSession = Depends(get_session)):
    context = await memory_service.build_context(session)
    system = (AGENTS["ceo"].system +
              " اكتب موجزاً تنفيذياً صباحياً تحت العناوين: أهم الأولويات، المخاطر، "
              "الفرص، أشخاص للتواصل معهم، حالة المشاريع.")
    reply = await ai.chat(system, [{"role": "user", "content": "اكتب موجز اليوم."}], context)
    return {"briefing": reply}


@router.post("/briefing/night")
async def night_review(session: AsyncSession = Depends(get_session)):
    context = await memory_service.build_context(session)
    system = (AGENTS["ceo"].system +
              " اكتب مراجعة مسائية تحت العناوين: الإنجازات، الأخطاء، الدروس، "
              "الحلقات المفتوحة، خطة الغد.")
    reply = await ai.chat(system, [{"role": "user", "content": "اكتب مراجعة المساء."}], context)
    return {"review": reply}
