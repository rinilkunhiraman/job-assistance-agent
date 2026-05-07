export const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior"] as const;
export const TONES = [
  "Professional",
  "Friendly",
  "Confident",
  "Direct",
] as const;

import { z } from "zod";

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type Tone = (typeof TONES)[number];

export const jobFormSchema = z.object({
  resume: z.string().min(100, "Resume must be at least 100 characters."),
  job_description: z.string().min(100, "Job description must be at least 100 characters."),
  target_role: z.string().min(2, "Target role must be at least 2 characters."),
  experience_level: z.enum(EXPERIENCE_LEVELS),
  tone: z.enum(TONES),
  achievements: z.string().max(4000, "Achievements must be 4000 characters or fewer.").optional().or(z.literal("")),
});

export type JobRequest = z.infer<typeof jobFormSchema>;
export type FormState = z.infer<typeof jobFormSchema>;

export type JobResponse = {
  fit_summary: string;
  resume_improvements: string;
  outreach_message: string;
  cover_letter: string;
  keywords: {
    matched: string[];
    missing: string[];
  };
};

export type ApiErrorResponse = {
  error: string;
  code: string;
};

export function getInitialFormState(): FormState {
  return {
    resume: "",
    job_description: "",
    target_role: "",
    experience_level: "" as any,
    tone: "" as any,
    achievements: "",
  };
}

export function toJobRequest(form: FormState): JobRequest {
  return {
    ...form,
    achievements: form.achievements?.trim() || undefined,
  };
}
