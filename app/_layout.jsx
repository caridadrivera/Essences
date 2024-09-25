import { View, Text, LogBox } from 'react-native'
import React, { useEffect , useLayoutEffect} from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth, setUserData } from '../context/AuthContext'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import AppProviders from '../context/AppProviders'
import { Slot } from 'expo-router'

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

  useLayoutEffect(()=>{
    supabase.auth.onAuthStateChange((_event, session) => {
      if(session){
        setAuth(session?.user)
        updateUser(session?.user, session?.user.email)
        router.replace('/home')

      }else {
        setAuth(null)
        router.replace('/welcome')
      }
    })
  }, [] )

  const updateUser= async (user, email) =>{
    let response = await getUserData(user?.id)
    if(response.success) setUserData(response.data)
  }


  return (
  
      <Slot />
   
  )

}

export default _layout