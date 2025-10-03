/**
 * Prompts Module - Public API
 * 
 * 이 모듈은 다국어 프롬프트 생성을 위한 공개 API를 제공합니다.
 */

// Main exports
export { buildGithubPrompt, buildPromptFromGithubData } from './prompt-builder';

// Re-export types
export type { SupportedLanguage } from '../templates';

