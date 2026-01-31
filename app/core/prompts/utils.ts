import type { SupportedLanguage } from "../config/style-guide";
import { CRITICAL_KEYWORDS, GREETINGS, KEYWORD_DETECTION_RULES, KEYWORD_ONGOING_WORK, KEYWORD_ROADMAP, KEYWORD_UPCOMING } from "../keywords/developments/keyword.en";
import { CRITICAL_KEYWORDS_JA, GREETINGS_JA, KEYWORD_DETECTION_RULES_JA, KEYWORD_ONGOING_WORK_JA, KEYWORD_ROADMAP_JA, KEYWORD_UPCOMING_JA } from "../keywords/developments/keyword.ja";
import { CRITICAL_KEYWORDS_KO, GREETINGS_KO, KEYWORD_DETECTION_RULES_KO, KEYWORD_ONGOING_WORK_KO, KEYWORD_ROADMAP_KO, KEYWORD_UPCOMING_KO } from "../keywords/developments/keyword.ko";
import type { PromptType } from "./types";

/**
 * 프롬프트 타입에 따라 키워드를 치환하는 함수
 * @param language 
 * @param promptType 
 * @param language
 * @returns 
 */
export function replaceKeywords(promptType: PromptType, prompt: string, language: SupportedLanguage = 'en'): string {
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
      case 'ongoing_progress':
        let keywordOnGoingWork = KEYWORD_ONGOING_WORK;
        let keywordRoadmap = KEYWORD_ROADMAP;
        let keywordUpcoming = KEYWORD_UPCOMING;
        if (language === 'ja') {
          keywordOnGoingWork = KEYWORD_ONGOING_WORK_JA;
          keywordRoadmap = KEYWORD_ROADMAP_JA;
          keywordUpcoming = KEYWORD_UPCOMING_JA;
        } else if (language === 'ko') {
          keywordOnGoingWork = KEYWORD_ONGOING_WORK_KO;
          keywordRoadmap = KEYWORD_ROADMAP_KO;
          keywordUpcoming = KEYWORD_UPCOMING_KO;
        }
        prompt = prompt.replace(/\{\{WINDOW_DAYS\}\}/g, '21');
        return prompt.replace(/\{\{KEYWORD_ONGOING_WORK\}\}/g, keywordOnGoingWork)
                    .replace(/\{\{KEYWORD_ROADMAP\}\}/g, keywordRoadmap)
                    .replace(/\{\{KEYWORD_UPCOMING\}\}/g, keywordUpcoming);
    }
    return prompt;
  }
