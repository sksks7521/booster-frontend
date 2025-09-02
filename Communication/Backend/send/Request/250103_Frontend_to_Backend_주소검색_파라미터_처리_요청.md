# 🚨 Frontend → Backend 요청서: 주소 검색 파라미터 처리 문제 해결

**작성일**: 2025-01-03  
**작성자**: Frontend Team  
**우선순위**: 🔥 HIGH (사용자 기능 오작동)  
**관련 API**: `/api/auction-ed/` (경매결과 데이터 조회)

---

## 📋 **문제 상황**

### **현재 상황**

- **프론트엔드**: v2 경매결과 페이지에서 주소 검색 기능 구현 완료
- **사용자 액션**: "덕양구" 검색어 입력 후 검색 버튼 클릭
- **프론트엔드 처리**: `address_search=덕양구` 파라미터를 백엔드 API로 정상 전송
- **백엔드 응답**: 검색어와 무관하게 전체 고양시 데이터 2,551건 반환

### **문제점**

**백엔드에서 `address_search` 파라미터를 인식하지 못하거나 처리하지 않고 있음**

---

## 🔍 **상세 분석**

### **1. 프론트엔드 전송 파라미터 (정상 작동)**

```
GET /api/auction-ed/?address_area=경기도&address_city=경기도+고양시&address_search=덕양구&page=1&page_size=50
```

### **2. 기대하는 백엔드 동작**

- `address_search=덕양구` 파라미터 수신 시
- 기존 `address_area`, `address_city` 필터에 추가로
- **소재지 필드에서 "덕양구"가 포함된 데이터만 필터링하여 반환**

### **3. 현재 백엔드 동작 (문제)**

- `address_search` 파라미터를 무시
- `address_area=경기도`, `address_city=경기도 고양시` 필터만 적용
- 전체 고양시 데이터 2,551건 반환 (덕양구 필터링 안됨)

---

## 🎯 **해결 요청 사항**

### **1. `address_search` 파라미터 처리 구현**

```python
# 예상 백엔드 로직 (Django 기준)
def get_auction_data(request):
    queryset = AuctionEd.objects.all()

    # 기존 필터들
    if address_area := request.GET.get('address_area'):
        queryset = queryset.filter(address_area=address_area)

    if address_city := request.GET.get('address_city'):
        queryset = queryset.filter(address_city=address_city)

    # 🚨 추가 필요: 주소 검색 필터
    if address_search := request.GET.get('address_search'):
        queryset = queryset.filter(
            Q(road_address__icontains=address_search) |
            Q(land_address__icontains=address_search) |
            Q(address_detail__icontains=address_search)
        )

    return queryset
```

### **2. 검색 대상 필드 확인**

다음 중 어떤 필드들에서 검색해야 하는지 확인 부탁드립니다:

- `road_address` (도로명주소)
- `land_address` (지번주소)
- `address_detail` (상세주소)
- 기타 주소 관련 필드

### **3. 테스트 케이스**

- **입력**: `address_search=덕양구`
- **기대 결과**: 소재지에 "덕양구"가 포함된 데이터만 반환
- **현재 결과**: 전체 고양시 데이터 반환 (필터링 안됨)

---

## 📊 **현재 데이터 예시**

### **프론트엔드에서 확인된 현재 응답 데이터**

```json
{
  "results": [
    {
      "road_address": "경기도 고양시 일산동구 ...",
      "land_address": "경기도 고양시 일산동구 ..."
      // 덕양구 데이터가 없거나 필터링되지 않음
    }
  ],
  "count": 2551 // 전체 고양시 데이터
}
```

### **기대하는 응답 데이터**

```json
{
  "results": [
    {
      "road_address": "경기도 고양시 덕양구 ...",
      "land_address": "경기도 고양시 덕양구 ..."
      // 덕양구가 포함된 데이터만
    }
  ],
  "count": 123 // 덕양구 데이터 개수
}
```

---

## ⏰ **요청 일정**

- **긴급도**: 🔥 HIGH
- **희망 완료일**: 2025-01-03 (오늘 중)
- **이유**: v2 경매결과 페이지 핵심 기능, 사용자 경험에 직접적 영향

---

## 📞 **후속 조치**

### **백엔드팀 확인 사항**

1. `address_search` 파라미터 처리 로직 구현
2. 검색 대상 필드 및 검색 방식 결정
3. 테스트 완료 후 프론트엔드팀에 알림

### **프론트엔드팀 대기 사항**

1. 백엔드 수정 완료 시 기능 테스트
2. 다른 검색 파라미터 (`case_number_search`, `road_address_search`) 동작 확인
3. 검색 결과 UI/UX 최적화

---

## 🔗 **관련 문서**

- [FRONTEND_ARCHITECTURE.md](../../Doc/FRONTEND_ARCHITECTURE.md)
- [250830*Backend_to_Frontend_auction_ed*스키마*공유*및*예시*응답.md](../receive/Request/250830_Backend_to_Frontend_auction_ed_스키마_공유_및_예시_응답.md)

---

**문의사항이나 추가 정보가 필요하시면 언제든 연락 부탁드립니다!** 🙏
