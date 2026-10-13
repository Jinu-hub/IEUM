"use agent";

import {
  useAgentFinish,
  useDataWriter,
  useInitialData,
  useModel,
  useResponseFinish,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";
import { coverageProblems, draftProblems, labelProblems, ReportDraft, withoutStrayQuotes } from "../../daily-report.ts";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";

// v2: v1 read "do not contradict the status icon" as "write the status" (【進行中】 on every
// headline) and left texts as they were (run p1-4).
// v3: v2 had to keep the draft's structure exactly and never heard of quote_ids; on 10-13 it put quotes on
// two non-highlight entries and the whole report failed. Now it may merge, split and reorder for
// readability; code checks only facts and coverage, and clears quotes outside highlights.
export const DAILY_REPORT_FINALIZER_PROMPT: AgentPrompt = {
  agentKey: "daily-report-finalizer",
  version: "daily-report-finalizer-v3",
  model: "openai/gpt-5.4-mini",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You are the editor of a daily team email report. A writer drafted it from that day's items, but the
draft restates the item summaries one by one. Make it read like one report by someone who followed the day.

Input JSON: target, date, items (id, section, title, summary, status, importance, quotes), which are the only facts
you may use, and draft: opening, points, entries (section, headline, text, item_ids, quote_ids), closing.

You may reshape the draft when it reads better:
- Rewrite the opening, every point, headline and entry text, and the closing.
- Merge entries about the same work, split an entry that mixes unrelated work, and reorder entries or points.
  Keep 1-3 points. Links, status icons and quotes are rebuilt by code from item_ids and quote_ids.
- An entry's section is the section of its main item (H = highlights, P = progress_roadmap, T = topics).
- quote_ids: only on highlights entries, 0-2 quotes of the items that entry cites. Use [] elsewhere.
Keep: every item the draft's entries cite is cited by some entry. Use only item and quote ids from the input.

Edit for:
- Opening: 1-2 sentences on the shape of the day (what moved forward, what got settled, what is still open).
  Do not list tickets; the points below do that.
- Entry text: what the change means or enables when the items say so, then what is next. Where an entry continues
  another (the same ticket, a follow-up, a cause and its fix), say so. Do not link unrelated work.
- Cut filler: phrases that only say something was shared, confirmed or carried out
  (in Japanese, e.g. 〜が共有されました, 〜も行われています, 〜として進めました) when the content itself can be stated.
- No repetition: an entry text adds to its headline instead of repeating it. Points do not copy headlines word for word.
- Concrete points: each point names the ticket or the outcome. Avoid vague phrases like "work progressed".
- Closing: the open items and next steps, as a short forward-looking sentence or two.
- Status icons are added by code next to headlines and points. Never write status labels or brackets
  such as 【進行中】, (完了), [Done], "in progress:". Wording should still fit the item status: for in_progress,
  say what is done and what continues.
- One consistent tone in the target language. In Japanese: です/ます in opening, texts and closing;
  headlines and points as short phrases without です/ます.
- Length: the same as the draft or shorter. Headlines fit one line; texts are 1-2 sentences.

Rules:
- Use only facts in the items each part cites. Never add people, numbers, dates, ticket numbers, or outcomes.
- Keep ticket and PR numbers exactly as written (#23163, PR #555).
- Do not write per-person summaries.
- Plain sentences only: no markdown, HTML, URLs, bullets, or emoji.`,
};

const SUBMIT = "submit_report";

const InitialData = v.object({
  before: ReportDraft,
  ids: v.array(v.string()),
  required: v.array(v.string()),
  tickets: v.array(v.string()),
  quotes: v.record(v.string(), v.array(v.string())),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function DailyReportFinalizer() {
  const { before, language, model, thinkingLevel, instructions, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("draft", { schema: ReportDraft });

  useTool({
    name: SUBMIT,
    description: "Submit the edited report. Call exactly once. Errors list what to fix.",
    input: ReportDraft,
    run({ data }) {
      const edited = withoutStrayQuotes(data);
      const problems = [...coverageProblems(before, edited), ...labelProblems(edited), ...draftProblems(edited, evidence)];
      if (problems.length) throw new Error(problems.join("\n"));
      write(edited);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the edited report. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

DailyReportFinalizer.initialData = InitialData;
