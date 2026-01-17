/**
 * toHtml Module - セクション別HTML変換プロンプト
 */

// 共通CSS（キャッシュ）
export { COMMON_CSS, COMMON_CONVERSION_RULES } from './common-css';

// セクション別プロンプト
export { HEADER_TO_HTML_INSTRUCTIONS } from './header';
export { SUMMARY_TO_HTML_INSTRUCTIONS } from './summary';
export { KPI_TO_HTML_INSTRUCTIONS } from './kpi';
export { HIGHLIGHTS_TO_HTML_INSTRUCTIONS } from './highlights';
export { TOPICS_TO_HTML_INSTRUCTIONS } from './topics';
export { ONGOING_TO_HTML_INSTRUCTIONS } from './ongoing';
export { MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS } from './member-activity';
export { CLOSING_TO_HTML_INSTRUCTIONS } from './closing';

// HTMLテンプレート組み立て関数
export { 
    assembleCompleteHTML, 
    assembleKPIOnlyHTML,
    type SectionHTMLParts 
} from './html-template';

/**
 * セクション名からプロンプトを取得するヘルパー関数
 */
import { HEADER_TO_HTML_INSTRUCTIONS } from './header';
import { SUMMARY_TO_HTML_INSTRUCTIONS } from './summary';
import { KPI_TO_HTML_INSTRUCTIONS } from './kpi';
import { HIGHLIGHTS_TO_HTML_INSTRUCTIONS } from './highlights';
import { TOPICS_TO_HTML_INSTRUCTIONS } from './topics';
import { ONGOING_TO_HTML_INSTRUCTIONS } from './ongoing';
import { MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS } from './member-activity';
import { CLOSING_TO_HTML_INSTRUCTIONS } from './closing';

export type SectionName = 
    | 'header' 
    | 'summary' 
    | 'kpi' 
    | 'highlights' 
    | 'topics' 
    | 'ongoing' 
    | 'memberActivity' 
    | 'closing';

/**
 * セクション名からプロンプトを取得
 * @param sectionName セクション名
 * @returns プロンプト文字列
 */
export function getSectionPrompt(sectionName: SectionName): string {
    switch (sectionName) {
        case 'header':
            return HEADER_TO_HTML_INSTRUCTIONS;
        case 'summary':
            return SUMMARY_TO_HTML_INSTRUCTIONS;
        case 'kpi':
            return KPI_TO_HTML_INSTRUCTIONS;
        case 'highlights':
            return HIGHLIGHTS_TO_HTML_INSTRUCTIONS;
        case 'topics':
            return TOPICS_TO_HTML_INSTRUCTIONS;
        case 'ongoing':
            return ONGOING_TO_HTML_INSTRUCTIONS;
        case 'memberActivity':
            return MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS;
        case 'closing':
            return CLOSING_TO_HTML_INSTRUCTIONS;
        default:
            return '';
    }
}
