import { Agent } from "@openai/agents";
import type { SupportedLanguage } from "../config/style-guide";
import { buildPrompt } from "../prompts";

export function createFinalContentsAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('create_final_contents', language);
    return new Agent({
        name: 'final_contents_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}