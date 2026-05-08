"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  EXPERIENCE_LEVELS,
  type FormState,
  getInitialFormState,
  TONES,
  toJobRequest,
  jobFormSchema,
} from "@/lib/job";

type JobFormProps = {
  disabled?: boolean;
  onError: (message: string | null) => void;
  onSubmit: (payload: ReturnType<typeof toJobRequest>) => Promise<void>;
};

const fieldClassName = "min-h-11 rounded-xl px-3 text-sm sm:text-base";

export default function JobForm({
  disabled = false,
  onError,
  onSubmit,
}: JobFormProps) {
  const {
    register,
    handleSubmit: rhSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormState>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: getInitialFormState(),
  });

  const [showResume, setShowResume] = useState(true);
  const [showJobDescription, setShowJobDescription] = useState(true);
  const [showPreferences, setShowPreferences] = useState(true);

  const formValues = watch();

  const onSubmitHandler = async (data: FormState) => {
    onError(null);
    setShowResume(false);
    setShowJobDescription(false);
    setShowPreferences(false);
    await onSubmit(toJobRequest(data));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await rhSubmit(onSubmitHandler)();

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0]?.message || "Please check the form for errors.";
      onError(firstError as string);
    }
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowResume(!showResume)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              {showResume ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Resume
            </button>
            {showResume && (
              <Textarea
                id="resume"
                {...register("resume")}
                placeholder="Paste the full resume here..."
                disabled={disabled}
                className={`min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                  errors.resume ? "border-destructive" : ""
                }`}
              />
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowJobDescription(!showJobDescription)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              {showJobDescription ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Job description
            </button>
            {showJobDescription && (
              <Textarea
                id="job_description"
                {...register("job_description")}
                placeholder="Paste the full job description here..."
                disabled={disabled}
                className={`min-h-36 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                  errors.job_description ? "border-destructive" : ""
                }`}
              />
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPreferences(!showPreferences)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              {showPreferences ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Preferences
            </button>
            {showPreferences && (
              <div className="space-y-4">
                <label htmlFor="target_role" className="block space-y-2">
                  <span className="text-sm font-medium">Target role</span>
                  <Input
                    id="target_role"
                    {...register("target_role")}
                    placeholder="Target role"
                    disabled={disabled}
                    className={`${fieldClassName} ${
                      errors.target_role ? "border-destructive" : ""
                    }`}
                  />
                </label>

                <label htmlFor="experience_level" className="block space-y-2">
                  <span className="text-sm font-medium">Experience level</span>
                  <Select
                    value={formValues.experience_level}
                    onValueChange={(value) => setValue("experience_level", value as any)}
                    disabled={disabled}
                  >
                    <SelectTrigger id="experience_level">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.experience_level && (
                    <p className="text-xs text-destructive">{errors.experience_level.message}</p>
                  )}
                </label>

                <label htmlFor="tone" className="block space-y-2">
                  <span className="text-sm font-medium">Tone</span>
                  <Select
                    value={formValues.tone}
                    onValueChange={(value) => setValue("tone", value as any)}
                    disabled={disabled}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone} value={tone}>
                          {tone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tone && (
                    <p className="text-xs text-destructive">{errors.tone.message}</p>
                  )}
                </label>

                <label htmlFor="achievements" className="block space-y-2">
                  <span className="text-sm font-medium">
                    Key achievements
                    <span className="ml-1 text-muted-foreground">(optional)</span>
                  </span>
                  <Textarea
                    id="achievements"
                    {...register("achievements")}
                    placeholder="Key achievements, metrics, or wins you want emphasized"
                    disabled={disabled}
                    className={`min-h-28 resize-y rounded-xl px-3 py-3 text-sm sm:text-base ${
                      errors.achievements ? "border-destructive" : ""
                    }`}
                  />
                  {errors.achievements && (
                    <p className="text-xs text-destructive">{errors.achievements.message}</p>
                  )}
                </label>
              </div>
            )}
          </div>

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
