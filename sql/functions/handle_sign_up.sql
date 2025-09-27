/**
 * Database Trigger Function: handle_sign_up
 * 
 * This function is triggered after a new user is inserted into the auth.users table.
 * It automatically creates:
 * 1. A profile record in the public.profiles table
 * 2. A personal workspace for the user
 * 3. A workspace member record with owner role
 * 
 * The function handles different authentication scenarios:
 * 1. Email/phone authentication: Uses provided name or defaults to 'Anonymous'
 * 2. OAuth providers (Google, GitHub, etc.): Uses profile data from the provider
 * 
 * Security considerations:
 * - Uses SECURITY DEFINER to run with the privileges of the function owner
 * - Sets an empty search path to prevent search path injection attacks
 * 
 * @returns TRIGGER - Returns the NEW record that triggered the function
 */
CREATE OR REPLACE FUNCTION handle_sign_up()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
    user_name TEXT;
    user_avatar_url TEXT;
    user_marketing_consent BOOLEAN;
    new_workspace_id UUID;
BEGIN
    -- Initialize variables
    user_name := 'Anonymous';
    user_avatar_url := NULL;
    user_marketing_consent := TRUE;
    
    -- Check if the user record has provider information in the metadata
    IF new.raw_app_meta_data IS NOT NULL AND new.raw_app_meta_data ? 'provider' THEN
        -- Handle email or phone authentication
        IF new.raw_app_meta_data ->> 'provider' = 'email' OR new.raw_app_meta_data ->> 'provider' = 'phone' THEN
            -- If user provided a name during registration, use it
            IF new.raw_user_meta_data ? 'name' THEN
                user_name := new.raw_user_meta_data ->> 'name';
            END IF;
            
            -- Check for marketing consent
            IF new.raw_user_meta_data ? 'marketing_consent' THEN
                user_marketing_consent := (new.raw_user_meta_data ->> 'marketing_consent')::boolean;
            END IF;
        ELSE
            -- Handle OAuth providers (Google, GitHub, etc.)
            -- Use the profile data provided by the OAuth provider
            IF new.raw_user_meta_data ? 'full_name' THEN
                user_name := new.raw_user_meta_data ->> 'full_name';
            END IF;
            
            IF new.raw_user_meta_data ? 'avatar_url' THEN
                user_avatar_url := new.raw_user_meta_data ->> 'avatar_url';
            END IF;
        END IF;
    END IF;
    
    -- Create profile record
    INSERT INTO public.profiles (profile_id, name, avatar_url, marketing_consent)
    VALUES (new.id, user_name, user_avatar_url, user_marketing_consent);
    
    -- Generate new workspace ID
    new_workspace_id := gen_random_uuid();
    
    -- Create personal workspace for the user
    INSERT INTO public.workspace (workspace_id, name, slug, kind, owner_user_id)
    VALUES (
        new_workspace_id,
        user_name || '''s Workspace',
        'personal-' || new.id,
        'personal',
        new.id
    );
    
    -- Add user as owner of the workspace
    INSERT INTO public.workspace_member (workspace_id, user_id, role)
    VALUES (new_workspace_id, new.id, 'owner');
    
    RETURN NEW; -- Return the user record that triggered this function
END;
$$;

/**
 * Database Trigger: handle_sign_up
 * 
 * This trigger executes the handle_sign_up function automatically
 * after a new user is inserted into the auth.users table.
 * 
 * The trigger runs once for each row inserted (FOR EACH ROW)
 * and only activates on INSERT operations, not on UPDATE or DELETE.
 */
CREATE TRIGGER handle_sign_up
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_sign_up();


