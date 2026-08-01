-- Global Audit Logging Triggers
-- Run this in your Supabase SQL Editor

-- 1. Modify the audit_logs table to allow any user (or system) as the actor
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='audit_logs' and column_name='admin_id') THEN
    ALTER TABLE public.audit_logs RENAME COLUMN admin_id TO actor_id;
  END IF;
END $$;

-- 2. Create the generic trigger function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_action TEXT;
  v_target_id TEXT;
  v_details JSONB;
BEGIN
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE_' || UPPER(TG_TABLE_NAME);
    v_target_id := NEW.id::text;
    v_details := jsonb_build_object('new', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE_' || UPPER(TG_TABLE_NAME);
    v_target_id := NEW.id::text;
    v_details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE_' || UPPER(TG_TABLE_NAME);
    v_target_id := OLD.id::text;
    v_details := jsonb_build_object('old', row_to_json(OLD));
  END IF;

  -- Insert into audit logs, running as SECURITY DEFINER to bypass RLS if needed
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (v_actor_id, v_action, TG_TABLE_NAME, v_target_id, v_details);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply the trigger to core tables
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['profiles', 'pins', 'rides', 'group_members', 'user_reports', 'cms_content'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()', t, t);
  END LOOP;
END $$;
