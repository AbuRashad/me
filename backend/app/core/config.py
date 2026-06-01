"""AbdoOS 5.0 — Configuration."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AbdoOS 5.0"
    # Database (PostgreSQL + pgvector). Falls back to SQLite for quick local runs.
    database_url: str = "sqlite+aiosqlite:///./abdoos.db"
    # AI backend: "ollama" (local) or "anthropic" (cloud)
    ai_backend: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:8b"
    ollama_embed_model: str = "nomic-embed-text"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
