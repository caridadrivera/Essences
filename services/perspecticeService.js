import axios from 'axios';

const API_KEY = 'AIzaSyD4aBHXSN3Uhsj99oCn5sFDgNRt-PpWWLU';
const API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

/**
 * Analyze text using Perspective API.
 * @param {string} text - The text to analyze.
 * @returns {Promise<number>} - The toxicity score (0 to 1).
 */
export const analyzeText = async (text) => {
  const payload = {
    comment: { text },
    requestedAttributes: { TOXICITY: {} },
  };

  try {
    const response = await axios.post(`${API_URL}?key=${API_KEY}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
    return toxicityScore;
  } catch (error) {
    console.error('Error analyzing text with Perspective API:', error);
    throw error;
  }
};
