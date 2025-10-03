/**
 * Prompt Builder - Combines Templates with Formatted Data
 */
import type { FetchedRepoData } from "~/core/integrations/github/types";
import { formatGithubData } from "../formatters/github-formatter";
import type { SupportedLanguage } from "../templates";
import { getGithubTemplate } from "../templates";

/**
 * GitHub 데이터를 기반으로 다국어 프롬프트 생성
 * 
 * @param repos - GitHub 저장소 데이터 배열
 * @param language - 출력 언어 ('en' | 'ko' | 'ja', 기본값: 'en')
 * @returns 완성된 프롬프트 문자열
 * 
 * @example
 * ```typescript
 * const prompt = buildGithubPrompt(repos, 'ko');
 * const result = await run(agent, prompt);
 * ```
 */
export function buildGithubPrompt(
  repos: FetchedRepoData[], 
  language: SupportedLanguage = 'en'
): string {
  // 1. 언어에 맞는 템플릿 가져오기
  const template = getGithubTemplate(language);
  
  // 2. 데이터를 언어에 맞게 포맷팅
  const formattedData = formatGithubData(repos, language);
  
  // 3. 템플릿의 {{REPO_DATA}} 플레이스홀더를 실제 데이터로 교체
  const prompt = template.replace('{{REPO_DATA}}', formattedData);
  
  return prompt;
}

/**
 * 기존 buildPromptFromGithubData와 호환되는 래퍼 함수 (영어 버전)
 * 
 * @deprecated 다국어 지원을 위해 buildGithubPrompt 사용을 권장합니다
 */
export function buildPromptFromGithubData(repos: FetchedRepoData[]): string {
  return buildGithubPrompt(repos, 'en');
}

