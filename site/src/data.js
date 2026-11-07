/** Public, read-only API data. No wallet, signing or transaction interfaces. */
export const API_BASE = "https://api.squeekchain.com";

export function isFreshMeasurement(measurement, now = Date.now()) {
  if (!measurement || measurement.freshness !== "online") return false;
  const received = Date.parse(measurement.receivedAt);
  const limit = measurement.staleAfterSeconds;
  const age = now - received;
  return (
    Number.isFinite(received) &&
    Number.isFinite(limit) &&
    limit > 0 &&
    age >= 0 &&
    age <= limit * 1000
  );
}

export function integer(value) {
  if (typeof value === "bigint") return value >= 0n ? value : null;
  if (typeof value === "number")
    return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

const locale = (lang) =>
  lang === "en" || lang.startsWith("en-") ? "en-US" : "zh-CN";

export function formatInteger(value, lang = "zh") {
  const parsed = integer(value);
  return parsed === null
    ? "—"
    : new Intl.NumberFormat(locale(lang)).format(parsed);
}

/** Round half up at the requested decimal place, without any floating point. */
export function formatSqk(base, lang = "zh", digits = 2) {
  const parsed = integer(base);
  if (parsed === null) return "—";
  if (!Number.isInteger(digits) || digits < 0 || digits > 18)
    throw new RangeError("SQK digits must be 0–18");
  const factor = 10n ** BigInt(18 - digits);
  const scaled = (parsed + factor / 2n) / factor;
  const scale = 10n ** BigInt(digits);
  const whole = new Intl.NumberFormat(locale(lang)).format(scaled / scale);
  return digits === 0
    ? whole
    : `${whole}.${(scaled % scale).toString().padStart(digits, "0")}`;
}

/** Basis points, truncated. Unknown / zero denominator stays unknown. */
export function percentBps(n, d) {
  const numerator = integer(n),
    denominator = integer(d);
  if (numerator === null || denominator === null || denominator === 0n)
    return null;
  const result = (numerator * 10_000n) / denominator;
  return result > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(result);
}

export class ApiError extends Error {
  constructor(
    message,
    { kind = "network", status = null, retryAt = null, cause } = {},
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryAt = retryAt;
  }
}

function apiUrl(path) {
  if (
    typeof path !== "string" ||
    !/^\/v1\//.test(path) ||
    /[\\\s#]/.test(path)
  ) {
    throw new ApiError("Only public /v1/ API paths are allowed", {
      kind: "invalid-path",
    });
  }
  const url = new URL(path, API_BASE);
  if (
    url.origin !== API_BASE ||
    !url.pathname.startsWith("/v1/") ||
    /%2f|%5c/i.test(url.pathname)
  ) {
    throw new ApiError("Only official SqueekChain API reads are allowed", {
      kind: "invalid-path",
    });
  }
  return url;
}

function validateBasic(path, body) {
  const pathname = new URL(path, API_BASE).pathname;
  // Release core-sepolia-20261103: economy state and accounts are schema 3,
  // events schema 4 and settlements schema 3. Version 1 is the original API.
  const versions =
    pathname === "/v1/economy/state" ||
    /^\/v1\/accounts\/0x[0-9a-f]{40}$/i.test(pathname)
      ? [3]
      : pathname === "/v1/events"
        ? [1, 4]
        : pathname === "/v1/settlements"
          ? [1, 3]
          : [1];
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !versions.includes(body.schemaVersion) ||
    typeof body.installationId !== "string" ||
    !body.installationId
  )
    return false;
  if (body.status === "unavailable")
    return typeof body.reason === "string" && body.reason.length > 0;
  if (pathname === "/v1/status")
    return (
      body.measurement !== undefined &&
      body.builder &&
      body.oracle &&
      body.settlementQueue
    );
  if (pathname === "/v1/measurement/stats")
    return body.activity && body.lifetime && body.window && body.rounds;
  if (body.status !== "available") return false;
  if (pathname === "/v1/core")
    return (
      body.chain &&
      body.identities &&
      body.configuration &&
      body.core &&
      body.implementation
    );
  if (pathname === "/v1/mining/state")
    return body.chain && body.identities && body.issuance;
  // Economy sections may be null before launch; the schema checks each one.
  if (pathname === "/v1/economy/state")
    return body.chain && body.release && body.deployment?.components;
  if (/^\/v1\/accounts\/0x[0-9a-f]{40}$/i.test(pathname))
    return (
      body.chain &&
      body.deployment?.components &&
      body.tokenCounts &&
      Array.isArray(body.tokens)
    );
  if (pathname === "/v1/settlements")
    return (
      body.summary &&
      Array.isArray(body.buckets) &&
      Array.isArray(body.recentSettlements)
    );
  if (pathname === "/v1/events") return Array.isArray(body.events);
  if (pathname.endsWith("/activity")) return Array.isArray(body.activity);
  if (/^\/v1\/owners\/0x[0-9a-f]{40}\/squeeks$/i.test(pathname))
    return body.summary && Array.isArray(body.positions);
  return true;
}

function retryTime(value, now) {
  if (typeof value === "string" && /^\s*\d+(?:\.\d+)?\s*$/.test(value)) {
    const milliseconds = Number(value) * 1_000;
    if (Number.isFinite(milliseconds))
      return now + Math.max(1_000, milliseconds);
  }
  const date = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(date) && date > now ? date : now + 2_000;
}

export class ApiClient {
  constructor({
    fetchImpl = globalThis.fetch?.bind(globalThis),
    now = () => Date.now(),
    validate,
    timeoutMs = 12_000,
    retries = 1,
    retryDelayMs = 300,
  } = {}) {
    if (typeof fetchImpl !== "function")
      throw new TypeError("fetchImpl must be a function");
    this.fetchImpl = fetchImpl;
    this.now = now;
    this.validate = validate;
    this.timeoutMs = timeoutMs;
    this.retries = Math.max(0, Math.min(1, retries));
    this.retryDelayMs = retryDelayMs;
    this.cache = new Map();
    this.backoffUntil = 0;
  }

  getMeta(path) {
    const cached = this.cache.get(apiUrl(path).href);
    return cached
      ? {
          receivedAt: cached.receivedAt,
          etag: cached.etag,
          settlementSource: cached.settlementSource,
        }
      : null;
  }

  /** Retry one transient read failure; never retry schema/404/Retry-After errors. */
  async get(path, { signal } = {}) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.getOnce(path, { signal });
      } catch (error) {
        const transient =
          error.kind === "network" ||
          error.kind === "timeout" ||
          (error.kind === "http" && [500, 502, 504].includes(error.status));
        if (!transient || attempt >= this.retries || signal?.aborted)
          throw error;
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
        if (signal?.aborted)
          throw new ApiError("API request was cancelled", { kind: "aborted" });
      }
    }
  }

  /** Cache and rate-limit backoff are shared across all endpoints of this client. */
  async getOnce(path, { signal } = {}) {
    const url = apiUrl(path);
    if (this.now() < this.backoffUntil) {
      throw new ApiError("API retry window is still active", {
        kind: "backoff",
        retryAt: this.backoffUntil,
      });
    }
    const cached = this.cache.get(url.href);
    const headers = { Accept: "application/json" };
    if (cached?.etag) headers["If-None-Match"] = cached.etag;
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort(signal?.reason);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    try {
      const fetcher = this.fetchImpl;
      const response = await fetcher(url.href, {
        method: "GET",
        headers,
        signal: controller.signal,
        credentials: "omit",
      });
      if (response.status === 304) {
        if (!cached)
          throw new ApiError("Received 304 without a cached response", {
            kind: "cache",
            status: 304,
          });
        cached.receivedAt = this.now();
        cached.etag = response.headers.get("ETag") ?? cached.etag;
        cached.settlementSource =
          response.headers.get("X-Squeek-Settlement-Source") ??
          cached.settlementSource;
        return cached.data;
      }
      if (response.status === 429 || response.status === 503) {
        this.backoffUntil = Math.max(
          this.backoffUntil,
          retryTime(response.headers.get("Retry-After"), this.now()),
        );
        throw new ApiError(
          `API returned HTTP ${response.status}; wait before retrying`,
          {
            kind: "backoff",
            status: response.status,
            retryAt: this.backoffUntil,
          },
        );
      }
      if (!response.ok)
        throw new ApiError(`API returned HTTP ${response.status}`, {
          kind: "http",
          status: response.status,
        });
      let body;
      try {
        body = await response.json();
      } catch (cause) {
        throw new ApiError("API did not return valid JSON", {
          kind: "schema",
          cause,
        });
      }
      let valid = Boolean(validateBasic(path, body));
      if (valid && this.validate) {
        try {
          valid = (await this.validate(path, body)) !== false;
        } catch (cause) {
          throw new ApiError("API response failed schema validation", {
            kind: "schema",
            cause,
          });
        }
      }
      if (!valid)
        throw new ApiError("API response failed schema validation", {
          kind: "schema",
        });
      const etag = response.headers.get("ETag");
      this.cache.set(url.href, {
        etag,
        data: body,
        receivedAt: this.now(),
        settlementSource: response.headers.get("X-Squeek-Settlement-Source"),
      });
      return body;
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      throw new ApiError(
        timedOut
          ? "API request timed out"
          : controller.signal.aborted
            ? "API request was cancelled"
            : "API request failed",
        {
          kind: timedOut
            ? "timeout"
            : controller.signal.aborted
              ? "aborted"
              : "network",
          cause,
        },
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}

/** Compare API self-reported identities with the published record, never on-chain verification. */
export function checkDeployment(core, mining, deployment) {
  const issues = [];
  let missing = false,
    drift = false;
  if (!deployment?.contracts || deployment.chainId === undefined) {
    return {
      status: "unknown",
      issues: ["Published deployment record is unavailable"],
    };
  }
  const components = mining?.deployment?.components || {};
  // The API can move to a new release before the public record catches up.
  // Report that mismatch explicitly; never rewrite the trusted record from API data.
  if (
    mining?.status === "available" &&
    typeof mining.release?.id === "string" &&
    mining.release.id !== deployment.release
  ) {
    const issues = [
      `Published deployment record: ${deployment.release}. Official API reports: ${mining.release.id}.`,
      "The public record has not caught up with this API release. Current data is display-only; deployment verification is pending.",
    ];
    if (
      core?.chain?.chainId !== String(deployment.chainId) ||
      mining?.chain?.chainId !== String(deployment.chainId)
    )
      issues.push(
        "API chain identity is unavailable or differs from the published network.",
      );
    if (
      core?.identities?.core &&
      components.core?.address &&
      core.identities.core.toLowerCase() !==
        components.core.address.toLowerCase()
    )
      issues.push(
        "Core and economy endpoints report different contract identities.",
      );
    return { status: "drift", issues };
  }
  function compare(label, actual, expected) {
    if (
      actual === undefined ||
      actual === null ||
      expected === undefined ||
      expected === null
    ) {
      missing = true;
      issues.push(`${label}: unavailable`);
    } else if (
      String(actual).toLowerCase() !== String(expected).toLowerCase()
    ) {
      drift = true;
      issues.push(`${label}: expected ${expected}; API reported ${actual}`);
    }
  }
  // Fields the record does not publish (for example a version number) are not compared.
  const compareListed = (label, actual, expected) => {
    if (expected !== undefined && expected !== null) compare(label, actual, expected);
  };
  const {
    SqueekCore: c,
    SqueekMining: m,
    SqueekStaking: k,
    SqueekToken: t,
    SqueekNFT: n,
    SqueekAuthMinter: a,
    SqueekMiningFactory: f,
  } = deployment.contracts;
  const operational = deployment.operational || {};
  if (core?.status !== "available") {
    missing = true;
    issues.push("Core API data is unavailable");
  } else {
    compare("Core chain ID", core.chain?.chainId, deployment.chainId);
    compare("Core proxy", core.identities?.core, c?.address);
    compare(
      "Core implementation",
      core.identities?.proxyImplementation,
      c?.implementation,
    );
    compare(
      "Core implementation code address",
      core.implementation?.codeAddress,
      c?.implementation,
    );
    compareListed(
      "Core implementation version",
      core.implementation?.codeVersion,
      c?.implementationVersion,
    );
    compareListed(
      "Core runtime hash",
      core.implementation?.runtimeHash,
      c?.implementationRuntimeHash,
    );
    compareListed(
      "Core storage layout",
      core.implementation?.storageLayoutDigest,
      c?.storageLayoutDigest,
    );
    compare("Core proxy admin", core.identities?.proxyAdmin, c?.proxyAdmin);
    compare(
      "Core governance owner",
      core.identities?.proxyAdminOwner,
      operational.governanceTimelock?.address,
    );
    compareListed("Core configuration.guardian", core.configuration?.guardian, operational.guardian?.address);
    compareListed("Core configuration.reporter", core.configuration?.reporter, operational.reporter?.address);
    // The record names round duration in seconds; the API names it roundDuration.
    const launch = deployment.launchConfiguration?.core ?? deployment.coreConfiguration ?? {};
    for (const [key, expected] of Object.entries(launch)) {
      const apiKey = key === "roundDurationSeconds" ? "roundDuration" : key;
      compare(`Core configuration.${apiKey}`, core.configuration?.[apiKey], expected);
    }
  }
  if (mining?.status !== "available") {
    missing = true;
    issues.push("Economy API data is unavailable");
  } else {
    compare("Economy chain ID", mining.chain?.chainId, deployment.chainId);
    compare("Economy release", mining.release?.id, deployment.release);
    compare("Economy core link", components.core?.address, c?.address);
    compare("Core implementation (economy evidence)", components.core?.implementation?.address, c?.implementation);
    compare("SqueekMining", components.mining?.address, m?.address);
    compare("SqueekMining implementation", components.mining?.implementation?.address, m?.implementation);
    compare("SqueekStaking", components.staking?.address, k?.address);
    compare("SqueekStaking implementation", components.staking?.implementation?.address, k?.implementation);
    compare("SQK token", components.token?.address, t?.address);
    compare("SqueekNFT", components.collection?.address, n?.address);
    compareListed("Squeek claims minter", components.dispenser?.address, a?.address);
    compareListed("SqueekMining factory", components.miningFactory?.address, f?.address);
  }
  return { status: drift ? "drift" : missing ? "unknown" : "match", issues };
}
