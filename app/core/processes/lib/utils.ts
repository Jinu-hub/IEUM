import { z } from "zod";
import { CFG_RANKER, IMPACT_MAP, type ImpactKey } from "../../lib/constants";
import type { ChatroomHighlightMetaJson, GithubHighlightMetaJson, KpiSnapshot, LinkedActivityDoc, LinkedItem, RankedHighlight, TopUserActivity, TopUserActivityItem } from "../../lib/types";
import { Cluster } from "../../openai/models";
import { KIND_OF_COMMITS, KIND_OF_COMMITS_MAP, type KindOfCommit } from "./constants";

export const CLAMP01 = (x?: number | null) => Math.max(0, Math.min(1, x ?? 0));
export const TO_IMPACT = (i: typeof Cluster.shape.impact) => IMPACT_MAP[(i as unknown as ImpactKey) ?? "low"] ?? 0.3;


/** "#12345" 같은 케이스 아이디를 signals.keywordHits/summary에서 추출 */
export function extractCaseId(c: z.infer<typeof Cluster>): string | undefined {
    const keywordHits = c.signals?.keywordHits;
    const fromKeywords = keywordHits && Array.isArray(keywordHits) 
        ? keywordHits.find((k: string) => /#\d+/.test(k)) 
        : undefined;
    if (fromKeywords) return fromKeywords.match(/#\d+/)?.[0] ?? undefined;
    const fromSummary = c.summary?.match(/#\d+/)?.[0];
    return fromSummary ?? undefined;
}

/** KPI에서 repoShare/caseShare를 뽑기 위한 간단 인덱스 */
export function buildKpiIndex(kpi: KpiSnapshot) {
    const total = Math.max(1, kpi.overall.commits || 0);
    const repoTotal = new Map<string, number>();
    const repoShare = new Map<string, number>();   // repo -> [0~1]
    const caseShare = new Map<string, number>();   // "#123" -> [0~1]
    const caseRepo  = new Map<string, string>();   // "#123" -> repo
  
    for (const r of kpi.perRepo) {
      repoTotal.set(r.repo, r.commits || 0);
      repoShare.set(r.repo, Math.min(1, Math.max(0, (r.commits || 0) / total)));
    }
    for (const cs of kpi.perCase) {
      const rt = Math.max(1, repoTotal.get(cs.repo) ?? 1);
      caseShare.set(cs.case, Math.min(1, Math.max(0, (cs.commits || 0) / rt)));
      caseRepo.set(cs.case, cs.repo);
    }
  
    return { repoShare, caseShare, caseRepo };
  }

export function baseScore(c: z.infer<typeof Cluster>): number {
    const impact = TO_IMPACT(c.impact as unknown as typeof Cluster.shape.impact);
    const engagement = (() => {
      const count = Math.max(0, c.signals?.count ?? 0);
      const people = Math.max(0, c.signals?.participants ?? 0);
      // 가벼운 로그 스케일: 0~1 안에서 완만히 증가
      const m1 = Math.log1p(count) / Math.log(11);  // ~10개 기준 정규화
      const m2 = Math.log1p(people) / Math.log(16); // ~15명 기준 정규화
      return CLAMP01(0.6 * m1 + 0.4 * m2);
    })();
    const recency = CLAMP01(c.signals?.recencyScore);
    const confidence = CLAMP01(c.signals?.crossLinkScore);
  
    const w = CFG_RANKER.weights;
    return (
      w.impact * impact +
      w.engagement * engagement +
      w.recency * recency +
      w.confidence * confidence
    );
}

/** KPI 보정: repoShare와 caseShare로 0.7~1.2 사이에서 살짝 증폭/완화 */
export function kpiFactorOf(repoShare: number, caseShare: number): number {
    // 기본 1.0에서 ±0.2 가량만 변동 (안정적)
    const repoAdj = 0.8 + 0.4 * repoShare;   // 0.8 ~ 1.2
    const caseAdj = 0.9 + 0.2 * caseShare;   // 0.9 ~ 1.1
    return repoAdj * caseAdj;                // 대략 0.72 ~ 1.32
}

/** 간단 보너스/패널티: 룰을 최소로 */
export function smallBonuses(c: z.infer<typeof Cluster>): number {
    let b = 0;
    if (c.topic === "Incident" && c.impact === "critical") b += CFG_RANKER.bonuses.incidentCritical;
    if (c.topic === "Release" && c.audience === "all") b += CFG_RANKER.bonuses.orgWideRelease;
    return b;
}

/** highlights를 메시지와 함께 준비 */
export function prepareHighlightsWithMessages(messageIndexById: Record<string, LinkedItem> | undefined, highlights: RankedHighlight[]): RankedHighlight[]  {
  let highlightsWithMessages: RankedHighlight[] = [];

  if (highlights && messageIndexById) {
      for (const highlight of highlights) {
          const messages = highlight.items?.map((item) => messageIndexById[item]);
          highlightsWithMessages.push({
              ...highlight,
              messages,
          });
      }
  }

  return highlightsWithMessages;
}

/**
 * linkedData에서 멤버 데이터를 필터링하고 메시지를 첨부합니다.
 * - 총 메시지 수가 4보다 큰 멤버만 선택
 * - GitHub, Slackbot 등 봇 계정 제외
 * - 각 멤버의 메시지 ID를 실제 메시지 객체로 변환
 * 
 * @param linkedData - 링크된 활동 데이터
 * @param messageIndexById - 메시지 ID를 키로 하는 메시지 객체 맵
 * @returns 멤버 ID를 키로 하고, displayName과 messages 배열을 포함하는 객체
 */
export function prepareMemberDataWithMessages(linkedData: LinkedActivityDoc, messageIndexById: Record<string, LinkedItem> | undefined): Record<string, any> {
  const memberData = linkedData.items.member;
  let memberDataWithMessages: Record<string, any> = {};

  // Build a lookup for Slack replies (not present in index.byId)
  const replyIndex: Record<string, any> = {};
  const slackByChannel = linkedData.items.slack || {};
  const reactionsByUser: Record<string, number> = {};
  
  // Single loop to build replyIndex AND count reactions
  for (const arr of Object.values(slackByChannel)) {
      for (const parent of arr as any[]) {
          // Build reply index
          const replies = (parent?.meta?.replies as any[] | undefined) || [];
          for (const r of replies) {
              if (r?.id) replyIndex[r.id] = r;
              
              // Count reactions in replies
              const replyReactions = r?.meta?.reactions || [];
              for (const reaction of replyReactions) {
                  const reactedUsers = reaction.users || [];
                  for (const userId of reactedUsers) {
                      reactionsByUser[userId] = (reactionsByUser[userId] || 0) + 1;
                  }
              }
          }
          
          // Count reactions in parent messages
          const reactions = parent?.meta?.reactions || [];
          for (const reaction of reactions) {
              const reactedUsers = reaction.users || [];
              for (const userId of reactedUsers) {
                  reactionsByUser[userId] = (reactionsByUser[userId] || 0) + 1;
              }
          }
      }
  }

  // Select members with total messages > 4 and attach their LinkedItem messages from messageIndexById
  if (memberData && messageIndexById) {
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
                  reactionsGiven: reactionsByUser[member.memberId] || 0,
              };
              const messages = member.messageIds
                  .map((mid) => messageIndexById[mid] || replyIndex[mid])
                  .filter((it): it is NonNullable<typeof it> => Boolean(it));
              (memberDataWithMessages[member.memberId] as any).messages = messages;
          }
      }
  }

  return memberDataWithMessages;
}

/**
 * 펀코너 리더보드 데이터 추출
 * @param linkedData 
 * @param kpiData 
 * @param messageIndexById 
 * @returns 
 */
export function getFunCornerLeaderboardData(linkedData: LinkedActivityDoc, kpiData: KpiSnapshot
    , messageIndexById: Record<string, LinkedItem> | undefined): Record<string, any> {
    const memberDataWithMessages = prepareMemberDataWithMessages(linkedData, messageIndexById);
    
    // 커밋수가 가장 많은 유저 찾기
    const topCommitUserEntry = (kpiData.perUser || [])
        .sort((a, b) => (b.commits || 0) - (a.commits || 0))[0];
    
    // 리액션을 가장 많이 한 유저 찾기
    const topReactionGiverEntry = Object.entries(memberDataWithMessages)
        .sort((a, b) => (b[1].reactionsGiven || 0) - (a[1].reactionsGiven || 0))[0];
    
    // 리액션을 가장 많이 받은 유저 찾기
    const userReactionsReceived = Object.entries(memberDataWithMessages).map(([memberId, data]: [string, any]) => {
        const messages = data.messages || [];
        const totalReactionsReceived = messages.reduce((sum: number, m: any) => {
            const reactions = m.meta?.reactions || [];
            return sum + reactions.reduce((s: number, r: any) => s + (r.count || 0), 0);
        }, 0);
        return { memberId, displayName: data.displayName, reactionsReceived: totalReactionsReceived };
    });
    const topReactionsReceivedEntry = userReactionsReceived
        .sort((a, b) => b.reactionsReceived - a.reactionsReceived)[0];

    // 메시지를 가장 많이 한 유저 찾기
    const mostMessagesUser = Object.entries(memberDataWithMessages)
        .sort((a, b) => (b[1].messageCount || 0) - (a[1].messageCount || 0))[0];

    return { topCommitUserEntry, topReactionGiverEntry, topReactionsReceivedEntry, mostMessagesUser };
}

const DEFAULT_TOP_USER_ITEM: TopUserActivityItem = { name: "", nums: 0 };

/**
 * Compute top user per contribution kind (no mapping: GitHub = TopDeveloper/BugHunter, Slack = ChatChamp/ReactionChamp).
 * Each entry is { name, nums } where nums is the single metric for that badge.
 */
export function computeTopUserActivity(
    kpiInfo: KpiSnapshot,
    linkedData: LinkedActivityDoc,
    messageIndexById: Record<string, LinkedItem> | undefined,
    language: "en" | "ko" | "ja",
): TopUserActivity {
    const toItem = (name: string, nums: number): TopUserActivityItem => ({ name, nums });

    // GitHub: TopDeveloper (most commits), BugHunter (most Bugfix+Incident)
    const perUser = kpiInfo?.perUser ?? [];
    const bugfixIncidentByUser = new Map<string, number>();
    for (const u of perUser) {
        const name = u.user ?? "";
        let count = 0;
        for (const caseText of u.cases ?? []) {
            const kind = classifyCaseToKind(caseText, language);
            if (kind === "Bugfix" || kind === "Incident") count += 1;
        }
        bugfixIncidentByUser.set(name, count);
    }
    const topDeveloper = perUser.length
        ? perUser.reduce((a, b) => ((a.commits ?? 0) >= (b.commits ?? 0) ? a : b))
        : null;
    const topBugHunter = perUser.length
        ? perUser.reduce((a, b) => {
            const aN = bugfixIncidentByUser.get(a.user ?? "") ?? 0;
            const bN = bugfixIncidentByUser.get(b.user ?? "") ?? 0;
            return aN >= bN ? a : b;
        })
        : null;

    // Slack: ChatChamp (most messages), ReactionChamp (most reactions given)
    const memberDataWithMessages = prepareMemberDataWithMessages(linkedData, messageIndexById);
    const slackEntries = Object.entries(memberDataWithMessages).map(([memberId, data]: [string, any]) => ({
        name: data.displayName ?? "",
        messages: (data.messages as unknown[] | undefined)?.length ?? 0,
        reactions: data.reactionsGiven ?? 0,
    }));
    const topChatChamp = slackEntries.length
        ? slackEntries.reduce((a, b) => (a.messages >= b.messages ? a : b))
        : null;
    const topReactionChamp = slackEntries.length
        ? slackEntries.reduce((a, b) => (a.reactions >= b.reactions ? a : b))
        : null;

    const result: TopUserActivity = [
        { TopDeveloper: topDeveloper ? toItem(topDeveloper.user ?? "", topDeveloper.commits ?? 0) : DEFAULT_TOP_USER_ITEM },
        { BugHunter: topBugHunter ? toItem(topBugHunter.user ?? "", bugfixIncidentByUser.get(topBugHunter.user ?? "") ?? 0) : DEFAULT_TOP_USER_ITEM },
        { ChatChamp: topChatChamp ? toItem(topChatChamp.name, topChatChamp.messages) : DEFAULT_TOP_USER_ITEM },
        { ReactionChamp: topReactionChamp ? toItem(topReactionChamp.name, topReactionChamp.reactions) : DEFAULT_TOP_USER_ITEM },
    ];
    return result;
}

/** キーワード文字列からシングルクォートで囲まれたパターンを取り出す */
function parseKeywordPatterns(keywordStr: string): string[] {
    if (!keywordStr?.trim()) return [];
    const matches = keywordStr.matchAll(/'([^']*)'/g);
    return [...matches].map((m) => m[1].trim()).filter(Boolean);
}

/** テキストがキーワード文字列のいずれかのパターンにマッチするか */
function textMatchesKeywordString(text: string, keywordStr: string): boolean {
    const patterns = parseKeywordPatterns(keywordStr);
    const lower = text.toLowerCase();
    for (const pattern of patterns) {
        try {
            if (new RegExp(pattern, "i").test(text)) return true;
        } catch {
            if (lower.includes(pattern.toLowerCase())) return true;
        }
    }
    return false;
}

/**
 * perUser.cases의 1건을 kind 로 분류
 * Incident → Release → Bugfix → Security → Refactor, 모두 해당하지 않으면 Feature
 * @param caseText 
 * @param language 
 * @returns 
 */
function classifyCaseToKind(caseText: string, language: "en" | "ko" | "ja"): KindOfCommit {
    const langKey = language === "ja" ? "keywords_ja" : language === "ko" ? "keywords_ko" : "keywords";
    const kindsToTry: KindOfCommit[] = ["Incident", "Release", "Bugfix", "Security", "Refactor"];
    for (const kind of kindsToTry) {
        const keywordStr = KIND_OF_COMMITS_MAP[kind][langKey];
        if (keywordStr && textMatchesKeywordString(caseText, keywordStr)) return kind;
    }
    return "Feature";
}

/**
 * github data를 기반으로 highlight meta json을 생성
 * @param kpiData 
 * @param range 
 * @param language 
 * @returns 
 */
export function createGithubHighlightMetaJson(kpiData: KpiSnapshot, range: string
    , language: "en" | "ko" | "ja" = "en"): GithubHighlightMetaJson {
    const totalCommits = kpiData?.overall?.commits ?? 0;

    const perUser = [...(kpiData?.perUser ?? [])].sort(
        (a, b) => (b.commits ?? 0) - (a.commits ?? 0),
    );
    const topUsers = perUser.slice(0, 5).map((user) => ({
        developer: user.user,
        commits: user.commits ?? 0,
    }));
    const otherUserCommits = perUser.slice(5).reduce((sum, user) => sum + (user.commits ?? 0), 0);
    if (otherUserCommits > 0) {
        topUsers.push({
            developer: "Others",
            commits: otherUserCommits,
        });
    }

    const perCase = [...(kpiData?.perCase ?? [])].filter((item) => item.case !== "other");
    perCase.sort((a, b) => (b.commits ?? 0) - (a.commits ?? 0));
    const topCases = perCase.slice(0, 5).map((item) => ({
        case: item.case,
        commits: item.commits ?? 0,
    }));
    const otherCaseCommits =
        perCase.slice(5).reduce((sum, item) => sum + (item.commits ?? 0), 0) +
        (kpiData?.perCase ?? [])
            .filter((item) => item.case === "other")
            .reduce((sum, item) => sum + (item.commits ?? 0), 0);
    if (otherCaseCommits > 0) {
        topCases.push({
            case: "Others",
            commits: otherCaseCommits,
        });
    }

    // perUser 의 cases 를 kind 별로 집계 (사용자별이 아닌 전체에서 카운트)
    const allCases = (kpiData?.perUser ?? []).flatMap((u) => u.cases ?? []);
    const countsByKind: Record<KindOfCommit, number> = {
        Incident: 0,
        Release: 0,
        Bugfix: 0,
        Security: 0,
        Refactor: 0,
        Feature: 0,
    };
    for (const caseText of allCases) {
        const kind = classifyCaseToKind(caseText, language);
        countsByKind[kind] += 1;
    }
    const commitsByKind = KIND_OF_COMMITS.map((kind) => ({
        kind,
        commits: countsByKind[kind] ?? 0,
    }));

    const meta = {
        range: range,
        totalCommits,
        commitsByDeveloper: topUsers,
        commitsByCase: topCases,
        commitsByKind,
    };

    return meta;
}

export function createChatroomHighlightMetaJson(highlight: RankedHighlight, period: string, range: string): ChatroomHighlightMetaJson {
    const meta = {
        period: period,
        range: range,
        clusterId: highlight.clusterId,
        summary: highlight.summary ?? '',
        audience: highlight.audience,
        score: highlight.score,
        meta: {
            topic: highlight.meta.topic,
            impact: highlight.meta.impact,
            caseId: highlight.meta.caseId,
            repo: highlight.meta.repo,
        },
        items: highlight.items,
        messages: highlight.messages,
    };
    return meta;
}

function getIsoWeek(date: Date) {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const year = tmp.getUTCFullYear();
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { year, week };
}

export function generatePeriodKey(period: string, baseDate: Date = new Date()): string {
    const pad = (value: number, length = 2) => value.toString().padStart(length, '0');
    const year = baseDate.getUTCFullYear();

    switch (period) {
        case 'daily': {
            return `${year}${pad(baseDate.getUTCMonth() + 1)}${pad(baseDate.getUTCDate())}`;
        }
        case 'weekly': {
            const { year: isoYear, week } = getIsoWeek(baseDate);
            return `${isoYear}-W${pad(week)}`;
        }
        case 'monthly': {
            return `${year}-${pad(baseDate.getUTCMonth() + 1)}`;
        }
        case 'yearly': {
            return `${year}`;
        }
        default: {
            return baseDate.toISOString();
        }
    }
}

export function countMessagesIncludingReplies(items: LinkedItem[]): number {
    const countFromItem = (item: LinkedItem): number => {
        const replies = Array.isArray(item.meta?.replies) ? (item.meta?.replies as LinkedItem[]) : [];
        return 1 + replies.reduce((sum, reply) => sum + countFromItem(reply), 0);
    };
    return items.reduce((sum, item) => sum + countFromItem(item), 0);
}

export function getPeriodKeyRange(period: string, periodNumber: number, baseDate: Date = new Date()) {
    const safeNumber = Math.max(0, Math.floor(periodNumber ?? 0));
    const endKey = generatePeriodKey(period, baseDate);
    const startDate = new Date(baseDate);

    switch (period) {
        case 'daily':
            startDate.setUTCDate(startDate.getUTCDate() - safeNumber);
            break;
        case 'weekly':
            startDate.setUTCDate(startDate.getUTCDate() - safeNumber * 7);
            break;
        case 'monthly':
            startDate.setUTCMonth(startDate.getUTCMonth() - safeNumber);
            break;
        case 'yearly':
            startDate.setUTCFullYear(startDate.getUTCFullYear() - safeNumber);
            break;
        default:
            startDate.setUTCDate(startDate.getUTCDate() - safeNumber);
    }

    const startKey = generatePeriodKey(period, startDate);
    return { startKey, endKey };
}

export function countReactionsIncludingReplies(items: LinkedItem[]): number {
    const countFromItem = (item: LinkedItem): number => {
        const reactions = Array.isArray(item.meta?.reactions)
            ? (item.meta?.reactions as Array<{ count?: number }>)
            : [];
        const replies = Array.isArray(item.meta?.replies) ? (item.meta?.replies as LinkedItem[]) : [];
        const reactionTotal = reactions.reduce((total, reaction) => total + (reaction.count ?? 0), 0);
        return reactionTotal + replies.reduce((sum, reply) => sum + countFromItem(reply), 0);
    };
    return items.reduce((sum, item) => sum + countFromItem(item), 0);
}