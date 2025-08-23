# Kakao Map 가이드 핵심 노트 (마커/레전드/팝업)

- SDK 로딩: `autoload=false` + `kakao.maps.load(cb)` 사용. 스크립트는 `//dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false`.
- 지도 생성: `new kakao.maps.Map(container, { center: new kakao.maps.LatLng(lat, lng), level })`.
- 마커: `new kakao.maps.Marker({ position, image? })` 후 `marker.setMap(map)`.
- 팝업(정보창): 단순 HTML은 `kakao.maps.InfoWindow`; 커스텀 UI는 `kakao.maps.CustomOverlay` 권장.
- 레전드: 내장 기능 없음 → 상단/하단 고정 HTML + CSS로 별도 구현(토글/필터와 연계).
- 이벤트: `kakao.maps.event.addListener(target, 'click', handler)` 등.
- 클러스터링: SDK 파라미터에 `libraries=clusterer` 추가 후 `new kakao.maps.MarkerClusterer({...})`.
- 리사이즈/전체화면: 컨테이너 변경 후 `map.relayout()` + 기존 `center` 복원.
- 성능: 대량 마커 시 클러스터링/샘플링, 이동/줌 이벤트 디바운스(예: 150~300ms).
- 접근성: 팝업 내부 포커스 트랩/키보드 닫기(Escape) 처리.
