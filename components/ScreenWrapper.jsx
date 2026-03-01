import { View, Platform, KeyboardAvoidingView } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ScreenWrapper = ({children, bg}) => {
    const {top} = useSafeAreaInsets()
    const paddingTop = top > 0 ? top + 5 : 30

    // iOS requires KeyboardAvoidingView to shift content when keyboard appears.
    // keyboardVerticalOffset accounts for status bar / safe area.
    const keyboardVerticalOffset = Platform.OS === 'ios' ? paddingTop : 0

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: bg}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={{flex: 1, paddingTop}}>
        {children}
      </View>
    </KeyboardAvoidingView>
  )
}

export default ScreenWrapper