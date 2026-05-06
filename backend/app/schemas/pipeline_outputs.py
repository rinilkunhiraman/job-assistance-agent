from pydantic import BaseModel, Field


class FitAnalysisOutput(BaseModel):
    fit_summary: str = Field(description="A concise summary of how well the candidate fits the job.")
    matched_skills: list[str] = Field(description="List of key skills from the job description that the candidate possesses.")
    missing_skills: list[str] = Field(description="List of key skills from the job description that the candidate is missing.")


class ResumeOptimizationOutput(BaseModel):
    resume_improvements: str = Field(description="Suggested improvements for the candidate's resume, formatted clearly.")


class OutreachOutput(BaseModel):
    outreach_message: str = Field(description="A short, professional outreach message from the candidate to the recruiter.")


class CoverLetterOutput(BaseModel):
    cover_letter: str = Field(description="A tailored cover letter for the candidate and the role.")
