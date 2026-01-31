import { encoding_for_model } from "tiktoken";
import { z } from "zod";
import type { CreateContentsInput, EnableCreateContents } from "~/core/lib/types";
import { saveHighlight, updateNewsletterRunStep } from "~/features/contents/db/mutations";
import { getUniquePeriodKey } from "~/features/contents/db/queries";
import { logger } from "../lib/logger";
import adminClient from "../lib/supa-admin-client.server";
import type { KpiSnapshot, LinkedActivityDoc, LinkedItem, UnifiedActivityDoc } from "../lib/types";
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
import { createChatroomHighlightMetaJson, createGithubHighlightMetaJson, generatePeriodKey } from "./lib/utils";
import { convertToHTML, convertToHTMLOnlyKpi, createFinalContents, divideContents } from "./reporting-data";

/**
 * 토큰 수 추정 함수
 * @param data - JSON 직렬화 가능한 데이터
 * @returns 추정 토큰 수
 */
export function estimateTokens(data: any): number {
    const jsonString = JSON.stringify(data);
    const charCount = jsonString.length;
    // 한국어/일본어/영어 혼합 기준 약 3문자당 1토큰으로 추정
    return Math.ceil(charCount / 3);
}
export function countTokensAccurate(data: any): number {
    const enc = encoding_for_model("gpt-4o-mini");
    const jsonString = JSON.stringify(data);
    const tokens = enc.encode(jsonString);
    enc.free();
    return tokens.length;
}

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
    const linkedData = await crossLinker({ ...githubData, ...slackData } as UnifiedActivityDoc, {
        includeIndexById: true,
    });

    // index.byIdを抽出して別オブジェクトとして保持
    const messageIndexById: Record<string, LinkedItem> | undefined = linkedData.index?.byId;
    
    // linkedDataからindex.byIdを削除（分離）
    const { index, ...linkedDataWithoutIndex } = linkedData;
    const linkedDataCleaned = {
        ...linkedDataWithoutIndex,
        index: index ? { edges: index.edges } : undefined,
    };
    //await saveContentToFile(linkedDataCleaned, 'output-test', 'linked_data_', 'json');
    
    //console.log('👤 Members:', Object.keys(linkedDataCleaned.items.member || {}));

    // 토큰 수 추정 로그
    const accurateTokenCount = countTokensAccurate(linkedDataCleaned);
    logger.info('📊 Accurate token count for linkedData', { 
        accurateTokens: accurateTokenCount,
        charCount: JSON.stringify(linkedDataCleaned).length,
        itemCounts: {
            commits: linkedDataCleaned.items.commit?.length ?? 0,
            prs: linkedDataCleaned.items.pr?.length ?? 0,
            issues: linkedDataCleaned.items.issue?.length ?? 0,
            slackChannels: Object.keys(linkedDataCleaned.items.slack ?? {}).length,
            members: Object.keys(linkedDataCleaned.items.member ?? {}).length
        }
    });
    input.accuratedTokens = accurateTokenCount;

    logger.info('📝 Normalizing and reducing data completed');
    return { linkedData: linkedDataCleaned, messageIndexById };
}

/**
 * 2. 데이터 분석 & 개선 & 요약(Analyze & Improve & Summarize)
 * @param input 
 * @param linkedData 
 * @param messageIndexById 
 * @returns 
 */
export async function analyzeData(
    input: CreateContentsInput, 
    linkedData: LinkedActivityDoc,
    messageIndexById: Record<string, LinkedItem> | undefined,
): Promise<any> {
    logger.info('📝 Analyzing data started');
    const language = input.language;
    const period = input.period;
    const basePeriodKey = generatePeriodKey(period, input.from);
    const periodKey = await getUniquePeriodKey(adminClient, input.workspaceId, basePeriodKey);

    // 2-1. github data를 기반으로 kpi snapshot을 생성
    const kpiInfo = await repoKpiExtractor(input.githubResult || {});
    const metaJson = createGithubHighlightMetaJson(kpiInfo, input.range, language);
    await saveHighlight(adminClient, {
        workspaceId: input.workspaceId,
        targetId: input.targetId,
        runId: input.runId,
        source: 'github-kpi',
        title: 'Github Kpi snapshot',
        url: null,
        weight: 1,
        metaJson: metaJson,
        dedupKey: 'github_kpi_snapshot' + input.runId,
        tags: ['github', 'kpi', 'snapshot'],
        period: period,
        periodKey: periodKey,
    });
    logger.info('📝 Kpi snapshot created');
    //await saveContentToFile(kpiInfo, 'output-test', 'kpi_info_', 'json');

    if (!input.enableCreateContents?.slack) {
        return { kpiInfo, highlights: [], topics: [], ongoing: [], userActivity: [] };
    }

    // 2-2. slack data를 기반으로 topic clustering을 생성
    const topicsTemp = await topicClustering(linkedData, language, input.source, input.range);
    await saveHighlight(adminClient, {
        workspaceId: input.workspaceId,
        targetId: input.targetId,
        runId: input.runId,
        source: 'slack-activity',
        title: 'Slack channel activity',
        url: null,
        weight: 1,
        metaJson: topicsTemp.activityMeta,
        dedupKey: 'slack_channel_activity' + input.runId,
        tags: ['slack', 'channel', 'activity'],
        period: period,
        periodKey: periodKey,
    });
    logger.info('📝 Topic clustering completed');

    // 2-3. topic clustering을 기반으로 rank highlights을 추출
    const highlightsTemp = rankHighlights(topicsTemp as unknown as z.infer<typeof TopicOutput>, kpiInfo);
    let count = 0;
    for (const highlight of highlightsTemp) {
        count++;
        const metaJson = createChatroomHighlightMetaJson(highlight, period, input.range);
        await saveHighlight(adminClient, {
            workspaceId: input.workspaceId,
            targetId: input.targetId,
            runId: input.runId,
            source: input.source,
            title: highlight.title,
            url: null,
            weight: highlight.score,
            metaJson: metaJson,
            dedupKey: 'github_highlights' + count + '_' + input.runId,
            tags: [input.source, 'highlights'],
            period: period,
            periodKey: periodKey,
        });
    }
    
    logger.info('📝 Rank highlights created');
    // highlights에 존재하지 않는 topics을 id 기반으로 추출
    const topics = topicsTemp.clusters.filter((topic) => !highlightsTemp.some((highlight) => highlight.clusterId === topic.id));
    
    // 2-4, 2-5, 2-6을 병렬로 실행
    const [highlights, ongoing, userActivity] = await Promise.all([
        // 2-4. highlights summary을 생성
        createHighlightsSummary(linkedData, highlightsTemp, language, messageIndexById).then(result => {
            logger.info('📝 Highlights summary created');
            return result;
        }),
        // 2-5. slack data를 기반으로 ongoing progress roadmap을 생성
        ongoingProgressRoadmapExtracte(linkedData, language).then(result => {
            logger.info('📝 Ongoing progress roadmap created');
            return result;
        }),
        // 2-6. slack data를 기반으로 member activity summary을 생성
        summarizeMemberActivity(linkedData, language, messageIndexById).then(result => {
            logger.info('📝 Member activity summary created');
            return result;
        })
    ]);

    logger.info('📝 Analyzing data completed');
    return { kpiInfo, highlights, topics, ongoing , userActivity };

}

/**
 * 3. 데이터 정리 & 편집(Drafting)
 * @param input 
 * @param linkedData activity doc
 * @param kpiInfo kpi info
 * @param highlights highlights
 * @param topics topics
 * @param ongoing ongoing
 * @param userActivity user activity
 * @param messageIndexById 
 * @returns 
 */
export async function draftingData(
    input: CreateContentsInput,
    linkedData: LinkedActivityDoc, 
    kpiInfo: KpiSnapshot, 
    highlights: z.infer<typeof HighlightsOutput>, 
    topics: z.infer<typeof TopicOutput>,
    ongoing: z.infer<typeof OngoingProgressOutput>,
    userActivity: z.infer<typeof ActivityOutput>,
    messageIndexById: Record<string, LinkedItem> | undefined) {
    logger.info('📝 Drafting data started');

    const language = input.language;

    // 3-1. KPI Section을 생성
    let kpiSection = '';
    if (input.enableCreateContents?.github) {
        kpiSection = await createKpiSection(kpiInfo, language);
        logger.info('📝 Kpi section created');
    }

    if (!input.enableCreateContents?.slack) {
        return { kpiSection, highlightsSection: '', topicsSection: '', memberSection: '', ongoingSection: '', closingSection: '' };
    }

    // 모든 섹션을 병렬로 생성
    const [
        highlightsSection,
        topicsSection,
        memberSection,
        ongoingSection,
        closingSection
    ] = await Promise.all([
        // 3-2. Highlights섹션을 생성
        createHighlightsSection(highlights, language).then(result => {
            logger.info('📝 Highlights section created');
            return result;
        }),
        // 3-3. Topics섹션을 생성
        createTopicsSection(topics, language).then(result => {
            logger.info('📝 Topics section created');
            return result;
        }),
        // 3-4. Member Activity섹션을 생성
        createMemberActivitySection(userActivity, language).then(result => {
            logger.info('📝 Member activity section created');
            return result;
        }),
        // 3-5. Ongoing/Roadmap and Looking Ahead섹션을 생성
        createOngoingSection(ongoing, language).then(result => {
            logger.info('📝 Ongoing/Roadmap section created');
            return result;
        }),
        // 3-6. Closing Section을 생성
        createClosingSection(linkedData, kpiInfo, ongoing, language, messageIndexById).then(result => {
            logger.info('📝 Closing section created');
            return result;
        })
    ]);

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
        
    const isOnlyKpi = input.enableCreateContents?.github && !input.enableCreateContents?.slack;

    if (isOnlyKpi) {
        return kpiSection;
    } else {

        let baseTemplate = getBaseTemplate(input.language);
        let mainTemplate = getMainTemplate(input.language);

        mainTemplate = mainTemplate.replace('{{HIGHLIGHTS_SECTION}}', highlightsSection);
        mainTemplate = mainTemplate.replace('{{TOPICS_SECTION}}', topicsSection);
        mainTemplate = mainTemplate.replace('{{MEMBER_ACTIVITY_SECTION}}', memberSection);
        mainTemplate = mainTemplate.replace('{{ONGOING_SECTION}}', ongoingSection);

        baseTemplate = baseTemplate.replace('{{PERIOD}}', input.range);
        if (input.enableCreateContents?.github) {
            baseTemplate = baseTemplate.replace('{{KPI_SECTION}}', kpiSection);
        } else {
            baseTemplate = baseTemplate.replace('{{KPI_SECTION}}', '');
        }
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
    logger.info('📝 Generating final contents started');
    const finalContents = await createFinalContents(input, mergedContents);
    const isOnlyKpi = input.enableCreateContents?.github && !input.enableCreateContents?.slack;
    const isNoKpi = !input.enableCreateContents?.github && input.enableCreateContents?.slack;
    if (isOnlyKpi) {
        const htmlContents = await convertToHTMLOnlyKpi(input.language, finalContents as string, 
            input.enableCreateContents as EnableCreateContents);
        logger.info('📝 Generating final contents completed');
        return { finalContents, htmlContents };
    } else {
        const sections = await divideContents(isNoKpi || false, finalContents as string);
        const htmlContents = await convertToHTML(input, sections);
        logger.info('📝 Generating final contents completed');
        return { finalContents, htmlContents };
    }
}

export async function generateContents(input: CreateContentsInput) {

    if (input.runStepId) {
        await updateNewsletterRunStep(adminClient, { 
            runStepId: input.runStepId,
            step: 'summarize_data',
        });
    }

    // 1. 데이터 정규화 & 중복 제거(Normalize & Deduplicate)
    let { linkedData, messageIndexById } = await normalizeData(input);

    // 2. 데이터 분석 & 개선 & 요약(Analyze & Improve & Summarize)
    let { kpiInfo, highlights, topics, ongoing, userActivity }  = await analyzeData(input, linkedData, messageIndexById);
 /*
    await saveContentToFile(linkedData, 'output-test/first', '1_linked_', 'json');
    await saveContentToFile(topics, 'output-test/first', '2_topics_', 'json');
    await saveContentToFile(kpiInfo, 'output-test/first', '3_repo_kpi_', 'json');
    await saveContentToFile(highlights, 'output-test/first', '4_highlights_', 'json');
    await saveContentToFile(userActivity, 'output-test/first', '5_activity_summary_', 'json');
*/

    if (input.runStepId) {
        await updateNewsletterRunStep(adminClient, { 
            runStepId: input.runStepId,
            step: 'assemble_data',
        });
    }
    // 3. 각 섹션 초안 생성(Drafting Sections)
    let { kpiSection, highlightsSection, topicsSection, memberSection, ongoingSection, closingSection } = 
        await draftingData(input, linkedData, kpiInfo, highlights, topics, ongoing, userActivity, messageIndexById);
  /*  
    await saveContentToFile(kpiSection, 'output-test/second', '1_kpi_section_', 'md');
    await saveContentToFile(highlightsSection, 'output-test/second', '2_highlights_section_', 'md');
    await saveContentToFile(topicsSection, 'output-test/second', '3_topics_section_', 'md');
    await saveContentToFile(memberSection, 'output-test/second', '4_member_activity_section_', 'md');
    await saveContentToFile(ongoingSection, 'output-test/second', '5_ongoing_section_', 'md');
    await saveContentToFile(closingSection, 'output-test/second', '6_closing_section_', 'md');
*/
    
    // 메모리 절약: 불필요해진 변수 초기화
    linkedData = null as any;
    kpiInfo = null as any;
    highlights = null as any;
    topics = null as any;
    ongoing = null as any;
    userActivity = null as any;

    // 4. 병합 
    let mergedContents = await mergeContents(input, kpiSection, highlightsSection, topicsSection, memberSection, ongoingSection, closingSection);
   //await saveContentToFile(mergedContents, 'output-test/third', '1_merged_contents_', 'md');

    // 메모리 절약: 섹션 변수 초기화
    kpiSection = null as any;
    highlightsSection = null as any;
    topicsSection = null as any;
    memberSection = null as any;
    ongoingSection = null as any;
    closingSection = null as any;

    if (input.runStepId) {
        await updateNewsletterRunStep(adminClient, { 
            runStepId: input.runStepId,
            step: 'finalize_data',
        });
    }
    // 5. 콘텐츠 생성(Generate Contents)
    const finalContents = await generateFinalContents(input, mergedContents);
    //await saveContentToFile(finalContents, 'output-test/fourth', '1_final_contents_html_', 'html');
    
    // 메모리 절약: 병합된 컨텐츠 초기화
    mergedContents = null as any;
    
    return finalContents;

}