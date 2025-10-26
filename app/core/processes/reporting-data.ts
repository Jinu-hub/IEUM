import { run } from "@openai/agents";
import type { CreateContentsInput } from "../lib/types";
import { createFinalContentsAgent } from "../openai/agents/reporting-agents";
import { CommonInput } from "../openai/models";

/**
 * 최종 콘텐츠 생성(Create Final Contents)
 * @param input input
 * @param mergedContents merged contents
 * @returns 
 */
export async function createFinalContents(input: CreateContentsInput, mergedContents: string) {
    const agent = createFinalContentsAgent(input.language);
    const inputData = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(mergedContents),
    });
    const result = await run(agent, JSON.stringify(inputData));
    return result.finalOutput;
}