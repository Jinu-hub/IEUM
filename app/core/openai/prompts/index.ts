/**
 * Prompts Module - Public API
 * 
 * 이 모듈은 다국어 프롬프트 생성을 위한 공개 API를 제공합니다.
 */
import { FUN_CORNER_INSTRUCTIONS } from './fun_corner_ins';
import { HIGHLIGHTS_SUMMARY_INSTRUCTIONS } from './highlight_ins';
import { TOPIC_CLUSTERING_INSTRUCTIONS } from './topic_clustering_ins';
import type { PromptType } from './types';
import { ACTIVITY_SUMMARY_INSTRUCTIONS } from './user_activity_ins';

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
    case 'fun_corner':
      return FUN_CORNER_INSTRUCTIONS;
  }
  return '';
}
