-- Improved pop_mailer function with better error handling
CREATE OR REPLACE FUNCTION pop_mailer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET SEARCH_PATH = ''
AS $$
DECLARE
  result jsonb;
  message_record record;
BEGIN
  -- Get the message from PGMQ with proper error handling
  SELECT * INTO message_record FROM pgmq.pop('mailer') LIMIT 1;
  
  -- If no message found, return null
  IF message_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert the message to jsonb format
  -- The message column contains the actual JSON data
  result := message_record.message::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return null instead of failing
    RAISE WARNING 'Error in pop_mailer: %', SQLERRM;
    RETURN NULL;
END;
$$; 