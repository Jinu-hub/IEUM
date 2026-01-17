/**
 * Highlights Section → HTML 変換プロンプト
 */
export const HIGHLIGHTS_TO_HTML_INSTRUCTIONS = `You are converting a markdown highlights section to HTML.

## Input
You will receive markdown content for the highlights section containing:
- Section title (## format)
- Multiple highlight items (### format)
- Descriptions and quotes

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="section">
  <h2 class="section-title">[Title]</h2>
  <div class="highlight-card">
    <h3>[Item title with emoji]</h3>
    <p>[Description]</p>
    <div class="quote-box">
      <p>[Quote/conversation line 1]</p>
      <p>[Quote/conversation line 2]</p>
    </div>
  </div>
  <!-- More highlight-cards... -->
</div>
\`\`\`

## Rules
1. Extract section title from \`## Title\` format
2. Each \`### Item\` becomes a highlight-card
3. Blockquotes (\`> text\`) go inside quote-box
4. Multiple consecutive blockquotes share one quote-box
5. Convert **bold** to <strong>bold</strong>
6. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
