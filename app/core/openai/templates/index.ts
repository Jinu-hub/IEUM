/**
 * Template Index - Language Selection
 */
import { type SupportedLanguage } from '../config/style-guide';
import { BASE_TEMPLATE_EN } from './0_base-template.en';
import { BASE_TEMPLATE_JA } from './0_base-template.ja';
import { BASE_TEMPLATE_KO } from './0_base-template.ko';
import { MAIN_TEMPLATE_EN } from './2_main-template.en';
import { MAIN_TEMPLATE_JA } from './2_main-template.ja';
import { MAIN_TEMPLATE_KO } from './2_main-template.ko';
import { GITHUB_SUMMARY_TEMPLATE_EN } from './github-template.en';
import { GITHUB_SUMMARY_TEMPLATE_JA } from './github-template.ja';
import { GITHUB_SUMMARY_TEMPLATE_KO } from './github-template.ko';

const GITHUB_TEMPLATES: Record<SupportedLanguage, string> = {
  en: GITHUB_SUMMARY_TEMPLATE_EN,
  ko: GITHUB_SUMMARY_TEMPLATE_KO,
  ja: GITHUB_SUMMARY_TEMPLATE_JA,
};

const BASE_TEMPLATES: Record<SupportedLanguage, string> = {
  en: BASE_TEMPLATE_EN,
  ko: BASE_TEMPLATE_KO,
  ja: BASE_TEMPLATE_JA,
};

const MAIN_TEMPLATES: Record<SupportedLanguage, string> = {

  en: MAIN_TEMPLATE_EN,
  ko: MAIN_TEMPLATE_KO,
  ja: MAIN_TEMPLATE_JA,
};

/**
 * 언어에 맞는 GitHub 템플릿 가져오기
 * @param language - 지원 언어 ('en' | 'ko' | 'ja')
 * @returns 선택된 언어의 템플릿 (기본값: 영어)
 */
export function getGithubTemplate(language: SupportedLanguage = 'en'): string {
  return GITHUB_TEMPLATES[language] || GITHUB_TEMPLATES.en;
}

export function getBaseTemplate(language: SupportedLanguage = 'en'): string {
  return BASE_TEMPLATES[language] || BASE_TEMPLATES.en;
}

export function getMainTemplate(language: SupportedLanguage = 'en'): string {
  return MAIN_TEMPLATES[language] || MAIN_TEMPLATES.en;
}