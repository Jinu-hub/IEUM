// ingestors.ts
// 사내 뉴스레터 파이프라인: Ingest 단계 샘플 구현
// - 기간 필터링은 상위 수집 단계에서 이미 수행된다는 전제
// - 본 구현은 평탄화/병합/중복제거/경량 정리 중심 (idempotent)

import type { UnifiedActivityDoc } from "~/core/lib/types";
import type { FetchedRepoData } from "../integrations/github/types";
import type { FetchedMessage } from "../integrations/slack/types";

/** 공통: 배열 중복 제거 유틸 */
function dedupeBy<T, K extends string | number>(arr: T[], keyFn: (t: T) => K | undefined): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (k === undefined) continue; // 키 불능 → 스킵 (느슨 복구)
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

/** 공통: 안전한 push (undefined 방지) */
function pushAll<T>(dst: T[], src?: T[]) {
  if (!Array.isArray(src)) return;
  for (const v of src) dst.push(v);
}

/** -----------------------------
 *  GitHub Ingestor
 * ----------------------------- */

// 키 선택자: 외부 정규화 수준이 서로 다를 수 있으므로 유연 키를 사용
const commitKey = (c: any) => (c?.sha ?? c?.id ?? c?.url ?? c?.node_id ?? c?.oid) as string | undefined;
const prKey = (p: any) => (p?.number ?? p?.id ?? p?.url ?? p?.node_id) as string | number | undefined;
const issueKey = (i: any) => (i?.number ?? i?.id ?? i?.url ?? i?.node_id) as string | number | undefined;

function sanitizeRepoIdentity(repo: FetchedRepoData["repo"]) {
  return {
    owner: String(repo?.owner ?? "").trim(),
    name: String(repo?.name ?? "").trim(),
  } as FetchedRepoData["repo"]; // 기존 타입 준수
}

function sanitizeRepoBlock(r: FetchedRepoData): FetchedRepoData {
  const repo = sanitizeRepoIdentity(r.repo);
  const commits = Array.isArray(r.commits) ? r.commits : [];
  const mergedPRs = Array.isArray(r.mergedPRs) ? r.mergedPRs : [];
  const openedIssues = Array.isArray(r.openedIssues) ? r.openedIssues : [];
  const closedIssues = Array.isArray(r.closedIssues) ? r.closedIssues : [];
  return { repo, commits, mergedPRs, openedIssues, closedIssues };
}

export async function githubIngestor(
  githubData: Record<string, FetchedRepoData> ,
): Promise<Pick<UnifiedActivityDoc, "github">> {
  // 1) 평탄화 + 라이트 검증/정리
  const flat: FetchedRepoData[] = [];
  for (const row of Object.values(githubData)) {
      const item = row;
      if (!item || !item.repo) continue; // 필수 누락 → 스킵
      flat.push(sanitizeRepoBlock(item));
  }

  // 2) 저장소 단위 병합 + 내부 컬렉션 dedupe
  const byRepo = new Map<string, FetchedRepoData>();
  for (const r of flat) {
    const repoKey = `${r.repo.owner}/${r.repo.name}`;
    const prev = byRepo.get(repoKey);
    if (!prev) {
      byRepo.set(repoKey, {
        repo: r.repo,
        commits: dedupeBy(r.commits, commitKey),
        mergedPRs: dedupeBy(r.mergedPRs, prKey),
        openedIssues: dedupeBy(r.openedIssues, issueKey),
        closedIssues: dedupeBy(r.closedIssues, issueKey),
      });
    } else {
      const merged: FetchedRepoData = {
        repo: prev.repo,
        commits: dedupeBy([...prev.commits, ...r.commits], commitKey),
        mergedPRs: dedupeBy([...prev.mergedPRs, ...r.mergedPRs], prKey),
        openedIssues: dedupeBy([...prev.openedIssues, ...r.openedIssues], issueKey),
        closedIssues: dedupeBy([...prev.closedIssues, ...r.closedIssues], issueKey),
      };
      byRepo.set(repoKey, merged);
    }
  }

  // 3) 출력: 후속 파이프라인이 바로 집계 가능한 형태 유지
  return { github: Array.from(byRepo.values()) };
}

/** -----------------------------
 *  Slack Ingestor
 * ----------------------------- */

function normalizeText(s?: string): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length ? t : undefined;
}

function mergeUsers(a?: string[], b?: string[]): string[] | undefined {
  if (!a && !b) return undefined;
  const set = new Set<string>();
  pushAll(set as any, a);
  pushAll(set as any, b);
  return Array.from(set);
}

function normalizeReactions(input?: FetchedMessage["reactions"]): FetchedMessage["reactions"] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const map = new Map<string, { name: string; count: number; users?: string[] }>();
  for (const r of input) {
    if (!r || !r.name) continue;
    const name = String(r.name);
    const prev = map.get(name);
    const addCount = typeof r.count === "number" ? r.count : Array.isArray(r.users) ? r.users.length : 0;
    if (!prev) {
      map.set(name, { name, count: addCount, users: r.users ? Array.from(new Set(r.users)) : undefined });
    } else {
      prev.count += addCount;
      prev.users = mergeUsers(prev.users, r.users);
    }
  }
  const out = Array.from(map.values()).filter((r) => r.count > 0 || (r.users && r.users.length > 0));
  return out.length ? out : undefined;
}

function normalizeFiles(input?: FetchedMessage["files"]): FetchedMessage["files"] | undefined {
  if (!Array.isArray(input) || input.length === 0) return undefined;
  const map = new Map<string, { name?: string; url?: string }>();
  for (const f of input) {
    if (!f) continue;
    const key = (f.url ?? f.name);
    if (!key) continue;
    if (!map.has(key)) map.set(key, { name: f.name, url: f.url });
  }
  const out = Array.from(map.values());
  return out.length ? out : undefined;
}

function sanitizeMessage(m: FetchedMessage): FetchedMessage {
  const ts = String(m.ts ?? "").trim();
  const text = normalizeText(m.text);
  const permalink = normalizeText(m.permalink);
  const reactions = normalizeReactions(m.reactions);
  const files = normalizeFiles(m.files);

  // 스레드: 답글 각각도 정리 + ts 기준 dedupe 유지
  let thread: FetchedMessage["thread"] | undefined = undefined;
  if (m.thread && Array.isArray(m.thread.replies)) {
    const byTs = new Map<string, FetchedMessage>();
    for (const r of m.thread.replies) {
      if (!r || !r.ts) continue;
      const clean = sanitizeMessage(r);
      byTs.set(clean.ts, byTs.has(clean.ts) ? mergeMessages(byTs.get(clean.ts)!, clean) : clean);
    }
    const replies = Array.from(byTs.values());
    if (replies.length) thread = { replies };
  }

  return {
    ...m,
    ts,
    text,
    permalink,
    reactions,
    files,
    thread,
  };
}

function mergeMessages(a: FetchedMessage, b: FetchedMessage): FetchedMessage {
  // 동일 ts 가정. Truthy 우선, 배열은 병합, thread는 재귀 병합
  const pick = <T>(x: T | undefined, y: T | undefined) => (x ?? y);

  // reactions 병합
  const mergedReactions = normalizeReactions([...(a.reactions ?? []), ...(b.reactions ?? [])]);
  const mergedFiles = normalizeFiles([...(a.files ?? []), ...(b.files ?? [])]);

  // thread 병합
  let mergedThread: FetchedMessage["thread"] | undefined = undefined;
  const aReplies = a.thread?.replies ?? [];
  const bReplies = b.thread?.replies ?? [];
  if (aReplies.length || bReplies.length) {
    const byTs = new Map<string, FetchedMessage>();
    for (const r of [...aReplies, ...bReplies]) {
      if (!r || !r.ts) continue;
      const clean = sanitizeMessage(r);
      byTs.set(clean.ts, byTs.has(clean.ts) ? mergeMessages(byTs.get(clean.ts)!, clean) : clean);
    }
    const replies = Array.from(byTs.values());
    if (replies.length) mergedThread = { replies };
  }

  return {
    ...a,
    // 가장 최신/유효한 값 우선
    user: pick(a.user, b.user),
    userInfo: pick(a.userInfo, b.userInfo),
    text: pick(a.text, b.text),
    permalink: pick(a.permalink, b.permalink),
    reactions: mergedReactions,
    files: mergedFiles,
    thread: mergedThread,
  };
}

export async function slackIngestor(
  slackData: Record<string, FetchedMessage[]>,
): Promise<Pick<UnifiedActivityDoc, "slack">> {
  // 1) 채널별로 처리하여 채널 구조 유지
  const processedByChannel: Record<string, FetchedMessage[]> = {};
  
  for (const [channelId, messages] of Object.entries(slackData)) {
    if (!Array.isArray(messages)) continue;
    
    // 2) 채널 내에서 ts 기준 중복 제거 + 병합 + 경량 정리
    const byTs = new Map<string, FetchedMessage>();
    for (const raw of messages) {
      if (!raw || !raw.ts) continue; // 필수 누락 → 스킵
      const clean = sanitizeMessage(raw);
      const prev = byTs.get(clean.ts);
      byTs.set(clean.ts, prev ? mergeMessages(prev, clean) : clean);
    }
    
    processedByChannel[channelId] = Array.from(byTs.values());
  }

  // 3) 출력: 채널별 구조를 유지하면서 후속 파이프라인이 사용 가능한 형태
  return { slack: processedByChannel };
}

