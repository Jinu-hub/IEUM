/**
 * Ongoing/Roadmap Section → HTML 変換プロンプト
 */
export const ONGOING_TO_HTML_INSTRUCTIONS = `You are converting a markdown ongoing/roadmap section to HTML.

## Input
You will receive markdown content for the ongoing section containing:
- Section title (## format)
- Subsection titles (### format)
- Progress items with optional percentages
- Roadmap tables or lists

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Main Title]</h2>
  
  <!-- For each ### subsection -->
  <h3>[Subsection Title]</h3>
  
  <!-- For progress items -->
  <div class="road-card">
    <h3>[Item title]</h3>
    <p>[Description]</p>
    <!-- If progress percentage exists -->
    <div class="nl-progress-bar">
      <div class="nl-progress-fill" style="width: XX%;"></div>
    </div>
    <div class="road-meta">[Progress]: XX% — [Date]</div>
  </div>
  
  <!-- For roadmap tables -->
  <table class="roadmap-table">
    <thead><tr><th>...</th></tr></thead>
    <tbody><tr><td>...</td></tr></tbody>
  </table>
  
  <!-- For simple lists -->
  <ul><li>...</li></ul>
</div>
\`\`\`

## Rules
1. Extract main title from \`## Title\` format
2. CRITICAL: Convert ALL \`### Subsection\` to \`<h3>\` tags - do NOT skip any
3. Progress items become road-card with optional progress bar
4. Extract percentage from text like "Progress: 65%", "進捗率: 65%", "진행률: 65%"
5. Set progress bar width as inline style: style="width: XX%;"
6. Tables become roadmap-table
7. Lists become ul/li
8. Preserve all emojis and original language labels

## Progress Bar Examples
- Has progress: "進捗率: 65%" → include nl-progress-bar with width: 65%
- No progress: show only road-meta with date

## Output
Return ONLY the HTML div element, nothing else.`;
