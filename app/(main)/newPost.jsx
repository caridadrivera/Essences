import { 
  StyleSheet, Text, View, Modal, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ScrollView
} from 'react-native';
import React, { useState, useRef } from 'react';
import RichTextEditor from '../../components/RichTextEditor';
import { createOrUpdatePost } from '../../services/postService';
import { analyzeText } from '../../services/perspecticeService';

const NewPost = ({ isVisible, user, topicId, onClose }) => {
  const bodyRef = useRef("");
  const editorRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [toxicityScore, setToxicityScore] = useState(null);

  const onSubmit = async () => {
    if (!bodyRef.current) {
      Alert.alert("Post", "Your post is empty :(");
      return;
    }

    try {
      const score = await analyzeText(bodyRef.current);
      setToxicityScore(score);

      const data = {
        body: bodyRef.current,
        userId: user?.id,
        topicId: topicId,
        isToxic: score > 0.7
      };

      if (score > 0.7) {
        Alert.alert('Warning', 'The content is considered toxic. It may be taken down');
      }

      processPost(data);

    } catch (error) {
      Alert.alert('Error', 'Unable to analyze the content.');
    }
  };

  const processPost = async (data) => {
    setLoading(true);
    let response = await createOrUpdatePost(data);
    setLoading(false);

    if (response.success) {
      bodyRef.current = '';
      editorRef.current?.setContentHTML('');
      onClose();
    } else {
      Alert.alert('Post', response.msg);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <RichTextEditor 
                  editorRef={editorRef} 
                  onChange={body => (bodyRef.current = body)}
                />
                <View style={styles.media}>
                  <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
                    <Text style={styles.textStyle}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onSubmit}>
                    <Text style={styles.textStyle}>Post</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%" // Ensures modal doesn't take up the full screen
  },
  scrollContainer: {
    flexGrow: 1,
    width: "100%"
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

export default NewPost;
