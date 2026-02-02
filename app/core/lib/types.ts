import { z } from "zod";
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import type { Cluster } from "../openai/models";

export type EnableCreateContents = {
  slack : boolean;
  github : boolean;
  discord : boolean;
}

/**
 * コンテンツ生成用のデータ型
 */
export type CreateContentsInput = {
  githubResult?: Record<string, FetchedRepoData> | null;
  slackResult?: Record<string, FetchedMessage[]> | null;
  workspaceId: string;
  targetId: string;
  runId: string;
  runStepId: string;
  period: string;
  range: string;
  from: Date;
  to: Date;
  language: 'en' | 'ko' | 'ja';
  source: string;
  timezone?: string;
  enableCreateContents?: EnableCreateContents;
  accuratedTokens?: number;
  /** run を running にした時刻 (Date.now())。collect_data_ms 算出用 */
  runStartedAt?: number;
};

/** 파이프라인 공용 루트 문서 */
export type UnifiedActivityDoc = {
    /** 스키마 버전 (변경 추적용) */
    schemaVersion: "1.0.0";
  
    /** 문서 생성 시각 (ISO) */
    generatedAt: string;
  
    /** 수집 기간(상위 단계에서 필터링 완료) */
    timespan: {
      fromISO: string;
      toISO: string;
    };
  
    /** 데이터 출처/컨텍스트 (감사/디버깅용) */
    provenance?: {
      github?: {
        workspace?: string;                // 예: org/repo가 속한 조직명, 내부 워크스페이스 식별자 등
        repos?: Array<{ owner: string; name: string }>;
        fetchedAt?: string;                // 실제 API/캐시 조회 시각
        note?: string;                     // 스코프/필터 등 주석
      };
      slack?: {
        workspace?: string;                // Slack 워크스페이스 이름/ID
        channels?: string[];               // 수집 대상 채널 ID/이름
        fetchedAt?: string;
        note?: string;
      };
    };
  
    /** === 메인 페이로드 (인제스트 결과) === */
    github?: FetchedRepoData[];            // 저장소 단위로 병합/중복제거된 활동
    slack?: Record<string, FetchedMessage[]>; // 채널별로 정리/중복제거된 메시지(스레드는 message.thread로 보존)
  
    /** === 경량 인덱스(옵션, 후속 단계 가속용) === */
    indexes?: {
      /** "owner/name" -> github[] 인덱스 매핑 */
      githubByRepo?: Record<string, number>;
      /** 루트 ts -> 답글 ts 리스트(요약/집계 가속) */
      slackThreadByRoot?: Record<string, string[]>;
      /** 사용자/채널 등 빠른 룩업을 위한 힌트 맵(필요 시 확장) */
      hints?: Record<string, number | string | string[]>;
    };
  
    /** === 집계 통계(옵션, 재계산 비용 절약) === */
    stats?: {
      github?: {
        repos: number;
        commits: number;
        mergedPRs: number;
        openedIssues: number;
        closedIssues: number;
      };
      slack?: {
        channels: number;      // 채널 수
        messages: number;
        threads: number;
        reactions: number;
        files: number;
        participants?: number; // 유니크 발화자 수 등
      };
    };
  
    /** === 품질 진단(옵션) === */
    diagnostics?: {
      warnings?: string[];                 // 누락 필드, 비정상 레코드 등 경고 메시지
      dropped?: Array<{ reason: string; count: number }>;
    };
  
    /** === 렌더링 힌트(옵션) — 뉴스레터 생성 시 포맷/타임존 제어 === */
    i18n?: {
      locale?: "ko" | "ja" | "en";
      timezone?: string;                   // 예: "Asia/Tokyo"
    };
};

/** 
 * crossLinker가 만든 최종 산출물 
 * - items: type별로 그룹화된 활동 목록 (commit, pr, issue는 배열, slack은 채널별 객체)
 * - index: 빠른 조회/그래프 탐색을 위한 보조 인덱스
 */
export type LinkedActivityDoc = {
  items: {
    commit: LinkedItem[];
    pr: LinkedItem[];
    issue: LinkedItem[];
    slack: Record<string, LinkedItem[]>; // 채널별 그룹화
    member: Record<string, userActivity>;
    [key: string]: LinkedItem[] | Record<string, LinkedItem[]> | Record<string, userActivity>;
  };

  index?: {
    byId?: Record<string, LinkedItem>;
    edges: LinkEdge[];
  };

};

export type userActivity = {
  memberId: string;
  displayName: string;
  messageCount: {
    direct: number;
    replies: number;
    total: number;
  };
  messageIds: string[];
};

/** 
 * 단일 활동 항목
 * - id: 고유 식별자 (commit:<sha>, pr:owner/repo#123, issue:..., slack:ts)
 * - type: 활동 종류
 * - title: 요약 텍스트 (예: 커밋 메시지, PR 타이틀, Slack 메시지 앞부분)
 * - url: 원본 리소스 URL (GitHub/Slack permalink 등)
 * - tsISO: ISO8601 타임스탬프 (정렬/타임라인용)
 * - references: 다른 LinkedItem들과의 연결 (하위 호환/간단 링크 표현)
 * - meta: 부가정보 (저자, 레포, 채널, 상태 등)
 */
export type LinkedItem = {
  id: string;
  type: "commit" | "pr" | "issue" | "slack" | "slack_reply";
  title: string;
  url?: string;
  tsISO?: string;
  references: Reference[];
  meta?: {
    // 공통
    channel?: string;
    user?: string;
    userInfo?: any;
    fullText?: string;
    
    // GitHub 관련
    repo?: string;
    author?: string;
    merge_commit_sha?: string;
    
    // Slack 관련
    reactions?: any[];
    blocks?: any[];
    replies?: LinkedItem[]; // 스레드 replies
    parentTs?: string; // replies의 경우 부모 메시지 ts
    
    [key: string]: any;
  };
};

/**
 * 단일 참조(링크) 관계
 * - targetId: 연결된 다른 LinkedItem의 id
 * - rel: 관계 유형
 * - confidence: 신뢰도 점수 (0~1)
 * - via: 링크 추론 방식 (URL/번호/텍스트/휴리스틱 등)
 */
export type Reference = {
  targetId: string;
  rel: "mentions" | "refers" | "fixes" | "closes" | "duplicates" | "thread_root" | "belongs_to";
  confidence: number;
  via?: "url" | "number" | "text" | "merge_commit" | "unfurl" | "heuristic";
};

/**
 * 그래프 탐색용 엣지 표현 (references와 거의 동일하나 전역 색인용)
 */
export type LinkEdge = {
  sourceId: string;
  targetId: string;
  rel: Reference["rel"];
  confidence: number;
  directed?: boolean; // 기본 true
};


export type RepoKpi = {
  repo: string; // owner/name
  commits: number;
  closedPRs: number;
  issuesOpened: number;
  issuesClosed: number;
  meanTimeToMergeHours?: number;
};

export type UserRepoKpi = {
  user: string;
  repo: string; // owner/name
  commits: number;
  prsMerged: number;
  issuesOpened: number;
  issuesClosed: number; 
  cases: string[]; // cases list
};

export type CaseKpi = {
  case: string;
  repo: string;
  commits: number;
};

export type KpiSnapshot = {
  overall: {
    commits: number;
    closedPRs: number;
    issuesOpened: number;
    issuesClosed: number;
    engagement?: number; // slack reactions/threads aggregated
  };
  perRepo: RepoKpi[];
  perUser: UserRepoKpi[];
  perCase: CaseKpi[];
};

export type RankedHighlight = {
  clusterId: string;
  title: string;
  summary?: string | null;
  audience: "internal" | "engineering" | "product" | "leadership" | "all";
  score: number;                  // 최종 점수 (간단 명료)
  parts: {                        // 점수 근거 (설명가능성)
    base: number;                 // 토픽 자체 점수
    kpiFactor: number;            // KPI로 가중
    bonuses: number;              // 하드룰/작은 보너스
    penalties: number;            // 반복/잡음 패널티
  };
  meta: {
    topic: z.infer<typeof Cluster>["topic"];
    impact: z.infer<typeof Cluster>["impact"];
    caseId?: string;              // "#12345" 같은 케이스 아이디
    repo?: string;                // KPI에서 유추된 repo
  };
  items: z.infer<typeof Cluster>["items"];
  messages?: LinkedItem[];
  url?: string;
};

export type GithubHighlightMetaJson = {
  range: string;
  totalCommits: number;
  commitsByDeveloper: { developer: string; commits: number }[];
  commitsByCase: { case: string; commits: number }[];
  commitsByKind: { kind: string; commits: number }[];
};

/** One top-user entry: name + the single metric (nums) that defines that badge */
export type TopUserActivityItem = {
  name: string;
  nums: number;
};

/** Array of single-key objects: { TopContributor?: item }, { TopDeveloper?: item }, ... */
export type TopUserActivity = Array<Partial<Record<string, TopUserActivityItem>>>;

export type ChatroomActivityMetaJson = {
  range: string;
  activities: {
    channelName: string;
    messageCount: number;
    reactionCount: number;
    topicCount: number;
  }[];
  topUserActivity?: TopUserActivity;
};

export type ChatroomHighlightMetaJson = {
  range: string;
  clusterId: string;
  summary: string;
  audience: "internal" | "engineering" | "product" | "leadership" | "all";
  score: number;
  meta: {
    topic: z.infer<typeof Cluster>["topic"];
    impact: z.infer<typeof Cluster>["impact"];
    caseId?: string; 
    repo?: string;
  };
  items: z.infer<typeof Cluster>["items"];
  messages?: LinkedItem[];
};

