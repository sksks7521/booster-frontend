[Response] Auction_ing 지도 사양 회신 (Leaflet → Kakao 전환 기준)

- 발신: Pipeline Team
- 수신: Frontend Team
- 날짜: 2025-08-23
- 버전: v1.0

## 중요 : 참고자료 : C:\Users\USER\OneDrive\사업\부동산부스터\Web_Application\booster-frontend\Doc\Reference\visualizer_auction_ing.py를 토대로 작성하였음. 이를 반드시 읽을 것.

### 1) 마커 사양

- **형태(Shape)**: 네모(정사각형) 배경에 4px 라운드가 적용된 배지 형태, 중앙에 2자리 숫자 텍스트가 표시됩니다.

  - Leaflet 구현: `divIcon`을 사용하여 HTML 요소로 렌더링
  - 시각적 정의(현재 코드 기준):
    ```html
    <div
      style="background-color:{색상}; color:white; border-radius:4px; padding:4px; text-align:center; width:25px; height:25px; line-height:25px;"
    >
      {텍스트}
    </div>
    ```

- **크기/타이포그래피**: 25×25px 고정 크기, 가운데 정렬 텍스트, 줄 높이 25px로 수직 중앙 정렬, 글자색은 흰색.

  - 폰트 크기는 명시 지정 없으며 브라우저 기본값(약 12~14px 범위)을 사용
  - 확대/축소와 무관하게 크기는 화면 픽셀 기준으로 고정(줌에 따라 크기 변화 없음)

- **색상 규칙(근거 포함)**: 마커 색은 상태가 아니라 "최저가(만원)" 절대 금액 구간으로 결정됩니다.

  - 기본 Threshold: t1=6000, t2=8000, t3=10000, t4=13000 (만원)
  - 구간→색상 매핑: ≤t1 파랑(blue) / ≤t2 초록(green) / ≤t3 분홍(pink) / ≤t4 주황(orange) / >t4 빨강(red)
  - 예외: 최저가가 없거나 0이면 회색(grey)
  - 선택 이유: 상태(`현재상태`)는 필터/팝업으로 충분히 구분 가능한 반면, 지도상 한눈에 가격대 분포를 읽는 것이 우선 과제라 절대금액 기반 색상 스케일을 채택

- **텍스트(라벨) 규칙(근거 포함)**: 네모박스 텍스트는 `최저가/감정가(%)`를 10% 단위 버킷으로 라운딩 없이 구간 레이블만 표기합니다.

  - 매핑: 0~9 → "00", 10~19 → "10", …, 90~99 → "90", 100 이상 → "100"
  - 해석: 예시로 "40"은 40~49% 구간을 의미합니다(실수 퍼센트를 반올림하지 않고 구간 대표값만 노출)
  - 선택 이유: 2자리 고정 표기로 작은 마커 내에서도 가독성과 비교 가능성 확보

- **앵커/배치**: `iconSize`가 25×25로 지정되어 있고 `iconAnchor` 미지정이므로 중심(anchor=center) 기준으로 좌표에 배치됩니다.

  - 마커 z-index/정렬은 기본값을 사용(추가적인 쌓임 순서 제어 없음)

- **인터랙션(행동)**: 클릭 시 해당 물건의 상세 정보를 담은 팝업이 열립니다. 호버 전용 강조 효과는 없습니다.

  - 선택 상태 유지, 스타일 변경 등은 별도 적용하지 않으며 팝업 오픈으로 피드백 제공

- **중첩/충돌 처리**: 현 버전은 클러스터링/충돌 회피를 사용하지 않아 고밀도 영역에서 마커가 겹칠 수 있습니다.

  - Kakao 전환 시 `MarkerClusterer` 도입 권장(기본안: 줌 ≤ 9 병합, 10~12 부분, ≥13 개별; 수량 라벨 노출)

- **상태와의 관계**: 데이터 필드 `현재상태`는 색상/텍스트에 직접 반영되지 않습니다.

  - 상태는 필터 패널로 제어되고, 팝업 필드로 상세 확인 가능

- **결측/이상치 처리**:

  - `최저가(만원)`이 비어있거나 0이면 색상은 회색(grey)
  - `최저가/감정가(%)`가 비어있으면 텍스트는 "--"로 표기

- **확대/축소 동작**: 마커 크기는 고정이며 줌 변화에 따라 픽셀 크기가 변하지 않습니다. 줌 인 시 상대적으로 넓어보이고, 줌 아웃 시 밀집되어 보일 수 있습니다.

- **Kakao 전환 매핑 가이드(마커)**:
  - Kakao에서는 `CustomOverlay`로 동일한 25×25 정사각형, 4px 라운드, 흰색 텍스트 스타일을 그대로 적용
  - 앵커는 중심 정렬을 유지하고, 클릭 가능 옵션 및 필요 시 `zIndex`만 추가 지정
  - 클러스터링은 `libraries=clusterer`를 사용해 동일 정책을 적용(추후 줌 기준 합의 필요)

### 2) 레전드(범례)

- **목적**: 지도에 표시되는 마커 색상(최저가 구간)과 네모박스 숫자(최저가/감정가 10% 버킷)의 의미를 사용자에게 일관되게 설명합니다.

- **구성 요소**:

  - 제목: "최저가(만원) 범례"
  - 색상 칩 리스트: 5개 구간(≤t1, ≤t2, ≤t3, ≤t4, >t4)을 각각의 색으로 표기
    - 파랑(blue), 초록(green), 분홍(pink), 주황(orange), 빨강(red)
  - 부가 설명: "네모박스 숫자"의 의미(예: 40 → 최저가/감정가 40~49%)

- **표시 규칙(Threshold 연동)**:

  - 기본값: t1=6000, t2=8000, t3=10000, t4=13000 (만원)
  - 사용자가 상단 Threshold 입력값(`threshold_1~4`)을 변경하면 레전드가 즉시 재계산되어 반영됩니다.
  - 레전드 갱신 트리거: 필터/Threshold 변경 시 호출되는 `applyFilters()` → 내부에서 `updateLegend(thresholds)` 실행
  - 초기화 버튼 클릭 시 Threshold가 기본값으로 복귀하며 레전드도 동기화됩니다.

- **위치/레이아웃**:

  - DOM: `#legend-container` 요소, 클래스 `legend` 적용
  - 스타일: `custom.css`에서 정의(오버레이 박스 형태, 지도 위 가독성 보장). 문구 줄바꿈과 소형 색상 칩(`width:12px; height:12px; display:inline-block`) 사용
  - 가시성: 별도 on/off 토글 없음(항상 표시). Filter 패널 열림/닫힘과 무관하게 독립 표시

- **색/텍스트 정책**:

  - 범례 색상은 마커 배경색과 1:1로 매핑(동일 팔레트)
  - 색각 이상 사용자 고려: 각 구간 라벨에 수치(≤ t1, ≤ t2 … > t4)를 함께 표기하여 색상 의존도를 낮춤
  - 회색(grey)은 데이터 결측/0원 케이스에 한해 마커에만 사용(범례에는 기본적으로 포함하지 않음)

- **예시 출력(HTML 스니펫)**:

  ```html
  <b>최저가(만원) 범례</b><br />
  <i
    style="background: blue; width:12px; height:12px; display:inline-block;"
  ></i>
  ≤ 6000<br />
  <i
    style="background: green; width:12px; height:12px; display:inline-block;"
  ></i>
  ≤ 8000<br />
  <i
    style="background: pink; width:12px; height:12px; display:inline-block;"
  ></i>
  ≤ 10000<br />
  <i
    style="background: orange; width:12px; height:12px; display:inline-block;"
  ></i>
  ≤ 13000<br />
  <i
    style="background: red; width:12px; height:12px; display:inline-block;"
  ></i>
  > 13000
  <hr style="margin:3px 0;" />
  <b>네모박스 숫자</b><br />
  예) <strong>40</strong> → 최저가/감정가 40~49%
  ```

- **Kakao 전환 매핑 가이드(레전드)**:

  - Kakao 지도 DOM 오버레이 또는 페이지 고정 레이어로 `legend-container`에 해당하는 엘리먼트를 렌더
  - 색상 팔레트/수치 표기/부가 설명 문구를 동일하게 유지
  - Threshold 입력값을 React 상태로 관리 시, 변경될 때마다 레전드 컴포넌트가 재렌더되어 동일한 문자열을 출력하도록 매핑

- **검증 포인트**:
  - Threshold가 비내림차순(t1 ≤ t2 ≤ t3 ≤ t4)인지 입력 시 검증 및 사용자 안내(현재 구현은 알림창으로 안내)
  - 모바일 화면 폭에서 줄바꿈/스크롤 가독성 확보(폰트 크기, 행 간격 CSS 조정 권장)

### 3) 팝업/툴팁

- **목적**: 마커 클릭 시 해당 물건의 핵심 속성을 표 형태로 빠르게 파악할 수 있도록 제공합니다.

- **트리거/닫힘/유지 정책**:

  - 트리거: 마커 클릭 시 즉시 오픈
  - 닫힘: 지도 배경 클릭 시 닫힘(Leaflet 기본 `closePopupOnClick=true` 동작)
  - 동시성: 기본적으로 단일 팝업 유지(새 팝업 오픈 시 기존 팝업 닫힘)
  - 리오픈: 동일 마커를 다시 클릭하면 팝업 토글(닫힘/열림)

- **위치/앵커/오토팬**:

  - 앵커: 마커 중심 기준으로 상단에 팝업이 뜨는 Leaflet 기본 앵커 사용
  - 오토팬: 팝업이 화면 밖으로 나갈 경우 지도가 자동으로 이동하여 팝업이 가시 영역에 유지(Leaflet 기본)
  - 오프셋: 추가 오프셋 지정 없음(기본값)

- **레이아웃/스타일**:

  - 컨테이너: 표 기반 2열 레이아웃(좌측 헤더, 우측 값)
  - 스타일: 각 셀에 1px 경계선, 헤더 행 배경 `#f2f2f2`
  - 가독성: 단위(만원/평/%/년) 병기로 수치 의미를 명확화
  - 최대 크기/스크롤: 별도 제한 없음(현재 구현). Kakao 전환 시 모바일 고려해 `max-height`(예: 260px) + `overflow-y: auto` 권장

- **표시 필드 및 포맷 상세**:

  - 용도: 문자열(예: "아파트")
  - 사건: 문자열(예: "2024타경-12345")
  - 소재지: 문자열(도로명 또는 지번 주소)
  - 건물평형: 숫자 + "평" 접미(예: 25평). 소수점 없이 표기
  - 감정가(만원): 숫자 + "만원" 접미(천단위 구분자 미적용)
  - 최저가(만원): 숫자 + "만원" 접미(천단위 구분자 미적용)
  - 최저가/감정가: `percentage` 값 + "%" 접미(예: 60%)
  - 현재상태: 문자열(예: 진행중/유찰/낙찰 등 데이터 원문 그대로)
  - 매각기일: 문자열(예: YYYY-MM-DD)
  - 공시가격: 숫자 + "만원" 접미
  - Elevator 여부: 문자열(Y/N 등 데이터 원문)
  - 층확인: 문자열(예: "5/15")
  - 건축연도: 정수년(`Math.floor` 적용) + "년" 접미(예: 2005년)
  - 최저가/공시가격: 실수(비율) 원문 그대로

- **결측/이상치 처리 규칙**:

  - 값이 `null` 또는 문자열 "null"인 경우 공란 처리(빈 문자열)
  - `건축연도`는 값이 있을 때만 내림하여 표시, 없으면 공란
  - 금액/면적/퍼센트 항목이 비어있으면 단위 기호는 표시하지 않는 것이 바람직(현 Leaflet 구현은 퍼센트에서 공란+기호 조합이 보일 수 있어 Kakao 전환 시 표시 억제 로직 권장)

- **HTML 구조 예시(발췌)**:

  ```html
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <th style="border:1px solid black;background:#f2f2f2;">용도</th>
      <td style="border:1px solid black;">아파트</td>
    </tr>
    <tr>
      <th style="border:1px solid black;background:#f2f2f2;">
        감정가<br />(만원)
      </th>
      <td style="border:1px solid black;">15000만원</td>
    </tr>
    <tr>
      <th style="border:1px solid black;background:#f2f2f2;">최저가/감정가</th>
      <td style="border:1px solid black;">60%</td>
    </tr>
    <!-- ... 생략 ... -->
  </table>
  ```

- **상호작용(접근성 포함)**:

  - 클릭 외 추가 제스처 없음(호버 툴팁 미사용)
  - 테이블 헤더로 필드 의미를 명확히 전달(스크린리더의 셀 헤더 인식에 유리)
  - 링크/상세 페이지 이동 등 2차 액션은 포함하지 않음(요청 시 확장 가능)

- **Kakao 전환 매핑 가이드(팝업)**:
  - 구현 방식: `CustomOverlay` 사용(또는 `InfoWindow`)하여 동일 테이블 마크업을 렌더
  - 열림/닫힘: 마커 클릭 시 오픈, 지도 배경 클릭 시 닫힘 동작을 동일하게 구현
  - 위치/앵커: 마커 중심 상단에 배치, 필요 시 `x,y` 오프셋으로 가시성 보완
  - 최대 크기/스크롤: 모바일을 고려하여 `max-height`와 내부 스크롤을 권장
  - 퍼포먼스: DOM 재사용(오버레이 1개 생성 후 내용만 교체)으로 리플로우 비용 최소화 권장

### 4) 성능/UX 정책

- **본 문서 기본안(확정 값)**

  - 병합 기준: 줌 ≤ 9 병합, 10~12 부분 병합, ≥13 개별 노출
  - 디바운스: 이동/줌 200ms, 입력 300ms, 리사이즈 200ms

- **렌더링/데이터량 정책**

  - 현재: 클러스터링 없이 `divIcon` 마커(N개) 직접 렌더. 필터로 표시 수를 줄이는 전제
  - 체감 기준: ~5k는 원활, 5~10k 경계, >10k 성능 저하 가능(브라우저/디바이스에 따라 변동)
  - Kakao 권장: `MarkerClusterer` 기본 활성화 + 가시 영역(뷰포트) 기준 마커만 유지 렌더(오프스크린은 제거)
  - 필요 시: 줌 레벨별 샘플링(예: 줌<8일 때 군집당 대표 1~3개만 표시) 또는 서버측 타일/페이지네이션 검토

- **클러스터링/중첩 해소**

  - 병합 기준(기본안·확정): 줌 ≤ 9 병합, 10~12 부분 병합, ≥13 개별 노출
  - 라벨: 클러스터 수량(정수) 표기. 클릭 시 확대(기본) 또는 스파이더파이 대안 검토
  - 애니메이션: 모바일에서 축소(애니메이션 off)로 프레임 드랍 방지

- **이벤트 디바운스/스로틀**

  - 이동/줌: `moveend`/`zoomend` 후 200ms 디바운스 → 마커 재계산/요청 최소화
  - 입력/필터: `input` 변경은 300ms 디바운스 → 잦은 재렌더 방지
  - 리사이즈: 200ms 디바운스 후 레이아웃 재계산

- **초기 상태/뷰 설정**

  - 중심: 유효 좌표 평균, 없으면 서울시청(37.5665, 126.9780)
  - 줌: 11(도시권 전반 가시)
  - 컨트롤: 확대/축소 버튼 우하단, 휠/드래그 허용, 더블클릭 확대 허용
  - 센터 표시: 중앙 십자 가이드 유지(정밀 탐색용)

- **인터랙션 UX**

  - 클릭: 팝업 오픈(단일 팝업 정책). 배경 클릭 시 닫힘
  - 호버: 별도 강조 없음(모바일 일관성)
  - 포커스: 키보드 포커스 이동 시 레전드/필터 접근 가능(접근성 고려)

- **필터/Threshold UX**

  - Threshold는 비내림차순 검증(t1 ≤ t2 ≤ t3 ≤ t4). 위반 시 원복 + 안내
  - "초기화" 버튼으로 체크박스 전체 on, Threshold 기본값 복구
  - "모두 선택" 토글은 그룹 단위 상태 반전 → 즉시 필터 적용
  - 필터 변경 시: 레전드 재계산, 표시 마커만 최소 변경(diff 렌더) 권장(전환 시 구현)

- **자원/네트워크**

  - 마커 데이터 공급: `marker_data.js`(window 주입). 파일 크기 증가 시 gzip/브로틀리 압축 권장
  - 이미지/타일: VWorld 키 사용 시 외부 타일 호출. 키 부재 시 기본 타일 사용(성능은 네트워크 품질에 의존)
  - 메모리: 사용 중인 마커 수 기준 5k 이상부터 DOM/GC 비용 상승. Kakao 전환 시 오버레이 재사용 패턴 권장

- **에러/로깅**

  - 좌표 누락 항목은 마커 생성에서 제외(로그 집계). 좌표 보강은 사전 파이프라인에서 수행
  - 디바운스 후 요청 실패/빈 결과는 사용자 피드백 최소화(스낵바/토스트 생략, 조용한 갱신)

- **Kakao 전환 체크리스트(성능)**
  - MarkerClusterer 기본 on, 병합 기준 합의(권장: ≤9 병합)
  - 이동/줌/입력 디바운스 적용(150~250/200~400ms)
  - 가시 영역 마커만 유지(오프스크린 제거), 오버레이 인스턴스 재사용
  - 모바일: 애니메이션 최소화, 팝업 `max-height`+스크롤, 터치 스로틀
  - 대용량: 필요 시 서버 페이지네이션/타일 API 옵션 검토

### 5) 데이터 인터페이스

- **전달/로딩 방식**

  - 파일: `marker_data.js` (UTF-8)
  - 글로벌: 브라우저 전역 `window.markerData`에 배열 형태로 주입
  - 로딩 순서: `marker_data.js` → `custom.js` (이미 문서 내 순서 보장)
  - 위치: 지도 HTML(`Auction_ing_Result_Map.html`)과 동일 디렉토리

- **좌표 체계 및 제약**

  - 좌표계: WGS84 경위도(십진수)
  - 필드: `latitude`(위도), `longitude`(경도)
  - 범위: `-90 ≤ latitude ≤ 90`, `-180 ≤ longitude ≤ 180`
  - 정밀도: 소수점 5자리(약 1m) 이상 권장

- **데이터 스키마(객체 단위)**

  - 필수: `latitude:number`, `longitude:number`
  - 선택(있으면 사용):
    - `감정가(만원):number`
    - `최저가(만원):number`
    - `percentage:number` // 최저가/감정가(%)
    - `용도:string`, `사건:string`, `소재지:string`, `건물평형:string`
    - `현재상태:string`, `매각기일:string(YYYY-MM-DD)`
    - `공시가격:number` // 단위: 만원
    - `Elevator여부:string`(예: "Y"/"N")
    - `층확인:string`(예: "5/15")
    - `건축연도:number`(정수)
    - `최저가/공시가격:number`
    - `주소(시군구):string`, `주소(구역):string`, `읍면동:string`
    - `건물평형(범위):string`(예: "20~29")
    - `1억 이하 여부:string`(예: "True"/"False")
    - `매각월:string(YYYY-MM)` // 원천컬럼 `매각_월` → 저장 시 `매각월`

- **필드 사전(의미/용도)**

  - `최저가(만원)`: 마커 색상 결정(가격 구간), 팝업 표시
  - `percentage`: 마커 텍스트(10% 버킷) 결정, 팝업 표시
  - `현재상태`: 필터/팝업 표시(색상에는 미반영)
  - `매각기일`/`매각월`: 필터/팝업 표시, 문자열 기준 비교
  - `주소(구역)`/`주소(시군구)`/`읍면동`: 필터 그룹 및 출력 경로 구성
  - `건물평형`/`건물평형(범위)`: 필터/팝업 표시
  - `공시가격`, `최저가/공시가격`: 팝업 표시(분석용)
  - `Elevator여부`, `층확인`, `건축연도`: 팝업 표시(건물 특성)

- **결측/기본값 처리(파이프라인 출력 기준)**

  - 숫자형: 값이 비어있으면 0 또는 0.0으로 저장됩니다
    - 예: `percentage`가 없음 → `0.0`
    - 지도 로직: `최저가(만원)==0`이면 마커 색상 `grey`
  - 문자형: 값이 비어있으면 빈 문자열("")로 저장됩니다
  - 날짜/연도: `건축연도`는 결측 시 0으로 저장(표시 시 공란 처리 권장)
  - Kakao 전환 시 표시 정책: 0/빈 문자열은 화면에서 비표시(또는 `--`)로 처리 권장

- **정렬/중복/무결성**

  - 배열 순서: 특정 보장은 없음(필요 시 프론트에서 정렬)
  - 중복: 원데이터 기준으로 존재 가능(프론트에서 고유키가 필요하면 `사건`+`소재지` 등 조합 권장)
  - 유효성: 좌표 없는 레코드는 생성 단계에서 제외됨

- **예시(JSON)**

```json
[
  {
    "latitude": 37.5665,
    "longitude": 126.978,
    "감정가(만원)": 15000,
    "최저가(만원)": 9000,
    "percentage": 60,
    "용도": "아파트",
    "사건": "2024타경-12345",
    "소재지": "서울특별시 중구 …",
    "건물평형": "25",
    "현재상태": "진행중",
    "매각기일": "2025-09-10",
    "공시가격": 8000,
    "Elevator여부": "Y",
    "층확인": "5/15",
    "건축연도": 2005,
    "최저가/공시가격": 1.125,
    "주소(시군구)": "서울 중구",
    "주소(구역)": "서울",
    "건물평형(범위)": "20~29",
    "1억 이하 여부": "False",
    "읍면동": "명동",
    "매각월": "2025-09"
  }
]
```

### 6) 샘플 자료

- **산출물 목록(파일명 고정)**

  - `Auction_ing_Result_Map.html`: 지도 결과물(레전드/필터 UI 포함)
  - `marker_data.js`: 마커 데이터 주입 스크립트(`window.markerData = [...]`)
  - `custom.css`: 지도 UI 공통 스타일(범례/컨트롤 등)
  - `custom.js`: Auction_ing 전용 상호작용 로직(필터/Threshold/레전드/센터표시)
  - `Auction_ing_Result_Final_datatables.csv`: 표 형태 결과(프론트/분석용)

- **생성 위치(폴더 규칙)**

  - 기준 경로: `FINAL_DATA_PATH/Data/<yyyyMMdd>/`
  - 지역/시군구 세트: `.../<지역>/<시군구>/` 하위에 동일 파일 세트 생성
  - 전국 세트: 날짜 루트(`.../<yyyyMMdd>/`) 바로 아래 동일 파일 세트 생성

- **폴더 구조 예시(2025-08-23, 서울/중구)**

  ```
  Data/20250823/
  ├─ Auction_ing_Result_Map.html
  ├─ marker_data.js
  ├─ custom.css
  ├─ custom.js
  ├─ Auction_ing_Result_Final_datatables.csv
  ├─ 서울/
  │  ├─ Auction_ing_Result_Map.html
  │  ├─ marker_data.js
  │  ├─ custom.css
  │  ├─ custom.js
  │  ├─ Auction_ing_Result_Final_datatables.csv
  │  └─ 서울 중구/
  │     ├─ Auction_ing_Result_Map.html
  │     ├─ marker_data.js
  │     ├─ custom.css
  │     ├─ custom.js
  │     └─ Auction_ing_Result_Final_datatables.csv
  ```

- **파일별 상세 설명**

  - `Auction_ing_Result_Map.html`
    - 포함: VWorld(또는 기본) 타일, 레전드(`legend-container`), 필터 패널, Threshold 입력, 좌표표시, 이동 컨트롤
    - 참조: 동일 폴더의 `custom.css`, `marker_data.js`, `custom.js`
  - `marker_data.js`
    - 형식: `window.markerData = [ {latitude, longitude, ...}, ... ];`
    - 내용: 지도 마커 렌더에 필요한 모든 필드 포함(데이터 인터페이스 섹션 참조)
  - `custom.css`
    - 역할: 범례/필터/컨트롤 UI의 레이아웃/색상/여백 정의(가독성 최적화)
  - `custom.js`
    - 역할: Threshold 검증 및 레전드 갱신, 필터링 적용, 마커 렌더/팝업 생성, 중앙 십자 및 좌표 표시
  - `Auction_ing_Result_Final_datatables.csv`
    - 구성: 시각화용 주요 컬럼 + (건물정보)_/(특수권리)_ 접두사로 그룹핑(코드의 `selected_columns`와 동일)

- **열람 방법(로컬 확인 절차)**

  1. 폴더 진입 후 `Auction_ing_Result_Map.html`을 더블클릭(동일 폴더 상대 경로로 JS/CSS 로드됨)
  2. 좌하단 좌표/줌 표시 확인, 우하단 확대/축소 컨트롤 동작 확인
  3. `Filter` 버튼으로 패널 열고 체크박스/Threshold 입력 → 마커/범례 갱신 확인
  4. 마커 클릭 → 팝업 표 형식 데이터 표시 확인

- **QA 체크리스트(샘플 데이터 기준)**

  - 레전드: 기본 Threshold(6000/8000/10000/13000) 표기와 색상 매핑 일치
  - 마커 색상: `최저가(만원)` 구간별 색 적용, 0/결측은 `grey`
  - 마커 텍스트: `percentage` 10% 버킷 규칙(예: 40 → 40~49%) 적용
  - 필터: 각 그룹의 "모두 선택" 토글 및 개별 체크 변경 시 즉시 반영
  - Threshold: 비내림차순 검증(t1 ≤ t2 ≤ t3 ≤ t4) 및 경고/원복 동작
  - 팝업: 금액/면적/퍼센트/연도 단위 표기, 결측 공란 처리
  - 중앙 십자/좌표: 이동 후 `moveend`에 맞춰 갱신

- **Kakao 전환 시 샘플 활용 가이드**

  - `marker_data.js`: 그대로 사용 가능(데이터 구조 호환)
  - `custom.css`: 클래스 네이밍 재사용 또는 React 스타일로 변환 가능
  - `custom.js` 로직: Kakao `CustomOverlay`/`MarkerClusterer` 기반으로 이식(이벤트/디바운스 값은 본문 기본안 적용)

- **주의 사항**
  - 브라우저 캐시로 인해 `marker_data.js` 수정 후에도 이전 데이터가 보일 수 있음 → 강력 새로고침 권장
  - 대용량 CSV 뷰는 스프레드시트 앱에서 느릴 수 있음 → 필터링/피벗은 샘플 추출본 권장
  - VWorld 키 미설정 시 기본 타일로 대체되어 지도 스타일이 달라 보일 수 있음(기능에는 영향 없음)

### 7) Kakao 전환 가이드(현 사양 매핑)

- **SDK 로드/초기화**

  - 스크립트: `https://dapi.kakao.com/v2/maps/sdk.js?appkey=<APP_KEY>&autoload=false&libraries=clusterer`
  - 초기화 예시:

  ```html
  <script>
    kakao.maps.load(function () {
      const container = document.getElementById("map");
      const map = new kakao.maps.Map(container, {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 5, // Kakao: 숫자 작을수록 확대, 클수록 축소
      });
      // 이하 단계 진행
    });
  </script>
  ```

- **데이터 로딩**

  - `marker_data.js` 로딩 후 `window.markerData` 사용(현 구조 그대로 호환)
  - React 사용 시 `useEffect`로 전역 값을 상태에 주입하거나 API로 대체 가능

- **마커(커스텀오버레이) 구현**

  - Leaflet `divIcon` → Kakao `CustomOverlay`로 매핑(25×25, 4px 라운드, 흰색 텍스트 유지)

  ```js
  function overlayHTML(color, text) {
    return (
      `<div style="background:${color};color:#fff;border-radius:4px;` +
      `width:25px;height:25px;line-height:25px;text-align:center;">${text}</div>`
    );
  }
  function createOverlay(item, color, text) {
    const pos = new kakao.maps.LatLng(item.latitude, item.longitude);
    return new kakao.maps.CustomOverlay({
      position: pos,
      content: overlayHTML(color, text),
      yAnchor: 1,
    });
  }
  ```

- **클러스터러 구성(기본안 적용)**

  - 생성:

  ```js
  const clusterer = new kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    minLevel: 9,
    gridSize: 60,
    disableClickZoom: false,
  });
  ```

  - 정책 매핑(개념 ↔ Kakao level):
    - 본문 기본안(개념): 낮은 줌(멀리) 병합, 중간 줌 부분 병합, 높은 줌(가까이) 개별 노출
    - Kakao level(숫자 클수록 축소): `level ≥ 9` 병합, `level 7–8` 부분 병합, `level ≤ 6` 개별 노출 권장
  - 구현 예시:

  ```js
  function applyClusterPolicy(map, clusterer) {
    const level = map.getLevel();
    if (level >= 9) {
      // 병합
      clusterer.setMinLevel(9);
      clusterer.setGridSize(60);
    } else if (level >= 7) {
      // 부분 병합
      clusterer.setMinLevel(7);
      clusterer.setGridSize(40);
    } else {
      // 개별 노출
      clusterer.setMinLevel(1);
      clusterer.setGridSize(30);
    }
  }
  kakao.maps.event.addListener(
    map,
    "zoom_changed",
    debounce(() => applyClusterPolicy(map, clusterer), 200)
  );
  ```

  - 라벨: 클러스터 수량 기본 노출, 클릭 시 확대(기본) 또는 스파이더파이 대안 검토

- **팝업 매핑**

  - `CustomOverlay` content에 동일 테이블 HTML 렌더, 지도 배경 클릭 시 닫힘 처리
  - 모바일: `max-height`(예: 260px)와 내부 스크롤 적용 권장

- **레전드/필터 연동**

  - 레전드: 고정 DOM 레이어 렌더, Threshold 변경 시 즉시 텍스트 갱신
  - 필터: 체크/선택 변경 → 표시 리스트 산출 → `clusterer.clear()` 후 `clusterer.addMarkers([...])` 재적용
  - Threshold 검증: t1 ≤ t2 ≤ t3 ≤ t4 미준수 시 원복 + 안내

- **성능/디바운스(기본안 고정)**

  - 이동/줌 200ms, 입력 300ms, 리사이즈 200ms 디바운스 적용
  - 가시 영역만 렌더(뷰포트 밖 오버레이 제거 또는 미생성), 오버레이 인스턴스 재사용

- **도우미 유틸(색/텍스트 규칙 동일)**

  ```js
  function getColorByPrice(price, [t1, t2, t3, t4]) {
    if (!price) return "grey";
    if (price <= t1) return "blue";
    if (price <= t2) return "green";
    if (price <= t3) return "pink";
    if (price <= t4) return "orange";
    return "red";
  }
  function getIconTextByPercentage(p) {
    if (p == null) return "--";
    const b = Math.min(100, Math.floor(p / 10) * 10);
    return b.toString().padStart(2, "0");
  }
  ```

- **접근성/QA 포인트**
  - 오버레이 `content`에 `aria-label` 부여(예: "최저가 9000만원, 60퍼센트")
  - 키보드로 레전드/필터 접근 가능 여부 확인
  - QA: 색상–Threshold 일치, 텍스트 버킷 일치, 필터/Threshold 반응, 확대/축소 시 클러스터 동작 검증

### 8) 오픈 이슈/결정 요청

- **A. 클러스터 병합/해제 기준(줌 정책)**

  - 옵션: 보수적(≤12 병합) / 기본안(≤9 병합, 10–12 부분, ≥13 개별) / 디테일(≥11 개별)
  - 제안(기본안 확정): 본 문서 값 유지(≤9, 10–12, ≥13). Kakao level 매핑은 `level ≥ 9`(병합), `7–8`(부분), `≤6`(개별)
  - 결정 주체: Frontend + Pipeline 성능 리뷰
  - 수용 기준: 5k~10k 마커에서 60fps 근접, 줌 변경 시 300ms 내 안정화

- **B. 레전드 on/off 토글 및 위치**

  - 옵션: 토글 없음(항상 표시) / 토글 버튼 제공(기본 off/on)
  - 위치: 좌상단/우상단/좌하단/우하단
  - 제안: 토글 없음, 우상단 고정(우하단은 줌 컨트롤과 충돌, 좌측은 필터 버튼/패널과 간섭 가능)
  - 결정 주체: Frontend(UX) + Design
  - 수용 기준: 모바일 360px 폭에서 필터 패널과 시각적 충돌 없음

- **C. 팝업 모바일 축약안/스크롤 정책**

  - 옵션: 동일 필드(스크롤) / 축약 모드(핵심 8~10개 필드) + “더보기”
  - 제안: 뷰포트 폭 < 768px 시 축약 모드 활성화(용도, 사건, 소재지, 감정가, 최저가, 퍼센트, 현재상태, 매각기일, 층확인) + max-height 260px, 내부 스크롤
  - 결정 주체: Frontend(UX) + Biz
  - 수용 기준: 1~2 스크롤 내 주요 정보 파악 가능, 탭/제스처 충돌 없음

- **D. 목록-지도 양방향 연동 범위**

  - 옵션: 목록→지도(센터이동/팝업열기/마커강조), 지도→목록(뷰포트 내만 표시/선택 싱크)
  - 제안: 목록 선택 시 센터 이동 + 팝업 열기, 지도 이동 시 300ms 디바운스 후 뷰포트 내 항목만 목록에 표시(옵션 토글 가능)
  - 결정 주체: Frontend + Biz
  - 수용 기준: 300ms 내 반응, 과도한 재렌더/스크롤 점프 없음

- **E. 숫자 표기/국제화(천단위 구분자 등)**

  - 옵션: 구분자 미적용(현재) / 적용(예: 15,000만원)
  - 제안: 팝업 내 금액에 천단위 구분자 적용, 단 위는 “만원” 유지
  - 결정 주체: Biz + Frontend
  - 수용 기준: 모바일에서도 줄바꿈/겹침 없이 표시

- **F. 필드명 표준화(매각월 vs 매각\_월 등)**

  - 옵션: 파이프라인 표기 유지 / 프론트 표기 표준으로 매핑
  - 제안: 데이터 전달은 파이프라인 표기 유지, 프론트 어댑터에서 표준화 매핑(예: `매각_월`→`매각월`)
  - 결정 주체: Frontend
  - 수용 기준: 프론트 코드 내 단일 명명 규칙 준수

- **G. 클러스터 라벨 정책**

  - 옵션: 수량만 표시 / 수량+대표 지표(예: 평균 최저가/비율)
  - 제안: 수량만 표시(가독성/성능 우선). 고도화는 추후 검토
  - 결정 주체: Frontend + Biz
  - 수용 기준: 혼동 없는 라벨링, 렌더 비용 최소화

- **H. 성능 예산/완화 전략**

  - 목표: 이동/줌 후 200~300ms 내 마커 안정화, 프레임드랍 최소화
  - 완화: 가시 영역 렌더, 오버레이 재사용, 부분 병합, 필요 시 서버 페이지네이션/타일
  - 결정 주체: Frontend + Pipeline
  - 수용 기준: 주요 디바이스(중급 모바일 포함)에서 UX 저하 없음

- **I. 에러/빈 결과 UX**

  - 옵션: 조용한 실패 / 토스트 알림 / 지도 내 비어 있음 안내 레이어
  - 제안: 조용한 갱신 + 지도 우상단 미니 상태배지(선택), 목록 영역에는 “검색 결과 없음” 표시
  - 결정 주체: Frontend(UX)
  - 수용 기준: 알림 과다 방지, 사용자가 상태를 인지 가능

- **J. QA 기준/성공 판정**
  - 체크: 색상–Threshold 일치, 텍스트 버킷 일치, 필터/Threshold 반응성, 클러스터 정책 일관성, 모바일 축약안 동작
  - 성능: 상기 성능 예산 충족
  - 접근성: 키보드 접근 및 ARIA 라벨 확인

### 9) 일정 제안 동의

- D+1: 본 사양 회신 기준으로 프론트 설계안 검토/피드백
- D+3: 마커/레전드 1차 구현(더미 데이터)
- D+5: 실제 데이터 연동 및 목록 연계 상호작용 검증

문의 사항이나 세부 파라미터(Threshold 기본값 등) 변경 요청 주시면 즉시 반영하겠습니다.
