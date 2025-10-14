import { run } from "@openai/agents";
import { z } from "zod";
import type { KpiSnapshot, LinkedActivityDoc, RankedHighlight } from "../lib/types";
import { ActivityInput, ActivityOutput, FunCornerInput, HighlightsInput, OngoingProgressOutput } from "../openai/models";
import { createActivitySummaryAgent, createFunCornerAgent, createHighlightsSummaryAgent } from "../openai/test-agent";
import { getFunCornerLeaderboardData, prepareHighlightsWithMessages, prepareMemberDataWithMessages } from "./utils";

export async function createHighlightsSummary(
    linkedData: LinkedActivityDoc, 
    highlights: RankedHighlight[],
    language: 'en' | 'ko' | 'ja' = 'en') {

    const highlightsWithMessages = prepareHighlightsWithMessages(linkedData, highlights);
    //await saveContentToFile(highlightsWithMessages, 'output-test', 'highlights_with_messages_', 'json');
    
    const input = HighlightsInput.parse({
        project: "LEAD",
        contents: JSON.stringify(highlightsWithMessages),
    });

    const agent = createHighlightsSummaryAgent(language);
    const result = await run(
        agent,
        JSON.stringify(input)
    );
    //await saveContentToFile(result.finalOutput, 'output-test', 'highlights_summary_', 'json');

    return { highlightsSummary: result.finalOutput };
}

export async function summarizeMemberActivity(
    linkedData: LinkedActivityDoc,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<typeof ActivityOutput> {

    const memberDataWithMessages = prepareMemberDataWithMessages(linkedData);

    //await saveContentToFile(memberDataWithMessages, 'output-test', 'member_data_with_messages_', 'json');
    const input = ActivityInput.parse({
        project: "LEAD",
        contents: JSON.stringify(memberDataWithMessages),
    });
    const agent = createActivitySummaryAgent(language);
    
    const result = await run(
        agent,
        JSON.stringify(input)
    );

    return result.finalOutput as unknown as typeof ActivityOutput;
    
}

/**
 * slack data를 기반으로 fun corner을 생성
 * @param linkedData 
 * @param language 
 * @returns 
 */
export async function createFunCorner(
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
    const input = FunCornerInput.parse({
        project: 'all',
        contents: contentsString,
    });

    const agent = createFunCornerAgent(language);
    const result = await run(agent, JSON.stringify(input));

    return result.finalOutput;
    
}