"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

interface MapViewProps {
  onItemSelect?: (item: any) => void;
  items?: any[];
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
}

function MapView({
  onItemSelect,
  items = [],
  isLoading,
  error,
  onRetry,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
    if (!mapRef.current) return;
    if (!apiKey) return; // 키가 없으면 로딩만 스킵 (UI는 정상 표시)

    // vworld 스크립트 동적 로드
    const existing = document.querySelector(
      'script[data-vendor="vworld"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      setMapReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://map.vworld.kr/js/vworldMapInit.js.do?apiKey=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-vendor", "vworld");
    script.onload = () => {
      // 전역에 로딩이 완료되면 이후 단계에서 지도 초기화 로직을 추가합니다
      setMapReady(true);
    };
    script.onerror = () => {
      // 실패 시에도 화면은 유지
      setMapReady(false);
    };
    document.head.appendChild(script);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600">지도를 불러오는 중...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="text-sm text-red-600 mb-2">
          지도를 불러오는 중 오류가 발생했습니다.
        </div>
        {onRetry && (
          <button className="text-sm text-blue-600 underline" onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    );
  }
  if (!items || items.length === 0) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600 mb-2">
          표시할 마커가 없습니다.
        </div>
        {onRetry && (
          <button className="text-sm text-blue-600 underline" onClick={onRetry}>
            다시 불러오기
          </button>
        )}
      </div>
    );
  }
  const handleItemClick = (item: any) => onItemSelect?.(item);

  return (
    <div className="relative w-full h-[420px]">
      <div ref={mapRef} className="absolute inset-0 bg-gray-100" />
      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          vworld 초기화 대기중
        </div>
      )}
      {/* 임시: 우상단에 아이템 개수/선택 안내 */}
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700 shadow">
        항목 {items.length}개
      </div>
      {/* 임시: 목록을 오버레이로 노출하여 선택 가능하도록 제공 */}
      <div className="absolute left-2 top-2 max-h-[380px] w-60 overflow-auto rounded bg-white/95 p-2 text-xs shadow">
        <div className="mb-1 font-semibold">표시 항목</div>
        <ul className="space-y-1">
          {items.slice(0, 50).map((item: any) => (
            <li
              key={item.id}
              className="cursor-pointer truncate rounded px-2 py-1 hover:bg-gray-100"
              onClick={() => handleItemClick(item)}
              title={item.address}
            >
              {item.address}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MapView;
