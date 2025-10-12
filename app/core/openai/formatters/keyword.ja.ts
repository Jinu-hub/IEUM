export const GREETINGS_JA = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you', 'やあ', 'おはよう', 'こんにちは', 'ありがとう', 'ありがと', 'さようなら', 'バイバイ', 'またね'";
export const RELEASE_VERSION_CUES_JA = "'v[0-9.]+', 'Release vX.Y.Z', 'module created', 'deploy', 'release', 'リリース vX.Y.Z', 'モジュール作成', 'デプロイ', 'リリース'";
export const INCIDENT_CUES_JA = "'Sev-1', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error','Sev-2','Redmine', '最優先', '例外', 'インシデント', '障害', 'システムエラー', '失敗', 'エラー', '異常'";
export const BUGFIX_CUES_JA = "'hotfix', 'fix', 'bug', 'patch', 'correction', 'ホットフィックス', '修正', 'バグ', 'パッチ', '訂正'";
export const DECISION_CUES_JA = "'decision', 'agreement', 'approval', '決定', '合意', '承認'";
export const SECURITY_CUES_JA = "'password', 'security', 'permission', 'パスワード', 'セキュリティ', '権限'";
export const REFACOR_CUES_JA = "'refactor', 'optimization', 'query', 'リファクタリング', '最適化', 'クエリ'";
export const Q_A_CUES_JA = "'can we', 'please confirm', 'question', 'できますか', '確認お願いします', '質問'";
export const ANNOUNCEMENT_CUES_JA = "'<!channel>', 'announcement', 'notice', 'アナウンス', '通知', 'お知らせ'";
export const OTHER_CUES_JA = "'minor', 'non-classifiable', '軽微', '分類不可'";
export const CRITICAL_KEYWORDS_JA = `${RELEASE_VERSION_CUES_JA}, ${INCIDENT_CUES_JA}, ${BUGFIX_CUES_JA}, ${SECURITY_CUES_JA}`;

export const KEYWORD_DETECTION_RULES_JA = `
- Incident: ${INCIDENT_CUES_JA}.
- Release: ${RELEASE_VERSION_CUES_JA}.
- Bugfix: ${BUGFIX_CUES_JA}.
- Decision: ${DECISION_CUES_JA}.
- Security: ${SECURITY_CUES_JA}.
- Refactor: ${REFACOR_CUES_JA}.
- Q&A: ${Q_A_CUES_JA}.
- Announcement: ${ANNOUNCEMENT_CUES_JA}.
`;