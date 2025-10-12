"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoSdk } from "@/lib/map/kakaoLoader";
import MapLegend from "./MapLegend";
import MapCircleControls from "./MapCircleControls";
import { captureError } from "@/lib/monitoring";
import { DEFAULT_THRESHOLDS, MAP_GUARD } from "@/lib/map/config";
import { renderBasePopup } from "@/components/map/popup/BasePopup";
import { auctionSchema } from "@/components/map/popup/schemas/auction";
import { saleSchema } from "@/components/map/popup/schemas/sale";
import { rentSchema } from "@/components/map/popup/schemas/rent";
import { analysisSchema } from "@/components/map/popup/schemas/analysis";
import { useFilterStore } from "@/store/filterStore";
import { realTransactionApi, realRentApi } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MapViewProps {
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
  // 🆕 데이터셋 전용 전략(선택)
  markerColorFn?: (row: any) => string;
  legendItems?: { label: string; color: string }[];
  namespace?: string;
  // Legend 추가 주입 옵션
  legendTitle?: string;
  legendUnitLabel?: string;
  legendHint?: string;
  legendEditable?: boolean;
  legendPaletteOverride?: Partial<{
    blue: string;
    green: string;
    pink: string;
    orange: string;
    red: string;
  }>;
  legendThresholds?: number[];
  // 클러스터링 사용 여부(초기 상태)
  useClustering?: boolean;
  // 클러스터 토글 UI 노출 여부
  clusterToggleEnabled?: boolean;
  // 반경(원) 컨트롤/오버레이
  circleControlsEnabled?: boolean;
  circleEnabled?: boolean;
  circleCenter?: { lat: number; lng: number } | null;
  circleRadiusM?: number;
  applyCircleFilter?: boolean;
  onCircleToggle?: () => void;
  onCircleChange?: (next: {
    center: { lat: number; lng: number } | null;
    radiusM: number;
  }) => void;
  onToggleApplyCircleFilter?: () => void;
  // 분석물건 마커
  refMarkerEnabled?: boolean;
  refMarkerLocked?: boolean;
  refMarkerCenter?: { lat: number; lng: number } | null;
  onRefMarkerToggleLock?: () => void;
  onRefMarkerMove?: (nextCenter: { lat: number; lng: number }) => void;
  onMoveToRefMarker?: () => void;
  // 🆕 원 중심 폴백 설정
  // true (기본값): circleCenter → refMarker → 지도중심 (경매 방식)
  // false: circleCenter만 사용, 폴백 없음 (실거래 방식)
  useRefMarkerFallback?: boolean;
  // 표시 상한(사용자 UI에서 선택한 cap). 지정 시 내부 Top-K에 반영
  markerLimit?: number;
}

function MapView({
  onItemSelect,
  items = [],
  isLoading,
  error,
  onRetry,
  enabled = true,
  onBoundsChange,
  locationKey,
  highlightIds = [],
  markerColorFn,
  legendItems,
  namespace,
  legendTitle,
  legendUnitLabel,
  legendHint,
  legendEditable,
  legendPaletteOverride,
  legendThresholds,
  // clustering
  useClustering = true,
  clusterToggleEnabled = false,
  // circle
  circleControlsEnabled,
  circleEnabled,
  circleCenter,
  circleRadiusM,
  applyCircleFilter,
  onCircleToggle,
  onCircleChange,
  onToggleApplyCircleFilter,
  // ref marker
  refMarkerEnabled,
  refMarkerLocked,
  refMarkerCenter,
  onRefMarkerToggleLock,
  onRefMarkerMove,
  onMoveToRefMarker,
  // 🆕 원 중심 폴백
  useRefMarkerFallback,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapControllerRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<"2d-map" | "3d-map">("2d-map");
  const kakaoMapRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const focusMarkerRef = useRef<any>(null);
  const focusCircleRef = useRef<any>(null);
  // 🆕 상세→지도 초기 마커(전월세: circleEnabled 여부와 무관하게 표기)
  const initialCenterMarkerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const [clusterEnabled, setClusterEnabled] = useState<boolean>(
    Boolean(useClustering)
  );
  // 원 오버레이/중심 마커
  const drawCircleRef = useRef<any>(null);
  const drawCircleCenterMarkerRef = useRef<any>(null);
  // id→마커 인덱스/강조 관리
  const markerIndexRef = useRef<
    Map<
      string,
      { marker: any; pos: any; normalImage: any; color: string; label: string }
    >
  >(new Map());
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  const selectedOverlayMarkersRef = useRef<Map<string, any>>(new Map());
  // 동일 좌표 그룹: key(lat,lng 6자리 고정) → items[]
  const coordGroupsRef = useRef<Map<string, any[]>>(new Map());
  // 마커 → 원본 아이템 매핑(클러스터 클릭 시 활용)
  const markerToItemRef = useRef<Map<any, any>>(new Map());
  const lastClickedMarkerPosRef = useRef<{ lat: number; lng: number } | null>(
    null
  );
  const refMarkerRef = useRef<any>(null);
  // 팝업/툴팁: 데스크톱 CustomOverlay 1개 재사용, 모바일은 하단 시트
  const popupOverlayRef = useRef<any>(null);
  const [mobilePopupItem, setMobilePopupItem] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // 팝업 유지 기능 제거: 항상 false
  const isPopupLockedRef = useRef<boolean>(false);
  // 마커 배지 이미지 캐시 (color-text 조합별)
  const badgeImageCacheRef = useRef<Map<string, any>>(new Map());
  // 전역 Threshold
  const thresholdsState =
    (useFilterStore as any)?.((s: any) => s.thresholds) ?? DEFAULT_THRESHOLDS;
  // 외부 연동을 위한 마지막 중심 좌표 저장
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  // 최초 1회만 영역 맞춤(fitBounds) 수행하여, 이후 필터 변경 시 중심 유지
  const didInitialFitRef = useRef<boolean>(false);
  // 지역 전환 직후, 새 데이터 로드 완료 후에만 1회 fitBounds 하도록 보류 플래그
  const pendingFitRef = useRef<boolean>(false);
  // 상세→지도 이동 시 목표 좌표를 저장하여 초기 fitBounds를 우회
  const openTargetRef = useRef<{ lat: number; lng: number } | null>(null);
  // 좌표 표시용 상태 (지도 중심/마우스 포인터)
  const [centerCoord, setCenterCoord] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mouseCoord, setMouseCoord] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);
  // onBoundsChange 디바운스 및 중복 억제용
  const lastSentBoundsRef = useRef<string>("");
  const emitBoundsDebouncedRef = useRef<null | ((b: any) => void)>(null);
  // Kakao 지도 타입(일반/위성) 토글 상태
  const [kakaoMapType, setKakaoMapType] = useState<
    "ROADMAP" | "SKYVIEW" | "HYBRID"
  >("ROADMAP");
  const initializedRef = useRef<boolean>(false);

  // 줌 변경 핸들러(카카오)
  const changeZoomLevel = (delta: number) => {
    if (provider !== "kakao") return;
    const map = kakaoMapRef.current as any;
    if (!map) return;
    try {
      const current =
        typeof map.getLevel === "function" ? map.getLevel() : null;
      if (typeof current === "number") {
        const next = Math.max(1, Math.min(14, current + delta));
        if (typeof map.setLevel === "function") map.setLevel(next);
        setZoomLevel(next);
      }
    } catch {}
  };

  // Kakao만 사용
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  const provider: "kakao" = "kakao";
  const propsMarkerLimit = (arguments as any)[0]?.markerLimit as
    | number
    | undefined;

  // 지역 키가 바뀌었을 때 내부 마커/클러스터 정리 및 초기 fitBounds 1회 재허용
  useEffect(() => {
    if (!mapReady) return;
    try {
      if (clustererRef.current) clustererRef.current.clear();
      markersRef.current.forEach((m) => m.setMap(null));
    } catch {}
    markersRef.current = [];
    didInitialFitRef.current = false;
    // 지역 전환 직후 데이터 로드 완료 시점에 맞춰 1회 fitBounds 수행을 보장
    pendingFitRef.current = true;
    // 팝업도 초기화
    try {
      if (popupOverlayRef.current) popupOverlayRef.current.setMap(null);
    } catch {}
    setMobilePopupItem(null);
    // Kakao: relayout 후 현재 중심 유지
    if (provider === "kakao" && kakaoMapRef.current) {
      try {
        const map = kakaoMapRef.current;
        if (typeof map.relayout === "function") map.relayout();
      } catch {}
    }
  }, [locationKey, mapReady, provider]);

  // Kakao 지도 타입 적용(일반/위성)
  useEffect(() => {
    if (provider !== "kakao" || !mapReady) return;
    const map = kakaoMapRef.current as any;
    if (!map) return;
    try {
      const w = window as any;
      let typeId = w.kakao.maps.MapTypeId.ROADMAP;
      if (kakaoMapType === "SKYVIEW") typeId = w.kakao.maps.MapTypeId.SKYVIEW;
      else if (kakaoMapType === "HYBRID")
        typeId =
          w.kakao.maps.MapTypeId.HYBRID ?? w.kakao.maps.MapTypeId.SKYVIEW;
      if (typeof map.setMapTypeId === "function") map.setMapTypeId(typeId);
    } catch {}
  }, [kakaoMapType, mapReady, provider]);

  useEffect(() => {
    // 지도 초기화는 탭 활성화 여부와 무관하게 최초 1회 수행
    if (initializedRef.current) return;
    if (kakaoMapRef.current) {
      setMapReady(true);
      initializedRef.current = true;
      return;
    }
    if (!mapRef.current) return;
    if (!kakaoKey) return;
    loadKakaoSdk(kakaoKey)
      .then(() => {
        const w = window as any;
        const map = new w.kakao.maps.Map(mapRef.current, {
          center: new w.kakao.maps.LatLng(37.5665, 126.978),
          level: 8,
        });
        kakaoMapRef.current = map;
        try {
          // 디버그용 전역 노출: 브라우저 콘솔에서 지도/스토어에 접근 가능하도록
          (window as any).__kakao_map_ref = map;
          (window as any).__getFilterState = (useFilterStore as any)?.getState;
        } catch {}
        try {
          const c = map.getCenter?.();
          if (c) lastCenterRef.current = { lat: c.getLat(), lng: c.getLng() };
        } catch {}
        setMapReady(true);
        initializedRef.current = true;
      })
      .catch(() => setMapReady(false));
  }, [kakaoKey]);

  // 뷰포트 기준 모바일 여부 추정
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
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
          openTargetRef.current = { lat: detail.lat, lng: detail.lng };
          kakaoMapRef.current.setCenter(latlng);
          // 요청: 지도에서 보기 → 해당 좌표로 이동 + 줌 레벨 4 고정
          try {
            if (typeof kakaoMapRef.current.setLevel === "function") {
              kakaoMapRef.current.setLevel(4);
            }
          } catch {}
          lastCenterRef.current = { lat: detail.lat, lng: detail.lng };

          try {
            // 클릭 포커스용 기본 파란 마커 제거
            if (focusMarkerRef.current) {
              try {
                focusMarkerRef.current.setMap(null);
              } catch {}
              focusMarkerRef.current = null as any;
            }
            if (focusCircleRef.current) {
              try {
                focusCircleRef.current.setMap(null);
              } catch {}
              focusCircleRef.current = null as any;
            }
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
    markerIndexRef.current.clear();
    // 좌표 그룹/마커-아이템 맵 초기화(중복 누적 방지)
    try {
      coordGroupsRef.current.clear();
    } catch {}
    try {
      markerToItemRef.current.clear();
    } catch {}

    // Threshold (만원) - 데이터셋별 기본값 + 전역 상태 사용
    const defaultThresholds =
      namespace === "sale"
        ? [5000, 10000, 30000, 50000] // 실거래가: 5천, 1억, 3억, 5억
        : [6000, 8000, 10000, 13000]; // 경매: 기존 값

    // sale 데이터셋은 기본값 우선, 다른 데이터셋은 전역 스토어 우선
    const thresholds: number[] =
      namespace === "sale"
        ? legendThresholds ?? defaultThresholds
        : Array.isArray(thresholdsState)
        ? (thresholdsState as number[])
        : defaultThresholds;

    // 데이터셋별 색상 팔레트
    const defaultPalette =
      namespace === "sale"
        ? {
            blue: "#2563eb",
            green: "#22c55e", // 녹색: ~5천만원
            pink: "#eab308", // 노란색: 5천~1억
            orange: "#f97316", // 주황색: 1억~3억
            red: "#ef4444", // 빨간색: 3억~5억
            grey: "#9333ea", // 보라색: 5억 이상
          }
        : {
            blue: "#2563eb",
            green: "#16a34a",
            pink: "#ec4899",
            orange: "#f59e0b",
            red: "#ef4444",
            grey: "#64748b",
          };

    const palette =
      (useFilterStore as any)?.getState?.()?.palette ?? defaultPalette;
    const getColorByPrice = (price?: number | string | null) => {
      const v = typeof price === "string" ? parseFloat(price) : price ?? 0;
      if (!v || isNaN(v)) return "#111827"; // black for missing/invalid
      const sorted = [...thresholds].sort((a, b) => a - b);
      const colors = [
        palette.blue,
        palette.green,
        palette.pink,
        palette.orange,
        palette.red,
      ];
      for (let i = 0; i < sorted.length; i++) {
        if (v <= sorted[i]) return colors[i] ?? colors[colors.length - 1];
      }
      return colors[Math.min(sorted.length, colors.length - 1)];
    };

    // 퍼센트 → 10% 버킷 텍스트("00"~"100"), 결측 "--"
    const getBucketText = (p?: number | string | null) => {
      if (p === undefined || p === null || p === "") return "--";
      const num = typeof p === "string" ? parseFloat(p) : p;
      if (!isFinite(num as number)) return "--";
      const percent =
        (num as number) <= 1 ? (num as number) * 100 : (num as number);
      const bucket = Math.min(100, Math.floor(percent / 10) * 10);
      return String(bucket).padStart(2, "0");
    };

    const formatMoney = (n?: number | string | null) => {
      const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
      if (!isFinite(v as number)) return "-";
      return `${Number(v).toLocaleString()}만원`;
    };

    // 실거래가 금액 포맷: 억/만원 단위로 간략 표시
    const formatSaleAmount = (amount?: number | string | null) => {
      const v = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
      if (!isFinite(v as number) || v === 0) return "-";

      const eok = Math.floor(v / 10000);
      const man = Math.floor((v % 10000) / 1000);

      if (eok > 0) {
        return man > 0 ? `${eok}억${man}천` : `${eok}억`;
      }

      if (v >= 1000) {
        return `${Math.floor(v / 1000)}천`;
      }

      return `${Math.floor(v)}`;
    };

    // 팝업 이벤트 핸들러 등록 헬퍼 함수
    const attachPopupEventHandlers = (root: HTMLElement, item: any) => {
      const closeBtn = root.querySelector(
        '[data-action="close"]'
      ) as HTMLButtonElement | null;
      const detailBtn = root.querySelector(
        '[data-action="detail"]'
      ) as HTMLButtonElement | null;
      const favBtn = root.querySelector(
        '[data-action="fav"]'
      ) as HTMLButtonElement | null;
      const shareBtn = root.querySelector(
        '[data-action="share"]'
      ) as HTMLButtonElement | null;
      const copyAddrBtn = root.querySelector(
        '[data-action="copy-addr"]'
      ) as HTMLButtonElement | null;

      closeBtn?.addEventListener("click", () => closePopup());

      detailBtn?.addEventListener("click", () => {
        const evt = new CustomEvent("property:openDetail", {
          detail: { id: String(item?.id ?? "") },
        });
        window.dispatchEvent(evt);
      });

      favBtn?.addEventListener("click", () => {
        const evt = new CustomEvent("property:toggleFavorite", {
          detail: { id: String(item?.id ?? "") },
        });
        window.dispatchEvent(evt);
        // 아이콘 토글(빈별 ↔ 채운별)
        try {
          const active = favBtn.getAttribute("data-active") === "1";
          if (active) {
            favBtn.textContent = "☆";
            favBtn.setAttribute("data-active", "0");
          } else {
            favBtn.textContent = "⭐";
            favBtn.setAttribute("data-active", "1");
          }
        } catch {}
      });

      shareBtn?.addEventListener("click", async () => {
        try {
          const title = item?.address || item?.roadAddress || "";
          const text = item?.extra?.buildingName || "";
          const url = window.location.href;
          if ((navigator as any).share) {
            await (navigator as any).share({ title, text, url });
          } else {
            await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
          }
        } catch {}
      });

      copyAddrBtn?.addEventListener("click", async () => {
        try {
          const addr =
            item?.address ||
            item?.roadAddress ||
            item?.extra?.roadAddressReal ||
            "";
          await navigator.clipboard.writeText(addr);

          // 토스트 메시지
          const toast = document.createElement("div");
          toast.textContent = "주소가 복사되었습니다.";
          toast.style.position = "fixed";
          toast.style.left = "50%";
          toast.style.top = "24px";
          toast.style.transform = "translate(-50%, -10px)";
          toast.style.zIndex = "99999";
          toast.style.padding = "8px 12px";
          toast.style.background = "#111827";
          toast.style.color = "#fff";
          toast.style.borderRadius = "8px";
          toast.style.fontSize = "13px";
          document.body.appendChild(toast);
          setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s";
            setTimeout(() => toast.remove(), 300);
          }, 1500);
        } catch {}
      });
    };

    const buildPopupHTML = (it: any) => {
      // 🆕 auction_ed 전용 팝업: 공통 베이스 + 경매 스키마로 렌더링
      if (namespace === "auction_ed") {
        const item = it || {};
        // 안전 매핑: snake_case 원본과 extra의 camelCase 모두 허용하도록 스키마가 처리
        const { title, subtitle, rows, actions } = auctionSchema(item);
        return renderBasePopup({ title, subtitle, rows, actions });
      }

      // 🆕 sale/rent 전용 팝업: 비동기 데이터 로딩 + 테이블 렌더링
      if (namespace === "sale" || namespace === "rent") {
        const item = it || {};
        const address =
          item?.address ||
          item?.roadAddress ||
          item?.extra?.roadAddressReal ||
          "";

        // 로딩 중 팝업 생성
        const loadingDiv = document.createElement("div");
        loadingDiv.style.width = "270px";
        loadingDiv.style.padding = "20px";
        loadingDiv.style.background = "rgba(255,255,255,0.98)";
        loadingDiv.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
        loadingDiv.style.border = "1px solid rgba(0,0,0,0.08)";
        loadingDiv.style.borderRadius = "8px";
        loadingDiv.style.textAlign = "center";
        loadingDiv.innerHTML = `
          <div style="font-size:14px;color:#6b7280;margin-bottom:8px">데이터 로딩 중...</div>
          <div style="font-size:12px;color:#9ca3af">${address}</div>
        `;

        // 비동기로 데이터 로딩 후 팝업 업데이트
        const loader =
          namespace === "sale"
            ? realTransactionApi.getTransactionsByAddress(address)
            : realRentApi.getRentsByAddress(address);
        loader
          .then((response) => {
            // ⭐ 경고 메시지 처리 (1000건 초과 시)
            if (response.warning) {
              console.warn(`[MapView API Warning] ${response.warning}`);
              // TODO: 선택적으로 사용자에게 토스트 표시
              // toast.warning(response.warning);
            }

            const transactions = response.items || [];
            const buildingInfo = transactions[0] || item; // 첫 번째 거래 또는 현재 아이템을 대표로 사용

            const { title, subtitle, rows, table, actions } =
              namespace === "sale"
                ? saleSchema(buildingInfo, transactions)
                : rentSchema(buildingInfo, transactions);

            const newContent = renderBasePopup({
              title,
              subtitle,
              rows,
              table,
              tableCollapsible: true,
              actions,
              widthPx: 540,
            });

            // 팝업 오버레이가 여전히 존재하는 경우에만 업데이트
            if (popupOverlayRef.current && popupOverlayRef.current.getMap()) {
              popupOverlayRef.current.setContent(newContent);

              // 이벤트 핸들러 재등록
              attachPopupEventHandlers(newContent, item);
            }
          })
          .catch((error) => {
            console.error("[MapView] Failed to load transactions:", error);

            // 에러 팝업
            const errorDiv = document.createElement("div");
            errorDiv.style.width = "270px";
            errorDiv.style.padding = "20px";
            errorDiv.style.background = "rgba(255,255,255,0.98)";
            errorDiv.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
            errorDiv.style.border = "1px solid rgba(0,0,0,0.08)";
            errorDiv.style.borderRadius = "8px";
            errorDiv.style.textAlign = "center";
            errorDiv.innerHTML = `
              <div style="font-size:14px;color:#ef4444;margin-bottom:8px">데이터 로딩 실패</div>
              <div style="font-size:12px;color:#9ca3af">${address}</div>
              <button data-action="close" style="margin-top:12px;padding:6px 12px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;color:#111827;font-size:12px">닫기</button>
            `;

            if (popupOverlayRef.current && popupOverlayRef.current.getMap()) {
              popupOverlayRef.current.setContent(errorDiv);

              const closeBtn = errorDiv.querySelector(
                '[data-action="close"]'
              ) as HTMLButtonElement;
              closeBtn?.addEventListener("click", () => closePopup());
            }
          });

        return loadingDiv;
      }

      // 기본(분석 등) 팝업: 공통 베이스 + 분석 스키마로 렌더링
      try {
        const { title, subtitle, rows, actions } = analysisSchema(it || {});
        return renderBasePopup({ title, subtitle, rows, actions });
      } catch {}

      const useDiv = document.createElement("div");
      useDiv.style.width = "270px";
      useDiv.style.maxWidth = "270px";
      useDiv.style.maxHeight = "";
      useDiv.style.overflowY = "visible";
      useDiv.style.background = "rgba(255,255,255,0.98)";
      useDiv.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      useDiv.style.border = "1px solid rgba(0,0,0,0.08)";
      useDiv.style.borderRadius = "8px";
      useDiv.style.padding = "10px";
      useDiv.style.position = "relative";
      useDiv.innerHTML = `
        <div style="display:flex;gap:6px;justify-content:flex-end;margin-bottom:4px">
          <button title="관심물건" data-action="fav" data-active="0" style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);font-size:14px;line-height:22px">☆</button>
          <button title="공유" data-action="share" style="width:24px;height:24px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.06);font-size:14px;line-height:22px">🔗</button>
        </div>
        <div style="font-weight:600;font-size:13px;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${
          it?.usage ?? ""
        } · ${it?.case_number ?? ""}</div>
        <div style="font-size:12px;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${
          it?.road_address ?? ""
        }</div>
        <div style="display:flex;gap:6px;justify-content:flex-start;margin:6px 0 8px 0">
          <button data-action="copy-addr" style="padding:4px 8px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;color:#111827;font-size:11px">주소 복사</button>
          <button data-action="copy-case" style="padding:4px 8px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;color:#111827;font-size:11px">사건번호 복사</button>
        </div>
        <table style="width:100%;font-size:12px;color:#111827;border-collapse:collapse;table-layout:fixed">
          <tr><td style="padding:2px 0;color:#6b7280">감정가</td><td style="text-align:right" aria-label="감정가 ${formatMoney(
            it?.appraised_value
          )}">${formatMoney(it?.appraised_value)}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">최저가</td><td style="text-align:right" aria-label="최저가 ${formatMoney(
            it?.minimum_bid_price
          )}">${formatMoney(it?.minimum_bid_price)}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">최저가/감정가</td><td style="text-align:right" aria-label="최저가 대비 감정가 비율 ${
            it?.bid_to_appraised_ratio != null
              ? `${it.bid_to_appraised_ratio}%`
              : "-"
          }">${
        it?.bid_to_appraised_ratio != null
          ? `${it.bid_to_appraised_ratio}%`
          : "-"
      }</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">현재상태</td><td style="text-align:right">${
            it?.current_status ?? ""
          }</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">매각기일</td><td style="text-align:right" aria-label="매각기일 ${
            it?.sale_date ?? "-"
          }">${it?.sale_date ?? "-"}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">공시가격</td><td style="text-align:right" aria-label="공시가격 ${formatMoney(
            it?.public_price
          )}">${formatMoney(it?.public_price)}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">최저가/공시가격</td><td style="text-align:right">${(function () {
            const minV = parseFloat(it?.minimum_bid_price ?? "") || 0;
            const pubV = parseFloat(it?.public_price ?? "") || 0;
            if (!pubV) return "-";
            const r = (minV / pubV) * 100;
            if (!isFinite(r)) return "-";
            return `${r.toFixed(1)}%`;
          })()}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">건물평형</td><td style="text-align:right">${
            it?.building_area_pyeong != null && it?.building_area_pyeong !== ""
              ? `${Math.floor(parseFloat(it.building_area_pyeong))}평`
              : ""
          }</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">층확인</td><td style="text-align:right">${
            it?.floor_confirmation ?? ""
          }</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">Elevator</td><td style="text-align:right">${(function () {
            const v = it?.elevator_available;
            if (v === undefined || v === null) return "";
            const s = String(v).toUpperCase();
            if (s === "Y" || s === "O" || s === "TRUE" || s === "1") return "Y";
            if (s === "N" || s === "X" || s === "FALSE" || s === "0")
              return "N";
            return String(v);
          })()}</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280">건축연도</td><td style="text-align:right">${
            it?.construction_year
              ? `${Math.floor(parseFloat(it.construction_year))}년`
              : ""
          }</td></tr>
          <tr><td style="padding:2px 0;color:#6b7280;vertical-align:top">특수조건</td><td style="text-align:right;white-space:normal;word-break:break-word;line-height:1.4">${(function () {
            const text = String(it?.special_rights || "").trim();
            if (text) return text;
            const keys = [
              "tenant_with_opposing_power",
              "hug_acquisition_condition_change",
              "senior_lease_right",
              "resale",
              "partial_sale",
              "joint_collateral",
              "separate_registration",
              "lien",
              "illegal_building",
              "lease_right_sale",
              "land_right_unregistered",
            ];
            const labelMap: Record<string, string> = {
              tenant_with_opposing_power: "대항력있는임차인",
              hug_acquisition_condition_change: "HUG인수조건변경",
              senior_lease_right: "선순위임차권",
              resale: "재매각",
              partial_sale: "지분매각",
              joint_collateral: "공동담보",
              separate_registration: "별도등기",
              lien: "유치권",
              illegal_building: "위반건축물",
              lease_right_sale: "전세권매각",
              land_right_unregistered: "대지권미등기",
            };
            const yes = (v: any) => {
              if (typeof v === "boolean") return v;
              const s = String(v).toUpperCase();
              return s === "Y" || s === "O" || s === "TRUE" || s === "1";
            };
            const picked = keys
              .filter((k) => yes((it as any)[k]))
              .map((k) => labelMap[k]);
            return picked.length ? picked.join(", ") : "";
          })()}</td></tr>
        </table>
        <div style="display:flex;gap:8px;margin-top:10px;justify-content:center">
          <button data-action="close" style="padding:6px 12px;border:1px solid #e5e7eb;border-radius:9999px;background:#fff;color:#111827;font-size:12px">닫기</button>
          <button data-action="detail" style="padding:6px 12px;border:1px solid #1d4ed8;border-radius:9999px;background:#2563eb;color:#fff;font-size:12px">상세보기</button>
        </div>
      `;
      return useDiv;
    };

    const openPopup = (it: any, pos: any) => {
      if (isMobile) {
        setMobilePopupItem(it);
        return;
      }
      try {
        const w = window as any;
        const content = buildPopupHTML(it);
        if (!popupOverlayRef.current) {
          popupOverlayRef.current = new w.kakao.maps.CustomOverlay({
            position: pos,
            yAnchor: 1,
            zIndex: 9999,
            content,
          });
        } else {
          popupOverlayRef.current.setContent(content);
          popupOverlayRef.current.setPosition(pos);
        }
        popupOverlayRef.current.setMap(map);
        // 중앙 고정 우선 정책: 추가 보정은 생략
        try {
        } catch {}
        try {
          const maybeRoot = (popupOverlayRef.current as any).getContent?.();
          const root: HTMLElement = (maybeRoot as HTMLElement) || content;
          const closeBtn = root.querySelector(
            '[data-action="close"]'
          ) as HTMLButtonElement | null;
          const detailBtn = root.querySelector(
            '[data-action="detail"]'
          ) as HTMLButtonElement | null;
          const favBtn = root.querySelector(
            '[data-action="fav"]'
          ) as HTMLButtonElement | null;
          const shareBtn = root.querySelector(
            '[data-action="share"]'
          ) as HTMLButtonElement | null;
          const copyAddrBtn = root.querySelector(
            '[data-action="copy-addr"]'
          ) as HTMLButtonElement | null;
          const copyCaseBtn = root.querySelector(
            '[data-action="copy-case"]'
          ) as HTMLButtonElement | null;
          closeBtn?.addEventListener("click", () => closePopup());
          detailBtn?.addEventListener("click", () => {
            const evt = new CustomEvent("property:openDetail", {
              detail: { id: String(it?.id ?? "") },
            });
            window.dispatchEvent(evt);
          });

          favBtn?.addEventListener("click", () => {
            const evt = new CustomEvent("property:toggleFavorite", {
              detail: { id: String(it?.id ?? "") },
            });
            window.dispatchEvent(evt);
            // 아이콘 토글(빈별 ↔ 채운별)
            try {
              const active = favBtn.getAttribute("data-active") === "1";
              if (active) {
                favBtn.textContent = "☆";
                favBtn.setAttribute("data-active", "0");
              } else {
                favBtn.textContent = "⭐";
                favBtn.setAttribute("data-active", "1");
              }
            } catch {}
          });
          shareBtn?.addEventListener("click", async () => {
            try {
              const title = `${it?.usage ?? ""} · ${it?.case_number ?? ""}`;
              const text = it?.road_address ?? "";
              const url = window.location.href;
              if ((navigator as any).share) {
                await (navigator as any).share({ title, text, url });
              } else {
                await navigator.clipboard.writeText(
                  `${title}\n${text}\n${url}`
                );
              }
            } catch {}
          });
          const showToastFixed = (msg: string) => {
            try {
              const toast = document.createElement("div");
              toast.textContent = msg;
              toast.style.position = "fixed";
              // 전체 창 기준 중앙 상단에 표시
              toast.style.left = "50%";
              toast.style.top = "24px";
              // 초기에 더 위에서 시작 → 자연스러운 슬라이드-페이드 인
              toast.style.transform = "translate(-50%, -10px)";
              toast.style.zIndex = "99999";
              toast.style.padding = "8px 12px";
              toast.style.borderRadius = "8px";
              toast.style.fontSize = "12px";
              toast.style.background = "rgba(17,24,39,.9)";
              toast.style.color = "#fff";
              toast.style.boxShadow = "0 4px 10px rgba(0,0,0,.2)";
              toast.style.opacity = "0";
              toast.style.transition =
                "opacity .6s ease-in-out, transform .6s ease-in-out";
              toast.style.pointerEvents = "none";
              document.body.appendChild(toast);
              requestAnimationFrame(() => {
                toast.style.opacity = "1";
                toast.style.transform = "translate(-50%, 0px)";
              });
              // 2초 내에 부드럽게 나타났다 사라지도록: 0.6s in + 0.8s 유지 + 0.6s out
              setTimeout(() => {
                toast.style.opacity = "0";
                toast.style.transform = "translate(-50%, -10px)";
              }, 1400);
              setTimeout(() => toast.remove(), 2000);
            } catch {}
          };

          copyAddrBtn?.addEventListener("click", async () => {
            try {
              await navigator.clipboard.writeText(
                String(it?.road_address || "")
              );
              showToastFixed("주소가 복사되었습니다");
            } catch {}
          });
          copyCaseBtn?.addEventListener("click", async () => {
            try {
              await navigator.clipboard.writeText(
                String(it?.case_number || "")
              );
              showToastFixed("사건번호가 복사되었습니다");
            } catch {}
          });
          // 팝업 내부 상호작용 시 맵으로 이벤트 버블/줌 전파 방지
          const stop = (e: Event) => {
            e.stopPropagation();
          };
          const stopPrevent = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
          };
          root.addEventListener("click", stop);
          root.addEventListener("mousedown", stop);
          root.addEventListener("touchstart", stop);
          root.addEventListener("wheel", stopPrevent, {
            passive: false,
          } as any);
          root.addEventListener("touchmove", stopPrevent, {
            passive: false,
          } as any);
        } catch {}
      } catch {}
    };

    const closePopup = () => {
      try {
        if (popupOverlayRef.current) popupOverlayRef.current.setMap(null);
      } catch {}
      setMobilePopupItem(null);
    };

    const buildMultiPopupHTML = (itemsAtPoint: any[], pageIdx: number) => {
      const target = itemsAtPoint[pageIdx] ?? itemsAtPoint[0];
      const content = buildPopupHTML(target);
      // 네비게이션 바 추가
      const nav = document.createElement("div");
      nav.style.display = "flex";
      nav.style.justifyContent = "center";
      nav.style.alignItems = "center";
      nav.style.gap = "8px";
      nav.style.marginTop = "8px";
      nav.innerHTML = `
        <button data-action="prev" style="padding:4px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff">◀</button>
        <span data-role="page" style="font-size:12px;color:#374151">${
          pageIdx + 1
        } / ${itemsAtPoint.length}</span>
        <button data-action="next" style="padding:4px 8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff">▶</button>
      `;
      content.appendChild(nav);
      return content;
    };

    const openMultiPopup = (
      itemsAtPoint: any[],
      pos: any,
      startIdx: number
    ) => {
      const w = window as any;
      const mount = (idx: number) => {
        const content = buildMultiPopupHTML(itemsAtPoint, idx);
        if (!popupOverlayRef.current) {
          popupOverlayRef.current = new w.kakao.maps.CustomOverlay({
            position: pos,
            yAnchor: 1,
            zIndex: 9999,
            content,
          });
        } else {
          popupOverlayRef.current.setContent(content);
          popupOverlayRef.current.setPosition(pos);
        }
        popupOverlayRef.current.setMap(kakaoMapRef.current);
        // 네비게이션/액션 이벤트 (닫기/상세/복사/공유/즐겨찾기 포함)
        const root: HTMLElement = content;
        const prevBtn = root.querySelector(
          '[data-action="prev"]'
        ) as HTMLButtonElement | null;
        const nextBtn = root.querySelector(
          '[data-action="next"]'
        ) as HTMLButtonElement | null;
        const closeBtn = root.querySelector(
          '[data-action="close"]'
        ) as HTMLButtonElement | null;
        const detailBtn = root.querySelector(
          '[data-action="detail"]'
        ) as HTMLButtonElement | null;
        const favBtn = root.querySelector(
          '[data-action="fav"]'
        ) as HTMLButtonElement | null;
        const shareBtn = root.querySelector(
          '[data-action="share"]'
        ) as HTMLButtonElement | null;
        const copyAddrBtn = root.querySelector(
          '[data-action="copy-addr"]'
        ) as HTMLButtonElement | null;
        const copyCaseBtn = root.querySelector(
          '[data-action="copy-case"]'
        ) as HTMLButtonElement | null;

        prevBtn?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const next = (idx - 1 + itemsAtPoint.length) % itemsAtPoint.length;
          mount(next);
        });
        nextBtn?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const next = (idx + 1) % itemsAtPoint.length;
          mount(next);
        });

        // 현재 페이지의 아이템
        const currentItem = itemsAtPoint[idx];
        closeBtn?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          try {
            if (popupOverlayRef.current) popupOverlayRef.current.setMap(null);
          } catch {}
        });
        detailBtn?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const evt = new CustomEvent("property:openDetail", {
            detail: { id: String(currentItem?.id ?? "") },
          });
          window.dispatchEvent(evt);
        });
        favBtn?.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const evt = new CustomEvent("property:toggleFavorite", {
            detail: { id: String(currentItem?.id ?? "") },
          });
          window.dispatchEvent(evt);
          try {
            const active = favBtn.getAttribute("data-active") === "1";
            if (active) {
              favBtn.textContent = "☆";
              favBtn.setAttribute("data-active", "0");
            } else {
              favBtn.textContent = "⭐";
              favBtn.setAttribute("data-active", "1");
            }
          } catch {}
        });

        const showToastFixed = (msg: string) => {
          try {
            const toast = document.createElement("div");
            toast.textContent = msg;
            toast.style.position = "fixed";
            toast.style.left = "50%";
            toast.style.top = "24px";
            toast.style.transform = "translate(-50%, -10px)";
            toast.style.zIndex = "99999";
            toast.style.padding = "8px 12px";
            toast.style.borderRadius = "8px";
            toast.style.fontSize = "12px";
            toast.style.background = "rgba(17,24,39,.9)";
            toast.style.color = "#fff";
            toast.style.boxShadow = "0 4px 10px rgba(0,0,0,.2)";
            toast.style.opacity = "0";
            toast.style.transition =
              "opacity .6s ease-in-out, transform .6s ease-in-out";
            toast.style.pointerEvents = "none";
            document.body.appendChild(toast);
            requestAnimationFrame(() => {
              toast.style.opacity = "1";
              toast.style.transform = "translate(-50%, 0px)";
            });
            setTimeout(() => {
              toast.style.opacity = "0";
              toast.style.transform = "translate(-50%, -10px)";
            }, 1400);
            setTimeout(() => toast.remove(), 2000);
          } catch {}
        };
        copyAddrBtn?.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await navigator.clipboard.writeText(
              String(currentItem?.road_address || "")
            );
            showToastFixed("주소가 복사되었습니다");
          } catch {}
        });
        copyCaseBtn?.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            await navigator.clipboard.writeText(
              String(currentItem?.case_number || "")
            );
            showToastFixed("사건번호가 복사되었습니다");
          } catch {}
        });
        shareBtn?.addEventListener("click", async (ev) => {
          ev.stopPropagation();
          try {
            const title = `${currentItem?.usage ?? ""} · ${
              currentItem?.case_number ?? ""
            }`;
            const text = currentItem?.road_address ?? "";
            const url = window.location.href;
            if ((navigator as any).share) {
              await (navigator as any).share({ title, text, url });
            } else {
              await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
              showToastFixed("링크가 복사되었습니다");
            }
          } catch {}
        });
        // 팝업 내부 이벤트 전파 방지
        const stop = (e: Event) => e.stopPropagation();
        const stopPrevent = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        };
        root.addEventListener("click", stop);
        root.addEventListener("mousedown", stop);
        root.addEventListener("touchstart", stop);
        root.addEventListener("wheel", stopPrevent, { passive: false } as any);
        root.addEventListener("touchmove", stopPrevent, {
          passive: false,
        } as any);
      };
      mount(startIdx);
    };

    // SVG 배지 → MarkerImage (25x25, rx=6, 중앙 앵커) 캐싱
    const getModernBadgeImage = (color: string, text: string) => {
      const key = `${color}-${text}`;
      const cache = badgeImageCacheRef.current;
      const found = cache.get(key);
      if (found) return found;
      const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='25' height='25'>` +
        `<rect x='0.5' y='0.5' width='24' height='24' rx='6' ry='6' fill='${color}' stroke='rgba(0,0,0,0.15)' stroke-width='1'/>` +
        `<text x='12.5' y='12.5' dominant-baseline='middle' text-anchor='middle' fill='#fff' font-weight='600' font-size='12' font-family='system-ui,-apple-system,Segoe UI,Roboto,Noto Sans KR,sans-serif' letter-spacing='.2'>${text}</text>` +
        `</svg>`;
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      const size = new w.kakao.maps.Size(25, 25);
      const offset = new w.kakao.maps.Point(12, 12);
      const img = new w.kakao.maps.MarkerImage(url, size, { offset });
      cache.set(key, img);
      return img;
    };

    // 간단 디바운스
    const debounce = (fn: () => void, ms = 200) => {
      let t: any;
      return () => {
        clearTimeout(t);
        t = setTimeout(fn, ms);
      };
    };

    // 클러스터러 생성(가능한 경우)
    try {
      if (clusterEnabled && w.kakao.maps.MarkerClusterer) {
        clustererRef.current = new w.kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 9, // 기본값. 정책은 아래 applyClusterPolicy에서 동적으로 조정
          gridSize: 60,
          disableClickZoom: true, // 클릭 시 사용자 정의 동작
        });
      } else {
        clustererRef.current = null;
      }
      // 클러스터 클릭 정책
      // - level > 2: bounds로 확대(일반 동작)
      // - level == 2: 동일좌표만이면 멀티팝업, 아니면 강제 level 1로 즉시 확대
      // - level == 1: 동일좌표면 멀티팝업, 아니면 줌 변경 없이 유지
      w.kakao.maps.event.addListener(
        clustererRef.current,
        "clusterclick",
        (cluster: any) => {
          try {
            const center = cluster.getCenter?.();
            const markers: any[] = cluster.getMarkers?.() || [];
            // id 기준 유일화된 아이템 목록
            const itemsAtPoint = Array.from(
              new Map(
                (markers || [])
                  .map((m: any) => markerToItemRef.current.get(m))
                  .filter(Boolean)
                  .map((it: any) => [String(it?.id ?? ""), it])
              ).values()
            );
            // 좌표 목록/uniq 키 계산
            const bounds = new w.kakao.maps.LatLngBounds();
            const posList: any[] = [];
            markers.forEach((mk: any) => {
              try {
                const p = mk.getPosition?.();
                if (p) {
                  bounds.extend(p);
                  posList.push(p);
                }
              } catch {}
            });
            const uniq = new Set(
              posList.map(
                (p: any) => `${p.getLat().toFixed(6)},${p.getLng().toFixed(6)}`
              )
            );
            const level = map.getLevel?.();
            if (typeof level !== "number") return;
            if (level > 2) {
              // 일반: bounds로 확대
              if (!bounds.isEmpty?.()) {
                try {
                  (map as any).setBounds(bounds, 40, 40, 40, 40);
                } catch {
                  map.setBounds(bounds);
                }
              } else if (center && typeof map.panTo === "function") {
                map.panTo(center);
              }
              return;
            }
            if (level === 2) {
              if (uniq.size === 1 && itemsAtPoint.length > 0) {
                // 동일좌표 → 멀티팝업, 줌 변경 없음
                const pos =
                  center instanceof w.kakao.maps.LatLng
                    ? center
                    : map.getCenter?.();
                openMultiPopup(itemsAtPoint, pos, 0);
              } else {
                // 즉시 1레벨로 확대
                try {
                  map.setLevel(1);
                } catch {}
                if (center && typeof map.panTo === "function") {
                  map.panTo(center);
                }
              }
              return;
            }
            // level === 1
            if (uniq.size === 1 && itemsAtPoint.length > 0) {
              const pos =
                center instanceof w.kakao.maps.LatLng
                  ? center
                  : map.getCenter?.();
              openMultiPopup(itemsAtPoint, pos, 0);
            } else {
              // 좌표가 여전히 섞여 있어도 줌 변경 없이 유지(팬만)
              if (center && typeof map.panTo === "function") {
                map.panTo(center);
              }
            }
          } catch {}
        }
      );
    } catch {}

    // 줌 정책 적용: level 기준 병합/부분/개별 (클러스터 사용 시에만)
    try {
      const applyClusterPolicy = () => {
        const level = map.getLevel?.();
        if (!clustererRef.current || typeof level !== "number") return;
        if (level >= 9) {
          clustererRef.current.setMinLevel(9);
          clustererRef.current.setGridSize?.(60);
        } else if (level >= 7) {
          clustererRef.current.setMinLevel(7);
          clustererRef.current.setGridSize?.(40);
        } else {
          clustererRef.current.setMinLevel(1);
          clustererRef.current.setGridSize?.(30);
        }
      };
      applyClusterPolicy();
      if (clustererRef.current) {
        w.kakao.maps.event.addListener(
          map,
          "zoom_changed",
          debounce(applyClusterPolicy, MAP_GUARD.clusterPolicyDebounceMs)
        );
      }
    } catch {}

    // 최대 N개만 표시(성능 보호) - 면적 상한과 분리된 표시 상한 사용
    const MAX =
      Number.isFinite(Number(propsMarkerLimit)) && Number(propsMarkerLimit) > 0
        ? Math.floor(Number(propsMarkerLimit))
        : MAP_GUARD.maxMarkers;
    // 좌표 결측 제외 + 상한 적용 (렌트는 기준점 가까운 순 Top-K 지원)
    const filtered = items.filter(
      (it: any) =>
        (it?.latitude ?? it?.lat ?? it?.lat_y ?? it?.y) != null &&
        (it?.longitude ?? it?.lng ?? it?.lon ?? it?.x) != null
    );
    // 기준점 산출: circleCenter → refMarker → 지도중심
    const refCenter = (function () {
      if (namespace === "rent") {
        const c =
          (circleCenter as any) || (refMarkerCenter as any) || centerCoord;
        if (
          c &&
          Number.isFinite((c as any).lat) &&
          Number.isFinite((c as any).lng) &&
          !(Number((c as any).lat) === 0 && Number((c as any).lng) === 0)
        )
          return { lat: Number((c as any).lat), lng: Number((c as any).lng) };
      }
      return null;
    })();

    let slice: any[];
    if (namespace === "rent" && refCenter) {
      // 거리 근사로 Top-K: (Δlat^2 + Δlng^2) 기준
      const dx = (lat: number, lng: number) => {
        const dlat = lat - refCenter.lat;
        const dlng = lng - refCenter.lng;
        return dlat * dlat + dlng * dlng;
      };
      // K가 작으면 정렬, 크면 힙/퀵셀렉트 고려 가능. 우선 간단 정렬 적용
      slice = filtered
        .map((it: any) => {
          const latRaw = it?.latitude ?? it?.lat ?? it?.lat_y ?? it?.y;
          const lngRaw = it?.longitude ?? it?.lng ?? it?.lon ?? it?.x;
          const lat =
            typeof latRaw === "number" ? latRaw : parseFloat(String(latRaw));
          const lng =
            typeof lngRaw === "number" ? lngRaw : parseFloat(String(lngRaw));
          const score =
            Number.isFinite(lat) && Number.isFinite(lng)
              ? dx(lat, lng)
              : Number.POSITIVE_INFINITY;
          return { it, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, MAX)
        .map((e) => e.it);
    } else {
      slice = filtered.slice(0, MAX);
    }
    const toAdd: any[] = [];
    let missingCoords = items.length - filtered.length;
    slice.forEach((it: any, idx: number) => {
      // 실거래가 데이터 좌표 필드 우선 지원 + 기존 경매 데이터 호환
      const latRaw = it?.latitude ?? it?.lat ?? it?.lat_y ?? it?.y;
      const lngRaw = it?.longitude ?? it?.lng ?? it?.lon ?? it?.x;
      const lat = typeof latRaw === "number" ? latRaw : parseFloat(latRaw);
      const lng = typeof lngRaw === "number" ? lngRaw : parseFloat(lngRaw);
      if (!isFinite(lat) || !isFinite(lng)) return;
      try {
        const pos = new w.kakao.maps.LatLng(lat, lng);
        // 기본 금액 필드(매매/경매 호환)
        const price =
          it?.price ??
          it?.transactionAmount ??
          it?.transaction_amount ??
          it?.minimum_bid_price ??
          it?.min_bid_price ??
          0;

        // 렌트 전용 레전드 값(전월세전환금): extra 우선, 서버 원본 폴백, 최종적으로 price 사용
        const rentLegendValue =
          it?.extra?.jeonseConversionAmount ??
          it?.jeonse_conversion_amount ??
          price;

        // 라벨: namespace에 따라 분기
        let label: string;
        if (namespace === "sale" || namespace === "rent") {
          // 실거래가/전월세: 엘리베이터 여부 표시 (Y/N)
          const elevatorAvailable = it?.extra?.elevatorAvailable;
          if (elevatorAvailable === true) {
            label = "Y";
          } else if (elevatorAvailable === false) {
            label = "N";
          } else {
            label = "-"; // 정보 없음
          }
        } else {
          // 경매 등: 비율 표시
          const ratioRaw = it?.bid_to_appraised_ratio ?? it?.percentage ?? null;
          label = getBucketText(ratioRaw);
        }

        // 색상 결정: 렌트는 전환금 기준, 그 외는 price 기준
        let color =
          typeof markerColorFn === "function"
            ? (markerColorFn as any)(it)
            : namespace === "rent"
            ? getColorByPrice(rentLegendValue)
            : getColorByPrice(price);
        if (typeof color !== "string" || color.trim() === "") {
          color = "#111827"; // fallback to black if unmapped/invalid
        }
        const image = getModernBadgeImage(color, label);

        const marker = new w.kakao.maps.Marker({
          position: pos,
          image,
          title:
            namespace === "sale"
              ? `거래금액 ${Number(
                  parseFloat(price || 0) || 0
                ).toLocaleString()}만원`
              : namespace === "rent"
              ? `전월세전환금 ${Number(
                  parseFloat(rentLegendValue || 0) || 0
                ).toLocaleString()}만원`
              : `최저가 ${Number(
                  parseFloat(price || 0) || 0
                ).toLocaleString()}만원, 비율 ${
                  label === "--" ? "-" : `${label}%`
                }`,
        });
        // 클러스터 사용 시 setMap은 클러스터러가 담당
        if (!clustererRef.current) marker.setMap(map);
        try {
          markerToItemRef.current.set(marker, it);
        } catch {}
        const idStr = String(it?.id ?? "").trim();
        if (idStr) {
          markerIndexRef.current.set(idStr, {
            marker,
            pos,
            normalImage: image,
            color,
            label,
          });
        }
        // 동일 좌표 그룹 키 구성
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const grp = coordGroupsRef.current.get(key) || [];
        grp.push(it);
        coordGroupsRef.current.set(key, grp);

        w.kakao.maps.event.addListener(marker, "click", () => {
          try {
            // 마지막 클릭 마커 좌표 저장 (원 중심 이동 기능에서 사용)
            try {
              lastClickedMarkerPosRef.current = { lat, lng };
            } catch {}
            // 중심 이동 및 하이라이트 (크로스 헤어에 마커가 정확히 오도록 오프셋 적용)
            const centerOnMarker = () => {
              const proj = map.getProjection?.();
              if (
                !proj ||
                !proj.containerPointFromCoords ||
                !proj.coordsFromContainerPoint
              ) {
                // 폴백: panTo
                // 잠금 전환 등으로 호출될 때 기존 중심 유지 요청 → 아무 것도 하지 않음
                return;
              }
              const mapRect = (
                mapRef.current as HTMLElement
              )?.getBoundingClientRect?.();
              const markerCP = proj.containerPointFromCoords(pos);
              // 크로스헤어 위치(화면 중심)
              const cx = (mapRect?.width ?? 0) / 2;
              const cy = (mapRect?.height ?? 0) / 2;
              // 좌측 패널/필터가 있을 수 있으므로 현재 오버레이의 좌측 마진 고려 없이 중심으로 보정
              const dx = cx - markerCP.x;
              const dy = cy - markerCP.y;
              if (typeof map.panBy === "function") {
                try {
                  map.panBy(-dx, -dy);
                } catch {}
              }
            };
            // 마커 클릭 시 중앙 정렬 수행 (투영 없는 경우 panTo/setCenter)
            if (
              typeof (map as any).getProjection === "function" &&
              (map as any).getProjection()?.containerPointFromCoords
            ) {
              centerOnMarker();
            } else if (typeof map.panTo === "function") {
              try {
                map.panTo(pos);
              } catch {
                try {
                  map.setCenter(pos);
                } catch {}
              }
            } else {
              try {
                map.setCenter(pos);
              } catch {}
            }
            lastCenterRef.current = { lat, lng };
            if (focusMarkerRef.current) {
              try {
                focusMarkerRef.current.setMap(null);
              } catch {}
              focusMarkerRef.current = null as any;
            }
            if (focusCircleRef.current) {
              try {
                focusCircleRef.current.setMap(null);
              } catch {}
              focusCircleRef.current = null as any;
            }
            // 동일 좌표 그룹 팝업 처리(줌 레벨 1~2일 때만 멀티 팝업)
            const level = map.getLevel?.();
            // 그룹은 아이템 id 기준으로 유일화
            let group = coordGroupsRef.current.get(key) || [it];
            if (Array.isArray(group)) {
              const seen = new Set<string>();
              group = group.filter((g: any) => {
                const id = String(g?.id ?? "");
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
              });
            }
            if (typeof level === "number" && level <= 2 && group.length > 1) {
              openMultiPopup(group, pos, 0);
            } else {
              openPopup(it, pos);
            }
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

    // 지도 상호작용 시 팝업 보임/숨김 제어
    try {
      const w = window as any;
      w.kakao.maps.event.addListener(map, "dragstart", () => {
        // 잠금이 아니면 닫지 않고 유지 (요청: 배경 클릭해도 닫히지 않음)
      });
      w.kakao.maps.event.addListener(map, "zoom_start", () => {
        // 잠금이 아니어도 확대/축소 시 닫지 않음
      });
      w.kakao.maps.event.addListener(map, "click", () => {
        // 배경 클릭으로는 닫지 않음
      });
    } catch {}

    // 초기 가시성: 아이템 위치로 자동 센터/줌 조정 (fitBounds)
    try {
      if (toAdd.length > 0) {
        if (!didInitialFitRef.current) {
          // 상세→지도 이동 타깃이 있으면 fitBounds 대신 해당 좌표로 이동/확대
          const tgt = openTargetRef.current;
          if (tgt) {
            try {
              const latlng = new w.kakao.maps.LatLng(tgt.lat, tgt.lng);
              if (typeof map.setCenter === "function") map.setCenter(latlng);
              if (typeof map.setLevel === "function") map.setLevel(4);
              lastCenterRef.current = { lat: tgt.lat, lng: tgt.lng };
              setCenterCoord({ lat: tgt.lat, lng: tgt.lng });
            } catch {}
            didInitialFitRef.current = true;
            pendingFitRef.current = false;
            openTargetRef.current = null;
          } else if (!pendingFitRef.current || !isLoading) {
            const bounds = new w.kakao.maps.LatLngBounds();
            toAdd.forEach((mk: any) => {
              const pos = mk.getPosition?.();
              if (pos) bounds.extend(pos);
            });
            if (!bounds.isEmpty?.()) {
              // 여백 포함하여 영역 맞춤 (최초 1회만)
              if (typeof map.setBounds === "function") {
                try {
                  (map as any).setBounds(bounds, 40, 40, 40, 40);
                } catch {
                  map.setBounds(bounds);
                }
              }
              // 지역 이동 시 줌 레벨을 8로 통일
              if (typeof map.setLevel === "function") {
                map.setLevel(8);
              }
              // bounds 적용 직후 중앙 좌표/참조를 즉시 동기화하여 기본값으로 남지 않도록 보정
              try {
                setTimeout(() => {
                  try {
                    const cc = map.getCenter?.();
                    if (cc) {
                      const lat = cc.getLat();
                      const lng = cc.getLng();
                      lastCenterRef.current = { lat, lng };
                      setCenterCoord({ lat, lng });
                    }
                  } catch {}
                }, 0);
              } catch {}
            }
            didInitialFitRef.current = true;
            pendingFitRef.current = false;
          }
        } else {
          // 필터 변경으로 아이템이 갱신되더라도 현재 중심을 유지
          try {
            const c = map.getCenter?.();
            if (typeof (map as any).relayout === "function")
              (map as any).relayout();
            if (c && typeof map.setCenter === "function") map.setCenter(c);
          } catch {}
        }
      } else {
        // 아이템 0건 폴백: 레이아웃 재계산만 수행하고 현재 중심/레벨 유지
        const kmap = kakaoMapRef.current;
        if (kmap) {
          try {
            const current = kmap.getCenter?.();
            if (typeof kmap.relayout === "function") kmap.relayout();
            if (current && typeof kmap.setCenter === "function")
              kmap.setCenter(current);
          } catch {}
        }
      }
    } catch {}

    // 뷰포트 변경 시 가시 영역 내 마커만 유지(간단 정책): Kakao 클러스터러가 내부 최적화를 수행하므로, 여기서는 정책 훅만 남김
    // 필요 시 bounds 검사 후 오프스크린 마커 setMap(null) 최적화 추가 가능

    return () => {
      try {
        if (clustererRef.current) clustererRef.current.clear();
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
      } catch {}
    };
  }, [items, isLoading, mapReady, provider, clusterEnabled]);

  // Kakao: 원(반경) 오버레이 적용/갱신
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady || !kakaoMapRef.current) return;
    const w = window as any;
    const map = kakaoMapRef.current;
    try {
      // 비활성화 시 제거
      if (!circleEnabled || !circleControlsEnabled) {
        try {
          if (drawCircleRef.current) drawCircleRef.current.setMap(null);
        } catch {}
        drawCircleRef.current = null;
        try {
          if (drawCircleCenterMarkerRef.current)
            drawCircleCenterMarkerRef.current.setMap(null);
        } catch {}
        drawCircleCenterMarkerRef.current = null;
        return;
      }

      // 🔧 중심 좌표 계산: useRefMarkerFallback에 따라 폴백 방식 변경
      // true (경매): circleCenter → refMarker → 지도중심
      // false (실거래): circleCenter만 사용 (폴백 없음)
      const centerLat =
        useRefMarkerFallback !== false
          ? (circleCenter as any)?.lat ??
            (refMarkerCenter as any)?.lat ??
            centerCoord?.lat
          : (circleCenter as any)?.lat;
      const centerLng =
        useRefMarkerFallback !== false
          ? (circleCenter as any)?.lng ??
            (refMarkerCenter as any)?.lng ??
            centerCoord?.lng
          : (circleCenter as any)?.lng;
      if (
        !Number.isFinite(centerLat as any) ||
        !Number.isFinite(centerLng as any) ||
        (Number(centerLat) === 0 && Number(centerLng) === 0)
      )
        return;
      const radius = Math.max(0, Number(circleRadiusM ?? 0));
      const centerLatLng = new w.kakao.maps.LatLng(centerLat, centerLng);

      // 원 생성/갱신
      if (!drawCircleRef.current) {
        drawCircleRef.current = new w.kakao.maps.Circle({
          center: centerLatLng,
          radius,
          strokeWeight: 3,
          strokeColor: "#2563eb",
          strokeOpacity: 0.9,
          strokeStyle: "solid",
          fillColor: "#2563eb",
          fillOpacity: 0.15,
          zIndex: 5000,
        });
        drawCircleRef.current.setMap(map);
      } else {
        try {
          drawCircleRef.current.setPosition(centerLatLng);
          drawCircleRef.current.setRadius(radius);
        } catch {}
      }

      // 중심 드래그 마커 생성/갱신
      if (!drawCircleCenterMarkerRef.current) {
        drawCircleCenterMarkerRef.current = new w.kakao.maps.Marker({
          position: centerLatLng,
          // 전월세/매매(namespace==='rent'|'sale')에서는 중심 마커 드래그 비활성화
          draggable: !(namespace === "rent" || namespace === "sale"),
          zIndex: 6000,
        });
        drawCircleCenterMarkerRef.current.setMap(map);
        // 드래그 끝난 후 반영
        w.kakao.maps.event.addListener(
          drawCircleCenterMarkerRef.current,
          "dragend",
          () => {
            try {
              const p = drawCircleCenterMarkerRef.current.getPosition?.();
              if (p && typeof onCircleChange === "function") {
                onCircleChange({
                  center: { lat: p.getLat(), lng: p.getLng() },
                  radiusM: radius,
                });
              }
            } catch {}
          }
        );
      } else {
        try {
          drawCircleCenterMarkerRef.current.setPosition(centerLatLng);
          if (
            typeof drawCircleCenterMarkerRef.current.setDraggable === "function"
          )
            drawCircleCenterMarkerRef.current.setDraggable(
              !(namespace === "rent" || namespace === "sale")
            );
        } catch {}
      }
    } catch {}
  }, [
    circleEnabled,
    circleControlsEnabled,
    circleCenter,
    circleRadiusM,
    mapReady,
    provider,
    centerCoord,
    namespace,
  ]);

  // 🆕 전월세/매매/경매 초기화: circleCenter가 있으면 최초 1회 중심/레벨 설정(레벨 7)
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady || !kakaoMapRef.current) return;
    if (
      !(
        namespace === "rent" ||
        namespace === "sale" ||
        namespace === "auction_ed"
      )
    )
      return;
    const center = circleCenter as any;
    if (
      !center ||
      !Number.isFinite(center?.lat) ||
      !Number.isFinite(center?.lng) ||
      (Number(center?.lat) === 0 && Number(center?.lng) === 0)
    )
      return;
    if (didInitialFitRef.current) return;
    try {
      const w = window as any;
      const map = kakaoMapRef.current;
      const latlng = new w.kakao.maps.LatLng(center.lat, center.lng);
      if (typeof map.setCenter === "function") map.setCenter(latlng);
      if (typeof map.setLevel === "function") map.setLevel(7);
      lastCenterRef.current = { lat: center.lat, lng: center.lng };
      setCenterCoord({ lat: center.lat, lng: center.lng });
      didInitialFitRef.current = true;
      pendingFitRef.current = false;
    } catch {}
  }, [mapReady, provider, namespace, circleCenter]);

  // 🆕 전월세/매매/경매: 초기 마커 항상 표시(원 표시 여부와 무관), 드래그 불가 + 호버 툴팁
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady || !kakaoMapRef.current) return;
    if (
      !(
        namespace === "rent" ||
        namespace === "sale" ||
        namespace === "auction_ed"
      )
    )
      return;
    const w = window as any;
    const map = kakaoMapRef.current;
    const center = circleCenter as any;
    const valid =
      center &&
      Number.isFinite(center?.lat) &&
      Number.isFinite(center?.lng) &&
      !(Number(center?.lat) === 0 && Number(center?.lng) === 0);

    // 표시/제거 분기
    if (!valid) {
      try {
        if (initialCenterMarkerRef.current)
          initialCenterMarkerRef.current.setMap(null);
      } catch {}
      initialCenterMarkerRef.current = null;
      return;
    }

    const pos = new w.kakao.maps.LatLng(center.lat, center.lng);
    try {
      if (!initialCenterMarkerRef.current) {
        // 구글 스타일 파란 핀 마커 (화이트 서클 + 하단 삼각형), 40px 표시(레티나 80px 소스)
        const svg =
          `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>` +
          `<defs>` +
          `<linearGradient id='pinGrad' x1='0' y1='0' x2='0' y2='1'>` +
          `<stop offset='0%' stop-color='#4f86f7'/><stop offset='100%' stop-color='#2b6be8'/></linearGradient>` +
          `<filter id='pinShadow' x='-50%' y='-50%' width='200%' height='200%'>` +
          `<feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='rgba(0,0,0,0.25)'/></filter>` +
          `</defs>` +
          `<path d='M40 8c-12.7 0-23 10.3-23 23 0 10.8 8.2 19.6 14.4 26.9 3.8 4.5 6.6 8.7 7.9 11.9a1.5 1.5 0 0 0 2.8 0c1.3-3.2 4.1-7.4 7.9-11.9C54.8 50.6 63 41.8 63 31 63 18.3 52.7 8 40 8z' fill='url(#pinGrad)' filter='url(#pinShadow)' stroke='#1e40af' stroke-width='1'/>` +
          `<circle cx='40' cy='34' r='10' fill='#ffffff' />` +
          `<path d='M40 30 l-5 7 h10 z' fill='#2b6be8' />` +
          `</svg>`;
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
          svg
        )}`;
        const size = new w.kakao.maps.Size(48, 48); // +20%
        const offset = new w.kakao.maps.Point(24, 46);
        const image = new w.kakao.maps.MarkerImage(url, size, { offset });
        initialCenterMarkerRef.current = new w.kakao.maps.Marker({
          position: pos,
          image,
          draggable: false,
          zIndex: 6500,
        });
      } else {
        try {
          initialCenterMarkerRef.current.setPosition(pos);
          if (typeof initialCenterMarkerRef.current.setDraggable === "function")
            initialCenterMarkerRef.current.setDraggable(false);
        } catch {}
      }
      // 원 표시 중에는 중심 핸들 마커가 별도로 존재하므로 초기 마커는 숨김
      if (circleEnabled) {
        initialCenterMarkerRef.current.setMap(null);
      } else {
        initialCenterMarkerRef.current.setMap(map);
        // 호버 툴팁: 분석 대상 물건 위치 (마커 아래쪽에 세련된 스타일)
        try {
          const content = document.createElement("div");
          content.style.padding = "6px 10px";
          content.style.background = "rgba(2,6,23,0.92)"; // slate-950/92
          content.style.color = "#e5e7eb"; // gray-200
          content.style.fontSize = "11px";
          content.style.borderRadius = "8px";
          content.style.boxShadow = "0 8px 24px rgba(0,0,0,.18)";
          content.style.border = "1px solid rgba(255,255,255,0.08)";
          try {
            (content.style as any).backdropFilter = "blur(4px)";
          } catch {}
          content.style.display = "inline-flex";
          content.style.alignItems = "center";
          content.style.gap = "6px";
          content.textContent = "분석 물건";
          const overlay = new w.kakao.maps.CustomOverlay({
            position: pos,
            yAnchor: -0.2, // 마커 아래쪽으로 살짝
            zIndex: 8000,
            content,
          });
          // mouseover/mouseout으로 표시/숨김
          w.kakao.maps.event.addListener(
            initialCenterMarkerRef.current,
            "mouseover",
            () => overlay.setMap(map)
          );
          w.kakao.maps.event.addListener(
            initialCenterMarkerRef.current,
            "mouseout",
            () => overlay.setMap(null)
          );
        } catch {}
      }
    } catch {}
  }, [mapReady, provider, namespace, circleCenter, circleEnabled]);

  // Kakao: 분석물건 마커 표시/드래그 제어
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady || !kakaoMapRef.current) return;
    if (!refMarkerEnabled) {
      try {
        if (refMarkerRef.current) refMarkerRef.current.setMap(null);
      } catch {}
      refMarkerRef.current = null;
      return;
    }
    const w = window as any;
    const map = kakaoMapRef.current;
    try {
      const centerLat = (refMarkerCenter as any)?.lat ?? centerCoord?.lat;
      const centerLng = (refMarkerCenter as any)?.lng ?? centerCoord?.lng;
      if (
        !Number.isFinite(centerLat as any) ||
        !Number.isFinite(centerLng as any)
      )
        return;
      const pos = new w.kakao.maps.LatLng(centerLat, centerLng);
      if (!refMarkerRef.current) {
        refMarkerRef.current = new w.kakao.maps.Marker({
          position: pos,
          draggable: !Boolean(refMarkerLocked),
          zIndex: 7000,
        });
        refMarkerRef.current.setMap(map);
        w.kakao.maps.event.addListener(refMarkerRef.current, "dragend", () => {
          try {
            const p = refMarkerRef.current.getPosition?.();
            if (p && typeof onRefMarkerMove === "function") {
              onRefMarkerMove({ lat: p.getLat(), lng: p.getLng() });
            }
          } catch {}
        });
      } else {
        try {
          refMarkerRef.current.setPosition(pos);
          if (typeof refMarkerRef.current.setDraggable === "function")
            refMarkerRef.current.setDraggable(!Boolean(refMarkerLocked));
        } catch {}
      }
    } catch {}
  }, [
    refMarkerEnabled,
    refMarkerCenter,
    refMarkerLocked,
    mapReady,
    provider,
    centerCoord,
    onRefMarkerMove,
  ]);

  // 선택된 항목 오버레이 표시(좌표 이동 없음)
  useEffect(() => {
    if (provider !== "kakao" || !mapReady) return;
    const map = kakaoMapRef.current;
    if (!map) return;
    const idx = markerIndexRef.current;
    if (!idx || idx.size === 0) return;
    const w = window as any;

    // 0) 과거 이미지 강조가 있었다면 원복
    highlightedIdsRef.current.forEach((id) => {
      const entry = idx.get(id);
      if (entry) {
        try {
          entry.marker.setImage(entry.normalImage);
          if (typeof entry.marker.setZIndex === "function")
            entry.marker.setZIndex(0);
        } catch {}
      }
    });
    highlightedIdsRef.current.clear();

    // 1) 기존 선택 오버레이 제거
    try {
      selectedOverlayMarkersRef.current.forEach((ov) => {
        try {
          ov.setMap(null);
        } catch {}
      });
      selectedOverlayMarkersRef.current.clear();
    } catch {}

    // 2) 선택 오버레이 추가(화살표형). 좌표 이동 없음
    (highlightIds || []).forEach((idRaw) => {
      const id = String(idRaw);
      const entry = idx.get(id);
      if (!entry) return;
      try {
        const color = entry.color || "#2563eb";
        const container = document.createElement("div");
        container.style.position = "relative";
        container.style.width = "0";
        container.style.height = "0";
        container.innerHTML = `
          <div style="position:absolute;left:-10px;top:-40px;width:20px;height:20px;border-radius:6px;background:${color};box-shadow:0 4px 10px rgba(0,0,0,.25);"></div>
          <div style=\"position:absolute;left:-7px;top:-22px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${color};\"></div>
        `;
        const overlay = new w.kakao.maps.CustomOverlay({
          position: entry.pos,
          yAnchor: 1,
          zIndex: 10000,
          content: container,
        });
        overlay.setMap(map);
        selectedOverlayMarkersRef.current.set(id, overlay);
      } catch {}
    });
  }, [highlightIds, mapReady, provider]);

  // vworld: 아이템 0건 시 기본 중심 유지 폴백
  useEffect(() => {
    if (provider === "kakao") return;
    if (!mapReady || !items) return;
    try {
      const ctrl = mapControllerRef.current;
      if (!ctrl || typeof ctrl.setCenter !== "function") return;
      if (items.length === 0) {
        const last = lastCenterRef.current || { lat: 37.5665, lng: 126.978 };
        ctrl.setCenter({ x: last.lng, y: last.lat });
      }
    } catch {}
  }, [items, mapReady, provider]);

  // Kakao: mapReady 후 즉시 relayout 보정(초기 타일 공백 방지)
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady) return;
    try {
      const kmap = kakaoMapRef.current;
      if (kmap && typeof kmap.relayout === "function") {
        setTimeout(() => {
          try {
            const center = kmap.getCenter?.();
            kmap.relayout();
            if (center && typeof kmap.setCenter === "function") {
              kmap.setCenter(center);
            }
          } catch {}
        }, 60);
      }
    } catch {}
  }, [mapReady, provider]);

  // Kakao: 중심/마우스 좌표 업데이트 (쓰로틀 적용)
  useEffect(() => {
    if (provider !== "kakao") return;
    if (!mapReady || !kakaoMapRef.current) return;
    try {
      const w = window as any;
      const map = kakaoMapRef.current;
      // 페이지 상위에서 설정한 펜딩 타깃이 있으면 즉시 이동/줌 적용
      try {
        const pending = (useFilterStore as any)?.getState?.()?.pendingMapTarget;
        if (
          pending &&
          typeof pending.lat === "number" &&
          typeof pending.lng === "number"
        ) {
          const latlng = new w.kakao.maps.LatLng(pending.lat, pending.lng);
          map.setCenter(latlng);
          if (typeof map.setLevel === "function") map.setLevel(4);
          if (
            typeof (useFilterStore as any)?.getState?.()
              ?.setPendingMapTarget === "function"
          ) {
            (useFilterStore as any).getState().setPendingMapTarget(null);
          }
          lastCenterRef.current = { lat: pending.lat, lng: pending.lng };
          setCenterCoord({ lat: pending.lat, lng: pending.lng });
        }
      } catch {}
      // 초기 중심 세팅
      try {
        const c = map.getCenter?.();
        if (c) setCenterCoord({ lat: c.getLat(), lng: c.getLng() });
        const lv = map.getLevel?.();
        if (typeof lv === "number") setZoomLevel(lv);
      } catch {}

      const onIdle = () => {
        try {
          const c = map.getCenter?.();
          if (c) setCenterCoord({ lat: c.getLat(), lng: c.getLng() });
          const lv = map.getLevel?.();
          if (typeof lv === "number") setZoomLevel(lv);
          // 바운즈 계산 후 상위 전달(bbox)
          if (typeof map.getBounds === "function" && onBoundsChange) {
            try {
              // 최소 줌 가드: 너무 멀리서 페치하지 않음
              const level = map.getLevel?.();
              if (typeof level === "number" && level >= MAP_GUARD.minFetchLevel)
                return;
              const b = map.getBounds();
              const sw = b?.getSouthWest?.();
              const ne = b?.getNorthEast?.();
              if (sw && ne) {
                const payload = {
                  south: sw.getLat(),
                  west: sw.getLng(),
                  north: ne.getLat(),
                  east: ne.getLng(),
                } as const;
                const sig = `${payload.south.toFixed(4)},${payload.west.toFixed(
                  4
                )}-${payload.north.toFixed(4)},${payload.east.toFixed(
                  4
                )}-l${level}`;
                if (!emitBoundsDebouncedRef.current) {
                  // 환경변수 기반 디바운스
                  let t: any;
                  emitBoundsDebouncedRef.current = (bb) => {
                    clearTimeout(t);
                    t = setTimeout(() => {
                      // 면적 상한(㎢) 가드: 과도한 영역은 이벤트 자체를 억제
                      try {
                        const latMid = (bb.south + bb.north) / 2;
                        const toRad = (d: number) => (d * Math.PI) / 180;
                        const heightKm = Math.abs(bb.north - bb.south) * 111.0;
                        const widthKm =
                          Math.abs(bb.east - bb.west) *
                          111.0 *
                          Math.cos(toRad(latMid));
                        const areaKm2 = Math.abs(widthKm * heightKm);
                        if (
                          Number.isFinite(areaKm2) &&
                          areaKm2 > MAP_GUARD.maxFetchAreaKm2
                        )
                          return;
                      } catch {}
                      const s = `${bb.south.toFixed(4)},${bb.west.toFixed(
                        4
                      )}-${bb.north.toFixed(4)},${bb.east.toFixed(
                        4
                      )}-l${level}`;
                      if (lastSentBoundsRef.current === s) return;
                      lastSentBoundsRef.current = s;
                      onBoundsChange(bb);
                    }, MAP_GUARD.boundsDebounceMs);
                  };
                }
                emitBoundsDebouncedRef.current(payload);
              }
            } catch {}
          }
        } catch {}
      };

      let last = 0;
      const onMouseMove = (mouseEvent: any) => {
        const now = Date.now();
        if (now - last < 16) return; // ~60fps
        last = now;
        try {
          const latlng = mouseEvent?.latLng;
          if (latlng)
            setMouseCoord({ lat: latlng.getLat(), lng: latlng.getLng() });
        } catch {}
      };

      w.kakao.maps.event.addListener(map, "idle", onIdle);
      w.kakao.maps.event.addListener(map, "mousemove", onMouseMove);

      return () => {
        try {
          w.kakao.maps.event.removeListener(map, "idle", onIdle);
          w.kakao.maps.event.removeListener(map, "mousemove", onMouseMove);
        } catch {}
      };
    } catch {}
  }, [mapReady, provider]);

  // 외부에서 설정한 pendingMapTarget으로 지도 중심 이동 (즉시 반응)
  const pendingMapTarget = (useFilterStore as any)?.(
    (s: any) => s.pendingMapTarget
  );
  const clearPendingMapTarget = (useFilterStore as any)?.(
    (s: any) => s.setPendingMapTarget
  );
  useEffect(() => {
    if (!mapReady || provider !== "kakao") return;
    if (!pendingMapTarget) return;
    try {
      const map = kakaoMapRef.current as any;
      if (!map) return;
      const w = window as any;
      const latlng = new w.kakao.maps.LatLng(
        pendingMapTarget.lat,
        pendingMapTarget.lng
      );
      map.setCenter(latlng);
      if (typeof map.setLevel === "function") map.setLevel(4);
      lastCenterRef.current = {
        lat: pendingMapTarget.lat,
        lng: pendingMapTarget.lng,
      };
      setCenterCoord({ lat: pendingMapTarget.lat, lng: pendingMapTarget.lng });
      if (typeof clearPendingMapTarget === "function") {
        clearPendingMapTarget(null);
      }
    } catch {}
  }, [pendingMapTarget, mapReady, provider]);

  // mapReady 시 마지막 중심 좌표로 초기 표시 (provider 무관)
  useEffect(() => {
    if (!mapReady) return;
    const last = lastCenterRef.current;
    if (last) setCenterCoord({ lat: last.lat, lng: last.lng });
  }, [mapReady]);

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

  // 로딩/에러 시에도 지도 컨테이너는 유지하고, 오버레이로만 상태 표시
  // 아이템이 없어도 기본 지도는 렌더링되도록 유지
  const handleItemClick = (item: any) => onItemSelect?.(item);

  const formatMoneyText = (n?: number | string | null) => {
    const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
    if (!isFinite(v as number)) return "-";
    return `${Number(v).toLocaleString()}만원`;
  };

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
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <svg width="22" height="22" viewBox="0 0 22 22">
          <line
            x1="11"
            y1="0"
            x2="11"
            y2="22"
            stroke="#111827"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="11"
            x2="22"
            y2="11"
            stroke="#111827"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
          <circle cx="11" cy="11" r="2" fill="#2563eb" fillOpacity="0.9" />
        </svg>
      </div>
      {/* 범례(레전드): 지도 우상단 고정 */}
      {(() => {
        const hasLegendProps = Boolean(
          legendItems ||
            legendTitle ||
            legendUnitLabel ||
            legendHint ||
            legendEditable !== undefined ||
            legendPaletteOverride ||
            legendThresholds ||
            namespace
        );
        const unify =
          (process.env.NEXT_PUBLIC_LEGEND_UNIFY ?? "0") === "1" ||
          hasLegendProps;
        return (
          <MapLegend
            thresholds={
              unify &&
              Array.isArray(legendThresholds) &&
              legendThresholds.length > 0
                ? (legendThresholds as number[])
                : DEFAULT_THRESHOLDS
            }
            items={unify ? legendItems : undefined}
            namespace={unify ? namespace : undefined}
            title={unify ? legendTitle : undefined}
            unitLabel={unify ? legendUnitLabel : undefined}
            hint={unify ? legendHint : undefined}
            editable={unify ? legendEditable : undefined}
            paletteOverride={unify ? legendPaletteOverride : undefined}
          />
        );
      })()}

      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          지도 초기화 중...
        </div>
      )}
      {/* 전체화면 토글 + 지도타입 토글 + 클러스터 토글(옵션) (좌상단) */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        <button
          className="rounded bg-white/90 px-2 py-1 text-xs text-gray-800 shadow border"
          onClick={() => setIsFullscreen((v) => !v)}
        >
          {isFullscreen ? "닫기" : "전체화면"}
        </button>
        {provider === "kakao" && (
          <div className="rounded bg-white/90 px-2 py-1 text-xs text-gray-800 shadow border flex items-center gap-2">
            <span className="text-[11px] text-gray-600">지도</span>
            <button
              className={
                "rounded px-2 py-0.5 border " +
                (kakaoMapType === "ROADMAP"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300")
              }
              onClick={() => setKakaoMapType("ROADMAP")}
            >
              일반
            </button>
            <button
              className={
                "rounded px-2 py-0.5 border " +
                (kakaoMapType === "SKYVIEW"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300")
              }
              onClick={() => setKakaoMapType("SKYVIEW")}
            >
              위성
            </button>
            <button
              className={
                "rounded px-2 py-0.5 border " +
                (kakaoMapType === "HYBRID"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300")
              }
              onClick={() => setKakaoMapType("HYBRID")}
            >
              하이브리드
            </button>
          </div>
        )}
        {provider === "kakao" && clusterToggleEnabled && (
          <div className="rounded bg-white/90 px-2 py-1 text-xs text-gray-800 shadow border flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={clusterEnabled}
                onChange={(e) => setClusterEnabled(Boolean(e.target.checked))}
              />
              <span className="text-[11px] text-gray-600">클러스터</span>
            </label>
          </div>
        )}
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
      {/* 우하단 안내: 지도 표시/총/좌표없음 */}
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700 shadow">
        표시{" "}
        {Math.min(
          items.filter(
            (it: any) =>
              (it?.lat ?? it?.latitude) != null &&
              (it?.lng ?? it?.longitude) != null
          ).length,
          MAP_GUARD.maxMarkers
        )}{" "}
        / 총 {items.length}
        {items.length > 0 && (
          <span className="ml-2 text-gray-500">
            좌표없음{" "}
            {Math.max(
              0,
              items.length -
                items.filter(
                  (it: any) =>
                    (it?.lat ?? it?.latitude) != null &&
                    (it?.lng ?? it?.longitude) != null
                ).length
            )}
            개
          </span>
        )}
      </div>
      {/* 우하단: 중심/마우스 좌표 표시 + 줌 버튼 */}
      <div className="absolute right-2 bottom-[21px] z-10">
        <div className="rounded-lg border border-gray-200/80 bg-white/95 px-3 py-2 text-xs text-gray-800 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-700">
              좌표
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">중앙</span>
            <span className="font-mono">
              {centerCoord
                ? `${centerCoord.lat.toFixed(6)}, ${centerCoord.lng.toFixed(
                    6
                  )}  z=${
                    zoomLevel != null ? String(zoomLevel).padStart(2, "0") : "-"
                  }`
                : "-"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] text-gray-500">마우스</span>
            <span className="font-mono">
              {mouseCoord
                ? `${mouseCoord.lat.toFixed(6)}, ${mouseCoord.lng.toFixed(6)}`
                : "-"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            <button
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] shadow-sm hover:bg-gray-50"
              onClick={() => changeZoomLevel(-1)}
              title="Zoom In"
            >
              +
            </button>
            <button
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] shadow-sm hover:bg-gray-50"
              onClick={() => changeZoomLevel(1)}
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>
      </div>
      {/* 좌하단: 원/반경 컨트롤 + 물건 고정/이동 */}
      <MapCircleControls
        enabled={Boolean(circleControlsEnabled)}
        circleEnabled={Boolean(circleEnabled)}
        radiusM={(function () {
          const v = Number(circleRadiusM ?? 0);
          return Number.isFinite(v) && v > 0 ? v : 1000;
        })()}
        onToggleCircle={onCircleToggle}
        onChangeRadius={(r) =>
          onCircleChange?.({
            center:
              circleCenter ?? (refMarkerCenter as any) ?? centerCoord ?? null,
            radiusM: r,
          })
        }
        // 분석물건 마커 관련
        refLocked={Boolean(refMarkerLocked)}
        onToggleRefLock={onRefMarkerToggleLock}
        onMoveToRefMarker={() => {
          // 🔧 useRefMarkerFallback에 따라 이동 대상 변경
          const target =
            useRefMarkerFallback !== false
              ? refMarkerCenter || centerCoord // 경매: 분석물건 또는 지도 중심
              : circleCenter; // 실거래: 원 중심만
          if (!target) return;
          try {
            const w = window as any;
            const map = kakaoMapRef.current;
            if (!map) return;
            const latlng = new w.kakao.maps.LatLng(target.lat, target.lng);
            if (typeof map.panTo === "function") map.panTo(latlng);
          } catch {}
          if (typeof onMoveToRefMarker === "function") onMoveToRefMarker();
        }}
        // 🆕 버튼 텍스트 커스터마이징
        moveToButtonText={
          useRefMarkerFallback !== false
            ? "물건 위치로 이동"
            : "원 중앙 위치로 이동"
        }
      />
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

      {/* 모바일: 하단 시트 팝업 */}
      {isMobile && (
        <Sheet
          open={!!mobilePopupItem}
          onOpenChange={(open) => {
            if (!open) setMobilePopupItem(null);
          }}
        >
          <SheetContent side="bottom" className="p-0 max-h-[75vh]">
            <SheetHeader className="p-4">
              <SheetTitle>
                {mobilePopupItem?.usage ?? ""} ·{" "}
                {mobilePopupItem?.case_number ?? ""}
              </SheetTitle>
              <SheetDescription>
                {mobilePopupItem?.road_address ?? ""}
              </SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-gray-500">감정가</dt>
                <dd className="text-right">
                  {formatMoneyText(mobilePopupItem?.appraised_value)}
                </dd>
                <dt className="text-gray-500">최저가</dt>
                <dd className="text-right">
                  {formatMoneyText(mobilePopupItem?.minimum_bid_price)}
                </dd>
                <dt className="text-gray-500">최저가/감정가</dt>
                <dd className="text-right">
                  {mobilePopupItem?.bid_to_appraised_ratio != null
                    ? `${mobilePopupItem?.bid_to_appraised_ratio}%`
                    : "-"}
                </dd>
                <dt className="text-gray-500">현재상태</dt>
                <dd className="text-right">
                  {mobilePopupItem?.current_status ?? ""}
                </dd>
                <dt className="text-gray-500">매각기일</dt>
                <dd className="text-right">
                  {mobilePopupItem?.sale_date ?? "-"}
                </dd>
                <dt className="text-gray-500">공시가격</dt>
                <dd className="text-right">
                  {formatMoneyText(mobilePopupItem?.public_price)}
                </dd>
                <dt className="text-gray-500">최저가/공시가격</dt>
                <dd className="text-right">
                  {(() => {
                    const minV =
                      parseFloat(mobilePopupItem?.minimum_bid_price ?? "") || 0;
                    const pubV =
                      parseFloat(mobilePopupItem?.public_price ?? "") || 0;
                    if (!pubV) return "-";
                    const r = (minV / pubV) * 100;
                    return isFinite(r) ? `${r.toFixed(1)}%` : "-";
                  })()}
                </dd>
                <dt className="text-gray-500">건물평형</dt>
                <dd className="text-right">
                  {mobilePopupItem?.building_area_pyeong != null &&
                  mobilePopupItem?.building_area_pyeong !== ""
                    ? `${Math.floor(
                        parseFloat(mobilePopupItem.building_area_pyeong)
                      )}평`
                    : ""}
                </dd>
                <dt className="text-gray-500">층확인</dt>
                <dd className="text-right">
                  {mobilePopupItem?.floor_confirmation ?? ""}
                </dd>
                <dt className="text-gray-500">Elevator</dt>
                <dd className="text-right">
                  {(() => {
                    const v = mobilePopupItem?.elevator_available;
                    if (v === undefined || v === null) return "";
                    const s = String(v).toUpperCase();
                    if (s === "Y" || s === "O" || s === "TRUE" || s === "1")
                      return "Y";
                    if (s === "N" || s === "X" || s === "FALSE" || s === "0")
                      return "N";
                    return String(v);
                  })()}
                </dd>
                <dt className="text-gray-500">건축연도</dt>
                <dd className="text-right">
                  {mobilePopupItem?.construction_year
                    ? `${Math.floor(
                        parseFloat(mobilePopupItem.construction_year)
                      )}년`
                    : ""}
                </dd>
                <dt className="text-gray-500">특수조건</dt>
                <dd className="text-right">
                  {(() => {
                    const text = String(
                      mobilePopupItem?.special_rights || ""
                    ).trim();
                    if (text) return text;
                    const yes = (v: any) => {
                      if (typeof v === "boolean") return v;
                      const s = String(v).toUpperCase();
                      return (
                        s === "Y" || s === "O" || s === "TRUE" || s === "1"
                      );
                    };
                    const labels: Record<string, string> = {
                      tenant_with_opposing_power: "대항력있는임차인",
                      hug_acquisition_condition_change: "HUG인수조건변경",
                      senior_lease_right: "선순위임차권",
                      resale: "재매각",
                      partial_sale: "지분매각",
                      joint_collateral: "공동담보",
                      separate_registration: "별도등기",
                      lien: "유치권",
                      illegal_building: "위반건축물",
                      lease_right_sale: "전세권매각",
                      land_right_unregistered: "대지권미등기",
                    };
                    const keys = Object.keys(labels);
                    const arr = keys
                      .filter((k) => yes((mobilePopupItem as any)[k]))
                      .map((k) => labels[k]);
                    return arr.length ? arr.join(", ") : "";
                  })()}
                </dd>
              </dl>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  className="px-3 py-2 text-sm rounded border border-gray-200"
                  onClick={() => setMobilePopupItem(null)}
                >
                  닫기
                </button>
                <button
                  className="px-3 py-2 text-sm rounded border border-blue-700 bg-blue-600 text-white"
                  onClick={() => {
                    const evt = new CustomEvent("property:navigateDetail", {
                      detail: { id: String(mobilePopupItem?.id ?? "") },
                    });
                    window.dispatchEvent(evt);
                  }}
                >
                  상세보기
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default MapView;
