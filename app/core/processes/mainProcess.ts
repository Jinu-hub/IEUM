import { z } from "zod";
import type { CreateContentsInput } from "~/core/lib/types";
import { saveContentToFile } from "~/features/cron/api/test-api";
import { logger } from "../lib/logger";
import type { KpiSnapshot, LinkedActivityDoc, RankedHighlight, UnifiedActivityDoc } from "../lib/types";
import { TopicOutput } from "../openai/models";
import { ongoingProgressRoadmapExtracte, repoKpiExtractor } from "./analyze-data";
import { crossLinker } from "./cross-linker";
import { createHighlightsSummary, summarizeMemberActivity } from "./drafting-data";
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
    //const topics = await topicClustering(linkedData, input.language, input.source);
    logger.info('📝 Topic clustering completed');

    // 2-3. topic clustering을 기반으로 rank highlights을 생성
   // const highlights = rankHighlights(topics as unknown as z.infer<typeof TopicOutput>, kpiInfo);
    logger.info('📝 Rank highlights created');

    // 2-4. slack data를 기반으로 ongoing progress roadmap을 생성
    const ongoingProgressRoadmap = await ongoingProgressRoadmapExtracte(linkedData, input.language);
    await saveContentToFile(ongoingProgressRoadmap, 'output-test', 'ongoing_progress_roadmap_', 'json');
    logger.info('📝 Ongoing progress roadmap created');

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, topics : [], highlights : [], ongoingProgressRoadmap };

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
export async function draftingData(
    language: 'en' | 'ko' | 'ja' = 'en',
    linkedData: LinkedActivityDoc, 
    kpiInfo: KpiSnapshot, 
    highlights: RankedHighlight[], 
    topics: z.infer<typeof TopicOutput>) {
    logger.info('📝 Drafting data started');

    // 3-1. highlights summary을 생성
    const highlightsSummary = await createHighlightsSummary(linkedData, highlights, language);
    logger.info('📝 Highlights summary created');
    // highlights에 존재하지 않는 topics을 id 기반으로 추출
    const otherTopics = topics.clusters.filter((topic) => !highlights.some((highlight) => highlight.clusterId === topic.id));

    // 3-2. slack data를 기반으로 member activity summary을 생성
    const activitySummary = await summarizeMemberActivity(linkedData, language);
    logger.info('📝 Member activity summary created');



    // Fun Corner

    logger.info('📝 Drafting data completed');
    return { linkedData, kpiInfo, topics, highlights, highlightsSummary, activitySummary };
}

export async function generateContents(input: CreateContentsInput) {
    const linkedData = await normalizeData(input);
    const { kpiInfo, topics, highlights }  = await analyzeData(input, linkedData);
   // const highlightsSummary = await draftingData(input.language, linkedData, kpiInfo, highlights, topics);
    
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    //await saveContentToFile(kpiInfo, 'output-test', 'repo_kpi_', 'json');
    //await saveContentToFile(highlights, 'output-test', 'highlights_', 'json');
    //await saveContentToFile(activitySummary, 'output-test', 'activity_summary_', 'json');

    return { linkedData, kpiInfo, topics, highlights };
}