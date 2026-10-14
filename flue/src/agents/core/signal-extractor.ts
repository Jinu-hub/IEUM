"use agent";

// Optional Call 0, as in 02-pipeline-architecture.md: SignalExtractor gathers every line about one piece of
// work under one subject, in time order, so CoreInterpreter reads that instead of the raw lines. Runs for
// targets whose pipeline_options has "signals": true.

import {
  useAgentFinish,
  useDataWriter,
  useInitialData,
  useModel,
  usePersistentState,
  useResponseFinish,
  useTool,
} from "@flue/runtime";
import * as v from "valibot";
import { type AgentPrompt, ThinkingLevel } from "../../prompts.ts";

export const SIGNAL_EXTRACTOR_PROMPT: AgentPrompt = {
  agentKey: "signal-extractor",
  // v3: the output is shaped for CoreInterpreter. v2 (e1) split one piece of work across subjects (commit,
  // thread, daily report), scattered one assignment conversation over 4-6 subjects, named subjects
  // differently per run, merged a plan and a report into one signal, and lost words like 「宋さんに聞いてみて」.
  // A v4 (subjects listed before signals, code rejecting a signal that cites two lines by one person) was
  // dropped: 2 of 4 runs failed after rejections, 1 came back with 3 signals, and subjects did not get steadier.
  // v5: v3 plus a "Shared identifiers" list from code, so the model need not find the links across the day.
  // v6: v5 (e5-r3) dropped the second matter of a line already cited (#23000 in S020), put an answer
  // under another subject than its question (S052/S054), and wrote No.230 as "#230". The signal input
  // also tells the interpreter that kind is a label: with it, importance 4-5 rose from 4-6 items to 9.
  version: "signal-extractor-v6",
  model: "openai/gpt-6-luna",
  thinkingLevel: "low",
  instructions: `
You prepare one team's activity on one local day for the next step.
Your output is the only thing the next step reads. It turns each piece of
work into one item, judges its importance, and writes its summary. Make
that easy: put every line about a piece of work, from every source, under
one subject in time order, so the next step never has to search the raw
lines to learn which work a line belongs to, what a reply refers to, or
what the latest state is.

The input contains Slack messages and repository events grouped by source.
Each line has a source_ref. Replies appear under their thread parent.
Older lines marked "(context, YYYY-MM-DD)" explain today's replies but are
not today's activity. Bot notifications provide context only.

Subjects:
- One subject per piece of work for the whole day. A commit, a Slack
  thread, a daily plan, and an evening report about the same work share
  one subject, wherever they appear.
- Name a subject by its identifier (ticket, PR, or request-list number)
  and a short name taken from the input, such as "#123 short name". Work
  without an identifier gets the short name people use for it. Use the
  same text for every signal of that subject.
- A conversation that settles one question, such as who takes which work
  next, is one subject even when it names several pieces of work. A piece
  named there gets its own subject only for its own developments.
- An answer goes under the subject of the question it answers.
- Tasks a person lists in a daily plan or report that have no subject of
  their own share one subject: that person's name and "daily work". A task
  that has its own subject goes there instead.
- "Shared identifiers" after the input lists lines that mention the same
  number or link. They are often about the same work: read them together
  before choosing subjects. One identifier can still cover several pieces
  of work, so split them when the lines say so.

A signal is one development of one subject at one point in time:
- request: someone asks for an action, a review, a release, or an answer.
- question / answer: a question asked, or the answer given.
- decision: a choice, approval, priority, assignment, or schedule.
- plan: work someone intends to do, today or later.
- progress: work started, done, committed, or reported with its state.
- issue: a problem, blocker, or risk.
- info: information shared for others.
- ack: a greeting, thanks, or acknowledgement that adds nothing.

Rules:
- Every line a person wrote today is in the refs of at least one signal.
- Read each line to its end. A line that covers several pieces of work
  gives one signal per piece, each under its own subject, even when
  another signal already cites the line.
- A signal cites one line, or a question and its direct answer. A morning
  plan, a midday update, and an evening report are separate signals, so
  the latest state stays visible. Add a context line when the fact needs it.
- Cite only lines that state the fact. A daily plan that does not mention
  the work is not evidence for it.
- State each fact once. Two signals never carry the same fact.
- fact: one specific sentence. Who did or said what, with dates, numbers,
  states, and conditions the input gives. When a reply says "this" or
  names someone indirectly, say what or whom it means, using the input.
  Only what the input says.
- quote: when the fact shortens a line, copy the few words that carry its
  key detail (a deadline, a condition, advice, a reason) exactly as they
  appear in a cited line. Leave it empty when the fact already says it all.
- Write people's names and identifiers exactly as they appear in the
  input. Never   translate, complete, or change them; "No.12" stays
  "No.12", never "#12".
`,
};

export const Signal = v.object({
  refs: v.pipe(v.array(v.string()), v.minLength(1), v.description("source_ref ids the fact comes from, e.g. S012.")),
  kind: v.picklist(["request", "question", "answer", "decision", "plan", "progress", "issue", "info", "ack"]),
  subject: v.pipe(v.string(), v.description("The piece of work: its identifier and short name. Same text all day.")),
  fact: v.pipe(v.string(), v.description("One specific sentence: who did or said what.")),
  quote: v.optional(v.pipe(v.string(), v.description("Key words copied exactly from a cited line, or empty."))),
});
export type Signal = v.InferOutput<typeof Signal>;
const Signals = v.object({ signals: v.array(Signal) });

const SUBMIT = "submit_signals";
const ADD = "add_signals";

const InitialData = v.object({
  refs: v.array(v.string()),
  contextRefs: v.array(v.string()),
  botRefs: v.array(v.string()),
  authors: v.record(v.string(), v.string()),
  texts: v.record(v.string(), v.string()),
  language: v.string(),
  model: v.string(),
  thinkingLevel: ThinkingLevel,
  instructions: v.string(),
});
type InitialData = v.InferOutput<typeof InitialData>;

export function SignalExtractor() {
  const { language, model, thinkingLevel, instructions, refs, contextRefs, botRefs, authors, texts }: InitialData =
    useInitialData();
  useModel(model, { thinkingLevel });
  const write = useDataWriter("signals", { schema: v.array(Signal) });
  const [draft, setDraft] = usePersistentState<Signal[] | null>("draft", null);
  const [nudged, setNudged] = usePersistentState("addNudged", false);
  const known = new Set(refs);
  const skip = new Set([...contextRefs, ...botRefs]);

  // Writes the signals and returns the human lines no signal cites.
  const accept = (signals: Signal[]) => {
    const unknown = [...new Set(signals.flatMap((s) => s.refs).filter((ref) => !known.has(ref)))];
    if (unknown.length) throw new Error(`unknown refs ${unknown.join(", ")}`);
    write(signals.map((s) => ownDailyWork(s, authors)));
    const covered = new Set(signals.flatMap((s) => s.refs));
    return refs.filter((ref) => !skip.has(ref) && !covered.has(ref));
  };

  useTool({
    name: SUBMIT,
    description: "Submit the signals. Call exactly once.",
    input: Signals,
    run({ data }) {
      const missing = accept(data.signals);
      if (!missing.length) return { output: "accepted", terminate: true };
      setDraft(data.signals);
      return {
        output: [
          "Accepted. Lines a person wrote that no signal cites:",
          ...missing.map((ref) => `- [${ref}] ${authors[ref] ?? "?"}: ${(texts[ref] ?? "").slice(0, 120)}`),
          `Call ${ADD} once with signals for these lines only. Use kind ack for greetings and thanks.`,
        ].join("\n"),
      };
    },
  });

  useTool({
    name: ADD,
    description: `Add signals for lines ${SUBMIT} reported as missing. Call once.`,
    input: Signals,
    run({ data }) {
      if (!draft) throw new Error(`Call ${SUBMIT} first.`);
      accept([...draft, ...data.signals]);
      return { output: "accepted", terminate: true };
    },
  });

  useAgentFinish(({ response, append }) => {
    const done = (tool: string) => response.toolCalls.some((call) => call.tool === tool && !call.isError);
    if (done(ADD)) return;
    if (!done(SUBMIT)) {
      append({ kind: "signal", type: "missing_submission", body: `Call ${SUBMIT}. Do not answer in plain text.` });
    } else if (draft && !nudged) {
      setNudged(true);
      append({ kind: "signal", type: "missing_addition", body: `Call ${ADD} once. Do not answer in plain text.` });
    }
  });

  useResponseFinish(({ response }) => ({ usage: response.usage, toolCalls: response.toolCalls }));

  return `${instructions.trim()}
- Write every subject and fact in language: ${language}.
- Finish by calling ${SUBMIT} once. Do not reply in plain text.
- If ${SUBMIT} lists lines no signal cites, call ${ADD} once.`;
}

SignalExtractor.initialData = InitialData;

// A "<name> daily work" signal goes under the person who wrote its lines (e5-r3 put Yuuki Imai's plan
// under "Jinu Son daily work"). Renamed by code instead of rejected, as rejections failed v4 runs.
export function ownDailyWork(s: Signal, authors: Record<string, string>): Signal {
  const name = s.subject.trim().match(/^(.+?)\s*daily work$/i)?.[1];
  const writer = authors[s.refs[0]];
  if (!name || !writer || s.refs.some((ref) => authors[ref] === name)) return s;
  return { ...s, subject: `${writer} daily work` };
}

const RAW_INPUT = `The input contains Slack messages and repository events grouped by source.
Each line has a source_ref. Replies appear under their thread parent.
Older lines marked "(context, YYYY-MM-DD)" explain today's replies but are
not today's activity. Bot notifications provide context; they do not by
themselves prove that a person performed work.`;

const SIGNAL_INPUT = `The input lists signals extracted from the day's Slack messages and
repository events. Each subject gathers what was said and done about one
piece of work across all sources, in time order; a subject is usually one
item. Each signal gives the time its lines were written ("context" for
older lines), the source_refs, who wrote those lines, its kind, and the
fact. A "> " line under a signal quotes words exactly as written. Cite
those source_refs as evidence_refs.

Use a subject as an item, but merge two subjects that are the same work
under different names, and split a subject that holds different requests
or changes. When signals in an item report different times, the latest
one gives the current state; earlier plans and expectations are history.
Every subject is told by some item, small ones too. Signals of kind ack
need no item. A signal's kind is a label from the previous step, not a
ranking: judge importance by the rules below.`;

// CoreInterpreter's instructions with the input description swapped for signals; the rest stays the same.
// A prompt DB template for core-interpreter must keep RAW_INPUT word for word, or signal runs fail here.
export function splitInterpreterInstructions(instructions: string) {
  if (!instructions.includes(RAW_INPUT)) throw new Error("core interpreter instructions changed; update RAW_INPUT");
  return instructions.replace(RAW_INPUT, SIGNAL_INPUT);
}

// Per ref of the raw input ("[S011] 09:31 ..."): its time ("context" for older lines) and the rest of its line.
export function refLines(body: string) {
  const lines: Record<string, { time: string; text: string }> = {};
  for (const m of body.matchAll(/\[(\w+)\] (?:(\d\d:\d\d)|\(context)(.*)/g)) lines[m[1]] = { time: m[2] ?? "context", text: m[3] };
  return lines;
}

// Identifiers and links that more than one line mentions, with those lines ("- #22540: S011, S052, S054").
// Only generic shapes (#123, ABC-123, URLs without query or fragment; a URL ending in /123 also counts as
// #123, as issue and pull request links do), so no site's naming is built in.
// A hint for choosing subjects, not a grouping: one identifier can cover several pieces of work.
export function sharedIdentifiers(body: string) {
  const lines = new Map<string, string[]>();
  for (const [ref, { text }] of Object.entries(refLines(body))) {
    const found = text.match(/#\d{2,}|\b[A-Z][A-Z0-9_]*-\d+\b|https?:\/\/[^\s|>?#]+/g) ?? [];
    const numbered = found.flatMap((token) => token.match(/^https?:.*\/(\d{2,})$/)?.slice(1).map((n) => `#${n}`) ?? []);
    for (const token of new Set([...found, ...numbered])) {
      lines.set(token, [...(lines.get(token) ?? []), ref]);
    }
  }
  return [...lines].filter(([, refs]) => refs.length > 1).map(([token, refs]) => `- ${token}: ${refs.join(", ")}`);
}

// Whether the quote appears in one of the signal's lines, ignoring whitespace.
export function quoteFound(s: Signal, lines: Record<string, { text: string }>) {
  const squash = (text: string) => text.replace(/\s+/g, "");
  return !!s.quote?.trim() && s.refs.some((ref) => squash(lines[ref]?.text ?? "").includes(squash(s.quote!)));
}

// The interpreter's message: the header lines of the raw input, then signals grouped by subject. Signals
// are sorted by their earliest line, so groups come in the order their work first appears. Quotes not
// found in the cited lines are left out.
export function signalsBody(header: string, signals: Signal[], authors: Record<string, string>, lines: Record<string, { time: string; text: string }>) {
  const span = (s: Signal) => {
    const ts = s.refs.map((ref) => lines[ref]?.time ?? "?").filter((t) => t !== "context").sort();
    return ts.length ? (ts[0] === ts.at(-1) ? ts[0] : `${ts[0]}-${ts.at(-1)}`) : "context";
  };
  const sorted = [...signals].sort((a, b) => span(a).localeCompare(span(b)));
  const groups = new Map<string, Signal[]>();
  for (const s of sorted) groups.set(s.subject.trim(), [...(groups.get(s.subject.trim()) ?? []), s]);
  return [
    header,
    "",
    ...[...groups].flatMap(([subject, list]) => [
      `## ${subject}`,
      ...list.map((s) => {
        const who = [...new Set(s.refs.map((ref) => authors[ref]).filter(Boolean))].join(", ");
        const line = `- ${span(s)} [${s.refs.join(", ")}] ${who || "?"} | ${s.kind} | ${s.fact}`;
        return quoteFound(s, lines) ? `${line}\n  > ${s.quote!.trim()}` : line;
      }),
      "",
    ]),
  ].join("\n");
}
