import { readFileSync } from "node:fs";
import { parseStatus } from "../src/core/telemetry";
import type { CoreStatus, Provenance, StatusSnapshot } from "../src/core/types";

/** The real /v1/status response captured on 2026-10-30 (wheel idle). */
export function liveStatusJson(): Record<string, any> {
  return JSON.parse(readFileSync(new URL("./fixtures/status-idle-20261030.json", import.meta.url), "utf8"));
}

export const T0 = Date.parse("2026-10-30T13:26:08.918Z");

export interface SnapOptions {
  at?: number;
  core?: CoreStatus;
  rpm?: number;
  work?: bigint;
  epoch?: string;
  provenance?: Provenance;
  freshness?: "online" | "stale";
  height?: bigint;
  installationId?: string;
  measurement?: null;
  source?: "api" | "demo";
}

/** A valid snapshot built from the live fixture, with chosen fields replaced. */
export function snap(options: SnapOptions = {}): StatusSnapshot {
  const at = options.at ?? T0;
  const body = liveStatusJson();
  body.generatedAt = new Date(at).toISOString();
  body.revision = `rev-${at}-${String(options.work ?? "")}`;
  if (options.installationId) body.installationId = options.installationId;
  if (options.measurement === null) {
    body.measurement = null;
  } else {
    const m = body.measurement;
    m.observedAt = new Date(at - 500).toISOString();
    m.receivedAt = new Date(at - 200).toISOString();
    if (options.core) m.coreStatus = options.core;
    if (options.rpm !== undefined) m.rpmMilli = Math.round(options.rpm * 1000);
    if (options.work !== undefined) m.cumulativeWorkUnits = options.work.toString();
    if (options.epoch) m.counterEpoch = options.epoch;
    if (options.provenance) m.provenance = options.provenance;
    if (options.freshness) m.freshness = options.freshness;
  }
  if (options.height !== undefined) body.builder.anchor.blockHeight = options.height.toString();
  const snapshot = parseStatus(body);
  return options.source ? { ...snapshot, source: options.source } : snapshot;
}
