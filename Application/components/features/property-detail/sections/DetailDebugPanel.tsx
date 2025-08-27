"use client";

import * as React from "react";

interface Props {
  raw: any;
}

export default function DetailDebugPanel({ raw }: Props) {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const enabledFromQuery = url.searchParams.get("detailDebug") === "1";
  const enabledFromStorage =
    window.localStorage.getItem("DETAIL_DEBUG") === "1";
  const enabledFromGlobal = (window as any).DEBUG_DETAIL === true;
  const enabled =
    Boolean(process.env.NEXT_PUBLIC_DETAIL_DEBUG) ||
    enabledFromQuery ||
    enabledFromStorage ||
    enabledFromGlobal;
  if (!enabled) return null;
  return (
    <div className="mt-4 rounded border bg-yellow-50 text-[11px] text-gray-800 p-3 whitespace-pre-wrap break-all">
      <div className="font-semibold mb-1">Detail Debug (raw item)</div>
      <pre className="overflow-auto text-[10px] leading-4 max-h-64">
        {JSON.stringify(raw, null, 2)}
      </pre>
    </div>
  );
}
