export const TOPICS_SECTION_INSTRUCTIONS = String.raw`
You are creating a **Topics section** for a weekly newsletter. This section provides a quick overview of categorized activities and discussions.

## 🎯 Purpose
Present a scannable summary of key topics/clusters from the week, grouped by category, showing what the team worked on.

## 🧠 Input Data
- clusters: Array of topic clusters, each containing:
  - topic: Category (Progress, Feature, Release, Bugfix, Decision, Roadmap, etc.)
  - subcategory: Optional subcategory (Patch, Bugfix, etc.)
  - summary: Brief overview of the cluster
  - signals: Metadata including count, participants, relevance, importance, impact
  - channel: Where the discussions happened

## ✍️ What to Do

1) **Group clusters by main topic**:
   - Group similar topics together (e.g., all Bugfix items, all Release items)
   - Present in order of importance/impact (high → medium → low)
   
2) **For each topic group, create a brief entry**:
   - **Topic heading** with emoji and category name
   - **1-2 sentences** summarizing the key points
   - **Include metrics** if significant (e.g., "5 items", "10 participants")
   - **Mention subcategories** if they add clarity
   
3) **Keep it scannable**:
   - Use bullet points or short paragraphs
   - Each topic: 1-2 sentences (20-40 words)
   - Total: 4-6 topics maximum (prioritize by impact/relevance)
   - **Filter out low-impact items** with low relevance scores

## 🧱 Style Constraints
- **Extremely concise** - this is a quick overview section
- **Metrics matter** - include counts when they tell a story
- **Focus on "what"** not "how" - save details for other sections
- **Total section**: 100-150 words maximum
- Use **topic-appropriate emojis** (🐛 bugs, 🚀 releases, 📋 roadmap, etc.)

## 🌐 Language
- Output entirely in {{LANGUAGE}} with localized tone
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English
- **Do not** mix languages

## 🗂 Output Format (exact)
\`\`\`
## 📌 Topics Overview

**[Emoji] [Topic Category]**
[1-2 sentences summarizing the cluster with key metrics]

**[Emoji] [Topic Category]**
[1-2 sentences summarizing the cluster with key metrics]

**[Emoji] [Topic Category]**
[1-2 sentences summarizing the cluster with key metrics]

[Continue for 4-6 most important topics]
\`\`\`

**Example:**
\`\`\`
## 📌 Topics Overview

**🚀 Release**
LEAD/CLASSICの10月バージョンモジュールがリリースされ、複数日にわたる展開が完了しました。

**🐛 Bugfix**
修正依頼表 #21754 に基づく10件の修正対応が実施され、既存機能の改善が進められています。

**📋 Roadmap**
新機能の要件定義と見積もり依頼に関する10件の更新があり、今後の開発方針が調整されています。
\`\`\`

**Remember:** 
- Prioritize by impact and relevance scores
- Keep each topic extremely brief
- This is an overview, not detailed reporting
`;