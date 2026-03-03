/**
 * KPI Newsletter - KPI Summary 섹션 → HTML 변환 프롬프트
 */
export const KPI_KPI_TO_HTML_INSTRUCTIONS = `You are converting a markdown KPI summary section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the KPI section containing:
- Section title (## format, e.g. ## 📊 KPI Summary)
- Table with metrics (commits, PRs, issues, etc.)
- Optional analysis notes

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">📊 [Section Title]</h2>
  <table class="kpi-table">
    <thead>
      <tr>
        <th>[Header 1]</th>
        <th>[Header 2]</th>
        ...
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>[Metric]</td>
        <td>[Value]</td>
        ...
      </tr>
      ...
    </tbody>
  </table>
  <p class="kpi-note">[Analysis text if any]</p>
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Convert markdown table to HTML table with class="kpi-table"
3. First row becomes thead, rest becomes tbody
4. Any note/analysis after table gets class="kpi-note"
5. Preserve all emojis and formatting
6. Convert **bold** to <strong>bold</strong>

## Output
Return ONLY the HTML div element, nothing else.`;
