import { Agent } from "@openai/agents";
import type { EnableCreateContents } from "~/core/lib/types";
import type { SupportedLanguage } from "../../config/style-guide";
import { buildPrompt } from "../../prompts";
import type { SectionName } from "../../prompts/toHtml";
import type { KpiSectionName } from "../../prompts/toHtml_kpi";
import type { PromptType } from "../../prompts/types";
import { AGENT_MODELS } from "../index";

export function createFinalContentsAgent(
    language: SupportedLanguage = 'en',
    enableCreateContents: EnableCreateContents = {
        slack: true,
        github: true,
        discord: false,
    }
) {
    const isOnlyKpi = enableCreateContents.github && !enableCreateContents.slack;
    const isNoKpi = !enableCreateContents.github && enableCreateContents.slack;
    const promptType = isOnlyKpi ? 'create_final_kpi' : isNoKpi ? 'create_final_contents_no_kpi' : 'create_final_contents';
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: 'final_contents_agent',
        instructions: instructions,
        model: AGENT_MODELS.final_contents,
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
    const isNoKpi = !enableCreateContents.github && enableCreateContents.slack;
    const promptType = isOnlyKpi ? 'convert_to_html_kpi' : isNoKpi ? 'convert_to_html_no_kpi' : 'convert_to_html';
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: 'convert_to_html_agent',
        instructions: instructions,
        model: AGENT_MODELS.convert_to_html,
    });
}

/**
 * 섹션별 HTML 변환 Agent (병렬 처리용)
 * 경량 프롬프트를 사용하여 고속화
 * @param language 언어
 * @param sectionName 섹션명
 * @returns Agent
 */
export function createSectionHTMLAgent(
    language: SupportedLanguage = 'en',
    sectionName: SectionName
) {
    // 섹션명으로 PromptType 생성
    const promptType = `toHtml_${sectionName}` as PromptType;
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: `section_html_agent_${sectionName}`,
        instructions: instructions,
        model: AGENT_MODELS.section_html,
    });
}

/**
 * KPI Newsletter용 섹션별 HTML 변환 Agent (병렬 처리용)
 * KPI 전용 경량 프롬프트 사용 (contributor-card, case-card 등)
 * @param language 언어
 * @param sectionName KPI 섹션명
 * @returns Agent
 */
export function createSectionHTMLKpiAgent(
    language: SupportedLanguage = 'en',
    sectionName: KpiSectionName
) {
    const promptType = `toHtml_kpi_${sectionName}` as PromptType;
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: `section_html_kpi_agent_${sectionName}`,
        instructions: instructions,
        model: AGENT_MODELS.section_html,
    });
}