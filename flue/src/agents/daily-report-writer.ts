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
import { draftProblems, ReportDraft } from "../daily-report.ts";

// v2: flat paragraphs with headings (v1 nested paragraphs in sections; rejected twice, run p1-1).
// v3: fixed sections; entries with a headline each, plus up to 3 key points.
export const DAILY_REPORT_WRITER_PROMPT_VERSION = "daily-report-writer-v3";

const SUBMIT = "submit_report";

const InitialData = v.object({
  ids: v.array(v.string()),
  required: v.array(v.string()),
  tickets: v.array(v.string()),
  language: v.string(),
  model: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function DailyReportWriter() {
  const { language, model, ...evidence }: InitialData = useInitialData();
  useModel(model, { thinkingLevel: "low" });
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

  return `You write the body of a daily email report for one team, from that day's Daily Core.
Readers are team members and their managers. Many read it on a phone and skim: they read the key points
and the headlines first, and the text only for what concerns them.

Input JSON: target, date, overview (a draft summary), and items with id, section
(highlights = key outcomes, progress_roadmap = work moving forward, topics = discussions and coordination),
title, summary, status, importance (0 to 1). Ids start with H, P or T by section.

The report has fixed sections in this order: overview, highlights, progress_roadmap, topics, next focus.
Section titles, status icons, links, members and numbers are added by code. You write:
- opening: 1-2 sentences on what the day was about as a whole.
- points: 1-3 one-line takeaways, most important first, each with the item_ids it comes from.
  A reader who stops here should know the day's main outcomes. Keep each under about 40 characters
  in Japanese or Korean, 80 in English.
- entries: the body. Each entry has:
  - section: highlights, progress_roadmap or topics. It must cite at least one item of that section.
  - headline: one line that states the outcome, not the theme: lead with the ticket number when there is one,
    then what happened ("#1234 login timeout fixed, now in testing", not "Login improvements").
  - text: 1-2 sentences adding what the headline leaves out: why, the approach, what is next.
    Do not repeat the headline.
  - item_ids: the items the entry is written from.
  One entry per item by default. Merge items into one entry only when they are the same work
  (the same ticket, a follow-up, a cause and its fix), not because they share a theme.
  Within a section, put the most important entry first.
- closing: 1-2 sentences on what is open or next (pending decisions, blocked or planned work).
  Use an empty string if the items state nothing like that.

Rules:
- Use only facts in the items you cite. Never add people, numbers, dates, ticket numbers, or outcomes.
- Every highlights item must be cited by some entry. Minor progress or topic items may be left out;
  keep blocked work and stated next steps.
- Keep ticket and PR numbers exactly as written (#23163, PR #555) so readers can search them.
- Do not write per-person summaries. Members are listed separately after your text.
- Plain sentences only: no markdown, HTML, URLs, bullets, or emoji.
- Write every human-readable text in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.`;
}

DailyReportWriter.initialData = InitialData;
