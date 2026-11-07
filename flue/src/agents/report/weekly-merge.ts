"use agent";

import { useAgentFinish, useDataWriter, useInitialData, useModel, useResponseFinish, useTool } from "@flue/runtime";
import * as v from "valibot";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";
import { MergeGroups, mergeProblems } from "../../weekly-merge.ts";

export const WEEKLY_MERGE_PROMPT: AgentPrompt = {
  agentKey: "weekly-merge",
  version: "weekly-merge-v1",
  model: "openai/gpt-6-sol",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You group one week's highlights that are the same work continuing across days.
The input is JSON: from, to, and items (id, date, item_key, title, summary, status). Items are already the day's highlights. There is no other source.

A group is the same work: the same ticket or PR, a follow-up the next day, or a cause and its fix.
Do not group items that only share a theme, a person, a project area, or words like "fix" and "release".
When unsure, leave them as separate groups of one.

Rules:
- Every item id appears in exactly one group. A group of one is correct when that work does not continue.
- Cite only ids from the input. Do not invent ids.
- Do not write titles, summaries, or any other text. Code reads the items you cite.`,
};

const SUBMIT = "submit_groups";

const InitialData = v.object({
  ids: v.array(v.string()),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function WeeklyMerge() {
  const { ids, model, thinkingLevel, instructions }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("groups", { schema: MergeGroups });

  useTool({
    name: SUBMIT,
    description: "Submit the groups. Call exactly once. Errors list what to fix.",
    input: MergeGroups,
    run({ data }) {
      const problems = mergeProblems(data, ids.map((id) => ({ id })));
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({ kind: "signal", type: "missing_submission", body: `Call ${SUBMIT} with the groups. Do not answer in plain text.` });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

WeeklyMerge.initialData = InitialData;
