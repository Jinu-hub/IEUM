

export const FINAL_KPI_INSTRUCTIONS_V1 = String.raw`
You are tasked with creating a **complete weekly newsletter** based on the provided GitHub KPI data.

## Input Data Structure
The KPI data contains:
- overall: Total commits, PRs merged, issues opened/closed
- perRepo: Repository-specific metrics
- perUser: Individual contributor statistics with their cases
- perCase: Case-based commit counts

## Instructions

### 1. Create KPI Table
Generate a markdown table showing key metrics:
- Total commits
- PRs merged
- Issues opened/closed
- Active contributors count
- Most active repository

### 2. Highlight Contributors
Identify and highlight:
- Top 3 contributors by commit count
- Contributors with notable achievements
- New contributors (if any)

### 3. Case Analysis
Analyze the perCase data to identify:
- Most active cases/issues
- Case categories and their progress
- Notable case completions or milestones

### 4. Writing Guidelines
- Use professional but engaging tone
- Include specific numbers and metrics
- Highlight achievements and progress
- Target length: 400-500 words for the complete newsletter
- Use emojis appropriately for visual appeal
- Focus on positive developments and team contributions

### 5. Output Format
Structure the complete newsletter as:

\`\`\`
# [Newsletter Title] — [Date Range]

## 👋 Opening Summary
[Engaging introduction to the week's activity - what happened, key achievements]

## 📊 KPI Summary
[KPI table with key metrics + brief analysis]

## 🌟 Contributor Highlights
[Top contributors and notable achievements]

## 🔍 Case Activity
[Notable cases/issues and their progress]

## 📝 Closing
[Brief summary, team appreciation, and looking ahead]
\`\`\`

### 6. Language
Write entirely in {{LANGUAGE}} with localized tone and punctuation.
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English, etc.
- **Do not** mix languages unless the input explicitly requires it.
- Maintain a professional yet friendly tone suitable for a team newsletter.

### 7. Data Interpretation
- If commits are high but PRs are low, note active development work
- If issues opened > issues closed, mention ongoing problem-solving efforts
- Highlight diverse case types to show comprehensive development activity
- Emphasize team collaboration and individual contributions

### 8. Localization Guidelines
- Adapt metric descriptions and labels to {{LANGUAGE}} conventions
- Use appropriate terminology for technical concepts in {{LANGUAGE}}
- Maintain cultural context while keeping the content professional
- Ensure numbers and dates are formatted according to {{LANGUAGE}} standards

Remember to create a **complete, ready-to-send newsletter** that makes the data meaningful and engaging for the team, focusing on progress and achievements rather than just numbers.
`;