-- Seed global Hives for common reflective conversation themes.
INSERT INTO public.topics (title, user_id)
SELECT seed.title, NULL
FROM (VALUES
  ('Starting Over'),
  ('Relationships'),
  ('Family'),
  ('Friendship'),
  ('Love and Connection'),
  ('Grief and Loss'),
  ('Anxiety and Overthinking'),
  ('Self-Worth'),
  ('Healing'),
  ('Change'),
  ('Work and Purpose'),
  ('Creativity'),
  ('Rest and Recovery'),
  ('Belonging'),
  ('Spirituality'),
  ('Joy and Celebration'),
  ('Gratitude'),
  ('Hope and Possibility'),
  ('Quiet Moments'),
  ('Life Lessons')
) AS seed(title)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.topics existing
  WHERE existing.user_id IS NULL
    AND lower(existing.title) = lower(seed.title)
);