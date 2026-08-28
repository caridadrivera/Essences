import {
  StyleSheet, Text, View, TextInput, Pressable, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import React, { useState, useRef, useCallback } from 'react'
import ScreenWrapper from '../../../../components/ScreenWrapper'
import { theme } from '../../../../constants/theme'
import { hp, wp } from '../../../../helpers/common'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../../context/AuthContext'
import { Image } from 'expo-image'
import Avatar from '../../../../components/Avatar'
import Icon from '../../../../assets/icons'
import LogOutButton from '../../../../components/LogOutButton'
import { useNotification } from '../../../../context/NotificationContext'
import { getUserImage } from '../../../../services/userProfileImage'
import { getAIReply } from '../../../../services/promptChatService'
import { createOrUpdateJournalEntry } from '../../../../services/journalService'
import { canPostContent } from '../../../../services/moderationService'
import { fetchGlobalTopics, findOrCreateHiveForMood, matchHiveByTitle, createHive } from '../../../../services/postService'
import { detectMood } from '../../../../services/sentimentService'

const OPENING_PROMPT = 'What feels alive today?'


const Home = () => {
  const router = useRouter()
  const { user } = useAuth()
  const { notificationCount, setNotificationCount } = useNotification()
  const flatListRef = useRef(null)
  const [messages, setMessages] = useState([
    { id: '0', role: 'assistant', content: OPENING_PROMPT }
  ])
  const [inputText, setInputText] = useState('')
  const [aiThinking, setAiThinking] = useState(false)
  // 'chat' | 'decide' — decide appears once the AI offers the post/journal choice
  const [stage, setStage] = useState('chat')
  const [posting, setPosting] = useState(false)
  const [mood, setMood] = useState('calm')
  const [matchedHive, setMatchedHive] = useState(null)

  const iconImg = getUserImage('Essences-2.png?t=2024-09-14T02%3A13%3A17.961Z')

  // User can directly say they want to post/share or keep it private instead of waiting for the AI to offer.
  const SHARE_INTENT = /\b(post|share|publish)\b/i
  const PRIVATE_INTENT = /\b(private|journal)\b/i

  const goToDecideStage = async (draftSoFar, requestedHiveTitle = null) => {
    setStage('decide')
    const detectedMood = detectMood(draftSoFar)
    setMood(detectedMood)

    let hive = null
    if (requestedHiveTitle) {
      const topicsRes = await fetchGlobalTopics()
      const requestedHive = topicsRes.success ? matchHiveByTitle(topicsRes.data, requestedHiveTitle) : null
      hive = requestedHive || { title: requestedHiveTitle, isNew: true }
    } else {
      const hiveRes = await findOrCreateHiveForMood(detectedMood)
      hive = hiveRes.success ? { ...hiveRes.data, isNew: hiveRes.isNew } : null
    }
    setMatchedHive(hive)
    return hive
  }

  const sendMessage = async () => {
    const text = inputText.trim()
    if (!text || aiThinking) return

    const wantsToShare = SHARE_INTENT.test(text)
    const wantsPrivate = !wantsToShare && PRIVATE_INTENT.test(text)
    const requestedHiveMatch = text.match(/\b(?:to|in)\s+(?:the\s+)?(.+?)\s+hive\b/i)
    const requestedHiveTitle = wantsToShare ? requestedHiveMatch?.[1]?.trim() : null

    // Intent messages are just instructions to the app, not part of the draft being posted/journaled.
    const userMsg = { id: Date.now().toString(), role: 'user', content: text, isControl: wantsToShare || wantsPrivate }
    const next = [...messages, userMsg]
    setMessages(next)
    setInputText('')

    if (wantsToShare || wantsPrivate) {
      const draftSoFar = messages.filter(m => m.role === 'user' && !m.isControl).map(m => m.content).join('\n\n')
      const hive = await goToDecideStage(draftSoFar, requestedHiveTitle)
      const hiveName = hive?.title || 'Hive'

      const ackMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: wantsToShare
          ? hive?.isNew
            ? `Sure — this feels like it deserves its own space. I can start a new ${hiveName} Hive for it — want to share it there, or keep it private instead?`
            : `Sure — a post about this conversation would actually be fitting in the ${hiveName} Hive. Want to share it there, or keep it private instead?`
          : `Got it — want to keep this in your journal, or share it in the ${hiveName} Hive?`
      }
      setMessages(prev => [...prev, ackMsg])
      return
    }

    setAiThinking(true)

    const history = next.map(m => ({ role: m.role, content: m.content }))
    const res = await getAIReply(history)
    setAiThinking(false)

    const aiMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: res.success
        ? res.reply
        : "I'm having trouble connecting — try again in a moment."
    }
    setMessages(prev => [...prev, aiMsg])

    if (res.success) {
      const lower = res.reply.toLowerCase()
      if (lower.includes('share') && (lower.includes('hive') || lower.includes('others') || lower.includes('public') || lower.includes('yourself'))) {
        const draftSoFar = next.filter(m => m.role === 'user' && !m.isControl).map(m => m.content).join('\n\n')
        await goToDecideStage(draftSoFar)
      }
    }
  }

  // Combine all non-control user turns as the draft body
  const userDraft = messages.filter(m => m.role === 'user' && !m.isControl).map(m => m.content).join('\n\n')

  const handleShareToHive = async () => {
    if (!userDraft || posting) return
    setPosting(true)
    const mod = await canPostContent(userDraft)
    if (!mod.canPost) { setPosting(false); alert(mod.message); return }

    // The matched Hive may only be a proposed name so far — create it for real now that the user is committing.
    let hive = matchedHive
    if (hive?.isNew) {
      const created = await createHive(hive.title)
      if (created.success) hive = created.data
    }
    setPosting(false)

    router.push({
      pathname: '/features/screens/hives',
      params: { draftBody: userDraft, openComposer: '1', topicId: hive?.id, topicTitle: hive?.title }
    })
  }

  const handleKeepPrivate = async () => {
    if (!userDraft || posting) return
    setPosting(true)
    await createOrUpdateJournalEntry({ userId: user.id, body: userDraft, feeling: mood })
    setPosting(false)
    router.push('/features/screens/journal-today')
  }

  const resetChat = () => {
    setMessages([{ id: '0', role: 'assistant', content: OPENING_PROMPT }])
    setStage('chat')
    setInputText('')
    setMood('calm')
    setMatchedHive(null)
  }

  return (
    <ScreenWrapper bg={theme.colors.surfaceBase}>
      <View style={styles.header}>
        <Image source={iconImg} style={{ height: 80, width: '42%' }} />
        <View style={styles.icons}>
          <Pressable style={styles.avatarBtn} onPress={() => router.push({
            pathname: '/features/screens/user-profile',
            params: { user, id: user.id, profile_img: user.profile_image, background_img: user.background_image, name: user.name, bio: user.bio }
          })}>
            <Avatar uri={user?.profile_image} size={hp(4.3)} rounded={theme.designRadius.full} style={{ borderWidth: 2, borderColor: theme.colors.hairline }} />
          </Pressable>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setNotificationCount(0); router.push('/features/screens/notifications') }}>
            <Icon name="hexResonate" size={22} active={true} />
            {notificationCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/features/screens/hives')}>
            <Icon name="home" size={22} color={theme.colors.inkSecondary} />
          </TouchableOpacity>
          <LogOutButton />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'assistant' ? styles.aiBubble : styles.userBubble]}>
              <Text style={item.role === 'assistant' ? styles.aiText : styles.userText}>{item.content}</Text>
            </View>
          )}
          ListFooterComponent={aiThinking ? (
            <View style={[styles.bubble, styles.aiBubble]}>
              <ActivityIndicator size="small" color={theme.colors.inkSecondary} />
            </View>
          ) : null}
        />

        {stage === 'decide' && !aiThinking && (
          <View style={styles.decideRow}>
            <Pressable style={[styles.decideBtn, styles.decidePrimary]} onPress={handleShareToHive} disabled={posting}>
              <Text style={styles.decidePrimaryText}>Share to {matchedHive?.title || 'a Hive'} →</Text>
            </Pressable>
            <Pressable style={[styles.decideBtn, styles.decideSecondary]} onPress={handleKeepPrivate} disabled={posting}>
              <Text style={styles.decideSecondaryText}>Keep it private</Text>
            </Pressable>
            <Pressable onPress={resetChat}><Text style={styles.resetText}>Start over</Text></Pressable>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write something…"
            placeholderTextColor={theme.colors.inkDisabled}
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={sendMessage}
            editable={!aiThinking}
          />
          <Pressable style={[styles.sendBtn, (!inputText.trim() || aiThinking) && styles.sendBtnDisabled]} onPress={sendMessage} disabled={aiThinking || !inputText.trim()}>
            <Text style={styles.sendText}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginBottom: 8,
  },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarBtn: { marginHorizontal: 4 },
  iconBtn: {
    position: 'relative',
    padding: 6,
    borderRadius: theme.designRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 8, backgroundColor: theme.colors.dangerWarm,
  },
  badgeText: { color: '#fff', fontSize: hp(1.1), fontWeight: theme.fonts.bold },
  chatList: { paddingHorizontal: wp(4), paddingVertical: 12, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: theme.designRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.sage },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  aiText: { fontSize: hp(1.9), color: '#3E4530', lineHeight: hp(2.7) },
  userText: { fontSize: hp(1.9), color: theme.colors.inkPrimary, lineHeight: hp(2.7) },
  decideRow: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: wp(5),
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
  },
  decideBtn: { width: '100%', paddingVertical: 13, borderRadius: theme.designRadius.full, alignItems: 'center' },
  decidePrimary: { backgroundColor: theme.colors.rust },
  decidePrimaryText: { color: theme.colors.inkPrimary, fontWeight: theme.fonts.bold, fontSize: hp(1.8) },
  decideSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.inkSecondary },
  decideSecondaryText: { color: theme.colors.inkPrimary, fontWeight: theme.fonts.bold, fontSize: hp(1.8) },
  resetText: { fontSize: hp(1.5), color: theme.colors.inkSecondary, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: wp(4),
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceBase,
  },
  input: {
    flex: 1,
    minHeight: hp(5.5),
    maxHeight: hp(14),
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: theme.designRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: hp(1.9),
    color: theme.colors.inkPrimary,
  },
  sendBtn: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: theme.designRadius.full,
    backgroundColor: theme.colors.rust,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: hp(2.4), color: theme.colors.inkPrimary, fontWeight: theme.fonts.bold },
})

