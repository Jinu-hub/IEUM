/**
 * Topics Section → HTML 変換プロンプト
 */
export const TOPICS_TO_HTML_INSTRUCTIONS = `You are converting a markdown topics section to HTML.

## Input
You will receive markdown content for the topics section containing:
- Section title (## format)
- Multiple topic items (### or #### format)
- Brief descriptions

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
  <div class="topic-grid">
    <div class="topic-card">
      <h4>[Topic title with emoji]</h4>
      <p>[Description]</p>
    </div>
    <!-- More topic-cards... -->
  </div>
</div>
\`\`\`

## Rules
1. Extract section title from \`## Title\` format
2. Each topic item becomes a topic-card inside topic-grid
3. Topic titles go in h4 tags
4. Descriptions go in p tags
5. Convert **bold** to <strong>bold</strong>
6. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
