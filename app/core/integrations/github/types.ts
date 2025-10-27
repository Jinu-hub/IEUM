export type Repo = {
  owner: string;
  name: string;
};

export type UserInfo = {
  login: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

export type CommitInfo = {
  sha: string;
  message: string;
  author: string;
  html_url: string;
  date: string;
  userInfo?: UserInfo;
};

export type PRInfo = {
  number: number;
  title: string;
  user: string;
  html_url: string;
  merged_at: string;
  userInfo?: UserInfo;
  closes?: string[];
  closed_at?: string | null;
  merge_commit_sha?: string;
};

export type IssueInfo = {
  number: number;
  title: string;
  user: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  closed_at?: string | null;
  userInfo?: UserInfo;
};

export type FetchedRepoData = {
  repo: Repo;
  commits: CommitInfo[];
  closedPRs: PRInfo[];
  openedIssues: IssueInfo[];
  closedIssues: IssueInfo[];
};


