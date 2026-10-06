/** Set CRON_RECORD=0 to run the pipeline without newsletter_runs / run_log_events / edition rows. */
export function recordRuns() {
  return process.env.CRON_RECORD !== "0";
}
