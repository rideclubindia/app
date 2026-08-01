-- Remove strict foreign key constraint from error_logs so we can log errors from unauthenticated users or those in the middle of signing up

ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_user_id_fkey;
