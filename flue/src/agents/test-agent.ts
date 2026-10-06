"use agent";

import { useModel } from "@flue/runtime";

export function TestAgent() {
  useModel("openai/gpt-4.1-mini");
  return "Reply with one short sentence. Include the word pineapple.";
}
