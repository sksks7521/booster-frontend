## 🚨 Frontend→Backend | 특수조건 필터 구현 긴급 요청 (2025-09-01)

### 📋 **문제 요약**

- **API**: `/api/v1/auction-completed/`
- **파라미터**: `special_conditions`
- **현재 상태**: 프론트엔드에서 analysis 페이지 기준의 특수조건 옵션을 사용하고 있으나, 경매결과 데이터는 다른 특수조건 값들을 사용할 가능성
- **문제**: 경매결과 데이터에 맞지 않는 특수조건 옵션으로 인한 필터링 오작동 가능성

### 🔍 **상세 내용**

#### **현재 프론트엔드에서 전송하는 파라미터 (Analysis 기반):**

```typescript
// Analysis 페이지 특수조건 옵션들
{
  { ko: "대항력있는임차인", key: "tenant_with_opposing_power" },
  { ko: "HUG인수조건변경", key: "hug_acquisition_condition_change" },
  { ko: "선순위임차권", key: "senior_lease_right" },
  { ko: "재매각", key: "resale" },
  { ko: "지분매각", key: "partial_sale" },
  { ko: "공동담보", key: "joint_collateral" },
  { ko: "유치권", key: "lien" },
  { ko: "위반건축물", key: "illegal_building" },
  { ko: "전세권매각", key: "lease_right_sale" },
  { ko: "대지권미등기", key: "land_right_unregistered" },
}
```

#### **현재 v2 페이지에서 사용 중인 특수조건 옵션들:**

```typescript
// v2 페이지에서 실제 표시되는 옵션들 (브라우저 확인)
-"대항력있는임차인"(활성화됨) -
  "HUG인수보증" -
  "우선매수권" -
  "임차보증금" -
  "압류" -
  "가압류" -
  "가처분" -
  "소액임차권" -
  "선순위임차권" -
  "담보신탁" -
  "용도제한";
```

#### **실제 경매결과 데이터에서 확인된 특수조건 값들:**

```
테이블 데이터에서 확인된 특수권리 컬럼 값들:
- "대항력있는임차인, 선순위임차권, 관련사건, HUG인수조건변경"
- "유치권, 별도등기, 관련사건, 공동담보"
- "대항력있는임차인, 선순위임차권, 관련사건"
- "공동담보"
- "별도등기, 공동담보"
- "유치권, 별도등기"
- "-" (특수조건 없음)
```

#### **네트워크 로그에서 확인된 실제 전송 파라미터:**

```
special_conditions=tenant_rights
```

### 🎯 **요청사항**

#### **1. 경매결과 데이터의 특수조건 컬럼 분석**

```sql
-- 경매결과 테이블에서 실제 사용되는 특수조건 값들의 전체 목록 제공
SELECT DISTINCT special_rights
FROM auction_completed_table
WHERE special_rights IS NOT NULL AND special_rights != '-'
ORDER BY special_rights;
```

#### **2. 특수조건 매핑 테이블 제공**

```
경매결과 데이터에서 사용되는 특수조건 값들과 의미:
- "대항력있는임차인": tenant_with_opposing_power
- "HUG인수조건변경": hug_acquisition_condition_change
- "선순위임차권": senior_lease_right
- "공동담보": joint_collateral
- "유치권": lien
- "별도등기": separate_registration
- "관련사건": related_case
- (기타 값들...)
```

#### **3. 백엔드 필터링 로직 확인**

```python
# 현재 구현된 special_conditions 필터링 로직 확인
if special_conditions:
    condition_values = special_conditions.split(',')
    # 실제 DB 컬럼값과 매칭하여 필터링 적용
    # 부분 문자열 매칭인지, 정확한 매칭인지 확인 필요
    for condition in condition_values:
        queryset = queryset.filter(special_rights__icontains=condition)
```

#### **4. 프론트엔드 수정 방향 결정**

- **옵션 A**: 프론트엔드에서 한글 → 영문 키 매핑 후 백엔드 전송
- **옵션 B**: 백엔드에서 영문 키를 받아 한글 값으로 변환하여 필터링
- **옵션 C**: 경매결과 전용 특수조건 옵션 새로 정의

### 📝 **추가 정보**

- **현재 매핑**: `specialBooleanFlags` → `special_conditions` (콤마로 구분)
- **UI 표시**: v2 페이지에서 analysis와 다른 특수조건 옵션들이 표시됨
- **데이터 불일치**: 선택한 옵션과 실제 DB 값 간 불일치 가능성

### 🚀 **우선순위**

긴급 🔥 - 특수조건 필터가 정확히 작동하지 않을 가능성

### 📞 **연락처**

프론트엔드 팀에서 경매결과 데이터의 특수조건 구조 확인 후 즉시 수정 진행 예정

