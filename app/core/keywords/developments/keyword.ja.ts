export const GREETINGS_JA = "'hi', 'good morning', 'hello', 'thank you', 'thanks', 'goodbye', 'bye', 'see you', 'やあ', 'おはよう', 'こんにちは', 'ありがとう', 'ありがと', 'さようなら', 'バイバイ', 'またね'";
export const RELEASE_VERSION_CUES_JA = "'Release vX.Y.Z', 'module created', 'deploy', 'release', 'リリース vX.Y.Z', 'モジュール作成', 'デプロイ', 'リリース', 'リリースノート', 'リリース候補', '本番リリース', '本番投入', 'リリース予定', '出荷', 'ローンチ', '一般提供', 'バージョンリリース'";
export const INCIDENT_CUES_JA = "'Sev-1', 'Sev-2', 'P0', 'P1', 'P2', 'Exception', 'incident', 'outage', 'system error', 'failure', 'error', 'Redmine', '最優先', '例外', 'インシデント', '障害', '障害対応', '本番障害', 'システムエラー', '失敗', 'エラー', '異常', '緊急', '緊急対応', 'ダウン', '復旧', '重大障害'";
export const BUGFIX_CUES_JA = "'hotfix', 'fix', 'bug', 'patch', 'correction', 'ホットフィックス', '修正', 'バグ', 'パッチ', '訂正', 'バグ修正', '不具合', '不具合修正', '修正依頼', 'デバッグ', '回帰修正', '誤字修正', '事象', 'fixed', 'fixes'";
export const DECISION_CUES_JA = "'decision', 'agreement', 'approval', '決定', '合意', '承認'";
export const SECURITY_CUES_JA = "'password', 'security', 'permission', 'vulnerability', 'パスワード', 'セキュリティ', '権限', '脆弱性', '認証', '認可', 'CVE', 'XSS', 'CSRF', 'SQLインジェクション', '暗号化', 'トークン', 'OAuth', 'SSO', '監査', 'アクセス制御', 'シークレット', '認証情報', 'セキュリティ対応', 'セキュリティパッチ', 'CWE'";
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


// 1) Ongoing (상태)
export const TODAYS_WORK_CUES_JA = "'Today's work', 'Daily work', 'Today's tasks', 'Daily status', '今日の作業', '本日の作業', '日次作業', '今日のタスク', '日次状況'";
export const NEXT_TASKS_CUES_JA = "'Next tasks', 'Next steps', 'Planned tasks', '次のタスク', '次のステップ', '予定タスク', '予定しているタスク'";
export const COMPLETED_CUES_JA = "'Completed', 'Done', 'Finished', '完了', '完了', '完了'";
export const PENDING_CUES_JA = "'Pending', 'On hold', 'Waiting', '保留', '保留中', '待機中'";
export const IN_REVIEW_STATUS_CUES_JA = "'In review', 'Under review', 'Reviewing', 'レビュー中', '確認中', '確認中'";
export const KEYWORD_ONGOING_WORK_JA = `
- Today's work: ${TODAYS_WORK_CUES_JA}.
- Next tasks: ${NEXT_TASKS_CUES_JA}.
- Completed: ${COMPLETED_CUES_JA}.
- Pending: ${PENDING_CUES_JA}.
- In review (status): ${IN_REVIEW_STATUS_CUES_JA}.
`;

// 2) Roadmap (제품/버전 마일스톤)
export const DEPLOY_MILESTONE_CUES_JA = "'Deploy', 'Deployment', 'Rollout','デプロイ', 'デプロイメント', '展開'"; 
export const RELEASE_MILESTONE_CUES_JA = "'Release', 'Launch', 'GA','リリース', 'ローンチ', '一般提供'";
export const DEADLINE_PRODUCT_CUES_JA = "'Feature freeze', 'Code freeze', 'Cutoff', '中止', '凍結', '締切', '機能凍結'";
export const KEYWORD_ROADMAP_JA = `
- Release: ${RELEASE_MILESTONE_CUES_JA}.
- Deploy: ${DEPLOY_MILESTONE_CUES_JA}.
- Deadline (product/freeze): ${DEADLINE_PRODUCT_CUES_JA}.
`;

// 3) Upcoming (예약된 일정)
export const MEETING_REGULAR_CUES_JA = "'Standup', 'Regular meeting', 'Recurring meeting', 'Monthly MTG','スタンドアップ', '定例会議', '定期会議', '月次MTG'";
export const RETRO_CUES_JA = "'Retro', 'Retrospective', '振返り', '振返り会'";
export const REVIEW_MEETING_CUES_JA = "'Review session', 'Design review', 'Spec review', 'Code review meeting', 'レビュー会', 'デザインレビュー', '仕様レビュー', 'コードレビュー会'"; 
export const PLANNING_CUES_JA = "'Planning', 'Sprint Planning', '計画', 'スプリント計画'";
export const MEETING_CUES_JA = "'Meeting', 'MTG', 'Sync', '会議', 'ミーティング', '同期'";
export const DEADLINE_SCHEDULE_CUES_JA = "'Deadline', 'Due date', '締切', '期限'"; 
export const KEYWORD_UPCOMING_JA = `
- Meeting: ${MEETING_CUES_JA}.
- Regular: ${MEETING_REGULAR_CUES_JA}.
- Retro: ${RETRO_CUES_JA}.
- Review (meeting): ${REVIEW_MEETING_CUES_JA}.
- Planning: ${PLANNING_CUES_JA}.
- Deadline (schedule): ${DEADLINE_SCHEDULE_CUES_JA}.
`;
