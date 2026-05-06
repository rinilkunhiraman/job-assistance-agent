import type { ApiErrorResponse, JobRequest, JobResponse } from "@/lib/job";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function runJobPipeline(
  payload: JobRequest,
): Promise<JobResponse> {
  const response = await fetch(`${API_BASE_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | JobResponse
    | ApiErrorResponse
    | null;

  if (!response.ok) {
    const error =
      body && "error" in body
        ? body.error
        : "The backend returned an unexpected error.";
    const code = body && "code" in body ? body.code : "unknown_error";
    throw new ApiError(error, code, response.status);
  }

  if (!body || !("fit_summary" in body)) {
    throw new ApiError(
      "The backend returned an invalid response payload.",
      "invalid_response",
      502,
    );
  }

  return body;
}
