import { Agent } from "@openai/agents";
import type { SupportedLanguage } from "../config/style-guide";
import {
    ActivityOutput,
    HighlightsOutput,
    OngoingProgressOutput,
    TopicOutput
} from "../models";
import { buildPrompt } from "../prompts";

/**
 * Topic Clustering Agent を言語に応じて生成（単一ファイル + 文字列置換方式）
 * @param language - 出力言語 ('en' | 'ko' | 'ja')
 * @param source - データソース (デフォルト: 'Slack')
 * @returns Agent instance
 */
export function createTopicClusteringAgent(
  language: SupportedLanguage = 'en',
  source: string = 'slack'
) {
  const instructions = buildPrompt('topic_clustering', language, source);
  //saveContentToFile(instructions, 'output-test', 'topic_clustering_instructions_', 'md');
  return new Agent({
    name: 'topic_clustering_agent',
    instructions: instructions,
    model: 'gpt-4.1-mini',
    outputType: TopicOutput,
  });
}

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
  const instructions = buildPrompt('activity_summary', language);
  //saveContentToFile(instructions, 'output-test', 'activity_summary_instructions_', 'md');
  return new Agent({
    name: 'activity_summary_agent',
    instructions: instructions,
    model: 'gpt-4.1-mini',
    outputType: ActivityOutput,
  });
}

/**
 * Highlights Summary Agent を言語に応じて生成（単一ファイル + 文字列置換方式）
 * @param language - 出力言語 ('en' | 'ko' | 'ja')
 * @returns Agent instance
 */
export function createHighlightsSummaryAgent(
  language: SupportedLanguage = 'en',
) {
  const instructions = buildPrompt('highlights_summary', language);
  return new Agent({
    name: 'highlights_summary_agent',
    instructions: instructions,
    model: 'gpt-4.1-mini',
    outputType: HighlightsOutput,
  });
}

/**
 * Ongoing Progress Agent を言語に応じて生成します
 * @param language - 出力言語 ('en' | 'ko' | 'ja')
 * @returns Agent instance
 */
export function createOngoingProgressAgent(
  language: SupportedLanguage = 'en',
) {
  const instructions = buildPrompt('ongoing_progress', language);
  return new Agent({
    name: 'ongoing_progress_agent',
    instructions: instructions,
    model: 'gpt-4.1-mini',
    outputType: OngoingProgressOutput,
  });
}
