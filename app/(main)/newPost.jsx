import { StyleSheet, Text, View , Modal, TouchableOpacity} from 'react-native'
import React,{useState, useRef} from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Input from '../../components/Input'
import Icon from '../../assets/icons'
import { useRouter } from 'expo-router'
import RichTextEditor from '../../components/RichTextEditor'
import { theme } from '../../constants/theme'
import { Alert } from 'react-native'
import { supabase } from '../../lib/supabase'
import { createOrUpdatePost } from '../../services/postService'

const NewPost = ({ isVisible, user, topicId, onClose }) => {

  const bodyRef = useRef("")
  const editorRef = useRef("")
  const router = useRouter()
  const [loading, setLoading]  = useState(false)

  const onSubmit = async () =>{
    if(!bodyRef.current ){
      Alert.alert("Post", "Your post is empty :(")
      return
    }
    const data = {
      body: bodyRef.current,
      userId: user?.id,
      topicId: topicId,
    }

    setLoading(true)
    let response = await createOrUpdatePost(data)
    setLoading(false)

    if(response.success){
      bodyRef.current = ''
      editorRef.current?.setContentHTML('')
      onClose()
    }else {
      Alert.alert('Post', response.msg)
    }

  }


  return (
    <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}>
           <View style={styles.centeredView}>
            <View style={styles.modalView}>
               <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body}/>
              <View style={styles.media}>
                <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={onClose}
                      >
                  <Text style={styles.textStyle}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.buttonClose]}
                    onPress={onSubmit}
                      >
                  <Text style={styles.textStyle}>Post</Text>
                </TouchableOpacity>

              </View>
              
            </View>
          </View>
            
    </Modal>
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