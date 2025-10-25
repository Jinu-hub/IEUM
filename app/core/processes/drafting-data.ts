import { run } from "@openai/agents";
import { z } from "zod";
import type { KpiSnapshot, LinkedActivityDoc } from "../lib/types";
import {
    createClosingSectionAgent,
    createHighlightsSectionAgent,
    createKpiSectionAgent,
    createMemberActivitySectionAgent,
    createOngoingSectionAgent,
    createTopicsSectionAgent,
} from "../openai/agents/drafting-agents";
import { ActivityOutput, CommonInput, HighlightsOutput, OngoingProgressOutput, TopicOutput } from "../openai/models";
import { getFunCornerLeaderboardData } from "./utils";

export async function createKpiSection(
    kpiData: KpiSnapshot,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {
    const agent = createKpiSectionAgent(language);
    const input = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(kpiData),
    });
    const result = await run(agent, JSON.stringify(input));
    return result.finalOutput;
}

export async function createHighlightsSection(
    highlightsData: z.infer<typeof HighlightsOutput>,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {
    const agent = createHighlightsSectionAgent(language);
    const input = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(highlightsData),
    });
    const result = await run(agent, JSON.stringify(input));
    return result.finalOutput;
}

export async function createTopicsSection(
    topicsData: z.infer<typeof TopicOutput>,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {
    const agent = createTopicsSectionAgent(language);
    const input = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(topicsData),
    });
    const result = await run(agent, JSON.stringify(input));
    return result.finalOutput;
}

export async function createMemberActivitySection(
    memberActivityData: z.infer<typeof ActivityOutput>,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {
    const agent = createMemberActivitySectionAgent(language);
    const input = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(memberActivityData),
    });
    const result = await run(agent, JSON.stringify(input));
    return result.finalOutput;
}

export async function createOngoingSection(
    ongoingData: z.infer<typeof OngoingProgressOutput>,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {
    const agent = createOngoingSectionAgent(language);
    const input = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(ongoingData),
    });
    const result = await run(agent, JSON.stringify(input));
    return result.finalOutput;
}

/**
 * slack data를 기반으로 closing section을 생성
 * @param linkedData 
 * @param language 
 * @returns 
 */
export async function createClosingSection(
    linkedData: LinkedActivityDoc,
    kpiData: KpiSnapshot,
    ongoingData: z.infer<typeof OngoingProgressOutput>,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<any> {

    const leaderboardData = getFunCornerLeaderboardData(linkedData, kpiData);
    const trimmed = {
        ongoingProgress: ongoingData,
        leaderboard: {
            ...leaderboardData,
        },
    };
    
    const contentsString = JSON.stringify(trimmed, null, 2);
    const input = CommonInput.parse({
        project: 'all',
        contents: contentsString,
    });

    const agent = createClosingSectionAgent(language);
    const result = await run(agent, JSON.stringify(input));

    return result.finalOutput;
    
}