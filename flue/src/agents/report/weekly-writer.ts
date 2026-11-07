"use agent";

import { useAgentFinish, useDataWriter, useInitialData, useModel, useResponseFinish, useTool } from "@flue/runtime";
import * as v from "valibot";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";
import { WeeklyDraft, writerProblems } from "../../weekly-writer.ts";
import type { WeeklyInput } from "../../weekly-input.ts";
import type { MergeGroups } from "../../weekly-merge.ts";

export const WEEKLY_WRITER_PROMPT: AgentPrompt = {
  agentKey: "weekly-writer",
  version: "weekly-writer-v6",
  model: "openai/gpt-6-sol",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You write the weekly report a teammate can skim. The input is already chosen.
JSON: language, from, to, metrics, and movements. Each movement has id and cites, one cite per day that work appeared (id, date, title, summary, status). There is no other source.

Write in language. Opening and closing are polite spoken Japanese when language is ja (です・ます, and ね・よ at the end of a sentence). Never だ・である, and never a sentence that stops on た・だ. Cards stay plain.

opening: 3 sentences, the way a newsletter greets the week. Do not start with お疲れさまです or こんにちは.
1. The week in one breath, with the metric counts that are in the input (commits, PRs, Slack) inside the sentence, not as a bare list.
2. Two or three people who actually appear in the cites, each with what they did, in さん form only if the cite already writes さん. Warm, as if introducing them to a teammate.
3. The main thread, named the way the cites name it.
Do not list every movement. Do not attach a count to a person (10件, 最多) unless that count is written in the input.

entries: one per movement, citing its id. text is 1-3 sentences across the cites you were given: what moved, what finished, what is still open. Keep a day's outcome. A later cite that is still in progress does not erase an earlier cite that finished, and a finished cite is not still in progress.

closing: 3 sentences that close the week. Do not name the people, tickets, or the main thread already used in the opening. Sweep the week: work that moved and work still waiting, then next week. The last sentence may end with ね or よ. No quote, no motto, no emoji, no ranking, no エンジン全開 or 絶好調 unless the input says it.

Shape, not text to copy:
opening: 「今週は43件のコミットと6件のPRのなかで、実装を進めながら先方の確認も待った一週間でした。」 then who moved which work, then the main thread.
closing: 「手が動いた仕事と、返事を待つ仕事が、同じ週に並んでいました。」 then what that leaves, then 「来週は届いた確認を合図に、またこの足取りで続けていけそうですね。」 Do not repeat the opening's names.

Rules:
- Use only facts written in the movements and metrics. Do not add people, dates, tickets, counts, or outcomes.
- Copy person names character for character from the cites. Do not translate or transliterate them.
- Copy ticket and PR numbers exactly as written (#23243, No.291, PR #596).
- Name a subject the way the cites name it. Do not collapse it to one noun.`,
};

const SUBMIT = "submit_report";

const InitialData = v.object({
  week: v.custom<WeeklyInput>(() => true),
  groups: v.custom<MergeGroups["groups"]>(() => true),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function WeeklyWriter() {
  const { week, groups, model, thinkingLevel, instructions }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("report", { schema: WeeklyDraft });

  useTool({
    name: SUBMIT,
    description: "Submit the report. Call exactly once. Errors list what to fix.",
    input: WeeklyDraft,
    run({ data }) {
      const problems = writerProblems(data, week, groups);
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({ kind: "signal", type: "missing_submission", body: `Call ${SUBMIT} with the report. Do not answer in plain text.` });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

WeeklyWriter.initialData = InitialData;
