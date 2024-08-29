import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor'
import { theme } from '../constants/theme'

const RichTextEditor = ({editorRef, onChange}) => {
  return (
    <View style={{minHeight: 285}}>
      <RichToolbar actions={[
        actions.setBold,
        actions.setItalic,
        actions.insertBulletsList,
        actions.insertOrderedList,
        actions.setStrikethrough,
        actions.setUnderline,
        actions.undo,
        actions.redo
      ]} 
      style={styles.richBar}
      flatContainerStyle={styles.listStyle}
      editor={editorRef}
      selectedIconTint={theme.colors.primaryDark}
      disabled={false}
      />   

      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contentStyle}
        placeholder={'Tell it'}
        onChange={onChange}
        />

    </View>
  )
}

export default RichTextEditor

const styles = StyleSheet.create({
  richBar: {
    borderTopRightRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    backgroundColor: theme.colors.gray
  },
  rich: {
    minHeight: 240,
    flex: 1,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    bordercolor: theme.colors.gray,
    padding: 5
  },
  contentStyle: {
    color: theme.colors.textDark,
    placeholderColor: 'gray',
  },
  flatStyle: {
    paddingHorizontal: 20,
    gap: 3
  }
})