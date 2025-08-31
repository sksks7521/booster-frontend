# [프론트엔드→백엔드] 상세 분석 v2 데이터셋 API 통합 계약 요청서 (완료) (2025-08-28)

## 개요

- 프론트 표준화 요청(250827)에 대한 백엔드 이행을 완료했습니다.
- 대상 데이터셋: `auction-completed`, `real-transactions`, `real-rents` (참고: `auction-items`는 현행 유지), `naver-products`는 별도 스펙 합의 후 진행 예정.

## 이행 내역(T0/T1-1)

- 페이징/alias: `page/size` + `limit`(alias), 응답 `pages`(alias)
- 전역 에러 포맷: `{message, status, detail}` 통일 (`app/main.py` 전역 예외 처리)
- simple 공통 키 매핑: `address, lat, lng, area(㎡), build_year, price`
  - real-rents: `price = deposit + monthly*100`(`k=100`), `price_basis=deposit_plus_monthly`
  - auction-completed: `area=평→㎡` 1자리 반올림, `price_basis=final_sale_price`
- 정렬/지오필터(T1-1): `sort_by / sort_order`, BBOX(`south,west,north,east`), 반경(`lat,lng,radius_km` or `lat_center,lng_center,radius_km`)
- `/columns` 응답에 `sortable_columns: string[]` 힌트 추가(3개 엔드포인트)
- 스모크 스크립트: `scripts/smoke_geo_sort.ps1`, CI 래퍼 `scripts/smoke_ci.ps1`
- OpenAPI 아티팩트: `Communication/Frontend/send/Artifacts/openapi_v1_2025-08-28.json`

## 참고 링크

- 프론트 공지: `Communication/Frontend/send/Request/250828_Backend_to_Frontend_OpenAPI_v1_배포_공지.md`
- 통합 가이드: `Doc/FRONTEND_INTEGRATION_GUIDE_v2.0.md`
- 런북: `Doc/Runbooks/DB_Rebuild_Runbook.md` (OpenAPI/SDK/CI 섹션 포함)
- 일일 로그: `Log/250828.md`

## 남은 항목

- `/api/v1/naver-products/` 스펙 합의 및 파이프라인 구축(보류 후 별도 진행)

— Backend Team, 2025-08-28
