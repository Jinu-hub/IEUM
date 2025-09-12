import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "database.types";

/**
 * Retrieve all bookmark categories for a specific user
 * 
 * This function fetches all bookmark categories for a user,
 * including all category details like name, level, and parent category.
 * The RLS policies ensure users can only access their own bookmark categories.
 * 
 * @param client - Authenticated Supabase client instance
 * @param userId - The ID of the user whose categories to retrieve
 * @param contentTypeId - The ID of the content type to filter categories by
 * @returns An array of bookmark categories for the specified user and content type
 * @throws Will throw an error if the database query fails
 */
/*
export const getBookmarkCategories = async (
    client: SupabaseClient<Database>,
    { userId }: 
    { userId: string },
) => {
  const { data: contentTypeData } = await client
    .from('content_type')
    .select('content_type_id')
    .eq('content_type_code', 'bookmark')
    .limit(1)
    .single();
  const contentTypeId = contentTypeData?.content_type_id ?? 1;

  const { data, error } = await client
    .from('category')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type_id', contentTypeId)
    .order('sort_order', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};
*/


export const getWorkspace = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {
  const { data, error } = await client
    .from('workspace')
    .select('*')
    .eq('owner_user_id', userId);
  if (error) {
    console.log('getWorkspace error', error);
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
    displayName: target.display_name,
    isActive: target.is_active,
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
    isActive: source.is_active
  }));
};

export const getMailingList = async (
  client: SupabaseClient<Database>,
  { workspaceId }: { workspaceId: string },
) => {
  const { data, error } = await client
    .from('mail_list')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  if (error) {
    console.log('getMailingList error', error);
    throw error;
  }
  return data;
};

/*
export const getBookmark = async (
  client: SupabaseClient<Database>,
  { userId, bookmarkId }: { userId: string, bookmarkId: number },
) => {
  const { data, error } = await client
    .from('bookmark_view')
    .select('*')
    .eq('user_id', userId)
    .eq('bookmark_id', bookmarkId);
  if (error) {
    throw error;
  }
  return data;
};
*/
/**
 * Retrieve all UI view tabs for a specific user
 * 
 * This function fetches all UI view tabs for a user,
 * including all UI view tab details like name, category, and content type.
 * The RLS policies ensure users can only access their own UI view tabs.
 * 
 * @param client - Authenticated Supabase client instance
 * @param userId - The ID of the user whose UI view tabs to retrieve
 * @returns An array of UI view tabs for the specified user
 * @throws Will throw an error if the database query fails
 */
/*
export const getUIViewTabs = async (
  client: SupabaseClient<Database>,
  { userId }: { userId: string },
) => {

  const { data: uiTypeData } = await client
    .from('ui_type')
    .select('ui_type_id')
    .eq('ui_type_code', 'tab')
    .limit(1)
    .single();

  const uiTypeId = uiTypeData?.ui_type_id ?? 3;

  const { data, error } = await client
    .from('ui_view')
    .select(
      `
      ui_view_id,
      user_id,
      ui_type_id,
      content_type_id,
      name,
      category_id
      `
    )
    .eq('user_id', userId)
    .eq('ui_type_id', uiTypeId)
    .eq('content_type_id', 1)
    .order('sort_order', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
}

export const isExistsCategoryName = async (
  client: SupabaseClient<Database>,
  { userId, name, parent_id }: 
  { userId: string, name: string, parent_id: number | null },
) => {
  let query = client
  .from('category')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('category_name', name);

  query = parent_id === null
    ? query.is('parent_category_id', null)
    : query.eq('parent_category_id', parent_id);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0 > 0 ? true : false;
};

export const getMaxCategorySortOrder = async (
  client: SupabaseClient<Database>,
  { userId, parent_id }: { userId: string; parent_id: number | null },
): Promise<number> => {
  const { data, error } = await client.rpc('get_max_category_sort_order', {
    p_user_id: userId,
    p_parent_id: parent_id as any,
  });
  if (error) throw error;
  return data ?? 0;
};


export const getChildCategoryIds = async (
  client: SupabaseClient<Database>,
  { parent_id }: { parent_id: number | null },
) => {
  const { data, error } = await client
    .rpc('get_all_child_categories', {
      p_parent_id: parent_id as any,
    });
  if (error) throw error;
  return data;
}

// 자주 사용하는 북마크
export const getTopBookmarks = async (
  client: SupabaseClient<Database>, 
  { userId, limit }: { userId: string, limit: number },
) => {
  const { data, error } = await client
      .from('content_view')
      .select('*')
      .eq('user_id', userId)
      .eq('content_type_id', 1)
      .gt('use_count', 0)
      .order('use_count', { ascending: false })
      .limit(limit);
  if (error) {
      throw error;
  }
  return data;
}

// 최근 추가한 북마크
export const getRecentBookmarks = async (
  client: SupabaseClient<Database>,
  { userId, limit }: { userId: string, limit: number },
) => {
  const { data, error } = await client
    .from('content_view')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type_id', 1)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return data;
}
*/