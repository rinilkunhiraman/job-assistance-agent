"use client";

import { useState, useTransition, useEffect } from "react";

import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { ApiError, runJobPipeline } from "@/lib/api";
import type { JobRequest, JobResponse } from "@/lib/job";

export default function Home() {
  const [result, setResult] = useState<JobResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setDuration(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const runPipeline = async (payload: JobRequest) => {
    setResult(null);
    setErrorMessage(null);
    setDuration(null);

    startTransition(async () => {
      try {
        const data = await runJobPipeline(payload);
        setResult(data);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            "Unable to connect to the backend. Check that the API is running.",
          );
        }
      }
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Job Application Agent 🚀</h1>

      <JobForm
        onSubmit={runPipeline}
        onError={setErrorMessage}
        disabled={isPending}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isPending && (
        <p className="text-sm text-muted-foreground">
          Generating tailored application materials... {duration ? `(${formatDuration(duration)})` : ""}
        </p>
      )}

      {!isPending && duration && (
        <p className="text-sm text-muted-foreground text-center">
          Completed in {formatDuration(duration)}
        </p>
      )}

      <JobResult data={result} />
    </div>
  );
}
