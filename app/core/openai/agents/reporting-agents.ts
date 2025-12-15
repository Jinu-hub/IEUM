import { Agent } from "@openai/agents";
import type { EnableCreateContents } from "~/core/lib/types";
import type { SupportedLanguage } from "../config/style-guide";
import { buildPrompt } from "../prompts";

export function createFinalContentsAgent(
    language: SupportedLanguage = 'en',
    enableCreateContents: EnableCreateContents = {
        slack: true,
        github: true,
        discord: false,
    }
) {
    const isOnlyKpi = enableCreateContents.github && !enableCreateContents.slack;
    const promptType = isOnlyKpi ? 'create_final_kpi' : 'create_final_contents';
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: 'final_contents_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createConvertToHTMLAgent(
    language: SupportedLanguage = 'en',
    enableCreateContents: EnableCreateContents = {
        slack: true,
        github: true,
        discord: false,
    }
) {
    const isOnlyKpi = enableCreateContents.github && !enableCreateContents.slack;
    const promptType = isOnlyKpi ? 'convert_to_html_kpi' : 'convert_to_html';
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: 'convert_to_html_agent',
        instructions: instructions,
        model: 'gpt-5-mini-2025-08-07',
    });
}