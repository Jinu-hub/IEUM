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
import { DailyCoreOutput, evidenceProblems } from "../daily-core.ts";

export const DAILY_CORE_MODEL = "openai/gpt-5.4-mini";
export const DAILY_CORE_PROMPT_VERSION = "daily-core-v3.1";

const SUBMIT = "submit_daily_core";

const InitialData = v.object({
  refs: v.array(v.string()),
  contextRefs: v.array(v.string()),
  botRefs: v.array(v.string()),
  people: v.array(v.string()),
  language: v.string(),
  model: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function DailyCore() {
  const { language, model, ...evidence }: InitialData = useInitialData();
  useModel(model);
  const writeCore = useDataWriter("dailyCore", { schema: DailyCoreOutput });

  useTool({
    name: SUBMIT,
    description: "Submit the finished Daily Core. Call exactly once. Errors list what to fix.",
    input: DailyCoreOutput,
    run({ data }) {
      const problems = evidenceProblems(data, evidence);
      if (problems.length) throw new Error(problems.join("\n"));
      writeCore(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the Daily Core. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `You build a Daily Core: the structured record of one team's activity on one local day.
It is the source for later reports and long-term memory, so precision beats prose.

Input: messages and repository events grouped by source. Each line is
[source_ref] HH:MM author (kind): text
Replies are indented under their thread parent with "↳".
Lines marked "(context, YYYY-MM-DD)" are older thread parents shown only to explain replies.
They did not happen on this day.
Lines marked "(bot notification)" are posted by integrations such as Redmine.
A name inside such a line (e.g. "X updated #123") is not the author, and is often not a team member.
They only show that a ticket changed that day, not what changed.

Rules:
- Use only facts in the input. Never invent names, numbers, or outcomes.
- Every item cites evidence_refs, using source_ref ids from the input. Each item must cite at least one ref that is not a context line.
- Put each event in one of highlights, topics, or progress_roadmap, not several.
  - highlights: the 3-5 most important outcomes or decisions of the day.
  - topics: discussions and themes (at most 8).
  - progress_roadmap: concrete work moving forward, such as tickets, PRs, and releases, with status.
  - member_activity: one item per person who wrote messages, commits, or PRs themselves, summarizing what they did. It may cite the same refs as the other arrays.
    The title is only the person's name, exactly as written in the input.
- Bot notifications may be cited as supporting evidence for an item about the same ticket. Never create a member_activity item from bot notifications alone.
- overview.summary: 2-4 sentences. key_points: at most 5.
- If the day has no meaningful activity, return empty arrays and say so in the overview.
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

DailyCore.initialData = InitialData;
