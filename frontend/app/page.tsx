"use client";

import { useState } from "react";

import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { ApiError, runJobPipeline } from "@/lib/api";
import type { JobRequest, JobResponse } from "@/lib/job";

export default function Home() {
  const [result, setResult] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runPipeline = async (payload: JobRequest) => {
    setLoading(true);
    setResult(null);
    setErrorMessage(null);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Job Copilot 🚀</h1>

      <JobForm
        onSubmit={runPipeline}
        onError={setErrorMessage}
        disabled={loading}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">
          Generating tailored application materials...
        </p>
      )}

      <JobResult data={result} />
    </div>
  );
}
