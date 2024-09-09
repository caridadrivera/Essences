import { View, Text, Button } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Welcome from './welcome'

const index = () => {
    const router = useRouter()

  return (
    
    <ScreenWrapper>
      <Welcome/>
   </ScreenWrapper >


  )
}

export default index