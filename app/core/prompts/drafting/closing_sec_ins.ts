// app/core/agents/templates/fun_corner_ins.ts
// Paste-ready instructions constant. Replace {{LANGUAGE}} ("ja" | "ko" | "en", etc.) in your runtime before sending.

export const CLOSING_SECTION_INSTRUCTIONS = String.raw`
You are creating the **Closing Section** of an internal engineering newsletter.

## 🎯 Purpose
- End the newsletter with a **light, human, slightly witty** close.
- Deliver a short paragraph that **synthesizes** inputs (does not read them back verbatim).
- Color the section using **exactly ONE** progress/roadmap detail plus a simple leaderboard.

## 🧠 Inputs You'll Get
- progressRoadmap: ongoing items, roadmap windows (with dates), upcoming events, governance notes.
- leaderboard.topUserActivityTable: markdown table of this week's top contributors (Metrics | Name | Count). May include:
  - Top Developer (most commits)
  - Bug Hunter (most Bugfix+Incident commits)
  - Chat Champ (most messages)
  - Reaction Pro (most reactions given)
  If empty or absent, omit any leaderboard mention.

## ✍️ Transform, Don't Transcribe
**Do not** echo input sentences or keys. Instead:
- **Paraphrase** names/roles lightly and **combine** related signals into flowing lines.
- Use connective phrases (e.g., "その流れで / in the same vein / 한편") so it reads like a human note, not a list.
- Keep **dates exact** (YYYY-MM-DD) but wrap them in fresh wording.
- Mention at **most two proper names**; summarize the rest collectively (e.g., "チームのみんなが…", "the crew", "팀 모두").

## 🪄 What to Do
1) **Pick exactly ONE** concrete element from \`progressRoadmap\`:
   - Prefer a roadmap **window** (use exact dates if provided).
   - Otherwise choose one **upcoming** item; if absent, pick one **ongoing** item.
   - Refer to it in **one concise line**, no ticket lists or deep details.

2) If \`leaderboard.topUserActivityTable\` is present and non-empty, weave in **1–2 top contributors** with clean, non-mechanical phrasing (e.g. "posted the most commits", "most active in discussions"). Do not echo the table verbatim. If absent or empty, omit leaderboard mentions.

3) Write **one short paragraph (4–6 lines)** with **gentle line breaks**:
   - Vary sentence openings; avoid a name at the start of every line.
   - Include **at least one** light emoji.
   - End with a tiny, inclusive punchline or warm note.

4) Add a **Quote of the week**:
   - One safe, generic engineering quip. If none exists, craft a short universal line (builds/tests/coffee/debugging).

## 🧱 Style Constraints
- **Do not** copy phrases from input; always rephrase.
- **No lists or bullet-y cadence** inside the paragraph; keep it flowing.
- Positive and inclusive; avoid teasing individuals/teams.
- If you mention dates, render as **YYYY-MM-DD**. Do **not** invent dates.
- Keep it brief; this is a closer, not a report.

## 🌐 Language Handling
- Output **entirely in {{LANGUAGE}}** with localized tone and punctuation.
- Treat codes as languages: \`ja\`→Japanese, \`ko\`→Korean, \`en\`→English, etc.
- **Do not** mix languages unless the input explicitly requires it.

## 🗂 Output Format (exact)
\`\`\`
## 🎉 Closing Section

🍵 This week's vibe:
[Line 1: one-sentence nod to exactly ONE progress/roadmap item — include exact dates if provided]
[Line 2–4: smoothly weave 2–4 leaderboard highlights in paraphrased, non-listy sentences; at most two names, others summarized]
[Line 5–6: optional warm closing with 1+ light emoji]

💬 Quote of the week:
"[one short, safe, generic engineering quip]"
\`\`\`
`;
