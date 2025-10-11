import { z } from "zod";
import type { CreateContentsInput, KpiSnapshot, RankedHighlight } from "~/core/lib/types";
//import { saveContentToFile } from "~/features/cron/api/test-api";
import { logger } from "../lib/logger";
import type { LinkedActivityDoc, UnifiedActivityDoc } from "../lib/types";
import { ActivityOutput, TopicOutput } from "../openai/models";
import { rankHighlights, repoKpiExtractor, summarizeMemberActivity, topicClustering } from "./analyze-data";
import { crossLinker } from "./cross-linker";
import { githubIngestor, slackIngestor } from "./ingestors";

export async function normalizeData(input: CreateContentsInput) {
    logger.info('📝 Normalizing and reducing data started');
    // 1. 수집 & 정규화(Collect & Normalization)
    const githubData = await githubIngestor(input.githubResult || {});
    const slackData = await slackIngestor(input.slackResult || {});

    // 2. 중복 제거 & 연결(Deduplication & Linking)
    const linkedData = await crossLinker({ ...githubData, ...slackData } as UnifiedActivityDoc);
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    console.log(linkedData.items.member);

    logger.info('📝 Normalizing and reducing data completed');
    return linkedData;
}

export async function analyzeData(input: CreateContentsInput, linkedData: LinkedActivityDoc): Promise<any> {
    logger.info('📝 Analyzing data started');

    // 3. github data를 기반으로 kpi snapshot을 생성
    const kpiInfo = await repoKpiExtractor(input.githubResult || {});
    logger.info('📝 Kpi snapshot created');

    // 4. slack data를 기반으로 topic clustering을 생성
    const topics = await topicClustering(linkedData);
    logger.info('📝 Topic clustering completed');

    // 5. topic clustering을 기반으로 rank highlights을 생성
    const highlights = rankHighlights(topics as unknown as z.infer<typeof TopicOutput>, kpiInfo);
    logger.info('📝 Rank highlights created');

    // 6. slack data를 기반으로 member activity summary을 생성
    const activitySummary = await summarizeMemberActivity(linkedData, 'ja');
    logger.info('📝 Member activity summary created');

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, topics: null, highlights: null, activitySummary };

}

export async function draftingData(linkedData: LinkedActivityDoc, 
    kpiInfo: KpiSnapshot, 
    highlights: RankedHighlight[], 
    topics: z.infer<typeof TopicOutput>,
    activitySummary: z.infer<typeof ActivityOutput>) {
    logger.info('📝 Drafting data started');

    logger.info('📝 Drafting data completed');
    return { linkedData, kpiInfo, topics, highlights };
}

export async function generateContents(input: CreateContentsInput) {
    const linkedData = await normalizeData(input);
    const { kpiInfo, topics, highlights, activitySummary } = await analyzeData(input, linkedData);
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    //await saveContentToFile(kpiInfo, 'output-test', 'repo_kpi_', 'json');
    //await saveContentToFile(highlights, 'output-test', 'highlights_', 'json');
    //await saveContentToFile(activitySummary, 'output-test', 'activity_summary_', 'json');

    return { linkedData, kpiInfo, topics, highlights, activitySummary };
}