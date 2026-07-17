import { supabase } from '../lib/supabase';
import { canPostContent } from './moderationService';

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
    // Moderate comment content before creating
    if (comment.body) {
      const moderationCheck = await canPostContent(comment.body);
      
      if (!moderationCheck.canPost) {
        return {
          success: false,
          msg: moderationCheck.message,
          moderation: moderationCheck
        };
      }

      // Flag comment if it requires review
      if (moderationCheck.requiresReview) {
        comment.flaggedForReview = true;
        comment.reviewReason = moderationCheck.message;
      }
    }

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
