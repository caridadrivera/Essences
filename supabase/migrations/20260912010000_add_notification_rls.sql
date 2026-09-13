ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  USING ("receiverId" = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  USING ("receiverId" = auth.uid())
  WITH CHECK ("receiverId" = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;