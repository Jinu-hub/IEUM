import { run } from "@openai/agents";
import type { SupportedLanguage } from "../config/style-guide";
import { logger } from "../lib/logger";
import type { CreateContentsInput, EnableCreateContents } from "../lib/types";
import { createFinalContentsAgent, createSectionHTMLAgent, createSectionHTMLKpiAgent } from "../openai/agents/reporting-agents";
import { CommonInput } from "../openai/models";
import { assembleCompleteHTML, type SectionHTMLParts, type SectionName } from "../prompts/toHtml";
import { assembleKpiCompleteHTML, type KpiSectionHTMLParts, type KpiSectionName } from "../prompts/toHtml_kpi";

/**
 * 분할된 콘텐츠 타입
 */
export interface DividedContents {
    header: string;          // 타이틀과 날짜 범위
    summary: string;         // 요약 섹션
    kpi: string;             // KPI 섹션
    highlights: string;      // 하이라이트 섹션
    topics: string;          // 토픽 섹션
    ongoing: string;         // 진행중/로드맵 섹션
    memberActivity: string;  // 멤버 활동 섹션
    closing: string;         // 마무리 섹션
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
 * 섹션 추출용 패턴 정의
 * 이모지 prefix를 1차 매칭으로, 키워드를 2차 폴백으로 사용하여 오탐 방지
 * 
 * 프롬프트에서 지정하는 EXACT 타이틀:
 *   ja: ## 👋 週次サマリー / ## 📊 KPIサマリー / ## ✨ ハイライト / ## 🧭 トピックス / ## ⚙ 進行中のタスク & ロードマップ / ## 💬 メンバー活動 / ## 🎉 ...
 *   ko: ## 👋 주간 요약    / ## 📊 KPI 요약    / ## ✨ 하이라이트   / ## 🧭 토픽       / ## ⚙ 진행 중인 작업 & 로드맵          / ## 💬 멤버 활동    / ## 🎉 ...
 *   en: ## 👋 Weekly Summary / ## 📊 KPI Summary / ## ✨ Highlights  / ## 🧭 Topics     / ## ⚙ Ongoing Tasks & Roadmap        / ## 💬 Member Activity / ## 🎉 ...
 *  kpi: ## 👋 Opening Summary / ## 📊 KPI Summary / ## 🌟 Contributor Highlights / ## 🔍 Case Activity / ## 📝 Closing
 */
const SECTION_PATTERNS: Record<keyof Omit<DividedContents, 'header'>, RegExp> = {
    summary:        /##\s+(?:👋\s*)?(?:週次サマリー|Weekly\s+Summary|주간\s*요약|Opening\s+Summary)/i,
    kpi:            /##\s+(?:📊\s*)?(?:KPI|指標|지표)/i,
    highlights:     /##\s+(?:[✨🌟]\s*)?(?:ハイライト|Highlight|하이라이트|Contributor)/i,
    topics:         /##\s+(?:[🧭🔍]\s*)?(?:トピック|Topic|토픽|Case\s+Activity)/i,
    ongoing:        /##\s+(?:⚙\s*)?(?:進行中|Ongoing|진행\s*중)/i,
    memberActivity: /##\s+(?:💬\s*)?(?:メンバー活動|Member\s+Activity|멤버\s*활동)/i,
    closing:        /##\s+(?:[🎉📝]\s*)?(?:おわり|終わり|Closing|Conclusion|마무리|한\s*주)/i,
};

/**
 * 최종 콘텐츠를 섹션별로 나누어서 반환(Divide Contents)
 * @param isNoKpi is no kpi
 * @param finalContents final contents (markdown)
 * @returns DividedContents
 */
export function divideContents(isNoKpi: boolean, finalContents: string): DividedContents {
    logger.info('📝 Dividing contents started');

    // 코드 블록 제거 (```로 감싸진 부분)
    const cleanedContent = finalContents.replace(/^```\w*\n/gm, '').replace(/\n```$/gm, '');

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

    // 헤더 부분 추출 (# 타이틀부터 첫 ## 까지)
    const headerMatch = cleanedContent.match(/^#\s+(.+?)\n(.+?)\n\n##/s);
    if (headerMatch) {
        sections.header = `# ${headerMatch[1]}\n${headerMatch[2]}`;
    }

    // 각 섹션을 추출하는 함수
    const extractSection = (startPattern: RegExp, endPattern: RegExp = /\n##\s+/): string => {
        const match = cleanedContent.match(new RegExp(`${startPattern.source}([\\s\\S]*?)(?:${endPattern.source}|$)`));
        return match ? match[0].replace(endPattern, '').trim() : '';
    };

    // 이모지 + 키워드 복합 매칭으로 섹션 추출
    sections.summary = extractSection(SECTION_PATTERNS.summary);
    if (!isNoKpi) {
        sections.kpi = extractSection(SECTION_PATTERNS.kpi);
    }
    sections.highlights = extractSection(SECTION_PATTERNS.highlights);
    sections.topics = extractSection(SECTION_PATTERNS.topics);
    sections.ongoing = extractSection(SECTION_PATTERNS.ongoing);
    sections.memberActivity = extractSection(SECTION_PATTERNS.memberActivity);
    sections.closing = extractSection(SECTION_PATTERNS.closing);

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
 * 병렬 처리 방식을 사용하여 각 섹션을 동시에 변환
 * @param language language
 * @param sections 분할된 마크다운 콘텐츠
 * @param enableCreateContents enable create contents
 * @returns 완성된 HTML 문서
 */
export async function convertToHTMLOnlyKpi(language: SupportedLanguage, sections: DividedContents, enableCreateContents: EnableCreateContents) {
    // 병렬 처리 방식으로 변환
    return convertToHTMLOnlyKpiParallel(language, sections);

    // ============================================
    // [기존 코드 - 직렬 처리 방식]
    // 이전 시그니처: convertToHTMLOnlyKpi(language: SupportedLanguage, finalContents: string, enableCreateContents: EnableCreateContents)
    // 문제 발생시 아래 코드로 롤백 가능
    // ============================================
    // logger.info('📝 Converting to HTML Only KPI started');
    // const agent = createConvertToHTMLAgent(language, enableCreateContents);
    // const inputData = CommonInput.parse({
    //     project: 'all',
    //     contents: finalContents,
    // });
    // const result = await run(agent, JSON.stringify(inputData));
    // logger.info('📝 Converting to HTML Only KPI completed');
    // return result.finalOutput;
}

/**
 * KPI 전용 콘텐츠를 HTML로 병렬 변환
 * KPI 전용 프롬프트 사용 (contributor-card, case-card 등)
 * 각 섹션을 병렬로 처리하여 전체 변환 시간 단축
 * 
 * @param language language
 * @param sections 분할된 마크다운 콘텐츠
 * @returns 완성된 HTML 문서
 */
export async function convertToHTMLOnlyKpiParallel(
    language: SupportedLanguage,
    sections: DividedContents
): Promise<string> {
    logger.info('📝 Converting to HTML Only KPI (parallel) started');
    const startTime = Date.now();

    const sectionEntries: Array<{ name: KpiSectionName; content: string }> = [
        { name: 'header', content: sections.header },
        { name: 'summary', content: sections.summary },
        { name: 'kpi', content: sections.kpi },
        { name: 'highlights', content: sections.highlights },
        { name: 'topics', content: sections.topics },
        { name: 'ongoing', content: sections.ongoing },
        { name: 'memberActivity', content: sections.memberActivity },
        { name: 'closing', content: sections.closing },
    ];

    logger.info(`🚀 Starting parallel conversion (KPI only) for ${sectionEntries.filter(s => s.content).length} sections`);

    const conversionPromises = sectionEntries.map(({ name, content }) =>
        convertKpiSectionToHTML(language, name, content)
    );

    const results = await Promise.all(conversionPromises);

    const htmlParts: KpiSectionHTMLParts = {
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
            htmlParts[result.sectionName as KpiSectionName] = result.html;
        } else {
            failedSections.push(result.sectionName);
            logger.warn(`⚠️ Section ${result.sectionName} failed: ${result.error}`);
        }
    }

    if (failedSections.length > 0) {
        logger.warn(`⚠️ ${failedSections.length} sections failed to convert: ${failedSections.join(', ')}`);
    }

    const completeHTML = assembleKpiCompleteHTML(language, htmlParts);

    const endTime = Date.now();
    logger.info(`📝 Converting to HTML Only KPI (parallel) completed in ${endTime - startTime}ms`);

    return completeHTML;
}

/**
 * 세션별 HTML 변환 결과
 */
interface SectionConversionResult {
    sectionName: string;
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
 * KPI Newsletter용 단일 섹션을 HTML로 변환
 * KPI 전용 프롬프트 사용 (contributor-card, case-card 등)
 * @param language 언어
 * @param sectionName KPI 섹션명
 * @param content 마크다운 콘텐츠
 * @returns 변환 결과
 */
async function convertKpiSectionToHTML(
    language: SupportedLanguage,
    sectionName: KpiSectionName,
    content: string
): Promise<SectionConversionResult> {
    if (!content || content.trim() === '') {
        return { sectionName, html: '', success: true };
    }
    
    try {
        const agent = createSectionHTMLKpiAgent(language, sectionName);
        const result = await run(agent, content);
        return {
            sectionName,
            html: result.finalOutput || '',
            success: true,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`❌ Failed to convert KPI section ${sectionName}: ${errorMessage}`);
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
            htmlParts[result.sectionName as SectionName] = result.html;
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