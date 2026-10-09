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
  overview: v.object({ summary: v.string(), key_points: v.array(v.string()) }),
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
  for (const item of rows.flatMap((row) => row.normalized_json)) {
    const key = nameKey(item.author?.name);
    if (item.source_type === "slack_channel" && item.author?.id && key) slackNames.set(key, item.author.name!);
  }
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
    const text = [item.title, item.content].filter(Boolean).join(" / ").replace(/\s+/g, " ");
    return `[${item.source_ref}] ${when} ${author(item)}${kind}: ${text}`;
  };

  const lines: string[] = [];
  const refs: string[] = [];
  const contextRefs: string[] = [];
  const botRefs: string[] = [];
  const people = new Set<string>();
  let total = 0;
  let dropped = 0;

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
      if (!isBot(item) && !isContext(item)) people.add(author(item));
    };

    for (const root of items) {
      if (root.thread_ref && ids.has(root.thread_ref)) continue;
      const children = replies.get(root.source_item_id) ?? [];
      // Bot messages with no text (e.g. GitHub app posts) carry nothing the repo sources don't.
      if (root.content.trim() || root.title || children.length) keep(root, "");
      else dropped++;
      for (const child of children) {
        if (child.content.trim()) keep(child, "  ↳ ");
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
    counts: {
      total,
      included: refs.length,
      dropped,
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
