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
import { FUN_CORNER_SECTION_INSTRUCTIONS } from './drafting/fun_corner_sec_ins';
import { HIGHLIGHTS_SECTION_INSTRUCTIONS } from './drafting/highlights_sec_ins';
import { KPI_SECTION_INSTRUCTIONS } from './drafting/kpi_sec_ins';
import { MEMBER_ACTIVITY_SECTION_INSTRUCTIONS } from './drafting/member_act_sec_ins';
import { ONGOING_SECTION_INSTRUCTIONS } from './drafting/ongoing_sec_ins';
import { TOPICS_SECTION_INSTRUCTIONS } from './drafting/topics_sec_ins';
import { FINAL_KPI_INSTRUCTIONS_V1 } from './final_kpi_ins_v1';
import { FINAL_RESULT_INSTRUCTIONS } from './final_res_ins';
import type { PromptType } from './types';

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
      return FUN_CORNER_SECTION_INSTRUCTIONS;
    case 'create_final_contents':
      return FINAL_RESULT_INSTRUCTIONS;
    case 'create_final_kpi':
      return FINAL_KPI_INSTRUCTIONS_V1;
    case 'convert_to_html':
      return CONVERT_TO_HTML_INSTRUCTIONS;
    case 'convert_to_html_kpi':
      return CONVERT_TO_HTML_KPI_INSTRUCTIONS;
  }
  return '';
}
