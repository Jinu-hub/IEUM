import { useTranslation } from 'react-i18next';
import { Button } from '~/core/components/ui/button';

const buildBaseStyles = (fontFamily: string) => `
    <style>
/* General */
body {
    margin: 0;
    padding: 20px;
    background-color: #f8f9fa;
    font-family: ${fontFamily};
    color: #2c3e50;
    line-height: 1.8;
    -webkit-text-size-adjust: none;
    text-align: left;
}
.email-wrap {
    max-width: 700px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
    text-align: left;
}
.inner {
    padding: 28px 32px;
    text-align: left;
}

/* Header */
.header {
    background: linear-gradient(135deg, #5E6AD2 0%, #4C5BC7 100%);
    color: #ffffff;
    text-align: center;
    padding: 28px 20px;
}
.header h1 {
    margin: 0 0 6px 0;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
}
.header .date {
    margin: 0;
    font-size: 16px;
    opacity: 0.95;
    font-weight: 500;
}

/* Summary */
.summary {
    background: linear-gradient(90deg, rgba(94,106,210,0.06) 0%, rgba(76,91,199,0.03) 100%);
    border-left: 5px solid #5E6AD2;
    padding: 35px 40px;
    margin: 20px 16px;
    border-radius: 6px;
    color: #495057;
    text-align: left;
}
.summary h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #2c3e50;
}

/* Sections */
.content {
    padding: 18px 24px 32px 24px;
    text-align: left;
}
.section {
    margin-bottom: 50px;
    text-align: left;
}
.section-title {
    font-size: 18px;
    margin: 0 0 14px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e9ecef;
    color: #2c3e50;
    font-weight: 700;
    text-align: center;
}

/* KPI Table */
.kpi-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 14px;
    font-size: 15px;
}
.kpi-table th,
.kpi-table td {
    padding: 10px 12px;
    border: 1px solid #e9ecef;
    text-align: left;
    vertical-align: top;
}
.kpi-table thead th {
    background-color: #f1f3ff;
    font-weight: 700;
    color: #2c3e50;
}
.kpi-note {
    margin-top: 12px;
    color: #495057;
    font-size: 14px;
}

/* Highlight cards */
.highlight-card {
    background-color: #f8f9fa;
    border-left: 5px solid #5E6AD2;
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 16px;
    text-align: left;
}
.highlight-card h3 {
    margin: 4px 0 8px 0;
    font-size: 16px;
}
.highlight-card p {
    margin: 0 0 8px 0;
    color: #495057;
    font-size: 14px;
}
.quote-box {
    background-color: #ffffff;
    border-left: 4px solid rgba(94,106,210,0.12);
    padding: 12px 14px;
    margin-top: 10px;
    border-radius: 6px;
    color: #495057;
    font-size: 14px;
    text-align: left;
}
.quote-box p {
    margin: 6px 0;
}

/* Topics cards */
.topic-grid {
    display: block;
    text-align: left;
}
.topic-card {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 12px;
    text-align: left;
}
.topic-card h4 {
    margin: 0 0 6px 0;
    font-size: 15px;
}
.topic-card p {
    margin: 0;
    color: #495057;
    font-size: 14px;
}

/* Roadmap / Progress */
.road-card {
    background-color: #fafbfd;
    border-radius: 8px;
    padding: 14px;
    margin-bottom: 12px;
    border: 1px solid #eef0ff;
    text-align: left;
}
.road-meta {
    color: #6c757d;
    font-size: 13px;
    margin-top: 8px;
}
/* Progress bar - Yahoo Mail compatible */
.nl-progress-bar {
    background-color: #e9ecef;
    height: 8px;
    border-radius: 8px;
    margin-top: 10px;
    max-width: 100%;
}
.nl-progress-fill {
    background: linear-gradient(90deg, #5E6AD2 0%, #4C5BC7 100%);
    height: 8px;
    border-radius: 8px;
    max-width: 100%;
    display: block;
}
.roadmap-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    font-size: 14px;
    text-align: left;
}
.roadmap-table th, .roadmap-table td {
    padding: 8px 10px;
    border: 1px solid #e9ecef;
    text-align: left;
    vertical-align: top;
}
.roadmap-table thead th {
    background-color: #f8f9ff;
    font-weight: 700;
}

/* Member activity */
.member-item {
    padding: 12px 0;
    border-bottom: 1px dashed #e9ecef;
    display: table;
    width: 100%;
    text-align: left;
}
.member-left {
    display: table-cell;
    width: 44px;
    vertical-align: top;
    padding-right: 12px;
}
.member-emoji {
    font-size: 28px;
    line-height: 1;
}
.member-right {
    display: table-cell;
    vertical-align: top;
    text-align: left;
}
.member-name {
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 6px 0;
    font-size: 14px;
}
.member-desc {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

/* Closing */
.closing {
    background: linear-gradient(90deg, rgba(76,91,199,0.04) 0%, rgba(94,106,210,0.03) 100%);
    border-left: 5px solid #5E6AD2;
    padding: 22px 28px;
    border-radius: 6px;
    color: #495057;
    text-align: left;
}
.closing h2 {
    margin: 0 0 8px 0;
    font-size: 18px;
}
.closing p {
    margin: 6px 0;
}
.closing-quote {
    background-color: #ffffff;
    border-left: 5px solid #5E6AD2;
    padding: 12px 14px;
    margin-top: 12px;
    border-radius: 6px;
    color: #495057;
    font-size: 14px;
    text-align: left;
}

/* Footer */
.footer {
    background-color: #2c3e50;
    color: #adb5bd;
    padding: 18px 16px;
    font-size: 13px;
    text-align: center;
}
.footer a {
    color: #5E6AD2;
    text-decoration: none;
    font-weight: 600;
}

/* Responsive tweaks */
@media only screen and (max-width: 480px) {
    .inner { padding: 18px 16px; }
    .summary { padding: 22px 18px; margin: 16px 10px; }
    .header h1 { font-size: 24px; }
    .header .date { font-size: 14px; }
    .member-left { width: 40px; }
}
    </style>
`;

export const samplesHTML = {
    letter_ja: `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>週次Newsletter — 2025-11-16 ~ 2025-11-23</title>
    ${buildBaseStyles("-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif")}
</head>
<body>
    <div class="email-wrap">
        <div class="inner">
            <div class="header">
                <h1>👋 週次Newsletter</h1>
                <h3 class="date">2024-03-10 ~ 2024-03-17</h3>
            </div>

            <div class="summary">
                <h2>👋 週次サマリー</h2>
                <p>今週はv2.3モジュールのリリース完了とメインブランチのv3.0への切り替えが大きな節目となりました。特にタスク#12345を中心に、チームの着実なコミットが45回に達し、⚪︎⚪︎さんの18コミット、△△さんの13コミットを含む7名が活発に貢献しています。データ処理機能の不具合修正は複数のタスクが完了し、仕様確認や動作議論も活発に交わされるなど、高い品質意識がうかがえました。</p>
                <p>進捗報告では70件超のタスク共有と15名の参加で、安定した運用が支えられています。次期バージョンリリースへ向けたスケジュール調整も進行し、3月25日から28日にかけて集中したコミットが予定されています。次週に控える重要案件対応やリリース準備に向け、各メンバーが役割を持ちつつ連携を強化している点も注目です。</p>
                <p>本号では、バージョン切り替えの詳細経緯やデータ処理機能の技術的な進捗、さらにチームメンバーそれぞれの活動状況まで掘り下げています。チームの取り組みとそれを支える皆さんの努力が見える内容をぜひご覧ください。</p>
            </div>

            <div class="content">

                <div class="section">
                    <h2 class="section-title">📊 KPIサマリー</h2>

                    <table class="kpi-table" role="table" cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>指標</th>
                                <th>数値</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>コミット数</td>
                                <td><strong>45</strong></td>
                            </tr>
                            <tr>
                                <td>マージ済みPR数</td>
                                <td><strong>4</strong></td>
                            </tr>
                            <tr>
                                <td>クローズされた課題</td>
                                <td><strong>0</strong></td>
                            </tr>
                            <tr>
                                <td>アクティブ参加者</td>
                                <td><strong>7</strong></td>
                            </tr>
                            <tr>
                                <td>最多コミット案件</td>
                                <td>#12345 (20)</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="kpi-note">今週は総計45コミット、4件のPRがマージされました。主要貢献者は××さん（8コミット）、⚪︎⚪︎さん（18コミット）、△△さん（13コミット）で、特にタスク#12345の活動が顕著です。これにより、機能改善と不具合修正が着実に前進しています。</p>
                </div>

                <div class="section">
                    <h2 class="section-title">✨ ハイライト</h2>

                    <div class="highlight-card">
                        <h3>🚀 v2.3リリース完了とv3.0への切り替え</h3>
                        <p>3月15日にv2.3モジュールのリリースが完了し、メインブランチは正式にv3.0へ切り替わりました。第1グループから順にコミットが進み、次期バージョン対応が必要な場合のコミットも並行して行われています。</p>

                        <div class="quote-box">
                            <p><strong>◎◎さん:</strong></p>
                            <p>「v2.3リリース完了、皆様のおかげです。本日からメインブランチはv3.0へ。第1グループから優先的にコミットお願いします。」</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>◎◎さん:</strong></p>
                            <p>「第1グループのメインコミットが終了したため、以降は任意のタイミングでコミット可能です。」</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🛠 データ処理機能の不具合修正の進捗</h3>
                        <p>データ処理機能の再計算に関する不具合修正が複数完了し、再計算フラグ制御やデータ履歴の刷新に注力しています。担当者間で細かな仕様確認と動作検証が繰り返され、高品質な対応を目指しています。</p>

                        <div class="quote-box">
                            <p><strong>××さん:</strong></p>
                            <p>対応項目6-2のNo7（再計算後クリア）、No28（総合スコア）は開発完了。No31-32は本日中にコミット予定です。</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>△△さん:</strong></p>
                            <p>複数チケット（#23456、#12345）完了。No.26は対応中。</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>××さん:</strong></p>
                            <p>「データ履歴クリア時の連携制御は複雑ですが、慎重に実装中です。」</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🗓 次期バージョンリリース向けコミット順とスケジュール調整</h3>
                        <p>次期バージョンリリースに向けて修正対応のバージョン統一とスケジュールが確定。3月25日～28日の作業完了を目標に、担当者間でコミット順や納期調整を共有しています。</p>

                        <div class="quote-box">
                            <p><strong>▼▼さん:</strong></p>
                            <p>「修正対応リストの次期バージョンは『v3.0.1_0001』で対応お願いします。」</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>△△さん:</strong></p>
                            <p>「重要案件は3/27対応で了承済み。3/21は休みなので一部対応厳しいです。」</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>××さん:</strong></p>
                            <p>「3/25デプロイ予定ですが量が多く3/28までずれ込む見込み。3/24,25は休みです。」</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>▼▼さん:</strong></p>
                            <p>「メインブランチは次期バージョンに切り替え済。コミット順は◇◇さん→△△さん→××さんで。」</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">🧭 トピック</h2>

                    <div class="topic-grid">
                        <div class="topic-card">
                            <h4>🐛 バグ修正</h4>
                            <p>Null参照エラーやフォーム入力検証の不具合対応など、中規模バグを計8件修正。少数精鋭で重要課題に集中しました。</p>
                        </div>

                        <div class="topic-card">
                            <h4>🔐 セキュリティ</h4>
                            <p>認証ポリシーの初期値修正方針変更に関する議論が4件行われ、高い重要度で対応が進行中です。</p>
                        </div>

                        <div class="topic-card">
                            <h4>⚙️ 機能改修</h4>
                            <p>画面表示の高速化やクエリ最適化、認証ポリシー改修をはじめ計11件の中規模機能改修が活発に進んでいます。</p>
                        </div>

                        <div class="topic-card">
                            <h4>🚧 進捗報告</h4>
                            <p>70件のタスク報告と15名の参加で、タスク管理・ミーティング調整が円滑に共有され、安定運営を支えています。</p>
                        </div>

                        <div class="topic-card">
                            <h4>🗂 仕様決定</h4>
                            <p>複数チケットの仕様確認やデータベース設計のベストプラクティス共有など、中規模仕様決定が進展しています。</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">⚙ 進行中 / ロードマップ / 予定</h2>

                    <div class="road-card">
                        <h3>基盤グループ開発タスク</h3>
                        <p>データベースIDの枯渇問題やNull参照エラーの修正を中心に複数タスクを対応中。☆☆さん、◆◆さんが次フェーズを担当。</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 65%;"></div>
                        </div>
                        <div class="road-meta">進捗: 65%</div>
                    </div>

                    <div class="road-card">
                        <h3>#34567 履歴データ自動削除機能</h3>
                        <p>基本機能が動作中。▽▽さんが3月26日までに時間指定タスクを完成させ、レビューに移る予定です。</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 70%;"></div>
                        </div>
                        <div class="road-meta">進捗: 70% — 期日: 3月26日までに</div>
                    </div>

                    <div class="road-card">
                        <h3>修正対応リスト第7弾</h3>
                        <p>一部チケット完了。××さんが3月28日までにテスト・スケジュール調整を実施します。</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 20%;"></div>
                        </div>
                        <div class="road-meta">進捗: 20% — 期日: 3月28日まで</div>
                    </div>

                    <div class="road-card">
                        <h3>ロードマップ</h3>
                        <p><strong>次期バージョン初回リリース準備期間</strong> 2024-03-21〜03-28 — 修正対応リストの対応を集中実施し、一部調整対応を行います。</p>
                        <p><strong>4月中旬までに新機能仕様確認・実装完了予定</strong> 2024-03-21〜04-15 — 仕様確認が進行中。一部機能は未完のまま継続開発。</p>

                        <div class="road-meta">今後の予定を参照</div>

                        <div style="margin-top:12px;">
                            <strong>今後の予定:</strong>
                            <ul>
                                <li>2024-03-21：#34567 ダッシュボード機能開発テストミーティング</li>
                                <li>2024-03-25〜27：重要案件対応期間</li>
                                <li>2024-04-01：4月リリース版 デプロイウィンドウ開始</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">💬 メンバー活動</h2>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">⚙️</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">▽▽さん</p>
                            <p class="member-desc">履歴データ自動削除機能の設計・実装をリード。3月26日レビューを目標に開発中。外部API連携対応も進め、健康管理に気を配りつつチーム連携良好。</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🚀</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">◎◎さん</p>
                            <p class="member-desc">v2.3リリース完了とダッシュボードウィジェットのDB構成共有を実施。チーム間の仕様調整を円滑に進め、安定した進捗管理を達成。</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📋</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">▲▲さん</p>
                            <p class="member-desc">申請管理の出力仕様情報共有と複製コード設計に注力。複数メンバーと連携し、認識齟齬を解消しながら仕様調整を安定推進。</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📊</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">●●さん</p>
                            <p class="member-desc">ダッシュボード資料用レビューチェックシート作成を完了し、仕様説明を担当。軽度の体調不良があったものの計画的に進捗。</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🔒</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">■■さん</p>
                            <p class="member-desc">認証ポリシー初期値修正を完遂し、3/28のレビューを目標に据える。性能改善タスクも着手し、クライアント関連の調整を推進。</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🛠</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">⚪︎⚪︎さん</p>
                            <p class="member-desc">修正対応リスト対応を継続し、品質改善調査やエラー画面改善に貢献。情報共有を活発化し優先順位の調整を実施。</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <div class="closing">
                        <h2>🎉 おわりに</h2>
                        <p>🍵 4月初回リリースに向けた修正対応リスト第7弾の準備が着実に整いつつあります。⚪︎⚪︎さんの精力的なコードコミットや◎◎さんの丁寧なメッセージ対応、▽▽さんの積極的なチーム連携が、今週のチームの勢いをさらに高めています。皆さんの地道な努力が明日の成果につながっていることを実感できる週となりました。</p>
                        <p>来週も重要な案件対応やリリース準備が続きますが、チーム一丸となって前進していきましょう。良い週末をお迎えください！</p>

                        <div class="closing-quote">
                            <p><strong>💬 今週の言葉：</strong></p>
                            <p>「コードは動いて初めて完成と言える。テストとリファクタリングはその通過点だ。」</p>
                            <p>― チームの成長と品質向上への強い意識を表す一言です。</p>
                        </div>
                    </div>
                </div>

            </div>

            <div class="footer">
                <p>このメールは自動生成されています。</p>
                <p>© 2025 チームニュースレター. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
    letter_en: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Newsletter — March 10, 2024 ~ March 17, 2024</title>
    ${buildBaseStyles("-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif")}
</head>
<body>
    <div class="email-wrap">
        <div class="inner">
            <div class="header">
                <h1>👋 Weekly Newsletter</h1>
                <h3 class="date">March 10, 2024 ~ March 17, 2024</h3>
            </div>

            <div class="summary">
                <h2>👋 Weekly Summary</h2>
                <p>This week marked a significant milestone with the completion of v2.3 module release and the transition of the main branch to v3.0. Centered around Task #12345, the team achieved 45 commits with active contributions from 7 members, including 18 commits from Member A and 13 commits from Member B. Multiple data processing bug fixes were completed, with active specification reviews and operational discussions demonstrating our high quality standards.</p>
                <p>Progress reports included over 70 task updates with 15 participants, supporting stable operations. Schedule coordination for the next version release is progressing, with concentrated commits planned from March 25 to 28. Team members are strengthening collaboration while taking on individual roles for critical project handling and release preparation in the coming week.</p>
                <p>This issue covers the detailed background of version switching, technical progress on data processing features, and individual team member activities. Enjoy the content that showcases the team's efforts and everyone's hard work supporting it.</p>
            </div>

            <div class="content">

                <div class="section">
                    <h2 class="section-title">📊 KPI Summary</h2>

                    <table class="kpi-table" role="table" cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Total Commits</td>
                                <td><strong>45</strong></td>
                            </tr>
                            <tr>
                                <td>Merged PRs</td>
                                <td><strong>4</strong></td>
                            </tr>
                            <tr>
                                <td>Closed Issues</td>
                                <td><strong>0</strong></td>
                            </tr>
                            <tr>
                                <td>Active Contributors</td>
                                <td><strong>7</strong></td>
                            </tr>
                            <tr>
                                <td>Top Task by Commits</td>
                                <td>#12345 (20)</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="kpi-note">This week saw a total of 45 commits and 4 merged PRs. Top contributors were Member C (8 commits), Member A (18 commits), and Member B (13 commits), with particularly notable activity on Task #12345. This drives steady progress in feature improvements and bug fixes.</p>
                </div>

                <div class="section">
                    <h2 class="section-title">✨ Highlights</h2>

                    <div class="highlight-card">
                        <h3>🚀 v2.3 Release Complete & Transition to v3.0</h3>
                        <p>On March 15, the v2.3 module release was completed and the main branch officially transitioned to v3.0. Commits proceeded sequentially from Group 1, with parallel commits for next version support where needed.</p>

                        <div class="quote-box">
                            <p><strong>Member M:</strong></p>
                            <p>"v2.3 release complete, thanks to everyone. Main branch is now on v3.0. Group 1, please start committing with priority."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member M:</strong></p>
                            <p>"Group 1's main commits are complete, so commits can now proceed at any time."</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🛠 Progress on Data Processing Bug Fixes</h3>
                        <p>Multiple bug fixes related to data processing recalculation have been completed, focusing on recalculation flag control and data history refresh. Detailed specification reviews and operational verification are being repeated among team members to ensure high quality.</p>

                        <div class="quote-box">
                            <p><strong>Member C:</strong></p>
                            <p>Item 6-2 No7 (post-recalculation clear) and No28 (total score) development complete. No31-32 planned for commit today.</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member B:</strong></p>
                            <p>Multiple tickets (#23456, #12345) complete. No.26 in progress.</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member C:</strong></p>
                            <p>"Data history clearing coordination is complex, but implementing carefully."</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🗓 Commit Order & Schedule Coordination for Next Release</h3>
                        <p>Version unification and schedule for the next version release are confirmed. Team members are sharing commit order and deadline adjustments with the goal of completing work from March 25 to 28.</p>

                        <div class="quote-box">
                            <p><strong>Member Y:</strong></p>
                            <p>"Please handle next version fixes with 'v3.0.1_0001'."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member B:</strong></p>
                            <p>"Critical project approved for 3/27. Off on 3/21 so some responses difficult."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member C:</strong></p>
                            <p>"Deployment planned for 3/25 but may extend to 3/28 due to volume. Off on 3/24-25."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Member Y:</strong></p>
                            <p>"Main branch switched to next version. Commit order: Member D → Member B → Member C."</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">🧭 Topics</h2>

                    <div class="topic-grid">
                        <div class="topic-card">
                            <h4>🐛 Bug Fixes</h4>
                            <p>Fixed 8 medium-scale bugs including null reference errors and form validation issues. Focused team on critical issues.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🔐 Security</h4>
                            <p>4 discussions held on authentication policy default value changes, with high priority ongoing implementation.</p>
                        </div>

                        <div class="topic-card">
                            <h4>⚙️ Feature Improvements</h4>
                            <p>11 medium-scale feature improvements actively progressing, including screen rendering optimization, query optimization, and authentication policy updates.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🚧 Progress Reports</h4>
                            <p>70 task reports with 15 participants ensure smooth sharing of task management and meeting coordination, supporting stable operations.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🗂 Specifications</h4>
                            <p>Medium-scale specification decisions progressing, including multi-ticket spec reviews and database design best practice sharing.</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">⚙ In Progress / Roadmap / Plans</h2>

                    <div class="road-card">
                        <h3>Infrastructure Group Development Tasks</h3>
                        <p>Handling multiple tasks centered on database ID exhaustion and null reference error fixes. Member E and Member F will handle the next phase.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 65%;"></div>
                        </div>
                        <div class="road-meta">Progress: 65%</div>
                    </div>

                    <div class="road-card">
                        <h3>#34567 Auto-delete History Data Feature</h3>
                        <p>Basic functionality operational. Member G will complete time-based tasks by March 26 and move to review.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 70%;"></div>
                        </div>
                        <div class="road-meta">Progress: 70% — Due: By March 26</div>
                    </div>

                    <div class="road-card">
                        <h3>Fix List Round 7</h3>
                        <p>Some tickets complete. Member C will conduct testing and schedule coordination by March 28.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 20%;"></div>
                        </div>
                        <div class="road-meta">Progress: 20% — Due: By March 28</div>
                    </div>

                    <div class="road-card">
                        <h3>Roadmap</h3>
                        <p><strong>Next Version Initial Release Preparation</strong> March 21-28, 2024 — Concentrated implementation of fix list items with some adjustment support.</p>
                        <p><strong>New Feature Spec Review & Implementation Complete by Mid-April</strong> March 21 - April 15, 2024 — Spec review in progress. Some features continuing development incomplete.</p>

                        <div class="road-meta">See upcoming schedule</div>

                        <div style="margin-top:12px;">
                            <strong>Upcoming Schedule:</strong>
                            <ul>
                                <li>March 21, 2024: #34567 Dashboard Feature Development Test Meeting</li>
                                <li>March 25-27, 2024: Critical Project Response Period</li>
                                <li>April 1, 2024: April Release Version Deployment Window Start</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">💬 Member Activities</h2>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">⚙️</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member G</p>
                            <p class="member-desc">Leading design and implementation of auto-delete history data feature. Targeting March 26 review. Also progressing external API integration with attention to health while maintaining good team coordination.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🚀</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member M</p>
                            <p class="member-desc">Completed v2.3 release and shared dashboard widget DB structure. Facilitated smooth spec coordination between teams and achieved stable progress management.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📋</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member H</p>
                            <p class="member-desc">Focused on application management output spec sharing and duplicate code design. Coordinating with multiple members to resolve recognition gaps and steadily pushing spec adjustments.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📊</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member I</p>
                            <p class="member-desc">Completed dashboard resource review checklist creation and handled spec explanations. Made planned progress despite mild health issues.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🔒</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member J</p>
                            <p class="member-desc">Completed authentication policy default value fixes targeting 3/28 review. Also started performance improvement tasks and pushing client-related adjustments.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🛠</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">Member A</p>
                            <p class="member-desc">Continuing fix list responses and contributing to quality improvement research and error screen improvements. Activating information sharing and adjusting priorities.</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <div class="closing">
                        <h2>🎉 Closing</h2>
                        <p>🍵 Preparations for Fix List Round 7 toward the April initial release are steadily coming together. Member A's energetic code commits, Member M's careful message responses, and Member G's proactive team coordination are further boosting this week's team momentum. It's been a week where we can feel everyone's steady efforts leading to tomorrow's results.</p>
                        <p>Next week will continue with critical project responses and release preparations, but let's move forward together as one team. Have a great weekend!</p>

                        <div class="closing-quote">
                            <p><strong>💬 This Week's Words:</strong></p>
                            <p>"Code is only complete when it runs. Testing and refactoring are waypoints on that journey."</p>
                            <p>― Words expressing the team's strong commitment to growth and quality improvement.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div class="footer">
                <p>This email is automatically generated.</p>
                <p>© 2025 Team Newsletter. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `,
    letter_ko: `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>주간 뉴스레터 — 2024년 3월 10일 ~ 3월 17일</title>
    ${buildBaseStyles("-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif")}
</head>
<body>
    <div class="email-wrap">
        <div class="inner">
            <div class="header">
                <h1>👋 주간 뉴스레터</h1>
                <h3 class="date">2024년 3월 10일 ~ 3월 17일</h3>
            </div>

            <div class="summary">
                <h2>👋 주간 요약</h2>
                <p>이번 주는 v2.3 모듈 릴리스 완료와 메인 브랜치의 v3.0 전환이 큰 이정표가 되었습니다. 특히 태스크 #12345를 중심으로 팀의 꾸준한 커밋이 45회에 달했으며, A님의 18개 커밋, B님의 13개 커밋을 포함한 7명이 활발하게 기여했습니다. 데이터 처리 기능의 버그 수정은 여러 작업이 완료되었고, 사양 확인과 운영 논의도 활발하게 진행되어 높은 품질 의식을 엿볼 수 있었습니다.</p>
                <p>진행 상황 보고에서는 70건이 넘는 작업 공유와 15명의 참여로 안정적인 운영이 뒷받침되고 있습니다. 다음 버전 릴리스를 위한 일정 조정도 진행 중이며, 3월 25일부터 28일까지 집중적인 커밋이 예정되어 있습니다. 다음 주에 예정된 중요 프로젝트 대응과 릴리스 준비를 위해 각 멤버가 역할을 맡으면서 협업을 강화하고 있는 점도 주목할 만합니다.</p>
                <p>이번 호에서는 버전 전환의 상세한 배경과 데이터 처리 기능의 기술적 진척, 그리고 팀 멤버 각각의 활동 상황까지 깊이 있게 다룹니다. 팀의 노력과 이를 지원하는 여러분의 수고가 보이는 내용을 꼭 확인해 보세요.</p>
            </div>

            <div class="content">

                <div class="section">
                    <h2 class="section-title">📊 KPI 요약</h2>

                    <table class="kpi-table" role="table" cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th>지표</th>
                                <th>수치</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>커밋 수</td>
                                <td><strong>45</strong></td>
                            </tr>
                            <tr>
                                <td>병합된 PR 수</td>
                                <td><strong>4</strong></td>
                            </tr>
                            <tr>
                                <td>종료된 이슈</td>
                                <td><strong>0</strong></td>
                            </tr>
                            <tr>
                                <td>활성 참여자</td>
                                <td><strong>7</strong></td>
                            </tr>
                            <tr>
                                <td>최다 커밋 프로젝트</td>
                                <td>#12345 (20)</td>
                            </tr>
                        </tbody>
                    </table>

                    <p class="kpi-note">이번 주는 총 45개의 커밋과 4건의 PR이 병합되었습니다. 주요 기여자는 C님(8개 커밋), A님(18개 커밋), B님(13개 커밋)이며, 특히 태스크 #12345의 활동이 두드러졌습니다. 이를 통해 기능 개선과 버그 수정이 꾸준히 진전되고 있습니다.</p>
                </div>

                <div class="section">
                    <h2 class="section-title">✨ 하이라이트</h2>

                    <div class="highlight-card">
                        <h3>🚀 v2.3 릴리스 완료 및 v3.0으로 전환</h3>
                        <p>3월 15일에 v2.3 모듈 릴리스가 완료되었고, 메인 브랜치가 공식적으로 v3.0으로 전환되었습니다. 1그룹부터 순차적으로 커밋이 진행되었으며, 필요한 경우 다음 버전 대응을 위한 커밋도 병행되었습니다.</p>

                        <div class="quote-box">
                            <p><strong>M님:</strong></p>
                            <p>"v2.3 릴리스 완료, 모두 감사합니다. 오늘부터 메인 브랜치는 v3.0입니다. 1그룹부터 우선적으로 커밋 부탁드립니다."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>M님:</strong></p>
                            <p>"1그룹의 메인 커밋이 완료되어, 이제 언제든지 커밋 가능합니다."</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🛠 데이터 처리 기능 버그 수정 진행</h3>
                        <p>데이터 처리 재계산 관련 버그 수정이 여러 건 완료되었으며, 재계산 플래그 제어와 데이터 이력 갱신에 주력하고 있습니다. 담당자 간 세밀한 사양 확인과 운영 검증이 반복되고 있어 높은 품질을 목표로 하고 있습니다.</p>

                        <div class="quote-box">
                            <p><strong>C님:</strong></p>
                            <p>대응 항목 6-2의 No7(재계산 후 클리어), No28(총점)은 개발 완료. No31-32는 오늘 중 커밋 예정입니다.</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>B님:</strong></p>
                            <p>여러 티켓(#23456, #12345) 완료. No.26은 진행 중.</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>C님:</strong></p>
                            <p>"데이터 이력 클리어 시 연동 제어가 복잡하지만, 신중하게 구현 중입니다."</p>
                        </div>
                    </div>

                    <div class="highlight-card">
                        <h3>🗓 다음 버전 릴리스를 위한 커밋 순서 및 일정 조정</h3>
                        <p>다음 버전 릴리스를 위한 수정 대응의 버전 통일과 일정이 확정되었습니다. 3월 25일~28일의 작업 완료를 목표로 담당자 간 커밋 순서와 납기 조정을 공유하고 있습니다.</p>

                        <div class="quote-box">
                            <p><strong>Y님:</strong></p>
                            <p>"수정 대응 목록의 다음 버전은 'v3.0.1_0001'로 대응 부탁드립니다."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>B님:</strong></p>
                            <p>"중요 프로젝트는 3/27 대응으로 승인됨. 3/21은 휴무라 일부 대응 어렵습니다."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>C님:</strong></p>
                            <p>"3/25 배포 예정이지만 양이 많아 3/28까지 밀릴 것 같습니다. 3/24, 25는 휴무입니다."</p>
                        </div>

                        <div class="quote-box">
                            <p><strong>Y님:</strong></p>
                            <p>"메인 브랜치는 다음 버전으로 전환 완료. 커밋 순서는 D님 → B님 → C님으로."</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">🧭 토픽</h2>

                    <div class="topic-grid">
                        <div class="topic-card">
                            <h4>🐛 버그 수정</h4>
                            <p>Null 참조 오류 및 폼 입력 검증 문제 등 중규모 버그 8건 수정. 소수 정예로 중요 과제에 집중했습니다.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🔐 보안</h4>
                            <p>인증 정책 기본값 수정 방침 변경에 대한 논의 4건 진행, 높은 중요도로 대응 진행 중입니다.</p>
                        </div>

                        <div class="topic-card">
                            <h4>⚙️ 기능 개선</h4>
                            <p>화면 렌더링 최적화, 쿼리 최적화, 인증 정책 개선 등 총 11건의 중규모 기능 개선이 활발히 진행되고 있습니다.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🚧 진행 상황 보고</h4>
                            <p>70건의 작업 보고와 15명의 참여로 작업 관리 및 미팅 조정이 원활하게 공유되어 안정적인 운영을 지원하고 있습니다.</p>
                        </div>

                        <div class="topic-card">
                            <h4>🗂 사양 결정</h4>
                            <p>여러 티켓의 사양 확인 및 데이터베이스 설계 모범 사례 공유 등 중규모 사양 결정이 진전되고 있습니다.</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2 class="section-title">⚙ 진행 중 / 로드맵 / 계획</h2>

                    <div class="road-card">
                        <h3>기반 그룹 개발 태스크</h3>
                        <p>데이터베이스 ID 고갈 문제 및 Null 참조 오류 수정을 중심으로 여러 작업 대응 중. E님, F님이 다음 단계를 담당합니다.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 65%;"></div>
                        </div>
                        <div class="road-meta">진행률: 65%</div>
                    </div>

                    <div class="road-card">
                        <h3>#34567 히스토리 데이터 자동 삭제 기능</h3>
                        <p>기본 기능 작동 중. G님이 3월 26일까지 시간 지정 작업을 완성하고 리뷰로 이동 예정입니다.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 70%;"></div>
                        </div>
                        <div class="road-meta">진행률: 70% — 마감일: 3월 26일까지</div>
                    </div>

                    <div class="road-card">
                        <h3>수정 대응 목록 7차</h3>
                        <p>일부 티켓 완료. C님이 3월 28일까지 테스트 및 일정 조정을 실시합니다.</p>

                        <div class="nl-progress-bar">
                            <div class="nl-progress-fill" style="width: 20%;"></div>
                        </div>
                        <div class="road-meta">진행률: 20% — 마감일: 3월 28일까지</div>
                    </div>

                    <div class="road-card">
                        <h3>로드맵</h3>
                        <p><strong>다음 버전 첫 릴리스 준비 기간</strong> 2024년 3월 21일~28일 — 수정 대응 목록 대응을 집중 실시하고 일부 조정 대응을 진행합니다.</p>
                        <p><strong>4월 중순까지 신기능 사양 확인·구현 완료 예정</strong> 2024년 3월 21일~4월 15일 — 사양 확인 진행 중. 일부 기능은 미완성 상태로 계속 개발.</p>

                        <div class="road-meta">향후 계획 참조</div>

                        <div style="margin-top:12px;">
                            <strong>향후 일정:</strong>
                            <ul>
                                <li>2024년 3월 21일: #34567 대시보드 기능 개발 테스트 미팅</li>
                                <li>2024년 3월 25~27일: 중요 프로젝트 대응 기간</li>
                                <li>2024년 4월 1일: 4월 릴리스 버전 배포 윈도우 시작</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <h2 class="section-title">💬 멤버 활동</h2>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">⚙️</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">G님</p>
                            <p class="member-desc">히스토리 데이터 자동 삭제 기능의 설계 및 구현을 리드. 3월 26일 리뷰를 목표로 개발 중. 외부 API 연동 대응도 진행하며 건강 관리에 신경 쓰면서 팀 협업 양호.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🚀</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">M님</p>
                            <p class="member-desc">v2.3 릴리스 완료 및 대시보드 위젯 DB 구성 공유 실시. 팀 간 사양 조정을 원활하게 진행하고 안정적인 진행 관리 달성.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📋</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">H님</p>
                            <p class="member-desc">신청 관리 출력 사양 정보 공유 및 복제 코드 설계에 주력. 여러 멤버와 협력하여 인식 차이를 해소하며 사양 조정을 안정적으로 추진.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">📊</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">I님</p>
                            <p class="member-desc">대시보드 자료용 리뷰 체크리스트 작성 완료 및 사양 설명 담당. 가벼운 컨디션 난조가 있었지만 계획적으로 진행.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🔒</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">J님</p>
                            <p class="member-desc">인증 정책 기본값 수정을 완수하고 3/28 리뷰를 목표로 설정. 성능 개선 작업도 착수하고 클라이언트 관련 조정 추진.</p>
                        </div>
                    </div>

                    <div class="member-item">
                        <div class="member-left">
                            <div class="member-emoji">🛠</div>
                        </div>
                        <div class="member-right">
                            <p class="member-name">A님</p>
                            <p class="member-desc">수정 대응 목록 대응을 계속하고 품질 개선 조사 및 오류 화면 개선에 기여. 정보 공유를 활성화하고 우선순위 조정 실시.</p>
                        </div>
                    </div>

                </div>

                <div class="section">
                    <div class="closing">
                        <h2>🎉 마무리</h2>
                        <p>🍵 4월 첫 릴리스를 향한 수정 대응 목록 7차 준비가 착실히 진행되고 있습니다. A님의 정력적인 코드 커밋과 M님의 세심한 메시지 대응, G님의 적극적인 팀 협업이 이번 주 팀의 기세를 더욱 높이고 있습니다. 모두의 꾸준한 노력이 내일의 성과로 이어지고 있음을 실감할 수 있는 한 주였습니다.</p>
                        <p>다음 주에도 중요한 프로젝트 대응과 릴리스 준비가 계속되지만, 팀이 하나가 되어 전진해 나갑시다. 좋은 주말 보내세요!</p>

                        <div class="closing-quote">
                            <p><strong>💬 이번 주의 한마디:</strong></p>
                            <p>"코드는 동작해야 비로소 완성이다. 테스트와 리팩토링은 그 과정의 경유지다."</p>
                            <p>― 팀의 성장과 품질 향상에 대한 강한 의지를 표현하는 한마디입니다.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div class="footer">
                <p>이 이메일은 자동으로 생성되었습니다.</p>
                <p>© 2025 팀 뉴스레터. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `
}
export const meta = () => {
    return [{ title: `Samples | ${import.meta.env.VITE_APP_NAME}` }];
}

export default function Samples() {
    const { i18n } = useTranslation();
    const { t } = useTranslation("common", { keyPrefix: "common" });
    
    // 現在の言語に応じてニュースレターを選択
    const getNewsletterHTML = () => {
        switch (i18n.language) {
            case 'ja':
                return samplesHTML.letter_ja;
            case 'ko':
                return samplesHTML.letter_ko;
            case 'en':
            default:
                return samplesHTML.letter_en;
        }
    };

    // 言語に応じたテキスト
    const getLocalizedText = () => {
        switch (i18n.language) {
            case 'ja':
                return {
                    backButton: 'ホームに戻る',
                    title: 'サンプルニュースレター',
                    subtitle: '実際に送信されるニュースレターのプレビューです'
                };
            case 'ko':
                return {
                    backButton: '홈으로 돌아가기',
                    title: '샘플 뉴스레터',
                    subtitle: '실제로 발송되는 뉴스레터의 미리보기입니다'
                };
            case 'en':
            default:
                return {
                    backButton: 'Back to Home',
                    title: 'Sample Newsletter',
                    subtitle: 'Preview of the newsletter that will be sent'
                };
        }
    };

    const text = getLocalizedText();
    
    return (
        <div className="mx-auto w-full max-w-screen-xl space-y-6 px-5 py-10 md:px-10">
            {/* Navigation button to go back */}
            {/* Using window.history.back() instead of navigate(-1) to ensure proper */}
            {/* locale and auth state are preserved (avoiding prerendered page cache) */}
            <Button variant="outline" onClick={() => window.history.back()}>
                &larr; {t("back")}
            </Button>
            
            {/* ヘッダー */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[#0D0E10] dark:text-[#FFFFFF]">
                    {text.title}
                </h1>
                <p className="text-[#8B92B5] dark:text-[#6C6F7E]">
                    {text.subtitle}
                </p>
            </div>

            {/* ニュースレターのiframe表示 */}
            <div className="w-full border border-[#E1E4E8] dark:border-[#2C2D30] rounded-lg overflow-hidden shadow-lg">
                <iframe
                    srcDoc={getNewsletterHTML()}
                    className="w-full border-0"
                    style={{ minHeight: '800px', height: '100vh' }}
                    title="Newsletter Sample Preview"
                />
            </div>
        </div>
    )
}