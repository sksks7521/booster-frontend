"use client";

import React from "react";

interface Props {
  totalAll: number;
  regionTotal: number;
  serverTotal: number;
  circleCount?: number;
  showCircle?: boolean;
}

export default function CircleFilterHeaderCount({
  totalAll,
  regionTotal,
  serverTotal,
  circleCount = 0,
  showCircle = false,
}: Props) {
  return (
    <p className="text-gray-600 mt-1">
      <span className="inline-block">
        전체{" "}
        <span className="font-semibold text-blue-600">
          {(totalAll || 0).toLocaleString()}
        </span>
        건
      </span>
      {" → "}
      <span className="inline-block">
        지역필터{" "}
        <span className="font-semibold text-green-600">
          {(regionTotal || 0).toLocaleString()}
        </span>
        건
      </span>
      {" → "}
      <span className="inline-block">
        상세필터{" "}
        <span className="font-semibold text-purple-600">
          {(serverTotal || 0).toLocaleString()}
        </span>
        건
      </span>
      {showCircle && (
        <>
          {" → "}
          <span className="inline-block">
            영역 안 필터{" "}
            <span className="font-semibold text-indigo-600">
              {(circleCount || 0).toLocaleString()}
            </span>
            건
          </span>
        </>
      )}
    </p>
  );
}
