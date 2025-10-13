import { run } from "@openai/agents";
import type { LinkedActivityDoc, RankedHighlight } from "../lib/types";
import { ActivityInput, ActivityOutput, HighlightsInput } from "../openai/models";
import { createActivitySummaryAgent, createHighlightsSummaryAgent } from "../openai/test-agent";
import { prepareHighlightsWithMessages, prepareMemberDataWithMessages } from "./utils";

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