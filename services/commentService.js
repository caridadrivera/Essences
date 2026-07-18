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

export const deleteComment = async (commentId, userId, postAuthorId) => {
  try {
    // Allow deletion if user is the comment author OR the post author
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('userId')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return { success: false, msg: 'Comment not found' };
    }

    // Only allow if user is comment author or post author
    if (comment.userId !== userId && postAuthorId !== userId) {
      return { success: false, msg: 'You do not have permission to delete this comment' };
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: 'Could not delete comment' };
  }
};
