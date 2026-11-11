"use agent";

import { useAgentFinish, useDataWriter, useInitialData, useModel, useResponseFinish, useTool } from "@flue/runtime";
import * as v from "valibot";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";
import { type TopicItem, topicsProblems, WeeklyTopics as TopicsDraft } from "../../weekly-topics.ts";

export const WEEKLY_TOPICS_PROMPT: AgentPrompt = {
  agentKey: "weekly-topics",
  version: "weekly-topics-v1",
  model: "openai/gpt-6-sol",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You write the topics overview of a weekly report.
The input is JSON: language, from, to, and categories. Each category has key, count, and items (id, date, kind, title, summary, status). Items are the week's discussions (topic) and progress, not the highlights. Code already sorted them into categories:
bugfix = defect fixes, feature = new or changed behavior, coordination = decisions, priorities, assignments, waiting on others, investigation = research and repro without a ship, other = docs, performance, tooling, release.
There is no other source.

Write one entry per category in the input:
- key: the category key.
- ids: the 2-4 items your text is mainly about, from that category only.
- text: 1-2 plain sentences in language that sweep the category this week: the main threads and where they stand. You may use the count as written (計11件). Name the subject the way the items name it.

Rules:
- Use only facts written in that category's items. Do not add people, dates, tickets, counts, or outcomes.
- Copy person names, ticket numbers, and PR numbers exactly as written.
- Do not list every item.`,
};

const SUBMIT = "submit_topics";

const InitialData = v.object({
  items: v.custom<TopicItem[]>(() => true),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function WeeklyTopics() {
  const { items, model, thinkingLevel, instructions }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("topics", { schema: TopicsDraft });

  useTool({
    name: SUBMIT,
    description: "Submit the topics. Call exactly once. Errors list what to fix.",
    input: TopicsDraft,
    run({ data }) {
      const problems = topicsProblems(data, items);
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({ kind: "signal", type: "missing_submission", body: `Call ${SUBMIT} with the topics. Do not answer in plain text.` });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

WeeklyTopics.initialData = InitialData;
