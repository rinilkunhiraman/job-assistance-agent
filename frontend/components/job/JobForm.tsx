"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPERIENCE_LEVELS,
  type FormState,
  getInitialFormState,
  TONES,
  toJobRequest,
  validateJobForm,
} from "@/lib/job";

type JobFormProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
  onSubmit: (payload: ReturnType<typeof toJobRequest>) => Promise<void>;
};

const fieldClassName = "min-h-11 rounded-xl px-3 text-sm sm:text-base";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring min-h-11 w-full appearance-none rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-base";

export default function JobForm({
  disabled = false,
  onError,
  onSubmit,
}: JobFormProps) {
  const [form, setForm] = useState<FormState>(getInitialFormState);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateJobForm(form);
    if (validationError) {
      onError(validationError);
      return;
    }

    onError(null);
    await onSubmit(toJobRequest(form));
  };

  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Application Inputs</h2>
            <p className="text-sm text-muted-foreground">
              Paste the full resume and full job description, then choose the
              tone you want the AI to use.
            </p>
          </div>

          <label htmlFor="resume" className="block space-y-2">
            <span className="text-sm font-medium">Resume</span>
            <Textarea
              id="resume"
              name="resume"
              placeholder="Paste the full resume here..."
              value={form.resume}
              onChange={handleChange}
              disabled={disabled}
              className="min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base"
            />
          </label>

          <label htmlFor="job_description" className="block space-y-2">
            <span className="text-sm font-medium">Job description</span>
            <Textarea
              id="job_description"
              name="job_description"
              placeholder="Paste the full job description here..."
              value={form.job_description}
              onChange={handleChange}
              disabled={disabled}
              className="min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="target_role" className="block space-y-2">
              <span className="text-sm font-medium">Target role</span>
              <Input
                id="target_role"
                name="target_role"
                placeholder="Target role"
                value={form.target_role}
                onChange={handleChange}
                disabled={disabled}
                className={fieldClassName}
              />
            </label>

            <label htmlFor="experience_level" className="block space-y-2">
              <span className="text-sm font-medium">Experience level</span>
              <select
                id="experience_level"
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
                disabled={disabled}
                className={selectClassName}
              >
                <option value="">Select experience level</option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="tone" className="block space-y-2">
              <span className="text-sm font-medium">Tone</span>
              <select
                id="tone"
                name="tone"
                value={form.tone}
                onChange={handleChange}
                disabled={disabled}
                className={selectClassName}
              >
                <option value="">Select tone</option>
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>

            <div className="hidden sm:block" />
          </div>

          <label htmlFor="achievements" className="block space-y-2">
            <span className="text-sm font-medium">
              Key achievements
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </span>
            <Textarea
              id="achievements"
              name="achievements"
              placeholder="Key achievements, metrics, or wins you want emphasized"
              value={form.achievements}
              onChange={handleChange}
              disabled={disabled}
              className="min-h-28 resize-y rounded-xl px-3 py-3 text-sm sm:text-base"
            />
          </label>

          <Button
            type="submit"
            disabled={disabled}
            className="min-h-11 w-full sm:w-auto"
          >
            {disabled ? "Generating..." : "Generate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
