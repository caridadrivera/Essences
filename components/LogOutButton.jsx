import { Pressable, StyleSheet, Text, View, Alert } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { useRouter } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'


const LogOutButton = ({size=24}) => {

    const { setAuth } = useAuth()
    const router = useRouter()

    const logOut = async () => {
      try{
        console.log('logging out user...')
        const { error } = await supabase.auth.signOut()
        if (error) {
          Alert.alert('Logout failed', error.message || 'Unable to sign out')
          return
        }
        setAuth(null)
        router.replace('/features/auth/login')
      }catch(err){
        Alert.alert('Logout failed', err.message || 'Unexpected error')
      }
    }

  return (

    <Pressable onPress={logOut} style={styles.buttonStyle}>
      <Icon name="logoutIcon" strokeWidth={2.5} size={size} color={theme.colors.text} />
    </Pressable>
  )
}

export default LogOutButton

const styles = StyleSheet.create({
  buttonStyle: {
    marginHorizontal: 10, 
    padding: 4,
    margin: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,0,0,0.07)',
  }
})