/**
 * KPI Newsletter - Contributor Highlights 섹션 → HTML 변환 프롬프트
 */
export const KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS = `You are converting a markdown contributor highlights section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the contributor highlights section containing:
- Section title (## format, e.g. ## 🌟 Contributor Highlights)
- Ranked contributors (1., 2., 3. or ### format)
- Achievement descriptions

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">🌟 [Section Title]</h2>
  <div class="contributor-card">
    <h3><span class="contributor-rank">#1</span>[Name]</h3>
    <p>[Achievement description]</p>
  </div>
  <div class="contributor-card">
    <h3><span class="contributor-rank">#2</span>[Name]</h3>
    <p>[Achievement description]</p>
  </div>
  <!-- More contributor-cards... -->
</div>
\`\`\`

## Rules
1. Extract section title from \`## Title\` format
2. Each ranked contributor becomes a contributor-card
3. When listing ranked contributors (1., 2., 3. or Top N), use contributor-rank badge
4. Example: "1. jinuSon: 7 commits" → card with \`<span class="contributor-rank">#1</span>\`
5. Achievement descriptions go in \`<p>\` tags
6. Convert **bold** to <strong>bold</strong>
7. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
