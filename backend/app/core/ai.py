"""AI provider — switchable between local Ollama and cloud Anthropic."""
import httpx
from app.core.config import get_settings

settings = get_settings()


async def chat(system: str, messages: list[dict], context: str = "") -> str:
    """Run a chat completion against the configured backend."""
    full_system = system + (f"\n\nسياق من ذاكرة عبدالله:\n{context}" if context else "")

    if settings.ai_backend == "anthropic":
        return await _anthropic_chat(full_system, messages)
    return await _ollama_chat(full_system, messages)


async def _ollama_chat(system: str, messages: list[dict]) -> str:
    payload = {
        "model": settings.ollama_model,
        "messages": [{"role": "system", "content": system}, *messages],
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{settings.ollama_base_url}/api/chat", json=payload)
        r.raise_for_status()
        return r.json()["message"]["content"].strip()


async def _anthropic_chat(system: str, messages: list[dict]) -> str:
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": settings.anthropic_model,
        "max_tokens": 1024,
        "system": system,
        "messages": messages,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
        r.raise_for_status()
        blocks = r.json()["content"]
        return "".join(b["text"] for b in blocks if b["type"] == "text").strip()


async def embed(text: str) -> list[float]:
    """Generate an embedding vector (Ollama nomic-embed-text)."""
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{settings.ollama_base_url}/api/embeddings",
            json={"model": settings.ollama_embed_model, "prompt": text},
        )
        r.raise_for_status()
        return r.json()["embedding"]
