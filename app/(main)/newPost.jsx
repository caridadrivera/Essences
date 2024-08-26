import { StyleSheet, Text, View , Modal, TouchableOpacity} from 'react-native'
import React from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Input from '../../components/Input'
import Icon from '../../assets/icons'

const NewPost = ({ isVisible, user, topicId, onClose }) => {
  return (
    <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}>
           <View style={styles.centeredView}>
            <View style={styles.modalView}>
               <Input
                    icon={<Icon name="userIcon" />}
                    placeholder='Tell us..'
                    value={user.name}
                    // onChangeText={value => setUser({ ...user, name: value })} 
                    />
              <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                   onPress={onClose}
                    >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
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
  }
});


export default NewPost