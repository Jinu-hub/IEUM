/**
 * KPI Newsletter - 멤버 활동 섹션 → HTML 변환 프롬프트
 */
export const KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS = `You are converting a markdown member activity section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the member activity section containing:
- Section title (## format)
- Ranked member entries with name and activity description
  - Format: "#1 Name" or "**Name**" followed by description

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
  <div class="contributor-card">
    <h3><span class="contributor-rank">#1</span>[Name]</h3>
    <p>[Activity description]</p>
  </div>
  <div class="contributor-card">
    <h3><span class="contributor-rank">#2</span>[Name]</h3>
    <p>[Activity description]</p>
  </div>
  <!-- More contributor-cards... -->
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Each member becomes a contributor-card
3. Extract rank number (#1, #2, ...) → \`<span class="contributor-rank">#N</span>\`
4. If no explicit rank, assign sequential numbers starting from #1
5. Name goes after the rank badge in \`<h3>\`
6. Activity description goes in \`<p>\` (can be multiple paragraphs)
7. Convert **bold** to <strong>bold</strong>
8. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
