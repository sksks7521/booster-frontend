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
  // 사용자 선택 컬럼 (36개) - 2025-10-03 수정
  { key: "sido", header: "광역시도" },
  { key: "sigungu", header: "시군구" },
  { key: "roadAddressReal", header: "도로명주소" },
  { key: "jibunAddress", header: "지번주소" },
  { key: "adminDong", header: "행정동" },
  { key: "legalDongUnit", header: "법정동단위" },
  { key: "buildingNameReal", header: "건물명" },
  { key: "dongName", header: "동명" },
  { key: "transactionAmount", header: "거래금액(만원)" },
  { key: "pricePerPyeong", header: "평단가(만원/평)" },
  { key: "contractDate", header: "계약일자" },
  { key: "transactionType", header: "거래유형" },
  { key: "buyerType", header: "매수자유형" },
  { key: "sellerType", header: "매도자유형" },
  { key: "exclusiveAreaSqm", header: "전용면적(㎡)" },
  { key: "landRightsAreaSqm", header: "대지권면적(㎡)" },
  { key: "constructionYearReal", header: "건축연도" },
  { key: "floorInfoReal", header: "층정보" },
  { key: "floorConfirmation", header: "층확인" },
  { key: "elevatorAvailable", header: "엘리베이터유무" },
  { key: "elevatorCount", header: "엘리베이터대수" },
  { key: "postalCode", header: "우편번호" },
  { key: "landAreaSqm", header: "토지면적(㎡)" },
  { key: "constructionAreaSqm", header: "건축면적(㎡)" },
  { key: "totalFloorAreaSqm", header: "연면적(㎡)" },
  { key: "buildingHeight", header: "건물높이(m)" },
  { key: "groundFloors", header: "지상층수" },
  { key: "basementFloors", header: "지하층수" },
  { key: "buildingCoverageRatio", header: "건폐율(%)" },
  { key: "floorAreaRatio", header: "용적률(%)" },
  { key: "mainStructure", header: "주구조" },
  { key: "mainUsage", header: "주용도" },
  { key: "otherUsage", header: "기타용도" },
  { key: "householdCount", header: "세대수" },
  { key: "familyCount", header: "가구수" },
  { key: "roomNumber", header: "호수" },
] as const;

export const columnsRent = [
  // 주소/식별
  { key: "roadAddressReal", header: "도로명주소" },
  { key: "jibunAddress", header: "지번주소" },
  { key: "buildingNameReal", header: "건물명" },
  { key: "dongName", header: "동명" },

  // 계약/구분/핵심 치수
  { key: "contractDate", header: "계약일자" },
  { key: "rentType", header: "전월세구분" },
  { key: "exclusiveAreaSqm", header: "전용면적(㎡)" },
  { key: "contractPeriodYears", header: "계약기간(년)" },

  // 금액 및 전환/평당
  { key: "depositAmount", header: "보증금(만원)" },
  { key: "depositPerPyeong", header: "평당보증금(만원)" },
  { key: "monthlyRent", header: "월세금(만원)" },
  { key: "monthlyRentPerPyeong", header: "평당월세(만원)" },
  { key: "jeonseConversionAmount", header: "전월세전환금(만원)" },

  // 갱신 비교(순서 고정: 금액 → 비율)
  { key: "previousDeposit", header: "종전계약보증금" },
  { key: "depositChangeAmount", header: "보증금갱신차이(만원)" },
  { key: "depositChangeRatio", header: "보증금갱신차이(%)" },
  { key: "previousMonthlyRent", header: "종전계약월세금" },
  { key: "rentChangeAmount", header: "월세금갱신차이(만원)" },
  { key: "rentChangeRatio", header: "월세금갱신차이(%)" },

  // 수익률
  { key: "rentalYieldMonthly", header: "월임대수익률(%)" },
  { key: "rentalYieldAnnual", header: "연임대수익률(%)" },

  // 건물 개요/편의
  { key: "constructionYearReal", header: "건축연도" },
  { key: "floorInfoReal", header: "층정보" },
  { key: "floorConfirmation", header: "층확인" },
  { key: "elevatorCount", header: "엘리베이터개수" },

  // 면적/비율/구조
  { key: "landAreaSqm", header: "토지면적(㎡)" },
  { key: "constructionAreaSqm", header: "건축면적(㎡)" },
  { key: "totalFloorAreaSqm", header: "연면적(㎡)" },
  { key: "buildingHeight", header: "건물높이(m)" },
  { key: "groundFloors", header: "지상층수" },
  { key: "basementFloors", header: "지하층수" },
  { key: "buildingCoverageRatio", header: "건폐율(%)" },
  { key: "floorAreaRatio", header: "용적률(%)" },
  { key: "mainStructure", header: "주구조" },
  { key: "mainUsage", header: "주용도" },
  { key: "otherUsage", header: "기타용도" },

  // 세대/가구/호수
  { key: "householdCount", header: "세대수" },
  { key: "familyCount", header: "가구수" },
  { key: "roomNumber", header: "호수" },
] as const;

export const columnsListings = [
  { key: "address", header: "주소" },
  { key: "price", header: "가격(만원)" },
];
