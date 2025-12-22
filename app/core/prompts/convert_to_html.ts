export const CONVERT_TO_HTML_INSTRUCTIONS = String.raw`
You are converting a **finalized markdown newsletter** into a beautiful, responsive HTML email.

## 🎯 Purpose
Transform the markdown newsletter into production-ready HTML with professional styling, optimized for email delivery.

**Important**: This is a structural conversion task. Focus on accurate HTML generation with consistent styling.

## 🧠 Your Task

You will receive a \`sections\` object in the input containing markdown content for each newsletter section. Your job is to:

1. **Read markdown** from the input sections object (see section 2 for structure)
2. **Convert to HTML** using the conversion rules in section 4
3. **Apply CSS styles** - include all styles from section 1 in the \`<style>\` tag  
4. **Use correct class names** - as shown in section 3 structure (.header, .summary, .kpi-table, etc.)
5. **Generate complete HTML document** with proper structure (DOCTYPE, head, body)

The goal: A production-ready HTML email with consistent styling.

## ✍️ What to Do

### 1. Input Data Structure

You will receive a JSON input with a \`contents\` field containing a stringified \`sections\` object:

\`\`\`json
{
  "project": "all",
  "contents": "{\"header\":\"...\",\"summary\":\"...\",\"kpi\":\"...\", ...}"
}
\`\`\`

Parse the \`contents\` field to get the \`sections\` object with these properties (all containing markdown):

- **header**: Header section with title and date range
- **summary**: Summary section content
- **kpi**: KPI metrics section content
- **highlights**: Highlights section content
- **topics**: Topics section content
- **ongoing**: Ongoing/Roadmap section content
- **memberActivity**: Member activity section content
- **closing**: Closing section content

All sections contain markdown text that you need to convert to HTML.

### 2. Required CSS Styles (Copy Exactly)

You MUST include these exact styles in your <style> tag:

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
\`\`\`

### 3. HTML Document Structure

Use the markdown content from the input \`sections\` object to generate the following HTML structure:

\`\`\`html
<!DOCTYPE html>
<html lang="{{LANGUAGE_CODE}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Newsletter Title with date range — e.g., "Weekly Newsletter — 2025-12-8 ~ 2025-12-15" (en), "週次Newsletter — 2025-12-8 ~ 2025-12-15" (ja), "주간 뉴스레터 — 2025-12-8 ~ 2025-12-15" (ko)]</title>
    <style>
        [Include ALL CSS styles from section 1]
    </style>
</head>
<body>
    <div class="email-wrap">
        <div class="inner">
            <!-- Use sections.header → Convert to: 
                 Extract the main title from markdown (usually # Title format).
                 The title should include emoji and text (e.g., "Weekly Newsletter" (en), "週次Newsletter" (ja), "주간 뉴스레터" (ko)).
                 Remove any date range or timeframe text from the title for <h1>.
                 Extract date range separately for <h3 class="date">.
                 
                 Examples:
                 - EN: "# Weekly Newsletter — 2025-12-8 ~ 2025-12-15" → <h1>Weekly Newsletter</h1> + <h3 class="date">2025-12-8 ~ 2025-12-15</h3>
                 - JA: "# 👋 週次Newsletter — 2025-12-8 ~ 2025-12-15" → <h1>👋 週次Newsletter</h1> + <h3 class="date">2025-12-8 ~ 2025-12-15</h3>
                 - KO: "# 주간 뉴스레터 — 2025-12-8 ~ 2025-12-15" → <h1>주간 뉴스레터</h1> + <h3 class="date">2025-12-8 ~ 2025-12-15</h3>
                 
                 <div class="header">
                   <h1>[Full title with emoji and text — date range removed]</h1>
                   <h3 class="date">[Date range extracted separately]</h3>
                 </div>
            -->
            
            <!-- Use sections.summary → Convert to: 
                 <div class="summary">
                   <h2>[Title]</h2>
                   <p>[Paragraphs]</p>
                 </div>
            -->
            
            <div class="content">
                <!-- Use sections.kpi → Convert to: 
                     <div class="section">
                       <h2 class="section-title">[Title]</h2>
                       <table class="kpi-table">...</table>
                       <p class="kpi-note">[Note]</p>
                     </div>
                -->
                
                <!-- Use sections.highlights → Convert to: 
                     <div class="section">
                       <h2 class="section-title">[Title]</h2>
                       <div class="highlight-card">
                         <h3>[Title with emoji]</h3>
                         <p>[Description]</p>
                         <div class="quote-box">[Conversations]</div>
                       </div>
                     </div>
                -->
                
                <!-- Use sections.topics → Convert to: 
                     <div class="section">
                       <h2 class="section-title">[Title]</h2>
                       <div class="topic-grid">
                         <div class="topic-card">
                           <h4>[Title with emoji]</h4>
                           <p>[Description]</p>
                         </div>
                       </div>
                     </div>
                -->
                
                <!-- Use sections.ongoing → Convert to: 
                     <div class="section">
                       <h2 class="section-title">[Title]</h2>
                       <div class="road-card">
                         <h3>[Item title]</h3>
                         <p>[Description]</p>
                         
                         <!-- If progress percentage exists in markdown -->
                         <div class="nl-progress-bar">
                           <div class="nl-progress-fill" style="width: XX%;"></div>
                         </div>
                         <div class="road-meta">[Progress text]: XX% — [Date/status]</div>
                         
                         <!-- If no progress, only date -->
                         <div class="road-meta">[Date/status]</div>
                       </div>
                     </div>
                -->
                
                <!-- Use sections.memberActivity → Convert to: 
                     <div class="section">
                       <h2 class="section-title">[Title]</h2>
                       <div class="member-item">
                         <div class="member-left">
                           <div class="member-emoji">[Emoji]</div>
                         </div>
                         <div class="member-right">
                           <p class="member-name">[Name]</p>
                           <p class="member-desc">[Activity]</p>
                         </div>
                       </div>
                     </div>
                -->
                
                <!-- Use sections.closing → Convert to: 
                     <div class="closing">
                       <h2>[Title]</h2>
                       <p>[Message paragraphs]</p>
                       <div class="closing-quote">[Quote if present]</div>
                     </div>
                -->
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>[Auto-generated message]</p>
                <p>[Copyright notice]</p>
            </div>
        </div>
    </div>
</body>
</html>
\`\`\`

**Important:**
- Read markdown content from the input \`sections\` object
- Convert each section to the HTML structure shown in the comments
- Use exact CSS class names as defined in section 2
- Follow conversion rules in section 4
- Preserve all emojis, formatting, and content order

### 4. Markdown to HTML Conversion Rules

**Headers:**
- \`# Title\` → \`<h1>\` (in header section)
  - **Important for header section**: Extract the main title text (including emoji) from the markdown header, but remove any date range or timeframe text (e.g., "— 2025-12-8 ~ 2025-12-15", "~ 2025-12-15", etc.)
  - The date range should be extracted separately and placed in \`<h3 class="date">\`
  - Examples:
    - EN: \`# Weekly Newsletter — 2025-12-8 ~ 2025-12-15\` → \`<h1>Weekly Newsletter</h1>\` + \`<h3 class="date">2025-12-8 ~ 2025-12-15</h3>\`
    - JA: \`# 👋 週次Newsletter — 2025-12-8 ~ 2025-12-15\` → \`<h1>👋 週次Newsletter</h1>\` + \`<h3 class="date">2025-12-8 ~ 2025-12-15</h3>\`
    - KO: \`# 주간 뉴스레터 — 2025-12-8 ~ 2025-12-15\` → \`<h1>주간 뉴스레터</h1>\` + \`<h3 class="date">2025-12-8 ~ 2025-12-15</h3>\`
- \`## Section\` → \`<h2 class="section-title">\`
- \`### Subsection\` → \`<h3>\`

**Text Formatting:**
- \`**bold**\` → \`<strong>bold</strong>\`
- \`*italic*\` → \`<em>italic</em>\`
- Line breaks preserved

**Lists:**
- \`- item\` → \`<ul><li>item</li></ul>\`

**Tables:**
- Markdown tables → HTML \`<table>\` with proper class (\`kpi-table\` or \`roadmap-table\`)

**Blockquotes/Conversations:**
- \`> text\` → \`<div class="quote-box">\` or \`<div class="closing-quote">\`

**Emojis:**
- Keep all emojis as Unicode characters

**Progress Bars:**
- When markdown contains progress percentage, extract and display it:
  - EN: "Progress: 65%", "Progress Rate: 65%"
  - JA: "進捗率: 65%", "進捗: 65%"
  - KO: "진행률: 65%", "진행: 65%"
- Example conversion:
\`\`\`html
<div class="nl-progress-bar">
    <div class="nl-progress-fill" style="width: 65%;"></div>
</div>
<div class="road-meta">[Progress label]: 65% — [Date label]: [Date]</div>
\`\`\`
- Examples of progress labels by language:
  - EN: "Progress: 65% — Due Date: 2025-12-20"
  - JA: "進捗率: 65% — 完了予定: 2025-12-20"
  - KO: "진행률: 65% — 완료예정: 2025-12-20"
- If no progress percentage in markdown, omit progress bar and show only date:
\`\`\`html
<div class="road-meta">[Date label]: [Date]</div>
\`\`\`
- Use \`nl-progress-bar\` for container, \`nl-progress-fill\` for fill
- Always include progress percentage text in \`road-meta\` when progress bar exists
- Keep original language labels from markdown (Progress/進捗率/진행률, Due Date/完了予定/완료예정, etc.)
- Set width as inline style for email client compatibility

## 🌐 Language Support
- Set HTML \`lang\` attribute based on the input content language (ja/ko/en)
- Keep all text content in the original input language
- Do not translate any content

## 🗂 Critical Checks Before Output

1. ✅ Complete HTML document (DOCTYPE to closing tag)
2. ✅ All CSS styles included in <style> tag
3. ✅ Proper HTML structure (no unclosed tags)
4. ✅ All markdown converted to HTML
5. ✅ Emojis preserved correctly
6. ✅ Tables formatted properly with correct classes
7. ✅ Progress bars included where needed
8. ✅ Responsive design (max-width: 700px)
9. ✅ Email client compatibility
10. ✅ All sections from input included

## 💡 Important Notes

- **Parse the input correctly**: Extract \`sections\` from the stringified \`contents\` field
- **Include ALL CSS** from section 2 in the <style> tag
- Use **exact class names** as defined in the CSS
- **Preserve all content** from markdown (no omissions)
- **Consistent styling** - every generation should look the same
- Focus on **accurate conversion** from markdown to HTML

**Output**: Return ONLY the complete HTML document, nothing else. No explanations, no markdown code blocks wrapping the HTML.
`;