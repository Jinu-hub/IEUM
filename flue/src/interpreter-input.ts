import { splitInterpreterInstructions } from "./agents/core/signal-extractor.ts";

export type SignalsMode = "raw+signals" | "signals";
export const SIGNAL_REFERENCE_VERSION = "signal-reference-v1.0";

const REFERENCE_INSTRUCTIONS = `
## Using supplementary signals
The message contains the complete raw source followed by supplementary signals from another model.
The raw source is the authority for facts. Signals are fallible navigation hints, not evidence or a complete inventory.
Read every raw source line, including work that no signal mentions. Verify signal facts against their cited raw lines.
If a signal omits, changes, or contradicts the raw source, use the raw source and disregard that signal's claim.
Decide work boundaries independently from the raw source. Signal subjects and kinds do not determine items,
importance, status, actors, or next steps. Merge or split freely; do not force one item per subject.
Cite original source_refs only. Never treat a signal's wording as an additional source.
`;

// Keep the no-signals branch byte-for-byte identical to the existing raw input and instructions.
export function interpreterInput(body: string, instructions: string, signalsBody?: string, mode: SignalsMode = "raw+signals") {
  if (signalsBody === undefined) return { body, instructions, mode: "raw" as const };
  if (mode === "signals") {
    return { body: signalsBody, instructions: splitInterpreterInstructions(instructions), mode };
  }
  return {
    body: `# Raw source (authoritative)\n\n${body}\n\n# Supplementary signals (fallible reference only)\n\n${signalsBody}`,
    instructions: `${instructions}\n${REFERENCE_INSTRUCTIONS}`,
    mode,
  };
}
