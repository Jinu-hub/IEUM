import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

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
    const { data, error } = await client
        .from('integrations')
        .update({ credential_ref: credential_ref })
        .eq('workspace_id', workspaceId)
        .eq('type', type as Database["public"]["Enums"]["integration_type"])
        .select().single();
    if (error) {
        console.error('updateCredentialRef error', error);
        throw error
    }
    return data;
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

/*
export const updateBookmarkCategoryName = async (
    client: SupabaseClient<Database>,
    { userId, name, categoryId }:
    { userId: string, name: string, categoryId: number },
) => {
    const { error } = await client
        .from('category')
        .update({ category_name: name })
        .eq('user_id', userId)
        .eq('category_id', categoryId)  
        .eq('content_type_id', 1)
    if (error) {
        throw error
    }
}

export const deleteBookmarkCategory = async (
    client: SupabaseClient<Database>,
    { userId, categoryId }: { userId: string, categoryId: number },
) => {
    const { data, error } = await client
        .from('category')
        .delete()
        .eq('user_id', userId)
        .eq('category_id', categoryId)
        .eq('content_type_id', 1)
    if (error) {
        throw error
    }
    return data
}


export const createBookmark = async (
    client: SupabaseClient<Database>,
    { user_id, category_id, title, url, thumbnail_url, description }:
    { user_id: string, category_id: number, title: string, url: string, thumbnail_url: string, description: string },
) => {
    const realCategoryId = category_id === 0 ? null : category_id;
    const { data, error } = await client
        .from('bookmark')
        .insert({ 
            user_id, 
            category_id: realCategoryId, 
            title, 
            url, 
            thumbnail_url, 
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select().single();
    if (error) {
        console.error('createBookmark error', error);
        throw error
    }
    return data;
}

export const updateBookmark = async (
    client: SupabaseClient<Database>,
    { user_id, bookmark_id, category_id, title, url }:
    { user_id: string, bookmark_id: number, category_id: number, title: string, url: string },
) => {
    const realCategoryId = category_id === 0 ? null : category_id;
    const { data, error } = await client
        .from('bookmark')
        .update({ category_id: realCategoryId, title, url })
        .eq('user_id', user_id)
        .eq('bookmark_id', bookmark_id)
        .select().single();
    if (error) {
        throw error
    }
    return data
}

export const deleteBookmark = async (
    client: SupabaseClient<Database>,
    { user_id, bookmark_id }: { user_id: string, bookmark_id: number },
) => {
    const { data, error } = await client
        .from('bookmark')
        .delete()
        .eq('user_id', user_id)
        .eq('bookmark_id', bookmark_id)
        .select()
    if (error) {
        throw error
    }
    return data?.length > 0 ? data[0] : null;
}

export const updateBookmarkClickCount = async (
    client: SupabaseClient<Database>,
    { user_id, bookmark_id }: { user_id: string, bookmark_id: number },
) => {
    try {
        const data = await registUserActivity(client, {
            user_id,
            content_type_id: 1,
            target_id: bookmark_id,
            activity_type: 'click',
        });
        return data;
    } catch (error) {
        console.error("updateBookmarkClickCount error", error);
        throw error;
    }
}
    */