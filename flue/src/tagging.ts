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

export function sanitizeTags(raw: string[], pack: TaxonomyPack): string[] {
  const allow = new Set<string>(pack.tagAllowlist);
  const out: string[] = [];
  let free = 0;
  for (const value of raw) {
    const tag = value.trim().toLowerCase();
    if (!tag || out.includes(tag)) continue;
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
  const entities = item.entities
    .map((entity) => sanitizeEntity(entity, pack))
    .filter((entity): entity is NonNullable<typeof entity> => !!entity);
  const seen = new Set<string>();
  const uniqueEntities = entities.filter((entity) => {
    const key = `${entity.type}\0${entity.name}\0${entity.ident ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    tags: sanitizeTags(item.tags, pack),
    classifications: { primary, secondary },
    entities: uniqueEntities,
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
  const entities = (() => {
    const seen = new Set<string>();
    const out: ConceptTagging["entities"] = [];
    for (const entity of parts.flatMap((part) => part.entities)) {
      const key = `${entity.type}\0${entity.name}\0${entity.ident ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entity);
    }
    return out;
  })();
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
