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


