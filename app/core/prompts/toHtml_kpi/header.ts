/**
 * KPI Newsletter - Header 섹션 → HTML 변환 프롬프트
 */
export const KPI_HEADER_TO_HTML_INSTRUCTIONS = `You are converting a markdown header section to HTML for a GitHub KPI newsletter.

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
   - \`# Weekly KPI Report — 2025-12-8 ~ 2025-12-15\` → h1: "Weekly KPI Report", h3: "2025-12-8 ~ 2025-12-15"
   - \`# KPIレポート — 2025-12-8 ~ 2025-12-15\` → h1: "KPIレポート", h3: "2025-12-8 ~ 2025-12-15"
   - \`# KPI 리포트 — 2025-12-8 ~ 2025-12-15\` → h1: "KPI 리포트", h3: "2025-12-8 ~ 2025-12-15"

## Output
Return ONLY the HTML div element, nothing else.`;
