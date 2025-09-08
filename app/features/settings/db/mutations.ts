import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
import type { TargetData, IntegrationSource } from "../lib/types";

export const createIntegration = async (
    client: SupabaseClient<Database>,
    { workspaceId, type, name, credential_ref, config_json }:
    { workspaceId: string, type: string, name: string, credential_ref: string, config_json: any },
) => {
    const { data, error } = await client
        .from('integrations')
        .upsert({
            workspace_id: workspaceId,
            type: type as Database["public"]["Enums"]["integration_type"],
            name: name,
            credential_ref: credential_ref,
            config_json: config_json
        }, {
            onConflict: 'workspace_id,type'
        }).select().single();
    if (error) {
        console.error('createIntegration error', error);
        throw error
    }
    return data;
}

export const updateCredentialRef = async (
    client: SupabaseClient<Database>,
    { workspaceId, type, credential_ref }:
    { workspaceId: string, type: string, credential_ref: string },
) => {
    const { data: integrationData, error: integrationError } = await client
        .from('integrations')
        .update({ credential_ref: credential_ref })
        .eq('workspace_id', workspaceId)
        .eq('type', type as Database["public"]["Enums"]["integration_type"])
        .select().single();

    if (credential_ref === '' && integrationData) {
        const { data, error } = await client
            .from('integration_statuses')
            .update({ connection_status: 'disconnected' })
            .eq('workspace_id', workspaceId)
            .eq('integration_id', integrationData.integration_id)
            .select().single();
        if (error) {
            console.error('updateCredentialRef error', error);
            throw error
        }
        return data;
    }
    if (integrationError) {
        console.error('updateCredentialRef error', integrationError);
        throw integrationError
    }
    return integrationData;
}

export const deleteIntegration = async (
    client: SupabaseClient<Database>,
    { workspaceId, type }: { workspaceId: string, type: string },
) => {
    const { data, error } = await client
        .from('integrations')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('type', type as Database["public"]["Enums"]["integration_type"]);
    if (error) {
        console.error('deleteIntegration error', error);
        throw error
    }
    return data;
}

export const createIntegrationStatusSuccess = async (
    client: SupabaseClient<Database>,
    { integrationId, workspaceId, connectionStatus, resourceCacheJson }:
    { integrationId: string, workspaceId: string, 
        connectionStatus: Database["public"]["Enums"]["connection_status"], 
        resourceCacheJson: any },
) => {
    const { data, error } = await client
        .from('integration_statuses')
        .upsert({ 
            integration_id: integrationId
            , workspace_id: workspaceId
            , connection_status: connectionStatus as Database["public"]["Enums"]["connection_status"]
            , last_checked_at: new Date().toISOString()
            , last_ok_at: new Date().toISOString()
            //, expires_at: new Date().toISOString()
            , provider_error_code: null
            , provider_error_message: null
            , resource_cache_json: resourceCacheJson
        }).select().single();
    if (error) {
        console.error('createIntegrationStatus error', error);
        throw error
    }
    return data;
}

export const createIntegrationStatusError = async (
    client: SupabaseClient<Database>,
    { integrationId, workspaceId, connectionStatus, providerErrorCode, providerErrorMessage }:
    { integrationId: string, workspaceId: string, 
        connectionStatus: Database["public"]["Enums"]["connection_status"], 
        providerErrorCode: string, providerErrorMessage: string },
) => {
    const { data, error } = await client
        .from('integration_statuses')
        .upsert({ 
            integration_id: integrationId
            , workspace_id: workspaceId
            , connection_status: connectionStatus as Database["public"]["Enums"]["connection_status"]
            , last_checked_at: new Date().toISOString()
            , provider_error_code: providerErrorCode
            , provider_error_message: providerErrorMessage
            , resource_cache_json: {}
        }).select().single();
    if (error) {
        console.error('createIntegrationStatus error', error);
        throw error
    }
    return data;
}

// 트랜잭션으로 Integration과 Status를 함께 생성
export const createIntegrationWithStatus = async (
    client: SupabaseClient<Database>,
    { workspaceId, type, name, credential_ref, config_json, connectionStatus, resourceCacheJson }:
    { 
        workspaceId: string, 
        type: string, 
        name: string, 
        credential_ref: string, 
        config_json: any,
        connectionStatus: Database["public"]["Enums"]["connection_status"],
        resourceCacheJson: any
    },
) => {
    let wasExistingIntegration = false;
    let originalIntegrationData = null;

    try {
        // 1. 기존 Integration이 있는지 확인
        const { data: existingIntegration } = await client
            .from('integrations')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('type', type as Database["public"]["Enums"]["integration_type"])
            .single();

        if (existingIntegration) {
            wasExistingIntegration = true;
            originalIntegrationData = { ...existingIntegration };
        }

        // 2. Integration 생성/업데이트
        const integrationData = await createIntegration(client, {
            workspaceId,
            type,
            name,
            credential_ref,
            config_json
        });

        // 3. Integration Status 생성
        const statusData = await createIntegrationStatusSuccess(client, {
            integrationId: integrationData.integration_id,
            workspaceId,
            connectionStatus,
            resourceCacheJson
        });

        return {
            integration: integrationData,
            status: statusData
        };
    } catch (error) {
        console.error('createIntegrationWithStatus error, attempting rollback', error);
        
        try {
            if (wasExistingIntegration && originalIntegrationData) {
                // 기존 Integration이 있었다면 원래 상태로 복원
                await client
                    .from('integrations')
                    .update({
                        name: originalIntegrationData.name,
                        credential_ref: originalIntegrationData.credential_ref,
                        config_json: originalIntegrationData.config_json
                    })
                    .eq('workspace_id', workspaceId)
                    .eq('type', type as Database["public"]["Enums"]["integration_type"]);
            } else {
                // 새로 생성된 Integration이라면 삭제
                await deleteIntegration(client, { workspaceId, type });
            }
        } catch (rollbackError) {
            console.error('Rollback failed', rollbackError);
        }
        
        throw error;
    }
}

export const insertTarget = async (
    client: SupabaseClient<Database>,
    { workspaceId, displayName, mailingListId, scheduleCron, timezone, isActive}:
    { workspaceId: string, displayName: string, mailingListId: string, scheduleCron: string, timezone: string, isActive: boolean},
) => {
    const { data, error } = await client
        .from('targets')
        .insert({
            workspace_id: workspaceId,
            display_name: displayName,
            mailing_list_id: mailingListId || null,
            schedule_cron: scheduleCron,
            timezone: timezone,
            is_active: isActive
        })
        .select().single();
    if (error) {
        console.error('createTarget error', error);
        throw error
    }
    return data;
}

export const updateTarget = async (
    client: SupabaseClient<Database>,
    { targetId, displayName, mailingListId, scheduleCron, timezone, isActive}:
    { targetId: string, displayName: string, mailingListId: string, scheduleCron: string, timezone: string, isActive: boolean},
) => {
    const { data, error } = await client
        .from('targets')
        .update({
            display_name: displayName,
            mailing_list_id: mailingListId || null,
            schedule_cron: scheduleCron,
            timezone: timezone,
            is_active: isActive
        })
        .eq('target_id', targetId)
        .select().single();
    if (error) {
        console.error('createTarget error', error);
        throw error
    }
    return data;
}

export const createTarget = async (
    client: SupabaseClient<Database>,
    { workspaceId, targets,  }:
    { workspaceId: string, targets: TargetData },
) => {
    if (targets.targetId) {
        return updateTarget(client, { 
            targetId: targets.targetId, 
            displayName: targets.displayName, 
            mailingListId: targets.mailingListId || '' , 
            scheduleCron: targets.scheduleCron || '', 
            timezone: targets.timezone, 
            isActive: targets.isActive });
    } else {
        return insertTarget(client, { 
            workspaceId: workspaceId, 
            displayName: targets.displayName, 
            mailingListId: targets.mailingListId || '', 
            scheduleCron: targets.scheduleCron || '', 
            timezone: targets.timezone, 
            isActive: targets.isActive });
    }
}

export const createTargetSources = async (
    client: SupabaseClient<Database>,
    { workspaceId, targetId, sources }:
    { workspaceId: string, targetId: string, sources: IntegrationSource },
) => {
    const { data, error } = await client
        .from('target_sources')
        .upsert({
            workspace_id: workspaceId,
            target_id: targetId,
            integration_id: sources.integrationId,
            source_type: sources.sourceType,
            source_ident: sources.sourceIdent,
        }, {
            onConflict: 'workspace_id,target_id,integration_id,source_type,source_ident'
        })
        .select().single();
    if (error) {
        console.error('createTargetSources error', error);
        throw error
    }
    return data;
}

export const deleteTarget = async (

    client: SupabaseClient<Database>,
    { targetId }: { targetId: string },
) => {
    const { data, error } = await client
        .from('targets')
        .delete()
        .eq('target_id', targetId)
        .select().single();
    if (error) {
        console.error('deleteTarget error', error);
        throw error
    }
    return data;
}

// target과 sources를 함께 생성
export const createTargetWithSources = async (
    client: SupabaseClient<Database>,
    { workspaceId, targets, sources }:
    { workspaceId: string, targets: TargetData, sources: IntegrationSource[] },
) => {
    let wasExistingTarget = false;
    let originalTargetData = null;
    let createdSources: any[] = [];

    try {
        // 1. 기존 Target이 있는지 확인
        if (targets.targetId) {
            const { data: existingTarget } = await client
                .from('targets')
                .select('*')
                .eq('target_id', targets.targetId)
                .single();

            if (existingTarget) {
                wasExistingTarget = true;
                originalTargetData = { ...existingTarget };
            }
        }

        // 2. Target 생성/업데이트
        const targetData = await createTarget(client, {
            workspaceId, targets
        });

        // 3. 여러 Target Sources 생성 (배치 처리)
        if (sources.length > 0) {
            for (const source of sources) {
                try {
                    const sourceData = await createTargetSources(client, {
                        targetId: targetData.target_id,
                        workspaceId,
                        sources: source
                    });
                    createdSources.push(sourceData);
                } catch (sourceError) {
                    console.error(`Failed to create source ${source.sourceIdent}:`, sourceError);
                    // 개별 소스 실패는 전체를 실패시키지 않음 (부분 성공 허용)
                    // 하지만 에러 로그는 남김
                }
            }
        }

        return {
            target: targetData,
            sources: createdSources,
            totalSources: sources.length,
            successfulSources: createdSources.length,
            failedSources: sources.length - createdSources.length
        };
    } catch (error) {
        console.error('createTargetWithMultipleSources error', error);

        try {
            // 롤백 처리
            if (wasExistingTarget && originalTargetData) {
                // 기존 Target이 있었다면 원래 상태로 복원
                await client
                    .from('targets')
                    .update({
                        display_name: originalTargetData.display_name,
                        mailing_list_id: originalTargetData.mailing_list_id,
                        schedule_cron: originalTargetData.schedule_cron,
                        timezone: originalTargetData.timezone,
                        is_active: originalTargetData.is_active
                    })
                    .eq('target_id', targets.targetId);
            } else if (targets.targetId) {
                // 새로 생성된 Target이라면 삭제
                await deleteTarget(client, { targetId: targets.targetId });
            }

            // 생성된 소스들도 삭제
            for (const createdSource of createdSources) {
                try {
                    await client
                        .from('target_sources')
                        .delete()
                        .eq('target_id', createdSource.target_id)
                        .eq('integration_id', createdSource.integration_id);
                } catch (deleteError) {
                    console.error('Failed to delete source during rollback:', deleteError);
                }
            }
        } catch (rollbackError) {
            console.error('Rollback failed', rollbackError);
        }
        
        throw error;
    }
}
