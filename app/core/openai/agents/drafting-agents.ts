import { Agent } from "@openai/agents";
import type { SupportedLanguage } from "../../config/style-guide";
import { buildPrompt } from "../../prompts";
import { AGENT_MODELS } from "../index";


export function createKpiSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('kpi_section', language);
    return new Agent({
        name: 'kpi_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.kpi_section,
    });
}

export function createHighlightsSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('highlights_section', language);
    return new Agent({
        name: 'highlights_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.highlights_section,
    });
}

export function createTopicsSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('topics_section', language);
    return new Agent({
        name: 'topics_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.topics_section,
    });
}

export function createMemberActivitySectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('member_activity_section', language);
    return new Agent({
        name: 'member_activity_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.member_activity_section,
    });
}

export function createOngoingSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('ongoing_section', language);
    return new Agent({
        name: 'ongoing_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.ongoing_section,
    });
}

export function createClosingSectionAgent(
    language: SupportedLanguage = 'en',
) {
    const instructions = buildPrompt('closing_section', language);
    return new Agent({
        name: 'closing_section_agent',
        instructions: instructions,
        model: AGENT_MODELS.closing_section,
    });
}