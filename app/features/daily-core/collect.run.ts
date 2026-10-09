// Collect + save only (no newsletter, Slack notification, or mail).
// npx tsx app/features/daily-core/collect.run.ts <targetId> <coreDate>
import "dotenv/config";
import adminClient from "~/core/lib/supa-admin-client.server";
import { collectTargetSources } from "~/features/cron/api/collect-sources";
import { saveDailyCoreCollection } from "./collect";
import { fetchDaysFor } from "./normalize";

const [targetId, coreDate] = process.argv.slice(2);
if (!targetId || !coreDate) throw new Error("usage: collect.run.ts <targetId> <coreDate>");

const { data: target, error } = await adminClient.from("targets").select("*").eq("target_id", targetId).single();
if (error) throw error;

const collected = await collectTargetSources(target, fetchDaysFor(coreDate, target.timezone ?? "UTC"));
if ("skip" in collected) throw new Error(collected.skip);

console.log("DAILY_CORE_RESULT", JSON.stringify(await saveDailyCoreCollection(target, collected, coreDate)));
