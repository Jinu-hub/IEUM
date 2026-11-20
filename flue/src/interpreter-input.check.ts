import assert from "node:assert/strict";
import { CORE_INTERPRETER_PROMPT } from "./agents/core/core-interpreter.ts";
import { interpreterInput } from "./interpreter-input.ts";

const raw = "[S020] 09:46 A: Prioritize the next work. #23000 needs a specification change.";
const signals = "## Next work\n- [S020] A | decision | Prioritize the next work.";
const prompt = CORE_INTERPRETER_PROMPT.instructions;
assert.deepEqual(interpreterInput(raw, prompt), { body: raw, instructions: prompt, mode: "raw" });
const hybrid = interpreterInput(raw, prompt, signals);
assert.equal(hybrid.mode, "raw+signals");
assert.ok(hybrid.body.includes(raw));
assert.ok(hybrid.body.includes(signals));
assert.ok(hybrid.instructions.startsWith(prompt));
assert.ok(hybrid.instructions.includes("work that no signal mentions"));
// DB templates need no exact RAW_INPUT paragraph for the hybrid branch.
assert.doesNotThrow(() => interpreterInput(raw, "Custom DB instructions", signals));
const legacy = interpreterInput(raw, prompt, signals, "signals");
assert.equal(legacy.body, signals);
assert.ok(legacy.instructions.includes("Use a subject as an item"));
assert.equal(interpreterInput(raw, prompt, undefined, "signals").body, raw);
console.log("interpreter-input checks passed");
