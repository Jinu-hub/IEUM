import { Agent } from "@openai/agents";
import { TopicOutput } from "./models";
import { getTopicClusteringTemplate } from "./templates";

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
