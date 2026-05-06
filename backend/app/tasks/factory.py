from crewai import Agent, Task
from app.schemas.job import JobRequest
from app.schemas.pipeline_outputs import (
    FitAnalysisOutput,
    ResumeOptimizationOutput,
    OutreachOutput,
    CoverLetterOutput,
)

def build_fit_task(agent: Agent, req: JobRequest) -> Task:
    return Task(
        description=f"""
Compare this candidate to the job.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Rules:
- Be realistic, not overly positive
- Identify actual gaps
- Highlight strongest matching skills
- Keep the fit summary concise and useful
""",
        expected_output="A structured evaluation with a summary, matched skills, and missing skills.",
        agent=agent,
        output_json=FitAnalysisOutput,
        async_execution=True,
    )

def build_resume_task(agent: Agent, req: JobRequest) -> Task:
    return Task(
        description=f"""
Rewrite and improve this candidate's resume content for the job below.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Additional Achievements:
{req.achievements}

Rules:
- Tailor content to the job requirements
- Use relevant keywords from the job description
- Keep the writing realistic and credible
- Do not invent experience
- Prefer strong bullet-style improvements over generic advice
""",
        expected_output="Structured text containing resume improvements.",
        agent=agent,
        output_json=ResumeOptimizationOutput,
        async_execution=True,
    )

def build_outreach_task(agent: Agent, req: JobRequest) -> Task:
    return Task(
        description=f"""
Write a short recruiter outreach message from the candidate.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Target Role: {req.target_role}
Tone: {req.tone}

Rules:
- First person only
- 4 to 6 lines maximum
- Mention 1 or 2 relevant skills or experiences
- Professional and confident
- End with a soft call to action
""",
        expected_output="A short outreach message.",
        agent=agent,
        output_json=OutreachOutput,
        async_execution=True,
    )

def build_cover_task(agent: Agent, req: JobRequest) -> Task:
    return Task(
        description=f"""
Write a tailored cover letter for this candidate and role.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Target Role: {req.target_role}
Tone: {req.tone}

Additional Achievements:
{req.achievements}

Rules:
- Personalize strongly to the job
- Reference relevant candidate experience
- Explain why the candidate is a strong fit
- Avoid generic filler
- Keep the tone natural and professional
""",
        expected_output="A full cover letter text.",
        agent=agent,
        output_json=CoverLetterOutput,
        async_execution=True,
    )
