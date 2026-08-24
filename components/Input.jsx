import { StyleSheet, Text, View, TextInput } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'

const Input = (props) => {
  return (
    <View style={[styles.container, props.containerStyle && props.containerStyle]}>
      {props.icon && props.icon}
      <TextInput 
        style={{flex: 1, color: theme.colors.inkPrimary}}
        placeholderTextColor={theme.colors.inkDisabled}
        ref={props.inputRef && props.inputRef}
        {...props}/>
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: hp(7.2),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.hairline,
        backgroundColor: theme.colors.surfaceRaised,
        borderRadius: theme.designRadius.md,
        borderCurve: 'continuous',
        paddingHorizontal: 18,
        gap: 12
    }
})