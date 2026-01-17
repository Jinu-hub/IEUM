import { run } from "@openai/agents";
import type { SupportedLanguage } from "../config/style-guide";
import { logger } from "../lib/logger";
import type { CreateContentsInput, EnableCreateContents } from "../lib/types";
import { createConvertToHTMLAgent, createFinalContentsAgent, createSectionHTMLAgent } from "../openai/agents/reporting-agents";
import { CommonInput } from "../openai/models";
import { assembleCompleteHTML, type SectionHTMLParts, type SectionName } from "../prompts/toHtml";

/**
 * 분할된 콘텐츠 타입
 */
export interface DividedContents {
    header: string;          // タイトルと日付範囲
    summary: string;         // サマリーセクション
    kpi: string;             // KPIセクション
    highlights: string;      // ハイライトセクション
    topics: string;          // トピックセクション
    ongoing: string;         // 進行中/ロードマップセクション
    memberActivity: string;  // メンバー活動セクション
    closing: string;         // おわりにセクション
}

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
 * 최종 콘텐츠를 섹션별로 나누어서 반환(Divide Contents)
 * @param isNoKpi is no kpi
 * @param finalContents final contents (markdown)
 * @returns DividedContents
 */
export function divideContents(isNoKpi: boolean, finalContents: string): DividedContents {
    logger.info('📝 Dividing contents started');

    // コードブロックを除去（```で囲まれている部分）
    const cleanedContent = finalContents.replace(/^```\w*\n/gm, '').replace(/\n```$/gm, '');

    // セクションを分割するための正規表現
    const sections: DividedContents = {
        header: '',
        summary: '',
        kpi: '',
        highlights: '',
        topics: '',
        ongoing: '',
        memberActivity: '',
        closing: '',
    };

    // ヘッダー部分を抽出（# タイトルから最初の ## まで）
    const headerMatch = cleanedContent.match(/^#\s+(.+?)\n(.+?)\n\n##/s);
    if (headerMatch) {
        sections.header = `# ${headerMatch[1]}\n${headerMatch[2]}`;
    }

    // 各セクションを抽出する関数
    const extractSection = (startPattern: RegExp, endPattern: RegExp = /\n##\s+/): string => {
        const match = cleanedContent.match(new RegExp(`${startPattern.source}([\\s\\S]*?)(?:${endPattern.source}|$)`));
        return match ? match[0].replace(endPattern, '').trim() : '';
    };

    // 各セクションを抽出（多言語対応：日本語/英語/韓国語）
    sections.summary = extractSection(/##\s+.*?(サマリー|Summary|요약|주간요약)/i);
    if (!isNoKpi) {
        sections.kpi = extractSection(/##\s+.*?(KPI|指標|지표)/i);
    }
    sections.highlights = extractSection(/##\s+.*?(ハイライト|Highlight|하이라이트|주요내용)/i);
    sections.topics = extractSection(/##\s+.*?(トピック|Topic|토픽|주제)/i);
    sections.ongoing = extractSection(/##\s+.*?(進行中|ロードマップ|予定|Ongoing|Roadmap|진행중|로드맵|예정)/i);
    sections.memberActivity = extractSection(/##\s+.*?(メンバー|活動|Member|Activity|멤버|활동|구성원)/i);
    sections.closing = extractSection(/##\s+.*?(おわり|終わり|Closing|Conclusion|마무리|결론)/i);

    logger.info('📝 Dividing contents completed');
    
    return sections;
}

/**
 * 최종 콘텐츠를 HTML로 변환(Convert to HTML)
 * 병렬 처리 방식을 사용하여 각 섹션을 동시에 변환
 * @param input CreateContentsInput
 * @param sections 분할된 마크다운 콘텐츠
 * @returns 완성된 HTML 문서
 */
export async function convertToHTML(input: CreateContentsInput, sections: DividedContents) {
    // 병렬 처리 방식으로 변환
    return convertToHTMLParallel(input, sections);
    
    // ============================================
    // [기존 코드 - 직렬 처리 방식]
    // 문제 발생시 아래 코드로 롤백 가능
    // ============================================
    // logger.info('📝 Converting to HTML started');
    // const language = input.language;
    // const agent = createConvertToHTMLAgent(language, input.enableCreateContents!);
    // const inputData = CommonInput.parse({
    //     project: 'all',
    //     contents: JSON.stringify(sections),
    // });
    // const result = await run(agent, JSON.stringify(inputData));
    // logger.info('📝 Converting to HTML completed');
    // return result.finalOutput;
}

/**
 * 최종 KPI 콘텐츠를 HTML로 변환(Convert to HTML Only KPI)
 * @param language language
 * @param finalContents final contents (markdown)
 * @param enableCreateContents enable create contents
 * @returns 
 */
export async function convertToHTMLOnlyKpi(language: SupportedLanguage, finalContents: string, enableCreateContents: EnableCreateContents) {
    logger.info('📝 Converting to HTML Only KPI started');
    const agent = createConvertToHTMLAgent(language, enableCreateContents);
    const inputData = CommonInput.parse({
        project: 'all',
        contents: finalContents,
    });
    const result = await run(agent, JSON.stringify(inputData));
    logger.info('📝 Converting to HTML Only KPI completed');
    return result.finalOutput;
}

/**
 * 세션별 HTML 변환 결과
 */
interface SectionConversionResult {
    sectionName: SectionName;
    html: string;
    success: boolean;
    error?: string;
}

/**
 * 단일 섹션을 HTML로 변환
 * @param language 언어
 * @param sectionName 섹션명
 * @param content 마크다운 콘텐츠
 * @returns 변환 결과
 */
async function convertSectionToHTML(
    language: SupportedLanguage,
    sectionName: SectionName,
    content: string
): Promise<SectionConversionResult> {
    if (!content || content.trim() === '') {
        return { sectionName, html: '', success: true };
    }
    
    try {
        const agent = createSectionHTMLAgent(language, sectionName);
        const result = await run(agent, content);
        return {
            sectionName,
            html: result.finalOutput || '',
            success: true,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`❌ Failed to convert section ${sectionName}: ${errorMessage}`);
        return {
            sectionName,
            html: '',
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * 최종 콘텐츠를 HTML로 변환 (병렬 처리)
 * 각 섹션을 병렬로 처리하여 전체 변환 시간 단축
 * 
 * @param input CreateContentsInput
 * @param sections 분할된 마크다운 콘텐츠
 * @returns 완성된 HTML 문서
 */
export async function convertToHTMLParallel(
    input: CreateContentsInput, 
    sections: DividedContents
): Promise<string> {
    logger.info('📝 Converting to HTML (parallel) started');
    const startTime = Date.now();
    const language = input.language;
    const isNoKpi = !input.enableCreateContents?.github && input.enableCreateContents?.slack;
    
    // 변환할 섹션 목록 준비
    const sectionEntries: Array<{ name: SectionName; content: string }> = [
        { name: 'header', content: sections.header },
        { name: 'summary', content: sections.summary },
        { name: 'kpi', content: isNoKpi ? '' : sections.kpi },
        { name: 'highlights', content: sections.highlights },
        { name: 'topics', content: sections.topics },
        { name: 'ongoing', content: sections.ongoing },
        { name: 'memberActivity', content: sections.memberActivity },
        { name: 'closing', content: sections.closing },
    ];
    
    // 모든 섹션을 병렬로 변환
    logger.info(`🚀 Starting parallel conversion for ${sectionEntries.filter(s => s.content).length} sections`);
    
    const conversionPromises = sectionEntries.map(({ name, content }) =>
        convertSectionToHTML(language, name, content)
    );
    
    const results = await Promise.all(conversionPromises);
    
    // 결과를 SectionHTMLParts로 변환
    const htmlParts: SectionHTMLParts = {
        header: '',
        summary: '',
        kpi: '',
        highlights: '',
        topics: '',
        ongoing: '',
        memberActivity: '',
        closing: '',
    };
    
    let failedSections: string[] = [];
    for (const result of results) {
        if (result.success) {
            htmlParts[result.sectionName] = result.html;
        } else {
            failedSections.push(result.sectionName);
            logger.warn(`⚠️ Section ${result.sectionName} failed: ${result.error}`);
        }
    }
    
    if (failedSections.length > 0) {
        logger.warn(`⚠️ ${failedSections.length} sections failed to convert: ${failedSections.join(', ')}`);
    }
    
    // 완전한 HTML 문서 조립
    const completeHTML = assembleCompleteHTML(language, htmlParts, isNoKpi);
    
    const endTime = Date.now();
    logger.info(`📝 Converting to HTML (parallel) completed in ${endTime - startTime}ms`);
    
    return completeHTML;
}