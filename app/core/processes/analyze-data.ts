import { run } from "@openai/agents";
import { createGithubStats } from "~/features/cron/api/create-contents";
import type { FetchedRepoData } from "../integrations/github/types";
import type { CaseKpi, KpiSnapshot, LinkedActivityDoc, RepoKpi, UserRepoKpi } from "../lib/types";
import { TopicInput, TopicOutput } from "../openai/models";
import { topicClusteringAgent } from "../openai/test-agent";

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