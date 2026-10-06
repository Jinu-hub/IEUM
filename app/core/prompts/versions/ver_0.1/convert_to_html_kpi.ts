export const CONVERT_TO_HTML_KPI_INSTRUCTIONS = String.raw`
You are converting a **GitHub KPI-based weekly newsletter** (markdown) into a beautiful, responsive HTML email.

## 🎯 Purpose
Transform the markdown newsletter into production-ready HTML with professional styling, optimized for email delivery.

## 🧠 Your Task

You will receive markdown content from a GitHub KPI newsletter with this structure:

\`\`\`
# [Newsletter Title] — [Date Range]

## 👋 Opening Summary
[Introduction paragraph]

## 📊 KPI Summary
[KPI table + analysis]

## 🌟 Contributor Highlights
[Top contributors and achievements]

## 🔍 Case Activity
[Notable cases/issues]

## 📝 Closing
[Summary and appreciation]
\`\`\`

Convert each section to the corresponding HTML structure.

## ✍️ Required CSS Styles (Copy Exactly)

Include these exact styles in your <style> tag:

\`\`\`css
/* General */
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
}
\`\`\`

## 📐 HTML Document Structure

\`\`\`html
<!DOCTYPE html>
<html lang="{{LANGUAGE_CODE}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Newsletter Title] — [Date Range]</title>
    <style>
        [Include ALL CSS styles]
    </style>
</head>
<body>
    <div class="email-wrap">
        <div class="inner">
            <!-- Header: # [Title] — [Date] -->
            <div class="header">
                <h1>[Title without date]</h1>
                <p class="date">[Date Range]</p>
            </div>
            
            <!-- Opening Summary: ## 👋 Opening Summary -->
            <div class="summary">
                <h2>👋 [Section Title]</h2>
                <p>[Content paragraphs]</p>
            </div>
            
            <div class="content">
                <!-- KPI Summary: ## 📊 KPI Summary -->
                <div class="section">
                    <h2 class="section-title">📊 [Section Title]</h2>
                    <table class="kpi-table">
                        <thead>
                            <tr><th>[Header 1]</th><th>[Header 2]</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>[Metric]</td><td>[Value]</td></tr>
                        </tbody>
                    </table>
                    <p class="kpi-note">[Analysis text if any]</p>
                </div>
                
                <!-- Contributor Highlights: ## 🌟 Contributor Highlights -->
                <div class="section">
                    <h2 class="section-title">🌟 [Section Title]</h2>
                    <div class="contributor-card">
                        <h3><span class="contributor-rank">#1</span>[Name]</h3>
                        <p>[Achievement description]</p>
                    </div>
                    <!-- Repeat for each contributor -->
                </div>
                
                <!-- Case Activity: ## 🔍 Case Activity -->
                <div class="section">
                    <h2 class="section-title">🔍 [Section Title]</h2>
                    <div class="case-card">
                        <h4><span class="case-tag">[Case ID]</span>[Case Title]</h4>
                        <p>[Case description]</p>
                    </div>
                    <!-- Repeat for each case -->
                </div>
                
                <!-- Closing: ## 📝 Closing -->
                <div class="closing">
                    <h2>📝 [Section Title]</h2>
                    <p>[Closing message]</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>Generated by IEUM</p>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

## 🔄 Markdown to HTML Conversion Rules

**Headers:**
- \`# Title — Date\` → Split into \`<h1>Title</h1>\` + \`<p class="date">Date</p>\`
- \`## 👋 Section\` → \`<h2>👋 Section</h2>\` (keep emoji)
- \`## 📊 Section\` → \`<h2 class="section-title">📊 Section</h2>\`

**Tables:**
- Markdown tables → \`<table class="kpi-table">\`
- First row → \`<thead><tr><th>...</th></tr></thead>\`
- Other rows → \`<tbody><tr><td>...</td></tr></tbody>\`

**Text:**
- \`**bold**\` → \`<strong>bold</strong>\`
- \`*italic*\` → \`<em>italic</em>\`
- Paragraphs → \`<p>...</p>\`

**Lists:**
- \`- item\` → Convert to cards or \`<ul><li>item</li></ul>\`

**Contributors:**
- When listing ranked contributors (1., 2., 3. or Top N), use \`contributor-card\` with \`contributor-rank\`
- Example: "1. jinuSon: 7 commits" → card with rank badge

**Cases:**
- Case IDs (like #12345, CASE-123) → \`<span class="case-tag">#12345</span>\`
- Each case → \`case-card\` structure

**Emojis:**
- Keep all emojis as Unicode characters

## 🌐 Language Support

Set HTML \`lang\` attribute based on content language:
- Japanese → \`lang="ja"\`
- Korean → \`lang="ko"\`
- English → \`lang="en"\`

Do not translate any content.

## ✅ Final Checklist

1. ✅ Complete HTML document structure
2. ✅ All CSS styles included in <style>
3. ✅ All 5 sections converted (Header, Opening, KPI, Contributors, Cases, Closing)
4. ✅ Tables formatted with \`kpi-table\` class
5. ✅ Contributors use \`contributor-card\` with rank badges
6. ✅ Cases use \`case-card\` with case tags
7. ✅ All emojis preserved
8. ✅ Responsive design (max-width: 700px)
9. ✅ No unclosed HTML tags

**Output**: Return ONLY the complete HTML document. No explanations, no markdown code blocks wrapping the output.
`;

