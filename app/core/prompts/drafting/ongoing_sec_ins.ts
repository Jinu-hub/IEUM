export const ONGOING_SECTION_INSTRUCTIONS = String.raw`
You are creating an **Ongoing Progress & Roadmap section** for a weekly newsletter. This section shows current work and what's coming next.

## 🎯 Purpose
Provide a clear view of in-progress work and upcoming milestones so the team knows what's happening now and what's ahead.

## 🧠 Input Data
- ongoing: Array of current work items with:
  - title: Work item name
  - tickets: Related ticket numbers
  - owner: Responsible person(s)
  - status: Current status
  - progressPercent: Progress percentage
  - completed/pending: What's done and what's left
  - nextActions: Upcoming actions with owners and due dates
  
- roadmap: Array of milestones with:
  - milestone: Milestone name
  - window: Date range (from/to)
  - signals: Key indicators
  - importance: high/medium/low
  
- upcoming: Array of scheduled events with:
  - title: Event name
  - start/end: Date/time
  - location: Where (if applicable)

## ✍️ What to Do
⚠️ **Important**: 
Each section aims for 2–3 items, but never invent content.  
If fewer than 2 items exist, list only what actually happened.

1) **Ongoing Work (2-3 most important items)**:
   - Select based on importance, progress, and team impact
   - For each item write **2-3 sentences**:
     * Current status and progress percent
     * Key completed items (briefly)
     * Next action with owner and due date
   - Keep each item: 30-40 words

2) **Roadmap (2-3 key milestones)**:
   - Prioritize by importance (high first) and date proximity
   - For each milestone write **1-2 sentences**:
     * What it is and when (use exact dates: YYYY-MM-DD)
     * Key signals or deliverables
   - Keep each milestone: 20-30 words

3) **Upcoming Events (2-3 nearest events)**:
   - Select events within next 2 weeks
   - List with date and brief description
   - Format: "YYYY-MM-DD: [Event title]"

## 🧱 Style Constraints
- **Forward-looking tone** - focus on what's happening and what's next
- **Dates are critical** - always include exact dates (YYYY-MM-DD format)
- **Total section**: 150-200 words maximum
- **Progress indicators** - mention percentages when provided
- Use **appropriate emojis** (🔄 ongoing, 🗓️ roadmap, 📅 upcoming)
- **Professional and informative** tone

## 🌐 Language
- Output entirely in {{LANGUAGE}} with localized tone
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English
- **Do not** mix languages

## 🗂 Output Format (exact)
\`\`\`
## 🔄 Ongoing Progress & Looking Ahead

### Currently In Progress

**[Title 1]** (Progress: XX%)
[2-3 sentences: status, completed items, next action with owner and due date]

**[Title 2]** (Progress: XX%)
[2-3 sentences: status, completed items, next action with owner and due date]

### 🗓️ Roadmap

**[Milestone 1]** (YYYY-MM-DD to YYYY-MM-DD)
[1-2 sentences about the milestone and key deliverables]

**[Milestone 2]** (YYYY-MM-DD to YYYY-MM-DD)
[1-2 sentences about the milestone and key deliverables]

### 📅 Upcoming

- **YYYY-MM-DD**: [Event title and brief description]
- **YYYY-MM-DD**: [Event title and brief description]
\`\`\`

**Example (Structure Reference Only — Do Not Invent Content)**
Examples are illustrative and generated in Japanese, Korean, or English depending on workspace language settings.


### 🇯🇵 Japanese
## 🔄 進行中のタスク & ロードマップ

### 現在の進行状況
**修正依頼表対応その6** (Progress: 60%)
8件のチケットに対応中で、No.425が完了しました。

### 🗓️ ロードマップ
**10月対応分のコミット** (2025-10-13 to 2025-10-31)
修正対応を継続予定です。

### 📅 予定
- **2025-10-17**: レビュー＆コミット予定

---

### 🇰🇷 Korean
## 🔄 진행 상황 및 향후 계획

### 현재 진행 중
**수정 요청 대응 #6** (진행률: 60%)
총 8건 중 일부 작업이 완료되었습니다.

### 🗓️ 로드맵
**10월 커밋 예정 작업** (2025-10-13 ~ 2025-10-31)
관련 수정 작업을 지속합니다.

### 📅 예정 일정
- **2025-10-17**: 리뷰 및 커밋 예정

---

### 🇺🇸 English
## 🔄 Ongoing Progress & Looking Ahead

### Currently In Progress
**Fix Request Batch #6** (Progress: 60%)
Several tickets are in progress, with partial completion achieved.

### 🗓️ Roadmap
**October Commit Plan** (2025-10-13 to 2025-10-31)
Ongoing fixes will continue through October.

### 📅 Upcoming
- **2025-10-17**: Review & commit scheduled


**Remember:** 
- Always include exact dates
- Focus on what's happening now and what's next
- Keep progress percentages visible
- This section helps team plan ahead
`;