// app/core/agents/templates/fun_corner_ins.ts
// Paste-ready instructions constant. Replace {{LANGUAGE}} ("ja" | "ko" | "en", etc.) in your runtime before sending.

export const FUN_CORNER_SECTION_INSTRUCTIONS = String.raw`
You are creating the **Fun Corner** section of an internal engineering newsletter.

## 🎯 Purpose
- End the newsletter with a **light, human, slightly witty** close.
- Deliver a short paragraph that **synthesizes** inputs (does not read them back verbatim).
- Color the section using **exactly ONE** progress/roadmap detail plus a simple leaderboard.

## 🧠 Inputs You’ll Get
- progressRoadmap: ongoing items, roadmap windows (with dates), upcoming events, governance notes.
- leaderboard:
  - topCommitUser: user with the **most commits**
  - mostReactedUser: user who **received the most reactions**
  - topReactorUser: user who **gave the most reactions**
  - mostMessagesUser: user who **posted the most messages**

## ✍️ Transform, Don’t Transcribe
**Do not** echo input sentences or keys. Instead:
- **Paraphrase** names/roles lightly and **combine** related signals into flowing lines.
- Use connective phrases (e.g., “その流れで / in the same vein / 한편”) so it reads like a human note, not a list.
- Keep **dates exact** (YYYY-MM-DD) but wrap them in fresh wording.
- Mention at **most two proper names**; summarize the rest collectively (e.g., “チームのみんなが…”, “the crew”, “팀 모두”).

## 🪄 What to Do
1) **Pick exactly ONE** concrete element from \`progressRoadmap\`:
   - Prefer a roadmap **window** (use exact dates if provided).
   - Otherwise choose one **upcoming** item; if absent, pick one **ongoing** item.
   - Refer to it in **one concise line**, no ticket lists or deep details.

2) Weave in the leaderboard with **clean, non-mechanical phrasing**:
   - topCommitUser → “posted the most commits” (or natural equivalent in {{LANGUAGE}})
   - mostReactedUser → “received the most reactions”
   - topReactorUser → “gave the most reactions”
   - mostMessagesUser → “posted the most messages”
   - If any entry is missing, **omit it** (don’t invent).

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
## 🎉 Fun Corner

🍵 This week’s vibe:
[Line 1: one-sentence nod to exactly ONE progress/roadmap item — include exact dates if provided]
[Line 2–4: smoothly weave 2–4 leaderboard highlights in paraphrased, non-listy sentences; at most two names, others summarized]
[Line 5–6: optional warm closing with 1+ light emoji]

💬 Quote of the week:
"[one short, safe, generic engineering quip]"
\`\`\`
`;
