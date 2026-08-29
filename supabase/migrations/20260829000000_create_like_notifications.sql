CREATE OR REPLACE FUNCTION public.create_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id uuid;
BEGIN
  SELECT "userId"
  INTO post_owner_id
  FROM public.posts
  WHERE id = NEW."postId";

  IF post_owner_id IS NOT NULL AND post_owner_id <> NEW."userId" THEN
    INSERT INTO public.notifications ("receiverId", "senderId", title, data, created_at)
    VALUES (
      post_owner_id,
      NEW."userId",
      'Someone liked your post',
      json_build_object('postId', NEW."postId")::text,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_like_create_notification ON public."postLikes";
CREATE TRIGGER on_post_like_create_notification
AFTER INSERT ON public."postLikes"
FOR EACH ROW EXECUTE FUNCTION public.create_like_notification();