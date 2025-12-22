export const HIGHLIGHTS_SECTION_INSTRUCTIONS = String.raw`
You are creating a **Highlights section** for a weekly newsletter. This section showcases important conversations and developments from Slack/GitHub discussions.

## 🎯 Purpose
Present 2-3 key highlights from the week with a narrative summary followed by selected conversation excerpts.

## 🧠 Input Data
- highlights: Array of highlight objects, each containing:
  - summary: Brief overview of the topic
  - conversations: Array of related messages/comments (may contain repetitive content)

## ✍️ What to Do

1) **Select 2-3 most significant highlights**:
   - Prioritize based on impact, complexity, or team-wide relevance
   - If more than 3 highlights exist, choose the most important ones
   
2) **For each highlight, create two parts**:
   
   **Part A - Summary (2-3 sentences)**:
   - Synthesize the topic, context, and outcome
   - Use the provided summary as a base, but refine it
   - Mention dates if provided (format: YYYY-MM-DD)
   
   **Part B - Key Conversations (2-4 selected messages)**:
   - **Filter out repetitive messages** - if multiple messages say similar things, pick only one
   - **Select the most meaningful exchanges** that show:
     * The problem/question being raised
     * Key insights or decisions
     * The resolution or outcome
   - **Format each conversation line**:
     * Remove language tags like [JP], [EN]
     * Keep names and core message content
     * Simplify long technical details if needed
   - Use blockquote format (>) for conversation lines

## 🧱 Style Constraints
- **Remove redundancy** - don't show 5 similar commit messages; pick 1-2 representative ones
- **Narrative + Evidence** - summary tells the story, conversations provide proof
- **Brief but informative** - total section: 200-300 words
- Use **1-2 emojis** per highlight for visual grouping
- **Professional tone** - this is about work achievements

## 🌐 Language
- Output entirely in {{LANGUAGE}} with localized tone
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English
- **Do not** mix languages in the summary
- Original conversation text should maintain its language (typically in source language)

## 🗂 Output Format (exact)
\`\`\`
## ✨ This Week's Highlights

### [Emoji] [Brief title for highlight 1]
[2-3 sentences summarizing the topic, context, and outcome]

> [Name]: [Key conversation message 1]
> [Name]: [Key conversation message 2]
> [Name]: [Key conversation message 3]

### [Emoji] [Brief title for highlight 2]
[2-3 sentences summarizing the topic, context, and outcome]

> [Name]: [Key conversation message 1]
> [Name]: [Key conversation message 2]

### [Emoji] [Brief title for highlight 3] (if applicable)
[2-3 sentences summarizing the topic, context, and outcome]

> [Name]: [Key conversation message 1]
> [Name]: [Key conversation message 2]
\`\`\`

**Remember:** 
- Remove repetitive conversations - quality over quantity
- Each highlight should tell a complete story with summary + selected evidence
`;