import { View, Text, LogBox } from 'react-native'
import React, { useEffect , useState} from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth, setUserData } from '../context/AuthContext'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import AppProviders from '../context/AppProviders'

LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer', 'Warning: MemoizedTNodeRenderer', 'Warning: TRenderEngineProvider'])
const _layout = () =>{
  return (
      <AppProviders>
        <MainLayout/>
      </AppProviders>
  )
}

const MainLayout = () => {

  const {setAuth, setUserData} = useAuth();
  const router = useRouter()

  useEffect(()=>{
    supabase.auth.onAuthStateChange((_event, session) => {
      if(session){
        setAuth(session?.user)
        updateUserData(session?.user, session?.user.email)
        router.push('/home')

      }else {
        setAuth(null)
        router.push('/welcome')
      }
    })
  }, [] )

  const updateUserData = async (user, email) =>{
    let response = await getUserData(user?.id)
    if(response.success) setUserData(response.data)
  }


  return (
    <Stack
      screenOptions={{headerShown: false}}/>
  )

}

export default _layout