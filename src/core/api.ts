import { InvalidStatusError, UnsupportedSchemaError, parseStatus } from "./telemetry";
import type { FetchOutcome, StatusSnapshot } from "./types";

export const API_BASE = "https://api.squeekchain.com";
export const STATUS_PATH = "/v1/status";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Parses Retry-After as seconds or an HTTP date. */
export function retryAfterMs(header: string | null, now: number): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

/**
 * Reads GET /v1/status. A plain GET is a CORS "simple request", so the
 * browser sends no preflight; the API's 1-second shared cache keeps repeated
 * polls cheap. `changed` reports whether the revision moved.
 */
export function createStatusClient(fetchImpl: FetchLike = (input, init) => fetch(input, init), base = API_BASE) {
  let last: StatusSnapshot | null = null;

  return {
    get last() {
      return last;
    },
    async fetchStatus(now = Date.now()): Promise<FetchOutcome> {
      let response: Response;
      try {
        response = await fetchImpl(base + STATUS_PATH, { cache: "no-store", credentials: "omit" });
      } catch (error) {
        return { ok: false, failure: { kind: "network", message: error instanceof Error ? error.message : String(error) } };
      }
      if (response.status === 429) {
        const wait = retryAfterMs(response.headers.get("Retry-After"), now) ?? 5000;
        return { ok: false, failure: { kind: "rate_limited", retryAfterMs: wait } };
      }
      if (!response.ok) {
        return {
          ok: false,
          failure: { kind: "http", status: response.status, retryAfterMs: retryAfterMs(response.headers.get("Retry-After"), now) },
        };
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { ok: false, failure: { kind: "invalid", message: "Response was not JSON" } };
      }
      try {
        const snapshot = parseStatus(body);
        const changed = last === null || last.revision !== snapshot.revision;
        last = snapshot;
        return { ok: true, snapshot, changed };
      } catch (error) {
        if (error instanceof UnsupportedSchemaError) {
          return { ok: false, failure: { kind: "unsupported_schema", schemaVersion: error.schemaVersion } };
        }
        if (error instanceof InvalidStatusError) return { ok: false, failure: { kind: "invalid", message: error.message } };
        throw error;
      }
    },
  };
}

export type StatusClient = ReturnType<typeof createStatusClient>;
