-- Integration Info View
-- 통합 정보와 상태를 결합한 뷰

CREATE OR REPLACE VIEW v_integration_info AS
SELECT 
    -- Integration 기본 정보
    i.integration_id,
    i.workspace_id,
    i.type,
    i.name,
    i.credential_ref,
    i.webhook_url,
    i.api_key_ref,
    i.config_json,
    i.is_active,
    i.created_at,
    i.updated_at,
    i.created_by,
    
    -- Integration Status 정보
    s.connection_status,
    s.last_checked_at,
    s.last_ok_at,
    s.expires_at,
    s.provider_error_code,
    s.provider_error_message,
    s.permissions_json,
    s.resource_cache_json,
    
    -- 계산된 필드
    CASE 
        WHEN s.connection_status IS NULL THEN 'never'::connection_status
        WHEN s.connection_status = 'connected' AND s.expires_at > NOW() THEN 'connected'::connection_status
        WHEN s.connection_status = 'connected' AND s.expires_at <= NOW() THEN 'expired'::connection_status
        WHEN s.connection_status = 'error' THEN 'error'::connection_status
        ELSE s.connection_status
    END AS computed_status,
    
    -- 마지막 체크로부터 경과 시간 (분)
    CASE 
        WHEN s.last_checked_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (NOW() - s.last_checked_at)) / 60
        ELSE NULL
    END AS minutes_since_last_check,
    
    -- 마지막 성공으로부터 경과 시간 (분)
    CASE 
        WHEN s.last_ok_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (NOW() - s.last_ok_at)) / 60
        ELSE NULL
    END AS minutes_since_last_ok,
    
    -- 만료까지 남은 시간 (분)
    CASE 
        WHEN s.expires_at IS NOT NULL AND s.expires_at > NOW()
        THEN EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 60
        ELSE NULL
    END AS minutes_until_expiry

FROM integrations i
LEFT OUTER JOIN integration_statuses s 
    ON i.integration_id = s.integration_id
WHERE i.is_active = true;

-- 인덱스 힌트를 위한 코멘트
COMMENT ON VIEW v_integration_info IS 'Integration 정보와 상태를 결합한 뷰. 활성화된 통합만 표시하며 계산된 상태 필드를 포함합니다. computed_status는 connection_status ENUM 값을 사용합니다.';

-- 뷰에 RLS 정책 적용 (integrations 테이블의 정책을 상속)
-- 실제로는 뷰에 직접 RLS를 적용할 수 없으므로, 
-- 사용 시 workspace_id 필터링이 필요합니다.
