from typing import Optional
from pydantic import BaseModel, Field


class FitAnalysisOutput(BaseModel):
    fit_rating: str = Field(description="One of: Strong Fit / Moderate Fit / Poor Fit")
    fit_justification: str = Field(description="A single sentence justifying the rating.")
    summary: str = Field(description="3–4 sentences assessing the fit.")
    matched_skills: list[str] = Field(description="List of strings with resume evidence.")
    missing_skills: list[str] = Field(description="List of strings that are genuinely absent.")
    seniority_gap: bool = Field(description="True if there is a seniority mismatch.")
    seniority_note: Optional[str] = Field(None, description="One sentence explaining the gap, or null.")


class ResumeOptimizationOutput(BaseModel):
    ats_keywords: list[str] = Field(description="List of 6–8 strings extracted from the JD.")
    professional_summary: str = Field(description="2–3 sentence professional summary.")
    skills: dict[str, list[str]] = Field(description="Dict mapping category names to lists of skill strings.")
    experience_bullets: dict[str, list[str]] = Field(description="Dict mapping each role/company to a list of rewritten bullet strings.")
    improvement_notes: list[str] = Field(description="List of strings flagging anything that could not be improved.")


class OutreachOutput(BaseModel):
    message: str = Field(description="The full outreach text as a single string, 4–6 lines.")
    company_name: Optional[str] = Field(None, description="Company name extracted from JD, or null.")
    hook_skills: list[str] = Field(description="List of 1–2 skills used as the hook.")


class CoverLetterOutput(BaseModel):
    salutation: str = Field(description="Salutation string.")
    opening_paragraph: str = Field(description="Opening paragraph string.")
    body_paragraph_1: str = Field(description="Body paragraph 1 string.")
    body_paragraph_2: str = Field(description="Body paragraph 2 string.")
    closing_paragraph: str = Field(description="Closing paragraph string.")
    sign_off: str = Field(description="Sign-off string.")
    company_name: str = Field(description="Company name extracted from JD.")
    word_count: int = Field(description="Integer word count.")
