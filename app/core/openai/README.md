# AI Agents Module

다국어 지원이 가능한 AI 에이전트와 프롬프트 빌더 모듈입니다.

## 📂 구조

```
app/core/agents/
├── index.ts                           # 메인 진입점
├── test-agent.ts                      # AI Agent 정의
├── templates/                         # 다국어 템플릿
│   ├── index.ts                       # 템플릿 선택 로직
│   ├── github-template.en.ts          # 영어 템플릿
│   ├── github-template.ko.ts          # 한국어 템플릿
│   └── github-template.ja.ts          # 일본어 템플릿
├── formatters/                        # 데이터 포맷터
│   └── github-formatter.ts            # GitHub 데이터 포맷팅 (다국어)
└── prompts/                           # 프롬프트 빌더
    ├── index.ts                       # Public API
    └── prompt-builder.ts              # 프롬프트 생성 로직
```

## 🚀 사용 방법

### 기본 사용 (영어)

```typescript
import { summarizerAgent, buildPromptFromGithubData } from "~/core/agents";
import { run } from "@openai/agents";

const repos = [...]; // FetchedRepoData[]
const prompt = buildPromptFromGithubData(repos);
const content = await run(summarizerAgent, prompt);
```

### 다국어 지원

```typescript
import { summarizerAgent, buildGithubPrompt } from "~/core/agents";
import { run } from "@openai/agents";

// 한국어
const prompt = buildGithubPrompt(repos, 'ko');
const content = await run(summarizerAgent, prompt);

// 일본어
const prompt = buildGithubPrompt(repos, 'ja');
const content = await run(summarizerAgent, prompt);

// 영어 (기본값)
const prompt = buildGithubPrompt(repos, 'en');
const content = await run(summarizerAgent, prompt);
```

### 고급 사용 - 커스텀 포맷팅

```typescript
import { getGithubTemplate, formatGithubData } from "~/core/agents";

// 1. 템플릿 가져오기
const template = getGithubTemplate('ko');

// 2. 데이터 포맷팅
const formattedData = formatGithubData(repos, 'ko');

// 3. 수동으로 조합
const customPrompt = template.replace('{{REPO_DATA}}', formattedData);
```

## 🌍 지원 언어

- `en` - English (영어)
- `ko` - Korean (한국어)
- `ja` - Japanese (일본어)

## ➕ 새로운 언어 추가하기

### 1. 템플릿 파일 생성

```typescript
// app/core/agents/templates/github-template.es.ts
export const GITHUB_SUMMARY_TEMPLATE_ES = `
Genere un informe semanal de ingeniería basado en la siguiente actividad de GitHub:

{{REPO_DATA}}

Escriba un informe en markdown con:
...
`;
```

### 2. 템플릿 인덱스 업데이트

```typescript
// app/core/agents/templates/index.ts
import { GITHUB_SUMMARY_TEMPLATE_ES } from './github-template.es';

export type SupportedLanguage = 'en' | 'ko' | 'ja' | 'es';

const GITHUB_TEMPLATES: Record<SupportedLanguage, string> = {
  en: GITHUB_SUMMARY_TEMPLATE_EN,
  ko: GITHUB_SUMMARY_TEMPLATE_KO,
  ja: GITHUB_SUMMARY_TEMPLATE_JA,
  es: GITHUB_SUMMARY_TEMPLATE_ES, // 추가
};
```

### 3. 포맷터 라벨 추가

```typescript
// app/core/agents/formatters/github-formatter.ts
const LABELS: Record<SupportedLanguage, {...}> = {
  // ... 기존 언어들
  es: {
    repository: 'Repositorio',
    commits: 'Commits',
    mergedPRs: 'PRs fusionados',
    openedIssues: 'Issues abiertos',
    closedIssues: 'Issues cerrados',
  },
};
```

## 📝 예제

### create-contents.tsx에서 사용

```typescript
// 현재 방식 (영어만)
const summaryPrompt = buildPromptFromGithubData(
  Object.values(input.githubResult || {})
);

// 다국어 방식 (추천)
const summaryPrompt = buildGithubPrompt(
  Object.values(input.githubResult || {}),
  'ko' // 또는 사용자 언어 설정
);
```

## 🎯 장점

1. **다국어 지원**: 템플릿 파일만 추가하면 새로운 언어 지원
2. **유지보수 용이**: 프롬프트 수정이 코드 변경 없이 가능
3. **재사용성**: 동일한 프롬프트를 여러 곳에서 사용 가능
4. **타입 안전성**: TypeScript로 완전한 타입 체크
5. **확장성**: 새로운 템플릿 추가가 간단

## 🔧 개발 가이드

### 템플릿 변수 규칙

- 변수는 `{{VARIABLE_NAME}}` 형식으로 작성
- 대문자와 언더스코어만 사용
- 명확하고 설명적인 이름 사용

### 포맷터 규칙

- 모든 언어에서 동일한 데이터 구조 유지
- 빈 데이터에 대한 처리 포함
- 숫자는 포맷팅하지 않음 (국제화 고려)

## 📚 참고

- `buildPromptFromGithubData`: 기존 코드와의 호환성을 위한 래퍼 함수
- `buildGithubPrompt`: 다국어 지원이 포함된 새로운 함수 (권장)

