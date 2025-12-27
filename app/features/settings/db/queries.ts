import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

export const getWorkspace = async (
  client: SupabaseClient<Database>,
  { userId, isDefaultWorkspace = true }: { userId: string, isDefaultWorkspace?: boolean },
) => {
  const { data, error } = await client
    .from('workspace')
    .select('*')
    .eq('owner_user_id', userId)
    .eq('is_default_workspace', isDefaultWorkspace);
  if (error) {
    console.log('getWorkspace error', error);
    throw error;
  }
  return data;
};

export const getWorkspaceOwner = async (
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) => {
  const { data, error } = await client
    .from('workspace_member')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .single();
  if (error) {
    console.log('getWorkspaceOwner error', error);
    throw error;
  }
  return data;
};

export const getUserEmail = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  try {
    // Use auth.admin.getUserById to access auth.users table
    // This requires admin client with service role key
    // Response structure: { data: { user }, error }
    const { data, error } = await (client as any).auth.admin.getUserById(userId);
    if (error) {
      console.log('getUserEmail error', error);
      return null;
    }
    return { email: data?.user?.email };
  } catch (error) {
    console.log('getUserEmail error', error);
    return null;
  }
};

export const getUserProfile = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('profile_id', userId)
    .single();
  if (error) {
    console.log('getUserProfile error', error);
    throw error;
  }
  return data;
};

export const getWorkspaceOnboardingState = async (
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) => {
  const { data, error } = await client
    .from('onboarding_states')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();
  if (error) {
    console.log('getWorkspaceOnboardingState error', error);
    throw error;
  }
  return data;
};

export const getLoginUserWorkspace = async (
  client: SupabaseClient<Database>,
  { userId , role}: { userId: string, role: string },
) => {
  const { data, error } = await client
    .from('workspace_member')
    .select('*')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin']);
  if (error) {
    console.log('getLoginUserWorkspace error', error);
    throw error;
  }
  return data;
};

/**
 * Retrieve all integrations for a specific workspace and type
 * 
 * This function fetches all integrations for a workspace and type,
 * including all integration details like name, credential_ref, and config_json.
 * The RLS policies ensure users can only access their own integrations.
 * 
 * @param client - Authenticated Supabase client instance
 * @param workspaceId - The ID of the workspace whose integrations to retrieve
 * @param type - The type of integration to retrieve
 * @returns An array of integrations for the specified workspace and type
 * @throws Will throw an error if the database query fails
 */
export const getIntegrations = async (
    client: SupabaseClient<Database>,
    { workspaceId, type }: 
    { workspaceId: string, type: string },
) => {
  const { data, error } = await client
    .from('integrations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('type', type as Database["public"]["Enums"]["integration_type"])
    .single();
  if (error) {
    console.log('getIntegrations error', error);
    throw error;
  }
  return data;
};

export const getIntegrationsInfo = async (
  client: SupabaseClient<Database>,
  { workspaceId }: 
  { workspaceId: string },
) => {
  const { data, error } = await client
    .from('v_integration_info')
    .select('*')
    .eq('workspace_id', workspaceId)
    .not('type', 'eq', 'slack_user')
    .order('created_at', { ascending: false });
  if (error) {
    console.log('getIntegrationsInfo error', error);
    throw error;
  }
  return data;
};

export const getTargets = async (
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) => {
  const { data, error } = await client
    .from('targets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) {
    console.log('getTargets error', error);
    throw error;
  }
  return data.map(target => ({
    targetId: target.target_id,
    category: target.category,
    displayName: target.display_name,
    isActive: target.is_active,
    isMemberMail: target.is_member_mail,
    scheduleCron: target.schedule_cron ?? undefined,
    lastSentAt: target.last_sent_at ?? undefined,
    mailingListId: target.mailing_list_id ?? undefined,
    timezone: target.timezone,
  }));
};


export const getTarget = async (
  client: SupabaseClient<Database>,
  { targetId }: { targetId: string },
) => {
  const { data, error } = await client
    .from('targets')
    .select('*')
    .eq('target_id', targetId)
    .single();
  if (error) {
    console.log('getTarget error', error);
    throw error;
  }
  return data;
};

export const getTargetSources = async (
  client: SupabaseClient<Database>,
  { workspaceId, targetId }: { workspaceId: string, targetId: string },
) => {
  const { data, error } = await client
    .from('target_sources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  if (error) {
    console.log('getTargetSources error', error);
    throw error;
  }
  return data.map(source => ({
    id: source.target_source_id,
    integrationId: source.integration_id,
    sourceType: source.source_type,
    sourceIdent: source.source_ident,
    filterJson: source.filter_json || {},
    priority: source.priority,
    isActive: source.is_active,
    isMemberMail: source.is_member_mail,
  }));
};

export const getMailingList = async (
  client: SupabaseClient<Database>,
  { workspaceId, mailingListId }: { workspaceId: string, mailingListId?: string },
) => {
  let query = client
    .from('mail_list')
    .select('*')
    .eq('workspace_id', workspaceId);
    
  if (mailingListId) {
    query = query.eq('mailing_list_id', mailingListId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.log('getMailingList error', error);
    throw error;
  }
  return data.map(mailList => ({
    mailingListId: mailList.mailing_list_id,
    workspaceId: mailList.workspace_id,
    name: mailList.name,
    description: mailList.description || undefined,
    createdAt: mailList.created_at,
    memberCount: 0,
  }));
};

export const getMailingListMemberCount = async (
  client: SupabaseClient<Database>,
  { mailingListId }: { mailingListId: string },
) => {
  const { count, error } = await client
    .from('mail_list_members')
    .select('*', { count: 'exact', head: true })
    .eq('mailing_list_id', mailingListId);
  
  if (error) {
    console.error('getMailingListMemberCount error', error);
    throw error;
  }
  return count ?? 0;
};

export const getMailingListMembers = async (
  client: SupabaseClient<Database>,
  { mailingListId }: { mailingListId: string },
) => {
  const { data, error } = await client
    .from('mail_list_members')
    .select('*')
    .eq('mailing_list_id', mailingListId)
    .order('created_at', { ascending: false });
  if (error) {
    console.log('getMailingListMembers error', error);
    throw error;
  }
  return data.map(member => ({
    mailingListId: member.mailing_list_id,
    email: member.email,
    displayName: member.display_name ?? undefined,
    metaJson: member.meta_json as Record<string, any>,
    createdAt: member.created_at,
  }));
};

export const getTargetLastSentAt = async (
  client: SupabaseClient<Database>,
  { workspaceId, targetId }: { workspaceId: string, targetId: string },
) => {
  const { data, error } = await client
    .from('newsletter_editions')
    .select('sent_at')
    .eq('workspace_id', workspaceId)
    .eq('target_id', targetId)
    .order('sent_at', { ascending: false })
    .limit(1);
  if (error) {
    console.log('getTargetLastSentAt error', error);
    throw error;
  }
  return data[0]?.sent_at ?? null;
};

/**
 * Get user's subscription plan type
 * 
 * @param client - Authenticated Supabase client instance
 * @param userId - The ID of the user whose subscription to retrieve
 * @returns The plan type of the user's active subscription, or 'free' as default
 */
export const getUserSubscriptionPlanType = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
): Promise<Database["public"]["Enums"]["plan_type"]> => {
  const { data, error } = await client
    .from('subscriptions')
    .select('plan_type')
    .eq('user_id', userId)
    .eq('status', 'active')
    .or('ends_at.is.null,ends_at.gt.now()')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    // If no subscription found, default to 'free'
    console.log('getUserSubscriptionPlanType error (defaulting to free):', error);
    return 'free';
  }
  
  return data?.plan_type || 'free';
};

/**
 * Get plan limits for a specific plan type
 * 
 * @param client - Authenticated Supabase client instance
 * @param planType - The plan type to get limits for
 * @returns The plan limits for the specified plan type, or null if not found
 */
export const getPlanLimits = async (
  client: SupabaseClient<Database>,
  { planType }: { planType: Database["public"]["Enums"]["plan_type"] },
) => {
  const { data, error } = await client
    .from('plan_limits')
    .select('*')
    .eq('plan_type', planType)
    .single();
  
  if (error) {
    console.log('getPlanLimits error:', error);
    // Return null if plan limits not found (plan might not have limits configured)
    return null;
  }
  
  return data;
};

/**
 * Get target source policies for a specific plan type
 * 
 * @param client - Authenticated Supabase client instance
 * @param planType - The plan type to get policies for
 * @returns Array of target source policies for the specified plan type
 */
export const getTargetSourcePolicy = async (
  client: SupabaseClient<Database>,
  { planType }: { planType: Database["public"]["Enums"]["plan_type"] },
) => {
  const { data, error } = await client
    .from('target_source_policy')
    .select('*')
    .eq('plan_type', planType);
  
  if (error) {
    console.log('getTargetSourcePolicy error:', error);
    // Return empty array if policies not found
    return [];
  }
  
  return data || [];
};