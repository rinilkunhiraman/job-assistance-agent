from typing import Optional
from pydantic import BaseModel, Field


class FitAnalysisOutput(BaseModel):
    company_name: Optional[str] = Field(None, description="The name of the hiring company extracted from the JD.")
    fit_rating: str = Field(description="One of: Strong Fit / Moderate Fit / Poor Fit")
    fit_justification: str = Field(description="A single sentence justifying the rating.")
    summary: str = Field(description="3–4 sentences assessing the fit.")
    matched_skills: list[str] = Field(description="List of strings with resume evidence.")
    missing_skills: list[str] = Field(description="List of strings that are genuinely absent.")
    seniority_gap: bool = Field(description="True if there is a seniority mismatch.")
    seniority_note: Optional[str] = Field(None, description="One sentence explaining the gap, or null.")
    career_gap_detected: bool = Field(default=False, description="True if there is a significant chronological employment break.")
    career_gap_note: Optional[str] = Field(None, description="One sentence describing the identified employment break.")


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


class SkillGapItem(BaseModel):
    skill: str = Field(description="The missing skill or competency.")
    impact: str = Field(description="One of: High / Medium / Low — how much this gap hurts the application.")
    time_to_competency: str = Field(description="Realistic estimate to reach working proficiency, e.g. '2–4 weeks', '2–3 months'.")
    resource_type: str = Field(description="The most effective learning format, e.g. 'Hands-on project', 'Official docs + tutorial', 'Online course'.")
    concrete_action: str = Field(description="One specific, actionable step the candidate can take this week.")


class GapAnalysisOutput(BaseModel):
    overall_verdict: str = Field(description="1–2 sentences summarising the gap situation and whether it is bridgeable for this role.")
    quick_wins: list[str] = Field(description="List of gaps closable within 1–2 weeks. Empty list if none.")
    skill_gaps: list[SkillGapItem] = Field(description="List of SkillGapItem objects, one per missing skill, ordered by impact descending.")
    thirty_day_plan: list[str] = Field(description="Ordered list of 3–5 action steps to take in the first 30 days.")
    sixty_day_plan: list[str] = Field(description="Ordered list of 3–5 action steps to take in days 31–60.")
    ninety_day_plan: list[str] = Field(description="Ordered list of 3–5 action steps to take in days 61–90.")
    seniority_advice: Optional[str] = Field(None, description="Specific advice on bridging the seniority gap, or null if no seniority gap.")
    career_gap_advice: Optional[str] = Field(None, description="Strategic advice on positioning a career gap/employment break, or null.")