/**
 * 共通CSS - キャッシュされたスタイル
 * 各セクションのHTML変換で共有して使用
 */
export const COMMON_CSS = `/* General */
body {
    margin: 0;
    padding: 20px;
    background-color: #f8f9fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
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
}`;

/**
 * 共通のマークダウン→HTML変換ルール
 */
export const COMMON_CONVERSION_RULES = `
## Markdown to HTML Conversion Rules

**Text Formatting:**
- \`**bold**\` → \`<strong>bold</strong>\`
- \`*italic*\` → \`<em>italic</em>\`
- Line breaks preserved

**Lists:**
- \`- item\` → \`<ul><li>item</li></ul>\`

**Tables:**
- Markdown tables → HTML \`<table>\` with proper class

**Blockquotes:**
- \`> text\` → appropriate quote div

**Emojis:**
- Keep all emojis as Unicode characters
`;
