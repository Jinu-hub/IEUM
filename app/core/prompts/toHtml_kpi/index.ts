/**
 * toHtml_kpi 모듈 - KPI Newsletter용 섹션별 HTML 변환 프롬프트
 */

// KPI 전용 CSS
export { KPI_COMMON_CSS, KPI_COMMON_CONVERSION_RULES } from './common-css';

// KPI 섹션별 프롬프트
export { KPI_HEADER_TO_HTML_INSTRUCTIONS } from './header';
export { KPI_SUMMARY_TO_HTML_INSTRUCTIONS } from './summary';
export { KPI_KPI_TO_HTML_INSTRUCTIONS } from './kpi';
export { KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS } from './highlights';
export { KPI_TOPICS_TO_HTML_INSTRUCTIONS } from './topics';
export { KPI_ONGOING_TO_HTML_INSTRUCTIONS } from './ongoing';
export { KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS } from './member-activity';
export { KPI_CLOSING_TO_HTML_INSTRUCTIONS } from './closing';

// HTML 템플릿 조립 함수
export {
    assembleKpiCompleteHTML,
    type KpiSectionHTMLParts,
} from './html-template';

import { KPI_HEADER_TO_HTML_INSTRUCTIONS } from './header';
import { KPI_SUMMARY_TO_HTML_INSTRUCTIONS } from './summary';
import { KPI_KPI_TO_HTML_INSTRUCTIONS } from './kpi';
import { KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS } from './highlights';
import { KPI_TOPICS_TO_HTML_INSTRUCTIONS } from './topics';
import { KPI_ONGOING_TO_HTML_INSTRUCTIONS } from './ongoing';
import { KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS } from './member-activity';
import { KPI_CLOSING_TO_HTML_INSTRUCTIONS } from './closing';

export type KpiSectionName =
    | 'header'
    | 'summary'
    | 'kpi'
    | 'highlights'
    | 'topics'
    | 'ongoing'
    | 'memberActivity'
    | 'closing';

/**
 * KPI 섹션명으로 프롬프트 취득
 * @param sectionName 섹션명
 * @returns 프롬프트 문자열
 */
export function getKpiSectionPrompt(sectionName: KpiSectionName): string {
    switch (sectionName) {
        case 'header':
            return KPI_HEADER_TO_HTML_INSTRUCTIONS;
        case 'summary':
            return KPI_SUMMARY_TO_HTML_INSTRUCTIONS;
        case 'kpi':
            return KPI_KPI_TO_HTML_INSTRUCTIONS;
        case 'highlights':
            return KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS;
        case 'topics':
            return KPI_TOPICS_TO_HTML_INSTRUCTIONS;
        case 'ongoing':
            return KPI_ONGOING_TO_HTML_INSTRUCTIONS;
        case 'memberActivity':
            return KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS;
        case 'closing':
            return KPI_CLOSING_TO_HTML_INSTRUCTIONS;
        default:
            return '';
    }
}
