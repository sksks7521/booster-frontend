"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { loadKakaoSdk } from "@/lib/map/kakaoLoader";
import MapLegend from "./MapLegend";
import { DEFAULT_THRESHOLDS } from "@/lib/map/config";
import { useFilterStore } from "@/store/filterStore";
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
  // 지역/읍면동 키: 변경 시 내부 초기화/relayout 트리거
  locationKey?: string;
}

function MapView({
  onItemSelect,
  items = [],
  isLoading,
  error,
  onRetry,
  locationKey,
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
  // Kakao 지도 타입(일반/위성) 토글 상태
  const [kakaoMapType, setKakaoMapType] = useState<"ROADMAP" | "SKYVIEW">(
    "ROADMAP"
  );

  // 지도 제공자: 안정화를 위해 Kakao를 강제 사용
  const providerEnv = "kakao";
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
  const vworldKeyEnv = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
  // 사용자가 제공한 기본 키를 폴백으로 사용 (환경변수 미설정 시 즉시 표시)
  const vworldKey =
    vworldKeyEnv && vworldKeyEnv.trim().length > 0
      ? vworldKeyEnv
      : "276AABBA-2990-3BAE-B46A-82A7FE6BE021";
  const provider: "kakao" | "vworld" = kakaoKey ? "kakao" : "vworld";

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
      const typeId =
        kakaoMapType === "SKYVIEW"
          ? w.kakao.maps.MapTypeId.SKYVIEW
          : w.kakao.maps.MapTypeId.ROADMAP;
      if (typeof map.setMapTypeId === "function") map.setMapTypeId(typeId);
    } catch {}
  }, [kakaoMapType, mapReady, provider]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (provider === "kakao") {
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
                      level: 8,
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
                level: 8,
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
          kakaoMapRef.current.setCenter(latlng);
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

    // Threshold (만원) - 전역 상태 사용 (동적 길이 1..5)
    const thresholds: number[] = Array.isArray(thresholdsState)
      ? (thresholdsState as number[])
      : ([6000, 8000, 10000, 13000] as number[]);

    // 최저가(만원) → 색상 매핑 (현대적 팔레트)
    const palette = (useFilterStore as any)?.getState?.()?.palette ?? {
      blue: "#2563eb",
      green: "#16a34a",
      pink: "#ec4899",
      orange: "#f59e0b",
      red: "#ef4444",
      grey: "#64748b",
    };
    const getColorByPrice = (price?: number | string | null) => {
      const v = typeof price === "string" ? parseFloat(price) : price ?? 0;
      if (!v || isNaN(v)) return palette.grey; // grey
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

    const buildPopupHTML = (it: any) => {
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
            const evt = new CustomEvent("property:navigateDetail", {
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
              // 지도 컨테이너(mapRef)를 기준으로 화면 우하단 근처 표시
              const rect = (
                mapRef.current as HTMLElement
              )?.getBoundingClientRect?.();
              if (rect) {
                toast.style.left = `${Math.max(
                  rect.left + rect.width - 240,
                  12
                )}px`;
                toast.style.top = `${Math.max(
                  rect.top + rect.height - 56,
                  12
                )}px`;
              } else {
                toast.style.right = "12px";
                toast.style.bottom = "12px";
              }
              toast.style.padding = "8px 12px";
              toast.style.borderRadius = "8px";
              toast.style.fontSize = "12px";
              toast.style.background = "rgba(17,24,39,.9)";
              toast.style.color = "#fff";
              toast.style.boxShadow = "0 4px 10px rgba(0,0,0,.2)";
              toast.style.opacity = "0";
              toast.style.transition = "opacity .2s";
              document.body.appendChild(toast);
              requestAnimationFrame(() => (toast.style.opacity = "1"));
              setTimeout(() => (toast.style.opacity = "0"), 2800);
              setTimeout(() => toast.remove(), 3100);
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
      clustererRef.current = new w.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 9, // 기본안: level ≥ 9 병합
        gridSize: 60,
        disableClickZoom: false,
      });
    } catch {}

    // 줌 정책 적용: level 기준 병합/부분/개별
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
      w.kakao.maps.event.addListener(
        map,
        "zoom_changed",
        debounce(applyClusterPolicy, 200)
      );
    } catch {}

    // 최대 N개만 표시(성능 보호)
    const MAX = 1500;
    const slice = items.slice(0, MAX);
    const toAdd: any[] = [];
    slice.forEach((it: any) => {
      const latRaw = it?.lat ?? it?.latitude;
      const lngRaw = it?.lng ?? it?.longitude;
      const lat = typeof latRaw === "number" ? latRaw : parseFloat(latRaw);
      const lng = typeof lngRaw === "number" ? lngRaw : parseFloat(lngRaw);
      if (!isFinite(lat) || !isFinite(lng)) return;
      try {
        const pos = new w.kakao.maps.LatLng(lat, lng);
        // 색상: 최저가(만원), 텍스트: 비율 10% 버킷
        const price = it?.minimum_bid_price ?? it?.min_bid_price ?? 0;
        const ratioRaw = it?.bid_to_appraised_ratio ?? it?.percentage ?? null;
        const color = getColorByPrice(price);
        const label = getBucketText(ratioRaw);
        const image = getModernBadgeImage(color, label);

        const marker = new w.kakao.maps.Marker({
          position: pos,
          image,
          title: `최저가 ${Number(
            parseFloat(price || 0) || 0
          ).toLocaleString()}만원, 비율 ${label === "--" ? "-" : `${label}%`}`,
        });
        // 클러스터 사용 시 setMap은 클러스터러가 담당
        if (!clustererRef.current) marker.setMap(map);
        w.kakao.maps.event.addListener(marker, "click", () => {
          try {
            const evt = new CustomEvent("property:openDetail", {
              detail: { id: String(it?.id ?? ""), lat, lng },
            });
            window.dispatchEvent(evt);
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
            // 팝업 열기
            openPopup(it, pos);
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
          // 지역 전환 직후에는 새로운 데이터 로드 완료 시점에만 1회 fit
          if (!pendingFitRef.current || !isLoading) {
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
  }, [items, isLoading, mapReady, provider]);

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
    : "relative w-full h-[1000px]";

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
      <MapLegend thresholds={DEFAULT_THRESHOLDS} />

      {!mapReady && (
        <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-600 shadow">
          지도 초기화 중...
        </div>
      )}
      {/* 전체화면 토글 + 지도타입 토글 (좌상단) */}
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
      {/* 임시: 우상단에 아이템 개수/선택 안내 */}
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-gray-700 shadow">
        항목 {items.length}개
      </div>
      {/* 좌측하단: 중심/마우스 좌표 표시 (provider 무관 표시, 스타일 개선) */}
      <div className="absolute left-2 bottom-[21px] z-10">
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
        </div>
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
