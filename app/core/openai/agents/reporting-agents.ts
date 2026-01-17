import { Agent } from "@openai/agents";
import type { EnableCreateContents } from "~/core/lib/types";
import type { SupportedLanguage } from "../../config/style-guide";
import { buildPrompt } from "../../prompts";
import type { SectionName } from "../../prompts/toHtml";
import type { PromptType } from "../../prompts/types";

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
    const isNoKpi = !enableCreateContents.github && enableCreateContents.slack;
    const promptType = isOnlyKpi ? 'convert_to_html_kpi' : isNoKpi ? 'convert_to_html_no_kpi' : 'convert_to_html';
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: 'convert_to_html_agent',
        instructions: instructions,
        model: 'gpt-5-mini-2025-08-07',
    });
}

/**
 * セクション別HTML変換Agent（並列処理用）
 * 軽量なプロンプトを使用して高速化
 * @param language 言語
 * @param sectionName セクション名
 * @returns Agent
 */
export function createSectionHTMLAgent(
    language: SupportedLanguage = 'en',
    sectionName: SectionName
) {
    // セクション名からPromptTypeを生成
    const promptType = `toHtml_${sectionName}` as PromptType;
    const instructions = buildPrompt(promptType, language);
    return new Agent({
        name: `section_html_agent_${sectionName}`,
        instructions: instructions,
        model: 'gpt-4.1-mini', // 軽量モデルで高速化
    });
}