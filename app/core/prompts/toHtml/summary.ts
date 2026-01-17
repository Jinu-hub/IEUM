/**
 * Summary Section → HTML 変換プロンプト
 */
export const SUMMARY_TO_HTML_INSTRUCTIONS = `You are converting a markdown summary section to HTML.

## Input
You will receive markdown content for the summary section containing:
- Section title (## format)
- Paragraph content

## Task
Convert to this exact HTML structure:

\`\`\`html
<div class="summary">
  <h2>[Title]</h2>
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
