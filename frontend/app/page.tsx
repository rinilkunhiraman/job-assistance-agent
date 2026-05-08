"use client";

import { useEffect } from "react";

import JobForm from "@/components/job/JobForm";
import JobResult from "@/components/job/JobResult";
import { ApiError, runJobPipeline } from "@/lib/api";
import { useJobStore } from "@/store/useJobStore";

export default function Home() {
  const { jobStatus, actions } = useJobStore();
  const { isPending, duration, result, errorMessage } = jobStatus;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending) {
      const startTime = Date.now();
      interval = setInterval(() => {
        actions.setDuration(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPending, actions]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const runPipeline = async (payload: any) => {
    actions.startJob();

    try {
      const data = await runJobPipeline(payload);
      actions.endJob(data, null, duration);
    } catch (error) {
      const errorMsg = error instanceof ApiError
        ? error.message
        : "Unable to connect to the backend. Check that the API is running.";
      actions.endJob(null, errorMsg, duration);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">AI Job Application Agent 🚀</h1>

      <JobForm
        onSubmit={runPipeline}
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

      <JobResult />
    </div>
  );
}
