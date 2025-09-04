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