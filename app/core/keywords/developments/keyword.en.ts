export const GREETINGS = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you'";
export const RELEASE_VERSION_CUES = "'v[0-9.]+', 'Release vX.Y.Z', 'module created', 'deploy', 'release'";
export const INCIDENT_CUES = "'Sev-1', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error','Sev-2','Redmine'";
export const BUGFIX_CUES = "'hotfix', 'fix', 'bug', 'patch', 'correction'";
export const DECISION_CUES = "'decision', 'agreement', 'approval'";
export const SECURITY_CUES = "'password', 'security', 'permission', 'vulnerability'";
export const REFACOR_CUES = "'refactor', 'optimization', 'query'";
export const Q_A_CUES = "'can we', 'please confirm', 'question'";
export const ANNOUNCEMENT_CUES = "'<!channel>', 'announcement', 'notice'";
export const OTHER_CUES = "'minor', 'non-classifiable'";
export const CRITICAL_KEYWORDS = `${RELEASE_VERSION_CUES}, ${INCIDENT_CUES}, ${BUGFIX_CUES}, ${SECURITY_CUES}`;

export const KEYWORD_DETECTION_RULES = `
- Incident: ${INCIDENT_CUES}.
- Release: ${RELEASE_VERSION_CUES}.
- Bugfix: ${BUGFIX_CUES}.
- Decision: ${DECISION_CUES}.
- Security: ${SECURITY_CUES}.
- Refactor: ${REFACOR_CUES}.
- Q&A: ${Q_A_CUES}.
- Announcement: ${ANNOUNCEMENT_CUES}.
`;


// 1) Ongoing (상태)
export const TODAYS_WORK_CUES = "'Today's work', 'Daily work', 'Today’s tasks', 'Daily status'";
export const NEXT_TASKS_CUES = "'Next tasks', 'Next steps', 'Planned tasks'";
export const COMPLETED_CUES = "'Completed', 'Done', 'Finished'";
export const PENDING_CUES = "'Pending', 'On hold', 'Waiting'";
export const IN_REVIEW_STATUS_CUES = "'In review', 'Under review', 'Reviewing'"; // 상태형 리뷰
export const KEYWORD_ONGOING_WORK = `
- Today's work: ${TODAYS_WORK_CUES}.
- Next tasks: ${NEXT_TASKS_CUES}.
- Completed: ${COMPLETED_CUES}.
- Pending: ${PENDING_CUES}.
- In review (status): ${IN_REVIEW_STATUS_CUES}.
`;

// 2) Roadmap (제품/버전 마일스톤)
export const DEPLOY_MILESTONE_CUES = "'Deploy', 'Deployment', 'Rollout'"; // 제품 배포 이벤트
export const RELEASE_MILESTONE_CUES = "'Release', 'Launch', 'GA'";
export const DEADLINE_PRODUCT_CUES = "'Feature freeze', 'Code freeze', 'Cutoff'"; // 제품/릴리스 맥락의 컷오프
export const KEYWORD_ROADMAP = `
- Release: ${RELEASE_MILESTONE_CUES}.
- Deploy: ${DEPLOY_MILESTONE_CUES}.
- Deadline (product/freeze): ${DEADLINE_PRODUCT_CUES}.
`;

// 3) Upcoming (예약된 일정)
export const MEETING_REGULAR_CUES = "'Standup', 'Regular meeting', 'Recurring meeting', 'Monthly MTG'";
export const RETRO_CUES = "'Retro', 'Retrospective'";
export const REVIEW_MEETING_CUES = "'Review session', 'Design review', 'Spec review', 'Code review meeting'"; // 회의형 리뷰
export const PLANNING_CUES = "'Planning', 'Sprint Planning'";
export const MEETING_CUES = "'Meeting', 'MTG', 'Sync'";
export const DEADLINE_SCHEDULE_CUES = "'Deadline', 'Due date'"; // **개인/프로세스 마감 일정**(캘린더에 올라오는 due)
export const KEYWORD_UPCOMING = `
- Meeting: ${MEETING_CUES}.
- Regular: ${MEETING_REGULAR_CUES}.
- Retro: ${RETRO_CUES}.
- Review (meeting): ${REVIEW_MEETING_CUES}.
- Planning: ${PLANNING_CUES}.
- Deadline (schedule): ${DEADLINE_SCHEDULE_CUES}.
`;
