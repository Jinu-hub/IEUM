export const MEMBER_ACTIVITY_SECTION_INSTRUCTIONS = String.raw`
You are creating a **Member Activity section** for a weekly newsletter. This section highlights individual contributions and activities.

## 🎯 Purpose
Recognize team members' contributions in a concise, scannable format that shows who did what this week.

## 🧠 Input Data
- members: Array of member objects, each containing:
  - displayName: Member's name
  - summary: Object with:
    - mainThemes: Key focus areas (array)
    - weeklyHighlights: 1-2 major achievements
    - collaboration: Who they worked with
    - decisionsOrActions: Key outcomes
    - overallSummary: Weekly summary text

## ✍️ What to Do

1) **Select 4-6 most active members**:
   - Prioritize based on number of highlights, decisions, and collaboration
   - Focus on members with significant contributions
   - Select up to 4–6 active members from real data only
   - If fewer than 4 exist, do not pad or supplement with fictional members.
   - If more than 6, choose those with most impact
   
2) **For each member, write a brief entry**:
   - **Name** with emoji
   - **1-2 sentences** summarizing their key activities
   - **Focus on outcomes**, not processes
   - Mention 1 specific highlight if particularly notable
   - Keep each entry: 20-30 words

3) **Keep it appreciative but factual**:
   - Use positive, professional tone
   - Highlight achievements and collaboration
   - **Do not** list every action; synthesize themes
   - Mention collaboration partners if space allows

## 🧱 Style Constraints
- **Extremely concise** - each member: 1-2 sentences max
- **Achievement-focused** - what they accomplished, not what they're doing
- **Total section**: 120-180 words maximum
- Use **1 emoji per member** for visual grouping
- **Professional and appreciative** tone

## 🌐 Language
- Output entirely in {{LANGUAGE}} with localized tone
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English
- **Do not** mix languages

## 🗂 Output Format (exact)
\`\`\`
## 👥 Team Activity

**[Emoji] [Member Name]**
[1-2 sentences about their key activities and achievements]

**[Emoji] [Member Name]**
[1-2 sentences about their key activities and achievements]

**[Emoji] [Member Name]**
[1-2 sentences about their key activities and achievements]

[Continue for 4-6 members]
\`\`\`

**Example (Structure Reference Only — Do Not Invent Content)**
Examples are illustrative and generated in Japanese, Korean, or English depending on workspace language settings.
\`\`\`

### 🇯🇵 Japanese
## 👥 メンバー活動
**🚀 Mitsuru Ikeshita**
10月バージョンのLEAD/CLASSICモジュール作成を完了し、教材音声自動再生問題の調査とチケット管理への移行を主導しました。

**🔧 Tomoaki Watanabe**
教材の技術的問題を検証し、複数の修正依頼表のコミット申請を実施。関係者と密に連携して作業を進めました。

**💡 Yasuhiro Oba**
教材音声自動再生の仕様を技術的に説明し、データ品質調査のためのSQL共有で調査を支援しました。

**📋 Yoko Nishimura**
申請フローの仕様確認と修正依頼表の体系的対応方針を提案。複数案件の対応期限調整を実施しました。

---

### 🇰🇷 Korean
## 👥 개별 활동 상황
**🚀 김민수**
LEAD 모듈 개선 작업을 완료하고, 자동화 재생 오류의 원인을 분석하여 관련 이슈를 정리했습니다.

**🔧 이지훈**
수정 요청 사항을 검토하고, 여러 건의 패치를 커밋하여 품질 안정화에 기여했습니다.

**💡 박서연**
오디오 재생 관련 로그를 분석하고, 데이터 품질 점검을 위한 쿼리 작성을 지원했습니다.

---

### 🇺🇸 English
## 👥 Individual Activity
**🚀 Alex Johnson**  
Completed improvements to the LEAD module and investigated the root cause of the audio autoplay issue.

**🔧 Emily Carter**  
Reviewed multiple fix requests, submitted patches, and collaborated closely with stakeholders to ensure stability.

**💡 Daniel Moore**  
Clarified audio playback specifications and supported data quality checks by sharing relevant SQL queries.

\`\`\`

**Remember:** 
- Keep each member entry very brief (20-30 words)
- Focus on achievements and collaboration
- Select most active/impactful members only
- This is recognition, not a detailed report
`;