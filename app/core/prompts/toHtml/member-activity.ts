/**
 * Member Activity Section → HTML 変換プロンプト
 */
export const MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS = `You are converting a markdown member activity section to HTML.

## Input
You will receive markdown content for the member activity section containing:

1. **Section title** (## format, e.g. ## 💬 メンバー活動)
2. **Leaderboard table** (optional) - Metrics table with 3 columns. First column header: empty. 2nd and 3rd (use header matching input language):
   - **JA**: (empty) | 名前 | 件数
   - **KO**: (empty) | 이름 | 건수
   - **EN**: (empty) | Name | Count
   - Rows: Top Developer, Bug Hunter, Chat Champ, Reaction Pro (always English)
   - Example (JA):
   \`\`\`
   | Metrics         | Name            | Count |
   |----------------|-----------------|-------|
   | Top Developer  | Suchon Kou      | 15    |
   | Bug Hunter     | Suchon Kou      | 15    |
   | Chat Champ     | Yoko Nishimura  | 80    |
   | Reaction Pro   | Mitsuru Ikeshita| 91    |
   \`\`\`
3. **Member entries** - Each with emoji, name, and activity description
   - Format: **🛠 Name** or **📣 Name** followed by description on next line

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>

  <!-- Leaderboard table (if present in input) -->
  <!-- Header: first th empty, then JA=名前|件数, KO=이름|건수, EN=Name|Count -->
  <table class="kpi-table">
    <thead>
      <tr>
        <th></th>
        <th>[名前|이름|Name]</th>
        <th>[件数|건수|Count]</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Top Developer</td><td>[Name]</td><td>[Count]</td></tr>
      <tr><td>Bug Hunter</td><td>[Name]</td><td>[Count]</td></tr>
      <tr><td>Chat Champ</td><td>[Name]</td><td>[Count]</td></tr>
      <tr><td>Reaction Pro</td><td>[Name]</td><td>[Count]</td></tr>
    </tbody>
  </table>

  <!-- Member activity items -->
  <div class="member-item">
    <div class="member-left">
      <div class="member-emoji">[Emoji]</div>
    </div>
    <div class="member-right">
      <p class="member-name">[Name]</p>
      <p class="member-desc">[Activity description]</p>
    </div>
  </div>
  <!-- More member-items... -->
</div>
\`\`\`

## Rules
1. **Section title**: Extract from \`## Title\` format
2. **Leaderboard table**: If input contains a markdown table with Top Developer / Bug Hunter / Chat Champ / Reaction Pro rows:
   - Convert to \`<table class="kpi-table">\`
   - First column header: empty \`<th></th>\`. 2nd/3rd: JA=名前|件数, KO=이름|건수, EN=Name|Count
   - Preserve column order: (empty) → [Name] → [Count]
   - Include the table BEFORE member-item blocks
3. **Member entries**: Each becomes a member-item
   - Extract emoji for member-emoji div (e.g. 🛠, 📣, 💡)
   - Extract name for member-name (after emoji, before description)
   - Extract activity description for member-desc
4. **Input formats** for member entries:
   - "**🛠 Name**\\nDescription text"
   - "**📣 Name**\\nDescription text"
   - "👤 **Name** — Activity description"
5. Preserve all emojis and original language
6. If no leaderboard table in input, omit the table and output only title + member-items

## Output
Return ONLY the HTML div element, nothing else.`;
