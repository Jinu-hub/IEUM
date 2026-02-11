import { BUGFIX_CUES, INCIDENT_CUES, REFACOR_CUES, RELEASE_VERSION_CUES, SECURITY_CUES } from "~/core/keywords/developments/keyword.en";
import { BUGFIX_CUES_JA, INCIDENT_CUES_JA, REFACOR_CUES_JA, RELEASE_VERSION_CUES_JA, SECURITY_CUES_JA } from "~/core/keywords/developments/keyword.ja";
import { BUGFIX_CUES_KO, INCIDENT_CUES_KO, REFACOR_CUES_KO, RELEASE_VERSION_CUES_KO, SECURITY_CUES_KO } from "~/core/keywords/developments/keyword.ko";

export const KIND_OF_COMMITS = [
    "Incident",
    "Release",
    "Bugfix",
    "Security",
    "Refactor",
    "Feature",
] as const;

export type KindOfCommit = typeof KIND_OF_COMMITS[number];

export const KIND_OF_COMMITS_MAP: Record<KindOfCommit, { keywords: string, keywords_ja: string, keywords_ko: string }> = {
    "Incident": { keywords: INCIDENT_CUES, keywords_ja: INCIDENT_CUES_JA, keywords_ko: INCIDENT_CUES_KO },
    "Release": { keywords: RELEASE_VERSION_CUES, keywords_ja: RELEASE_VERSION_CUES_JA, keywords_ko: RELEASE_VERSION_CUES_KO },
    "Bugfix": { keywords: BUGFIX_CUES, keywords_ja: BUGFIX_CUES_JA, keywords_ko: BUGFIX_CUES_KO },
    "Security": { keywords: SECURITY_CUES, keywords_ja: SECURITY_CUES_JA, keywords_ko: SECURITY_CUES_KO },
    "Refactor": { keywords: REFACOR_CUES, keywords_ja: REFACOR_CUES_JA, keywords_ko: REFACOR_CUES_KO },
    "Feature": { keywords: "", keywords_ja: "", keywords_ko: "" },
} as const;

/** User contribution types for UI badges */
export const CONTRIBUTION_KINDS = [
    "TopDeveloper",
    "BugHunter",
    "ChatChamp",
    "ReactionPro",
    //"DeployMaster",
    //"RefactorPro",
    //"IncidentResponder",
    //"FeatureLead",
    //"ActiveReviewer",
    //"SecurityChampion",
] as const;

export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];

/** Contribution type as integer (API / storage / sort) */
export const CONTRIBUTION_KIND_IDS: Record<ContributionKind, number> = {
    TopDeveloper: 1,
    BugHunter: 2,
    ChatChamp: 3,
    ReactionPro: 4,
    // DeployMaster: 3,
    // BugHunter: 4,
    // SecurityChampion: 5,
    // RefactorPro: 6,
    // IncidentResponder: 7,
    // FeatureLead: 8,
} as const;

// /** Integer to contribution type */
// export const CONTRIBUTION_ID_TO_KIND: Record<number, ContributionKind> = {
//     1: "TopContributor",
//     2: "ActiveReviewer",
//     3: "DeployMaster",
//     4: "BugHunter",
//     5: "SecurityChampion",
//     6: "RefactorPro",
//     7: "IncidentResponder",
//     8: "FeatureLead",
// } as const;

/** Tailwind gradient and badge class for card/avatar (matches contribution theme) */
const CONTRIBUTION_THEMES = {
    TopDeveloper: {
        gradient: "from-blue-500 to-cyan-400",
        badgeClassName:
            "!font-semibold !bg-blue-500/25 !text-blue-600 !border-2 !border-blue-500/40 dark:!bg-blue-500/30 dark:!text-blue-300 dark:!border-blue-400/50 shadow-sm",
    },
    BugHunter: {
        gradient: "from-orange-500 to-amber-400",
        badgeClassName:
            "!font-semibold !bg-orange-500/25 !text-orange-600 !border-2 !border-orange-500/40 dark:!bg-orange-500/30 dark:!text-amber-300 dark:!border-amber-400/50 shadow-sm",
    },
    ChatChamp: {
        gradient: "from-purple-500 to-pink-400",
        badgeClassName:
            "!font-semibold !bg-purple-500/25 !text-purple-600 !border-2 !border-purple-500/40 dark:!bg-purple-500/30 dark:!text-pink-300 dark:!border-pink-400/50 shadow-sm",
    },
    ReactionPro: {
        gradient: "from-green-500 to-emerald-400",
        badgeClassName:
            "!font-semibold !bg-green-500/25 !text-green-600 !border-2 !border-green-500/40 dark:!bg-green-500/30 dark:!text-emerald-300 dark:!border-emerald-400/50 shadow-sm",
    },
} as const;

/** Display label, NexBadge variant, and theme (gradient/badge) per contribution type */
export const CONTRIBUTION_KIND_MAP: Record<
    ContributionKind,
    {
        label: string;
        labelKey?: string;
        variant: "success" | "info" | "warning" | "secondary" | "default" | "outline" | "error";
        gradient: string;
        badgeClassName: string;
    }
> = {
    TopDeveloper: { label: "Top Developer", labelKey: "home.contribution.topDeveloper", variant: "info", ...CONTRIBUTION_THEMES.TopDeveloper },
    BugHunter: { label: "Bug Hunter", labelKey: "home.contribution.bugHunter", variant: "secondary", ...CONTRIBUTION_THEMES.BugHunter },
    ChatChamp: { label: "Chat Champ", labelKey: "home.contribution.chatChamp", variant: "warning", ...CONTRIBUTION_THEMES.ChatChamp },
    ReactionPro: { label: "Reaction Pro", labelKey: "home.contribution.reactionPro", variant: "default", ...CONTRIBUTION_THEMES.ReactionPro },
    // SecurityChampion: { label: "Security Champion", labelKey: "home.contribution.securityChampion", variant: "primary" },
    // RefactorPro: { label: "Refactor Pro", labelKey: "home.contribution.refactorPro", variant: "secondary" },
    // IncidentResponder: { label: "Incident Responder", labelKey: "home.contribution.incidentResponder", variant: "warning" },
    // ActiveReviewer: { label: "Active Reviewer", labelKey: "home.contribution.activeReviewer", variant: "info" },
    // FeatureLead: { label: "Feature Lead", labelKey: "home.contribution.featureLead", variant: "success" },
} as const;

/** 토큰 수에 따른 지연: 기준값(이상) → 지연 밀리초. 높은 구간부터 매칭되어 해당 구간만큼 지연한다 */
export const ACCURATE_TOKEN_DELAY_MS = {
    /** 200,000 토큰 이상 → 10초 */
    TIER_HIGH_THRESHOLD: 200_000,
    TIER_HIGH_DELAY_MS: 10_000,
    /** 150,000 토큰 이상 → 5초 */
    TIER_MID_THRESHOLD: 150_000,
    TIER_MID_DELAY_MS: 5_000,
    /** 100,000 토큰 이상 → 2초 */
    TIER_LOW_THRESHOLD: 100_000,
    TIER_LOW_DELAY_MS: 2_000,
} as const;
