export const GREETINGS_KO = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you', '안녕', '좋은 아침', '안녕하세요', '감사합니다', '고마워', '안녕히 가세요', '잘가', '또 봐'";
export const RELEASE_VERSION_CUES_KO = "'v[0-9.]+', 'Release vX.Y.Z', 'module created', 'deploy', 'release', '릴리스 vX.Y.Z', '모듈 생성', '배포', '릴리스'";
export const INCIDENT_CUES_KO = "'Sev-1', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error','Sev-2','Redmine', '최우선', '예외', '인시던트', '장애', '시스템 오류', '실패', '에러', '이상'";
export const BUGFIX_CUES_KO = "'hotfix', 'fix', 'bug', 'patch', 'correction', '핫픽스', '수정', '버그', '패치', '정정'";
export const DECISION_CUES_KO = "'decision', 'agreement', 'approval', '결정', '합의', '승인'";
export const SECURITY_CUES_KO = "'password', 'security', 'permission', '비밀번호', '보안', '권한'";
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