import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import { useAuth } from '../../../../context/AuthContext'
import { theme } from '../../../../constants/theme'
import { fetchJournalEntries } from '../../../../services/journalService'

const JournalToday = () => {
  const router = useRouter()
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const result = await fetchJournalEntries(user.id)
    setLoading(false)
    if (!result.success) {
      Alert.alert('Journal', result.msg)
      return
    }
    setEntries(result.data || [])
  }, [user?.id])

  useFocusEffect(useCallback(() => {
    loadEntries()
  }, [loadEntries]))

  useEffect(() => {
    if (!user?.id) router.replace('/features/screens/home')
  }, [user?.id])

  return (
    <ScreenWrapper bg={theme.colors.surfaceBase}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Private Journal</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>Only you can see these reflections.</Text>

        {loading ? (
          <Text style={styles.muted}>Loading your journal...</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.muted}>Your private journal is ready for your first reflection.</Text>
        ) : entries.map(entry => (
          <View key={entry.id} style={styles.entry}>
            <View style={styles.entryHeader}>
              <Text style={styles.feeling}>{entry.feeling || 'reflection'}</Text>
              <Text style={styles.date}>{new Date(entry.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.body}>{entry.body}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  )
}

export default JournalToday

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backButton: { paddingVertical: 8, paddingRight: 12 },
  backText: { color: theme.colors.inkSecondary, fontSize: 15 },
  headerSpacer: { width: 45 },
  title: { color: theme.colors.inkPrimary, fontFamily: theme.fonts.display, fontSize: 24 },
  subtitle: { color: theme.colors.inkSecondary, marginBottom: 20 },
  muted: { color: theme.colors.inkSecondary, marginTop: 28, textAlign: 'center' },
  entry: { backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.hairline, borderWidth: 1, borderRadius: theme.designRadius.md, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  feeling: { color: theme.colors.inkPrimary, fontWeight: '600', textTransform: 'capitalize' },
  date: { color: theme.colors.inkSecondary, fontSize: 12 },
  body: { color: theme.colors.inkPrimary, lineHeight: 22 },
})
