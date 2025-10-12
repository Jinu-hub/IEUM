/**
 * Prompt Builder - Combines Templates with Formatted Data
 */
import { getPrompt } from ".";
import { LANGUAGE_NAMES, type SupportedLanguage } from "../config/style-guide";
import { CRITICAL_KEYWORDS, GREETINGS, KEYWORD_DETECTION_RULES } from "../formatters/keyword.en";
import { CRITICAL_KEYWORDS_JA, GREETINGS_JA, KEYWORD_DETECTION_RULES_JA } from "../formatters/keyword.ja";
import { CRITICAL_KEYWORDS_KO, GREETINGS_KO, KEYWORD_DETECTION_RULES_KO } from "../formatters/keyword.ko";
import type { PromptType } from "./types";


/**
 * 다국어 프롬프트 생성
 * 
 * @param promptType - 데이터 배열
 * @param language - 출력 언어 ('en' | 'ko' | 'ja', 기본값: 'en')
 * @param source - 데이터 소스 (기본값: 'slack')
 * @returns 완성된 프롬프트 문자열
 * 
 * @example
 * ```typescript
 * const prompt = buildPrompt(promptType, language, source);
 * const result = await run(agent, prompt);
 * ```
 */
export function buildPrompt(
  promptType: PromptType,
  language: SupportedLanguage = 'en',
  source: string = 'slack'
): string {
  // 1. 프롬프트 가져오기
  const tempPrompt = getPrompt(promptType);

  // 2. 특수 키워드 치환
  const replacedPrompt = keywordReplacer(promptType, tempPrompt, language);
  
  // 3. 공통 플레이스홀더 치환
  const prompt = replacedPrompt
    .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language])
    .replace(/\{\{SOURCE\}\}/g, source);
  
  return prompt;
}

function keywordReplacer(promptType: PromptType, prompt: string, language: SupportedLanguage = 'en'): string {
  switch (promptType) {
    case 'topic_clustering':
      let criticalKeywords = CRITICAL_KEYWORDS;
      let greetings = GREETINGS;
      let keywordDetectionRules = KEYWORD_DETECTION_RULES;
      if (language === 'ja') {
        criticalKeywords = CRITICAL_KEYWORDS_JA;
        greetings = GREETINGS_JA;
        keywordDetectionRules = KEYWORD_DETECTION_RULES_JA;
      } else if (language === 'ko') {
        criticalKeywords = CRITICAL_KEYWORDS_KO;
        greetings = GREETINGS_KO;
        keywordDetectionRules = KEYWORD_DETECTION_RULES_KO;
      }
      return prompt.replace(/\{\{CRITICAL_KEYWORDS\}\}/g, criticalKeywords)
                  .replace(/\{\{GREETINGS\}\}/g, greetings)
                  .replace(/\{\{KEYWORD_DETECTION_RULES\}\}/g, keywordDetectionRules);
  }
  return prompt;
}


