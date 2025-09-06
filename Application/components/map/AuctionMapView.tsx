"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoSdk } from "@/lib/map/kakaoLoader";
import MapLegend from "../features/MapLegend";
import { captureError } from "@/lib/monitoring";
import { DEFAULT_THRESHOLDS, MAP_GUARD } from "@/lib/map/config";
import { useFilterStore } from "@/store/filterStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface AuctionMapViewProps {
  onItemSelect?: (item: any) => void;
  items?: any[];
  isLoading?: boolean;
  error?: any;
  onRetry?: () => void;
  // 활성화 상태: false일 때 초기화/로딩 지연
  enabled?: boolean;
  // 뷰포트 바운딩 박스 변경 시 상위로 전달 (카카오 전용)
  onBoundsChange?: (bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }) => void;
  // 지역/읍면동 키: 변경 시 내부 초기화/relayout 트리거
  locationKey?: string;
  // 목록 선택 항목 id 배열: 지도에서 강조/이동 처리
  highlightIds?: string[];
  // 🆕 경매 결과 전용 설정
  maxMarkers?: number; // 최대 표시 마커 수
  displayInfo?: { shown: number; total: number }; // 표시 정보
}

function AuctionMapView({
  onItemSelect,
  items = [],
  isLoading,
  error,
  onRetry,
  enabled = true,
  onBoundsChange,
  locationKey,
  highlightIds = [],
  maxMarkers = 500,
  displayInfo,
}: AuctionMapViewProps) {
  console.log("🔍 [AuctionMapView] 렌더링:", {
    enabled,
    itemsLength: items?.length,
    maxMarkers,
    displayInfo,
  });

  const [mapReady, setMapReady] = useState(false);
  const mapControllerRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<"2d-map" | "3d-map">("2d-map");
  const kakaoMapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const focusMarkerRef = useRef<any>(null);
  const focusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const markerIndexRef = useRef<Map<string, any>>(new Map());
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  const selectedOverlayMarkersRef = useRef<Map<string, any>>(new Map());
  const coordGroupsRef = useRef<Map<string, any[]>>(new Map());
  const markerToItemRef = useRef<Map<any, any>>(new Map());
  const popupOverlayRef = useRef<any>(null);
  const [mobilePopupItem, setMobilePopupItem] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const isPopupLockedRef = useRef<boolean>(false);
  const badgeImageCacheRef = useRef<Map<string, any>>(new Map());
  const thresholdsState = useFilterStore((s: any) => s.thresholds) ?? DEFAULT_THRESHOLDS;
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const hasPerformedInitialFitRef = useRef<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // 🆕 경매 결과 전용 마커 색상 함수
  const getAuctionMarkerColor = (item: any): string => {
    const ratio = item?.min_to_appraisal_ratio || 0;
    if (ratio <= 60) return "#ef4444"; // 빨간색: ≤ 6,000만원
    if (ratio <= 80) return "#f97316"; // 주황색: ≤ 8,000만원  
    if (ratio <= 100) return "#eab308"; // 노란색: ≤ 10,000만원
    if (ratio <= 130) return "#22c55e"; // 초록색: ≤ 13,000만원
    return "#3b82f6"; // 파란색: > 13,000만원
  };

  // 🆕 경매 결과 전용 범례 설정
  const auctionLegendItems = [
    { label: "≤ 6,000 만원", color: "#ef4444" },
    { label: "≤ 8,000 만원", color: "#f97316" },
    { label: "≤ 10,000 만원", color: "#eab308" },
    { label: "≤ 13,000 만원", color: "#22c55e" },
    { label: "> 13,000 만원", color: "#3b82f6" },
  ];

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 🆕 경매 결과 전용 팝업 내용 생성
  const createAuctionPopupContent = (item: any): string => {
    return `
      <div style="min-width: 280px; max-width: 320px; padding: 12px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px; line-height: 1.4;">
          ${item?.road_address || item?.address || "주소 정보 없음"}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
          <div>
            <span style="color: #6b7280;">사건번호:</span><br>
            <span style="color: #111827; font-weight: 500;">${item?.case_number || "-"}</span>
          </div>
          <div>
            <span style="color: #6b7280;">현재상태:</span><br>
            <span style="color: #111827; font-weight: 500;">${item?.current_status || "-"}</span>
          </div>
          <div>
            <span style="color: #6b7280;">감정가:</span><br>
            <span style="color: #dc2626; font-weight: 600;">${item?.appraisal_price ? Number(item.appraisal_price).toLocaleString() : "-"}만원</span>
          </div>
          <div>
            <span style="color: #6b7280;">최저가:</span><br>
            <span style="color: #dc2626; font-weight: 600;">${item?.min_price ? Number(item.min_price).toLocaleString() : "-"}만원</span>
          </div>
          <div>
            <span style="color: #6b7280;">매각기일:</span><br>
            <span style="color: #111827; font-weight: 500;">${item?.sale_date || "-"}</span>
          </div>
          <div>
            <span style="color: #6b7280;">최저가/감정가:</span><br>
            <span style="color: #059669; font-weight: 600;">${item?.min_to_appraisal_ratio || 0}%</span>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #6b7280;">
            ${item?.building_area_pyeong ? `건물 ${item.building_area_pyeong}평` : ""} 
            ${item?.land_area_pyeong ? `· 토지 ${item.land_area_pyeong}평` : ""}
            ${item?.floor_info ? `· ${item.floor_info}` : ""}
          </div>
        </div>
      </div>
    `;
  };

  // 카카오 맵 초기화
  useEffect(() => {
    if (!enabled || !mapRef.current) return;

    let isMounted = true;

    const initMap = async () => {
      try {
        console.log("🔍 [AuctionMapView] 카카오 맵 초기화 시작");
        
        await loadKakaoSdk();
        if (!isMounted) return;

        const { kakao } = window as any;
        if (!kakao?.maps) {
          console.error("❌ [AuctionMapView] 카카오맵 SDK 로드 실패");
          return;
        }

        // 지도 옵션
        const options = {
          center: new kakao.maps.LatLng(37.691404, 126.782946), // 고양시 중심
          level: 8,
          mapTypeId: kakao.maps.MapTypeId.ROADMAP,
        };

        // 지도 생성
        const map = new kakao.maps.Map(mapRef.current, options);
        kakaoMapRef.current = map;

        // 클러스터러 생성
        const clusterer = new kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 10,
          disableClickZoom: true,
          styles: [
            {
              width: "30px",
              height: "30px",
              background: "rgba(255, 51, 51, 0.8)",
              borderRadius: "15px",
              color: "#fff",
              textAlign: "center",
              fontWeight: "bold",
              lineHeight: "30px",
            },
          ],
        });
        clustererRef.current = clusterer;

        // 바운드 변경 이벤트
        if (onBoundsChange) {
          kakao.maps.event.addListener(map, "bounds_changed", () => {
            const bounds = map.getBounds();
            onBoundsChange({
              south: bounds.getSouthWest().getLat(),
              west: bounds.getSouthWest().getLng(),
              north: bounds.getNorthEast().getLat(),
              east: bounds.getNorthEast().getLng(),
            });
          });
        }

        setMapReady(true);
        console.log("✅ [AuctionMapView] 카카오 맵 초기화 완료");

      } catch (error) {
        console.error("❌ [AuctionMapView] 맵 초기화 실패:", error);
        captureError(error);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [enabled, onBoundsChange]);

  // 🆕 경매 결과 전용 마커 생성 및 업데이트
  useEffect(() => {
    if (!mapReady || !kakaoMapRef.current || !Array.isArray(items)) {
      return;
    }

    console.log("🔍 [AuctionMapView] 마커 업데이트:", {
      itemsLength: items.length,
      maxMarkers,
    });

    const { kakao } = window as any;
    const map = kakaoMapRef.current;

    // 기존 마커 제거
    if (clustererRef.current) {
      clustererRef.current.clear();
    }
    markersRef.current = [];
    markerIndexRef.current.clear();
    markerToItemRef.current.clear();

    // 유효한 아이템만 필터링 (좌표가 있는)
    const validItems = items
      .filter((item: any) => 
        item && 
        typeof item.latitude === "number" && 
        typeof item.longitude === "number" &&
        !isNaN(item.latitude) && 
        !isNaN(item.longitude)
      )
      .slice(0, maxMarkers); // 최대 개수 제한

    console.log(`✅ [AuctionMapView] 유효한 아이템: ${validItems.length}개`);

    // 마커 생성
    validItems.forEach((item: any, index: number) => {
      try {
        const position = new kakao.maps.LatLng(item.latitude, item.longitude);
        const color = getAuctionMarkerColor(item);
        
        // 마커 이미지 생성 (간단한 원형)
        const imageSize = new kakao.maps.Size(24, 24);
        const markerImage = new kakao.maps.MarkerImage(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
                ${Math.floor((item?.min_to_appraisal_ratio || 0) / 10)}
              </text>
            </svg>
          `)}`,
          imageSize
        );

        const marker = new kakao.maps.Marker({
          position: position,
          image: markerImage,
          map: map,
        });

        // 마커 클릭 이벤트
        kakao.maps.event.addListener(marker, "click", () => {
          if (isMobile) {
            setMobilePopupItem(item);
          } else {
            // 데스크톱 팝업 표시
            if (popupOverlayRef.current) {
              popupOverlayRef.current.setMap(null);
            }

            const popup = new kakao.maps.CustomOverlay({
              content: createAuctionPopupContent(item),
              position: position,
              yAnchor: 1,
              zIndex: 1000,
            });

            popup.setMap(map);
            popupOverlayRef.current = popup;

            // 팝업 외부 클릭시 닫기
            setTimeout(() => {
              const handleMapClick = () => {
                if (popupOverlayRef.current) {
                  popupOverlayRef.current.setMap(null);
                  popupOverlayRef.current = null;
                }
                kakao.maps.event.removeListener(map, "click", handleMapClick);
              };
              kakao.maps.event.addListener(map, "click", handleMapClick);
            }, 100);
          }

          onItemSelect?.(item);
        });

        markersRef.current.push(marker);
        markerIndexRef.current.set(String(item.id), {
          marker,
          pos: position,
          color,
          item,
        });
        markerToItemRef.current.set(marker, item);

      } catch (error) {
        console.error("❌ [AuctionMapView] 마커 생성 실패:", error, item);
      }
    });

    // 클러스터러에 마커 추가
    if (clustererRef.current && markersRef.current.length > 0) {
      clustererRef.current.addMarkers(markersRef.current);
    }

    // 첫 번째 로딩 시 지도 영역 맞춤
    if (!hasPerformedInitialFitRef.current && validItems.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      validItems.forEach((item: any) => {
        bounds.extend(new kakao.maps.LatLng(item.latitude, item.longitude));
      });
      map.setBounds(bounds);
      hasPerformedInitialFitRef.current = true;
    }

  }, [mapReady, items, maxMarkers, locationKey, onItemSelect, isMobile]);

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 지도 타입 변경
  const changeMapType = (type: "ROADMAP" | "SATELLITE" | "HYBRID") => {
    if (!kakaoMapRef.current) return;
    
    const { kakao } = window as any;
    let mapTypeId;
    switch (type) {
      case "SATELLITE":
        mapTypeId = kakao.maps.MapTypeId.SKYVIEW;
        break;
      case "HYBRID":
        mapTypeId = kakao.maps.MapTypeId.HYBRID;
        break;
      default:
        mapTypeId = kakao.maps.MapTypeId.ROADMAP;
        break;
    }
    kakaoMapRef.current.setMapTypeId(mapTypeId);
  };

  if (!enabled) {
    return null;
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white"
    : "relative w-full h-full overflow-hidden";

  return (
    <div className={containerClass}>
      <div ref={mapRef} className="absolute inset-0 bg-gray-100" />
      
      {isLoading && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow z-20">
          지도를 불러오는 중...
        </div>
      )}
      
      {!!error && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded bg-red-50 px-3 py-2 text-xs text-red-700 shadow z-20 flex items-center gap-2">
          <span>지도 로딩 오류</span>
          {onRetry && (
            <button
              className="rounded border border-red-200 bg-white/80 px-2 py-0.5 text-red-700"
              onClick={onRetry}
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* 지도 중앙 크로스헤어 */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <line x1="11" y1="0" x2="11" y2="22" stroke="#111827" strokeOpacity="0.45" strokeWidth="1" />
          <line x1="0" y1="11" x2="22" y2="11" stroke="#111827" strokeOpacity="0.45" strokeWidth="1" />
          <circle cx="11" cy="11" r="2" fill="#2563eb" fillOpacity="0.9" />
        </svg>
      </div>

      {/* 🆕 경매 결과 전용 범례 */}
      <div className="absolute top-2 right-2 z-20 bg-white/95 rounded-lg shadow-lg border p-3">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          최저가 범례(단위: 만원)
        </div>
        <div className="space-y-1">
          {auctionLegendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
          네모박스 숫자 예) 40 = 최저가/감정가 40~49%
        </div>
      </div>

      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          지도 초기화 중...
        </div>
      )}

      {/* 전체화면 토글 + 지도타입 토글 */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        <button
          onClick={toggleFullscreen}
          className="rounded bg-white/90 p-2 shadow hover:bg-white"
        >
          {isFullscreen ? "축소" : "전체화면"}
        </button>
        <div className="bg-white/90 rounded shadow">
          <div className="flex">
            <button
              onClick={() => changeMapType("ROADMAP")}
              className="px-3 py-1 text-xs hover:bg-gray-100 first:rounded-l last:rounded-r"
            >
              일반
            </button>
            <button
              onClick={() => changeMapType("SATELLITE")}
              className="px-3 py-1 text-xs hover:bg-gray-100 first:rounded-l last:rounded-r"
            >
              위성
            </button>
            <button
              onClick={() => changeMapType("HYBRID")}
              className="px-3 py-1 text-xs hover:bg-gray-100 first:rounded-l last:rounded-r"
            >
              하이브리드
            </button>
          </div>
        </div>
      </div>

      {/* 🆕 표시 정보 */}
      {displayInfo && (
        <div className="absolute bottom-2 left-2 bg-white/90 rounded shadow px-3 py-1 z-10">
          <div className="text-xs text-gray-600">
            표시 {displayInfo.shown} / 총 {displayInfo.total}
          </div>
        </div>
      )}

      {/* 모바일 팝업 시트 */}
      <Sheet open={!!mobilePopupItem} onOpenChange={() => setMobilePopupItem(null)}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>상세 정보</SheetTitle>
          </SheetHeader>
          {mobilePopupItem && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm text-gray-600">주소</div>
                <div className="font-medium">
                  {mobilePopupItem.road_address || mobilePopupItem.address || "주소 정보 없음"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">사건번호</div>
                  <div className="font-medium">{mobilePopupItem.case_number || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">현재상태</div>
                  <div className="font-medium">{mobilePopupItem.current_status || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">감정가</div>
                  <div className="font-medium text-red-600">
                    {mobilePopupItem.appraisal_price ? Number(mobilePopupItem.appraisal_price).toLocaleString() : "-"}만원
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">최저가</div>
                  <div className="font-medium text-red-600">
                    {mobilePopupItem.min_price ? Number(mobilePopupItem.min_price).toLocaleString() : "-"}만원
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AuctionMapView;
