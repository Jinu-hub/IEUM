/**
 * KPI Section → HTML 変換プロンプト
 */
export const KPI_TO_HTML_INSTRUCTIONS = `You are converting a markdown KPI section to HTML.

## Input
You will receive markdown content for the KPI section containing:
- Section title (## format)
- Table with metrics
- Optional notes

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
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
        <td>[Cell 1]</td>
        <td>[Cell 2]</td>
        ...
      </tr>
      ...
    </tbody>
  </table>
  <p class="kpi-note">[Note if present]</p>
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Convert markdown table to HTML table with class="kpi-table"
3. First row becomes thead, rest becomes tbody
4. Any note after table gets class="kpi-note"
5. Preserve all emojis and formatting
6. Convert **bold** to <strong>bold</strong>

## Output
Return ONLY the HTML div element, nothing else.`;
