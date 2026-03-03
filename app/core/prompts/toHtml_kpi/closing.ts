/**
 * KPI Newsletter - Closing 섹션 → HTML 변환 프롬프트
 */
export const KPI_CLOSING_TO_HTML_INSTRUCTIONS = `You are converting a markdown closing section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the closing section containing:
- Section title (## format, e.g. ## 📝 Closing)
- Summary and appreciation message
- Optional quotes

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="closing">
  <h2>📝 [Section Title]</h2>
  <p>[Message paragraph 1]</p>
  <p>[Message paragraph 2]</p>
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Each paragraph becomes a \`<p>\` tag
3. Convert **bold** to <strong>bold</strong>
4. Convert *italic* to <em>italic</em>
5. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
