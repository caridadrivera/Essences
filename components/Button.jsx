import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Loading from './Loading'

const ButtonComponent = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => { },
  loading = false,
}) => {

  if (loading) {
    return (
      <View style={[styles.button, buttonStyle, { backgroundColor: 'white' }]}>
        <Loading />
      </View>
    )
  }
  return (
    <Pressable onPress={onPress} style={[styles.button, buttonStyle]}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  )
}

export default ButtonComponent




const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.rust,
    height: hp(6.6),
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.designRadius.full
  },
  text: {
    fontSize: hp(2.2),
    color: theme.colors.inkPrimary,
    fontWeight: theme.fonts.bold
  }
})