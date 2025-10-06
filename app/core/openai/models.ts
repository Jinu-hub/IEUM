import { z } from "zod";

/**
 * Topic Cluster schema optimized for Slack/GitHub activity classification.
 * Each cluster groups related items (PRs, issues, threads) into a coherent topic.
 */
export const Cluster = z.object({
  /** 
   * Unique identifier of the cluster (kebab/lowercase)
   * e.g., "release-v1-4-2", "incident-sev-1"
   */
  id: z.string().describe("Unique stable identifier for the cluster (slug/kebab format)"),

  /** 
   * Human-readable topic label
   * e.g., "Release", "Bugfix", "Decision", "Roadmap", "Incident"
   */
  topic: z.enum([
    "Release",
    "Bugfix",
    "Decision",
    "Roadmap",
    "Incident",
    "Security",
    "Refactor",
    "Feature",
    "Research",
    "Announcement",
    "Progress",
    "Q&A",
    "Other",
  ]),

  /** Optional subcategory within the topic, e.g., "Sev-1", "Patch", "Hotfix" */
  subcategory: z.string().optional().nullable(),

  /** 
   * Primary target audience of this topic 
   * (used for newsletter routing or relevance filtering)
   */
  audience: z.enum(["internal", "engineering", "product", "leadership", "all"]),

  /**
   * Estimated impact level for prioritization
   */
  impact: z.enum(["low", "medium", "high", "critical"]),

  /**
   * List of item IDs that belong to this cluster (LinkedActivityDoc.items[].id)
   */
  items: z.array(z.string()).describe("Array of item IDs linked to this topic cluster"),

  /**
   * Structured scoring signals — used to explain the model’s decision.
   * Optional: LLM may omit if reasoning is implicit.
   */
  signals: z
    .object({
      count: z.number().describe("Number of items grouped under this topic"),
      recencyScore: z.number().min(0).max(1).optional().nullable(),
      crossLinkScore: z.number().min(0).max(1).optional().nullable(),
      labelHits: z.array(z.string()).optional().nullable(),
      keywordHits: z.array(z.string()).optional().nullable(),
      participants: z.number().optional().nullable(),
      relevance: z.number().min(0).max(1).optional().nullable(),
      importance: z.number().min(0).max(1).optional().nullable(),
    })
    .optional().nullable(),

  /**
   * Short summary or rationale for why this cluster was formed.
   */
  summary: z
    .string()
    .max(500)
    .optional().nullable()
    .describe("Optional short rationale or summary for this cluster."),
});


export const TopicInput = z.object({
    team: z.string().optional().nullable(),
    project: z.string(),
    linked: z.string(),
  });

export const TopicOutput = z.object({
  clusters: z.array(Cluster),
});