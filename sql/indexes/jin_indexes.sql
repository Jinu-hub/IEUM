CREATE INDEX idx_integrations_config_json ON integrations USING GIN (config_json);
CREATE INDEX idx_target_sources_filter_json ON target_sources USING GIN (filter_json);
CREATE INDEX idx_newsletter_runs_metrics_gin ON newsletter_runs USING GIN (metrics_json);
CREATE INDEX idx_newsletter_editions_stats_gin ON newsletter_editions USING GIN (stats_json);
CREATE INDEX idx_highlights_meta_gin ON highlights USING GIN (meta_json);
CREATE INDEX idx_delivery_events_meta_gin ON delivery_events_email USING GIN (meta_json);
CREATE INDEX idx_audit_logs_old_values_gin ON audit_logs USING GIN (old_values);
CREATE INDEX idx_audit_logs_new_values_gin ON audit_logs USING GIN (new_values);