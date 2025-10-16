import { z } from "zod";
import type { CreateContentsInput } from "~/core/lib/types";
import { logger } from "../lib/logger";
import type { KpiSnapshot, LinkedActivityDoc, UnifiedActivityDoc } from "../lib/types";
import { ActivityOutput, HighlightsOutput, OngoingProgressOutput, TopicOutput } from "../openai/models";
import {
    createHighlightsSummary,
    ongoingProgressRoadmapExtracte,
    rankHighlights,
    repoKpiExtractor,
    summarizeMemberActivity,
    topicClustering
} from "./analyze-data";
import { crossLinker } from "./cross-linker";
import { createFunCorner } from "./drafting-data";
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
    //console.log('👤 Members:', Object.keys(linkedData.items.member || {}));

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
    const language = input.language;

    // 2-1. github data를 기반으로 kpi snapshot을 생성
    const kpiInfo = await repoKpiExtractor(input.githubResult || {});
    logger.info('📝 Kpi snapshot created');

    // 2-2. slack data를 기반으로 topic clustering을 생성
    const topicsTemp = await topicClustering(linkedData, language, input.source);
    logger.info('📝 Topic clustering completed');

    // 2-3. topic clustering을 기반으로 rank highlights을 추출
    const highlightsTemp = rankHighlights(topicsTemp as unknown as z.infer<typeof TopicOutput>, kpiInfo);
    logger.info('📝 Rank highlights created');
    // highlights에 존재하지 않는 topics을 id 기반으로 추출
    const topics = topicsTemp.clusters.filter((topic) => !highlightsTemp.some((highlight) => highlight.clusterId === topic.id));
    
    // 2-4. highlights summary을 생성
    const highlights = await createHighlightsSummary(linkedData, highlightsTemp, language);
    logger.info('📝 Highlights summary created');

    // 2-5. slack data를 기반으로 ongoing progress roadmap을 생성
    const ongoing = await ongoingProgressRoadmapExtracte(linkedData, language);
    //await saveContentToFile(ongoing, 'output-test', 'ongoing_progress_roadmap_', 'json');
    logger.info('📝 Ongoing progress roadmap created');

    // 2-6. slack data를 기반으로 member activity summary을 생성
    const userActivity = await summarizeMemberActivity(linkedData, language);
    logger.info('📝 Member activity summary created');

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, highlights, topics, ongoing, userActivity };

}

/**
 * 3. 데이터 정리 & 편집(Drafting)
 * @param language 
 * @param linkedData activity doc
 * @param kpiInfo kpi info
 * @param highlights highlights
 * @param topics topics
 * @param ongoing ongoing
 * @param userActivity user activity
 * @returns 
 */
export async function draftingData(
    language: 'en' | 'ko' | 'ja' = 'en',
    linkedData: LinkedActivityDoc, 
    kpiInfo: KpiSnapshot, 
    highlights: z.infer<typeof HighlightsOutput>, 
    topics: z.infer<typeof TopicOutput>,
    ongoing: z.infer<typeof OngoingProgressOutput>,
    userActivity: z.infer<typeof ActivityOutput>) {
    logger.info('📝 Drafting data started');

    // 3-1. KPI Summary섹션을 생성

    // 3-2. Highlights섹션을 생성

    // 3-3. Topics섹션을 생성

    // 3-4. Member Activity섹션을 생성

    // 3-5. Ongoing/Roadmap and Looking Ahead섹션을 생성

    // 3-6. Fun Corner섹션을 생성
    const funCorner = await createFunCorner(linkedData, kpiInfo, ongoing, language);
    logger.info('📝 Fun corner created');

    logger.info('📝 Drafting data completed');
    return { linkedData, kpiInfo, topics, highlights };
}

export async function generateContents(input: CreateContentsInput) {
    const linkedData = await normalizeData(input);
    const { kpiInfo, highlights, topics, ongoing, userActivity }  = await analyzeData(input, linkedData);
    await draftingData(input.language, linkedData, kpiInfo, highlights, topics, ongoing, userActivity);
    
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    //await saveContentToFile(kpiInfo, 'output-test', 'repo_kpi_', 'json');
    //await saveContentToFile(highlights, 'output-test', 'highlights_', 'json');
    //await saveContentToFile(activitySummary, 'output-test', 'activity_summary_', 'json');

    return { linkedData, kpiInfo, topics, highlights, ongoing, userActivity };
}