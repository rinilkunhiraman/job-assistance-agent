from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.core.config import get_settings

settings = get_settings()

ExperienceLevel = Literal["Entry", "Mid", "Senior"]
Tone = Literal["Professional", "Friendly", "Confident", "Direct"]


class JobRequest(BaseModel):
    resume: str = Field(
        ...,
        min_length=settings.min_resume_chars,
        max_length=settings.max_resume_chars,
        description="Full resume text",
    )
    job_description: str = Field(
        ...,
        min_length=settings.min_job_description_chars,
        max_length=settings.max_job_description_chars,
        description="Job description text",
    )
    target_role: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Target role (e.g. Data Engineer)",
    )
    experience_level: ExperienceLevel = Field(
        ...,
        description="Entry | Mid | Senior",
    )
    tone: Tone = Field(
        ...,
        description="Professional | Friendly | Confident | Direct",
    )
    achievements: str | None = Field(
        None,
        max_length=settings.max_achievements_chars,
        description="Optional key achievements",
    )

    @field_validator(
        "resume",
        "job_description",
        "target_role",
        "achievements",
        mode="before",
    )
    @classmethod
    def strip_text_fields(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()

    @field_validator("resume", "job_description", "target_role")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value:
            raise ValueError("must not be empty")
        return value

    @field_validator("achievements")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        return value or None


class Keywords(BaseModel):
    matched: list[str]
    missing: list[str]


class JobResponse(BaseModel):
    fit_summary: str
    resume_improvements: str
    outreach_message: str
    cover_letter: str
    keywords: Keywords
