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
  const kakaoMapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const focusMarkerRef = useRef<any>(null);
  const focusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  // 외부 연동을 위한 마지막 중심 좌표 저장
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);

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
          kakaoMapRef.current = map;
          try {
            const c = map.getCenter?.();
            if (c) lastCenterRef.current = { lat: c.getLat(), lng: c.getLng() };
          } catch {}
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
            try {
              const c = mapController?.getCenter?.();
              if (c) lastCenterRef.current = { lat: c.y, lng: c.x };
            } catch {}
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
                    kakaoMapRef.current = kmap;
                    try {
                      const c = kmap.getCenter?.();
                      if (c)
                        lastCenterRef.current = {
                          lat: c.getLat(),
                          lng: c.getLng(),
                        };
                    } catch {}
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

  // 상세 팝업에서 전달하는 지도 이동 이벤트 연동
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { id?: string; lat?: number; lng?: number }
        | undefined;
      if (
        !detail ||
        typeof detail.lat !== "number" ||
        typeof detail.lng !== "number"
      )
        return;
      try {
        // 지도로 뷰 전환은 상위 페이지가 담당. 여기서는 중심/마커 처리만.
        if (provider === "kakao" && kakaoMapRef.current) {
          const w = window as any;
          const latlng = new w.kakao.maps.LatLng(detail.lat, detail.lng);
          kakaoMapRef.current.setCenter(latlng);
          lastCenterRef.current = { lat: detail.lat, lng: detail.lng };

          try {
            if (!focusMarkerRef.current) {
              focusMarkerRef.current = new w.kakao.maps.Marker({
                position: latlng,
                zIndex: 9999,
              });
            } else {
              focusMarkerRef.current.setPosition(latlng);
            }
            focusMarkerRef.current.setMap(kakaoMapRef.current);

            if (focusCircleRef.current) {
              focusCircleRef.current.setMap(null);
            }
            focusCircleRef.current = new w.kakao.maps.Circle({
              center: latlng,
              radius: 80,
              strokeWeight: 3,
              strokeColor: "#3b82f6",
              strokeOpacity: 0.9,
              strokeStyle: "solid",
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
              zIndex: 9998,
            });
            focusCircleRef.current.setMap(kakaoMapRef.current);
          } catch {}
        } else if (
          mapControllerRef.current &&
          typeof mapControllerRef.current.setCenter === "function"
        ) {
          // vworld
          mapControllerRef.current.setCenter({ x: detail.lng, y: detail.lat });
          lastCenterRef.current = { lat: detail.lat, lng: detail.lng };
        }
      } catch (err) {
        console.warn("map move failed", err);
      }
    };
    window.addEventListener("property:openOnMap", handler as EventListener);
    return () =>
      window.removeEventListener(
        "property:openOnMap",
        handler as EventListener
      );
  }, [provider]);

  // Kakao: 목록 아이템 마커 표시 및 클릭 시 상세 열기 (+상태색/클러스터링)
  useEffect(() => {
    if (provider !== "kakao") return;
    const w = window as any;
    const map = kakaoMapRef.current;
    if (!map || !mapReady || !items) return;

    // 기존 마커/클러스터 정리
    try {
      if (clustererRef.current) clustererRef.current.clear();
      markersRef.current.forEach((m) => m.setMap(null));
    } catch {}
    markersRef.current = [];

    const colorByStatus = (status?: string) => {
      const s = (status || "").toLowerCase();
      if (s.startsWith("유찰")) return "#fb923c";
      if (s.includes("신건")) return "#3b82f6";
      if (s.includes("낙찰")) return "#22c55e";
      if (s.includes("재진행")) return "#6366f1";
      if (s.includes("변경")) return "#f59e0b";
      if (s.includes("취하")) return "#ef4444";
      return "#64748b";
    };

    // 클러스터러 생성(가능한 경우)
    try {
      clustererRef.current = new w.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6,
        disableClickZoom: true,
      });
    } catch {}

    // 최대 N개만 표시(성능 보호)
    const MAX = 1500;
    const slice = items.slice(0, MAX);
    const toAdd: any[] = [];
    slice.forEach((it: any) => {
      const lat = it?.lat;
      const lng = it?.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;
      try {
        const pos = new w.kakao.maps.LatLng(lat, lng);
        const color = colorByStatus(it?.current_status);
        const marker = new w.kakao.maps.Marker({
          position: pos,
          image: new w.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><circle cx='12' cy='12' r='8' fill='${color}' stroke='white' stroke-width='2'/></svg>`
            )}`,
            new w.kakao.maps.Size(24, 24)
          ),
        });
        // 클러스터 사용 시 setMap은 클러스터러가 담당
        if (!clustererRef.current) marker.setMap(map);
        w.kakao.maps.event.addListener(marker, "click", () => {
          try {
            const evt = new CustomEvent("property:openDetail", {
              detail: { id: String(it?.id ?? ""), lat, lng },
            });
            window.dispatchEvent(evt);
            // 중심 이동 및 하이라이트
            map.setCenter(pos);
            lastCenterRef.current = { lat, lng };
            if (!focusMarkerRef.current) {
              focusMarkerRef.current = new w.kakao.maps.Marker({
                position: pos,
                zIndex: 9999,
              });
            } else {
              focusMarkerRef.current.setPosition(pos);
            }
            focusMarkerRef.current.setMap(map);
            if (focusCircleRef.current) focusCircleRef.current.setMap(null);
            focusCircleRef.current = new w.kakao.maps.Circle({
              center: pos,
              radius: 80,
              strokeWeight: 3,
              strokeColor: "#3b82f6",
              strokeOpacity: 0.9,
              strokeStyle: "solid",
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
              zIndex: 9998,
            });
            focusCircleRef.current.setMap(map);
          } catch {}
        });
        markersRef.current.push(marker);
        toAdd.push(marker);
      } catch {}
    });

    try {
      if (clustererRef.current && toAdd.length) {
        clustererRef.current.addMarkers(toAdd);
      }
    } catch {}

    return () => {
      try {
        if (clustererRef.current) clustererRef.current.clear();
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
      } catch {}
    };
  }, [items, mapReady, provider]);

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

  // 전체화면 토글 시 Kakao 지도 relayout + center 유지
  useEffect(() => {
    try {
      const kmap = kakaoMapRef.current;
      if (kmap && typeof kmap.relayout === "function") {
        const center = kmap.getCenter?.();
        setTimeout(() => {
          try {
            kmap.relayout();
            if (center && typeof kmap.setCenter === "function") {
              kmap.setCenter(center);
            }
          } catch {}
        }, 50);
      }
    } catch {}
  }, [isFullscreen]);

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

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white"
    : "relative w-full h-[1000px]";

  return (
    <div className={containerClass}>
      <div ref={mapRef} className="absolute inset-0 bg-gray-100" />
      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          vworld 초기화 대기중
        </div>
      )}
      {/* 전체화면 토글 버튼 */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        <button
          className="rounded bg-white/90 px-2 py-1 text-xs text-gray-800 shadow border"
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? "닫기" : "전체화면"}
        </button>
      </div>
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
