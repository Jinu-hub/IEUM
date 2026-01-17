/**
 * Closing Section → HTML 変換プロンプト
 */
export const CLOSING_TO_HTML_INSTRUCTIONS = `You are converting a markdown closing section to HTML.

## Input
You will receive markdown content for the closing section containing:
- Section title (## format)
- Message paragraphs
- Optional quotes

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="closing">
  <h2>[Title]</h2>
  <p>[Message paragraph 1]</p>
  <p>[Message paragraph 2]</p>
  <!-- If quote exists -->
  <div class="closing-quote">
    <p>[Quote text]</p>
  </div>
</div>
\`\`\`

## Rules
1. Extract title from \`## Title\` format
2. Each paragraph becomes a \`<p>\` tag
3. Blockquotes (\`> text\`) go inside closing-quote div
4. Convert **bold** to <strong>bold</strong>
5. Convert *italic* to <em>italic</em>
6. Preserve all emojis

## Output
Return ONLY the HTML div element, nothing else.`;
