import { run } from "@openai/agents";
import { logger } from "../lib/logger";
import type { LinkedActivityDoc, RankedHighlight } from "../lib/types";
import { HighlightsInput } from "../openai/models";
import { createHighlightsSummaryAgent } from "../openai/test-agent";

export async function createHighlightsSummary(
    linkedData: LinkedActivityDoc, 
    highlights: RankedHighlight[],
    language: 'en' | 'ko' | 'ja' = 'en') {
    logger.info('📝 Creating highlights summary started');

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

    logger.info('📝 Creating highlights summary completed');
    return { highlightsSummary: result.finalOutput };
}

function prepareHighlightsWithMessages(linkedData: LinkedActivityDoc, highlights: RankedHighlight[]): RankedHighlight[]  {
    const messageIndexIdArray = linkedData.index?.byId;
    let highlightsWithMessages: RankedHighlight[] = [];

    if (highlights && messageIndexIdArray) {
        for (const highlight of highlights) {
            const messages = highlight.items?.map((item) => messageIndexIdArray[item]);
            highlightsWithMessages.push({
                ...highlight,
                messages,
            });
        }
    }

    return highlightsWithMessages;
}