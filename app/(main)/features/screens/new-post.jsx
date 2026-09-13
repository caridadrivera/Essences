import {
  StyleSheet, Text, View, Modal, TouchableOpacity, TouchableWithoutFeedback,
  Keyboard, ActivityIndicator, Pressable
} from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import RichTextEditor from '../../../../components/RichTextEditor'
import { createOrUpdatePost } from '../../../../services/postService'
import { canPostContent } from '../../../../services/moderationService'
import { createOrUpdateJournalEntry } from '../../../../services/journalService'
import { analyzeEntry, fetchHivesForDisplay, sentimentToFeeling } from '../../../../services/sentimentAnalysis'
import PostDestinationPrompt from '../../../../components/PostDestinationPrompt'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { theme } from '../../../../constants/theme'

// phase: 'composing' → 'analyzing' → 'suggesting' → (done/closed)
const NewPost = ({ isVisible, user, topicId, initialBody, onClose }) => {

  const router = useRouter()
  const bodyRef = useRef(initialBody || "")
  const editorRef = useRef("")
  const [phase, setPhase] = useState('composing')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [allTopics, setAllTopics] = useState([])
  const [moderationData, setModerationData] = useState(null)

  useEffect(() => {
    if (isVisible && initialBody) {
      bodyRef.current = initialBody
      editorRef.current?.setContentHTML(initialBody)
    }
    if (!isVisible) {
      setPhase('composing')
      setAnalysisResult(null)
    }
  }, [isVisible])

  const onSubmit = async () => {
    if (!bodyRef.current) {
      Alert.alert("Post", "Your post is empty :(")
      return
    }

    try {
      const moderationCheck = await canPostContent(bodyRef.current);

      if (!moderationCheck.canPost) {
        Alert.alert('Content Policy', moderationCheck.message)
        return
      }

      setModerationData(moderationCheck)
      setPhase('analyzing')

      // Run analysis and topic fetch in parallel
      const [result, topics] = await Promise.all([
        analyzeEntry(bodyRef.current),
        fetchHivesForDisplay(),
      ])

      setAnalysisResult(result)
      setAllTopics(topics)
      setPhase('suggesting')
    } catch (error) {
      setPhase('composing')
      Alert.alert('Error', 'Unable to analyze the content.');
    }
  }

  const handlePostToHive = async (chosenTopicId) => {
    if (!chosenTopicId) {
      Alert.alert('Post', 'Choose a Hive before posting')
      return
    }

    const data = {
      body: bodyRef.current,
      userId: user?.id,
      topicId: chosenTopicId,
    }
    await processPost(data)
  }

  const handleKeepInJournal = async () => {
    const feeling = analysisResult ? sentimentToFeeling(analysisResult.sentiment) : 'calm'
    const entry = {
      userId: user?.id,
      body: bodyRef.current,
      feeling,
      created_at: new Date().toISOString(),
    }
    const response = await createOrUpdateJournalEntry(entry)
    if (response.success) {
      bodyRef.current = ''
      editorRef.current?.setContentHTML('')
      onClose()
      router.push('/features/screens/journal-today')
    } else {
      Alert.alert('Journal', response.msg)
    }
  }

  const processPost = async (data) => {
    const response = await createOrUpdatePost(data)
    if (response.success) {
      bodyRef.current = ''
      editorRef.current?.setContentHTML('');
      onClose();
    } else {
      Alert.alert('Post', response.msg)
    }
  }


  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContainer}
            enableOnAndroid={true}
            extraScrollHeight={100}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.modalView} onPress={(e) => e.stopPropagation()}>
              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>
                  {phase === 'suggesting' ? 'Choose Destination' : 'New Reflection'}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  disabled={phase === 'analyzing'}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* ── Composing phase: rich text editor ── */}
              {(phase === 'composing' || phase === 'analyzing') && (
                <>
                  <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnSecondary]}
                      onPress={onClose}
                      disabled={phase === 'analyzing'}
                    >
                      <Text style={styles.btnSecondaryText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={onSubmit}
                      disabled={phase === 'analyzing'}
                    >
                      {phase === 'analyzing' ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.btnPrimaryText}>Continue →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* ── Suggesting phase: destination prompt ── */}
              {phase === 'suggesting' && analysisResult && (
                <>
                  <PostDestinationPrompt
                    result={analysisResult}
                    allTopics={allTopics}
                    onPostToHive={handlePostToHive}
                    onKeepInJournal={handleKeepInJournal}
                  />
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSecondary, { marginTop: 14, alignSelf: 'center', width: '100%' }]}
                    onPress={() => setPhase('composing')}
                  >
                    <Text style={styles.btnSecondaryText}>← Edit reflection</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 23, 19, 0.45)',
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    width: '100%',
    backgroundColor: theme.colors.surfaceRaised,
    borderTopLeftRadius: theme.designRadius.lg,
    borderTopRightRadius: theme.designRadius.lg,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.inkPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceBase,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  closeBtnText: {
    color: theme.colors.inkSecondary,
    fontSize: 14,
    fontWeight: theme.fonts.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: theme.designRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.rust,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: theme.fonts.bold,
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surfaceBase,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  btnSecondaryText: {
    color: theme.colors.inkPrimary,
    fontWeight: theme.fonts.bold,
    fontSize: 15,
  },
});


export default NewPost