/**
 * Agents Module - Public API
 * 
 * AI 에이전트와 프롬프트 관련 기능을 제공합니다.
 */

// ============================================
// Agent Models Configuration
// 에이전트별 사용 모델 정의
// ============================================
export const AGENT_MODELS = {
    // ============================================
    // 1. normalizeData（データ正規化）
    // エージェントなし - データ変換のみ
    // ============================================
    
    // ============================================
    // 2. analyzeData（データ分析）
    // ============================================
    topic_clustering: 'gpt-5-mini',      // トピッククラスタリング
    highlights_summary: 'gpt-5-mini',    // ハイライト要約
    activity_summary: 'gpt-4.1-mini',     // メンバー活動要約
    ongoing_progress: 'gpt-5-mini',      // 進行中タスク抽出
    
    // ============================================
    // 3. draftingData（セクション初稿生成）
    // ============================================
    kpi_section: 'gpt-4.1-mini',           // KPIセクション
    highlights_section: 'gpt-4.1-mini',    // ハイライトセクション
    topics_section: 'gpt-4.1-mini',        // トピックセクション
    member_activity_section: 'gpt-4.1-mini', // メンバー活動セクション
    ongoing_section: 'gpt-4.1-mini',       // 進行中セクション
    closing_section: 'gpt-4.1-mini',       // クロージングセクション
    
    // ============================================
    // 4. mergeContents（コンテンツマージ）
    // エージェントなし - テンプレート結合のみ
    // ============================================
    
    // ============================================
    // 5. generateFinalContents（最終コンテンツ生成）
    // ============================================
    final_contents: 'gpt-4.1-mini',        // 最終コンテンツ生成
    
    // ============================================
    // 6. convertToHTML（HTML変換）※オプション
    // ============================================
    convert_to_html: 'gpt-5-mini-2025-08-07', // HTML変換
    section_html: 'gpt-4.1-mini',          // セクション別HTML変換
} as const;

export type AgentModelKey = keyof typeof AGENT_MODELS;

// ============================================
// Agents
// ============================================
export { summarizerAgent } from './test-agent';

// Prompt Builders
export {
    getPrompt
} from '../prompts';

// Templates
export { BASE_TEMPLATE_EN } from '../templates/0_base-template.en';
export { MAIN_TEMPLATE_EN } from '../templates/2_main-template.en';

