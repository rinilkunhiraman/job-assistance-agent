import type { ApiErrorResponse, JobRequest, JobResponse } from "@/lib/job";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const REQUEST_TIMEOUT_MS = 600000; // 10 minutes

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

interface StreamCallbacks {
  onProgress: (message: string) => void;
  onError: (error: string) => void;
  onSuccess: (data: JobResponse) => void;
}

export async function runJobPipelineStream(
  payload: JobRequest,
  callbacks: StreamCallbacks,
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = body?.error || "The backend returned an unexpected error.";
      throw new ApiError(error, body?.code || "unknown_error", response.status);
    }

    if (!response.body) {
      throw new ApiError("No response body available.", "no_body", 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      // Keep the last part in the buffer if it doesn't end with a delimiter
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (part.trim()) {
          handleChunk(part, callbacks);
        }
      }
    }

    // Final chunk if any
    if (buffer.trim()) {
      handleChunk(buffer, callbacks);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      callbacks.onError("The request timed out after 10 minutes.");
    } else {
      callbacks.onError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

function handleChunk(chunk: string, callbacks: StreamCallbacks) {
  try {
    const payload = JSON.parse(chunk);
    if (payload.type === "progress") {
      callbacks.onProgress(payload.message);
    } else if (payload.type === "error") {
      callbacks.onError(payload.message);
    } else if (payload.type === "final_result") {
      callbacks.onSuccess(payload.data);
    }
  } catch (e) {
    console.error("Failed to parse chunk:", chunk, e);
  }
}
