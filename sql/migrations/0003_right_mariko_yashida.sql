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

-- Add set_updated_at trigger to tables that have updated_at but were missing the trigger.
-- (profiles, payments: 0001; integrations, target_sources, targets, workspace: 0003)

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_onboarding_states_updated_at
BEFORE UPDATE ON public.onboarding_states
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_job_queue_updated_at
BEFORE UPDATE ON public.job_queue
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
