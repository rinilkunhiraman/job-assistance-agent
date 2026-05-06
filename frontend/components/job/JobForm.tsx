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
    <Card>
      <CardContent className="p-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Textarea
            name="resume"
            placeholder="Paste your resume..."
            value={form.resume}
            onChange={handleChange}
            disabled={disabled}
          />

          <Textarea
            name="job_description"
            placeholder="Paste job description..."
            value={form.job_description}
            onChange={handleChange}
            disabled={disabled}
          />

          <Input
            name="target_role"
            placeholder="Target role"
            value={form.target_role}
            onChange={handleChange}
            disabled={disabled}
          />

          <select
            name="experience_level"
            value={form.experience_level}
            onChange={handleChange}
            disabled={disabled}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select experience level</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <select
            name="tone"
            value={form.tone}
            onChange={handleChange}
            disabled={disabled}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select tone</option>
            {TONES.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>

          <Textarea
            name="achievements"
            placeholder="Key achievements (optional)"
            value={form.achievements}
            onChange={handleChange}
            disabled={disabled}
          />

          <Button type="submit" disabled={disabled}>
            {disabled ? "Generating..." : "Generate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
