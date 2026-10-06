# 이전 뉴스레터 생성 (참고)

`generateContents`를 제거하기 전의 주간 리포트 경로입니다. 지금은 `createContents`가 Flue `TestAgent` 한 문장을 메일로 보냅니다. 아래는 그 전에 만들던 형식입니다. 실제 산출물 예시는 `sample/`에 있습니다.

입력은 최근 7일 GitHub 저장소 활동과 Slack 채널 메시지입니다. 언어는 타겟의 `en` / `ko` / `ja`입니다. 기간 문자열은 `range`(예: `2026-9-30 ~ 2026-10-7`)입니다.

## 생성 단계

런 스텝은 `collect_data` → `summarize_data` → `assemble_data` → `finalize_data` → `send_email`입니다. 수집은 크론이 하고, 나머지는 `generateContents`가 했습니다.

1. **정규화.** GitHub·Slack을 하나의 활동 문서로 묶고 중복을 제거합니다. 모델 호출은 없습니다.
2. **분석.** 토픽 클러스터, 하이라이트 요약, 멤버 활동 요약, 진행 중 작업·로드맵을 뽑습니다. GitHub가 있으면 KPI 스냅샷(커밋, 닫힌 PR, 이슈, 기여자, 커밋 종류)도 만듭니다.
3. **섹션 초안.** 아래 마크다운 섹션을 작성합니다. Slack이 없으면 KPI 초안만 만들고 끝냅니다.
4. **병합.** 템플릿에 섹션을 끼워 마크다운 한 편을 만듭니다.
5. **최종본.** 병합본을 다듬은 뒤 섹션별로 HTML로 바꿉니다. 반환은 `finalContents`(마크다운)와 `htmlContents`(메일 HTML)입니다.

분석·초안 대부분은 `gpt-4.1-mini`입니다. KPI 섹션과 HTML 변환은 `gpt-5-mini-2025-08-07`, 최종 문장 다듬기는 `gpt-5.2-2025-12-11`, 섹션 HTML은 `gpt-5.2-codex`였습니다.

## 마크다운 골격

GitHub와 Slack이 둘 다 있을 때의 순서입니다.

```markdown
# Weekly Newsletter

{range}

## 👋 Weekly Summary
오프닝. 최대 약 300단어.

## KPI
{KPI_SECTION}

## ✨ Highlights
## 🧭 Topics
## ⚙ Ongoing / Roadmap and Looking Ahead
## 💬 Member Activity

## 🎉 Closing
{CLOSING_SECTION}
```

분기:

- **GitHub만.** KPI 섹션만 만들고, HTML도 KPI 전용 레이아웃입니다.
- **Slack만.** KPI 자리를 비웁니다. Highlights 이하와 Closing은 그대로입니다.
- **둘 다.** 위 골격 전체입니다.

## 섹션에 담기던 내용

| 섹션 | 내용 |
|---|---|
| Weekly Summary | 한 주의 오프닝 |
| KPI | 커밋, 닫힌 PR, 닫힌 이슈, 활성 기여자, 가장 많은 커밋 종류(`Feature`, `Bugfix`, `Incident`, `Release`, `Refactor`, `Security`). 상위 2–3명 기여자와 커밋 수 |
| Highlights | 영향이 큰 주제 2–3개. 주제당 2–3문장 요약과 대화 인용 2–4개. 날짜는 `YYYY-MM-DD` |
| Topics | 클러스터를 종류별로 묶은 스캔용 목록. 종류는 Progress, Feature, Release, Bugfix, Decision, Roadmap 등. 그룹당 1–2문장, 건수·참여자 |
| Ongoing / Roadmap | 진행 중 항목(제목, 티켓, 담당, 상태, 진행률, 다음 액션), 마일스톤 기간, 예정 일정 |
| Member Activity | 기여가 큰 멤버 4–6명. 이번 주 초점, 성과, 협업, 결정. 리더보드 표(Top Developer, Bug Hunter, Chat Champ, Reaction Pro)를 끼움 |
| Closing | 진행 상황 하나와 리더보드를 섞은 짧은 마무리. 날짜는 그대로 두고 문장만 다시 씀 |

## 메일 HTML

최종 HTML 섹션 순서는 Header, Summary, KPI, Highlights, Topics, Ongoing, Member Activity, Closing입니다. KPI만 있는 경우에는 헤더와 KPI 블록만 있습니다.

메일 자체:

- 보내는 주소: `IEUM <info@mail.nexone.ink>`
- 제목: `{타겟 displayName} Weekly Newsletter`
- 본문: `htmlContents`
- 저장: `newsletter_editions.html_body`에 HTML, `text_body`에 마크다운, `stats_json`에 수신자·기간

수신자 계산은 메일링 리스트와 Slack 멤버를 모으지만, 현재 발송 `to` / `bcc`는 코드에 고정된 테스트 주소입니다.
