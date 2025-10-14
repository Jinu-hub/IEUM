import { run } from "@openai/agents";
import { z } from "zod";
import type { KpiSnapshot, LinkedActivityDoc } from "../lib/types";
import { CommonInput, OngoingProgressOutput } from "../openai/models";
import { createFunCornerAgent } from "../openai/test-agent";
import { getFunCornerLeaderboardData } from "./utils";

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
    const input = CommonInput.parse({
        project: 'all',
        contents: contentsString,
    });

    const agent = createFunCornerAgent(language);
    const result = await run(agent, JSON.stringify(input));

    return result.finalOutput;
    
}