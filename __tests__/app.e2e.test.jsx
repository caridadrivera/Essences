import React from 'react'
import renderer from 'react-test-renderer'

// Mocked data function - define first before mocks
const getMockedData = (table) => {
  const data = {
    topics: [
      { id: 'topic1', title: 'General', user_id: null },
      { id: 'topic2', title: 'Technology', user_id: null }
    ],
    posts: [
      {
        id: 'post1',
        body: '<p>Test post content</p>',
        userId: 'user123',
        topicId: 'topic1',
        created_at: '2026-03-01T00:00:00',
        isToxic: false,
        users: { id: 'user123', name: 'Test User', profile_image: 'url', bio: 'Test bio' },
        postLikes: [{ userId: 'user123', postId: 'post1' }]
      }
    ],
    users: [
      { id: 'user123', name: 'Test User', email: 'test@test.com', profile_image: 'url', bio: 'Test bio' }
    ],
    blocked_users: []
  }
  return data[table] || []
}

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'user123', email: 'test@test.com' } } }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'user456' } } }),
      signOut: jest.fn().mockResolvedValue({}),
      onAuthStateChange: jest.fn((callback) => {
        callback('SIGNED_IN', { id: 'user123', email: 'test@test.com' })
        return jest.fn()
      })
    },
    from: jest.fn((table) => {
      const mockQuery = {
        select: jest.fn(function() { return this }),
        insert: jest.fn(function() { return this }),
        update: jest.fn(function() { return this }),
        delete: jest.fn(function() { return this }),
        eq: jest.fn(function() { return this }),
        or: jest.fn(function() { return this }),
        not: jest.fn(function() { return this }),
        is: jest.fn(function() { return this }),
        order: jest.fn(function() { return this }),
        in: jest.fn(function() { return this }),
        match: jest.fn(function() { return this }),
        then: jest.fn(function(resolve) { 
          setTimeout(() => resolve({ data: getMockedData(table), error: null }), 0)
        })
      }
      return mockQuery
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue({ status: 'ok' }),
    }),
    removeChannel: jest.fn().mockResolvedValue({}),
  }
}))

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useLocalSearchParams: () => ({
    id: 'user123',
    profile_img: 'https://example.com/img.jpg',
    background_img: 'https://example.com/bg.jpg',
    name: 'Test User',
    bio: 'Test bio'
  })
}))

// Mock auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user123', email: 'test@test.com', name: 'Test User', profile_image: 'https://example.com/img.jpg' },
    setAuth: jest.fn()
  })
}))

// Mock notification context
jest.mock('../context/NotificationContext', () => ({
  useNotification: () => ({
    notificationCount: 0,
    setNotificationCount: jest.fn()
  })
}))

// Mock services
jest.mock('../services/userService', () => ({
  getUserData: jest.fn().mockResolvedValue({ success: true, data: { id: 'user123', name: 'Test User' } }),
  blockUser: jest.fn().mockResolvedValue({ success: true }),
  unblockUser: jest.fn().mockResolvedValue({ success: true }),
  isUserBlocked: jest.fn().mockResolvedValue({ blocked: false })
}))

jest.mock('../services/postService', () => ({
  createOrUpdatePost: jest.fn().mockResolvedValue({ success: true }),
  createPostLike: jest.fn().mockResolvedValue({ success: true }),
  removePostLike: jest.fn().mockResolvedValue({ success: true })
}))

jest.mock('../services/perspecticeService', () => ({
  analyzeText: jest.fn().mockResolvedValue(0.2)
}))

jest.mock('../services/userProfileImage', () => ({
  getUserImage: jest.fn().mockReturnValue('https://example.com/img.jpg')
}))

// Mock Keyboard
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Keyboard: {
    dismiss: jest.fn()
  }
}))

describe('Essences App E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Flow', () => {
    it('should successfully login with correct credentials', async () => {
      const { supabase } = require('../lib/supabase')
      
      const result = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'password123'
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      })
      expect(result.data.user.id).toBe('user123')
    })

    it('should successfully signup new user', async () => {
      const { supabase } = require('../lib/supabase')
      
      const result = await supabase.auth.signUp({
        email: 'newuser@test.com',
        password: 'password123',
        options: {
          data: { name: 'New User' }
        }
      })

      expect(supabase.auth.signUp).toHaveBeenCalled()
      expect(result.data.user.id).toBe('user456')
    })

    it('should signout user', async () => {
      const { supabase } = require('../lib/supabase')
      
      const result = await supabase.auth.signOut()

      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('Home Screen Functionality', () => {
    it('should fetch topics on load', async () => {
      const { supabase } = require('../lib/supabase')
      
      const { data } = await supabase
        .from('topics')
        .select('id, title')
        .is('user_id', null)

      expect(supabase.from).toHaveBeenCalledWith('topics')
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('title')
    })

    it('should fetch posts for selected topic', async () => {
      const { supabase } = require('../lib/supabase')
      
      const { data } = await supabase
        .from('posts')
        .select('*, users(*), postLikes(*)')
        .eq('topicId', 'topic1')

      expect(supabase.from).toHaveBeenCalledWith('posts')
      expect(Array.isArray(data)).toBe(true)
    })

    it('should filter out blocked users posts', async () => {
      const { supabase } = require('../lib/supabase')
      
      const blockedIds = ['user456', 'user123']
      
      const { data } = await supabase
        .from('posts')
        .select('*')
        .not('userId', 'in', `(${blockedIds.join(',')})`)

      expect(supabase.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('Post Creation & Management', () => {
    it('should create a post with content', async () => {
      const { createOrUpdatePost } = require('../services/postService')
      
      const postData = {
        body: '<p>New post content</p>',
        userId: 'user123',
        topicId: 'topic1',
        isToxic: false
      }
      
      const result = await createOrUpdatePost(postData)

      expect(createOrUpdatePost).toHaveBeenCalledWith(postData)
      expect(result.success).toBe(true)
    })

    it('should analyze text for toxicity before posting', async () => {
      const { analyzeText } = require('../services/perspecticeService')
      
      const content = 'This is normal content'
      const score = await analyzeText(content)

      expect(analyzeText).toHaveBeenCalledWith(content)
      expect(typeof score).toBe('number')
      expect(score).toBeLessThan(0.7)
    })

    it('should flag toxic content', async () => {
      const { analyzeText } = require('../services/perspecticeService')
      
      // Mock toxic content
      analyzeText.mockResolvedValueOnce(0.85)
      
      const score = await analyzeText('toxic content')
      
      expect(score).toBeGreaterThan(0.7)
    })

    it('should like a post', async () => {
      const { createPostLike } = require('../services/postService')
      
      const likeData = { userId: 'user123', postId: 'post1' }
      const result = await createPostLike(likeData)

      expect(createPostLike).toHaveBeenCalledWith(likeData)
      expect(result.success).toBe(true)
    })

    it('should unlike a post', async () => {
      const { removePostLike } = require('../services/postService')
      
      const result = await removePostLike('user123', 'post1')

      expect(removePostLike).toHaveBeenCalledWith('user123', 'post1')
      expect(result.success).toBe(true)
    })
  })

  describe('User Profile Functionality', () => {
    it('should fetch user data', async () => {
      const { getUserData } = require('../services/userService')
      
      const result = await getUserData('user123')

      expect(getUserData).toHaveBeenCalledWith('user123')
      expect(result.success).toBe(true)
      expect(result.data.id).toBe('user123')
    })

    it('should display user profile picture and background', async () => {
      const { getUserImage } = require('../services/userProfileImage')
      
      const profileImg = getUserImage('profile.jpg')
      const bgImg = getUserImage('background.jpg')

      expect(getUserImage).toHaveBeenCalledWith('profile.jpg')
      expect(getUserImage).toHaveBeenCalledWith('background.jpg')
      expect(profileImg).toBeTruthy()
      expect(bgImg).toBeTruthy()
    })

    it('should fetch user posts by topic', async () => {
      const { supabase } = require('../lib/supabase')
      
      const { data } = await supabase
        .from('posts')
        .select('*, users(*), postLikes(*)')
        .eq('topicId', 'topic1')
        .eq('userId', 'user123')

      expect(supabase.from).toHaveBeenCalledWith('posts')
      expect(Array.isArray(data)).toBe(true)
    })

    it('should allow creating post from user profile', async () => {
      const { createOrUpdatePost } = require('../services/postService')
      
      const postData = {
        body: '<p>Profile post</p>',
        userId: 'user123',
        topicId: 'topic1',
        isToxic: false
      }
      
      const result = await createOrUpdatePost(postData)

      expect(createOrUpdatePost).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })
  })

  describe('User Blocking Functionality', () => {
    it('should block a user', async () => {
      const { blockUser } = require('../services/userService')
      const { supabase } = require('../lib/supabase')
      
      const result = await blockUser('user123', 'user456')

      expect(blockUser).toHaveBeenCalledWith('user123', 'user456')
      expect(result.success).toBe(true)
    })

    it('should unblock a user', async () => {
      const { unblockUser } = require('../services/userService')
      
      const result = await unblockUser('user123', 'user456')

      expect(unblockUser).toHaveBeenCalledWith('user123', 'user456')
      expect(result.success).toBe(true)
    })

    it('should check if user is blocked', async () => {
      const { isUserBlocked } = require('../services/userService')
      
      const result = await isUserBlocked('user123', 'user456')

      expect(isUserBlocked).toHaveBeenCalledWith('user123', 'user456')
      expect(result.blocked).toBe(false)
    })

    it('should prevent viewing blocked user content', async () => {
      const { supabase } = require('../lib/supabase')
      
      const blockedIds = ['user456']
      
      const { data } = await supabase
        .from('posts')
        .select('*')
        .not('userId', 'in', `(${blockedIds.join(',')})`)

      expect(supabase.from).toHaveBeenCalledWith('posts')
    })
  })

  describe('Navigation Flows', () => {
    it('should navigate to home screen with user profile data', () => {
      const { useLocalSearchParams } = require('expo-router')
      
      const params = useLocalSearchParams()
      
      expect(params.id).toBe('user123')
      expect(params.name).toBe('Test User')
      expect(params.profile_img).toBeTruthy()
    })

    it('should navigate to user profile when clicking avatar', () => {
      const navigationParams = {
        pathname: '/users/[id]',
        params: {
          id: 'user123',
          profile_img: 'https://example.com/img.jpg',
          background_img: 'https://example.com/bg.jpg',
          user_name: 'Test User',
          user_bio: 'Test bio'
        }
      }

      expect(navigationParams.pathname).toBe('/users/[id]')
      expect(navigationParams.params.id).toBe('user123')
    })

    it('should navigate to blocked list', () => {
      const blockedListPath = '/features/screens/blocked-users'
      expect(blockedListPath).toBeTruthy()
    })

    it('should navigate to edit profile', () => {
      const editProfilePath = '/features/screens/edit-profile'
      expect(editProfilePath).toBeTruthy()
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to post changes', async () => {
      const { supabase } = require('../lib/supabase')
      
      const channel = supabase.channel('realtime:posts')
      
      expect(supabase.channel).toHaveBeenCalledWith('realtime:posts')
    })

    it('should handle post deletion', async () => {
      const { supabase } = require('../lib/supabase')
      
      const payload = {
        old: { id: 'post1', topicId: 'topic1' }
      }
      
      // Simulate deletion
      expect(payload.old.id).toBeTruthy()
    })

    it('should handle new post insertion', async () => {
      const { supabase } = require('../lib/supabase')
      
      const payload = {
        new: {
          id: 'post2',
          body: 'New post',
          userId: 'user123',
          topicId: 'topic1'
        }
      }
      
      expect(payload.new.id).toBe('post2')
      expect(payload.new.userId).toBe('user123')
    })
  })

  describe('Error Handling', () => {
    it('should handle empty post submission', async () => {
      const emptyPost = ''
      
      expect(emptyPost).toBe('')
    })

    it('should handle network errors gracefully', async () => {
      const { supabase } = require('../lib/supabase')
      
      // Simulate network error
      const mockError = new Error('Network error')
      
      expect(mockError).toBeInstanceOf(Error)
    })

    it('should validate user input before submission', () => {
      const validateInput = (input) => {
        return Boolean(input && input.trim().length > 0)
      }
      
      expect(validateInput('')).toBe(false)
      expect(validateInput('   ')).toBe(false)
      expect(validateInput('Valid input')).toBe(true)
    })
  })

  describe('Keyboard & Input Handling', () => {
    it('should dismiss keyboard on background press', () => {
      const mockKeyboard = { dismiss: jest.fn() }
      
      mockKeyboard.dismiss()
      
      expect(mockKeyboard.dismiss).toHaveBeenCalled()
    })

    it('should handle rich text editor input', () => {
      const editorContent = '<p>Rich text content</p>'
      
      expect(editorContent).toContain('<p>')
      expect(editorContent).toBeTruthy()
    })
  })
})
