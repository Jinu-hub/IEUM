import { run } from "@openai/agents";
import { z } from "zod";
import { createGithubStats } from "~/features/cron/api/create-contents";
import { saveContentToFile } from "~/features/cron/api/test-api";
import type { FetchedRepoData } from "../integrations/github/types";
import { CFG_RANKER } from "../lib/constants";
import type { CaseKpi, KpiSnapshot, LinkedActivityDoc, RankedHighlight, RepoKpi, UserRepoKpi } from "../lib/types";
import {
    ActivityOutput, Cluster,
    TopicInput, TopicOutput
} from "../openai/models";
import { topicClusteringAgent } from "../openai/test-agent";
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

export async function topicClustering(linkedData: LinkedActivityDoc): Promise<typeof TopicOutput> {
    const slackData = linkedData.items.slack;
    const slackDataString = JSON.stringify(slackData);
    const input = TopicInput.parse({
        project: "LEAD",
        linked: slackDataString,
      });
    const result = await run(
        topicClusteringAgent,
        JSON.stringify(input)
      );

    return result.finalOutput as unknown as typeof TopicOutput;
}

export async function summarizeMemberActivity(
    linkedData: LinkedActivityDoc,
    language: 'en' | 'ko' | 'ja' = 'en'
): Promise<typeof ActivityOutput> {

    const memberData = linkedData.items.member;
    const messageIndexIdArray =linkedData.index?.byId;
    let memberDataWithMessages: Record<string, any> = {};

    // Build a lookup for Slack replies (not present in index.byId)
    const replyIndex: Record<string, any> = {};
    const slackByChannel = linkedData.items.slack || {};
    for (const arr of Object.values(slackByChannel)) {
        for (const parent of arr as any[]) {
            const replies = (parent?.meta?.replies as any[] | undefined) || [];
            for (const r of replies) {
                if (r?.id) replyIndex[r.id] = r;
            }
        }
    }

    // Select members with total messages > 4 and attach their LinkedItem messages from index.byId
    if (memberData && messageIndexIdArray) {
        for (const member of Object.values(memberData)) {
            const total = member?.messageCount?.total ?? 0;
            if (member.displayName === "GitHub" 
                || member.displayName === "Slackbot"
                || member.displayName === "GitHub"
                || (total <= 4 || !Array.isArray(member.messageIds) || member.messageIds.length === 0)) {
                continue;
            } else {
                memberDataWithMessages[member.memberId] = {
                    displayName: member.displayName,
                    messages: [],
                };
                const messages = member.messageIds
                    .map((mid) => messageIndexIdArray[mid] || replyIndex[mid])
                    .filter((it): it is NonNullable<typeof it> => Boolean(it));
                (memberDataWithMessages[member.memberId] as any).messages = messages;
            }
        }
    }

    await saveContentToFile(memberDataWithMessages, 'output-test', 'member_data_with_messages_', 'json');

    return null as unknown as typeof ActivityOutput;
/*
    const slackData = linkedData.items.slack;
    const slackDataString = JSON.stringify(slackData);
    const input = ActivityInput.parse({
        project: "LEAD",
        linked: slackDataString,
    });
    
    const agent = createActivitySummaryAgent(
        language
        , 'Slack'
        , 'JST'
        , '2025-10-02 to 2025-10-08');
    
    const result = await run(
        agent,
        JSON.stringify(input)
    );

    return result.finalOutput as unknown as typeof ActivityOutput;
    */
}
