import { json } from "../../shared/http";

export function handleHealth(): Response {
  return json({
    ok: true,
    now: new Date().toISOString(),
  });
}
