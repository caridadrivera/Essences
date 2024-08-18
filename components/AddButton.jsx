import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { router } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AddButton = ({size=24}) => {

    const { setAuth } = useAuth()
  return (

    <Pressable onPress={()=>{}} style={styles.buttonStyle}>
      <Icon name="plusIcon" strokeWidth={2.5} size={size} color={theme.colors.text} />
    </Pressable>
  )
}

export default AddButton

const styles = StyleSheet.create({
  buttonStyle: {

    marginBottom: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,0,0,0.07)',
  }
})