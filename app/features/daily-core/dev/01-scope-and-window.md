# Daily Core Scope and Window

## Goal

Daily Core의 논리적 기본 단위와 하루치 데이터 범위를 명확히 정의한다.

이 문서는 다음 질문에 답한다.

- 어떤 Target이 Daily Core 생성 대상인가
- `core_date`는 무엇을 의미하는가
- data window는 어떻게 계산하는가
- source별 시간 필드는 어떻게 통일하는가
- 데이터가 없는 날 / 일부 실패한 날은 어떻게 취급하는가

---

## 1. Logical Unit

Daily Core의 기본 단위는 다음과 같다.

```text
1 Target x 1 Local Date = 1 Daily Core Data
```

즉 하나의 Target에 여러 Slack Channel, GitHub Repository, Notion Page가 연결되어 있더라도
그 하루의 활동은 Target 단위로 하나의 Daily Core로 통합한다.

```text
Target A
timezone = Asia/Tokyo

2026-08-17
    ↓
Slack Channel A
Slack Channel B
GitHub Repo A
GitHub Repo B
Notion Page A
    ↓
1 Daily Core
```

Target Source마다 Daily Core를 따로 만들지 않는다.

---

## 2. Generation Model

논리적으로 Daily Core는 하루에 하나지만, 생성 이력은 여러 번 존재할 수 있다.

```text
Daily Core
Target A + 2026-08-17

Generation 1
Generation 2
Generation 3
```

이 구조를 통해 다음이 가능하다.

- Prompt 변경 비교
- Model 변경 비교
- 늦게 유입된 데이터 반영
- 실패한 생성 이후 rollback
- Historical audit

---

## 3. Target Selection

Daily Core 생성 대상 Target은 기본적으로 다음 조건을 만족해야 한다.

```text
targets.is_active = true
AND
active target_sources count >= 1
```

실제 수집 대상 Source는 다음 조건을 만족해야 한다.

```text
target_sources.is_active = true
AND
integrations.is_active = true
```

### Important Rule

`integration_statuses.connection_status`는 생성 대상 제외 조건으로 사용하지 않는다.

이유:

- `is_active = false`
  - 사용자가 의도적으로 제외한 source

- `is_active = true` + `connection error`
  - 사용하려 했지만 수집에 실패한 source

이 둘은 의미가 다르므로 구분해야 한다.

`target_sources.is_member_mail`은 Daily Core 생성 여부를 직접 결정하는 기본 필터에 포함하지 않는다.

---

## 4. core_date Definition

`core_date`는 UTC 날짜가 아니라 Target timezone 기준의 local date다.

예:

```text
target.timezone = Asia/Tokyo
core_date = 2026-08-17
```

이 경우 논리적 데이터 범위는 다음과 같다.

```text
2026-08-17 00:00:00 JST
~
2026-08-18 00:00:00 JST
```

UTC로 변환하면:

```text
window_start_at = 2026-08-16T15:00:00Z
window_end_at   = 2026-08-17T15:00:00Z
```

---

## 5. Window Rule

모든 Daily Data Window는 half-open interval로 통일한다.

```text
occurred_at >= window_start_at
AND
occurred_at < window_end_at
```

즉 `[start, end)` 방식이다.

이 방식을 사용하면:

- provider별 시간 비교가 단순해진다
- 23:59:59.999 같은 경계 계산을 피할 수 있다
- 다음날 window와 겹치지 않는다

---

## 6. Snapshot Fields

Daily Core는 생성 시점의 Target 설정을 snapshot으로 보존한다.

반드시 보존할 값:

- `core_date`
- `timezone`
- `window_start_at`
- `window_end_at`
- `target_display_name`
- `target_category`
- `language`

이유:

Target 설정이 나중에 바뀌어도 과거 Daily Core를 정확히 복원할 수 있어야 하기 때문이다.

---

## 7. Source Time Normalization

Provider마다 시간 필드가 다르므로 Daily Core 내부에서는 다음 공통 필드로 정규화한다.

```text
occurred_at
```

예:

- Slack message -> message timestamp
- GitHub commit -> commit timestamp
- GitHub PR event -> event/action timestamp
- GitHub issue comment -> comment timestamp
- Notion page update -> last edited timestamp

흐름:

```text
Provider Raw Data
       ↓
Normalized Event
       ↓
occurred_at
```

이후 모든 범위 필터와 Agent 입력은 `occurred_at` 기준으로 처리한다.

---

## 8. Empty Day

활성 Source를 정상 조회했지만 해당 날짜에 activity가 없을 수 있다.

이 경우에도 Daily Core Record는 생성한다.

```text
all source fetch succeeded
+ raw activity = 0
→ quality_status = empty
```

이렇게 해야 다음을 구분할 수 있다.

- 실제로 활동이 없었음
- 수집에 실패했음
- job이 아예 실행되지 않았음

즉:

```text
EMPTY != MISSING
```

---

## 9. Partial Failure

여러 Source 중 일부만 실패할 수 있다.

예:

```text
Slack A       success
Slack B       success
GitHub Repo A failed
```

usable input이 남아 있다면 Core 생성은 진행한다.

```text
quality_status = partial
```

반대로 모든 Source가 실패해서 usable input이 0이면:

```text
generation_status = failed
```

### Quality Status Meaning

- `missing`
  - 아직 유효한 Daily Core가 없음

- `ready`
  - 필요한 source 수집과 core 생성이 정상 완료됨

- `partial`
  - 일부 source 실패가 있지만 core 생성 가능

- `empty`
  - source 조회는 성공했지만 activity가 없음

`failed`는 quality가 아니라 generation 실행 상태다.

---

## 10. Regeneration Policy

Daily Core는 한 번 생성되었다고 끝나지 않는다.

재생성 사유:

- Prompt 개선
- Schema 변경
- Model 변경
- 늦게 유입된 데이터 반영
- 수집 오류 수정
- normalization 로직 변경
- 수동 재분석

재생성 시 기존 결과를 덮어쓰지 않는다.

```text
Generation 1 preserved
Generation 2 preserved
Generation 3 preserved
```

현재 사용되는 generation만 별도로 지정한다.

---

## 11. Implementation Rule Summary

최소 규칙 요약:

1. `1 Target x 1 Local Date = 1 Daily Core`
2. `core_date`는 target timezone 기준 local date
3. data window는 `[start, end)`
4. source time은 `occurred_at`로 normalize
5. empty day도 record 생성
6. 일부 실패는 `partial`, 전부 실패는 generation failure
7. regenerate는 generation history로 보존
