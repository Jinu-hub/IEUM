import { z } from "zod";
import type { CreateContentsInput } from "~/core/lib/types";
//import { saveContentToFile } from "~/features/cron/api/test-api";
import { logger } from "../lib/logger";
import type { KpiSnapshot, LinkedActivityDoc, UnifiedActivityDoc } from "../lib/types";
import { ActivityOutput, HighlightsOutput, OngoingProgressOutput, TopicOutput } from "../openai/models";
import { getBaseTemplate, getMainTemplate } from "../openai/templates";
import {
    createHighlightsSummary,
    ongoingProgressRoadmapExtracte,
    rankHighlights,
    repoKpiExtractor,
    summarizeMemberActivity,
    topicClustering
} from "./analyze-data";
import { crossLinker } from "./cross-linker";
import {
    createClosingSection,
    createHighlightsSection,
    createKpiSection,
    createMemberActivitySection,
    createOngoingSection,
    createTopicsSection,
} from "./drafting-data";
import { githubIngestor, slackIngestor } from "./ingestors";
import { createFinalContents } from "./reporting-data";

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
    logger.info('📝 Ongoing progress roadmap created');

    // 2-6. slack data를 기반으로 member activity summary을 생성
    const userActivity = await summarizeMemberActivity(linkedData, language);
    logger.info('📝 Member activity summary created');

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, highlights, topics, ongoing , userActivity };

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

    // 3-1. KPI Section을 생성
    const kpiSection = await createKpiSection(kpiInfo, language);
    logger.info('📝 Kpi section created');

    // 3-2. Highlights섹션을 생성
    const highlightsSection = await createHighlightsSection(highlights, language);
    logger.info('📝 Highlights section created');

    // 3-3. Topics섹션을 생성
    const topicsSection = await createTopicsSection(topics, language);
    logger.info('📝 Topics section created');

    // 3-4. Member Activity섹션을 생성
    const memberSection = await createMemberActivitySection(userActivity, language);
    logger.info('📝 Member activity section created');

    // 3-5. Ongoing/Roadmap and Looking Ahead섹션을 생성
    const ongoingSection = await createOngoingSection(ongoing, language);
    logger.info('📝 Ongoing/Roadmap section created');

    // 3-6. Closing Section을 생성
    const closingSection = await createClosingSection(linkedData, kpiInfo, ongoing, language);
    logger.info('📝 Closing section created');

    logger.info('📝 Drafting data completed');
    return { kpiSection, highlightsSection, topicsSection, memberSection, ongoingSection, closingSection };
}

/**
 * 4. 콘텐츠 병합(Merge Contents)
 * @param input input
 * @param kpiSection kpi section
 * @param highlightsSection highlights section
 * @param topicsSection topics section
 * @param memberSection member section
 * @param ongoingSection ongoing section
 * @param closingSection closing section
 * @returns 
 */
export async function mergeContents(input: CreateContentsInput, 
    kpiSection: string, highlightsSection: string, 
    topicsSection: string, memberSection: string, 
    ongoingSection: string, closingSection: string) {
        
    const isOnlyKpi = kpiSection && !highlightsSection && !topicsSection && !memberSection && !ongoingSection && !closingSection;

    if (isOnlyKpi) {
        return kpiSection;
    } else {

        let baseTemplate = getBaseTemplate(input.language);
        let mainTemplate = getMainTemplate(input.language);

        mainTemplate = mainTemplate.replace('{{HIGHLIGHTS_SECTION}}', highlightsSection);
        mainTemplate = mainTemplate.replace('{{TOPICS_SECTION}}', topicsSection);
        mainTemplate = mainTemplate.replace('{{MEMBER_ACTIVITY_SECTION}}', memberSection);
        mainTemplate = mainTemplate.replace('{{ONGOING_SECTION}}', ongoingSection);

        baseTemplate = baseTemplate.replace('{{PERIOD}}', input.period);
        baseTemplate = baseTemplate.replace('{{KPI_SECTION}}', kpiSection);
        baseTemplate = baseTemplate.replace('{{MAIN_SECTION}}', mainTemplate);
        baseTemplate = baseTemplate.replace('{{CLOSING_SECTION}}', closingSection);

        return baseTemplate;
    }
}

/**
 * 5. 콘텐츠 생성(Generate Contents)
 * @param input input
 * @param mergedContents merged contents
 * @returns 
 */
export async function generateFinalContents(input: CreateContentsInput, mergedContents: string) {
    const finalContents = await createFinalContents(input, mergedContents);
    return finalContents;
}

export async function generateContents(input: CreateContentsInput) {

    // 1. 데이터 정규화 & 중복 제거(Normalize & Deduplicate)
    const linkedData = await normalizeData(input);

    // 2. 데이터 분석 & 개선 & 요약(Analyze & Improve & Summarize)
    const { kpiInfo, highlights, topics, ongoing, userActivity }  = await analyzeData(input, linkedData);
 
    //await saveContentToFile(linkedData, 'output-test', 'linked_', 'json');
    //await saveContentToFile(topics, 'output-test', 'topics_', 'json');
    //await saveContentToFile(kpiInfo, 'output-test', 'repo_kpi_', 'json');
    //await saveContentToFile(highlights, 'output-test', 'highlights_', 'json');
    //await saveContentToFile(activitySummary, 'output-test', 'activity_summary_', 'json');

    // 3. 각 섹션 초안 생성(Drafting Sections)
    const { kpiSection, highlightsSection, topicsSection, memberSection, ongoingSection, closingSection } = 
        await draftingData(input.language, linkedData, kpiInfo, highlights, topics, ongoing, userActivity);
    
    // await saveContentToFile(kpiSection, 'output-sample/kpi', 'kpi_section_', 'md');
    // await saveContentToFile(highlightsSection, 'output-sample/highlights', 'highlights_section_', 'md');
    // await saveContentToFile(topicsSection, 'output-sample/topics', 'topics_section_', 'md');
    // await saveContentToFile(memberSection, 'output-sample/member', 'member_activity_section_', 'md');
    // await saveContentToFile(ongoingSection, 'output-sample/ongoing', 'ongoing_section_', 'md');
    // await saveContentToFile(funCornerSection, 'output-sample/fun', 'fun_corner_section_', 'md');

    // 4. 병합 
    const mergedContents = await mergeContents(input, kpiSection, highlightsSection, topicsSection, memberSection, ongoingSection, closingSection);
    // await saveContentToFile(mergedContents, 'output-sample', 'merged_contents_', 'md');

    // 5. 콘텐츠 생성(Generate Contents)
    const finalContents = await generateFinalContents(input, mergedContents);
    //await saveContentToFile(finalContents, 'output-sample', 'final_contents_', 'md');
    logger.info('📝 Final contents created');
    return finalContents;
}