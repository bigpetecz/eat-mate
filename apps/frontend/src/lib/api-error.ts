import { AxiosError } from 'axios';

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const candidate = data as {
    message?: string | string[];
    error?: { message?: string | string[] };
    details?: { message?: string | string[] };
  };

  if (Array.isArray(candidate.error?.message)) {
    return candidate.error.message[0] || fallback;
  }

  if (typeof candidate.error?.message === 'string') {
    return candidate.error.message || fallback;
  }

  if (Array.isArray(candidate.details?.message)) {
    return candidate.details.message[0] || fallback;
  }

  if (typeof candidate.details?.message === 'string') {
    return candidate.details.message || fallback;
  }

  if (Array.isArray(candidate.message)) {
    return candidate.message[0] || fallback;
  }
  if (typeof candidate.message === 'string' && candidate.message.length) {
    return candidate.message;
  }
  return fallback;
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const message = extractMessage(
      error.response?.data,
      error.message || 'Request failed'
    );
    const code = error.code;
    return new ApiClientError(message, status, code, error.response?.data);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 500);
  }

  return new ApiClientError('Unexpected error', 500);
}
