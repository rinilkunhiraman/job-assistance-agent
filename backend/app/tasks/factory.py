from crewai import Agent, Task
from app.schemas.job import JobRequest
from app.schemas.pipeline_outputs import (
    FitAnalysisOutput,
    ResumeOptimizationOutput,
    OutreachOutput,
    CoverLetterOutput,
    GapAnalysisOutput,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SECTION_SEP = "=" * 60

def _experience_context(level: str) -> str:
    """
    Return a short calibration note based on the candidate's experience level.
    Used consistently across all tasks so tone and positioning are cohesive.
    """
    level = (level or "mid").lower()
    mapping = {
        "junior": (
            "The candidate is JUNIOR level (0–2 years). "
            "Emphasise learning velocity, relevant projects, and transferable skills. "
            "Avoid overclaiming seniority. Highlight potential over track record."
        ),
        "mid": (
            "The candidate is MID level (2–5 years). "
            "Balance demonstrated delivery with growth trajectory. "
            "Highlight ownership, autonomy, and tangible impact."
        ),
        "senior": (
            "The candidate is SENIOR level (5–10 years). "
            "Emphasise scope of impact, technical leadership, and system-level thinking. "
            "Language should carry authority and confidence."
        ),
        "lead": (
            "The candidate is LEAD / STAFF level (8+ years). "
            "Emphasise cross-team influence, architectural decisions, mentorship, and "
            "measurable organisational impact. Avoid junior-sounding phrasing."
        ),
        "executive": (
            "The candidate is EXECUTIVE level (VP / Director / C-suite). "
            "Focus on strategic vision, business outcomes, stakeholder alignment, and "
            "team-building. Minimise individual-contributor framing."
        ),
    }
    return mapping.get(level, mapping["mid"])


def _tone_context(tone: str) -> str:
    """Map the user-selected tone to a concrete writing instruction."""
    tone = (tone or "professional").lower()
    mapping = {
        "professional": "Tone: formal, precise, and confident. No colloquialisms.",
        "conversational": "Tone: warm and direct. Reads like a smart human wrote it, not a template.",
        "enthusiastic": "Tone: energetic and genuine. Show real excitement without hyperbole.",
        "concise": "Tone: ruthlessly brief. Every word must earn its place. No filler.",
    }
    return mapping.get(tone, mapping["professional"])


# ---------------------------------------------------------------------------
# Task builders
# ---------------------------------------------------------------------------

def build_fit_task(agent: Agent, req: JobRequest) -> Task:
    experience_note = _experience_context(req.experience_level)
    company_note = f"Company: {req.company_name}" if req.company_name else "Company: [Extract from JD]"

    return Task(
        description=f"""
You are evaluating how well a candidate matches a specific job.
Your goal is an honest, evidence-based assessment — not a sales pitch.

{SECTION_SEP}
CANDIDATE CONTEXT
{SECTION_SEP}
{experience_note}
{company_note}

{SECTION_SEP}
JOB DESCRIPTION
{SECTION_SEP}
{req.job_description}

{SECTION_SEP}
CANDIDATE RESUME
{SECTION_SEP}
{req.resume}

{SECTION_SEP}
INSTRUCTIONS
{SECTION_SEP}
Step 1 — Extract requirements and company info.
  Identify the top 8–10 hard requirements from the job description
  (skills, tools, seniority signals, domain knowledge).
  Also, identify the name of the company hiring for this role.

Step 2 — Match against resume.
  For each requirement, decide: Matched / Partial / Missing.
  - Matched: Explicit evidence exists in the resume.
  - Partial: Candidate has adjacent experience but is missing the specific tool/scale.
  - Missing: Genuinely absent.
  Base this only on evidence in the resume. Do not infer or assume.

Step 3 — Assess seniority and career gaps.
  - Does the candidate's experience level match what the role actually requires?
  - Are there any significant chronological employment breaks (6+ months)?
  - State clearly if there is a seniority gap or a career gap.

Step 4 — Assign an overall fit rating.
  Choose exactly one: Strong Fit / Moderate Fit / Poor Fit
  Provide a single sentence justifying the rating.

Step 5 — Write the summary.
  3–4 sentences. Realistic, specific, and useful to the candidate.
  Do not soften gaps. Do not manufacture positives.

Rules:
- Base all claims on the resume text only — never invent or infer experience
- Be realistic, not overly positive
- A mismatch in seniority level is a gap, even if technical skills overlap
- Matched keywords must appear explicitly in the resume
- Partial or Missing keywords must BOTH be added to the 'missing_skills' list
- Missing keywords must be genuinely absent, not just phrased differently
""",
        expected_output=(
            "A JSON object matching FitAnalysisOutput with fields: "
            "company_name (string, the name of the hiring company, or null if not found), "
            "fit_rating (one of: Strong Fit / Moderate Fit / Poor Fit), "
            "fit_justification (one sentence), "
            "summary (3–4 sentences), "
            "matched_skills (list of strings with resume evidence), "
            "missing_skills (list of strings that are genuinely absent), "
            "seniority_gap (bool), "
            "seniority_note (one sentence, or null if no gap), "
            "career_gap_detected (bool), "
            "career_gap_note (one sentence describing the gap, or null)."
        ),
        agent=agent,
        output_json=FitAnalysisOutput,
        async_execution=True,
    )


def build_resume_task(agent: Agent, req: JobRequest, fit_context: FitAnalysisOutput = None) -> Task:
    experience_note = _experience_context(req.experience_level)
    
    # Use manual input if provided, otherwise use AI-extracted name from fit analysis
    company_name = req.company_name or (fit_context.company_name if fit_context else None) or "[Extract from JD]"
    company_note = f"Company: {company_name}"

    fit_note = ""
    if fit_context:
        fit_note = f"""
{SECTION_SEP}
FIT ANALYSIS CONTEXT
{SECTION_SEP}
The technical fit evaluator found these matched skills: {', '.join(fit_context.matched_skills)}
The candidate is missing these skills: {', '.join(fit_context.missing_skills)}
Fit Rating: {fit_context.fit_rating}
Fit Justification: {fit_context.fit_justification}
Summary: {fit_context.summary}
"""

    return Task(
        description=f"""
You are a senior technical recruiter and resume specialist.
Rewrite and improve this candidate's resume content for the specific job below.

{SECTION_SEP}
CANDIDATE CONTEXT
{SECTION_SEP}
{experience_note}
{company_note}
{fit_note}

{SECTION_SEP}
JOB DESCRIPTION
{SECTION_SEP}
{req.job_description}

{SECTION_SEP}
CANDIDATE RESUME
{SECTION_SEP}
{req.resume}

{SECTION_SEP}
ADDITIONAL ACHIEVEMENTS
{SECTION_SEP}
{req.achievements or "None provided."}

{SECTION_SEP}
INSTRUCTIONS
{SECTION_SEP}
Step 1 — Extract ATS keywords.
  Identify the 6–8 most important technical keywords and phrases from the job description.
  These are terms an ATS would scan for. Prefer exact phrases over paraphrases.

Step 2 — Rewrite the professional summary.
  2–3 sentences. Opens with the candidate's level and domain.
  Weave in 2–3 of the top ATS keywords naturally.
  Calibrated to {req.experience_level} level positioning.

Step 3 — Rewrite the skills section.
  Grouped by category (e.g. Languages, Frameworks, Tools, Cloud).
  Include all matched keywords from Step 1.
  Remove skills not relevant to this role.

Step 4 — Rewrite experience bullets.
  For each role in the resume, rewrite 3–5 bullets.
  Format: [Action verb] + [what you did] + [measurable outcome or scope].
  Incorporate ATS keywords where they fit naturally.
  If the candidate provided achievements, weave them into the most relevant role.
  Do not invent metrics. If no metric exists, describe scope instead.

Step 5 — Flag anything you could not improve.
  If a section of the resume has no relevant content for this role, note it.

Rules:
- Never invent experience, skills, or metrics
- Do not use generic phrases like "results-driven" or "team player"
- Each bullet must start with a strong past-tense action verb
- ATS keywords from Step 1 must each appear at least once in the final output
- Keep writing credible — a hiring manager will read this too
""",
        expected_output=(
            "A JSON object matching ResumeOptimizationOutput with fields: "
            "ats_keywords (list of 6–8 strings extracted from the JD), "
            "professional_summary (2–3 sentence string), "
            "skills (dict mapping category names to lists of skill strings), "
            "experience_bullets (dict mapping each role/company to a list of rewritten bullet strings), "
            "improvement_notes (list of strings flagging anything that could not be improved)."
        ),
        agent=agent,
        output_json=ResumeOptimizationOutput,
        async_execution=True,
    )


def build_outreach_task(agent: Agent, req: JobRequest, fit_context: FitAnalysisOutput = None) -> Task:
    experience_note = _experience_context(req.experience_level)
    tone_note = _tone_context(req.tone)
    
    # Use manual input if provided, otherwise use AI-extracted name from fit analysis
    company_name = req.company_name or (fit_context.company_name if fit_context else None) or "[Extract from JD]"
    company_note = f"Company: {company_name}"

    fit_note = ""
    if fit_context:
        fit_note = f"""
{SECTION_SEP}
FIT ANALYSIS CONTEXT
{SECTION_SEP}
Matched skills to highlight: {', '.join(fit_context.matched_skills)}
Fit Summary: {fit_context.summary}
"""

    return Task(
        description=f"""
Write a short, genuine recruiter outreach message from the candidate.
This is a cold message — probably sent on LinkedIn or via email.
It must feel human, not templated.

{SECTION_SEP}
CANDIDATE CONTEXT
{SECTION_SEP}
{experience_note}
{tone_note}
{company_note}
{fit_note}

{SECTION_SEP}
JOB DESCRIPTION
{SECTION_SEP}
{req.job_description}

{SECTION_SEP}
CANDIDATE RESUME
{SECTION_SEP}
{req.resume}

{SECTION_SEP}
TARGET ROLE: {req.target_role}

{SECTION_SEP}
INSTRUCTIONS
{SECTION_SEP}
Step 1 — Extract the company name from the job description if present.
Step 2 — Identify the 1–2 strongest matches between the candidate and the role.
  These become the hook — the reason why this candidate is worth a reply.
Step 3 — Write the message.

Structure:
  Line 1: Specific opener — mention the role and company by name.
  Lines 2–3: 1–2 relevant skills or experiences that directly match the role.
             Be specific. Avoid generic claims.
  Line 4: One sentence showing genuine interest in this role (not just any role).
  Line 5: Soft call to action — invite a conversation, not a commitment.

Rules:
- First person only
- 4 to 6 lines maximum — brevity is respect for the recruiter's time
- No "I am reaching out because..." openers
- No generic phrases: "passionate", "excited to leverage", "synergy"
- Do not claim skills or experience not present in the resume
- The message should sound like the candidate wrote it, not an AI
- Calibrate confidence to the candidate's experience level
""",
        expected_output=(
            "A JSON object matching OutreachOutput with fields: "
            "message (the full outreach text as a single string, 4–6 lines), "
            "company_name (string extracted from JD, or null if not found), "
            "hook_skills (list of 1–2 strings — the skills used as the hook)."
        ),
        agent=agent,
        output_json=OutreachOutput,
        async_execution=True,
    )


def build_cover_task(agent: Agent, req: JobRequest, fit_context: FitAnalysisOutput = None) -> Task:
    experience_note = _experience_context(req.experience_level)
    tone_note = _tone_context(req.tone)
    
    # Use manual input if provided, otherwise use AI-extracted name from fit analysis
    company_name = req.company_name or (fit_context.company_name if fit_context else None) or "[Extract from JD]"
    company_note = f"Company: {company_name}"

    fit_note = ""
    if fit_context:
        fit_note = f"""
{SECTION_SEP}
FIT ANALYSIS CONTEXT
{SECTION_SEP}
Matched skills to highlight: {', '.join(fit_context.matched_skills)}
Gaps to potentially address or pivot away from: {', '.join(fit_context.missing_skills)}
Fit Rating: {fit_context.fit_rating}
Fit Summary: {fit_context.summary}
"""

    return Task(
        description=f"""
Write a tailored, specific cover letter for this candidate and role.
This is not a template fill-in. It should read like a human wrote it
specifically for this company and this role.

{SECTION_SEP}
CANDIDATE CONTEXT
{SECTION_SEP}
{experience_note}
{tone_note}
{company_note}
{fit_note}

{SECTION_SEP}
JOB DESCRIPTION
{SECTION_SEP}
{req.job_description}

{SECTION_SEP}
CANDIDATE RESUME
{SECTION_SEP}
{req.resume}

{SECTION_SEP}
TARGET ROLE: {req.target_role}

{SECTION_SEP}
ADDITIONAL ACHIEVEMENTS
{SECTION_SEP}
{req.achievements or "None provided."}

{SECTION_SEP}
INSTRUCTIONS
{SECTION_SEP}
Step 1 — Extract context from the job description.
  - Company name (use it throughout — never write "your company")
  - Hiring manager name if present (use it in the salutation; otherwise "Hiring Team")
  - The 2–3 most important requirements the role is hiring for
  - Any signals about company culture, mission, or values

Step 2 — Map the candidate to those requirements.
  For each of the top 2–3 requirements, identify the strongest matching
  experience or achievement from the resume or additional achievements.
  These become the body paragraphs.

Step 3 — Write the cover letter.

Structure:
  Salutation: "Dear [Name / Hiring Team],"

  Opening paragraph (3–4 sentences):
    - Name the role and company explicitly in sentence one
    - State the strongest reason this candidate is a fit
    - Do not open with "I am writing to apply for..."

  Body paragraph 1 (3–4 sentences):
    - Address requirement #1 from Step 2
    - Use a specific example from the resume or achievements
    - Include a metric or scope indicator if available

  Body paragraph 2 (3–4 sentences):
    - Address requirement #2 or #3
    - Again, specific example — not generic claims
    - Weave in a relevant keyword from the job description

  Closing paragraph (2–3 sentences):
    - Express genuine interest in this specific company (reference something
      real from the JD — their product, mission, or growth stage)
    - Soft call to action
    - No "thank you for your consideration" clichés

  Sign-off: "Best regards," + candidate name placeholder if not in resume

Rules:
- Never use: "I am a fast learner", "team player", "passionate about technology",
  "results-driven", "I am writing to express my interest"
- Never mention skills or experience not evidenced in the resume
- Company name must appear at least twice in the letter
- Length: 4 paragraphs, 250–350 words total
- The tone must match: {req.tone}
- Calibrate seniority of language to: {req.experience_level}
""",
        expected_output=(
            "A JSON object matching CoverLetterOutput with fields: "
            "salutation (string), "
            "opening_paragraph (string), "
            "body_paragraph_1 (string), "
            "body_paragraph_2 (string), "
            "closing_paragraph (string), "
            "sign_off (string), "
            "company_name (string extracted from JD), "
            "word_count (integer)."
        ),
        agent=agent,
        output_json=CoverLetterOutput,
        async_execution=True,
    )


def build_gap_task(agent: Agent, req: JobRequest, fit_context: FitAnalysisOutput) -> Task:
    """
    Build the gap analysis task. Requires fit_context — must be called after
    fit analysis completes. Runs in parallel with resume, outreach, cover letter.
    """
    experience_note = _experience_context(req.experience_level)

    # Format missing skills as a numbered list for clarity
    missing_skills_list = "\n".join(
        f"  {i + 1}. {skill}" for i, skill in enumerate(fit_context.missing_skills)
    ) or "  None identified."

    seniority_block = ""
    if fit_context.seniority_gap and fit_context.seniority_note:
        seniority_block = f"""
{SECTION_SEP}
SENIORITY GAP
{SECTION_SEP}
A seniority mismatch was identified: {fit_context.seniority_note}
Address this directly in seniority_advice — give the candidate concrete positioning
and growth actions, not generic encouragement.
"""

    return Task(
        description=f"""
You are producing a concrete, prioritised skills gap action plan for a candidate
who wants to become more competitive for a specific role.

Your output must be specific and actionable. "Take an online course" is not acceptable.
"Complete the official Kubernetes documentation hands-on tutorial and deploy a
3-service app locally" is acceptable.

{SECTION_SEP}
CANDIDATE CONTEXT
{SECTION_SEP}
{experience_note}
Target Role: {req.target_role}

{SECTION_SEP}
FIT ANALYSIS RESULTS
{SECTION_SEP}
Fit Rating: {fit_context.fit_rating}
Fit Justification: {fit_context.fit_justification}
Fit Summary: {fit_context.summary}

Matched Skills (do NOT include these in gap analysis):
{', '.join(fit_context.matched_skills) or 'None'}

Missing Skills (these are your primary input):
{missing_skills_list}
{seniority_block}

{SECTION_SEP}
CAREER GAP CONTEXT
{SECTION_SEP}
Career gap detected: {fit_context.career_gap_detected}
Gap note: {fit_context.career_gap_note or 'None identified.'}

{SECTION_SEP}
JOB DESCRIPTION
{SECTION_SEP}
{req.job_description}

{SECTION_SEP}
INSTRUCTIONS
{SECTION_SEP}
Step 1 — Triage the missing skills by impact.
  For each missing skill, assess: how much does this gap hurt the candidate's
  chances for THIS specific role? Rate each High / Medium / Low.
  High = role cannot proceed without it or it is explicitly required.
  Medium = mentioned in JD, would strengthen the application.
  Low = nice to have, unlikely to be a deciding factor.

Step 2 — Identify quick wins.
  Which gaps can a motivated candidate close in 1–2 weeks?
  These are typically: a specific tool with good docs, a framework the candidate
  already has adjacent experience with, or a concept they likely know but haven't
  formalised. List them explicitly.

Step 3 — For each missing skill listed in 'Missing Skills' above, produce a SkillGapItem.
  - skill: the gap name exactly as listed above
  - impact: High / Medium / Low from Step 1
  - time_to_competency: realistic estimate (be honest — don't undersell hard skills)
  - resource_type: the most effective format for THIS skill specifically
    (e.g. "Official docs + build a small project", "Hands-on Kubernetes lab",
    "Read 'Designing Data-Intensive Applications' chapters 5–7")
  - concrete_action: one specific thing to do THIS WEEK to start

Step 4 — Build the 30/60/90 day plan.
  Order actions by impact. High-impact gaps first.
  Each plan should have 3–5 steps — not a laundry list.
  Make steps sequential and realistic for someone working a job or job-searching.
  30-day plan: focus on High-impact gaps only.
  60-day plan: Medium-impact gaps + deepen High-impact work.
  90-day plan: Low-impact gaps + portfolio/proof of learning.

Step 5 — Write the overall verdict.
  1–2 sentences. Is this gap bridgeable in time to apply for this specific role,
  or should the candidate apply now and close gaps in parallel?
  Be direct. Do not hedge.

Step 6 — Provide career gap positioning advice.
  If career_gap_detected is true, provide a 1–2 sentence strategic instruction 
  on how the candidate should explain this break in their narrative.

Rules:
- YOU MUST ANALYZE EVERY SKILL LISTED IN THE 'MISSING SKILLS' SECTION ABOVE.
- Order skill_gaps by impact descending: High first, then Medium, then Low
- Never recommend a generic resource — always specify format and why it fits this skill
- time_to_competency must be realistic: distributed systems = months, a CLI tool = days
- If the 'Missing Skills' section above contains skills, your 'skill_gaps' list MUST NOT be empty.
- If missing_skills is truly empty, set skill_gaps to [] and note this in overall_verdict
- Do not repeat matched skills — only analyse what is genuinely missing
- Calibrate advice to the candidate's experience level: a junior needs more guidance,
  a senior needs strategic positioning advice more than tutorial recommendations
""",
        expected_output=(
            "A JSON object matching GapAnalysisOutput with fields: "
            "overall_verdict (1–2 sentence string), "
            "quick_wins (list of strings — gaps closable in 1–2 weeks, empty list if none), "
            "skill_gaps (list of SkillGapItem objects ordered by impact descending, each with: "
            "skill, impact, time_to_competency, resource_type, concrete_action), "
            "thirty_day_plan (list of 3–5 ordered action step strings), "
            "sixty_day_plan (list of 3–5 ordered action step strings), "
            "ninety_day_plan (list of 3–5 ordered action step strings), "
            "seniority_advice (string with positioning advice if seniority_gap is true, else null), "
            "career_gap_advice (string with positioning advice if career_gap_detected is true, else null)."
        ),
        agent=agent,
        output_json=GapAnalysisOutput,
        async_execution=True,
    )