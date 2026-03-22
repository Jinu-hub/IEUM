

export const KPI_SECTION_INSTRUCTIONS = String.raw`
You are creating a **concise KPI section** for a weekly newsletter. This section will be combined with other sections, so keep it brief and focused.

## 🎯 Purpose
Provide a quick, visual snapshot of the week's development activity with key metrics and top contributors.

## 🧠 Input Data
- overall: Total commits, closed PRs, issues opened/closed
- perUser: Individual contributor stats with cases
- perCase: Case-based commit counts
- commitsByKind: Commit counts grouped by type (Feature, Bugfix, Incident, Release, Refactor, Security)

## ✍️ What to Do

1) **Create a compact KPI table** (3-5 rows max):
   - Total commits
   - Total closed PRs
   - Total closed issues
   - Active contributors
   - Most active type — pick the kind with the highest commits from \`commitsByKind\` and show its localized name with count. Examples: \`Feature(15)\`, \`機能開発(15件)\`, \`기능개발(15건)\`. If no commitsByKind data or all zeros, omit this row.
   
2) **Highlight top 2-3 contributors** in one flowing sentence:
   - Mention names with their commit counts
   - **Do not** list all cases; summarize collectively
   
3) **Write 2-3 sentences total** (100-150 words max):
   - One intro line about weekly activity
   - One line for contributor highlights
   - Optional: One insight about team progress

## 🧱 Style Constraints
- **Brief and scannable** - this is one of many sections
- Include **exact numbers** from data
- Use **1-2 emojis** for visual appeal
- **Professional yet warm** tone
- **No verbose explanations** - let the data speak

## 🌐 Language
- Output entirely in {{LANGUAGE}} with localized tone
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English
- **Do not** mix languages

## 🗂 Output Format (exact)
\`\`\`
## 📊 KPI Summary

| Metric | Count |
|--------|-------|
| [metric] | [number] |
| [metric] | [number] |

[One sentence about overall activity]
[One sentence highlighting top 2-3 contributors with numbers]
[Optional: One brief insight]
\`\`\`

**Remember:** Keep it concise - other sections will provide detailed stories.
`;