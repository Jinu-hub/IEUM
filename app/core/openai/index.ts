/**
 * Agents Module - Public API
 * 
 * AI 에이전트와 프롬프트 관련 기능을 제공합니다.
 */

// Agents
export { summarizerAgent } from './test-agent';

// Prompt Builders
export {
    buildGithubPrompt,
    buildPromptFromGithubData,
    type SupportedLanguage
} from './prompts';

// Templates (advanced usage)
export { getGithubTemplate } from './templates';

// Formatters (advanced usage)
export { formatGithubData } from './formatters/github-formatter';

