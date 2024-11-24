import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Welcome from './welcome'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const index = () => {
    const router = useRouter()

  return (
    <GestureHandlerRootView>
        <ScreenWrapper>
            <Welcome/>
       </ScreenWrapper >
    </GestureHandlerRootView>



  )
}

export default index