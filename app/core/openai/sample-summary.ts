/**
 * Sample Summary Generator
 * 
 * Simple summary generation for review mode.
 * Generates concise summaries from Slack messages.
 */

import OpenAI from "openai";
import type { FetchedMessage } from "~/core/integrations/slack/types";
import { logger } from "~/core/lib/logger";

const openai = new OpenAI();

/**
 * Convert Slack messages to text format
 */
function formatMessagesForSummary(messages: FetchedMessage[]): string {
  return messages
    .filter(m => m.text && m.text.trim().length > 0)
    .map(m => {
      const userName = m.userInfo?.profile?.display_name || 
                       m.userInfo?.profile?.real_name || 
                       m.user || 'Unknown';
      return `[${userName}]: ${m.text}`;
    })
    .join('\n');
}

/**
 * Generate sample summary for review mode
 */
export async function generateSampleSummary(
  slackResult: Record<string, FetchedMessage[]>
): Promise<string> {
  logger.info('🤖 Generating sample summary...');

  // Aggregate messages from all channels
  const allMessages: { channel: string; content: string }[] = [];
  
  for (const [channelKey, messages] of Object.entries(slackResult)) {
    const channelName = channelKey.split(':')[1] || channelKey;
    const formattedMessages = formatMessagesForSummary(messages);
    
    if (formattedMessages.trim().length > 0) {
      allMessages.push({
        channel: channelName,
        content: formattedMessages.substring(0, 3000) // Truncate for token limits
      });
    }
  }

  if (allMessages.length === 0) {
    return 'No messages found. Please make sure there are messages in the channel.';
  }

  const messagesContext = allMessages
    .map(m => `### #${m.channel}\n${m.content}`)
    .join('\n\n');

  const prompt = `You are an excellent technical writer. Analyze the following Slack channel conversations and summarize the main topics and activities concisely.

## Conversation Content
${messagesContext}

## Summary Rules
1. Output in English
2. List 3-5 main topics as bullet points
3. Explain each topic in 1-2 sentences concisely
4. Include technical content if present
5. Highlight important decisions or progress

## Output Format
📋 **This Week's Highlights**

- [Summary of topic 1]
- [Summary of topic 2]
- [Summary of topic 3]

💡 **Key Points**
[Describe particularly important activities or decisions if any]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert at creating weekly reports for development teams.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const summary = response.choices[0]?.message?.content || 'Failed to generate summary.';
    logger.info('✅ Sample summary generated successfully');
    
    return summary;
  } catch (error: any) {
    logger.error('Failed to generate sample summary', { error: error.message });
    throw new Error(`Summary generation error: ${error.message}`);
  }
}

