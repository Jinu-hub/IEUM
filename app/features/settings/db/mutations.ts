import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";
import type { IntegrationSource, TargetData } from "../lib/types";

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

/**
 * 인테그레이션용 Integration 생성/업데이트 함수
 * installation_id와 메타데이터를 포함한 완전한 연결 정보를 저장
 */
export const createOrUpdateIntegration = async (
    client: SupabaseClient<Database>,
    { workspace_id, type, credential_ref, connection_status, metadata, resourceCacheJson }:
    { 
        workspace_id: string, 
        type: string, 
        credential_ref: string, 
        connection_status: Database["public"]["Enums"]["connection_status"],
        metadata: any,
        resourceCacheJson?: any
    },
) => {
    try {
        // 1. Integration 생성/업데이트 (타입별 동적 처리)
        let integrationName: string;
        let config_json: any;
        
        if (type === 'github') {
            integrationName = metadata ? `GitHub (${metadata.account?.login || 'Unknown'})` : 'GitHub';
            config_json = metadata ? {
                installation_id: metadata.installation_id,
                account: metadata.account,
                repository_selection: metadata.repository_selection,
                permissions: metadata.permissions,
                setup_action: metadata.setup_action
            } : {};
        } else if (type === 'slack') {
            integrationName = `Slack - ${metadata.team_name || 'Unknown'}`;
            config_json = {
                team_id: metadata.team_id,
                team_name: metadata.team_name,
                bot_user_id: metadata.bot_user_id,
                authed_user_id: metadata.authed_user_id,
                scope: metadata.scope,
                user_scope: metadata.user_scope,
                app_id: metadata.app_id,
                token_type: metadata.token_type,
                created_at: metadata.created_at
            };
        } else {
            integrationName = `${type} Integration`;
            config_json = metadata;
        }

        const integrationData = await createIntegration(client, {
            workspaceId: workspace_id,
            type,
            name: integrationName,
            credential_ref,
            config_json
        });

        // 2. Integration Status 생성/업데이트
        const statusData = await createIntegrationStatusSuccess(client, {
            integrationId: integrationData.integration_id,
            workspaceId: workspace_id,
            connectionStatus: connection_status,
            resourceCacheJson: resourceCacheJson || {}
        });

        return {
            integration: integrationData,
            status: statusData
        };
    } catch (error) {
        console.error('createOrUpdateIntegration error', error);
        throw error;
    }
}

export const insertTarget = async (
    client: SupabaseClient<Database>,
    { workspaceId, displayName, mailingListId, scheduleCron, scheduleHour, timezone, isActive, isMemberMail}:
    { workspaceId: string, displayName: string, mailingListId: string, scheduleCron: string, scheduleHour: number, timezone: string, isActive: boolean, isMemberMail: boolean},
) => {
    const { data, error } = await client
        .from('targets')
        .insert({
            workspace_id: workspaceId,
            display_name: displayName,
            mailing_list_id: mailingListId || null,
            schedule_cron: scheduleCron,
            schedule_hour: scheduleHour,
            timezone: timezone,
            is_active: isActive,
            is_member_mail: isMemberMail
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
    { targetId, displayName, mailingListId, scheduleCron, scheduleHour, timezone, isActive, isMemberMail}:
    { targetId: string, displayName: string, mailingListId: string, scheduleCron: string, scheduleHour: number, timezone: string, isActive: boolean, isMemberMail: boolean},
) => {
    const { data, error } = await client
        .from('targets')
        .update({
            display_name: displayName,
            mailing_list_id: mailingListId || null,
            schedule_cron: scheduleCron,
            schedule_hour: scheduleHour,
            timezone: timezone,
            is_active: isActive,
            is_member_mail: isMemberMail
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
            scheduleHour: targets.scheduleHour ? parseInt(targets.scheduleHour) : 0,
            timezone: targets.timezone, 
            isActive: targets.isActive,
            isMemberMail: targets.isMemberMail || true });
    } else {
        return insertTarget(client, { 
            workspaceId: workspaceId, 
            displayName: targets.displayName, 
            mailingListId: targets.mailingListId || '', 
            scheduleCron: targets.scheduleCron || '', 
            scheduleHour: targets.scheduleHour ? parseInt(targets.scheduleHour) : 0,
            timezone: targets.timezone, 
            isActive: targets.isActive,
            isMemberMail: targets.isMemberMail || true});
    }
}

export const deleteTargetSources = async (
    client: SupabaseClient<Database>,
    { workspaceId, targetId }: { workspaceId: string, targetId: string },
) => {
    const { data, error } = await client
        .from('target_sources')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('target_id', targetId);
    if (error) {
        console.error('deleteTargetSources error', error);
        throw error
    }
    return data;
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
            is_member_mail: sources.isMemberMail,
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
        // sourcesが空、またはsourcesの中にisMemberMailがtrueのものが1つでもある場合、trueに設定
        targets.isMemberMail = sources.length === 0 || sources.some(source => source.isMemberMail === true);
        const targetData = await createTarget(client, {
            workspaceId, targets
        });

        // 3. 여러 Target Sources 생성 (배치 처리)
        await deleteTargetSources(client, { workspaceId, targetId: targetData.target_id });
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


export const switchTargetActive = async (
    client: SupabaseClient<Database>,
    { targetId }: { targetId: string },
) => {
    // 먼저 현재 상태를 조회
    const { data: currentTarget, error: fetchError } = await client
        .from('targets')
        .select('is_active')
        .eq('target_id', targetId)
        .single();
    
    if (fetchError) {
        console.error('fetchTargetActive error', fetchError);
        throw fetchError;
    }

    // 현재 상태를 반전시켜서 업데이트
    const { data, error } = await client
        .from('targets')
        .update({ is_active: !currentTarget.is_active })
        .eq('target_id', targetId)
        .select().single();
    
    if (error) {
        console.error('switchTargetActive error', error);
        throw error;
    }
    return data;
}


export const upsertMailingList = async (
    client: SupabaseClient<Database>,
    { mailingListId, workspaceId, name, description }: { mailingListId: string, workspaceId: string, name: string, description: string },
) => {
    const isNew = mailingListId === 'new';
    
    if (isNew) {
        // INSERT
        const { data, error } = await client
            .from('mail_list')
            .insert({
                workspace_id: workspaceId,
                name: name,
                description: description
            })
            .select().single();
        return data;
    } else {
        // UPDATE
        const { data, error } = await client
            .from('mail_list')
            .update({
                name: name,
                description: description
            })
            .eq('mailing_list_id', mailingListId)
            .select().single();
        return data;
    }
};

export const deleteMailingList = async (
    client: SupabaseClient<Database>,
    { mailingListId, workspaceId }: { mailingListId: string, workspaceId: string },
) => {
    const { data, error } = await client
        .from('mail_list')
        .delete()
        .eq('mailing_list_id', mailingListId)
        .eq('workspace_id', workspaceId)
        .select().single();
    if (error) {
        console.error('deleteMailingList error', error);
        throw error;
    }
    return data;
}

export const upsertMailingListMember = async (
    client: SupabaseClient<Database>,
    { mailingListId, email, displayName, metaJson }: { mailingListId: string, email: string, displayName: string, metaJson: any },
) => {
    const { data, error } = await client
        .from('mail_list_members')
        .upsert({
            mailing_list_id: mailingListId,
            email: email,
            display_name: displayName,
            meta_json: metaJson
        }, {
            onConflict: 'mailing_list_id,email'
        })
        .select().single();
    if (error) {
        console.error('upsertMailingListMember error', error);
        throw error;
    }
    return data;
}

export const deleteMailingListMember = async (
    client: SupabaseClient<Database>,
    { mailingListId, emails }: { mailingListId: string, emails: string | string[] },
) => {
    const emailArray = Array.isArray(emails) ? emails : [emails];
    
    const { data, error } = await client
        .from('mail_list_members')
        .delete()
        .eq('mailing_list_id', mailingListId)
        .in('email', emailArray)
        .select();
    if (error) {
        console.error('deleteMailingListMember error', error);
        throw error;
    }
    return data;
}

/**
 * Slack 채널 멤버십 변경 시 resource_cache_json 업데이트
 */
/**
 * レビューステップを更新
 */
export const updateReviewStep = async (
    client: SupabaseClient<Database>,
    { workspaceId, reviewStep }: { 
        workspaceId: string, 
        reviewStep: Database["public"]["Enums"]["review_step"] 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            review_step: reviewStep,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateReviewStep error', error);
        throw error;
    }
    return data;
};

export const updateSlackConnectedState = async (
    client: SupabaseClient<Database>,
    { workspaceId, slackConnected }: { 
        workspaceId: string, 
        slackConnected: boolean 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            slack_connected: slackConnected,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateSlackConnectedState error', error);
        throw error;
    }
    return data;
};

export const updateSlackChannelMembership = async (
    client: SupabaseClient<Database>,
    {
        workspaceId,
        integrationId,
        channelId,
        isMember
    }: {
        workspaceId: string;
        integrationId: string;
        channelId: string;
        isMember: boolean;
    }
): Promise<{ success: boolean; error?: string }> => {
    try {
        // 현재 integration_statuses 레코드 조회
        const { data: integrationStatus, error: fetchError } = await client
            .from('integration_statuses')
            .select('resource_cache_json')
            .eq('workspace_id', workspaceId)
            .eq('integration_id', integrationId)
            .single();
            
        if (fetchError) {
            console.error('Failed to fetch integration status', fetchError);
            return { success: false, error: `Failed to fetch integration status: ${fetchError.message}` };
        }
        
        if (!integrationStatus?.resource_cache_json) {
            return { success: false, error: 'No resource cache found' };
        }
        
        // channels 배열에서 해당 채널의 is_member 업데이트
        const resourceCache = integrationStatus.resource_cache_json as any;
        if (!resourceCache.channels || !Array.isArray(resourceCache.channels)) {
            return { success: false, error: 'Invalid channels data structure' };
        }
        
        const updatedChannels = resourceCache.channels.map((channel: any) => {
            if (channel.id === channelId) {
                return {
                    ...channel,
                    is_member: isMember
                };
            }
            return channel;
        });
        
        const updatedResourceCache = {
            ...resourceCache,
            channels: updatedChannels
        };
        
        // 데이터베이스 업데이트
        const { error: updateError } = await client
            .from('integration_statuses')
            .update({ 
                resource_cache_json: updatedResourceCache,
            })
            .eq('workspace_id', workspaceId)
            .eq('integration_id', integrationId);
            
        if (updateError) {
            console.error('Failed to update resource cache', updateError);
            return { success: false, error: `Failed to update resource cache: ${updateError.message}` };
        }
        
        return { success: true };
        
    } catch (error: any) {
        console.error('Error updating Slack channel membership', error);
        return { success: false, error: `Unexpected error: ${error.message}` };
    }
};

/**
 * オンボーディングステップを更新
 */
export const updateOnboardingStep = async (
    client: SupabaseClient<Database>,
    { workspaceId, onboardingStep }: { 
        workspaceId: string, 
        onboardingStep: Database["public"]["Enums"]["onboarding_step"] 
    }
) => {
    const isCompleted = onboardingStep === 'completed';
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            onboarding_step: onboardingStep,
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateOnboardingStep error', error);
        throw error;
    }
    return data;
};

/**
 * GitHub連携状態を更新
 */
export const updateGithubConnectedState = async (
    client: SupabaseClient<Database>,
    { workspaceId, githubConnected }: { 
        workspaceId: string, 
        githubConnected: boolean 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            github_connected: githubConnected,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateGithubConnectedState error', error);
        throw error;
    }
    return data;
};

/**
 * setup_integrationsサブステップを更新
 */
export const updateSetupIntegrationsStep = async (
    client: SupabaseClient<Database>,
    { workspaceId, setupIntegrationsStep }: { 
        workspaceId: string, 
        setupIntegrationsStep: Database["public"]["Enums"]["setup_integrations"] 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            setup_integrations: setupIntegrationsStep,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateSetupIntegrationsStep error', error);
        throw error;
    }
    return data;
};

/**
 * setup_mailing_listサブステップを更新
 */
export const updateSetupMailingListStep = async (
    client: SupabaseClient<Database>,
    { workspaceId, setupMailingListStep }: { 
        workspaceId: string, 
        setupMailingListStep: Database["public"]["Enums"]["setup_mailing_list"] 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            setup_mailing_list: setupMailingListStep,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateSetupMailingListStep error', error);
        throw error;
    }
    return data;
};

/**
 * setup_targetsサブステップを更新
 */
export const updateSetupTargetsStep = async (
    client: SupabaseClient<Database>,
    { workspaceId, setupTargetsStep }: { 
        workspaceId: string, 
        setupTargetsStep: Database["public"]["Enums"]["setup_targets"] 
    }
) => {
    const { data, error } = await client
        .from('onboarding_states')
        .update({ 
            setup_targets: setupTargetsStep,
            updated_at: new Date().toISOString()
        })
        .eq('workspace_id', workspaceId)
        .select()
        .single();
    
    if (error) {
        console.error('updateSetupTargetsStep error', error);
        throw error;
    }
    return data;
};
