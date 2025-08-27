"use client";

import * as React from "react";
import { loadKakaoSdk } from "@/lib/map/kakaoLoader";

interface Props {
  lat: number;
  lng: number;
  level?: number;
  className?: string;
}

export default function LocationMiniMap({
  lat,
  lng,
  level = 7,
  className,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let map: any;
    const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    const inLat = typeof lat === "number" && lat >= 33 && lat <= 39.5;
    const inLng = typeof lng === "number" && lng >= 124 && lng <= 132.5;
    if (!key || !inLat || !inLng) return;

    let cancelled = false;
    (async () => {
      try {
        await loadKakaoSdk(key);
        if (cancelled) return;
        const w = window as any;
        const kakao = w.kakao;
        const center = new kakao.maps.LatLng(lat, lng);
        map = new kakao.maps.Map(containerRef.current, {
          center,
          level,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        });
        const marker = new kakao.maps.Marker({ position: center });
        marker.setMap(map);
      } catch {}
    })();

    return () => {
      cancelled = true;
      // kakao 지도는 DOM 제거만으로 충분 (별도 destroy API 없음)
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      map = null;
    };
  }, [lat, lng, level]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-[720px] rounded bg-gray-50 border"}
      aria-label="위치 미니맵"
    />
  );
}
