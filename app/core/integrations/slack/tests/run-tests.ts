import "dotenv/config";

type TestFn = () => Promise<void> | void;
const tests: Array<{ name: string; fn: TestFn }> = [];

function test(name: string, fn: TestFn) { tests.push({ name, fn }); }
function assert(cond: unknown, msg: string) { if (!cond) throw new Error(msg); }

import { registerConfigTests } from "./unit-config.ts";
registerConfigTests({ test, assert });

async function main() {
  let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log(`PASS ${t.name}`); }
    catch (e) { failed++; console.error(`FAIL ${t.name}:`, e); }
  }
  if (failed) process.exit(1);
}

main();


