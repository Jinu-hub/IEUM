/**
 * Prompts Module - Public API
 * 
 * 이 모듈은 다국어 프롬프트 생성을 위한 공개 API를 제공합니다.
 */
import { HIGHLIGHTS_SUMMARY_INSTRUCTIONS } from './analyze/highlight_ins';
import { TOPIC_CLUSTERING_INSTRUCTIONS } from './analyze/topic_clustering_ins';
import { ACTIVITY_SUMMARY_INSTRUCTIONS } from './analyze/user_activity_ins';
import { CONVERT_TO_HTML_INSTRUCTIONS } from './convert_to_html';
import { CONVERT_TO_HTML_KPI_INSTRUCTIONS } from './convert_to_html_kpi';
import { CONVERT_TO_HTML_INSTRUCTIONS_NO_KPI } from './convert_to_html_no_kpi';
import { CLOSING_SECTION_INSTRUCTIONS } from './drafting/closing_sec_ins';
import { HIGHLIGHTS_SECTION_INSTRUCTIONS } from './drafting/highlights_sec_ins';
import { KPI_SECTION_INSTRUCTIONS } from './drafting/kpi_sec_ins';
import { MEMBER_ACTIVITY_SECTION_INSTRUCTIONS } from './drafting/member_act_sec_ins';
import { ONGOING_SECTION_INSTRUCTIONS } from './drafting/ongoing_sec_ins';
import { TOPICS_SECTION_INSTRUCTIONS } from './drafting/topics_sec_ins';
import { FINAL_KPI_INSTRUCTIONS_V1 } from './final_kpi_ins_v1';
import { FINAL_RESULT_INSTRUCTIONS } from './final_res_ins';
import { FINAL_RESULT_INSTRUCTIONS_NO_KPI } from './final_res_ins_no_kpi';
import type { PromptType } from './types';
// 섹션별 HTML 변환 프롬프트 (병렬 처리용)
import {
  CLOSING_TO_HTML_INSTRUCTIONS,
  HEADER_TO_HTML_INSTRUCTIONS,
  HIGHLIGHTS_TO_HTML_INSTRUCTIONS,
  KPI_TO_HTML_INSTRUCTIONS,
  MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS,
  ONGOING_TO_HTML_INSTRUCTIONS,
  SUMMARY_TO_HTML_INSTRUCTIONS,
  TOPICS_TO_HTML_INSTRUCTIONS,
} from './toHtml';
// KPI Newsletter용 섹션별 HTML 변환 프롬프트 (병렬 처리용)
import {
  KPI_CLOSING_TO_HTML_INSTRUCTIONS,
  KPI_HEADER_TO_HTML_INSTRUCTIONS,
  KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS,
  KPI_KPI_TO_HTML_INSTRUCTIONS,
  KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS,
  KPI_ONGOING_TO_HTML_INSTRUCTIONS,
  KPI_SUMMARY_TO_HTML_INSTRUCTIONS,
  KPI_TOPICS_TO_HTML_INSTRUCTIONS,
} from './toHtml_kpi';

export { buildPrompt } from './prompt-builder';

export function getPrompt(
    promptType: PromptType,
): string {
  switch (promptType) {
    case 'topic_clustering':
      return TOPIC_CLUSTERING_INSTRUCTIONS;
    case 'activity_summary':
      return ACTIVITY_SUMMARY_INSTRUCTIONS;
    case 'highlights_summary':
      return HIGHLIGHTS_SUMMARY_INSTRUCTIONS;
    case 'kpi_section':
      return KPI_SECTION_INSTRUCTIONS;
    case 'highlights_section':
      return HIGHLIGHTS_SECTION_INSTRUCTIONS;
    case 'topics_section':  
      return TOPICS_SECTION_INSTRUCTIONS;
    case 'member_activity_section':    
      return MEMBER_ACTIVITY_SECTION_INSTRUCTIONS;
    case 'ongoing_section':
      return ONGOING_SECTION_INSTRUCTIONS;
    case 'looking_ahead_section':
      return 'TODO: Looking Ahead Section Instructions';
    case 'closing_section':
      return CLOSING_SECTION_INSTRUCTIONS;
    case 'create_final_contents':
      return FINAL_RESULT_INSTRUCTIONS;
    case 'create_final_kpi':
      return FINAL_KPI_INSTRUCTIONS_V1;
    case 'convert_to_html':
      return CONVERT_TO_HTML_INSTRUCTIONS;
    case 'convert_to_html_kpi':
      return CONVERT_TO_HTML_KPI_INSTRUCTIONS;
    case 'create_final_contents_no_kpi':
      return FINAL_RESULT_INSTRUCTIONS_NO_KPI;
    case 'convert_to_html_no_kpi':
      return CONVERT_TO_HTML_INSTRUCTIONS_NO_KPI;
    // 섹션별 HTML 변환 (병렬 처리용)
    case 'toHtml_header':
      return HEADER_TO_HTML_INSTRUCTIONS;
    case 'toHtml_summary':
      return SUMMARY_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi':
      return KPI_TO_HTML_INSTRUCTIONS;
    case 'toHtml_highlights':
      return HIGHLIGHTS_TO_HTML_INSTRUCTIONS;
    case 'toHtml_topics':
      return TOPICS_TO_HTML_INSTRUCTIONS;
    case 'toHtml_ongoing':
      return ONGOING_TO_HTML_INSTRUCTIONS;
    case 'toHtml_memberActivity':
      return MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS;
    case 'toHtml_closing':
      return CLOSING_TO_HTML_INSTRUCTIONS;
    // KPI Newsletter용 섹션별 HTML 변환 (병렬 처리용)
    case 'toHtml_kpi_header':
      return KPI_HEADER_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_summary':
      return KPI_SUMMARY_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_kpi':
      return KPI_KPI_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_highlights':
      return KPI_HIGHLIGHTS_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_topics':
      return KPI_TOPICS_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_ongoing':
      return KPI_ONGOING_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_memberActivity':
      return KPI_MEMBER_ACTIVITY_TO_HTML_INSTRUCTIONS;
    case 'toHtml_kpi_closing':
      return KPI_CLOSING_TO_HTML_INSTRUCTIONS;
  }
  return '';
}
