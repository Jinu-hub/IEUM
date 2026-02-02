import { run } from "@openai/agents";
import { z } from "zod";
import { createGithubStats } from "~/features/cron/api/create-contents";
import type { SupportedLanguage } from "../config/style-guide";
import type { FetchedRepoData } from "../integrations/github/types";
import { CFG_RANKER } from "../lib/constants";
import { logger } from "../lib/logger";
import type {
    CaseKpi,
    ChatroomActivityMetaJson,
    KpiSnapshot,
    LinkedActivityDoc,
    LinkedItem,
    RankedHighlight,
    RepoKpi,
    UserRepoKpi
} from "../lib/types";
import {
    createActivitySummaryAgent,
    createHighlightsSummaryAgent,
    createOngoingProgressAgent,
    createTopicClusteringAgent
} from "../openai/agents/analyze-agents";
import {
    ActivityOutput,
    Cluster,
    CommonInput,
    OngoingProgressOutput,
    TopicOutput
} from "../openai/models";
import {
    baseScore,
    buildKpiIndex,
    countMessagesIncludingReplies,
    countReactionsIncludingReplies,
    extractCaseId,
    kpiFactorOf,
    prepareHighlightsWithMessages,
    prepareMemberDataWithMessages,
    smallBonuses
} from "./lib/utils";

/**
 * github data를 기반으로 kpi snapshot을 생성
 * @param githubData 
 * @returns 
 */
export async function repoKpiExtractor(githubData: Record<string, FetchedRepoData>): Promise<KpiSnapshot> {
    const repoMap = new Map<string, RepoKpi>();
    const userMap = new Map<string, UserRepoKpi>();
    const caseMap = new Map<string, CaseKpi>();
    for (const repo of Object.values(githubData)) {
        const repoName = repo.repo.owner + "/" + repo.repo.name;
        repoMap.set(repoName, {
            repo: repoName,
            commits: repo.commits.length,
            closedPRs: repo.closedPRs.length,
            issuesOpened: repo.openedIssues.length,
            issuesClosed: repo.closedIssues.length,
        });

        for (const commit of repo.commits) {
            const user = commit.userInfo?.login || commit.author;
            const caseName = commit.message.split("\n")[0].slice(0, 100);
            const caseMatch = commit.message.match(/#(\d+)/);
            const caseNo = caseMatch ? `#${caseMatch[1]}` : "other";
            
            // 유저별 집계
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.commits += 1;
                const arr = existingUser.commitCases ?? (existingUser.commitCases = []);
                arr.push(caseName);
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 1,
                    prsMerged: 0,
                    issuesOpened: 0,
                    issuesClosed: 0,
                    commitCases: [caseName],
                });
            }

            // 케이스별 집계 (kind 분류용으로 첫 메시지 한 건 보관)
            const existingCase = caseMap.get(caseNo);
            if (existingCase) {
                existingCase.commits += 1;
            } else {
                caseMap.set(caseNo, {
                    case: caseNo,
                    commits: 1,
                    repo: repoName,
                    sampleCaseText: caseName,
                });
            }
        }
        for (const pr of repo.closedPRs) {
            const user = pr.userInfo?.login || pr.user;
            const caseName = pr.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.prsMerged += 1;
                const arr = existingUser.prMergedCases ?? (existingUser.prMergedCases = []);
                arr.push(caseName);
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 1,
                    issuesOpened: 0,
                    issuesClosed: 0,
                    prMergedCases: [caseName],
                });
            }
        }
        for (const issue of repo.openedIssues) {
            const user = issue.userInfo?.login || issue.user;
            const caseName = issue.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.issuesOpened += 1;
                const arr = existingUser.issueOpenedCases ?? (existingUser.issueOpenedCases = []);
                arr.push(caseName);
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 0,
                    issuesOpened: 1,
                    issuesClosed: 0,
                    issueOpenedCases: [caseName],
                });
            }
        }
        for (const issue of repo.closedIssues) {
            const user = issue.userInfo?.login || issue.user;
            const caseName = issue.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.issuesClosed += 1;
                const arr = existingUser.issueClosedCases ?? (existingUser.issueClosedCases = []);
                arr.push(caseName);
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 0,
                    issuesOpened: 0,
                    issuesClosed: 1,
                    issueClosedCases: [caseName],
                });
            }
        }
    }

    // 통합 통계
    const githubStats = createGithubStats(githubData);
    const commits = githubStats?.totalCommits || 0;
    const prs = githubStats?.totalClosedPRs || 0;
    const opened = githubStats?.totalOpenedIssues || 0;
    const closed = githubStats?.totalClosedIssues || 0;
    const engagement = undefined;
  
    return {
      overall: { commits, closedPRs: prs, issuesOpened: opened, issuesClosed: closed, engagement: engagement },
      perRepo: Array.from(repoMap.values()) || [],
      perUser: Array.from(userMap.values()) || [],
      perCase: Array.from(caseMap.values()) || [],
    };

}

/**
 * slack data를 기반으로 topic clustering을 생성
 * @param linkedData 
 * @param language 
 * @param source 
 * @returns 
 */
export async function topicClustering(
    linkedData: LinkedActivityDoc, 
    language: SupportedLanguage = 'en',
    source: string = 'slack',
    range?: string,
): Promise<z.infer<typeof TopicOutput> & { activityMeta: ChatroomActivityMetaJson[] }> {
    const slackData = linkedData.items.slack;
    
    // 채널별로 데이터를 처리하기 위한 배열
    const channelKeys = Object.keys(slackData);
    const allClusters: any[] = [];
    const activityDetails: ChatroomActivityMetaJson["activities"] = [];
    
    logger.info("🔄 TopicClustering started", {
        "total channels": channelKeys.length,
        "channel list": channelKeys,
    });
    
    // 각 채널별로 TopicClustering을 병렬로 실행
    const channelProcessingPromises = channelKeys.map(async (channelKey, index) => {
        const channelData = slackData[channelKey] as LinkedItem[];
        
        // 채널 데이터가 비어있으면 스킵
        if (!channelData || channelData.length === 0) {
            logger.info(`⏭️  channel skip (${index + 1}/${channelKeys.length})`, {
                "channel": channelKey,
                "reason": "no data"
            });
            return null;
        }
        const messageCount = countMessagesIncludingReplies(channelData);
        const reactionCount = countReactionsIncludingReplies(channelData);

        logger.info(`🔍 topic clustering channel processing (${index + 1}/${channelKeys.length})`, {
            "channel": channelKey,
            "message count": channelData.length,
        });
        
        // 채널별 데이터를 객체로 감싸서 전달
        const channelDataString = JSON.stringify({ [channelKey]: channelData });
        const input = CommonInput.parse({
            project: channelKey,
            contents: channelDataString,
        });
        
        const agent = createTopicClusteringAgent(language, source);
        const result = await run(
            agent,
            JSON.stringify(input)
        );
        
        const output: any = result.finalOutput;
        
        // 각 클러스터에 채널 정보 추가
        const clustersArray = output.clusters && Array.isArray(output.clusters) ? output.clusters : [];
        const clustersWithChannel = clustersArray.map((cluster: any) => ({
            ...cluster,
            // 채널 정보를 메타데이터에 추가
            channel: channelKey,
        }));
        
        logger.info(`✅ topic clustering channel processing completed (${index + 1}/${channelKeys.length})`, {
            "channel": channelKey,
            "created cluster count": clustersWithChannel.length,
        });

        const activityEntry = {
            channelName: channelKey,
            messageCount,
            reactionCount,
            topicCount: clustersWithChannel.length,
        };
        
        return { clusters: clustersWithChannel, activity: activityEntry };
    });
    
    // 모든 채널 처리가 완료될 때까지 대기
    const results = await Promise.all(channelProcessingPromises);
    
    // null이 아닌 결과만 allClusters에 추가
    results.forEach(result => {
        if (!result) return;
        if (Array.isArray(result.clusters)) {
            allClusters.push(...result.clusters);
        }
        if (result.activity) {
            activityDetails.push(result.activity);
        }
    });
    
    logger.info("✨ TopicClustering completed", {
        "processed channel count": channelKeys.length,
        "total cluster count": allClusters.length,
    });
    
    // 모든 채널의 클러스터를 머지하여 반환
    const activityMetaArray: ChatroomActivityMetaJson[] =
        activityDetails.length > 0
            ? [
                  {
                      range: range ?? '',
                      activities: activityDetails,
                  },
              ]
            : [];

    return {
        clusters: allClusters,
        activityMeta: activityMetaArray,
    };
}

/**
 * topic clustering을 기반으로 rank highlights을 생성
 * @param topics 
 * @param kpi 
 * @param opts 
 * @returns 
 */
export function rankHighlights(
    topics: z.infer<typeof TopicOutput>,
    kpi: KpiSnapshot,
    opts?: { audience?: RankedHighlight["audience"]; topK?: number }
  ): RankedHighlight[] {
    const k = buildKpiIndex(kpi);
    const topK = opts?.topK ?? CFG_RANKER.thresholds.topK;
  
    const ranked = topics.clusters.map<RankedHighlight>((c) => {
      // 1) 토픽 기반 점수
      const base = baseScore(c);
  
      // 2) KPI 보정
      const caseId = extractCaseId(c);
      const repoFromCase = caseId ? k.caseRepo.get(caseId) : undefined;
      const repoShare = repoFromCase ? (k.repoShare.get(repoFromCase) ?? 0) : 0;
      const caseShare = caseId ? (k.caseShare.get(caseId) ?? 0) : 0;
      const kpiF = kpiFactorOf(repoShare, caseShare);
  
      // 3) 작은 보너스/패널티
      let bonuses = smallBonuses(c);
      if (opts?.audience && (c.audience === opts.audience || c.audience === "all")) {
        bonuses += CFG_RANKER.bonuses.audienceFit;
      }
      const penalties = 0; // 반복공지 감지기 넣을 때 여기에 적용(초기엔 0)
  
      const total = base * kpiF + bonuses - penalties;
  
      return {
        clusterId: c.id,
        title: c.summary?.slice(0, 100) || `${c.topic} update`,
        summary: c.summary,
        audience: c.audience,
        score: total,
        parts: { base, kpiFactor: kpiF, bonuses, penalties },
        meta: { topic: c.topic, impact: c.impact, caseId, repo: repoFromCase },
        items: c.items,
      };
    });
  
    // 4) 정렬 및 간단 다양성(같은 토픽 과점 방지)
    ranked.sort((a, b) => b.score - a.score);
  
    const picked: RankedHighlight[] = [];
    const topicCount = new Map<z.infer<typeof Cluster>["topic"], number>();
  
    for (const r of ranked) {
      if (r.score < CFG_RANKER.thresholds.minScore) continue; // 컷오프
      const t = r.meta.topic;
      const tCount = topicCount.get(t) ?? 0;
      if (tCount >= CFG_RANKER.thresholds.maxPerTopic) continue; // 토픽 과점 방지
      picked.push(r);
      topicCount.set(t, tCount + 1);
      if (picked.length >= topK) break;
    }
  
    return picked;
}

export async function createHighlightsSummary(
    linkedData: LinkedActivityDoc, 
    highlights: RankedHighlight[],
    language: 'en' | 'ko' | 'ja' = 'en',
    messageIndexById: Record<string, LinkedItem> | undefined) {

    const highlightsWithMessages = prepareHighlightsWithMessages(messageIndexById, highlights);
    //await saveContentToFile(highlightsWithMessages, 'output-test', 'highlights_with_messages_', 'json');
    
    const input = CommonInput.parse({
        project: "LEAD",
        contents: JSON.stringify(highlightsWithMessages),
    });

    const agent = createHighlightsSummaryAgent(language);
    const result = await run(
        agent,
        JSON.stringify(input)
    );
    //await saveContentToFile(result.finalOutput, 'output-test', 'highlights_summary_', 'json');

    return { highlightsSummary: result.finalOutput };
}

export async function summarizeMemberActivity(
    linkedData: LinkedActivityDoc,
    language: 'en' | 'ko' | 'ja' = 'en',
    messageIndexById: Record<string, LinkedItem> | undefined
): Promise<typeof ActivityOutput> {

    const memberDataWithMessages = prepareMemberDataWithMessages(linkedData, messageIndexById);

    //await saveContentToFile(memberDataWithMessages, 'output-test', 'member_data_with_messages_', 'json');
    const input = CommonInput.parse({
        project: "LEAD",
        contents: JSON.stringify(memberDataWithMessages),
    });
    const agent = createActivitySummaryAgent(language);
    
    const result = await run(
        agent,
        JSON.stringify(input)
    );

    return result.finalOutput as unknown as typeof ActivityOutput;
    
}


/**
 * slack data를 기반으로 ongoing progress roadmap을 생성
 * @param linkedData 
 * @param language 
 * @returns 
 */
export async function ongoingProgressRoadmapExtracte(
    linkedData: LinkedActivityDoc,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<z.infer<typeof OngoingProgressOutput>> {
    const slackData = linkedData.items.slack;

    // 채널별로 데이터를 처리하기 위한 배열
    const channelKeys = Object.keys(slackData);
    const allOngoing: any[] = [];
    const allRoadmap: any[] = [];
    const allUpcoming: any[] = [];
    const allPolicies: any[] = [];

    // 각 채널별로 Ongoing Progress & Roadmap을 병렬로 실행
    const ongoingProcessingPromises = channelKeys.map(async (channelKey, index) => {
        const channelData = slackData[channelKey];
        
        // 채널 데이터가 비어있으면 스킵
        if (!channelData || channelData.length === 0) {
            return null;
        }
        
        logger.info(`🔍 ongoing progress channel processing (${index + 1}/${channelKeys.length})`, {
            "channel": channelKey,
            "message count": channelData.length,
        });
        
        // 채널별 데이터를 객체로 감싸서 전달
        const channelDataString = JSON.stringify({ [channelKey]: channelData });
        const input = CommonInput.parse({
            project: channelKey,
            contents: channelDataString,
        });
        
        const agent = createOngoingProgressAgent(language);
        const result = await run(
            agent,
            JSON.stringify(input)
        );
        
        const output: any = result.finalOutput;
        
        // 각 필드별로 채널 정보 추가하여 반환
        return {
            channel: channelKey,
            ongoing: output.ongoing && Array.isArray(output.ongoing) 
                ? output.ongoing.map((item: any) => ({ ...item, channel: channelKey }))
                : [],
            roadmap: output.roadmap && Array.isArray(output.roadmap)
                ? output.roadmap.map((item: any) => ({ ...item, channel: channelKey }))
                : [],
            upcoming: output.upcoming && Array.isArray(output.upcoming)
                ? output.upcoming.map((item: any) => ({ ...item, channel: channelKey }))
                : [],
            policies: output.governance?.policies && Array.isArray(output.governance.policies)
                ? output.governance.policies.map((item: any) => ({ ...item, channel: channelKey }))
                : [],
        };
    });

    // 모든 채널 처리가 완료될 때까지 대기
    const ongoingResults = await Promise.all(ongoingProcessingPromises);
    
    // null이 아닌 결과만 각 배열에 추가
    ongoingResults.forEach(result => {
        if (result) {
            allOngoing.push(...result.ongoing);
            allRoadmap.push(...result.roadmap);
            allUpcoming.push(...result.upcoming);
            allPolicies.push(...result.policies);
        }
    });

    logger.info("✨ Ongoing Progress & Roadmap completed", {
        "processed channel count": channelKeys.length,
        "ongoing": allOngoing.length,
        "roadmap": allRoadmap.length,
        "upcoming": allUpcoming.length,
        "policies": allPolicies.length,
    });

    // 모든 채널의 데이터를 머지하여 반환
    return {
        generatedAtISO: new Date().toISOString(),
        ongoing: allOngoing,
        roadmap: allRoadmap,
        upcoming: allUpcoming,
        governance: { policies: allPolicies },
    };
}   