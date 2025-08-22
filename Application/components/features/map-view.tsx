"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoSdk } from "@/lib/map/kakaoLoader";

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
  const mapControllerRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<"2d-map" | "3d-map">("2d-map");

  const providerEnv = (
    process.env.NEXT_PUBLIC_MAP_PROVIDER || "vworld"
  ).toLowerCase();
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  const vworldKeyEnv = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
  // 사용자가 제공한 기본 키를 폴백으로 사용 (환경변수 미설정 시 즉시 표시)
  const vworldKey =
    vworldKeyEnv && vworldKeyEnv.trim().length > 0
      ? vworldKeyEnv
      : "276AABBA-2990-3BAE-B46A-82A7FE6BE021";
  const provider =
    providerEnv === "kakao" && !kakaoKey ? "vworld" : providerEnv;

  useEffect(() => {
    if (!mapRef.current) return;

    if (provider === "kakao") {
      if (!kakaoKey) return;
      loadKakaoSdk(kakaoKey)
        .then(() => {
          const w = window as any;
          const map = new w.kakao.maps.Map(mapRef.current, {
            center: new w.kakao.maps.LatLng(37.5665, 126.978),
            level: 4,
          });
          setMapReady(true);
        })
        .catch(() => setMapReady(false));
      return;
    }

    if (!vworldKey) return;
    const existing = document.querySelector(
      'script[data-vendor="vworld"]'
    ) as HTMLScriptElement | null;

    const initVworld = () => {
      try {
        const w = window as any;
        if (mapRef.current) {
          mapRef.current.innerHTML =
            '<div id="vmap" style="width:100%;height:100%;left:0;top:0"></div>';
        }

        const tryInit = (attempt = 0) => {
          if (w.vw && w.vw.MapController) {
            w.vw.MapControllerOption = {
              container: "vmap",
              mapMode: "2d-map",
              basemapType: w.vw.ol3.BasemapType.GRAPHIC,
              controlDensity: w.vw.ol3.DensityType.EMPTY,
              interactionDensity: w.vw.ol3.DensityType.BASIC,
              controlsAutoArrange: true,
              homePosition: w.vw.ol3.CameraPosition,
              initPosition: w.vw.ol3.CameraPosition,
            };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const mapController = new w.vw.MapController(
              w.vw.MapControllerOption
            );
            mapControllerRef.current = mapController;
            setMapReady(true);
            return;
          }
          if (w.vw && w.vw.ol3 && w.vw.ol3.Map) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const map = new w.vw.ol3.Map("vmap", {
              basemapType: w.vw.ol3.BasemapType.GRAPHIC,
            });
            setMapReady(true);
            return;
          }
          if (attempt < 20) {
            setTimeout(() => tryInit(attempt + 1), 150);
          } else {
            // 최종 실패 시 Kakao로 폴백 시도
            if (kakaoKey) {
              loadKakaoSdk(kakaoKey)
                .then(() => {
                  const kk = (window as any).kakao;
                  if (mapRef.current && kk?.maps) {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const kmap = new kk.maps.Map(mapRef.current, {
                      center: new kk.maps.LatLng(37.5665, 126.978),
                      level: 4,
                    });
                    setMapReady(true);
                  } else {
                    setMapReady(false);
                  }
                })
                .catch(() => setMapReady(false));
            } else {
              setMapReady(false);
            }
          }
        };
        tryInit();
      } catch (e) {
        console.error("vworld init error", e);
        setMapReady(false);
      }
    };

    if (existing) {
      initVworld();
      return;
    }
    const script = document.createElement("script");
    const domainParam =
      typeof window !== "undefined"
        ? `&domain=${window.location.hostname}`
        : "";
    script.src = `https://map.vworld.kr/js/vworldMap.js.do?apiKey=${vworldKey}${domainParam}`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-vendor", "vworld");
    script.onload = initVworld;
    script.onerror = () => {
      console.error("vworld script load failed");
      // 스크립트 로드 자체가 실패한 경우에도 Kakao로 폴백 시도
      if (kakaoKey) {
        loadKakaoSdk(kakaoKey)
          .then(() => {
            const kk = (window as any).kakao;
            if (mapRef.current && kk?.maps) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const kmap = new kk.maps.Map(mapRef.current, {
                center: new kk.maps.LatLng(37.5665, 126.978),
                level: 4,
              });
              setMapReady(true);
            } else {
              setMapReady(false);
            }
          })
          .catch(() => setMapReady(false));
      } else {
        setMapReady(false);
      }
    };
    document.head.appendChild(script);
  }, []);

  // vworld 2D/3D 모드 전환 처리
  useEffect(() => {
    if (
      provider !== "kakao" &&
      mapReady &&
      mapControllerRef.current &&
      typeof mapControllerRef.current.setMode === "function"
    ) {
      try {
        mapControllerRef.current.setMode(mapMode);
      } catch (e) {
        console.warn("vworld setMode 실패", e);
      }
    }
  }, [mapMode, mapReady, provider]);

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
  // 아이템이 없어도 기본 지도는 렌더링되도록 유지
  const handleItemClick = (item: any) => onItemSelect?.(item);

  return (
    <div className="relative w-full h-[420px]">
      <div ref={mapRef} className="absolute inset-0 bg-gray-100" />
      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          vworld 초기화 대기중
        </div>
      )}
      {/* vworld 모드 전환 셀렉터 */}
      {provider !== "kakao" && mapReady && (
        <div className="absolute top-2 right-2 mt-8 rounded bg-white/90 px-2 py-1 text-xs text-gray-700 shadow">
          <label className="mr-2">모드</label>
          <select
            value={mapMode}
            onChange={(e) => setMapMode(e.target.value as "2d-map" | "3d-map")}
            className="border rounded px-1 py-0.5 text-xs"
          >
            <option value="2d-map">2D</option>
            <option value="3d-map">3D</option>
          </select>
        </div>
      )}
      {/* 키/환경변수 누락 안내 */}
      {provider === "kakao" && !process.env.NEXT_PUBLIC_KAKAO_APP_KEY && (
        <div className="absolute top-8 right-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          Kakao 키 누락: NEXT_PUBLIC_KAKAO_APP_KEY 설정 필요
        </div>
      )}
      {provider !== "kakao" && !process.env.NEXT_PUBLIC_VWORLD_API_KEY && (
        <div className="absolute top-8 right-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 shadow">
          VWorld 키 누락: NEXT_PUBLIC_VWORLD_API_KEY 설정 필요
        </div>
      )}
      {/* 임시: 우상단에 아이템 개수/선택 안내 */}
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700 shadow">
        항목 {items.length}개
      </div>
      {/* 임시: 목록을 오버레이로 노출하여 선택 가능하도록 제공 */}
      <div className="absolute left-2 top-2 max-h-[380px] w-60 overflow-auto rounded bg-white/95 p-2 text-xs shadow">
        <div className="mb-1 font-semibold">표시 항목</div>
        {items && items.length > 0 ? (
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
        ) : (
          <div className="text-gray-500">표시할 항목이 없습니다</div>
        )}
      </div>
    </div>
  );
}

export default MapView;
