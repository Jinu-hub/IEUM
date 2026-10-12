"use agent";

// Optional Call 0, as in 02-pipeline-architecture.md: SignalExtractor turns every line into facts and
// CoreInterpreter groups the facts into items instead of reading the raw lines. Runs for targets whose
// pipeline_options has "signals": true.

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
  // v2: v1 (split1) wrote people's names as made-up kanji full names, gave the same fact twice, and put a
  // morning plan and an evening report in one signal; one person's daily tasks got a subject each.
  version: "signal-extractor-v2",
  model: "openai/gpt-6-luna",
  thinkingLevel: "low",
  instructions: `
You extract signals from one team's activity on one local day.
A later step groups the signals into a daily memory, so every useful fact
must be in a signal and nothing else is needed.

The input contains Slack messages and repository events grouped by source.
Each line has a source_ref. Replies appear under their thread parent.
Older lines marked "(context, YYYY-MM-DD)" explain today's replies but are
not today's activity. Bot notifications provide context only.

A signal is one fact a reader may need:
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
- A line that covers several pieces of work gives one signal per piece.
- A signal cites the lines that state its fact: one line, or a question
  and its direct answer. A later message about the same work is its own
  signal, so a morning plan and an evening report stay apart. Add a
  context line when the fact needs it.
- State each fact once. Two signals never carry the same fact.
- subject: the work the fact is about, named the way people name it in
  the input. Use the same subject text for every signal about the same work.
  A thread about several pieces of work gives several subjects.
  Tasks a person lists in a daily plan or report that nobody discusses
  elsewhere share one subject: that person's name and "daily work".
- fact: one specific sentence. Who did or said what, with dates, numbers,
  and conditions the input gives. Only what the input says.
- Write people's names exactly as they appear in the input. Never
  translate, complete, or change them.
`,
};

export const Signal = v.object({
  refs: v.pipe(v.array(v.string()), v.minLength(1), v.description("source_ref ids the fact comes from, e.g. S012.")),
  kind: v.picklist(["request", "question", "answer", "decision", "plan", "progress", "issue", "info", "ack"]),
  subject: v.pipe(v.string(), v.description("The work this fact is about. Same text for the same work.")),
  fact: v.pipe(v.string(), v.description("One specific sentence: who did or said what.")),
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
    write(signals);
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

const RAW_INPUT = `The input contains Slack messages and repository events grouped by source.
Each line has a source_ref. Replies appear under their thread parent.
Older lines marked "(context, YYYY-MM-DD)" explain today's replies but are
not today's activity. Bot notifications provide context; they do not by
themselves prove that a person performed work.`;

const SIGNAL_INPUT = `The input lists signals extracted from the day's Slack messages and
repository events. Signals about the same work are grouped under its
subject. Groups and signals are in time order. Each signal gives the time
its lines were written ("context" for older lines), the source_refs, who
wrote those lines, its kind, and the fact. Cite those source_refs as
evidence_refs.

The groups are a first guess. Use a group as an item when it fits, but:
- merge groups that are the same work under different names;
- split a group that holds different requests or changes;
- fold a small group of one person's tasks into that person's daily work
  item when the tasks have no discussion of their own.
When signals in an item report different times, the latest one gives the
current state; earlier plans and expectations are history. Signals of kind
ack need no item.`;

// CoreInterpreter's instructions with the input description swapped for signals; the rest stays the same.
// A prompt DB template for core-interpreter must keep RAW_INPUT word for word, or signal runs fail here.
export function splitInterpreterInstructions(instructions: string) {
  if (!instructions.includes(RAW_INPUT)) throw new Error("core interpreter instructions changed; update RAW_INPUT");
  return instructions.replace(RAW_INPUT, SIGNAL_INPUT);
}

// "HH:MM" per ref from the raw input lines ("[S011] 09:31 ..."), "context" for older lines.
export function refTimes(body: string) {
  const times: Record<string, string> = {};
  for (const m of body.matchAll(/\[(\w+)\] (?:(\d\d:\d\d)|\(context)/g)) times[m[1]] = m[2] ?? "context";
  return times;
}

// The interpreter's message: the header lines of the raw input, then signals grouped by subject. Signals
// are sorted by their earliest line, so groups come in the order their work first appears.
export function signalsBody(header: string, signals: Signal[], authors: Record<string, string>, times: Record<string, string>) {
  const span = (s: Signal) => {
    const ts = s.refs.map((ref) => times[ref] ?? "?").filter((t) => t !== "context").sort();
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
        return `- ${span(s)} [${s.refs.join(", ")}] ${who || "?"} | ${s.kind} | ${s.fact}`;
      }),
      "",
    ]),
  ].join("\n");
}
