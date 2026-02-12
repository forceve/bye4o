import { HttpError } from "./errors";
import { ErrorCodes } from "./errorCodes";

export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new HttpError(400, ErrorCodes.InvalidJsonBodyType, "Request body must be a JSON object.");
    }
    return value as Record<string, unknown>;
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(400, ErrorCodes.InvalidJsonBody, "Request body must contain valid JSON.");
  }
}
