

// GitHub 개발자별 커밋 데이터
export const gitHubCommitsByDeveloper = [
    { name: 'Alice', commits: 89, additions: 2341, deletions: 892 },
    { name: 'Bob', commits: 67, additions: 1892, deletions: 743 },
    { name: 'Charlie', commits: 54, additions: 1543, deletions: 621 },
    { name: 'David', commits: 43, additions: 1234, deletions: 489 },
    { name: 'Eve', commits: 32, additions: 891, deletions: 334 }
  ];
  
  // GitHub 레포별 커밋 데이터
  export const gitHubCommitsByRepo = [
    { name: 'nexletter-frontend', value: 156, color: '#5E6AD2' },
    { name: 'nexletter-backend', value: 98, color: '#7C89F9' },
    { name: 'nexletter-admin', value: 67, color: '#9BA7FF' },
    { name: 'nexletter-mobile', value: 34, color: '#B8C1FF' }
  ];
  
  // GitHub 라벨별 이슈 데이터
  export const gitHubIssuesByLabel = [
    { name: 'bug', value: 23, color: '#EF4444' },
    { name: 'feature', value: 45, color: '#10B981' },
    { name: 'enhancement', value: 18, color: '#F59E0B' },
    { name: 'documentation', value: 12, color: '#3B82F6' },
    { name: 'question', value: 8, color: '#6B7280' }
  ];
  
  // Slack 채널별 메시지 데이터 (최근 7일)
  export const slackChannelActivity = [
    { date: '월', general: 45, development: 62, design: 23, random: 18 },
    { date: '화', general: 52, development: 71, design: 31, random: 25 },
    { date: '수', general: 48, development: 89, design: 27, random: 22 },
    { date: '목', general: 67, development: 94, design: 35, random: 19 },
    { date: '금', general: 71, development: 103, design: 42, random: 28 },
    { date: '토', general: 23, development: 34, design: 12, random: 31 },
    { date: '일', general: 19, development: 28, design: 8, random: 27 }
  ];
  
  // 뉴스레터 발송/열람률 데이터 (최근 4주)
  export const newsletterMetrics = [
    { week: '1주전', sent: 1250, opened: 876, clickRate: 67.2 },
    { week: '2주전', sent: 1180, opened: 826, clickRate: 65.8 },
    { week: '3주전', sent: 1320, opened: 921, clickRate: 69.8 },
    { week: '4주전', sent: 1090, opened: 763, clickRate: 62.1 }
  ];