import * as v from "valibot";

// Mirrors app/features/daily-core/contracts (NormalizedSourceItem, DailyCoreAnalysisFields).
export type SourceItem = {
  source_ref: string;
  source_type: string;
  source_ident: string;
  source_item_id: string;
  occurred_at: string;
  author?: { id?: string; name?: string };
  title?: string | null;
  content: string;
  url?: string | null;
  thread_ref?: string | null;
  meta?: Record<string, unknown>;
};

export type SourceRow = {
  source_type: string;
  source_ident: string;
  collection_status: string;
  normalized_json: SourceItem[];
};

const CoreItem = v.object({
  item_key: v.pipe(v.string(), v.description("Stable kebab-case key, unique within its array.")),
  title: v.string(),
  summary: v.string(),
  status: v.optional(
    v.nullable(v.picklist(["planned", "in_progress", "blocked", "completed", "unknown"])),
  ),
  importance: v.optional(v.nullable(v.pipe(v.number(), v.description("0 to 1")))),
  confidence: v.optional(v.nullable(v.pipe(v.number(), v.description("0 to 1")))),
  tags: v.array(v.string()),
  classifications: v.object({ primary: v.string(), secondary: v.array(v.string()) }),
  entities: v.array(
    v.object({ type: v.string(), name: v.string(), ident: v.optional(v.string()) }),
  ),
  evidence_refs: v.pipe(
    v.array(v.string()),
    v.minLength(1),
    v.description("source_ref ids from the input, e.g. S012."),
  ),
});

export const DailyCoreOutput = v.object({
  overview: v.object({ summary: v.string() }),
  highlights: v.array(CoreItem),
  topics: v.array(CoreItem),
  progress_roadmap: v.array(CoreItem),
  member_activity: v.array(CoreItem),
});
export type DailyCoreOutput = v.InferOutput<typeof DailyCoreOutput>;

const isContext = (item: SourceItem) => item.meta?.context_only === true;
// ponytail: Slack posts without a user id are integration bots (e.g. Redmine), plus Slackbot.
// Add an explicit bot flag at normalize time if another bot posts with a user id.
const isBot = (item: SourceItem) =>
  item.source_type === "slack_channel" && (!item.author?.id || item.author.id === "USLACKBOT");
const nameKey = (name?: string) =>
  (name ?? "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

export function buildAgentInput(rows: SourceRow[], timezone: string) {
  // ponytail: GitHub authors join Slack people only when the login or name equals a Slack name
  // ignoring case and symbols (jinuSon = Jinu Son). Others (takamune-dsl) need an identity table.
  const slackNames = new Map<string, string>();
  // Mentioned users are named only if they wrote something in this Daily Core.
  const slackIds = new Map<string, string>();
  for (const item of rows.flatMap((row) => row.normalized_json)) {
    const key = nameKey(item.author?.name);
    if (item.source_type === "slack_channel" && item.author?.id && key) {
      slackNames.set(key, item.author.name!);
      slackIds.set(item.author.id, item.author.name!);
    }
  }
  const mentions = (text: string) =>
    text
      .replace(/<@(\w+)>/g, (_, id: string) => `@${slackIds.get(id) ?? id}`)
      .replace(/<!(channel|here|everyone)>/g, "@$1");
  const author = (item: SourceItem) => {
    const name = item.author?.name ?? "unknown";
    if (item.source_type !== "github_repo") return name;
    return slackNames.get(nameKey(item.author?.id)) ?? slackNames.get(nameKey(name)) ?? name;
  };

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
  const line = (item: SourceItem) => {
    const when = isContext(item)
      ? `(context, ${day.format(new Date(item.occurred_at))})`
      : time.format(new Date(item.occurred_at));
    const kind = isBot(item) ? " (bot notification)" : item.meta?.kind ? ` (${item.meta.kind})` : "";
    const text = mentions([item.title, item.content].filter(Boolean).join(" / ")).replace(/\s+/g, " ");
    return `[${item.source_ref}] ${when} ${author(item)}${kind}: ${text}`;
  };

  const lines: string[] = [];
  const refs: string[] = [];
  const contextRefs: string[] = [];
  const botRefs: string[] = [];
  const people = new Set<string>();
  // Who wrote each line of this day (bots and context excluded).
  const authors: Record<string, string> = {};
  let total = 0;
  let dropped = 0;
  let botDropped = 0;

  for (const row of rows) {
    lines.push(`## ${row.source_type} ${row.source_ident}`);
    const items = row.normalized_json;
    total += items.length;
    const ids = new Set(items.map((i) => i.source_item_id));
    const replies = new Map<string, SourceItem[]>();
    for (const item of items) {
      if (item.thread_ref && ids.has(item.thread_ref)) {
        replies.set(item.thread_ref, [...(replies.get(item.thread_ref) ?? []), item]);
      }
    }
    const keep = (item: SourceItem, prefix: string) => {
      lines.push(prefix + line(item));
      refs.push(item.source_ref);
      if (isContext(item)) contextRefs.push(item.source_ref);
      if (isBot(item)) botRefs.push(item.source_ref);
      if (!isBot(item) && !isContext(item)) {
        people.add(author(item));
        authors[item.source_ref] = author(item);
      }
    };

    for (const root of items) {
      if (root.thread_ref && ids.has(root.thread_ref)) continue;
      const children = replies.get(root.source_item_id) ?? [];
      // Bot messages with no text (e.g. GitHub app posts) carry nothing the repo sources don't.
      // Bot notifications (e.g. Redmine) stay in the DB but not in the model input: models turned
      // each one into its own item. Bot parents with replies stay (Slackbot progress-report threads).
      if (children.length) keep(root, "");
      else if (isBot(root)) botDropped++;
      else if (root.content.trim() || root.title) keep(root, "");
      else dropped++;
      for (const child of children) {
        if (isBot(child)) botDropped++;
        else if (child.content.trim()) keep(child, "  ↳ ");
        else dropped++;
      }
    }
    if (items.length === 0) lines.push(`(no activity: ${row.collection_status})`);
    lines.push("");
  }

  return {
    text: lines.join("\n"),
    refs,
    contextRefs,
    botRefs,
    people: [...people],
    authors,
    counts: {
      total,
      included: refs.length,
      dropped,
      bot_dropped: botDropped,
      context: contextRefs.length,
      bot: botRefs.length,
      people: people.size,
    },
  };
}

export type EvidenceSets = { refs: string[]; contextRefs: string[]; botRefs: string[]; people: string[] };

export function evidenceProblems(
  output: DailyCoreOutput,
  { refs, contextRefs, botRefs, people }: EvidenceSets,
) {
  const known = new Set(refs);
  const context = new Set(contextRefs);
  const bot = new Set(botRefs);
  const problems: string[] = [];
  for (const section of ["highlights", "topics", "progress_roadmap", "member_activity"] as const) {
    for (const item of output[section]) {
      const unknown = item.evidence_refs.filter((ref) => !known.has(ref));
      if (unknown.length) problems.push(`${section}/${item.item_key}: unknown refs ${unknown.join(", ")}`);
      if (item.evidence_refs.every((ref) => context.has(ref))) {
        problems.push(`${section}/${item.item_key}: cites only context refs; add a ref from this day`);
      }
      if (section === "member_activity" && item.evidence_refs.every((ref) => bot.has(ref) || context.has(ref))) {
        problems.push(
          `${section}/${item.item_key}: bot notifications are not authored by the people they name; cite the person's own message, commit, or PR, or drop the item`,
        );
      }
      if (section === "member_activity" && !people.includes(item.title)) {
        problems.push(
          `${section}/${item.item_key}: title must be exactly one author name from the input: ${people.join(", ")}`,
        );
      }
    }
  }
  return problems;
}

const EVENT_SECTIONS = ["highlights", "topics", "progress_roadmap"] as const;

// Numbers for comparing prompt and pipeline versions on the same input.
export function coreStats(output: DailyCoreOutput, { refs, contextRefs, botRefs, people }: EvidenceSets) {
  const skip = new Set([...contextRefs, ...botRefs]);
  const human = refs.filter((ref) => !skip.has(ref));
  const sectionsPerRef = new Map<string, number>();
  for (const section of EVENT_SECTIONS) {
    for (const ref of new Set(output[section].flatMap((item) => item.evidence_refs))) {
      sectionsPerRef.set(ref, (sectionsPerRef.get(ref) ?? 0) + 1);
    }
  }
  const cited = new Set(
    [...EVENT_SECTIONS, "member_activity" as const].flatMap((section) =>
      output[section].flatMap((item) => item.evidence_refs),
    ),
  );
  return {
    items: {
      highlights: output.highlights.length,
      topics: output.topics.length,
      progress_roadmap: output.progress_roadmap.length,
      member_activity: output.member_activity.length,
    },
    human_refs: human.length,
    human_refs_cited: human.filter((ref) => cited.has(ref)).length,
    human_refs_in_multiple_sections: human.filter((ref) => (sectionsPerRef.get(ref) ?? 0) > 1).length,
    people: people.length,
  };
}

// Call 1 (CoreInterpreter): one item per event, merged across sources. core_item_id = concept_key.
const InterpretedItem = v.object({
  concept_key: v.pipe(
    v.string(),
    v.regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    v.description("Stable kebab-case key, unique in the output, e.g. ticket-23163 or millvi-v3-subtitles."),
  ),
  title: v.string(),
  summary: v.string(),
  importance: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5), v.description("5 = key outcome of the day")),
  confidence: v.pipe(v.number(), v.minValue(0), v.maxValue(1)),
  roles: v.pipe(
    v.array(v.picklist(["highlight", "topic", "progress"])),
    v.description("Candidate placements. The final placement is decided later."),
  ),
  status: v.optional(v.nullable(v.picklist(["planned", "in_progress", "blocked", "completed", "unknown"]))),
  tags: v.array(v.string()),
  classifications: v.object({ primary: v.string(), secondary: v.array(v.string()) }),
  entities: v.array(v.object({ type: v.string(), name: v.string(), ident: v.optional(v.string()) })),
  actors: v.pipe(
    v.array(v.object({ type: v.picklist(["member", "team", "system", "other"]), name: v.string() })),
    v.description("Who did it. A member actor must be the author of at least one cited line."),
  ),
  evidence_refs: v.pipe(v.array(v.string()), v.minLength(1), v.description("source_ref ids from the input, e.g. S012.")),
  progress: v.optional(
    v.object({ from: v.optional(v.string()), to: v.optional(v.string()), next_step: v.optional(v.string()) }),
  ),
});

export const Interpretation = v.object({
  overview_candidate: v.object({ summary: v.string() }),
  core_items: v.array(InterpretedItem),
});
export type Interpretation = v.InferOutput<typeof Interpretation>;

export type InterpretationEvidence = {
  refs: string[];
  contextRefs: string[];
  botRefs: string[];
  authors: Record<string, string>;
};

export function interpretationProblems(output: Interpretation, { refs, contextRefs, botRefs }: InterpretationEvidence) {
  const known = new Set(refs);
  const context = new Set(contextRefs);
  const bot = new Set(botRefs);
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const item of output.core_items) {
    const key = item.concept_key;
    if (seen.has(key)) problems.push(`${key}: concept_key is used twice; merge the items or rename one`);
    seen.add(key);
    const unknown = item.evidence_refs.filter((ref) => !known.has(ref));
    if (unknown.length) problems.push(`${key}: unknown refs ${unknown.join(", ")}`);
    if (item.evidence_refs.every((ref) => context.has(ref))) {
      problems.push(`${key}: cites only context refs; add a ref from this day`);
    } else if (item.evidence_refs.every((ref) => context.has(ref) || bot.has(ref))) {
      problems.push(
        `${key}: cites only bot notifications; cite a line a person wrote about the same matter, or drop the item`,
      );
    }
  }
  return problems;
}

// A member actor must have written a cited line; others were only mentioned. Code drops them
// instead of rejecting, because a rejection makes the model resend the whole output.
export function dropUnwrittenActors(output: Interpretation, authors: Record<string, string>) {
  const dropped: string[] = [];
  const core_items = output.core_items.map((item) => {
    const writers = new Set(item.evidence_refs.map((ref) => authors[ref]));
    const actors = item.actors.filter((actor) => actor.type !== "member" || writers.has(actor.name));
    for (const actor of item.actors) if (!actors.includes(actor)) dropped.push(`${item.concept_key}: ${actor.name}`);
    return { ...item, actors };
  });
  return { output: { ...output, core_items }, dropped };
}

export function interpretationStats(output: Interpretation, { refs, contextRefs, botRefs, people }: EvidenceSets) {
  const skip = new Set([...contextRefs, ...botRefs]);
  const human = refs.filter((ref) => !skip.has(ref));
  const cited = new Set(output.core_items.flatMap((item) => item.evidence_refs));
  const actors = new Set(
    output.core_items.flatMap((item) => item.actors.filter((a) => a.type === "member").map((a) => a.name)),
  );
  return {
    core_items: output.core_items.length,
    human_refs: human.length,
    human_refs_cited: human.filter((ref) => cited.has(ref)).length,
    people: people.length,
    people_as_actors: actors.size,
  };
}

// Call 2 (CoreStructurer): places core items into the Daily Core arrays. The model writes only
// placement and text; refs, tags, classifications, entities, importance come from the core items.
const PlacedItem = v.object({
  item_key: v.pipe(v.string(), v.description("Stable kebab-case key, unique within its array.")),
  title: v.string(),
  summary: v.string(),
  status: v.optional(v.nullable(v.picklist(["planned", "in_progress", "blocked", "completed", "unknown"]))),
  core_item_ids: v.pipe(
    v.array(v.string()),
    v.minLength(1),
    v.description("concept_key values of the core items this entry is built from."),
  ),
});
export const Structuring = v.object({
  overview: v.object({ summary: v.string() }),
  highlights: v.array(PlacedItem),
  topics: v.array(PlacedItem),
  progress_roadmap: v.array(PlacedItem),
  member_activity: v.array(PlacedItem),
});
export type Structuring = v.InferOutput<typeof Structuring>;

const SECTIONS = [...EVENT_SECTIONS, "member_activity"] as const;

export function structurerInput({ overview_candidate, core_items }: Interpretation, people: string[]) {
  return JSON.stringify({
    people,
    overview_candidate,
    core_items: core_items.map(({ concept_key, title, summary, importance, roles, status, progress, actors }) => ({
      concept_key,
      title,
      summary,
      importance,
      roles,
      status,
      progress,
      members: actors.filter((actor) => actor.type === "member").map((actor) => actor.name),
    })),
  });
}

export type StructuringEvidence = {
  coreRefs: Record<string, string[]>;
  authors: Record<string, string>;
  people: string[];
};

const ownRefs = (refs: string[], name: string, authors: Record<string, string>) =>
  refs.filter((ref) => authors[ref] === name);

export function structuringProblems(output: Structuring, { coreRefs, authors, people }: StructuringEvidence) {
  const problems: string[] = [];
  const placements = new Map<string, string[]>();
  for (const section of SECTIONS) {
    for (const item of output[section]) {
      const unknown = item.core_item_ids.filter((id) => !(id in coreRefs));
      if (unknown.length) problems.push(`${section}/${item.item_key}: unknown core_item_ids ${unknown.join(", ")}`);
      if (section !== "member_activity") {
        for (const id of item.core_item_ids) placements.set(id, [...(placements.get(id) ?? []), section]);
        continue;
      }
      if (!people.includes(item.title)) {
        problems.push(`${section}/${item.item_key}: title must be exactly one name from people: ${people.join(", ")}`);
      } else if (!ownRefs(item.core_item_ids.flatMap((id) => coreRefs[id] ?? []), item.title, authors).length) {
        problems.push(
          `${section}/${item.item_key}: ${item.title} is not a member of any cited core item; cite items listing them in members, or drop the entry`,
        );
      }
    }
  }
  for (const [id, sections] of placements) {
    if (sections.length > 1) {
      problems.push(`${id}: placed ${sections.length} times (${sections.join(", ")}); use each core item in at most one entry of highlights, topics, progress_roadmap`);
    }
  }
  const names = output.member_activity.map((item) => item.title);
  for (const name of new Set(names.filter((name, i) => names.indexOf(name) !== i))) {
    problems.push(`member_activity: ${name} has several entries; use one per person`);
  }
  return problems;
}

// Turns placed items back into the single-agent output shape, so buildCoreJson stays as is.
export function resolveStructuring(
  output: Structuring,
  { core_items }: Interpretation,
  authors: Record<string, string>,
): DailyCoreOutput {
  const byKey = new Map(core_items.map((item) => [item.concept_key, item]));
  const resolve = (section: (typeof SECTIONS)[number]) =>
    output[section].map(({ item_key, title, summary, status, core_item_ids }) => {
      const sources = core_item_ids.flatMap((id) => byKey.get(id) ?? []);
      const refs = [...new Set(sources.flatMap((source) => source.evidence_refs))];
      const lead = sources.reduce((a, b) => (b.importance > a.importance ? b : a));
      return {
        item_key,
        title,
        summary,
        status: status ?? null,
        importance: lead.importance / 5,
        confidence: Math.min(...sources.map((source) => source.confidence)),
        tags: [...new Set(sources.flatMap((source) => source.tags))],
        classifications: lead.classifications,
        entities: [
          ...new Map(sources.flatMap((source) => source.entities).map((e) => [`${e.type}|${e.name}`, e])).values(),
        ],
        evidence_refs: section === "member_activity" ? ownRefs(refs, title, authors) : refs,
      };
    });
  return {
    overview: output.overview,
    highlights: resolve("highlights"),
    topics: resolve("topics"),
    progress_roadmap: resolve("progress_roadmap"),
    member_activity: resolve("member_activity"),
  };
}

// Mirrors DailyCoreJson in app/features/daily-core/contracts/pipeline-result.ts.
export const CORE_SCHEMA_VERSION = "daily-core-v1";

export type CoreMeta = {
  target_id: string;
  core_date: string;
  timezone: string;
  language: string;
  target_display_name: string;
  target_category: string;
  window_start_at: string;
  window_end_at: string;
};

export function buildCoreJson(meta: CoreMeta, rows: SourceRow[], output: DailyCoreOutput, people: string[]) {
  const byRef = new Map(rows.flatMap((row) => row.normalized_json).map((item) => [item.source_ref, item]));
  const item = ({ evidence_refs, ...rest }: DailyCoreOutput["highlights"][number]) => ({
    ...rest,
    evidence: evidence_refs.flatMap((ref) => {
      const source = byRef.get(ref);
      if (!source) return [];
      const { source_type, source_ident, source_item_id, occurred_at, url } = source;
      return [{ source_type, source_ident, source_item_id, occurred_at, url: url ?? null }];
    }),
    payload: {},
  });

  // Context parents happened on earlier days, so they are not counted.
  const counts = new Map<string, { key: string; source_ident: string; value: number }>();
  for (const row of rows) {
    for (const source of row.normalized_json) {
      if (isContext(source)) continue;
      const key =
        row.source_type === "slack_channel" ? "slack_message_count" : `github_${source.meta?.kind ?? "item"}_count`;
      const id = `${key}|${row.source_ident}`;
      const metric = counts.get(id) ?? { key, source_ident: row.source_ident, value: 0 };
      metric.value++;
      counts.set(id, metric);
    }
  }
  const activity = [...counts.values()].reduce((sum, metric) => sum + metric.value, 0);

  return {
    schema_version: CORE_SCHEMA_VERSION,
    meta: {
      target_id: meta.target_id,
      core_date: meta.core_date,
      timezone: meta.timezone,
      language: meta.language,
      target_display_name: meta.target_display_name,
      target_category: meta.target_category,
      window_start_at: meta.window_start_at,
      window_end_at: meta.window_end_at,
    },
    overview: output.overview,
    highlights: output.highlights.map(item),
    topics: output.topics.map(item),
    progress_roadmap: output.progress_roadmap.map(item),
    member_activity: output.member_activity.map(item),
    metrics: [
      ...[...counts.values()].map(({ key, source_ident, value }) => ({
        key,
        value,
        unit: "count",
        origin: "computed" as const,
        rollup_hint: "sum" as const,
        dimensions: { source_ident },
      })),
      { key: "active_member_count", value: people.length, unit: "count", origin: "computed" as const, rollup_hint: "none" as const },
    ],
    quality: { status: activity > 0 ? ("ready" as const) : ("empty" as const) },
  };
}
