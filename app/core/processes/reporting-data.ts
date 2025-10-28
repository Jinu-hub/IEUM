import { run } from "@openai/agents";
import { logger } from "../lib/logger";
import type { CreateContentsInput } from "../lib/types";
import { createConvertToHTMLAgent, createFinalContentsAgent } from "../openai/agents/reporting-agents";
import type { SupportedLanguage } from "../openai/config/style-guide";
import { CommonInput } from "../openai/models";

/**
 * 최종 콘텐츠 생성(Create Final Contents)
 * @param input input
 * @param mergedContents merged contents
 * @returns 
 */
export async function createFinalContents(input: CreateContentsInput, mergedContents: string) {
    logger.info('📝 Creating final contents started');
    const agent = createFinalContentsAgent(input.language);
    const inputData = CommonInput.parse({
        project: 'all',
        contents: mergedContents,
    });
    const result = await run(agent, JSON.stringify(inputData));
    logger.info('📝 Creating final contents completed');
    return result.finalOutput;
}

/**
 * 최종 콘텐츠를 HTML로 변환(Convert to HTML)
 * @param finalContents final contents
 * @returns 
 */
export async function convertToHTML(language: SupportedLanguage, finalContents: string) {
    logger.info('📝 Converting to HTML started');
    const agent = createConvertToHTMLAgent(language);
    const inputData = CommonInput.parse({
        project: 'all',
        contents: finalContents,
    });
    const result = await run(agent, JSON.stringify(inputData));
    logger.info('📝 Converting to HTML completed');
    return result.finalOutput;
}