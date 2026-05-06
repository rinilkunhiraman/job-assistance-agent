import os
from dataclasses import dataclass
from functools import lru_cache


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    return int(value)


def _get_origins(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    value = os.getenv(name)
    if value is None:
        return default

    origins = tuple(
        origin.strip() for origin in value.split(",") if origin.strip()
    )
    return origins or default


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    log_level: str
    cors_origins: tuple[str, ...]
    cors_allow_credentials: bool
    ollama_model: str
    ollama_base_url: str
    crew_verbose: bool
    min_resume_chars: int
    min_job_description_chars: int
    max_resume_chars: int
    max_job_description_chars: int
    max_achievements_chars: int


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "AI Job Copilot API"),
        app_env=os.getenv("APP_ENV", "development"),
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        cors_origins=_get_origins(
            "CORS_ORIGINS",
            (
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ),
        ),
        cors_allow_credentials=_get_bool(
            "CORS_ALLOW_CREDENTIALS", True
        ),
        ollama_model=os.getenv("OLLAMA_MODEL", "ollama/gemma4"),
        ollama_base_url=os.getenv(
            "OLLAMA_BASE_URL", "http://localhost:11434"
        ),
        crew_verbose=_get_bool(
            "CREW_VERBOSE",
            os.getenv("APP_ENV", "development").lower() == "development",
        ),
        min_resume_chars=_get_int("MIN_RESUME_CHARS", 100),
        min_job_description_chars=_get_int(
            "MIN_JOB_DESCRIPTION_CHARS", 100
        ),
        max_resume_chars=_get_int("MAX_RESUME_CHARS", 20000),
        max_job_description_chars=_get_int(
            "MAX_JOB_DESCRIPTION_CHARS", 20000
        ),
        max_achievements_chars=_get_int(
            "MAX_ACHIEVEMENTS_CHARS", 4000
        ),
    )
