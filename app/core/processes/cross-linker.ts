// app/core/linkers/cross-linker.ts
import {
  type LinkedActivityDoc,
  type LinkedItem,
  type UnifiedActivityDoc,
  type userActivity,
} from "../lib/types";
  
  /**
   * CrossLinker options
   */
  export type CrossLinkerOptions = {
    /**
     * Slack 채널명 → GitHub repo "owner/repo" 매핑
     *  예) { "backend-alerts": "acme/api-server" }
     */
    channelRepoMap?: Record<string, string>;
    /**
     * 디듀프 설정
     */
    dedup?: {
      /**
       * Slack 같은(유사) 메시지 소프트 디듀프 허용
       */
      enableSoftDedup?: boolean;
      /**
       * 소프트 디듀프 시 유사도 임계값 (0~1)
       */
      similarityThreshold?: number; // default 0.95
      /**
       * 소프트 디듀프 시간 윈도우(ms). 가까운 시간에 같은 내용이면 중복으로 판단.
       */
      timeWindowMs?: number; // default 10 * 60 * 1000
    };
    /**
     * 간단한 로거
     */
    logger?: Pick<Console, "debug" | "warn" | "error">;
  };
  
  /**
   * 링크 엣지
   */
  export type LinkEdge = {
    sourceId: string;
    targetId: string;
    rel:
      | "mentions"
      | "refers"
      | "fixes"
      | "closes"
      | "duplicates"
      | "thread_root"
      | "belongs_to";
    confidence: number;
    directed?: boolean; // 기본 true
  };
  
  type Reference = {
    targetId: string;
    rel: LinkEdge["rel"];
    confidence: number;
    via?: "url" | "number" | "text" | "merge_commit" | "unfurl" | "heuristic";
  };
  
  type InternalItem = LinkedItem & {
    meta?: Record<string, any>;
  };
  
  const GH_PR_OR_ISSUE_RE =
    /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(pull|issues)\/(\d+)/i;
  const GH_COMMIT_RE =
    /https?:\/\/github\.com\/([^/]+)\/([^/]+)\/commit\/([0-9a-f]{7,40})/i;
  
  // 텍스트에서 URL 추출 (아주 단순; Slack blocks가 있으면 unfurl 차원에서 보강)
  const URL_RE = /https?:\/\/[^\s)>\]}]+/g;
  
  // "closes|fixes #123" 류
  const CLOSES_RE = /\b(?:closes|fixes|resolves)\s+#(\d+)\b/i;
  
  // "#123" 추출
  const ISSUE_NUMBER_RE = /#(\d+)/g;
  
  // 기본 옵션
  const DEFAULT_OPTS: Required<CrossLinkerOptions> = {
    channelRepoMap: {},
    dedup: {
      enableSoftDedup: true,
      similarityThreshold: 0.95,
      timeWindowMs: 10 * 60 * 1000,
    },
    logger: console,
  };
  
  /**
   * 메인 엔트리
   */
  export async function crossLinker(
    unified: UnifiedActivityDoc,
    options: CrossLinkerOptions = {}
  ): Promise<LinkedActivityDoc> {
    const opts = {
      ...DEFAULT_OPTS,
      ...options,
      dedup: { ...DEFAULT_OPTS.dedup, ...(options.dedup || {}) },
    };
    const logger = opts.logger;
  
    // 1) 원시 아이템 생성 (GitHub/Slack → LinkedItem)
    const rawItems: InternalItem[] = [];
    for (const repo of unified.github ?? []) {
      const repoName = `${repo.repo.owner}/${repo.repo.name}`;
  
      // commits
      for (const c of repo.commits ?? []) {
        rawItems.push({
          id: `commit:${c.sha}`,
          type: "commit",
          title: c.message?.slice(0, 120) || "Commit",
          url: c.html_url,
          tsISO: c.date,
          references: [],
          meta: { repo: repoName, author: c.author },
        });
      }
  
      // merged PRs
      for (const pr of repo.closedPRs ?? []) {
        const refs: Reference[] = [];
  
        // "closes|fixes #num" 파싱 결과(ingestor가 넣었거나 여기서 추가로 잡음)
        if (pr.closes && pr.closes.length) {
          for (const n of pr.closes) {
            refs.push({
              targetId: `issue:${repoName}#${n}`,
              rel: "closes",
              confidence: 0.9,
              via: "text",
            });
          }
        } else if (pr.title) {
          // 타이틀에서도 closes 등을 잡아보자(옵션)
          const m = pr.title.match(CLOSES_RE);
          if (m) {
            const n = Number(m[1]);
            refs.push({
              targetId: `issue:${repoName}#${n}`,
              rel: "closes",
              confidence: 0.8,
              via: "text",
            });
          }
        }
  
        rawItems.push({
          id: `pr:${repoName}#${pr.number}`,
          type: "pr",
          title: pr.title,
          url: pr.html_url,
          tsISO: pr.merged_at,
          references: refs,
          meta: { repo: repoName, merge_commit_sha: pr.merge_commit_sha },
        });
      }
  
      // issues
      for (const is of [...(repo.openedIssues ?? []), ...(repo.closedIssues ?? [])]) {
        const ts =
          (is as any).closed_at ||
          (is as any).created_at ||
          (is as any).updated_at ||
          undefined;
        rawItems.push({
          id: `issue:${repoName}#${is.number}`,
          type: "issue",
          title: is.title,
          url: is.html_url,
          tsISO: ts,
          references: [],
          meta: { repo: repoName },
        });
      }
    }
  
    // slack
    const slackMessages = Array.isArray(unified.slack) 
      ? unified.slack.map(m => ({ message: m, channelId: 'unknown' }))
      : Object.entries(unified.slack ?? {}).flatMap(([channelId, messages]) => 
          messages.map(m => ({ message: m, channelId }))
        );
    // 중복 방지를 위한 처리된 메시지 추적
    const processedTs = new Set<string>();

    for (const { message: m, channelId } of slackMessages) {
      // 이미 처리된 메시지는 건너뛰기
      if (processedTs.has(m.ts)) {
        continue;
      }

      const tsISO = toISOFromSlackTs(m.ts);
      const refs: Reference[] = [];
      if (m.thread_root_ts && m.thread_root_ts !== m.ts) {
        refs.push({
          targetId: `slack:${m.thread_root_ts}`,
          rel: "thread_root",
          confidence: 1.0,
          via: "unfurl",
        });
      }

      // 스레드 replies 처리
      const replies: LinkedItem[] = [];
      if (m.thread?.replies) {
        for (const reply of m.thread.replies) {
          if (reply.ts === m.ts) {
            continue;
          }
          // 이미 처리된 메시지는 건너뛰기
          if (processedTs.has(reply.ts)) {
            continue;
          }

          // reply도 처리된 것으로 표시
          processedTs.add(reply.ts);
          
          const replyTsISO = toISOFromSlackTs(reply.ts);
          replies.push({
            id: `slack:${reply.ts}`,
            type: "slack_reply",
            title: (reply.text || "").slice(0, 120) || "Slack reply",
            url: m.permalink, // 부모 메시지와 같은 permalink 사용
            tsISO: replyTsISO,
            references: [],
            meta: {
              channel: channelId,
              user: reply.user?.name || reply.user?.id,
              userInfo: reply.userInfo ? {
                id: reply.userInfo.id,
                name: reply.userInfo.real_name,
              } : undefined,
              reactions: reply.reactions,
              fullText: reply.text,
              parentTs: m.ts,
            },
          });
        }
      }

      // 메시지 처리 완료 표시
      processedTs.add(m.ts);

      rawItems.push({
        id: `slack:${m.ts}`,
        type: "slack",
        title: (m.text || "").slice(0, 120) || "Slack message",
        url: m.permalink,
        tsISO,
        references: refs,
        meta: {
          channel: channelId,
          user: m.user?.name || m.user?.id,
          userInfo: m.userInfo ? {
            id: m.userInfo.id,
            real_name: m.userInfo.real_name,
          } : undefined,
          reactions: m.reactions,
          blocks: m.blocks,
          fullText: m.text,
          replies: replies.length > 0 ? replies : undefined,
        },
      });
    }
  
    // 2) 하드 디듀프(by id/url) 및 병합
    // 스레드 replies는 부모 메시지의 meta에 포함되므로 별도 아이템으로 제외
    const filteredItems = rawItems.filter(item => item.type !== "slack_reply");
    const { byId, byUrl } = hardDedup(filteredItems);
  
    // 3) 소프트 디듀프(선택): Slack 유사 메시지 중복 제거
    if (opts.dedup.enableSoftDedup) {
      softDedupSlack(byId, {
        timeWindowMs: opts.dedup.timeWindowMs || 0,
        similarityThreshold: opts.dedup.similarityThreshold || 0,
        logger,
      });
    }
  
    // 4) 링크 생성 (Slack → GitHub URL/번호, Commit → PR)
    const edges: LinkEdge[] = [];
  
    // Slack → GitHub: URL 매칭(1.0) + 번호(#123) 추론(0.7)
    for (const item of byId.values()) {
      if (item.type !== "slack") continue;
  
      const { urls, numbers } = extractFromSlack(item);
      // URL → ID
      for (const u of urls) {
        const targetId =
          ghUrlToId(u) ||
          (byUrl.has(u) ? (byUrl.get(u) as string) : undefined);
        if (targetId && targetId !== item.id) {
          edges.push({
            sourceId: item.id,
            targetId,
            rel: "mentions",
            confidence: 1.0,
          });
        }
      }
  
      // TODO: 티켓 번호 기반 매핑 
      // 이유: 같은 번호로 너무 많은 커밋이 있을 수 있어, 분석에 오류가 생길 수 있음
      // #123 → 티켓 번호 기반 매핑 (채널 무관)
      /*
      if (numbers.length) {
        for (const n of numbers) {
          // 모든 저장소에서 해당 번호의 PR/Issue 검색
          for (const [repo, _] of Object.entries(opts.channelRepoMap)) {
            const pid = `pr:${repo}#${n}`;
            const iid = `issue:${repo}#${n}`;
            
            if (byId.has(pid)) {
              edges.push({
                sourceId: item.id,
                targetId: pid,
                rel: "mentions",
                confidence: 0.7,
              });
            }
            if (byId.has(iid)) {
              edges.push({
                sourceId: item.id,
                targetId: iid,
                rel: "mentions",
                confidence: 0.7,
              });
            }
          }
        }
      }
      */
    }
  
    // Commit → PR (merge_commit_sha 일치: 1.0)
    for (const pr of [...byId.values()].filter((i) => i.type === "pr")) {
      const msha = pr.meta?.merge_commit_sha;
      if (!msha) continue;
      const commitId = `commit:${msha}`;
      if (byId.has(commitId)) {
        edges.push({
          sourceId: commitId,
          targetId: pr.id,
          rel: "belongs_to",
          confidence: 1.0,
        });
      }
    }
  
    // 5) references 필드에도 반영(하위 호환)
    for (const e of edges) {
      const src = byId.get(e.sourceId);
      if (!src) continue;
      (src.references ||= []).push({
        targetId: e.targetId,
        rel: e.rel,
        confidence: e.confidence,
      });
    }
  
    // 6) 최종 정리 - type별로 그룹화
    const allItems = [...byId.values()].sort((a, b) => {
      const ta = a.tsISO ? Date.parse(a.tsISO) : 0;
      const tb = b.tsISO ? Date.parse(b.tsISO) : 0;
      return tb - ta;
    });

    // type별로 그룹화 (slack은 채널별로 추가 그룹화)
    const itemsByType: Record<string, InternalItem[] | Record<string, InternalItem[]> | Record<string, userActivity>> = {};
    for (const item of allItems) {
      if (!itemsByType[item.type]) {
        if (item.type === "slack") {
          itemsByType[item.type] = {};
        } else {
          itemsByType[item.type] = [];
        }
      }

      if (item.type === "slack") {
        const channel = item.meta?.channel || "unknown";
        const slackByChannel = itemsByType[item.type] as Record<string, InternalItem[]>;
        if (!slackByChannel[channel]) {
          slackByChannel[channel] = [];
        }
        slackByChannel[channel].push(item);
      } else {
        const itemsArray = itemsByType[item.type] as InternalItem[];
        itemsArray.push(item);
      }
    }

    // member 맵 생성: Slack 메시지와 replies의 userInfo에서 활동 카운트(userActivity)
    const memberMap: Record<string, userActivity> = {};
    for (const item of allItems) {
      if (item.type !== "slack") continue;

      const ui = item.meta?.userInfo as any | undefined;
      const topId = (ui && (ui.id || ui.userId)) || (item.meta?.user as string | undefined);
      const topName = (ui && (ui.real_name || ui.name)) || (item.meta?.user as string | undefined);
      if (topId) {
        const existing = memberMap[topId];
        const displayName = topName || existing?.displayName || topId;
        const base = existing || {
          memberId: topId,
          displayName,
          messageCount: { direct: 0, replies: 0, total: 0 },
          messageIds: [],
        };
        base.displayName = displayName;
        base.messageCount.direct += 1;
        base.messageIds.push(item.id);
        memberMap[topId] = base;
      }

      const replies = (item.meta?.replies as InternalItem[] | undefined) || [];
      for (const r of replies) {
        const rui = (r.meta?.userInfo as any | undefined) || undefined;
        const rid = (rui && (rui.id || rui.userId)) || (r.meta?.user as string | undefined);
        const rname = (rui && (rui.real_name || rui.name)) || (r.meta?.user as string | undefined);
        if (!rid) continue;
        const existing = memberMap[rid];
        const displayName = rname || existing?.displayName || rid;
        const base = existing || {
          memberId: rid,
          displayName,
          messageCount: { direct: 0, replies: 0, total: 0 },
          messageIds: [],
        };
        base.displayName = displayName;
        base.messageCount.replies += 1;
        base.messageIds.push(r.id);
        memberMap[rid] = base;
      }
    }

    // total 재계산
    for (const k of Object.keys(memberMap)) {
      const mc = memberMap[k].messageCount;
      mc.total = mc.direct + mc.replies;
    }

    (itemsByType as Record<string, any>).member = memberMap;

    return {
      items: {
        commit: (itemsByType.commit as InternalItem[]) || [],
        pr: (itemsByType.pr as InternalItem[]) || [],
        issue: (itemsByType.issue as InternalItem[]) || [],
        member: (itemsByType.member as Record<string, userActivity>) || {},
        slack: (itemsByType.slack as Record<string, InternalItem[]>) || {},
      },
      
      index: {
        byId: Object.fromEntries(allItems.map((i) => [i.id, i])),
        edges,
      },
      
    };
  }
  
  /* ----------------------------- helpers ------------------------------ */
  
  function toISOFromSlackTs(ts: string | undefined): string | undefined {
    if (!ts) return undefined;
    const sec = parseFloat(ts);
    if (!isFinite(sec)) return undefined;
    return new Date(sec * 1000).toISOString();
  }
  
  /** 하드 디듀프: id/url 기준 병합 */
  function hardDedup(items: InternalItem[]) {
    const byId = new Map<string, InternalItem>();
    const byUrl = new Map<string, string>(); // url -> id
  
    for (const it of items) {
      const ex = byId.get(it.id);
      if (!ex) {
        byId.set(it.id, { ...it, references: [...(it.references || [])] });
        if (it.url) byUrl.set(it.url, it.id);
        continue;
      }
      // 단순 병합 정책(빈 값 보완, 메타/참조 누적, 중복 제거 최소화)
      ex.title ||= it.title;
      ex.tsISO ||= it.tsISO;
      if (it.url && !ex.url) {
        ex.url = it.url;
        byUrl.set(it.url, ex.id);
      }
      ex.meta = { ...(ex.meta || {}), ...(it.meta || {}) };
      if (it.references?.length) {
        for (const r of it.references) {
          if (!ex.references!.some((x) => x.targetId === r.targetId && x.rel === r.rel)) {
            ex.references!.push(r);
          }
        }
      }
    }
    return { byId, byUrl };
  }
  
  /** Slack 텍스트/blocks에서 URL과 #번호 추출 */
  function extractFromSlack(item: InternalItem): { urls: string[]; numbers: number[] } {
    const urls = new Set<string>();
    const numbers = new Set<number>();
  
    const text: string = item.meta?.fullText || item.title || "";
    for (const u of text.match(URL_RE) || []) urls.add(stripTrailingPunct(u));
    for (const m of text.matchAll(ISSUE_NUMBER_RE)) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) numbers.add(n);
    }
  
    // blocks 내 링크(unfurl)도 스캔(있다면)
    const blocks = item.meta?.blocks || [];
    for (const b of blocks) {
      // 매우 보수적: plain_text / text / url 필드에서 URL 추출
      scanObjectForUrls(b, urls);
    }
  
    return { urls: [...urls], numbers: [...numbers] };
  }
  
  /** 객체 내 문자열 필드를 순회하며 URL 추출 */
  function scanObjectForUrls(obj: any, collector: Set<string>) {
    if (!obj) return;
    if (typeof obj === "string") {
      for (const u of obj.match(URL_RE) || []) collector.add(stripTrailingPunct(u));
      return;
    }
    if (Array.isArray(obj)) {
      for (const v of obj) scanObjectForUrls(v, collector);
      return;
    }
    if (typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        scanObjectForUrls(obj[k], collector);
      }
    }
  }
  
  /** URL 뒤 꼬리 구두점 제거 (예: "....)" 끝 괄호 등) */
  function stripTrailingPunct(url: string): string {
    return url.replace(/[),.;]+$/g, "");
  }
  
  /** GitHub URL → canonical id 변환 */
  function ghUrlToId(url: string): string | undefined {
    let m = url.match(GH_PR_OR_ISSUE_RE);
    if (m) {
      const owner = m[1];
      const repo = m[2];
      const kind = m[3];
      const num = m[4];
      if (kind.toLowerCase() === "pull") return `pr:${owner}/${repo}#${num}`;
      return `issue:${owner}/${repo}#${num}`;
    }
    m = url.match(GH_COMMIT_RE);
    if (m) {
      const sha = m[3];
      return `commit:${sha}`;
    }
    return undefined;
  }
  
  /** 매우 단순한 문자열 유사도 (Jaccard on word set) */
  function similarity(a: string, b: string): number {
    const A = new Set(tokenize(a));
    const B = new Set(tokenize(b));
    if (!A.size && !B.size) return 1;
    let inter = 0;
    for (const t of A) if (B.has(t)) inter++;
    const union = A.size + B.size - inter;
    return union ? inter / union : 0;
  }
  
  function tokenize(s: string): string[] {
    return (s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  }
  
  /** Slack 소프트 디듀프: 같은 채널 내, 가까운 시간, 유사 텍스트 → duplicates */
  function softDedupSlack(
    byId: Map<string, InternalItem>,
    cfg: { timeWindowMs: number; similarityThreshold: number; logger: Pick<Console, "debug" | "warn" | "error"> }
  ) {
    const items = [...byId.values()].filter((i) => i.type === "slack");
    // 채널별로 그룹화
    const byChannel = new Map<string, InternalItem[]>();
    for (const it of items) {
      const ch = it.meta?.channel || "_";
      if (!byChannel.has(ch)) byChannel.set(ch, []);
      byChannel.get(ch)!.push(it);
    }
  
    for (const [channel, arr] of byChannel) {
      arr.sort((a, b) => time(a.tsISO) - time(b.tsISO));
      // 슬라이딩 윈도우 방식
      for (let i = 0; i < arr.length; i++) {
        const a = arr[i];
        for (let j = i + 1; j < arr.length; j++) {
          const b = arr[j];
          const dt = Math.abs(time(b.tsISO) - time(a.tsISO));
          if (dt > cfg.timeWindowMs) break; // 시간 윈도우 초과
          const sa = a.meta?.fullText || a.title || "";
          const sb = b.meta?.fullText || b.title || "";
          const sim = similarity(sa, sb);
          if (sim >= cfg.similarityThreshold) {
            // b를 a의 duplicate로 편입
            // references만 남기고 b 제거
            a.references ||= [];
            a.references.push({
              targetId: b.id,
              rel: "duplicates",
              confidence: sim,
            });
            byId.delete(b.id);
          }
        }
      }
    }
  }
  
  function time(tsISO?: string): number {
    return tsISO ? Date.parse(tsISO) || 0 : 0;
  }
  
  export default crossLinker;
  