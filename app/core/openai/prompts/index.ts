/**
 * Prompts Module - Public API
 * 
 * 이 모듈은 다국어 프롬프트 생성을 위한 공개 API를 제공합니다.
 */
import { LANGUAGE_NAMES, type SupportedLanguage } from '../config/style-guide';
import { TOPIC_CLUSTERING_INSTRUCTIONS } from '../prompts/topic_clustering_ins';
import { ACTIVITY_SUMMARY_INSTRUCTIONS } from '../prompts/user_activity_ins';
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
  }
  return '';
}

/**
 * Topic Clustering 프롬프트 가져오기
 * @param language - 출력 언어 ('en' | 'ko' | 'ja')
 * @param source - 데이터 소스 (기본값: 'Slack')
 */
export function getTopicClusteringInstructions(
    language: SupportedLanguage = 'en', 
    source: string = 'slack',
): string {
  return TOPIC_CLUSTERING_INSTRUCTIONS
      .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language])
      .replace(/\{\{SOURCE\}\}/g, source);
}

/**
 * Activity Summary 템플릿 가져오기 (단일 파일 + 문자열 치환 방식)
 * @param language - 출력 언어 ('en' | 'ko' | 'ja')
 * @returns 언어와 소스가 치환된 템플릿
 */
export function getActivitySummaryInstructions(
  language: SupportedLanguage = 'en',
): string {
  return ACTIVITY_SUMMARY_INSTRUCTIONS
      .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language]);
}

/*
export function getHighlightsSummaryInstructions(
  language: SupportedLanguage = 'en',
): string {
  return HIGHLIGHTS_SUMMARY_INSTRUCTIONS
      .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language]);
}
*/
