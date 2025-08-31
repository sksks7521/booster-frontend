// Dataset schema contract: columns definitions (externalized for easy changes)

export const columnsAuctionEd = [
  // 기본 정보
  { key: "usage", header: "용도" },
  { key: "caseNumber", header: "사건번호" },
  { key: "currentStatus", header: "현재상태" },
  { key: "saleDate", header: "매각기일" },

  // 주소/위치 정보
  { key: "roadAddress", header: "도로명주소" },
  { key: "addressArea", header: "주소(구역)" },
  { key: "addressCity", header: "주소(시군구)" },
  { key: "locationDetail", header: "소재지(동)" },
  { key: "buildingName", header: "소재지(주택이름)" },
  { key: "generalLocation", header: "소재지" },
  { key: "sido", header: "시도" },
  { key: "eupMyeonDong", header: "읍면동" },

  // 경매 가격 정보
  { key: "appraisedValue", header: "감정가(만원)" },
  { key: "minimumBidPrice", header: "최저가(만원)" },
  { key: "bidToAppraisedRatio", header: "최저가/감정가(%)" },
  { key: "finalSalePrice", header: "매각가(만원)" },
  { key: "saleToAppraisedRatio", header: "매각가/감정가(%)" },
  { key: "bidderCount", header: "응찰인원(명)" },

  // 면적 정보
  { key: "buildingAreaPyeong", header: "건물평형(평)" },
  { key: "landAreaPyeong", header: "토지평형(평)" },
  { key: "landAreaSqm", header: "대지면적(㎡)" },
  { key: "constructionAreaSqm", header: "건축면적(㎡)" },
  { key: "totalFloorAreaSqm", header: "연면적(㎡)" },

  // 건물 상세 정보
  { key: "buildingCoverageRatio", header: "건폐율(%)" },
  { key: "floorAreaRatio", header: "용적률(%)" },
  { key: "mainStructure", header: "주구조" },
  { key: "mainUsage", header: "주용도" },
  { key: "otherUsage", header: "기타용도" },
  { key: "buildingHeight", header: "높이" },
  { key: "groundFloors", header: "지상층수" },
  { key: "basementFloors", header: "지하층수" },
  { key: "constructionYear", header: "건축연도" },
  { key: "usageApprovalDate", header: "사용승인일" },

  // 층수/편의시설
  { key: "floorInfo", header: "층수" },
  { key: "floorConfirmation", header: "층확인" },
  { key: "elevatorAvailable", header: "엘리베이터 여부" },
  { key: "elevatorCount", header: "승용승강기(대)" },
  { key: "householdCount", header: "세대수" },

  // 법적 권리/특이사항
  { key: "specialRights", header: "특수권리" },

  // 코드/식별 정보
  { key: "postalCode", header: "우편번호" },
  { key: "pnu", header: "PNU" },

  // 좌표 정보
  { key: "latitude", header: "위도" },
  { key: "longitude", header: "경도" },
] as const;

export const columnsSale = [
  // ✅ 현재 백엔드가 제공하는 10개 필드 (2025-01-31 기준)
  { key: "id", header: "ID" },
  { key: "sido", header: "광역시도" },
  { key: "sigungu", header: "시군구" },
  { key: "roadAddressReal", header: "도로명주소" },
  { key: "buildingNameReal", header: "건물명" },
  { key: "exclusiveAreaSqm", header: "전용면적(㎡)" },
  { key: "contractYear", header: "계약연도" },
  { key: "contractMonth", header: "계약월" },
  { key: "transactionAmount", header: "거래금액(만원)" },
  { key: "pricePerPyeong", header: "평단가(만원)" },

  // ⏳ 백엔드 확장 예정 필드들 (향후 백엔드 업데이트 시 자동 표시)
  // 기본 메타
  { key: "createdAt", header: "등록일시" },

  // 면적/계약 상세
  { key: "exclusiveAreaRange", header: "전용면적범위" },
  { key: "landRightsAreaSqm", header: "대지권면적(㎡)" },
  { key: "contractDay", header: "계약일" },
  { key: "contractDate", header: "계약일" },

  // 건물/연식
  { key: "floorInfoReal", header: "층" },
  { key: "constructionYearReal", header: "건축연도" },
  { key: "constructionYearRange", header: "건축연도범위" },

  // 거래 유형
  { key: "transactionType", header: "거래유형" },
  { key: "buyerType", header: "매수자" },
  { key: "sellerType", header: "매도자" },

  // 좌표
  { key: "longitude", header: "경도" },
  { key: "latitude", header: "위도" },

  // 추가 주소/행정
  { key: "roadAddress", header: "도로명주소" },
  { key: "sidoAdmin", header: "시도" },
  { key: "buildingRegistryPk", header: "건축물대장PK" },
  { key: "adminCode", header: "행정코드" },
  { key: "legalCode", header: "법정코드" },
  { key: "jibunAddress", header: "지번주소" },
  { key: "postalCode", header: "우편번호" },
  { key: "pnu", header: "PNU" },
  { key: "buildingName", header: "건물명" },
  { key: "dongName", header: "동명" },
  { key: "legalDongUnit", header: "법정동단위" },
  { key: "adminDongName", header: "행정동명칭" },
  { key: "adminDong", header: "행정동" },

  // 건축물 상세
  { key: "landAreaSqm", header: "대지면적(㎡)" },
  { key: "constructionAreaSqm", header: "건축면적(㎡)" },
  { key: "totalFloorAreaSqm", header: "연면적(㎡)" },
  { key: "buildingCoverageRatio", header: "건폐율(%)" },
  { key: "floorAreaRatio", header: "용적률(%)" },
  { key: "mainStructure", header: "주구조" },
  { key: "mainUsage", header: "주용도" },
  { key: "otherUsage", header: "기타용도" },
  { key: "buildingHeight", header: "높이" },
  { key: "groundFloors", header: "지상층수" },
  { key: "basementFloors", header: "지하층수" },
  { key: "householdCount", header: "세대수" },
  { key: "familyCount", header: "가구수" },
  { key: "roomNumber", header: "호수" },
  { key: "usageApprovalDate", header: "사용승인일" },
  { key: "elevatorCount", header: "승용승강기(대)" },
  { key: "constructionYear", header: "건축연도(추가)" },
  { key: "floorConfirmation", header: "층확인" },
  { key: "elevatorAvailable", header: "엘리베이터여부" },

  // 계산 필드
  { key: "exclusiveAreaPyeong", header: "전용면적(평)" },
  { key: "pricePerSqm", header: "㎡당가격(만원)" },
] as const;

export const columnsRent = [
  // 기본 키/메타
  { key: "id", header: "ID" },
  { key: "createdAt", header: "등록일시" },

  // 실거래 기본 정보
  { key: "sido", header: "광역시도" },
  { key: "sigungu", header: "시군구" },
  { key: "roadAddressReal", header: "도로명주소" },
  { key: "buildingNameReal", header: "건물명" },
  { key: "constructionYearReal", header: "건축연도" },
  { key: "exclusiveAreaSqm", header: "전용면적(㎡)" },

  // 전월세 구분/계약 정보(핵심)
  { key: "rentType", header: "전월세구분" },
  { key: "contractType", header: "계약구분" },
  { key: "contractYear", header: "계약연도" },
  { key: "contractMonth", header: "계약월" },
  { key: "contractDay", header: "계약일" },
  { key: "contractDate", header: "계약일" },
  { key: "floorInfoReal", header: "층" },

  // 계약 기간 상세
  { key: "contractPeriod", header: "계약기간" },
  { key: "contractStartDate", header: "계약시작일" },
  { key: "contractEndDate", header: "계약종료일" },
  { key: "contractPeriodYears", header: "계약기간(년)" },

  // 금액(핵심)
  { key: "depositAmount", header: "보증금(만원)" },
  { key: "monthlyRent", header: "월세금(만원)" },

  // 갱신 비교
  { key: "previousDeposit", header: "종전계약보증금(만원)" },
  { key: "previousMonthlyRent", header: "종전계약월세금(만원)" },
  { key: "depositChangeAmount", header: "보증금갱신차이(만원)" },
  { key: "rentChangeAmount", header: "월세금갱신차이(만원)" },
  { key: "depositChangeRatio", header: "보증금갱신차이(%)" },
  { key: "rentChangeRatio", header: "월세금갱신차이(%)" },

  // 전월세 전환
  { key: "jeonseConversionAmount", header: "전월세전환금(만원)" },

  // 주소/좌표/행정
  { key: "roadAddress", header: "도로명주소" },
  { key: "sidoAdmin", header: "시도" },
  { key: "latitude", header: "위도" },
  { key: "longitude", header: "경도" },
  { key: "buildingRegistryPk", header: "건축물대장PK" },
  { key: "adminCode", header: "행정코드" },
  { key: "legalCode", header: "법정코드" },
  { key: "jibunAddress", header: "지번주소" },
  { key: "legalDongUnit", header: "법정동단위" },
  { key: "adminDongName", header: "행정동명칭" },
  { key: "postalCode", header: "우편번호" },
  { key: "pnu", header: "PNU" },
  { key: "buildingName", header: "건물명" },
  { key: "dongName", header: "동명" },

  // 건축물 상세/편의
  { key: "landAreaSqm", header: "대지면적(㎡)" },
  { key: "constructionAreaSqm", header: "건축면적(㎡)" },
  { key: "totalFloorAreaSqm", header: "연면적(㎡)" },
  { key: "buildingCoverageRatio", header: "건폐율(%)" },
  { key: "floorAreaRatio", header: "용적률(%)" },
  { key: "mainStructure", header: "주구조" },
  { key: "mainUsage", header: "주용도" },
  { key: "otherUsage", header: "기타용도" },
  { key: "buildingHeight", header: "높이" },
  { key: "groundFloors", header: "지상층수" },
  { key: "basementFloors", header: "지하층수" },
  { key: "householdCount", header: "세대수" },
  { key: "familyCount", header: "가구수" },
  { key: "roomNumber", header: "호수" },
  { key: "usageApprovalDate", header: "사용승인일" },
  { key: "elevatorCount", header: "승용승강기(대)" },
  { key: "floorConfirmation", header: "층확인" },
  { key: "elevatorAvailable", header: "엘리베이터여부" },
  { key: "adminDong", header: "행정동" },

  // 계산된 필드
  { key: "exclusiveAreaPyeong", header: "전용면적(평)" },
  { key: "depositPerPyeong", header: "평당보증금(만원)" },
  { key: "monthlyRentPerPyeong", header: "평당월세(만원)" },
  { key: "rentalYieldMonthly", header: "월임대수익률(%)" },
  { key: "rentalYieldAnnual", header: "연임대수익률(%)" },
] as const;

export const columnsListings = [
  { key: "address", header: "주소" },
  { key: "price", header: "가격(만원)" },
];
