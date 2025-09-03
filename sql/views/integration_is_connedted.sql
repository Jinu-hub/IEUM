-- 예: 파생 is_connected 뷰
CREATE VIEW v_integration_is_connected AS
SELECT i.integration_id,
       (s.connection_status = 'connected'
        AND s.last_ok_at > now() - interval '10 days') AS is_connected
FROM integrations i
LEFT JOIN integration_statuses s USING (integration_id);
