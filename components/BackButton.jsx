import { Pressable, StyleSheet } from 'react-native'
import React from 'react'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'

const BackButton = ({ router, fallbackRoute = '/', onPress, size = 20 }) => {
  return (
    <Pressable
      onPress={onPress || (() => router.canGoBack() ? router.back() : router.replace(fallbackRoute))}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Icon name="arrowLeft" strokeWidth={2.2} size={size} color={theme.colors.inkPrimary} />
    </Pressable>
  )
}

export default BackButton

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
})