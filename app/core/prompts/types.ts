export type PromptType = 
    'topic_clustering' 
    | 'activity_summary' 
    | 'highlights_summary'
    | 'ongoing_progress'
    | 'kpi_section'
    | 'highlights_section'
    | 'topics_section'
    | 'member_activity_section'
    | 'ongoing_section'
    | 'looking_ahead_section'
    | 'closing_section'
    | 'create_final_contents'
    | 'create_final_kpi'
    | 'create_final_contents_no_kpi'
    | 'convert_to_html'
    | 'convert_to_html_kpi'
    | 'convert_to_html_no_kpi'
    // 섹션별 HTML 변환 (병렬 처리용)
    | 'toHtml_header'
    | 'toHtml_summary'
    | 'toHtml_kpi'
    | 'toHtml_highlights'
    | 'toHtml_topics'
    | 'toHtml_ongoing'
    | 'toHtml_memberActivity'
    | 'toHtml_closing'
    // KPI Newsletter용 섹션별 HTML 변환 (병렬 처리용)
    | 'toHtml_kpi_header'
    | 'toHtml_kpi_summary'
    | 'toHtml_kpi_kpi'
    | 'toHtml_kpi_highlights'
    | 'toHtml_kpi_topics'
    | 'toHtml_kpi_ongoing'
    | 'toHtml_kpi_memberActivity'
    | 'toHtml_kpi_closing'

// =========================================================
// Shared domain types (re-export)
// =========================================================

export {
    CURRENCY_VALUES,
    ZERO_DECIMAL_CURRENCY_VALUES,
    isZeroDecimalCurrency
} from "~/features/payments/lib/types";
export type { Currency, ZeroDecimalCurrency } from "~/features/payments/lib/types";
