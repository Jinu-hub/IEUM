-- 2-1) 생성/저장 (store)
-- credential_ref를 Vault의 name으로 사용
-- 새 Secret UUID를 반환하면서 integrations.api_key_ref에 저장
create or replace function public.secret_store_by_ref(p_credential_ref text, p_value text)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_integration record;
  v_secret_id uuid;
begin
  -- 1) service_role만 허용
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  -- 2) 통합 존재 여부 확인 (RLS 무시하고 강제 조회가 필요하면 명시 스키마+SECURITY DEFINER로 충분)
  select integration_id, workspace_id
    into v_integration
    from public.integrations
   where credential_ref = p_credential_ref
   limit 1;

  if v_integration.integration_id is null then
    raise exception 'integration not found for credential_ref=%', p_credential_ref;
  end if;

  -- 3) Vault에 생성 (name=credential_ref)
  select vault.create_secret(p_value, p_credential_ref, 'managed by secret_store_by_ref')
    into v_secret_id;

  -- 4) 통합 테이블에 secret uuid 보관
  update public.integrations
     set api_key_ref = v_secret_id::text,
         updated_at = now()
   where integration_id = v_integration.integration_id;

  return v_secret_id;
end $$;

revoke all on function public.secret_store_by_ref(text,text) from public, anon, authenticated;
grant execute on function public.secret_store_by_ref(text,text) to service_role;


-- 2-2) 조회 (get)
-- 반환은 원문 토큰 문자열. 정말 필요한 백엔드 경로에서만 호출.
-- 비즈니스 규칙상, “읽기”도 서비스만 가능.
create or replace function public.secret_read_by_ref(p_credential_ref text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_api_key_ref uuid;
  v_value text;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select api_key_ref::uuid into v_api_key_ref
  from public.integrations
  where credential_ref = p_credential_ref
  limit 1;

  if v_api_key_ref is null then
    -- 과거에 UUID를 저장하지 않았을 수도 있으므로 name 기반 조회 시도
    select decrypted_secret into v_value
    from vault.decrypted_secrets
    where name = p_credential_ref
    limit 1;

    if v_value is null then
      raise exception 'secret not found for credential_ref=%', p_credential_ref;
    end if;

    return v_value;
  end if;

  -- UUID 기반 조회 (정석)
  select decrypted_secret into v_value
  from vault.decrypted_secrets
  where id = v_api_key_ref
  limit 1;

  if v_value is null then
    raise exception 'secret not found (by id) for credential_ref=%', p_credential_ref;
  end if;

  return v_value;
end $$;

revoke all on function public.secret_read_by_ref(text) from public, anon, authenticated;
grant execute on function public.secret_read_by_ref(text) to service_role;


-- 2-3) 업데이트/회전 (update)
-- 먼저 integrations.api_key_ref에서 UUID를 찾고, 없으면 이름기반으로 대체.
create or replace function public.secret_update_by_ref(p_credential_ref text, p_new_value text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_integration record;
  v_secret_id uuid;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select integration_id, api_key_ref::uuid as api_key_uuid
    into v_integration
    from public.integrations
   where credential_ref = p_credential_ref
   limit 1;

  if v_integration.integration_id is null then
    raise exception 'integration not found for credential_ref=%', p_credential_ref;
  end if;

  if v_integration.api_key_uuid is not null then
    -- UUID 기반 회전 (정석)
    perform vault.update_secret(v_integration.api_key_uuid, p_new_value, null, null);
  else
    -- 과거에 UUID를 보관하지 않았을 경우: 이름기반으로 먼저 생성/치환
    select vault.create_secret(p_new_value, p_credential_ref, 'rotated by secret_update_by_ref')
      into v_secret_id;

    update public.integrations
       set api_key_ref = v_secret_id::text,
           updated_at = now()
     where integration_id = v_integration.integration_id;
  end if;
end $$;

revoke all on function public.secret_update_by_ref(text,text) from public, anon, authenticated;
grant execute on function public.secret_update_by_ref(text,text) to service_role;


-- 2-4) 삭제 (delete)
-- 이름기반/UUID기반 둘 다 정리
create or replace function public.secret_delete_by_ref(p_credential_ref text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_integration record;
begin
  if current_setting('role', true) <> 'service_role' then
    raise exception 'service role required';
  end if;

  select integration_id, api_key_ref::uuid as api_key_uuid
    into v_integration
    from public.integrations
   where credential_ref = p_credential_ref
   limit 1;

  -- vault.secrets (or decrypted_secrets)에서 name으로 지우는 루틴
  delete from vault.secrets where name = p_credential_ref;

  -- UUID 보관되어 있으면 추가 삭제 시도 (동일 대상일 경우 없어도 무해)
  if v_integration.api_key_uuid is not null then
    delete from vault.secrets where id = v_integration.api_key_uuid;
  end if;

  if v_integration.integration_id is not null then
    update public.integrations
       set api_key_ref = null,
           updated_at = now()
     where integration_id = v_integration.integration_id;
  end if;
end $$;

revoke all on function public.secret_delete_by_ref(text) from public, anon, authenticated;
grant execute on function public.secret_delete_by_ref(text) to service_role;
