import json
import re
from crewai import Agent, Task, Crew, LLM

from app.schemas.job import JobRequest, JobResponse, Keywords


# ---------------------------
# 🔧 JSON Extraction (Robust)
# ---------------------------
def extract_json(text: str):
    """
    Extract valid JSON from LLM output, even if wrapped in extra text.
    """
    try:
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                return {}
    return {}


# ---------------------------
# 🔁 Retry Wrapper
# ---------------------------
def safe_task_output(task_output: str, retries: int = 2):
    for _ in range(retries):
        data = extract_json(task_output)
        if data:
            return data
    return {}


# ---------------------------
# 🚀 Main Pipeline
# ---------------------------
def run_job_pipeline(req: JobRequest) -> JobResponse:

    # 🔹 LLM (Ollama)
    llm = LLM(
        model="ollama/gemma4",
        base_url="http://localhost:11434"
    )

    # ---------------------------
    # 🤖 Agents
    # ---------------------------

    job_analyzer = Agent(
        role="Job Analyzer",
        goal="Extract structured insights from job descriptions",
        backstory="Expert in analyzing job postings",
        llm=llm
    )

    candidate_profiler = Agent(
        role="Candidate Profiler",
        goal="Analyze resumes and identify strengths",
        backstory="Expert in evaluating candidate profiles",
        llm=llm
    )

    fit_evaluator = Agent(
        role="Fit Evaluator",
        goal="Compare candidate with job requirements",
        backstory="Expert hiring analyst",
        llm=llm
    )

    resume_optimizer = Agent(
        role="Resume Optimizer",
        goal="Improve resume based on job requirements",
        backstory="Professional resume writer",
        llm=llm
    )

    outreach_writer = Agent(
    role="Candidate Outreach Specialist",
    goal="Write short, high-conversion messages FROM a candidate TO a recruiter or hiring manager",
    backstory="Expert in job search communication, helping candidates reach out professionally and confidently",
    llm=llm
)

    cover_letter_writer = Agent(
        role="Cover Letter Writer",
        goal="Write tailored cover letters",
        backstory="Expert in job applications",
        llm=llm
    )

    # ---------------------------
    # 📋 Tasks (STRICT JSON)
    # ---------------------------

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
        agent=job_analyzer
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
        agent=candidate_profiler
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
    agent=fit_evaluator
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
    agent=resume_optimizer
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
- Mention 1–2 relevant skills or experience
- Keep it concise (4–6 lines max)
- Professional and confident
- Include a soft call to action

Return ONLY valid JSON:
{{
  "outreach_message": ""
}}
""",
    expected_output="Personalized outreach message",
    agent=outreach_writer
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
    agent=cover_letter_writer
)

    # ---------------------------
    # 🧠 Crew Execution
    # ---------------------------

    crew = Crew(
        agents=[
            job_analyzer,
            candidate_profiler,
            fit_evaluator,
            resume_optimizer,
            outreach_writer,
            cover_letter_writer
        ],
        tasks=[
            job_analysis_task,
            profile_task,
            fit_task,
            resume_task,
            outreach_task,
            cover_letter_task
        ],
        verbose=True,
        memory=False
    )

    try:
        result = crew.kickoff()
        task_outputs = result.tasks_output
    except Exception:
        return JobResponse(
            fit_summary="System error occurred.",
            resume_improvements="",
            outreach_message="",
            cover_letter="",
            keywords=Keywords(matched=[], missing=[])
        )

    # ---------------------------
    # 📊 Parse Outputs Safely
    # ---------------------------

    job_data = safe_task_output(task_outputs[0].raw)
    profile_data = safe_task_output(task_outputs[1].raw)
    fit_data = safe_task_output(task_outputs[2].raw)
    resume_data = safe_task_output(task_outputs[3].raw)
    outreach_data = safe_task_output(task_outputs[4].raw)
    cover_data = safe_task_output(task_outputs[5].raw)

    # ---------------------------
    # 📦 Final Response
    # ---------------------------

    return JobResponse(
        fit_summary=fit_data.get(
            "fit_summary",
            "Unable to generate fit summary."
        ),

        resume_improvements=resume_data.get(
            "resume_improvements",
            "No improvements generated."
        ),

        outreach_message=outreach_data.get(
            "outreach_message",
            "Unable to generate outreach message."
        ),

        cover_letter=cover_data.get(
            "cover_letter",
            "Unable to generate cover letter."
        ),

        keywords=Keywords(
            matched=fit_data.get("matched_skills", []),
            missing=fit_data.get("missing_skills", [])
        )
    )