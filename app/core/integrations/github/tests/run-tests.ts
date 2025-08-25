import "dotenv/config";

type TestFn = () => Promise<void> | void;

const tests: Array<{ name: string; fn: TestFn }> = [];

function test(name: string, fn: TestFn) {
  tests.push({ name, fn });
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// Register tests
import { registerConfigTests } from "./unit-config";
import { registerWriterTests } from "./unit-writer";

registerConfigTests({ test, assert });
registerWriterTests({ test, assert });

async function main() {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`PASS ${t.name}`);
    } catch (err) {
      failed++;
      console.error(`FAIL ${t.name}:`, err);
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main();


