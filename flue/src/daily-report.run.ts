// Renders a saved Daily Core to <out>.md and <out>.html.
// Run: npx tsx flue/src/daily-report.run.ts <file> <out>
// <file> is a core_json, or a saved /core/generate response (its first line is JSON with coreJson).
import { readFileSync, writeFileSync } from "node:fs";
import { type DailyCoreJson, renderDailyReport } from "./daily-report.ts";

const [file, out] = process.argv.slice(2);
if (!file || !out) throw new Error("usage: daily-report.run.ts <file> <out>");

const saved = JSON.parse(readFileSync(file, "utf8").split("\n")[0]);
const core: DailyCoreJson = saved.coreJson ?? saved;
const report = renderDailyReport(core);
writeFileSync(`${out}.md`, report.markdown);
writeFileSync(`${out}.html`, report.html);
console.log(report.subject);
console.log(`${out}.md ${report.markdown.length} chars, ${out}.html ${report.html.length} chars`);
