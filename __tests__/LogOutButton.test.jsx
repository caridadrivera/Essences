import React from 'react'
import renderer from 'react-test-renderer'
import { Pressable } from 'react-native'
import LogOutButton from '../components/LogOutButton'

// mocks
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn().mockResolvedValue({}) }
  }
}))

const mockSetAuth = jest.fn()
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ setAuth: mockSetAuth })
}))

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  router: { replace: mockReplace }
}))

describe('LogOutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls supabase.signOut, clears auth and routes to login', async () => {
    const tree = renderer.create(<LogOutButton />)
    const pressable = tree.root.findByType(Pressable)

    // call onPress and wait
    await pressable.props.onPress()

    // assertions
    const { supabase } = require('../lib/supabase')
    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(mockSetAuth).toHaveBeenCalledWith(null)
    expect(mockReplace).toHaveBeenCalledWith('/features/auth/login')
  })
})
