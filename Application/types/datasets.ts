// 데이터셋 공통 타입 정의 (상세 v2)

export type DatasetId = "auction_ed" | "sale" | "rent" | "naver";

// 프론트 공통 테이블/지도에서 소비할 최소 행 형태
export interface ItemLike {
  id: string;
  title?: string;
  address?: string;
  price?: number; // 만원 단위 권장
  area?: number; // ㎡
  buildYear?: number;
  lat?: number;
  lng?: number;
  extra?: Record<string, unknown>;
}

export interface DatasetConfig {
  id: DatasetId;
  title: string;

  api: {
    // 목록용 SWR 키 빌더(배열 키 권장)
    buildListKey: (args: {
      filters: Record<string, unknown>;
      page: number;
      size: number;
    }) => readonly unknown[];
    // 목록 데이터 페처
    fetchList: (args: {
      filters: Record<string, unknown>;
      page: number;
      size: number;
    }) => Promise<any>;

    // 지도용(선택)
    buildMapKey?: (args: {
      filters: Record<string, unknown>;
      bounds?: { south: number; west: number; north: number; east: number };
    }) => readonly unknown[];
    fetchMap?: (args: {
      filters: Record<string, unknown>;
      bounds?: { south: number; west: number; north: number; east: number };
    }) => Promise<any>;
  };

  // 응답 → 공통 ItemLike 매핑기
  adapter: {
    toItemLike: (row: any) => ItemLike;
    toMapPoint?: (row: any) => {
      id: string;
      lat: number;
      lng: number;
      extra?: any;
    };
  };

  // 표 컬럼(간단 정의 - 실제 렌더러 연결은 후속 단계에서 적용)
  table: {
    columns: Array<{
      key: string;
      header: string;
      width?: number | string;
      // 표 컴포넌트 확장 시 사용 예정
    }>;
    defaultSort?: { key?: string; order?: "asc" | "desc" };
  };

  // 필터 프리셋(후속 단계에서 FilterControl에 주입)
  filters: {
    defaults: Record<string, unknown>;
    ui: Array<Record<string, unknown>>; // 구체 스키마는 이후 확장
  };

  // 지도 프리셋(선택)
  map?: {
    legend?: Array<{ label: string; color: string }>;
    marker?: (row: ItemLike) => { color: string; size?: number };
    useClustering?: boolean;
  };
}
