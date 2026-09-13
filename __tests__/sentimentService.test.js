import { detectMood, suggestHiveTitle } from '../services/sentimentService'
import { matchHiveToMood, matchHiveByTitle } from '../services/postService'

jest.mock('../lib/supabase', () => ({ supabase: {} }))

describe('sentiment-based Hive recommendations', () => {
  it('detects the strongest mood from the conversation text', () => {
    expect(detectMood('I feel anxious, overwhelmed, and worried today')).toBe('heavy')
    expect(detectMood('I am grateful and thankful for this morning')).toBe('grateful')
    expect(detectMood('The day feels peaceful and calm')).toBe('calm')
  })

  it('defaults to calm when no mood keywords are present', () => {
    expect(detectMood('I walked to the store and bought tea')).toBe('calm')
  })

  it('matches an existing Hive by sentiment without creating one', () => {
    const topics = [
      { id: 'h1', title: 'Weathering Hard Days' },
      { id: 'h2', title: 'Gratitude Circle' },
    ]

    expect(matchHiveToMood(topics, 'heavy')).toEqual(topics[0])
    expect(matchHiveToMood(topics, 'hopeful')).toBeNull()
  })

  it('matches an explicitly requested existing Hive by title', () => {
    const topics = [
      { id: 'h1', title: 'Quiet Moments' },
      { id: 'h2', title: 'New Beginnings' },
    ]

    expect(matchHiveByTitle(topics, 'quiet moments')).toEqual(topics[0])
    expect(matchHiveByTitle(topics, 'missing')).toBeNull()
  })

  it('keeps suggested names as labels rather than database records', () => {
    expect(suggestHiveTitle('hopeful')).toBe('New Beginnings')
    expect(suggestHiveTitle('heavy')).toBe('Weathering Hard Days')
  })
})
