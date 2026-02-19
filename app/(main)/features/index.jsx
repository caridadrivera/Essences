import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../../../components/ScreenWrapper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import SignUp from './auth/signUp'

const index = () => {
    const router = useRouter()

  return (
    <GestureHandlerRootView>
        <ScreenWrapper>
            <SignUp/>
       </ScreenWrapper >
    </GestureHandlerRootView>
  )
}

export default index