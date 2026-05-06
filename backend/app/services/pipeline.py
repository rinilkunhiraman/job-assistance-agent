import json
import logging
import re

from crewai import Agent, Crew, LLM, Task

from app.core.config import get_settings
from app.core.exceptions import PipelineExecutionError, PipelineOutputError
from app.schemas.job import JobRequest, JobResponse, Keywords

logger = logging.getLogger(__name__)
settings = get_settings()


def extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return {}

        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return {}


def parse_task_output(task_output: str, task_name: str) -> dict:
    data = extract_json(task_output)
    if data:
        return data

    logger.warning("task_output_parse_failed task=%s", task_name)
    raise PipelineOutputError(
        f"{task_name} returned an invalid response format"
    )


def require_text_field(data: dict, field_name: str, task_name: str) -> str:
    value = data.get(field_name)
    if isinstance(value, str) and value.strip():
        return value.strip()

    raise PipelineOutputError(
        f"{task_name} did not return a valid '{field_name}' value"
    )


def get_list_field(data: dict, field_name: str) -> list[str]:
    value = data.get(field_name, [])
    if not isinstance(value, list):
        return []

    return [
        item.strip()
        for item in value
        if isinstance(item, str) and item.strip()
    ]


def build_llm() -> LLM:
    return LLM(
        model=settings.ollama_model,
        base_url=settings.ollama_base_url,
    )


def run_job_pipeline(req: JobRequest) -> JobResponse:
    llm = build_llm()

    job_analyzer = Agent(
        role="Job Analyzer",
        goal="Extract structured insights from job descriptions",
        backstory="Expert in analyzing job postings",
        llm=llm,
    )

    candidate_profiler = Agent(
        role="Candidate Profiler",
        goal="Analyze resumes and identify strengths",
        backstory="Expert in evaluating candidate profiles",
        llm=llm,
    )

    fit_evaluator = Agent(
        role="Fit Evaluator",
        goal="Compare candidate with job requirements",
        backstory="Expert hiring analyst",
        llm=llm,
    )

    resume_optimizer = Agent(
        role="Resume Optimizer",
        goal="Improve resume based on job requirements",
        backstory="Professional resume writer",
        llm=llm,
    )

    outreach_writer = Agent(
        role="Candidate Outreach Specialist",
        goal=(
            "Write short, high-conversion messages FROM a candidate TO a "
            "recruiter or hiring manager"
        ),
        backstory=(
            "Expert in job search communication, helping candidates "
            "reach out professionally and confidently"
        ),
        llm=llm,
    )

    cover_letter_writer = Agent(
        role="Cover Letter Writer",
        goal="Write tailored cover letters",
        backstory="Expert in job applications",
        llm=llm,
    )

    job_analysis_task = Task(
        description=f"""
Analyze this job description:

{req.job_description}

Return ONLY valid JSON:
{{
  "skills": [],
  "tools": [],
  "requirements": []
}}
""",
        expected_output="JSON with skills, tools, requirements",
        agent=job_analyzer,
    )

    profile_task = Task(
        description=f"""
Analyze this resume:

{req.resume}

Return ONLY valid JSON:
{{
  "strengths": [],
  "experience_summary": "",
  "skills": []
}}
""",
        expected_output="Profile JSON",
        agent=candidate_profiler,
    )

    fit_task = Task(
        description=f"""
Compare job requirements and candidate profile.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Return ONLY valid JSON:
{{
  "fit_summary": "",
  "matched_skills": [],
  "missing_skills": []
}}

Instructions:
- Be realistic, not overly positive
- Identify actual gaps
- Highlight strongest matching skills
""",
        expected_output="Accurate fit analysis",
        agent=fit_evaluator,
    )

    resume_task = Task(
        description=f"""
You are improving a candidate's resume for a specific job.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Additional Achievements:
{req.achievements}

Instructions:
- Tailor resume content to match job requirements
- Use keywords from the job description
- Highlight relevant experience only
- Make bullet points results-oriented
- Do NOT invent fake experience
- Keep it realistic and credible

Return ONLY valid JSON:
{{
  "resume_improvements": ""
}}
""",
        expected_output="Personalized resume improvements",
        agent=resume_optimizer,
    )

    outreach_task = Task(
        description=f"""
Write a short outreach message FROM a candidate TO a recruiter.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Target Role: {req.target_role}
Tone: {req.tone}

Instructions:
- First person (I, my)
- Mention 1-2 relevant skills or experience
- Keep it concise (4-6 lines max)
- Professional and confident
- Include a soft call to action

Return ONLY valid JSON:
{{
  "outreach_message": ""
}}
""",
        expected_output="Personalized outreach message",
        agent=outreach_writer,
    )

    cover_letter_task = Task(
        description=f"""
You are writing a tailored cover letter.

Job Description:
{req.job_description}

Candidate Resume:
{req.resume}

Target Role: {req.target_role}
Tone: {req.tone}

Additional Achievements:
{req.achievements}

Instructions:
- Personalize strongly to the job
- Mention specific skills from the job description
- Reference candidate experience from resume
- Show why candidate is a strong fit
- Keep it natural and professional
- Avoid generic phrases

Structure:
- Intro (interest in role)
- Relevant experience
- Why fit
- Closing

Return ONLY valid JSON:
{{
  "cover_letter": ""
}}
""",
        expected_output="Highly personalized cover letter",
        agent=cover_letter_writer,
    )

    crew = Crew(
        agents=[
            job_analyzer,
            candidate_profiler,
            fit_evaluator,
            resume_optimizer,
            outreach_writer,
            cover_letter_writer,
        ],
        tasks=[
            job_analysis_task,
            profile_task,
            fit_task,
            resume_task,
            outreach_task,
            cover_letter_task,
        ],
        verbose=settings.crew_verbose,
        memory=False,
    )

    try:
        result = crew.kickoff()
        task_outputs = result.tasks_output
    except Exception as exc:
        logger.exception("pipeline_execution_failed")
        raise PipelineExecutionError() from exc

    if len(task_outputs) < 6:
        raise PipelineOutputError("AI pipeline returned incomplete task output")

    parse_task_output(task_outputs[0].raw, "job_analysis")
    parse_task_output(task_outputs[1].raw, "candidate_profile")
    fit_data = parse_task_output(task_outputs[2].raw, "fit_analysis")
    resume_data = parse_task_output(task_outputs[3].raw, "resume_optimization")
    outreach_data = parse_task_output(task_outputs[4].raw, "outreach_message")
    cover_data = parse_task_output(task_outputs[5].raw, "cover_letter")

    return JobResponse(
        fit_summary=require_text_field(
            fit_data,
            "fit_summary",
            "fit_analysis",
        ),
        resume_improvements=require_text_field(
            resume_data,
            "resume_improvements",
            "resume_optimization",
        ),
        outreach_message=require_text_field(
            outreach_data,
            "outreach_message",
            "outreach_message",
        ),
        cover_letter=require_text_field(
            cover_data,
            "cover_letter",
            "cover_letter",
        ),
        keywords=Keywords(
            matched=get_list_field(fit_data, "matched_skills"),
            missing=get_list_field(fit_data, "missing_skills"),
        ),
    )
