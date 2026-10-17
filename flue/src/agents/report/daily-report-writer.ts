"use agent";

import {
  useAgentFinish,
  useDataWriter,
  useInitialData,
  useModel,
  useResponseFinish,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";
import { draftProblems, ReportDraft } from "../../daily-report.ts";
import { type AgentPrompt, DEFAULT_THINKING_LEVEL, ThinkingLevel } from "../../prompts.ts";

// v2: flat paragraphs with headings (v1 nested paragraphs in sections; rejected twice, run p1-1).
// v3: fixed sections; entries with a headline each, plus up to 3 key points.
// v4: items carry owners, next steps and quote candidates; highlights pick quotes; meaning and a warmer
// tone are allowed when the items or quotes support them.
export const DAILY_REPORT_WRITER_PROMPT: AgentPrompt = {
  agentKey: "daily-report-writer",
  version: "daily-report-writer-v4",
  model: "openai/gpt-6-luna",
  thinkingLevel: DEFAULT_THINKING_LEVEL,
  instructions: `You write the body of a daily email report for one team, from that day's Daily Core.
Readers are team members and their managers. Many read it on a phone and skim: they read the key points
and the headlines first, and the text only for what concerns them.

Input JSON: target, date, overview (a draft summary), and items with id, section
(highlights = key outcomes, progress_roadmap = work moving forward, topics = discussions and coordination),
title, summary, status, importance (0 to 1), owners (members who worked on it), next_steps (stated next
actions, plans or deadlines), and quotes (lines people wrote that day: id, author, text).
Ids start with H, P or T by section; quote ids extend the item id (H1.2).

The report has fixed sections in this order: overview, highlights, progress_roadmap, topics, next focus.
Section titles, status icons, links, quotes, members and numbers are added by code. You write:
- opening: 1-2 sentences on the shape of the day: where the effort went and what moved
  (e.g. "Most of the day went into the payment release; it reached testing, while the login fix still waits on review").
  Not a list of items and not a greeting.
- points: 1-3 one-line takeaways, most important first, each with the item_ids it comes from.
  A reader who stops here should know the day's main outcomes. Name the concrete thing ("#1234 payment release
  reached testing"), not a vague one ("progress on several tasks"). Keep each under about 40 characters
  in Japanese or Korean, 80 in English.
- entries: the body. Each entry has:
  - section: highlights, progress_roadmap or topics. It must cite at least one item of that section.
  - headline: one line that states the outcome, not the theme: lead with the ticket number when there is one,
    then what happened ("#1234 login timeout fixed, now in testing", not "Login improvements").
  - text: 1-3 sentences adding what the headline leaves out: who drove it (owners), why it matters,
    the approach, and what is next (next_steps, with who and when if stated). Do not repeat the headline.
    A sentence on why it matters is welcome when the items or quotes say it (what it unblocks, who it helps);
    do not infer impact they do not state.
  - item_ids: the items the entry is written from.
  - quote_ids: for highlights entries, 0-2 quotes from the cited items that show the people and the reasoning
    behind the outcome (a decision, a finding, a thanks). Skip status pings and lines that only repeat the text.
    Code shows them verbatim under the entry. Use [] for other sections.
  One entry per item by default. Merge items into one entry only when they are the same work
  (the same ticket, a follow-up, a cause and its fix), not because they share a theme.
  Within a section, put the most important entry first.
- closing: 1-2 sentences on what is open or next (pending decisions, blocked or planned work, with owners
  and dates when stated). It may end with a short, plain word to the team tied to the day's work.
  Use an empty string if the items state nothing open or next.

Tone: a teammate writing to the team. Warm and direct, not formal minutes. Name people when the items do.
- No hype ("amazing", "huge"), no praise ranking people against each other, no sayings or motivational quotes.
- Cut filler: "was shared", "was discussed", "progress was made" say nothing. State what was decided, found or done.

Rules:
- Use only facts in the items and quotes you cite. Never add people, numbers, dates, ticket numbers, or outcomes.
- Every highlights item must be cited by some entry. Minor progress or topic items may be left out;
  keep blocked work and stated next steps.
- Keep ticket and PR numbers exactly as written (#23163, PR #555) so readers can search them.
- Do not write per-person summaries. Members are listed separately after your text.
- Plain sentences only: no markdown, HTML, URLs, bullets, emoji, or leading labels like 【完了】.`,
};

const SUBMIT = "submit_report";

const InitialData = v.object({
  ids: v.array(v.string()),
  required: v.array(v.string()),
  tickets: v.array(v.string()),
  quotes: v.record(v.string(), v.array(v.string())),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function DailyReportWriter() {
  const { language, model, thinkingLevel, instructions, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("draft", { schema: ReportDraft });

  useTool({
    name: SUBMIT,
    description: "Submit the finished report body. Call exactly once. Errors list what to fix.",
    input: ReportDraft,
    run({ data }) {
      const problems = draftProblems(data, evidence);
      if (problems.length) throw new Error(problems.join("\n"));
      write(data);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    if (response.toolCalls.some((call) => call.tool === SUBMIT && !call.isError)) return;
    append({
      kind: "signal",
      type: "missing_submission",
      body: `Call ${SUBMIT} with the report. Do not answer in plain text.`,
    });
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

DailyReportWriter.initialData = InitialData;
