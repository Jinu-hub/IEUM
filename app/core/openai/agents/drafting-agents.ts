import { Agent } from "@openai/agents";
import type { SupportedLanguage } from "../../config/style-guide";
import { buildPrompt } from "../../prompts";


export function createKpiSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('kpi_section', language);
    return new Agent({
        name: 'kpi_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createHighlightsSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('highlights_section', language);
    return new Agent({
        name: 'highlights_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createTopicsSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('topics_section', language);
    return new Agent({
        name: 'topics_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createMemberActivitySectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('member_activity_section', language);
    return new Agent({
        name: 'member_activity_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createOngoingSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('ongoing_section', language);
    return new Agent({
        name: 'ongoing_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}

export function createClosingSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('closing_section', language);
    return new Agent({
        name: 'closing_section_agent',
        instructions: instructions,
        model: 'gpt-4.1-mini',
    });
}