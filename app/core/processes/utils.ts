import { z } from "zod";
import { CFG_RANKER, IMPACT_MAP, type ImpactKey } from "../lib/constants";
import type { KpiSnapshot } from "../lib/types";
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
  