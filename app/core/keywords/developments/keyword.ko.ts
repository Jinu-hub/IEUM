export const GREETINGS_KO = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you', '안녕', '좋은 아침', '안녕하세요', '감사합니다', '고마워', '안녕히 가세요', '잘가', '또 봐'";
export const RELEASE_VERSION_CUES_KO = "'v[0-9.]+', 'Release vX.Y.Z', 'module created', 'deploy', 'release', '릴리스 vX.Y.Z', '모듈 생성', '배포', '릴리스'";
export const INCIDENT_CUES_KO = "'Sev-1', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error','Sev-2','Redmine', '최우선', '예외', '인시던트', '장애', '시스템 오류', '실패', '에러', '이상'";
export const BUGFIX_CUES_KO = "'hotfix', 'fix', 'bug', 'patch', 'correction', '핫픽스', '수정', '버그', '패치', '정정'";
export const DECISION_CUES_KO = "'decision', 'agreement', 'approval', '결정', '합의', '승인'";
export const SECURITY_CUES_KO = "'password', 'security', 'permission', '비밀번호', '보안', '권한', '취약점'";
export const REFACOR_CUES_KO = "'refactor', 'optimization', 'query', '리팩토링', '최적화', '쿼리'";
export const Q_A_CUES_KO = "'can we', 'please confirm', 'question', '할 수 있나요', '확인 부탁드립니다', '질문'";
export const ANNOUNCEMENT_CUES_KO = "'<!channel>', 'announcement', 'notice', '공지', '알림', '안내'";
export const OTHER_CUES_KO = "'minor', 'non-classifiable', '경미', '분류 불가'";
export const CRITICAL_KEYWORDS_KO = `${RELEASE_VERSION_CUES_KO}, ${INCIDENT_CUES_KO}, ${BUGFIX_CUES_KO}, ${SECURITY_CUES_KO}`;

export const KEYWORD_DETECTION_RULES_KO = `
- Incident: ${INCIDENT_CUES_KO}.
- Release: ${RELEASE_VERSION_CUES_KO}.
- Bugfix: ${BUGFIX_CUES_KO}.
- Decision: ${DECISION_CUES_KO}.
- Security: ${SECURITY_CUES_KO}.
- Refactor: ${REFACOR_CUES_KO}.
- Q&A: ${Q_A_CUES_KO}.
- Announcement: ${ANNOUNCEMENT_CUES_KO}.
`;


// 1) Ongoing (상태)
export const TODAYS_WORK_CUES_KO = "'Today's work', 'Daily work', 'Today's tasks', 'Daily status', '오늘의 작업', '금일 작업', '일일 작업', '오늘의 태스크', '일일 상황'";
export const NEXT_TASKS_CUES_KO = "'Next tasks', 'Next steps', 'Planned tasks', '다음 태스크', '다음 단계', '예정 태스크', '예정된 태스크'";
export const COMPLETED_CUES_KO = "'Completed', 'Done', 'Finished', '완료', '완료됨', '종료'";
export const PENDING_CUES_KO = "'Pending', 'On hold', 'Waiting', '보류', '보류 중', '대기 중'";
export const IN_REVIEW_STATUS_CUES_KO = "'In review', 'Under review', 'Reviewing', '리뷰 중', '확인 중', '검토 중'";
export const KEYWORD_ONGOING_WORK_KO = `
- Today's work: ${TODAYS_WORK_CUES_KO}.
- Next tasks: ${NEXT_TASKS_CUES_KO}.
- Completed: ${COMPLETED_CUES_KO}.
- Pending: ${PENDING_CUES_KO}.
- In review (status): ${IN_REVIEW_STATUS_CUES_KO}.
`;

// 2) Roadmap (제품/버전 마일스톤)
export const DEPLOY_MILESTONE_CUES_KO = "'Deploy', 'Deployment', 'Rollout', '배포', '디플로이먼트', '롤아웃'"; 
export const RELEASE_MILESTONE_CUES_KO = "'Release', 'Launch', 'GA', '릴리스', '런치', '정식 출시'";
export const DEADLINE_PRODUCT_CUES_KO = "'Feature freeze', 'Code freeze', 'Cutoff', '중지', '동결', '마감', '기능 동결'";
export const KEYWORD_ROADMAP_KO = `
- Release: ${RELEASE_MILESTONE_CUES_KO}.
- Deploy: ${DEPLOY_MILESTONE_CUES_KO}.
- Deadline (product/freeze): ${DEADLINE_PRODUCT_CUES_KO}.
`;

// 3) Upcoming (예약된 일정)
export const MEETING_REGULAR_CUES_KO = "'Standup', 'Regular meeting', 'Recurring meeting', 'Monthly MTG', '스탠드업', '정례 회의', '정기 회의', '월간 MTG'";
export const RETRO_CUES_KO = "'Retro', 'Retrospective', '회고', '회고회'";
export const REVIEW_MEETING_CUES_KO = "'Review session', 'Design review', 'Spec review', 'Code review meeting', '리뷰 회의', '디자인 리뷰', '사양 리뷰', '코드 리뷰 회의'"; 
export const PLANNING_CUES_KO = "'Planning', 'Sprint Planning', '계획', '스프린트 계획'";
export const MEETING_CUES_KO = "'Meeting', 'MTG', 'Sync', '회의', '미팅', '싱크'";
export const DEADLINE_SCHEDULE_CUES_KO = "'Deadline', 'Due date', '마감', '기한'"; 
export const KEYWORD_UPCOMING_KO = `
- Meeting: ${MEETING_CUES_KO}.
- Regular: ${MEETING_REGULAR_CUES_KO}.
- Retro: ${RETRO_CUES_KO}.
- Review (meeting): ${REVIEW_MEETING_CUES_KO}.
- Planning: ${PLANNING_CUES_KO}.
- Deadline (schedule): ${DEADLINE_SCHEDULE_CUES_KO}.
`;