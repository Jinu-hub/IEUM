/**
 * KPI 전용 공통 CSS - 캐시된 스타일
 * GitHub KPI 뉴스레터용 스타일 정의
 * contributor-card, case-card 등 KPI 고유 컴포넌트 포함
 */
export const KPI_COMMON_CSS = `/* General */
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
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
}
.header .date {
    margin: 0;
    font-size: 15px;
    opacity: 0.95;
    font-weight: 500;
}

/* Summary */
.summary {
    background: linear-gradient(90deg, rgba(94,106,210,0.06) 0%, rgba(76,91,199,0.03) 100%);
    border-left: 5px solid #5E6AD2;
    padding: 28px 32px;
    margin: 20px 16px;
    border-radius: 6px;
    color: #495057;
    text-align: left;
}
.summary h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #2c3e50;
}
.summary p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
}

/* Sections */
.content {
    padding: 18px 24px 32px 24px;
    text-align: left;
}
.section {
    margin-bottom: 40px;
    text-align: left;
}
.section-title {
    font-size: 17px;
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
    font-size: 14px;
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

/* Contributor cards */
.contributor-card {
    background-color: #f8f9fa;
    border-left: 4px solid #5E6AD2;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 12px;
    text-align: left;
}
.contributor-card h3 {
    margin: 0 0 6px 0;
    font-size: 15px;
    color: #2c3e50;
}
.contributor-card p {
    margin: 0;
    color: #495057;
    font-size: 14px;
}
.contributor-rank {
    display: inline-block;
    background: linear-gradient(135deg, #5E6AD2 0%, #4C5BC7 100%);
    color: #ffffff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
}

/* Case cards */
.case-card {
    background-color: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 12px;
    text-align: left;
}
.case-card h4 {
    margin: 0 0 6px 0;
    font-size: 14px;
    color: #2c3e50;
}
.case-card p {
    margin: 0;
    color: #495057;
    font-size: 14px;
}
.case-tag {
    display: inline-block;
    background-color: #e9ecef;
    color: #495057;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    margin-right: 6px;
}

/* Closing */
.closing {
    background: linear-gradient(90deg, rgba(76,91,199,0.04) 0%, rgba(94,106,210,0.03) 100%);
    border-left: 5px solid #5E6AD2;
    padding: 20px 24px;
    border-radius: 6px;
    color: #495057;
    text-align: left;
}
.closing h2 {
    margin: 0 0 10px 0;
    font-size: 17px;
    color: #2c3e50;
}
.closing p {
    margin: 6px 0;
    font-size: 14px;
}

/* Footer */
.footer {
    background-color: #2c3e50;
    color: #adb5bd;
    padding: 16px;
    font-size: 12px;
    text-align: center;
}
.footer a {
    color: #5E6AD2;
    text-decoration: none;
    font-weight: 600;
}

/* Responsive */
@media only screen and (max-width: 480px) {
    .inner { padding: 18px 16px; }
    .summary { padding: 20px 16px; margin: 16px 10px; }
    .header h1 { font-size: 22px; }
    .header .date { font-size: 13px; }
}`;

/**
 * KPI 전용 공통 마크다운 → HTML 변환 규칙
 */
export const KPI_COMMON_CONVERSION_RULES = `
## Markdown to HTML Conversion Rules

**Text Formatting:**
- \`**bold**\` → \`<strong>bold</strong>\`
- \`*italic*\` → \`<em>italic</em>\`
- Line breaks preserved

**Tables:**
- Markdown tables → HTML \`<table>\` with proper class
- First row → \`<thead><tr><th>...</th></tr></thead>\`
- Other rows → \`<tbody><tr><td>...</td></tr></tbody>\`

**Lists:**
- \`- item\` → Convert to cards or \`<ul><li>item</li></ul>\`

**Emojis:**
- Keep all emojis as Unicode characters
`;
