/**
 * Template Index - Language Selection
 */
import { ACTIVITY_SUMMARY_INSTRUCTIONS } from './activity_ins';
import { GITHUB_SUMMARY_TEMPLATE_EN } from './github-template.en';
import { GITHUB_SUMMARY_TEMPLATE_JA } from './github-template.ja';
import { GITHUB_SUMMARY_TEMPLATE_KO } from './github-template.ko';
import { TOPIC_CLUSTERING_INSTRUCTIONS_EN } from './topic_ins.en';
import { TOPIC_CLUSTERING_INSTRUCTIONS_JA } from './topic_ins.ja';
import { TOPIC_CLUSTERING_INSTRUCTIONS_KO } from './topic_ins.ko';

export type SupportedLanguage = 'en' | 'ko' | 'ja';

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
};

const GITHUB_TEMPLATES: Record<SupportedLanguage, string> = {
  en: GITHUB_SUMMARY_TEMPLATE_EN,
  ko: GITHUB_SUMMARY_TEMPLATE_KO,
  ja: GITHUB_SUMMARY_TEMPLATE_JA,
};

const TOPIC_CLUSTERING_TEMPLATES: Record<SupportedLanguage, string> = {
  en: TOPIC_CLUSTERING_INSTRUCTIONS_EN,
  ko: TOPIC_CLUSTERING_INSTRUCTIONS_KO,
  ja: TOPIC_CLUSTERING_INSTRUCTIONS_JA,
};

/**
 * 언어에 맞는 GitHub 템플릿 가져오기
 * @param language - 지원 언어 ('en' | 'ko' | 'ja')
 * @returns 선택된 언어의 템플릿 (기본값: 영어)
 */
export function getGithubTemplate(language: SupportedLanguage = 'en'): string {
  return GITHUB_TEMPLATES[language] || GITHUB_TEMPLATES.en;
}

export function getTopicClusteringTemplate(language: SupportedLanguage = 'en', source: string = 'slack'): string {
  return TOPIC_CLUSTERING_TEMPLATES[language]
      .replace('{{SOURCE}}', source)
      .replace('{{TEAM}}', 'LEAD')
      .replace('{{PROJECT}}', 'LEAD');
}

/**
 * Activity Summary 템플릿 가져오기 (단일 파일 + 문자열 치환 방식)
 * @param language - 출력 언어 ('en' | 'ko' | 'ja')
 * @param source - 데이터 소스 (기본값: 'Slack')
 * @returns 언어와 소스가 치환된 템플릿
 */
export function getActivitySummaryTemplate(
  language: SupportedLanguage = 'en',
): string {
  return ACTIVITY_SUMMARY_INSTRUCTIONS
      .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language]);
}
