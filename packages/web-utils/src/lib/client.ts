import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.number(),
    data: dataSchema,
  });

export const ApiPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T,
) =>
  z.object({
    status: z.number(),
    data: z.array(dataSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      perPage: z.number(),
      totalPages: z.number(),
    }),
  });

export const ApiErrorSchema = z.object({
  status: z.number(),
  errors: z.array(z.string()),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        status: response.status,
        errors: [response.statusText],
      }));

      throw new ApiRequestError(
        errorData.errors?.[0] || `HTTP ${response.status}`,
        response.status,
        errorData.errors || [],
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      error instanceof Error ? error.message : 'Network error',
      0,
      ['Failed to connect to API'],
    );
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors: string[],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
