-- Custom SQL migration file, put your code below! --
CREATE TRIGGER set_integrations_updated_at -- <- name of the trigger
BEFORE UPDATE ON integrations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_target_sources_updated_at 
BEFORE UPDATE ON target_sources
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_targets_updated_at
BEFORE UPDATE ON targets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_workspace_updated_at
BEFORE UPDATE ON workspace
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
