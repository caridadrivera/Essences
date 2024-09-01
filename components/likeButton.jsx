import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { router } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const LikeButton = ({size=24}) => {

  return (

    <Pressable onPress={()=>{}} style={styles.buttonStyle}>
      <Icon name="hexagonIcon" strokeWidth={2.5} size={size} color={theme.colors.text} />
    </Pressable>
  )
}

export default LikeButton

const styles = StyleSheet.create({
  buttonStyle: {
    marginHorizontal: 10, 
    padding: 4,
    margin: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(0,0,0,0.07)',
  }
})