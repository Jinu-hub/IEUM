/**
 * KPI Newsletter - Case Activity 섹션 → HTML 변환 프롬프트
 * DividedContents의 "topics" 섹션에 매핑
 */
export const KPI_TOPICS_TO_HTML_INSTRUCTIONS = `You are converting a markdown case activity section to HTML for a GitHub KPI newsletter.

## Input
You will receive markdown content for the case activity section containing:
- Section title (## format, e.g. ## 🔍 Case Activity)
- Case/issue entries with IDs and descriptions
- Optional case tags

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">🔍 [Section Title]</h2>
  <div class="case-card">
    <h4><span class="case-tag">[Case ID]</span>[Case Title]</h4>
    <p>[Case description]</p>
  </div>
  <div class="case-card">
    <h4><span class="case-tag">[Case ID]</span>[Case Title]</h4>
    <p>[Case description]</p>
  </div>
  <!-- More case-cards... -->
</div>
\`\`\`

## Rules
1. Extract section title from \`## Title\` format
2. Each case/issue becomes a case-card
3. Case IDs (like #12345, CASE-123, issue numbers) → \`<span class="case-tag">[ID]</span>\`
4. Case titles go in \`<h4>\` tags
5. Descriptions go in \`<p>\` tags
6. Convert **bold** to <strong>bold</strong>
7. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
