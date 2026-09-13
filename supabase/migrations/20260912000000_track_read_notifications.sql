ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS "isRead" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS notifications_receiver_unread_idx
ON public.notifications ("receiverId", "isRead");