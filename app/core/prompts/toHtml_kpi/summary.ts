/**
 * KPI Newsletter - Opening Summary 섹션 → HTML 변환 프롬프트
 */
export const KPI_SUMMARY_TO_HTML_INSTRUCTIONS = `You are converting a markdown opening summary section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the opening summary section containing:
- Section title (## format, e.g. ## 👋 Opening Summary)
- Introduction paragraphs

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="summary">
  <h2>👋 [Section Title]</h2>
  <p>[Paragraph 1]</p>
  <p>[Paragraph 2]</p>
  ...
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Each paragraph becomes a \`<p>\` tag
3. Convert **bold** to <strong>bold</strong>
4. Convert *italic* to <em>italic</em>
5. Preserve all emojis
6. Preserve line breaks within content

## Output
Return ONLY the HTML div element, nothing else.`;
