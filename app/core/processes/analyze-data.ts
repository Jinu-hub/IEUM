import { run } from "@openai/agents";
import { z } from "zod";
import { createGithubStats } from "~/features/cron/api/create-contents";
import type { FetchedRepoData } from "../integrations/github/types";
import { CFG_RANKER } from "../lib/constants";
import { logger } from "../lib/logger";
import type { CaseKpi, KpiSnapshot, LinkedActivityDoc, RankedHighlight, RepoKpi, UserRepoKpi } from "../lib/types";
import type { SupportedLanguage } from "../openai/config/style-guide";
import {
    Cluster,
    TopicInput, TopicOutput
} from "../openai/models";
import { createTopicClusteringAgent } from "../openai/test-agent";
import { baseScore, buildKpiIndex, extractCaseId, kpiFactorOf, smallBonuses } from "./utils";

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
            prsMerged: repo.mergedPRs.length,
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
                if (!existingUser.cases.includes(caseName)) {
                    existingUser.cases.push(caseName);
                }
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 1,
                    prsMerged: 0,
                    issuesOpened: 0,
                    issuesClosed: 0,
                    cases: [caseName],
                });
            }

            // 케이스별 집계
            const existingCase = caseMap.get(caseNo);
            if (existingCase) {
                existingCase.commits += 1;
            } else {
                caseMap.set(caseNo, {
                    case: caseNo,
                    commits: 1,
                    repo: repoName,
                });
            }
        }
        for (const pr of repo.mergedPRs) {
            const user = pr.userInfo?.login || pr.user;
            const caseName = pr.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.prsMerged += 1;
                if (!existingUser.cases.includes(caseName)) {
                    existingUser.cases.push(caseName);
                }
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 1,
                    issuesOpened: 0,
                    issuesClosed: 0,
                    cases: [caseName],
                });
            }
        }
        for (const issue of repo.openedIssues) {
            const user = issue.userInfo?.login || issue.user;
            const caseName = issue.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.issuesOpened += 1;
                if (!existingUser.cases.includes(caseName)) {
                    existingUser.cases.push(caseName);
                }
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 0,
                    issuesOpened: 1,
                    issuesClosed: 0,
                    cases: [caseName],
                });
            }
        }
        for (const issue of repo.closedIssues) {
            const user = issue.userInfo?.login || issue.user;
            const caseName = issue.title.split("\n")[0].slice(0, 20);
            const existingUser = userMap.get(user);
            if (existingUser) {
                existingUser.issuesClosed += 1;
                if (!existingUser.cases.includes(caseName)) {
                    existingUser.cases.push(caseName);
                }
            } else {
                userMap.set(user, {
                    user: user,
                    repo: repoName,
                    commits: 0,
                    prsMerged: 0,
                    issuesOpened: 0,
                    issuesClosed: 1,
                    cases: [caseName],
                });
            }
        }
    }

    // 통합 통계
    const githubStats = createGithubStats(githubData);
    const commits = githubStats?.totalCommits || 0;
    const prs = githubStats?.totalPRs || 0;
    const opened = githubStats?.totalOpenedIssues || 0;
    const closed = githubStats?.totalClosedIssues || 0;
    const engagement = undefined;
  
    return {
      overall: { commits, prsMerged: prs, issuesOpened: opened, issuesClosed: closed, engagement: engagement },
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
    source: string = 'slack'
): Promise<z.infer<typeof TopicOutput>> {
    const slackData = linkedData.items.slack;
    
    // 채널별로 데이터를 처리하기 위한 배열
    const channelKeys = Object.keys(slackData);
    const allClusters: any[] = [];
    
    logger.info("🔄 TopicClustering started", {
        "total channels": channelKeys.length,
        "channel list": channelKeys,
    });
    
    // 각 채널별로 TopicClustering 실행
    for (let i = 0; i < channelKeys.length; i++) {
        const channelKey = channelKeys[i];
        const channelData = slackData[channelKey];
        
        // 채널 데이터가 비어있으면 스킵
        if (!channelData || channelData.length === 0) {
            logger.info(`⏭️  channel skip (${i + 1}/${channelKeys.length})`, {
                "channel": channelKey,
                "reason": "no data"
            });
            continue;
        }
        
        logger.info(`🔍 channel processing (${i + 1}/${channelKeys.length})`, {
            "channel": channelKey,
            "message count": channelData.length,
        });
        
        // 채널별 데이터를 객체로 감싸서 전달
        const channelDataString = JSON.stringify({ [channelKey]: channelData });
        const input = TopicInput.parse({
            project: channelKey,
            linked: channelDataString,
        });
        
        const agent = createTopicClusteringAgent(language, source);
        const result = await run(
            agent,
            JSON.stringify(input)
        );
        
        const output: any = result.finalOutput;
        
        // 각 클러스터에 채널 정보 추가 및 수집
        if (output.clusters && Array.isArray(output.clusters)) {
            const clustersWithChannel = output.clusters.map((cluster: any) => ({
                ...cluster,
                // 채널 정보를 메타데이터에 추가
                channel: channelKey,
            }));
            
            logger.info(`✅ channel processing completed (${i + 1}/${channelKeys.length})`, {
                "channel": channelKey,
                "created cluster count": clustersWithChannel.length,
            });
            
            allClusters.push(...clustersWithChannel);
        } else {
            logger.warn(`⚠️ channel processing result empty (${i + 1}/${channelKeys.length})`, {
                "channel": channelKey,
            });
        }
    }
    
    logger.info("✨ TopicClustering completed", {
        "processed channel count": channelKeys.length,
        "total cluster count": allClusters.length,
    });
    
    // 모든 채널의 클러스터를 머지하여 반환
    return {
        clusters: allClusters,
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