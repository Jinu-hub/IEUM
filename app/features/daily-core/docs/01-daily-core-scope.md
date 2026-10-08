# 1. 일별 처리 대상 / 데이터 범위 상세 설계

## 1-1. Daily Core의 논리적 기본 단위

Daily Core의 기본 단위는 다음과 같이 정의한다.

1 Target × 1 Local Date = 1 Daily Core Data

예를 들어 하나의 Target에 여러 개의 Slack Channel과 GitHub Repository가 연결되어 있더라도, 해당 Target의 하루치 활동은 하나의 Daily Core Data로 통합한다.

Target A
timezone = Asia/Tokyo

2026-08-17
    ↓
Slack Channel A
Slack Channel B
GitHub Repo A
GitHub Repo B
    ↓
Daily Core Data

즉, `target_source`별로 Daily Core를 생성하는 것이 아니라 `target` 단위로 생성한다.

다만 동일 날짜의 Daily Core를 재생성할 수 있기 때문에, 논리적인 Daily Core 하나 아래에 여러 Generation이 존재할 수 있다.

Daily Core
2026-08-17 / Target A

Generation 1
Generation 2
Generation 3

논리적으로는 하나의 Daily Core지만, 실제 생성 이력은 보존한다.

---

## 1-2. 처리 대상 Target 판정

Daily Core 생성 대상은 기본적으로 다음 조건을 만족하는 Target으로 한다.

targets.is_active = true

AND

활성화된 target_source가 1개 이상 존재

실제 데이터 수집에 사용하는 Source는 다음 조건을 만족해야 한다.

target_sources.is_active = true

AND

integrations.is_active = true

`integration_statuses.connection_status`는 Daily Core 생성 대상 자체를 제외하는 조건으로 사용하지 않는다.

예를 들어 Integration은 활성화되어 있지만 인증 만료나 외부 API 오류가 발생할 수 있다.

이 경우에는 해당 Source를 조용히 제외하는 것보다 수집 실패로 기록하는 것이 적절하다.

is_active = false
→ 의도적으로 사용하지 않는 Source

is_active = true + connection error
→ 사용하려 했지만 수집에 실패한 Source

이를 통해 설정상 비활성 상태와 실제 장애 상태를 구분할 수 있다.

`target_sources.is_member_mail`은 Daily Core 생성 여부와 직접적인 관계가 명확하지 않으므로 기본적인 Source 필터 조건에는 포함하지 않는다.

---

## 1-3. 날짜 기준

`core_date`는 UTC 날짜가 아니라 Target에 설정된 `timezone` 기준의 Local Date로 정의한다.

예:

target.timezone = Asia/Tokyo
core_date = 2026-08-17

해당 Daily Core가 담당하는 논리적 데이터 범위는 다음과 같다.

2026-08-17 00:00:00 JST
~
2026-08-18 00:00:00 JST

이를 UTC 기준으로 표현하면:

window_start_at = 2026-08-16T15:00:00Z
window_end_at   = 2026-08-17T15:00:00Z

데이터 조회 범위는 항상 Half-open interval 방식으로 통일한다.

occurred_at >= window_start_at
AND
occurred_at < window_end_at

즉 `[start, end)` 방식을 사용한다.

`23:59:59.999`와 같은 종료 시간 계산 방식은 사용하지 않는다.

---

## 1-4. Timezone Snapshot 저장

Daily Core 생성 시 `targets.timezone`을 참조하는 것만으로 끝내지 않고, 실제 사용된 timezone을 Daily Core에 Snapshot으로 저장한다.

예를 들어 Target timezone이 나중에 다음과 같이 변경될 수 있다.

Asia/Tokyo
→
America/New_York

과거 Daily Core가 Target의 현재 timezone만 참조한다면 당시 하루의 데이터 범위를 정확하게 복원할 수 없다.

따라서 Daily Core에는 다음 값을 저장한다.

core_date
timezone
window_start_at
window_end_at

같은 이유로 다음 Target 정보도 Snapshot으로 보존하는 것을 권장한다.

target_display_name
target_category
language

Target 설정이 변경되어도 당시 Daily Core가 어떤 조건에서 생성되었는지를 확인할 수 있다.

---

## 1-5. Source 데이터 시간 기준

Slack, GitHub 등 Provider마다 데이터의 시간 필드가 서로 다를 수 있다.

Daily Core Pipeline에서는 모든 Raw Event를 공통적으로 다음 필드로 Normalization한다.

occurred_at

예:

Slack message
→ message timestamp

GitHub commit
→ commit timestamp

GitHub Pull Request Event
→ event/action timestamp

GitHub Issue Comment
→ comment timestamp

전체적인 흐름은 다음과 같다.

Provider Raw Data
       ↓
Normalized Event
       ↓
occurred_at

이를 통해 Daily Data Window를 Provider 종류와 관계없이 동일한 기준으로 적용할 수 있다.

---

## 1-6. 데이터가 없는 날

활성 Source들을 정상적으로 조회했지만 해당 날짜에 실제 Activity가 존재하지 않을 수 있다.

이 경우에도 Daily Core Record는 생성한다.

모든 Source 조회 성공
+
Raw Activity = 0

→ quality_status = empty

Daily Core가 존재하지 않는 상태와 실제로 활동이 없었던 상태를 구분해야 한다.

EMPTY ≠ MISSING

Daily Core가 없다는 것만으로는 다음 상황을 구분할 수 없다.

- 실제로 활동이 없었음
- 수집에 실패했음
- Daily Job 자체가 실행되지 않았음

따라서 정상 조회 결과 데이터가 0건인 경우에도 Daily Core를 기록한다.

---

## 1-7. Source 일부 실패

Target에 여러 Source가 연결되어 있는 경우 일부 Source만 실패할 수 있다.

예:

Slack A       성공
Slack B       성공
GitHub Repo A 실패

Slack 데이터만으로도 Daily Core를 생성할 수 있다면 Core 생성 자체는 진행한다.

quality_status = partial

반대로 모든 Source가 실패하여 사용할 수 있는 Input Data가 없다면 Core 생성은 실패 처리한다.

Slack 실패
GitHub 실패

→ usable input = 0
→ Generation Failed

Daily Core의 품질 상태는 기본적으로 다음과 같이 구분한다.

missing
ready
partial
empty

각 의미는 다음과 같다.

missing
→ 아직 유효한 Daily Core가 존재하지 않음

ready
→ 필요한 Source 수집과 Core 생성이 정상적으로 완료됨

partial
→ 일부 Source 수집 실패가 있었지만 Core 생성은 가능했음

empty
→ Source 수집은 정상적으로 완료되었으나 Activity가 없음

`failed`는 Daily Core 자체의 품질 상태가 아니라 개별 Generation 실행 상태로 관리한다.

---

## 1-8. 재생성 정책

Daily Core는 한번 생성했다고 영구적으로 고정하지 않는다.

다음과 같은 이유로 과거 날짜의 Core를 다시 생성할 수 있어야 한다.

- Prompt 개선
- Schema 변경
- Model 변경
- 늦게 유입된 데이터 발견
- 수집 오류 수정
- Normalization 로직 변경
- 수동 재분석

예:

2026-08-17

Generation 1
→ 최초 생성

Generation 2
→ Prompt 개선 후 재생성

Generation 3
→ 누락 데이터 반영 후 재생성

재생성 시 기존 결과를 UPDATE하여 덮어쓰지 않는다.

Generation 1 보존
Generation 2 보존
Generation 3 보존

현재 사용되는 Generation만 별도로 지정한다.

이를 통해 다음 작업이 가능해진다.

- Prompt 변경 전/후 결과 비교
- Model 변경 결과 비교
- Schema Migration 검증
- 잘못된 Generation Rollback
- 과거 생성 이력 추적