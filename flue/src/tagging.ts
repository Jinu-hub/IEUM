// Core-tagger output → sanitized concept map → merge when projecting items (B안).
// Tags / classifications / entities stay out of core_json; only daily_core_items rows carry them.

import * as v from "valibot";
import {
  DEFAULT_TAXONOMY_VERSION,
  ENTITY_TYPES,
  getTaxonomy,
  PRIMARY,
  SECONDARY,
  TAG_ALLOWLIST,
  TAG_RULES,
  type TaxonomyPack,
} from "./taxonomy.ts";

// Mirrors Structuring section shapes without importing daily-core (avoids a cycle with coreItemRows).
export type PlacementSections = Record<
  "highlights" | "topics" | "progress_roadmap" | "member_activity",
  { item_key: string; core_item_ids: string[] }[]
>;

export const TaggedEntity = v.object({
  type: v.pipe(v.string(), v.description(`One of: ${ENTITY_TYPES.join(", ")}.`)),
  name: v.pipe(v.string(), v.description("Display name as written in the item, e.g. eStudio or #22777.")),
  ident: v.optional(v.nullable(v.pipe(v.string(), v.description("Stable id when known, e.g. 22777 or PR 558.")))),
});

export const TaggedItem = v.object({
  concept_key: v.pipe(v.string(), v.description("Must match a core item concept_key from the input.")),
  classifications: v.object({
    primary: v.pipe(v.string(), v.description(`Exactly one of: ${PRIMARY.join(", ")}.`)),
    secondary: v.pipe(
      v.array(v.string()),
      v.description(`Zero or more of: ${SECONDARY.join(", ")}. Use other only when nothing else fits.`),
    ),
  }),
  tags: v.pipe(
    v.array(v.string()),
    v.description(
      `Prefer allowlist (${TAG_ALLOWLIST.join(", ")}). Up to ${TAG_RULES.maxFree} free kebab tags ` +
        `(${TAG_RULES.pattern}); at most ${TAG_RULES.maxPerItem} tags total.`,
    ),
  ),
  entities: v.pipe(
    v.array(TaggedEntity),
    v.description("Named things in the item. Prefer project / component / service; ticket and pull_request optional."),
  ),
});

export const Tagging = v.object({
  items: v.array(TaggedItem),
});
export type Tagging = v.InferOutput<typeof Tagging>;
export type TaggedItem = v.InferOutput<typeof TaggedItem>;

export type ConceptTagging = {
  tags: string[];
  classifications: { primary: string; secondary: string[] };
  entities: { type: string; name: string; ident?: string | null }[];
};

export const EMPTY_TAGGING: ConceptTagging = {
  tags: [],
  classifications: { primary: "", secondary: [] },
  entities: [],
};

export function taggerInput(
  coreItems: { concept_key: string; title: string; summary: string }[],
  taxonomyVersion: string = DEFAULT_TAXONOMY_VERSION,
) {
  const pack = getTaxonomy(taxonomyVersion);
  return JSON.stringify({
    taxonomy_version: pack.version,
    primary: pack.primary,
    secondary: pack.secondary,
    tag_allowlist: pack.tagAllowlist,
    tag_rules: {
      maxPerItem: pack.tagRules.maxPerItem,
      maxFree: pack.tagRules.maxFree,
      maxFreeLength: pack.tagRules.maxFreeLength,
      pattern: pack.tagRules.pattern.source,
    },
    entity_types: pack.entityTypes,
    core_items: coreItems.map(({ concept_key, title, summary }) => ({ concept_key, title, summary })),
  });
}

// Ticket/PR-looking free tags (no-247, 247) are not useful beside entities.
const TICKET_LIKE_TAG = /^(?:no-?)?\d{2,}$|^pr-?\d+$/;

export function sanitizeTags(raw: string[], pack: TaxonomyPack): string[] {
  const allow = new Set<string>(pack.tagAllowlist);
  const out: string[] = [];
  let free = 0;
  for (const value of raw) {
    const tag = value.trim().toLowerCase();
    if (!tag || out.includes(tag) || TICKET_LIKE_TAG.test(tag)) continue;
    if (allow.has(tag)) {
      out.push(tag);
    } else if (
      free < pack.tagRules.maxFree &&
      tag.length <= pack.tagRules.maxFreeLength &&
      pack.tagRules.pattern.test(tag)
    ) {
      out.push(tag);
      free += 1;
    }
    if (out.length >= pack.tagRules.maxPerItem) break;
  }
  return out;
}

export type ItemEntity = ConceptTagging["entities"][number];

const entityKey = (entity: ItemEntity) =>
  entity.ident ? `${entity.type}\0id:${entity.ident}` : `${entity.type}\0name:${entity.name}`;

function uniqueEntities(entities: ItemEntity[]): ItemEntity[] {
  const seen = new Set<string>();
  const out: ItemEntity[] = [];
  for (const entity of entities) {
    const key = entityKey(entity);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entity);
  }
  return out;
}

// Prefer the longer display name when the same type+ident appears twice (bare No.247 vs contextual).
function mergeEntityLists(...lists: ItemEntity[][]): ItemEntity[] {
  const byKey = new Map<string, ItemEntity>();
  for (const entity of lists.flat()) {
    const key = entityKey(entity);
    const prev = byKey.get(key);
    if (!prev || entity.name.length > prev.name.length) byKey.set(key, entity);
  }
  return [...byKey.values()];
}

export function isBareRefName(name: string, ident: string): boolean {
  const n = name.trim();
  return (
    n === ident ||
    n === `#${ident}` ||
    /^No\.?\s*\d+$/i.test(n) ||
    /^PR\s*#?\s*\d+$/i.test(n)
  );
}

// Label stays on the same line as the ref so title+summary joins do not leak across lines.
function lineWithRef(texts: string[], ref: RegExp): string | null {
  for (const text of texts) {
    for (const line of text.split(/\n+/)) {
      if (ref.test(line)) return line;
      ref.lastIndex = 0;
    }
  }
  return null;
}

// "管理者機能その7のNo.247を…" → "管理者機能その7 No.247". Label capped so the name stays scannable.
export function contextualTicketName(text: string, ident: string): string | null {
  const line = lineWithRef([text], new RegExp(`(?:No\\.?\\s*|#)\\s*${ident}\\b`, "i")) ?? text;
  const re = new RegExp(
    `([\\p{L}\\p{N}][\\p{L}\\p{N}\\s\\-ー・]{0,40}?)(?:の)?\\s*(?:No\\.?\\s*|#)\\s*${ident}\\b`,
    "iu",
  );
  const match = re.exec(line);
  if (!match?.[1]) return null;
  const label = match[1].trim().replace(/\s+/g, " ");
  if (!label || label.length > 40) return null;
  return `${label} No.${ident}`;
}

export function contextualPrName(text: string, ident: string): string | null {
  const line = lineWithRef([text], new RegExp(`\\bPR\\s*#?\\s*${ident}\\b`, "i")) ?? text;
  const re = new RegExp(
    `([\\p{L}\\p{N}][\\p{L}\\p{N}\\s\\-ー・]{0,40}?)\\s*PR\\s*#?\\s*${ident}\\b`,
    "iu",
  );
  const match = re.exec(line);
  if (!match?.[1]) return null;
  const label = match[1].trim().replace(/\s+/g, " ");
  if (!label || label.length > 40) return null;
  return `${label} PR #${ident}`;
}

function bestTicketName(title: string, summary: string, ident: string): string {
  for (const text of [title, summary]) {
    const name = contextualTicketName(text, ident);
    if (name) return name;
  }
  return `No.${ident}`;
}

function bestPrName(title: string, summary: string, ident: string): string {
  for (const text of [title, summary]) {
    const name = contextualPrName(text, ident);
    if (name) return name;
  }
  return `PR #${ident}`;
}

// B3: ticket / PR refs from title+summary, with contextual names when the text has a work label.
export function extractRefEntities(title: string, summary: string): ItemEntity[] {
  const text = [title, summary].filter(Boolean).join("\n");
  if (!text) return [];
  const out: ItemEntity[] = [];
  for (const match of text.matchAll(/(?:No\.?\s*|#)\s*(\d{2,})\b/gi)) {
    const ident = match[1]!;
    out.push({ type: "ticket", name: bestTicketName(title, summary, ident), ident });
  }
  for (const match of text.matchAll(/\bPR\s*#?\s*(\d+)\b/gi)) {
    const ident = match[1]!;
    out.push({ type: "pull_request", name: bestPrName(title, summary, ident), ident });
  }
  return uniqueEntities(out);
}

export function enrichRefEntityNames(entities: ItemEntity[], title: string, summary: string): ItemEntity[] {
  return entities.map((entity) => {
    if (!entity.ident || !isBareRefName(entity.name, entity.ident)) return entity;
    if (entity.type === "ticket") return { ...entity, name: bestTicketName(title, summary, entity.ident) };
    if (entity.type === "pull_request") return { ...entity, name: bestPrName(title, summary, entity.ident) };
    return entity;
  });
}

export function personEntities(owners: string[]): ItemEntity[] {
  return [...new Set(owners.map((name) => name.trim()).filter(Boolean))].map((name) => ({
    type: "person",
    name,
  }));
}

// Projection-time finalize: code refs + contextual names + people (event sections only).
export function finalizeItemEntities(
  entities: ItemEntity[],
  {
    title,
    summary,
    owners = [],
    includePeople,
  }: { title: string; summary: string; owners?: string[]; includePeople: boolean },
): ItemEntity[] {
  const withRefs = mergeEntityLists(
    enrichRefEntityNames(entities, title, summary),
    extractRefEntities(title, summary),
  );
  return includePeople ? mergeEntityLists(withRefs, personEntities(owners)) : withRefs;
}

function sanitizeEntity(
  entity: { type: string; name: string; ident?: string | null },
  pack: TaxonomyPack,
): ConceptTagging["entities"][number] | null {
  if (!(pack.entityTypes as readonly string[]).includes(entity.type)) return null;
  const name = entity.name.trim();
  if (!name) return null;
  const ident = entity.ident?.trim();
  return ident ? { type: entity.type, name, ident } : { type: entity.type, name };
}

export function sanitizeTaggedItem(item: TaggedItem, pack: TaxonomyPack): ConceptTagging {
  const primary = (pack.primary as readonly string[]).includes(item.classifications.primary)
    ? item.classifications.primary
    : "";
  const secondary = [
    ...new Set(
      item.classifications.secondary.filter((s) => (pack.secondary as readonly string[]).includes(s)),
    ),
  ];
  const entities = uniqueEntities(
    item.entities
      .map((entity) => sanitizeEntity(entity, pack))
      .filter((entity): entity is NonNullable<typeof entity> => !!entity),
  );
  return {
    tags: sanitizeTags(item.tags, pack),
    classifications: { primary, secondary },
    entities,
  };
}

// Drops unknown concept_keys; normalizes taxonomy fields. Duplicate keys: last wins.
export function indexTagging(
  tagging: Tagging,
  knownKeys: Iterable<string>,
  taxonomyVersion: string = DEFAULT_TAXONOMY_VERSION,
): Record<string, ConceptTagging> {
  const known = new Set(knownKeys);
  const pack = getTaxonomy(taxonomyVersion);
  const byConcept: Record<string, ConceptTagging> = {};
  for (const item of tagging.items) {
    if (!known.has(item.concept_key)) continue;
    byConcept[item.concept_key] = sanitizeTaggedItem(item, pack);
  }
  return byConcept;
}

// Union tags/entities/secondary across core items in one placed entry; primary from the highest-importance id.
export function mergeConceptTagging(
  ids: string[],
  byConcept: Record<string, ConceptTagging>,
  importance: Record<string, number> = {},
  pack: TaxonomyPack = getTaxonomy(),
): ConceptTagging {
  const parts = ids.map((id) => byConcept[id]).filter((part): part is ConceptTagging => !!part);
  if (!parts.length) return EMPTY_TAGGING;
  const leadId = [...ids]
    .filter((id) => byConcept[id]?.classifications.primary)
    .sort((a, b) => (importance[b] ?? 0) - (importance[a] ?? 0))[0];
  const primary =
    (leadId && byConcept[leadId]?.classifications.primary) ||
    parts.find((part) => part.classifications.primary)?.classifications.primary ||
    "";
  const secondary = [...new Set(parts.flatMap((part) => part.classifications.secondary))];
  const tags = sanitizeTags(
    parts.flatMap((part) => part.tags),
    pack,
  );
  const entities = mergeEntityLists(...parts.map((part) => part.entities));
  return { tags, classifications: { primary, secondary }, entities };
}

export type ItemEnrichment = {
  structuring: PlacementSections;
  byConcept: Record<string, ConceptTagging>;
  importance?: Record<string, number>;
};

export function enrichmentForPlacement(
  structuring: PlacementSections,
  section: keyof PlacementSections,
  itemKey: string,
  byConcept: Record<string, ConceptTagging>,
  importance: Record<string, number> = {},
): ConceptTagging {
  const ids = structuring[section].find((item) => item.item_key === itemKey)?.core_item_ids ?? [];
  return mergeConceptTagging(ids, byConcept, importance);
}
