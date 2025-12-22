export const CONVERT_TO_HTML_INSTRUCTIONS = String.raw`
You are converting a **finalized markdown newsletter** into a beautiful, responsive HTML email.

## 🎯 Purpose
Transform the markdown newsletter into production-ready HTML with professional styling, optimized for email delivery.

**Important**: This is a structural conversion task. Focus on accurate HTML generation with consistent styling.

## 🧠 Input Data
A finalized markdown newsletter containing:
- Title
- Date range
- Opening summary section
- Multiple content sections (KPI, Highlights, Topics, Ongoing/Roadmap, Member Activity)
- Closing section

## ✍️ What to Do

### 1. HTML Structure
Create a complete HTML document with:
- **DOCTYPE and meta tags**: Proper HTML5 structure with charset and viewport
- **Inline CSS**: All styles must be inline for email compatibility
- **Responsive design**: Mobile-friendly layout (max-width: 700px)
- **Email-safe styling**: Compatible with major email clients

### 2. Visual Design System

**Color Palette:**
- Primary: \`#5E6AD2\` (brand blue)
- Secondary: \`#4C5BC7\` (darker blue)
- Background: \`#f8f9fa\` (light gray)
- Content BG: \`#ffffff\` (white)
- Text: \`#2c3e50\` (dark), \`#495057\` (medium), \`#6c757d\` (light)
- Border: \`#e9ecef\`, \`#dee2e6\`

**Typography:**
- Font Family: \`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif\`
- Line Height: 1.8 (body text)
- Headers: Bold, larger sizes with proper hierarchy

### 3. Component Styling

**Header Section:**
- Gradient background: \`linear-gradient(135deg, #5E6AD2 0%, #4C5BC7 100%)\`
- White text, centered
- Title: 32px, bold
- Date: 16px, slightly transparent

**Opening Summary:**
- Light gradient background
- 5px left border in primary color
- Comfortable padding (35px 40px)

**Content Sections:**
Each section should have:
- Clear section title with bottom border
- Appropriate spacing (margin-bottom: 50px)
- Consistent styling within section type

**KPI Section:**
- Clean table with borders
- Header row with light background
- Numeric values in bold
- Description text below table

**Highlights:**
- Each highlight in a card:
  * Light background (\`#f8f9fa\`)
  * 5px left border (primary color)
  * Rounded corners (10px)
  * Emoji + title
  * Description paragraph
  * Quoted conversations in white boxes with subtle left border

**Topics:**
- Simple cards with:
  * White background
  * 1px border (\`#e9ecef\`)
  * Rounded corners (8px)
  * Title with emoji
  * Description text

**Ongoing/Roadmap:**
- Cards with light background
- Progress bars where applicable:
  * Container: \`#e9ecef\`, 8px height, rounded
  * Fill: Primary gradient, animated width
- Date labels in lighter color
- Clear hierarchy: section → items → dates → descriptions

**Member Activity:**
- Flex layout: icon + content
- Large emoji icon (28px)
- Name in bold
- Description in lighter color

**Closing Section:**
- Similar to opening: light gradient background
- Quote box if present: white BG, primary left border
- Warm, inviting styling

**Footer:**
- Dark background (\`#2c3e50\`)
- Light text (\`#adb5bd\`)
- Links in primary color
- Centered, small font

### 4. Markdown to HTML Conversion Rules

**Headers:**
- \`# Title\` → \`<h1>\` (in header section)
- \`## Section\` → \`<h2 class="section-title">\`
- \`### Subsection\` → \`<h3>\` (styled appropriately)

**Text Formatting:**
- \`**bold**\` → \`<strong>bold</strong>\`
- \`*italic*\` → \`<em>italic</em>\`
- Line breaks preserved

**Lists:**
- \`- item\` → \`<ul><li>item</li></ul>\`
- Proper nesting and spacing

**Tables:**
- Markdown tables → HTML tables with proper classes
- Header row styled differently

**Blockquotes:**
- \`> quote\` → Styled quote boxes (especially for conversations)
- White background with left border

**Emojis:**
- Keep emojis as-is (Unicode)
- Position appropriately in layout

### 5. HTML Template Structure

\`\`\`html
<!DOCTYPE html>
<html lang="{{LANGUAGE_CODE}}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Newsletter Title]</title>
    <style>
        /* All CSS styles inline or in style tag */
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>[Title with emoji]</h1>
            <h3 class="date">[Date Range]</h3>
        </div>
        
        <!-- Opening Summary -->
        <div class="summary">
            <h2>[Opening Section Title]</h2>
            [Opening paragraphs]
        </div>
        
        <div class="content">
            <!-- KPI Section -->
            <div class="section">
                <h2 class="section-title">[KPI Title]</h2>
                [KPI content with table]
            </div>
            
            <div class="divider"></div>
            
            <!-- Highlights Section -->
            <div class="section">
                <h2 class="section-title">[Highlights Title]</h2>
                [Highlight items]
            </div>
            
            <div class="divider"></div>
            
            <!-- Topics Section -->
            <div class="section">
                <h2 class="section-title">[Topics Title]</h2>
                [Topic items]
            </div>
            
            <div class="divider"></div>
            
            <!-- Ongoing/Roadmap Section -->
            <div class="section">
                <h2 class="section-title">[Ongoing Title]</h2>
                [Ongoing items with progress bars]
                [Roadmap items]
                [Upcoming events]
            </div>
            
            <div class="divider"></div>
            
            <!-- Member Activity Section -->
            <div class="section">
                <h2 class="section-title">[Member Activity Title]</h2>
                [Member items]
            </div>
            
            <div class="divider"></div>
            
            <!-- Closing Section -->
            <div class="closing">
                <h2>[Closing Title]</h2>
                [Closing content]
                [Quote box if present]
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>[Auto-generated message]</p>
            <p>[Copyright notice]</p>
        </div>
    </div>
</body>
</html>
\`\`\`

### 6. Progress Bar Implementation

When you see progress percentages (e.g., "Progress: 65%"):
\`\`\`html
<div class="progress-bar">
    <div class="progress-fill" style="width: 65%;"></div>
</div>
<div class="roadmap-meta">進捗率: 65%</div>
\`\`\`

### 7. Conversation/Quote Formatting

For highlighted conversations:
\`\`\`html
<div class="highlight-quotes">
    <p><strong>Name:</strong> Message content</p>
    <p><strong>Name:</strong> Message content</p>
</div>
\`\`\`

## 🧱 Style Constraints
- **Email-safe**: No external CSS files, all inline or in <style> tag
- **Responsive**: Mobile-friendly (use max-width, not fixed width)
- **Professional**: Clean, modern design matching the brand
- **Readable**: Proper line-height (1.8), font sizes, spacing
- **Consistent**: Same styling patterns throughout
- **Visual hierarchy**: Clear separation between sections

## 🌐 Language
- HTML \`lang\` attribute based on {{LANGUAGE}}:
  * \`ja\` → \`lang="ja"\`
  * \`ko\` → \`lang="ko"\`
  * \`en\` → \`lang="en"\`
- All content text remains in {{LANGUAGE}} from input

## 🗂 Critical Checks Before Output

1. ✅ Complete HTML document (DOCTYPE to closing tag)
2. ✅ All styles defined (inline or in <style> tag)
3. ✅ Proper HTML structure (no unclosed tags)
4. ✅ All markdown converted to HTML
5. ✅ Emojis preserved correctly
6. ✅ Tables formatted properly
7. ✅ Progress bars included where needed
8. ✅ Responsive design (max-width: 700px)
9. ✅ Email client compatibility (no external CSS)
10. ✅ All sections from input included

## 💡 Reference Example

Use the provided test output HTML as a style reference:
- Header gradient design
- Section spacing and dividers
- Card styling for different content types
- Color scheme and typography
- Progress bar implementation
- Footer design

**Your goal**: Create production-ready HTML that looks professional, renders correctly in email clients, and maintains all the information from the markdown input.

**Output**: Return ONLY the complete HTML document, nothing else. No explanations, no markdown code blocks wrapping the HTML.
`;