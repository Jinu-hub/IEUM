/**
 * Prompt Builder - Combines Templates with Formatted Data
 */
import { getPrompt } from ".";
import { LANGUAGE_NAMES, type SupportedLanguage } from "../config/style-guide";
import type { PromptType } from "./types";
import { replaceKeywords } from "./utils";


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
  source: string = 'slack',
  timezone: string = 'Asia/Tokyo'
): string {
  // 1. 프롬프트 가져오기
  const tempPrompt = getPrompt(promptType);

  // 2. 특수 키워드 치환
  const replacedPrompt = replaceKeywords(promptType, tempPrompt, language);
  
  // 3. 공통 플레이스홀더 치환
  const prompt = replacedPrompt
    .replace(/\{\{LANGUAGE\}\}/g, LANGUAGE_NAMES[language])
    .replace(/\{\{SOURCE\}\}/g, source)
    .replace(/\{\{TIMEZONE\}\}/g, timezone);
  
  return prompt;
}


