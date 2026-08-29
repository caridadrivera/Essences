import React, { useState } from 'react'
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import Icon from '../assets/icons'
import { theme } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const HeaderOverflowMenu = () => {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [visible, setVisible] = useState(false)

  const logOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setVisible(false)
      setAuth(null)
      router.replace('/features/auth/login')
    } catch (error) {
      Alert.alert('Logout failed', error.message || 'Unable to sign out')
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open account menu"
        onPress={() => setVisible(current => !current)}
        style={styles.trigger}
      >
        <Icon name="moreIcon" size={22} color={theme.colors.inkSecondary} />
      </Pressable>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setVisible(false)
                router.replace('/features/screens/home')
              }}
              style={styles.menuItem}
            >
              <Icon name="home" size={17} color={theme.colors.inkSecondary} />
              <Text style={styles.menuText}>Home</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={logOut} style={styles.menuItem}>
              <Icon name="logoutIcon" size={17} color={theme.colors.dangerWarm} />
              <Text style={[styles.menuText, styles.logoutText]}>Log out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

export default HeaderOverflowMenu

const styles = StyleSheet.create({
  container: { position: 'relative' },
  trigger: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: theme.designRadius.sm, backgroundColor: 'rgba(0,0,0,0.04)' },
  backdrop: { flex: 1 },
  menu: { position: 'absolute', top: 66, right: 18, minWidth: 132, backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.hairline, borderRadius: theme.designRadius.sm, paddingVertical: 4, shadowColor: '#241713', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  menuItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  menuText: { color: theme.colors.inkPrimary, fontSize: 14, fontWeight: theme.fonts.semibold },
  logoutText: { color: theme.colors.dangerWarm },
})
