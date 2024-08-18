import { View, Text } from 'react-native'
import React, { useEffect , useState} from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth, setUserData } from '../context/AuthContext'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'


const _layout = () =>{
  return (
      <AuthProvider>
        <MainLayout/>
      </AuthProvider>
  )
}

const MainLayout = () => {

  const {setAuth} = useAuth();
  const router = useRouter()

  useEffect(()=>{
    supabase.auth.onAuthStateChange((_event, session) => {
      if(session){
        setAuth(session?.user)
        updateUserData(session?.user, session?.user.email)
        router.replace('/home')

      }else {
        setAuth(null)
        router.replace('/welcome')
      }
    })
  }, [] )

  const updateUserData = async (user, email) =>{
    let response = await getUserData(user?.id)
    if(response.success) setUserData({...response.data, email})
  }

  return (
    <Stack
      screenOptions={{headerShown: false}}/>
  )
}

export default _layout