import { z } from "zod";

export const CommonInput = z.object({
  project: z.string(),
  contents: z.string(),
  team: z.string().optional().nullable(),
});

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

export const TopicOutput = z.object({
  clusters: z.array(Cluster),
});

/**
 * Member schema for activity summary (Refined for Pre-Grouped Member Data)
 * - Focuses on qualitative summary fields, not daily/conversation lists
 */
export const Member = z.object({
  memberId: z.string(),
  displayName: z.string(),
  summary: z.object({
    tone: z.enum(["neutral", "positive", "mixed"]),
    mainThemes: z.array(z.string()).default([]), // 2–5 typical, but allow empty
    weeklyHighlights: z
      .array(
        z.object({
          title: z.string(), // ≤120 chars (not enforced here)
          ref: z.string(),   // must match an input message id
        })
      )
      .default([]), // 0–3 allowed
    collaboration: z.array(z.string()).default([]),        // short phrases
    decisionsOrActions: z.array(z.string()).default([]),   // ≤3 recommended
    openQuestions: z.array(z.string()).default([]),        // ≤2 recommended
    overallSummary: z.string(),                            // 2–3 sentences
  }),
});

export const ActivityOutput = z.object({
  generatedAtISO: z.string(),
  members: z.array(Member),
});

export const HighlightsOutput = z.object({
  generatedAtISO: z.string(),
  highlights: z.array(z.object({
    summary: z.string(),
    conversations: z.array(z.string()),
  })),
});

export const OngoingProgressOutput = z.object({
  generatedAtISO: z.string(),
  ongoing: z.array(z.object({
    title: z.string(),
    tickets: z.array(z.string()),
    owner: z.string(),
    status: z.enum(["in_progress", "pending", "blocked", "done"]),
    progressPercent: z.number(),
    completed: z.array(z.string()),
    pending: z.array(z.string()),
    nextActions: z.array(z.object({
      action: z.string(),
      owner: z.string(),
      due: z.string().optional().nullable(),
    })),
  })),
  roadmap: z.array(z.object({
    milestone: z.string(),
    window: z.object({
      from: z.string().optional().nullable(),
      to: z.string().optional().nullable(),
    }),
    signals: z.array(z.string()),
    importance: z.enum(["low", "medium", "high"]),
  })),
  upcoming: z.array(z.object({
    title: z.string(),
    start: z.string(),
    end: z.string().optional().nullable(),
    timezone: z.string(),
    location: z.string().optional().nullable(),
  })),
  governance: z.object({
    policies: z.array(z.object({
      title: z.string(),
      summary: z.string(),
      effectiveFrom: z.string(),
    })),
  }),
});

export const FunCornerOutput = z.object({
  generatedAtISO: z.string(),
  snippets: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    type: z.enum(["progress_humor", "roadmap_fortune", "schedule_reminder", "slack_reaction", "thread_of_week", "night_owl", "buzzword"]),
    primaryUrl: z.string().optional().nullable(),
  })),
});