import { z } from "zod";
import type { CreateContentsInput } from "~/core/lib/types";
import { logger } from "../lib/logger";
import type { KpiSnapshot, LinkedActivityDoc, RankedHighlight, UnifiedActivityDoc } from "../lib/types";
import { ActivityOutput, TopicOutput } from "../openai/models";
import { rankHighlights, repoKpiExtractor, topicClustering } from "./analyze-data";
import { crossLinker } from "./cross-linker";
import { createHighlightsSummary } from "./drafting-data";
import { githubIngestor, slackIngestor } from "./ingestors";


/**
 * 1. 데이터 정규화 & 중복 제거(Normalize & Deduplicate)
 * @param input 
 * @returns 
 */
export async function normalizeData(input: CreateContentsInput) {
    logger.info('📝 Normalizing and reducing data started');
    // 1-1. 수집 & 정규화(Collect & Normalization)
    const githubData = await githubIngestor(input.githubResult || {});
    const slackData = await slackIngestor(input.slackResult || {});

    // 1-2. 중복 제거 & 연결(Deduplication & Linking)
    const linkedData = await crossLinker({ ...githubData, ...slackData } as UnifiedActivityDoc);
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //console.log(linkedData.items.member);

    logger.info('📝 Normalizing and reducing data completed');
    return linkedData;
}

/**
 * 2. 데이터 분석 & 개선 & 요약(Analyze & Improve & Summarize)
 * @param input 
 * @param linkedData 
 * @returns 
 */
export async function analyzeData(
    input: CreateContentsInput, 
    linkedData: LinkedActivityDoc
): Promise<any> {
    logger.info('📝 Analyzing data started');

    // 2-1. github data를 기반으로 kpi snapshot을 생성
    const kpiInfo = await repoKpiExtractor(input.githubResult || {});
    logger.info('📝 Kpi snapshot created');

    // 2-2. slack data를 기반으로 topic clustering을 생성
    const topics = await topicClustering(linkedData, input.language, input.source);
    logger.info('📝 Topic clustering completed');

    // 2-3. topic clustering을 기반으로 rank highlights을 생성
    const highlights = rankHighlights(topics as unknown as z.infer<typeof TopicOutput>, kpiInfo);
    logger.info('📝 Rank highlights created');

    // 2-4. slack data를 기반으로 member activity summary을 생성
    //const activitySummary = await summarizeMemberActivity(linkedData, input.language);
    logger.info('📝 Member activity summary created');

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, topics, highlights, activitySummary: null };

}

/**
 * 3. 데이터 정리 & 편집(Drafting)
 * @param linkedData 
 * @param kpiInfo 
 * @param highlights 
 * @param topics 
 * @param activitySummary 
 * @returns 
 */
export async function draftingData(linkedData: LinkedActivityDoc, 
    kpiInfo: KpiSnapshot, 
    highlights: RankedHighlight[], 
    topics: z.infer<typeof TopicOutput>,
    activitySummary: z.infer<typeof ActivityOutput>) {
    logger.info('📝 Drafting data started');

    // 3-1. highlights summary을 생성
    const highlightsSummary = await createHighlightsSummary(linkedData, highlights, 'ja');
    logger.info('📝 Highlights summary created');

    logger.info('📝 Drafting data completed');
    return { linkedData, kpiInfo, topics, highlights };
}

export async function generateContents(input: CreateContentsInput) {
    const linkedData = await normalizeData(input);
    const { kpiInfo, topics, highlights, activitySummary }  = await analyzeData(input, linkedData);
    const highlightsSummary = await draftingData(linkedData, kpiInfo, highlights, topics, activitySummary);
    
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    //await saveContentToFile(kpiInfo, 'output-test', 'repo_kpi_', 'json');
    //await saveContentToFile(highlights, 'output-test', 'highlights_', 'json');
    //await saveContentToFile(activitySummary, 'output-test', 'activity_summary_', 'json');

    return { linkedData, kpiInfo, topics, highlights, activitySummary };
}