"use agent";

import { useAgentFinish, useDataWriter, useInitialData, useModel, useResponseFinish, useTool } from "@flue/runtime";
import * as v from "valibot";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";
import { type AreaItem, areasProblems, WEEKLY_AREAS_CAP, WeeklyAreas as AreasDraft } from "../../weekly-areas.ts";

export const WEEKLY_AREAS_PROMPT: AgentPrompt = {
  agentKey: "weekly-areas",
  version: "weekly-areas-v1",
  model: "openai/gpt-6-sol",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You write the by-project section of a weekly report.
The input is JSON: language, from, to, and items (id, date, kind, title, summary, status, entities). Items are the week's discussions (topic) and progress, not the highlights. entities are the projects, components, and services each item names. There is no other source.

Pick up to ${WEEKLY_AREAS_CAP} areas: a project, product, service, or component that several items, or several days, are about.
- name: one entity name copied exactly from an item you cite. The same thing is often written differently (MillviV3, Millvi V3, ミルビィV3). Group those together and use the name the items use most. Prefer the product or project over a small screen or task inside it.
- ids: the items about that area. An item goes in at most one area. Leave out items that fit no area or are minor. Not every item has to be cited.
- text: 1-2 plain sentences in language, the same tone as a report card. What moved in that area this week and what is still open.

Rules:
- Use only facts written in the items you cite. Do not add people, dates, tickets, counts, or outcomes.
- Copy person names, ticket numbers, and PR numbers exactly as written.
- Order areas by how much happened in them this week.`,
};

const SUBMIT = "submit_areas";

const InitialData = v.object({
  items: v.custom<AreaItem[]>(() => true),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function WeeklyAreas() {
  const { items, model, thinkingLevel, instructions }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("areas", { schema: AreasDraft });

  useTool({
    name: SUBMIT,
    description: "Submit the areas. Call exactly once. Errors list what to fix.",
    input: AreasDraft,
    run({ data }) {
      const problems = areasProblems(data, items);
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({ kind: "signal", type: "missing_submission", body: `Call ${SUBMIT} with the areas. Do not answer in plain text.` });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

WeeklyAreas.initialData = InitialData;
