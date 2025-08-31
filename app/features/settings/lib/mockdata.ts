import type { TargetData, MailListData, MailListMemberData } from "../lib/types";

// 샘플 데이터
export const sampleTargets: TargetData[] = [
    {
      targetId: "1",
      displayName: "주간 기술 뉴스",
      isActive: true,
      scheduleCron: "0 9 * * 1", // 매주 월요일 9시
      lastSentAt: "2025-01-13T09:00:00Z",
      mailingListName: "Tech Newsletter",
      timezone: "Asia/Seoul"
    },
    {
      targetId: "2",
      displayName: "월간 제품 업데이트",
      isActive: true,
      scheduleCron: "0 10 1 * *", // 매월 1일 10시
      lastSentAt: "2025-01-01T10:00:00Z",
      mailingListName: "Product Updates",
      timezone: "Asia/Seoul"
    },
    {
      targetId: "3",
      displayName: "긴급 공지사항",
      isActive: false,
      scheduleCron: undefined,
      lastSentAt: "2024-12-15T14:30:00Z",
      mailingListName: "Emergency Alerts",
      timezone: "Asia/Seoul"
    }
  ];

  // 메일링 리스트 샘플 데이터
export const sampleMailingLists = [
    { id: '1', name: 'Tech Newsletter' },
    { id: '2', name: 'Product Updates' },
    { id: '3', name: 'Emergency Alerts' },
    { id: '4', name: 'Weekly Digest' },
  ];
  
  // 인테그레이션 샘플 데이터
  export const sampleIntegrations = [
    { id: '1', name: 'GitHub', type: 'github' },
    { id: '2', name: 'Slack', type: 'slack' },
  ];
  
  // GitHub 레포지토리 샘플 데이터
  export const sampleGitHubRepos = [
    { id: '1', name: 'facebook/react' },
    { id: '2', name: 'microsoft/vscode' },
    { id: '3', name: 'vercel/next.js' },
  ];
  
  // Slack 채널 샘플 데이터
  export const sampleSlackChannels = [
    { id: '1', name: '#general' },
    { id: '2', name: '#development' },
    { id: '3', name: '#announcements' },
  ];
  
  // 스케줄 타입
  export const scheduleTypes = [
    { value: 'manual', label: '수동 발송' },
    { value: 'daily', label: '매일' },
    { value: 'weekly', label: '매주' },
    { value: 'monthly', label: '매월' },
    { value: 'custom', label: '직접 입력 (Cron)' },
  ];
  
  // 요일 옵션
  export const weekdays = [
    { value: '1', label: '월요일' },
    { value: '2', label: '화요일' },
    { value: '3', label: '수요일' },
    { value: '4', label: '목요일' },
    { value: '5', label: '금요일' },
    { value: '6', label: '토요일' },
    { value: '0', label: '일요일' },
  ];
  
  // 시간 옵션 (24시간 형식)
  export const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i.toString(),
    label: `${i.toString().padStart(2, '0')}시`
  }));
  
  // 분 옵션 (15분 단위)
  export const minutes = Array.from({ length: 4 }, (_, i) => ({
    value: (i * 15).toString(),
    label: `${(i * 15).toString().padStart(2, '0')}분`
  }));
  
  // 월 일자 옵션
  export const monthDays = Array.from({ length: 28 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `${i + 1}일`
  }));

// 메일 리스트 샘플 데이터 (확장)
export const sampleMailLists: MailListData[] = [
  {
    mailingListId: "1",
    workspaceId: "workspace-1",
    name: "Tech Newsletter",
    description: "최신 기술 동향과 개발 소식을 전하는 뉴스레터",
    createdAt: "2024-12-01T09:00:00Z",
    memberCount: 1250
  },
  {
    mailingListId: "2", 
    workspaceId: "workspace-1",
    name: "Product Updates",
    description: "제품 업데이트와 새로운 기능 소개",
    createdAt: "2024-11-15T10:00:00Z",
    memberCount: 850
  },
  {
    mailingListId: "3",
    workspaceId: "workspace-1", 
    name: "Emergency Alerts",
    description: "긴급 공지사항 및 중요 알림",
    createdAt: "2024-10-20T14:30:00Z",
    memberCount: 2100
  },
  {
    mailingListId: "4",
    workspaceId: "workspace-1",
    name: "Weekly Digest", 
    description: "주간 요약 및 하이라이트",
    createdAt: "2025-01-05T08:00:00Z",
    memberCount: 680
  },
  {
    mailingListId: "5",
    workspaceId: "workspace-1",
    name: "Marketing Updates",
    description: "마케팅 캠페인 및 이벤트 소식",
    createdAt: "2024-12-10T11:00:00Z", 
    memberCount: 420
  }
];

// 메일 리스트 멤버 샘플 데이터
export const sampleMailListMembers: MailListMemberData[] = [
  {
    mailingListId: "1",
    email: "john.doe@example.com",
    displayName: "John Doe",
    metaJson: { source: "signup_form", tags: ["developer", "senior"] },
    createdAt: "2024-12-15T09:30:00Z"
  },
  {
    mailingListId: "1", 
    email: "jane.smith@company.com",
    displayName: "Jane Smith",
    metaJson: { source: "import", tags: ["manager", "frontend"] },
    createdAt: "2024-12-12T14:20:00Z"
  },
  {
    mailingListId: "1",
    email: "mike.wilson@tech.io",
    displayName: "Mike Wilson", 
    metaJson: { source: "api", tags: ["backend", "junior"] },
    createdAt: "2024-12-10T16:45:00Z"
  },
  {
    mailingListId: "1",
    email: "sarah.johnson@startup.com",
    displayName: "Sarah Johnson",
    metaJson: { source: "signup_form", tags: ["fullstack", "lead"] },
    createdAt: "2024-12-08T11:15:00Z"
  },
  {
    mailingListId: "1",
    email: "alex.brown@design.co",
    displayName: "Alex Brown",
    metaJson: { source: "import", tags: ["designer", "ui"] },
    createdAt: "2024-12-05T13:00:00Z"
  },
  {
    mailingListId: "2",
    email: "tom.davis@product.com",
    displayName: "Tom Davis",
    metaJson: { source: "signup_form", tags: ["product_manager"] },
    createdAt: "2024-11-20T10:00:00Z"
  },
  {
    mailingListId: "2",
    email: "lisa.garcia@company.org",
    displayName: "Lisa Garcia", 
    metaJson: { source: "api", tags: ["analyst"] },
    createdAt: "2024-11-18T15:30:00Z"
  }
];

// 샘플 이메일 HTML 데이터
export const sampleEmailHTML = {
  techNewsletter: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>주간 기술 뉴스레터</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .news-item { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; }
        .news-item:last-child { border-bottom: none; }
        .news-title { color: #2c3e50; font-size: 20px; font-weight: 600; margin-bottom: 10px; }
        .news-excerpt { color: #6c757d; line-height: 1.6; margin-bottom: 15px; }
        .news-meta { color: #adb5bd; font-size: 14px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 10px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
        .social-links { margin-top: 20px; }
        .social-links a { display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 주간 기술 뉴스레터</h1>
            <p>2025년 1월 20일 - 최신 기술 동향과 개발 소식</p>
        </div>
        
        <div class="content">
            <div class="news-item">
                <h2 class="news-title">React 19 새로운 기능 발표</h2>
                <p class="news-excerpt">React 팀이 React 19의 새로운 기능들을 발표했습니다. Concurrent Features, Server Components, 그리고 성능 개선사항들이 포함되어 있습니다.</p>
                <div class="news-meta">📅 2025.01.18 | 🔗 React Blog</div>
                <a href="#" class="cta-button">자세히 보기</a>
            </div>
            
            <div class="news-item">
                <h2 class="news-title">TypeScript 5.4 베타 릴리즈</h2>
                <p class="news-excerpt">TypeScript 5.4 베타 버전이 공개되었습니다. 새로운 타입 시스템 개선과 성능 향상, 그리고 개발자 경험 개선이 주요 특징입니다.</p>
                <div class="news-meta">📅 2025.01.17 | 🔗 TypeScript Blog</div>
                <a href="#" class="cta-button">자세히 보기</a>
            </div>
            
            <div class="news-item">
                <h2 class="news-title">Next.js 15 App Router 개선사항</h2>
                <p class="news-excerpt">Next.js 15에서 App Router의 성능이 크게 향상되었습니다. 번들 크기 최적화와 로딩 속도 개선이 주요 업데이트입니다.</p>
                <div class="news-meta">📅 2025.01.16 | 🔗 Vercel Blog</div>
                <a href="#" class="cta-button">자세히 보기</a>
            </div>
            
            <div class="news-item">
                <h2 class="news-title">AI 개발 도구 동향</h2>
                <p class="news-excerpt">GitHub Copilot, Amazon CodeWhisperer 등 AI 기반 개발 도구들이 개발자 생산성을 크게 향상시키고 있습니다. 실제 사용 사례와 팁을 공유합니다.</p>
                <div class="news-meta">📅 2025.01.15 | 🔗 Tech Trends</div>
                <a href="#" class="cta-button">자세히 보기</a>
            </div>
        </div>
        
        <div class="footer">
            <p>이 뉴스레터는 매주 월요일 오전 9시에 발송됩니다.</p>
            <div class="social-links">
                <a href="#">GitHub</a>
                <a href="#">Twitter</a>
                <a href="#">LinkedIn</a>
                <a href="#">Blog</a>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                구독 해지 | 개인정보 처리방침 | 문의하기
            </p>
        </div>
    </div>
</body>
</html>
  `,
  
  productUpdate: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>제품 업데이트 소식</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .update-item { margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #ff6b6b; }
        .update-title { color: #2c3e50; font-size: 18px; font-weight: 600; margin-bottom: 10px; }
        .update-description { color: #6c757d; line-height: 1.6; margin-bottom: 15px; }
        .update-meta { color: #adb5bd; font-size: 14px; }
        .feature-list { margin: 20px 0; }
        .feature-list li { margin-bottom: 8px; color: #495057; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 10px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 제품 업데이트 소식</h1>
            <p>2025년 1월 - 새로운 기능과 개선사항</p>
        </div>
        
        <div class="content">
            <div class="update-item">
                <h2 class="update-title">📱 모바일 앱 v2.1.0 출시</h2>
                <p class="update-description">사용자 경험을 크게 향상시키는 새로운 기능들이 추가되었습니다.</p>
                <ul class="feature-list">
                    <li>✨ 다크 모드 지원</li>
                    <li>🚀 성능 최적화 및 로딩 속도 개선</li>
                    <li>🔔 푸시 알림 설정 개선</li>
                    <li>📊 새로운 분석 대시보드</li>
                </ul>
                <div class="update-meta">📅 2025.01.20 | 🔗 App Store</div>
                <a href="#" class="cta-button">업데이트하기</a>
            </div>
            
            <div class="update-item">
                <h2 class="update-title">💻 웹 대시보드 개선</h2>
                <p class="update-description">웹 대시보드의 사용성과 시각적 요소가 전면 개편되었습니다.</p>
                <ul class="feature-list">
                    <li>🎨 새로운 디자인 시스템 적용</li>
                    <li>📱 반응형 레이아웃 개선</li>
                    <li>🔍 고급 검색 및 필터링 기능</li>
                    <li>📈 실시간 데이터 시각화</li>
                </ul>
                <div class="update-meta">📅 2025.01.18 | 🔗 웹사이트</div>
                <a href="#" class="cta-button">확인하기</a>
            </div>
            
            <div class="update-item">
                <h2 class="update-title">🔧 API v3.0 베타 테스트</h2>
                <p class="update-description">더 빠르고 안정적인 API 서비스가 베타 테스트를 시작합니다.</p>
                <ul class="feature-list">
                    <li>⚡ GraphQL 지원 추가</li>
                    <li>🔒 향상된 보안 기능</li>
                    <li>📊 상세한 사용량 통계</li>
                    <li>🌐 Webhook 지원</li>
                </ul>
                <div class="update-meta">📅 2025.01.15 | 🔗 개발자 문서</div>
                <a href="#" class="cta-button">베타 참여하기</a>
            </div>
        </div>
        
        <div class="footer">
            <p>더 자세한 정보는 공식 웹사이트를 방문해주세요.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                문의하기 | 개발자 문서 | 상태 페이지
            </p>
        </div>
    </div>
</body>
</html>
  `,
  
  emergencyAlert: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>긴급 공지사항</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .alert-box { background-color: #fff5f5; border: 2px solid #fed7d7; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .alert-title { color: #c53030; font-size: 18px; font-weight: 600; margin-bottom: 10px; }
        .alert-content { color: #2d3748; line-height: 1.6; }
        .important { background-color: #fffaf0; border-color: #fbd38d; }
        .important .alert-title { color: #d69e2e; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 15px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 긴급 공지사항</h1>
            <p>2025년 1월 20일 - 즉시 확인이 필요한 중요 알림</p>
        </div>
        
        <div class="content">
            <div class="alert-box important">
                <h2 class="alert-title">⚠️ 계정 보안 강화 요청</h2>
                <p class="alert-content">최근 보안 위협이 감지되어 모든 사용자의 계정 보안을 강화해야 합니다. 2단계 인증을 활성화하고 비밀번호를 변경해주세요.</p>
                <a href="#" class="cta-button">보안 설정하기</a>
            </div>
            
            <div class="alert-box">
                <h2 class="alert-title">🔒 시스템 점검 안내</h2>
                <p class="alert-content">2025년 1월 22일 오전 2시부터 4시까지 시스템 점검이 진행됩니다. 이 시간 동안 서비스 이용이 제한될 수 있습니다.</p>
                <a href="#" class="cta-button">상세 일정 보기</a>
            </div>
            
            <div class="alert-box">
                <h2 class="alert-title">📱 앱 업데이트 필수</h2>
                <p class="alert-content">보안 취약점이 발견되어 최신 버전으로 업데이트가 필수입니다. 앱스토어에서 최신 버전을 다운로드해주세요.</p>
                <a href="#" class="cta-button">업데이트하기</a>
            </div>
        </div>
        
        <div class="footer">
            <p>긴급한 문의사항이 있으시면 즉시 고객지원팀에 연락해주세요.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                고객지원 | 보안 가이드 | 상태 페이지
            </p>
        </div>
    </div>
</body>
</html>
  `
};