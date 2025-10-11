import { Agent } from "@openai/agents";
import { ActivityOutput, TopicOutput } from "./models";
import type { SupportedLanguage } from "./templates";
import { getActivitySummaryTemplate, getTopicClusteringTemplate } from "./templates";

/**
 * GitHub 활동 요약 에이전트
 * 주간 리포트를 마크다운 형식으로 작성합니다.
 */
export const summarizerAgent = new Agent({
  name: 'summarizer_agent',
  instructions: "You are a GitHub activity summarizer. \n\
  Write a concise weekly report in markdown format for an internal newsletter.",
  model: 'gpt-4.1-mini',
});


export const topicClusteringAgent = new Agent({
  name: 'topic_clustering_agent',
  instructions: getTopicClusteringTemplate('ja'),
  model: 'gpt-4.1-mini',
  outputType: TopicOutput,
});

/**
 * Activity Summary Agent を言語に応じて生成（単一ファイル + 文字列置換方式）
 * @param language - 出力言語 ('en' | 'ko' | 'ja')
 * @param source - データソース (デフォルト: 'Slack')
 * @returns Agent instance
 */
export function createActivitySummaryAgent(
  language: SupportedLanguage = 'en',
) {
  //console.log('language', language);
  const instructions = getActivitySummaryTemplate(language);
  //saveContentToFile(instructions, 'output-test', 'activity_summary_instructions_', 'md');
  return new Agent({
    name: 'activity_summary_agent',
    instructions: instructions,
    model: 'gpt-4.1-mini',
    outputType: ActivityOutput,
  });
}

// デフォルトエージェント（後方互換性のため）
export const activitySummaryAgent = createActivitySummaryAgent('en');