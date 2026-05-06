from pydantic import BaseModel, Field
from typing import List, Optional


# 🟢 Request Schema
class JobRequest(BaseModel):
    resume: str = Field(..., description="Full resume text")
    job_description: str = Field(..., description="Job description text")
    target_role: str = Field(..., description="Target role (e.g. Data Engineer)")
    
    experience_level: str = Field(
        ..., description="Entry | Mid | Senior"
    )
    
    tone: str = Field(
        ..., description="Professional | Friendly | Confident | Direct"
    )
    
    achievements: Optional[str] = Field(
        None, description="Optional key achievements"
    )


# 🟢 Keywords Schema
class Keywords(BaseModel):
    matched: List[str]
    missing: List[str]


# 🟢 Response Schema
class JobResponse(BaseModel):
    fit_summary: str
    resume_improvements: str
    outreach_message: str
    cover_letter: str
    keywords: Keywords