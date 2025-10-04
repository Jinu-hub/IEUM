/**
 * GitHub Data Formatter - Multi-language Support
 */
import type { FetchedRepoData } from "~/core/integrations/github/types";
import type { SupportedLanguage } from "../templates";

/**
 * 언어별 라벨 정의
 */
const LABELS: Record<SupportedLanguage, {
  repository: string;
  commits: string;
  mergedPRs: string;
  openedIssues: string;
  closedIssues: string;
}> = {
  en: {
    repository: 'Repository',
    commits: 'Commits',
    mergedPRs: 'Merged PRs',
    openedIssues: 'Opened Issues',
    closedIssues: 'Closed Issues',
  },
  ko: {
    repository: '저장소',
    commits: '커밋',
    mergedPRs: '병합된 PR',
    openedIssues: '열린 이슈',
    closedIssues: '닫힌 이슈',
  },
  ja: {
    repository: 'リポジトリ',
    commits: 'コミット',
    mergedPRs: 'マージされたPR',
    openedIssues: 'オープンイシュー',
    closedIssues: 'クローズイシュー',
  },
};

/**
 * GitHub 데이터를 언어에 맞게 포맷팅
 * @param repos - GitHub 저장소 데이터 배열
 * @param language - 출력 언어 (기본값: 'en')
 * @returns 포맷팅된 텍스트
 */
export function formatGithubData(
  repos: FetchedRepoData[], 
  language: SupportedLanguage = 'en'
): string {
  const labels = LABELS[language];
  
  return repos
    .map((repo) => {
      // Commits 섹션
      const commitsSection = repo.commits && repo.commits.length > 0
        ? repo.commits
            .slice(0, 5)
            .map((c) => `  - ${c.message} (${c.author}, ${c.date})`)
            .join("\n")
        : '  - (No commits)';

      // Merged PRs 섹션
      const prsSection = repo.mergedPRs && repo.mergedPRs.length > 0
        ? repo.mergedPRs
            .slice(0, 5)
            .map((pr) => `  - #${pr.number}: ${pr.title} by ${pr.user}`)
            .join("\n")
        : '  - (No merged PRs)';

      // Opened Issues 섹션
      const openedIssuesSection = repo.openedIssues && repo.openedIssues.length > 0
        ? repo.openedIssues
            .slice(0, 5)
            .map((i) => `  - #${i.number}: ${i.title}`)
            .join("\n")
        : '  - (No opened issues)';

      // Closed Issues 섹션
      const closedIssuesSection = repo.closedIssues && repo.closedIssues.length > 0
        ? repo.closedIssues
            .slice(0, 5)
            .map((i) => `  - #${i.number}: ${i.title}`)
            .join("\n")
        : '  - (No closed issues)';

      return `
### 📁 ${labels.repository}: ${repo.repo.name}

- **${labels.commits} (${repo.commits?.length || 0})**:
${commitsSection}

- **${labels.mergedPRs} (${repo.mergedPRs?.length || 0})**:
${prsSection}

- **${labels.openedIssues} (${repo.openedIssues?.length || 0})**:
${openedIssuesSection}

- **${labels.closedIssues} (${repo.closedIssues?.length || 0})**:
${closedIssuesSection}
`;
    })
    .join("\n");
}

