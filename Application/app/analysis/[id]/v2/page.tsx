"use client";
import MapView from "@/components/features/map-view";
import { AuctionEdMap } from "@/components/features/auction-ed";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ArrowLeft, Layers, List, Map, BarChart3 } from "lucide-react";
import { useItemDetail } from "@/hooks/useItemDetail";
import { LoadingState, ErrorState } from "@/components/ui/data-state";
import { mapApiErrorToMessage } from "@/lib/errors";
import { usePropertyDetail } from "@/components/features/property-detail/hooks/usePropertyDetail";
import PropertyDetailSimple from "@/components/features/property-detail/PropertyDetailSimple";
import AuctionEdList from "@/components/features/detail-v2/auction-ed-list";
import SelectedFilterBar from "@/components/features/selected-filter-bar";
import FilterControl from "@/components/features/filter-control";
import {
  AuctionEdSearchResults,
  AuctionEdFilter,
} from "@/components/features/auction-ed";
import { SaleSearchResults, SaleFilter } from "@/components/features/sale";
import { RentSearchResults, RentFilter } from "@/components/features/rent";
import { useDataset } from "@/hooks/useDataset";
import { datasetConfigs } from "@/datasets/registry";
import { useFilterStore } from "@/store/filterStore";
import ItemTable from "@/components/features/item-table";
import { ViewState } from "@/components/ui/view-state";
import { useSortableColumns } from "@/hooks/useSortableColumns";
import dynamic from "next/dynamic";
import { useFeatureFlags } from "@/lib/featureFlags";
import { formatArea, m2ToPyeong } from "@/lib/units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import regions from "@/regions.json";
import {
  useRealTransactionsSido,
  useRealTransactionsSigungu,
  useRealTransactionsAdminDong,
} from "@/hooks/useLocations";
import { Label } from "@/components/ui/label";

export default function PropertyDetailV2Page() {
  const params = useParams();
  const router = useRouter();
  const itemId = (params as any)?.id as string;

  const { property, isLoading, isRefreshing, error, refetch } =
    useItemDetail(itemId);

  // 상세 섹션 훅은 조건부 반환보다 위에서 항상 호출되도록 배치
  const numericId = Number(itemId);
  const {
    vm,
    isLoading: isDetailLoading,
    isError: isDetailError,
    reload: reloadDetail,
  } = usePropertyDetail(Number.isFinite(numericId) ? numericId : undefined);

  const searchParams = useSearchParams();
  const nsState = useFilterStore((s: any) => (s as any).ns) as any;
  const setNsFilter = useFilterStore((s: any) => (s as any).setNsFilter) as
    | (undefined | ((ns: string, key: any, value: any) => void))
    | any;
  const initialDs = useMemo(() => {
    const ds = searchParams?.get("ds");
    const normalized = ds === "naver" ? "listings" : ds;
    return normalized &&
      ["auction_ed", "sale", "rent", "listings"].includes(normalized)
      ? (normalized as any)
      : "auction_ed";
  }, [searchParams]);
  const [activeDataset, setActiveDataset] = useState(initialDs);
  // 실거래가 지역 API 사용 대상: sale | rent
  const useRealTxApi = activeDataset === "sale" || activeDataset === "rent";
  type ViewType = "list" | "map" | "integrated";
  const initialView = useMemo(() => {
    const v = searchParams?.get("view");
    return v && ["list", "map", "integrated"].includes(v)
      ? (v as ViewType)
      : ("list" as ViewType);
  }, [searchParams]);
  const [viewByDataset, setViewByDataset] = useState<Record<string, ViewType>>(
    () => ({
      auction_ed: initialDs === "auction_ed" ? initialView : "list",
      sale: initialDs === "sale" ? initialView : "list",
      rent: initialDs === "rent" ? initialView : "list",
      listings: initialDs === "listings" ? initialView : "list",
    })
  );
  const activeView =
    (viewByDataset[activeDataset] as ViewType) ?? ("list" as ViewType);
  // 탭 전환 간 스크롤 위치 보존
  const scrollByDatasetViewRef = useRef<Record<string, number>>({});
  const getScrollKey = (ds: string, v: ViewType) => `${ds}:${v}`;
  const saveScrollPosition = () => {
    try {
      scrollByDatasetViewRef.current[getScrollKey(activeDataset, activeView)] =
        typeof window !== "undefined" ? window.scrollY : 0;
    } catch {}
  };
  const restoreScrollPosition = () => {
    try {
      const y =
        scrollByDatasetViewRef.current[getScrollKey(activeDataset, activeView)];
      if (typeof y === "number") {
        setTimeout(() => {
          try {
            window.scrollTo({ top: y, left: 0, behavior: "auto" });
          } catch {}
        }, 0);
      }
    } catch {}
  };
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 🆕 서버 영역필터 전환 조건 계산(auction_ed 전용)
  const flags = useFeatureFlags();
  const nsAuction = (nsState as any)?.auction_ed;
  const applyCircle = Boolean(nsAuction?.applyCircleFilter);
  const centerCandidate = nsAuction?.circleCenter || nsAuction?.refMarkerCenter;
  const centerValid =
    centerCandidate &&
    Number.isFinite(centerCandidate.lat) &&
    Number.isFinite(centerCandidate.lng) &&
    !(Number(centerCandidate.lat) === 0 && Number(centerCandidate.lng) === 0);
  // URL 기반 선결정: within=1 + lat/lng(+radius) 존재 시 초기 렌더부터 서버 영역 모드
  const withinParam = searchParams?.get("within") === "1";
  const urlLat = Number(searchParams?.get("lat"));
  const urlLng = Number(searchParams?.get("lng"));
  const urlRadiusKm = Number(
    (searchParams?.get("radium_km") as any) ||
      (searchParams?.get("radius_km") as any)
  );
  const urlCenterValid =
    Number.isFinite(urlLat) &&
    Number.isFinite(urlLng) &&
    !(Number(urlLat) === 0 && Number(urlLng) === 0);
  const initialUseServerAreaFromURL = Boolean(
    withinParam &&
      urlCenterValid &&
      (Number.isFinite(urlRadiusKm) ? urlRadiusKm > 0 : true)
  );
  const useServerArea = Boolean(
    flags?.auctionEdServerAreaEnabled &&
      (initialUseServerAreaFromURL || (applyCircle && centerValid))
  );

  // 지역 선택을 위한 상태 및 로직
  // regions.json 기반 하드코딩 + 실거래가 전용 API 혼합 사용
  const provinces: string[] = (regions as any)["시도"] ?? [];
  const districtsByProvince: Record<string, string[]> =
    ((regions as any)["시군구"] as Record<string, string[]>) ?? {};
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const bootRef = useRef(true);
  const pendingCityRef = useRef<string | null>(null);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const province = useFilterStore((s: any) => s.province);
  const cityDistrict = useFilterStore((s: any) => s.cityDistrict);
  const town = useFilterStore((s: any) => s.town);
  const setFilter = useFilterStore((s: any) => s.setFilter);

  // 실거래가 전용 지역 목록 API
  const { sidos } = useRealTransactionsSido();
  const { sigungus } = useRealTransactionsSigungu(
    useRealTxApi ? selectedProvince : undefined
  );
  const { adminDongs } = useRealTransactionsAdminDong(
    useRealTxApi ? selectedProvince : undefined,
    useRealTxApi ? selectedCity : undefined
  );

  // 지역 선택 로직 - 시도 변경 시
  useEffect(() => {
    if (useRealTxApi) {
      // 실거래가 API 기반: 시군구 전체명 그대로 표시 (예: "경기도 고양시 덕양구")
      const names = sigungus.map((s) => s.name);
      if (
        names.length > 0 &&
        (availableCities.length !== names.length ||
          names.some((v, i) => v !== availableCities[i]))
      ) {
        setAvailableCities(names);
      }
      if (selectedCity && !names.includes(selectedCity)) {
        setSelectedCity("");
        setSelectedDistrict("");
        if (availableDistricts.length > 0) setAvailableDistricts([]);
      }
      return;
    }

    // 시군구 원본 목록을 '시' 단위로 접어서(예: "경기도 고양시 덕양구" → "경기도 고양시") 중복 제거
    const collapseCity = (full: string): string => {
      const idx = full.indexOf("시 ");
      if (idx >= 0) {
        const cut = full.slice(0, idx + 1); // "…시"
        return cut.trim();
      }
      return full;
    };

    const prevCitiesRef = (PropertyDetailV2Page as any)._prevCitiesRef || {
      current: [] as string[],
    };
    (PropertyDetailV2Page as any)._prevCitiesRef = prevCitiesRef;

    if (!selectedProvince) {
      if (availableCities.length > 0) setAvailableCities([]);
      if (selectedCity) setSelectedCity("");
      if (selectedDistrict) setSelectedDistrict("");
      if (availableDistricts.length > 0) setAvailableDistricts([]);
      return;
    }

    const raw = districtsByProvince[selectedProvince] || [];
    const collapsed = Array.from(new Set(raw.map((v) => collapseCity(v))));
    const changed =
      collapsed.length !== prevCitiesRef.current.length ||
      collapsed.some((v, i) => v !== prevCitiesRef.current[i]);
    if (changed) {
      setAvailableCities(collapsed);
      prevCitiesRef.current = collapsed;
    }
    if (selectedCity && !collapsed.includes(selectedCity)) {
      setSelectedCity("");
      setSelectedDistrict("");
      if (availableDistricts.length > 0) setAvailableDistricts([]);
    }
  }, [
    selectedProvince,
    selectedCity,
    useRealTxApi,
    sigungus,
    availableCities,
    availableDistricts,
  ]);

  // 지역 선택 로직 - 시군구 변경 시
  useEffect(() => {
    if (useRealTxApi) {
      const names = adminDongs.map((d) => d.name);
      if (
        names.length > 0 &&
        (availableDistricts.length !== names.length ||
          names.some((v, i) => v !== availableDistricts[i]))
      ) {
        setAvailableDistricts(names);
      }
      if (selectedDistrict && !names.includes(selectedDistrict)) {
        setSelectedDistrict("");
      }
      return;
    }

    if (!selectedCity) {
      if (availableDistricts.length > 0) setAvailableDistricts([]);
      if (selectedDistrict) setSelectedDistrict("");
      return;
    }

    // regions.json은 시군구까지 제공하므로 읍면동은 사용하지 않음(빈 리스트 유지)
    if (availableDistricts.length > 0) setAvailableDistricts([]);
    if (selectedDistrict) setSelectedDistrict("");
  }, [
    selectedCity,
    selectedDistrict,
    useRealTxApi,
    adminDongs,
    availableDistricts,
  ]);

  // 실제 필터 적용 - 값이 바뀔 때만 적용 (모든 데이터셋)
  useEffect(() => {
    if (selectedProvince && province !== selectedProvince) {
      setFilter("province", selectedProvince);
    }
  }, [selectedProvince, province, setFilter]);

  useEffect(() => {
    if (selectedCity && cityDistrict !== selectedCity) {
      setFilter("cityDistrict", selectedCity);
    }
  }, [selectedCity, cityDistrict, setFilter]);

  useEffect(() => {
    if (selectedDistrict && town !== selectedDistrict) {
      setFilter("town", selectedDistrict);
    }
  }, [selectedDistrict, town, setFilter]);

  // URL → 드롭다운 초기 동기화 (마운트 시 1회: province는 즉시, city/town은 옵션 로딩 후 적용)
  useEffect(() => {
    try {
      const p = searchParams?.get("province") || "";
      const c = searchParams?.get("cityDistrict") || "";
      if (p) setSelectedProvince(p);
      if (c) pendingCityRef.current = c;
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const cityList = useRealTxApi
        ? sigungus.map((s) => s.name)
        : availableCities;

      if (pendingCityRef.current && cityList.includes(pendingCityRef.current)) {
        setSelectedCity(pendingCityRef.current);
        pendingCityRef.current = null;
      }
      // 초기 동기화가 끝났으면 부트스트랩 종료
      if (bootRef.current) bootRef.current = false;
    } catch {}
  }, [availableCities, useRealTxApi, sigungus]);

  useEffect(() => {
    try {
      const t = searchParams?.get("town") || "";
      const districtList = useRealTxApi
        ? adminDongs.map((d) => d.name)
        : availableDistricts;

      if (t && districtList.includes(t)) setSelectedDistrict(t);
    } catch {}
  }, [searchParams, availableDistricts, useRealTxApi, adminDongs]);

  // 드롭다운 → URL 동기화 (선택 변경 시 쿼리 업데이트)
  useEffect(() => {
    try {
      if (bootRef.current) return; // 초기 동기화 전에는 URL 갱신 금지
      const current = new URLSearchParams(searchParams?.toString() || "");
      if (selectedProvince) current.set("province", selectedProvince);
      else current.delete("province");
      if (selectedCity) current.set("cityDistrict", selectedCity);
      else current.delete("cityDistrict");
      if (selectedDistrict) current.set("town", selectedDistrict);
      else current.delete("town");
      const nextQs = `?${current.toString()}`;
      const prevQs =
        typeof window !== "undefined" ? window.location.search : "";
      if (nextQs !== prevQs) {
        router.replace(nextQs, { scroll: false });
      }
    } catch {}
  }, [selectedProvince, selectedCity, selectedDistrict]);
  const handleSearch = () => {};

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bounds, setBounds] = useState<{
    south: number;
    west: number;
    north: number;
    east: number;
  } | null>(null);

  const centerAndRadius = useMemo(() => {
    // 시도 미선택 시 지도 중심/반경도 적용하지 않음(요청 억제)
    if (!selectedProvince) return null;
    // 0) URL로 전달된 lat/lng/radius 우선 적용
    const qsLat = Number(searchParams?.get("lat"));
    const qsLng = Number(searchParams?.get("lng"));
    const qsRadius = Number(searchParams?.get("radius_km"));
    if (Number.isFinite(qsLat) && Number.isFinite(qsLng)) {
      const r = Number.isFinite(qsRadius) && qsRadius > 0 ? qsRadius : 5;
      return {
        lat: qsLat,
        lng: qsLng,
        radius_km: Math.min(10, Math.max(0.5, r)),
      } as const;
    }
    // 1) 지도 bounds가 있으면 중심+반경 계산
    if (bounds) {
      const lat = (bounds.south + bounds.north) / 2;
      const lng = (bounds.west + bounds.east) / 2;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371;
      const lat1 = toRad(lat);
      const lng1 = toRad(lng);
      const lat2 = toRad(bounds.north);
      const lng2 = toRad(bounds.east);
      const dlat = lat2 - lat1;
      const dlng = lng2 - lng1;
      const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dlng / 2) *
          Math.sin(dlng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const diagKm = R * c;
      const radius_km = Math.min(10, Math.max(0.5, diagKm / 2));
      return { lat, lng, radius_km } as const;
    }
    // 2) 초기 bounds가 없을 때: 상세(property) 좌표 기반 폴백(반경 2km)
    const plat =
      (property as any)?.lat ??
      (property as any)?.latitude ??
      (property as any)?.lat_y ??
      (property as any)?.y;
    const plng =
      (property as any)?.lng ??
      (property as any)?.longitude ??
      (property as any)?.lon ??
      (property as any)?.x;
    const latNum = typeof plat === "number" ? plat : parseFloat(String(plat));
    const lngNum = typeof plng === "number" ? plng : parseFloat(String(plng));
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
      // 초기 반경을 5km로 상향하여 0건 문제 완화
      return { lat: latNum, lng: lngNum, radius_km: 5 } as const;
    }
    return null;
  }, [bounds, property, searchParams, selectedProvince]);

  // 🆕 URL → ns(auction_ed) 초기 주입 (1회)
  const circleBootRef = useRef(false);
  useEffect(() => {
    if (circleBootRef.current) return;
    circleBootRef.current = true;
    try {
      const qsLat = Number(searchParams?.get("lat"));
      const qsLng = Number(searchParams?.get("lng"));
      const qsRadius = Number(searchParams?.get("radius_km"));
      if (
        Number.isFinite(qsLat) &&
        Number.isFinite(qsLng) &&
        typeof setNsFilter === "function"
      ) {
        setNsFilter("auction_ed", "circleEnabled" as any, true);
        setNsFilter("auction_ed", "circleCenter" as any, {
          lat: qsLat,
          lng: qsLng,
        });
        setNsFilter(
          "auction_ed",
          "circleRadiusM" as any,
          Math.max(0, Number.isFinite(qsRadius) ? qsRadius * 1000 : 5000)
        );
      }
      // 분석물건 마커 초기값: URL(lat/lng) 우선, 아니면 상세 좌표(유효 범위 검증)
      const pickNumber = (v: any) =>
        typeof v === "number" ? v : parseFloat(String(v));
      const pickLat = (src: any) => {
        const cands = [src?.lat, src?.latitude];
        for (const v of cands) {
          const n = pickNumber(v);
          if (Number.isFinite(n) && n >= -90 && n <= 90) return n;
        }
        return undefined;
      };
      const pickLng = (src: any) => {
        const cands = [src?.lng, src?.longitude];
        for (const v of cands) {
          const n = pickNumber(v);
          if (Number.isFinite(n) && n >= -180 && n <= 180) return n;
        }
        return undefined;
      };
      let latNum = Number.isFinite(qsLat) ? qsLat : pickLat(property as any);
      let lngNum = Number.isFinite(qsLng) ? qsLng : pickLng(property as any);
      // 범위 기반 스왑(한국 좌표대: lat≈33~39, lng≈124~132)
      if (
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        (latNum as number) > 90 &&
        Math.abs(lngNum as number) <= 90
      ) {
        const t = latNum;
        latNum = lngNum;
        lngNum = t;
      }
      if (
        typeof setNsFilter === "function" &&
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        !(Number(latNum) === 0 && Number(lngNum) === 0)
      ) {
        setNsFilter("auction_ed", "refMarkerCenter" as any, {
          lat: latNum,
          lng: lngNum,
        });
        setNsFilter("auction_ed", "refMarkerLocked" as any, true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🆕 상세(property) 로딩 후 refMarkerCenter 미설정 시 초기화(유효 범위 검증)
  useEffect(() => {
    try {
      const already = nsState?.auction_ed?.refMarkerCenter as
        | { lat?: number; lng?: number }
        | null
        | undefined;
      const alreadyValid =
        already &&
        Number.isFinite((already as any).lat) &&
        Number.isFinite((already as any).lng) &&
        !(
          Number((already as any).lat) === 0 &&
          Number((already as any).lng) === 0
        );
      if (alreadyValid) return;
      const pickNumber = (v: any) =>
        typeof v === "number" ? v : parseFloat(String(v));
      const pickLat = (src: any) => {
        const cands = [src?.lat, src?.latitude];
        for (const v of cands) {
          const n = pickNumber(v);
          if (Number.isFinite(n) && n >= -90 && n <= 90) return n;
        }
        return undefined;
      };
      const pickLng = (src: any) => {
        const cands = [src?.lng, src?.longitude];
        for (const v of cands) {
          const n = pickNumber(v);
          if (Number.isFinite(n) && n >= -180 && n <= 180) return n;
        }
        return undefined;
      };
      let latNum = pickLat(property as any);
      let lngNum = pickLng(property as any);
      if (
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        (latNum as number) > 90 &&
        Math.abs(lngNum as number) <= 90
      ) {
        const t = latNum;
        latNum = lngNum;
        lngNum = t;
      }
      if (
        typeof setNsFilter === "function" &&
        Number.isFinite(latNum) &&
        Number.isFinite(lngNum) &&
        !(Number(latNum) === 0 && Number(lngNum) === 0)
      ) {
        setNsFilter("auction_ed", "refMarkerCenter" as any, {
          lat: latNum,
          lng: lngNum,
        });
        setNsFilter("auction_ed", "refMarkerLocked" as any, true);
      }
    } catch {}
  }, [property, nsState?.auction_ed?.refMarkerCenter, setNsFilter]);

  // 🆕 URL 갱신 디바운스 도우미
  const circleUrlTimerRef = useRef<any>(null);
  const updateCircleQuery = useCallback(
    (
      enabled: boolean,
      center: { lat: number; lng: number } | null | undefined,
      radiusM: number | null | undefined
    ) => {
      try {
        const current = new URLSearchParams(searchParams?.toString() || "");
        if (!enabled || !center || !Number.isFinite(radiusM as number)) {
          current.delete("lat");
          current.delete("lng");
          current.delete("radius_km");
        } else {
          const latStr = (center.lat ?? 0).toFixed(5);
          const lngStr = (center.lng ?? 0).toFixed(5);
          const km = Math.max(0, Number(radiusM || 0) / 1000);
          const kmStr = km.toFixed(1);
          current.set("lat", latStr);
          current.set("lng", lngStr);
          current.set("radius_km", kmStr);
        }
        clearTimeout(circleUrlTimerRef.current);
        circleUrlTimerRef.current = setTimeout(() => {
          try {
            // ds 유지
            if (activeDataset) current.set("ds", String(activeDataset));
            router.replace(`?${current.toString()}`, { scroll: false });
          } catch {}
        }, 250);
      } catch {}
    },
    [searchParams, router, activeDataset]
  );

  // 🆕 헤더 토글(영역 안만 보기) → URL 동기화(within, lat/lng/radius)
  useEffect(() => {
    try {
      const apply = Boolean(nsState?.auction_ed?.applyCircleFilter);
      const current = new URLSearchParams(searchParams?.toString() || "");
      if (!apply) {
        current.delete("within");
        // 토글 끄면 관련 키도 정리
        current.delete("lat");
        current.delete("lng");
        current.delete("lon");
        current.delete("radius_km");
        current.delete("radium_km");
        router.replace(`?${current.toString()}`, { scroll: false });
        return;
      }
      // 중심/반지름 산출: (실시간 스토어) circleCenter → refMarkerCenter → (클로저) nsState → property, 반지름 기본 1000m
      const liveState = (useFilterStore as any)?.getState?.()?.ns?.auction_ed;
      // 요청: URL의 lat/lng는 분석물건 마커(refMarkerCenter)를 최우선으로 사용
      let c =
        (liveState?.refMarkerCenter as any) ||
        (liveState?.circleCenter as any) ||
        (nsState?.auction_ed?.refMarkerCenter as any) ||
        (nsState?.auction_ed?.circleCenter as any) ||
        null;
      if (!c) {
        // property 기반 폴백 (lat/latitude, lng/longitude만 사용)
        const toNum = (v: any) =>
          typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;
        const plat = toNum(
          (property as any)?.lat ?? (property as any)?.latitude
        );
        const plng = toNum(
          (property as any)?.lng ?? (property as any)?.longitude
        );
        if (
          Number.isFinite(plat) &&
          Number.isFinite(plng) &&
          !(Number(plat) === 0 && Number(plng) === 0)
        ) {
          c = { lat: plat, lng: plng } as any;
        }
      }
      const r = Number((nsState?.auction_ed?.circleRadiusM as any) ?? 0);
      const hasCenter =
        c &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lng) &&
        !(Number(c.lat) === 0 && Number(c.lng) === 0);
      const radiusM = Number.isFinite(r) && r > 0 ? r : 1000;

      // 요구사항: 토글을 켜면 항상 within, lon, lat, radius_km, radium_km 노출
      const latStr = hasCenter ? Number(c.lat).toFixed(5) : "";
      const lngStr = hasCenter ? Number(c.lng).toFixed(5) : "";
      const kmStr = Math.max(0, radiusM / 1000).toFixed(1);
      current.set("lat", latStr);
      current.set("lng", lngStr);
      // 요청: radium_km만 노출
      current.set("radium_km", kmStr);
      // 정리: 더 이상 사용하지 않음
      current.delete("lon");
      current.delete("radius_km");
      current.set("within", "1");
      if (activeDataset) current.set("ds", String(activeDataset));
      router.replace(`?${current.toString()}`, { scroll: false });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nsState?.auction_ed?.applyCircleFilter,
    nsState?.auction_ed?.circleCenter,
    nsState?.auction_ed?.refMarkerCenter,
    nsState?.auction_ed?.circleRadiusM,
    property,
    searchParams,
    router,
    activeDataset,
  ]);

  // 🆕 토글 ON 이후 중심/반지름 지속 보정: center가 비어 있거나 반경이 0/NaN이면 즉시 채움
  useEffect(() => {
    try {
      const ns = nsState?.auction_ed;
      if (!ns || !ns.applyCircleFilter) return;
      if (typeof setNsFilter !== "function") return;

      const isValid = (p?: { lat?: number; lng?: number }) =>
        p &&
        Number.isFinite((p as any).lat) &&
        Number.isFinite((p as any).lng) &&
        !(Number((p as any).lat) === 0 && Number((p as any).lng) === 0);

      // 중심 보정: circleCenter → refMarkerCenter → property
      if (!isValid(ns.circleCenter)) {
        const ref = ns.refMarkerCenter as any;
        if (isValid(ref)) {
          setNsFilter("auction_ed", "circleCenter" as any, ref);
        } else if (property) {
          const toNum = (v: any) =>
            typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;
          const plat = toNum(
            (property as any)?.lat ?? (property as any)?.latitude
          );
          const plng = toNum(
            (property as any)?.lng ?? (property as any)?.longitude
          );
          if (
            Number.isFinite(plat) &&
            Number.isFinite(plng) &&
            !(Number(plat) === 0 && Number(plng) === 0)
          ) {
            setNsFilter("auction_ed", "circleCenter" as any, {
              lat: plat,
              lng: plng,
            });
          }
        }
      }

      // 반지름 보정
      const r = Number(ns.circleRadiusM ?? 0);
      if (!Number.isFinite(r) || r <= 0) {
        setNsFilter("auction_ed", "circleRadiusM" as any, 1000);
      }
    } catch {}
  }, [
    nsState?.auction_ed?.applyCircleFilter,
    nsState?.auction_ed?.circleCenter,
    nsState?.auction_ed?.refMarkerCenter,
    nsState?.auction_ed?.circleRadiusM,
    property,
    setNsFilter,
  ]);

  // analysis → v2로 넘어올 때 URL의 지역 파라미터를 스토어에 1회 주입
  useEffect(() => {
    try {
      const p = searchParams?.get("province");
      const c = searchParams?.get("cityDistrict");
      const t = searchParams?.get("town");
      let updated = false;
      if (p) {
        setFilter("province", p);
        updated = true;
      }
      if (c) {
        setFilter("cityDistrict", c);
        updated = true;
      }
      if (t) {
        setFilter("town", t);
        updated = true;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공통 데이터셋 훅 연결(필터는 후속 단계에서 namespace 적용 예정)
  // v2에서는 공통 스토어의 일부 필드만 쿼리로 사용 (기존 analysis와 충돌 없음)
  const zFilters = useFilterStore((s: any) => s);
  const queryFilters = {
    province: zFilters?.province,
    cityDistrict: zFilters?.cityDistrict,
    town: zFilters?.town,
    // 정렬 상태 전달 (서버 정렬 반영)
    sortBy: (typeof (zFilters?.sortBy as any) === "string"
      ? (zFilters?.sortBy as any).replace(/([A-Z])/g, "_$1").toLowerCase()
      : (zFilters?.sortBy as any)) as any,
    sortOrder: zFilters?.sortOrder,
    // auction_ed에서는 좌표 기반 필터링 비활성화 (지역 필터만 사용)
    // south: bounds?.south,
    // west: bounds?.west,
    // north: bounds?.north,
    // east: bounds?.east,
    // lat: centerAndRadius?.lat,
    // lng: centerAndRadius?.lng,
    // radius_km: centerAndRadius?.radius_km,
    price_min: Array.isArray(zFilters?.priceRange)
      ? zFilters.priceRange[0]
      : undefined,
    price_max: Array.isArray(zFilters?.priceRange)
      ? zFilters.priceRange[1]
      : undefined,
    build_year_min: Array.isArray(zFilters?.buildYear)
      ? zFilters.buildYear[0]
      : undefined,
    build_year_max: Array.isArray(zFilters?.buildYear)
      ? zFilters.buildYear[1]
      : undefined,
  } as Record<string, unknown>;

  // 가상 스크롤 사용 조건: 전역 플래그 또는 총 건수 임계치 초과
  const { virtualTable, areaDisplay } = useFeatureFlags();
  const useVirtual = false;

  // 정렬 상태/설정
  const setSortConfig = useFilterStore((s: any) => s.setSortConfig);
  const sortBy = useFilterStore((s: any) => s.sortBy);
  const sortOrder = useFilterStore((s: any) => s.sortOrder);
  const { sortableColumns } = useSortableColumns(activeDataset as any);

  const handleSort = (column?: string, direction?: "asc" | "desc") => {
    const serverKey =
      typeof (column || "") === "string"
        ? (column || "").replace(/([A-Z])/g, "_$1").toLowerCase()
        : (column as any);
    if (
      serverKey &&
      Array.isArray(sortableColumns) &&
      sortableColumns.length > 0 &&
      !sortableColumns.includes(serverKey)
    ) {
      console.warn(`[v2 Sort] 금지된 컬럼 무시: ${column} → ${serverKey}`);
      return;
    }
    // 전역 스토어는 프론트 키로 유지, 서버 전송은 queryFilters 단계에서 snake로 변환
    setSortConfig(column || undefined, direction);
  };

  const handleChangeView = (next: ViewType) => {
    saveScrollPosition();
    setViewByDataset((prev) => ({ ...prev, [activeDataset]: next }));
  };

  const handleChangeDataset = (nextDs: string) => {
    saveScrollPosition();
    setActiveDataset(nextDs);
  };

  // ✅ URL 동기화: ds만 반영 (p/s는 내부 상태로만 유지)
  useEffect(() => {
    try {
      const current = new URLSearchParams(searchParams?.toString() || "");
      current.set("ds", activeDataset);
      router.replace(`?${current.toString()}`, { scroll: false });
    } catch {}
  }, [activeDataset]);

  // 전환 직후 스크롤 복원
  useEffect(() => {
    restoreScrollPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDataset, activeView]);

  // 지역/필터 변경 시 선택 초기화
  useEffect(() => {
    try {
      if (selectedRowKeys.length > 0) setSelectedRowKeys([]);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    zFilters?.province,
    zFilters?.cityDistrict,
    zFilters?.town,
    bounds?.south,
    bounds?.west,
    bounds?.north,
    bounds?.east,
  ]);

  const schemaColumns = datasetConfigs[
    activeDataset as keyof typeof datasetConfigs
  ]?.table?.columns as { key: string; header: string }[];

  const user = { email: "user@example.com" } as any;

  const goBack = () => router.back();

  const formatNumber = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString()
      : "-";

  useEffect(() => {
    // 향후 트래킹 이벤트 연결 지점
  }, [itemId]);

  // 🆕 상세 → 실거래가(전월세) 지도 초기값 주입(기존)
  // 🆕 상세 → 전월세 지도 초기값 주입(1회): 중심/반경/원표시 상태
  useEffect(() => {
    try {
      if (activeDataset !== "rent") return;
      if (typeof setNsFilter !== "function") return;
      const already = (nsState as any)?.rent?.mapInitFromDetail === true;
      if (already) return;

      const toNum = (v: any) =>
        typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;

      // 우선순위: vm.location → vm → property
      const vmLat = toNum((vm as any)?.location?.lat ?? (vm as any)?.lat);
      const vmLng = toNum((vm as any)?.location?.lng ?? (vm as any)?.lng);
      const pLat = toNum(
        (property as any)?.lat ??
          (property as any)?.latitude ??
          (property as any)?.lat_y ??
          (property as any)?.y
      );
      const pLng = toNum(
        (property as any)?.lng ??
          (property as any)?.longitude ??
          (property as any)?.lon ??
          (property as any)?.x
      );

      let lat = Number.isFinite(vmLat) ? vmLat : pLat;
      let lng = Number.isFinite(vmLng) ? vmLng : pLng;

      // 범위 기반 스왑(한국 좌표대: lat≈33~39, lng≈124~132)
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (lat as number) > 90 &&
        Math.abs(lng as number) <= 90
      ) {
        const t = lat;
        lat = lng;
        lng = t;
      }

      const valid =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(Number(lat) === 0 && Number(lng) === 0);
      if (!valid) return;

      setNsFilter("rent", "circleCenter" as any, { lat, lng });
      setNsFilter("rent", "circleRadiusM" as any, 1000);
      setNsFilter("rent", "circleEnabled" as any, false);
      setNsFilter("rent", "applyCircleFilter" as any, false);
      // 초기화 완료 플래그(재주입 방지)
      setNsFilter("rent", "mapInitFromDetail" as any, true);
    } catch {}
  }, [activeDataset, vm, property, nsState, setNsFilter]);

  // 🆕 상세 → 실거래가(매매) 지도 초기값 주입(1회): 중심/반경/원표시 상태
  useEffect(() => {
    try {
      if (activeDataset !== "sale") return;
      if (typeof setNsFilter !== "function") return;
      const already = (nsState as any)?.sale?.mapInitFromDetail === true;
      if (already) return;

      const toNum = (v: any) =>
        typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;

      // 우선순위: vm.location → vm → property
      const vmLat = toNum((vm as any)?.location?.lat ?? (vm as any)?.lat);
      const vmLng = toNum((vm as any)?.location?.lng ?? (vm as any)?.lng);
      const pLat = toNum(
        (property as any)?.lat ??
          (property as any)?.latitude ??
          (property as any)?.lat_y ??
          (property as any)?.y
      );
      const pLng = toNum(
        (property as any)?.lng ??
          (property as any)?.longitude ??
          (property as any)?.lon ??
          (property as any)?.x
      );

      let lat = Number.isFinite(vmLat) ? vmLat : pLat;
      let lng = Number.isFinite(vmLng) ? vmLng : pLng;

      // 범위 기반 스왑(한국 좌표대: lat≈33~39, lng≈124~132)
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (lat as number) > 90 &&
        Math.abs(lng as number) <= 90
      ) {
        const t = lat;
        lat = lng;
        lng = t;
      }

      const valid =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(Number(lat) === 0 && Number(lng) === 0);
      if (!valid) return;

      setNsFilter("sale", "circleCenter" as any, { lat, lng });
      setNsFilter("sale", "circleRadiusM" as any, 1000);
      setNsFilter("sale", "circleEnabled" as any, false);
      setNsFilter("sale", "applyCircleFilter" as any, false);
      // 초기화 완료 플래그(재주입 방지)
      setNsFilter("sale", "mapInitFromDetail" as any, true);
    } catch {}
  }, [activeDataset, vm, property, nsState, setNsFilter]);

  // 🆕 상세 → 과거경매결과 지도 초기값 주입(1회): 중심/반경/원표시 상태
  useEffect(() => {
    try {
      if (activeDataset !== "auction_ed") return;
      if (typeof setNsFilter !== "function") return;
      const already = (nsState as any)?.auction_ed?.mapInitFromDetail === true;
      if (already) return;

      const toNum = (v: any) =>
        typeof v === "number" ? v : v != null ? parseFloat(String(v)) : NaN;

      // 우선순위: vm.location → vm → property
      const vmLat = toNum((vm as any)?.location?.lat ?? (vm as any)?.lat);
      const vmLng = toNum((vm as any)?.location?.lng ?? (vm as any)?.lng);
      const pLat = toNum(
        (property as any)?.lat ??
          (property as any)?.latitude ??
          (property as any)?.lat_y ??
          (property as any)?.y
      );
      const pLng = toNum(
        (property as any)?.lng ??
          (property as any)?.longitude ??
          (property as any)?.lon ??
          (property as any)?.x
      );

      let lat = Number.isFinite(vmLat) ? vmLat : pLat;
      let lng = Number.isFinite(vmLng) ? vmLng : pLng;

      // 범위 기반 스왑(한국 좌표대: lat≈33~39, lng≈124~132)
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        (lat as number) > 90 &&
        Math.abs(lng as number) <= 90
      ) {
        const t = lat;
        lat = lng;
        lng = t;
      }

      const valid =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        !(Number(lat) === 0 && Number(lng) === 0);
      if (!valid) return;

      setNsFilter("auction_ed", "circleCenter" as any, { lat, lng });
      setNsFilter("auction_ed", "circleRadiusM" as any, 1000);
      setNsFilter("auction_ed", "circleEnabled" as any, false);
      setNsFilter("auction_ed", "applyCircleFilter" as any, false);
      // 초기화 완료 플래그(재주입 방지)
      setNsFilter("auction_ed", "mapInitFromDetail" as any, true);
    } catch {}
  }, [activeDataset, vm, property, nsState, setNsFilter]);

  if (isLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingState title="불러오는 중입니다..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <ErrorState
            title={mapApiErrorToMessage(error)}
            onRetry={refetch}
            retryText="다시 시도"
          />
          <div>
            <Button
              variant="ghost"
              onClick={goBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 상단 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={goBack}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로 돌아가기
          </Button>
        </div>

        {/* 상단 요약 섹션 (auction_ing 기반 요약) */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">
                  {property?.title ?? property?.address ?? "상세 정보"}
                </CardTitle>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property?.address ?? "-"}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>
                    {typeof property?.area === "number"
                      ? `${property?.area}㎡`
                      : "-"}
                  </span>
                  <span>
                    {property?.buildYear
                      ? `${property?.buildYear}년 건축`
                      : "-"}
                  </span>
                  <span>{property?.floor ?? "-"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">현재상태</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">경매 시작가</div>
                <div className="text-xl font-semibold text-blue-600">
                  {formatNumber(property?.price)}만원
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">감정가</div>
                <div className="text-xl font-semibold text-green-600">
                  {formatNumber((property as any)?.estimatedValue)}만원
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">예상 ROI</div>
                <div className="text-xl font-semibold text-purple-600">
                  {(property as any)?.investmentAnalysis?.expectedRoi ?? "-"}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">편의시설</div>
                <div className="text-sm text-gray-700">
                  {(property as any)?.hasParking ? "주차" : ""}
                  {(property as any)?.hasElevator
                    ? (property as any)?.hasParking
                      ? " / 엘리베이터"
                      : "엘리베이터"
                    : ""}
                  {!(property as any)?.hasParking &&
                  !(property as any)?.hasElevator
                    ? "-"
                    : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상세 정보 섹션: auction_ing 컬럼 기반(기존 컴포넌트 재사용) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {isDetailLoading && (
              <div className="py-6 text-sm text-gray-500">
                상세 정보를 불러오는 중…
              </div>
            )}
            {isDetailError && (
              <div className="py-6">
                <ErrorState
                  title="상세 정보 로딩 실패"
                  onRetry={reloadDetail}
                  retryText="다시 시도"
                />
              </div>
            )}
            {!isDetailLoading && !isDetailError && (
              <PropertyDetailSimple vm={vm ?? undefined} />
            )}
          </CardContent>
        </Card>

        {/* 데이터셋 대탭 헤더는 생략하고 아래 레이아웃에 배치 */}

        {/* 데이터셋 선택 탭 (상단) */}
        <Tabs value={activeDataset} onValueChange={handleChangeDataset}>
          <TabsList className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-[3px] grid w-full grid-cols-4">
            <TabsTrigger value="auction_ed">과거경매결과</TabsTrigger>
            <TabsTrigger value="sale">실거래가(매매)</TabsTrigger>
            <TabsTrigger value="rent">실거래가(전월세)</TabsTrigger>
            <TabsTrigger value="listings">매물</TabsTrigger>
          </TabsList>

          {/* 지역 선택 UI (모든 데이터셋 공통) */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium">
                  지역 선택 (모든 데이터셋 공통 적용)
                </Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 시도명 */}
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">
                    시도
                  </Label>
                  <Select
                    value={selectedProvince || "all"}
                    onValueChange={(value) => {
                      const actualValue = value === "all" ? "" : value;
                      if (actualValue === selectedProvince) return; // 동일값 가드
                      setSelectedProvince(actualValue);
                      if (selectedCity) setSelectedCity("");
                      if (selectedDistrict) setSelectedDistrict("");
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="시도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {(useRealTxApi
                        ? sidos.map((s) => s.name)
                        : provinces
                      ).map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 시군구 */}
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">
                    시군구
                  </Label>
                  <Select
                    value={selectedCity || "all"}
                    onValueChange={(value) => {
                      const actualValue = value === "all" ? "" : value;
                      if (actualValue === selectedCity) return; // 동일값 가드
                      setSelectedCity(actualValue);
                      if (selectedDistrict) setSelectedDistrict("");
                    }}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="시군구 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">선택</SelectItem>
                      {(useRealTxApi
                        ? sigungus.map((s) => s.name)
                        : availableCities
                      ).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 읍면동 */}
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">
                    읍면동
                  </Label>
                  <Select
                    value={selectedDistrict || "all"}
                    onValueChange={(value) => {
                      const actualValue = value === "all" ? "" : value;
                      if (actualValue === selectedDistrict) return; // 동일값 가드
                      setSelectedDistrict(actualValue);
                    }}
                    disabled={!useRealTxApi || !selectedCity}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="읍면동 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">선택</SelectItem>
                      {(useRealTxApi
                        ? adminDongs.map((d) => d.name)
                        : availableDistricts
                      ).map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 안내 배너: 지역 미선택 시 (sale 제외) */}
          {activeDataset !== "sale" && !(selectedProvince && selectedCity) && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              지역을 먼저 선택하세요. 시도와 시군구를 선택하면 결과가
              표시됩니다.
            </div>
          )}

          {/* 선택된 필터 바 */}
          <SelectedFilterBar
            detailsCollapsed={detailsCollapsed}
            onToggleDetailsCollapse={() =>
              setDetailsCollapsed(!detailsCollapsed)
            }
            namespace={activeDataset}
          />

          {/* 분석 레이아웃: 좌측(목록/지도/통합) + 우측(필터) */}
          <div
            className={
              "flex flex-col lg:flex-row items-start " +
              (detailsCollapsed ? "gap-0" : "gap-8")
            }
          >
            {/* 좌측 뷰 영역 */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              <Card>
                <CardContent>
                  {(["auction_ed", "sale", "rent", "listings"] as const).map(
                    (ds) => (
                      <TabsContent key={ds} value={ds} className="mt-4">
                        {ds === "auction_ed" ? (
                          selectedProvince && selectedCity ? (
                            <AuctionEdSearchResults
                              activeView={
                                activeView === "list"
                                  ? "table"
                                  : activeView === "integrated"
                                  ? "both"
                                  : (activeView as "table" | "map" | "both")
                              }
                              serverAreaEnabled={useServerArea}
                              onViewChange={(view) => {
                                console.log("🔍 [onViewChange] 뷰 변경:", {
                                  view,
                                  currentActiveView: activeView,
                                  activeDataset,
                                });
                                const mappedView =
                                  view === "both"
                                    ? "integrated"
                                    : view === "table"
                                    ? "list"
                                    : view;
                                console.log("🔍 [onViewChange] 매핑된 뷰:", {
                                  mappedView,
                                });
                                handleChangeView(mappedView as ViewType);
                                if (selectedRowKeys.length > 0)
                                  setSelectedRowKeys([]);
                              }}
                            />
                          ) : (
                            <ViewState
                              isLoading={false}
                              error={undefined}
                              total={0}
                              onRetry={() => {}}
                            >
                              <div className="py-8 text-center text-gray-500">
                                표시할 데이터가 없습니다.
                              </div>
                            </ViewState>
                          )
                        ) : ds === "sale" ? (
                          <SaleSearchResults
                            activeView={
                              activeView === "list"
                                ? "table"
                                : activeView === "integrated"
                                ? "both"
                                : (activeView as "table" | "map" | "both")
                            }
                            onViewChange={(view) => {
                              const mappedView =
                                view === "both"
                                  ? "integrated"
                                  : view === "table"
                                  ? "list"
                                  : view;
                              handleChangeView(mappedView as ViewType);
                              if (selectedRowKeys.length > 0)
                                setSelectedRowKeys([]);
                            }}
                          />
                        ) : ds === "rent" ? (
                          <RentSearchResults
                            activeView={
                              activeView === "list"
                                ? "table"
                                : activeView === "integrated"
                                ? "both"
                                : (activeView as "table" | "map" | "both")
                            }
                            onViewChange={(view) => {
                              const mappedView =
                                view === "both"
                                  ? "integrated"
                                  : view === "table"
                                  ? "list"
                                  : view;
                              handleChangeView(mappedView as ViewType);
                              if (selectedRowKeys.length > 0)
                                setSelectedRowKeys([]);
                            }}
                          />
                        ) : (
                          // listings 데이터셋의 경우 기본 UI 표시
                          <div className="py-8 text-center text-gray-500">
                            해당 데이터셋은 지원되지 않습니다.
                          </div>
                        )}
                      </TabsContent>
                    )
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 우측 필터 영역 (불필요한 래퍼 제거) */}
            <div
              className={
                detailsCollapsed
                  ? "hidden"
                  : "shrink-0 w-full lg:w-[384px] max-w-[384px]"
              }
            >
              {activeDataset === "auction_ed" ? (
                <AuctionEdFilter
                  isCollapsed={detailsCollapsed}
                  onToggleCollapse={() =>
                    setDetailsCollapsed(!detailsCollapsed)
                  }
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  showDetailsOnly={true}
                  namespace={activeDataset}
                />
              ) : activeDataset === "sale" ? (
                <SaleFilter
                  isCollapsed={detailsCollapsed}
                  onToggleCollapse={() =>
                    setDetailsCollapsed(!detailsCollapsed)
                  }
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  showDetailsOnly={false}
                  namespace={activeDataset}
                />
              ) : activeDataset === "rent" ? (
                <RentFilter
                  isCollapsed={detailsCollapsed}
                  onToggleCollapse={() =>
                    setDetailsCollapsed(!detailsCollapsed)
                  }
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  showDetailsOnly={true}
                  namespace={activeDataset}
                />
              ) : (
                <FilterControl
                  isCollapsed={detailsCollapsed}
                  onToggleCollapse={() =>
                    setDetailsCollapsed(!detailsCollapsed)
                  }
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  showDetailsOnly={true}
                  preset={
                    datasetConfigs[activeDataset as keyof typeof datasetConfigs]
                      ?.filters?.ui
                  }
                  defaults={
                    datasetConfigs[activeDataset as keyof typeof datasetConfigs]
                      ?.filters?.defaults
                  }
                  namespace={activeDataset}
                />
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
