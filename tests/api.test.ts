import { describe, expect, it, vi } from "vitest";
import { createStatusClient, retryAfterMs } from "../src/core/api";
import { liveStatusJson } from "./helpers";

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" }, ...init });

describe("createStatusClient", () => {
  it("sends a plain GET without custom headers, so no CORS preflight is needed", async () => {
    const fetchImpl = vi.fn(async () => json(liveStatusJson()));
    await createStatusClient(fetchImpl).fetchStatus();
    expect(fetchImpl).toHaveBeenCalledWith("https://api.squeekchain.com/v1/status", { cache: "no-store", credentials: "omit" });
  });

  it("reports whether the revision changed", async () => {
    const first = liveStatusJson();
    const second = liveStatusJson();
    second.revision = "next";
    const responses = [json(first), json(first), json(second)];
    const client = createStatusClient(async () => responses.shift()!);
    expect(await client.fetchStatus()).toMatchObject({ ok: true, changed: true });
    expect(await client.fetchStatus()).toMatchObject({ ok: true, changed: false });
    expect(await client.fetchStatus()).toMatchObject({ ok: true, changed: true });
    expect(client.last?.revision).toBe("next");
  });

  it("honours Retry-After on 429", async () => {
    const client = createStatusClient(async () => new Response("", { status: 429, headers: { "Retry-After": "7" } }));
    expect(await client.fetchStatus()).toEqual({ ok: false, failure: { kind: "rate_limited", retryAfterMs: 7000 } });
  });

  it("reports HTTP errors with their status", async () => {
    const client = createStatusClient(async () => new Response("", { status: 503, headers: { "Retry-After": "12" } }));
    expect(await client.fetchStatus()).toEqual({ ok: false, failure: { kind: "http", status: 503, retryAfterMs: 12000 } });
  });

  it("reports network failures", async () => {
    const client = createStatusClient(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await client.fetchStatus()).toEqual({ ok: false, failure: { kind: "network", message: "Failed to fetch" } });
  });

  it("reports non-JSON and invalid bodies without throwing", async () => {
    const notJson = createStatusClient(async () => new Response("<html>", { status: 200 }));
    expect(await notJson.fetchStatus()).toMatchObject({ ok: false, failure: { kind: "invalid" } });
    const body = liveStatusJson();
    body.measurement.coreStatus = "SPRINTING";
    const invalid = createStatusClient(async () => json(body));
    expect(await invalid.fetchStatus()).toMatchObject({ ok: false, failure: { kind: "invalid" } });
  });

  it("flags a new schema version as unsupported", async () => {
    const body = liveStatusJson();
    body.schemaVersion = 2;
    const client = createStatusClient(async () => json(body));
    expect(await client.fetchStatus()).toEqual({ ok: false, failure: { kind: "unsupported_schema", schemaVersion: 2 } });
  });
});

describe("retryAfterMs", () => {
  it("reads seconds and HTTP dates", () => {
    const now = Date.parse("2026-10-30T13:00:00Z");
    expect(retryAfterMs("3", now)).toBe(3000);
    expect(retryAfterMs("Fri, 30 Oct 2026 13:00:10 GMT", now)).toBe(10_000);
    expect(retryAfterMs(null, now)).toBeNull();
    expect(retryAfterMs("soon", now)).toBeNull();
  });
});
