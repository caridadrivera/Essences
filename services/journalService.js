import { supabase } from '../lib/supabase';

// Journal entries are private — never joined with `users` for public display,
// always scoped to the requesting user's own id.

export const fetchJournalEntries = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not fetch journal entries' };
  }
};

export const fetchTodayEntry = async (userId) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('userId', userId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: "Could not fetch today's entry" };
  }
};

export const createOrUpdateJournalEntry = async (entry) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(entry)
      .select('*')
      .single();

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: 'Could not save your entry' };
  }
};

export const deleteJournalEntry = async (entryId, userId) => {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .match({ id: entryId, userId });

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: 'Could not delete entry' };
  }
};
