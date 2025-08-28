import fetch from "node-fetch";

function parseArg(name: string, def?: string): string | undefined {
  const match = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  if (!match) return def;
  return match.split("=").slice(1).join("=");
}

const BASE =
  parseArg("base") ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";
const RETRIES = Number(parseArg("retries", "1"));
const CSV_OUT = parseArg("csv");
const AUTH = parseArg("auth") || process.env.BENCH_AUTH; // "Bearer <token>" or cookie string

type Scenario = {
  name: string;
  url: string;
};

const scenarios: Scenario[] = [
  { name: "health", url: "/health" },
  // auction-completed
  {
    name: "auction-completed bbox p20",
    url: "/api/v1/auction-completed/?south=37.48&west=126.88&north=37.62&east=127.10&page=1&size=20",
  },
  {
    name: "auction-completed radius p50 sort price desc",
    url: "/api/v1/auction-completed/?lat=37.5665&lng=126.978&radius_km=3&page=1&size=50&sort_by=price&sort_order=desc",
  },
  {
    name: "auction-completed radius(부산) p100",
    url: "/api/v1/auction-completed/?lat=35.1796&lng=129.0756&radius_km=5&page=1&size=100",
  },
  {
    name: "auction-completed bbox(seoul-wide) p100",
    url: "/api/v1/auction-completed/?south=37.3&west=126.7&north=37.75&east=127.2&page=1&size=100",
  },
  // real-transactions
  {
    name: "real-transactions bbox p20",
    url: "/api/v1/real-transactions/?south=37.48&west=126.88&north=37.62&east=127.10&page=1&size=20",
  },
  {
    name: "real-transactions radius p100 sort price desc",
    url: "/api/v1/real-transactions/?lat=37.5665&lng=126.978&radius_km=3&page=1&size=100&sort_by=price&sort_order=desc",
  },
  {
    name: "real-transactions radius(부산) p100",
    url: "/api/v1/real-transactions/?lat=35.1796&lng=129.0756&radius_km=5&page=1&size=100",
  },
  // real-transactions: 대구/대전/광주
  {
    name: "real-transactions radius(대구) p50",
    url: "/api/v1/real-transactions/?lat=35.8714&lng=128.6014&radius_km=3&page=1&size=50",
  },
  {
    name: "real-transactions radius(대전) p50",
    url: "/api/v1/real-transactions/?lat=36.3504&lng=127.3845&radius_km=3&page=1&size=50",
  },
  {
    name: "real-transactions radius(광주) p100",
    url: "/api/v1/real-transactions/?lat=35.1595&lng=126.8526&radius_km=5&page=1&size=100",
  },
  // real-rents (lat_center/lng_center honored by server)
  {
    name: "real-rents bbox p20",
    url: "/api/v1/real-rents/?south=37.48&west=126.88&north=37.62&east=127.10&page=1&size=20",
  },
  {
    name: "real-rents radius p50 sort price desc",
    url: "/api/v1/real-rents/?lat_center=37.5665&lng_center=126.978&radius_km=3&page=1&size=50&sort_by=price&sort_order=desc",
  },
  {
    name: "real-rents radius(부산) p50",
    url: "/api/v1/real-rents/?lat_center=35.1796&lng_center=129.0756&radius_km=5&page=1&size=50",
  },
  {
    name: "real-rents radius(부산) p100",
    url: "/api/v1/real-rents/?lat_center=35.1796&lng_center=129.0756&radius_km=5&page=1&size=100",
  },
  // real-rents: 대구/대전/광주
  {
    name: "real-rents radius(대구) p50",
    url: "/api/v1/real-rents/?lat_center=35.8714&lng_center=128.6014&radius_km=3&page=1&size=50",
  },
  {
    name: "real-rents radius(대전) p50",
    url: "/api/v1/real-rents/?lat_center=36.3504&lng_center=127.3845&radius_km=3&page=1&size=50",
  },
  {
    name: "real-rents radius(광주) p100",
    url: "/api/v1/real-rents/?lat_center=35.1595&lng_center=126.8526&radius_km=5&page=1&size=100",
  },
];

async function pingOnce(fullUrl: string): Promise<{
  ms: number;
  ok: boolean;
  size: number;
  total?: number;
  status?: number;
  errText?: string;
}> {
  const url = `${BASE}${fullUrl}`;
  const start = Date.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (AUTH) {
    if (/^Bearer\s+/i.test(AUTH)) headers["Authorization"] = AUTH;
    else headers["Cookie"] = AUTH;
  }
  const resp = await fetch(url, { headers });
  const ms = Date.now() - start;
  if (!resp.ok) {
    let errText = "";
    try {
      errText = await resp.text();
    } catch {}
    return { ms, ok: false, size: 0, status: (resp as any)?.status, errText };
  }
  let total = undefined as number | undefined;
  let size = 0;
  try {
    const data = await resp.json();
    if (Array.isArray(data)) size = data.length;
    else if (data && Array.isArray(data.items)) {
      size = data.items.length;
      if (typeof data.total === "number") total = data.total;
    }
  } catch {
    // ignore parse error
  }
  return { ms, ok: true, size, total, status: (resp as any)?.status };
}

async function pingWithRetry(
  fullUrl: string,
  retries: number
): Promise<{
  ms: number;
  ok: boolean;
  size: number;
  total?: number;
  status?: number;
  errText?: string;
}> {
  let last: {
    ms: number;
    ok: boolean;
    size: number;
    total?: number;
    status?: number;
    errText?: string;
  } = {
    ms: -1,
    ok: false,
    size: 0,
  };
  for (let i = 0; i < Math.max(1, retries); i++) {
    try {
      const r = await pingOnce(fullUrl);
      last = r;
      if (r.ok) return r;
    } catch {
      // ignore
    }
    // simple backoff
    await new Promise((res) => setTimeout(res, 200 * (i + 1)));
  }
  return last;
}

async function main() {
  const results: Array<{
    name: string;
    ok: boolean;
    ms: number;
    size: number;
    total?: number;
    status?: number;
    errText?: string;
  }> = [];
  for (const sc of scenarios) {
    try {
      const r = await pingWithRetry(sc.url, RETRIES);
      results.push({ name: sc.name, ...r });
    } catch (e) {
      results.push({ name: sc.name, ok: false, ms: -1, size: 0 });
    }
  }
  if (CSV_OUT) {
    const header = ["name", "ok", "ms", "size", "total"].join(",");
    const rows = results.map((r) =>
      [
        r.name,
        r.ok ? "OK" : "ERR",
        String(r.ms),
        String(r.size),
        String(r.total ?? ""),
      ].join(",")
    );
    console.log([header, ...rows].join("\n"));
  } else {
    // Print concise table
    console.log("\nDataset Bench (" + new Date().toISOString() + ")\n");
    console.log(
      "BASE=" +
        BASE +
        ", RETRIES=" +
        RETRIES +
        (CSV_OUT ? ", CSV=on" : "") +
        (AUTH ? ", AUTH=on" : "")
    );
    console.log("name\tok\tstatus\tms\tsize\ttotal");
    for (const r of results) {
      console.log(
        `${r.name}\t${r.ok ? "OK" : "ERR"}\t${r.status ?? ""}\t${r.ms}\t${
          r.size
        }\t${r.total ?? ""}`
      );
    }
    const firstErr = results.find((r) => !r.ok);
    if (firstErr?.errText) {
      console.log(
        "\nFirst error body (truncated):\n" + firstErr.errText.slice(0, 400)
      );
    }
  }
}

main().catch((e) => {
  console.error("bench failed", e);
  process.exit(1);
});
