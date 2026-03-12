import { supabase } from '../lib/supabase';

// NOTE: Ensure the following table exists in your Supabase database:
//
// CREATE TABLE reposts (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   postId uuid REFERENCES posts(id) ON DELETE CASCADE,
//   userId uuid REFERENCES users(id) ON DELETE CASCADE,
//   created_at timestamptz DEFAULT now(),
//   UNIQUE (userId, postId)
// );

export const createRepost = async (repost) => {
  try {
    const { data, error } = await supabase
      .from('reposts')
      .insert(repost)
      .select()
      .single();

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not repost' };
  }
};

export const removeRepost = async (userId, postId) => {
  try {
    const { error } = await supabase
      .from('reposts')
      .delete()
      .match({ userId, postId });

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: 'Could not remove repost' };
  }
};
