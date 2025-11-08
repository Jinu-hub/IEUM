import { run } from "@openai/agents";
import { logger } from "../lib/logger";
import type { CreateContentsInput } from "../lib/types";
import { createConvertToHTMLAgent, createFinalContentsAgent } from "../openai/agents/reporting-agents";
import type { SupportedLanguage } from "../openai/config/style-guide";
import { CommonInput } from "../openai/models";

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
 * @param finalContents final contents (markdown)
 * @returns DividedContents
 */
export function divideContents(finalContents: string): DividedContents {
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
    sections.kpi = extractSection(/##\s+.*?(KPI|指標|지표)/i);
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
 * @param language language
 * @param sections sections
 * @returns 
 */
export async function convertToHTML(language: SupportedLanguage, sections: DividedContents) {
    logger.info('📝 Converting to HTML started');
    const agent = createConvertToHTMLAgent(language);
    const inputData = CommonInput.parse({
        project: 'all',
        contents: JSON.stringify(sections),
    });
    const result = await run(agent, JSON.stringify(inputData));
    logger.info('📝 Converting to HTML completed');
    return result.finalOutput;
}