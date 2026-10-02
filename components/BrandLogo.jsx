import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { theme } from '../constants/theme'

const BrandLogo = () => (
  <View style={styles.container}>
    <Text accessibilityRole="image" accessibilityLabel="essences." style={styles.wordmark}>
      essences<Text style={styles.period}>.</Text>
    </Text>
  </View>
)

export default BrandLogo

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: theme.colors.inkPrimary,
    fontFamily: theme.fonts.display,
    fontSize: 46,
    lineHeight: 56,
    includeFontPadding: false,
  },
  period: {
    color: theme.colors.rust,
  },
})