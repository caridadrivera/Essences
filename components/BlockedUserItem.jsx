import { StyleSheet, Text, View, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import React, { useState } from 'react';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

const BlockedUserItem = ({ item, router }) => {
  const [modalVisible, setModalVisible] = useState(false);


  useEffect(()=>{
  
  })


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  const createdAt = formatDate(item?.created_at)



  const handleUnblock = async () => {
    
    try {
      const { error } = await supabase
        .from('blocked_users') 
        .delete()
        .eq('blocked_user_id', item.blocked_user_id); 
      
      if (error) {
        Alert.alert('Error', 'Failed to unblock the user. Please try again.');
        console.error(error);
      } else {
        Alert.alert('Success', 'User unblocked successfully!');
        setModalVisible(false);
        router.push('home')
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <View>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View style={styles.nameTitle}>
            <Text style={styles.text}>
              {item.users?.name}
            </Text>
          </View>
          <Text style={[styles.text, { color: theme.colors.textLight }]}>
          Blocked on {createdAt}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Unblock {item.users?.name}?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleUnblock}
              >
                <Text style={styles.buttonText}>Yes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BlockedUserItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.darkLight,
    padding: 15,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
  },
  nameTitle: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: hp(1.6),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: wp(80),
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: theme.colors.textLight,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: 'bold',
  },
});
