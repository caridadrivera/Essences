import { StyleSheet, View } from 'react-native'
import React from 'react'
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor'
import { theme } from '../constants/theme'

const RichTextEditor = ({ editorRef, onChange, placeholder = 'Write your reflection…', containerStyle, minHeight = 285 }) => {
  return (
    <View style={[styles.container, { minHeight }, containerStyle]}>
      <RichToolbar
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.setStrikethrough,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          actions.undo,
          actions.redo,
        ]}
        style={styles.richBar}
        flatContainerStyle={styles.listStyle}
        editor={editorRef}
        iconTint={theme.colors.inkSecondary}
        selectedIconTint={theme.colors.rust}
        disabledIconTint={theme.colors.inkDisabled}
        selectedButtonStyle={styles.selectedBtn}
        disabled={false}
      />

      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={{
          backgroundColor: theme.colors.surfaceRaised,
          color: theme.colors.inkPrimary,
          placeholderColor: theme.colors.inkDisabled,
          contentCSSText: 'font-size: 16px; line-height: 24px; font-family: -apple-system, sans-serif; padding: 12px; color: #241713;',
        }}
        placeholder={placeholder}
        onChange={onChange}
      />
    </View>
  )
}

export default RichTextEditor

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: theme.designRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceRaised,
  },
  richBar: {
    backgroundColor: theme.colors.surfaceBase,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  selectedBtn: {
    backgroundColor: 'rgba(196, 106, 80, 0.12)',
    borderRadius: theme.designRadius.sm,
  },
  rich: {
    minHeight: 220,
    flex: 1,
    backgroundColor: theme.colors.surfaceRaised,
  },
  listStyle: {
    paddingHorizontal: 8,
    gap: 4,
  },
})