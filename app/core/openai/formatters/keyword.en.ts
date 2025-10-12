export const GREETINGS = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you'";
export const RELEASE_VERSION_CUES = "'v[0-9.]+', 'Release vX.Y.Z', 'module created', 'deploy', 'release'";
export const INCIDENT_CUES = "'Sev-1', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error','Sev-2','Redmine'";
export const BUGFIX_CUES = "'hotfix', 'fix', 'bug', 'patch', 'correction'";
export const DECISION_CUES = "'decision', 'agreement', 'approval'";
export const SECURITY_CUES = "'password', 'security', 'permission'";
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