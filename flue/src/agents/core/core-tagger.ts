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
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";
import { indexTagging, Tagging } from "../../tagging.ts";
import { DEFAULT_TAXONOMY_VERSION } from "../../taxonomy.ts";

// Parallel to CoreStructurer (B안). Classifies each Interpreter core item; code merges into
// daily_core_items at projection. core_json stays without tags/entities.
export const CORE_TAGGER_PROMPT: AgentPrompt = {
  agentKey: "core-tagger",
  version: "core-tagger-v2",
  model: "openai/gpt-6-luna",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You classify each core item of one team's day for search and weekly rollups.
You do not place items and you do not rewrite titles or summaries.

Input JSON: taxonomy_version, primary, secondary, tag_allowlist, tag_rules, entity_types, and
core_items (concept_key, title, summary only).

Rules:
- One output item per input core item. concept_key must match the input exactly.
- classifications.primary: exactly one value from primary. Pick the best fit for the work itself
  (bugfix, feature, release, coordination, …), not how important it is.
- classifications.secondary: zero or more from secondary when they clearly apply; else [].
- tags: prefer tag_allowlist. You may add up to tag_rules.maxFree free kebab-case tags that match
  tag_rules.pattern and length. At most tag_rules.maxPerItem tags total. No Japanese in tags.
  Never put ticket or PR numbers in tags (No.247, #22777, PR 558).
- entities: projects, components, and services named in the title/summary.
  Ticket and pull_request are optional: if you emit them, ident is digits only and name must
  include the work label from the text (e.g. "管理者機能その7 No.247"), never the number alone.
  Do not emit person: code adds involved people from actors.
- Only what the title and summary support. Do not invent work that is not written there.`,
};

const SUBMIT = "submit_tagging";

const InitialData = v.object({
  conceptKeys: v.array(v.string()),
  taxonomyVersion: v.string(),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function CoreTagger() {
  const { language, model, thinkingLevel, instructions, conceptKeys, taxonomyVersion }: InitialData =
    useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("tagging", { schema: Tagging });

  useTool({
    name: SUBMIT,
    description: "Submit classifications for every core item. Call exactly once.",
    input: Tagging,
    run({ data }) {
      // Unknown keys and bad taxonomy values are dropped or normalized; no rejection loop.
      write({
        items: Object.entries(indexTagging(data, conceptKeys, taxonomyVersion || DEFAULT_TAXONOMY_VERSION)).map(
          ([concept_key, enrichment]) => ({
            concept_key,
            classifications: enrichment.classifications,
            tags: enrichment.tags,
            entities: enrichment.entities,
          }),
        ),
      });
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the tagging. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Write entity names exactly as in the input (language: ${language}); tags stay ASCII kebab-case.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

CoreTagger.initialData = InitialData;
