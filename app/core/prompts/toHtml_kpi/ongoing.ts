/**
 * KPI Newsletter - Ongoing/Roadmap 섹션 → HTML 변환 프롬프트
 */
export const KPI_ONGOING_TO_HTML_INSTRUCTIONS = `You are converting a markdown ongoing/roadmap section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the ongoing section containing:
- Section title (## format)
- Simple list items describing current work and plans

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
  <ul>
    <li>[Item 1]</li>
    <li>[Item 2]</li>
    ...
  </ul>
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Each \`- item\` becomes a \`<li>\` inside a single \`<ul>\`
3. Convert **bold** to <strong>bold</strong>
4. Preserve all emojis
5. Keep it simple — no cards, no progress bars, no tables unless explicitly present in input

## Output
Return ONLY the HTML div element, nothing else.`;
