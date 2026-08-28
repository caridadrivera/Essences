import axios from 'axios';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = Constants.expoConfig.extra.SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig.extra.SUPABASE_ANON_KEY;

/**
 * Moderate content using OpenAI's Moderation API via Supabase Edge Function
 * @param {string} text - The content to moderate
 * @returns {Promise<Object>} Moderation result with flagged status, categories, and severity
 */
export const moderateContent = async (text) => {
  try {
    if (!text || text.trim().length === 0) {
      return {
        success: true,
        flagged: false,
        severity: 'low',
        message: 'Empty content',
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;

    const response = await axios.post(
      `${SUPABASE_URL}/functions/v1/moderate-content`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      }
    );

    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Content moderation error:', error);

    // Return permissive error handling - don't block user actions if moderation fails
    return {
      success: false,
      flagged: false,
      severity: 'low',
      error: error.message,
      message: 'Could not verify content - proceeding without moderation',
    };
  }
};

/**
 * Check if content is acceptable for posting
 * @param {string} text - The content to check
 * @param {Object} options - Moderation options
 * @returns {Promise<Object>} { canPost: boolean, message: string, severity: string }
 */
export const canPostContent = async (text, options = {}) => {
  const {
    allowHighSeverity = false,
    allowMediumSeverity = false,
    blockFlaggedContent = true,
  } = options;

  const result = await moderateContent(text);

  if (!result.success) {
    // Moderation service failed - allow posting
    return {
      canPost: true,
      severity: 'unknown',
      message: 'Content verification unavailable',
      requiresReview: true,
    };
  }

  if (blockFlaggedContent && result.flagged) {
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category, _]) => category);

    return {
      canPost: false,
      severity: result.severity,
      message: `Content violates policy: ${flaggedCategories.join(', ')}`,
      flaggedCategories,
      requiresReview: false,
    };
  }

  if (result.severity === 'high' && !allowHighSeverity) {
    return {
      canPost: false,
      severity: result.severity,
      message: 'Content severity too high - please revise',
      requiresReview: true,
    };
  }

  if (result.severity === 'medium' && !allowMediumSeverity) {
    return {
      canPost: true,
      severity: result.severity,
      message: 'Content flagged for review - may be hidden from feeds',
      requiresReview: true,
    };
  }

  return {
    canPost: true,
    severity: result.severity,
    message: 'Content approved',
    requiresReview: false,
  };
};

/**
 * Get formatted moderation report for flagged content
 * @param {Object} moderationResult - Result from moderateContent()
 * @returns {string} Formatted report
 */
export const getModerationReport = (moderationResult) => {
  if (!moderationResult.flagged) {
    return 'Content passed moderation checks';
  }

  const flaggedItems = Object.entries(moderationResult.categories)
    .filter(([_, flagged]) => flagged)
    .map(([category, _]) => {
      const score = moderationResult.category_scores[category];
      return `${category}: ${(score * 100).toFixed(1)}%`;
    })
    .join('\n');

  return `Content flagged for:\n${flaggedItems}`;
};
