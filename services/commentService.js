import { supabase } from '../lib/supabase';

export const fetchComments = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (id, name, profile_image)
      `)
      .eq('postId', postId)
      .order('created_at', { ascending: true });

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch comments' };
  }
};

export const createComment = async (comment) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select(`
        *,
        users (id, name, profile_image)
      `)
      .single();

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not add comment' };
  }
};

export const deleteComment = async (commentId, userId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .match({ id: commentId, userId });

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: 'Could not delete comment' };
  }
};
