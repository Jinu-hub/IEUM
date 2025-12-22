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

**Example:**
\`\`\`
## 🔄 Ongoing Progress & Looking Ahead

### Currently In Progress

**修正依頼表対応その6** (Progress: 60%)
8件のチケットに対応中で、No.425が完了しました。Momoko Teradaが10月13日までにエラー原因解明を進め、Suchon Kouが10月17日にレビュー依頼・コミット作業を予定しています。

**音声自動再生機能対応** (Progress: 70%)
1スライド素材の仕様確認が完了し、対応方針の確定と実装を進めています。Tomoaki Watanabeが10月12日までに機能要件を整理し、開発チームが10月15日に実装を開始します。

### 🗓️ Roadmap

**10月対応分のコミット** (2025-10-13 to 2025-10-31)
修正依頼表その6の対応を継続し、一部のチケットは11月切替後にコミット予定です。

**11月アップデート** (2025-11-01 to 2025-11-30)
スキル管理画面改良 #21794 とユーザ配信再計算API改善 #21790 の対応を開始します。

### 📅 Upcoming

- **2025-10-17**: レビュー＆コミット予定
- **2025-10-13**: 修正依頼表対応その6（継続）
\`\`\`

**Remember:** 
- Always include exact dates
- Focus on what's happening now and what's next
- Keep progress percentages visible
- This section helps team plan ahead
`;