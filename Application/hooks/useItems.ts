"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { type Item } from "@/lib/api";
import { useFilterStore } from "@/store/filterStore";

// 🔄 C번 문제 해결: 서버 정렬 검증 함수
function checkIfSorted(
  items: any[],
  sortBy: string,
  sortOrder: string
): boolean {
  if (items.length < 2) return true;

  for (let i = 0; i < items.length - 1; i++) {
    const current = getSortValue(items[i], sortBy);
    const next = getSortValue(items[i + 1], sortBy);

    if (sortOrder === "asc") {
      if (current > next) {
        console.log(
          `⚠️ [Sort] 정렬 검증 실패: ${current} > ${next} (${sortBy} asc)`
        );
        return false;
      }
    } else if (sortOrder === "desc") {
      if (current < next) {
        console.log(
          `⚠️ [Sort] 정렬 검증 실패: ${current} < ${next} (${sortBy} desc)`
        );
        return false;
      }
    }
  }

  return true;
}

// 🔄 C번 문제 해결: 클라이언트 사이드 정렬 함수
function clientSideSort(
  items: any[],
  sortBy: string,
  sortOrder: string
): any[] {
  return [...items].sort((a, b) => {
    const aVal = getSortValue(a, sortBy);
    const bVal = getSortValue(b, sortBy);

    let comparison = 0;
    if (aVal > bVal) comparison = 1;
    if (aVal < bVal) comparison = -1;

    return sortOrder === "desc" ? -comparison : comparison;
  });
}

// 🔄 정렬 값 추출 함수 (타입별 적절한 변환)
function getSortValue(item: any, sortBy: string): any {
  // 🎯 computed field: calculated_ratio (최저가/공시가격)
  if (sortBy === "calculated_ratio") {
    const minBid = parseFloat(item.minimum_bid_price) || 0;
    const publicPrice = parseFloat(item.public_price) || 0;

    if (publicPrice === 0 || isNaN(publicPrice) || isNaN(minBid)) {
      return 999999; // 계산 불가능한 값은 맨 뒤로
    }

    return minBid / publicPrice;
  }

  const value = item[sortBy];

  // 숫자형 컬럼들
  if (
    [
      "appraised_value",
      "minimum_bid_price",
      "building_area_pyeong",
      "land_area_pyeong",
      "construction_year",
      "public_price",
    ].includes(sortBy)
  ) {
    return parseFloat(value) || 0;
  }

  // 날짜형 컬럼들 (sale_date)
  if (["sale_date"].includes(sortBy)) {
    const dateValue = new Date(value || 0);
    return dateValue.getTime();
  }

  // 문자형 컬럼들
  return String(value || "").toLowerCase();
}

export interface UseItemsResult {
  items: Item[] | undefined;
  isLoading: boolean;
  error: any;
  totalCount?: number;
  baseTotalCount?: number;
  // 지도 전용: 클라이언트 필터/정렬이 적용된 전체 아이템(페이지 슬라이싱 전)
  mapItems?: Item[] | undefined;
  usageValues: string[]; // 🏢 동적 건물 유형 필터 옵션 생성용
  floorValues: string[]; // 🏢 동적 층확인 필터 옵션 생성용
  refetch: () => void;
  isRefreshing: boolean;
}

function buildQueryParamsFromFilters(
  filters: ReturnType<typeof useFilterStore.getState>
) {
  const params: Record<string, any> = {};

  // 🚨 핵심 수정: 클라이언트 처리가 필요한 모든 경우 통합
  const isLandAreaFiltered = Array.isArray(filters.landAreaRange)
    ? filters.landAreaRange[0] > 0 || filters.landAreaRange[1] < 200
    : false;

  const needsClientProcessing =
    (filters.floorConfirmation && filters.floorConfirmation !== "all") ||
    (filters.hasElevator && filters.hasElevator !== "all") ||
    (filters.sortBy && filters.sortOrder) ||
    isLandAreaFiltered; // 🌍 토지면적은 서버 미지원 → 클라 처리

  if (needsClientProcessing) {
    // 클라이언트 처리가 필요하면 전체 데이터를 가져온다
    params.limit = 1000; // 백엔드가 지원하는 범위로 조정
    params.size = 1000; // page/size 방식 API 호환
    params.page = 1;
    console.log(
      "🚨 [Debug] 클라이언트 처리 감지 (필터링/정렬) - 전체 데이터 로드 모드"
    );
  } else {
    // 일반적인 페이지네이션
    params.limit = filters.size ?? 20;
    params.size = filters.size ?? 20; // page/size 방식 API 호환
    params.page = filters.page ?? 1;
  }

  // ✅ 지역 (코드 기반 - 백엔드 가이드 3-1)
  if (filters.sido_code) params.sido_code = filters.sido_code;
  if (filters.city_code) params.city_code = filters.city_code;
  if (filters.town_code) params.town_code = filters.town_code;

  // 하위호환용 이름 기반 (백엔드에서 지원)
  if (!filters.sido_code && filters.province)
    params.province = filters.province;
  if (!filters.city_code && filters.cityDistrict)
    params.cityDistrict = filters.cityDistrict;
  if (!filters.town_code && filters.town) params.town = filters.town;
  if (filters.region) params.region = filters.region;

  // ✅ 건물 유형 (백엔드 가이드: buildingType → usage)
  if (filters.buildingType && filters.buildingType !== "all") {
    if (Array.isArray(filters.buildingType)) {
      params.usage = filters.buildingType.join(",");
    } else {
      params.usage = filters.buildingType;
    }
  }

  // ❌ 편의시설 (백엔드에서 실제 필터링이 작동하지 않아 클라이언트 사이드로 변경)
  // if (filters.hasElevator && filters.hasElevator !== "all") {
  //   params.hasElevator = filters.hasElevator === "있음" ? true : false;
  // }
  // ❌ hasParking 제거 (백엔드 데이터 없음)

  // ❌ 층확인 필터 - 백엔드 미지원으로 서버 요청에서 제거
  // 클라이언트 사이드에서 처리하도록 변경
  // if (filters.floorConfirmation && filters.floorConfirmation !== "all") {
  //   params.floor_confirmation = filters.floorConfirmation;
  // }

  // 🔄 기존 층수 필터 (하위호환 유지)
  if (filters.floor && filters.floor !== "all") {
    params.floor = filters.floor;
  }

  // 🔍 키워드 검색 (검색 필드 선택 지원)
  if (typeof filters.searchQuery === "string" && filters.searchQuery.trim()) {
    const searchQuery = filters.searchQuery.trim();
    const searchField = filters.searchField || "all";

    switch (searchField) {
      case "case_number":
        params.search_case_number = searchQuery;
        break;
      case "road_address":
        params.search_road_address = searchQuery;
        break;
      case "all":
      default:
        params.search = searchQuery;
        break;
    }

    console.log(
      `🔍 [Debug] 키워드 검색: "${searchQuery}" (${searchField} 필드)`
    );
  }

  // 🔄 서버 사이드 정렬 (전체 데이터 기준 정렬)
  if (filters.sortBy && filters.sortOrder) {
    params.sortBy = filters.sortBy;
    params.sortOrder = filters.sortOrder;
    console.log(
      `🔄 [Debug] 서버 사이드 정렬: ${filters.sortBy} ${filters.sortOrder}`
    );
  }

  // ❌ 경매상태 (사용자 요청에 의해 비활성화)
  // if (filters.auctionStatus && filters.auctionStatus !== "all") {
  //   params.currentStatus = filters.auctionStatus;
  // }

  // ✅ 가격 범위 (camelCase - 백엔드 가이드 3-1: minPrice/maxPrice)
  const [minPrice, maxPrice] = filters.priceRange;
  if (minPrice && minPrice > 0) params.minPrice = minPrice;
  if (maxPrice && maxPrice < 500000) params.maxPrice = maxPrice;

  // 🏗️ 건축면적 범위 (서버: minArea/maxArea 사용)
  const [minBuildingArea, maxBuildingArea] = filters.buildingAreaRange;
  if (minBuildingArea && minBuildingArea > 0) params.minArea = minBuildingArea;
  if (maxBuildingArea && maxBuildingArea > 0) params.maxArea = maxBuildingArea;

  // 🌍 토지면적 범위 (서버 미지원) → 클라이언트 처리만 수행
  const [minLandArea, maxLandArea] = filters.landAreaRange;

  // ✅ 건축년도 (서버 호환: minYearBuilt / maxYearBuilt, minBuildYear / maxBuildYear 동시 전송)
  const [minYear, maxYear] = filters.buildYear;
  if (minYear && minYear > 0) {
    params.minYearBuilt = minYear;
    params.minBuildYear = minYear;
  }
  if (maxYear && maxYear > 0) {
    params.maxYearBuilt = maxYear;
    params.maxBuildYear = maxYear;
  }

  // ✅ 매각기일 (서버 호환: auctionDateFrom/To, saleDateFrom/To 동시 전송)
  if (filters.auctionDateFrom) {
    params.auctionDateFrom = filters.auctionDateFrom;
    params.saleDateFrom = filters.auctionDateFrom;
  }
  if (filters.auctionDateTo) {
    params.auctionDateTo = filters.auctionDateTo;
    params.saleDateTo = filters.auctionDateTo;
  }

  // 하위호환 (기존 코드)
  if (filters.auctionMonth) params.auction_month = filters.auctionMonth;

  // 1억 이하 여부 (기존 로직 유지)
  if (filters.under100) {
    params.maxPrice = Math.min(params.maxPrice ?? 10000, 10000);
  }

  return params;
}

export function useItems(): UseItemsResult {
  const filters = useFilterStore();

  // 🚨 지역 선택 필수 조건 확인 (성능 최적화) - 시도명과 시군구 모두 필요
  const hasLocationSelected = Boolean(filters.province && filters.cityDistrict);

  // 🎉 /custom API 사용 (16개 컬럼 선택 + 모든 필터링 완전 지원 확인!)
  const requiredFields = [
    "id",
    "usage",
    "case_number",
    "location_detail",
    "case_year",
    "road_address",
    "building_area_pyeong",
    "land_area_pyeong",
    "appraised_value",
    "minimum_bid_price",
    "bid_to_appraised_ratio",
    "public_price",
    "sale_date",
    "sale_month",
    "special_rights",
    "floor_confirmation",
    "under_100million",
    "construction_year",
    "elevator_available",
    // 지도 렌더링을 위한 좌표 필드
    "latitude",
    "longitude",
    // 🆕 상태/특수조건 및 불리언 플래그들(서버가 지원하면 응답 포함)
    "current_status",
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
  ].join(",");

  // 🚨 핵심 수정: 클라이언트 처리 활성화 여부 확인 (필터링 + 정렬 + 토지면적)
  const isLandAreaFilteredInUseItems = Array.isArray(filters.landAreaRange)
    ? filters.landAreaRange[0] > 0 || filters.landAreaRange[1] < 200
    : false;

  const isAuctionDateFilteredInUseItems = Boolean(
    (filters as any).auctionDateFrom || (filters as any).auctionDateTo
  );

  const needsClientProcessing =
    (filters.floorConfirmation && filters.floorConfirmation !== "all") ||
    (filters.hasElevator && filters.hasElevator !== "all") ||
    (filters.sortBy && filters.sortOrder) ||
    isLandAreaFilteredInUseItems ||
    isAuctionDateFilteredInUseItems ||
    // 🆕 현재상태/특수조건 필터 활성화 시 클라이언트 처리
    ((filters as any).currentStatus && (filters as any).currentStatus !== "all"
      ? Array.isArray((filters as any).currentStatus)
        ? ((filters as any).currentStatus as string[]).length > 0
        : true
      : false) ||
    (Array.isArray((filters as any).specialBooleanFlags)
      ? ((filters as any).specialBooleanFlags as string[]).length > 0
      : false) ||
    (Array.isArray((filters as any).specialConditions)
      ? ((filters as any).specialConditions as string[]).length > 0
      : false) ||
    // 🆕 선택 항목만 보기 활성화 시 클라 처리 필요
    (filters as any).showSelectedOnly === true;

  const allParams = {
    ...buildQueryParamsFromFilters(filters),
    fields: requiredFields,
  };

  // 🎯 핵심 수정: 클라이언트 처리가 활성화된 경우 전체 데이터 로드
  const swrKey = hasLocationSelected
    ? needsClientProcessing
      ? [
          "/api/v1/items/custom",
          {
            ...allParams,
            page: 1, // 전체 데이터 로드
            limit: 1000,
            size: 1000,
          },
        ]
      : ["/api/v1/items/custom", allParams]
    : null;

  // 🔍 디버깅 로그 - 페이지네이션 및 SWR 키 확인
  if (hasLocationSelected) {
    console.log(
      `🔍 [Debug] 📄 페이지네이션: ${filters.page}페이지, ${filters.size}개씩`
    );
    console.log("🔍 [Debug] 필터 파라미터:", allParams);
    console.log("🔍 [Debug] floorConfirmation 값:", filters.floorConfirmation);
    console.log("🔍 [Debug] hasElevator 값:", filters.hasElevator);
    console.log("🔍 [Debug] buildingType 값:", filters.buildingType);
    console.log("🚨 [Debug] 클라이언트 처리 활성화:", needsClientProcessing);
    console.log("🔑 [Debug] SWR 키:", swrKey);
  } else {
    console.log("🚨 [Debug] 지역이 선택되지 않아서 데이터 로딩 중지");
  }

  // 🎯 지역 선택된 경우에만 API 호출 (성능 최적화)
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      keepPreviousData: true,
      dedupingInterval: 1500,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      focusThrottleInterval: 1500,
      loadingTimeout: 8000,
      errorRetryCount: 1,
      errorRetryInterval: 1500,
    }
  );

  // 🚨 지역 미선택 시 빈 데이터 반환 (성능 최적화)
  if (!hasLocationSelected) {
    return {
      items: [],
      isLoading: false,
      error: null,
      totalCount: 0,
      usageValues: [],
      floorValues: [],
      refetch: () => {},
      isRefreshing: false,
    };
  }

  // 🔍 실제 데이터 구조 확인 및 클라이언트 사이드 필터링
  // 응답 형태가 {items,total} 또는 {results,count} 또는 배열일 수 있음
  const resp: any = data as any;
  let items = Array.isArray(resp?.items)
    ? resp.items
    : Array.isArray(resp?.results)
    ? resp.results
    : Array.isArray(resp)
    ? resp
    : [];
  // 🆕 선택 항목만 보기: 선택된 id만 남긴다
  if ((filters as any).showSelectedOnly === true) {
    const sel: string[] = Array.isArray((filters as any).selectedIds)
      ? ((filters as any).selectedIds as string[])
      : [];
    if (sel.length > 0) {
      const setSel = new Set(sel.map((s) => String(s)));
      items = items.filter((it: any) => setSel.has(String(it.id)));
    } else {
      // 선택이 없으면 결과를 비움
      items = [];
    }
  }
  // 지도 표시용 전체 결과(슬라이스 전)
  let mapItems: any[] | undefined = undefined;
  // 🔎 클라이언트 보정: contains 검색 (case_number, road_address)
  if (
    typeof filters.searchQuery === "string" &&
    filters.searchQuery.trim() &&
    items.length > 0
  ) {
    const q = filters.searchQuery.trim().toLowerCase();
    const field = filters.searchField || "all";
    items = items.filter((it: any) => {
      const inCase = String(it.case_number || "")
        .toLowerCase()
        .includes(q);
      const inAddr = String(it.road_address || "")
        .toLowerCase()
        .includes(q);
      if (field === "case_number") return inCase;
      if (field === "road_address") return inAddr;
      return inCase || inAddr;
    });
  }
  let originalTotalCount =
    (resp as any)?.total_items ??
    (resp as any)?.totalItems ??
    (resp as any)?.total ??
    (resp as any)?.count ??
    0;

  // 🎯 클라이언트 사이드 층확인 필터링 (백엔드 미지원으로)
  if (
    filters.floorConfirmation &&
    filters.floorConfirmation !== "all" &&
    items.length > 0
  ) {
    console.log(
      "🔍 [Debug] 층확인 클라이언트 필터 적용:",
      filters.floorConfirmation
    );
    console.log("🔍 [Debug] 필터링 전 아이템 수:", items.length);

    const wanted = Array.isArray(filters.floorConfirmation)
      ? new Set(filters.floorConfirmation)
      : new Set([filters.floorConfirmation]);
    items = items.filter((item: any) => {
      const v = item.floor_confirmation;
      // 값 누락/확인불가는 항상 포함
      if (v === undefined || v === null || String(v).trim() === "") {
        return true;
      }
      return wanted.has(v);
    });

    console.log("🔍 [Debug] 필터링 후 아이템 수:", items.length);
  }

  // 🎯 클라이언트 사이드 엘리베이터 필터링 (백엔드 필터링 미작동으로)
  if (
    filters.hasElevator &&
    filters.hasElevator !== "all" &&
    items.length > 0
  ) {
    console.log(
      "🔍 [Debug] 엘리베이터 클라이언트 필터 적용:",
      filters.hasElevator
    );
    console.log("🔍 [Debug] 필터링 전 아이템 수:", items.length);

    const prefs = Array.isArray(filters.hasElevator)
      ? filters.hasElevator
      : [filters.hasElevator];
    const wantYes = prefs.some((p) => p === "있음" || p === "Y");
    const wantNo = prefs.some((p) => p === "없음" || p === "N");

    items = items.filter((item: any) => {
      const elevatorValue = item.elevator_available;
      const hasElevator = elevatorValue === "O" || elevatorValue === "Y";
      const noElevator = elevatorValue === "X" || elevatorValue === "N";
      // 확인불가/누락 데이터는 항상 포함 (배제하지 않음)
      const unknown = !hasElevator && !noElevator;
      if (unknown) return true;
      if (wantYes && wantNo) return true; // 둘 다 선택 시 모두 허용
      if (wantYes) return hasElevator;
      if (wantNo) return noElevator;
      return true;
    });

    console.log("🔍 [Debug] 엘리베이터 필터링 후 아이템 수:", items.length);
  }

  // 🚨 핵심 수정: 정렬 로직 단순화
  // 정렬이 활성화되면 무조건 클라이언트에서 정렬 (전역 정렬 보장)
  if (filters.sortBy && filters.sortOrder && items.length > 1) {
    console.log(
      `🔄 [Sort] 클라이언트 전역 정렬 적용: ${filters.sortBy} ${filters.sortOrder} (${items.length}건 데이터)`
    );
    items = clientSideSort(items, filters.sortBy, filters.sortOrder);
    console.log(
      `✅ [Sort] 전역 정렬 완료: ${filters.sortBy} ${filters.sortOrder}`
    );
  }

  // 🏢 데이터 분석: usage 및 층확인 컬럼의 모든 unique 값들 확인 (동적 필터 옵션 생성용)
  const usageValues: string[] =
    items.length > 0
      ? Array.from(new Set(items.map((item: any) => String(item.usage || ""))))
      : [];
  const floorValues: string[] =
    items.length > 0
      ? Array.from(
          new Set(
            items.map((item: any) => String(item.floor_confirmation || ""))
          )
        )
      : [];

  // 🌍 토지면적(land_area_pyeong) 클라이언트 사이드 필터링
  if (isLandAreaFilteredInUseItems && items.length > 0) {
    const [minLand, maxLand] = filters.landAreaRange;
    items = items.filter((item: any) => {
      const v = parseFloat(item.land_area_pyeong) || 0;
      const geMin = minLand ? v >= minLand : true;
      const leMax = maxLand ? v <= maxLand : true;
      return geMin && leMax;
    });
  }

  // 📅 매각기일 클라이언트 사이드 필터링 (sale_date 또는 sale_month 기반)
  if (isAuctionDateFilteredInUseItems && items.length > 0) {
    const fromStr: string | undefined = (filters as any).auctionDateFrom;
    const toStr: string | undefined = (filters as any).auctionDateTo;
    const fromTs = fromStr ? new Date(fromStr).getTime() : undefined;
    const toTs = toStr ? new Date(toStr).getTime() : undefined;

    items = items.filter((item: any) => {
      let dateTs: number | undefined;
      const saleDate = item.sale_date as string | undefined;
      const saleMonth = item.sale_month as string | undefined; // YYYY-MM

      if (saleDate) {
        const ts = new Date(saleDate).getTime();
        dateTs = isNaN(ts) ? undefined : ts;
      } else if (saleMonth) {
        const ts = new Date(`${saleMonth}-01`).getTime();
        dateTs = isNaN(ts) ? undefined : ts;
      }

      if (dateTs === undefined) return false; // 날짜 없는 항목 제외
      const geFrom = fromTs !== undefined ? dateTs >= fromTs : true;
      const leTo = toTs !== undefined ? dateTs <= toTs : true;
      return geFrom && leTo;
    });
  }

  // 🆕 현재상태 클라이언트 필터링 ("all"은 필터 미적용)
  if (items.length > 0) {
    const cs = (filters as any).currentStatus as string | string[] | undefined;
    if (cs) {
      const selectedRaw = Array.isArray(cs) ? cs : [cs];
      const selected = selectedRaw.filter(
        (s) => String(s).toLowerCase() !== "all"
      );
      if (selected.length > 0) {
        const lowerSelected = selected.map((s) => String(s).toLowerCase());
        console.log("🔎 [StatusFilter] 선택 상태:", selected);
        items = items.filter((it: any) => {
          const v = String(it.current_status || "").toLowerCase();
          // "유찰" 선택 시 "유찰(2회)" 등 부분일치 허용
          return lowerSelected.some((sel) =>
            sel === "유찰" ? v.startsWith("유찰") : v.includes(sel)
          );
        });
        console.log("🔎 [StatusFilter] 적용 후 개수:", items.length);
      }
    }
  }

  // 🆕 특수조건(불리언 플래그) 클라이언트 필터링 - AND 조건
  //     백엔드 불리언 컬럼이 없을 경우 special_rights 문자열로도 OR 매칭하여 보완
  if (items.length > 0) {
    const flags = (filters as any).specialBooleanFlags as string[] | undefined;
    if (Array.isArray(flags) && flags.length > 0) {
      const keyToKo: Record<string, string> = {
        tenant_with_opposing_power: "대항력있는임차인",
        hug_acquisition_condition_change: "hug인수조건변경",
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

      items = items.filter((it: any) => {
        const text = String(it.special_rights || "").toLowerCase();
        return flags.every((key) => {
          const val = (it as any)[key];
          let booleanMatched = false;
          if (typeof val === "boolean") {
            booleanMatched = val === true;
          } else if (val !== undefined && val !== null) {
            const s = String(val).toUpperCase();
            booleanMatched =
              s === "Y" || s === "O" || s === "TRUE" || s === "1";
          }

          const token = (keyToKo[key] || "").toLowerCase();
          const textMatched = token ? text.includes(token) : false;

          // 불리언 true이거나, 문자열에 해당 토큰이 포함되어 있으면 통과
          return booleanMatched || textMatched;
        });
      });
    }
  }

  // 🆕 특수조건(문자열 any-match) 클라이언트 필터링
  if (items.length > 0) {
    const conds = (filters as any).specialConditions as string[] | undefined;
    if (Array.isArray(conds) && conds.length > 0) {
      const tokens = conds.map((c) => String(c).toLowerCase());
      items = items.filter((it: any) => {
        const text = String(it.special_rights || "").toLowerCase();
        return tokens.some((t) => text.includes(t));
      });
    }
  }

  if (items.length > 0) {
    console.log("🔍 [Debug] 실제 데이터 구조:", items[0]);
    console.log("🔍 [Debug] usage 값:", items[0].usage);
    console.log("🔍 [Debug] sale_date 값:", items[0].sale_date);
    console.log("🔍 [Debug] sale_month 값:", items[0].sale_month);
    console.log(
      "🔍 [Debug] floor_confirmation 값:",
      items[0].floor_confirmation
    );
    console.log(
      "🔍 [Debug] elevator_available 값:",
      items[0].elevator_available
    );

    console.log("🔍 [Debug] usage 고유값들:", usageValues);
    console.log("🔍 [Debug] floor_confirmation 고유값들:", floorValues);
    console.log(
      "🏢 [Debug] 동적 건물 유형 옵션 생성을 위한 usage 값들:",
      usageValues
    );
  }

  // 🎯 핵심 수정: 클라이언트 처리 후 총 개수 재계산 및 페이지네이션
  let actualTotalCount = originalTotalCount;

  if (needsClientProcessing) {
    // 클라이언트 처리가 적용된 경우, 실제 처리된 개수로 업데이트
    actualTotalCount = items.length;
    // 지도에는 페이지 슬라이싱 전 전체를 사용 (상한 2000)
    mapItems = items.slice(0, 2000);
    console.log(
      `🔄 [Client] 클라이언트 처리 적용됨 - 총 개수 업데이트: ${originalTotalCount} → ${actualTotalCount}`
    );

    // 🎯 클라이언트 처리 후 페이지네이션 재적용 (전역 정렬 보장)
    const pageSize = filters.size ?? 20;
    const currentPage = filters.page ?? 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    console.log(
      `📄 [Pagination] 클라이언트 페이지네이션 적용: ${currentPage}페이지 (${
        startIndex + 1
      }-${Math.min(endIndex, items.length)}/${items.length})`
    );

    items = items.slice(startIndex, endIndex);
  }
  // 서버 처리 모드에서는 지도도 현재 페이지 데이터를 그대로 사용
  if (!mapItems) mapItems = items;

  // 🔍 페이지네이션 관련 서버 응답 로그
  console.log(
    `🔍 [Debug] 📊 최종 결과: ${
      items.length
    }개 아이템, 총 ${actualTotalCount}개 데이터 ${
      needsClientProcessing ? "(클라이언트 처리 적용)" : "(서버 데이터)"
    }`
  );

  return {
    items,
    isLoading,
    error,
    totalCount: actualTotalCount,
    baseTotalCount: originalTotalCount,
    mapItems,
    usageValues, // 🏢 동적 건물 유형 필터 옵션 생성용
    floorValues, // 🏢 동적 층확인 필터 옵션 생성용
    refetch: () => {
      void mutate();
    },
    isRefreshing: isValidating,
  };
}
