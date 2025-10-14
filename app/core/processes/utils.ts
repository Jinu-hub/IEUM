import { z } from "zod";
import { CFG_RANKER, IMPACT_MAP, type ImpactKey } from "../lib/constants";
import type { KpiSnapshot, LinkedActivityDoc, RankedHighlight } from "../lib/types";
import { Cluster } from "../openai/models";

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
export function prepareHighlightsWithMessages(linkedData: LinkedActivityDoc, highlights: RankedHighlight[]): RankedHighlight[]  {
  const messageIndexIdArray = linkedData.index?.byId;
  let highlightsWithMessages: RankedHighlight[] = [];

  if (highlights && messageIndexIdArray) {
      for (const highlight of highlights) {
          const messages = highlight.items?.map((item) => messageIndexIdArray[item]);
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
 * @returns 멤버 ID를 키로 하고, displayName과 messages 배열을 포함하는 객체
 */
export function prepareMemberDataWithMessages(linkedData: LinkedActivityDoc): Record<string, any> {
  const memberData = linkedData.items.member;
  const messageIndexIdArray = linkedData.index?.byId;
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
                  reactionsGiven: reactionsByUser[member.memberId] || 0,
              };
              const messages = member.messageIds
                  .map((mid) => messageIndexIdArray[mid] || replyIndex[mid])
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
 * @returns 
 */
export function getFunCornerLeaderboardData(linkedData: LinkedActivityDoc, kpiData: KpiSnapshot): Record<string, any> {
    const memberDataWithMessages = prepareMemberDataWithMessages(linkedData);
    
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