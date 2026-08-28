import {
  StyleSheet, Text, View, Modal, TouchableOpacity, TouchableWithoutFeedback,
  Keyboard, ActivityIndicator
} from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import RichTextEditor from '../../../../components/RichTextEditor'
import { Alert } from 'react-native'
import { createOrUpdatePost } from '../../../../services/postService'
import { canPostContent } from '../../../../services/moderationService'
import { createOrUpdateJournalEntry } from '../../../../services/journalService'
import { analyzeEntry, fetchHivesForDisplay, sentimentToFeeling } from '../../../../services/sentimentAnalysis'
import PostDestinationPrompt from '../../../../components/PostDestinationPrompt'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// phase: 'composing' → 'analyzing' → 'suggesting' → (done/closed)
const NewPost = ({ isVisible, user, topicId, initialBody, onClose }) => {

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
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContainer}
      enableOnAndroid={true}
      extraScrollHeight={200}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isVisible}
          onRequestClose={onClose}>

          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {/* ── Composing phase: rich text editor ── */}
              {(phase === 'composing' || phase === 'analyzing') && (
                <>
                  <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                  <View style={styles.media}>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonClose]}
                      onPress={onClose}
                      disabled={phase === 'analyzing'}
                    >
                      <Text style={styles.textStyle}>Close</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.buttonClose]}
                      onPress={onSubmit}
                      disabled={phase === 'analyzing'}
                    >
                      {phase === 'analyzing'
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.textStyle}>Post</Text>
                      }
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
                    style={[styles.button, styles.buttonClose, { marginTop: 12, alignSelf: 'center' }]}
                    onPress={() => setPhase('composing')}
                  >
                    <Text style={styles.textStyle}>← Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

        </Modal>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>

  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  cardContentStyle: {
    backgroundColor: 'lightgrey',
    borderRadius: 10,
    padding: 10
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  media: {
    flexDirection: 'row',
    columnGap: 4,
    marginTop: 8
  }
});


export default NewPost