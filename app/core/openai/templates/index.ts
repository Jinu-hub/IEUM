/**
 * Template Index - Language Selection
 */
import { type SupportedLanguage } from '../config/style-guide';
import { GITHUB_SUMMARY_TEMPLATE_EN } from './github-template.en';
import { GITHUB_SUMMARY_TEMPLATE_JA } from './github-template.ja';
import { GITHUB_SUMMARY_TEMPLATE_KO } from './github-template.ko';

const GITHUB_TEMPLATES: Record<SupportedLanguage, string> = {
  en: GITHUB_SUMMARY_TEMPLATE_EN,
  ko: GITHUB_SUMMARY_TEMPLATE_KO,
  ja: GITHUB_SUMMARY_TEMPLATE_JA,
};

/**
 * 언어에 맞는 GitHub 템플릿 가져오기
 * @param language - 지원 언어 ('en' | 'ko' | 'ja')
 * @returns 선택된 언어의 템플릿 (기본값: 영어)
 */
export function getGithubTemplate(language: SupportedLanguage = 'en'): string {
  return GITHUB_TEMPLATES[language] || GITHUB_TEMPLATES.en;
}