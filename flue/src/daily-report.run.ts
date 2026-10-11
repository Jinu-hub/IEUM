// Renders a saved Daily Core to <out>.md and <out>.html.
// Run: npx tsx flue/src/daily-report.run.ts <file> <out> [report.json]
// <file> is a core_json, or a saved /core/generate response (its first line is JSON with coreJson).
// [report.json] is a saved /report/generate response; its draft replaces the event sections.
import { readFileSync, writeFileSync } from "node:fs";
import { type DailyCoreJson, renderDailyReport } from "./daily-report.ts";

const [file, out, reportFile] = process.argv.slice(2);
if (!file || !out) throw new Error("usage: daily-report.run.ts <file> <out> [report.json]");

const firstLine = (path: string) => JSON.parse(readFileSync(path, "utf8").split("\n")[0]);
const saved = firstLine(file);
const core: DailyCoreJson = saved.coreJson ?? saved;
const report = renderDailyReport(core, reportFile ? firstLine(reportFile).draft : undefined);
writeFileSync(`${out}.md`, report.markdown);
writeFileSync(`${out}.html`, report.html);
console.log(report.subject);
console.log(`${out}.md ${report.markdown.length} chars, ${out}.html ${report.html.length} chars`);
