/**
 * Header Section → HTML 変換プロンプト
 */
export const HEADER_TO_HTML_INSTRUCTIONS = `You are converting a markdown header section to HTML.

## Input
You will receive markdown content for the newsletter header containing:
- Title (# format)
- Date range

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="header">
  <h1>[Title without date range]</h1>
  <h3 class="date">[Date range]</h3>
</div>
\`\`\`

## Rules
1. Extract main title from \`# Title — Date Range\` format
2. Remove date range from h1, put it in h3.date
3. Preserve all emojis
4. Examples:
   - \`# Weekly Newsletter — 2025-12-8 ~ 2025-12-15\` → h1: "Weekly Newsletter", h3: "2025-12-8 ~ 2025-12-15"
   - \`# 👋 週次Newsletter — 2025-12-8 ~ 2025-12-15\` → h1: "👋 週次Newsletter", h3: "2025-12-8 ~ 2025-12-15"
   - \`# 주간 뉴스레터 — 2025-12-8 ~ 2025-12-15\` → h1: "주간 뉴스레터", h3: "2025-12-8 ~ 2025-12-15"

## Output
Return ONLY the HTML div element, nothing else.`;
