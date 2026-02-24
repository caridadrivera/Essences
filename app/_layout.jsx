import { View, Text, LogBox } from 'react-native'
import React, { useEffect , useLayoutEffect, useState, useRef } from 'react'
import { Slot, useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
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

  const [authReady, setAuthReady] = useState(false)
  const authReadyRef = useRef(false)

  useEffect(()=>{

    const init = async () => {
      try{

        console.log('supabase.auth present:', !!supabase?.auth)
        const { data, error } = await supabase.auth.getSession();
        // eslint-disable-next-line no-console
        console.log('getSession result:', { data, error })
        const session = data?.session ?? null
        if(session){
          // eslint-disable-next-line no-console
          console.log('initial session found', session.user?.id)
          setAuth(session.user)
          updateUserData(session.user, session.user.email)
          // navigate to home after initial session is established
          setTimeout(()=> router.replace('/features/screens/home'), 0)
        } else {
          // eslint-disable-next-line no-console
          console.log('no initial session')
          setAuth(null)
          setTimeout(()=> router.replace('/features/auth/sign-up'), 0)
        }
      }catch(err){
        // fallback: listen for realtime auth changes
        // eslint-disable-next-line no-console
        console.warn('init auth failed', err)
      }finally{
        setAuthReady(true)
        authReadyRef.current = true
      }
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      // eslint-disable-next-line no-console
      console.log('onAuthStateChange event', event, 'authReady', authReadyRef.current, 'session:', !!session)
      // ignore events until initial session resolved to avoid race
      if(!authReadyRef.current) return
      if(session){
        setAuth(session?.user)
        updateUserData(session?.user, session?.user.email)
        setTimeout(()=> router.replace('/features/screens/home'), 0)
      } else {
        setAuth(null)
        setTimeout(()=> router.replace('/features/auth/sign-up'), 0)
      }
    })

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      } else if (typeof subscription === 'function') {
        subscription();
      }
    };
  }, [] )

  const updateUserData = async (user, email) =>{
    let response = await getUserData(user?.id)
    if(response.success) setUserData(response.data)
  }


  return (
    // don't render child routes until auth initialization completes
    !authReady ? (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <Text>Loading...</Text>
      </View>
    ) : (
      <Slot />
    )
  )

}

export default _layout