## 스키마 추가 가이드 (새 데이터셋 팝업 연동)

### 1) 파일 생성
- 경로 예시: `Application/components/map/popup/schemas/<dataset>.ts`
- 내보내는 함수 형태 예시:

```ts
import { PopupRow } from "../BasePopup";

export function <dataset>Schema(item: any): {
  title: string;
  subtitle: string;
  rows: PopupRow[];
  actions: { label: string; action: string; value?: string }[];
} {
  const title = "...";
  const subtitle = "...";
  const rows: PopupRow[] = [
    { label: "라벨", value: String(item?.field ?? item?.extra?.camelCaseField ?? "-") },
  ];
  const actions = [
    { label: "주소 복사", action: "copy-addr", value: item?.road_address ?? item?.extra?.roadAddress ?? "" },
  ];
  return { title, subtitle, rows, actions };
}
```

### 2) 필드 매핑 전략
- 백엔드 응답의 `snake_case`와 프론트 가공 데이터 `extra.camelCase` 모두 지원
- 금액/퍼센트/불리언 등은 공통 포맷터 사용 권장(예: `formatMoney`, `formatPercent`, `yesNo`)
- 길이 가능성이 큰 텍스트(주소/특수조건)는 값 그대로 넘겨도 BasePopup에서 줄바꿈 처리

### 3) MapView 통합
- `Application/components/features/map-view.tsx`의 팝업 빌더에서 `namespace`로 스키마 선택
- 예: `namespace === "auction_ed" ? auctionSchema(it) : analysisSchema(it)`
- 새 데이터셋 추가 시 분기 추가 또는 레지스트리 패턴으로 확장 가능

### 4) 검증 체크리스트
- 시각: 폰트/간격/크기 분석 팝업과 동일한가?
- 데이터: 라벨/순서/값이 기획과 일치하는가?
- 동작: 주소/사건번호 복사, 닫기/상세보기 정상 동작하는가?
- 텍스트: 긴 특수조건/소재지가 줄바꿈되어 넘치지 않는가?
- 성능: 다수 마커에서 팝업 열고 닫을 때 프리즈 없는가?

### 5) 예시 참조
- 경매: `schemas/auction.ts`
- 분석: `schemas/analysis.ts`
- 공통 렌더러: `popup/BasePopup.ts`


