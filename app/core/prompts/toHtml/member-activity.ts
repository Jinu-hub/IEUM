/**
 * Member Activity Section → HTML 変換プロンプト
 */
export const MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS = `You are converting a markdown member activity section to HTML.

## Input
You will receive markdown content for the member activity section containing:
- Section title (## format)
- Member entries with emojis, names, and activities

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
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
1. Extract section title from \`## Title\` format
2. Each member entry becomes a member-item
3. Extract emoji for member-emoji div
4. Extract name for member-name
5. Extract activity description for member-desc
6. Common input formats:
   - "👤 **Name** — Activity description"
   - "🧑‍💻 Name: Activity description"
   - "### 😎 Name\\nActivity description"
7. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
