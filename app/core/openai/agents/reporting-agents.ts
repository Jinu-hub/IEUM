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

export function createConvertToHTMLAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('convert_to_html', language);
    return new Agent({
        name: 'convert_to_html_agent',
        instructions: instructions,
        model: 'gpt-5-mini-2025-08-07',
    });
}