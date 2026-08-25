// Lightweight keyword-based mood detector for chat drafts.
// Mood tags match the feeling set already used by journalService (grateful/calm/heavy/hopeful).
const MOOD_KEYWORDS = {
  grateful: ['grateful', 'thankful', 'blessed', 'appreciate', 'appreciation'],
  hopeful: ['hope', 'hopeful', 'optimistic', 'excited', "can't wait", 'looking forward'],
  heavy: ['sad', 'heavy', 'tired', 'exhausted', 'anxious', 'worried', 'stressed', 'lonely', 'angry', 'frustrated', 'hurt', 'overwhelmed', 'scared'],
  calm: ['calm', 'peaceful', 'relaxed', 'content', 'at ease', 'steady'],
}

// Returns the mood whose keywords appear most in the text; defaults to 'calm'.
export const detectMood = (text) => {
  const lower = (text || '').toLowerCase()
  let best = { mood: 'calm', score: 0 }
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = keywords.reduce((count, kw) => count + (lower.includes(kw) ? 1 : 0), 0)
    if (score > best.score) best = { mood, score }
  }
  return best.mood
}
